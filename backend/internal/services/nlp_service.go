package services

import (
	"context"
	"encoding/json"
	"fmt"
	"regexp"
	"strconv"
	"strings"
)

type NLPService struct{
	llm *LLMService
}

func NewNLPService(llm *LLMService) *NLPService {
	return &NLPService{llm: llm}
}

type Intent string

const (
	IntentSummary             Intent = "SUMMARY"
	IntentTrend               Intent = "TREND"
	IntentCompare             Intent = "COMPARE"
	IntentRechargeBreakdown   Intent = "RECHARGE_BREAKDOWN"
	IntentExtractionBreakdown Intent = "EXTRACTION_BREAKDOWN"
	IntentDischargeBreakdown  Intent = "DISCHARGE_BREAKDOWN"
	IntentMapCategory         Intent = "MAP_CATEGORY"
	IntentListBlocks          Intent = "LIST_BLOCKS"
	IntentListDistricts       Intent = "LIST_DISTRICTS"
	IntentListStates          Intent = "LIST_STATES"
	// New enhanced query patterns
	IntentTopRanking          Intent = "TOP_RANKING"
	IntentCategoryDistribution Intent = "CATEGORY_DISTRIBUTION"
	IntentDeficitAnalysis     Intent = "DEFICIT_ANALYSIS"
	IntentChangeAnalysis      Intent = "CHANGE_ANALYSIS"
	// New predefined visualization intents
	IntentYearlyComparison    Intent = "YEARLY_COMPARISON"
	IntentCategorySummary     Intent = "CATEGORY_SUMMARY"
	IntentCriticalAlerts      Intent = "CRITICAL_ALERTS"
	IntentWaterBalance        Intent = "WATER_BALANCE"
	IntentStateOverview       Intent = "STATE_OVERVIEW"
	// New detailed visualization intents
	IntentRiskProfile         Intent = "RISK_PROFILE"
	IntentSectorUsage         Intent = "SECTOR_USAGE"
	IntentUnknown             Intent = "UNKNOWN"
)

type Entities struct {
	Locations     []string
	Year          string
	StartYear     string
	EndYear       string
	Metric        string
	Category      string
	Threshold     float64
	Operator      string // ">", "<", "=", etc.
	OriginalQuery string // Store original user query for semantic detection
}

type IntentAnalysis struct {
	Intent    string   `json:"intent"`
	Locations []string `json:"locations"`
	Year      string   `json:"year"`
	Category  string   `json:"category"`
	Metric    string   `json:"metric"`
	Threshold float64  `json:"threshold"`
	Operator  string   `json:"operator"`
	Confidence float64 `json:"confidence"`
}

func (s *NLPService) ParseMessage(message string) (Intent, Entities, string) {
	// Use LOCAL rule-based intent detection (no Gemini API calls!)
	msg := strings.ToLower(message)
	intent := s.determineIntent(msg)
	entities := s.extractEntities(msg)
	entities.OriginalQuery = message // Store original for dynamic SQL
	
	// Keyword-based intent override for specialized visualizations
	if strings.Contains(msg, "risk") || strings.Contains(msg, "sustainability") || strings.Contains(msg, "vulnerability") {
		intent = IntentRiskProfile
	} else if strings.Contains(msg, "sector") && (strings.Contains(msg, "usage") || strings.Contains(msg, "breakdown")) {
		intent = IntentSectorUsage
	}

	// Normalize locations
	entities.Locations = normalizeLocations(entities.Locations)

	// Set defaults
	if entities.Year == "" {
		entities.Year = "2024-2025"
	}
	entities.StartYear = "2012-2013"
	entities.EndYear = entities.Year

	// Generate DYNAMIC SQL using LOCAL LLM (SQLCoder via Ollama)
	sqlQuery := ""
	var err error
	if s.shouldGenerateDynamicSQL(intent, entities, message) {
		sqlQuery, err = s.generateDynamicSQL(message, intent, entities)
		if err != nil {
			fmt.Printf("ERROR: Dynamic SQL generation failed: %v\n", err)
			sqlQuery = "" // Fallback to hardcoded handlers
		} else {
			fmt.Printf("DEBUG: Generated Dynamic SQL (Local LLM): %s\n", sqlQuery)
		}
	}

	return intent, entities, sqlQuery
}

// shouldGenerateDynamicSQL determines if we should generate SQL dynamically
func (s *NLPService) shouldGenerateDynamicSQL(intent Intent, entities Entities, message string) bool {
	// Enable dynamic SQL for:
	// 1. LIST_BLOCKS with filters (rainfall < X, stage > Y, etc.)
	// 2. Queries with explicit thresholds or operators
	// 3. Complex queries that mention specific metrics
	
	msgLower := strings.ToLower(message)
	
	// Check for filter keywords - but exclude category-only filters
	// Category queries need handler's pattern matching since DB uses 'over_exploited' not 'Over-Exploited'  
	hasCategoryFilter := strings.Contains(msgLower, "over-exploited") ||
		strings.Contains(msgLower, "over exploited") ||
		strings.Contains(msgLower, "critical") ||
		strings.Contains(msgLower, "semi-critical") ||
		strings.Contains(msgLower, "safe")
	
	hasNumericFilter := strings.Contains(msgLower, "less than") ||
		strings.Contains(msgLower, "greater than") ||
		strings.Contains(msgLower, "more than") ||
		strings.Contains(msgLower, "above") ||
		strings.Contains(msgLower, "below") ||
		entities.Threshold > 0 ||
		entities.Operator != ""
	
	// Only use dynamic SQL for numeric filters, NOT category filters
	// Category queries should use the handler with proper pattern matching
	if intent == IntentListBlocks && hasNumericFilter && !hasCategoryFilter {
		return true
	}

	// Enable for trend and compare so time series / comparisons go through SQL
	if intent == IntentTrend || intent == IntentCompare {
		return true
	}

	// Enable for new query pattern intents
	if intent == IntentTopRanking || intent == IntentCategoryDistribution || 
	   intent == IntentDeficitAnalysis || intent == IntentChangeAnalysis {
		return true
	}

	return false
}

// normalizeLocations uppercases and trims locations for better ILIKE matching
func normalizeLocations(locs []string) []string {
	res := make([]string, 0, len(locs))
	for _, l := range locs {
		trimmed := strings.TrimSpace(l)
		if trimmed == "" {
			continue
		}
		res = append(res, strings.ToUpper(trimmed))
	}
	return res
}

