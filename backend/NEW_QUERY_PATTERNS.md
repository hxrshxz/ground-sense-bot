# New Query Patterns for Chatbot

## System Architecture Overview

The chatbot uses a **dynamic visualization system** where:

1. **User asks a question** → NLP parses intent and entities
2. **AI generates SQL** → Gemini creates query based on user's question
3. **Query executes** → Data fetched from PostgreSQL
4. **AI generates visualization** → Gemini selects chart type and creates config
5. **Frontend renders** → Predefined chart components display dynamic data

**Key Insight**: The chart types/designs are predefined (gradient-area, brush-bar, rose-pie, etc.), but the data, labels, and insights are completely dynamic based on the query results.

---

## Current Supported Query Patterns

### 1. **SUMMARY** - Single Location Status

**Examples**:

- "What is the status of Punjab?"
- "Show me groundwater data for Ludhiana"
- "Tell me about Chandigarh"

**SQL Pattern**: Single location, year = 2024-2025
**Visualization**: Dynamic chart based on metrics returned

---

### 2. **TREND** - Historical Analysis

**Examples**:

- "Show me trend for Punjab over time"
- "Historical data for Haryana"

**SQL Pattern**: Multi-year data, GROUP BY year
**Visualization**: gradient-area or timeline-bar showing progression

---

### 3. **COMPARE** - Location Comparison

**Examples**:

- "Compare Punjab and Haryana"
- "Difference between Ludhiana and Bathinda"

**SQL Pattern**: Multiple locations, side-by-side metrics
**Visualization**: brush-bar with multiple series

---

### 4. **RECHARGE_BREAKDOWN** - Source Analysis

**Examples**:

- "Show me recharge breakdown for Jaisinagar"
- "Recharge sources in Punjab"

**SQL Pattern**: JOIN with assessments_recharge_breakdown
**Visualization**: rose-pie showing source distribution

---

### 5. **EXTRACTION_BREAKDOWN** - Usage Analysis

**Examples**:

- "Show extraction breakdown for Chandil"
- "What are the sources of extraction in Punjab?"

**SQL Pattern**: JOIN with assessments_extraction_breakdown
**Visualization**: rose-pie showing usage sectors

---

### 6. **LIST_BLOCKS/DISTRICTS/STATES** - Inventory Queries

**Examples**:

- "List all over-exploited blocks in Punjab"
- "Show me critical districts"

**SQL Pattern**: Filter by category, LIMIT 50
**Visualization**: horizontal-bar ranking or large-area

---

## 🚀 NEW QUERY PATTERNS TO ADD

Based on common groundwater analysis needs, here are recommended new patterns:

---

### 7. **TOP_N_RANKING** - Worst/Best Performers

**Intent**: `IntentTopRanking`

**Examples**:

- "Top 10 over-exploited blocks in India"
- "Which states have the worst groundwater situation?"
- "Show me the 5 districts with highest extraction"
- "Best performing blocks in terms of recharge"

**SQL Pattern**:

```sql
-- Top 10 over-exploited blocks
SELECT
    b.block_name,
    d.district_name,
    s.state_name,
    a.stage,
    a.total_extraction,
    a.total_recharge,
    (a.total_extraction - a.total_recharge) as deficit
FROM assessments_summary a
JOIN blocks b ON a.block_uuid = b.block_uuid
JOIN districts d ON b.district_uuid = d.district_uuid
JOIN states s ON d.state_uuid = s.state_uuid
WHERE LOWER(a.category) = 'over_exploited'
AND a.year = '2024-2025'
ORDER BY a.stage DESC
LIMIT 10;
```

**Visualization**: `horizontal-bar` with ranking, highlight top 3 in red

**Keywords**: "top", "worst", "best", "highest", "lowest", "most", "least", "ranking"

---

### 8. **CATEGORY_DISTRIBUTION** - State-wide Analysis

**Intent**: `IntentCategoryDistribution`

**Examples**:

- "Show me category distribution for Punjab"
- "How many blocks are over-exploited in Haryana?"
- "What is the breakdown of groundwater categories in India?"

**SQL Pattern**:

```sql
-- Category distribution for Punjab
SELECT
    a.category,
    COUNT(*) as block_count,
    ROUND(AVG(a.stage)::numeric, 2) as avg_stage
FROM assessments_summary a
JOIN blocks b ON a.block_uuid = b.block_uuid
JOIN districts d ON b.district_uuid = d.district_uuid
JOIN states s ON d.state_uuid = s.state_uuid
WHERE UPPER(s.state_name) = 'PUNJAB'
AND a.year = '2024-2025'
AND a.category != 'none'
GROUP BY a.category
ORDER BY block_count DESC;
```

**Visualization**: `rose-pie` showing proportions with color coding:

- Red: over_exploited
- Orange: critical
- Yellow: semi_critical
- Green: safe

**Keywords**: "distribution", "breakdown", "how many", "count", "proportion"

---

### 9. **RAINFALL_ANALYSIS** - Climate Correlation

**Intent**: `IntentRainfallAnalysis`

**Examples**:

- "Which states have the lowest rainfall?"
- "Show me rainfall vs extraction for Punjab"
- "Correlation between rainfall and groundwater stage"

**SQL Pattern**:

```sql
-- States with lowest rainfall
SELECT
    s.state_name,
    ROUND(AVG(a.rainfall)::numeric, 2) as avg_rainfall,
    ROUND(AVG(CASE WHEN a.stage > 0 THEN a.stage END)::numeric, 2) as avg_stage,
    COUNT(*) as total_blocks
FROM assessments_summary a
JOIN blocks b ON a.block_uuid = b.block_uuid
JOIN districts d ON b.district_uuid = d.district_uuid
JOIN states s ON d.state_uuid = s.state_uuid
WHERE a.year = '2024-2025'
GROUP BY s.state_name
HAVING AVG(a.rainfall) IS NOT NULL
ORDER BY avg_rainfall ASC
LIMIT 15;
```

**Visualization**: `brush-bar` with dual axis (rainfall + stage)

**Keywords**: "rainfall", "precipitation", "climate", "weather", "monsoon"

---

### 10. **DEFICIT_ANALYSIS** - Water Balance

**Intent**: `IntentDeficitAnalysis`

**Examples**:

- "Which blocks have the highest water deficit?"
- "Show me extraction vs recharge gap for Haryana"
- "Water balance analysis for Punjab"

**SQL Pattern**:

```sql
-- Blocks with highest deficit
SELECT
    b.block_name,
    d.district_name,
    s.state_name,
    a.total_extraction,
    a.total_recharge,
    (a.total_extraction - a.total_recharge) as deficit,
    a.stage,
    a.category
FROM assessments_summary a
JOIN blocks b ON a.block_uuid = b.block_uuid
JOIN districts d ON b.district_uuid = d.district_uuid
JOIN states s ON d.state_uuid = s.state_uuid
WHERE a.year = '2024-2025'
AND a.total_extraction > a.total_recharge
AND a.stage > 0
ORDER BY (a.total_extraction - a.total_recharge) DESC
LIMIT 20;
```

**Visualization**: `gradient-area` showing deficit magnitude or `brush-bar` comparing extraction vs recharge

**Keywords**: "deficit", "gap", "imbalance", "shortage", "water balance"

---

### 11. **AGRICULTURAL_IMPACT** - Sector Analysis

**Intent**: `IntentAgricultureAnalysis`

**Examples**:

- "Show me agricultural extraction in Punjab"
- "Which states have highest agricultural water use?"
- "Agriculture vs domestic extraction comparison"

**SQL Pattern**:

```sql
-- Agricultural extraction by state
SELECT
    s.state_name,
    SUM(eb.total) as total_agricultural_extraction,
    ROUND(AVG(a.stage)::numeric, 2) as avg_stage,
    COUNT(DISTINCT b.block_uuid) as total_blocks
FROM assessments_summary a
JOIN blocks b ON a.block_uuid = b.block_uuid
JOIN districts d ON b.district_uuid = d.district_uuid
JOIN states s ON d.state_uuid = s.state_uuid
JOIN assessments_extraction_breakdown eb ON a.assessment_id = eb.assessment_id
WHERE a.year = '2024-2025'
AND eb.source = 'agriculture'
GROUP BY s.state_name
ORDER BY total_agricultural_extraction DESC
LIMIT 15;
```

