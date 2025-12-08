package services

import (
	"context"
	"fmt"
	"strings"

	"github.com/hxrshxz/ground-sense-bot/backend/internal/models"
)

// ============================================
// NEW PREDEFINED VISUALIZATION HANDLERS
// ============================================

// handleYearlyComparison - Compare same location across different years
func (s *ChatService) handleYearlyComparison(ctx context.Context, e Entities, r *models.ChatResponse) (*models.ChatResponse, error) {
	if len(e.Locations) == 0 {
		r.Text = "Please specify a location to compare across years."
		return r, nil
	}

	locationName := e.Locations[0]
	
	// Try to find the location (state, district, or block)
	state, _ := s.ingres.GetStateByName(ctx, locationName)
	if state != nil {
		locationName = state.StateName
	}

	// Get data for multiple years
	years := []string{"2021-2022", "2022-2023", "2023-2024", "2024-2025"}
	
	sqlQuery := fmt.Sprintf(`
		SELECT 
			a.year,
			AVG(CASE WHEN a.stage > 0 THEN a.stage ELSE NULL END) as avg_stage,
			AVG(CASE WHEN a.total_recharge > 0 THEN a.total_recharge ELSE NULL END) as avg_recharge,
			AVG(CASE WHEN a.total_extraction > 0 THEN a.total_extraction ELSE NULL END) as avg_extraction,
			COUNT(DISTINCT b.block_uuid) as block_count
		FROM assessments_summary a
		JOIN blocks b ON a.block_uuid = b.block_uuid
		JOIN districts d ON b.district_uuid = d.district_uuid
		JOIN states s ON d.state_uuid = s.state_uuid
		WHERE UPPER(s.state_name) = UPPER('%s')
		AND a.year IN ('%s')
		GROUP BY a.year
		ORDER BY a.year
	`, locationName, strings.Join(years, "','"))

	results, err := s.ingres.repo.RunRawQuery(ctx, sqlQuery)
	if err != nil || len(results) == 0 {
		r.Text = fmt.Sprintf("No year comparison data found for %s.", locationName)
		return r, nil
	}

	// Prepare chart data
	var xAxisData []string
	var stageData []float64
	var rechargeData []float64
	var extractionData []float64

	for _, result := range results {
		year := ""
		stage := 0.0
		recharge := 0.0
		extraction := 0.0

		if y, ok := result["year"].(string); ok {
			year = y
		}
		if s, ok := result["avg_stage"].(float64); ok {
			stage = s
		}
		if r, ok := result["avg_recharge"].(float64); ok {
			recharge = r
		}
		if e, ok := result["avg_extraction"].(float64); ok {
			extraction = e
		}

		if year != "" {
			xAxisData = append(xAxisData, year)
			stageData = append(stageData, stage)
			rechargeData = append(rechargeData, recharge)
			extractionData = append(extractionData, extraction)
		}
	}

	r.Text = fmt.Sprintf("Here's a year-over-year comparison of %s showing extraction stage, recharge, and extraction trends.", locationName)
	
	r.Chart = &models.ChartPayload{
		Type:  "gradient-area",
		Title: fmt.Sprintf("%s - Yearly Comparison", locationName),
		XAxis: xAxisData,
		Series: []models.ChartSeries{
			{
				Name: "Extraction Stage (%)",
				Data: stageData,
				Type: "line",
			},
			{
				Name: "Total Recharge (ham)",
				Data: rechargeData,
				Type: "line",
			},
			{
				Name: "Total Extraction (ham)",
				Data: extractionData,
				Type: "line",
			},
		},
	}

	r.Data = results
	return r, nil
}

