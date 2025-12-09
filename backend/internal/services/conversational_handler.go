package services

import (
	"context"
	"fmt"
	"strings"

	"github.com/hxrshxz/ground-sense-bot/backend/internal/models"
)

// ============================================================================
// CONVERSATIONAL HANDLER - Text-to-SQL Pipeline
// 4 Key Attributes: Extractable, Extraction, Stage, Category
// Unit: ham (hectare-meters) - NO ROUNDING
// Minimal interface - no emojis
// ============================================================================

type ConversationalIntent string

const (
	IntentGreeting   ConversationalIntent = "greeting"
	IntentQuestion   ConversationalIntent = "question"
	IntentDataQuery  ConversationalIntent = "data_query"
	IntentComparison ConversationalIntent = "comparison"
	IntentClarify    ConversationalIntent = "clarify"
)

type ConversationalHandler struct {
	llm                 *LLMService
	ingres              *IngresService
	conversationHistory []ConversationMessageStruct
}

type ConversationMessageStruct struct {
	Role    string
	Content string
}

func NewConversationalHandler(llm *LLMService, ingres *IngresService) *ConversationalHandler {
	return &ConversationalHandler{
		llm:                 llm,
		ingres:              ingres,
		conversationHistory: make([]ConversationMessageStruct, 0),
	}
}

func (ch *ConversationalHandler) HandleMessage(ctx context.Context, userMessage string) (*models.ChatResponse, error) {
	response := &models.ChatResponse{}

	fmt.Println("\n" + strings.Repeat("-", 60))
	fmt.Printf("User Message: \"%s\"\n", userMessage)

	ch.conversationHistory = append(ch.conversationHistory, ConversationMessageStruct{
		Role:    "user",
		Content: userMessage,
	})

	if len(ch.conversationHistory) > 10 {
		ch.conversationHistory = ch.conversationHistory[len(ch.conversationHistory)-10:]
	}

	intent := ch.classifyIntent(userMessage)
	fmt.Printf("Intent: %s\n", intent)

	switch intent {
	case IntentGreeting:
		response.Text = ch.handleGreeting()
	case IntentQuestion:
		response.Text = ch.handleQuestion(userMessage)
	case IntentDataQuery, IntentComparison:
		return ch.handleDataQuery(ctx, userMessage)
	case IntentClarify:
		response.Text = "Please specify a state, district, or block. Example: 'Show Punjab data' or 'Ludhiana district'"
	default:
		return ch.handleDataQuery(ctx, userMessage)
	}

	return response, nil
}

func (ch *ConversationalHandler) classifyIntent(message string) ConversationalIntent {
	msg := strings.ToLower(message)

	greetings := []string{"hi", "hello", "hey", "good morning", "good evening", "namaste"}
	for _, g := range greetings {
		if strings.HasPrefix(msg, g) || msg == g {
			return IntentGreeting
		}
	}

	questions := []string{"what is", "what does", "define", "explain", "meaning of"}
	for _, q := range questions {
		if strings.Contains(msg, q) && !ch.containsLocation(msg) {
			return IntentQuestion
		}
	}

	if strings.Contains(msg, "compare") {
		return IntentComparison
	}

	if ch.containsLocation(msg) {
		return IntentDataQuery
	}

	dataWords := []string{"show", "data", "status", "blocks", "district", "state", "list", "extraction", "stage"}
	for _, w := range dataWords {
		if strings.Contains(msg, w) {
			return IntentDataQuery
		}
	}

	return IntentClarify
}

func (ch *ConversationalHandler) containsLocation(msg string) bool {
	states := []string{"punjab", "haryana", "rajasthan", "gujarat", "maharashtra", "karnataka", "kerala",
		"tamil", "andhra", "telangana", "uttar pradesh", "madhya pradesh", "bihar", "jharkhand",
		"west bengal", "odisha", "assam", "delhi", "uttarakhand", "chhattisgarh"}
	for _, s := range states {
		if strings.Contains(strings.ToLower(msg), s) {
			return true
		}
	}
	return false
}

func (ch *ConversationalHandler) handleGreeting() string {
	return `Welcome to INGRES Groundwater Data Assistant.

I provide data on 4 Key Attributes:
1. Annual Extractable Ground Water Resources (ham)
2. Annual Ground Water Extraction (ham)
3. Stage of Extraction (%)
4. Category (Safe/Semi-Critical/Critical/Over-Exploited)

Queries:
- State level: "Show Punjab data"
- District level: "Punjab districts"
- Block level: "Ludhiana blocks"
- Filter: "Over-exploited blocks in Haryana"

Enter your query.`
}

