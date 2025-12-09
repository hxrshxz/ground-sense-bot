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
	Timestamp   time.Time `json:"timestamp"`
	UserQuery   string    `json:"user_query"`
	BotResponse string    `json:"bot_response"`
	Intent      string    `json:"intent"`
	Locations   []string  `json:"locations"`
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
	rag      *RAGService   // Added for RAG semantic search
	cache    *CacheService // Redis cache for low-latency access
	sessions map[string]*UserSession
	mu       sync.Mutex
}

func NewChatService(nlp *NLPService, ingres *IngresService, rag *RAGService, cache *CacheService) *ChatService {
	return &ChatService{
		nlp:      nlp,
		ingres:   ingres,
		rag:      rag,
		cache:    cache,
		sessions: make(map[string]*UserSession),
	}
}

// ProcessMessageDirect - SIMPLIFIED FLOW
// User query → Qwen generates SQL → Execute → Return formatted text
// If user asks for graph/chart, also generate simple visualization
func (s *ChatService) ProcessMessageDirect(ctx context.Context, message string, username string) (*models.ChatResponse, error) {
	message = strings.TrimSpace(message)
	
	if message == "" {
		return &models.ChatResponse{
			Text: "Please enter a question about groundwater data.",
		}, nil
	}
	
	fmt.Println("\n" + strings.Repeat("=", 60))
	fmt.Printf("📨 DIRECT SQL MODE | User: %s\n", username)
	fmt.Printf("💬 Query: \"%s\"\n", message)
	fmt.Println(strings.Repeat("=", 60))
	
	// === INTENT DETECTION: Skip SQL for casual/non-data queries ===
	msgLower := strings.ToLower(strings.TrimSpace(message))
	
	// Pattern 1: Simple greetings
	greetings := []string{"hello", "hi", "hey", "hola", "namaste", "good morning", "good afternoon", "good evening"}
	for _, g := range greetings {
		if msgLower == g || strings.HasPrefix(msgLower, g+" ") {
			fmt.Println("├─ 👋 Greeting detected - skipping SQL")
			return &models.ChatResponse{
				Text: "👋 Hello! I'm the **INGRES Groundwater Assistant**.\n\nI can help you with groundwater data for any state, district, or block in India.\n\nJust type your question about groundwater levels, extraction, recharge, or any location you want to know about!\n\n💡 *Tip: Add 'graph' to your query to see a visualization!*",
			}, nil
		}
	}
	
	// Pattern 2: Location-based greetings (e.g., "I am from Punjab", "from Delhi")
	if strings.Contains(msgLower, "i am from") || strings.Contains(msgLower, "i'm from") || strings.Contains(msgLower, "from ") {
		// Extract location
		location := ""
		for _, trigger := range []string{"i am from ", "i'm from ", "from "} {
			if idx := strings.Index(msgLower, trigger); idx >= 0 {
				location = strings.TrimSpace(msgLower[idx+len(trigger):])
				break
			}
		}
		if location != "" {
			fmt.Printf("├─ 📍 Location greeting detected: %s - skipping SQL\n", location)
			locationTitle := strings.Title(location)
			return &models.ChatResponse{
				Text: fmt.Sprintf("🙏 Namaste! Welcome, friend from **%s**!\n\nI'm the INGRES Groundwater Assistant. Let me help you with groundwater information.\n\n**Quick options for %s:**\n- \"Show groundwater status of %s\"\n- \"Districts in %s\"\n- \"Graph of extraction in %s\"\n\nWhat would you like to know?", locationTitle, locationTitle, locationTitle, locationTitle, locationTitle),
			}, nil
		}
	}
	
	// Pattern 3: Thank you / farewell
	farewells := []string{"thank you", "thanks", "bye", "goodbye", "see you", "ok thanks", "got it"}
	for _, f := range farewells {
		if msgLower == f || strings.HasPrefix(msgLower, f) {
			fmt.Println("├─ 🙏 Farewell detected - skipping SQL")
			return &models.ChatResponse{
				Text: "🙏 You're welcome! Happy to help with groundwater data anytime. Take care!",
			}, nil
		}
	}
	
	// Pattern 4: Help / what can you do
	helpPhrases := []string{"help", "what can you do", "what do you do", "how to use", "commands", "options"}
	for _, h := range helpPhrases {
		if strings.Contains(msgLower, h) {
			fmt.Println("├─ ❓ Help request detected - skipping SQL")
			return &models.ChatResponse{
				Text: "📚 **INGRES Groundwater Assistant - Help**\n\n**I can answer questions about:**\n• Groundwater status of any Indian state, district, or block\n• Extraction & recharge data\n• Category distribution (safe/critical/over-exploited)\n• Comparisons between locations\n\n**Units used:**\n• (ham) = Hectare-meters (water volume)\n• (%) = Percentage\n\n💡 *Add 'graph' or 'chart' to any query for visualization!*",
			}, nil
		}
	}
	
	// Pattern 5: Check if query is about groundwater/water/India locations
	// If not, return off-topic response
	// Pattern 5: Check if query is about groundwater/water/India locations
	// If not, return off-topic response
	isGroundwaterRelated := s.isGroundwaterQuery(msgLower)
	if !isGroundwaterRelated {
		fmt.Println("├─ ⚠️ Off-topic query detected - skipping SQL")
		return &models.ChatResponse{
			Text: "🤔 I'm specialized in **Indian groundwater data** only.\n\nI can help you with:\n• Groundwater levels for any Indian state, district, or block\n• Extraction and recharge information\n• Water stress categories and comparisons\n\nPlease ask me something about groundwater in India!",
		}, nil
	}
	
	// Pattern 6: Clarification check for ambiguous queries
	if clarification := s.needsClarification(msgLower); clarification != nil {
		fmt.Println("├─ ❓ Ambiguous query - asking for clarification")
		return clarification, nil
	}
	
	// Detect if user wants a graph/chart
	wantsGraph := strings.Contains(msgLower, "graph") ||
		strings.Contains(msgLower, "chart") ||
		strings.Contains(msgLower, "visual") ||
		strings.Contains(msgLower, "plot") ||
		strings.Contains(msgLower, "diagram")
	
	if wantsGraph {
		fmt.Println("├─ 📊 Graph requested - will generate visualization")
	}
	
	// Step 1: Generate SQL using Qwen
	fmt.Println("├─ 🤖 Generating SQL with Qwen...")
	schema := GetFullSchemaContext()
	
	sqlQuery, err := s.nlp.llm.GenerateSQL(message, schema)
	if err != nil {
		fmt.Printf("├─ ❌ SQL generation failed: %v, trying fallback templates...\n", err)
		// Try fallback SQL templates
		sqlQuery = s.getFallbackSQL(message)
		if sqlQuery == "" {
			return &models.ChatResponse{
				Text: "I couldn't understand your query. Please try rephrasing. Example: 'Show groundwater data for Punjab'",
			}, nil
		}
	}
	
	fmt.Printf("├─ ✅ SQL: %s\n", sqlQuery)
	
	// Step 2: Execute SQL
	fmt.Println("├─ 🔍 Executing SQL...")
	results, err := s.ingres.repo.RunRawQuery(ctx, sqlQuery)
	if err != nil {
		fmt.Printf("├─ ❌ SQL execution failed: %v, trying fallback templates...\n", err)
		
		// Try fallback SQL templates on execution error
		fallbackSQL := s.getFallbackSQL(message)
		if fallbackSQL != "" && fallbackSQL != sqlQuery {
			fmt.Printf("├─ 🔄 Trying fallback SQL: %s\n", fallbackSQL)
			results, err = s.ingres.repo.RunRawQuery(ctx, fallbackSQL)
			if err == nil {
				sqlQuery = fallbackSQL
				fmt.Println("├─ ✅ Fallback SQL succeeded!")
			}
		}
		
		if err != nil {
			return &models.ChatResponse{
				Text: fmt.Sprintf("Query failed. Please try rephrasing.\n\nExample queries:\n- 'Show data for Punjab'\n- 'Compare Punjab vs Haryana'\n- 'Blocks in Ludhiana district'"),
			}, nil
		}
	}
	
	// Step 3: Format results
	fmt.Printf("├─ ✅ Got %d results\n", len(results))
	
	if len(results) == 0 {
		return &models.ChatResponse{
			Text: "No data found matching your query. Please check the location name or try different criteria.",
		}, nil
	}
	
	// Build text table from results
	textResponse := s.formatResultsAsTable(results, message)
	
	response := &models.ChatResponse{
		Text:   textResponse,
		Intent: "DIRECT_SQL",
		Data:   results,
	}
	
	// Step 4: Generate chart if requested
	if wantsGraph && len(results) > 0 {
		fmt.Println("├─ 📊 Generating chart...")
		chart := s.buildSimpleChartFromResults(results, message)
		if chart != nil {
			response.Chart = chart
			fmt.Printf("├─ ✅ Chart generated: %s\n", chart.Type)
		}
	}
	
	// Step 5: Add contextual follow-up suggestions
	followUp := s.generateFollowUpSuggestions(message, results)
	if followUp != "" {
		response.Text = response.Text + "\n\n---\n" + followUp
	}
	
	// Also populate Suggestions field for frontend buttons
	response.Suggestions = s.getFollowUpButtons(message, results)
	
	fmt.Println(strings.Repeat("=", 60) + "\n")
	
	return response, nil
}

// generateFollowUpSuggestions creates contextual suggestions based on query type
func (s *ChatService) generateFollowUpSuggestions(query string, results []map[string]interface{}) string {
	queryLower := strings.ToLower(query)
	
	// Extract location from results or query
	location := ""
	if len(results) > 0 {
		// Try to find location in results first
		if stateName, ok := results[0]["state_name"].(string); ok {
			location = stateName
		} else if distName, ok := results[0]["district_name"].(string); ok {
			location = distName
		} else if blockName, ok := results[0]["block_name"].(string); ok {
			// If result is a block, try to find district/state
			if d, ok := results[0]["district_name"].(string); ok {
				location = d
			} else {
				location = blockName
			}
		}
	}
	
	// If location not in results, try to extract from query
	if location == "" {
		if strings.Contains(queryLower, " in ") {
			parts := strings.Split(queryLower, " in ")
			if len(parts) > 1 {
				location = strings.TrimSpace(parts[1])
				// Clean up year if present
				if idx := strings.Index(location, " 20"); idx > 0 {
					location = strings.TrimSpace(location[:idx])
				}
			}
		}
	}
	
	location = strings.Title(location)
	var suggestions []string
	
	// Based on query type, suggest relevant follow-ups
	if strings.Contains(queryLower, "compare") || strings.Contains(queryLower, " vs ") {
		suggestions = []string{
			"📊 \"Show groundwater graph of this comparison\"",
			"🔍 \"List blocks in " + location + " with status\"",
			"📈 \"Compare districts in " + location + "\"",
		}
	} else if strings.Contains(queryLower, "blocks") || strings.Contains(queryLower, "list") {
		if location != "" {
			suggestions = []string{
				fmt.Sprintf("📊 \"Show groundwater graph of %s\"", location),
				fmt.Sprintf("📈 \"Compare %s with neighboring states\"", location),
				"🔍 \"Show critical blocks in " + location + "\"",
			}
		} else {
             suggestions = []string{
				"📊 \"Show graph for these blocks\"",
				"📈 \"Compare extraction vs recharge\"",
				"🔍 \"Details of first block\"",
			}
        }
	} else if strings.Contains(queryLower, "districts") {
		if location != "" {
			suggestions = []string{
				fmt.Sprintf("📊 \"Show groundwater graph of %s\"", location),
				fmt.Sprintf("🔍 \"Show all blocks in %s\"", location),
				fmt.Sprintf("📈 \"Trend analysis of %s\"", location),
			}
		}
	} else if strings.Contains(queryLower, "status") || strings.Contains(queryLower, "show") || strings.Contains(queryLower, "data for") {
		if location != "" {
			suggestions = []string{
				fmt.Sprintf("📊 \"Show groundwater graph of %s\"", location),
				fmt.Sprintf("🔍 \"List districts in %s\"", location),
				fmt.Sprintf("📈 \"Compare %s vs [another state]\"", location),
			}
		} else {
            suggestions = []string{
				"📊 \"Graph of this data\"",
				"🔍 \"Show more details\"",
				"📈 \"Compare with other locations\"",
			}
        }
	} else {
		// Default suggestions
		suggestions = []string{
			"📊 \"Show groundwater graph\"",
			"🔍 \"List critical blocks in this area\"",
			"📈 \"Compare extraction vs recharge\"",
		}
	}
	
	if len(suggestions) > 0 {
		return "💡 **Suggested Follow-us:**\n" + strings.Join(suggestions, "\n")
	}
	return ""
}

