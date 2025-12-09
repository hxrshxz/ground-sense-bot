package services

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"github.com/hxrshxz/ground-sense-bot/backend/internal/config"
	"github.com/hxrshxz/ground-sense-bot/backend/internal/database"
	"github.com/sirupsen/logrus"
)

// RAGService provides hybrid search capabilities (keyword + semantic)
type RAGService struct {
	db     *database.Service
	config *config.Config
	logger *logrus.Logger
	client *http.Client
}

// SearchResult represents a single search result
type SearchResult struct {
	AssessmentID       int                    `json:"assessment_id"`
	BlockUUID          string                 `json:"block_uuid"`
	BlockName          string                 `json:"block_name"`
	DistrictName       string                 `json:"district_name"`
	StateName          string                 `json:"state_name"`
	Year               string                 `json:"year"`
	Category           string                 `json:"category"`
	Stage              float64                `json:"stage"`
	Rainfall           float64                `json:"rainfall"`
	TotalRecharge      float64                `json:"total_recharge"`
	TotalExtraction    float64                `json:"total_extraction"`
	Availability       *float64               `json:"availability,omitempty"`
	TextRepresentation string                 `json:"text_representation"`
	Score              float64                `json:"score"`
	SearchType         string                 `json:"search_type"` // "keyword", "semantic", or "hybrid"
	RawData            map[string]interface{} `json:"raw_data,omitempty"`
}

// HybridSearchRequest represents a search query
type HybridSearchRequest struct {
	Query          string  `json:"query"`
	Limit          int     `json:"limit"`
	UseKeyword     bool    `json:"use_keyword"`
	UseSemantic    bool    `json:"use_semantic"`
	MinScore       float64 `json:"min_score"`
	FilterState    string  `json:"filter_state,omitempty"`
	FilterDistrict string  `json:"filter_district,omitempty"`
	FilterYear     string  `json:"filter_year,omitempty"`
	FilterCategory string  `json:"filter_category,omitempty"`
}

// HybridSearchResponse represents the search results
type HybridSearchResponse struct {
	Results      []SearchResult `json:"results"`
	TotalResults int            `json:"total_results"`
	Query        string         `json:"query"`
	SearchTypes  []string       `json:"search_types"`
}

// GeminiEmbeddingRequest represents the request to Gemini embeddings API
type GeminiEmbeddingRequest struct {
	Content  GeminiContent `json:"content"`
	TaskType string        `json:"taskType"`
}

type GeminiContent struct {
	Parts []GeminiPart `json:"parts"`
}

type GeminiPart struct {
	Text string `json:"text"`
}

// GeminiEmbeddingResponse represents the response from Gemini
type GeminiEmbeddingResponse struct {
	Embedding struct {
		Values []float64 `json:"values"`
	} `json:"embedding"`
}

// GeminiRerankerRequest for reranking API
type GeminiRerankerRequest struct {
	Model     string   `json:"model"`
	Query     string   `json:"query"`
	Documents []string `json:"documents"`
	TopN      int      `json:"topN,omitempty"`
}

// GeminiRerankerResponse from reranking API
type GeminiRerankerResponse struct {
	Rankings []struct {
		Index int     `json:"index"`
		Score float64 `json:"score"`
	} `json:"rankings"`
}

// NewRAGService creates a new RAG service
func NewRAGService(db *database.Service, cfg *config.Config, logger *logrus.Logger) *RAGService {
	return &RAGService{
		db:     db,
		config: cfg,
		logger: logger,
		client: &http.Client{},
	}
}

