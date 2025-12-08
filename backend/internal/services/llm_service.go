package services

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"sync"

	"github.com/google/generative-ai-go/genai"
	"github.com/hxrshxz/ground-sense-bot/backend/internal/config"
	"google.golang.org/api/option"
)

// ConversationMessage represents a message in conversation history
type ConversationMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// LLMService handles all LLM interactions with conversation context
type LLMService struct {
	clients             []*genai.Client
	models              []*genai.GenerativeModel
	sqlModels           []*genai.GenerativeModel
	vizModels           []*genai.GenerativeModel
	currentKeyIndex     int
	keyRotationMu       sync.Mutex
	apiKeys             []string
	client              *genai.Client    // Legacy - for backward compatibility
	model               *genai.GenerativeModel
	sqlModel            *genai.GenerativeModel
	vizModel            *genai.GenerativeModel
	conversationHistory []ConversationMessage
	historyMu           sync.RWMutex
	maxHistoryLength    int
	// Local LLM support
	ollamaClient     *OllamaClient
	useLocalLLM      bool
}

// Domain knowledge for groundwater analysis
const DOMAIN_KNOWLEDGE = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INDIA GROUNDWATER DOMAIN KNOWLEDGE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CRITICAL THRESHOLDS (Stage of Extraction):
- > 100%: over_exploited (RED ALERT - extraction exceeds recharge)
- 90-100%: critical (HIGH RISK)
- 70-90%: semi_critical (MODERATE RISK)
- < 70%: safe (LOW RISK)
- Stage = -100000: salinity (special indicator)

DATABASE CATEGORY VALUES (EXACT):
- 'safe' (lowercase)
- 'semi_critical' (underscore, lowercase)
- 'critical' (lowercase)
- 'over_exploited' (underscore, lowercase)
- 'salinity' (special case)
- 'Hilly Area' (mixed case)

INDIA STATISTICS (2024-2025):
- Total Blocks: 5,796
- Over-Exploited: ~1,000 blocks (17%)
- Critical: ~300 blocks (5%)
- Semi-Critical: ~600 blocks (10%)
- Safe: ~3,800 blocks (65%)
- National Avg Rainfall: 1,180mm
- National Avg Stage: 63%

STATE-LEVEL INSIGHTS:
- Punjab: 79% over-exploited, 170% avg stage, rice-wheat intensive
- Rajasthan: High salinity, 450mm rainfall, desert regions
- Haryana: 60% critical+over-exploited, high agricultural demand
- Delhi: Urban stress, 90%+ over-exploited, limited recharge
- Tamil Nadu: Coastal salinity, monsoon dependent
- Gujarat: Mixed status, western areas critical

EXTRACTION BREAKDOWN (National Average):
- Agriculture: 89%
- Domestic: 9%
- Industrial: 2%