// generateDynamicSQL creates a SQL query using AI based on user intent
func (s *NLPService) generateDynamicSQL(message string, intent Intent, entities Entities) (string, error) {
	// Build comprehensive database schema context with ACTUAL data from the database
	schema := `
╔══════════════════════════════════════════════════════════════════════════════╗
║                    INDIA GROUNDWATER DATABASE - ACTUAL SCHEMA                ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  Database: PostgreSQL | Schema: public | Data: INGRES Groundwater System     ║
║  TOTAL BLOCKS: 5,796 | YEARS AVAILABLE: 2012-2025 (7 assessment periods)    ║
╚══════════════════════════════════════════════════════════════════════════════╝

⚠️⚠️⚠️ CRITICAL DATA AVAILABILITY BY YEAR ⚠️⚠️⚠️
┌─────────────┬──────────────┬─────────┬──────────────────────────────────────┐
│ Year        │ Block Count  │ States  │ Data Quality                         │
├─────────────┼──────────────┼─────────┼──────────────────────────────────────┤
│ 2024-2025   │ 5,796 blocks │ 26      │ ✅ COMPLETE - Most comprehensive    │
│ 2023-2024   │ 5,734 blocks │ 25      │ ✅ EXCELLENT - Near complete         │
│ 2021-2022   │ 4,824 blocks │ 16      │ ✅ GOOD - Wide coverage              │
│ 2019-2020   │ 2,811 blocks │ 13      │ ⚠️ MODERATE - Limited coverage       │
│ 2022-2023   │ 2,619 blocks │ 12      │ ⚠️ MODERATE - Limited coverage       │
│ 2016-2017   │ 2,738 blocks │ 12      │ ⚠️ MODERATE - Limited coverage       │
│ 2012-2013   │   160 blocks │  1      │ ⚠️ MINIMAL - Only West Bengal        │
└─────────────┴──────────────┴─────────┴──────────────────────────────────────┘

📊 TREND ANALYSIS CAPABILITY:
- Recent years (2021-2025): Best for trend analysis across most states
- Earlier years (2012-2020): Limited to specific states only
- For comprehensive trends: Use 2021-2025 period (4 years, 16+ states)
- For maximum data: Default to 2024-2025 unless user specifies otherwise

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TABLE 1: states
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CREATE TABLE states (
    state_uuid UUID PRIMARY KEY,
    state_name VARCHAR(100) NOT NULL UNIQUE  -- ALWAYS UPPERCASE
);

⚠️ ACTUAL STATE NAMES (ALL UPPERCASE - use UPPER() for matching):
ANDAMAN AND NICOBAR ISLANDS, ANDHRA PRADESH, ARUNACHAL PRADESH, ASSAM, 
BIHAR, CHANDIGARH, CHHATTISGARH, DADRA AND NAGAR HAVELI, DAMAN AND DIU, 
DELHI, GOA, GUJARAT, HARYANA, HIMACHAL PRADESH, JAMMU AND KASHMIR, 
JHARKHAND, KARNATAKA, KERALA, LADAKH, LAKSHDWEEP, MADHYA PRADESH, 
MAHARASHTRA, MANIPUR, MEGHALAYA, MIZORAM, NAGALAND, ODISHA, PUDUCHERRY, 
PUNJAB, RAJASTHAN, SIKKIM, TAMIL NADU, TELANGANA, TRIPURA, UTTAR PRADESH, 
UTTARAKHAND, WEST BENGAL

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TABLE 2: districts
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CREATE TABLE districts (
    district_uuid UUID PRIMARY KEY,
    district_name VARCHAR(100) NOT NULL,  -- Mixed case
    state_uuid UUID REFERENCES states(state_uuid)
);

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TABLE 3: blocks (5,796 total blocks)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CREATE TABLE blocks (
    block_uuid UUID PRIMARY KEY,
    block_name VARCHAR(100) NOT NULL,  -- Mixed case (some UPPERCASE, some Title Case)
    district_uuid UUID REFERENCES districts(district_uuid),
    state_uuid UUID REFERENCES states(state_uuid),
    geometry JSONB
);

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TABLE 4: assessments_summary (MAIN DATA TABLE)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CREATE TABLE assessments_summary (
    assessment_id SERIAL PRIMARY KEY,
    block_uuid UUID REFERENCES blocks(block_uuid),
    year VARCHAR(10) NOT NULL,       -- ONLY '2024-2025' exists!
    rainfall DOUBLE PRECISION,       -- mm (range: 0-3000+)
    total_recharge DOUBLE PRECISION, -- MCM (million cubic meters)
    total_discharge DOUBLE PRECISION,-- MCM
    total_extractable DOUBLE PRECISION, -- MCM
    total_extraction DOUBLE PRECISION,  -- MCM
    category VARCHAR(20),            -- see exact values below
    stage DOUBLE PRECISION,          -- percentage (can be negative for special cases)
    availability DOUBLE PRECISION,   -- MCM
    raw JSONB,
    created_at TIMESTAMP
);

⚠️⚠️⚠️ CRITICAL - ONLY ONE YEAR EXISTS: '2024-2025' ⚠️⚠️⚠️
ALWAYS use: WHERE a.year = '2024-2025' or just omit year filter!

⚠️⚠️⚠️ ACTUAL CATEGORY VALUES (lowercase, underscore format) ⚠️⚠️⚠️
┌─────────────────┬──────────────────────────────────────────────────────────┐
│ DB Value        │ Meaning / User might say                                 │
├─────────────────┼──────────────────────────────────────────────────────────┤
│ 'safe'          │ Safe blocks, stage < 70%                                 │
│ 'semi_critical' │ Semi-critical, stage 70-90%                              │
│ 'critical'      │ Critical, stage 90-100%                                  │
│ 'over_exploited'│ Over-exploited, stage > 100%                             │
│ 'salinity'      │ Affected by salinity (stage = -100000)                   │
│ 'Hilly Area'    │ Hilly area, not assessed                                 │
│ 'none'          │ No category assigned                                     │
└─────────────────┴──────────────────────────────────────────────────────────┘

⚠️ CATEGORY MATCHING RULES:
- User says "safe" → WHERE LOWER(a.category) = 'safe'
- User says "over-exploited"/"overexploited"/"over exploited" → WHERE LOWER(a.category) = 'over_exploited'
- User says "semi-critical"/"semi critical" → WHERE LOWER(a.category) = 'semi_critical'
- User says "critical" → WHERE LOWER(a.category) = 'critical'

SAMPLE ACTUAL DATA:
| block_name    | category       | stage                |
|---------------|----------------|----------------------|
| POLBA-DADPUR  | safe           | 53.66                |
| Authapuram    | critical       | 99.06                |
| Dharampur     | safe           | 69.41                |
| KANNAUJ       | critical       | 98.81                |
| Allipuram     | semi_critical  | 72.08                |
| KOLAGHAT      | salinity       | -100000 (special)    |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TABLE 5: assessments_recharge_breakdown
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CREATE TABLE assessments_recharge_breakdown (
    id SERIAL PRIMARY KEY,
    assessment_id INT REFERENCES assessments_summary(assessment_id),
    source VARCHAR(50) NOT NULL,
    command DOUBLE PRECISION,
    non_command DOUBLE PRECISION,
    total DOUBLE PRECISION
);

⚠️ ACTUAL SOURCE VALUES (lowercase):
'rainfall', 'canal', 'gw_irrigation', 'surface_irrigation', 'water_body',
'artificial_structure', 'sewage', 'pipeline', 'streamRecharge', 'agriculture', 'Total'

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TABLE 6: assessments_extraction_breakdown
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CREATE TABLE assessments_extraction_breakdown (
    id SERIAL PRIMARY KEY,
    assessment_id INT REFERENCES assessments_summary(assessment_id),
    source VARCHAR(50) NOT NULL,
    command DOUBLE PRECISION,
    non_command DOUBLE PRECISION,
    total DOUBLE PRECISION
);

⚠️ ACTUAL SOURCE VALUES: 'agriculture', 'domestic', 'industry', 'Total'

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TABLE 7: assessments_discharge_breakdown (EMPTY - no data)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REQUIRED JOIN PATTERNS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- ALWAYS join to get location names:
SELECT b.block_name, d.district_name, s.state_name, a.*
FROM assessments_summary a
JOIN blocks b ON a.block_uuid = b.block_uuid
JOIN districts d ON b.district_uuid = d.district_uuid
JOIN states s ON b.state_uuid = s.state_uuid
WHERE a.year = '2024-2025'

-- Case-insensitive matching (USE UPPER for states, LOWER for blocks/districts):
WHERE UPPER(s.state_name) = UPPER('punjab')
WHERE LOWER(b.block_name) ILIKE '%ludhiana%'
WHERE LOWER(d.district_name) ILIKE '%bathinda%'

`

	// Build detailed intent and entity context
	intentContext := fmt.Sprintf(`
USER INTENT: %s
EXTRACTED ENTITIES:
  - Locations: %v
  - Year: %s
  - Category: %s
  - Metric: %s
  - Threshold: %.2f
  - Operator: %s

USER QUERY: "%s"
`, intent, entities.Locations, entities.Year, entities.Category, entities.Metric, entities.Threshold, entities.Operator, message)

	prompt := schema + intentContext + `

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COMPLETE SQL QUERY EXAMPLES (USE THESE AS TEMPLATES!)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 EXAMPLE 1: SUMMARY - "What is the groundwater status of Jaisinagar?"
SELECT 
    b.block_name,
    d.district_name,
    s.state_name,
    a.year,
    a.rainfall,
    a.total_recharge,
    a.total_extraction,
    a.total_extractable,
    a.total_discharge,
    a.category,
    a.stage,
    a.availability
FROM assessments_summary a
JOIN blocks b ON a.block_uuid = b.block_uuid
JOIN districts d ON b.district_uuid = d.district_uuid
JOIN states s ON b.state_uuid = s.state_uuid
WHERE LOWER(b.block_name) ILIKE '%jaisinagar%'
  AND a.year = '2024-2025'

🎯 EXAMPLE 2: TREND - "Show me groundwater trend for Ludhiana"
-- Multi-year data available! This will show actual trends over time.
SELECT 
    a.year,
    b.block_name,
    a.rainfall,
    a.total_recharge,
    a.total_extraction,
    a.stage,
    a.category
FROM assessments_summary a
JOIN blocks b ON a.block_uuid = b.block_uuid
WHERE LOWER(b.block_name) ILIKE '%ludhiana%'
ORDER BY a.year ASC

🎯 EXAMPLE 3: COMPARE - "Compare Ludhiana and Bathinda"
SELECT 
    b.block_name,
    a.year,
    a.rainfall,
    a.total_recharge,
    a.total_extraction,
    a.stage,
    a.category,
    a.availability
FROM assessments_summary a
JOIN blocks b ON a.block_uuid = b.block_uuid
WHERE (LOWER(b.block_name) ILIKE '%ludhiana%' OR LOWER(b.block_name) ILIKE '%bathinda%')
  AND a.year = '2024-2025'
ORDER BY b.block_name

🎯 EXAMPLE 4: RECHARGE_BREAKDOWN - "Show me recharge breakdown for Chandil"
SELECT 
    b.block_name,
    arb.source,
    arb.command,
    arb.non_command,
    arb.total
FROM assessments_recharge_breakdown arb
JOIN assessments_summary a ON arb.assessment_id = a.assessment_id
JOIN blocks b ON a.block_uuid = b.block_uuid
WHERE LOWER(b.block_name) ILIKE '%chandil%'
  AND a.year = '2024-2025'

🎯 EXAMPLE 5: EXTRACTION_BREAKDOWN - "What are the sources of extraction in Chandigarh?"
SELECT 
    b.block_name,
    aeb.source,
    aeb.command,
    aeb.non_command,
    aeb.total
FROM assessments_extraction_breakdown aeb
JOIN assessments_summary a ON aeb.assessment_id = a.assessment_id
JOIN blocks b ON a.block_uuid = b.block_uuid
WHERE LOWER(b.block_name) ILIKE '%chandigarh%'
  AND a.year = '2024-2025'

🎯 EXAMPLE 6: LIST_BLOCKS with rainfall filter - "List all blocks where rainfall is less than 500 mm"
SELECT 
    b.block_name,
    d.district_name,
    s.state_name,
    a.rainfall,
    a.stage,
    a.category
FROM assessments_summary a
JOIN blocks b ON a.block_uuid = b.block_uuid
JOIN districts d ON b.district_uuid = d.district_uuid
JOIN states s ON b.state_uuid = s.state_uuid
WHERE a.rainfall < 500
  AND a.year = '2024-2025'
  AND a.category NOT IN ('salinity', 'Hilly Area', 'none')
ORDER BY a.rainfall ASC
LIMIT 50

🎯 EXAMPLE 7: LIST_BLOCKS by category - "Show me over-exploited blocks"
-- CRITICAL: Use 'over_exploited' (lowercase with underscore)
SELECT 
    b.block_name,
    d.district_name,
    s.state_name,
    a.rainfall,
    a.stage,
    a.category
FROM assessments_summary a
JOIN blocks b ON a.block_uuid = b.block_uuid
JOIN districts d ON b.district_uuid = d.district_uuid
JOIN states s ON b.state_uuid = s.state_uuid
WHERE LOWER(a.category) = 'over_exploited'
  AND a.year = '2024-2025'
ORDER BY a.stage DESC
LIMIT 50

🎯 EXAMPLE 8: LIST_BLOCKS with state filter - "Show safe blocks in Punjab"
-- CRITICAL: Use 'safe' (lowercase) and UPPER() for state matching
SELECT 
    b.block_name,
    d.district_name,
    a.rainfall,
    a.stage,
    a.category
FROM assessments_summary a
JOIN blocks b ON a.block_uuid = b.block_uuid
JOIN districts d ON b.district_uuid = d.district_uuid
JOIN states s ON b.state_uuid = s.state_uuid
WHERE UPPER(s.state_name) = UPPER('punjab')
  AND LOWER(a.category) = 'safe'
  AND a.year = '2024-2025'
ORDER BY b.block_name
LIMIT 50

🎯 EXAMPLE 9: LIST_DISTRICTS - "Show me all districts in Punjab"
SELECT DISTINCT
    d.district_name,
    s.state_name
FROM districts d
JOIN states s ON d.state_uuid = s.state_uuid
WHERE UPPER(s.state_name) = UPPER('punjab')
ORDER BY d.district_name

🎯 EXAMPLE 10: LIST_STATES - "List all states"
SELECT DISTINCT state_name
FROM states
ORDER BY state_name

🎯 EXAMPLE 11: Complex filter - "Blocks in Rajasthan with stage greater than 90"
SELECT 
    b.block_name,
    d.district_name,
    a.rainfall,
    a.stage,
    a.category
FROM assessments_summary a
JOIN blocks b ON a.block_uuid = b.block_uuid
JOIN districts d ON b.district_uuid = d.district_uuid
JOIN states s ON b.state_uuid = s.state_uuid
WHERE UPPER(s.state_name) = UPPER('rajasthan')
  AND a.stage > 90
  AND a.year = '2024-2025'
ORDER BY a.stage DESC
LIMIT 50

🎯 EXAMPLE 12: STATE-LEVEL SUMMARY - "What is the groundwater status of Punjab?"
SELECT 
    s.state_name,
    COUNT(*) as total_blocks,
    ROUND(AVG(a.rainfall)::numeric, 2) as avg_rainfall_mm,
    ROUND(AVG(CASE WHEN a.stage > 0 THEN a.stage ELSE NULL END)::numeric, 2) as avg_stage_percent,
    ROUND(SUM(a.total_recharge)::numeric, 2) as total_recharge_mcm,
    ROUND(SUM(a.total_extraction)::numeric, 2) as total_extraction_mcm,
    SUM(CASE WHEN LOWER(a.category) = 'safe' THEN 1 ELSE 0 END) as safe_blocks,
    SUM(CASE WHEN LOWER(a.category) = 'semi_critical' THEN 1 ELSE 0 END) as semicritical_blocks,
    SUM(CASE WHEN LOWER(a.category) = 'critical' THEN 1 ELSE 0 END) as critical_blocks,
    SUM(CASE WHEN LOWER(a.category) = 'over_exploited' THEN 1 ELSE 0 END) as overexploited_blocks
FROM assessments_summary a
JOIN blocks b ON a.block_uuid = b.block_uuid
JOIN states s ON b.state_uuid = s.state_uuid
WHERE UPPER(s.state_name) = UPPER('punjab')
  AND a.year = '2024-2025'
GROUP BY s.state_name

🎯 EXAMPLE 13: DISTRICT-LEVEL SUMMARY - "What is the groundwater status of Ludhiana district?"
SELECT 
    d.district_name,
    s.state_name,
    COUNT(*) as total_blocks,
    ROUND(AVG(a.rainfall)::numeric, 2) as avg_rainfall_mm,
    ROUND(AVG(CASE WHEN a.stage > 0 THEN a.stage ELSE NULL END)::numeric, 2) as avg_stage_percent,
    ROUND(SUM(a.total_recharge)::numeric, 2) as total_recharge_mcm,
    ROUND(SUM(a.total_extraction)::numeric, 2) as total_extraction_mcm,
    SUM(CASE WHEN LOWER(a.category) = 'safe' THEN 1 ELSE 0 END) as safe_blocks,
    SUM(CASE WHEN LOWER(a.category) = 'over_exploited' THEN 1 ELSE 0 END) as overexploited_blocks
FROM assessments_summary a
JOIN blocks b ON a.block_uuid = b.block_uuid
JOIN districts d ON b.district_uuid = d.district_uuid
JOIN states s ON b.state_uuid = s.state_uuid
WHERE LOWER(d.district_name) ILIKE '%ludhiana%'
  AND a.year = '2024-2025'
GROUP BY d.district_name, s.state_name

🎯 EXAMPLE 14: ALL STATES SUMMARY - "Compare groundwater status across all states"
SELECT 
    s.state_name,
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

🎯 EXAMPLE 15: ALL DISTRICTS IN STATE - "Show all districts in Rajasthan with their status"
SELECT 
    d.district_name,
    COUNT(*) as total_blocks,
    ROUND(AVG(a.rainfall)::numeric, 2) as avg_rainfall,
    ROUND(AVG(CASE WHEN a.stage > 0 THEN a.stage ELSE NULL END)::numeric, 2) as avg_stage,
    SUM(CASE WHEN LOWER(a.category) = 'safe' THEN 1 ELSE 0 END) as safe_blocks,
    SUM(CASE WHEN LOWER(a.category) = 'over_exploited' THEN 1 ELSE 0 END) as overexploited
FROM assessments_summary a
JOIN blocks b ON a.block_uuid = b.block_uuid
JOIN districts d ON b.district_uuid = d.district_uuid
JOIN states s ON b.state_uuid = s.state_uuid
WHERE UPPER(s.state_name) = UPPER('rajasthan')
  AND a.year = '2024-2025'
GROUP BY d.district_name
ORDER BY avg_stage DESC

🎯 EXAMPLE 16: STATE TREND - "Show groundwater trend for Punjab over years"
-- Multi-year data available! Punjab has data from 2021-2025.
SELECT 
    a.year,
    s.state_name,
    COUNT(*) as total_blocks,
    ROUND(AVG(a.rainfall)::numeric, 2) as avg_rainfall,
    ROUND(AVG(CASE WHEN a.stage > 0 THEN a.stage ELSE NULL END)::numeric, 2) as avg_stage,
    ROUND(SUM(a.total_recharge)::numeric, 2) as total_recharge,
    ROUND(SUM(a.total_extraction)::numeric, 2) as total_extraction
FROM assessments_summary a
JOIN blocks b ON a.block_uuid = b.block_uuid
JOIN states s ON b.state_uuid = s.state_uuid
WHERE UPPER(s.state_name) = UPPER('punjab')
GROUP BY a.year, s.state_name
ORDER BY a.year ASC

🎯 EXAMPLE 17: TOP_RANKING - "Top 10 over-exploited blocks in India"
-- Returns multiple metrics for rich stacked bar visualization
SELECT 
    CONCAT(b.block_name, ', ', d.district_name) as location,
    s.state_name,
    ROUND(a.stage::numeric, 2) as stage_percent,
    ROUND(a.total_extraction::numeric, 2) as extraction_mcm,
    ROUND(a.total_recharge::numeric, 2) as recharge_mcm,
    ROUND((a.total_extraction - a.total_recharge)::numeric, 2) as deficit_mcm,
    ROUND(a.rainfall::numeric, 2) as rainfall_mm
FROM assessments_summary a
JOIN blocks b ON a.block_uuid = b.block_uuid
JOIN districts d ON b.district_uuid = d.district_uuid
JOIN states s ON d.state_uuid = s.state_uuid
WHERE LOWER(a.category) = 'over_exploited'
AND a.year = '2024-2025'
AND a.stage > 0
ORDER BY a.stage DESC
LIMIT 10

🎯 EXAMPLE 18: CATEGORY_DISTRIBUTION - "Show me category distribution for Punjab"
SELECT 
    a.category,
    COUNT(*) as block_count,
    ROUND(AVG(CASE WHEN a.stage > 0 THEN a.stage END)::numeric, 2) as avg_stage,
    ROUND((COUNT(*) * 100.0 / SUM(COUNT(*)) OVER())::numeric, 2) as percentage
FROM assessments_summary a
JOIN blocks b ON a.block_uuid = b.block_uuid
JOIN districts d ON b.district_uuid = d.district_uuid
JOIN states s ON d.state_uuid = s.state_uuid
WHERE UPPER(s.state_name) = 'PUNJAB'
AND a.year = '2024-2025'
AND a.category != 'none'
GROUP BY a.category
ORDER BY block_count DESC

🎯 EXAMPLE 19: DEFICIT_ANALYSIS - "Which blocks have the highest water deficit?"
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
LIMIT 20

🎯 EXAMPLE 20: CHANGE_ANALYSIS - "How has Punjab changed over 4 years?"
WITH yearly_data AS (
    SELECT 
        a.year,
        ROUND(AVG(CASE WHEN a.stage > 0 THEN a.stage END)::numeric, 2) as avg_stage,
        ROUND(AVG(a.rainfall)::numeric, 2) as avg_rainfall,
        COUNT(*) as total_blocks
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
    total_blocks,
    (avg_stage - LAG(avg_stage) OVER (ORDER BY year)) as stage_change
FROM yearly_data
ORDER BY year

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CRITICAL RULES (MUST FOLLOW):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. ALWAYS use proper JOINs to get human-readable block/district/state names
2. For STATE name matching: Use UPPER(s.state_name) = UPPER('...')
3. For BLOCK/DISTRICT name matching: Use LOWER(b.block_name) ILIKE '%...%'
4. Year filtering:
   - Single block/summary: AND a.year = '2024-2025' (most complete)
   - Trend queries: NO year filter OR filter to specific range like a.year >= '2021-2022'
   - User specified year: Use their year (validate it exists first)
5. For LIST queries: Add LIMIT 50 to prevent overload

⚠️⚠️⚠️ CATEGORY VALUES (CRITICAL - USE EXACT VALUES):
- 'safe' (not 'Safe')
- 'semi_critical' (not 'Semi-Critical', underscore not hyphen)
- 'critical' (not 'Critical')
- 'over_exploited' (not 'Over-Exploited', underscore not hyphen)
- 'salinity' (special case, stage = -100000)
- 'Hilly Area' (special case)

Example category filter:
WHERE LOWER(a.category) = 'over_exploited'  ✅ CORRECT
WHERE a.category = 'Over-Exploited'         ❌ WRONG

6. For stage averages: Use AVG(CASE WHEN a.stage > 0 THEN a.stage ELSE NULL END) to exclude salinity blocks
7. Return ONLY valid PostgreSQL SQL - no markdown, no explanations, no comments
8. The SQL must be executable as-is
9. For STATE/DISTRICT level queries: USE GROUP BY and aggregate functions (COUNT, AVG, SUM)
10. Use ROUND(value::numeric, 2) for decimal formatting

NOW GENERATE THE SQL QUERY FOR THE USER'S REQUEST:`

	// Use LLMService.GenerateSQL which routes to local Ollama (SQLCoder)
	sqlText, err := s.llm.GenerateSQL(message, prompt)
	if err != nil {
		return "", fmt.Errorf("AI SQL generation failed: %w", err)
	}
	
	// Basic validation - must contain SELECT
	if !strings.Contains(strings.ToUpper(sqlText), "SELECT") {
		return "", fmt.Errorf("invalid SQL generated: %s", sqlText)
	}

	return sqlText, nil
}

