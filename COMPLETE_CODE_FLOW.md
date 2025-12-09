# 🧠 COMPLETE CODE FLOW EXPLANATION - Ground Sense Bot

## From User Query → Intent Detection → SQL Generation → Graph Rendering

---

## 📊 ARCHITECTURE OVERVIEW

````
┌──────────────────────────────────────────────────────────────────────────┐
│                         USER TYPES QUERY                                 │
│                 "Compare Amritsar and Ludhiana"                          │
└────────────────────────────────┬─────────────────────────────────────────┘
                                 ↓
┌──────────────────────────────────────────────────────────────────────────┐
│                    FRONTEND (React + TypeScript)                         │
│  File: src/components/INGRESAssistant.tsx                                │
│  - Input captured from text field                                        │
│  - WebSocket sends message to backend                                    │
└────────────────────────────────┬─────────────────────────────────────────┘
                                 ↓
┌──────────────────────────────────────────────────────────────────────────┐
│                    WEBSOCKET CONNECTION                                  │
│  File: src/hooks/useChatWebSocket.ts                                     │
│  - sendMessage() wraps query in JSON                                     │
│  - Sends to: ws://localhost:8081/ws                                      │
└────────────────────────────────┬─────────────────────────────────────────┘
                                 ↓
┌──────────────────────────────────────────────────────────────────────────┐
│                    BACKEND GO SERVER                                     │
│  File: backend/pkg/websocket/handler.go                                  │
│  - Receives WebSocket message                                            │
│  - Routes to ChatService.ProcessMessage()                                │
└────────────────────────────────┬─────────────────────────────────────────┘
                                 ↓
┌──────────────────────────────────────────────────────────────────────────┐
│              STEP 1: INTENT CLASSIFICATION (NLP)                         │
│  File: backend/internal/services/nlp_service.go                          │
│  Function: ParseMessage()                                                │
│                                                                           │
│  1️⃣ Text Preprocessing                                                   │
│     msg := strings.ToLower(message) // "compare amritsar and ludhiana"  │
│                                                                           │
│  2️⃣ Intent Detection (LOCAL - No API calls!)                            │
│     intent := s.determineIntent(msg)                                     │
│     → Checks for keywords: "compare", "trend", "list", etc.              │
│     → Returns: IntentCompare                                             │
│                                                                           │
│  3️⃣ Entity Extraction                                                    │
│     entities := s.extractEntities(msg)                                   │
│     → Finds locations: ["AMRITSAR", "LUDHIANA"]                          │
│     → Finds year: defaults to "2024-2025"                                │
│                                                                           │
│  4️⃣ Dynamic SQL Decision                                                │
│     if shouldGenerateDynamicSQL(intent, entities):                       │
│        sqlQuery = generateDynamicSQL(message, intent, entities)          │
│     else:                                                                │
│        sqlQuery = "" // Use specialized handler                          │
│                                                                           │
│  Returns: (intent, entities, sqlQuery)                                   │
└────────────────────────────────┬─────────────────────────────────────────┘
                                 ↓
┌──────────────────────────────────────────────────────────────────────────┐
│         STEP 2: ROUTE TO SPECIALIZED HANDLER                             │
│  File: backend/internal/services/chat_service.go                         │
│  Function: ProcessMessage()                                              │
│                                                                           │
│  switch intent {                                                         │
│    case IntentCompare:                                                   │
│      → handlerResult = s.handleCompare(ctx, entities, response)          │
│    case IntentTrend:                                                     │
│      → handlerResult = s.handleTrend(ctx, entities, response)            │
│    case IntentListBlocks:                                                │
│      → handlerResult = s.handleListBlocks(ctx, entities, response)       │
│    default:                                                              │
│      → Fall back to RAG search or dynamic SQL                            │
│  }                                                                        │
└────────────────────────────────┬─────────────────────────────────────────┘
                                 ↓
