package services

import (
	"context"
	"fmt"
	"sort"
	"strings"

	"github.com/hxrshxz/ground-sense-bot/backend/internal/models"
)

// ============================================================================
// FOCUSED 4-ATTRIBUTE HANDLERS (Per Mentor Feedback)
// ============================================================================
// These handlers focus ONLY on the 4 key attributes:
// 1. Annual Extractable GW Resources
// 2. Annual GW Extraction
// 3. Stage of Extraction
// 4. Categorization
// ============================================================================

// handleStateQuery - Returns 4 key attributes for a state with drill-down options
func (s *ChatService) handleStateQuery(ctx context.Context, stateName string, year string) (*models.ChatResponse, error) {
	r := &models.ChatResponse{Intent: "state_query"}
	
	if year == "" {
		year = "2024-2025"
	}
	
	// Get state
	state, err := s.ingres.GetStateByName(ctx, stateName)
	if err != nil || state == nil {
		r.Text = fmt.Sprintf("❌ State '%s' not found. Try: Punjab, Haryana, Rajasthan, etc.", stateName)
		r.Suggestions = []string{"Punjab groundwater status", "Haryana groundwater", "Show all states"}
		return r, nil
	}
	
	// Get aggregated data for state
	query := fmt.Sprintf(`
		SELECT 
			COALESCE(SUM(a.total_extractable), 0) as extractable,
			COALESCE(SUM(a.total_extraction), 0) as extraction,
			ROUND(AVG(CASE WHEN a.stage > 0 AND a.stage < 1000 THEN a.stage ELSE NULL END)::numeric, 1) as avg_stage,
			COUNT(DISTINCT b.block_uuid) as block_count,
			COUNT(DISTINCT d.district_uuid) as district_count,
			(SELECT category FROM assessments_summary a2 
			 JOIN blocks b2 ON a2.block_uuid = b2.block_uuid 
			 WHERE b2.state_uuid = '%s' AND a2.year = '%s'
			 GROUP BY category ORDER BY COUNT(*) DESC LIMIT 1) as dominant_category
		FROM assessments_summary a
		JOIN blocks b ON a.block_uuid = b.block_uuid
		JOIN districts d ON b.district_uuid = d.district_uuid
		WHERE b.state_uuid = '%s' AND a.year = '%s'
	`, state.StateUUID, year, state.StateUUID, year)
	
	results, err := s.ingres.repo.RunRawQuery(ctx, query)
	if err != nil || len(results) == 0 {
		r.Text = fmt.Sprintf("❌ No data found for %s in %s", state.StateName, year)
		return r, nil
	}
	
	row := results[0]
	extractable := getFloat(row, "extractable")
	extraction := getFloat(row, "extraction")
	avgStage := getFloat(row, "avg_stage")
	blockCount := int(getFloat(row, "block_count"))
	districtCount := int(getFloat(row, "district_count"))
	category := getString(row, "dominant_category")
	
	// Determine category description
	categoryDisplay := formatCategory(category)
	stageStatus := getStageStatus(avgStage)
	
	// Build focused response text
	r.Text = fmt.Sprintf(`🏛️ **%s** (State Level) - %s
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 **THE 4 KEY GROUNDWATER ATTRIBUTES:**

1️⃣ **Annual Extractable GW Resources:** %.2f MCM
2️⃣ **Annual GW Extraction:** %.2f MCM
3️⃣ **Stage of Extraction:** %.1f%% (%s)
4️⃣ **Dominant Category:** %s

📍 **Coverage:** %d Districts | %d Blocks

🔍 **Drill-down:** Type "Show districts in %s" to see district-wise breakdown`,
		state.StateName, year,
		extractable, extraction, avgStage, stageStatus, categoryDisplay,
		districtCount, blockCount, state.StateName)
	
	// Set data
	r.Data = &models.FourAttributeData{
		LocationName: state.StateName,
		LocationType: "state",
		Year:         year,
		Extractable:  extractable,
		Extraction:   extraction,
		Stage:        avgStage,
		Category:     category,
		ChildCount:   districtCount,
		ChildType:    "districts",
	}
	
	// Add drill-down suggestions
	r.Suggestions = []string{
		fmt.Sprintf("Show districts in %s", state.StateName),
		fmt.Sprintf("Critical blocks in %s", state.StateName),
		fmt.Sprintf("Compare %s with Haryana", state.StateName),
	}
	
	// Add simple comparison chart
	r.Chart = &models.ChartPayload{
		Type:  "brush-bar",
		Title: fmt.Sprintf("%s - Groundwater Balance", state.StateName),
		XAxis: map[string]interface{}{"data": []string{"Extractable GW", "GW Extraction"}},
		Series: []models.ChartSeries{
			{Name: "MCM", Data: []float64{extractable, extraction}, Type: "bar"},
		},
	}
	
	return r, nil
}