func (s *NLPService) analyzeQueryWithAI(message string) (*IntentAnalysis, error) {
	if s.llm == nil {
		return nil, fmt.Errorf("LLM service not available")
	}

	ctx := context.Background()
	prompt := fmt.Sprintf(`You are an expert AI assistant for India's INGRES Groundwater Data System.

DATABASE SCHEMA CONTEXT:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HIERARCHY: State → District → Block
BLOCKS IN 2024-2025: 5,796 | DATA AVAILABILITY: 7 years (2012-2025)

1. STATES TABLE:
   - state_name (VARCHAR): ALL UPPERCASE like "PUNJAB", "HARYANA", "RAJASTHAN"

2. DISTRICTS TABLE:
   - district_name (VARCHAR): Mixed case

3. BLOCKS TABLE:
   - block_name (VARCHAR): Mixed case (some UPPERCASE, some Title Case)

4. ASSESSMENTS_SUMMARY TABLE (Main groundwater data):
   - year (VARCHAR): 7 years available: '2012-2013', '2016-2017', '2019-2020', 
                     '2021-2022', '2022-2023', '2023-2024', '2024-2025'
   - Block coverage varies by year (see table above)
   - rainfall (FLOAT): Rainfall in mm (range: 0-3000)
   - total_recharge (FLOAT): Total groundwater recharge in MCM
   - total_extraction (FLOAT): Total groundwater extraction in MCM
   - stage (FLOAT): Stage percentage (can be negative -100000 for salinity)
   - availability (FLOAT): Available groundwater in MCM
   
   DEFAULT YEAR LOGIC:
   - Single block query: Use '2024-2025' (most complete)
   - Trend query: Use 2021-2025 period (4 years, best coverage)
   - Specific location: Check all available years for that location in MCM
   
⚠️⚠️⚠️ CRITICAL - ACTUAL CATEGORY VALUES IN DATABASE (USE EXACTLY AS SHOWN):
   - 'safe' (lowercase)
   - 'semi_critical' (lowercase, underscore NOT hyphen)
   - 'critical' (lowercase)
   - 'over_exploited' (lowercase, underscore NOT hyphen)
   - 'salinity' (special case, stage = -100000)
   - 'Hilly Area' (mixed case, special)
   - 'none' (no category)

5. RECHARGE_BREAKDOWN TABLE:
   - source values: 'rainfall', 'canal', 'gw_irrigation', 'surface_irrigation', 
                    'water_body', 'artificial_structure', 'sewage', 'pipeline', 
                    'streamRecharge', 'agriculture', 'Total'

6. EXTRACTION_BREAKDOWN TABLE:
   - source values: 'agriculture', 'domestic', 'industry', 'Total'

USER QUERY: "%s"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INTENT CLASSIFICATION RULES:
═══════════════════════════════════════════════════════════

1. SUMMARY
   → When: User asks for status, info, data about ONE specific location
   → Keywords: "status", "show me", "tell me about", "what is", "information on", "how is"
   → ⚠️ DO NOT USE for queries containing: "risk", "sector", "sustainability", "vulnerability", "threat"
   → Examples:
      "What is the status of Ludhiana?" → SUMMARY
      "Show me groundwater data for Chandigarh" → SUMMARY
   → Counter-examples (NOT SUMMARY):
      "Risk profile of Ludhiana" → RISK_PROFILE (use #19)
      "Sector usage for Punjab" → SECTOR_USAGE (use #20)

2. RECHARGE_BREAKDOWN
   → When: User asks about SOURCES/COMPONENTS of RECHARGE
   → Keywords: "recharge breakdown", "recharge sources", "recharge components"
   → Examples:
      "Show me the recharge breakdown for Jaisinagar" → RECHARGE_BREAKDOWN

3. EXTRACTION_BREAKDOWN
   → When: User asks about SOURCES/COMPONENTS of EXTRACTION
   → Keywords: "extraction breakdown", "sources of extraction", "extraction distribution"
   → Examples:
      "What are the sources of extraction in Chandil?" → EXTRACTION_BREAKDOWN

4. TREND
   → When: User asks for HISTORICAL data, trends OVER TIME
   → Keywords: "trend", "over time", "historical", "over years"
   → NOTE: 7 years of data available! Best coverage: 2021-2025 (4 years)
   → Examples:
      "Show me trend for Ludhiana" → TREND

5. COMPARE
   → When: User wants to COMPARE TWO OR MORE specific locations
   → Keywords: "compare", "vs", "versus", "between"
   → Examples:
      "Compare Ludhiana and Bathinda" → COMPARE

6. LIST_BLOCKS
   → When: User wants to FILTER/LIST blocks by CRITERIA
   → Keywords: "list", "show blocks", "which blocks", "blocks where"
   → Examples:
      "List all blocks where rainfall is less than 500 mm" → LIST_BLOCKS
      "Show me over-exploited blocks" → LIST_BLOCKS

7. LIST_DISTRICTS
   → When: User explicitly asks for DISTRICTS in a state
   → Keywords: "districts", "show districts", "list districts", "districts in"
   → Examples:
      "Show me all districts in Punjab" → LIST_DISTRICTS
      "districts in rajasthan" → LIST_DISTRICTS
      "list districts of haryana" → LIST_DISTRICTS

8. LIST_STATES
   → When: User explicitly asks for STATES list
   → Examples:
      "Show me all states" → LIST_STATES

9. MAP_CATEGORY
   → When: User explicitly wants MAP visualization
   → Keywords: "map", "show on map"
   → Examples:
      "Map all safe blocks" → MAP_CATEGORY

10. TOP_RANKING
   → When: User wants TOP N or WORST/BEST performers
   → Keywords: "top", "worst", "best", "ranking", "highest", "lowest", "most", "least"
   → EXTRACT NUMBER: "top 5" → threshold: 5, "top 10" → threshold: 10, "worst 3" → threshold: 3
   → Examples:
      "Top 10 over-exploited blocks" → TOP_RANKING (threshold: 10)
      "Top 5 safe states" → TOP_RANKING (threshold: 5)
      "Which states have worst groundwater?" → TOP_RANKING (threshold: 10 default)

11. CATEGORY_DISTRIBUTION
   → When: User asks for DISTRIBUTION or COUNT by CATEGORY
   → Keywords: "distribution", "how many", "breakdown by category", "count"
   → Examples:
      "Show me category distribution for Punjab" → CATEGORY_DISTRIBUTION
      "How many blocks are over-exploited?" → CATEGORY_DISTRIBUTION

12. DEFICIT_ANALYSIS
   → When: User asks about WATER DEFICIT, GAP, or BALANCE
   → Keywords: "deficit", "gap", "imbalance", "shortage", "water balance"
   → Examples:
      "Which blocks have highest water deficit?" → DEFICIT_ANALYSIS
      "Show extraction vs recharge gap" → DEFICIT_ANALYSIS

13. CHANGE_ANALYSIS
   → When: User asks about CHANGE OVER TIME, IMPROVEMENT, or DECLINE
   → Keywords: "change", "improved", "worsened", "decline", "growth", "over years"
   → Examples:
      "How has Punjab changed over 4 years?" → CHANGE_ANALYSIS
      "Show me year-over-year improvement" → CHANGE_ANALYSIS

14. YEARLY_COMPARISON
   → When: User wants to compare SAME LOCATION across DIFFERENT YEARS
   → Keywords: "year comparison", "2023 vs 2024", "compare years", "year over year"
   → Examples:
      "Compare Punjab 2023 vs 2024" → YEARLY_COMPARISON
      "Show me Ludhiana in 2022 and 2024" → YEARLY_COMPARISON

15. CATEGORY_SUMMARY
   → When: User wants PIE CHART showing category distribution
   → Keywords: "category breakdown", "how many safe", "category split", "category pie"
   → Examples:
      "Show category breakdown for Rajasthan" → CATEGORY_SUMMARY
      "How many safe vs critical blocks in Punjab?" → CATEGORY_SUMMARY

16. CRITICAL_ALERTS
   → When: User wants to see URGENT/CRITICAL blocks needing attention
   → Keywords: "critical blocks", "urgent", "need attention", "alerts", "warning"
   → Examples:
      "Show critical alerts for Punjab" → CRITICAL_ALERTS
      "Which blocks need urgent attention?" → CRITICAL_ALERTS

17. WATER_BALANCE
   → When: User wants RECHARGE vs EXTRACTION balance analysis
   → Keywords: "water balance", "recharge vs extraction", "balance analysis", "sustainability"
   → Examples:
      "Show water balance for Haryana" → WATER_BALANCE
      "Is Punjab sustainable? Show recharge vs extraction" → WATER_BALANCE

18. STATE_OVERVIEW
   → When: User wants COMPREHENSIVE dashboard for entire state
   → Keywords: "overview", "dashboard", "complete analysis", "full report"
   → Examples:
      "Give me complete overview of Punjab" → STATE_OVERVIEW
      "Show full dashboard for Rajasthan" → STATE_OVERVIEW

19. RISK_PROFILE
   → When: User asks about RISK, SUSTAINABILITY, THREAT, or VULNERABILITY
   → Keywords: "risk", "sustainability", "threat", "vulnerability", "risk profile", "future outlook"
   → Examples:
      "Risk profile of Ludhiana" → RISK_PROFILE
      "Sustainability analysis for Punjab" → RISK_PROFILE

20. SECTOR_USAGE
   → When: User asks about USAGE BY SECTOR (Agriculture, Domestic, Industry)
   → Keywords: "sector usage", "sector breakdown", "where is water used", "usage by sector", "consumption pattern"
   → Examples:
      "Sector usage for Haryana" → SECTOR_USAGE
      "Where is water used in Jaipur?" → SECTOR_USAGE

ENTITY EXTRACTION RULES:
═══════════════════════════════════════════════════════════

LOCATIONS:
- Extract ONLY proper nouns that are GEOGRAPHIC location names
- Common blocks: JAISINAGAR, LUDHIANA, BATHINDA, CHANDIGARH, CHANDIL
- Common states: Punjab, Haryana, Rajasthan, Gujarat, Delhi, Maharashtra
- Compound names: "Himachal Pradesh", "Uttar Pradesh", "Madhya Pradesh"
- IGNORE: verbs, adjectives, metric names, numbers, units

⚠️ CRITICAL: For COMPARE intent, SPLIT multiple locations into SEPARATE array elements:
  "rajasthan and andhra pradesh" → ["rajasthan", "andhra pradesh"]
  "compare ludhiana vs bathinda" → ["ludhiana", "bathinda"]
  "punjab versus haryana" → ["punjab", "haryana"]
  Split on: "and", "vs", "versus", ","

YEAR:
- Format: "YYYY-YYYY" (e.g., "2024-2025")
- Available: 2012-2013, 2016-2017, 2019-2020, 2021-2022, 2022-2023, 2023-2024, 2024-2025
- Default for single query: "2024-2025" (most complete data)
- Default for trend query: 2021-2025 period (best multi-year coverage)

CATEGORY (USE EXACT DATABASE VALUES):
- User says "safe" → category: "safe"
- User says "over-exploited"/"overexploited" → category: "over_exploited"
- User says "semi-critical"/"semi critical" → category: "semi_critical"
- User says "critical" → category: "critical"

METRIC:
- "rainfall" → rainfall
- "stage" → stage
- "extraction" → total_extraction
- "recharge" → total_recharge

THRESHOLD & OPERATOR:
- "less than 500" → threshold: 500, operator: "<"
- "greater than 90" → threshold: 90, operator: ">"
- "top 5" → threshold: 5 (for TOP_RANKING intent)
- "top 10" → threshold: 10 (for TOP_RANKING intent)
- "worst 3" → threshold: 3 (for TOP_RANKING intent)
- Default for TOP_RANKING: threshold: 10

OUTPUT FORMAT:
Return ONLY valid JSON (no markdown, no code blocks):
{
  "intent": "SUMMARY|TREND|COMPARE|RECHARGE_BREAKDOWN|EXTRACTION_BREAKDOWN|LIST_BLOCKS|LIST_DISTRICTS|LIST_STATES|MAP_CATEGORY|TOP_RANKING|CATEGORY_DISTRIBUTION|DEFICIT_ANALYSIS|CHANGE_ANALYSIS|YEARLY_COMPARISON|CATEGORY_SUMMARY|CRITICAL_ALERTS|WATER_BALANCE|STATE_OVERVIEW|RISK_PROFILE|SECTOR_USAGE",
  "locations": ["location names"],
  "year": "2024-2025",
  "category": "safe|semi_critical|critical|over_exploited or empty",
  "metric": "rainfall|stage|extraction|recharge or empty",
  "threshold": 0.0,
  "operator": ">|<|= or empty",
  "confidence": 0.8
}

ANALYZE THE QUERY NOW AND RETURN JSON:`, message)

	fmt.Printf("AI QUERY ANALYSIS: Sending prompt to Ollama...\n")
	responseText, err := s.llm.ollamaClient.Generate(ctx, prompt)
	if err != nil {
		fmt.Printf("AI QUERY ANALYSIS ERROR: %v\n", err)
		return nil, err
	}

	fmt.Printf("AI RAW RESPONSE: %s\n", responseText)
	
	// Clean up response - remove markdown code blocks if present
	responseText = strings.TrimPrefix(responseText, "```json")
	responseText = strings.TrimPrefix(responseText, "```")
	responseText = strings.TrimSuffix(responseText, "```")
	responseText = strings.TrimSpace(responseText)

	var analysis IntentAnalysis
	if err := json.Unmarshal([]byte(responseText), &analysis); err != nil {
		fmt.Printf("AI JSON PARSE ERROR: %v - Response was: %s\n", err, responseText)
		return nil, fmt.Errorf("failed to parse AI response: %w", err)
	}

	fmt.Printf("AI PARSED ANALYSIS: Intent=%s, Locations=%v, Category=%s, Metric=%s, Threshold=%.2f, Operator=%s\n",
		analysis.Intent, analysis.Locations, analysis.Category, analysis.Metric, analysis.Threshold, analysis.Operator)

	// Post-process: Clean and validate extracted locations
	analysis.Locations = s.cleanLocations(analysis.Locations)

	return &analysis, nil
}