func (ch *ConversationalHandler) handleQuestion(msg string) string {
	msg = strings.ToLower(msg)

	if strings.Contains(msg, "stage") || strings.Contains(msg, "extraction") {
		return `Stage of Extraction = (Annual Extraction / Annual Recharge) x 100%

Categories:
- Safe: Stage < 70%
- Semi-Critical: Stage 70-90%
- Critical: Stage 90-100%
- Over-Exploited: Stage > 100%`
	}

	if strings.Contains(msg, "ham") || strings.Contains(msg, "unit") {
		return `ham = hectare-meters

1 ham = 10,000 cubic meters of water
This is the standard unit used in groundwater assessment in India.`
	}

	return "Please ask about a specific location. Example: 'Show Punjab data'"
}

func (ch *ConversationalHandler) handleDataQuery(ctx context.Context, userMessage string) (*models.ChatResponse, error) {
	response := &models.ChatResponse{}

	fmt.Println("Starting SQL generation...")

	sql := ch.buildSQL(strings.ToLower(userMessage))
	if sql == "" {
		response.Text = "Could not understand query. Try: 'Show Punjab data' or 'Ludhiana blocks'"
		return response, nil
	}

	fmt.Printf("SQL:\n%s\n", sql)

	results, err := ch.ingres.RunRawQuery(ctx, sql)
	if err != nil {
		fmt.Printf("Query error: %v\n", err)
		response.Text = "Database query failed. Please try again."
		return response, nil
	}

	if len(results) == 0 {
		response.Text = "No data found for your query."
		return response, nil
	}

	response.Text = ch.formatResponse(results)
	response.Chart = ch.buildChart(results)

	return response, nil
}

func (ch *ConversationalHandler) buildSQL(msg string) string {
	stateName := ch.extractState(msg)
	districtName := ch.extractDistrict(msg)

	// Block level - specific district
	if districtName != "" {
		return fmt.Sprintf(`SELECT b.block_name,
       a.total_extractable as extractable_ham,
       a.total_extraction as extraction_ham,
       a.stage as stage_percent,
       a.category
FROM assessments_summary a
JOIN blocks b ON a.block_uuid = b.block_uuid
JOIN districts d ON b.district_uuid = d.district_uuid
WHERE LOWER(d.district_name) ILIKE '%%%s%%'
AND a.year = '2024-2025'
ORDER BY a.stage DESC
LIMIT 50`, districtName)
	}

	if stateName != "" {
		// Over-exploited filter
		if strings.Contains(msg, "over") || strings.Contains(msg, "exploit") {
			return fmt.Sprintf(`SELECT b.block_name, d.district_name,
       a.total_extractable as extractable_ham,
       a.total_extraction as extraction_ham,
       a.stage as stage_percent,
       a.category
FROM assessments_summary a
JOIN blocks b ON a.block_uuid = b.block_uuid
JOIN districts d ON b.district_uuid = d.district_uuid
JOIN states s ON b.state_uuid = s.state_uuid
WHERE UPPER(s.state_name) = UPPER('%s')
AND LOWER(a.category) = 'over_exploited'
AND a.year = '2024-2025'
ORDER BY a.stage DESC
LIMIT 50`, stateName)
		}

		// District level drill-down
		if strings.Contains(msg, "district") {
			return fmt.Sprintf(`SELECT d.district_name,
       COUNT(*) as total_blocks,
       SUM(a.total_extractable) as extractable_ham,
       SUM(a.total_extraction) as extraction_ham,
       AVG(a.stage) as avg_stage_percent,
       SUM(CASE WHEN a.category = 'safe' THEN 1 ELSE 0 END) as safe,
       SUM(CASE WHEN a.category = 'over_exploited' THEN 1 ELSE 0 END) as over_exploited
FROM assessments_summary a
JOIN blocks b ON a.block_uuid = b.block_uuid
JOIN districts d ON b.district_uuid = d.district_uuid
JOIN states s ON b.state_uuid = s.state_uuid
WHERE UPPER(s.state_name) = UPPER('%s')
AND a.year = '2024-2025'
GROUP BY d.district_name
ORDER BY avg_stage_percent DESC`, stateName)
		}

		// State summary (default)
		return fmt.Sprintf(`SELECT s.state_name,
       COUNT(*) as total_blocks,
       SUM(a.total_extractable) as extractable_ham,
       SUM(a.total_extraction) as extraction_ham,
       AVG(a.stage) as avg_stage_percent,
       SUM(CASE WHEN a.category = 'safe' THEN 1 ELSE 0 END) as safe_blocks,
       SUM(CASE WHEN a.category = 'semi_critical' THEN 1 ELSE 0 END) as semi_critical_blocks,
       SUM(CASE WHEN a.category = 'critical' THEN 1 ELSE 0 END) as critical_blocks,
       SUM(CASE WHEN a.category = 'over_exploited' THEN 1 ELSE 0 END) as overexploited_blocks
FROM assessments_summary a
JOIN blocks b ON a.block_uuid = b.block_uuid
JOIN states s ON b.state_uuid = s.state_uuid
WHERE UPPER(s.state_name) = UPPER('%s')
AND a.year = '2024-2025'
GROUP BY s.state_name`, stateName)
	}

	// Compare states
	if strings.Contains(msg, "compare") {
		locations := ch.extractMultipleStates(msg)
		if len(locations) >= 2 {
			list := "'" + strings.Join(locations, "', '") + "'"
			return fmt.Sprintf(`SELECT s.state_name,
       COUNT(*) as total_blocks,
       SUM(a.total_extractable) as extractable_ham,
       SUM(a.total_extraction) as extraction_ham,
       AVG(a.stage) as avg_stage_percent,
       SUM(CASE WHEN a.category = 'over_exploited' THEN 1 ELSE 0 END) as over_exploited
FROM assessments_summary a
JOIN blocks b ON a.block_uuid = b.block_uuid
JOIN states s ON b.state_uuid = s.state_uuid
WHERE UPPER(s.state_name) IN (%s)
AND a.year = '2024-2025'
GROUP BY s.state_name
ORDER BY avg_stage_percent DESC`, strings.ToUpper(list))
		}
	}

	return ""
}