// handleCategorySummary - Pie chart showing category distribution
func (s *ChatService) handleCategorySummary(ctx context.Context, e Entities, r *models.ChatResponse) (*models.ChatResponse, error) {
	if len(e.Locations) == 0 {
		r.Text = "Please specify a state or district to see category breakdown."
		return r, nil
	}

	locationName := e.Locations[0]
	year := e.Year
	if year == "" {
		year = "2024-2025"
	}

	// Try to find state
	state, _ := s.ingres.GetStateByName(ctx, locationName)
	if state == nil {
		r.Text = fmt.Sprintf("Location '%s' not found. Please try a state name like Punjab, Haryana, etc.", locationName)
		return r, nil
	}

	sqlQuery := fmt.Sprintf(`
		SELECT 
			a.category,
			COUNT(DISTINCT b.block_uuid) as count
		FROM assessments_summary a
		JOIN blocks b ON a.block_uuid = b.block_uuid
		JOIN districts d ON b.district_uuid = d.district_uuid
		WHERE d.state_uuid = '%s'
		AND a.year = '%s'
		AND a.category IS NOT NULL
		AND a.category != ''
		GROUP BY a.category
		ORDER BY count DESC
	`, state.StateUUID, year)

	results, err := s.ingres.repo.RunRawQuery(ctx, sqlQuery)
	if err != nil || len(results) == 0 {
		r.Text = fmt.Sprintf("No category data found for %s in %s.", state.StateName, year)
		return r, nil
	}

	// Prepare pie chart data
	var pieData []models.PieDatum
	totalBlocks := 0.0

	for _, result := range results {
		category := ""
		count := 0.0

		if cat, ok := result["category"].(string); ok {
			category = cat
		}
		if c, ok := result["count"].(float64); ok {
			count = c
		}

		if category != "" && count > 0 {
			// Format category names
			displayCategory := strings.ReplaceAll(category, "_", " ")
			displayCategory = strings.Title(strings.ToLower(displayCategory))
			
			pieData = append(pieData, models.PieDatum{
				Name:  displayCategory,
				Value: count,
			})
			totalBlocks += count
		}
	}

	r.Text = fmt.Sprintf("Category distribution for %s (%s): %d total blocks analyzed.", state.StateName, year, int(totalBlocks))
	
	r.Chart = &models.ChartPayload{
		Type:    "rose-pie",
		Title:   fmt.Sprintf("%s - Groundwater Category Distribution", state.StateName),
		PieData: pieData,
	}

	r.Data = results
	return r, nil
}

// handleCriticalAlerts - Show blocks needing urgent attention
func (s *ChatService) handleCriticalAlerts(ctx context.Context, e Entities, r *models.ChatResponse) (*models.ChatResponse, error) {
	locationFilter := ""
	locationName := "India"
	
	if len(e.Locations) > 0 {
		state, _ := s.ingres.GetStateByName(ctx, e.Locations[0])
		if state != nil {
			locationFilter = fmt.Sprintf("AND d.state_uuid = '%s'", state.StateUUID)
			locationName = state.StateName
		}
	}

	year := e.Year
	if year == "" {
		year = "2024-2025"
	}

	// Get blocks with critical or over-exploited status and high extraction
	sqlQuery := fmt.Sprintf(`
		SELECT 
			b.block_name,
			d.district_name,
			s.state_name,
			a.category,
			a.stage,
			a.total_extraction,
			a.total_recharge,
			(a.total_extraction - a.total_recharge) as deficit
		FROM assessments_summary a
		JOIN blocks b ON a.block_uuid = b.block_uuid
		JOIN districts d ON b.district_uuid = d.district_uuid
		JOIN states s ON d.state_uuid = s.state_uuid
		WHERE a.year = '%s'
		AND a.category IN ('critical', 'over_exploited')
		AND a.stage > 80
		%s
		ORDER BY a.stage DESC, deficit DESC
		LIMIT 20
	`, year, locationFilter)

	results, err := s.ingres.repo.RunRawQuery(ctx, sqlQuery)
	if err != nil || len(results) == 0 {
		r.Text = fmt.Sprintf("Good news! No critical alerts found for %s in %s.", locationName, year)
		return r, nil
	}

	// Prepare bar chart data
	var xAxisData []string
	var stageData []float64
	var deficitData []float64

	for i, result := range results {
		if i >= 15 { // Limit to top 15 for readability
			break
		}

		blockName := ""
		districtName := ""
		stage := 0.0
		deficit := 0.0

		if bn, ok := result["block_name"].(string); ok {
			blockName = bn
		}
		if dn, ok := result["district_name"].(string); ok {
			districtName = dn
		}
		if s, ok := result["stage"].(float64); ok {
			stage = s
		}
		if d, ok := result["deficit"].(float64); ok {
			deficit = d
		}

		if blockName != "" {
			label := fmt.Sprintf("%s, %s", blockName, districtName)
			xAxisData = append(xAxisData, label)
			stageData = append(stageData, stage)
			deficitData = append(deficitData, deficit)
		}
	}

	r.Text = fmt.Sprintf("⚠️ Critical Alerts: Found %d blocks in %s that need urgent attention (extraction stage > 80%%).", len(results), locationName)
	
	r.Chart = &models.ChartPayload{
		Type:  "brush-bar",
		Title: fmt.Sprintf("%s - Critical Groundwater Blocks Needing Attention", locationName),
		XAxis: xAxisData,
		Series: []models.ChartSeries{
			{
				Name: "Extraction Stage (%)",
				Data: stageData,
				Type: "bar",
			},
			{
				Name: "Water Deficit (ham)",
				Data: deficitData,
				Type: "line",
			},
		},
	}

	r.Data = results
	return r, nil
}

