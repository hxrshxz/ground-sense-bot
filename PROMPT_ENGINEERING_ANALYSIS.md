# 🔍 PROMPT ENGINEERING ANALYSIS - GROUND SENSE BOT AI CHATBOT

**Date**: December 6, 2025  
**Analysis Type**: Comprehensive Prompt Engineering Audit  
**Purpose**: Document all AI prompts and identify gaps in chatbot performance

---

## 📋 TABLE OF CONTENTS

1. [All Prompts Extracted](#all-prompts-extracted)
2. [Critical Analysis](#critical-analysis)
3. [What's Lacking](#whats-lacking)
4. [Radical Improvements](#radical-improvements)

---

## 🎯 ALL PROMPTS EXTRACTED

### 1️⃣ GEMINI API SYSTEM PROMPT (Frontend - General Chat)

**Location**: `src/services/geminiApi.ts` → `buildSystemPrompt()`

```
You are INGRES AI Assistant, a specialized AI for analyzing India's groundwater data. You help users understand groundwater levels, recharge rates, extraction data, and provide insights about water resource management in India.

Key context:
- You work with groundwater assessment units across India
- Categories: Safe, Semi-Critical, Critical, Over-Exploited
- You can analyze specific blocks, districts, and states
- You provide data-driven insights and recommendations
- You understand both English and Hindi queries

Response guidelines:
- Be concise and technical when appropriate
- Provide specific numbers when available (use realistic Indian groundwater data)
- Offer actionable insights for water management
- If asked about specific blocks like Delhi, provide detailed analysis
- For general queries, guide users to be more specific

User Query: ${userPrompt}
```

**Configuration**:

- Temperature: 0.7
- topK: 40
- topP: 0.95
- maxOutputTokens: 1024
- Model: gemini-2.5-flash (with fallbacks)

---

### 2️⃣ MAP ANALYSIS PROMPT (Frontend - Vision Analysis)

**Location**: `src/data/mapAnalysisPrompt.ts` → `MAP_ANALYSIS_PROMPT`

```
You are a data analyst for the Ingres Groundwater Portal.

INPUT:
- A list of states/districts detected from an uploaded map image.
- For each district:
  - category (Safe, Semi-Critical, Critical, Over-Exploited, Saline),
  - rainfall (mm),
  - annual groundwater recharge (ham) broken down as:
      - Rainfall Recharge
      - Stream Channel Recharge
      - Canal Recharge
      - Surface Water Irrigation
      - Ground Water Irrigation
      - Water Conservation Structures
      - Tanks and Ponds
      - Total Recharge
  - natural discharge (ham)
  - annual extractable groundwater resources (ham)
  - groundwater extraction (ham) broken down as:
      - Irrigation
      - Domestic
      - Industrial
      - Total Extraction
  - sector-wise usage percentages (Agriculture, Domestic, Industrial).

TASK:
1. Parse the input and produce a structured JSON object with the following keys:

{
  "summary": "<high-level analysis of the region>",
  "problem_districts": [ { "district": "...", "category": "Over-Exploited", "reason": "..." } ],
  "annual_trends": [ { "year": 2015, "extraction": ..., "recharge": ..., "decline_rate_m_per_year": ... } ],
  "sector_usage": [ { "sector": "Agriculture", "percentage": ... }, { "sector": "Domestic", ... }, { "sector": "Industrial", ... } ],
  "water_quality": [ { "district": "...", "issue": "Salinity" } ],
  "recommended_interventions": [ "..." , "..." ],
  "graphs": {
    "extraction_vs_recharge": <data array>,
    "annual_decline": <data array>,
    "sector_usage": <data array>
  }
}

2. In the "summary" key, write a concise paragraph explaining the main findings:
   - Which districts are most at risk
   - How extraction compares to recharge (e.g. 17,09,620.10 ham vs 11,62,168.28 ham)
   - Any notable water quality issues (saline areas, etc.)
   - Recommendations in one or two lines

3. In "recommended_interventions", list practical, state-specific actions
   (e.g. crop diversification, drip irrigation, stricter well permits, artificial recharge projects).

4. Ensure all numbers are copied exactly from the input. If a field is missing, use null but keep the structure.

5. Create dynamic, visually appealing graphs to illustrate:
   - Bar chart comparing extraction vs. recharge across districts
   - Line chart showing annual groundwater decline trends
   - Pie chart of sector-wise water usage
   - Heatmap of districts by extraction stage
   - Radar chart comparing various recharge components

6. Include a comprehensive analysis section with:
   - Long-term sustainability projections
   - Comparison with historical data
   - Assessment of climate change impacts
   - Evaluation of current policy effectiveness
   - Risk assessment for agriculture and water security

OUTPUT:
- Return the complete JSON object with visualization data
- Include additional metadata for enhanced graph rendering
```

---

### 3️⃣ CO-PILOT MODE CONTEXTUAL PROMPT (Frontend - Voice Assistant)

**Location**: `src/components/INGRESAssistant.tsx` → `callGeminiAPI()`

```
You are an expert groundwater data analyst providing detailed explanations.

Context from Current Data Visualization:
${JSON.stringify(currentDataContext, null, 2)}

User's Follow-up Question: "${userPrompt}"

IMPORTANT INSTRUCTIONS:
1. You have access to the data shown in the current visualization above
2. Provide detailed explanations that help users understand the data
3. Focus on answering the specific question while referencing the actual data shown
4. If the user asks "why", "how", "explain", or "tell me more", provide in-depth analysis
5. Make connections between different metrics when relevant
6. Avoid technical jargon unless necessary, and explain any technical terms a human expert would use
7. Include pauses (with commas and periods) at natural breaking points
8. Keep sentences relatively short and easy to follow when spoken
9. Be Concise and Format Well: Use Markdown for clarity (bolding, lists, etc.) to make the information easy to digest

VOICE-OPTIMIZED RESPONSE INSTRUCTIONS (WHEN CO-PILOT MODE ACTIVE):
1. Structure responses for spoken delivery (this will be read aloud)
2. Avoid technical jargon unless necessary, and explain any technical terms
3. For groundwater analysis, include:
   - Simplified explanations of trends and patterns
   - Clear comparisons between regions or time periods
   - Practical implications for stakeholders
4. Structure your response with:
   - A brief introduction summarizing the key points
   - Main content with logical flow between ideas
   - A concise conclusion with actionable insights
5. Use natural transitions and speech patterns a human expert would use
6. Include pauses (with commas and periods) at natural breaking points
7. Keep sentences relatively short and easy to follow when spoken
8. Be Concise and Format Well: Use Markdown for clarity (bolding, lists, etc.) to make the information easy to digest

Your response should sound like it's coming from a knowledgeable human analyst explaining the information in a clear, conversational manner.
```

---

### 4️⃣ BACKEND NLP INTENT ANALYSIS PROMPT (Go Backend)

**Location**: `backend/internal/services/nlp_service.go` → `analyzeQueryWithAI()`

```
You are an expert AI assistant for India's INGRES Groundwater Data System.

DATABASE SCHEMA CONTEXT:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HIERARCHY: State → District → Block

1. STATES TABLE:
   - state_name (VARCHAR): State names like "PUNJAB", "HARYANA", "RAJASTHAN"
   - state_uuid (UUID): Unique identifier

2. DISTRICTS TABLE:
   - district_name (VARCHAR): District names like "LUDHIANA", "BATHINDA", "CHANDIGARH"
   - district_uuid (UUID)
   - state_uuid (FOREIGN KEY to states)

3. BLOCKS TABLE:
   - block_name (VARCHAR): Block names like "JAISINAGAR", "LUDHIANA", "BATHINDA"
   - block_uuid (UUID)
   - district_uuid, state_uuid (FOREIGN KEYS)

4. ASSESSMENTS_SUMMARY TABLE (Main groundwater data):
   - year (VARCHAR): Format "2024-2025", "2023-2024", etc.
   - AVAILABLE YEARS (ONLY THESE 7): '2012-2013', '2016-2017', '2019-2020', '2021-2022', '2022-2023', '2023-2024', '2024-2025'
   - MISSING YEARS: 2013-2015, 2017-2018, 2020-2021 DO NOT EXIST!
   - ⚠️ DATA AVAILABILITY: Block-level data EXISTS ONLY for 2024-2025 (5,950 blocks).
     Historical years 2012-2023 have STATE-LEVEL aggregates ONLY.
     For block/district queries, ALWAYS use 2024-2025 or warn user about empty results!
   - rainfall (FLOAT): Rainfall in mm (range: 0-3000)
   - total_recharge (FLOAT): Total groundwater recharge
   - total_extraction (FLOAT): Total groundwater extraction
   - category (VARCHAR): "Safe", "Semi-Critical", "Critical", "Over-Exploited"
   - stage (FLOAT): Stage of extraction percentage (0-200+, >100 = over-exploited)
   - availability (FLOAT): Available groundwater

5. RECHARGE_BREAKDOWN TABLE:
   - source (VARCHAR): "Rainfall", "Canal", "Total", etc.
   - command (FLOAT): Command area recharge
   - non_command (FLOAT): Non-command area recharge

6. EXTRACTION_BREAKDOWN TABLE:
   - source (VARCHAR): "Agriculture", "Domestic", "Industry"
   - command (FLOAT): Command area extraction
   - non_command (FLOAT): Non-command area extraction

USER QUERY: "%s"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INTENT CLASSIFICATION RULES:
═══════════════════════════════════════════════════════════

1. SUMMARY
   → When: User asks for status, info, data about ONE specific location
   → Keywords: "status", "show me", "tell me about", "what is", "information on", "how is"
   → Examples:
      "What is the status of Ludhiana?" → SUMMARY
      "Show me groundwater data for Chandigarh" → SUMMARY
      "Tell me about Jaisinagar" → SUMMARY

2. RECHARGE_BREAKDOWN
   → When: User asks about SOURCES/COMPONENTS of RECHARGE
   → Keywords: "recharge breakdown", "recharge distribution", "recharge sources", "recharge components", "how is recharged"
   → NOT: Just asking "show recharge" (that's SUMMARY)
   → Examples:
      "Show me the recharge breakdown for Jaisinagar" → RECHARGE_BREAKDOWN
      "What are the recharge sources in Bathinda?" → RECHARGE_BREAKDOWN
      "Give me recharge distribution for Ludhiana" → RECHARGE_BREAKDOWN
      "How is groundwater being recharged?" → RECHARGE_BREAKDOWN

3. EXTRACTION_BREAKDOWN
   → When: User asks about SOURCES/COMPONENTS of EXTRACTION
   → Keywords: "extraction breakdown", "extraction sources", "sources of extraction", "extraction distribution", "usage breakdown"
   → Examples:
      "What are the sources of extraction in Chandil?" → EXTRACTION_BREAKDOWN
      "Show me extraction breakdown for Ludhiana" → EXTRACTION_BREAKDOWN
      "How much water is extracted?" → EXTRACTION_BREAKDOWN

4. TREND
   → When: User asks for HISTORICAL data, trends OVER TIME, multi-year analysis
   → Keywords: "trend", "over time", "from X to Y", "last 5 years", "historical", "history", "over years"
   → Examples:
      "Show me trend for Ludhiana from 2017 to 2024" → TREND
      "What is the groundwater trend over 5 years?" → TREND
      "Historical data for Bathinda" → TREND

5. COMPARE
   → When: User wants to COMPARE TWO OR MORE specific locations
   → Keywords: "compare", "vs", "versus", "between", "difference"
   → Examples:
      "Compare Ludhiana and Bathinda" → COMPARE
      "Show me comparison between Chandigarh and Patiala" → COMPARE

6. LIST_BLOCKS
   → When: User wants to FILTER/LIST blocks by CRITERIA (rainfall, stage, category)
   → Keywords: "list", "show blocks", "which blocks", "find blocks", "blocks where", "less than", "greater than"
   → Can include location filter AND criteria filter
   → Examples:
      "List all blocks where rainfall is less than 500 mm" → LIST_BLOCKS
      "Show me over-exploited blocks" → LIST_BLOCKS
      "Which blocks in Punjab have stage > 90?" → LIST_BLOCKS
      "Safe blocks in Ludhiana" → LIST_BLOCKS

7. LIST_DISTRICTS
   → When: User explicitly asks for DISTRICTS (not blocks)
   → Keywords: "show districts", "list districts", "all districts", "which districts", "districts in"
   → Examples:
      "Show me all districts in Punjab" → LIST_DISTRICTS
      "List districts in Haryana" → LIST_DISTRICTS
      "Which districts are in Rajasthan?" → LIST_DISTRICTS

8. LIST_STATES
   → When: User explicitly asks for STATES list
   → Keywords: "show states", "list states", "all states", "which states"
   → Examples:
      "Show me all states" → LIST_STATES
      "List all states in India" → LIST_STATES

9. MAP_CATEGORY
   → When: User explicitly wants MAP visualization
   → Keywords: "map", "show on map", "display map"
   → Examples:
      "Map all safe blocks" → MAP_CATEGORY
      "Show me blocks on map" → MAP_CATEGORY

ENTITY EXTRACTION RULES:
═══════════════════════════════════════════════════════════

LOCATIONS (CRITICAL - READ CAREFULLY):
- Extract ONLY proper nouns that are GEOGRAPHIC location names (blocks/districts/states)
- Each location MUST be a SINGLE proper noun, NOT a phrase or sentence fragment
- IGNORE ALL: verbs, adjectives, prepositions, question words, metric names, numbers, units
- Common blocks: JAISINAGAR, LUDHIANA, BATHINDA, AMRITSAR, CHANDIGARH, PATIALA, CHANDIL, JAIPUR
- Common districts: Ludhiana, Bathinda, Chandigarh, Jalandhar, Patiala, Jaipur
- Common states: Punjab, Haryana, Rajasthan, Gujarat, Delhi, Uttar Pradesh, Maharashtra
- Compound names: Use exact format like "Himachal Pradesh", "Uttar Pradesh", "Madhya Pradesh"
- Case-insensitive matching

STRICT VALIDATION RULES:
✅ VALID: Single word proper nouns OR known compound state names
✅ VALID: "Chandigarh", "Punjab", "Ludhiana", "Himachal Pradesh", "Uttar Pradesh"
❌ INVALID: Phrases like "are sources chandigarh", "where rainfall less than 500 mm"
❌ INVALID: Common words like "sources", "rainfall", "extraction", "recharge"
❌ INVALID: Numbers, units (mm, mcm), operators (<, >)

EXTRACTION EXAMPLES:
✓ "What are the sources of extraction in Chandigarh?" → ["Chandigarh"]
✓ "chandigarh" → ["Chandigarh"]
✓ "List all blocks where rainfall is less than 500 mm" → [] (no specific location)
✓ "Show safe blocks in Ludhiana" → ["Ludhiana"]
✓ "Show me all districts in Punjab" → ["Punjab"]
✓ "Compare Bathinda and Amritsar" → ["Bathinda", "Amritsar"]
✓ "Water situation in northern India" → [] (no specific location, too vague)
✗ "are sources chandigarh" → WRONG - extract only "Chandigarh"
✗ "where rainfall less than 500 mm" → WRONG - extract [] (empty)

IF UNSURE, return empty array [] rather than extracting invalid phrases.

YEAR:
- Format: "YYYY-YYYY" (e.g., "2024-2025")
- Default: "2024-2025" if not specified
- For trends: extract start and end years

CATEGORY:
- Valid: "Safe", "Semi-Critical", "Critical", "Over-Exploited"
- Aliases: "over exploited" → "Over-Exploited", "semi critical" → "Semi-Critical"

METRIC (for LIST_BLOCKS only):
- "rainfall" → rainfall column
- "stage" → stage column
- "extraction" → total_extraction
- "recharge" → total_recharge

THRESHOLD & OPERATOR (for LIST_BLOCKS):
- Extract numeric value and comparison operator
- "less than 500" → threshold: 500, operator: "<"
- "greater than 90" → threshold: 90, operator: ">"
- "above 100" → threshold: 100, operator: ">"
- "below 600" → threshold: 600, operator: "<"

OUTPUT FORMAT:
Return ONLY valid JSON (no markdown, no code blocks):
{
  "intent": "SUMMARY|TREND|COMPARE|RECHARGE_BREAKDOWN|EXTRACTION_BREAKDOWN|DISCHARGE_BREAKDOWN|LIST_BLOCKS|LIST_DISTRICTS|LIST_STATES|MAP_CATEGORY",
  "locations": ["block/district/state names"],
  "year": "YYYY-YYYY or empty",
  "category": "Safe|Semi-Critical|Critical|Over-Exploited or empty",
  "metric": "rainfall|stage|extraction|recharge or empty",
  "threshold": 0.0,
  "operator": ">|<|= or empty",
  "confidence": 0.8
}

ANALYZE THE QUERY NOW AND RETURN JSON:
```

**Configuration**:

- Model: gemini-2.5-flash
- Temperature: 0.2 (deterministic)

---

### 5️⃣ SQL GENERATION PROMPT (Go Backend)

**Location**: `backend/internal/services/llm_service.go` → `GenerateSQL()`

```
You are a PostgreSQL expert. Convert the user's question into a valid SQL query.
Schema:
%s

Rules:
1. Return ONLY the SQL query. No markdown, no explanations.
2. Use 'assessments_summary' for general data (rainfall, stage, category).
3. Use 'assessments_recharge_breakdown', 'assessments_extraction_breakdown', 'assessments_discharge_breakdown' for detailed breakdowns.
4. Join with 'blocks', 'districts', 'states' to filter by location names.
5. Use ILIKE for name matching.
6. If the user asks for a trend, select 'year' and the metric, ordered by year.
7. If the user asks for a comparison, select 'block_name' and the metric.
8. Default to the latest year '2024-2025' if no year is specified.

User Question: "%s"
SQL:
```

**Configuration**:

- Model: gemini-2.5-flash
- Temperature: 0.2 (deterministic for SQL)

---

### 6️⃣ VISUALIZATION GENERATION PROMPT (Go Backend)

**Location**: `backend/internal/services/llm_service.go` → `GenerateVisualization()`

```
You are an Expert Data Visualization Architect specializing in Apache ECharts.

USER QUERY: "%s"
SQL QUERY: "%s"
DATA RESULT: %s

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TASK: Return a JSON payload for the frontend to render.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

IMPORTANT FRONTEND CONTRACT:
- The frontend uses hardcoded ECharts templates for visuals. Do NOT return a full echarts option.
- Only return data fields; visuals (colors, gradients, styles) are fixed in the client.

ALLOWED CHART TYPES (use exactly one):
- stacked-area | gradient-area | rose-pie | timeline-bar | brush-bar | large-area

WHAT TO RETURN (JSON only):
{
	"type": "...one of the allowed types...",
	"title": "Readable title",
	"explanation": "1–2 sentence insight about the data",
	"xAxis": { "data": [..labels..] } OR ["label1", "label2", ...],
	"series": [ { "name": "...", "data": [...] }, ... ],
	// Optional when relevant:
	"pieData": [ { "name": "...", "value": number }, ... ],
	"timeline": { "data": [..time keys..], "autoPlay": true/false, "playInterval": 2000 },
	"timelineOptions": [ { "title": "...", "series": [ { "data": [...] } ] }, ... ]
}

SELECTION HINTS:
- Trend over time (year/month) → gradient-area
- Simple stacked series → stacked-area
- Category shares → rose-pie
- Multi-year category dataset → timeline-bar
- Multi-series comparison/breakdown → brush-bar
- Very long timeseries (many points) → large-area

RULES:
- Keep JSON minimal: only the fields above. No markdown, no code fences, no echarts_option.
- Ensure labels and series lengths match. If data is empty, return an empty series with a brief explanation.
- Make the title and explanation aligned with the query and data.

Now generate the JSON:
```

**Configuration**:

- Model: gemini-2.5-flash
- Temperature: Not specified (default)
- Data truncation: 10,000 characters max to avoid token limits

---

## 🔥 CRITICAL ANALYSIS

### ✅ **STRENGTHS**

1. **Comprehensive Intent Classification**: The backend NLP prompt has detailed intent rules with 9 different intents
2. **Schema-Aware**: SQL generation includes full schema context
3. **Entity Extraction**: Strong focus on location extraction with validation rules
4. **Multi-Modal**: Supports vision analysis for map images
5. **Voice-Optimized**: Co-pilot mode has specialized prompts for spoken delivery

### ❌ **WEAKNESSES**

1. **Token Limitation**: maxOutputTokens: 1024 is TOO LOW for complex analysis
2. **Low Temperature**: 0.2 for SQL is good, but 0.7 for general chat may be too creative
3. **No Few-Shot Examples**: Prompts don't include example queries and responses
4. **Limited Context Window**: No conversation history in prompts
5. **Hardcoded Fallback**: Sample data fallback doesn't learn from errors
6. **No Chain-of-Thought**: Prompts don't ask AI to think step-by-step
7. **Visualization Constraint**: ECharts templates are hardcoded, limiting AI creativity
8. **No Self-Correction**: No validation loop for SQL or visualization errors

---

## 🚨 WHAT'S LACKING

### 1. **SQL QUERY QUALITY ISSUES**

**Problems**:

- ❌ No validation of generated SQL before execution
- ❌ No error feedback loop to improve queries
- ❌ No examples of complex JOIN queries in prompt
- ❌ Temperature 0.2 is good but no retry mechanism
- ❌ Schema is passed as string but not formatted well
- ❌ No handling of ambiguous queries

**Evidence**:

````go
// From llm_service.go - No validation!
sql = strings.TrimSpace(sql)
sql = strings.TrimPrefix(sql, "```sql")
return strings.TrimSpace(sql), nil  // Just returns it!
````

### 2. **GRAPH DATA QUALITY ISSUES**

**Problems**:

- ❌ Hardcoded chart templates limit AI's ability to choose best visualization
- ❌ Only 6 chart types allowed (stacked-area, gradient-area, rose-pie, timeline-bar, brush-bar, large-area)
- ❌ AI can't create custom visualizations for unique data patterns
- ❌ No dynamic color selection based on data patterns
- ❌ Data truncation to 10,000 chars may lose important context
- ❌ No validation if chart type matches data structure

**Evidence**:

```go
// From llm_service.go
if len(dataJSON) > 10000 {
    dataJSON = dataJSON[:10000]  // BRUTAL TRUNCATION!
}
```

### 3. **PROMPT ENGINEERING GAPS**

**Missing Elements**:

1. **No Few-Shot Learning**

   ```
   CURRENT: Just rules and schema
   NEEDED: 3-5 example queries with perfect responses
   ```

2. **No Chain-of-Thought**

   ```
   CURRENT: "Generate SQL"
   NEEDED: "First, identify the intent. Second, determine required tables. Third, construct WHERE clauses. Finally, generate SQL."
   ```

3. **No Self-Validation**

   ```
   CURRENT: Returns whatever AI generates
   NEEDED: "Now validate: Does this SQL match the schema? Will it return the expected data?"
   ```

4. **No Context Retention**

   ```
   CURRENT: Each query is standalone
   NEEDED: Include last 3-5 messages for context
   ```

5. **No Error Learning**
   ```
   CURRENT: If SQL fails, user tries again
   NEEDED: "The previous SQL failed with error: %s. Generate a corrected version."
   ```

### 4. **RESPONSE QUALITY ISSUES**

**Problems**:

- ❌ 1024 token limit is insufficient for detailed analysis
- ❌ No structured response format enforcement
- ❌ AI sometimes returns markdown when JSON expected
- ❌ No confidence scores on responses
- ❌ No uncertainty handling ("I'm not sure, but...")

---

## 🚀 RADICAL IMPROVEMENTS

### 🎯 **APPROACH 1: MULTI-AGENT ARCHITECTURE**

Instead of one prompt doing everything, use specialized agents:

```
┌─────────────────────────────────────────────────┐
│  USER QUERY: "Compare extraction in Punjab"    │
└────────────────┬────────────────────────────────┘
                 │
         ┌───────▼────────┐
         │  ROUTER AGENT  │ ← Intent classification
         └───────┬────────┘
                 │
     ┌───────────┴───────────┐
     │                       │
┌────▼────┐           ┌─────▼──────┐
│SQL AGENT│           │ DATA AGENT │
└────┬────┘           └─────┬──────┘
     │                      │
     │ Validates SQL        │ Validates data
     │ Retries on error     │ quality
     │                      │
     └───────────┬──────────┘
                 │
         ┌───────▼───────┐
         │  VIZ AGENT    │ ← Chooses best chart
         └───────┬───────┘
                 │
         ┌───────▼────────┐
         │ EXPLAIN AGENT  │ ← Generates insights
         └────────────────┘
```

### 🎯 **APPROACH 2: ENHANCED PROMPT TEMPLATE**

**New SQL Generation Prompt**:

```
You are a PostgreSQL expert for India's INGRES Groundwater Data System.

SCHEMA:
[Full schema here]

CONVERSATION HISTORY:
{last_3_messages}

USER QUERY: "{query}"

TASK: Generate a PostgreSQL query following this process:

STEP 1 - ANALYZE:
- What data does the user want?
- Which tables are needed?
- What filters should be applied?
- What aggregations are required?

STEP 2 - PLAN:
- Main table: [identify]
- Join tables: [list]
- WHERE conditions: [list]
- GROUP BY: [if needed]
- ORDER BY: [if needed]

STEP 3 - GENERATE SQL:
[Your SQL query]

STEP 4 - VALIDATE:
- Does this match the schema? [yes/no]
- Will this return the expected data? [yes/no]
- Are there any potential errors? [list]

STEP 5 - FINAL SQL:
[Corrected SQL query if validation found issues]

EXAMPLES:
Query: "Show me rainfall in Punjab"
SQL: SELECT state_name, AVG(rainfall) as avg_rainfall
     FROM assessments_summary a
     JOIN blocks b ON a.block_uuid = b.block_uuid
     JOIN states s ON b.state_uuid = s.state_uuid
     WHERE s.state_name ILIKE 'Punjab' AND a.year = '2024-2025'
     GROUP BY state_name;

Query: "Compare extraction between Ludhiana and Bathinda"
SQL: SELECT b.block_name, a.total_extraction, a.total_recharge
     FROM assessments_summary a
     JOIN blocks b ON a.block_uuid = b.block_uuid
     WHERE b.block_name ILIKE ANY(ARRAY['Ludhiana', 'Bathinda'])
     AND a.year = '2024-2025';

NOW GENERATE FOR USER QUERY:
```

### 🎯 **APPROACH 3: DYNAMIC VISUALIZATION SELECTION**

Instead of hardcoded templates, let AI choose:

```
You are a Data Visualization Expert.

DATA:
{sql_results}

USER INTENT: {intent}

TASK: Analyze this data and recommend the BEST visualization.

ANALYSIS PROCESS:

1. DATA STRUCTURE:
   - Number of rows: [count]
   - Number of columns: [count]
   - Data types: [list]
   - Temporal data present: [yes/no]
   - Categories present: [list]

2. VISUALIZATION RECOMMENDATION:
   - Best chart type: [bar/line/pie/scatter/heatmap/radar/etc]
   - Reasoning: [why this chart?]
   - Alternative options: [2-3 other viable charts]

3. CHART CONFIGURATION:
   {
     "type": "line",
     "title": "Groundwater Extraction Trend",
     "xAxis": ["2020", "2021", "2022", "2023", "2024"],
     "series": [
       {
         "name": "Extraction",
         "data": [100, 120, 135, 150, 165],
         "color": "#ff6b6b",
         "lineStyle": "solid",
         "showArea": true
       }
     ],
     "insights": [
       "Extraction increased 65% from 2020 to 2024",
       "Steepest increase occurred between 2022-2023",
       "Current trend suggests over-exploitation risk by 2026"
     ]
   }

4. ACTIONABLE INSIGHTS:
   - Key finding 1: [insight]
   - Key finding 2: [insight]
   - Recommendation: [action]
```

### 🎯 **APPROACH 4: SELF-CORRECTING LOOP**

```python
def execute_query_with_retry(user_query, max_retries=3):
    conversation_history = []

    for attempt in range(max_retries):
        # Generate SQL
        sql = generate_sql(user_query, conversation_history)

        # Try to execute
        try:
            results = execute_sql(sql)

            # Validate results
            if validate_results(results, user_query):
                return results
            else:
                # Results don't match intent
                conversation_history.append({
                    "sql": sql,
                    "error": "Results don't match user intent",
                    "expected": analyze_user_intent(user_query)
                })

        except SQLError as e:
            # SQL failed
            conversation_history.append({
                "sql": sql,
                "error": str(e),
                "suggestion": analyze_sql_error(e)
            })

    # After max retries, use fallback
    return fallback_response(user_query)
```

### 🎯 **APPROACH 5: KNOWLEDGE AUGMENTATION**

**Add Domain Knowledge**:

```
DOMAIN KNOWLEDGE FOR GROUNDWATER ANALYSIS:

CRITICAL THRESHOLDS:
- Stage of Extraction > 100%: Over-Exploited (RED ALERT)
- Stage 90-100%: Critical (HIGH RISK)
- Stage 70-90%: Semi-Critical (MODERATE RISK)
- Stage < 70%: Safe (LOW RISK)

RAINFALL PATTERNS:
- Punjab average: 650mm/year
- Rajasthan average: 450mm/year
- High monsoon dependency areas: [list]

TYPICAL EXTRACTION BREAKDOWN:
- Agriculture: 85-92% (dominant in rural areas)
- Domestic: 5-10%
- Industrial: 2-5%

RECHARGE SOURCES IMPORTANCE:
1. Rainfall Recharge: 60-70% of total
2. Canal Recharge: 15-25%
3. Water Conservation: 5-10%

RED FLAGS TO DETECT:
- Extraction > Recharge by 30%+
- Rainfall < 400mm with high extraction
- Rapid decline > 0.5m/year
- Industrial extraction > 10% in agricultural regions

WHEN ANALYZING DATA, ALWAYS:
1. Compare against these thresholds
2. Flag anomalies
3. Provide context
4. Suggest interventions
```

### 🎯 **APPROACH 6: INCREASE TOKEN LIMITS**

**Current**:

```typescript
maxOutputTokens: 1024; // TOO LOW!
```

**Recommended**:

```typescript
maxOutputTokens: 4096; // For detailed analysis
maxOutputTokens: 8192; // For comprehensive reports
```

### 🎯 **APPROACH 7: TEMPERATURE TUNING**

**Current**:

```
SQL Generation: 0.2 ✅ Good
General Chat: 0.7 ❌ Too creative
```

**Recommended**:

```
SQL Generation: 0.1 (need deterministic results)
Intent Classification: 0.0 (must be accurate)
Data Analysis: 0.3 (some creativity for insights)
Visualization: 0.5 (creative but structured)
General Chat: 0.4 (balanced)
```

---

## 📊 COMPARISON TABLE

| Feature                  | Current State | Ideal State        |
| ------------------------ | ------------- | ------------------ |
| **Max Tokens**           | 1024          | 4096-8192          |
| **Few-Shot Examples**    | ❌ None       | ✅ 3-5 per prompt  |
| **Chain-of-Thought**     | ❌ No         | ✅ Yes             |
| **Self-Validation**      | ❌ No         | ✅ Yes             |
| **Error Retry**          | ❌ No         | ✅ 3 attempts      |
| **Context History**      | ❌ No         | ✅ Last 5 messages |
| **SQL Validation**       | ❌ No         | ✅ Yes             |
| **Chart Types**          | 6 hardcoded   | Unlimited dynamic  |
| **Domain Knowledge**     | ❌ Limited    | ✅ Comprehensive   |
| **Temperature Settings** | Mixed         | Optimized per task |
| **Response Validation**  | ❌ No         | ✅ Yes             |
| **Confidence Scores**    | ❌ No         | ✅ Yes             |

---

## 🎯 PRIORITY FIXES (Quick Wins)

### 1. **Increase Token Limits** (5 minutes)

```typescript
// In geminiApi.ts
maxOutputTokens: 4096; // Change from 1024
```

### 2. **Add Few-Shot Examples** (30 minutes)

Add 3 examples to each prompt showing ideal query → response patterns.

### 3. **Implement Retry Logic** (1 hour)

```typescript
async function executeWithRetry(query, maxAttempts = 3) {
  let lastError;
  for (let i = 0; i < maxAttempts; i++) {
    try {
      return await execute(query);
    } catch (err) {
      lastError = err;
      query = improveQuery(query, err);
    }
  }
  throw lastError;
}
```

### 4. **Add SQL Validation** (2 hours)

Use a SQL parser library to validate syntax before execution.

### 5. **Optimize Temperatures** (10 minutes)

```typescript
SQL_GENERATION: 0.1;
INTENT_CLASSIFICATION: 0.0;
DATA_ANALYSIS: 0.3;
GENERAL_CHAT: 0.4;
```

---

## 🏆 CONCLUSION

Your chatbot has **good prompt foundations** but suffers from:

1. **Token limitations** preventing detailed analysis
2. **No self-correction** when SQL/visualizations fail
3. **Hardcoded visualizations** limiting AI creativity
4. **No few-shot examples** to guide AI behavior
5. **No conversation context** for follow-up queries
6. **No domain knowledge** embedded in prompts

**The SQL queries are decent** but could be better with validation and retry logic.
**The graph data is constrained** by hardcoded templates.

**Bottom line**: Your prompts are **70% there**, but the architecture around them (validation, retry, context) is what's really lacking. Fix the system architecture, not just the prompts.

---

**Generated**: December 6, 2025
**For**: Other AI Analysis
