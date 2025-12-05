package repositories

import (
	"context"
	"database/sql"

	"github.com/google/uuid"
	"github.com/hxrshxz/ground-sense-bot/backend/internal/models"
)

type IngresRepository struct {
	DB *sql.DB
}

func NewIngresRepository(db *sql.DB) *IngresRepository {
	return &IngresRepository{DB: db}
}

func (r *IngresRepository) GetAllStates(ctx context.Context) ([]models.State, error) {
	query := `SELECT state_uuid, state_name FROM states ORDER BY state_name`
	rows, err := r.DB.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var states []models.State
	for rows.Next() {
		var s models.State
		if err := rows.Scan(&s.StateUUID, &s.StateName); err != nil {
			return nil, err
		}
		states = append(states, s)
	}
	return states, nil
}

func (r *IngresRepository) GetDistrictsByState(ctx context.Context, stateUUID uuid.UUID) ([]models.District, error) {
	query := `SELECT district_uuid, district_name, state_uuid FROM districts WHERE state_uuid = $1 ORDER BY district_name`
	rows, err := r.DB.QueryContext(ctx, query, stateUUID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var districts []models.District
	for rows.Next() {
		var d models.District
		if err := rows.Scan(&d.DistrictUUID, &d.DistrictName, &d.StateUUID); err != nil {
			return nil, err
		}
		districts = append(districts, d)
	}
	return districts, nil
}

func (r *IngresRepository) GetBlocksByDistrict(ctx context.Context, districtUUID uuid.UUID) ([]models.Block, error) {
	query := `SELECT block_uuid, block_name, district_uuid, state_uuid, geometry FROM blocks WHERE district_uuid = $1 ORDER BY block_name`
	rows, err := r.DB.QueryContext(ctx, query, districtUUID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var blocks []models.Block
	for rows.Next() {
		var b models.Block
		var geom sql.NullString // Handle NULL geometry
		if err := rows.Scan(&b.BlockUUID, &b.BlockName, &b.DistrictUUID, &b.StateUUID, &geom); err != nil {
			return nil, err
		}
		if geom.Valid {
			b.GeomGeoJSON = []byte(geom.String)
		}
		blocks = append(blocks, b)
	}
	return blocks, nil
}

func (r *IngresRepository) GetAssessmentSummary(ctx context.Context, blockUUID uuid.UUID, year string) (*models.AssessmentSummary, error) {
	query := `
		SELECT assessment_id, block_uuid, year, rainfall, total_recharge, total_discharge,
		       total_extractable, total_extraction, category, stage, availability, raw, created_at
		FROM assessments_summary
		WHERE block_uuid = $1 AND year = $2
	`
	var a models.AssessmentSummary
	var raw []byte
	var rainfall, recharge, discharge, extractable, extraction, stage, availability sql.NullFloat64

	err := r.DB.QueryRowContext(ctx, query, blockUUID, year).Scan(
		&a.AssessmentID, &a.BlockUUID, &a.Year, &rainfall, &recharge, &discharge,
		&extractable, &extraction, &a.Category, &stage, &availability, &raw, &a.CreatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	a.Rainfall = rainfall.Float64
	a.TotalRecharge = recharge.Float64
	a.TotalDischarge = discharge.Float64
	a.TotalExtractable = extractable.Float64
	a.TotalExtraction = extraction.Float64
	a.Stage = stage.Float64
	a.Availability = availability.Float64
	a.Raw = raw
	return &a, nil
}

func (r *IngresRepository) GetRechargeBreakdown(ctx context.Context, assessmentID int) ([]models.RechargeBreakdown, error) {
	query := `SELECT id, assessment_id, source, command, non_command, total FROM assessments_recharge_breakdown WHERE assessment_id = $1`
	rows, err := r.DB.QueryContext(ctx, query, assessmentID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []models.RechargeBreakdown
	for rows.Next() {
		var i models.RechargeBreakdown
		if err := rows.Scan(&i.ID, &i.AssessmentID, &i.Source, &i.Command, &i.NonCommand, &i.Total); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	return items, nil
}

func (r *IngresRepository) GetDischargeBreakdown(ctx context.Context, assessmentID int) ([]models.DischargeBreakdown, error) {
	query := `SELECT id, assessment_id, source, command, non_command, total FROM assessments_discharge_breakdown WHERE assessment_id = $1`
	rows, err := r.DB.QueryContext(ctx, query, assessmentID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []models.DischargeBreakdown
	for rows.Next() {
		var i models.DischargeBreakdown
		if err := rows.Scan(&i.ID, &i.AssessmentID, &i.Source, &i.Command, &i.NonCommand, &i.Total); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	return items, nil
}

func (r *IngresRepository) GetExtractionBreakdown(ctx context.Context, assessmentID int) ([]models.ExtractionBreakdown, error) {
	query := `SELECT id, assessment_id, source, command, non_command, total FROM assessments_extraction_breakdown WHERE assessment_id = $1`
	rows, err := r.DB.QueryContext(ctx, query, assessmentID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []models.ExtractionBreakdown
	for rows.Next() {
		var i models.ExtractionBreakdown
		if err := rows.Scan(&i.ID, &i.AssessmentID, &i.Source, &i.Command, &i.NonCommand, &i.Total); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	return items, nil
}

func (r *IngresRepository) SearchBlocks(ctx context.Context, queryStr string) ([]models.Block, error) {
	query := `
		SELECT block_uuid, block_name, district_uuid, state_uuid 
		FROM blocks 
		WHERE block_name ILIKE $1 
		LIMIT 10
	`
	rows, err := r.DB.QueryContext(ctx, query, "%"+queryStr+"%")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var blocks []models.Block
	for rows.Next() {
		var b models.Block
		if err := rows.Scan(&b.BlockUUID, &b.BlockName, &b.DistrictUUID, &b.StateUUID); err != nil {
			return nil, err
		}
		blocks = append(blocks, b)
	}
	return blocks, nil
}

// New methods for Chatbot

func (r *IngresRepository) GetAssessmentTrends(ctx context.Context, blockUUID uuid.UUID, startYear, endYear string) ([]models.AssessmentSummary, error) {
	query := `
		SELECT assessment_id, block_uuid, year, rainfall, total_recharge, total_discharge,
		       total_extractable, total_extraction, category, stage, availability, raw, created_at
		FROM assessments_summary
		WHERE block_uuid = $1 AND year >= $2 AND year <= $3
		ORDER BY year ASC
	`
	rows, err := r.DB.QueryContext(ctx, query, blockUUID, startYear, endYear)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var summaries []models.AssessmentSummary
	for rows.Next() {
		var a models.AssessmentSummary
		var raw []byte
		var rainfall, recharge, discharge, extractable, extraction, stage, availability sql.NullFloat64

		if err := rows.Scan(
			&a.AssessmentID, &a.BlockUUID, &a.Year, &rainfall, &recharge, &discharge,
			&extractable, &extraction, &a.Category, &stage, &availability, &raw, &a.CreatedAt,
		); err != nil {
			return nil, err
		}
		a.Rainfall = rainfall.Float64
		a.TotalRecharge = recharge.Float64
		a.TotalDischarge = discharge.Float64
		a.TotalExtractable = extractable.Float64
		a.TotalExtraction = extraction.Float64
		a.Stage = stage.Float64
		a.Availability = availability.Float64
		a.Raw = raw
		summaries = append(summaries, a)
	}
	return summaries, nil
}

func (r *IngresRepository) GetBlocksByNamesSimple(ctx context.Context, names []string) ([]models.Block, error) {
	if len(names) == 0 {
		return nil, nil
	}
	
	var blocks []models.Block
	for _, name := range names {
		// Exact or fuzzy match
		query := `SELECT block_uuid, block_name, district_uuid, state_uuid FROM blocks WHERE block_name ILIKE $1 LIMIT 1`
		row := r.DB.QueryRowContext(ctx, query, name)
		var b models.Block
		if err := row.Scan(&b.BlockUUID, &b.BlockName, &b.DistrictUUID, &b.StateUUID); err == nil {
			blocks = append(blocks, b)
		}
	}
	return blocks, nil
}

func (r *IngresRepository) GetBlocksByCategory(ctx context.Context, category string) ([]models.Block, error) {
	// Join blocks and assessments to filter by category
	// Get latest year assessment for each block
	query := `
		SELECT b.block_uuid, b.block_name, b.district_uuid, b.state_uuid, b.geometry
		FROM blocks b
		JOIN assessments_summary a ON b.block_uuid = a.block_uuid
		WHERE a.category ILIKE $1 AND a.year = '2024-2025' -- Default to latest
	`
	rows, err := r.DB.QueryContext(ctx, query, category)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var blocks []models.Block
	for rows.Next() {
		var b models.Block
		var geom sql.NullString
		if err := rows.Scan(&b.BlockUUID, &b.BlockName, &b.DistrictUUID, &b.StateUUID, &geom); err != nil {
			return nil, err
		}
		if geom.Valid {
			b.GeomGeoJSON = []byte(geom.String)
		}
		blocks = append(blocks, b)
	}
	return blocks, nil
}

func (r *IngresRepository) GetAssessmentComparison(ctx context.Context, blockUUIDs []uuid.UUID, year string) ([]models.AssessmentSummary, error) {
	if len(blockUUIDs) == 0 {
		return nil, nil
	}
	
	// Fallback implementation using loop to avoid array issues
	var summaries []models.AssessmentSummary
	for _, uid := range blockUUIDs {
		s, err := r.GetAssessmentSummary(ctx, uid, year)
		if err == nil && s != nil {
			summaries = append(summaries, *s)
		}
	}
	return summaries, nil
}

func (r *IngresRepository) GetStateByName(ctx context.Context, name string) (*models.State, error) {
	query := `SELECT state_uuid, state_name FROM states WHERE state_name ILIKE $1 LIMIT 1`
	row := r.DB.QueryRowContext(ctx, query, name)
	var s models.State
	if err := row.Scan(&s.StateUUID, &s.StateName); err != nil {
		return nil, err
	}
	return &s, nil
}

func (r *IngresRepository) GetDistrictByName(ctx context.Context, name string) (*models.District, error) {
	query := `SELECT district_uuid, district_name, state_uuid FROM districts WHERE district_name ILIKE $1 LIMIT 1`
	row := r.DB.QueryRowContext(ctx, query, name)
	var d models.District
	if err := row.Scan(&d.DistrictUUID, &d.DistrictName, &d.StateUUID); err != nil {
		return nil, err
	}
	return &d, nil
}

// RunRawQuery executes a raw SQL query generated by the LLM.
// WARNING: This should be used with caution. Ensure the DB user has restricted permissions if possible.
func (r *IngresRepository) RunRawQuery(ctx context.Context, query string) ([]map[string]interface{}, error) {
	rows, err := r.DB.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	columns, err := rows.Columns()
	if err != nil {
		return nil, err
	}

	var results []map[string]interface{}

	for rows.Next() {
		// Create a slice of interface{} to hold the values
		values := make([]interface{}, len(columns))
		valuePtrs := make([]interface{}, len(columns))
		for i := range columns {
			valuePtrs[i] = &values[i]
		}

		if err := rows.Scan(valuePtrs...); err != nil {
			return nil, err
		}

		// Create a map for this row
		rowMap := make(map[string]interface{})
		for i, col := range columns {
			val := values[i]
			
			// Handle byte arrays (common for strings in some drivers)
			if b, ok := val.([]byte); ok {
				rowMap[col] = string(b)
			} else {
				rowMap[col] = val
			}
		}
		results = append(results, rowMap)
	}

	return results, nil
}
