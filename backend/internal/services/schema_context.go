package services

// ============================================================================
// SCHEMA CONTEXT - FOCUSED ON 4 KEY ATTRIBUTES
// ============================================================================
// As per mentor feedback, focus ONLY on:
// 1. Annual Extractable GW Resources (total_extractable) - in ham
// 2. Annual GW Extraction (total_extraction) - in ham
// 3. Stage of Extraction (stage - percentage)
// 4. Categorization (category)
//
// Unit: ham (hectare-meters) for consistency
// Hierarchy: State → District → Block
// ============================================================================

// GetDatabaseSchema returns the focused schema for LLM
func GetDatabaseSchema() string {
	return `
DATABASE SCHEMA - INDIA GROUNDWATER RESOURCE ESTIMATION SYSTEM (INGRES)

HIERARCHY: State → District → Block → Assessment

TABLE: states
- state_uuid (UUID, PRIMARY KEY)
- state_name (VARCHAR) - e.g., "PUNJAB", "HARYANA"

TABLE: districts
- district_uuid (UUID, PRIMARY KEY)
- district_name (VARCHAR)
- state_uuid (FOREIGN KEY → states)

TABLE: blocks
- block_uuid (UUID, PRIMARY KEY)
- block_name (VARCHAR)
- district_uuid (FOREIGN KEY → districts)
- state_uuid (FOREIGN KEY → states)

TABLE: assessments_summary
- block_uuid (FOREIGN KEY → blocks)
- year (VARCHAR) - e.g., "2024-2025"

THE 4 KEY ATTRIBUTES (ALL VALUES IN ham - hectare-meters):
1. total_extractable (FLOAT) - Annual Extractable GW Resources in ham
2. total_extraction (FLOAT) - Annual GW Extraction in ham
3. stage (FLOAT) - Stage of Extraction as percentage
4. category (VARCHAR) - 'safe', 'semi_critical', 'critical', 'over_exploited', 'saline', 'hilly_area'

CATEGORY DEFINITIONS:
- 'safe' = Stage < 70%
- 'semi_critical' = Stage 70-90%
- 'critical' = Stage 90-100%
- 'over_exploited' = Stage > 100%
- 'saline' = Saline areas (special category)
- 'hilly_area' = Hilly terrain areas (special category)
`
}

// GetSQLGenerationRules returns focused SQL rules
func GetSQLGenerationRules() string {
	return `
SQL GENERATION RULES:

1. ALWAYS join tables for human-readable names
2. STATE matching: WHERE UPPER(s.state_name) = UPPER('punjab')
3. DISTRICT matching: WHERE LOWER(d.district_name) ILIKE '%ludhiana%'
4. Years available: '2024-2025' or '2023-2024' (Default: 2024-2025)
5. DO NOT round values - keep full precision
6. Unit is ham (hectare-meters) for all water values

7. MANDATORY COLUMNS FOR EVERY LOCATION QUERY:
- total_extractable (Annual Extractable GW Resources)
- total_extraction (Annual GW Extraction)
- stage (Stage of Extraction %)
- category (safe/critical/over_exploited)
`
}

// GetSQLExamples returns focused examples
func GetSQLExamples() string {
	return `
EXAMPLE QUERIES:

STATE SUMMARY:
SELECT s.state_name,
       COUNT(*) as total_blocks,
       SUM(a.total_extractable) as extractable_ham,
       SUM(a.total_extraction) as extraction_ham,
       AVG(a.stage) as avg_stage_percent,
       SUM(CASE WHEN a.category = 'safe' THEN 1 ELSE 0 END) as safe,
       SUM(CASE WHEN a.category = 'over_exploited' THEN 1 ELSE 0 END) as over_exploited
FROM assessments_summary a
JOIN blocks b ON a.block_uuid = b.block_uuid
JOIN states s ON b.state_uuid = s.state_uuid
WHERE UPPER(s.state_name) = UPPER('punjab')
AND a.year = '2024-2025'
GROUP BY s.state_name

DISTRICTS IN STATE:
SELECT d.district_name,
       COUNT(*) as total_blocks,
       SUM(a.total_extractable) as extractable_ham,
       SUM(a.total_extraction) as extraction_ham,
       AVG(a.stage) as avg_stage_percent
FROM assessments_summary a
JOIN blocks b ON a.block_uuid = b.block_uuid
JOIN districts d ON b.district_uuid = d.district_uuid
JOIN states s ON b.state_uuid = s.state_uuid
WHERE UPPER(s.state_name) = UPPER('punjab')
AND a.year = '2024-2025'
GROUP BY d.district_name
ORDER BY avg_stage_percent DESC

BLOCKS IN DISTRICT:
SELECT b.block_name,
       a.total_extractable as extractable_ham,
       a.total_extraction as extraction_ham,
       a.stage as stage_percent,
       a.category
FROM assessments_summary a
JOIN blocks b ON a.block_uuid = b.block_uuid
JOIN districts d ON b.district_uuid = d.district_uuid
WHERE LOWER(d.district_name) ILIKE '%ludhiana%'
AND a.year = '2024-2025'
ORDER BY a.stage DESC
`
}

// GetFullSchemaContext returns complete context
func GetFullSchemaContext() string {
	return GetDatabaseSchema() + "\n" + GetSQLGenerationRules() + "\n" + GetSQLExamples()
}
