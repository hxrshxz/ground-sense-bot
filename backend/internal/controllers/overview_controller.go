package controllers

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/google/uuid"
	"github.com/hxrshxz/ground-sense-bot/backend/internal/services"
	"github.com/sirupsen/logrus"
)

type OverviewController struct {
	ingresService *services.IngresService
	logger        *logrus.Logger
}

func NewOverviewController(ingresService *services.IngresService, logger *logrus.Logger) *OverviewController {
	return &OverviewController{
		ingresService: ingresService,
		logger:        logger,
	}
}

// BlockOverviewData represents the data returned for a block overview
type BlockOverviewData struct {
	BlockName        string  `json:"block_name"`
	DistrictName     string  `json:"district_name"`
	StateName        string  `json:"state_name"`
	Year             string  `json:"year"`
	Category         string  `json:"category"`
	Stage            float64 `json:"stage"`
	Rainfall         float64 `json:"rainfall"`
	TotalRecharge    float64 `json:"total_recharge"`
	TotalExtraction  float64 `json:"total_extraction"`
	TotalExtractable float64 `json:"total_extractable"`
	TotalDischarge   float64 `json:"total_discharge"`
	Availability     float64 `json:"availability"`
}

// DistrictOverviewData represents the data returned for a district overview
type DistrictOverviewData struct {
	DistrictName        string  `json:"district_name"`
	StateName           string  `json:"state_name"`
	Year                string  `json:"year"`
	TotalBlocks         int     `json:"total_blocks"`
	SafeBlocks          int     `json:"safe_blocks"`
	SemiCriticalBlocks  int     `json:"semi_critical_blocks"`
	CriticalBlocks      int     `json:"critical_blocks"`
	OverExploitedBlocks int     `json:"over_exploited_blocks"`
	AvgStage            float64 `json:"avg_stage"`
	TotalRainfall       float64 `json:"total_rainfall"`
	TotalRecharge       float64 `json:"total_recharge"`
	TotalExtraction     float64 `json:"total_extraction"`
}

// GetBlockOverview handles GET /api/blocks/{blockId}
func (c *OverviewController) GetBlockOverview(w http.ResponseWriter, r *http.Request) {
	// Enable CORS
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	// Extract block UUID from URL path
	pathParts := strings.Split(r.URL.Path, "/")
	if len(pathParts) < 4 {
		http.Error(w, "Invalid URL format", http.StatusBadRequest)
		return
	}
	blockUUIDStr := pathParts[3]

	blockUUID, err := uuid.Parse(blockUUIDStr)
	if err != nil {
		http.Error(w, "Invalid block UUID", http.StatusBadRequest)
		return
	}

	// Get latest year data (2024-2025 by default)
	year := r.URL.Query().Get("year")
	if year == "" {
		year = "2024-2025"
	}

	ctx := r.Context()

	// Get block details
	block, err := c.ingresService.GetBlockByUUID(ctx, blockUUID)
	if err != nil || block == nil {
		http.Error(w, "Block not found", http.StatusNotFound)
		return
	}

	// Get district details
	district, err := c.ingresService.GetDistrictByUUID(ctx, block.DistrictUUID)
	if err != nil || district == nil {
		http.Error(w, "District not found", http.StatusNotFound)
		return
	}

	// Get state details
	state, err := c.ingresService.GetStateByUUID(ctx, district.StateUUID)
	if err != nil || state == nil {
		http.Error(w, "State not found", http.StatusNotFound)
		return
	}

	// Get assessment data
	assessment, err := c.ingresService.GetAssessmentByBlockAndYear(ctx, blockUUID, year)
	if err != nil || assessment == nil {
		http.Error(w, "Assessment data not found for this year", http.StatusNotFound)
		return
	}

	// Build response
	response := BlockOverviewData{
		BlockName:        block.BlockName,
		DistrictName:     district.DistrictName,
		StateName:        state.StateName,
		Year:             year,
		Category:         assessment.Category,
		Stage:            assessment.Stage,
		Rainfall:         assessment.Rainfall,
		TotalRecharge:    assessment.TotalRecharge,
		TotalExtraction:  assessment.TotalExtraction,
		TotalExtractable: assessment.TotalExtractable,
		TotalDischarge:   assessment.TotalDischarge,
		Availability:     assessment.Availability,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// GetDistrictOverview handles GET /api/districts/{districtId}
func (c *OverviewController) GetDistrictOverview(w http.ResponseWriter, r *http.Request) {
	// Enable CORS
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	// Extract district UUID from URL path
	pathParts := strings.Split(r.URL.Path, "/")
	if len(pathParts) < 4 {
		http.Error(w, "Invalid URL format", http.StatusBadRequest)
		return
	}
	districtUUIDStr := pathParts[3]

	districtUUID, err := uuid.Parse(districtUUIDStr)
	if err != nil {
		http.Error(w, "Invalid district UUID", http.StatusBadRequest)
		return
	}

	// Get year from query params
	year := r.URL.Query().Get("year")
	if year == "" {
		year = "2024-2025"
	}

	ctx := r.Context()

	// Get district details
	district, err := c.ingresService.GetDistrictByUUID(ctx, districtUUID)
	if err != nil || district == nil {
		http.Error(w, "District not found", http.StatusNotFound)
		return
	}

	// Get state details
	state, err := c.ingresService.GetStateByUUID(ctx, district.StateUUID)
	if err != nil || state == nil {
		http.Error(w, "State not found", http.StatusNotFound)
		return
	}

	// Get aggregated data for all blocks in this district
	query := `
		SELECT 
			COUNT(DISTINCT a.block_uuid) as total_blocks,
			COUNT(CASE WHEN LOWER(a.category) = 'safe' THEN 1 END) as safe_blocks,
			COUNT(CASE WHEN LOWER(a.category) = 'semi critical' THEN 1 END) as semi_critical_blocks,
			COUNT(CASE WHEN LOWER(a.category) = 'critical' THEN 1 END) as critical_blocks,
			COUNT(CASE WHEN LOWER(a.category) = 'over exploited' THEN 1 END) as over_exploited_blocks,
			ROUND(AVG(CASE WHEN a.stage > 0 AND a.stage < 1000 THEN a.stage END)::numeric, 1) as avg_stage,
			SUM(a.rainfall) as total_rainfall,
			SUM(a.total_recharge) as total_recharge,
			SUM(a.total_extraction) as total_extraction
		FROM assessments_summary a
		JOIN blocks b ON a.block_uuid = b.block_uuid
		WHERE b.district_uuid = $1 AND a.year = $2
	`

	rows, err := c.ingresService.GetRepository().DB.QueryContext(ctx, query, districtUUID, year)
	if err != nil {
		c.logger.Errorf("Error querying district aggregates: %v", err)
		http.Error(w, "Error retrieving district data", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var response DistrictOverviewData
	response.DistrictName = district.DistrictName
	response.StateName = state.StateName
	response.Year = year

	if rows.Next() {
		err = rows.Scan(
			&response.TotalBlocks,
			&response.SafeBlocks,
			&response.SemiCriticalBlocks,
			&response.CriticalBlocks,
			&response.OverExploitedBlocks,
			&response.AvgStage,
			&response.TotalRainfall,
			&response.TotalRecharge,
			&response.TotalExtraction,
		)
		if err != nil {
			c.logger.Errorf("Error scanning district data: %v", err)
			http.Error(w, "Error processing district data", http.StatusInternalServerError)
			return
		}
	} else {
		http.Error(w, "No assessment data found for this district", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}