**Visualization**: `brush-bar` showing agricultural extraction vs stage

**Keywords**: "agriculture", "farming", "irrigation", "crop", "agricultural sector"

---

### 12. **AVAILABILITY_CHECK** - Resource Availability

**Intent**: `IntentAvailabilityCheck`

**Examples**:

- "Which blocks have the highest water availability?"
- "Show me available groundwater in Rajasthan"
- "Blocks with low availability"

**SQL Pattern**:

```sql
-- Blocks with highest availability
SELECT
    b.block_name,
    d.district_name,
    s.state_name,
    a.availability,
    a.total_recharge,
    a.total_extraction,
    a.category,
    a.stage
FROM assessments_summary a
JOIN blocks b ON a.block_uuid = b.block_uuid
JOIN districts d ON b.district_uuid = d.district_uuid
JOIN states s ON d.state_uuid = s.state_uuid
WHERE a.year = '2024-2025'
AND a.availability > 0
ORDER BY a.availability DESC
LIMIT 20;
```

**Visualization**: `horizontal-bar` ranking by availability

**Keywords**: "availability", "available", "remaining", "surplus", "reserve"

---

### 13. **MULTI_YEAR_CHANGE** - Change Analysis

**Intent**: `IntentChangeAnalysis`

**Examples**:

- "How has Punjab's groundwater changed over 4 years?"
- "Show me stage change for Haryana from 2021 to 2025"
- "Year-over-year improvement or decline in Bihar"

**SQL Pattern**:

```sql
-- Punjab 4-year change analysis
WITH yearly_data AS (
    SELECT
        a.year,
        ROUND(AVG(CASE WHEN a.stage > 0 THEN a.stage END)::numeric, 2) as avg_stage,
        ROUND(AVG(a.rainfall)::numeric, 2) as avg_rainfall,
        ROUND(AVG(a.total_extraction)::numeric, 2) as avg_extraction,
        ROUND(AVG(a.total_recharge)::numeric, 2) as avg_recharge
    FROM assessments_summary a
    JOIN blocks b ON a.block_uuid = b.block_uuid
    JOIN districts d ON b.district_uuid = d.district_uuid
    JOIN states s ON d.state_uuid = s.state_uuid
    WHERE UPPER(s.state_name) = 'PUNJAB'
    GROUP BY a.year
)
SELECT
    year,
    avg_stage,
    avg_rainfall,
    avg_extraction,
    avg_recharge,
    (avg_stage - LAG(avg_stage) OVER (ORDER BY year)) as stage_change
FROM yearly_data
ORDER BY year;
```

**Visualization**: `timeline-bar` with animated year progression or `gradient-area` showing change

**Keywords**: "change", "improved", "worsened", "decline", "growth", "over years", "year-over-year"

---

### 14. **CROSS_STATE_COMPARISON** - Regional Analysis

**Intent**: `IntentRegionalComparison`

**Examples**:

- "Compare all northern states"
- "Show me groundwater status across all states"
- "Which states are doing better than Punjab?"

**SQL Pattern**:

```sql
-- All states comparison
SELECT
    s.state_name,
    COUNT(*) as total_blocks,
    ROUND(AVG(CASE WHEN a.stage > 0 THEN a.stage END)::numeric, 2) as avg_stage,
    ROUND(AVG(a.rainfall)::numeric, 2) as avg_rainfall,
    COUNT(CASE WHEN LOWER(a.category) = 'over_exploited' THEN 1 END) as over_exploited_count,
    COUNT(CASE WHEN LOWER(a.category) = 'safe' THEN 1 END) as safe_count
FROM assessments_summary a
JOIN blocks b ON a.block_uuid = b.block_uuid
JOIN districts d ON b.district_uuid = d.district_uuid
JOIN states s ON d.state_uuid = s.state_uuid
WHERE a.year = '2024-2025'
GROUP BY s.state_name
HAVING COUNT(*) >= 10
ORDER BY avg_stage DESC;
```

