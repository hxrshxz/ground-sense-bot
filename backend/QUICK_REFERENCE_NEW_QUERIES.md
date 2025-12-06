# Quick Reference: New Query Patterns

## ✅ Successfully Added 4 New Query Types

### 1. **TOP_RANKING** - Best/Worst Performers

**Try these queries**:

- "Top 10 over-exploited blocks in India"
- "Show me the worst 5 states for groundwater"
- "Which districts have the highest extraction?"
- "Best performing blocks in Punjab"
- "Lowest rainfall blocks"

**What it does**: Ranks locations by a metric and shows top N results

**Visualization**: `horizontal-bar` with color-coded rankings

---

### 2. **CATEGORY_DISTRIBUTION** - Status Breakdown

**Try these queries**:

- "Show me category distribution for Punjab"
- "How many blocks are over-exploited in Haryana?"
- "What is the breakdown of groundwater categories in India?"
- "Distribution of safe vs critical blocks"
- "Category analysis for northern states"

**What it does**: Shows count and percentage of blocks by category (safe, critical, over-exploited, etc.)

**Visualization**: `rose-pie` with color coding:

- 🟢 Green: safe
- 🟡 Yellow: semi_critical
- 🟠 Orange: critical
- 🔴 Red: over_exploited

---

### 3. **DEFICIT_ANALYSIS** - Water Balance

**Try these queries**:

- "Which blocks have the highest water deficit?"
- "Show me extraction vs recharge gap for Haryana"
- "Water balance analysis for Punjab"
- "Blocks with deficit more than 100 MCM"
- "Where is extraction exceeding recharge?"

**What it does**: Calculates deficit (extraction - recharge) and shows imbalances

**Visualization**: `brush-bar` comparing extraction vs recharge, or `gradient-area` showing deficit magnitude

---

### 4. **CHANGE_ANALYSIS** - Multi-Year Trends

**Try these queries**:

- "How has Punjab changed over 4 years?"
- "Show me stage change for Haryana from 2021 to 2025"
- "Year-over-year improvement in Bihar"
- "Has the situation worsened over time?"
- "Change in rainfall patterns for Maharashtra"

**What it does**: Shows year-over-year changes with delta calculations

**Visualization**: `timeline-bar` with animated progression or `gradient-area` with trend lines

---

## How It Works

### Architecture

```
User Question
    ↓
AI Intent Detection (Gemini)
    ↓
[New Intents Added Here!]
    ↓
AI SQL Generation (with 20 examples)
    ↓
PostgreSQL Execution
    ↓
AI Visualization Selection
    ↓
Dynamic Chart Rendering
```

### Files Modified

1. **`nlp_service.go`** (Lines 25-40):

   - Added 4 new Intent constants
   - `IntentTopRanking`
   - `IntentCategoryDistribution`
   - `IntentDeficitAnalysis`
   - `IntentChangeAnalysis`

2. **`nlp_service.go`** (Lines 956-990):

   - Updated `mapIntent()` to recognize new intents
   - Updated `determineIntent()` with keyword detection

3. **`nlp_service.go`** (Lines 724-800):

   - Added intent classification rules with examples
   - Updated AI prompt to recognize new query types

4. **`nlp_service.go`** (Lines 592-690):
   - Added 4 SQL query examples (EXAMPLE 17-20)
   - Each example shows the exact SQL pattern for AI to learn from

---

## Testing Guide

### Test 1: TOP_RANKING

```
Query: "Top 10 over-exploited blocks in India"

Expected SQL Pattern:
- SELECT with ORDER BY stage DESC
- WHERE category = 'over_exploited'
- LIMIT 10

Expected Visualization:
- Type: horizontal-bar
- Red highlighting for top 3
- Shows block names with stage percentages
```

### Test 2: CATEGORY_DISTRIBUTION

```
Query: "Show me category distribution for Punjab"

Expected SQL Pattern:
- GROUP BY a.category
- COUNT(*) as block_count
- Percentage calculation
- WHERE state_name = 'PUNJAB'

Expected Visualization:
- Type: rose-pie
- Color coded by category
- Shows percentages
```

### Test 3: DEFICIT_ANALYSIS

```
Query: "Which blocks have the highest water deficit?"

Expected SQL Pattern:
- Calculate (extraction - recharge) as deficit
- WHERE extraction > recharge
- ORDER BY deficit DESC
- LIMIT 20

Expected Visualization:
- Type: brush-bar or gradient-area
- Comparison of extraction vs recharge
- Red for high deficit
```

### Test 4: CHANGE_ANALYSIS

```
Query: "How has Punjab changed over 4 years?"

Expected SQL Pattern:
- CTE with yearly aggregates
- LAG() function for change calculation
- GROUP BY year
- No year filter in WHERE clause

Expected Visualization:
- Type: timeline-bar or gradient-area
- Year-by-year progression
- Delta indicators
```

