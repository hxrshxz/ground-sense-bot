package services

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"github.com/hxrshxz/ground-sense-bot/backend/internal/models"
)

type ChatService struct {
	nlp    *NLPService
	ingres *IngresService
}

func NewChatService(nlp *NLPService, ingres *IngresService) *ChatService {
	return &ChatService{nlp: nlp, ingres: ingres}
}

func (s *ChatService) ProcessMessage(ctx context.Context, message string) (*models.ChatResponse, error) {
	intent, entities, sqlQuery := s.nlp.ParseMessage(message)
	fmt.Printf("DEBUG: Intent=%s, Entities=%+v, SQL=%s\n", intent, entities, sqlQuery)
	
	response := &models.ChatResponse{
		Intent: string(intent),
	}

	// If SQL is present, execute it and generate visualization
	if sqlQuery != "" {
		results, err := s.ingres.repo.RunRawQuery(ctx, sqlQuery)
		if err == nil && len(results) > 0 {
			// Generate Visualization
			vizJSON, explanation, err := s.nlp.llm.GenerateVisualization(results, sqlQuery, message)
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
		}
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
	default:
		response.Text = "I'm not sure what you mean. Try asking for a summary, trend, or comparison of a block."
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
			// Try District
			district, err := s.ingres.GetDistrictByName(ctx, joinedName)
			if err == nil && district != nil {
				blocks, err := s.ingres.GetBlocks(ctx, district.DistrictUUID)
				if err == nil && len(blocks) > 0 {
					var blockNames []string
					limit := 10
					for i, b := range blocks {
						if i >= limit {
							break
						}
						blockNames = append(blockNames, b.BlockName)
					}
					r.Text = fmt.Sprintf("I found the District '%s'. It has %d blocks. Here are some of them: %s. Please ask for a specific Block to get detailed data.", 
						district.DistrictName, len(blocks), strings.Join(blockNames, ", "))
					return r, nil
				}
				r.Text = fmt.Sprintf("I found the District '%s', but I couldn't find any blocks in it.", district.DistrictName)
				return r, nil
			}
			// Try State
			state, err := s.ingres.GetStateByName(ctx, joinedName)
			if err == nil && state != nil {
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
		r.Text = "I couldn't find that block. Please check the spelling."
		return r, nil
	}
	block := blocks[0] // Take first match

	summary, err := s.ingres.repo.GetAssessmentSummary(ctx, block.BlockUUID, e.Year)
	if err != nil || summary == nil {
		r.Text = fmt.Sprintf("No data found for %s in %s.", block.BlockName, e.Year)
		return r, nil
	}

	r.Text = fmt.Sprintf("In %s (%s), %s has a stage of extraction of %.2f%% (%s). Rainfall was %.2f mm.",
		e.Year, block.BlockName, block.BlockName, summary.Stage, summary.Category, summary.Rainfall)
	
	r.Data = summary
	return r, nil
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
	blocks, err := s.ingres.GetBlocksByNames(ctx, e.Locations)
	if err != nil || len(blocks) < 2 {
		r.Text = "I need at least two valid blocks to compare."
		return r, nil
	}

	var uuids []uuid.UUID // Fix: Use uuid.UUID type
	for _, b := range blocks {
		uuids = append(uuids, b.BlockUUID)
	}

	// Fix: Pass []uuid.UUID to GetAssessmentComparison
	comparisons, err := s.ingres.GetAssessmentComparison(ctx, uuids, e.Year)
	if err != nil {
		return nil, err
	}

	r.Text = fmt.Sprintf("Comparison of %d blocks for %s.", len(comparisons), e.Year)

	var names []string
	var stages []float64

	for _, c := range comparisons {
		// Find block name (inefficient but works for small N)
		for _, b := range blocks {
			if b.BlockUUID == c.BlockUUID {
				names = append(names, b.BlockName)
				break
			}
		}
		stages = append(stages, c.Stage)
	}

	r.Chart = &models.ChartPayload{
		Type:  "bar",
		Title: "Stage of Extraction Comparison",
		XAxis: names,
		Series: []models.ChartSeries{
			{Name: "Stage (%)", Data: stages, Type: "bar"},
		},
	}

	return r, nil
}

func (s *ChatService) handleRechargeBreakdown(ctx context.Context, e Entities, r *models.ChatResponse) (*models.ChatResponse, error) {
	blocks, err := s.ingres.GetBlocksByNames(ctx, e.Locations)
	if err != nil || len(blocks) == 0 {
		r.Text = "Block not found."
		return r, nil
	}
	block := blocks[0]

	breakdown, err := s.ingres.GetRechargeBreakdown(ctx, block.BlockUUID, e.Year)
	if err != nil {
		return nil, err
	}

	r.Text = fmt.Sprintf("Recharge breakdown for %s in %s.", block.BlockName, e.Year)

	// Aggregate total for chart (simplified)
	// In reality, we might want a pie chart of sources.
	// But our breakdown table has Source, Command, NonCommand, Total.
	// Let's just show Total per Source.
	// Actually, the source is usually "Rainfall", "Canal", etc.
	// But in our current ingestion, we only have "Total" source with command/non-command splits.
	// So let's show Command vs Non-Command pie chart.
	
	if len(breakdown) > 0 {
		item := breakdown[0] // Assuming one row for "Total" source
		r.Chart = &models.ChartPayload{
			Type:  "pie",
			Title: "Recharge Distribution (Command vs Non-Command)",
			XAxis: []string{"Command Area", "Non-Command Area"},
			Series: []models.ChartSeries{
				{
					Name: "Recharge",
					Data: []float64{item.Command, item.NonCommand},
				},
			},
		}
	}
	
	return r, nil
}

func (s *ChatService) handleExtractionBreakdown(ctx context.Context, e Entities, r *models.ChatResponse) (*models.ChatResponse, error) {
	// Similar to Recharge
	blocks, err := s.ingres.GetBlocksByNames(ctx, e.Locations)
	if err != nil || len(blocks) == 0 {
		r.Text = "Block not found."
		return r, nil
	}
	block := blocks[0]

	breakdown, err := s.ingres.GetExtractionBreakdown(ctx, block.BlockUUID, e.Year)
	if err != nil {
		return nil, err
	}

	r.Text = fmt.Sprintf("Extraction breakdown for %s in %s.", block.BlockName, e.Year)

	if len(breakdown) > 0 {
		item := breakdown[0]
		r.Chart = &models.ChartPayload{
			Type:  "pie",
			Title: "Extraction Distribution (Command vs Non-Command)",
			XAxis: []string{"Command Area", "Non-Command Area"},
			Series: []models.ChartSeries{
				{
					Name: "Extraction",
					Data: []float64{item.Command, item.NonCommand},
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

	r.Text = fmt.Sprintf("Discharge breakdown for %s in %s.", block.BlockName, e.Year)

	if len(breakdown) > 0 {
		item := breakdown[0]
		r.Chart = &models.ChartPayload{
			Type:  "pie",
			Title: "Discharge Distribution (Command vs Non-Command)",
			XAxis: []string{"Command Area", "Non-Command Area"},
			Series: []models.ChartSeries{
				{
					Name: "Discharge",
					Data: []float64{item.Command, item.NonCommand},
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
