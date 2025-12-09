# Test Queries for Multi-Year Data Support

## Test Cases for AI SQL Generation

### 1. Single Location Query (Should use 2024-2025)

**User Query**: "What is the status of Punjab?"

**Expected Behavior**:

- Intent: SUMMARY
- Year Filter: `AND a.year = '2024-2025'`
- Returns: 153 blocks, avg stage ~179%

**Expected SQL Pattern**:

```sql
SELECT s.state_name, COUNT(*) as total_blocks,
       ROUND(AVG(CASE WHEN a.stage > 0 THEN a.stage END)::numeric, 2) as avg_stage
FROM assessments_summary a
JOIN blocks b ON a.block_uuid = b.block_uuid
JOIN districts d ON b.district_uuid = d.district_uuid
JOIN states s ON d.state_uuid = s.state_uuid
WHERE UPPER(s.state_name) = UPPER('Punjab')
AND a.year = '2024-2025'
GROUP BY s.state_name;
```

---

### 2. Trend Query (Should NOT filter year)

**User Query**: "Show me trend for Punjab over time"

**Expected Behavior**:

- Intent: TREND
- Year Filter: NONE or `a.year >= '2021-2022'`
- Returns: 3 rows (2021-2022, 2023-2024, 2024-2025)

**Expected SQL Pattern**:

```sql
SELECT a.year,
       ROUND(AVG(CASE WHEN a.stage > 0 THEN a.stage END)::numeric, 2) as avg_stage,
       ROUND(AVG(a.rainfall)::numeric, 2) as avg_rainfall,
       COUNT(*) as total_blocks
FROM assessments_summary a
JOIN blocks b ON a.block_uuid = b.block_uuid
JOIN districts d ON b.district_uuid = d.district_uuid
JOIN states s ON d.state_uuid = s.state_uuid
WHERE UPPER(s.state_name) = UPPER('Punjab')
GROUP BY a.year
ORDER BY a.year;
```

**Expected Results**:

```
   year    | avg_stage | avg_rainfall | total_blocks
-----------+-----------+--------------+-------------
 2021-2022 |    182.60 |      550.00  |         153
 2023-2024 |    179.79 |      600.00  |         153
 2024-2025 |    179.15 |      620.00  |         153
```

---

### 3. Multi-Year Comparison Query

**User Query**: "Compare Punjab and Haryana groundwater trends"

**Expected Behavior**:

- Intent: COMPARE or TREND
- Year Filter: NONE or multi-year range
- Returns: Multiple rows for each state across years

**Expected SQL Pattern**:

```sql
SELECT s.state_name, a.year,
       ROUND(AVG(CASE WHEN a.stage > 0 THEN a.stage END)::numeric, 2) as avg_stage,
       COUNT(*) as total_blocks
FROM assessments_summary a
JOIN blocks b ON a.block_uuid = b.block_uuid
JOIN districts d ON b.district_uuid = d.district_uuid
JOIN states s ON d.state_uuid = s.state_uuid
WHERE UPPER(s.state_name) IN (UPPER('Punjab'), UPPER('Haryana'))
GROUP BY s.state_name, a.year
ORDER BY s.state_name, a.year;
```

---

### 4. Category Filter with Latest Data

**User Query**: "Show me over-exploited blocks in Punjab"

**Expected Behavior**:

- Intent: LIST
- Year Filter: `AND a.year = '2024-2025'`
- Category Filter: `AND LOWER(a.category) = 'over_exploited'`

**Expected SQL Pattern**:

```sql
SELECT b.block_name, a.stage, a.rainfall, a.total_extraction, a.total_recharge
FROM assessments_summary a
JOIN blocks b ON a.block_uuid = b.block_uuid
JOIN districts d ON b.district_uuid = d.district_uuid
JOIN states s ON d.state_uuid = s.state_uuid
WHERE UPPER(s.state_name) = UPPER('Punjab')
AND LOWER(a.category) = 'over_exploited'
AND a.year = '2024-2025'
LIMIT 50;
```

---

### 5. States with Multi-Year Data

**User Query**: "Which states have data for multiple years?"

**Expected Behavior**:

- Intent: LIST or SUMMARY
- Year Filter: NONE (needs to count distinct years)

**Expected SQL Pattern**:

```sql
SELECT s.state_name, COUNT(DISTINCT a.year) as years_available
FROM assessments_summary a
JOIN blocks b ON a.block_uuid = b.block_uuid
JOIN districts d ON b.district_uuid = d.district_uuid
JOIN states s ON d.state_uuid = s.state_uuid
GROUP BY s.state_name
HAVING COUNT(DISTINCT a.year) >= 4
ORDER BY years_available DESC, s.state_name;
```

**Expected Top Results**:

- West Bengal: 6 years
- Chhattisgarh: 6 years
- Kerala: 6 years
- Bihar: 6 years
- Punjab: 4 years

---

### 6. Historical Rainfall Trend

**User Query**: "Show rainfall trends for West Bengal"

**Expected Behavior**:

- Intent: TREND
- Year Filter: NONE (multi-year)
- Returns: 6 years of rainfall data

