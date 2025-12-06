# Enhanced Visualizations for TOP_RANKING Queries

## Problem Identified

The current visualization for "Top 10 over-exploited blocks" shows:

- ❌ Uniform green color bars
- ❌ Single metric (count = 1) for each block
- ❌ Not informative or visually appealing
- ❌ Doesn't show the actual groundwater data (stage, extraction, deficit)

## Solution Implemented

### 🎨 New Chart Types Added

#### 1. **stacked-bar** - Horizontal Stacked Bar Chart

**Use case**: Rankings with multiple metrics
**Visual**: Horizontal bars with stacked segments showing composition
**Best for**: Over-exploited blocks, worst performers, multi-metric comparisons

**Features**:

- Horizontal orientation for easy reading of location names
- Stacked segments show different metrics (extraction, recharge, deficit, stage)
- Color-coded by metric type:
  - 🔴 Red: Stage % / Deficit (critical metrics)
  - 🟠 Orange: Extraction (high concern)
  - 🔵 Blue: Recharge (context)
  - 🟢 Cyan: Rainfall (context)
  - 🟢 Green: Availability (positive metrics)
- Labels inside bars showing values
- Automatic color selection based on metric name

#### 2. **horizontal-bar** - Simple Horizontal Bar Chart

**Use case**: Simple rankings with single metric
**Visual**: Horizontal gradient bars
**Best for**: Top N queries with single value

---

## Implementation Details

### Frontend Changes (ChartRenderer.tsx)

1. **Added new chart types**:

```typescript
| "stacked-bar"       // Horizontal stacked bar for multi-metric rankings
| "horizontal-bar"    // Horizontal bar for simple rankings
```

2. **Created `createStackedBarChart()` function**:

- Horizontal orientation (yAxis: category, xAxis: value)
- Automatic color coding based on metric names
- Stacked series with labels
- Responsive to metric types

3. **Created `createHorizontalBarChart()` function**:

- Simple horizontal bars
- Gradient colors
- Labels on the right side

### Backend Changes

#### LLM Service (llm_service.go)

1. **Updated visualization prompt**:

- Added special case for TOP_RANKING queries
- Instructs AI to use "stacked-bar" for multi-metric rankings
- Added color coding guidelines
- Provided stacked-bar JSON example

2. **Enhanced chart type selection logic**:

```
Ranking/Top N with SINGLE metric → horizontal-bar
Ranking/Top N with MULTIPLE metrics → stacked-bar (shows composition + ranking)
```

#### NLP Service (nlp_service.go)

1. **Updated EXAMPLE 17 (TOP_RANKING)**:

```sql
-- OLD: Only returned basic columns
SELECT b.block_name, d.district_name, s.state_name, a.stage

-- NEW: Returns multiple metrics for rich visualization
SELECT
    CONCAT(b.block_name, ', ', d.district_name) as location,
    s.state_name,
    ROUND(a.stage::numeric, 2) as stage_percent,
    ROUND(a.total_extraction::numeric, 2) as extraction_mcm,
    ROUND(a.total_recharge::numeric, 2) as recharge_mcm,
    ROUND((a.total_extraction - a.total_recharge)::numeric, 2) as deficit_mcm,
    ROUND(a.rainfall::numeric, 2) as rainfall_mm
```

**Key improvements**:

- Combines block + district name for clarity
- Returns multiple metrics in one query
- All values rounded to 2 decimals
- Filters out salinity blocks (stage > 0)

---

## Visualization Examples

### Example 1: Top 10 Over-Exploited Blocks

**Query**: "Top 10 over-exploited blocks in India"

**SQL Generated**:

```sql
SELECT
    CONCAT(b.block_name, ', ', d.district_name) as location,
    ROUND(a.stage::numeric, 2) as stage_percent,
    ROUND(a.total_extraction::numeric, 2) as extraction_mcm,
    ROUND(a.total_recharge::numeric, 2) as recharge_mcm,
    ROUND((a.total_extraction - a.total_recharge)::numeric, 2) as deficit_mcm
FROM assessments_summary a
...
ORDER BY a.stage DESC LIMIT 10
```

**Visualization JSON** (AI-generated):

```json
{
  "type": "stacked-bar",
  "title": "Top 10 Most Over-Exploited Blocks in India (2024-2025)",
  "xAxis": { "type": "value" },
  "yAxis": {
    "type": "category",
    "data": ["Block1, District1", "Block2, District2", ...]
  },
  "series": [
    {
      "name": "Extraction (MCM)",
      "type": "bar",
      "stack": "total",
      "data": [450, 380, 350, ...],
      "itemStyle": { "color": "#f97316" }
    },
    {
      "name": "Deficit (MCM)",
      "type": "bar",
      "stack": "total",
      "data": [120, 95, 85, ...],
      "itemStyle": { "color": "#ef4444" }
    },
    {
      "name": "Stage (%)",
      "type": "bar",
      "stack": "total",
      "data": [180, 165, 155, ...],
      "itemStyle": { "color": "#dc2626" }
    }
  ]
}
```