// handleWaterBalance - Recharge vs Extraction analysis
func (s *ChatService) handleWaterBalance(ctx context.Context, e Entities, r *models.ChatResponse) (*models.ChatResponse, error) {
	if len(e.Locations) == 0 {
		r.Text = "Please specify a location to analyze water balance."
		return r, nil
	}

	locationName := e.Locations[0]
	state, _ := s.ingres.GetStateByName(ctx, locationName)
	if state == nil {
		r.Text = fmt.Sprintf("Location '%s' not found. Please try a state name.", locationName)
		return r, nil
	}

	year := e.Year
	if year == "" {
		year = "2024-2025"
	}

	// Get districts with their recharge vs extraction balance
	sqlQuery := fmt.Sprintf(`
		SELECT 
			d.district_name,
			AVG(CASE WHEN a.total_recharge > 0 THEN a.total_recharge ELSE NULL END) as avg_recharge,
			AVG(CASE WHEN a.total_extraction > 0 THEN a.total_extraction ELSE NULL END) as avg_extraction,
			AVG(a.stage) as avg_stage,
			COUNT(DISTINCT b.block_uuid) as block_count
		FROM districts d
		JOIN blocks b ON d.district_uuid = b.district_uuid
		LEFT JOIN assessments_summary a ON b.block_uuid = a.block_uuid AND a.year = '%s'
		WHERE d.state_uuid = '%s'
		GROUP BY d.district_uuid, d.district_name
		HAVING AVG(a.total_recharge) > 0 AND AVG(a.total_extraction) > 0
		ORDER BY (AVG(a.total_extraction) - AVG(a.total_recharge)) DESC
		LIMIT 20
	`, year, state.StateUUID)

	results, err := s.ingres.repo.RunRawQuery(ctx, sqlQuery)
	if err != nil || len(results) == 0 {
		r.Text = fmt.Sprintf("No water balance data found for %s in %s.", state.StateName, year)
		return r, nil
	}

	// Prepare chart data
	var xAxisData []string
	var rechargeData []float64
	var extractionData []float64
	var balanceData []float64

	for _, result := range results {
		districtName := ""
		recharge := 0.0
		extraction := 0.0

		if dn, ok := result["district_name"].(string); ok {
			districtName = dn
		}
		if r, ok := result["avg_recharge"].(float64); ok {
			recharge = r
		}
		if e, ok := result["avg_extraction"].(float64); ok {
			extraction = e
		}

		if districtName != "" {
			xAxisData = append(xAxisData, districtName)
			rechargeData = append(rechargeData, recharge)
			extractionData = append(extractionData, extraction)
			balanceData = append(balanceData, recharge-extraction)
		}
	}

	r.Text = fmt.Sprintf("Water balance analysis for %s (%s): Comparing recharge vs extraction across districts.", state.StateName, year)
	
	r.Chart = &models.ChartPayload{
		Type:  "brush-bar",
		Title: fmt.Sprintf("%s - Water Balance Analysis (Recharge vs Extraction)", state.StateName),
		XAxis: xAxisData,
		Series: []models.ChartSeries{
			{
				Name: "Recharge (ham)",
				Data: rechargeData,
				Type: "bar",
			},
			{
				Name: "Extraction (ham)",
				Data: extractionData,
				Type: "bar",
			},
			{
				Name: "Balance (ham)",
				Data: balanceData,
				Type: "line",
			},
		},
	}

	r.Data = results
	return r, nil
}

