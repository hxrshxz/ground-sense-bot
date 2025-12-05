package services

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"sync" // Added sync import

	"github.com/google/uuid"
	"github.com/hxrshxz/ground-sense-bot/backend/internal/models"
	// Added repositories import
)

// UserSession stores context for a user's ongoing conversation
type UserSession struct {
	LastEntities Entities
	LastIntent   string
	LastQuery    string
}

type ChatService struct {
	nlp      *NLPService
	ingres   *IngresService
	sessions map[string]*UserSession
	mu       sync.Mutex
}

func NewChatService(nlp *NLPService, ingres *IngresService) *ChatService {
	return &ChatService{
		nlp:      nlp,
		ingres:   ingres,
		sessions: make(map[string]*UserSession),
	}
}

func (s *ChatService) ProcessMessage(ctx context.Context, message string, username string) (*models.ChatResponse, error) {
	// Input validation
	message = strings.TrimSpace(message)
	
	defer func() {
		if r := recover(); r != nil {
			fmt.Printf("PANIC in ProcessMessage: %v\n", r)
			// debug.PrintStack() // Requires runtime/debug import
		}
	}()

	if message == "" {
		return &models.ChatResponse{
			Text: "Please enter a question about groundwater data.",
		}, nil
	}

	// Get or create session
	s.mu.Lock()
	if s.sessions == nil {
		s.sessions = make(map[string]*UserSession)
	}
	session, exists := s.sessions[username]
	if !exists {
		session = &UserSession{}
		s.sessions[username] = session
	}
	s.mu.Unlock()

	intent, entities, sqlQuery := s.nlp.ParseMessage(message)
	
	// Context Merging Logic
	// If new entities are missing locations but we have them in session, and the user implies context
	// (e.g., "what about...", "list blocks there", "trend for it")
	// For now, we'll be aggressive: if no location is found, try to use the last one.
	if len(entities.Locations) == 0 && len(session.LastEntities.Locations) > 0 {
		// Check for context clues or just default to previous location if it makes sense
		// Simple heuristic: If intent requires location (Trend, Compare, ListBlocks) and we have none, use previous.
		if intent == IntentTrend || intent == IntentCompare || intent == IntentListBlocks || intent == IntentSummary {
			fmt.Printf("DEBUG: Using context location: %v\n", session.LastEntities.Locations)
			entities.Locations = session.LastEntities.Locations
			
			// Re-generate SQL if needed (since SQL generation in ParseMessage might have failed due to missing location)
			// Actually, ParseMessage generates SQL based on the prompt. If we inject location, we might need to re-run it?
			// Or just rely on the fallback handlers which use `entities`.
			// Let's rely on fallback handlers for now, as re-running LLM is expensive.
			// BUT, if ParseMessage failed to generate SQL because of missing location, we are stuck.
			// Ideally, we should pass context TO ParseMessage.
		}
	}
	
	// Update session
	s.mu.Lock()
	if len(entities.Locations) > 0 {
		session.LastEntities = entities
	}
	session.LastIntent = string(intent)
	session.LastQuery = message
	s.mu.Unlock()

	fmt.Printf("DEBUG: Intent=%s, Entities=%+v, SQL=%s\n", intent, entities, sqlQuery)
	
	response := &models.ChatResponse{
		Intent: string(intent),
	}

	// If SQL is present, execute it and generate visualization
	if sqlQuery != "" {
		fmt.Printf("DEBUG: Executing SQL: %s\n", sqlQuery)
		results, err := s.ingres.repo.RunRawQuery(ctx, sqlQuery)
		
		// Handle SQL execution errors
		if err != nil {
			fmt.Printf("ERROR: SQL execution failed: %v\n", err)
			response.Text = "I encountered an error executing your query. Please try rephrasing your question."
			return response, nil
		}
		
		// Handle empty results
		if len(results) == 0 {
			response.Text = "No data found matching your criteria. Please try different parameters or check the location name."
			return response, nil
		}
		
		// Generate Visualization
		vizJSON, explanation, err := s.nlp.llm.GenerateVisualization(results, sqlQuery, message)
		if err != nil {
			fmt.Printf("DEBUG: GenerateVisualization Error in ChatService: %v\n", err)
		}

		if err == nil {
			var llmResp map[string]interface{}
			if err := json.Unmarshal([]byte(vizJSON), &llmResp); err == nil {
				// Set Explanation
				if val, ok := llmResp["explanation"].(string); ok && val != "" {
					response.Text = val
				} else if explanation != "" {
					response.Text = explanation
				} else {
					response.Text = "Here is the data you requested."
				}

				// Set Chart if applicable
				if typeVal, ok := llmResp["type"].(string); ok && typeVal != "table" && typeVal != "text" {
					if opts, ok := llmResp["echarts_option"]; ok {
						title, _ := llmResp["title"].(string)
						response.Chart = &models.ChartPayload{
							Type:          typeVal,
							Title:         title,
							EChartsOption: opts,
						}
					}
				}
				
				response.Data = results
				return response, nil
			}
		}
		
		// Fallback if visualization generation fails
		response.Text = "I found some data but couldn't generate a visualization. Here's what I found:"
		response.Data = results
		return response, nil
	}
	
	switch intent {
	case IntentSummary:
		return s.handleSummary(ctx, entities, response)
	case IntentTrend:
		return s.handleTrend(ctx, entities, response)
	case IntentCompare:
		return s.handleCompare(ctx, entities, response)
	case IntentRechargeBreakdown:
		return s.handleRechargeBreakdown(ctx, entities, response)
	case IntentExtractionBreakdown:
		return s.handleExtractionBreakdown(ctx, entities, response)
	case IntentDischargeBreakdown:
		return s.handleDischargeBreakdown(ctx, entities, response)
	case IntentMapCategory:
		return s.handleMapCategory(ctx, entities, response)
	case IntentListBlocks:
		return s.handleListBlocks(ctx, entities, response)
	case IntentListDistricts:
		return s.handleListDistricts(ctx, entities, response)
	case IntentListStates:
		return s.handleListStates(ctx, entities, response)
	default:
		response.Text = "I'm not sure what you mean. Try asking for a summary, trend, comparison, list blocks/districts/states, or recharge/extraction breakdowns."
		return response, nil
	}
}

