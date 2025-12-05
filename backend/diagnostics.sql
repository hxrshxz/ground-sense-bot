-- Check Total Rows
SELECT 'Total Assessments' as metric, COUNT(*) as value FROM assessments_summary;

-- Check Stage Availability
SELECT 'Assessments with Stage' as metric, COUNT(*) as value FROM assessments_summary WHERE stage IS NOT NULL;

-- Check Category Distribution
SELECT category, COUNT(*) FROM assessments_summary GROUP BY category;

-- Check Recharge Sources
SELECT DISTINCT source FROM assessments_recharge_breakdown ORDER BY source;

-- Check Discharge Sources
SELECT DISTINCT source FROM assessments_discharge_breakdown ORDER BY source;

-- Check Extraction Sources
SELECT DISTINCT source FROM assessments_extraction_breakdown ORDER BY source;

-- Check for Duplicate Assessments per Block
SELECT block_uuid, COUNT(*) as count 
FROM assessments_summary 
GROUP BY block_uuid 
HAVING COUNT(*) > 1 
LIMIT 5;