// HybridSearch performs hybrid search (keyword + semantic)
func (s *RAGService) HybridSearch(ctx context.Context, req HybridSearchRequest) (*HybridSearchResponse, error) {
	// Set defaults
	if req.Limit <= 0 {
		req.Limit = 10
	}
	if !req.UseKeyword && !req.UseSemantic {
		req.UseKeyword = true
		req.UseSemantic = true
	}

	var allResults []SearchResult
	searchTypes := []string{}

	// Perform keyword search
	if req.UseKeyword {
		keywordResults, err := s.keywordSearch(ctx, req)
		if err != nil {
			s.logger.Warnf("Keyword search failed: %v", err)
		} else {
			allResults = append(allResults, keywordResults...)
			searchTypes = append(searchTypes, "keyword")
		}
	}

	// Perform semantic search
	if req.UseSemantic {
		semanticResults, err := s.semanticSearch(ctx, req)
		if err != nil {
			s.logger.Warnf("Semantic search failed: %v", err)
		} else {
			allResults = append(allResults, semanticResults...)
			searchTypes = append(searchTypes, "semantic")
		}
	}

	// Deduplicate and sort results
	deduped := s.deduplicateResults(allResults, req.Limit*3) // Get more results for reranking

	// DISABLED: Apply Gemini reranking to save API quota
	// Reranking was consuming too many API calls and hitting quota limits
	// Results are already sorted by relevance from keyword/semantic search
	/*
		if len(deduped) > 0 {
			reranked, err := s.rerankResults(ctx, req.Query, deduped, req.Limit)
			if err != nil {
				s.logger.Warnf("Reranking failed, using original order: %v", err)
			} else {
				deduped = reranked
				searchTypes = append(searchTypes, "reranked")
			}
		}
	*/

	// Ensure we don't exceed the requested limit
	if len(deduped) > req.Limit {
		deduped = deduped[:req.Limit]
	}

	return &HybridSearchResponse{
		Results:      deduped,
		TotalResults: len(deduped),
		Query:        req.Query,
		SearchTypes:  searchTypes,
	}, nil
}

// keywordSearch performs full-text search using PostgreSQL
func (s *RAGService) keywordSearch(ctx context.Context, req HybridSearchRequest) ([]SearchResult, error) {
	// Build WHERE clause - search_vector now includes location names (from migration 002)
	whereClauses := []string{"a.search_vector @@ websearch_to_tsquery('english', $1)"}
	args := []interface{}{req.Query}
	argCount := 1

	if req.FilterState != "" {
		argCount++
		whereClauses = append(whereClauses, fmt.Sprintf("s.state_name ILIKE $%d", argCount))
		args = append(args, "%"+req.FilterState+"%")
	}
	if req.FilterDistrict != "" {
		argCount++
		whereClauses = append(whereClauses, fmt.Sprintf("d.district_name ILIKE $%d", argCount))
		args = append(args, "%"+req.FilterDistrict+"%")
	}
	if req.FilterYear != "" {
		argCount++
		whereClauses = append(whereClauses, fmt.Sprintf("a.year = $%d", argCount))
		args = append(args, req.FilterYear)
	}
	if req.FilterCategory != "" {
		argCount++
		whereClauses = append(whereClauses, fmt.Sprintf("a.category = $%d", argCount))
		args = append(args, req.FilterCategory)
	}

	query := fmt.Sprintf(`
		SELECT 
			a.assessment_id, a.block_uuid, a.year, a.category, a.stage,
			a.rainfall, a.total_recharge, a.total_extraction, a.availability,
			a.text_representation, a.raw,
			b.block_name, d.district_name, s.state_name,
			ts_rank_cd(a.search_vector, websearch_to_tsquery('english', $1)) as rank,
			-- Boost results where state/district name matches query
			CASE 
				WHEN LOWER(s.state_name) = LOWER($1) THEN 10.0
				WHEN LOWER(d.district_name) = LOWER($1) THEN 5.0
				WHEN LOWER(s.state_name) LIKE '%%' || LOWER($1) || '%%' THEN 3.0
				WHEN LOWER(d.district_name) LIKE '%%' || LOWER($1) || '%%' THEN 2.0
				ELSE 0.0
			END as location_boost
		FROM assessments_summary a
		JOIN blocks b ON a.block_uuid = b.block_uuid
		JOIN districts d ON b.district_uuid = d.district_uuid
		JOIN states s ON b.state_uuid = s.state_uuid
		WHERE %s
		ORDER BY (rank + location_boost) DESC
		LIMIT $%d
	`, strings.Join(whereClauses, " AND "), argCount+1)

	args = append(args, req.Limit)

	rows, err := s.db.DB.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("keyword search query failed: %w", err)
	}
	defer rows.Close()

	var results []SearchResult
	for rows.Next() {
		var result SearchResult
		var rawJSON []byte
		var locationBoost float64

		err := rows.Scan(
			&result.AssessmentID,
			&result.BlockUUID,
			&result.Year,
			&result.Category,
			&result.Stage,
			&result.Rainfall,
			&result.TotalRecharge,
			&result.TotalExtraction,
			&result.Availability,
			&result.TextRepresentation,
			&rawJSON,
			&result.BlockName,
			&result.DistrictName,
			&result.StateName,
			&result.Score,
			&locationBoost,
		)
		if err != nil {
			s.logger.Warnf("Error scanning keyword result: %v", err)
			continue
		}

		// Add location boost to score
		result.Score += locationBoost

		// Parse raw JSON
		if len(rawJSON) > 0 {
			var rawData map[string]interface{}
			if err := json.Unmarshal(rawJSON, &rawData); err == nil {
				result.RawData = rawData
			}
		}

		result.SearchType = "keyword"
		results = append(results, result)
	}

	return results, nil
}