// getFollowUpButtons returns button-style suggestions for frontend
func (s *ChatService) getFollowUpButtons(query string, results []map[string]interface{}) []string {
	queryLower := strings.ToLower(query)
	
	// Extract location
	location := ""
	if len(results) > 0 {
		if stateName, ok := results[0]["state_name"].(string); ok {
			location = stateName
		}
	}
	
	var buttons []string
	
	if location != "" {
		if !strings.Contains(queryLower, "graph") {
			buttons = append(buttons, fmt.Sprintf("Graph of %s", location))
		}
		if !strings.Contains(queryLower, "districts") {
			buttons = append(buttons, fmt.Sprintf("Districts in %s", location))
		}
		if !strings.Contains(queryLower, "blocks") {
			buttons = append(buttons, fmt.Sprintf("Blocks in %s", location))
		}
	}
	
	// Limit to 3 buttons
	if len(buttons) > 3 {
		buttons = buttons[:3]
	}
	
	return buttons
}

// buildSimpleChartFromResults creates a simple bar chart from query results
func (s *ChatService) buildSimpleChartFromResults(results []map[string]interface{}, query string) *models.ChartPayload {
	if len(results) == 0 {
		return nil
	}
	
	// Find a good label column (name-like) and value column (numeric)
	var labelCol, valueCol string
	var values []float64
	var labels []string
	
	// Priority order for label columns
	labelPriority := []string{"block_name", "district_name", "state_name", "year", "category", "location"}
	// Priority order for value columns
	valuePriority := []string{"stage", "total_extraction", "total_extractable", "avg_stage", "extraction_ham", "extractable_ham", "total_blocks", "rainfall", "total_recharge"}
	
	// Find label column
	for _, col := range labelPriority {
		if _, exists := results[0][col]; exists {
			labelCol = col
			break
		}
	}
	
	// Find value column
	for _, col := range valuePriority {
		if _, exists := results[0][col]; exists {
			valueCol = col
			break
		}
	}
	
	// Fallback: use first string column as label, first numeric as value
	if labelCol == "" || valueCol == "" {
		for key, val := range results[0] {
			switch val.(type) {
			case string:
				if labelCol == "" {
					labelCol = key
				}
			case float64, int64:
				if valueCol == "" {
					valueCol = key
				}
			}
		}
	}
	
	if labelCol == "" || valueCol == "" {
		return nil
	}
	
	// Extract data (limit to 15 items for readability)
	maxItems := 15
	if len(results) < maxItems {
		maxItems = len(results)
	}
	
	for i := 0; i < maxItems; i++ {
		row := results[i]
		
		// Get label
		if lbl, ok := row[labelCol].(string); ok {
			labels = append(labels, lbl)
		} else {
			labels = append(labels, fmt.Sprintf("%v", row[labelCol]))
		}
		
		// Get value
		switch v := row[valueCol].(type) {
		case float64:
			values = append(values, v)
		case int64:
			values = append(values, float64(v))
		default:
			values = append(values, 0)
		}
	}
	
	if len(labels) == 0 || len(values) == 0 {
		return nil
	}
	
	// Determine chart type based on data
	chartType := "brush-bar"
	if len(labels) <= 6 {
		chartType = "rose-pie" // Use pie for small datasets
	}
	
	// Build chart title
	title := "📊 Query Results"
	queryLower := strings.ToLower(query)
	if strings.Contains(queryLower, "stage") || strings.Contains(queryLower, "extraction") {
		title = "📊 Groundwater Extraction Analysis"
	} else if strings.Contains(queryLower, "block") {
		title = "📊 Block-wise Data"
	} else if strings.Contains(queryLower, "district") {
		title = "📊 District-wise Data"
	} else if strings.Contains(queryLower, "state") {
		title = "📊 State-wise Data"
	}
	
	// Format value column name for display
	valueName := strings.ReplaceAll(valueCol, "_", " ")
	valueName = strings.Title(valueName)
	
	return &models.ChartPayload{
		Type:  chartType,
		Title: title,
		XAxis: labels,
		Series: []models.ChartSeries{
			{
				Name: valueName,
				Data: values,
			},
		},
	}
}

// isGroundwaterQuery checks if a query is related to groundwater/water/India locations
// Returns true if the query seems to be about groundwater topics
func (s *ChatService) isGroundwaterQuery(query string) bool {
	queryLower := strings.ToLower(query)
	
	// STRONG keywords - if any of these are present, definitely groundwater related
	strongKeywords := []string{
		// Water-specific terms
		"groundwater", "ground water", "ground watere", "aquifer", "borewell", "bore well",
		"extraction", "recharge", "extractable", "ground",
		"over-exploited", "overexploited", "semi-critical",
		"blocks", "districts", "block", "district",
		"graph", "chart", "trend", "visual",
		
		// All Indian state names
		"punjab", "haryana", "rajasthan", "gujarat", "maharashtra",
		"karnataka", "kerala", "odisha", "jharkhand", "chhattisgarh",
		"uttarakhand", "himachal", "meghalaya", "tripura", "sikkim",
		"bihar", "assam", "manipur", "mizoram", "nagaland", "arunachal",
		"telangana", "andhra", "tamil", "bengal", "goa",
		"madhya pradesh", "uttar pradesh",
		
		// Major cities/districts
		"ludhiana", "amritsar", "jaipur", "chandigarh", "kurukshetra",
		"bhopal", "lucknow", "patna", "mumbai", "chennai", "kolkata",
		"hyderabad", "bangalore", "ahmedabad", "indore", "nagpur",
		"ramgarh", "ranchi", "dhanbad", "raipur", "guwahati",
	}
	
	for _, keyword := range strongKeywords {
		if strings.Contains(queryLower, keyword) {
			return true
		}
	}
	
	// Check for combined patterns that indicate groundwater context
	// e.g., "water level", "water status", "water in", "data for"
	waterPatterns := []string{
		"water level", "water status", "water data", "water in ",
		"data for ", "status of ", "show data",
		"compare ", " vs ",
	}
	
	for _, pattern := range waterPatterns {
		if strings.Contains(queryLower, pattern) {
			return true
		}
	}
	
	// If query mentions "water" along with location prepositions, it's likely groundwater
	if strings.Contains(queryLower, "water") {
		if strings.Contains(queryLower, " in ") || strings.Contains(queryLower, " of ") || strings.Contains(queryLower, " for ") {
			return true
		}
	}
	
	// Otherwise, it's NOT a groundwater query
	return false
}

// needsClarification checks if the query is too ambiguous and returns a clarification response
// Returns nil if query is clear enough to proceed to SQL generation
func (s *ChatService) needsClarification(query string) *models.ChatResponse {
	queryLower := strings.ToLower(query)
	words := strings.Fields(queryLower)
	
	// Case 1: "Compare" without targets
	// e.g. "compare", "compare data", "comparison"
	if strings.Contains(queryLower, "compare") || strings.Contains(queryLower, "comparison") {
		// If it doesn't contain "vs", "and", "between" or is very short
		if (!strings.Contains(queryLower, " vs ") && 
		    !strings.Contains(queryLower, " and ") && 
		    !strings.Contains(queryLower, " between ")) || len(words) <= 2 {
			return &models.ChatResponse{
				Text: "I can compare groundwater data for you! 📊\n\nPlease tell me **which two locations** you'd like to compare.\n\nExample:\n• *\"Compare Punjab and Haryana\"*\n• *\"Ludhiana vs Amritsar\"*",
				Suggestions: []string{"Compare Punjab vs Haryana", "Compare Jaipur vs Jodhpur"},
			}
		}
	}

	// Case 2: Vague "Show data" or "status" without location
	// Check if any location keyword is present
	hasLocation := false
	
	// Check explicit location keywords from our list
	locationKeywords := []string{
		"punjab", "haryana", "rajasthan", "gujarat", "maharashtra",
		"karnataka", "kerala", "odisha", "jharkhand", "chhattisgarh",
		"uttarakhand", "himachal", "meghalaya", "tripura", "sikkim",
		"bihar", "assam", "manipur", "mizoram", "nagaland", "arunachal",
		"telangana", "andhra", "tamil", "bengal", "goa",
		"madhya pradesh", "uttar pradesh",
		"ludhiana", "amritsar", "jaipur", "chandigarh", "kurukshetra",
		"bhopal", "lucknow", "patna", "mumbai", "chennai", "kolkata",
		"hyderabad", "bangalore", "ahmedabad", "indore", "nagpur",
		"ramgarh", "ranchi", "dhanbad", "raipur", "guwahati",
		"delhi",
		// Generic location indicators
		"district", "state", "block", "region", "area", "india",
	}
	
	for _, loc := range locationKeywords {
		if strings.Contains(queryLower, loc) {
			hasLocation = true
			break
		}
	}
	
	// Also check for "in [something]" or "of [something]" pattern
	if !hasLocation {
		if strings.Contains(queryLower, " in ") || strings.Contains(queryLower, " of ") || strings.Contains(queryLower, " for ") {
			hasLocation = true
		}
	}

	// If no location found and query is vague/short
	if !hasLocation {
		// Vague phrases
		vaguePhrases := []string{
			"show data", "show me data", "give me data", 
			"groundwater status", "water level", "water status",
			"tell me about groundwater", "extraction rate",
			"what is the status", "how is the water",
		}
		
		isVague := false
		for _, phrase := range vaguePhrases {
			if strings.Contains(queryLower, phrase) && len(words) < 6 {
				isVague = true
				break
			}
		}
		
		// Or just very short queries that passed isGroundwaterQuery (like "groundwater", "extraction")
		if len(words) <= 2 {
			isVague = true
		}
		
		if isVague {
			return &models.ChatResponse{
				Text: "I'd be happy to help! 🌊\n\nCould you please specify **which location** you're interested in?\n\nYou can ask about a **State**, **District**, or **Block**.",
				Suggestions: []string{"Data for Punjab", "Status of Ludhiana", "Show all states"},
			}
		}
	}
	
	return nil
}

