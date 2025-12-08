# 📋 PREDEFINED PROMPTS & INTENTS - Complete List

## PREDEFINED BUTTONS (4 Quick Queries)

These are the 4 main buttons in the chat UI (`src/components/INGRESAssistant.tsx` lines 570-620):

### 1. **Compare Amritsar & Ludhiana**

```
Query: "Compare Amritsar and Ludhiana"
Intent: COMPARE
Handler: handleCompare() → compareDistricts()
Output: Horizontal bar chart with metrics comparison
Backend Line: chat_service.go:2237
```

### 2. **Crop Recommendations**

```
Query: "What crops should I grow in a water-scarce region?"
Intent: (Dynamic - uses LLM SQL generation)
Output: CropRecommendationCard component
Backend: Ollama SQLCoder generates SQL
Note: Falls through to dynamic SQL handler
```

### 3. **Rainfall Impact**

```
Query: "Show rainfall impact on groundwater"
Intent: (Special handling in frontend)
Output: RainfallImpactCard with breakdown chart
Handler: Special conditional check at line 1883
Triggers: RainfallImpactCard component at line 1902
```

### 4. **Policy Recommendations**

```
Query: "What policy changes can improve recharge?"
Intent: (Dynamic - uses LLM SQL generation)
Output: PolicyRechargeCard component
Backend: Ollama SQLCoder generates SQL
Note: Falls through to dynamic SQL handler
```

---

## FOLLOW-UP PROMPTS (from GroundWaterComponent.tsx)

When a visualization is displayed, users get 4 contextual follow-up buttons (lines 313-357):

### Follow-Up Button 1: Compare Locations

```
Label: "Compare with another location"
Query Template: `compare ${locations.join(", ")} and ${loc}`
Example: "compare amritsar and ludhiana"
Intent: COMPARE
```

### Follow-Up Button 2: Explain Metric

```
Label: "Why is this metric ${activeMetric}?"
Query Template: `Why is groundwater ${activeMetric} ${direction}?`
Example: "Why is groundwater extraction high?"
Intent: (Dynamic - LLM generated explanation)
```

### Follow-Up Button 3: Rainfall Impact

```
Label: "Impact of rainfall patterns"
Query: `How do rainfall patterns affect groundwater ${activeMetric} in Punjab?`
Intent: (Dynamic - LLM generated analysis)
Backend: Ollama SQLCoder
```

### Follow-Up Button 4: State Comparison

