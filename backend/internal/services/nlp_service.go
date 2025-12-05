package services

import (
	"context"
	"encoding/json"
	"fmt"
	"regexp"
	"strconv"
	"strings"

	"github.com/google/generative-ai-go/genai"
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
	IntentUnknown             Intent = "UNKNOWN"
)

type Entities struct {
	Locations []string
	Year      string
	StartYear string
	EndYear   string
	Metric    string
	Category  string
	Threshold float64
	Operator  string // ">", "<", "=", etc.
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
	// Use AI to analyze the query
	analysis, err := s.analyzeQueryWithAI(message)
	if err != nil {
		// Fallback to rule-based
		msg := strings.ToLower(message)
		intent := s.determineIntent(msg)
		entities := s.extractEntities(msg)
		return intent, entities, ""
	}

	// Convert AI analysis to our types
	intent := s.mapIntent(analysis.Intent)
	
	// Process locations - split if they contain spaces and are not compound names
	processedLocations := s.processLocations(analysis.Locations)
	
	entities := Entities{
		Locations: processedLocations,
		Year:      analysis.Year,
		Category:  analysis.Category,
		Metric:    analysis.Metric,
		Threshold: analysis.Threshold,
		Operator:  analysis.Operator,
	}

	// Set defaults
	if entities.Year == "" {
		entities.Year = "2024-2025"
	}
	entities.StartYear = "2012-2013"
	entities.EndYear = entities.Year

	// Generate dynamic SQL for complex queries
	sqlQuery := ""
	if s.shouldGenerateDynamicSQL(intent, entities, message) {
		sqlQuery, err = s.generateDynamicSQL(message, intent, entities)
		if err != nil {
			fmt.Printf("ERROR: Dynamic SQL generation failed: %v\n", err)
			sqlQuery = "" // Fallback to hardcoded handlers
		} else {
			fmt.Printf("DEBUG: Generated Dynamic SQL: %s\n", sqlQuery)
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
	
	// Check for filter keywords
	hasFilter := strings.Contains(msgLower, "less than") ||
		strings.Contains(msgLower, "greater than") ||
		strings.Contains(msgLower, "more than") ||
		strings.Contains(msgLower, "above") ||
		strings.Contains(msgLower, "below") ||
		strings.Contains(msgLower, "over-exploited") ||
		strings.Contains(msgLower, "critical") ||
		strings.Contains(msgLower, "safe") ||
		entities.Threshold > 0 ||
		entities.Operator != ""
	
	// Enable dynamic SQL for list queries with filters or specific intents
	if intent == IntentListBlocks && hasFilter {
		return true
	}
	
	// Also enable for trends and comparisons where we want full data
	// if intent == IntentTrend || intent == IntentCompare {
	// 	return true
	// }
	
	return false
}

// generateDynamicSQL creates a SQL query using AI based on user intent
func (s *NLPService) generateDynamicSQL(message string, intent Intent, entities Entities) (string, error) {
	ctx := context.Background()
	
	// Build comprehensive database schema context with sample data
	schema := `
╔══════════════════════════════════════════════════════════════════════════════╗
║                    INDIA GROUNDWATER DATABASE - FULL SCHEMA                  ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  Database: PostgreSQL 15 | Schema: public | Data: INGRES Groundwater System  ║
╚══════════════════════════════════════════════════════════════════════════════╝

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TABLE 1: states
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CREATE TABLE states (
    state_uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    state_name VARCHAR(100) NOT NULL UNIQUE
);

SAMPLE DATA (state_name values are UPPERCASE):
| state_uuid                           | state_name          |
|--------------------------------------|---------------------|
| 550e8400-e29b-41d4-a716-446655440001 | PUNJAB              |
| 550e8400-e29b-41d4-a716-446655440002 | HARYANA             |
| 550e8400-e29b-41d4-a716-446655440003 | RAJASTHAN           |
| 550e8400-e29b-41d4-a716-446655440004 | GUJARAT             |
| 550e8400-e29b-41d4-a716-446655440005 | MAHARASHTRA         |
| 550e8400-e29b-41d4-a716-446655440006 | UTTAR PRADESH       |
| 550e8400-e29b-41d4-a716-446655440007 | MADHYA PRADESH      |
| 550e8400-e29b-41d4-a716-446655440008 | JHARKHAND           |
| 550e8400-e29b-41d4-a716-446655440009 | TAMIL NADU          |
| 550e8400-e29b-41d4-a716-446655440010 | KARNATAKA           |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TABLE 2: districts
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CREATE TABLE districts (
    district_uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    district_name VARCHAR(100) NOT NULL,
    state_uuid UUID NOT NULL REFERENCES states(state_uuid)
);

SAMPLE DATA (district_name values are UPPERCASE):
| district_uuid                        | district_name | state_name (via JOIN)  |
|--------------------------------------|---------------|------------------------|
| 660e8400-e29b-41d4-a716-446655440001 | LUDHIANA      | PUNJAB                 |
| 660e8400-e29b-41d4-a716-446655440002 | BATHINDA      | PUNJAB                 |
| 660e8400-e29b-41d4-a716-446655440003 | AMRITSAR      | PUNJAB                 |
| 660e8400-e29b-41d4-a716-446655440004 | JALANDHAR     | PUNJAB                 |
| 660e8400-e29b-41d4-a716-446655440005 | PATIALA       | PUNJAB                 |
| 660e8400-e29b-41d4-a716-446655440006 | CHANDIGARH    | CHANDIGARH (UT)        |
| 660e8400-e29b-41d4-a716-446655440007 | JAIPUR        | RAJASTHAN              |
| 660e8400-e29b-41d4-a716-446655440008 | JODHPUR       | RAJASTHAN              |
| 660e8400-e29b-41d4-a716-446655440009 | GURGAON       | HARYANA                |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TABLE 3: blocks (SMALLEST administrative unit - this is where groundwater data is stored)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CREATE TABLE blocks (
    block_uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    block_name VARCHAR(100) NOT NULL,
    district_uuid UUID NOT NULL REFERENCES districts(district_uuid),
    state_uuid UUID NOT NULL REFERENCES states(state_uuid),
    geometry GEOMETRY(MultiPolygon, 4326) -- PostGIS geometry, can be NULL
);

SAMPLE DATA (block_name values are UPPERCASE, ~7000+ blocks in India):
| block_uuid                           | block_name    | district_name | state_name |
|--------------------------------------|---------------|---------------|------------|
| 770e8400-e29b-41d4-a716-446655440001 | JAISINAGAR    | LUDHIANA      | PUNJAB     |
| 770e8400-e29b-41d4-a716-446655440002 | LUDHIANA      | LUDHIANA      | PUNJAB     |
| 770e8400-e29b-41d4-a716-446655440003 | MACHHIWARA    | LUDHIANA      | PUNJAB     |
| 770e8400-e29b-41d4-a716-446655440004 | BATHINDA      | BATHINDA      | PUNJAB     |
| 770e8400-e29b-41d4-a716-446655440005 | SANGAT        | BATHINDA      | PUNJAB     |
| 770e8400-e29b-41d4-a716-446655440006 | CHANDIL       | SERAIKELA     | JHARKHAND  |
| 770e8400-e29b-41d4-a716-446655440007 | RAJPURA       | PATIALA       | PUNJAB     |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TABLE 4: assessments_summary (MAIN GROUNDWATER DATA TABLE)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CREATE TABLE assessments_summary (
    assessment_id SERIAL PRIMARY KEY,
    block_uuid UUID NOT NULL REFERENCES blocks(block_uuid),
    year VARCHAR(10) NOT NULL,  -- Format: "2024-2025", "2023-2024"
    rainfall FLOAT,             -- Annual rainfall in mm (range: 50-3000)
    total_recharge FLOAT,       -- Groundwater recharge in MCM (million cubic meters)
    total_discharge FLOAT,      -- Natural discharge in MCM
    total_extractable FLOAT,    -- Extractable groundwater in MCM
    total_extraction FLOAT,     -- Actual extraction in MCM
    category VARCHAR(20),       -- "Safe", "Semi-Critical", "Critical", "Over-Exploited"
    stage FLOAT,                -- Extraction/Recharge ratio as percentage (0-300%)
    availability FLOAT,         -- Available groundwater for future use in MCM
    raw JSONB,                  -- Raw assessment data
    created_at TIMESTAMP DEFAULT NOW()
);

YEAR VALUES (available years):
'2012-2013', '2016-2017', '2019-2020', '2021-2022', '2022-2023', '2023-2024', '2024-2025'

NOTE: Data exists ONLY for these 7 years! Years 2013-2015, 2017-2018, 2020-2021 DO NOT EXIST!

CATEGORY VALUES (exactly these 4 values):
'Safe'           -- Stage < 70%
'Semi-Critical'  -- Stage 70-90%
'Critical'       -- Stage 90-100%
'Over-Exploited' -- Stage > 100%

SAMPLE DATA:
| assessment_id | block_name | year      | rainfall | total_recharge | total_extraction | category       | stage  |
|---------------|------------|-----------|----------|----------------|------------------|----------------|--------|
| 1             | JAISINAGAR | 2024-2025 | 485.3    | 12.45          | 15.67            | Over-Exploited | 125.8  |
| 2             | JAISINAGAR | 2023-2024 | 512.1    | 13.21          | 14.89            | Over-Exploited | 112.7  |
| 3             | LUDHIANA   | 2024-2025 | 623.7    | 18.92          | 22.34            | Over-Exploited | 118.1  |
| 4             | BATHINDA   | 2024-2025 | 342.5    | 8.76           | 6.12             | Safe           | 69.9   |
| 5             | CHANDIL    | 2024-2025 | 1245.2   | 45.67          | 23.45            | Safe           | 51.3   |

VALUE RANGES:
- rainfall: 50-3000 mm (low in Rajasthan ~200, high in Jharkhand ~1500)
- total_recharge: 0.5-100 MCM
- total_extraction: 0.5-150 MCM
- stage: 10-300% (>100% means over-exploited)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TABLE 5: assessments_recharge_breakdown (Breakdown of recharge sources)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CREATE TABLE assessments_recharge_breakdown (
    id SERIAL PRIMARY KEY,
    assessment_id INT NOT NULL REFERENCES assessments_summary(assessment_id),
    source VARCHAR(50) NOT NULL,  -- "Rainfall Recharge", "Canal Seepage", "Return Flow", "Total"
    command FLOAT,                -- Command area value in MCM
    non_command FLOAT,            -- Non-command area value in MCM
    total FLOAT                   -- Total value in MCM
);

SOURCE VALUES:
'Rainfall Recharge'        -- Recharge from rainfall infiltration
'Canal Seepage'            -- Recharge from canal water seepage
'Return Flow from Irrigation' -- Recharge from irrigation return flow
'Recharge from Tanks'      -- Recharge from tanks/ponds
'Recharge from Water Bodies' -- Recharge from rivers/lakes
'Total'                    -- Sum of all sources

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TABLE 6: assessments_extraction_breakdown (Breakdown of extraction by sector)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CREATE TABLE assessments_extraction_breakdown (
    id SERIAL PRIMARY KEY,
    assessment_id INT NOT NULL REFERENCES assessments_summary(assessment_id),
    source VARCHAR(50) NOT NULL,  -- "Agriculture", "Domestic", "Industry", "Total"
    command FLOAT,
    non_command FLOAT,
    total FLOAT
);

SOURCE VALUES:
'Irrigation'     -- Agricultural/irrigation extraction
'Domestic'       -- Domestic/household extraction
'Industrial'     -- Industrial extraction
'Total'          -- Sum of all extraction sources

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TABLE 7: assessments_discharge_breakdown (Natural discharge breakdown)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CREATE TABLE assessments_discharge_breakdown (
    id SERIAL PRIMARY KEY,
    assessment_id INT NOT NULL REFERENCES assessments_summary(assessment_id),
    source VARCHAR(50) NOT NULL,
    command FLOAT,
    non_command FLOAT,
    total FLOAT
);

SOURCE VALUES:
'Base Flow'                -- Natural discharge to rivers
'Evapotranspiration'       -- Loss through evaporation/transpiration
'Total'                    -- Sum of all discharge

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IMPORTANT JOIN PATTERNS (Use these exact patterns!)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Get block data with location names:
SELECT b.block_name, d.district_name, s.state_name, a.*
FROM assessments_summary a
JOIN blocks b ON a.block_uuid = b.block_uuid
JOIN districts d ON b.district_uuid = d.district_uuid
JOIN states s ON b.state_uuid = s.state_uuid

-- Filter by block name (case-insensitive):
WHERE LOWER(b.block_name) = LOWER('jaisinagar')

-- Filter by district name:
WHERE LOWER(d.district_name) = LOWER('ludhiana')

-- Filter by state name:
WHERE LOWER(s.state_name) = LOWER('punjab')

-- Get recharge breakdown with block name:
SELECT b.block_name, arb.*
FROM assessments_recharge_breakdown arb
JOIN assessments_summary a ON arb.assessment_id = a.assessment_id
JOIN blocks b ON a.block_uuid = b.block_uuid

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
WHERE LOWER(b.block_name) = LOWER('jaisinagar')
  AND a.year = '2024-2025'

🎯 EXAMPLE 2: TREND - "Show me groundwater trend for Ludhiana from 2017 to 2024"
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
WHERE LOWER(b.block_name) = LOWER('ludhiana')
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
WHERE (LOWER(b.block_name) = LOWER('ludhiana') OR LOWER(b.block_name) = LOWER('bathinda'))
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
WHERE LOWER(b.block_name) = LOWER('chandil')
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
WHERE LOWER(b.block_name) = LOWER('chandigarh')
  AND a.year = '2024-2025'

🎯 EXAMPLE 6: LIST_BLOCKS with rainfall filter - "List all blocks where rainfall is less than 500 mm"
SELECT 
    b.block_name,
    d.district_name,
    s.state_name,
    a.year,
    a.rainfall,
    a.stage,
    a.category
FROM assessments_summary a
JOIN blocks b ON a.block_uuid = b.block_uuid
JOIN districts d ON b.district_uuid = d.district_uuid
JOIN states s ON b.state_uuid = s.state_uuid
WHERE a.rainfall < 500
  AND a.year = '2024-2025'
ORDER BY a.rainfall ASC
LIMIT 50

🎯 EXAMPLE 7: LIST_BLOCKS with stage filter - "Show me over-exploited blocks"
SELECT 
    b.block_name,
    d.district_name,
    s.state_name,
    a.year,
    a.rainfall,
    a.stage,
    a.category
FROM assessments_summary a
JOIN blocks b ON a.block_uuid = b.block_uuid
JOIN districts d ON b.district_uuid = d.district_uuid
JOIN states s ON b.state_uuid = s.state_uuid
WHERE a.category = 'Over-Exploited'
  AND a.year = '2024-2025'
ORDER BY a.stage DESC
LIMIT 50

🎯 EXAMPLE 8: LIST_BLOCKS with state filter - "Show safe blocks in Punjab"
SELECT 
    b.block_name,
    d.district_name,
    a.year,
    a.rainfall,
    a.stage,
    a.category
FROM assessments_summary a
JOIN blocks b ON a.block_uuid = b.block_uuid
JOIN districts d ON b.district_uuid = d.district_uuid
JOIN states s ON b.state_uuid = s.state_uuid
WHERE LOWER(s.state_name) = LOWER('punjab')
  AND a.category = 'Safe'
  AND a.year = '2024-2025'
ORDER BY b.block_name
LIMIT 50

🎯 EXAMPLE 9: LIST_DISTRICTS - "Show me all districts in Punjab"
SELECT DISTINCT
    d.district_name,
    s.state_name
FROM districts d
JOIN states s ON d.state_uuid = s.state_uuid
WHERE LOWER(s.state_name) = LOWER('punjab')
ORDER BY d.district_name

🎯 EXAMPLE 10: LIST_STATES - "List all states"
SELECT DISTINCT state_name
FROM states
ORDER BY state_name

🎯 EXAMPLE 11: Complex filter - "Blocks in Rajasthan with stage greater than 90"
SELECT 
    b.block_name,
    d.district_name,
    a.year,
    a.rainfall,
    a.stage,
    a.category
FROM assessments_summary a
JOIN blocks b ON a.block_uuid = b.block_uuid
JOIN districts d ON b.district_uuid = d.district_uuid
JOIN states s ON b.state_uuid = s.state_uuid
WHERE LOWER(s.state_name) = LOWER('rajasthan')
  AND a.stage > 90
  AND a.year = '2024-2025'
ORDER BY a.stage DESC
LIMIT 50

🎯 EXAMPLE 12: STATE-LEVEL SUMMARY - "What is the groundwater status of Punjab?"
SELECT 
    s.state_name,
    COUNT(*) as total_blocks,
    ROUND(AVG(a.rainfall)::numeric, 2) as avg_rainfall_mm,
    ROUND(AVG(a.stage)::numeric, 2) as avg_stage_percent,
    ROUND(SUM(a.total_recharge)::numeric, 2) as total_recharge_mcm,
    ROUND(SUM(a.total_extraction)::numeric, 2) as total_extraction_mcm,
    SUM(CASE WHEN LOWER(a.category) = 'safe' THEN 1 ELSE 0 END) as safe_blocks,
    SUM(CASE WHEN LOWER(a.category) = 'semi-critical' THEN 1 ELSE 0 END) as semicritical_blocks,
    SUM(CASE WHEN LOWER(a.category) = 'critical' THEN 1 ELSE 0 END) as critical_blocks,
    SUM(CASE WHEN LOWER(a.category) LIKE '%over%' THEN 1 ELSE 0 END) as overexploited_blocks
FROM assessments_summary a
JOIN blocks b ON a.block_uuid = b.block_uuid
JOIN states s ON b.state_uuid = s.state_uuid
WHERE LOWER(s.state_name) = LOWER('punjab')
  AND a.year = '2024-2025'
GROUP BY s.state_name

🎯 EXAMPLE 13: DISTRICT-LEVEL SUMMARY - "What is the groundwater status of Ludhiana district?"
SELECT 
    d.district_name,
    s.state_name,
    COUNT(*) as total_blocks,
    ROUND(AVG(a.rainfall)::numeric, 2) as avg_rainfall_mm,
    ROUND(AVG(a.stage)::numeric, 2) as avg_stage_percent,
    ROUND(SUM(a.total_recharge)::numeric, 2) as total_recharge_mcm,
    ROUND(SUM(a.total_extraction)::numeric, 2) as total_extraction_mcm,
    SUM(CASE WHEN LOWER(a.category) = 'safe' THEN 1 ELSE 0 END) as safe_blocks,
    SUM(CASE WHEN LOWER(a.category) LIKE '%over%' THEN 1 ELSE 0 END) as overexploited_blocks
FROM assessments_summary a
JOIN blocks b ON a.block_uuid = b.block_uuid
JOIN districts d ON b.district_uuid = d.district_uuid
JOIN states s ON b.state_uuid = s.state_uuid
WHERE LOWER(d.district_name) = LOWER('ludhiana')
  AND a.year = '2024-2025'
GROUP BY d.district_name, s.state_name

🎯 EXAMPLE 14: ALL STATES SUMMARY - "Compare groundwater status across all states"
SELECT 
    s.state_name,
    COUNT(*) as total_blocks,
    ROUND(AVG(a.rainfall)::numeric, 2) as avg_rainfall,
    ROUND(AVG(a.stage)::numeric, 2) as avg_stage,
    SUM(CASE WHEN LOWER(a.category) = 'safe' THEN 1 ELSE 0 END) as safe,
    SUM(CASE WHEN LOWER(a.category) LIKE '%over%' THEN 1 ELSE 0 END) as overexploited
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
    ROUND(AVG(a.stage)::numeric, 2) as avg_stage,
    SUM(CASE WHEN LOWER(a.category) = 'safe' THEN 1 ELSE 0 END) as safe_blocks,
    SUM(CASE WHEN LOWER(a.category) LIKE '%over%' THEN 1 ELSE 0 END) as overexploited
FROM assessments_summary a
JOIN blocks b ON a.block_uuid = b.block_uuid
JOIN districts d ON b.district_uuid = d.district_uuid
JOIN states s ON b.state_uuid = s.state_uuid
WHERE LOWER(s.state_name) = LOWER('rajasthan')
  AND a.year = '2024-2025'
GROUP BY d.district_name
ORDER BY avg_stage DESC

🎯 EXAMPLE 16: STATE TREND - "Show groundwater trend for Punjab over years"
SELECT 
    a.year,
    s.state_name,
    COUNT(*) as total_blocks,
    ROUND(AVG(a.rainfall)::numeric, 2) as avg_rainfall,
    ROUND(AVG(a.stage)::numeric, 2) as avg_stage,
    ROUND(SUM(a.total_recharge)::numeric, 2) as total_recharge,
    ROUND(SUM(a.total_extraction)::numeric, 2) as total_extraction
FROM assessments_summary a
JOIN blocks b ON a.block_uuid = b.block_uuid
JOIN states s ON b.state_uuid = s.state_uuid
WHERE LOWER(s.state_name) = LOWER('punjab')
GROUP BY a.year, s.state_name
ORDER BY a.year ASC

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CRITICAL RULES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. ALWAYS use proper JOINs to get human-readable block/district/state names
2. ALWAYS use LOWER() for case-insensitive string matching
3. ALWAYS include year filter (default: '2024-2025') unless asking for trends
4. For TRENDS: ORDER BY a.year ASC and don't filter by specific year
5. For LIST queries: Add LIMIT 50 to prevent overload
6. For category filters: Use LOWER() - 'safe', 'semi-critical', 'critical', or LIKE '%over%'
7. Return ONLY valid PostgreSQL - no markdown, no explanations, no comments
8. The SQL must be executable as-is
9. For STATE/DISTRICT level queries: USE GROUP BY and aggregate functions (COUNT, AVG, SUM)
10. Use ROUND(value::numeric, 2) for decimal formatting

NOW GENERATE THE SQL QUERY FOR THE USER'S REQUEST:`

	resp, err := s.llm.model.GenerateContent(ctx, genai.Text(prompt))
	if err != nil {
		return "", fmt.Errorf("AI SQL generation failed: %w", err)
	}

	if len(resp.Candidates) == 0 || len(resp.Candidates[0].Content.Parts) == 0 {
		return "", fmt.Errorf("no SQL response from AI")
	}

	sqlText := fmt.Sprintf("%v", resp.Candidates[0].Content.Parts[0])
	
	// Clean up the SQL
	sqlText = strings.TrimSpace(sqlText)
	sqlText = strings.TrimPrefix(sqlText, "```sql")
	sqlText = strings.TrimPrefix(sqlText, "```")
	sqlText = strings.TrimSuffix(sqlText, "```")
	sqlText = strings.TrimSpace(sqlText)
	
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

ANALYZE THE QUERY NOW AND RETURN JSON:`, message)

	fmt.Printf("AI QUERY ANALYSIS: Sending prompt to Gemini...\n")
	resp, err := s.llm.model.GenerateContent(ctx, genai.Text(prompt))
	if err != nil {
		fmt.Printf("AI QUERY ANALYSIS ERROR: %v\n", err)
		return nil, err
	}

	if len(resp.Candidates) == 0 || len(resp.Candidates[0].Content.Parts) == 0 {
		fmt.Printf("AI QUERY ANALYSIS ERROR: No response from AI\n")
		return nil, fmt.Errorf("no response from AI")
	}

	responseText := fmt.Sprintf("%v", resp.Candidates[0].Content.Parts[0])
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
	default:
		return IntentUnknown
	}
}

func (s *NLPService) determineIntent(msg string) Intent {
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

	// Extract Category
	if strings.Contains(msg, "over-exploited") || strings.Contains(msg, "over exploited") {
		e.Category = "Over-Exploited"
	} else if strings.Contains(msg, "critical") {
		e.Category = "Critical"
	} else if strings.Contains(msg, "semi-critical") {
		e.Category = "Semi-Critical"
	} else if strings.Contains(msg, "safe") {
		e.Category = "Safe"
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