// semanticSearch performs vector similarity search
func (s *RAGService) semanticSearch(ctx context.Context, req HybridSearchRequest) ([]SearchResult, error) {
	// Generate embedding for the query
	embedding, err := s.generateEmbedding(req.Query)
	if err != nil {
		return nil, fmt.Errorf("failed to generate embedding: %w", err)
	}

	// Build WHERE clause
	whereClauses := []string{"a.embedding IS NOT NULL"}
	args := []interface{}{embedding}
	argCount := 1

	if req.FilterState != "" {
		argCount++
		whereClauses = append(whereClauses, fmt.Sprintf("s.state_name ILIKE $%d", argCount))
		args = append(args, "%"+req.FilterState+"%")
	}
	if req.FilterDistrict != "" {
		argCount++
		whereClauses = append(whereClauses, fmt.Sprintf("d.district_name ILIKE $%d", argCount))
		args = append(args, "%"+req.FilterDistrict+"%")
	}
	if req.FilterYear != "" {
		argCount++
		whereClauses = append(whereClauses, fmt.Sprintf("a.year = $%d", argCount))
		args = append(args, req.FilterYear)
	}
	if req.FilterCategory != "" {
		argCount++
		whereClauses = append(whereClauses, fmt.Sprintf("a.category = $%d", argCount))
		args = append(args, req.FilterCategory)
	}

	// Query using cosine similarity
	query := fmt.Sprintf(`
		SELECT 
			a.assessment_id, a.block_uuid, a.year, a.category, a.stage,
			a.rainfall, a.total_recharge, a.total_extraction, a.availability,
			a.text_representation, a.raw,
			b.block_name, d.district_name, s.state_name,
			1 - (a.embedding <=> $1::vector) as similarity
		FROM assessments_summary a
		JOIN blocks b ON a.block_uuid = b.block_uuid
		JOIN districts d ON b.district_uuid = d.district_uuid
		JOIN states s ON b.state_uuid = s.state_uuid
		WHERE %s
		ORDER BY a.embedding <=> $1::vector
		LIMIT $%d
	`, strings.Join(whereClauses, " AND "), argCount+1)

	args = append(args, req.Limit)

	rows, err := s.db.DB.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("semantic search query failed: %w", err)
	}
	defer rows.Close()

	var results []SearchResult
	for rows.Next() {
		var result SearchResult
		var rawJSON []byte

		err := rows.Scan(
			&result.AssessmentID,
			&result.BlockUUID,
			&result.Year,
			&result.Category,
			&result.Stage,
			&result.Rainfall,
			&result.TotalRecharge,
			&result.TotalExtraction,
			&result.Availability,
			&result.TextRepresentation,
			&rawJSON,
			&result.BlockName,
			&result.DistrictName,
			&result.StateName,
			&result.Score,
		)
		if err != nil {
			s.logger.Warnf("Error scanning semantic result: %v", err)
			continue
		}

		// Parse raw JSON
		if len(rawJSON) > 0 {
			var rawData map[string]interface{}
			if err := json.Unmarshal(rawJSON, &rawData); err == nil {
				result.RawData = rawData
			}
		}

		result.SearchType = "semantic"
		results = append(results, result)
	}

	return results, nil
}