```
Label: "Compare with Rajasthan"
Query: `How does Punjab's groundwater situation compare to Rajasthan?`
Intent: COMPARE (with states)
Handler: compareStates()
```

### Follow-Up Button 5: Policy

```
Label: "Policy recommendations"
Query: `What policy changes could improve groundwater ${activeMetric} rates?`
Intent: (Dynamic - LLM generated)
Backend: Ollama SQLCoder
```

---

## PLACEHOLDER SUGGESTIONS (Auto-cycling in input field)

These appear when the input is empty (`src/components/INGRESAssistant.tsx` lines 462-480):

```
1. "Show data for Delhi block..."
2. "List all critical blocks..."
3. "Compare Amritsar and Ludhiana..."
4. "Why is groundwater declining in Delhi?"
5. "What caused water scarcity in Delhi?"
6. "Show rainfall impact on groundwater..."
7. "Explain depletion causes in Ludhiana..."
8. "Compare groundwater levels of 2020-2024..."
9. "What policy changes can improve recharge?"
10. "How do cropping patterns affect extraction?"
```

---

## BACKEND INTENTS (18+ predefined intents)

These are defined in `backend/internal/services/nlp_service.go` lines 22-46:

### Core Intents

```go
1. IntentSummary             = "SUMMARY"
2. IntentTrend               = "TREND"
3. IntentCompare             = "COMPARE"
4. IntentRechargeBreakdown   = "RECHARGE_BREAKDOWN"
5. IntentExtractionBreakdown = "EXTRACTION_BREAKDOWN"
6. IntentDischargeBreakdown  = "DISCHARGE_BREAKDOWN"
7. IntentMapCategory         = "MAP_CATEGORY"
8. IntentListBlocks          = "LIST_BLOCKS"
9. IntentListDistricts       = "LIST_DISTRICTS"
10. IntentListStates          = "LIST_STATES"
```

### Advanced Intents

```go
11. IntentTopRanking          = "TOP_RANKING"
12. IntentCategoryDistribution = "CATEGORY_DISTRIBUTION"
13. IntentDeficitAnalysis     = "DEFICIT_ANALYSIS"
14. IntentChangeAnalysis      = "CHANGE_ANALYSIS"
```

### Visualization Intents

```go
15. IntentYearlyComparison    = "YEARLY_COMPARISON"
16. IntentCategorySummary     = "CATEGORY_SUMMARY"
17. IntentCriticalAlerts      = "CRITICAL_ALERTS"
18. IntentWaterBalance        = "WATER_BALANCE"
19. IntentStateOverview       = "STATE_OVERVIEW"
20. IntentUnknown             = "UNKNOWN" (triggers Ollama SQL generation)
```

---

## BACKEND HANDLERS (Key Entry Points)

All in `backend/internal/services/chat_service.go`:

| Intent         | Handler Function        | Line | Output Type                      |
| -------------- | ----------------------- | ---- | -------------------------------- |
| TREND          | `handleTrend()`         | 2052 | TimelineChart / TrendData        |
| COMPARE        | `handleCompare()`       | 2237 | ComparisonChart / ComparisonData |
| MAP_CATEGORY   | `handleMapCategory()`   | 2826 | GeoMap / MapData                 |
| LIST_BLOCKS    | `handleListBlocks()`    | 2922 | Table / BlockList                |
| LIST_DISTRICTS | `handleListDistricts()` | 3229 | Table / DistrictList             |
| LIST_STATES    | `handleListStates()`    | 3387 | Table / StateList                |
| UNKNOWN        | (Dynamic SQL)           | ~400 | Auto-detected chart              |

---

## QUERY DETECTION RULES (Frontend)

These are hardcoded checks in `src/components/INGRESAssistant.tsx`:

### Rainfall Impact Detection (Line 1883-1890)

```typescript
if (
  query.includes("rainfall") &&
  (query.includes("impact") || query.includes("rainfall impact"))
) {
  // Show RainfallImpactCard component
}
```

### Crop Recommendations Detection (Special handler needed)

```typescript
if (query.includes("crop") || query.includes("farming")) {
  // Show CropRecommendationCard
}
```

### Policy Detection (Special handler needed)

```typescript
if (query.includes("policy") || query.includes("recharge")) {
  // Show PolicyRechargeCard
}
```

---

## COMPARISON FEATURE DETAILS

### What Can You Compare?

#### 1. **Districts** (Most Common)

```
Examples:
- "Compare Amritsar and Ludhiana"
- "Compare Delhi and Punjab"
- "Compare Punjab and Haryana"

Metrics shown:
- Rainfall (mm)
- Safe Blocks (%)
- Critical Blocks (%)
- Recharge (÷100)
```

#### 2. **States**

```
Examples:
- "Compare Punjab and Rajasthan"
- "Compare all states in India"
- "Which state has best groundwater?"

Same metrics as districts
```

#### 3. **Blocks**

```
Examples:
- "Compare Delhi and Rohtak blocks"
- "List critical blocks"
- "Show comparison of all blocks"

Additional metrics:
- Stage (%)
- Year-over-year change
```

#### 4. **Time-based**

```
Examples:
- "Show trend for Punjab"
- "Compare 2022 vs 2023 vs 2024"
- "Year-over-year comparison"