func (s *ChatService) handleSummary(ctx context.Context, e Entities, r *models.ChatResponse) (*models.ChatResponse, error) {
	blocks, err := s.ingres.GetBlocksByNames(ctx, e.Locations)
	
	// Fallback: Try joining names if no blocks found
	if len(blocks) == 0 && len(e.Locations) > 0 {
		joinedName := strings.Join(e.Locations, " ")
		
		// Try block again with joined name (e.g. "Madhya Pradesh" as a block name?)
		moreBlocks, _ := s.ingres.GetBlocksByNames(ctx, []string{joinedName})
		if len(moreBlocks) > 0 {
			blocks = moreBlocks
		} else {
			// Try District - now with aggregated data!
			district, err := s.ingres.GetDistrictByName(ctx, joinedName)
			if err == nil && district != nil {
				// Get aggregated district summary
				districtSummary, err := s.ingres.repo.GetDistrictSummary(ctx, district.DistrictUUID, e.Year)
				if err == nil && districtSummary != nil {
					r.Text = fmt.Sprintf("📊 **%s District Assessment Summary (%s)**\n\n"+
						"📍 **State**: %s\n"+
						"🏘️ **Total Blocks**: %d\n"+
						"🌧️ **Average Rainfall**: %.2f mm\n"+
						"📈 **Average Stage**: %.2f%%\n"+
						"💧 **Total Recharge**: %.2f mcm\n"+
						"⚡ **Total Extraction**: %.2f mcm\n\n"+
						"📊 **Block Categories**:\n"+
						"   ✅ Safe: %d blocks\n"+
						"   ⚠️ Semi-Critical: %d blocks\n"+
						"   🔶 Critical: %d blocks\n"+
						"   🔴 Over-Exploited: %d blocks",
						districtSummary.DistrictName, e.Year,
						districtSummary.StateName,
						districtSummary.TotalBlocks,
						districtSummary.AvgRainfall,
						districtSummary.AvgStage,
						districtSummary.TotalRecharge,
						districtSummary.TotalExtraction,
						districtSummary.SafeBlocks,
						districtSummary.SemiCriticalBlocks,
						districtSummary.CriticalBlocks,
						districtSummary.OverExploitedBlocks,
					)
					r.Data = districtSummary
					
					// Add chart data for district breakdown
					r.Chart = &models.ChartPayload{
						Type:  "bar",
						Title: fmt.Sprintf("Block Categories in %s District", districtSummary.DistrictName),
						XAxis: []string{"Safe", "Semi-Critical", "Critical", "Over-Exploited"},
						Series: []models.ChartSeries{
							{
								Name: "Number of Blocks",
								Data: []float64{
									float64(districtSummary.SafeBlocks),
									float64(districtSummary.SemiCriticalBlocks),
									float64(districtSummary.CriticalBlocks),
									float64(districtSummary.OverExploitedBlocks),
								},
							},
						},
					}
					return r, nil
				}
				
				// Fallback to listing blocks if summary fails
				blocksList, err := s.ingres.GetBlocks(ctx, district.DistrictUUID)
				if err == nil && len(blocksList) > 0 {
					var blockNames []string
					limit := 10
					for i, b := range blocksList {
						if i >= limit {
							break
						}
						blockNames = append(blockNames, b.BlockName)
					}
					r.Text = fmt.Sprintf("I found the District '%s'. It has %d blocks. Here are some of them: %s. Please ask for a specific Block to get detailed data.", 
						district.DistrictName, len(blocksList), strings.Join(blockNames, ", "))
					return r, nil
				}
				r.Text = fmt.Sprintf("I found the District '%s', but I couldn't find any blocks in it.", district.DistrictName)
				return r, nil
			}
			
			// Try State - now with aggregated data!
			state, err := s.ingres.GetStateByName(ctx, joinedName)
			if err == nil && state != nil {
				// Get aggregated state summary
				stateSummary, err := s.ingres.repo.GetStateSummary(ctx, state.StateUUID, e.Year)
				if err == nil && stateSummary != nil {
					r.Text = fmt.Sprintf("📊 **%s State Assessment Summary (%s)**\n\n"+
						"🏘️ **Total Blocks**: %d\n"+
						"🌧️ **Average Rainfall**: %.2f mm\n"+
						"📈 **Average Stage**: %.2f%%\n"+
						"💧 **Total Recharge**: %.2f mcm\n"+
						"⚡ **Total Extraction**: %.2f mcm\n\n"+
						"📊 **Block Categories**:\n"+
						"   ✅ Safe: %d blocks\n"+
						"   ⚠️ Semi-Critical: %d blocks\n"+
						"   🔶 Critical: %d blocks\n"+
						"   🔴 Over-Exploited: %d blocks",
						stateSummary.StateName, e.Year,
						stateSummary.TotalBlocks,
						stateSummary.AvgRainfall,
						stateSummary.AvgStage,
						stateSummary.TotalRecharge,
						stateSummary.TotalExtraction,
						stateSummary.SafeBlocks,
						stateSummary.SemiCriticalBlocks,
						stateSummary.CriticalBlocks,
						stateSummary.OverExploitedBlocks,
					)
					r.Data = stateSummary
					
					// Add chart data for state breakdown
					r.Chart = &models.ChartPayload{
						Type:  "bar",
						Title: fmt.Sprintf("Block Categories in %s", stateSummary.StateName),
						XAxis: []string{"Safe", "Semi-Critical", "Critical", "Over-Exploited"},
						Series: []models.ChartSeries{
							{
								Name: "Number of Blocks",
								Data: []float64{
									float64(stateSummary.SafeBlocks),
									float64(stateSummary.SemiCriticalBlocks),
									float64(stateSummary.CriticalBlocks),
									float64(stateSummary.OverExploitedBlocks),
								},
							},
						},
					}
					return r, nil
				}
				
				// Fallback to listing districts if summary fails
				districts, err := s.ingres.GetDistricts(ctx, state.StateUUID)
				if err == nil && len(districts) > 0 {
					var districtNames []string
					limit := 10
					for i, d := range districts {
						if i >= limit {
							break
						}
						districtNames = append(districtNames, d.DistrictName)
					}
					r.Text = fmt.Sprintf("I found the State '%s'. It has %d districts. Here are some of them: %s. Please ask for a specific Block (or District) to get more info.", 
						state.StateName, len(districts), strings.Join(districtNames, ", "))
					return r, nil
				}
				r.Text = fmt.Sprintf("I found the State '%s', but I couldn't find any districts in it.", state.StateName)
				return r, nil
			}
		}
	}

	if err != nil || len(blocks) == 0 {
		r.Text = "I couldn't find that block. Please check the spelling or try asking for a district or state instead."
		return r, nil
	}
	block := blocks[0] // Take first match

	// Validate year format
	if !isValidYear(e.Year) {
		r.Text = fmt.Sprintf("Invalid year format '%s'. Please use format like '2024-2025' or '2023-2024'.", e.Year)
		return r, nil
	}

	summary, err := s.ingres.repo.GetAssessmentSummary(ctx, block.BlockUUID, e.Year)
	if err != nil || summary == nil {
		r.Text = fmt.Sprintf("No data found for %s in %s. Available years: 2017-2018 to 2024-2025.", block.BlockName, e.Year)
		return r, nil
	}

	// Handle NULL/zero values gracefully
	rainfallText := "N/A"
	if summary.Rainfall > 0 {
		rainfallText = fmt.Sprintf("%.2f mm", summary.Rainfall)
	}
	
	stageText := "N/A"
	if summary.Stage > 0 {
		stageText = fmt.Sprintf("%.2f%%", summary.Stage)
	}

	r.Text = fmt.Sprintf("📊 **%s Assessment Summary (%s)**\n\n"+
		"🏷️ **Category**: %s\n"+
		"📈 **Stage of Extraction**: %s\n"+
		"🌧️ **Rainfall**: %s\n"+
		"💧 **Total Recharge**: %.2f mcm\n"+
		"⚡ **Total Extraction**: %.2f mcm",
		block.BlockName, e.Year,
		summary.Category,
		stageText,
		rainfallText,
		summary.TotalRecharge,
		summary.TotalExtraction,
	)
	
	r.Data = summary
	return r, nil
}