// processLocations handles the common case where AI returns space-separated locations in a single string
// e.g., ["ludhiana bathinda"] -> ["Ludhiana", "Bathinda"]
func (s *NLPService) processLocations(locations []string) []string {
	// Known compound state names that should NOT be split
	compoundNames := map[string]bool{
		"uttar pradesh": true, "himachal pradesh": true, "madhya pradesh": true,
		"andhra pradesh": true, "arunachal pradesh": true, "west bengal": true,
		"tamil nadu": true, "jammu and kashmir": true, "jammu kashmir": true,
	}
	
	// Stop words to filter out
	stopWords := map[string]bool{
		"are": true, "is": true, "the": true, "of": true, "in": true, "for": true, "and": true,
		"show": true, "tell": true, "what": true, "where": true, "how": true, "why": true,
		"sources": true, "extraction": true, "recharge": true, "discharge": true, "breakdown": true,
		"rainfall": true, "stage": true, "category": true, "blocks": true, "districts": true, "states": true,
		"less": true, "than": true, "greater": true, "more": true, "mm": true, "mcm": true,
		"water": true, "groundwater": true, "data": true, "status": true, "summary": true,
		"trend": true, "compare": true, "vs": true, "versus": true, "list": true, "all": true,
		"me": true, "about": true, "give": true, "from": true, "to": true, "with": true,
		"risk": true, "profile": true, "sector": true, "usage": true, "analysis": true, "sustainability": true,
	}
	
	processed := []string{}
	
	for _, loc := range locations {
		loc = strings.TrimSpace(loc)
		if loc == "" {
			continue
		}
		
		locLower := strings.ToLower(loc)
		
		// Check if it's a compound name
		if compoundNames[locLower] {
			processed = append(processed, strings.Title(locLower))
			continue
		}
		
		// Check if it contains numbers or operators (likely not a location)
		if regexp.MustCompile(`\d+|<|>|=`).MatchString(loc) {
			continue
		}
		
		// If the location contains spaces, it might be multiple locations
		words := strings.Fields(loc)
		if len(words) > 1 {
			// Check if it could be a known compound name
			isCompound := false
			for compound := range compoundNames {
				if strings.Contains(locLower, compound) {
					processed = append(processed, strings.Title(compound))
					isCompound = true
					break
				}
			}
			
			if !isCompound {
				// Split and process each word as a potential location
				for _, word := range words {
					wordLower := strings.ToLower(word)
					if !stopWords[wordLower] && len(word) > 2 {
						processed = append(processed, strings.Title(wordLower))
					}
				}
			}
		} else {
			// Single word - check if it's a stop word
			if !stopWords[locLower] && len(loc) > 2 {
				processed = append(processed, strings.Title(locLower))
			}
		}
	}
	
	// Remove duplicates while preserving order
	seen := make(map[string]bool)
	unique := []string{}
	for _, loc := range processed {
		if !seen[loc] {
			seen[loc] = true
			unique = append(unique, loc)
		}
	}
	
	return unique
}