// handleDistrictQuery - Returns 4 key attributes for a district
func (s *ChatService) handleDistrictQuery(ctx context.Context, districtName string, year string) (*models.ChatResponse, error) {
	r := &models.ChatResponse{Intent: "district_query"}
	
	if year == "" {
		year = "2024-2025"
	}
	
	// Get district
	district, err := s.ingres.GetDistrictByName(ctx, districtName)
	if err != nil || district == nil {
		r.Text = fmt.Sprintf("❌ District '%s' not found.", districtName)
		return r, nil
	}
	
	// Get state name for context
	state, _ := s.ingres.repo.GetStateByUUID(ctx, district.StateUUID)
	stateName := "Unknown"
	if state != nil {
		stateName = state.StateName
	}
	
	// Get aggregated data for district
	query := fmt.Sprintf(`
		SELECT 
			COALESCE(SUM(a.total_extractable), 0) as extractable,
			COALESCE(SUM(a.total_extraction), 0) as extraction,
			ROUND(AVG(CASE WHEN a.stage > 0 AND a.stage < 1000 THEN a.stage ELSE NULL END)::numeric, 1) as avg_stage,
			COUNT(DISTINCT b.block_uuid) as block_count,
			(SELECT category FROM assessments_summary a2 
			 JOIN blocks b2 ON a2.block_uuid = b2.block_uuid 
			 WHERE b2.district_uuid = '%s' AND a2.year = '%s'
			 GROUP BY category ORDER BY COUNT(*) DESC LIMIT 1) as dominant_category
		FROM assessments_summary a
		JOIN blocks b ON a.block_uuid = b.block_uuid
		WHERE b.district_uuid = '%s' AND a.year = '%s'
	`, district.DistrictUUID, year, district.DistrictUUID, year)
	
	results, err := s.ingres.repo.RunRawQuery(ctx, query)
	if err != nil || len(results) == 0 {
		r.Text = fmt.Sprintf("❌ No data found for %s district in %s", district.DistrictName, year)
		return r, nil
	}
	
	row := results[0]
	extractable := getFloat(row, "extractable")
	extraction := getFloat(row, "extraction")
	avgStage := getFloat(row, "avg_stage")
	blockCount := int(getFloat(row, "block_count"))
	category := getString(row, "dominant_category")
	
	categoryDisplay := formatCategory(category)
	stageStatus := getStageStatus(avgStage)
	
	r.Text = fmt.Sprintf(`🏢 **%s District** (%s) - %s
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 **THE 4 KEY GROUNDWATER ATTRIBUTES:**

1️⃣ **Annual Extractable GW Resources:** %.2f MCM
2️⃣ **Annual GW Extraction:** %.2f MCM
3️⃣ **Stage of Extraction:** %.1f%% (%s)
4️⃣ **Dominant Category:** %s

📍 **Coverage:** %d Blocks

⬆️ **Parent:** %s State
🔍 **Drill-down:** Type "Show blocks in %s" for block-level details`,
		district.DistrictName, stateName, year,
		extractable, extraction, avgStage, stageStatus, categoryDisplay,
		blockCount, stateName, district.DistrictName)
	
	r.Data = &models.FourAttributeData{
		LocationName: district.DistrictName,
		LocationType: "district",
		Year:         year,
		Extractable:  extractable,
		Extraction:   extraction,
		Stage:        avgStage,
		Category:     category,
		ParentName:   stateName,
		ParentType:   "state",
		ChildCount:   blockCount,
		ChildType:    "blocks",
	}
	
	r.Suggestions = []string{
		fmt.Sprintf("Show blocks in %s", district.DistrictName),
		fmt.Sprintf("%s state overview", stateName),
	}
	
	r.Chart = &models.ChartPayload{
		Type:  "brush-bar",
		Title: fmt.Sprintf("%s District - Groundwater Balance", district.DistrictName),
		XAxis: map[string]interface{}{"data": []string{"Extractable GW", "GW Extraction"}},
		Series: []models.ChartSeries{
			{Name: "MCM", Data: []float64{extractable, extraction}, Type: "bar"},
		},
	}
	
	return r, nil
}

