# 🤖 Ground Sense Bot - Complete Codebase Analysis & AI Prompts

## 📋 Table of Contents
1. [System Architecture](#system-architecture)
2. [How It Works (Full Flow)](#how-it-works-full-flow)
3. [AI System Prompts](#ai-system-prompts)
4. [Tech Stack](#tech-stack)

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER INTERFACE (React)                       │
│  • INGRESAssistant.tsx - Main chat component                   │
│  • Chat input + Predefined buttons                             │
│  • Real-time WebSocket messages                                │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                    WebSocket Connection
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│              BACKEND SERVER (Go + Gin Framework)                │
│  • cmd/server/main.go - Server entry point                     │
│  • WebSocket handler for real-time chat                        │
│  • REST API endpoints (/api/v1/...)                            │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│          SERVICE LAYER (Business Logic)                         │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 1. NLP SERVICE (Intent Detection)                       │   │
│  │    • ParseMessage() - Classify user intent              │   │
│  │    • extractEntities() - Extract locations, years, etc  │   │
│  │    • generateDynamicSQL() - LLM-powered SQL generation  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                           │                                     │
│  ┌──────────────────────────▼──────────────────────────────┐   │
│  │ 2. LLM SERVICE (AI Interactions)                        │   │
│  │    • GenerateSQL() - Create SQL from natural language   │   │
│  │    • GenerateVisualization() - Select chart type        │   │
│  │    • Ollama Integration - Local LLM (Qwen/SQLCoder)     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                           │                                     │
│  ┌──────────────────────────▼──────────────────────────────┐   │
│  │ 3. CHAT SERVICE (Orchestration)                         │   │
│  │    • ProcessMessage() - Route to handlers               │   │
│  │    • getLocationStatus() - SUMMARY intent               │   │
│  │    • compareDistricts() - COMPARE intent                │   │
│  │    • Session management + conversation history          │   │
│  └─────────────────────────────────────────────────────────┘   │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│         DATABASE LAYER (PostgreSQL with PostGIS)                │
│                                                                 │
│  • assessments_summary - Main groundwater data                 │
│    └─ Columns: year, stage, category, rainfall, recharge,     │
│       extraction, availability, etc.                           │
│                                                                 │
│  • blocks, districts, states - Location hierarchy             │
│    └─ Joined to get human-readable names                      │
│                                                                 │
│  • assessments_recharge_breakdown - Recharge sources          │
│  • assessments_extraction_breakdown - Extraction sources      │
│                                                                 │
│  • Redis Cache - Permanent query caching                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 How It Works (Full Flow)

### Step 1: User Input
```
User types: "Show me over-exploited blocks in Punjab"
                         ↓
         Predefined placeholder rotates every 4 seconds
         Currently: "List all critical blocks..."
```

### Step 2: Frontend → Backend (WebSocket)
**File**: `src/components/INGRESAssistant.tsx`
```tsx
// User message handling
const onSubmit = async () => {
  // 1. Display message in chat
  const userMessage = { 
    id: Date.now().toString(), 
    content: input, 
    sender: "user" 
  };
  setMessages([...messages, userMessage]);

  // 2. Send to backend via WebSocket
  sendMessage(input);  // Opens WS connection to ws://localhost:8080/api/v1/chat
  setInput("");
};
```

### Step 3: Backend Receives & Routes
**File**: `backend/cmd/server/main.go`
```go
// WebSocket handler
ws.OnMessage(func(msg []byte) {
  // Unmarshal user query
  var userInput UserInput
  json.Unmarshal(msg, &userInput)
  
  // Route to chat service
  chatService.ProcessMessage(userInput.Query, username)
})
```

### Step 4: NLP Service - Intent Detection & Entity Extraction
**File**: `backend/internal/services/nlp_service.go`
```go
intent, entities, _ := nlpService.ParseMessage("Show me over-exploited blocks in Punjab")

// Returns:
// intent = "LIST_BLOCKS" (rule-based or AI classification)
// entities = {
//   Locations: ["punjab"],
//   Category: "over_exploited",
//   Year: "2024-2025"
// }
```

**Intent Detection Logic** (RULE-BASED):
- `SUMMARY` - "Show me data for [location]" (single location status)
- `TREND` - "Trend for...", "over years", "historical" (time-series)
- `COMPARE` - "Compare", "versus", "vs" (multiple locations)
- `RECHARGE_BREAKDOWN` - "Recharge breakdown", "recharge sources"
- `EXTRACTION_BREAKDOWN` - "Extraction breakdown", "extraction sources"
- `LIST_BLOCKS` - "Show blocks", "list", "which", filtered by category/threshold
- `MAP_CATEGORY` - "Show on map", "map view"
- `TOP_RANKING` - "Top 10", "worst blocks", "best performers", "ranking"
- `CATEGORY_DISTRIBUTION` - "Distribution of", "how many safe blocks"
- `DEFICIT_ANALYSIS` - "Deficit", "water shortage", "extraction > recharge"
- `CHANGE_ANALYSIS` - "Change", "over 4 years", "improved/worsened"
- And more... (19 total intents)

### Step 5: LLM Service - Dynamic SQL Generation
**File**: `backend/internal/services/llm_service.go` + `ollama_client.go`

The system sends a **massive prompt** to Ollama (local LLM) with:
- Database schema (tables, columns, constraints)
- 20+ example SQL queries
- Critical rules and column names
- User's natural language query
- Request: "Generate the ONLY SQL query, no markdown, no explanations"

```go
// Example flow
sqlQuery, _ := llmService.GenerateSQL(
  userMessage: "Show me over-exploited blocks in Punjab",
  schema: [DATABASE SCHEMA DETAILS]
)

// LLM generates:
// SELECT b.block_name, d.district_name, a.stage, a.category
// FROM assessments_summary a
// JOIN blocks b ON a.block_uuid = b.block_uuid
// JOIN districts d ON b.district_uuid = d.district_uuid
// JOIN states s ON b.state_uuid = s.state_uuid
// WHERE UPPER(s.state_name) = UPPER('punjab')
// AND LOWER(a.category) = 'over_exploited'
// AND a.year = '2024-2025'
// ORDER BY a.stage DESC
// LIMIT 50
```

**Key Features**:
- ✅ **Caching**: Same query always returns cached SQL (saves 5-10s)
- ✅ **Validation**: Checks for SELECT, blocks DROP/DELETE/INSERT
- ✅ **Error Handling**: Falls back to predefined queries if LLM fails

### Step 6: Database Query Execution
**File**: `backend/internal/repositories/assessment_repository.go`
```go
// Execute the generated SQL
results, err := ingresService.QueryDatabase(sqlQuery)

// Returns structured data:
// [{
//   block_name: "MANSA",
//   district_name: "MANSA",
//   stage: 185.5,
//   category: "over_exploited"
// }, ...]
```

### Step 7: LLM Service - Visualization Selection
**File**: `backend/internal/services/llm_service.go`

The system sends another prompt to Ollama:
- Query results (first 50 rows as JSON)
- User's original query
- SQL that was executed
- Request: "Choose the best chart type and generate JSON config"

```go
visualizationJSON, _ := llmService.GenerateVisualization(
  data: [Query Results],
  userMessage: "Show me over-exploited blocks in Punjab",
  sqlQuery: [Generated SQL]
)

// LLM returns JSON like:
// {
//   "type": "rose-pie",  // Nightingale chart for rankings
//   "title": "Top Over-Exploited Blocks in Punjab",
//   "explanation": "Analysis of 47 blocks with stage > 100%...",
//   "pieData": [
//     { "name": "MANSA, MANSA", "value": 185.5 },
//     { "name": "MUKERIAN, HOSHIARPUR", "value": 179.2 },
//     ...
//   ],
//   "insights": [
//     "47 over-exploited blocks found",
//     "Average stage: 145.8%",
//     "Deficit: 2,847 MCM/year"
//   ],
//   "alerts": [
//     { "level": "critical", "message": "Over 100% stage indicates..." }
//   ]
// }
```

### Step 8: Backend → Frontend (WebSocket Response)
```go
// Send back to user
response := {
  id: uuid,
  content: "Found 47 over-exploited blocks in Punjab...",
  payload: {
    visualization: visualizationJSON,
    data: results,
    intent: "LIST_BLOCKS",
    sql: sqlQuery
  },
  sender: "bot"
}

ws.Send(json.Marshal(response))
```

### Step 9: Frontend Renders Visualization
**File**: `src/components/INGRESAssistant.tsx`
```tsx
// Handle bot response
socket.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  // Render appropriate component based on visualization type
  if (data.payload.visualization.type === "rose-pie") {
    return <NightingaleChart data={data.payload.visualization.pieData} />;
  } else if (data.payload.visualization.type === "gradient-area") {
    return <AreaChart data={data.payload.visualization} />;
  }
  // ... more chart types
};
```

---

## 🧠 AI System Prompts

### Prompt 1: SQL Generation (Primary - Used for All Queries)

**Location**: `backend/internal/services/nlp_service.go:359`

```
You are an expert AI assistant for India's INGRES Groundwater Data System.

[DATABASE SCHEMA - Detailed table definitions]
[INTENT ANALYSIS - Classified intent and extracted entities]
[CRITICAL RULES - SQL generation guidelines]
[20+ EXAMPLE SQL QUERIES - Templates to follow]

CRITICAL RULES (MUST FOLLOW):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. ALWAYS use proper JOINs to get location names
2. For STATE matching: Use UPPER(s.state_name) = UPPER('...')
3. For BLOCK/DISTRICT matching: Use LOWER(b.block_name) ILIKE '%...%'
4. Year filtering: Default to '2024-2025' (most data), support trends
5. Add LIMIT 50 for list queries

⚠️ CATEGORY VALUES (EXACT - lowercase with underscores):
- 'safe'           (stage < 70%)
- 'semi_critical'  (stage 70-90%)
- 'critical'       (stage 90-100%)
- 'over_exploited' (stage > 100%)
- 'salinity'       (special: stage = -100000)

WHERE LOWER(a.category) = 'over_exploited' ✅ CORRECT
WHERE a.category = 'Over-Exploited'        ❌ WRONG

6. For aggregates: AVG(CASE WHEN a.stage > 0 THEN a.stage ELSE NULL END)
   → Excludes salinity blocks (-100000)
7. ROUND(value::numeric, 2) for decimals
8. Return ONLY valid PostgreSQL SQL - no markdown, no comments

NOW GENERATE THE SQL QUERY FOR THE USER'S REQUEST:
```

**Examples Provided to LLM**:
```sql
🎯 EXAMPLE 1 - "List over-exploited blocks in Punjab":
SELECT b.block_name, d.district_name, a.stage, a.category
FROM assessments_summary a
JOIN blocks b ON a.block_uuid = b.block_uuid
JOIN districts d ON b.district_uuid = d.district_uuid
JOIN states s ON b.state_uuid = s.state_uuid
WHERE UPPER(s.state_name) = UPPER('punjab')
AND LOWER(a.category) = 'over_exploited'
AND a.year = '2024-2025'
ORDER BY a.stage DESC
LIMIT 50

🎯 EXAMPLE 2 - "Compare Punjab and Haryana":
SELECT s.state_name, COUNT(*) as total_blocks,
       ROUND(AVG(CASE WHEN a.stage > 0 THEN a.stage END)::numeric, 2) as avg_stage,
       SUM(CASE WHEN LOWER(a.category) = 'over_exploited' THEN 1 ELSE 0 END) as overexploited
FROM assessments_summary a
JOIN blocks b ON a.block_uuid = b.block_uuid
JOIN states s ON b.state_uuid = s.state_uuid
WHERE UPPER(s.state_name) IN ('PUNJAB', 'HARYANA')
AND a.year = '2024-2025'
GROUP BY s.state_name

🎯 EXAMPLE 3 - "Top 10 over-exploited blocks":
SELECT CONCAT(b.block_name, ', ', d.district_name) as location,
       s.state_name,
       ROUND(a.stage::numeric, 2) as stage_percent,
       ROUND(a.total_extraction::numeric, 2) as extraction_mcm,
       ROUND(a.total_recharge::numeric, 2) as recharge_mcm,
       ROUND((a.total_extraction - a.total_recharge)::numeric, 2) as deficit_mcm
FROM assessments_summary a
JOIN blocks b ON a.block_uuid = b.block_uuid
JOIN districts d ON b.district_uuid = d.district_uuid
JOIN states s ON d.state_uuid = s.state_uuid
WHERE LOWER(a.category) = 'over_exploited'
AND a.year = '2024-2025'
AND a.stage > 0
ORDER BY a.stage DESC
LIMIT 10

🎯 EXAMPLE 14 - "Compare all states":
SELECT s.state_name,
       COUNT(*) as total_blocks,
       ROUND(AVG(a.rainfall)::numeric, 2) as avg_rainfall,
       ROUND(AVG(CASE WHEN a.stage > 0 THEN a.stage ELSE NULL END)::numeric, 2) as avg_stage,
       SUM(CASE WHEN LOWER(a.category) = 'safe' THEN 1 ELSE 0 END) as safe,
       SUM(CASE WHEN LOWER(a.category) = 'over_exploited' THEN 1 ELSE 0 END) as overexploited
FROM assessments_summary a
JOIN blocks b ON a.block_uuid = b.block_uuid
JOIN states s ON b.state_uuid = s.state_uuid
WHERE a.year = '2024-2025'
GROUP BY s.state_name
ORDER BY total_blocks DESC

[... 16+ more examples ...]
```

---

### Prompt 2: Visualization Generation

**Location**: `backend/internal/services/llm_service.go:224`

```
You are an Expert Data Visualization Architect for groundwater analysis.

[DOMAIN KNOWLEDGE - Groundwater analysis expertise]
USER QUERY: "[User's original question]"
SQL QUERY: "[The SQL that was executed]"
DATA RESULT: [First 50 rows of query results as JSON]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DYNAMIC VISUALIZATION GENERATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STEP 1 - ANALYZE DATA STRUCTURE:
- Count rows and columns
- Identify data types (numeric, categorical, temporal)
- Detect patterns (time series, comparisons, distributions)

STEP 2 - SELECT OPTIMAL CHART TYPE:

| Data Pattern | Best Chart Type | Reasoning |
|-------------|-----------------|-----------|
| Single metric over time | gradient-area | Clean trend viz |
| Multiple metrics comparison | brush-bar | Side-by-side compare |
| Category distribution | rose-pie | Proportional shares |
| Stacked components | stacked-area | Part-to-whole |
| Multi-year temporal | timeline-bar | Animated progression |
| Large dataset (50+) | large-area | Optimized for scale |
| Breakdown sources | brush-bar | Multi-series |
| Ranking/Top N (CRITICAL) | rose-pie | Nightingale chart |

⚠️ CRITICAL: For "Top N", "worst", "best", "ranking" → ALWAYS USE "rose-pie"
The rose-pie (Nightingale chart) shows ranking by petal size - larger = higher values.

STEP 3 - EXTRACT INSIGHTS:
- Is extraction > recharge? (Unsustainable)
- Which regions over-exploited?
- What are trends?
- Anomalies?

STEP 4 - GENERATE JSON:
Return ONLY valid JSON (no markdown):

{
  "type": "gradient-area|brush-bar|rose-pie|stacked-area|timeline-bar|large-area|horizontal-bar|stacked-bar",
  "title": "Clear, descriptive title",
  "explanation": "2-3 sentence insight with specific numbers",
  "insights": [
    "Key finding 1 with data",
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
      "stack": "total",
      "itemStyle": { "color": "#hex" },
      "label": { "show": true, "position": "inside" },
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
✓ Use ACTUAL data from results - don't make up numbers
✓ xAxis labels count = series data length
✓ At least 2 meaningful insights
✓ Alerts for concerning patterns (stage > 100%, extraction > recharge)
✓ Title reflects what data shows
✓ Explanation cites specific numbers

Generate the visualization JSON now:
```

---

### Prompt 3: Intent Analysis & Entity Extraction

**Location**: `backend/internal/services/nlp_service.go:766`

```
You are an expert AI assistant for India's INGRES Groundwater Data System.

DATABASE SCHEMA CONTEXT:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HIERARCHY: State → District → Block
BLOCKS IN 2024-2025: 5,796 | DATA AVAILABILITY: 7 years

TABLES:
1. STATES - state_name (ALL UPPERCASE like "PUNJAB", "HARYANA")
2. DISTRICTS - district_name (Mixed case)
3. BLOCKS - block_name (Mixed case)
4. ASSESSMENTS_SUMMARY - Main groundwater data
   - year: '2012-2013', '2016-2017', '2019-2020', '2021-2022', '2023-2024', '2024-2025'
   - rainfall (mm), total_recharge (MCM), total_extraction (MCM)
   - stage (%), availability (MCM)

CATEGORY VALUES (EXACT - lowercase):
- 'safe' (stage < 70%)
- 'semi_critical' (stage 70-90%)
- 'critical' (stage 90-100%)
- 'over_exploited' (stage > 100%)
- 'salinity' (stage = -100000)
- 'Hilly Area' (not assessed)
- 'none' (no category)

5. RECHARGE_BREAKDOWN - source: 'rainfall', 'canal', 'gw_irrigation', 'surface_irrigation', 
                                'water_body', 'artificial_structure', 'sewage', 'pipeline', 
                                'streamRecharge', 'agriculture', 'Total'

6. EXTRACTION_BREAKDOWN - source: 'agriculture', 'domestic', 'industry', 'Total'

USER QUERY: "[User's question]"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INTENT CLASSIFICATION RULES:

1. SUMMARY - Single location status/info
2. RECHARGE_BREAKDOWN - Recharge sources/components
3. EXTRACTION_BREAKDOWN - Extraction sources/components
4. TREND - Historical data over time
5. COMPARE - Multiple locations comparison
6. LIST_BLOCKS - List blocks (filtered by category/threshold)
7. MAP_CATEGORY - Show on map
8. TOP_RANKING - Top N, rankings, worst/best
9. CATEGORY_DISTRIBUTION - Distribution counts
10. DEFICIT_ANALYSIS - Water shortage analysis
11. CHANGE_ANALYSIS - Temporal changes
12. [... more intents ...]

Provide classification with confidence score and extracted entities.
```

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Components**: Custom + Shadcn UI
- **Charts**: ECharts (gradient-area, brush-bar, rose-pie, stacked-area, etc.)
- **WebSocket**: Browser native WebSocket API
- **State Management**: React Hooks + Context API

### Backend
- **Language**: Go 1.21+
- **Framework**: Gin (HTTP routing)
- **Database**: PostgreSQL + PostGIS (spatial queries)
- **Cache**: Redis (permanent query caching)
- **LLM Integration**: Ollama (local deployment)
  - Models: Qwen 2.5 Coder, SQLCoder
- **ORM**: Raw SQL (no ORM used)
- **Logging**: Structured logging

### Data & Services
- **InGRES API**: India's Groundwater Data (7 years, 5,796 blocks, state/district/block level)
- **Database Schema**: 
  - assessments_summary (main groundwater data)
  - blocks, districts, states (location hierarchy)
  - assessments_recharge_breakdown (10+ recharge sources)
  - assessments_extraction_breakdown (3 extraction sectors)

### Key Features
- ✅ **Real-time WebSocket Chat**
- ✅ **Dynamic SQL Generation** (LLM-powered)
- ✅ **Automatic Visualization Selection** (LLM-powered)
- ✅ **Multi-intent Intent Detection** (19 classification types)
- ✅ **Permanent Query Caching** (Redis - same query = instant response)
- ✅ **Conversational Memory** (session-based history)
- ✅ **19 Intent Types** (SUMMARY, TREND, COMPARE, TOP_RANKING, etc.)
- ✅ **8+ Chart Types** (gradient-area, brush-bar, rose-pie, stacked-area, etc.)

---

## 📊 Data Layer Details

### assessments_summary (Main Table)
```sql
CREATE TABLE assessments_summary (
    assessment_id SERIAL PRIMARY KEY,
    year VARCHAR(10),           -- '2024-2025', '2023-2024', etc.
    block_uuid UUID,
    rainfall DOUBLE PRECISION,  -- mm
    total_recharge DOUBLE PRECISION,  -- MCM
    total_extraction DOUBLE PRECISION,  -- MCM
    total_extractable DOUBLE PRECISION,  -- MCM
    category VARCHAR(20),       -- 'safe', 'critical', 'over_exploited', etc.
    stage DOUBLE PRECISION,     -- % (or -100000 for salinity)
    availability DOUBLE PRECISION,  -- MCM
    created_at TIMESTAMP
);
```

### Breakdown Tables
```sql
-- Recharge sources
CREATE TABLE assessments_recharge_breakdown (
    assessment_id INT REFERENCES assessments_summary,
    source VARCHAR(50),         -- 'rainfall', 'canal', 'gw_irrigation', etc.
    command DOUBLE PRECISION,
    non_command DOUBLE PRECISION,
    total DOUBLE PRECISION
);

-- Extraction sources
CREATE TABLE assessments_extraction_breakdown (
    assessment_id INT REFERENCES assessments_summary,
    source VARCHAR(50),         -- 'agriculture', 'domestic', 'industry'
    command DOUBLE PRECISION,
    non_command DOUBLE PRECISION,
    total DOUBLE PRECISION
);
```

---

## 🎯 Key Implementation Details

### 1. Intent Detection (19 Types)
Rule-based pattern matching + optional AI fallback:
- `SUMMARY`: "Show", "status", "information"
- `TREND`: "Trend", "over years", "historical"
- `COMPARE`: "Compare", "vs", "versus"
- `TOP_RANKING`: "Top", "worst", "best", "ranking"
- `CATEGORY_DISTRIBUTION`: "How many", "distribution"
- And 14 more...

### 2. SQL Generation Strategy
1. **Intent Detection** → Extract entities
2. **Build Prompt** with:
   - Full database schema
   - 20+ example queries
   - Critical rules (category formats, joins, year defaults)
   - User's query
3. **Call Ollama** (local LLM) → Get SQL
4. **Validate** SQL (must have SELECT, no DROP/DELETE)
5. **Cache** in Redis forever (same query = instant next time)
6. **Execute** on PostgreSQL

### 3. Visualization Strategy
1. **Get Query Results** (50 rows max)
2. **Send to LLM** with:
   - Data as JSON
   - User's original query
   - Database schema
3. **LLM Decides Chart Type**:
   - Ranking → rose-pie (Nightingale)
   - Trends → gradient-area
   - Comparisons → brush-bar
   - Distributions → stacked-area
4. **Generate Chart Config** as JSON
5. **Send to Frontend** via WebSocket

### 4. Real-time Communication
- **WebSocket URL**: `ws://localhost:8080/api/v1/chat?username={username}`
- **Message Format**: JSON with user query
- **Response Format**: JSON with visualization payload

---

## 🚀 Performance Optimizations

1. **Redis Query Caching** - Permanent cache (no TTL)
2. **Conversation History** - Keep 10 recent messages per session
3. **Data Truncation** - Limit LLM visualization input to 15KB
4. **Batch SQL Execution** - Process multiple queries efficiently
5. **Connection Pooling** - PostgreSQL connection reuse

---

## 📝 Summary

The Ground Sense Bot is an **AI-powered intelligent assistant** for India's groundwater data:

1. **User inputs natural language** → "Show me over-exploited blocks in Punjab"
2. **NLP Service classifies intent** → LIST_BLOCKS with category filter
3. **LLM generates SQL dynamically** → Complex queries without manual coding
4. **Database returns results** → Structured groundwater data
5. **LLM selects best chart** → rose-pie (ranking), gradient-area (trends), etc.
6. **Frontend renders visualization** → Interactive ECharts
7. **Response cached forever** → Same query = instant next time

All powered by **local Ollama LLM** (Qwen 2.5 Coder + SQLCoder) for cost-effective, private inference.