// cleanLocations is deprecated - use processLocations instead
func (s *NLPService) cleanLocations(locations []string) []string {
	return s.processLocations(locations)
}

func (s *NLPService) mapIntent(aiIntent string) Intent {
	switch strings.ToUpper(aiIntent) {
	case "SUMMARY":
		return IntentSummary
	case "TREND":
		return IntentTrend
	case "COMPARE":
		return IntentCompare
	case "RECHARGE_BREAKDOWN":
		return IntentRechargeBreakdown
	case "EXTRACTION_BREAKDOWN":
		return IntentExtractionBreakdown
	case "DISCHARGE_BREAKDOWN":
		return IntentDischargeBreakdown
	case "LIST_BLOCKS":
		return IntentListBlocks
	case "LIST_DISTRICTS":
		return IntentListDistricts
	case "LIST_STATES":
		return IntentListStates
	case "MAP_CATEGORY":
		return IntentMapCategory
	case "TOP_RANKING", "TOP_N_RANKING":
		return IntentTopRanking
	case "CATEGORY_DISTRIBUTION":
		return IntentCategoryDistribution
	case "DEFICIT_ANALYSIS":
		return IntentDeficitAnalysis
	case "CHANGE_ANALYSIS":
		return IntentChangeAnalysis
	case "YEARLY_COMPARISON":
		return IntentYearlyComparison
	case "CATEGORY_SUMMARY":
		return IntentCategorySummary
	case "CRITICAL_ALERTS":
		return IntentCriticalAlerts
	case "WATER_BALANCE":
		return IntentWaterBalance
	case "STATE_OVERVIEW":
		return IntentStateOverview
	default:
		return IntentUnknown
	}
}