// handleBlockQuery - Returns 4 key attributes for a single block
func (s *ChatService) handleBlockQuery(ctx context.Context, blockName string, year string) (*models.ChatResponse, error) {
	r := &models.ChatResponse{Intent: "block_query"}
	
	if year == "" {
		year = "2024-2025"
	}
	
	// Try to find block
	blocks, err := s.ingres.GetBlocksByNames(ctx, []string{blockName})
	if err != nil || len(blocks) == 0 {
		r.Text = fmt.Sprintf("❌ Block '%s' not found.", blockName)
		return r, nil
	}
	
	block := blocks[0]
	
	// Get assessment data
	query := fmt.Sprintf(`
		SELECT 
			a.total_extractable as extractable,
			a.total_extraction as extraction,
			a.stage,
			a.category,
			d.district_name,
			s.state_name
		FROM assessments_summary a
		JOIN blocks b ON a.block_uuid = b.block_uuid
		JOIN districts d ON b.district_uuid = d.district_uuid
		JOIN states s ON b.state_uuid = s.state_uuid
		WHERE b.block_uuid = '%s' AND a.year = '%s'
	`, block.BlockUUID, year)
	
	results, err := s.ingres.repo.RunRawQuery(ctx, query)
	if err != nil || len(results) == 0 {
		r.Text = fmt.Sprintf("❌ No data found for block %s in %s", block.BlockName, year)
		return r, nil
	}
	
	row := results[0]
	extractable := getFloat(row, "extractable")
	extraction := getFloat(row, "extraction")
	stage := getFloat(row, "stage")
	category := getString(row, "category")
	districtName := getString(row, "district_name")
	stateName := getString(row, "state_name")
	
	categoryDisplay := formatCategory(category)
	stageStatus := getStageStatus(stage)
	
	r.Text = fmt.Sprintf(`📍 **%s Block** (%s, %s) - %s
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 **THE 4 KEY GROUNDWATER ATTRIBUTES:**

1️⃣ **Annual Extractable GW Resources:** %.2f MCM
2️⃣ **Annual GW Extraction:** %.2f MCM
3️⃣ **Stage of Extraction:** %.1f%% (%s)
4️⃣ **Category:** %s

⬆️ **Hierarchy:** %s → %s → %s`,
		block.BlockName, districtName, stateName, year,
		extractable, extraction, stage, stageStatus, categoryDisplay,
		stateName, districtName, block.BlockName)
	
	r.Data = &models.FourAttributeData{
		LocationName: block.BlockName,
		LocationType: "block",
		Year:         year,
		Extractable:  extractable,
		Extraction:   extraction,
		Stage:        stage,
		Category:     category,
		ParentName:   districtName,
		ParentType:   "district",
	}
	
	r.Suggestions = []string{
		fmt.Sprintf("Show blocks in %s", districtName),
		fmt.Sprintf("%s district overview", districtName),
	}
	
	return r, nil
}

