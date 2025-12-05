package services

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"github.com/google/generative-ai-go/genai"
	"github.com/hxrshxz/ground-sense-bot/backend/internal/config"
	"google.golang.org/api/option"
)

type LLMService struct {
	client *genai.Client
	model  *genai.GenerativeModel
}

func NewLLMService(cfg *config.Config) (*LLMService, error) {
	if cfg.Gemini.APIKey == "" {
		return nil, fmt.Errorf("GEMINI_API_KEY is not set")
	}

	ctx := context.Background()
	client, err := genai.NewClient(ctx, option.WithAPIKey(cfg.Gemini.APIKey))
	if err != nil {
		return nil, err
	}

	model := client.GenerativeModel("gemini-pro")
	model.SetTemperature(0.2) // Low temperature for deterministic SQL

	return &LLMService{
		client: client,
		model:  model,
	}, nil
}

func (s *LLMService) GenerateSQL(userMessage string, schema string) (string, error) {
	ctx := context.Background()
	prompt := fmt.Sprintf(`
You are a PostgreSQL expert. Convert the user's question into a valid SQL query.
Schema:
%s

Rules:
1. Return ONLY the SQL query. No markdown, no explanations.
2. Use 'assessments_summary' for general data (rainfall, stage, category).
3. Use 'assessments_recharge_breakdown', 'assessments_extraction_breakdown', 'assessments_discharge_breakdown' for detailed breakdowns.
4. Join with 'blocks', 'districts', 'states' to filter by location names.
5. Use ILIKE for name matching.
6. If the user asks for a trend, select 'year' and the metric, ordered by year.
7. If the user asks for a comparison, select 'block_name' and the metric.
8. Default to the latest year '2024-2025' if no year is specified.

User Question: "%s"
SQL:`, schema, userMessage)

	resp, err := s.model.GenerateContent(ctx, genai.Text(prompt))
	if err != nil {
		return "", err
	}

	if len(resp.Candidates) == 0 || resp.Candidates[0].Content == nil {
		return "", fmt.Errorf("no response from LLM")
	}

	part := resp.Candidates[0].Content.Parts[0]
	text, ok := part.(genai.Text)
	if !ok {
		return "", fmt.Errorf("unexpected response format")
	}

	sql := string(text)
	sql = strings.TrimSpace(sql)
	sql = strings.TrimPrefix(sql, "```sql")
	sql = strings.TrimPrefix(sql, "```")
	sql = strings.TrimSuffix(sql, "```")
	return strings.TrimSpace(sql), nil
}

func (s *LLMService) GenerateVisualization(data interface{}, query string, userMessage string) (string, string, error) {
	ctx := context.Background()
	dataJSON, _ := json.Marshal(data)
	
	// Truncate data if too large to avoid token limits
	if len(dataJSON) > 10000 {
		dataJSON = dataJSON[:10000]
	}

	prompt := fmt.Sprintf(`
You are a Data Visualization expert.
User Question: "%s"
SQL Query: "%s"
Data: %s

Task:
1. Analyze the data and user intent.
2. Choose the best ECharts visualization (bar, line, pie, scatter, or just a table).
3. Return a JSON object with:
   - "type": "bar" | "line" | "pie" | "table"
   - "title": "Chart Title"
   - "explanation": "Brief insight about the data."
   - "echarts_option": { ... valid ECharts JSON option ... }

Rules:
- If the data is a single value or text, set "type" to "text" and "explanation" to the value.
- Return ONLY the JSON object. No markdown.
JSON:`, userMessage, query, string(dataJSON))

	resp, err := s.model.GenerateContent(ctx, genai.Text(prompt))
	if err != nil {
		return "", "", err
	}

	if len(resp.Candidates) == 0 || resp.Candidates[0].Content == nil {
		return "", "", fmt.Errorf("no response from LLM")
	}

	part := resp.Candidates[0].Content.Parts[0]
	text, ok := part.(genai.Text)
	if !ok {
		return "", "", fmt.Errorf("unexpected response format")
	}

	jsonStr := string(text)
	jsonStr = strings.TrimSpace(jsonStr)
	jsonStr = strings.TrimPrefix(jsonStr, "```json")
	jsonStr = strings.TrimPrefix(jsonStr, "```")
	jsonStr = strings.TrimSuffix(jsonStr, "```")
	
	return strings.TrimSpace(jsonStr), "", nil
}

func (s *LLMService) DetermineIntent(userMessage string) (string, error) {
	// Simple LLM call to classify intent if needed, or we can stick to the rule-based hybrid approach.
	// For now, let's keep it simple and rely on the SQL generation to implicitly handle intent.
	return "", nil
}
