# Prompt Engineering Updates - Multi-Year Data Support

## Overview

Updated AI prompt engineering to reflect **7 years of groundwater assessment data** (2012-2025) instead of single-year assumption. This enables accurate SQL generation for both single-location queries and multi-year trend analysis.

---

## Database Data Availability

### Years with Data (7 Assessment Periods)

| Year      | Blocks | States | Coverage Quality |
| --------- | ------ | ------ | ---------------- |
| 2012-2013 | 160    | 1      | Minimal (pilot)  |
| 2016-2017 | 2,738  | 9      | Limited          |
| 2019-2020 | 2,811  | 11     | Moderate         |
| 2021-2022 | 4,824  | 16     | Good             |
| 2022-2023 | 2,619  | 13     | Moderate         |
| 2023-2024 | 5,734  | 25     | Excellent        |
| 2024-2025 | 5,796  | 26     | Most Complete    |

### States with Best Multi-Year Coverage

- **6 Years**: West Bengal, Chhattisgarh, Kerala, Madhya Pradesh, Mizoram, Tripura, Uttar Pradesh, Bihar
- **5 Years**: Haryana, Jharkhand, Odisha, Rajasthan, Telangana
- **4 Years**: Punjab (2021-2025 with consistent 153 blocks)

### Recommended Trend Analysis Period

**2021-2025 (4 years)** provides the best balance of:

- Good state coverage (16+ states)
- Consistent data quality
- Recent and relevant trends

---

## Files Updated

### 1. `/backend/internal/services/llm_service.go`

**Purpose**: Direct LLM/Gemini API integration for SQL generation

#### Changes Made:

**A. DOMAIN_KNOWLEDGE Constant (Lines ~33-80)**

```go
// BEFORE:
INDIA STATISTICS (2024-2025):
- Total Blocks: 5,796
- Over-Exploited: ~1,000 blocks (17%)
...

// AFTER:
DATA AVAILABILITY:
- 7 YEARS OF ASSESSMENTS: 2012-2013 (160 blocks), 2016-2017 (2,738), ...
- BEST COVERAGE: 2024-2025 (26 states, most complete), 2023-2024 (25 states), ...
- TREND ANALYSIS: Use 2021-2025 period for best multi-year trends (4 years with good coverage)

INDIA STATISTICS (2024-2025 - Most Recent):
- Total Blocks: 5,796
...
```

**B. GenerateSQL() Function - STEP 3 CRITICAL RULES (Lines ~160-220)**

```go
// BEFORE:
✓ ALWAYS use year = '2024-2025' (only year with block data!)

// AFTER:
✓ YEAR FILTERING:
  - Single block/state query: Use year = '2024-2025' (most complete data)
  - Trend/comparison query: NO year filter OR use a.year >= '2021-2022' for 4-year trends
  - Check query intent: "over time", "trend", "compare years" = multi-year
```

### 2. `/backend/internal/services/nlp_service.go`

**Purpose**: Natural language processing and dynamic SQL generation with AI

#### Changes Made:

**A. generateDynamicSQL() - Schema Header (Lines ~70-150)**

```go
// BEFORE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DATABASE SCHEMA FOR INGRES GROUNDWATER SYSTEM (PostgreSQL 15)
ONLY YEAR: 2024-2025 | Total Blocks: 5,796
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// AFTER:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DATABASE SCHEMA FOR INGRES GROUNDWATER SYSTEM (PostgreSQL 15)
YEARS AVAILABLE: 2012-2025 (7 assessment periods)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DATA AVAILABILITY BY YEAR:
┌─────────────┬────────┬────────┬──────────────────┐
│    Year     │ Blocks │ States │  Coverage Level  │
├─────────────┼────────┼────────┼──────────────────┤
│ 2012-2013   │    160 │      1 │ Minimal (pilot)  │
│ 2016-2017   │  2,738 │      9 │ Limited          │
│ 2019-2020   │  2,811 │     11 │ Moderate         │
│ 2021-2022   │  4,824 │     16 │ Good             │
│ 2022-2023   │  2,619 │     13 │ Moderate         │
│ 2023-2024   │  5,734 │     25 │ Excellent        │
│ 2024-2025   │  5,796 │     26 │ Most Complete    │
└─────────────┴────────┴────────┴──────────────────┘
```

**B. SQL Examples Updated**

```sql
-- EXAMPLE 2 (TREND) - BEFORE:
-- NOTE: Only 2024-2025 data exists! This will return single year
SELECT a.year, ...
WHERE UPPER(s.state_name) = UPPER('Punjab')
AND a.year = '2024-2025'

-- EXAMPLE 2 (TREND) - AFTER:
-- Multi-year data available! This will show actual trends over time.
-- REMOVED: AND a.year = '2024-2025'
SELECT a.year, ...
WHERE UPPER(s.state_name) = UPPER('Punjab')
GROUP BY a.year
ORDER BY a.year;
```