// isValidYear checks if year is in valid format (YYYY-YYYY)
func isValidYear(year string) bool {
	if year == "" {
		return false
	}
	// Check format: YYYY-YYYY
	parts := strings.Split(year, "-")
	if len(parts) != 2 {
		return false
	}
	// Basic validation
	return len(parts[0]) == 4 && len(parts[1]) == 4
}

func (s *ChatService) handleTrend(ctx context.Context, e Entities, r *models.ChatResponse) (*models.ChatResponse, error) {
	blocks, err := s.ingres.GetBlocksByNames(ctx, e.Locations)
	
	// Fallback: Try joining names if no blocks found
	if len(blocks) == 0 && len(e.Locations) > 0 {
		joinedName := strings.Join(e.Locations, " ")
		moreBlocks, _ := s.ingres.GetBlocksByNames(ctx, []string{joinedName})
		if len(moreBlocks) > 0 {
			blocks = moreBlocks
		} else {
			// Try District
			district, err := s.ingres.GetDistrictByName(ctx, joinedName)
			if err == nil && district != nil {
				r.Text = fmt.Sprintf("I found the District '%s'. Please ask for a specific Block within this district to get trend data.", district.DistrictName)
				return r, nil
			}
			// Try State
			state, err := s.ingres.GetStateByName(ctx, joinedName)
			if err == nil && state != nil {
				r.Text = fmt.Sprintf("I found the State '%s'. Please ask for a specific Block within this state to get trend data.", state.StateName)
				return r, nil
			}
		}
	}

	if err != nil || len(blocks) == 0 {
		r.Text = "Block not found."
		return r, nil
	}
	block := blocks[0]

	trends, err := s.ingres.GetAssessmentTrends(ctx, block.BlockUUID, e.StartYear, e.EndYear)
	if err != nil {
		return nil, err
	}

	r.Text = fmt.Sprintf("Here is the trend for %s from %s to %s.", block.BlockName, e.StartYear, e.EndYear)
	
	// Build Chart
	var years []string
	var recharge []float64
	var extraction []float64

	for _, t := range trends {
		years = append(years, t.Year)
		recharge = append(recharge, t.TotalRecharge)
		extraction = append(extraction, t.TotalExtraction)
	}

	r.Chart = &models.ChartPayload{
		Type:  "line",
		Title: "Groundwater Trends",
		XAxis: years,
		Series: []models.ChartSeries{
			{Name: "Recharge", Data: recharge, Type: "line"},
			{Name: "Extraction", Data: extraction, Type: "line"},
		},
	}
	
	return r, nil
}