RECHARGE SOURCES:
- Rainfall Recharge: 60-70%
- Canal Recharge: 15-25%
- Irrigation Return: 10-15%
- Conservation Structures: 5-10%
`

func NewLLMService(cfg *config.Config) (*LLMService, error) {
	// Initialize Ollama client if enabled
	var ollamaClient *OllamaClient
	useLocalLLM := cfg.Ollama.Enabled
	
	if useLocalLLM {
		ollamaClient = NewOllamaClient(cfg.Ollama.BaseURL, cfg.Ollama.Model)
		ctx := context.Background()
		if ollamaClient.IsAvailable(ctx) {
			fmt.Printf("🦙 Ollama local LLM enabled (model: %s)\n", cfg.Ollama.Model)
		} else {
			fmt.Println("⚠️ Ollama enabled but not available, falling back to Gemini")
			useLocalLLM = false
		}
	}

	// Get API keys - use APIKeys slice if available, otherwise fall back to single APIKey
	apiKeys := cfg.Gemini.APIKeys
	if len(apiKeys) == 0 && cfg.Gemini.APIKey != "" {
		apiKeys = []string{cfg.Gemini.APIKey}
	}
	
	// If using local LLM exclusively and no Gemini keys, that's OK for SQL generation
	if len(apiKeys) == 0 && !useLocalLLM {
		return nil, fmt.Errorf("GEMINI_API_KEY is not set and OLLAMA_ENABLED is false")
	}

	ctx := context.Background()
	
	// Initialize clients for all API keys (may be empty if using only local LLM)
	clients := make([]*genai.Client, 0, len(apiKeys))
	models := make([]*genai.GenerativeModel, 0, len(apiKeys))
	sqlModels := make([]*genai.GenerativeModel, 0, len(apiKeys))
	vizModels := make([]*genai.GenerativeModel, 0, len(apiKeys))
	
	for i, apiKey := range apiKeys {
		client, err := genai.NewClient(ctx, option.WithAPIKey(apiKey))
		if err != nil {
			fmt.Printf("Warning: Failed to create client for API key %d: %v\n", i+1, err)
			continue
		}
		
		// Main model for general queries
		model := client.GenerativeModel("gemini-2.5-flash")
		model.SetTemperature(0.3)

		// SQL model with very low temperature for deterministic queries
		sqlModel := client.GenerativeModel("gemini-2.5-flash")
		sqlModel.SetTemperature(0.1)

		// Visualization model with moderate creativity
		vizModel := client.GenerativeModel("gemini-2.5-flash")
		vizModel.SetTemperature(0.4)
		
		clients = append(clients, client)
		models = append(models, model)
		sqlModels = append(sqlModels, sqlModel)
		vizModels = append(vizModels, vizModel)
	}
	
	// Must have either Gemini clients or local LLM
	if len(clients) == 0 && !useLocalLLM {
		return nil, fmt.Errorf("failed to initialize any LLM clients")
	}
	
	if len(clients) > 0 {
		fmt.Printf("🔑 Initialized %d Gemini API key(s) for rotation\n", len(clients))
	}
	
	// Build result with optional fields
	result := &LLMService{
		clients:             clients,
		models:              models,
		sqlModels:           sqlModels,
		vizModels:           vizModels,
		apiKeys:             apiKeys,
		currentKeyIndex:     0,
		conversationHistory: make([]ConversationMessage, 0),
		maxHistoryLength:    10,
		ollamaClient:        ollamaClient,
		useLocalLLM:         useLocalLLM,
	}
	
	// Set legacy fields if Gemini clients available
	if len(clients) > 0 {
		result.client = clients[0]
		result.model = models[0]
		result.sqlModel = sqlModels[0]
		result.vizModel = vizModels[0]
	}
	
	return result, nil
}

// rotateAPIKey switches to the next available API key
func (s *LLMService) rotateAPIKey() {
	s.keyRotationMu.Lock()
	defer s.keyRotationMu.Unlock()
	
	if len(s.clients) <= 1 {
		return // Only one key, can't rotate
	}
	
	s.currentKeyIndex = (s.currentKeyIndex + 1) % len(s.clients)
	s.client = s.clients[s.currentKeyIndex]
	s.model = s.models[s.currentKeyIndex]
	s.sqlModel = s.sqlModels[s.currentKeyIndex]
	s.vizModel = s.vizModels[s.currentKeyIndex]
	
	fmt.Printf("🔄 Rotated to API key %d of %d\n", s.currentKeyIndex+1, len(s.clients))
}

// getCurrentModels returns the current active models (thread-safe)
func (s *LLMService) getCurrentModels() (*genai.GenerativeModel, *genai.GenerativeModel, *genai.GenerativeModel) {
	s.keyRotationMu.Lock()
	defer s.keyRotationMu.Unlock()
	return s.model, s.sqlModel, s.vizModel
}

// AddToHistory adds a message to conversation history
func (s *LLMService) AddToHistory(role, content string) {
	s.historyMu.Lock()
	defer s.historyMu.Unlock()

	s.conversationHistory = append(s.conversationHistory, ConversationMessage{
		Role:    role,
		Content: content,
	})

	// Keep only last N messages
	if len(s.conversationHistory) > s.maxHistoryLength*2 {
		s.conversationHistory = s.conversationHistory[len(s.conversationHistory)-s.maxHistoryLength*2:]
	}
}

// GetHistoryContext returns formatted conversation history
func (s *LLMService) GetHistoryContext() string {
	s.historyMu.RLock()
	defer s.historyMu.RUnlock()

	if len(s.conversationHistory) == 0 {
		return ""
	}

	var builder strings.Builder
	builder.WriteString("\nCONVERSATION HISTORY:\n")
	for _, msg := range s.conversationHistory {
		// Truncate long messages
		content := msg.Content
		if len(content) > 300 {
			content = content[:300] + "..."
		}
		builder.WriteString(fmt.Sprintf("%s: %s\n", strings.ToUpper(msg.Role), content))
	}
	return builder.String()
}

// ClearHistory clears the conversation history
func (s *LLMService) ClearHistory() {
	s.historyMu.Lock()
	defer s.historyMu.Unlock()
	s.conversationHistory = make([]ConversationMessage, 0)
}

func (s *LLMService) GenerateSQL(userMessage string, schema string) (string, error) {
	// Route to local LLM if enabled
	if s.useLocalLLM && s.ollamaClient != nil {
		ctx := context.Background()
		sql, err := s.ollamaClient.GenerateSQL(ctx, userMessage, schema, DOMAIN_KNOWLEDGE)
		if err != nil {
			fmt.Printf("⚠️ Local LLM SQL generation failed, trying Gemini: %v\n", err)
			// Fall through to Gemini
		} else {
			// Add to history and return
			s.AddToHistory("user", userMessage)
			return sql, nil
		}
	}
	
	// Fallback: check if Gemini is available
	if s.sqlModel == nil {
		return "", fmt.Errorf("no LLM available for SQL generation")
	}

	ctx := context.Background()
	historyContext := s.GetHistoryContext()

	// Chain-of-thought SQL generation prompt
	prompt := fmt.Sprintf(`You are an expert PostgreSQL developer for India's INGRES Groundwater Data System.