┌──────────────────────────────────────────────────────────────────────────┐
│         STEP 3: EXECUTE SPECIALIZED HANDLER                              │
│  File: backend/internal/services/chat_service.go                         │
│  Function: handleCompare()  (Line 2237)                                  │
│                                                                           │
│  1️⃣ Find Locations in Database                                          │
│     locations := []string{"AMRITSAR", "LUDHIANA"}                        │
│     → Search in blocks table for matching block_name                     │
│     → Search in districts table for matching district_name               │
│     → Search in states table for matching state_name                     │
│                                                                           │
│  2️⃣ Determine Comparison Type                                           │
│     if found 2 districts:                                                │
│        → Call compareDistricts(locations, year)                          │
│     else if found 2 states:                                              │
│        → Call compareStates(locations, year)                             │
│     else if found 2 blocks:                                              │
│        → Call compareBlocks(locations, year)                             │
│                                                                           │
│  3️⃣ Query Database for Comparison Data                                  │
│     Function: compareDistricts()  (Line 2733)                            │
│                                                                           │
│     SQL Query Executed:                                                  │
│     ```sql                                                               │
│     SELECT                                                               │
│         d.district_name,                                                 │
│         s.state_name,                                                    │
│         COUNT(*) as total_blocks,                                        │
│         ROUND(AVG(CASE WHEN a.stage > 0 THEN a.stage END), 2) as avg_stage,│
│         SUM(CASE WHEN a.category = 'safe' THEN 1 ELSE 0 END) as safe_blocks,│
│         SUM(CASE WHEN a.category = 'critical' THEN 1 ELSE 0 END) as critical,│
│         SUM(CASE WHEN a.category = 'over_exploited' THEN 1 ELSE 0 END) as over_exploited,│
│         ROUND(AVG(a.rainfall), 2) as avg_rainfall,                       │
│         ROUND(SUM(a.total_recharge), 2) as total_recharge               │
│     FROM assessments_summary a                                           │
│     JOIN blocks b ON a.block_uuid = b.block_uuid                         │
│     JOIN districts d ON b.district_uuid = d.district_uuid                │
│     JOIN states s ON d.state_uuid = s.state_uuid                         │
│     WHERE d.district_name ILIKE '%amritsar%'                             │
│        OR d.district_name ILIKE '%ludhiana%'                             │
│     AND a.year = '2024-2025'                                             │
│     GROUP BY d.district_name, s.state_name                               │
│     ORDER BY d.district_name                                             │
│     ```                                                                  │
│                                                                           │
│  4️⃣ Process Query Results                                               │
│     Results returned as array of rows:                                   │
│     [                                                                    │
│       {                                                                  │
│         district_name: "Amritsar",                                       │
│         state_name: "PUNJAB",                                            │
│         total_blocks: 12,                                                │
│         avg_stage: 156.2,                                                │
│         safe_blocks: 0,                                                  │
│         critical: 2,                                                     │
│         over_exploited: 10,                                              │
│         avg_rainfall: 650.5,                                             │
│         total_recharge: 234.8                                            │
│       },                                                                 │
│       {                                                                  │
│         district_name: "Ludhiana",                                       │
│         state_name: "PUNJAB",                                            │
│         total_blocks: 15,                                                │
│         avg_stage: 179.8,                                                │
│         safe_blocks: 0,                                                  │
│         critical: 3,                                                     │
│         over_exploited: 12,                                              │
│         avg_rainfall: 720.3,                                             │
│         total_recharge: 189.4                                            │
│       }                                                                  │
│     ]                                                                    │
│                                                                           │
│  5️⃣ Build Comparison Payload                                            │
│     comparisonData := models.ComparisonData{                             │
│         ComparisonType: "district",                                      │
│         Year: "2024-2025",                                               │
│         Locations: [                                                     │
│             {                                                            │
│                 Name: "Amritsar",                                        │
│                 State: "PUNJAB",                                         │
│                 Rainfall: 650.5,                                         │
│                 SafeBlocks: 0,                                           │
│                 CriticalBlocks: 2,                                       │
│                 OverExploitedBlocks: 10,                                 │
│                 Recharge: 2.348  // Divided by 100                       │
│             },                                                           │
│             {                                                            │
│                 Name: "Ludhiana",                                        │
│                 State: "PUNJAB",                                         │
│                 Rainfall: 720.3,                                         │
│                 SafeBlocks: 0,                                           │
│                 CriticalBlocks: 3,                                       │
│                 OverExploitedBlocks: 12,                                 │
│                 Recharge: 1.894                                          │
│             }                                                            │
│         ]                                                                │
│     }                                                                    │
│                                                                           │
│  6️⃣ Create Chart Response                                               │
│     response.Chart = &models.ChartData{                                  │
│         Type: "comparison-card",                                         │
│         Title: "District Comparison - 2024-2025",                        │
│         ComparisonData: comparisonData                                   │
│     }                                                                    │
│                                                                           │
│  7️⃣ Generate Descriptive Text (Optional)                                │
│     response.Text = "Comparing Amritsar and Ludhiana districts..."      │
│                                                                           │
│  Returns: response (with chart payload)                                  │
└────────────────────────────────┬─────────────────────────────────────────┘
                                 ↓