func (s *ChatService) handleCompare(ctx context.Context, e Entities, r *models.ChatResponse) (*models.ChatResponse, error) {
	// Validate minimum locations for comparison
	// If SQL query exists, it will be executed in ProcessMessage.
	// If not, and we have < 2 locations, we can still try to generate a comparison if the LLM generated a valid SQL query for it.
	// But if we are here, it means no SQL was generated or we are in the fallback handler.
	
	if len(e.Locations) < 2 {
		// If we have 1 location, maybe compare with a default or ask for another?
		// For now, let's just proceed and see if we can find data, or return a softer prompt.
		if len(e.Locations) == 1 {
			r.Text = fmt.Sprintf("I found %s. Please mention another location to compare it with.", e.Locations[0])
			return r, nil
		}
		r.Text = "Please mention two locations to compare."
		return r, nil
	}

	blocks, err := s.ingres.GetBlocksByNames(ctx, e.Locations)
	if err != nil {
		r.Text = "Error retrieving block data. Please try again."
		return r, nil
	}

	if len(blocks) == 0 {
		r.Text = fmt.Sprintf("I couldn't find any of these blocks: %s. Please check the spelling.", strings.Join(e.Locations, ", "))
		return r, nil
	}

	if len(blocks) < 2 {
		r.Text = fmt.Sprintf("I found only one block (%s). Please provide at least two valid blocks to compare.", blocks[0].BlockName)
		return r, nil
	}

	// Remove duplicates
	uniqueBlocks := make(map[uuid.UUID]models.Block)
	for _, b := range blocks {
		uniqueBlocks[b.BlockUUID] = b
	}

	var uuids []uuid.UUID
	var blockList []models.Block
	for _, b := range uniqueBlocks {
		uuids = append(uuids, b.BlockUUID)
		blockList = append(blockList, b)
	}

	// Validate year
	if !isValidYear(e.Year) {
		r.Text = "Invalid year format. Please use format like '2024-2025'."
		return r, nil
	}

	comparisons, err := s.ingres.GetAssessmentComparison(ctx, uuids, e.Year)
	if err != nil {
		r.Text = "Error retrieving comparison data. Please try again."
		return r, nil
	}

	if len(comparisons) == 0 {
		r.Text = fmt.Sprintf("No data found for the selected blocks in %s.", e.Year)
		return r, nil
	}

	var names []string
	var stages []float64
	var recharges []float64
	var extractions []float64

	for _, c := range comparisons {
		// Find block name
		for _, b := range blockList {
			if b.BlockUUID == c.BlockUUID {
				names = append(names, b.BlockName)
				break
			}
		}
		stages = append(stages, c.Stage)
		recharges = append(recharges, c.TotalRecharge)
		extractions = append(extractions, c.TotalExtraction)
	}

	r.Text = fmt.Sprintf("📊 **Comparison of %d blocks for %s**\n\nBlocks: %s", 
		len(comparisons), e.Year, strings.Join(names, ", "))

	r.Chart = &models.ChartPayload{
		Type:  "bar",
		Title: fmt.Sprintf("Groundwater Comparison (%s)", e.Year),
		XAxis: names,
		Series: []models.ChartSeries{
			{Name: "Stage (%)", Data: stages, Type: "bar"},
			{Name: "Recharge (mcm)", Data: recharges, Type: "bar"},
			{Name: "Extraction (mcm)", Data: extractions, Type: "bar"},
		},
	}

	return r, nil
}