**C. Year Filtering Logic**

```go
// BEFORE:
// Single block query
if isSingleBlockQuery(entities) {
    yearFilter = "AND a.year = '2024-2025'"
}

// AFTER:
// Single block query - most recent complete data
if isSingleBlockQuery(entities) {
    yearFilter = "AND a.year = '2024-2025'"
}
// Trend query - no year filter, show all years
// OR add: AND a.year >= '2021-2022' for 4-year trends
```

**D. analyzeQueryWithAI() - Schema Context (Lines ~662-750)**

```go
// BEFORE:
TOTAL BLOCKS: 5,796 | ONLY AVAILABLE YEAR: 2024-2025
...
4. TREND
   → NOTE: Only 2024-2025 data exists, trends will show single year

// AFTER:
BLOCKS IN 2024-2025: 5,796 | DATA AVAILABILITY: 7 years (2012-2025)
...
4. TREND
   → NOTE: 7 years of data available! Best coverage: 2021-2025 (4 years)
```

**E. extractEntities() - Category Values (Lines ~800-900)**

```go
// Fixed category extraction to return database-compatible values
// BEFORE: "Over-Exploited" → AFTER: "over_exploited"
// BEFORE: "Semi-Critical" → AFTER: "semi_critical"
```

---

## Query Behavior Changes

### Before Updates

❌ **Single Year Assumption**

```sql
-- Even for trend queries, only returned 2024-2025
SELECT a.year, AVG(a.stage)
FROM assessments_summary a
WHERE a.year = '2024-2025'  -- Always filtered!
GROUP BY a.year;
-- Result: Only 1 row
```

### After Updates

✅ **Multi-Year Capability**

```sql
-- Trend queries now return all available years
SELECT a.year, AVG(a.stage)
FROM assessments_summary a
-- NO year filter for trends!
GROUP BY a.year
ORDER BY a.year;
-- Result: Up to 7 rows (depends on location)
```

---

## Testing Recommendations

### 1. Test Single Location Query

**Query**: "What is the status of Punjab?"
**Expected**:

- Should use `year = '2024-2025'` (most complete)
- Returns: 153 blocks, avg stage ~179%

**SQL Generated**:

```sql
SELECT s.state_name, COUNT(*) as total_blocks,
       ROUND(AVG(CASE WHEN a.stage > 0 THEN a.stage END)::numeric, 2) as avg_stage
FROM assessments_summary a
JOIN blocks b ON a.block_uuid = b.block_uuid
JOIN districts d ON b.district_uuid = d.district_uuid
JOIN states s ON d.state_uuid = s.state_uuid
WHERE UPPER(s.state_name) = 'PUNJAB'
AND a.year = '2024-2025'
GROUP BY s.state_name;
```

### 2. Test Trend Query

**Query**: "Show me trend for Punjab over time"
**Expected**:

- Should NOT filter by year OR use `year >= '2021-2022'`
- Returns: 4 rows (2021-2025)
- Shows stage declining: 182.60% → 183.66% → 179.79% → 179.15%

**SQL Generated**:

```sql
SELECT a.year,
       ROUND(AVG(CASE WHEN a.stage > 0 THEN a.stage END)::numeric, 2) as avg_stage,
       ROUND(AVG(a.rainfall)::numeric, 2) as avg_rainfall
FROM assessments_summary a
JOIN blocks b ON a.block_uuid = b.block_uuid
JOIN districts d ON b.district_uuid = d.district_uuid
JOIN states s ON d.state_uuid = s.state_uuid
WHERE UPPER(s.state_name) = 'PUNJAB'
GROUP BY a.year
ORDER BY a.year;
```

### 3. Test Multi-Year State Query

**Query**: "Show me states with data for all years"
**Expected**:

- Returns: West Bengal, Chhattisgarh, Kerala, Madhya Pradesh, Bihar, etc.
- 6 years of data each

**SQL Generated**:

```sql
SELECT s.state_name, COUNT(DISTINCT a.year) as years_available
FROM assessments_summary a
JOIN blocks b ON a.block_uuid = b.block_uuid
JOIN districts d ON b.district_uuid = d.district_uuid
JOIN states s ON d.state_uuid = s.state_uuid
GROUP BY s.state_name
HAVING COUNT(DISTINCT a.year) >= 5
ORDER BY years_available DESC;
```

### 4. Test Category Values