// handleListDistrictsFocused - Lists all districts in a state with 4-attribute summary
func (s *ChatService) handleListDistrictsFocused(ctx context.Context, stateName string, year string) (*models.ChatResponse, error) {
	r := &models.ChatResponse{Intent: "list_districts"}
	
	if year == "" {
		year = "2024-2025"
	}
	
	state, err := s.ingres.GetStateByName(ctx, stateName)
	if err != nil || state == nil {
		r.Text = fmt.Sprintf("❌ State '%s' not found.", stateName)
		return r, nil
	}
	
	query := fmt.Sprintf(`
		SELECT 
			d.district_name,
			ROUND(AVG(CASE WHEN a.stage > 0 AND a.stage < 1000 THEN a.stage ELSE NULL END)::numeric, 1) as avg_stage,
			COALESCE(SUM(a.total_extraction), 0) as total_extraction,
			(SELECT category FROM assessments_summary a2 
			 JOIN blocks b2 ON a2.block_uuid = b2.block_uuid 
			 WHERE b2.district_uuid = d.district_uuid AND a2.year = '%s'
			 GROUP BY category ORDER BY COUNT(*) DESC LIMIT 1) as dominant_category,
			COUNT(b.block_uuid) as block_count
		FROM districts d
		JOIN blocks b ON d.district_uuid = b.district_uuid
		JOIN assessments_summary a ON b.block_uuid = a.block_uuid
		WHERE d.state_uuid = '%s' AND a.year = '%s'
		GROUP BY d.district_uuid, d.district_name
		ORDER BY avg_stage DESC NULLS LAST
	`, year, state.StateUUID, year)
	
	results, err := s.ingres.repo.RunRawQuery(ctx, query)
	if err != nil || len(results) == 0 {
		r.Text = fmt.Sprintf("❌ No district data found for %s in %s", state.StateName, year)
		return r, nil
	}
	
	// Build response text
	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("📋 **Districts in %s** - %s\n", state.StateName, year))
	sb.WriteString("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n")
	sb.WriteString("| # | District | Stage | Category | Blocks |\n")
	sb.WriteString("|---|----------|-------|----------|--------|\n")
	
	items := make([]models.HierarchyItem, 0, len(results))
	xAxisData := make([]string, 0, len(results))
	stageData := make([]float64, 0, len(results))
	
	for i, row := range results {
		name := getString(row, "district_name")
		stage := getFloat(row, "avg_stage")
		category := getString(row, "dominant_category")
		extraction := getFloat(row, "total_extraction")
		blockCount := int(getFloat(row, "block_count"))
		
		categoryEmoji := getCategoryEmoji(category)
		
		sb.WriteString(fmt.Sprintf("| %d | %s | %.1f%% | %s %s | %d |\n", 
			i+1, name, stage, categoryEmoji, formatCategory(category), blockCount))
		
		items = append(items, models.HierarchyItem{
			Name:       name,
			Stage:      stage,
			Category:   category,
			Extraction: extraction,
		})
		
		if i < 15 { // Limit chart data
			xAxisData = append(xAxisData, name)
			stageData = append(stageData, stage)
		}
	}
	
	sb.WriteString(fmt.Sprintf("\n📍 **Total:** %d districts\n", len(results)))
	sb.WriteString("\n🔍 **Drill-down:** Type \"Show blocks in [District Name]\" for block-level details")
	
	r.Text = sb.String()
	
	r.Data = &models.HierarchyListData{
		ParentName:    state.StateName,
		ParentType:    "state",
		Year:          year,
		Items:         items,
		TotalCount:    len(items),
		DrillDownHint: "Show blocks in [District Name]",
	}
	
	r.Suggestions = []string{
		fmt.Sprintf("Show blocks in %s", items[0].Name),
		fmt.Sprintf("%s groundwater status", state.StateName),
	}
	
	r.Chart = &models.ChartPayload{
		Type:  "brush-bar",
		Title: fmt.Sprintf("%s - District-wise Extraction Stage", state.StateName),
		XAxis: map[string]interface{}{"data": xAxisData},
		Series: []models.ChartSeries{
			{Name: "Extraction Stage (%)", Data: stageData, Type: "bar"},
		},
	}
	
	return r, nil
}