Output: Timeline chart with autoplay
```

---

## CHART TYPES RENDERED

Based on intent and data shape:

| Intent                             | Chart Type             | Component                    |
| ---------------------------------- | ---------------------- | ---------------------------- |
| COMPARE (2+ locations)             | Horizontal Bar Chart   | `ComparisonChart.tsx`        |
| TREND (1 location, multiple years) | Timeline with Autoplay | `TrendAnalysisCard.tsx`      |
| LIST_BLOCKS / LIST_DISTRICTS       | Table                  | Built-in table               |
| MAP_CATEGORY                       | Geographic Map         | `MapLibreGroundwaterMap.tsx` |
| RAINFALL                           | Custom Card            | `RainfallImpactCard.tsx`     |
| CROP                               | Custom Card            | `CropRecommendationCard.tsx` |
| POLICY                             | Custom Card            | `PolicyRechargeCard.tsx`     |

---

## DYNAMIC SQL GENERATION (For Unknown Intents)

When query doesn't match any predefined intent:

```
1. Backend receives query
2. Ollama SQLCoder local LLM generates SQL
3. SQL is validated before execution
4. Result is formatted as ChartData
5. Frontend ChartRenderer detects format and shows appropriate chart
6. Gemini API generates descriptive text (if needed)
```

**Example Unknown Query**:

```
User: "Show me blocks with declining groundwater in 2024"
→ Ollama generates SQL
→ Results in BlockList format
→ Frontend renders as table
```

---

## SPECIAL BEHAVIORS

### 1. Location History Context (Line 250 in chat_service.go)

```
If user says: "Show trend for it"
System checks: LastEntities.Locations from previous query
Replaces with: Last mentioned location (e.g., "Punjab")
```

### 2. Metric Context (GroundWaterComponent.tsx)

```
Active Metric can be:
- "extraction" (groundwater being pumped out)
- "recharge" (groundwater being replenished)
- "net" (extraction - recharge balance)

Follow-up buttons use active metric in template
```

### 3. Year Filtering

```
Current implementation:
- Defaults to latest year (2024-2025)
- User can change via year selector
- Applied to ALL queries

Data available: 2022-2023, 2023-2024, 2024-2025
```

---

## DEMO SCRIPT - Using These Prompts

### Quick Demo Flow (5 minutes)

1. **Click "Compare Amritsar & Ludhiana"**

   - Shows horizontal bar chart
   - Point out metrics: rainfall, safe blocks, critical blocks
   - Time: ~200ms

2. **Click follow-up button on result: "Compare with another location"**

   - Shows new comparison
   - Demonstrates dynamic comparison

3. **Type manually: "Show trend for Punjab"**

   - Shows timeline with autoplay
   - Point out year-over-year change
   - Time: ~300ms

4. **Click "Rainfall Impact"**

   - Shows RainfallImpactCard
   - Demonstrates specialized UI component
   - Time: ~150ms

5. **Type unknown query: "List all blocks with extraction > 100"**
   - Shows Ollama SQL generation working
   - Results in table format
   - Time: ~400ms

---

## FOR JUDGES - What to Emphasize

When presenting these prompts:

1. **Hardcoded vs Dynamic Balance**

   - Compare, Trend, List intents = hardcoded + optimized
   - Rainfall, Crop, Policy = special UI components
   - Unknown queries = flexible LLM-generated SQL

2. **No API Overhead**

   - Intent detection: Local keyword matching (no API)
   - SQL generation: Local Ollama (no cost)
   - Only Gemini for text generation

3. **Schema Awareness**

   - Backend knows exact database schema
   - Generates accurate SQL for any query
   - Shows judges the `determineIntent()` function

4. **Context Preservation**
   - System remembers last locations
   - Metrics stay consistent in follow-ups
   - Can ask "compare it with Rajasthan" and system knows which location

---

## TESTING THESE PROMPTS

Try these exact queries in order:

```
1. "Compare Amritsar and Ludhiana"
   Expected: Horizontal bar chart with 2 districts

2. Click follow-up: "Why is extraction high?" (or similar)
   Expected: AI-generated explanation

3. "Show trend for Punjab"
   Expected: Timeline chart with autoplay button

4. "List all critical blocks in Punjab"
   Expected: Table of blocks with stage > 100%

5. "Show rainfall impact on groundwater"
   Expected: RainfallImpactCard component

6. "What crops should I grow in water-scarce region?"
   Expected: CropRecommendationCard component

7. "What policy changes can improve recharge?"
   Expected: PolicyRechargeCard component

8. "How many blocks are in safe category in Punjab?"
   Expected: Ollama generates SQL → table result
```

Each should work and show different capabilities!