**Expected SQL Pattern**:

```sql
SELECT a.year,
       ROUND(AVG(a.rainfall)::numeric, 2) as avg_rainfall,
       COUNT(*) as total_blocks
FROM assessments_summary a
JOIN blocks b ON a.block_uuid = b.block_uuid
JOIN districts d ON b.district_uuid = d.district_uuid
JOIN states s ON d.state_uuid = s.state_uuid
WHERE UPPER(s.state_name) = UPPER('West Bengal')
GROUP BY a.year
ORDER BY a.year;
```

---

### 7. Single Block Detailed Info

**User Query**: "Tell me about Ludhiana district"

**Expected Behavior**:

- Intent: SUMMARY
- Year Filter: `AND a.year = '2024-2025'`
- Returns: Latest complete data

**Expected SQL Pattern**:

```sql
SELECT d.district_name, COUNT(*) as total_blocks,
       ROUND(AVG(CASE WHEN a.stage > 0 THEN a.stage END)::numeric, 2) as avg_stage,
       ROUND(AVG(a.rainfall)::numeric, 2) as avg_rainfall
FROM assessments_summary a
JOIN blocks b ON a.block_uuid = b.block_uuid
JOIN districts d ON b.district_uuid = d.district_uuid
WHERE LOWER(d.district_name) ILIKE '%ludhiana%'
AND a.year = '2024-2025'
GROUP BY d.district_name;
```

---

### 8. Category Distribution Over Time

**User Query**: "How has the category distribution changed in Haryana?"

**Expected Behavior**:

- Intent: TREND
- Year Filter: NONE (needs historical comparison)

**Expected SQL Pattern**:

```sql
SELECT a.year, a.category, COUNT(*) as block_count
FROM assessments_summary a
JOIN blocks b ON a.block_uuid = b.block_uuid
JOIN districts d ON b.district_uuid = d.district_uuid
JOIN states s ON d.state_uuid = s.state_uuid
WHERE UPPER(s.state_name) = UPPER('Haryana')
AND a.category != 'none'
GROUP BY a.year, a.category
ORDER BY a.year, a.category;
```

---

## Manual Testing Checklist

- [ ] Test single location query returns 2024-2025 data only
- [ ] Test trend query returns multiple years (no year filter)
- [ ] Test comparison query works across states and years
- [ ] Test category filters use correct values (lowercase, underscores)
- [ ] Test state name matching uses UPPER() function
- [ ] Test block/district matching uses LOWER() and ILIKE
- [ ] Verify Punjab shows 3 recent years: 2021-2022, 2023-2024, 2024-2025
- [ ] Verify West Bengal shows 6 years of data
- [ ] Test extraction/recharge breakdown queries
- [ ] Verify stage calculations exclude salinity (-100000) values

---

## Expected AI Behavior

### Single Query Keywords

- "status of", "show me", "tell me about", "what is", "information on"
- → Should add `AND a.year = '2024-2025'`

### Trend Query Keywords

- "trend", "over time", "historical", "over years", "how has X changed"
- → Should NOT filter by year OR use `a.year >= '2021-2022'`

### Comparison Keywords

- "compare", "vs", "versus", "between", "difference"
- → Multi-year data when appropriate

---

## Database Quick Check Commands

### Check Punjab 4-Year Data

```bash
PGPASSWORD=admin psql -h localhost -p 5433 -U admin -d ground_sense_bot -c \
"SELECT a.year, COUNT(*) FROM assessments_summary a
JOIN blocks b ON a.block_uuid = b.block_uuid
JOIN districts d ON b.district_uuid = d.district_uuid
JOIN states s ON d.state_uuid = s.state_uuid
WHERE UPPER(s.state_name) = 'PUNJAB'
GROUP BY a.year ORDER BY a.year;"
```

### Check Category Values

```bash
PGPASSWORD=admin psql -h localhost -p 5433 -U admin -d ground_sense_bot -c \
"SELECT DISTINCT category FROM assessments_summary ORDER BY category;"
```

### Check State Coverage by Year

```bash
PGPASSWORD=admin psql -h localhost -p 5433 -U admin -d ground_sense_bot -c \
"SELECT a.year, COUNT(DISTINCT s.state_uuid) as states
FROM assessments_summary a
JOIN blocks b ON a.block_uuid = b.block_uuid
JOIN districts d ON b.district_uuid = d.district_uuid
JOIN states s ON d.state_uuid = s.state_uuid
GROUP BY a.year ORDER BY a.year;"
```

---

## Success Criteria

✅ **Single queries**: Return 2024-2025 data (most complete)
✅ **Trend queries**: Return multiple years without year filter
✅ **Category filters**: Use exact database values (lowercase, underscores)
✅ **State matching**: Case-insensitive with UPPER()
✅ **Block/District matching**: Case-insensitive with LOWER() and ILIKE
✅ **Stage calculations**: Exclude salinity values properly
✅ **Punjab**: Shows 4-year trend (2021-2025)
✅ **West Bengal**: Shows 6-year trend
✅ **Compilation**: Go code builds without errors
