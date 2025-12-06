package services

import (
	"context"
	"encoding/json"
	"fmt"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/hxrshxz/ground-sense-bot/backend/internal/models"
	// Added repositories import
)

// ConversationEntry stores a single exchange in conversation history
type ConversationEntry struct {
	Timestamp time.Time `json:"timestamp"`
	UserQuery string    `json:"user_query"`
	BotResponse string  `json:"bot_response"`
	Intent    string    `json:"intent"`
	Locations []string  `json:"locations"`
}

// UserSession stores context for a user's ongoing conversation
type UserSession struct {
	LastEntities        Entities
	LastIntent          string
	LastQuery           string
	ConversationHistory []ConversationEntry
	MaxHistoryLength    int
}

// AddToHistory adds a conversation entry to the session
func (s *UserSession) AddToHistory(userQuery, botResponse, intent string, locations []string) {
	if s.MaxHistoryLength == 0 {
		s.MaxHistoryLength = 10
	}
	
	entry := ConversationEntry{
		Timestamp:   time.Now(),
		UserQuery:   userQuery,
		BotResponse: botResponse,
		Intent:      intent,
		Locations:   locations,
	}
	
	s.ConversationHistory = append(s.ConversationHistory, entry)
	
	// Keep only last N entries
	if len(s.ConversationHistory) > s.MaxHistoryLength {
		s.ConversationHistory = s.ConversationHistory[len(s.ConversationHistory)-s.MaxHistoryLength:]
	}
}

