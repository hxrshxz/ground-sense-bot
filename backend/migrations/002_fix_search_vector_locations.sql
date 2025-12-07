-- Migration: Fix search_vector to include location names
-- This fixes the keyword search to properly match district, block, and state names

-- ============================================================================
-- Update trigger function to include location information in search_vector
-- ============================================================================

-- Drop the old trigger function
DROP FUNCTION IF EXISTS update_assessments_search_vector() CASCADE;

-- Create new function that joins with location tables
CREATE OR REPLACE FUNCTION update_assessments_search_vector()
RETURNS TRIGGER AS $$
DECLARE
    v_block_name TEXT;
    v_district_name TEXT;
    v_state_name TEXT;
BEGIN
    -- Fetch location names from related tables
    SELECT 
        b.block_name,
        d.district_name,
        s.state_name
    INTO 
        v_block_name,
        v_district_name,
        v_state_name
    FROM blocks b
    JOIN districts d ON b.district_uuid = d.district_uuid
    JOIN states s ON b.state_uuid = s.state_uuid
    WHERE b.block_uuid = NEW.block_uuid;
    
    -- Combine all searchable fields including location names
    NEW.search_vector := to_tsvector('english',
        COALESCE(NEW.year, '') || ' ' ||
        COALESCE(NEW.category, '') || ' ' ||
        COALESCE(NEW.text_representation, '') || ' ' ||
        COALESCE(v_block_name, '') || ' ' ||
        COALESCE(v_district_name, '') || ' ' ||
        COALESCE(v_state_name, '')
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
DROP TRIGGER IF EXISTS trigger_update_assessments_search_vector ON assessments_summary;
CREATE TRIGGER trigger_update_assessments_search_vector
    BEFORE INSERT OR UPDATE ON assessments_summary
    FOR EACH ROW
    EXECUTE FUNCTION update_assessments_search_vector();

-- ============================================================================
-- Update all existing search_vectors to include location names
-- ============================================================================

-- This will trigger the new function for all existing rows
UPDATE assessments_summary a
SET search_vector = to_tsvector('english',
    COALESCE(a.year, '') || ' ' ||
    COALESCE(a.category, '') || ' ' ||
    COALESCE(a.text_representation, '') || ' ' ||
    COALESCE(b.block_name, '') || ' ' ||
    COALESCE(d.district_name, '') || ' ' ||
    COALESCE(s.state_name, '')
)
FROM blocks b
JOIN districts d ON b.district_uuid = d.district_uuid
JOIN states s ON b.state_uuid = s.state_uuid
WHERE a.block_uuid = b.block_uuid;

-- ============================================================================
-- Verify the fix worked
-- ============================================================================

DO $$
DECLARE
    amritsar_count INTEGER;
BEGIN
    -- Count records where search_vector now includes "Amritsar"
    SELECT COUNT(*)
    INTO amritsar_count
    FROM assessments_summary a
    JOIN blocks b ON a.block_uuid = b.block_uuid
    JOIN districts d ON b.district_uuid = d.district_uuid
    WHERE d.district_name = 'Amritsar'
    AND a.search_vector @@ to_tsquery('english', 'Amritsar');
    
    RAISE NOTICE 'Migration 002 completed: % Amritsar records now searchable by keyword', amritsar_count;
END $$;