%s
%s

DATABASE SCHEMA:
%s

USER QUESTION: "%s"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CHAIN-OF-THOUGHT SQL GENERATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STEP 1 - ANALYZE THE QUESTION:
Think about: What data does the user want? What tables are needed?

STEP 2 - IDENTIFY REQUIRED COMPONENTS:
- Main table: assessments_summary (for rainfall, stage, category, extraction, recharge)
- Join tables: blocks, districts, states (for location names)
- Breakdown tables: assessments_recharge_breakdown, assessments_extraction_breakdown (for detailed sources)

STEP 3 - APPLY CRITICAL RULES:
✓ ALWAYS use year = '2024-2025' (only year with block data!)
✓ State matching: UPPER(s.state_name) = UPPER('...')
✓ Block/District: LOWER(name) ILIKE '%%...%%'
✓ Category values (EXACT): 'safe', 'semi_critical', 'critical', 'over_exploited', 'salinity'
✓ For aggregates: Use AVG(CASE WHEN a.stage > 0 THEN a.stage ELSE NULL END) to exclude salinity
✓ Add LIMIT 50 for list queries
✓ Use ROUND(value::numeric, 2) for decimals

STEP 4 - GENERATE SQL:
Return ONLY the SQL query. No markdown, no explanations, no comments.
The SQL must be executable as-is in PostgreSQL.

SQL:`, DOMAIN_KNOWLEDGE, historyContext, schema, userMessage)

	// Add to history
	s.AddToHistory("user", userMessage)

	resp, err := s.sqlModel.GenerateContent(ctx, genai.Text(prompt))
	if err != nil {
		return "", fmt.Errorf("SQL generation failed: %w", err)
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
	sql = strings.TrimSpace(sql)

	// Basic validation
	sqlUpper := strings.ToUpper(sql)
	if !strings.Contains(sqlUpper, "SELECT") {
		return "", fmt.Errorf("invalid SQL generated: missing SELECT")
	}

	// Validate dangerous operations are not present
	if strings.Contains(sqlUpper, "DROP") || strings.Contains(sqlUpper, "DELETE") || 
	   strings.Contains(sqlUpper, "TRUNCATE") || strings.Contains(sqlUpper, "INSERT") ||
	   strings.Contains(sqlUpper, "UPDATE") {
		return "", fmt.Errorf("invalid SQL: contains prohibited operations")
	}

	return sql, nil
}

func (s *LLMService) GenerateVisualization(data interface{}, query string, userMessage string) (string, string, error) {
	ctx := context.Background()
	dataJSON, _ := json.Marshal(data)

	// Smart truncation - keep structure but limit size
	dataStr := string(dataJSON)
	if len(dataStr) > 15000 {
		// Try to keep complete JSON structure
		dataStr = dataStr[:15000] + "..."
	}

	prompt := fmt.Sprintf(`You are an Expert Data Visualization Architect for groundwater analysis.

%s

USER QUERY: "%s"
SQL QUERY: "%s"
DATA RESULT: %s

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DYNAMIC VISUALIZATION GENERATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STEP 1 - ANALYZE DATA STRUCTURE:
- Count the rows and columns
- Identify data types (numeric, categorical, temporal)
- Detect patterns (time series, comparisons, distributions)

STEP 2 - SELECT OPTIMAL CHART TYPE:
Choose the BEST visualization for this data:

| Data Pattern | Best Chart Type | Reasoning |
|-------------|-----------------|-----------|
| Single metric over time/categories | gradient-area | Clean trend visualization |
| Multiple metrics comparison | brush-bar | Side-by-side comparison |
| Category distribution/shares | rose-pie | Proportional representation |
| Stacked components | stacked-area | Part-to-whole relationships |
| Multi-year temporal data | timeline-bar | Animated progression |
| Large dataset (50+ points) | large-area | Optimized for scale |
| Breakdown sources | brush-bar | Multi-series comparison |
| Ranking/Top N (any metric) | rose-pie | Radial ranking visualization |