**Query**: "Show me over-exploited blocks in Haryana"
**Expected**:

- Should use `LOWER(a.category) = 'over_exploited'` (not 'Over-Exploited')
- Returns: Multiple blocks with year 2024-2025

### 5. Test Comparison Query

**Query**: "Compare Punjab and Haryana groundwater trends"
**Expected**:

- Multi-year data for both states
- Grouped by state and year
- Shows comparative trends

---

## Verification Commands

### Check Data Availability

```bash
PGPASSWORD=admin psql -h localhost -p 5433 -U admin -d ground_sense_bot -c \
"SELECT year, COUNT(*) as blocks, COUNT(DISTINCT b.state_uuid) as states
FROM assessments_summary a
JOIN blocks b ON a.block_uuid = b.block_uuid
GROUP BY year ORDER BY year;"
```

### Test Punjab 4-Year Trend

```bash
PGPASSWORD=admin psql -h localhost -p 5433 -U admin -d ground_sense_bot -c \
"SELECT s.state_name, a.year, COUNT(*) as blocks,
ROUND(AVG(CASE WHEN a.stage > 0 THEN a.stage END)::numeric, 2) as avg_stage
FROM assessments_summary a
JOIN blocks b ON a.block_uuid = b.block_uuid
JOIN districts d ON b.district_uuid = d.district_uuid
JOIN states s ON d.state_uuid = s.state_uuid
WHERE UPPER(s.state_name) = 'PUNJAB'
GROUP BY s.state_name, a.year
ORDER BY a.year;"
```

### States with Best Coverage

```bash
PGPASSWORD=admin psql -h localhost -p 5433 -U admin -d ground_sense_bot -c \
"SELECT s.state_name, COUNT(DISTINCT a.year) as years
FROM assessments_summary a
JOIN blocks b ON a.block_uuid = b.block_uuid
JOIN districts d ON b.district_uuid = d.district_uuid
JOIN states s ON d.state_uuid = s.state_uuid
GROUP BY s.state_name
HAVING COUNT(DISTINCT a.year) >= 4
ORDER BY years DESC, s.state_name;"
```

---

## Key Improvements

### 1. Accurate Data Representation

- ✅ AI now knows about all 7 years of data
- ✅ Understands data quality varies by year
- ✅ Can make intelligent decisions about which years to query

### 2. Proper Query Intent Detection

- ✅ Single location → Use 2024-2025 (most complete)
- ✅ Trend analysis → Use all years or 2021-2025
- ✅ Comparison → Multi-year when appropriate

### 3. Fixed Category Value Mismatches

- ✅ 'over_exploited' not 'Over-Exploited'
- ✅ 'semi_critical' not 'Semi-Critical'
- ✅ Consistent lowercase with underscores

### 4. Enhanced SQL Examples

- ✅ Updated 16+ SQL examples with correct year logic
- ✅ Added data availability tables in prompts
- ✅ Removed misleading single-year notes

---

## Impact Assessment

### Before Updates - Problems

❌ Trend queries only showed single year (2024-2025)
❌ AI generated SQL with wrong year filters
❌ Misleading "only 2024-2025 exists" messages in prompts
❌ Category value mismatches caused query failures
❌ Users couldn't analyze historical trends

### After Updates - Benefits

✅ Trend queries show up to 7 years of data
✅ AI generates correct SQL for single vs trend queries
✅ Accurate data availability information
✅ Category values match database exactly
✅ Users can analyze 4-6 year trends for most states

---

## Next Steps (Optional Enhancements)

1. **Add Data Quality Warnings**

   - Alert users when querying years with limited coverage
   - Example: "2012-2013 only has 160 blocks from 1 state"

2. **Smart Year Selection**

   - For specific states, automatically use their best coverage period
   - Example: Punjab → Use 2021-2025 (4 consistent years)

3. **Trend Visualization Improvements**

   - Update frontend charts to handle multi-year data
   - Add year range selector in UI

4. **Query Optimization**
   - Add indexes on `assessments_summary(year, state_uuid)`
   - Consider materialized views for common trend queries

---

## Summary

The prompt engineering updates enable the AI to:

1. **Understand** the actual database contains 7 years of data
2. **Distinguish** between single-location and trend queries
3. **Generate** correct SQL with appropriate year filters
4. **Provide** accurate multi-year trend analysis for states with good coverage

All changes are backwards compatible - single location queries still work as before, but trend queries now return comprehensive multi-year data.

---

**Updated**: $(date)
**Files Modified**: 2 (llm_service.go, nlp_service.go)
**Lines Changed**: ~50
**Testing Status**: ✅ Compilation successful, manual SQL tests verified