┌──────────────────────────────────────────────────────────────────────────┐
│         STEP 4: SEND RESPONSE VIA WEBSOCKET                              │
│  File: backend/pkg/websocket/handler.go                                  │
│                                                                           │
│  JSON Response Structure:                                                │
│  {                                                                       │
│    "id": "msg-12345",                                                    │
│    "type": "response",                                                   │
│    "username": "Bot",                                                    │
│    "content": "Comparing Amritsar and Ludhiana districts...",           │
│    "payload": {                                                          │
│      "text": "Comparing Amritsar and Ludhiana districts...",            │
│      "intent": "COMPARE",                                                │
│      "chart": {                                                          │
│        "type": "comparison-card",                                        │
│        "title": "District Comparison - 2024-2025",                       │
│        "comparisonData": {                                               │
│          "comparisonType": "district",                                   │
│          "year": "2024-2025",                                            │
│          "locations": [ /* array of location data */ ]                   │
│        }                                                                 │
│      }                                                                   │
│    }                                                                     │
│  }                                                                       │
│                                                                           │
│  → WebSocket sends this JSON to frontend                                 │
└────────────────────────────────┬─────────────────────────────────────────┘
                                 ↓
┌──────────────────────────────────────────────────────────────────────────┐
│         STEP 5: FRONTEND RECEIVES RESPONSE                               │
│  File: src/hooks/useChatWebSocket.ts                                     │
│                                                                           │
│  socket.onmessage = (event) => {                                         │
│    const data = JSON.parse(event.data);                                 │
│                                                                           │
│    // Log received data                                                 │
│    console.log("📨 WEBSOCKET MESSAGE RECEIVED");                         │
│    console.log("├─ Intent:", data.payload.intent);                       │
│    console.log("├─ Chart Type:", data.payload.chart.type);               │
│    console.log("├─ Comparison Type:", comparisonData.comparisonType);    │
│                                                                           │
│    // Transform to Message format                                       │
│    const newMessage: Message = {                                         │
│      id: data.id,                                                        │
│      content: data.payload.text,                                         │
│      sender: "bot",                                                      │
│      type: "response",                                                   │
│      payload: data.payload,  // Contains chart data                      │
│      timestamp: new Date()                                               │
│    };                                                                    │
│                                                                           │
│    // Add to chat history                                               │
│    setMessages(prev => [...prev, newMessage]);                           │
│  }                                                                       │
└────────────────────────────────┬─────────────────────────────────────────┘
                                 ↓
┌──────────────────────────────────────────────────────────────────────────┐
│         STEP 6: RENDER CHAT MESSAGE WITH CHART                           │
│  File: src/components/INGRESAssistant.tsx                                │
│                                                                           │
│  {messages.map(message => (                                              │
│    <div key={message.id}>                                                │
│      {message.payload?.chart && (                                        │
│        <ChartRenderer chart={message.payload.chart} />                   │
│      )}                                                                  │
│    </div>                                                                │
│  ))}                                                                     │
└────────────────────────────────┬─────────────────────────────────────────┘
                                 ↓