// getFallbackSQL returns a predefined SQL template based on query patterns
// Used as fallback when Qwen-generated SQL fails
func (s *ChatService) getFallbackSQL(message string) string {
	msgLower := strings.ToLower(message)
	
	// Pattern 1: "A vs B" or "Compare A and B" - State comparison
	if strings.Contains(msgLower, " vs ") || strings.Contains(msgLower, "compare") {
		// Extract state names
		var state1, state2 string
		
		if strings.Contains(msgLower, " vs ") {
			parts := strings.Split(msgLower, " vs ")
			if len(parts) >= 2 {
				state1 = strings.TrimSpace(parts[0])
				state2 = strings.TrimSpace(parts[1])
				// Clean up common prefixes
				state1 = strings.TrimPrefix(state1, "compare ")
				state1 = strings.TrimPrefix(state1, "show ")
			}
		} else if strings.Contains(msgLower, " and ") {
			// "Compare A and B"
			msgClean := strings.ReplaceAll(msgLower, "compare ", "")
			msgClean = strings.ReplaceAll(msgClean, "show ", "")
			parts := strings.Split(msgClean, " and ")
			if len(parts) >= 2 {
				state1 = strings.TrimSpace(parts[0])
				state2 = strings.TrimSpace(parts[1])
			}
		}
		
		if state1 != "" && state2 != "" {
			fmt.Printf("├─ 📋 Using comparison template: %s vs %s\n", state1, state2)
			// Use separate LIKE conditions for each state to handle multi-word names
			return fmt.Sprintf(`
				SELECT s.state_name,
				       COUNT(*) as total_blocks,
				       ROUND(AVG(CASE WHEN a.stage > 0 THEN a.stage END)::numeric, 2) as "avg_stage(%%)",
				       ROUND(SUM(a.total_extractable)::numeric, 2) as "extractable(ham)",
				       ROUND(SUM(a.total_extraction)::numeric, 2) as "extraction(ham)",
				       SUM(CASE WHEN a.category = 'safe' THEN 1 ELSE 0 END) as safe_blocks,
				       SUM(CASE WHEN a.category = 'over_exploited' THEN 1 ELSE 0 END) as overexploited_blocks
				FROM assessments_summary a
				JOIN blocks b ON a.block_uuid = b.block_uuid
				JOIN states s ON b.state_uuid = s.state_uuid
				WHERE (UPPER(REPLACE(s.state_name, ' ', '')) LIKE UPPER('%%' || REPLACE('%s', ' ', '') || '%%')
				       OR UPPER(REPLACE(s.state_name, ' ', '')) LIKE UPPER('%%' || REPLACE('%s', ' ', '') || '%%'))
				AND a.year = '2024-2025'
				GROUP BY s.state_name
				ORDER BY s.state_name
			`, state1, state2)
		}
	}
	
	// Pattern 2: "Status of X" or "Data for X" - State/District summary
	if strings.Contains(msgLower, "status") || strings.Contains(msgLower, "data for") || strings.Contains(msgLower, "show") {
		// Extract location
		location := ""
		for _, trigger := range []string{"status of ", "data for ", "show ", "for "} {
			if idx := strings.Index(msgLower, trigger); idx >= 0 {
				location = strings.TrimSpace(msgLower[idx+len(trigger):])
				// Clean up
				location = strings.TrimSuffix(location, " state")
				location = strings.TrimSuffix(location, " district")
				break
			}
		}
		
		if location != "" && len(location) > 2 {
			fmt.Printf("├─ 📋 Using summary template for: %s\n", location)
			return fmt.Sprintf(`
				SELECT s.state_name,
				       COUNT(*) as total_blocks,
				       ROUND(AVG(CASE WHEN a.stage > 0 THEN a.stage END)::numeric, 2) as "avg_stage(%%)",
				       ROUND(SUM(a.total_extractable)::numeric, 2) as "extractable(ham)",
				       ROUND(SUM(a.total_extraction)::numeric, 2) as "extraction(ham)",
				       SUM(CASE WHEN a.category = 'safe' THEN 1 ELSE 0 END) as safe,
				       SUM(CASE WHEN a.category = 'critical' THEN 1 ELSE 0 END) as critical,
				       SUM(CASE WHEN a.category = 'over_exploited' THEN 1 ELSE 0 END) as over_exploited
				FROM assessments_summary a
				JOIN blocks b ON a.block_uuid = b.block_uuid
				JOIN states s ON b.state_uuid = s.state_uuid
				WHERE UPPER(REPLACE(s.state_name, ' ', '')) LIKE UPPER('%%' || REPLACE('%s', ' ', '') || '%%')
				AND a.year = '2024-2025'
				GROUP BY s.state_name
			`, location)
		}
	}
	
	// Pattern 3: "Blocks in X" - List blocks
	if strings.Contains(msgLower, "blocks in") || strings.Contains(msgLower, "blocks of") {
		location := ""
		for _, trigger := range []string{"blocks in ", "blocks of "} {
			if idx := strings.Index(msgLower, trigger); idx >= 0 {
				location = strings.TrimSpace(msgLower[idx+len(trigger):])
				break
			}
		}
		
		if location != "" && len(location) > 2 {
			fmt.Printf("├─ 📋 Using blocks template for: %s\n", location)
			return fmt.Sprintf(`
				SELECT b.block_name, d.district_name, s.state_name,
				       a.stage as "stage(%%)", 
				       a.category,
				       a.total_extractable as "extractable(ham)",
				       a.total_extraction as "extraction(ham)"
				FROM assessments_summary a
				JOIN blocks b ON a.block_uuid = b.block_uuid
				JOIN districts d ON b.district_uuid = d.district_uuid
				JOIN states s ON b.state_uuid = s.state_uuid
				WHERE (UPPER(REPLACE(s.state_name, ' ', '')) LIKE UPPER('%%' || REPLACE('%s', ' ', '') || '%%')
				       OR LOWER(d.district_name) LIKE LOWER('%%%s%%'))
				AND a.year = '2024-2025'
				ORDER BY a.stage DESC
				LIMIT 30
			`, location, location)
		}
	}
	
	// Pattern 4: "Districts in X" - List districts
	if strings.Contains(msgLower, "districts in") || strings.Contains(msgLower, "districts of") {
		location := ""
		for _, trigger := range []string{"districts in ", "districts of "} {
			if idx := strings.Index(msgLower, trigger); idx >= 0 {
				location = strings.TrimSpace(msgLower[idx+len(trigger):])
				break
			}
		}
		
		if location != "" && len(location) > 2 {
			fmt.Printf("├─ 📋 Using districts template for: %s\n", location)
			return fmt.Sprintf(`
				SELECT d.district_name, s.state_name,
				       COUNT(*) as total_blocks,
				       AVG(CASE WHEN a.stage > 0 THEN a.stage END) as "avg_stage(%%)",
				       SUM(a.total_extraction) as "extraction(ham)"
				FROM assessments_summary a
				JOIN blocks b ON a.block_uuid = b.block_uuid
				JOIN districts d ON b.district_uuid = d.district_uuid
				JOIN states s ON b.state_uuid = s.state_uuid
				WHERE UPPER(REPLACE(s.state_name, ' ', '')) LIKE UPPER('%%' || REPLACE('%s', ' ', '') || '%%')
				AND a.year = '2024-2025'
				GROUP BY d.district_name, s.state_name
				ORDER BY "avg_stage(%%)" DESC
			`, location)
		}
	}
	
	// Pattern 5: General "in [location]" - Search by district or state
	// Catches queries like "extractable water in kurukshetra"
	if strings.Contains(msgLower, " in ") {
		// Extract location after "in"
		location := ""
		if idx := strings.LastIndex(msgLower, " in "); idx >= 0 {
			location = strings.TrimSpace(msgLower[idx+4:])
			// Clean up common suffixes
			location = strings.TrimSuffix(location, " district")
			location = strings.TrimSuffix(location, " state")
			location = strings.TrimSuffix(location, "?")
		}
		
		if location != "" && len(location) > 2 {
			fmt.Printf("├─ 📋 Using general location template for: %s\n", location)
			// Search both state and district
			return fmt.Sprintf(`
				SELECT 
				       COALESCE(d.district_name, 'All Districts') as district_name,
				       s.state_name,
				       COUNT(*) as total_blocks,
				       AVG(CASE WHEN a.stage > 0 THEN a.stage END) as "avg_stage(%%)",
				       SUM(a.total_extractable) as "extractable(ham)",
				       SUM(a.total_extraction) as "extraction(ham)",
				       SUM(CASE WHEN a.category = 'safe' THEN 1 ELSE 0 END) as safe,
				       SUM(CASE WHEN a.category = 'over_exploited' THEN 1 ELSE 0 END) as overexploited
				FROM assessments_summary a
				JOIN blocks b ON a.block_uuid = b.block_uuid
				JOIN districts d ON b.district_uuid = d.district_uuid
				JOIN states s ON b.state_uuid = s.state_uuid
				WHERE (UPPER(REPLACE(d.district_name, ' ', '')) LIKE UPPER('%%' || REPLACE('%s', ' ', '') || '%%')
				       OR UPPER(REPLACE(s.state_name, ' ', '')) LIKE UPPER('%%' || REPLACE('%s', ' ', '') || '%%'))
				AND a.year = '2024-2025'
				GROUP BY d.district_name, s.state_name
				ORDER BY "extractable(ham)" DESC
				LIMIT 20
			`, location, location)
		}
	}
	
	// No matching pattern
	return ""
}

// formatNumberWithCommas formats a float64 with comma separators (Indian style: 9,30,116.00)
func formatNumberWithCommas(n float64) string {
	// Format with default precision (6 decimals) or sufficient precision, then trim
	str := fmt.Sprintf("%f", n)
	
	// Trim trailing zeros and decimal point if appropriate
	str = strings.TrimRight(str, "0")
	str = strings.TrimSuffix(str, ".")
	
	// Split integer and decimal parts
	parts := strings.Split(str, ".")
	intPart := parts[0]
	decPart := ""
	if len(parts) > 1 {
		decPart = parts[1]
	}
	
	// Add comma separators to integer part (Indian numbering: 12,34,567)
	var result strings.Builder
	length := len(intPart)
	
	// Handle negative numbers
	startIdx := 0
	if intPart[0] == '-' {
		result.WriteByte('-')
		startIdx = 1
		length--
	}
	
	for i := startIdx; i < len(intPart); i++ {
		pos := len(intPart) - i
		// Indian format: first comma after 3 digits, then every 2 digits
		if i > startIdx {
			if pos == 3 || (pos > 3 && (pos-3)%2 == 0) {
				result.WriteByte(',')
			}
		}
		result.WriteByte(intPart[i])
	}
	
	if decPart != "" {
		return result.String() + "." + decPart
	}
	return result.String()
}

// formatResultsAsTable formats query results as markdown table
func (s *ChatService) formatResultsAsTable(results []map[string]interface{}, query string) string {
	if len(results) == 0 {
		return "No results found."
	}
	
	var builder strings.Builder
	// Removed redundant "Query Results" title as per UI feedback
	// builder.WriteString(fmt.Sprintf("📊 **Query Results** (%d rows)\n\n", len(results)))
	
	// Get column headers from first row
	headers := make([]string, 0)
	for key := range results[0] {
		headers = append(headers, key)
	}
	
	// Sort headers for consistent ordering (put common ones first)
	priorityOrder := []string{"state_name", "district_name", "block_name", "year", "category", "stage", "total_extraction", "total_extractable", "rainfall", "total_recharge"}
	sortedHeaders := make([]string, 0)
	
	for _, p := range priorityOrder {
		for _, h := range headers {
			if h == p {
				sortedHeaders = append(sortedHeaders, h)
				break
			}
		}
	}
	// Add remaining headers
	for _, h := range headers {
		found := false
		for _, s := range sortedHeaders {
			if s == h {
				found = true
				break
			}
		}
		if !found {
			sortedHeaders = append(sortedHeaders, h)
		}
	}
	headers = sortedHeaders
	
	// Limit columns for readability (max 7)
	if len(headers) > 7 {
		headers = headers[:7]
	}
	
	// Build table header
	builder.WriteString("| ")
	for _, h := range headers {
		displayName := strings.ReplaceAll(h, "_", " ")
		displayName = strings.Title(displayName)
		builder.WriteString(fmt.Sprintf("%s | ", displayName))
	}
	builder.WriteString("\n|")
	for range headers {
		builder.WriteString("---|")
	}
	builder.WriteString("\n")
	
	// Build table rows (limit to 20 rows for readability)
	maxRows := 20
	if len(results) < maxRows {
		maxRows = len(results)
	}
	
	for i := 0; i < maxRows; i++ {
		row := results[i]
		builder.WriteString("| ")
		for _, h := range headers {
			val := row[h]
			valStr := ""
			switch v := val.(type) {
			case float64:
				// Always format with 2 decimal places and add comma separators
				valStr = formatNumberWithCommas(v)
			case int64:
				valStr = formatNumberWithCommas(float64(v))
			case string:
				valStr = v
			case nil:
				valStr = "-"
			default:
				valStr = fmt.Sprintf("%v", v)
			}
			// Truncate long values
			if len(valStr) > 25 {
				valStr = valStr[:22] + "..."
			}
			builder.WriteString(fmt.Sprintf("%s | ", valStr))
		}
		builder.WriteString("\n")
	}
	
	if len(results) > 20 {
		builder.WriteString(fmt.Sprintf("\n*...and %d more rows*\n", len(results)-20))
	}
	
	return builder.String()
}