func (s *ChatService) handleRechargeBreakdown(ctx context.Context, e Entities, r *models.ChatResponse) (*models.ChatResponse, error) {
	blocks, err := s.ingres.GetBlocksByNames(ctx, e.Locations)
	
	// Fallback: Try joining names if no blocks found
	if len(blocks) == 0 && len(e.Locations) > 0 {
		joinedName := strings.Join(e.Locations, " ")
		moreBlocks, _ := s.ingres.GetBlocksByNames(ctx, []string{joinedName})
		if len(moreBlocks) > 0 {
			blocks = moreBlocks
		}
	}
	
	if err != nil || len(blocks) == 0 {
		r.Text = "I couldn't find that block. Please check the spelling."
		return r, nil
	}
	block := blocks[0]

	breakdown, err := s.ingres.GetRechargeBreakdown(ctx, block.BlockUUID, e.Year)
	if err != nil {
		return nil, err
	}

	r.Text = fmt.Sprintf("📊 **Recharge Breakdown for %s (%s)**", block.BlockName, e.Year)

	// Show Command vs Non-Command as BAR chart (not pie!)
	if len(breakdown) > 0 {
		item := breakdown[0]
		r.Chart = &models.ChartPayload{
			Type:  "bar",
			Title: fmt.Sprintf("Recharge Distribution - %s", block.BlockName),
			XAxis: []string{"Command Area", "Non-Command Area"},
			Series: []models.ChartSeries{
				{
					Name: "Recharge (mcm)",
					Data: []float64{item.Command, item.NonCommand},
					Type: "bar",
				},
			},
		}
	}
	
	return r, nil
}