---

## Database Queries to Verify

### Check if queries work:

```bash
# TOP_RANKING test
PGPASSWORD=admin psql -h localhost -p 5433 -U admin -d ground_sense_bot -c \
"SELECT b.block_name, s.state_name, a.stage
FROM assessments_summary a
JOIN blocks b ON a.block_uuid = b.block_uuid
JOIN districts d ON b.district_uuid = d.district_uuid
JOIN states s ON d.state_uuid = s.state_uuid
WHERE LOWER(a.category) = 'over_exploited'
AND a.year = '2024-2025'
ORDER BY a.stage DESC LIMIT 10;"

# CATEGORY_DISTRIBUTION test
PGPASSWORD=admin psql -h localhost -p 5433 -U admin -d ground_sense_bot -c \
"SELECT a.category, COUNT(*) as block_count
FROM assessments_summary a
JOIN blocks b ON a.block_uuid = b.block_uuid
JOIN districts d ON b.district_uuid = d.district_uuid
JOIN states s ON d.state_uuid = s.state_uuid
WHERE UPPER(s.state_name) = 'PUNJAB'
AND a.year = '2024-2025'
GROUP BY a.category ORDER BY block_count DESC;"

# DEFICIT_ANALYSIS test
PGPASSWORD=admin psql -h localhost -p 5433 -U admin -d ground_sense_bot -c \
"SELECT b.block_name, s.state_name,
(a.total_extraction - a.total_recharge) as deficit
FROM assessments_summary a
JOIN blocks b ON a.block_uuid = b.block_uuid
JOIN districts d ON b.district_uuid = d.district_uuid
JOIN states s ON d.state_uuid = s.state_uuid
WHERE a.year = '2024-2025'
AND a.total_extraction > a.total_recharge
ORDER BY deficit DESC LIMIT 10;"

# CHANGE_ANALYSIS test (Punjab 4-year data)
PGPASSWORD=admin psql -h localhost -p 5433 -U admin -d ground_sense_bot -c \
"SELECT a.year, ROUND(AVG(CASE WHEN a.stage > 0 THEN a.stage END)::numeric, 2) as avg_stage
FROM assessments_summary a
JOIN blocks b ON a.block_uuid = b.block_uuid
JOIN districts d ON b.district_uuid = d.district_uuid
JOIN states s ON d.state_uuid = s.state_uuid
WHERE UPPER(s.state_name) = 'PUNJAB'
GROUP BY a.year ORDER BY a.year;"
```

---

## Expected Behavior

### Before Enhancement

❌ User asks "Top 10 worst blocks" → Generic response or error
❌ User asks "Category distribution" → Falls back to LIST_BLOCKS
❌ User asks "Water deficit analysis" → Unclear intent
❌ User asks "How has it changed?" → Only shows current year data

### After Enhancement

✅ User asks "Top 10 worst blocks" → Ranked list with visualizations
✅ User asks "Category distribution" → Pie chart with percentages
✅ User asks "Water deficit analysis" → Deficit calculation with comparisons
✅ User asks "How has it changed?" → Multi-year trend with deltas

---

## Keywords That Trigger New Intents

### TOP_RANKING

`top`, `worst`, `best`, `ranking`, `highest`, `lowest`, `most`, `least`

### CATEGORY_DISTRIBUTION

`distribution`, `how many`, `breakdown`, `count`, `proportion`

### DEFICIT_ANALYSIS

`deficit`, `gap`, `imbalance`, `shortage`, `water balance`, `vs` (with extraction/recharge)

### CHANGE_ANALYSIS

`change`, `improved`, `worsened`, `decline`, `growth`, `over years`, `year-over-year`

---

## Next Steps (Optional Enhancements)

1. **Add More Patterns**: Implement remaining 14 patterns from NEW_QUERY_PATTERNS.md
2. **Custom Thresholds**: "Show blocks with stage > 150%"
3. **Regional Analysis**: "Compare all northern states"
4. **Rainfall Correlation**: "Rainfall vs extraction analysis"
5. **Agricultural Impact**: "Agricultural extraction by state"

---

## Summary

✅ **4 new query patterns successfully added**
✅ **Code compiles without errors**
✅ **AI prompt engineering updated with examples**
✅ **Intent detection enhanced with keyword matching**
✅ **No frontend changes required** (uses existing chart components)
✅ **Fully dynamic** (SQL and visualizations generated by AI)

The system now supports **14 query types** total:

- Original 10 + New 4 = 14 query patterns

Users can now ask more sophisticated analytical questions and get intelligent responses with appropriate visualizations!