// Helper struct to parse LLM visualization JSON
type visualizationPayload struct {
	Type        string      `json:"type"`
	Title       string      `json:"title"`
	Explanation string      `json:"explanation"`
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

	// Block specific location queries (e.g., Delhi)
	msgLowerCheck := strings.ToLower(strings.TrimSpace(message))
	blockedLocations := []string{"delhi", "new delhi"}
	for _, blocked := range blockedLocations {
		if msgLowerCheck == blocked || strings.HasPrefix(msgLowerCheck, blocked+" ") || strings.HasSuffix(msgLowerCheck, " "+blocked) {
			return &models.ChatResponse{
				Text: "I cannot provide data for this location. Please try another state or district.",
			}, nil
		}
	}

	fmt.Println("\n" + strings.Repeat("=", 80))
	fmt.Printf("📨 NEW USER MESSAGE | User: %s | Time: %s\n", username, time.Now().Format("15:04:05"))
	fmt.Printf("💬 Query: \"%s\"\n", message)
	fmt.Println(strings.Repeat("=", 80))

	// Note: Greeting detection removed - all queries are processed directly by handlers

	// Get or create session
	s.mu.Lock()
	if s.sessions == nil {
		s.sessions = make(map[string]*UserSession)
	}
	session, exists := s.sessions[username]
	if !exists {
		fmt.Printf("🆕 Creating new session for user: %s\n", username)
		session = &UserSession{
			MaxHistoryLength:    10,
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

	// ========== NLP INTENT DETECTION FIRST ==========
	// Try NLP intent handlers first, fall back to RAG if no intent match
	fmt.Println("\n🧠 AI PROCESSING PIPELINE")
	fmt.Println("├─ Step 1: Intent Classification & Entity Extraction...")

	intent, entities, sqlQuery := s.nlp.ParseMessage(message)

	// Context Merging Logic
	// If new entities are missing locations but we have them in session, and the user implies context
	// (e.g., "what about...", "list blocks there", "trend for it")
	contextUsed := false
	if len(entities.Locations) == 0 && len(session.LastEntities.Locations) > 0 {
		// Check for context clues or just default to previous location if it makes sense
		// Simple heuristic: If intent requires location (Trend, Compare, ListBlocks) and we have none, use previous.
		if intent == IntentTrend || intent == IntentCompare || intent == IntentListBlocks || intent == IntentSummary {
			fmt.Printf("DEBUG: Using context location: %v\n", session.LastEntities.Locations)
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
			response.Text = "No data found matching your criteria. Please try different parameters or check the location name."

			// Track in history
			s.mu.Lock()
			session.AddToHistory(message, response.Text, string(intent), entities.Locations)
			s.mu.Unlock()

			return response, nil
		}

		// Use LLM to pick chart shape but keep visuals hardcoded on frontend
		response.Text = fmt.Sprintf("Here is the data you requested (%d results).", len(results))
		response.Data = results

		chartPayload, vizText := s.buildChartWithLLM(results, sqlQuery, message)
		if chartPayload != nil {
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

	// KEYWORD-BASED INTENT FALLBACK
	// When AI NLP fails (quota/errors), detect common intent patterns from query keywords
	msgLower := strings.ToLower(message)

	// Detect LIST_STATES intent first (highest priority for "all states" queries)
	if strings.Contains(msgLower, "all states") ||
		strings.Contains(msgLower, "list states") ||
		strings.Contains(msgLower, "show states") {
		fmt.Println("├─ 🔄 Keyword fallback: Detected LIST_STATES intent")
		intent = IntentListStates
		entities.Locations = []string{} // No location needed for list all states
	}

	// Detect LIST_DISTRICTS intent
	if (strings.Contains(msgLower, "districts in") ||
		strings.Contains(msgLower, "districts of") ||
		strings.Contains(msgLower, "list districts") ||
		strings.Contains(msgLower, "show districts")) &&
		intent != IntentListDistricts {
		fmt.Println("├─ 🔄 Keyword fallback: Detected LIST_DISTRICTS intent")
		intent = IntentListDistricts

		// Extract location from "districts in X" or "districts of X" pattern
		if strings.Contains(msgLower, "districts in") {
			parts := strings.Split(msgLower, "districts in")
			if len(parts) > 1 {
				locationName := strings.TrimSpace(parts[1])
				// Remove trailing words like "state"
				locationName = strings.TrimSuffix(locationName, " state")
				if locationName != "" {
					entities.Locations = []string{locationName}
					fmt.Printf("├─ 🔄 Extracted location: %s\n", locationName)
				}
			}
		} else if strings.Contains(msgLower, "districts of") {
			parts := strings.Split(msgLower, "districts of")
			if len(parts) > 1 {
				locationName := strings.TrimSpace(parts[1])
				locationName = strings.TrimSuffix(locationName, " state")
				if locationName != "" {
					entities.Locations = []string{locationName}
					fmt.Printf("├─ 🔄 Extracted location: %s\n", locationName)
				}
			}
		}
	}

	// Detect MAP_CATEGORY intent FIRST (e.g., "Critical blocks in Punjab", "Safe blocks in Haryana")
	// This takes priority over LIST_BLOCKS when a category keyword is present
	hasCategoryKeyword := strings.Contains(msgLower, "critical") ||
		strings.Contains(msgLower, "safe") ||
		strings.Contains(msgLower, "over-exploited") ||
		strings.Contains(msgLower, "over exploited") ||
		strings.Contains(msgLower, "overexploited") ||
		strings.Contains(msgLower, "semi-critical") ||
		strings.Contains(msgLower, "semi critical")

	if hasCategoryKeyword && strings.Contains(msgLower, "blocks") && intent != IntentMapCategory {
		fmt.Println("├─ 🔄 Keyword fallback: Detected MAP_CATEGORY intent (category + blocks)")
		intent = IntentMapCategory

		// Extract location - remove category keywords first
		locationQuery := msgLower
		for _, cat := range []string{"critical", "safe", "over-exploited", "over exploited", "overexploited", "semi-critical", "semi critical"} {
			locationQuery = strings.ReplaceAll(locationQuery, cat, "")
		}
		locationQuery = strings.ReplaceAll(locationQuery, "blocks in", "")
		locationQuery = strings.ReplaceAll(locationQuery, "blocks of", "")
		locationQuery = strings.ReplaceAll(locationQuery, "blocks", "")
		locationQuery = strings.TrimSpace(locationQuery)

		if locationQuery != "" {
			entities.Locations = []string{strings.ToUpper(locationQuery)}
			fmt.Printf("├─ 🔄 Extracted location for category query: %s\n", locationQuery)
		}
	} else if (strings.Contains(msgLower, "blocks in") ||
		strings.Contains(msgLower, "blocks of") ||
		strings.Contains(msgLower, "list blocks") ||
		strings.Contains(msgLower, "show blocks")) &&
		intent != IntentListBlocks && !hasCategoryKeyword {
		fmt.Println("├─ 🔄 Keyword fallback: Detected LIST_BLOCKS intent")
		intent = IntentListBlocks

		// Extract location from "blocks in X" or "blocks of X" pattern
		if strings.Contains(msgLower, "blocks in") {
			parts := strings.Split(msgLower, "blocks in")
			if len(parts) > 1 {
				locationName := strings.TrimSpace(parts[1])
				locationName = strings.TrimSuffix(locationName, " state")
				locationName = strings.TrimSuffix(locationName, " district")
				if locationName != "" {
					entities.Locations = []string{locationName}
					fmt.Printf("├─ 🔄 Extracted location: %s\n", locationName)
				}
			}
		} else if strings.Contains(msgLower, "blocks of") {
			parts := strings.Split(msgLower, "blocks of")
			if len(parts) > 1 {
				locationName := strings.TrimSpace(parts[1])
				locationName = strings.TrimSuffix(locationName, " state")
				locationName = strings.TrimSuffix(locationName, " district")
				if locationName != "" {
					entities.Locations = []string{locationName}
					fmt.Printf("├─ 🔄 Extracted location: %s\n", locationName)
				}
			}
		}
	}

	// Detect TOP_RANKING intent (top N critical/safe/over-exploited blocks)
	if (strings.Contains(msgLower, "top ") || strings.Contains(msgLower, "worst ") || strings.Contains(msgLower, "most ")) &&
		(strings.Contains(msgLower, "critical") || strings.Contains(msgLower, "over-exploited") ||
			strings.Contains(msgLower, "safe") || strings.Contains(msgLower, "semi-critical")) {

		if intent != IntentTopRanking {
			fmt.Println("├─ 🔄 Keyword fallback: Detected TOP_RANKING intent")
			intent = IntentTopRanking
		}

		// Clear locations that are actually ranking keywords (top, worst, most, etc.)
		// This runs regardless of whether intent was already TOP_RANKING to clean up bad entities
		var filteredLocations []string
		rankingKeywords := []string{"top", "worst", "most", "critical", "over-exploited", "safe", "semi-critical", "blocks", "districts", "10", "20", "50"}
		for _, loc := range entities.Locations {
			locLower := strings.ToLower(strings.TrimSpace(loc))
			isRankingKeyword := false
			for _, keyword := range rankingKeywords {
				if locLower == keyword || strings.Contains(locLower, keyword) {
					isRankingKeyword = true
					break
				}
			}
			if !isRankingKeyword && len(locLower) > 2 {
				filteredLocations = append(filteredLocations, loc)
			}
		}
		if len(filteredLocations) > 0 {
			entities.Locations = filteredLocations
			fmt.Printf("├─ 🔄 Filtered locations: %v\n", filteredLocations)
		} else {
			// Clear all locations if they're all ranking keywords
			entities.Locations = []string{}
			fmt.Println("├─ 🔄 Cleared all locations (all were ranking keywords)")
		}
	}

	// Process with intent handlers
	var handlerResult *models.ChatResponse
	var handlerErr error
	var shouldFallbackToRAG bool
	var textLower string

	switch intent {
	case IntentSummary:
		// USE NEW FOCUSED 4-ATTRIBUTE HANDLER
		if len(entities.Locations) > 0 {
			loc := entities.Locations[0]
			// Try state first, then district, then block
			state, _ := s.ingres.GetStateByName(ctx, loc)
			if state != nil {
				handlerResult, handlerErr = s.handleStateQuery(ctx, loc, entities.Year)
			} else {
				district, _ := s.ingres.GetDistrictByName(ctx, loc)
				if district != nil {
					handlerResult, handlerErr = s.handleDistrictQuery(ctx, loc, entities.Year)
				} else {
					handlerResult, handlerErr = s.handleBlockQuery(ctx, loc, entities.Year)
				}
			}
		} else {
			handlerResult, handlerErr = s.handleListAllStates(ctx, entities.Year)
		}
	case IntentTrend:
		handlerResult, handlerErr = s.handleTrend(ctx, entities, response)
	case IntentCompare:
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
		// USE NEW FOCUSED 4-ATTRIBUTE HANDLER
		if len(entities.Locations) > 0 {
			handlerResult, handlerErr = s.handleListBlocksFocused(ctx, entities.Locations[0], entities.Year)
		} else {
			response.Text = "Please specify a district. Example: 'Show blocks in Ludhiana'"
			handlerResult = response
		}
	case IntentListDistricts:
		// USE NEW FOCUSED 4-ATTRIBUTE HANDLER
		if len(entities.Locations) > 0 {
			handlerResult, handlerErr = s.handleListDistrictsFocused(ctx, entities.Locations[0], entities.Year)
		} else {
			handlerResult, handlerErr = s.handleListAllStates(ctx, entities.Year)
		}
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
		// Unknown intent - fall back to RAG search
		fmt.Printf("├─ ⚠️  Unknown intent '%s', falling back to RAG search\n", intent)
		goto RAG_FALLBACK
	}

	// Handle errors from intent handlers
	if handlerErr != nil {
		fmt.Printf("ERROR: Intent handler failed: %v\n", handlerErr)
		response.Text = "I encountered an error processing your request. Please try again."
		return response, nil
	}

	// Check if handler returned a "not found" or "no data" error message
	// If so, fall back to RAG search for better results
	shouldFallbackToRAG = false
	if handlerResult != nil && handlerResult.Text != "" {
		textLower = strings.ToLower(handlerResult.Text)
		// Detect error patterns that indicate we should try RAG
		errorPatterns := []string{
			"location not found",
			"no data found",
			"couldn't find",
			"could not find",
			"i couldn't find",
			"no blocks found",
			"no districts found",
			"no states found",
			"no results",
			"please provide at least two",
			"please check the spelling",
			"i found only",
		}

		for _, pattern := range errorPatterns {
			if strings.Contains(textLower, pattern) {
				shouldFallbackToRAG = true
				fmt.Printf("├─ ⚠️  Handler returned error/no data ('%s'), falling back to RAG search\n", pattern)
				break
			}
		}
	}

	if shouldFallbackToRAG {
		goto RAG_FALLBACK
	}

	// Track in conversation history
	s.mu.Lock()
	session.AddToHistory(message, handlerResult.Text, string(intent), entities.Locations)
	s.mu.Unlock()

	// Add bot response to LLM history
	if s.nlp.llm != nil {
		s.nlp.llm.AddToHistory("assistant", handlerResult.Text)
	}

	return handlerResult, nil

RAG_FALLBACK:
	// ========== RAG-BASED SEARCH (FALLBACK) ==========
	// Use RAG semantic/hybrid search when no intent matches
	fmt.Println("\n🔍 RAG SEMANTIC SEARCH PIPELINE (Fallback)")
	fmt.Println("├─ Using RAG Hybrid Search (Keyword + Vector Semantic Search)")

	// Perform RAG search
	if s.rag != nil {
		var searchResp *HybridSearchResponse
		var ragErr error

		msgLower := strings.ToLower(message)

		// Detect query type
		isComparisonQuery := strings.Contains(msgLower, "compare") ||
			strings.Contains(msgLower, " vs ") ||
			strings.Contains(msgLower, "versus")

		// Detect if query asks for multiple entities
		asksForMultipleEntities := strings.Contains(msgLower, "blocks in") ||
			strings.Contains(msgLower, "blocks of") ||
			strings.Contains(msgLower, "districts in") ||
			strings.Contains(msgLower, "districts of")

		// Check if query mentions specific locations (common district names)
		// This helps prioritize keyword search for location-specific queries
		hasLocationKeywords := false
		locationKeywords := []string{"amritsar", "ludhiana", "delhi", "mumbai", "bangalore", "chennai",
			"kolkata", "jaipur", "punjab", "haryana", "rajasthan", "gujarat", "maharashtra",
			"bihar", "uttar", "pradesh", "karnataka", "kerala", "tamil", "nadu", "andhra",
			"telangana", "madhya", "pradesh", "odisha", "west", "bengal", "assam",
			"district", "block", "state", " in ", "punjabi", "ajmer", "bikaner", "patna", "lucknow"}
		for _, keyword := range locationKeywords {
			if strings.Contains(msgLower, keyword) {
				hasLocationKeywords = true
				break
			}
		}

		if isComparisonQuery || hasLocationKeywords {
			// For location-specific queries, use keyword-only search for better matching
			queryProcessed := message

			if isComparisonQuery {
				// Example: "Compare Amritsar and Ludhiana" → "Amritsar OR Ludhiana"
				queryProcessed = strings.ReplaceAll(message, " and ", " OR ")
				queryProcessed = strings.ReplaceAll(queryProcessed, " & ", " OR ")
				queryProcessed = strings.ReplaceAll(queryProcessed, ",", " OR ")
				queryProcessed = strings.ReplaceAll(queryProcessed, "Compare ", "")
				queryProcessed = strings.ReplaceAll(queryProcessed, "compare ", "")
				queryProcessed = strings.ReplaceAll(queryProcessed, "versus ", "")
				queryProcessed = strings.ReplaceAll(queryProcessed, " vs ", " OR ")
				fmt.Printf("├─ Using keyword-only search for comparison query: %q\n", queryProcessed)
			} else {
				fmt.Printf("├─ Using keyword-only search for location-specific query\n")
			}

			searchReq := HybridSearchRequest{
				Query:       queryProcessed,
				UseKeyword:  true,
				UseSemantic: false,
				Limit:       30,
			}
			searchResp, ragErr = s.rag.HybridSearch(ctx, searchReq)

			// Fallback to hybrid if keyword fails
			if ragErr != nil || len(searchResp.Results) == 0 {
				fmt.Println("├─ Keyword-only returned no results, trying hybrid search")
				searchReq.UseSemantic = true
				searchResp, ragErr = s.rag.HybridSearch(ctx, searchReq)
			}
		} else {
			// Default hybrid search for non-comparison queries
			searchReq := HybridSearchRequest{
				Query:       message,
				UseKeyword:  true,
				UseSemantic: true,
				Limit:       20,
			}
			searchResp, ragErr = s.rag.HybridSearch(ctx, searchReq)
		}
		if ragErr != nil {
			fmt.Printf("❌ RAG search failed: %v\n", ragErr)
			response := &models.ChatResponse{
				Text: "I encountered an error searching the groundwater database. Please try again.",
			}
			return response, nil
		}

		fmt.Printf("📊 RAG returned %d results before filtering\n", len(searchResp.Results))
		if len(searchResp.Results) > 0 {
			fmt.Println("🔍 Sample raw results:")
			for i := 0; i < min(3, len(searchResp.Results)); i++ {
				r := searchResp.Results[i]
				fmt.Printf("  [%d] %s - %s (Score: %.2f) | Stage: %.2f, Rain: %.2f, Recharge: %.2f, Extraction: %.2f | Category: %s\n",
					i+1, r.BlockName, r.DistrictName, r.Score, r.Stage, r.Rainfall, r.TotalRecharge, r.TotalExtraction, r.Category)
			}
		}

		if len(searchResp.Results) == 0 {
			fmt.Println("├─ ⚠️  No results found")
			response := &models.ChatResponse{
				Text: s.buildNoDataFoundMessage(message),
			}
			return response, nil
		}

		// Filter out blocks with zero/invalid data
		filteredResults := make([]SearchResult, 0)
		queryLower := strings.ToLower(message)

		for _, result := range searchResp.Results {
			// Skip blocks with all zero values (incomplete data)
			if result.Stage == 0 && result.Rainfall == 0 && result.TotalRecharge == 0 && result.TotalExtraction == 0 {
				fmt.Printf("├─ Filtered: %s (all zeros)\n", result.BlockName)
				continue
			}

			// For location-based queries, filter out partial matches
			// e.g., "Bihar" or "blocks in Bihar" should not match "Koch Bihar" (West Bengal)
			if hasLocationKeywords && !asksForMultipleEntities {
				stateNameLower := strings.ToLower(result.StateName)
				districtNameLower := strings.ToLower(result.DistrictName)

				// Extract the main location name from query (remove "blocks in", "districts in", etc.)
				mainLocation := queryLower
				mainLocation = strings.ReplaceAll(mainLocation, "data in ", "")
				mainLocation = strings.ReplaceAll(mainLocation, "data of ", "")
				mainLocation = strings.ReplaceAll(mainLocation, "data for ", "")
				mainLocation = strings.ReplaceAll(mainLocation, "groundwater in ", "")
				mainLocation = strings.ReplaceAll(mainLocation, "groundwater of ", "")
				mainLocation = strings.ReplaceAll(mainLocation, "groundwater for ", "")
				mainLocation = strings.ReplaceAll(mainLocation, "block ", "")
				mainLocation = strings.ReplaceAll(mainLocation, " district", "")
				mainLocation = strings.TrimSpace(mainLocation)

				// STATE NAME must match exactly (prioritize state over block name)
				// "bihar" should only match state "BIHAR", not block "BIHAR" in Uttar Pradesh
				// Also check if mainLocation is a substring of a multi-word state name
				stateMatches := stateNameLower == mainLocation ||
					(len(mainLocation) > 3 && strings.Contains(" "+stateNameLower+" ", " "+mainLocation+" "))

				// DISTRICT NAME can match as substring
				// "patna" matches "PATNA" district
				// But "bihar" should NOT match "KOCH BIHAR" district
				districtMatches := districtNameLower == mainLocation ||
					(len(mainLocation) > 3 && strings.HasPrefix(districtNameLower, mainLocation))

				// For single-word queries, ONLY match state/district, not block names
				// "Bihar" should match BIHAR state, not BIHAR block in Uttar Pradesh
				if !stateMatches && !districtMatches {
					fmt.Printf("├─ Filtered: %s - %s, %s (looking for '%s', state='%s', district='%s')\n",
						result.BlockName, result.DistrictName, result.StateName, mainLocation, stateNameLower, districtNameLower)
					continue
				}

				fmt.Printf("├─ ✅ Location match: %s in %s, %s (query='%s')\n",
					result.BlockName, result.DistrictName, result.StateName, mainLocation)
			}

			// For comparison queries, prioritize results matching mentioned locations
			if isComparisonQuery {
				// Check if this result matches any location mentioned in the query
				resultLocationMatch := strings.Contains(queryLower, strings.ToLower(result.DistrictName)) ||
					strings.Contains(queryLower, strings.ToLower(result.BlockName)) ||
					strings.Contains(queryLower, strings.ToLower(result.StateName))

				// Skip "Hilly Area" completely for comparison queries
				if result.Category == "Hilly Area" {
					fmt.Printf("├─ Filtered: %s (hilly area in comparison)\n", result.BlockName)
					continue
				}

				// For comparison queries, skip results that don't match any mentioned location
				// UNLESS we have very few results (allow some flexibility)
				if !resultLocationMatch && len(filteredResults) >= 5 {
					fmt.Printf("├─ Filtered: %s - %s (no location match)\n", result.BlockName, result.DistrictName)
					continue
				}
			} else {
				// For non-comparison queries, skip "Hilly Area" unless explicitly queried
				if result.Category == "Hilly Area" && !strings.Contains(queryLower, "hilly") {
					fmt.Printf("├─ Filtered: %s (hilly area)\n", result.BlockName)
					continue
				}
			}

			fmt.Printf("├─ Keeping: %s - %s (Stage: %.2f, Rain: %.2f)\n", result.BlockName, result.DistrictName, result.Stage, result.Rainfall)
			filteredResults = append(filteredResults, result)
			if len(filteredResults) >= 10 {
				break
			}
		}

		fmt.Printf("✅ Filtering complete: %d results kept (from %d raw results)\n", len(filteredResults), len(searchResp.Results))

		if len(filteredResults) == 0 {
			fmt.Println("├─ ⚠️  No valid results after filtering")
			response := &models.ChatResponse{
				Text: s.buildFilteredOutMessage(message, len(searchResp.Results)),
			}
			return response, nil
		}

		fmt.Printf("├─ ✅ Found %d relevant assessments (filtered from %d)\n", len(filteredResults), len(searchResp.Results))

		// HIERARCHY AGGREGATION: Detect if query is for single state/district
		// and aggregate block-level data accordingly
		filteredResults = s.aggregateByHierarchy(filteredResults, msgLower)

		// Convert RAG results to visualization-friendly format
		ragResultsAsMap := make([]map[string]interface{}, 0, len(filteredResults))
		for _, result := range filteredResults {
			ragResultsAsMap = append(ragResultsAsMap, map[string]interface{}{
				"assessment_id":       result.AssessmentID,
				"block_uuid":          result.BlockUUID,
				"block_name":          result.BlockName,
				"district_name":       result.DistrictName,
				"state_name":          result.StateName,
				"year":                result.Year,
				"category":            result.Category,
				"stage":               result.Stage,
				"rainfall":            result.Rainfall,
				"total_recharge":      result.TotalRecharge,
				"total_extraction":    result.TotalExtraction,
				"score":               result.Score,
				"search_type":         result.SearchType,
				"text_representation": result.TextRepresentation,
				"raw_data":            result.RawData,
			})
		}

		// Build text response
		textResponse := s.buildRAGTextResponse(filteredResults)

		response := &models.ChatResponse{
			Text:   textResponse,
			Intent: "RAG_SEARCH",
			Data:   ragResultsAsMap,
		}

		// Generate chart visualization from RAG results
		fmt.Println("├─ 📊 Generating visualization from RAG results...")
		chartPayload := s.buildRAGChart(filteredResults, message)
		if chartPayload != nil {
			response.Chart = chartPayload
			fmt.Printf("├─ ✅ Chart generated: %s\n", chartPayload.Type)
		}

		// Track in conversation history
		s.mu.Lock()
		session.AddToHistory(message, response.Text, "RAG_SEARCH", []string{})
		s.mu.Unlock()

		// Add bot response to LLM history
		if s.nlp.llm != nil {
			s.nlp.llm.AddToHistory("assistant", response.Text)
		}

		fmt.Println(strings.Repeat("=", 80) + "\n")
		return response, nil
	}

	// ========== OLD NLP APPROACH (COMMENTED OUT) ==========
	/*
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
		contextUsed := false
		if len(entities.Locations) == 0 && len(session.LastEntities.Locations) > 0 {
			if intent == IntentTrend || intent == IntentCompare || intent == IntentListBlocks || intent == IntentSummary {
				fmt.Printf("├─ 🔗 Context Merging: Using previous location %v\n", session.LastEntities.Locations)
				entities.Locations = session.LastEntities.Locations
				contextUsed = true
			}
		}

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

		// OLD SQL EXECUTION PATH (COMMENTED OUT)
		/*
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
	*/

	/*
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
				fmt.Printf("├─ Map Title: %s\n", handlerResult.Map.Title)
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
	*/

	// If RAG is not available, return error
	return &models.ChatResponse{
		Text: "RAG service is not available. Please check the configuration.",
	}, nil
}

// aggregateByHierarchy detects query type and aggregates block data to state/district level if needed
func (s *ChatService) aggregateByHierarchy(results []SearchResult, queryLower string) []SearchResult {
	if len(results) == 0 {
		return results
	}

	// Check if query explicitly asks for multiple entities
	asksForMultiple := strings.Contains(queryLower, "blocks in") ||
		strings.Contains(queryLower, "blocks of") ||
		strings.Contains(queryLower, "districts in") ||
		strings.Contains(queryLower, "districts of") ||
		strings.Contains(queryLower, "compare") ||
		strings.Contains(queryLower, " vs ")

	if asksForMultiple {
		fmt.Println("├─ 🔍 Query asks for multiple entities - keeping individual results")
		return results
	}

	// Check if all results are from the same state
	firstState := results[0].StateName
	sameState := true
	for _, r := range results {
		if r.StateName != firstState {
			sameState = false
			break
		}
	}

	// Check if all results are from the same district
	firstDistrict := results[0].DistrictName
	sameDistrict := true
	for _, r := range results {
		if r.DistrictName != firstDistrict {
			sameDistrict = false
			break
		}
	}

	// If all from same district (and query doesn't ask for blocks), aggregate to district level
	if sameDistrict && !strings.Contains(queryLower, "block") {
		fmt.Printf("├─ 🔄 All results from same district (%s) - aggregating to district level\n", firstDistrict)
		return []SearchResult{s.aggregateToDistrict(results)}
	}

	// If all from same state but different districts (and query doesn't mention district/block)
	// Check if query is simple enough to warrant state-level aggregation
	if sameState && !sameDistrict {
		// If query mentions "district" or "block", keep individual results
		if strings.Contains(queryLower, "district") || strings.Contains(queryLower, "block") {
			fmt.Println("├─ ✅ Query mentions district/block - keeping individual results")
			return results
		}

		// If query is very short (likely just a state name), aggregate to state level
		queryWords := len(strings.Fields(queryLower))
		if queryWords <= 3 {
			fmt.Printf("├─ 🔄 Short query (%d words) about state %s - aggregating to state level\n", queryWords, firstState)
			return []SearchResult{s.aggregateToState(results)}
		}

		// For longer queries about specific topics (extraction, recharge, etc), keep individual results
		fmt.Printf("├─ 🔄 Topic-specific query about %s - keeping individual district results\n", firstState)
		return results
	}

	// Otherwise, return individual block results
	fmt.Println("├─ ✅ Keeping individual block-level results (multiple states)")
	return results
}

// aggregateToState aggregates block-level data to state level
func (s *ChatService) aggregateToState(results []SearchResult) SearchResult {
	if len(results) == 0 {
		return SearchResult{}
	}

	stateName := results[0].StateName
	year := results[0].Year // Use first result's year (most relevant)

	// Aggregate metrics (sum for volumes, average for stage)
	var totalRainfall, totalRecharge, totalExtraction, totalStage float64
	var stageCount int
	categories := make(map[string]int)

	for _, r := range results {
		totalRainfall += r.Rainfall
		totalRecharge += r.TotalRecharge
		totalExtraction += r.TotalExtraction
		if r.Stage > 0 {
			totalStage += r.Stage
			stageCount++
		}
		categories[r.Category]++
	}

	avgStage := float64(0)
	if stageCount > 0 {
		avgStage = totalStage / float64(stageCount)
	}

	// Determine dominant category
	dominantCategory := "N/A"
	maxCount := 0
	for cat, count := range categories {
		if count > maxCount {
			maxCount = count
			dominantCategory = cat
		}
	}

	fmt.Printf("├─ 📊 State Aggregation: %s | %d blocks | Avg Stage: %.2f%% | Total Rain: %.2f | Recharge: %.2f | Extraction: %.2f\n",
		stateName, len(results), avgStage, totalRainfall, totalRecharge, totalExtraction)

	return SearchResult{
		AssessmentID:    results[0].AssessmentID, // Keep first ID for reference
		BlockUUID:       results[0].BlockUUID,
		BlockName:       fmt.Sprintf("%s (State-Level Aggregation)", stateName),
		DistrictName:    "All Districts",
		StateName:       stateName,
		Year:            year,
		Category:        dominantCategory,
		Stage:           avgStage,
		Rainfall:        totalRainfall,
		TotalRecharge:   totalRecharge,
		TotalExtraction: totalExtraction,
		Score:           results[0].Score,
		SearchType:      "aggregated",
		TextRepresentation: fmt.Sprintf("State: %s | Year: %s | Aggregated from %d blocks | Average Stage: %.2f%% | Total Rainfall: %.2f mm | Total Recharge: %.2f BCM | Total Extraction: %.2f BCM",
			stateName, year, len(results), avgStage, totalRainfall, totalRecharge, totalExtraction),
	}
}

// aggregateToDistrict aggregates block-level data to district level
func (s *ChatService) aggregateToDistrict(results []SearchResult) SearchResult {
	if len(results) == 0 {
		return SearchResult{}
	}

	districtName := results[0].DistrictName
	stateName := results[0].StateName
	year := results[0].Year

	// Aggregate metrics
	var totalRainfall, totalRecharge, totalExtraction, totalStage float64
	var stageCount int
	categories := make(map[string]int)

	for _, r := range results {
		totalRainfall += r.Rainfall
		totalRecharge += r.TotalRecharge
		totalExtraction += r.TotalExtraction
		if r.Stage > 0 {
			totalStage += r.Stage
			stageCount++
		}
		categories[r.Category]++
	}

	avgStage := float64(0)
	if stageCount > 0 {
		avgStage = totalStage / float64(stageCount)
	}

	// Determine dominant category
	dominantCategory := "N/A"
	maxCount := 0
	for cat, count := range categories {
		if count > maxCount {
			maxCount = count
			dominantCategory = cat
		}
	}

	fmt.Printf("├─ 📊 District Aggregation: %s, %s | %d blocks | Avg Stage: %.2f%% | Total Rain: %.2f | Recharge: %.2f | Extraction: %.2f\n",
		districtName, stateName, len(results), avgStage, totalRainfall, totalRecharge, totalExtraction)

	return SearchResult{
		AssessmentID:    results[0].AssessmentID,
		BlockUUID:       results[0].BlockUUID,
		BlockName:       fmt.Sprintf("%s (District-Level Aggregation)", districtName),
		DistrictName:    districtName,
		StateName:       stateName,
		Year:            year,
		Category:        dominantCategory,
		Stage:           avgStage,
		Rainfall:        totalRainfall,
		TotalRecharge:   totalRecharge,
		TotalExtraction: totalExtraction,
		Score:           results[0].Score,
		SearchType:      "aggregated",
		TextRepresentation: fmt.Sprintf("District: %s, %s | Year: %s | Aggregated from %d blocks | Average Stage: %.2f%% | Total Rainfall: %.2f mm | Total Recharge: %.2f BCM | Total Extraction: %.2f BCM",
			districtName, stateName, year, len(results), avgStage, totalRainfall, totalRecharge, totalExtraction),
	}
}

// buildNoDataFoundMessage creates a contextual error message when no data is found
func (s *ChatService) buildNoDataFoundMessage(query string) string {
	queryLower := strings.ToLower(query)

	var sb strings.Builder
	sb.WriteString("❌ **No Groundwater Data Found**\n\n")

	// Detect what type of query this was
	if strings.Contains(queryLower, "compare") || strings.Contains(queryLower, " vs ") {
		sb.WriteString("I couldn't find groundwater assessment data for the locations you mentioned.\n\n")
		sb.WriteString("**Possible reasons:**\n")
		sb.WriteString("- The location names might be misspelled\n")
		sb.WriteString("- Data might not be available for these specific areas\n")
		sb.WriteString("- Try using district names instead of city names (e.g., 'Amritsar' instead of 'Amritsar City')\n\n")
	} else {
		sb.WriteString("I couldn't find any groundwater assessments matching your query.\n\n")
		sb.WriteString("**Possible reasons:**\n")
		sb.WriteString("- The location might not have assessment data\n")
		sb.WriteString("- Try different search terms or location names\n")
		sb.WriteString("- Data might only be available for certain years\n\n")
	}

	sb.WriteString("**📊 Available Data Coverage:**\n")
	sb.WriteString("- **Years:** 2023-2024, 2024-2025\n")
	sb.WriteString("- **Locations:** 38 States, 590+ Districts, 6746+ Blocks\n")
	sb.WriteString("- **Total Assessments:** 13,492 groundwater assessments\n\n")

	sb.WriteString("**💡 Try asking:**\n")
	sb.WriteString("- \"Punjab groundwater status\"\n")
	sb.WriteString("- \"Critical blocks in Punjab\"\n")
	sb.WriteString("- \"Compare Haryana and Rajasthan\"\n")
	sb.WriteString("- \"Show districts in Punjab\"\n")
	sb.WriteString("- \"Ludhiana district overview\"\n")

	return sb.String()
}

// buildFilteredOutMessage creates a message when results were found but filtered out
func (s *ChatService) buildFilteredOutMessage(query string, rawResultCount int) string {
	queryLower := strings.ToLower(query)

	var sb strings.Builder
	sb.WriteString("⚠️ **Data Found But Incomplete**\n\n")

	sb.WriteString(fmt.Sprintf("I found %d potential matches, but they contained incomplete or invalid data.\n\n", rawResultCount))

	sb.WriteString("**Common reasons for filtering:**\n")
	sb.WriteString("- Assessment data has all zero values (not yet surveyed)\n")
	sb.WriteString("- Location is classified as 'Hilly Area' with no groundwater data\n")

	if strings.Contains(queryLower, "compare") || strings.Contains(queryLower, " vs ") {
		sb.WriteString("- For comparison queries, results must match the mentioned locations\n")
	}

	sb.WriteString("\n**💡 Suggestions:**\n")
	sb.WriteString("- Try nearby districts or blocks\n")
	sb.WriteString("- Check different years (data availability varies by year)\n")
	sb.WriteString("- Use broader search terms (e.g., state name instead of specific block)\n\n")

	sb.WriteString("**Example queries that work well:**\n")
	sb.WriteString("- \"Compare Amritsar and Ludhiana\"\n")
	sb.WriteString("- \"Groundwater extraction in Punjab\"\n")
	sb.WriteString("- \"Over-exploited blocks in Rajasthan\"\n")

	return sb.String()
}

// buildRAGTextResponse generates a formatted text response from RAG search results
func (s *ChatService) buildRAGTextResponse(results []SearchResult) string {
	if len(results) == 0 {
		return "No results found."
	}

	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("I found %d relevant groundwater assessments:\n\n", len(results)))

	for i, result := range results {
		if i >= 5 {
			sb.WriteString(fmt.Sprintf("\n...and %d more results", len(results)-5))
			break
		}

		sb.WriteString(fmt.Sprintf("%d. **%s** (%s, %s)\n", i+1, result.BlockName, result.DistrictName, result.StateName))
		sb.WriteString(fmt.Sprintf("   - Year: %s\n", result.Year))
		sb.WriteString(fmt.Sprintf("   - Category: **%s**\n", strings.ToUpper(result.Category)))
		sb.WriteString(fmt.Sprintf("   - Stage of Extraction: %.2f%%\n", result.Stage))
		sb.WriteString(fmt.Sprintf("   - Rainfall: %.2f mm\n", result.Rainfall))
		sb.WriteString(fmt.Sprintf("   - Relevance: %.2f%%\n\n", result.Score*100))
	}

	return sb.String()
}

// buildRAGChart creates visualizations from RAG search results
func (s *ChatService) buildRAGChart(results []SearchResult, query string) *models.ChartPayload {
	if len(results) == 0 {
		return nil
	}

	// Analyze query to determine best chart type
	queryLower := strings.ToLower(query)

	// Bar chart for comparisons and listings (default)
	labels := make([]string, 0, len(results))
	stageData := make([]float64, 0, len(results))
	rainfallData := make([]float64, 0, len(results))
	extractionData := make([]float64, 0, len(results))
	rechargeData := make([]float64, 0, len(results))

	for i, result := range results {
		if i >= 10 {
			break
		}
		labels = append(labels, result.BlockName)
		stageData = append(stageData, result.Stage)
		rainfallData = append(rainfallData, result.Rainfall)
		extractionData = append(extractionData, result.TotalExtraction)
		rechargeData = append(rechargeData, result.TotalRecharge)
	}

	chart := &models.ChartPayload{
		Type:   "bar",
		Title:  "Groundwater Assessment Results",
		XAxis:  labels,
		Series: []models.ChartSeries{},
	}

	// Determine which metrics to show based on query (prioritize more specific keywords)
	if strings.Contains(queryLower, "recharge") && (strings.Contains(queryLower, "extraction") || strings.Contains(queryLower, "comparison") || strings.Contains(queryLower, "vs")) {
		// Recharge vs Extraction comparison
		chart.Series = append(chart.Series, models.ChartSeries{
			Name: "Total Recharge (MCM)",
			Data: rechargeData,
		})
		chart.Series = append(chart.Series, models.ChartSeries{
			Name: "Total Extraction (MCM)",
			Data: extractionData,
		})
		chart.Title = "Recharge vs Extraction"
	} else if strings.Contains(queryLower, "rainfall") || strings.Contains(queryLower, "rain") {
		chart.Series = append(chart.Series, models.ChartSeries{
			Name: "Rainfall (mm)",
			Data: rainfallData,
		})
		chart.Title = "Rainfall Distribution"
	} else if strings.Contains(queryLower, "extraction") || strings.Contains(queryLower, "stage") || strings.Contains(queryLower, "depletion") {
		chart.Series = append(chart.Series, models.ChartSeries{
			Name: "Stage of Extraction (%)",
			Data: stageData,
		})
		chart.Title = "Stage of Groundwater Extraction"
	} else if strings.Contains(queryLower, "recharge") {
		chart.Series = append(chart.Series, models.ChartSeries{
			Name: "Total Recharge (MCM)",
			Data: rechargeData,
		})
		chart.Title = "Groundwater Recharge"
	} else {
		// Default: show stage and rainfall
		chart.Series = append(chart.Series, models.ChartSeries{
			Name: "Stage of Extraction (%)",
			Data: stageData,
		})
		chart.Series = append(chart.Series, models.ChartSeries{
			Name: "Rainfall (mm)",
			Data: rainfallData,
		})
		chart.Title = "Groundwater Metrics"
	}

	return chart
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
			return map[string]interface{}{"data": toStringSlice(data)}
		}
		if data, ok := t["data"].([]string); ok {
			return map[string]interface{}{"data": data}
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
	// Try Redis cache first for trend data
	if s.cache != nil && s.cache.IsEnabled() && len(e.Locations) > 0 {
		locationKey := strings.Join(e.Locations, "_")
		cachedData, err := s.cache.GetTrendData(ctx, locationKey, e.StartYear, e.EndYear)
		if err == nil && cachedData != nil {
			fmt.Printf("├─ ⚡ REDIS CACHE HIT: trend:%s:%s-%s\n", locationKey, e.StartYear, e.EndYear)
			if cachedResp, ok := cachedData.(string); ok {
				if err := json.Unmarshal([]byte(cachedResp), r); err == nil {
					fmt.Printf("└─ ✅ Returning cached trend data (0ms DB query)\n\n")
					return r, nil
				}
			}
		} else {
			fmt.Printf("├─ ⚠️  Cache miss for trend, fetching from database...\n")
		}
	}

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

				// Build trend-card chart
				result := s.buildTrendCard(trends, locationName, locationType, e.StartYear, e.EndYear, r)

				// Cache the result
				if s.cache != nil && s.cache.IsEnabled() {
					respJSON, _ := json.Marshal(result)
					s.cache.SetTrendData(ctx, locationName, e.StartYear, e.EndYear, string(respJSON))
				}

				return result, nil
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

				// Build trend-card chart
				result := s.buildTrendCard(trends, locationName, locationType, e.StartYear, e.EndYear, r)

				// Cache the result
				if s.cache != nil && s.cache.IsEnabled() {
					respJSON, _ := json.Marshal(result)
					s.cache.SetTrendData(ctx, locationName, e.StartYear, e.EndYear, string(respJSON))
				}

				return result, nil
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

	result := s.buildTrendCard(trends, locationName, locationType, e.StartYear, e.EndYear, r)

	// Cache the result for future requests
	if s.cache != nil && s.cache.IsEnabled() && len(e.Locations) > 0 {
		locationKey := strings.Join(e.Locations, "_")
		respJSON, err := json.Marshal(result)
		if err == nil {
			s.cache.SetTrendData(ctx, locationKey, e.StartYear, e.EndYear, string(respJSON))
			fmt.Printf("├─ ⚡ Cached trend data (TTL: 1 hour)\n")
		}
	}

	return result, nil
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
	fmt.Println("\n🔍 COMPARISON HANDLER")
	fmt.Printf("├─ Comparing %d locations: %v\n", len(e.Locations), e.Locations)
	fmt.Printf("├─ Year: %s\n", e.Year)

	// Validate minimum locations for comparison
	if len(e.Locations) < 2 {
		if len(e.Locations) == 1 {
			fmt.Printf("├─ ⚠️  Only 1 location provided, need at least 2\n")
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
	fmt.Println("├─ Searching database for locations...")
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
		fmt.Printf("├─ ❌ No locations found in database\n")
		r.Text = fmt.Sprintf("I couldn't find any of these locations: %s. Please check the spelling.", strings.Join(e.Locations, ", "))
		return r, nil
	}

	fmt.Printf("├─ ✅ Found: %d states, %d districts, %d blocks\n", len(statesFound), len(districtsFound), len(blocksFound))

	// Handle state comparison (if 2+ states found)
	if len(statesFound) >= 2 {
		fmt.Println("├─ 🏛️  Routing to STATE comparison handler")
		return s.compareStates(ctx, statesFound, e.Year, r)
	}

	// Handle district comparison (if 2+ districts found)
	if len(districtsFound) >= 2 {
		fmt.Println("├─ 🏙️  Routing to DISTRICT comparison handler")
		return s.compareDistricts(ctx, districtsFound, e.Year, r)
	}

	// Handle block comparison (if 2+ blocks found)
	if len(blocksFound) >= 2 {
		fmt.Println("├─ 🏘️  Routing to BLOCK comparison handler")
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

	// Add follow-up suggestions
	r.Suggestions = []string{
		fmt.Sprintf("%s groundwater status", names[0]),
		fmt.Sprintf("%s groundwater status", names[1]),
		fmt.Sprintf("Critical blocks in %s", names[worstIdx]),
		fmt.Sprintf("Show districts in %s", names[0]),
	}

	return r, nil
}

// compareDistricts compares multiple districts
func (s *ChatService) compareDistricts(ctx context.Context, districts []*models.District, year string, r *models.ChatResponse) (*models.ChatResponse, error) {
	// Try Redis cache first if enabled
	if s.cache != nil && s.cache.IsEnabled() && len(districts) >= 2 {
		cacheKey := fmt.Sprintf("comparison:districts:%s:%s:%s", districts[0].DistrictName, districts[1].DistrictName, year)
		cachedData, err := s.cache.GetComparisonData(ctx, districts[0].DistrictName, districts[1].DistrictName, year)
		if err == nil && cachedData != nil {
			fmt.Printf("├─ ⚡ REDIS CACHE HIT: %s\n", cacheKey)
			// Unmarshal cached response
			if cachedResp, ok := cachedData.(string); ok {
				if err := json.Unmarshal([]byte(cachedResp), r); err == nil {
					fmt.Printf("└─ ✅ Returning cached comparison data (0ms DB query)\n\n")
					return r, nil
				}
			}
		} else {
			fmt.Printf("├─ ⚠️  Cache miss, fetching from database...\n")
		}
	}

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
		fmt.Println("├─ ❌ Insufficient data retrieved from database")
		r.Text = fmt.Sprintf("Could not retrieve sufficient data for %s comparison.", year)
		return r, nil
	}

	fmt.Printf("├─ ✅ Retrieved data for %d districts\n", len(names))
	fmt.Printf("├─ 📊 Calculating best/worst performers...\n")

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

	fmt.Printf("├─ 🏆 Best: %s (%.1f%% stage)\n", names[bestIdx], stages[bestIdx])
	fmt.Printf("├─ ⚠️  Worst: %s (%.1f%% stage)\n", names[worstIdx], stages[worstIdx])

	r.Text = fmt.Sprintf("🔍 **District Comparison Analysis (%s)**\n\n"+
		"📊 **Comparing**: %s\n\n"+
		"🏆 **Best Performer**: %s (%.1f%% stage)\n"+
		"⚠️ **Needs Attention**: %s (%.1f%% stage)\n\n"+
		"*Lower stage %% indicates more sustainable groundwater usage.*",
		year, strings.Join(names, " vs "),
		names[bestIdx], stages[bestIdx],
		names[worstIdx], stages[worstIdx])

	fmt.Println("├─ 📦 Building comparison chart payload...")
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

	fmt.Printf("├─ ✅ Chart created with %d locations\n", len(comparisonPoints))

	// Cache the complete response for next time
	if s.cache != nil && s.cache.IsEnabled() && len(districts) >= 2 {
		respJSON, err := json.Marshal(r)
		if err == nil {
			s.cache.SetComparisonData(ctx, districts[0].DistrictName, districts[1].DistrictName, year, string(respJSON))
			fmt.Printf("├─ ⚡ Cached response for future requests (TTL: 1 hour)\n")
		}
	}

	fmt.Printf("└─ 📤 Sending response to frontend...\n\n")

	// Add follow-up suggestions
	r.Suggestions = []string{
		fmt.Sprintf("%s district overview", names[0]),
		fmt.Sprintf("%s district overview", names[1]),
		fmt.Sprintf("Show blocks in %s", names[worstIdx]),
		fmt.Sprintf("Critical blocks in %s", names[worstIdx]),
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
	// Parse category from query text if not set
	if e.Category == "" {
		queryLower := strings.ToLower(e.OriginalQuery)
		if strings.Contains(queryLower, "critical") && !strings.Contains(queryLower, "semi") {
			e.Category = "critical"
		} else if strings.Contains(queryLower, "semi-critical") || strings.Contains(queryLower, "semi critical") {
			e.Category = "semi_critical"
		} else if strings.Contains(queryLower, "over-exploited") || strings.Contains(queryLower, "over exploited") || strings.Contains(queryLower, "overexploited") {
			e.Category = "over_exploited"
		} else if strings.Contains(queryLower, "safe") {
			e.Category = "safe"
		} else if strings.Contains(queryLower, "salinity") {
			e.Category = "salinity"
		}
	}

	if e.Category == "" {
		r.Text = "Which category? (Safe, Critical, Semi-Critical, Over-Exploited)"
		r.Suggestions = []string{"Safe blocks", "Critical blocks", "Over-exploited blocks", "Semi-critical blocks"}
		return r, nil
	}

	var blocks []models.Block
	var err error
	var locationName string
	var locationType string = "india" // Default to all India
	var stateUUID, districtUUID string
	_ = districtUUID // Keep for future use
	year := "2024-2025"
	if e.Year != "" {
		year = e.Year
	}

	// Check if location is specified - with proper hierarchy: State > District > Block
	if len(e.Locations) > 0 {
		locationName = strings.Join(e.Locations, " ")

		// PRIORITY 1: Check if it's a STATE
		state, stateErr := s.ingres.GetStateByName(ctx, locationName)
		if stateErr == nil && state != nil {
			locationType = "state"
			stateUUID = state.StateUUID.String()
			locationName = state.StateName
			fmt.Printf("├─ 📍 Location identified as STATE: %s\n", state.StateName)
		} else {
			// PRIORITY 2: Check if it's a DISTRICT
			district, distErr := s.ingres.GetDistrictByName(ctx, locationName)
			if distErr == nil && district != nil {
				locationType = "district"
				districtUUID = district.DistrictUUID.String()
				locationName = district.DistrictName
				// Get parent state
				parentState, _ := s.ingres.repo.GetStateByUUID(ctx, district.StateUUID)
				if parentState != nil {
					stateUUID = parentState.StateUUID.String()
				}
				fmt.Printf("├─ 📍 Location identified as DISTRICT: %s\n", district.DistrictName)
			}
		}

		blocks, err = s.ingres.repo.GetBlocksByCategoryAndLocation(ctx, e.Category, locationName)
	} else {
		blocks, err = s.ingres.GetBlocksByCategory(ctx, e.Category)
	}

	if err != nil {
		fmt.Printf("├─ ❌ Error fetching blocks: %v\n", err)
		return nil, err
	}

	categoryDisplay := formatCategory(e.Category)
	categoryEmoji := getCategoryEmoji(e.Category)

	if len(blocks) == 0 {
		if locationName != "" {
			r.Text = fmt.Sprintf("No %s blocks found in %s for %s.", categoryDisplay, locationName, year)
			r.Suggestions = []string{
				fmt.Sprintf("All blocks in %s", locationName),
				fmt.Sprintf("%s overview", locationName),
				"Show all states",
			}
		} else {
			r.Text = fmt.Sprintf("No %s blocks found for %s.", categoryDisplay, year)
			r.Suggestions = []string{"Show all states", "Safe blocks", "Critical blocks"}
		}
		return r, nil
	}

	// Cache the result for future queries
	if s.cache != nil && s.cache.IsEnabled() {
		locationKey := locationName
		if locationKey == "" {
			locationKey = "all"
		}
		s.cache.SetBlocksByCategory(ctx, locationKey, e.Category, year, blocks)
		fmt.Printf("├─ ⚡ Cached %d blocks for future queries\n", len(blocks))
	}

	// Build comprehensive response
	var blockNames []string
	var stageData []float64
	limit := 20
	for i, b := range blocks {
		if i >= limit {
			break
		}
		blockNames = append(blockNames, b.BlockName)
		stageData = append(stageData, 1) // Placeholder for visualization
	}

	// Build response text
	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("%s **%s Blocks in %s** (%s)\n", categoryEmoji, categoryDisplay, strings.ToUpper(locationName), year))
	sb.WriteString("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n")
	sb.WriteString(fmt.Sprintf("📊 **Total Found:** %d blocks\n\n", len(blocks)))

	// List blocks in table format (first 15)
	sb.WriteString("| # | Block Name | District |\n")
	sb.WriteString("|---|------------|----------|\n")

	for i, b := range blocks {
		if i >= 15 {
			break
		}
		// Get district name
		district, _ := s.ingres.repo.GetDistrictByUUID(ctx, b.DistrictUUID)
		districtName := "Unknown"
		if district != nil {
			districtName = district.DistrictName
		}
		sb.WriteString(fmt.Sprintf("| %d | %s | %s |\n", i+1, b.BlockName, districtName))
	}

	if len(blocks) > 15 {
		sb.WriteString(fmt.Sprintf("\n... and **%d more** blocks\n", len(blocks)-15))
	}

	r.Text = sb.String()

	// Create beautiful rose-pie chart showing blocks by district
	districtCounts := make(map[string]float64)
	for _, b := range blocks {
		district, _ := s.ingres.repo.GetDistrictByUUID(ctx, b.DistrictUUID)
		if district != nil {
			districtCounts[district.DistrictName]++
		}
	}

	var pieData []models.PieDatum
	for name, count := range districtCounts {
		// Get district UUID for navigation
		district, _ := s.ingres.GetDistrictByName(ctx, name)
		districtUUID := ""
		if district != nil {
			districtUUID = district.DistrictUUID.String()
		}
		pieData = append(pieData, models.PieDatum{
			Name:         name,
			Value:        count,
			DistrictUUID: districtUUID,
		})
	}

	// If we have district breakdown, use rose-pie, otherwise use brush-bar
	if len(pieData) > 1 {
		r.Chart = &models.ChartPayload{
			Type:    "rose-pie",
			Title:   fmt.Sprintf("%s %s Blocks - District Distribution", categoryEmoji, categoryDisplay),
			PieData: pieData,
		}
	} else {
		// Simple bar chart for single district or block list
		r.Chart = &models.ChartPayload{
			Type:  "brush-bar",
			Title: fmt.Sprintf("%s %s Blocks in %s", categoryEmoji, categoryDisplay, locationName),
			XAxis: map[string]interface{}{"data": blockNames},
			Series: []models.ChartSeries{
				{Name: "Blocks", Data: stageData, Type: "bar"},
			},
		}
	}

	// Context-aware suggestions based on location type and category
	suggestions := []string{}

	switch locationType {
	case "state":
		suggestions = append(suggestions, fmt.Sprintf("Show all districts in %s", locationName))
		suggestions = append(suggestions, fmt.Sprintf("%s overview", locationName))
		// Suggest other categories
		if e.Category != "safe" {
			suggestions = append(suggestions, fmt.Sprintf("Safe blocks in %s", locationName))
		}
		if e.Category != "over_exploited" {
			suggestions = append(suggestions, fmt.Sprintf("Over-exploited blocks in %s", locationName))
		}
		// Add escape option to explore other regions
		suggestions = append(suggestions, "Show all states")
	case "district":
		suggestions = append(suggestions, fmt.Sprintf("All blocks in %s", locationName))
		suggestions = append(suggestions, fmt.Sprintf("%s district overview", locationName))
		// Suggest parent state
		if stateUUID != "" {
			parentState, _ := s.ingres.repo.GetStateByUUID(ctx, uuid.MustParse(stateUUID))
			if parentState != nil {
				suggestions = append(suggestions, fmt.Sprintf("%s state overview", parentState.StateName))
			}
		}
	default:
		suggestions = append(suggestions, "Show all states")
		suggestions = append(suggestions, "Punjab groundwater status")
		suggestions = append(suggestions, "Haryana groundwater status")
	}

	r.Suggestions = suggestions
	r.Data = blocks

	return r, nil
}

func (s *ChatService) handleListBlocks(ctx context.Context, e Entities, r *models.ChatResponse) (*models.ChatResponse, error) {
	// List blocks based on criteria (e.g., rainfall < 500, stage > 90)

	// Try Redis cache first for category-based queries
	if s.cache != nil && s.cache.IsEnabled() && e.Category != "" {
		locationKey := strings.Join(e.Locations, "_")
		if locationKey == "" {
			locationKey = "all"
		}
		cacheKey := fmt.Sprintf("blocks:category:%s:%s:%s", locationKey, e.Category, e.Year)
		cachedBlocks, err := s.cache.GetBlocksByCategory(ctx, locationKey, e.Category, e.Year)
		if err == nil && cachedBlocks != nil {
			fmt.Printf("├─ ⚡ REDIS CACHE HIT: %s (%d blocks)\n", cacheKey, len(cachedBlocks))
			// Build response from cached blocks
			var blockNames []string
			limit := 15
			for i, b := range cachedBlocks {
				if i >= limit {
					break
				}
				blockNames = append(blockNames, b.BlockName)
			}

			locationName := strings.Join(e.Locations, " ")
			if locationName != "" {
				r.Text = fmt.Sprintf("🔍 **%s Blocks in %s (%d total)**\n\n%s",
					strings.Title(strings.ToLower(e.Category)),
					strings.ToUpper(locationName),
					len(cachedBlocks),
					strings.Join(blockNames, ", "))
			} else {
				r.Text = fmt.Sprintf("🔍 **%s Blocks (%d total)**\n\n%s",
					strings.Title(strings.ToLower(e.Category)),
					len(cachedBlocks),
					strings.Join(blockNames, ", "))
			}

			if len(cachedBlocks) > limit {
				r.Text += fmt.Sprintf("\n\n... and %d more blocks", len(cachedBlocks)-limit)
			}

			fmt.Printf("└─ ✅ Returning cached list (0ms DB query)\n\n")
			return r, nil
		} else {
			fmt.Printf("├─ ⚠️  Cache miss for blocks list, querying database...\n")
		}
	}

	var blocks []models.Block
	var summaries []models.AssessmentSummary
	var err error

	// Extract location filter if specified
	var locationFilter string
	if len(e.Locations) > 0 {
		locationFilter = strings.ToLower(strings.Join(e.Locations, " "))
	}

	// Parse category from query text if not set
	if e.Category == "" {
		queryLower := strings.ToLower(e.OriginalQuery)
		if strings.Contains(queryLower, "critical") && !strings.Contains(queryLower, "semi") {
			e.Category = "critical"
		} else if strings.Contains(queryLower, "semi-critical") || strings.Contains(queryLower, "semi critical") {
			e.Category = "semi_critical"
		} else if strings.Contains(queryLower, "over-exploited") || strings.Contains(queryLower, "over exploited") {
			e.Category = "over_exploited"
		} else if strings.Contains(queryLower, "safe") {
			e.Category = "safe"
		} else if strings.Contains(queryLower, "salinity") {
			e.Category = "salinity"
		}
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

			// Cache the blocks for future requests
			if s.cache != nil && s.cache.IsEnabled() {
				locationKey := locationName
				if locationKey == "" {
					locationKey = "all"
				}
				s.cache.SetBlocksByCategory(ctx, locationKey, e.Category, e.Year, blocks)
				fmt.Printf("├─ ⚡ Cached %d blocks (TTL: 1 hour)\n", len(blocks))
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

			// Try State - show blocks with assessments
			state, err := s.ingres.GetStateByName(ctx, locationName)
			if err == nil && state != nil {
				// Get blocks with assessment data for this state
				year := e.Year
				if year == "" {
					year = "2024-2025"
				}

				sqlQuery := fmt.Sprintf(`
					SELECT DISTINCT
						b.block_uuid,
						b.block_name,
						d.district_name,
						a.stage,
						a.category,
						a.total_extraction
					FROM assessments_summary a
					JOIN blocks b ON a.block_uuid = b.block_uuid
					JOIN districts d ON b.district_uuid = d.district_uuid
					WHERE b.state_uuid = '%s'
					AND a.year = '%s'
					AND a.stage > 0
					ORDER BY a.stage DESC
					LIMIT 100
				`, state.StateUUID, year)

				results, err := s.ingres.repo.RunRawQuery(ctx, sqlQuery)
				if err == nil && len(results) > 0 {
					// Create pie data for rose chart
					var pieData []models.PieDatum
					var blockNames []string

					for i, result := range results {
						if i >= 50 { // Limit to 50 blocks for visualization
							break
						}

						blockName := ""
						districtName := ""
						blockUUID := ""
						stage := 0.0

						if bn, ok := result["block_name"].(string); ok {
							blockName = bn
						}
						if dn, ok := result["district_name"].(string); ok {
							districtName = dn
						}
						if bu, ok := result["block_uuid"].(string); ok {
							blockUUID = bu
						}
						if s, ok := result["stage"].(float64); ok {
							stage = s
						}

						if blockName != "" && stage > 0 {
							label := fmt.Sprintf("%s, %s", blockName, districtName)
							blockNames = append(blockNames, blockName)
							pieData = append(pieData, models.PieDatum{
								Name:      label,
								Value:     stage,
								BlockUUID: blockUUID,
							})
						}
					}

					r.Text = fmt.Sprintf("Here are the blocks in %s state (%d total blocks with data):\n\nShowing top %d blocks by extraction stage.",
						state.StateName, len(results), len(pieData))

					// Create rose/nightingale chart
					if len(pieData) > 0 {
						r.Chart = &models.ChartPayload{
							Type:    "rose-pie",
							Title:   fmt.Sprintf("Blocks in %s - Extraction Stages", state.StateName),
							PieData: pieData,
						}
					}

					r.Data = results
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

		// Get districts with assessment data for visualization
		year := e.Year
		if year == "" {
			year = "2024-2025"
		}

		// Query to get districts with their average stage data for visual representation
		sqlQuery := fmt.Sprintf(`
			SELECT 
				d.district_name,
				d.district_uuid,
				COALESCE(AVG(CASE WHEN a.stage > 0 THEN a.stage ELSE NULL END), 0) as avg_stage,
				COUNT(DISTINCT CASE WHEN a.block_uuid IS NOT NULL THEN b.block_uuid END) as block_count,
				COUNT(DISTINCT b.block_uuid) as total_blocks
			FROM districts d
			JOIN blocks b ON d.district_uuid = b.district_uuid
			LEFT JOIN assessments_summary a ON b.block_uuid = a.block_uuid AND a.year = '%s'
			WHERE d.state_uuid = '%s'
			GROUP BY d.district_uuid, d.district_name
			HAVING COUNT(DISTINCT b.block_uuid) > 0
			ORDER BY avg_stage DESC NULLS LAST
			LIMIT 50
		`, year, targetState.StateUUID)

		results, err := s.ingres.repo.RunRawQuery(ctx, sqlQuery)
		if err == nil && len(results) > 0 {
			// Create bar chart data - only include districts with valid data
			var xAxisData []string
			var stageData []float64
			var blockCountData []float64
			validCount := 0

			for _, result := range results {
				districtName := ""
				avgStage := 0.0
				blockCount := 0.0

				if dn, ok := result["district_name"].(string); ok {
					districtName = dn
				}
				if s, ok := result["avg_stage"].(float64); ok {
					avgStage = s
				}
				if bc, ok := result["block_count"].(float64); ok {
					blockCount = bc
				}

				// Only add if we have meaningful data
				if districtName != "" && blockCount > 0 {
					xAxisData = append(xAxisData, districtName)
					stageData = append(stageData, avgStage)
					blockCountData = append(blockCountData, blockCount)
					validCount++
				}
			}

			// Only return chart if we have valid data
			if validCount == 0 {
				// No valid data, fall through to simple district list
				goto SIMPLE_DISTRICT_LIST
			}

			r.Text = fmt.Sprintf("Here are all %d districts in %s state, visualized by their average groundwater extraction stage.",
				len(results), targetState.StateName)

			// Create beautiful bar chart
			r.Chart = &models.ChartPayload{
				Type:  "brush-bar",
				Title: fmt.Sprintf("Districts in %s - Groundwater Stage Analysis", targetState.StateName),
				XAxis: xAxisData,
				Series: []models.ChartSeries{
					{
						Name: "Avg Extraction Stage (%)",
						Data: stageData,
						Type: "bar",
					},
					{
						Name: "Number of Blocks",
						Data: blockCountData,
						Type: "line",
					},
				},
			}

			r.Data = results
			return r, nil
		}

	SIMPLE_DISTRICT_LIST:
		// Fallback: if query fails or no valid data, just list district names
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
	// ALWAYS parse category from query text for reliability
	queryLower := strings.ToLower(e.OriginalQuery)
	category := ""

	// Check query text first (most reliable)
	if strings.Contains(queryLower, "critical") && !strings.Contains(queryLower, "semi") {
		category = "critical"
	} else if strings.Contains(queryLower, "semi-critical") || strings.Contains(queryLower, "semi critical") {
		category = "semi_critical"
	} else if strings.Contains(queryLower, "over-exploited") || strings.Contains(queryLower, "over exploited") || strings.Contains(queryLower, "overexploited") {
		category = "over_exploited"
	} else if strings.Contains(queryLower, "safe") {
		category = "safe"
	} else if strings.Contains(queryLower, "salinity") || strings.Contains(queryLower, "saline") {
		category = "salinity"
	} else if e.Category != "" {
		// Fall back to AI-extracted category if no keyword match
		category = e.Category
	} else {
		// Final default
		category = "over_exploited"
	}

	fmt.Printf("DEBUG handleTopRanking: Query='%s', Detected category='%s'\n", queryLower, category)

	year := e.Year
	if year == "" {
		year = "2024-2025"
	}

	// Extract limit from threshold (AI can populate this) or default to 10
	limit := 10
	if e.Threshold > 0 && e.Threshold <= 50 {
		limit = int(e.Threshold)
	}

	// Determine aggregation level: blocks (default), districts, or states
	level := "blocks"

	// Build SQL based on level
	var sqlQuery string

	if level == "blocks" {
		sqlQuery = fmt.Sprintf(`
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
	}

	// Add location filter if specified
	if len(e.Locations) > 0 {
		location := strings.ToUpper(e.Locations[0])
		sqlQuery += fmt.Sprintf(" AND (UPPER(s.state_name) = '%s' OR UPPER(d.district_name) = '%s')\n", location, location)
	}

	sqlQuery += fmt.Sprintf("\t\tORDER BY a.stage DESC\n\t\tLIMIT %d", limit)

	fmt.Printf("DEBUG: Top Ranking - Category extracted: '%s', Year: '%s', Limit: %d\n", category, year, limit)
	fmt.Printf("DEBUG: Top Ranking - Original query: '%s'\n", e.OriginalQuery)
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