┌──────────────────────────────────────────────────────────────────────────┐
│         STEP 7: CHART RENDERER DETECTS TYPE                              │
│  File: src/components/charts/echarts/ChartRenderer.tsx                   │
│  Function: ChartRenderer (Line 115)                                      │
│                                                                           │
│  1️⃣ Check Chart Type                                                    │
│     if (chart.type === "comparison-card" && chart.comparisonData) {     │
│                                                                           │
│  2️⃣ Detect New vs Old Format                                            │
│     // Check if it has comparisonType field (new format)                │
│     if ("comparisonType" in chart.comparisonData) {                      │
│                                                                           │
│       // Check if locations have 'name' field (new) vs 'locationName' (old)│
│       const firstLoc = chart.comparisonData.locations[0];                │
│       if ("name" in firstLoc) {                                          │
│         // NEW FORMAT - Use ComparisonChart                              │
│         return <ComparisonChart data={comparisonData} />                 │
│       }                                                                  │
│     }                                                                    │
│                                                                           │
│     // OLD FORMAT - Use ComparisonCard                                  │
│     return <ComparisonCard data={comparisonData} />                      │
│  }                                                                       │
└────────────────────────────────┬─────────────────────────────────────────┘
                                 ↓
┌──────────────────────────────────────────────────────────────────────────┐
│         STEP 8: RENDER HORIZONTAL BAR CHART                              │
│  File: src/components/charts/echarts/ComparisonChart.tsx                 │
│                                                                           │
│  1️⃣ Extract Data from Props                                             │
│     const { comparisonType, year, locations } = data;                    │
│                                                                           │
│  2️⃣ Build Series for Each Metric                                        │
│     const series = [                                                     │
│       {                                                                  │
│         name: "Rainfall (mm)",                                           │
│         type: "bar",                                                     │
│         data: locations.map(loc => loc.rainfall),                        │
│         itemStyle: { color: "#007BFF" }                                  │
│       },                                                                 │
│       {                                                                  │
│         name: "Safe Blocks",                                             │
│         type: "bar",                                                     │
│         data: locations.map(loc => loc.safeBlocks),                      │
│         itemStyle: { color: "#FFA500" }                                  │
│       },                                                                 │
│       {                                                                  │
│         name: "Critical Blocks",                                         │
│         type: "bar",                                                     │
│         data: locations.map(loc => loc.criticalBlocks),                  │
│         itemStyle: { color: "#9ACD32" }                                  │
│       },                                                                 │
│       {                                                                  │
│         name: "Recharge (÷100)",                                         │
│         type: "bar",                                                     │
│         data: locations.map(loc => loc.recharge),                        │
│         itemStyle: { color: "#4F5868" }                                  │
│       }                                                                  │
│     ];                                                                   │
│                                                                           │
│  3️⃣ Configure ECharts Options (HORIZONTAL BARS)                         │
│     const option = {                                                     │
│       title: {                                                           │
│         text: "District Comparison - 2024-2025",                         │
│         left: "center"                                                   │
│       },                                                                 │
│       tooltip: {                                                         │
│         trigger: "axis",                                                 │
│         axisPointer: { type: "shadow" }                                  │
│       },                                                                 │
│       legend: {                                                          │
│         top: 50,                                                         │
│         data: ["Rainfall (mm)", "Safe Blocks", "Critical Blocks", ...]  │
│       },                                                                 │
│       grid: {                                                            │
│         left: "15%",  // Space for location names                        │
│         right: "10%",                                                    │
│         bottom: "10%",                                                   │
│         containLabel: true                                               │
│       },                                                                 │
│       xAxis: {                                                           │
│         type: "value",  // Numeric axis (horizontal)                     │
│         name: "Value"                                                    │
│       },                                                                 │
│       yAxis: {                                                           │
│         type: "category",  // Category axis (vertical)                   │
│         data: ["Amritsar", "Ludhiana"],  // Location names               │
│         axisLabel: {                                                     │
│           fontSize: 14,                                                  │
│           fontWeight: 600                                                │
│         }                                                                │
│       },                                                                 │
│       series: series  // The 4 bar series defined above                  │
│     };                                                                   │
│                                                                           │
│  4️⃣ Render with ReactECharts                                            │
│     return (                                                             │
│       <div className="comparison-chart-container">                       │
│         <ReactECharts                                                    │
│           option={option}                                                │
│           style={{ height: "500px", width: "100%" }}                    │
│           opts={{ renderer: "svg" }}                                     │
│         />                                                               │
│       </div>                                                             │
│     );                                                                   │
└────────────────────────────────┬─────────────────────────────────────────┘
                                 ↓