// handleStateOverview - Comprehensive state dashboard
func (s *ChatService) handleStateOverview(ctx context.Context, e Entities, r *models.ChatResponse) (*models.ChatResponse, error) {
	if len(e.Locations) == 0 {
		r.Text = "Please specify a state for the overview dashboard."
		return r, nil
	}

	locationName := e.Locations[0]
	state, _ := s.ingres.GetStateByName(ctx, locationName)
	if state == nil {
		r.Text = fmt.Sprintf("State '%s' not found. Please try a state name like Punjab, Haryana, etc.", locationName)
		return r, nil
	}

	year := e.Year
	if year == "" {
		year = "2024-2025"
	}

	// Get comprehensive overview data - category distribution
	sqlQuery := fmt.Sprintf(`
		SELECT 
			a.category,
			COUNT(DISTINCT b.block_uuid) as count,
			AVG(a.stage) as avg_stage,
			AVG(a.total_recharge) as avg_recharge,
			AVG(a.total_extraction) as avg_extraction
		FROM assessments_summary a
		JOIN blocks b ON a.block_uuid = b.block_uuid
		JOIN districts d ON b.district_uuid = d.district_uuid
		WHERE d.state_uuid = '%s'
		AND a.year = '%s'
		AND a.category IS NOT NULL
		GROUP BY a.category
		ORDER BY 
			CASE a.category
				WHEN 'over_exploited' THEN 1
				WHEN 'critical' THEN 2
				WHEN 'semi_critical' THEN 3
				WHEN 'safe' THEN 4
				ELSE 5
			END
	`, state.StateUUID, year)

	results, err := s.ingres.repo.RunRawQuery(ctx, sqlQuery)
	if err != nil || len(results) == 0 {
		r.Text = fmt.Sprintf("No overview data found for %s in %s.", state.StateName, year)
		return r, nil
	}

	// Prepare stacked bar chart data showing all metrics by category
	var xAxisData []string
	var stageData []float64
	var rechargeData []float64
	var extractionData []float64
	var countData []float64

	totalBlocks := 0.0

	for _, result := range results {
		category := ""
		count := 0.0
		stage := 0.0
		recharge := 0.0
		extraction := 0.0

		if cat, ok := result["category"].(string); ok {
			category = cat
		}
		if c, ok := result["count"].(float64); ok {
			count = c
		}
		if s, ok := result["avg_stage"].(float64); ok {
			stage = s
		}
		if r, ok := result["avg_recharge"].(float64); ok {
			recharge = r
		}
		if e, ok := result["avg_extraction"].(float64); ok {
			extraction = e
		}

		if category != "" {
			displayCategory := strings.ReplaceAll(category, "_", " ")
			displayCategory = strings.Title(strings.ToLower(displayCategory))
			
			xAxisData = append(xAxisData, displayCategory)
			stageData = append(stageData, stage)
			rechargeData = append(rechargeData, recharge)
			extractionData = append(extractionData, extraction)
			countData = append(countData, count)
			totalBlocks += count
		}
	}

	r.Text = fmt.Sprintf("📊 Complete Overview of %s (%s):\n\nTotal Blocks Analyzed: %d\n\nShowing category-wise breakdown of extraction stage, recharge, and extraction levels.", 
		state.StateName, year, int(totalBlocks))
	
	r.Chart = &models.ChartPayload{
		Type:  "brush-bar",
		Title: fmt.Sprintf("%s - Complete Groundwater Overview Dashboard", state.StateName),
		XAxis: xAxisData,
		Series: []models.ChartSeries{
			{
				Name: "Number of Blocks",
				Data: countData,
				Type: "bar",
			},
			{
				Name: "Avg Extraction Stage (%)",
				Data: stageData,
				Type: "line",
			},
			{
				Name: "Avg Recharge (ham)",
				Data: rechargeData,
				Type: "line",
			},
			{
				Name: "Avg Extraction (ham)",
				Data: extractionData,
				Type: "line",
			},
		},
	}

	r.Data = results
	return r, nil
}