func (s *NLPService) determineIntent(msg string) Intent {
	// New visualization intents (check first for priority)
	if strings.Contains(msg, "risk") || strings.Contains(msg, "sustainability") || strings.Contains(msg, "vulnerability") || strings.Contains(msg, "threat") {
		return IntentRiskProfile
	}
	if strings.Contains(msg, "sector") && (strings.Contains(msg, "usage") || strings.Contains(msg, "breakdown") || strings.Contains(msg, "consumption")) {
		return IntentSectorUsage
	}
	
	if strings.Contains(msg, "compare") || strings.Contains(msg, "vs") {
		return IntentCompare
	}
	if strings.Contains(msg, "trend") || strings.Contains(msg, "history") || strings.Contains(msg, "over time") {
		return IntentTrend
	}
	if strings.Contains(msg, "map") || strings.Contains(msg, "show") && strings.Contains(msg, "blocks") {
		return IntentMapCategory
	}
	if strings.Contains(msg, "recharge") && (strings.Contains(msg, "breakdown") || strings.Contains(msg, "source")) {
		return IntentRechargeBreakdown
	}
	if strings.Contains(msg, "extraction") && (strings.Contains(msg, "breakdown") || strings.Contains(msg, "source") || strings.Contains(msg, "usage")) {
		return IntentExtractionBreakdown
	}
	if strings.Contains(msg, "discharge") && (strings.Contains(msg, "breakdown") || strings.Contains(msg, "source")) {
		return IntentDischargeBreakdown
	}
	if (strings.Contains(msg, "top") || strings.Contains(msg, "worst") || strings.Contains(msg, "best") || strings.Contains(msg, "ranking")) && (strings.Contains(msg, "blocks") || strings.Contains(msg, "districts") || strings.Contains(msg, "states")) {
		return IntentTopRanking
	}
	if strings.Contains(msg, "distribution") || (strings.Contains(msg, "how many") && strings.Contains(msg, "category")) || strings.Contains(msg, "breakdown") && !strings.Contains(msg, "recharge") && !strings.Contains(msg, "extraction") {
		return IntentCategoryDistribution
	}
	if strings.Contains(msg, "deficit") || strings.Contains(msg, "gap") || (strings.Contains(msg, "extraction") && strings.Contains(msg, "recharge") && (strings.Contains(msg, "vs") || strings.Contains(msg, "balance"))) {
		return IntentDeficitAnalysis
	}
	if (strings.Contains(msg, "change") || strings.Contains(msg, "improved") || strings.Contains(msg, "worsened")) && (strings.Contains(msg, "over") || strings.Contains(msg, "years") || strings.Contains(msg, "year")) {
		return IntentChangeAnalysis
	}
	if strings.Contains(msg, "status") || strings.Contains(msg, "summary") || strings.Contains(msg, "about") || strings.Contains(msg, "what is") {
		return IntentSummary
	}
	
	// Default to summary if a location is mentioned but no specific intent
	return IntentSummary
}