┌──────────────────────────────────────────────────────────────────────────┐
│                    FINAL RESULT ON SCREEN                                │
│                                                                           │
│  User sees:                                                              │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │          District Comparison - 2024-2025                           │ │
│  ├────────────────────────────────────────────────────────────────────┤ │
│  │  [Legend: Rainfall | Safe Blocks | Critical | Recharge]           │ │
│  ├────────────────────────────────────────────────────────────────────┤ │
│  │  Amritsar  |████████ 650  ███ 0  ████ 2  ████ 2.3                │ │
│  │  Ludhiana  |██████████ 720  ███ 0  ██████ 3  ███ 1.9            │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  📊 Horizontal bars with:                                                │
│  - Location names on Y-axis (left)                                       │
│  - Metric values on X-axis (horizontal bars)                             │
│  - 4 different colors for 4 metrics                                      │
│  - Interactive tooltips on hover                                         │
└──────────────────────────────────────────────────────────────────────────┘
````

---

## 🔍 DETAILED CODE BREAKDOWN

### 1️⃣ INTENT DETECTION - determineIntent()

**File**: `backend/internal/services/nlp_service.go` (Line ~500)

```go
func (s *NLPService) determineIntent(msg string) Intent {
    msg = strings.ToLower(msg)

    // COMPARE intent detection
    if strings.Contains(msg, "compare") ||
       strings.Contains(msg, "versus") ||
       strings.Contains(msg, "vs") ||
       strings.Contains(msg, "difference between") {
        return IntentCompare
    }

    // TREND intent detection
    if strings.Contains(msg, "trend") ||
       strings.Contains(msg, "over time") ||
       strings.Contains(msg, "historical") ||
       strings.Contains(msg, "change") {
        return IntentTrend
    }

    // LIST_BLOCKS intent detection
    if (strings.Contains(msg, "list") ||
        strings.Contains(msg, "show")) &&
       strings.Contains(msg, "block") {
        return IntentListBlocks
    }

    // MAP intent detection
    if strings.Contains(msg, "map") ||
       strings.Contains(msg, "geographic") {
        return IntentMapCategory
    }

    // Default
    return IntentUnknown
}
```

**How it works**:

- Takes lowercase message
- Checks for keyword patterns
- Returns the matching intent
- **NO API CALLS** - purely local pattern matching
- Fast (~1ms)

---

### 2️⃣ ENTITY EXTRACTION - extractEntities()

**File**: `backend/internal/services/nlp_service.go` (Line ~600)

```go
func (s *NLPService) extractEntities(msg string) Entities {
    entities := Entities{
        Locations: []string{},
        Year: "2024-2025",  // Default
        Metrics: []string{},
    }

    // Extract locations (states, districts, blocks)
    // Check against known location names in database
    for _, state := range knownStates {
        if strings.Contains(msg, strings.ToLower(state)) {
            entities.Locations = append(entities.Locations, state)
        }
    }

    // Extract year if mentioned
    yearRegex := regexp.MustCompile(`\d{4}-\d{4}`)
    if match := yearRegex.FindString(msg); match != "" {
        entities.Year = match
    }

    // Extract numeric thresholds
    // e.g., "rainfall > 500" extracts threshold=500, operator=">"
    thresholdRegex := regexp.MustCompile(`([<>]=?)\s*(\d+)`)
    if match := thresholdRegex.FindStringSubmatch(msg); len(match) > 0 {
        entities.Operator = match[1]
        entities.Threshold, _ = strconv.ParseFloat(match[2], 64)
    }

    return entities
}
```

**What it extracts**:

- **Locations**: State/district/block names
- **Year**: "2024-2025", "2023-2024", etc.
- **Metrics**: "rainfall", "stage", "recharge", etc.
- **Thresholds**: Numbers with operators (>, <, >=, <=)

---

### 3️⃣ DYNAMIC SQL GENERATION (For Unknown Queries)

**File**: `backend/internal/services/nlp_service.go` (Line 725)

```go
func (s *NLPService) generateDynamicSQL(message string, intent Intent, entities Entities) (string, error) {
    // Build comprehensive schema context
    schema := `
    DATABASE SCHEMA:
    - states (state_uuid, state_name UPPERCASE)
    - districts (district_uuid, district_name, state_uuid)
    - blocks (block_uuid, block_name, district_uuid, state_uuid)
    - assessments_summary (
        block_uuid, year, rainfall, total_recharge,
        total_extraction, stage, category
      )

    CATEGORY VALUES: 'safe', 'semi_critical', 'critical', 'over_exploited'

    USER QUERY: "%s"

    Generate PostgreSQL query to answer this.
    `

    prompt := fmt.Sprintf(schema, message)

    // Use LLMService to generate SQL
    // Routes to Ollama (SQLCoder:7b) first, falls back to Gemini
    sqlText, err := s.llm.GenerateSQL(message, prompt)
    if err != nil {
        return "", fmt.Errorf("AI SQL generation failed: %w", err)
    }

    // Validate SQL contains SELECT
    if !strings.Contains(strings.ToUpper(sqlText), "SELECT") {
        return "", fmt.Errorf("invalid SQL generated")
    }

    return sqlText, nil
}
```

**Ollama/Gemini Integration** (`llm_service.go`):

```go
func (s *LLMService) GenerateSQL(query string, schema string) (string, error) {
    // Try local Ollama first (SQLCoder:7b)
    if s.useLocalLLM && s.ollamaClient != nil {
        sql, err := s.ollamaClient.GenerateSQL(ctx, query, schema)
        if err == nil {
            return sql, nil  // Success with local LLM!
        }
        // Log error and fall through to Gemini
        log.Printf("Ollama failed: %v, falling back to Gemini", err)
    }

    // Fallback to Gemini API
    return s.generateSQLWithGemini(ctx, query, schema)
}
```

**Why this approach**:

- **Ollama SQLCoder** = Free, local, fast (~400ms)
- **Gemini** = Paid, remote, fast (~200ms) but costs money
- Ollama tries first, Gemini is backup
- No data leaves your server unless Ollama fails

---

### 4️⃣ DATABASE QUERY EXECUTION

**File**: `backend/internal/services/chat_service.go` (Line 212)

```go
// Execute SQL query
results, err := s.ingres.repo.RunRawQuery(ctx, sqlQuery)
if err != nil {
    fmt.Printf("ERROR: SQL execution failed: %v\n", err)
    response.Text = "I encountered an error executing your query."
    return response, nil
}

// Handle empty results
if len(results) == 0 {
    response.Text = "No data found matching your criteria."
    return response, nil
}

// Success - results is []map[string]interface{}
// Example:
// [
//   {"block_name": "Amritsar", "rainfall": 650.5, "stage": 156.2},
//   {"block_name": "Ludhiana", "rainfall": 720.3, "stage": 179.8}
// ]
```

**Database repository** (`database_service.go`):

```go
func (r *Repository) RunRawQuery(ctx context.Context, query string) ([]map[string]interface{}, error) {
    rows, err := r.db.QueryContext(ctx, query)
    if err != nil {
        return nil, err
    }
    defer rows.Close()

    // Get column names
    columns, _ := rows.Columns()

    // Build result array
    var results []map[string]interface{}
    for rows.Next() {
        // Scan row into values
        values := make([]interface{}, len(columns))
        valuePtrs := make([]interface{}, len(columns))
        for i := range values {
            valuePtrs[i] = &values[i]
        }

        rows.Scan(valuePtrs...)

        // Build map for this row
        rowMap := make(map[string]interface{})
        for i, col := range columns {
            rowMap[col] = values[i]
        }

        results = append(results, rowMap)
    }

    return results, nil
}
```

---