// handleListBlocksFocused - Lists all blocks in a district
func (s *ChatService) handleListBlocksFocused(ctx context.Context, districtName string, year string) (*models.ChatResponse, error) {
	r := &models.ChatResponse{Intent: "list_blocks"}
	
	if year == "" {
		year = "2024-2025"
	}
	
	district, err := s.ingres.GetDistrictByName(ctx, districtName)
	if err != nil || district == nil {
		r.Text = fmt.Sprintf("❌ District '%s' not found.", districtName)
		return r, nil
	}
	
	state, _ := s.ingres.repo.GetStateByUUID(ctx, district.StateUUID)
	stateName := ""
	if state != nil {
		stateName = state.StateName
	}
	
	query := fmt.Sprintf(`
		SELECT 
			b.block_name,
			a.stage,
			a.category,
			a.total_extraction,
			a.total_extractable
		FROM blocks b
		JOIN assessments_summary a ON b.block_uuid = a.block_uuid
		WHERE b.district_uuid = '%s' AND a.year = '%s'
		ORDER BY a.stage DESC NULLS LAST
	`, district.DistrictUUID, year)
	
	results, err := s.ingres.repo.RunRawQuery(ctx, query)
	if err != nil || len(results) == 0 {
		r.Text = fmt.Sprintf("❌ No block data found for %s district in %s", district.DistrictName, year)
		return r, nil
	}
	
	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("📋 **Blocks in %s District** (%s) - %s\n", district.DistrictName, stateName, year))
	sb.WriteString("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n")
	sb.WriteString("| # | Block | Stage | Category | Extraction |\n")
	sb.WriteString("|---|-------|-------|----------|------------|\n")
	
	items := make([]models.HierarchyItem, 0, len(results))
	xAxisData := make([]string, 0, len(results))
	stageData := make([]float64, 0, len(results))
	
	for i, row := range results {
		name := getString(row, "block_name")
		stage := getFloat(row, "stage")
		category := getString(row, "category")
		extraction := getFloat(row, "total_extraction")
		
		categoryEmoji := getCategoryEmoji(category)
		
		sb.WriteString(fmt.Sprintf("| %d | %s | %.1f%% | %s %s | %.1f MCM |\n",
			i+1, name, stage, categoryEmoji, formatCategory(category), extraction))
		
		items = append(items, models.HierarchyItem{
			Name:       name,
			Stage:      stage,
			Category:   category,
			Extraction: extraction,
		})
		
		if i < 20 {
			xAxisData = append(xAxisData, name)
			stageData = append(stageData, stage)
		}
	}
	
	sb.WriteString(fmt.Sprintf("\n📍 **Total:** %d blocks\n", len(results)))
	sb.WriteString(fmt.Sprintf("\n⬆️ **Navigate up:** \"%s district overview\" or \"%s state overview\"", 
		district.DistrictName, stateName))
	
	r.Text = sb.String()
	
	r.Data = &models.HierarchyListData{
		ParentName: district.DistrictName,
		ParentType: "district",
		Year:       year,
		Items:      items,
		TotalCount: len(items),
	}
	
	r.Suggestions = []string{
		fmt.Sprintf("%s district overview", district.DistrictName),
		fmt.Sprintf("%s state overview", stateName),
	}
	
	r.Chart = &models.ChartPayload{
		Type:  "brush-bar",
		Title: fmt.Sprintf("%s District - Block-wise Extraction Stage", district.DistrictName),
		XAxis: map[string]interface{}{"data": xAxisData},
		Series: []models.ChartSeries{
			{Name: "Extraction Stage (%)", Data: stageData, Type: "bar"},
		},
	}
	
	return r, nil
}