func (s *NLPService) extractEntities(msg string) Entities {
	var e Entities

	// Extract Year
	yearRegex := regexp.MustCompile(`\b(20\d{2})\b`)
	years := yearRegex.FindAllString(msg, -1)
	if len(years) > 0 {
		e.Year = years[0] + "-" + incrementYear(years[0]) // Convert 2024 to 2024-2025 format approximation
		if len(years) >= 2 {
			e.StartYear = years[0] + "-" + incrementYear(years[0])
			e.EndYear = years[1] + "-" + incrementYear(years[1])
		} else {
			// Only 1 year mentioned, use it as end year or single point?
			// For trend, we need a range. Let's default to 5 years before.
			e.EndYear = e.Year
			// Simple logic: parse year, subtract 5. 
			// But without strconv, let's just use defaults if not range.
			e.StartYear = "2012-2013" // Fallback to earliest available year
		}
	} else {
		// Default year
		e.Year = "2024-2025"
		e.StartYear = "2012-2013" // Default trend range (earliest available year)
		e.EndYear = "2024-2025"
	}

	// Extract Category - USE DATABASE VALUES (lowercase with underscores)
	if strings.Contains(msg, "over-exploited") || strings.Contains(msg, "over exploited") || strings.Contains(msg, "overexploited") {
		e.Category = "over_exploited"
	} else if strings.Contains(msg, "semi-critical") || strings.Contains(msg, "semi critical") || strings.Contains(msg, "semicritical") {
		e.Category = "semi_critical"
	} else if strings.Contains(msg, "critical") && !strings.Contains(msg, "semi") {
		e.Category = "critical"
	} else if strings.Contains(msg, "safe") {
		e.Category = "safe"
	}

	// Extract Locations (Simple heuristic: words starting with capital letters in original message, 
	// but here we have lowercased msg. 
	// Better approach: Look for words that are NOT keywords.
	// For this MVP, we will rely on the user typing the name, and we'll try to match against known blocks in DB later.
	// Here we just extract potential candidates.
	// Actually, let's just extract everything that looks like a name.
	// Since we don't have the full list of blocks here, we will pass the whole message or specific parts to the ChatService
	// which can use the DB to fuzzy match.
	// BUT, the interface requires returning Entities.
	// Let's try to extract proper nouns from the *original* message if we had it, but we lowercased it.
	// Let's change ParseMessage signature to take original message? No, let's just use a simple stop-word filter on the lowercased msg.
	
	words := strings.Fields(msg)
	stopWords := map[string]bool{
		"compare": true, "trend": true, "map": true, "show": true, "what": true, "is": true, "the": true,
		"of": true, "in": true, "for": true, "and": true, "vs": true, "breakdown": true, "recharge": true,
		"extraction": true, "discharge": true, "groundwater": true, "status": true, "summary": true,
		"about": true, "year": true, "years": true, "from": true, "to": true, "district": true, "block": true,
		"state": true, "data": true, "give": true, "me": true, "tell": true, "list": true, "all": true, "blocks": true,
		// New visualization keywords
		"risk": true, "profile": true, "sector": true, "usage": true, "sustainability": true, "vulnerability": true,
		"threat": true, "analysis": true, "consumption": true,
	}
	
	var potentialLocations []string
	for _, w := range words {
		cleanWord := strings.Trim(w, "?!,.")
		if !stopWords[cleanWord] && !yearRegex.MatchString(cleanWord) {
			potentialLocations = append(potentialLocations, cleanWord)
		}
	}
	e.Locations = potentialLocations

	return e
}

func incrementYear(y string) string {
	if len(y) != 4 {
		return "2025"
	}
	yearInt, err := strconv.Atoi(y)
	if err != nil {
		return "2025"
	}
	return strconv.Itoa(yearInt + 1)
}