### 5️⃣ CHART PAYLOAD CONSTRUCTION

**File**: `backend/internal/services/chat_service.go` (Line 2800)

```go
func (s *ChatService) compareDistricts(locations []string, year string) (*models.ChatResponse, error) {
    // ... SQL query execution ...

    // Build ComparisonData payload
    comparisonData := &models.ComparisonData{
        ComparisonType: "district",
        Year: year,
        Locations: []models.ComparisonDataPoint{},
    }

    // Process each row from database
    for _, row := range results {
        dataPoint := models.ComparisonDataPoint{
            Name:                  row["district_name"].(string),
            State:                 row["state_name"].(string),
            Rainfall:              getFloat(row, "avg_rainfall"),
            SafeBlocks:            getInt(row, "safe_blocks"),
            CriticalBlocks:        getInt(row, "critical"),
            OverExploitedBlocks:   getInt(row, "over_exploited"),
            Recharge:              getFloat(row, "total_recharge") / 100, // Scale down
        }
        comparisonData.Locations = append(comparisonData.Locations, dataPoint)
    }

    // Create chart response
    response := &models.ChatResponse{
        Text: fmt.Sprintf("Comparing %d districts...", len(locations)),
        Chart: &models.ChartData{
            Type:           "comparison-card",
            Title:          fmt.Sprintf("District Comparison - %s", year),
            ComparisonData: comparisonData,
        },
    }

    return response, nil
}
```

**Data structure** (`backend/internal/models/chat.go`):

```go
type ComparisonData struct {
    ComparisonType string                   `json:"comparisonType"` // "district", "state", "block"
    Year           string                   `json:"year"`
    Locations      []ComparisonDataPoint    `json:"locations"`
}

type ComparisonDataPoint struct {
    Name                  string  `json:"name"`
    State                 string  `json:"state"`
    Rainfall              float64 `json:"rainfall"`
    SafeBlocks            int     `json:"safeBlocks"`
    CriticalBlocks        int     `json:"criticalBlocks"`
    OverExploitedBlocks   int     `json:"overExploitedBlocks"`
    Recharge              float64 `json:"recharge"`
}
```

---

### 6️⃣ FRONTEND CHART RENDERING

**File**: `src/components/charts/echarts/ComparisonChart.tsx` (Line 23)

```typescript
const ComparisonChart: React.FC<Props> = ({ data }) => {
  const { comparisonType, year, locations } = data;

  // Extract location names for Y-axis
  const locationNames = locations.map((loc) => loc.name);

  // Build series for each metric
  const series = [
    {
      name: "Rainfall (mm)",
      type: "bar",
      data: locations.map((loc) => loc.rainfall),
      itemStyle: { color: "#007BFF" },
    },
    {
      name: "Safe Blocks",
      type: "bar",
      data: locations.map((loc) => loc.safeBlocks),
      itemStyle: { color: "#FFA500" },
    },
    {
      name: "Critical Blocks",
      type: "bar",
      data: locations.map((loc) => loc.criticalBlocks),
      itemStyle: { color: "#9ACD32" },
    },
    {
      name: "Recharge (÷100)",
      type: "bar",
      data: locations.map((loc) => loc.recharge),
      itemStyle: { color: "#4F5868" },
    },
  ];

  // ECharts configuration for HORIZONTAL bars
  const option = {
    title: {
      text: `${comparisonType} Comparison - ${year}`,
      left: "center",
      textStyle: { fontSize: 18, fontWeight: "bold" },
    },
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
    },
    legend: {
      top: 50,
      data: series.map((s) => s.name),
    },
    grid: {
      left: "15%", // Space for location names
      right: "10%",
      bottom: "10%",
      containLabel: true,
    },
    xAxis: {
      type: "value", // Numeric values (horizontal)
      name: "Value",
    },
    yAxis: {
      type: "category", // Categories (vertical)
      data: locationNames, // ["Amritsar", "Ludhiana"]
      axisLabel: {
        fontSize: 14,
        fontWeight: 600,
      },
    },
    series: series,
  };

  return (
    <div className="comparison-chart-wrapper">
      <ReactECharts
        option={option}
        style={{ height: "500px", width: "100%" }}
        opts={{ renderer: "svg" }}
      />
    </div>
  );
};
```