// handleListAllStates - Lists all states with summary
func (s *ChatService) handleListAllStates(ctx context.Context, year string) (*models.ChatResponse, error) {
	r := &models.ChatResponse{Intent: "list_states"}
	
	if year == "" {
		year = "2024-2025"
	}
	
	query := fmt.Sprintf(`
		SELECT 
			s.state_name,
			ROUND(AVG(CASE WHEN a.stage > 0 AND a.stage < 1000 THEN a.stage ELSE NULL END)::numeric, 1) as avg_stage,
			COALESCE(SUM(a.total_extraction), 0) as total_extraction,
			COUNT(DISTINCT d.district_uuid) as district_count,
			COUNT(b.block_uuid) as block_count
		FROM states s
		JOIN blocks b ON s.state_uuid = b.state_uuid
		JOIN districts d ON b.district_uuid = d.district_uuid
		JOIN assessments_summary a ON b.block_uuid = a.block_uuid
		WHERE a.year = '%s'
		GROUP BY s.state_uuid, s.state_name
		ORDER BY avg_stage DESC NULLS LAST
	`, year)
	
	results, err := s.ingres.repo.RunRawQuery(ctx, query)
	if err != nil || len(results) == 0 {
		r.Text = "❌ No state data found."
		return r, nil
	}
	
	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("🗺️ **All States - Groundwater Status** (%s)\n", year))
	sb.WriteString("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n")
	sb.WriteString("| # | State | Avg Stage | Districts | Blocks |\n")
	sb.WriteString("|---|-------|-----------|-----------|--------|\n")
	
	items := make([]models.HierarchyItem, 0)
	
	for i, row := range results {
		name := getString(row, "state_name")
		stage := getFloat(row, "avg_stage")
		extraction := getFloat(row, "total_extraction")
		districtCount := int(getFloat(row, "district_count"))
		blockCount := int(getFloat(row, "block_count"))
		
		stageEmoji := getStageEmoji(stage)
		
		sb.WriteString(fmt.Sprintf("| %d | %s %s | %.1f%% | %d | %d |\n",
			i+1, stageEmoji, name, stage, districtCount, blockCount))
		
		items = append(items, models.HierarchyItem{
			Name:       name,
			Stage:      stage,
			Extraction: extraction,
		})
	}
	
	sb.WriteString(fmt.Sprintf("\n📍 **Total:** %d states with data\n", len(results)))
	sb.WriteString("\n🔍 **Drill-down:** Type \"[State Name] groundwater status\" for detailed view")
	
	r.Text = sb.String()
	
	r.Suggestions = []string{
		fmt.Sprintf("%s groundwater status", items[0].Name),
		fmt.Sprintf("Show districts in %s", items[0].Name),
	}
	
	return r, nil
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

func getFloat(row map[string]interface{}, key string) float64 {
	if val, ok := row[key]; ok && val != nil {
		switch v := val.(type) {
		case float64:
			return v
		case float32:
			return float64(v)
		case int:
			return float64(v)
		case int64:
			return float64(v)
		case string:
			var f float64
			fmt.Sscanf(v, "%f", &f)
			return f
		}
	}
	return 0
}

func getString(row map[string]interface{}, key string) string {
	if val, ok := row[key]; ok && val != nil {
		return fmt.Sprintf("%v", val)
	}
	return ""
}

func formatCategory(category string) string {
	category = strings.ToLower(category)
	switch category {
	case "safe":
		return "Safe"
	case "semi_critical":
		return "Semi-Critical"
	case "critical":
		return "Critical"
	case "over_exploited":
		return "Over-Exploited"
	case "salinity":
		return "Salinity"
	default:
		return strings.Title(strings.ReplaceAll(category, "_", " "))
	}
}

func getStageStatus(stage float64) string {
	if stage > 100 {
		return "Over-Exploited"
	} else if stage > 90 {
		return "Critical"
	} else if stage > 70 {
		return "Semi-Critical"
	}
	return "Safe"
}

func getCategoryEmoji(category string) string {
	category = strings.ToLower(category)
	switch category {
	case "safe":
		return "🟢"
	case "semi_critical":
		return "🟡"
	case "critical":
		return "🟠"
	case "over_exploited":
		return "🔴"
	case "salinity":
		return "🔵"
	default:
		return "⚪"
	}
}

func getStageEmoji(stage float64) string {
	if stage > 100 {
		return "🔴"
	} else if stage > 90 {
		return "🟠"
	} else if stage > 70 {
		return "🟡"
	}
	return "🟢"
}

// SortByStageDesc sorts hierarchy items by stage descending
func sortByStageDesc(items []models.HierarchyItem) {
	sort.Slice(items, func(i, j int) bool {
		return items[i].Stage > items[j].Stage
	})
}