⚠️⚠️⚠️ CRITICAL RULE FOR RANKING QUERIES:
When user asks for "Top N", "worst blocks", "best performers", "highest", "lowest", "ranking":

YOU MUST USE "rose-pie" TYPE (Nightingale Chart):
{
  "type": "rose-pie",
  "title": "Top 10 Over-Exploited Blocks",
  "explanation": "Clear ranking insight...",
  "pieData": [
    { "name": "Block Name, District", "value": 185.5 },
    { "name": "Another Block, District", "value": 180.2 },
    ...
  ]
}

NOTE: Use the MAIN RANKING METRIC as the value (e.g., stage percentage for over-exploited blocks).
The rose chart visually shows ranking by petal size - larger petals = higher values.

Color Guide: stage/deficit=#ef4444 (red), extraction=#f97316 (orange), recharge=#3b82f6 (blue)

STEP 3 - EXTRACT INSIGHTS:
Based on groundwater domain knowledge:
- Is extraction > recharge? (Unsustainable)
- Which regions are over-exploited?
- What are the trends?
- Are there anomalies?

STEP 4 - GENERATE JSON:
Return ONLY valid JSON (no markdown, no code blocks):

{
  "type": "gradient-area|brush-bar|rose-pie|stacked-area|timeline-bar|large-area|horizontal-bar|stacked-bar",
  "title": "Clear, descriptive title",
  "explanation": "2-3 sentence data-driven insight with specific numbers. Highlight concerning trends or good patterns.",
  "insights": [
    "Key finding 1 with specific data",
    "Key finding 2 with comparison",
    "Actionable recommendation"
  ],
  "xAxis": { "data": ["label1", "label2", ...], "type": "category|value" },
  "yAxis": { "data": ["label1", "label2", ...], "type": "category|value" },
  "series": [
    { 
      "name": "Series Name", 
      "data": [val1, val2, ...], 
      "type": "bar|line",
      "stack": "total" (for stacked-bar only),
      "itemStyle": { "color": "#hex" } (for stacked-bar),
      "label": { "show": true, "position": "inside" } (for stacked-bar),
      "highlight": true/false 
    }
  ],
  "pieData": [{"name": "Category", "value": 123}],
  "metrics": {
    "total": number,
    "average": number,
    "max": number,
    "min": number,
    "trend": "increasing|decreasing|stable"
  },
  "alerts": [
    {"level": "critical|warning|info", "message": "Alert text"}
  ]
}

CRITICAL RULES:
✓ Use ACTUAL data from the query results - don't make up numbers
✓ Ensure xAxis labels count matches series data length
✓ Include at least 2 meaningful insights
✓ Add alerts for concerning patterns (stage > 100%%, extraction > recharge)
✓ Title should reflect what the data shows
✓ explanation should cite specific numbers from the data

Generate the visualization JSON now:`, DOMAIN_KNOWLEDGE, userMessage, query, dataStr)

	resp, err := s.vizModel.GenerateContent(ctx, genai.Text(prompt))
	if err != nil {
		fmt.Printf("DEBUG: GenerateVisualization LLM Error: %v\n", err)
		// Rotate API key if we hit rate limit
		if strings.Contains(err.Error(), "429") || strings.Contains(err.Error(), "quota") {
			s.rotateAPIKey()
		}
		return "", "", err
	}

	if len(resp.Candidates) == 0 || resp.Candidates[0].Content == nil {
		fmt.Printf("DEBUG: GenerateVisualization No Candidates\n")
		return "", "", fmt.Errorf("no response from LLM")
	}

	part := resp.Candidates[0].Content.Parts[0]
	text, ok := part.(genai.Text)
	if !ok {
		fmt.Printf("DEBUG: GenerateVisualization Unexpected Format\n")
		return "", "", fmt.Errorf("unexpected response format")
	}

	jsonStr := string(text)
	fmt.Printf("DEBUG: GenerateVisualization Raw JSON: %s\n", jsonStr)
	
	// Clean markdown code blocks
	jsonStr = strings.TrimSpace(jsonStr)
	if strings.HasPrefix(jsonStr, "```") {
		// Find first newline
		if idx := strings.Index(jsonStr, "\n"); idx != -1 {
			jsonStr = jsonStr[idx+1:]
		}
		// Remove trailing ```
		if idx := strings.LastIndex(jsonStr, "```"); idx != -1 {
			jsonStr = jsonStr[:idx]
		}
	}
	
	return strings.TrimSpace(jsonStr), "", nil
}

func (s *LLMService) DetermineIntent(userMessage string) (string, error) {
	// Simple LLM call to classify intent if needed, or we can stick to the rule-based hybrid approach.
	// For now, let's keep it simple and rely on the SQL generation to implicitly handle intent.
	return "", nil
}