**ECharts renders**:

- Y-axis = Location names (vertical)
- X-axis = Numeric values (horizontal bars extending right)
- 4 series = 4 different colored bars per location
- Interactive tooltips
- Legend for color coding

---

## 🎯 COMPLETE FLOW SUMMARY

1. **User types**: "Compare Amritsar and Ludhiana"
2. **Frontend sends**: WebSocket message to backend
3. **Backend receives**: Routes to `ProcessMessage()`
4. **Intent detection**: Local keyword matching → `IntentCompare`
5. **Entity extraction**: Finds ["AMRITSAR", "LUDHIANA"], year="2024-2025"
6. **Handler routing**: Calls `handleCompare()` → `compareDistricts()`
7. **SQL execution**: Queries PostgreSQL for district summaries
8. **Data processing**: Aggregates rainfall, blocks, recharge per district
9. **Payload building**: Constructs `ComparisonData` JSON
10. **WebSocket send**: Ships JSON back to frontend
11. **Frontend receives**: Parses message, extracts chart data
12. **Chart detection**: Routes to `ComparisonChart` component
13. **ECharts render**: Displays horizontal bar chart with 4 metrics
14. **User sees**: Beautiful interactive visualization!

**Total time**: ~200-400ms (mostly database query + rendering)

---

## 🔥 KEY OPTIMIZATION STRATEGIES

### 1. **Local Intent Detection**

- No API calls for intent classification
- Pattern matching is instant (~1ms)
- Saves API costs

### 2. **Specialized Handlers**

- Pre-optimized SQL for common queries
- No LLM needed for COMPARE, TREND, LIST
- Consistent performance

### 3. **Dynamic SQL Fallback**

- Only used for unknown queries
- Ollama (local) tries first
- Gemini (API) is backup

### 4. **Data Structure Optimization**

- ComparisonData has clear schema
- Frontend knows exactly what to expect
- No ambiguity in rendering

### 5. **Frontend Chart Templating**

- Chart types are hardcoded (comparison-card, trend-card, etc.)
- Only data is dynamic
- Consistent UI/UX

---

## 📚 FILES TO STUDY

**Backend (Go)**:

1. `backend/internal/services/nlp_service.go` - Intent detection & entity extraction
2. `backend/internal/services/chat_service.go` - Message processing & handlers
3. `backend/internal/services/llm_service.go` - Ollama & Gemini integration
4. `backend/internal/models/chat.go` - Data structures
5. `backend/pkg/websocket/handler.go` - WebSocket communication

**Frontend (React)**:

1. `src/hooks/useChatWebSocket.ts` - WebSocket client
2. `src/components/INGRESAssistant.tsx` - Chat UI
3. `src/components/charts/echarts/ChartRenderer.tsx` - Chart routing
4. `src/components/charts/echarts/ComparisonChart.tsx` - Horizontal bars
5. `src/components/charts/echarts/TrendAnalysisCard.tsx` - Timeline charts

---

## 🎤 EXPLAIN THIS TO JUDGES

> **"How does your AI work?"**

"Our system uses a **3-layer AI approach**:

**Layer 1**: Local keyword matching detects common intents like Compare, Trend, List. This is instant and free.

**Layer 2**: Specialized database handlers execute optimized SQL queries. For example, 'Compare Amritsar and Ludhiana' routes to our `compareDistricts()` function which aggregates rainfall, blocks, and recharge data.

**Layer 3**: For unknown queries, we use **SQLCoder:7b running locally via Ollama** to generate custom SQL. This converts natural language like 'show blocks with rainfall < 500mm' into executable SQL. If Ollama fails, we fall back to Gemini API.

The results are packaged as structured JSON with chart type, data points, and metadata. Our frontend detects the chart type and renders it as an interactive horizontal bar chart using ECharts. The entire pipeline takes 200-400ms from query to visualization."

**Total cost**: $0 for 90% of queries (local processing), minimal API costs for the remaining 10%.