// generateEmbedding generates an embedding for a text
// NOTE: Semantic search is disabled - requires embedding model (Gemini was removed)
func (s *RAGService) generateEmbedding(text string) (string, error) {
	// Gemini API was removed - semantic search is now disabled
	// To re-enable, integrate a local embedding model (e.g., sentence-transformers via Ollama)
	return "", fmt.Errorf("semantic search disabled: no embedding model configured")
}

// deduplicateResults removes duplicate results and sorts by score
func (s *RAGService) deduplicateResults(results []SearchResult, limit int) []SearchResult {
	seen := make(map[int]bool)
	var deduped []SearchResult

	// Sort by score descending
	for i := 0; i < len(results); i++ {
		for j := i + 1; j < len(results); j++ {
			if results[i].Score < results[j].Score {
				results[i], results[j] = results[j], results[i]
			}
		}
	}

	for _, result := range results {
		if !seen[result.AssessmentID] {
			seen[result.AssessmentID] = true
			deduped = append(deduped, result)
			if len(deduped) >= limit {
				break
			}
		}
	}

	return deduped
}

// GetAssessmentByID retrieves a specific assessment by ID
func (s *RAGService) GetAssessmentByID(ctx context.Context, assessmentID int) (*SearchResult, error) {
	query := `
		SELECT 
			a.assessment_id, a.block_uuid, a.year, a.category, a.stage,
			a.rainfall, a.total_recharge, a.total_extraction, a.availability,
			a.text_representation, a.raw,
			b.block_name, d.district_name, s.state_name
		FROM assessments_summary a
		JOIN blocks b ON a.block_uuid = b.block_uuid
		JOIN districts d ON b.district_uuid = d.district_uuid
		JOIN states s ON b.state_uuid = s.state_uuid
		WHERE a.assessment_id = $1
	`

	var result SearchResult
	var rawJSON []byte

	err := s.db.DB.QueryRowContext(ctx, query, assessmentID).Scan(
		&result.AssessmentID,
		&result.BlockUUID,
		&result.Year,
		&result.Category,
		&result.Stage,
		&result.Rainfall,
		&result.TotalRecharge,
		&result.TotalExtraction,
		&result.Availability,
		&result.TextRepresentation,
		&rawJSON,
		&result.BlockName,
		&result.DistrictName,
		&result.StateName,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("assessment not found")
	}
	if err != nil {
		return nil, err
	}

	// Parse raw JSON
	if len(rawJSON) > 0 {
		var rawData map[string]interface{}
		if err := json.Unmarshal(rawJSON, &rawData); err == nil {
			result.RawData = rawData
		}
	}

	return &result, nil
}

// rerankResults uses Gemini's reranking API to reorder search results by relevance
// NOTE: Disabled since Gemini was removed
func (s *RAGService) rerankResults(ctx context.Context, query string, results []SearchResult, topN int) ([]SearchResult, error) {
	// Gemini API was removed - reranking is now disabled
	// Results are already sorted by relevance from keyword/semantic search
	return nil, fmt.Errorf("reranking disabled: Gemini API was removed")
}