func (ch *ConversationalHandler) extractState(msg string) string {
	states := map[string]string{
		"punjab": "PUNJAB", "haryana": "HARYANA", "rajasthan": "RAJASTHAN",
		"gujarat": "GUJARAT", "maharashtra": "MAHARASHTRA", "karnataka": "KARNATAKA",
		"kerala": "KERALA", "tamil nadu": "TAMIL NADU", "telangana": "TELANGANA",
		"andhra pradesh": "ANDHRA PRADESH", "uttar pradesh": "UTTAR PRADESH",
		"madhya pradesh": "MADHYA PRADESH", "bihar": "BIHAR", "jharkhand": "JHARKHAND",
		"west bengal": "WEST BENGAL", "odisha": "ODISHA", "assam": "ASSAM",
		"delhi": "DELHI", "uttarakhand": "UTTARAKHAND", "chhattisgarh": "CHHATTISGARH",
	}
	for k, v := range states {
		if strings.Contains(msg, k) {
			return v
		}
	}
	return ""
}

func (ch *ConversationalHandler) extractDistrict(msg string) string {
	districts := []string{"ludhiana", "amritsar", "jalandhar", "patiala", "bathinda",
		"gurugram", "faridabad", "karnal", "ambala", "hisar",
		"jaipur", "jodhpur", "udaipur", "lucknow", "kanpur", "patna"}
	for _, d := range districts {
		if strings.Contains(msg, d) {
			return d
		}
	}
	return ""
}

func (ch *ConversationalHandler) extractMultipleStates(msg string) []string {
	states := []string{"punjab", "haryana", "rajasthan", "gujarat", "maharashtra",
		"karnataka", "kerala", "telangana", "uttar pradesh", "madhya pradesh",
		"bihar", "jharkhand", "west bengal", "odisha", "delhi"}
	var found []string
	for _, s := range states {
		if strings.Contains(msg, s) {
			found = append(found, strings.ToUpper(s))
		}
	}
	return found
}