func (s *ChatService) handleExtractionBreakdown(ctx context.Context, e Entities, r *models.ChatResponse) (*models.ChatResponse, error) {
	blocks, err := s.ingres.GetBlocksByNames(ctx, e.Locations)
	
	// Fallback: Try joining names if no blocks found
	if len(blocks) == 0 && len(e.Locations) > 0 {
		joinedName := strings.Join(e.Locations, " ")
		moreBlocks, _ := s.ingres.GetBlocksByNames(ctx, []string{joinedName})
		if len(moreBlocks) > 0 {
			blocks = moreBlocks
		}
	}
	
	if err != nil || len(blocks) == 0 {
		r.Text = "I couldn't find that block. Please check the spelling."
		return r, nil
	}
	block := blocks[0]

	breakdown, err := s.ingres.GetExtractionBreakdown(ctx, block.BlockUUID, e.Year)
	if err != nil {
		return nil, err
	}

	r.Text = fmt.Sprintf("📊 **Extraction Breakdown for %s (%s)**", block.BlockName, e.Year)

	if len(breakdown) > 0 {
		item := breakdown[0]
		r.Chart = &models.ChartPayload{
			Type:  "bar",
			Title: fmt.Sprintf("Extraction Distribution - %s", block.BlockName),
			XAxis: []string{"Command Area", "Non-Command Area"},
			Series: []models.ChartSeries{
				{
					Name: "Extraction (mcm)",
					Data: []float64{item.Command, item.NonCommand},
					Type: "bar",
				},
			},
		}
	}
	return r, nil
}

func (s *ChatService) handleDischargeBreakdown(ctx context.Context, e Entities, r *models.ChatResponse) (*models.ChatResponse, error) {
	blocks, err := s.ingres.GetBlocksByNames(ctx, e.Locations)
	if err != nil || len(blocks) == 0 {
		r.Text = "Block not found."
		return r, nil
	}
	block := blocks[0]

	breakdown, err := s.ingres.GetDischargeBreakdown(ctx, block.BlockUUID, e.Year)
	if err != nil {
		return nil, err
	}

	r.Text = fmt.Sprintf("📊 **Discharge Breakdown for %s (%s)**", block.BlockName, e.Year)

	if len(breakdown) > 0 {
		item := breakdown[0]
		r.Chart = &models.ChartPayload{
			Type:  "bar",
			Title: fmt.Sprintf("Discharge Distribution - %s", block.BlockName),
			XAxis: []string{"Command Area", "Non-Command Area"},
			Series: []models.ChartSeries{
				{
					Name: "Discharge (mcm)",
					Data: []float64{item.Command, item.NonCommand},
					Type: "bar",
				},
			},
		}
	}
	return r, nil
}

func (s *ChatService) handleMapCategory(ctx context.Context, e Entities, r *models.ChatResponse) (*models.ChatResponse, error) {
	if e.Category == "" {
		r.Text = "Which category? (Safe, Critical, Semi-Critical, Over-Exploited)"
		return r, nil
	}

	blocks, err := s.ingres.GetBlocksByCategory(ctx, e.Category)
	if err != nil {
		return nil, err
	}

	r.Text = fmt.Sprintf("Found %d blocks in %s category.", len(blocks), e.Category)

	// Build GeoJSON FeatureCollection
	features := []interface{}{}
	for _, b := range blocks {
		// Assuming b.GeomGeoJSON is raw JSON bytes
		// We need to unmarshal it or just embed it.
		// Since MapPayload.GeoJSON is interface{}, we can pass a struct or map.
		// Let's construct a simple Feature.
		var geom interface{}
		if len(b.GeomGeoJSON) > 0 {
			if err := json.Unmarshal(b.GeomGeoJSON, &geom); err != nil {
				fmt.Printf("Error unmarshaling geometry for block %s: %v\n", b.BlockName, err)
				continue
			}
		}

		feature := map[string]interface{}{
			"type": "Feature",
			"properties": map[string]interface{}{
				"name": b.BlockName,
				"uuid": b.BlockUUID,
			},
			"geometry": geom,
		}
		features = append(features, feature)
	}

	r.Map = &models.MapPayload{
		Title: fmt.Sprintf("%s Blocks", e.Category),
		GeoJSON: map[string]interface{}{
			"type":     "FeatureCollection",
			"features": features,
		},
	}

	return r, nil
}