**Visualization**: `large-area` for 26 states or `brush-bar` for comparison

**Keywords**: "all states", "across India", "nationwide", "regional", "states comparison"

---

### 15. **THRESHOLD_ALERTS** - Critical Zones

**Intent**: `IntentThresholdAlert`

**Examples**:

- "Show me blocks with stage above 150%"
- "Which areas have extraction more than 500 MCM?"
- "Blocks with less than 300mm rainfall"

**SQL Pattern**:

```sql
-- Blocks with stage > 150%
SELECT
    b.block_name,
    d.district_name,
    s.state_name,
    a.stage,
    a.total_extraction,
    a.total_recharge,
    a.rainfall,
    a.category
FROM assessments_summary a
JOIN blocks b ON a.block_uuid = b.block_uuid
JOIN districts d ON b.district_uuid = d.district_uuid
JOIN states s ON d.state_uuid = s.state_uuid
WHERE a.year = '2024-2025'
AND a.stage > 150
ORDER BY a.stage DESC;
```

**Visualization**: `horizontal-bar` with alert colors (red for critical)

**Keywords**: "above", "below", "more than", "less than", "exceeds", "threshold"

---

### 16. **SALINITY_ANALYSIS** - Special Cases

**Intent**: `IntentSalinityAnalysis`

**Examples**:

- "Show me salinity-affected blocks"
- "Which coastal areas have salinity issues?"
- "Salinity problems in West Bengal"

**SQL Pattern**:

```sql
-- Salinity-affected blocks
SELECT
    b.block_name,
    d.district_name,
    s.state_name,
    a.category,
    a.stage,
    a.total_extraction,
    a.total_recharge
FROM assessments_summary a
JOIN blocks b ON a.block_uuid = b.block_uuid
JOIN districts d ON b.district_uuid = d.district_uuid
JOIN states s ON d.state_uuid = s.state_uuid
WHERE a.year = '2024-2025'
AND LOWER(a.category) = 'salinity'
ORDER BY s.state_name, d.district_name;
```

**Visualization**: `rose-pie` showing state-wise salinity distribution

**Keywords**: "salinity", "saline", "salt", "coastal", "sea water intrusion"

---

### 17. **RECHARGE_EFFICIENCY** - Conservation Assessment

**Intent**: `IntentRechargeEfficiency`

**Examples**:

- "Which blocks have the best recharge efficiency?"
- "Show me canal recharge contribution in Punjab"
- "Compare natural vs artificial recharge"

**SQL Pattern**:

```sql
-- Recharge sources comparison
SELECT
    s.state_name,
    SUM(CASE WHEN rb.source = 'rainfall' THEN rb.total ELSE 0 END) as rainfall_recharge,
    SUM(CASE WHEN rb.source = 'canal' THEN rb.total ELSE 0 END) as canal_recharge,
    SUM(CASE WHEN rb.source = 'artificial_structure' THEN rb.total ELSE 0 END) as artificial_recharge,
    SUM(rb.total) as total_recharge
FROM assessments_summary a
JOIN blocks b ON a.block_uuid = b.block_uuid
JOIN districts d ON b.district_uuid = d.district_uuid
JOIN states s ON d.state_uuid = s.state_uuid
JOIN assessments_recharge_breakdown rb ON a.assessment_id = rb.assessment_id
WHERE a.year = '2024-2025'
AND rb.source != 'Total'
GROUP BY s.state_name
HAVING SUM(rb.total) > 0
ORDER BY total_recharge DESC;
```

**Visualization**: `stacked-area` showing recharge source proportions

**Keywords**: "recharge efficiency", "conservation", "artificial recharge", "canal contribution"

---

### 18. **SEASONAL_PATTERN** - Monsoon Dependency

**Intent**: `IntentSeasonalPattern`

**Examples**:

- "Show me monsoon dependency for Maharashtra"
- "Which states are most dependent on rainfall?"
- "Rainfall recharge percentage analysis"

**SQL Pattern**:

```sql
-- Rainfall dependency by state
SELECT
    s.state_name,
    ROUND(AVG(a.rainfall)::numeric, 2) as avg_rainfall,
    SUM(CASE WHEN rb.source = 'rainfall' THEN rb.total ELSE 0 END) as rainfall_recharge,
    SUM(rb.total) as total_recharge,
    ROUND((SUM(CASE WHEN rb.source = 'rainfall' THEN rb.total ELSE 0 END) / NULLIF(SUM(rb.total), 0) * 100)::numeric, 2) as rainfall_dependency_pct
FROM assessments_summary a
JOIN blocks b ON a.block_uuid = b.block_uuid
JOIN districts d ON b.district_uuid = d.district_uuid
JOIN states s ON d.state_uuid = s.state_uuid
JOIN assessments_recharge_breakdown rb ON a.assessment_id = rb.assessment_id
WHERE a.year = '2024-2025'
AND rb.source != 'Total'
GROUP BY s.state_name
HAVING SUM(rb.total) > 0
ORDER BY rainfall_dependency_pct DESC;
```

**Visualization**: `brush-bar` showing dependency percentages

**Keywords**: "monsoon", "seasonal", "rainfall dependency", "rainy season"

---

## Implementation Steps

### Step 1: Add New Intent Constants

In `nlp_service.go`:

```go
const (
    // ... existing intents ...
    IntentTopRanking          Intent = "TOP_RANKING"
    IntentCategoryDistribution Intent = "CATEGORY_DISTRIBUTION"
    IntentRainfallAnalysis    Intent = "RAINFALL_ANALYSIS"
    IntentDeficitAnalysis     Intent = "DEFICIT_ANALYSIS"
    IntentAgricultureAnalysis Intent = "AGRICULTURE_ANALYSIS"
    IntentAvailabilityCheck   Intent = "AVAILABILITY_CHECK"
    IntentChangeAnalysis      Intent = "CHANGE_ANALYSIS"
    IntentRegionalComparison  Intent = "REGIONAL_COMPARISON"
    IntentThresholdAlert      Intent = "THRESHOLD_ALERT"
    IntentSalinityAnalysis    Intent = "SALINITY_ANALYSIS"
    IntentRechargeEfficiency  Intent = "RECHARGE_EFFICIENCY"
    IntentSeasonalPattern     Intent = "SEASONAL_PATTERN"
)
```

### Step 2: Update Intent Classification Prompts

Add examples for new intents in `analyzeQueryWithAI()` function to help AI recognize these patterns.

### Step 3: Add SQL Examples

Add SQL query examples in `generateDynamicSQL()` for each new pattern so the AI can learn from them.

### Step 4: Test Each Pattern

For each new query type:

1. Test with sample user questions
2. Verify SQL generation
3. Check visualization output
4. Adjust prompts if needed

---

## Benefits of This Approach

✅ **No Frontend Changes Needed**: Existing chart components handle all visualizations
✅ **AI-Powered**: Gemini automatically selects the best chart type for the data
✅ **Scalable**: Add new query patterns just by adding SQL examples
✅ **Flexible**: Users can ask questions naturally, AI figures out the intent
✅ **Consistent**: Same visualization system for all query types

---

## Example User Interactions

**User**: "Show me the top 10 worst blocks in India"

- Intent: `TOP_RANKING`
- SQL: Filter over_exploited, ORDER BY stage DESC, LIMIT 10
- Viz: `horizontal-bar` with red highlighting

**User**: "How has Punjab changed over the last 4 years?"

- Intent: `CHANGE_ANALYSIS`
- SQL: Multi-year data, LAG() for change calculation
- Viz: `timeline-bar` with year-by-year progression

**User**: "Which states depend most on monsoon?"

- Intent: `SEASONAL_PATTERN`
- SQL: Calculate rainfall_recharge / total_recharge percentage
- Viz: `brush-bar` showing dependency percentages

---

## Quick Win: Priority Patterns to Add First

1. **TOP_N_RANKING** - Most requested, easy to implement
2. **CATEGORY_DISTRIBUTION** - Great for executive summaries
3. **DEFICIT_ANALYSIS** - Critical for policy decisions
4. **MULTI_YEAR_CHANGE** - Leverage existing multi-year data

Start with these 4, then expand based on user feedback!