**Visual Result**:

```
Top 10 Most Over-Exploited Blocks in India (2024-2025)

Block A, District X  |███████████████████████████| 450  | 120 | 180
Block B, District Y  |█████████████████████████  | 380  | 95  | 165
Block C, District Z  |███████████████████████    | 350  | 85  | 155
...
                         Orange (Extract) Red(Def) Dark Red(Stage)
```

---

## Color Coding System

The `getMetricColor()` function automatically assigns colors based on metric names:

| Metric Type  | Color  | Hex Code  | Use Case                                    |
| ------------ | ------ | --------- | ------------------------------------------- |
| Stage %      | Red    | `#ef4444` | Critical indicator (>100% = over-exploited) |
| Deficit      | Red    | `#ef4444` | Water shortage amount                       |
| Extraction   | Orange | `#f97316` | High concern metric                         |
| Recharge     | Blue   | `#3b82f6` | Context/positive metric                     |
| Rainfall     | Cyan   | `#06b6d4` | Climate context                             |
| Availability | Green  | `#10b981` | Positive metric                             |
| Default      | Purple | `#8b5cf6` | Other metrics                               |

---

## Benefits

### Before Enhancement

❌ Boring uniform green bars
❌ No data differentiation
❌ Single count metric (not useful)
❌ Poor visual hierarchy

### After Enhancement

✅ Multi-dimensional data visualization
✅ Color-coded by severity (red = critical)
✅ Shows actual groundwater metrics (stage, extraction, deficit)
✅ Easy to compare across blocks
✅ Stacked composition shows relationships
✅ Professional, informative charts

---

## User Experience Flow

1. **User asks**: "Top 10 over-exploited blocks in India"

2. **AI detects intent**: TOP_RANKING

3. **AI generates SQL** with multiple metrics:

   - Stage percent
   - Extraction MCM
   - Recharge MCM
   - Deficit MCM
   - Rainfall mm

4. **Database returns** rich data for 10 blocks

5. **AI analyzes data** and selects "stacked-bar" type

6. **AI generates visualization JSON** with:

   - Horizontal orientation
   - Multiple series (one per metric)
   - Color coding
   - Labels

7. **Frontend renders** beautiful stacked horizontal bar chart

8. **User sees**:
   - Clear ranking
   - Visual comparison
   - Multiple metrics at once
   - Color-coded severity
   - Professional visualization

---

## Testing Commands

### Test the improved SQL query:

```bash
PGPASSWORD=admin psql -h localhost -p 5433 -U admin -d ground_sense_bot -c \
"SELECT
    CONCAT(b.block_name, ', ', d.district_name) as location,
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
LIMIT 10;"
```

### Verify frontend compilation:

```bash
cd /home/hxrshxz/Desktop/Projects/sih/SIH_2025_Internal_Round_Submission_Mercury/code/ground-sense-bot
npm run build
```

### Verify backend compilation:

```bash
cd backend && go build ./...
```

---

## Files Modified

1. **Frontend**:

   - `src/components/charts/echarts/ChartRenderer.tsx`
     - Added "stacked-bar" and "horizontal-bar" types
     - Created `createStackedBarChart()` function
     - Created `createHorizontalBarChart()` function
     - Added intelligent color coding

2. **Backend**:

   - `backend/internal/services/llm_service.go`

     - Enhanced visualization prompt
     - Added stacked-bar usage guidelines
     - Added color coding instructions
     - Provided JSON example

   - `backend/internal/services/nlp_service.go`
     - Updated EXAMPLE 17 with multi-metric SQL
     - Added metric rounding
     - Combined block + district names

---

## Example Queries That Benefit

1. **"Top 10 over-exploited blocks in India"**

   - Shows stage, extraction, deficit side-by-side
   - Color-coded critical areas

2. **"Worst 5 districts for groundwater"**

   - Multi-metric comparison
   - Stacked visualization

3. **"Which states have highest extraction?"**

   - Extraction + deficit + stage
   - Comprehensive view

4. **"Show me blocks with worst water deficit"**
   - Deficit highlighted in red
   - Extraction/recharge context

---

## Future Enhancements (Optional)

1. **Interactive tooltips** showing all metric details on hover
2. **Click-to-drill-down** to see block details
3. **Export to PDF/PNG** functionality
4. **Threshold lines** (e.g., 100% stage line)
5. **Comparison mode** to compare with state/national averages
6. **Trend indicators** (improving/worsening over years)

---

## Summary

✅ **Solved the boring visualization problem**
✅ **Added rich multi-metric charts**
✅ **Color-coded by severity**
✅ **Horizontal stacked bars for easy reading**
✅ **Automatic metric detection and coloring**
✅ **Professional, informative visuals**

The chatbot now generates **beautiful, informative stacked bar charts** for ranking queries instead of boring uniform green bars!