func (s *ChatService) handleListBlocks(ctx context.Context, e Entities, r *models.ChatResponse) (*models.ChatResponse, error) {
	// List blocks based on criteria (e.g., rainfall < 500, stage > 90)
	
	var blocks []models.Block
	var summaries []models.AssessmentSummary
	var err error
	
	// Extract location filter if specified
	var locationFilter string
	if len(e.Locations) > 0 {
		locationFilter = strings.ToLower(strings.Join(e.Locations, " "))
	}
	
	switch e.Metric {
	case "rainfall":
		summaries, err = s.ingres.repo.GetBlocksByRainfall(ctx, e.Threshold, e.Operator, e.Year)
	case "stage", "extraction":
		summaries, err = s.ingres.repo.GetBlocksByStage(ctx, e.Threshold, e.Operator, e.Year)
	case "category":
		blocks, err = s.ingres.GetBlocksByCategory(ctx, e.Category)
		if err == nil && len(blocks) > 0 {
			var blockNames []string
			for _, b := range blocks {
				blockNames = append(blockNames, b.BlockName)
			}
			r.Text = fmt.Sprintf("Found %d blocks with category '%s': %s", 
				len(blocks), e.Category, strings.Join(blockNames[:min(10, len(blockNames))], ", "))
			if len(blocks) > 10 {
				r.Text += fmt.Sprintf(" and %d more...", len(blocks)-10)
			}
			return r, nil
		}
	default:
		// Check if we have a location to list blocks for
		if len(e.Locations) > 0 {
			locationName := strings.Join(e.Locations, " ")
			
			// Try District
			district, err := s.ingres.GetDistrictByName(ctx, locationName)
			if err == nil && district != nil {
				blocks, err := s.ingres.GetBlocks(ctx, district.DistrictUUID)
				if err == nil && len(blocks) > 0 {
					var names []string
					for _, b := range blocks {
						names = append(names, b.BlockName)
					}
					// Limit to 50 blocks
					displayNames := names
					if len(names) > 50 {
						displayNames = names[:50]
					}
					
					r.Text = fmt.Sprintf("Here are the blocks in %s District (%d total):\n\n%s", 
						district.DistrictName, len(blocks), strings.Join(displayNames, ", "))
					if len(names) > 50 {
						r.Text += fmt.Sprintf("\n\n...and %d more.", len(names)-50)
					}
					return r, nil
				}
				r.Text = fmt.Sprintf("I found the District '%s', but it has no blocks listed.", district.DistrictName)
				return r, nil
			}
			
			// Try State
			state, err := s.ingres.GetStateByName(ctx, locationName)
			if err == nil && state != nil {
				// List districts for state
				districts, err := s.ingres.GetDistricts(ctx, state.StateUUID)
				if err == nil && len(districts) > 0 {
					var names []string
					for _, d := range districts {
						names = append(names, d.DistrictName)
					}
					r.Text = fmt.Sprintf("Here are the districts in %s (%d total):\n\n%s\n\nPlease ask for a specific district to see its blocks.", 
						state.StateName, len(districts), strings.Join(names, ", "))
					return r, nil
				}
			}
		}

		r.Text = "Please specify a metric like rainfall, stage, or extraction, or a valid location (District/State)."
		return r, nil
	}

	if err != nil {
		r.Text = fmt.Sprintf("Error finding blocks: %v", err)
		return r, nil
	}

	if len(summaries) == 0 {
		r.Text = fmt.Sprintf("No blocks found with %s %s %.2f", e.Metric, e.Operator, e.Threshold)
		return r, nil
	}

	// Get block details and filter by location if specified
	var blockNames []string
	var values []float64
	for _, summary := range summaries {
		block, _ := s.ingres.repo.GetBlockByUUID(ctx, summary.BlockUUID)
		if block != nil {
			// Apply location filter if specified
			if locationFilter != "" {
				blockNameLower := strings.ToLower(block.BlockName)
				// Get district and state info
				district, _ := s.ingres.repo.GetDistrictByUUID(ctx, block.DistrictUUID)
				state, _ := s.ingres.repo.GetStateByUUID(ctx, block.StateUUID)
				
				// Check if block, district, or state matches the filter
				matchFound := strings.Contains(blockNameLower, locationFilter)
				if !matchFound && district != nil {
					matchFound = strings.Contains(strings.ToLower(district.DistrictName), locationFilter)
				}
				if !matchFound && state != nil {
					matchFound = strings.Contains(strings.ToLower(state.StateName), locationFilter)
				}
				
				if !matchFound {
					continue // Skip this block
				}
			}
			
			blockNames = append(blockNames, block.BlockName)
			if e.Metric == "rainfall" {
				values = append(values, summary.Rainfall)
			} else {
				values = append(values, summary.Stage)
			}
		}
	}

	r.Text = fmt.Sprintf("Found %d blocks where %s %s %.2f. Here are some: %s", 
		len(summaries), e.Metric, e.Operator, e.Threshold, 
		strings.Join(blockNames[:min(5, len(blockNames))], ", "))

	// Create chart
	r.Chart = &models.ChartPayload{
		Type:  "bar",
		Title: fmt.Sprintf("Blocks by %s %s %.2f", e.Metric, e.Operator, e.Threshold),
		XAxis: blockNames[:min(20, len(blockNames))],
		Series: []models.ChartSeries{
			{Name: strings.Title(e.Metric), Data: values[:min(20, len(values))], Type: "bar"},
		},
	}
	
	r.Data = summaries
	return r, nil
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

func (s *ChatService) handleListDistricts(ctx context.Context, e Entities, r *models.ChatResponse) (*models.ChatResponse, error) {
	// If location specified, get districts within that state
	if len(e.Locations) > 0 {
		// Try to find state by name
		states, err := s.ingres.repo.GetAllStates(ctx)
		if err != nil {
			r.Text = "Sorry, I encountered an error fetching states data."
			return r, err
		}
		
		var targetState *models.State
		stateName := strings.ToLower(e.Locations[0])
		for _, state := range states {
			if strings.Contains(strings.ToLower(state.StateName), stateName) {
				targetState = &state
				break
			}
		}
		
		if targetState == nil {
			r.Text = fmt.Sprintf("I couldn't find a state matching '%s'. Please check the spelling and try again.", e.Locations[0])
			return r, nil
		}
		
		// Get districts for this state
		districts, err := s.ingres.repo.GetDistrictsByState(ctx, targetState.StateUUID)
		if err != nil {
			r.Text = "Sorry, I encountered an error fetching districts data."
			return r, err
		}
		
		if len(districts) == 0 {
			r.Text = fmt.Sprintf("No districts found in %s.", targetState.StateName)
			return r, nil
		}
		
		// Build response text
		var districtNames []string
		for _, d := range districts {
			districtNames = append(districtNames, d.DistrictName)
		}
		
		r.Text = fmt.Sprintf("**Districts in %s** (%d total):\n\n%s", 
			targetState.StateName, 
			len(districts), 
			strings.Join(districtNames, ", "))
		r.Data = districts
		
		return r, nil
	}
	
	// No location specified - list all districts (might be too many, limit it)
	states, err := s.ingres.repo.GetAllStates(ctx)
	if err != nil {
		r.Text = "Sorry, I encountered an error fetching data."
		return r, err
	}
	
	var stateNames []string
	for _, s := range states {
		stateNames = append(stateNames, s.StateName)
	}

	r.Text = fmt.Sprintf("Please specify a state.\n\nAvailable states: %s", 
		strings.Join(stateNames, ", "))
	
	return r, nil
}

func (s *ChatService) handleListStates(ctx context.Context, e Entities, r *models.ChatResponse) (*models.ChatResponse, error) {
	states, err := s.ingres.repo.GetAllStates(ctx)
	if err != nil {
		r.Text = "Sorry, I encountered an error fetching states data."
		return r, err
	}
	
	if len(states) == 0 {
		r.Text = "No states found in the database."
		return r, nil
	}
	
	var stateNames []string
	for _, state := range states {
		stateNames = append(stateNames, state.StateName)
	}
	
	r.Text = fmt.Sprintf("**All States in India** (%d total):\n\n%s", 
		len(states), 
		strings.Join(stateNames, ", "))
	r.Data = states
	
	return r, nil
}