func (ch *ConversationalHandler) formatResponse(results []map[string]interface{}) string {
	if len(results) == 0 {
		return "No data found."
	}

	var sb strings.Builder
	first := results[0]

	// State summary
	if name, ok := first["state_name"]; ok {
		if _, ok := first["total_blocks"]; ok {
			sb.WriteString(fmt.Sprintf("GROUNDWATER STATUS: %s\n", name))
			sb.WriteString(fmt.Sprintf("Year: 2024-2025\n\n"))

			if v, ok := first["extractable_ham"]; ok {
				sb.WriteString(fmt.Sprintf("Annual Extractable GW Resources: %v ham\n", v))
			}
			if v, ok := first["extraction_ham"]; ok {
				sb.WriteString(fmt.Sprintf("Annual GW Extraction: %v ham\n", v))
			}
			if v, ok := first["avg_stage_percent"]; ok {
				sb.WriteString(fmt.Sprintf("Avg Stage of Extraction: %v%%\n\n", v))
			}

			sb.WriteString("Block Categories:\n")
			if v, ok := first["safe_blocks"]; ok {
				sb.WriteString(fmt.Sprintf("  Safe: %v\n", v))
			}
			if v, ok := first["semi_critical_blocks"]; ok {
				sb.WriteString(fmt.Sprintf("  Semi-Critical: %v\n", v))
			}
			if v, ok := first["critical_blocks"]; ok {
				sb.WriteString(fmt.Sprintf("  Critical: %v\n", v))
			}
			if v, ok := first["overexploited_blocks"]; ok {
				sb.WriteString(fmt.Sprintf("  Over-Exploited: %v\n", v))
			}
			if v, ok := first["total_blocks"]; ok {
				sb.WriteString(fmt.Sprintf("\nTotal Blocks: %v\n", v))
			}

			sb.WriteString("\nTry: '[State] districts' for drill-down")
			return sb.String()
		}
	}

	// District summary (multiple rows)
	if _, ok := first["district_name"]; ok {
		if _, ok := first["total_blocks"]; ok {
			sb.WriteString("DISTRICT-WISE SUMMARY\n\n")
			sb.WriteString("District | Blocks | Extractable (ham) | Extraction (ham) | Stage%\n")
			sb.WriteString(strings.Repeat("-", 80) + "\n")

			limit := 20
			if len(results) < limit {
				limit = len(results)
			}

			for i := 0; i < limit; i++ {
				r := results[i]
				sb.WriteString(fmt.Sprintf("%v | %v | %v | %v | %v%%\n",
					r["district_name"], r["total_blocks"],
					r["extractable_ham"], r["extraction_ham"],
					r["avg_stage_percent"]))
			}

			if len(results) > limit {
				sb.WriteString(fmt.Sprintf("\n... and %d more districts\n", len(results)-limit))
			}

			sb.WriteString("\nTry: '[District] blocks' for block-level data")
			return sb.String()
		}
	}

	// Block list
	if _, ok := first["block_name"]; ok {
		sb.WriteString(fmt.Sprintf("BLOCKS (%d found)\n\n", len(results)))
		sb.WriteString("Block | Extractable (ham) | Extraction (ham) | Stage% | Category\n")
		sb.WriteString(strings.Repeat("-", 80) + "\n")

		limit := 15
		if len(results) < limit {
			limit = len(results)
		}

		for i := 0; i < limit; i++ {
			r := results[i]
			sb.WriteString(fmt.Sprintf("%v | %v | %v | %v%% | %v\n",
				r["block_name"], r["extractable_ham"], r["extraction_ham"],
				r["stage_percent"], r["category"]))
		}

		if len(results) > limit {
			sb.WriteString(fmt.Sprintf("\n... and %d more blocks\n", len(results)-limit))
		}
		return sb.String()
	}

	return fmt.Sprintf("Found %d results.", len(results))
}

func (ch *ConversationalHandler) buildChart(results []map[string]interface{}) *models.ChartPayload {
	if len(results) == 0 {
		return nil
	}

	first := results[0]

	// State summary - pie chart for categories
	if _, ok := first["safe_blocks"]; ok {
		chart := &models.ChartPayload{
			Type:  "pie",
			Title: "Block Distribution by Category",
		}
		chart.PieData = []models.PieDatum{}

		if v := getFloatVal(first, "safe_blocks"); v > 0 {
			chart.PieData = append(chart.PieData, models.PieDatum{Name: "Safe", Value: v})
		}
		if v := getFloatVal(first, "semi_critical_blocks"); v > 0 {
			chart.PieData = append(chart.PieData, models.PieDatum{Name: "Semi-Critical", Value: v})
		}
		if v := getFloatVal(first, "critical_blocks"); v > 0 {
			chart.PieData = append(chart.PieData, models.PieDatum{Name: "Critical", Value: v})
		}
		if v := getFloatVal(first, "overexploited_blocks"); v > 0 {
			chart.PieData = append(chart.PieData, models.PieDatum{Name: "Over-Exploited", Value: v})
		}
		return chart
	}

	// District or block list - bar chart
	if len(results) > 1 {
		chart := &models.ChartPayload{
			Type:  "bar",
			Title: "Extraction Stage Comparison",
		}

		var labels []string
		var stages []float64

		limit := 10
		if len(results) < limit {
			limit = len(results)
		}

		for i := 0; i < limit; i++ {
			r := results[i]
			if name, ok := r["district_name"]; ok {
				labels = append(labels, fmt.Sprintf("%v", name))
			} else if name, ok := r["block_name"]; ok {
				labels = append(labels, fmt.Sprintf("%v", name))
			}
			if stage, ok := r["avg_stage_percent"]; ok {
				stages = append(stages, getFloatVal(r, "avg_stage_percent"))
				_ = stage
			} else if stage, ok := r["stage_percent"]; ok {
				stages = append(stages, getFloatVal(r, "stage_percent"))
				_ = stage
			}
		}

		chart.XAxis = map[string]interface{}{
			"type": "category",
			"data": labels,
		}
		chart.Series = []models.ChartSeries{
			{Name: "Stage %", Data: stages},
		}
		return chart
	}

	return nil
}

func getFloatVal(row map[string]interface{}, key string) float64 {
	if val, ok := row[key]; ok {
		switch v := val.(type) {
		case float64:
			return v
		case float32:
			return float64(v)
		case int:
			return float64(v)
		case int64:
			return float64(v)
		}
	}
	return 0
}