// GetRecentContext returns formatted recent conversation context
func (s *UserSession) GetRecentContext(limit int) string {
	if len(s.ConversationHistory) == 0 {
		return ""
	}
	
	start := 0
	if len(s.ConversationHistory) > limit {
		start = len(s.ConversationHistory) - limit
	}
	
	var builder strings.Builder
	builder.WriteString("Recent conversation context:\n")
	
	for _, entry := range s.ConversationHistory[start:] {
		builder.WriteString(fmt.Sprintf("USER: %s\n", entry.UserQuery))
		if len(entry.BotResponse) > 200 {
			builder.WriteString(fmt.Sprintf("BOT: %s...\n", entry.BotResponse[:200]))
		} else {
			builder.WriteString(fmt.Sprintf("BOT: %s\n", entry.BotResponse))
		}
	}
	
	return builder.String()
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

// Helper struct to parse LLM visualization JSON
type visualizationPayload struct {
	Type        string `json:"type"`
	Title       string `json:"title"`
	Explanation string `json:"explanation"`
	XAxis       interface{} `json:"xAxis"`
	Series      []struct {
		Name string        `json:"name"`
		Data []interface{} `json:"data"`
	} `json:"series"`
	PieData []struct {
		Name  string  `json:"name"`
		Value float64 `json:"value"`
	} `json:"pieData"`
	Timeline *struct {
		Data         []string `json:"data"`
		AutoPlay     bool     `json:"autoPlay"`
		PlayInterval int      `json:"playInterval"`
	} `json:"timeline"`
	TimelineOptions []struct {
		Title  string `json:"title"`
		Series []struct {
			Data []interface{} `json:"data"`
		} `json:"series"`
	} `json:"timelineOptions"`
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

	fmt.Println("\n" + strings.Repeat("=", 80))
	fmt.Printf("📨 NEW USER MESSAGE | User: %s | Time: %s\n", username, time.Now().Format("15:04:05"))
	fmt.Printf("💬 Query: \"%s\"\n", message)
	fmt.Println(strings.Repeat("=", 80))

	// Get or create session
	s.mu.Lock()
	if s.sessions == nil {
		s.sessions = make(map[string]*UserSession)
	}
	session, exists := s.sessions[username]
	if !exists {
		fmt.Printf("🆕 Creating new session for user: %s\n", username)
		session = &UserSession{
			MaxHistoryLength: 10,
			ConversationHistory: make([]ConversationEntry, 0),
		}
		s.sessions[username] = session
	} else {
		fmt.Printf("♻️  Using existing session (History: %d entries)\n", len(session.ConversationHistory))
	}
	s.mu.Unlock()

	// Add user message to LLM conversation history for context
	if s.nlp.llm != nil {
		s.nlp.llm.AddToHistory("user", message)
	}

	fmt.Println("\n🧠 AI PROCESSING PIPELINE")
	fmt.Println("├─ Step 1: Intent Classification & Entity Extraction...")
	intent, entities, sqlQuery := s.nlp.ParseMessage(message)
	fmt.Printf("├─ ✅ Intent Detected: %s\n", intent)
	fmt.Printf("├─ 📍 Locations Found: %v\n", entities.Locations)
	fmt.Printf("├─ 📅 Year: %s\n", entities.Year)
	if sqlQuery != "" {
		fmt.Printf("├─ 🗄️  Dynamic SQL Generated: %s\n", sqlQuery[:min(100, len(sqlQuery))]+(func() string { if len(sqlQuery) > 100 { return "..." }; return "" })())
	}
	
	// Context Merging Logic
	// If new entities are missing locations but we have them in session, and the user implies context
	// (e.g., "what about...", "list blocks there", "trend for it")
	contextUsed := false
	if len(entities.Locations) == 0 && len(session.LastEntities.Locations) > 0 {
		// Check for context clues or just default to previous location if it makes sense
		// Simple heuristic: If intent requires location (Trend, Compare, ListBlocks) and we have none, use previous.
		if intent == IntentTrend || intent == IntentCompare || intent == IntentListBlocks || intent == IntentSummary {
			fmt.Printf("├─ 🔗 Context Merging: Using previous location %v\n", session.LastEntities.Locations)
			entities.Locations = session.LastEntities.Locations
			contextUsed = true
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

	fmt.Printf("DEBUG: Intent=%s, Entities=%+v, SQL=%s, ContextUsed=%v\n", intent, entities, sqlQuery, contextUsed)
	
	response := &models.ChatResponse{
		Intent: string(intent),
	}

	// If SQL is present, execute it and generate visualization
	// BUT skip this path for TREND intent (handled by handleTrend below)
	if sqlQuery != "" && intent != IntentTrend {
		fmt.Printf("DEBUG: Executing SQL: %s\n", sqlQuery)
		results, err := s.ingres.repo.RunRawQuery(ctx, sqlQuery)
		
		// Handle SQL execution errors
		if err != nil {
			fmt.Printf("ERROR: SQL execution failed: %v\n", err)
			response.Text = "I encountered an error executing your query. Please try rephrasing your question."
			
			// Track in history
			s.mu.Lock()
			session.AddToHistory(message, response.Text, string(intent), entities.Locations)
			s.mu.Unlock()
			
			return response, nil
		}
		
		// Handle empty results
		if len(results) == 0 {
			fmt.Println("├─ ⚠️  No results found in database")
			response.Text = "No data found matching your criteria. Please try different parameters or check the location name."
			
			// Track in history
			s.mu.Lock()
			session.AddToHistory(message, response.Text, string(intent), entities.Locations)
			s.mu.Unlock()
			
			return response, nil
		}
		
		// Use LLM to pick chart shape but keep visuals hardcoded on frontend
		fmt.Printf("├─ ✅ Retrieved %d rows from database\n", len(results))
		fmt.Println("├─ Step 3: Chart Generation with LLM")
		response.Text = fmt.Sprintf("Here is the data you requested (%d results).", len(results))
		response.Data = results

		chartPayload, vizText := s.buildChartWithLLM(results, sqlQuery, message)
		if chartPayload != nil {
			fmt.Printf("├─ 📊 Chart Type: %s\n", chartPayload.Type)
			response.Chart = chartPayload
			if vizText != "" {
				response.Text = vizText
			}
		} else {
			// Fallback to simple bar if LLM mapping fails
			fallbackChart := buildSimpleChart(results)
			if fallbackChart != nil {
				response.Chart = fallbackChart
			}
		}

		// Track in conversation history
		s.mu.Lock()
		session.AddToHistory(message, response.Text, string(intent), entities.Locations)
		s.mu.Unlock()
		
		// Add bot response to LLM history
		if s.nlp.llm != nil {
			s.nlp.llm.AddToHistory("assistant", response.Text)
		}

		return response, nil
	}
	
	// Process with intent handlers
	fmt.Println("\n├─ Step 2: Intent Handler Routing")
	fmt.Printf("├─ 🎯 Routing to handler: %s\n", intent)
	var handlerResult *models.ChatResponse
	var handlerErr error
	
	switch intent {
	case IntentSummary:
		fmt.Println("├─ 📋 Executing Summary Handler...")
		handlerResult, handlerErr = s.handleSummary(ctx, entities, response)
	case IntentTrend:
		fmt.Println("├─ 📈 Executing Trend Analysis Handler...")
		handlerResult, handlerErr = s.handleTrend(ctx, entities, response)
	case IntentCompare:
		fmt.Println("├─ ⚖️  Executing Comparison Handler...")
		handlerResult, handlerErr = s.handleCompare(ctx, entities, response)
	case IntentRechargeBreakdown:
		handlerResult, handlerErr = s.handleRechargeBreakdown(ctx, entities, response)
	case IntentExtractionBreakdown:
		handlerResult, handlerErr = s.handleExtractionBreakdown(ctx, entities, response)
	case IntentDischargeBreakdown:
		handlerResult, handlerErr = s.handleDischargeBreakdown(ctx, entities, response)
	case IntentMapCategory:
		handlerResult, handlerErr = s.handleMapCategory(ctx, entities, response)
	case IntentListBlocks:
		handlerResult, handlerErr = s.handleListBlocks(ctx, entities, response)
	case IntentListDistricts:
		handlerResult, handlerErr = s.handleListDistricts(ctx, entities, response)
	case IntentListStates:
		handlerResult, handlerErr = s.handleListStates(ctx, entities, response)
	case IntentTopRanking:
		handlerResult, handlerErr = s.handleTopRanking(ctx, entities, response)
	case IntentCategoryDistribution, IntentDeficitAnalysis, IntentChangeAnalysis:
		// These intents use dynamic SQL path above
		// If we reach here, it means dynamic SQL failed
		response.Text = "I understand you're looking for " + string(intent) + " analysis. Please try rephrasing your question."
		handlerResult = response
	default:
		response.Text = "I'm not sure what you mean. Try asking for a summary, trend, comparison, ranking, distribution, or recharge/extraction breakdowns."
		handlerResult = response
	}
	
	// Track in conversation history
	if handlerResult != nil {
		fmt.Println("\n📤 RESPONSE SUMMARY")
		fmt.Printf("├─ Intent: %s\n", intent)
		if handlerResult.Chart != nil {
			fmt.Printf("├─ Chart Type: %s\n", handlerResult.Chart.Type)
			fmt.Printf("├─ Chart Title: %s\n", handlerResult.Chart.Title)
		}
		if handlerResult.Map != nil {
			fmt.Printf("├─ Map Data: %d locations\n", len(handlerResult.Map.Features))
		}
		fmt.Printf("├─ Response Length: %d characters\n", len(handlerResult.Text))
		fmt.Println(strings.Repeat("=", 80) + "\n")
		
		s.mu.Lock()
		session.AddToHistory(message, handlerResult.Text, string(intent), entities.Locations)
		s.mu.Unlock()
		
		// Add bot response to LLM history
		if s.nlp.llm != nil && handlerResult.Text != "" {
			s.nlp.llm.AddToHistory("assistant", handlerResult.Text)
		}
	}
	
	return handlerResult, handlerErr
}

// buildChartWithLLM calls the LLM visualization generator and maps it into ChartPayload
func (s *ChatService) buildChartWithLLM(results []map[string]interface{}, sqlQuery string, userMessage string) (*models.ChartPayload, string) {
	// Call LLM
	vizJSON, _, err := s.nlp.llm.GenerateVisualization(results, sqlQuery, userMessage)
	if err != nil {
		fmt.Printf("ERROR: LLM visualization failed: %v\n", err)
		return nil, ""
	}

	var payload visualizationPayload
	if err := json.Unmarshal([]byte(vizJSON), &payload); err != nil {
		fmt.Printf("ERROR: Visualization JSON unmarshal failed: %v | json=%s\n", err, vizJSON)
		return nil, ""
	}

	chart := &models.ChartPayload{
		Type:        payload.Type,
		Title:       payload.Title,
		Explanation: payload.Explanation,
		XAxis:       convertXAxis(payload.XAxis),
	}

	// Map series -> []ChartSeries
	for _, srs := range payload.Series {
		chart.Series = append(chart.Series, models.ChartSeries{
			Name: srs.Name,
			Data: convertNumberSlice(srs.Data),
		})
	}

	// Pie data
	for _, p := range payload.PieData {
		chart.PieData = append(chart.PieData, models.PieDatum{Name: p.Name, Value: p.Value})
	}

	// Timeline
	if payload.Timeline != nil {
		chart.Timeline = &models.TimelinePayload{
			Data:         payload.Timeline.Data,
			AutoPlay:     payload.Timeline.AutoPlay,
			PlayInterval: payload.Timeline.PlayInterval,
		}
	}
	if len(payload.TimelineOptions) > 0 {
		for _, opt := range payload.TimelineOptions {
			series := make([]models.ChartSeries, 0, len(opt.Series))
			for _, srs := range opt.Series {
				series = append(series, models.ChartSeries{
					Name: "",
					Data: convertNumberSlice(srs.Data),
				})
			}
			chart.TimelineOptions = append(chart.TimelineOptions, models.TimelineOption{
				Title:  opt.Title,
				Series: series,
			})
		}
	}

	// If everything empty, fail back
	if chart.Type == "" || len(chart.Series) == 0 {
		return nil, ""
	}

	return chart, buildVizText(chart)
}

// buildSimpleChart is a fallback bar chart if LLM mapping fails
func buildSimpleChart(results []map[string]interface{}) *models.ChartPayload {
	if len(results) == 0 {
		return nil
	}

	var labels []string
	var values []float64

	for i, row := range results {
		if i >= 10 { // Limit to 10 items for readability
			break
		}
		label := ""
		if v, ok := row["block_name"].(string); ok {
			label = v
		} else if v, ok := row["district_name"].(string); ok {
			label = v
		} else if v, ok := row["state_name"].(string); ok {
			label = v
		} else if v, ok := row["year"].(string); ok {
			label = v
		} else {
			label = fmt.Sprintf("Item %d", i+1)
		}
		labels = append(labels, label)

		val := 0.0
		if v, ok := row["total_extraction"].(float64); ok {
			val = v
		} else if v, ok := row["total_recharge"].(float64); ok {
			val = v
		} else if v, ok := row["stage"].(float64); ok {
			val = v
		} else if v, ok := row["rainfall"].(float64); ok {
			val = v
		}
		values = append(values, val)
	}

	if len(labels) == 0 || len(values) == 0 {
		return nil
	}

	return &models.ChartPayload{
		Type:  "brush-bar",
		Title: "📊 Query Results",
		XAxis: labels,
		Series: []models.ChartSeries{
			{
				Name: "Value",
				Data: values,
			},
		},
	}
}

// convertXAxis supports either []string or { data: []string }
func convertXAxis(x interface{}) interface{} {
	switch t := x.(type) {
	case []interface{}:
		return toStringSlice(t)
	case []string:
		return t
	case map[string]interface{}:
		if data, ok := t["data"].([]interface{}); ok {
			return map[string]interface{}{ "data": toStringSlice(data) }
		}
		if data, ok := t["data"].([]string); ok {
			return map[string]interface{}{ "data": data }
		}
	}
	return nil
}

// convertNumberSlice converts []interface{} to []float64 safely
func convertNumberSlice(arr []interface{}) []float64 {
	out := make([]float64, 0, len(arr))
	for _, v := range arr {
		switch n := v.(type) {
		case float64:
			out = append(out, n)
		case float32:
			out = append(out, float64(n))
		case int:
			out = append(out, float64(n))
		case int64:
			out = append(out, float64(n))
		case json.Number:
			f, _ := n.Float64()
			out = append(out, f)
		case string:
			if f, err := strconv.ParseFloat(n, 64); err == nil {
				out = append(out, f)
			}
		}
	}
	return out
}

// toStringSlice converts []interface{} -> []string
func toStringSlice(arr []interface{}) []string {
	out := make([]string, 0, len(arr))
	for _, v := range arr {
		switch s := v.(type) {
		case string:
			out = append(out, s)
		case fmt.Stringer:
			out = append(out, s.String())
		default:
			out = append(out, fmt.Sprintf("%v", v))
		}
	}
	return out
}

// getCategoryFromCounts determines the overall category based on block distribution
func getCategoryFromCounts(safe, semiCritical, critical, overExploited int) string {
	total := safe + semiCritical + critical + overExploited
	if total == 0 {
		return "Unknown"
	}
	
	// Calculate percentages
	overExploitedPct := float64(overExploited) / float64(total) * 100
	criticalPct := float64(critical) / float64(total) * 100
	semiCriticalPct := float64(semiCritical) / float64(total) * 100
	
	// Determine overall category based on predominant status
	if overExploitedPct > 30 {
		return "over_exploited"
	} else if criticalPct+overExploitedPct > 40 {
		return "critical"
	} else if semiCriticalPct+criticalPct+overExploitedPct > 50 {
		return "semi_critical"
	}
	return "safe"
}

// buildVizText returns a concise text if explanation exists
func buildVizText(c *models.ChartPayload) string {
	if c == nil {
		return ""
	}
	if c.Explanation != "" {
		return c.Explanation
	}
	return "Here is the chart based on the data."
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
					// Build descriptive text
					stageStatus := "sustainable"
					if districtSummary.AvgStage > 100 {
						stageStatus = "over-exploited on average"
					} else if districtSummary.AvgStage > 70 {
						stageStatus = "approaching critical levels"
					}

					r.Text = fmt.Sprintf("Here's the groundwater assessment for **%s District** in **%s**. "+
						"With %d blocks, the average extraction stage is %.1f%%, which is %s.",
						districtSummary.DistrictName, e.Year, districtSummary.TotalBlocks, 
						districtSummary.AvgStage, stageStatus)
					r.Data = districtSummary
					
					// Add metrics-card for district
					r.Chart = &models.ChartPayload{
						Type:  "metrics-card",
						Title: fmt.Sprintf("%s District Groundwater Assessment", districtSummary.DistrictName),
						MetricsData: &models.MetricsData{
							LocationName:        districtSummary.DistrictName,
							LocationType:        "district",
							Year:                e.Year,
							Category:            getCategoryFromCounts(districtSummary.SafeBlocks, districtSummary.SemiCriticalBlocks, districtSummary.CriticalBlocks, districtSummary.OverExploitedBlocks),
							Rainfall:            districtSummary.AvgRainfall,
							TotalRecharge:       districtSummary.TotalRecharge,
							TotalExtraction:     districtSummary.TotalExtraction,
							TotalExtractable:    districtSummary.TotalRecharge * 0.9, // Approximation: ~90% of recharge
							NaturalDischarge:    districtSummary.TotalRecharge * 0.1, // Approximation: ~10% of recharge
							Stage:               districtSummary.AvgStage,
							TotalBlocks:         districtSummary.TotalBlocks,
							SafeBlocks:          districtSummary.SafeBlocks,
							SemiCriticalBlocks:  districtSummary.SemiCriticalBlocks,
							CriticalBlocks:      districtSummary.CriticalBlocks,
							OverExploitedBlocks: districtSummary.OverExploitedBlocks,
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
				
				// No blocks found - suggest alternatives
				r.Text = fmt.Sprintf("⚠️ **District Found: %s**\n\nUnfortunately, there are no blocks with groundwater data available for this district in our database.\n\n"+
					"🔍 **Try these instead:**\n"+
					"• \"Show me Punjab state status\"\n"+
					"• \"What is the groundwater status of Prakasam district?\"\n"+
					"• \"Show me Nalgonda district\"\n"+
					"• \"List all districts in Andhra Pradesh\"\n\n"+
					"💡 *Tip: Most block-level data is available for Andhra Pradesh, Telangana, and other major states.*", 
					district.DistrictName)
				return r, nil
			}
			
			// Try State - now with aggregated data!
			state, err := s.ingres.GetStateByName(ctx, joinedName)
			if err == nil && state != nil {
				// Get aggregated state summary
				stateSummary, err := s.ingres.repo.GetStateSummary(ctx, state.StateUUID, e.Year)
				if err == nil && stateSummary != nil {
					// Build descriptive text
					stageStatus := "sustainable"
					if stateSummary.AvgStage > 100 {
						stageStatus = "over-exploited on average"
					} else if stateSummary.AvgStage > 70 {
						stageStatus = "approaching critical levels"
					}

					r.Text = fmt.Sprintf("Here's the groundwater assessment for **%s** in **%s**. "+
						"With %d blocks, the average extraction stage is %.1f%%, which is %s.",
						stateSummary.StateName, e.Year, stateSummary.TotalBlocks, 
						stateSummary.AvgStage, stageStatus)
					r.Data = stateSummary
					
					// Add metrics-card for state
					r.Chart = &models.ChartPayload{
						Type:  "metrics-card",
						Title: fmt.Sprintf("%s Groundwater Assessment", stateSummary.StateName),
						MetricsData: &models.MetricsData{
							LocationName:        stateSummary.StateName,
							LocationType:        "state",
							Year:                e.Year,
							Category:            getCategoryFromCounts(stateSummary.SafeBlocks, stateSummary.SemiCriticalBlocks, stateSummary.CriticalBlocks, stateSummary.OverExploitedBlocks),
							Rainfall:            stateSummary.AvgRainfall,
							TotalRecharge:       stateSummary.TotalRecharge,
							TotalExtraction:     stateSummary.TotalExtraction,
							TotalExtractable:    stateSummary.TotalRecharge * 0.9, // Approximation: ~90% of recharge
							NaturalDischarge:    stateSummary.TotalRecharge * 0.1, // Approximation: ~10% of recharge
							Stage:               stateSummary.AvgStage,
							TotalBlocks:         stateSummary.TotalBlocks,
							SafeBlocks:          stateSummary.SafeBlocks,
							SemiCriticalBlocks:  stateSummary.SemiCriticalBlocks,
							CriticalBlocks:      stateSummary.CriticalBlocks,
							OverExploitedBlocks: stateSummary.OverExploitedBlocks,
						},
					}
					return r, nil
				}
				
					// Fallback - no aggregated data available for this state
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
					r.Text = fmt.Sprintf("⚠️ **No groundwater assessment data available for %s (%s)**\n\n"+
						"This state has %d districts but groundwater assessment data has not been loaded yet.\n\n"+
						"**Available districts**: %s\n\n"+
						"💡 **Try these states with data**: Punjab, Haryana, Uttar Pradesh, Bihar, Rajasthan, Madhya Pradesh, West Bengal, Odisha, Telangana, Andhra Pradesh", 
						state.StateName, e.Year, len(districts), strings.Join(districtNames, ", "))
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

	// Build descriptive text
	stageStatus := "sustainable"
	if summary.Stage > 100 {
		stageStatus = "over-exploited (extraction exceeds recharge)"
	} else if summary.Stage > 70 {
		stageStatus = "approaching critical levels"
	}

	r.Text = fmt.Sprintf("Here's the groundwater assessment data for **%s** in **%s**. "+
		"The extraction stage is at %.1f%%, which is %s.",
		block.BlockName, e.Year, summary.Stage, stageStatus)
	
	// Add metrics-card visualization
	r.Chart = &models.ChartPayload{
		Type:  "metrics-card",
		Title: fmt.Sprintf("%s Groundwater Assessment", block.BlockName),
		MetricsData: &models.MetricsData{
			LocationName:     block.BlockName,
			LocationType:     "block",
			Year:             e.Year,
			Category:         summary.Category,
			Rainfall:         summary.Rainfall,
			TotalRecharge:    summary.TotalRecharge,
			TotalExtraction:  summary.TotalExtraction,
			TotalExtractable: summary.TotalExtractable,
			NaturalDischarge: summary.TotalDischarge,
			Stage:            summary.Stage,
			Availability:     summary.Availability,
		},
	}
	
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
	
	var trends []models.AssessmentSummary
	var locationName string
	var locationType string
	
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
				trends, err = s.ingres.GetDistrictTrends(ctx, district.DistrictUUID, e.StartYear, e.EndYear)
				if err != nil {
					return nil, err
				}
				locationName = district.DistrictName
				locationType = "district"
				
				r.Text = fmt.Sprintf("📈 **Groundwater Trend Analysis: %s District**\n\n"+
					"📅 **Period**: %s → %s\n"+
					"📊 **Data Points**: %d years of historical data\n\n"+
					"*Analyzing recharge vs extraction patterns over time...*",
					locationName, e.StartYear, e.EndYear, len(trends))
				
				// Build trend-card chart and return
				return s.buildTrendCard(trends, locationName, locationType, e.StartYear, e.EndYear, r), nil
			}
			// Try State
			state, err := s.ingres.GetStateByName(ctx, joinedName)
			if err == nil && state != nil {
				trends, err = s.ingres.GetStateTrends(ctx, state.StateUUID, e.StartYear, e.EndYear)
				if err != nil {
					return nil, err
				}
				locationName = state.StateName
				locationType = "state"
				
				r.Text = fmt.Sprintf("📈 **Groundwater Trend Analysis: %s State**\n\n"+
					"📅 **Period**: %s → %s\n"+
					"📊 **Data Points**: %d years of state-level data\n\n"+
					"*Analyzing statewide recharge vs extraction patterns...*",
					locationName, e.StartYear, e.EndYear, len(trends))
				
				// Build trend-card chart and return
				return s.buildTrendCard(trends, locationName, locationType, e.StartYear, e.EndYear, r), nil
			}
		}
	}

	if err != nil || len(blocks) == 0 {
		r.Text = "Location not found. Please specify a valid block, district, or state name."
		return r, nil
	}
	
	block := blocks[0]
	trends, err = s.ingres.GetAssessmentTrends(ctx, block.BlockUUID, e.StartYear, e.EndYear)
	if err != nil {
		return nil, err
	}
	locationName = block.BlockName
	locationType = "block"

	r.Text = fmt.Sprintf("📈 **Groundwater Trend Analysis: %s Block**\n\n"+
		"📅 **Period**: %s → %s\n\n"+
		"*Tracking recharge and extraction patterns over time...*",
		locationName, e.StartYear, e.EndYear)
	
	return s.buildTrendCard(trends, locationName, locationType, e.StartYear, e.EndYear, r), nil
}

// buildTrendCard builds a trend-card visualization for trend analysis
func (s *ChatService) buildTrendCard(trends []models.AssessmentSummary, locationName, locationType, startYear, endYear string, r *models.ChatResponse) *models.ChatResponse {
	// Check if we have any data
	if len(trends) == 0 {
		r.Text = fmt.Sprintf("⚠️ No trend data available for %s. Please try a different location or time period.", locationName)
		return r
	}
	
	// Build data points from trends
	dataPoints := make([]models.TrendDataPoint, 0, len(trends))
	for _, t := range trends {
		dataPoints = append(dataPoints, models.TrendDataPoint{
			Year:       t.Year,
			Recharge:   t.TotalRecharge,
			Extraction: t.TotalExtraction,
			Stage:      t.Stage,
			Rainfall:   t.Rainfall,
			Category:   t.Category,
		})
	}
	
	// Calculate percentage changes (first year to last year)
	var rechargeChange, extractionChange, stageChange float64
	if len(dataPoints) >= 2 {
		first := dataPoints[0]
		last := dataPoints[len(dataPoints)-1]
		
		if first.Recharge > 0 {
			rechargeChange = ((last.Recharge - first.Recharge) / first.Recharge) * 100
		}
		if first.Extraction > 0 {
			extractionChange = ((last.Extraction - first.Extraction) / first.Extraction) * 100
		}
		if first.Stage > 0 {
			stageChange = ((last.Stage - first.Stage) / first.Stage) * 100
		}
	}
	
	// Determine overall trend
	overallTrend := "stable"
	// If recharge increased and extraction decreased, improving
	// If stage significantly decreased (good), improving
	// If stage increased significantly (bad), declining
	if stageChange < -10 || (rechargeChange > 10 && extractionChange < 0) {
		overallTrend = "improving"
	} else if stageChange > 10 || (rechargeChange < -10 && extractionChange > 10) {
		overallTrend = "declining"
	}
	
	// Update text with data count
	if len(dataPoints) == 1 {
		r.Text += fmt.Sprintf("\n\n📊 **Note:** Only data for %s is available.", dataPoints[0].Year)
	}
	
	r.Chart = &models.ChartPayload{
		Type:  "trend-card",
		Title: fmt.Sprintf("Groundwater Trends - %s", locationName),
		TrendData: &models.TrendData{
			LocationName:     locationName,
			LocationType:     locationType,
			StartYear:        startYear,
			EndYear:          endYear,
			DataPoints:       dataPoints,
			RechargeChange:   rechargeChange,
			ExtractionChange: extractionChange,
			StageChange:      stageChange,
			OverallTrend:     overallTrend,
		},
	}
	
	return r
}

// buildTrendChart is a helper function to build trend charts (kept for backward compatibility)
func (s *ChatService) buildTrendChart(trends []models.AssessmentSummary, locationName string, r *models.ChatResponse) *models.ChatResponse {
	// Check if we have any data
	if len(trends) == 0 {
		r.Text = fmt.Sprintf("⚠️ No trend data available for %s. Note: Block-level data is only available for 2024-2025 due to InGRES API limitations. Historical years (2012-2023) only have state-level aggregates which require block data to exist first.", locationName)
		return r
	}
	
	var years []string
	var recharge []float64
	var extraction []float64

	for _, t := range trends {
		years = append(years, t.Year)
		recharge = append(recharge, t.TotalRecharge)
		extraction = append(extraction, t.TotalExtraction)
	}

	// Add note if only one year of data
	if len(years) == 1 {
		r.Text += fmt.Sprintf("\n\n📊 **Note:** Only data for %s is available. Historical block-level data (2012-2023) is limited due to InGRES API constraints.", years[0])
	}

	r.Chart = &models.ChartPayload{
		Type:  "gradient-area",
		Title: fmt.Sprintf("Groundwater Trends - %s", locationName),
		XAxis: years,
		Series: []models.ChartSeries{
			{Name: "Recharge (MCM)", Data: recharge, Type: "line"},
			{Name: "Extraction (MCM)", Data: extraction, Type: "line"},
		},
	}
	
	return r
}

func (s *ChatService) handleCompare(ctx context.Context, e Entities, r *models.ChatResponse) (*models.ChatResponse, error) {
	// Validate minimum locations for comparison
	if len(e.Locations) < 2 {
		if len(e.Locations) == 1 {
			r.Text = fmt.Sprintf("I found %s. Please mention another location to compare it with.", e.Locations[0])
			return r, nil
		}
		r.Text = "Please mention two locations to compare."
		return r, nil
	}

	if !isValidYear(e.Year) {
		r.Text = "Invalid year format. Please use format like '2024-2025'."
		return r, nil
	}

	// Try to find states first
	var statesFound []*models.State
	var districtsFound []*models.District
	var blocksFound []models.Block
	var notFoundLocations []string

	for _, loc := range e.Locations {
		// Try state first
		state, err := s.ingres.GetStateByName(ctx, loc)
		if err == nil && state != nil {
			statesFound = append(statesFound, state)
			continue
		}

		// Try district
		district, err := s.ingres.GetDistrictByName(ctx, loc)
		if err == nil && district != nil {
			districtsFound = append(districtsFound, district)
			continue
		}

		// Try block
		blocks, err := s.ingres.GetBlocksByNames(ctx, []string{loc})
		if err == nil && len(blocks) > 0 {
			blocksFound = append(blocksFound, blocks[0])
			continue
		}

		notFoundLocations = append(notFoundLocations, loc)
	}

	// If all locations not found
	if len(statesFound) == 0 && len(districtsFound) == 0 && len(blocksFound) == 0 {
		r.Text = fmt.Sprintf("I couldn't find any of these locations: %s. Please check the spelling.", strings.Join(e.Locations, ", "))
		return r, nil
	}

	// Handle state comparison (if 2+ states found)
	if len(statesFound) >= 2 {
		return s.compareStates(ctx, statesFound, e.Year, r)
	}

	// Handle district comparison (if 2+ districts found)
	if len(districtsFound) >= 2 {
		return s.compareDistricts(ctx, districtsFound, e.Year, r)
	}

	// Handle block comparison (if 2+ blocks found)
	if len(blocksFound) >= 2 {
		return s.compareBlocks(ctx, blocksFound, e.Year, r)
	}

	// Mixed types - try to compare whatever we have
	totalFound := len(statesFound) + len(districtsFound) + len(blocksFound)
	if totalFound < 2 {
		var foundNames []string
		for _, s := range statesFound {
			foundNames = append(foundNames, s.StateName+" (state)")
		}
		for _, d := range districtsFound {
			foundNames = append(foundNames, d.DistrictName+" (district)")
		}
		for _, b := range blocksFound {
			foundNames = append(foundNames, b.BlockName+" (block)")
		}
		r.Text = fmt.Sprintf("I found only: %s. Please provide at least two valid locations of the same type (states, districts, or blocks) to compare.", strings.Join(foundNames, ", "))
		return r, nil
	}

	// If we have mixed types, compare whatever is most common
	if len(statesFound) >= 2 {
		return s.compareStates(ctx, statesFound, e.Year, r)
	}
	if len(districtsFound) >= 2 {
		return s.compareDistricts(ctx, districtsFound, e.Year, r)
	}
	if len(blocksFound) >= 2 {
		return s.compareBlocks(ctx, blocksFound, e.Year, r)
	}

	r.Text = "Please compare locations of the same type (e.g., two states, two districts, or two blocks)."
	return r, nil
}

// compareStates compares multiple states
func (s *ChatService) compareStates(ctx context.Context, states []*models.State, year string, r *models.ChatResponse) (*models.ChatResponse, error) {
	var names []string
	var stages []float64
	var recharges []float64
	var extractions []float64
	var safeBlocks []float64
	var criticalBlocks []float64

	for _, state := range states {
		summary, err := s.ingres.GetStateSummary(ctx, state.StateUUID, year)
		if err != nil || summary == nil {
			continue
		}
		names = append(names, state.StateName)
		stages = append(stages, summary.AvgStage)
		recharges = append(recharges, summary.TotalRecharge)
		extractions = append(extractions, summary.TotalExtraction)
		safeBlocks = append(safeBlocks, float64(summary.SafeBlocks))
		criticalBlocks = append(criticalBlocks, float64(summary.CriticalBlocks+summary.OverExploitedBlocks))
	}

	if len(names) < 2 {
		r.Text = fmt.Sprintf("Could not retrieve sufficient data for %s comparison.", year)
		return r, nil
	}

	// Find best and worst performers
	bestIdx, worstIdx := 0, 0
	for i := range stages {
		if stages[i] < stages[bestIdx] {
			bestIdx = i
		}
		if stages[i] > stages[worstIdx] {
			worstIdx = i
		}
	}

	r.Text = fmt.Sprintf("🔍 **State Comparison Analysis (%s)**\n\n"+
		"📊 **Comparing**: %s\n\n"+
		"🏆 **Best Performer**: %s (%.1f%% stage)\n"+
		"⚠️ **Needs Attention**: %s (%.1f%% stage)\n\n"+
		"*Lower stage %% indicates more sustainable groundwater usage.*",
		year, strings.Join(names, " vs "),
		names[bestIdx], stages[bestIdx],
		names[worstIdx], stages[worstIdx])
	
	// Build comparison data
	comparisonPoints := make([]models.ComparisonDataPoint, 0, len(states))
	for i, state := range states {
		if i >= len(names) { // Safety check
			break
		}
		summary, _ := s.ingres.GetStateSummary(ctx, state.StateUUID, year)
		if summary == nil {
			continue
		}
		// Determine dominant category
		dominantCat := "Safe"
		if summary.OverExploitedBlocks > summary.SafeBlocks {
			dominantCat = "Over-exploited"
		} else if summary.CriticalBlocks > summary.SafeBlocks {
			dominantCat = "Critical"
		} else if summary.SemiCriticalBlocks > summary.SafeBlocks {
			dominantCat = "Semi-critical"
		}
		comparisonPoints = append(comparisonPoints, models.ComparisonDataPoint{
			Name:           names[i],
			Recharge:       recharges[i],
			Extraction:     extractions[i],
			Stage:          stages[i],
			Rainfall:       summary.AvgRainfall,
			Category:       dominantCat,
			SafeBlocks:     summary.SafeBlocks,
			CriticalBlocks: summary.CriticalBlocks + summary.OverExploitedBlocks,
		})
	}
	
	r.Chart = &models.ChartPayload{
		Type:  "comparison-card",
		Title: fmt.Sprintf("State Comparison - %s", year),
		ComparisonData: &models.ComparisonData{
			Year:           year,
			Locations:      comparisonPoints,
			ComparisonType: "state",
		},
	}

	return r, nil
}

// compareDistricts compares multiple districts
func (s *ChatService) compareDistricts(ctx context.Context, districts []*models.District, year string, r *models.ChatResponse) (*models.ChatResponse, error) {
	var names []string
	var stages []float64
	var recharges []float64
	var extractions []float64

	for _, district := range districts {
		summary, err := s.ingres.GetDistrictSummary(ctx, district.DistrictUUID, year)
		if err != nil || summary == nil {
			continue
		}
		names = append(names, district.DistrictName)
		stages = append(stages, summary.AvgStage)
		recharges = append(recharges, summary.TotalRecharge)
		extractions = append(extractions, summary.TotalExtraction)
	}

	if len(names) < 2 {
		r.Text = fmt.Sprintf("Could not retrieve sufficient data for %s comparison.", year)
		return r, nil
	}

	// Find best and worst performers
	bestIdx, worstIdx := 0, 0
	for i := range stages {
		if stages[i] < stages[bestIdx] {
			bestIdx = i
		}
		if stages[i] > stages[worstIdx] {
			worstIdx = i
		}
	}

	r.Text = fmt.Sprintf("🔍 **District Comparison Analysis (%s)**\n\n"+
		"📊 **Comparing**: %s\n\n"+
		"🏆 **Best Performer**: %s (%.1f%% stage)\n"+
		"⚠️ **Needs Attention**: %s (%.1f%% stage)\n\n"+
		"*Lower stage %% indicates more sustainable groundwater usage.*",
		year, strings.Join(names, " vs "),
		names[bestIdx], stages[bestIdx],
		names[worstIdx], stages[worstIdx])
	
	// Build comparison data
	comparisonPoints := make([]models.ComparisonDataPoint, 0, len(districts))
	for i, district := range districts {
		if i >= len(names) {
			break
		}
		summary, _ := s.ingres.GetDistrictSummary(ctx, district.DistrictUUID, year)
		if summary == nil {
			continue
		}
		// Determine dominant category
		dominantCat := "Safe"
		if summary.OverExploitedBlocks > summary.SafeBlocks {
			dominantCat = "Over-exploited"
		} else if summary.CriticalBlocks > summary.SafeBlocks {
			dominantCat = "Critical"
		} else if summary.SemiCriticalBlocks > summary.SafeBlocks {
			dominantCat = "Semi-critical"
		}
		comparisonPoints = append(comparisonPoints, models.ComparisonDataPoint{
			Name:           names[i],
			Recharge:       recharges[i],
			Extraction:     extractions[i],
			Stage:          stages[i],
			Rainfall:       summary.AvgRainfall,
			Category:       dominantCat,
			SafeBlocks:     summary.SafeBlocks,
			CriticalBlocks: summary.CriticalBlocks + summary.OverExploitedBlocks,
		})
	}
	
	r.Chart = &models.ChartPayload{
		Type:  "comparison-card",
		Title: fmt.Sprintf("District Comparison - %s", year),
		ComparisonData: &models.ComparisonData{
			Year:           year,
			Locations:      comparisonPoints,
			ComparisonType: "district",
		},
	}

	return r, nil
}

// compareBlocks compares multiple blocks (original logic refactored)
func (s *ChatService) compareBlocks(ctx context.Context, blocks []models.Block, year string, r *models.ChatResponse) (*models.ChatResponse, error) {
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

	comparisons, err := s.ingres.GetAssessmentComparison(ctx, uuids, year)
	if err != nil {
		r.Text = "Error retrieving comparison data. Please try again."
		return r, nil
	}

	if len(comparisons) == 0 {
		r.Text = fmt.Sprintf("No data found for the selected blocks in %s.", year)
		return r, nil
	}

	var names []string
	var stages []float64
	var recharges []float64
	var extractions []float64

	for _, c := range comparisons {
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

	// Find best and worst performers
	bestIdx, worstIdx := 0, 0
	for i := range stages {
		if stages[i] < stages[bestIdx] {
			bestIdx = i
		}
		if stages[i] > stages[worstIdx] {
			worstIdx = i
		}
	}

	r.Text = fmt.Sprintf("🔍 **Block Comparison Analysis (%s)**\n\n"+
		"📊 **Comparing**: %s\n\n"+
		"🏆 **Best Performer**: %s (%.1f%% stage)\n"+
		"⚠️ **Needs Attention**: %s (%.1f%% stage)\n\n"+
		"*Lower stage %% = Better groundwater sustainability*",
		year, strings.Join(names, " vs "),
		names[bestIdx], stages[bestIdx],
		names[worstIdx], stages[worstIdx])
	
	// Build comparison data
	comparisonPoints := make([]models.ComparisonDataPoint, 0, len(comparisons))
	for i, c := range comparisons {
		if i >= len(names) {
			break
		}
		comparisonPoints = append(comparisonPoints, models.ComparisonDataPoint{
			Name:       names[i],
			Recharge:   recharges[i],
			Extraction: extractions[i],
			Stage:      stages[i],
			Rainfall:   c.Rainfall,
			Category:   c.Category,
		})
	}
	
	r.Chart = &models.ChartPayload{
		Type:  "comparison-card",
		Title: fmt.Sprintf("Block Comparison - %s", year),
		ComparisonData: &models.ComparisonData{
			Year:           year,
			Locations:      comparisonPoints,
			ComparisonType: "block",
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

	r.Text = fmt.Sprintf("💧 **Recharge Breakdown for %s (%s)**\n\n🏗️ **Command Area**: %.2f MCM (irrigated zones)\n🌾 **Non-Command Area**: %.2f MCM (rain-fed zones)", block.BlockName, e.Year, breakdown[0].Command, breakdown[0].NonCommand)

	// Show Command vs Non-Command as brush-bar for interactive comparison
	if len(breakdown) > 0 {
		item := breakdown[0]
		r.Chart = &models.ChartPayload{
			Type:  "brush-bar",
			Title: fmt.Sprintf("💧 Recharge Distribution - %s", block.BlockName),
			XAxis: []string{"Command Area", "Non-Command Area"},
			Series: []models.ChartSeries{
				{
					Name: "Recharge (MCM)",
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
	
	// If still no blocks, try district or state
	if len(blocks) == 0 && len(e.Locations) > 0 {
		locationName := strings.Join(e.Locations, " ")
		
		// Try District
		district, err := s.ingres.GetDistrictByName(ctx, locationName)
		if err == nil && district != nil {
			// Get district summary with aggregated extraction data
			summary, err := s.ingres.repo.GetDistrictSummary(ctx, district.DistrictUUID, e.Year)
			if err == nil && summary != nil {
				r.Text = fmt.Sprintf("⛏️ **Extraction Summary for %s District (%s)**\n\n"+
					"📍 **State**: %s\n"+
					"🏘️ **Total Blocks**: %d\n"+
					"⚡ **Total Extraction**: %.2f MCM\n"+
					"💧 **Total Recharge**: %.2f MCM\n"+
					"📈 **Average Stage**: %.2f%%",
					district.DistrictName, e.Year,
					summary.StateName,
					summary.TotalBlocks,
					summary.TotalExtraction,
					summary.TotalRecharge,
					summary.AvgStage)
				
				r.Chart = &models.ChartPayload{
					Type:  "bar",
					Title: fmt.Sprintf("Extraction vs Recharge - %s District", district.DistrictName),
					XAxis: []string{"Total Extraction", "Total Recharge"},
					Series: []models.ChartSeries{
						{
							Name: "Volume (MCM)",
							Data: []float64{summary.TotalExtraction, summary.TotalRecharge},
							Type: "bar",
						},
					},
				}
				return r, nil
			}
		}
		
		// Try State
		state, err := s.ingres.GetStateByName(ctx, locationName)
		if err == nil && state != nil {
			summary, err := s.ingres.repo.GetStateSummary(ctx, state.StateUUID, e.Year)
			if err == nil && summary != nil {
				r.Text = fmt.Sprintf("⛏️ **Extraction Summary for %s State (%s)**\n\n"+
					"🏘️ **Total Blocks**: %d\n"+
					"⚡ **Total Extraction**: %.2f MCM\n"+
					"💧 **Total Recharge**: %.2f MCM\n"+
					"📈 **Average Stage**: %.2f%%",
					state.StateName, e.Year,
					summary.TotalBlocks,
					summary.TotalExtraction,
					summary.TotalRecharge,
					summary.AvgStage)
				
				r.Chart = &models.ChartPayload{
					Type:  "bar",
					Title: fmt.Sprintf("Extraction vs Recharge - %s", state.StateName),
					XAxis: []string{"Total Extraction", "Total Recharge"},
					Series: []models.ChartSeries{
						{
							Name: "Volume (MCM)",
							Data: []float64{summary.TotalExtraction, summary.TotalRecharge},
							Type: "bar",
						},
					},
				}
				return r, nil
			}
		}
		
		r.Text = fmt.Sprintf("I couldn't find extraction data for '%s'. Try a specific district or state name.", locationName)
		return r, nil
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

	r.Text = fmt.Sprintf("⛏️ **Extraction Breakdown for %s (%s)**\n\n🏗️ **Command Area**: %.2f MCM\n🌾 **Non-Command Area**: %.2f MCM", block.BlockName, e.Year, breakdown[0].Command, breakdown[0].NonCommand)

	if len(breakdown) > 0 {
		item := breakdown[0]
		r.Chart = &models.ChartPayload{
			Type:  "brush-bar",
			Title: fmt.Sprintf("⛏️ Extraction Distribution - %s", block.BlockName),
			XAxis: []string{"Command Area", "Non-Command Area"},
			Series: []models.ChartSeries{
				{
					Name: "Extraction (MCM)",
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

	r.Text = fmt.Sprintf("🌊 **Discharge Breakdown for %s (%s)**\n\n🏗️ **Command Area**: %.2f MCM\n🌾 **Non-Command Area**: %.2f MCM", block.BlockName, e.Year, breakdown[0].Command, breakdown[0].NonCommand)

	if len(breakdown) > 0 {
		item := breakdown[0]
		r.Chart = &models.ChartPayload{
			Type:  "brush-bar",
			Title: fmt.Sprintf("🌊 Discharge Distribution - %s", block.BlockName),
			XAxis: []string{"Command Area", "Non-Command Area"},
			Series: []models.ChartSeries{
				{
					Name: "Discharge (MCM)",
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

	var blocks []models.Block
	var err error
	var locationName string

	// Check if location is specified
	if len(e.Locations) > 0 {
		locationName = strings.Join(e.Locations, " ")
		blocks, err = s.ingres.repo.GetBlocksByCategoryAndLocation(ctx, e.Category, locationName)
	} else {
		blocks, err = s.ingres.GetBlocksByCategory(ctx, e.Category)
	}

	if err != nil {
		return nil, err
	}

	if len(blocks) == 0 {
		if locationName != "" {
			r.Text = fmt.Sprintf("No %s blocks found in %s.", e.Category, locationName)
		} else {
			r.Text = fmt.Sprintf("No %s blocks found.", e.Category)
		}
		return r, nil
	}

	// Build response text with block names
	var blockNames []string
	limit := 15
	for i, b := range blocks {
		if i >= limit {
			break
		}
		blockNames = append(blockNames, b.BlockName)
	}

	if locationName != "" {
		r.Text = fmt.Sprintf("🔍 **%s Blocks in %s (%d total)**\n\n%s",
			strings.Title(strings.ToLower(e.Category)),
			strings.ToUpper(locationName),
			len(blocks),
			strings.Join(blockNames, ", "))
	} else {
		r.Text = fmt.Sprintf("🔍 **%s Blocks (%d total)**\n\n%s",
			strings.Title(strings.ToLower(e.Category)),
			len(blocks),
			strings.Join(blockNames, ", "))
	}

	if len(blocks) > limit {
		r.Text += fmt.Sprintf("\n\n... and %d more blocks", len(blocks)-limit)
	}

	// Add chart showing distribution
	r.Chart = &models.ChartPayload{
		Type:  "bar",
		Title: fmt.Sprintf("%s Blocks - %s", strings.Title(strings.ToLower(e.Category)), locationName),
		XAxis: blockNames,
		Series: []models.ChartSeries{
			{
				Name: "Count",
				Data: func() []float64 {
					data := make([]float64, len(blockNames))
					for i := range data {
						data[i] = 1 // Just to show each block
					}
					return data
				}(),
			},
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
	
	// PRIORITY: If category is specified (with or without location), handle it first
	if e.Category != "" {
		locationName := ""
		if len(e.Locations) > 0 {
			locationName = strings.Join(e.Locations, " ")
		}
		
		// Use the repository method that handles category+location properly
		blocks, err = s.ingres.repo.GetBlocksByCategoryAndLocation(ctx, e.Category, locationName)
		if err == nil && len(blocks) > 0 {
			var blockNames []string
			limit := 15
			for i, b := range blocks {
				if i >= limit {
					break
				}
				blockNames = append(blockNames, b.BlockName)
			}
			
			if locationName != "" {
				r.Text = fmt.Sprintf("🔍 **%s Blocks in %s (%d total)**\n\n%s",
					strings.Title(strings.ToLower(e.Category)),
					strings.ToUpper(locationName),
					len(blocks),
					strings.Join(blockNames, ", "))
			} else {
				r.Text = fmt.Sprintf("🔍 **%s Blocks (%d total)**\n\n%s",
					strings.Title(strings.ToLower(e.Category)),
					len(blocks),
					strings.Join(blockNames, ", "))
			}
			
			if len(blocks) > limit {
				r.Text += fmt.Sprintf("\n\n... and %d more blocks", len(blocks)-limit)
			}
			
			// Add chart
			r.Chart = &models.ChartPayload{
				Type:  "bar",
				Title: fmt.Sprintf("%s Blocks - %s", strings.Title(strings.ToLower(e.Category)), locationName),
				XAxis: blockNames,
				Series: []models.ChartSeries{
					{
						Name: "Count",
						Data: func() []float64 {
							data := make([]float64, len(blockNames))
							for i := range data {
								data[i] = 1
							}
							return data
						}(),
					},
				},
			}
			return r, nil
		}
		
		// If no blocks found for category
		if locationName != "" {
			r.Text = fmt.Sprintf("No %s blocks found in %s.", e.Category, locationName)
		} else {
			r.Text = fmt.Sprintf("No %s blocks found.", e.Category)
		}
		return r, nil
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

	r.Text = fmt.Sprintf("🔍 **Found %d blocks** where %s %s %.2f\n\n"+
		"📊 **Top Results**: %s\n\n"+
		"*Use the interactive chart below to explore all %d matching blocks.*",
		len(summaries), e.Metric, e.Operator, e.Threshold, 
		strings.Join(blockNames[:min(5, len(blockNames))], ", "),
		len(summaries))

	// Create chart - use large-area for many results, brush-bar for fewer
	chartType := "brush-bar"
	if len(blockNames) > 10 {
		chartType = "large-area" // Better for many data points with zoom
	}

	r.Chart = &models.ChartPayload{
		Type:  chartType,
		Title: fmt.Sprintf("🔍 Blocks by %s %s %.2f", e.Metric, e.Operator, e.Threshold),
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

func (s *ChatService) handleTopRanking(ctx context.Context, e Entities, r *models.ChatResponse) (*models.ChatResponse, error) {
	// Get top blocks by category (default: over_exploited)
	category := e.Category
	if category == "" {
		category = "over_exploited"
	}
	year := e.Year
	if year == "" {
		year = "2024-2025"
	}

	// Build SQL to get top blocks with the main ranking metric
	sqlQuery := fmt.Sprintf(`
		SELECT 
			CONCAT(b.block_name, ', ', d.district_name) as location,
			s.state_name,
			a.stage as value,
			a.total_extraction,
			a.total_recharge,
			a.category
		FROM assessments_summary a
		JOIN blocks b ON a.block_uuid = b.block_uuid
		JOIN districts d ON b.district_uuid = d.district_uuid
		JOIN states s ON d.state_uuid = s.state_uuid
		WHERE LOWER(a.category) = LOWER('%s')
		AND a.year = '%s'
		AND a.stage > 0
	`, category, year)

	// Add location filter if specified
	if len(e.Locations) > 0 {
		location := strings.ToUpper(e.Locations[0])
		sqlQuery += fmt.Sprintf(" AND (UPPER(s.state_name) = '%s' OR UPPER(d.district_name) = '%s')\n", location, location)
	}

	sqlQuery += "\t\tORDER BY a.stage DESC\n\t\tLIMIT 10"

	fmt.Printf("DEBUG: Top Ranking SQL: %s\n", sqlQuery)

	// Execute query
	results, err := s.ingres.repo.RunRawQuery(ctx, sqlQuery)
	if err != nil {
		fmt.Printf("ERROR: Top ranking query failed: %v\n", err)
		r.Text = "I encountered an error fetching the ranking data. Please try again."
		return r, nil
	}

	if len(results) == 0 {
		r.Text = fmt.Sprintf("No %s blocks found for %s.", category, year)
		return r, nil
	}

	// Build response text
	locationText := ""
	if len(e.Locations) > 0 {
		locationText = fmt.Sprintf(" in %s", e.Locations[0])
	}
	categoryDisplay := strings.Title(strings.ReplaceAll(category, "_", " "))
	r.Text = fmt.Sprintf("Here are the top %d %s blocks%s for %s:", len(results), categoryDisplay, locationText, year)
	r.Data = results

	// Convert to pie data format for rose chart
	var pieData []models.PieDatum
	for _, result := range results {
		name := ""
		value := 0.0
		
		if loc, ok := result["location"].(string); ok {
			name = loc
		}
		if val, ok := result["value"].(float64); ok {
			value = val
		}
		
		if name != "" && value > 0 {
			pieData = append(pieData, models.PieDatum{
				Name:  name,
				Value: value,
			})
		}
	}

	// Create rose pie chart
	if len(pieData) > 0 {
		r.Chart = &models.ChartPayload{
			Type:    "rose-pie",
			Title:   fmt.Sprintf("Top %d Most %s Groundwater Blocks (%s)", len(pieData), categoryDisplay, year),
			PieData: pieData,
		}
	}

	return r, nil
}
