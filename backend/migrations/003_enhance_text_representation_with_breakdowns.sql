-- Migration: Enhance text_representation to include breakdown data
-- This adds irrigation, domestic, industry extraction details and recharge source breakdowns

-- ============================================================================
-- Update text_representation to include breakdown details
-- ============================================================================

-- Function to generate enhanced text representation with breakdown data
CREATE OR REPLACE FUNCTION generate_enhanced_text_representation(p_assessment_id INTEGER)
RETURNS TEXT AS $$
DECLARE
    v_text TEXT;
    v_block_uuid UUID;
    v_year TEXT;
    v_block_name TEXT;
    v_district_name TEXT;
    v_state_name TEXT;
    v_category TEXT;
    v_stage DOUBLE PRECISION;
    v_rainfall DOUBLE PRECISION;
    v_total_recharge DOUBLE PRECISION;
    v_total_extraction DOUBLE PRECISION;
    v_total_extractable DOUBLE PRECISION;
    v_extraction_rec RECORD;
    v_recharge_rec RECORD;
BEGIN
    -- Get assessment basic info
    SELECT 
        a.block_uuid, a.year, a.category, a.stage, a.rainfall,
        a.total_recharge, a.total_extraction, a.total_extractable,
        b.block_name, d.district_name, s.state_name
    INTO 
        v_block_uuid, v_year, v_category, v_stage, v_rainfall,
        v_total_recharge, v_total_extraction, v_total_extractable,
        v_block_name, v_district_name, v_state_name
    FROM assessments_summary a
    JOIN blocks b ON a.block_uuid = b.block_uuid
    JOIN districts d ON b.district_uuid = d.district_uuid
    JOIN states s ON b.state_uuid = s.state_uuid
    WHERE a.assessment_id = p_assessment_id;
    
    -- Start building text representation
    v_text := 'Location: ' || v_block_name || ' Block, ' || v_district_name || ' District, ' || v_state_name || ' State | ';
    v_text := v_text || 'Year: ' || v_year || ' | ';
    v_text := v_text || 'Groundwater Status: ' || COALESCE(v_category, 'unknown') || ' | ';
    
    IF v_stage IS NOT NULL THEN
        v_text := v_text || 'Stage of Extraction: ' || v_stage::TEXT || '% | ';
    END IF;
    
    IF v_rainfall IS NOT NULL THEN
        v_text := v_text || 'Rainfall: ' || v_rainfall::TEXT || ' mm | ';
    END IF;
    
    IF v_total_recharge IS NOT NULL THEN
        v_text := v_text || 'Total Recharge: ' || v_total_recharge::TEXT || ' MCM | ';
    END IF;
    
    IF v_total_extraction IS NOT NULL THEN
        v_text := v_text || 'Total Extraction: ' || v_total_extraction::TEXT || ' MCM | ';
    END IF;
    
    IF v_total_extractable IS NOT NULL THEN
        v_text := v_text || 'Total Extractable: ' || v_total_extractable::TEXT || ' MCM | ';
    END IF;
    
    -- Add extraction breakdown details
    v_text := v_text || 'Extraction Breakdown: ';
    FOR v_extraction_rec IN 
        SELECT source, command, non_command, total 
        FROM assessments_extraction_breakdown 
        WHERE assessment_id = p_assessment_id
        ORDER BY source
    LOOP
        v_text := v_text || v_extraction_rec.source || ' (Command: ' || 
            COALESCE(v_extraction_rec.command::TEXT, '0') || ' MCM, Non-Command: ' ||
            COALESCE(v_extraction_rec.non_command::TEXT, '0') || ' MCM, Total: ' ||
            COALESCE(v_extraction_rec.total::TEXT, '0') || ' MCM) | ';
    END LOOP;
    
    -- Add recharge breakdown details
    v_text := v_text || 'Recharge Breakdown: ';
    FOR v_recharge_rec IN 
        SELECT source, command, non_command, total 
        FROM assessments_recharge_breakdown 
        WHERE assessment_id = p_assessment_id
        ORDER BY source
    LOOP
        v_text := v_text || v_recharge_rec.source || ' (Command: ' ||
            COALESCE(v_recharge_rec.command::TEXT, '0') || ' MCM, Non-Command: ' ||
            COALESCE(v_recharge_rec.non_command::TEXT, '0') || ' MCM, Total: ' ||
            COALESCE(v_recharge_rec.total::TEXT, '0') || ' MCM) | ';
    END LOOP;
    
    RETURN v_text;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Update existing assessments with enhanced text representation
-- ============================================================================

DO $$
DECLARE
    v_assessment_rec RECORD;
    v_count INTEGER := 0;
BEGIN
    RAISE NOTICE 'Starting to update text_representation with breakdown data...';
    
    FOR v_assessment_rec IN 
        SELECT assessment_id 
        FROM assessments_summary 
        ORDER BY assessment_id
    LOOP
        UPDATE assessments_summary
        SET text_representation = generate_enhanced_text_representation(v_assessment_rec.assessment_id)
        WHERE assessment_id = v_assessment_rec.assessment_id;
        
        v_count := v_count + 1;
        
        -- Progress update every 1000 records
        IF v_count % 1000 = 0 THEN
            RAISE NOTICE 'Updated % assessments...', v_count;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Migration 003 completed: Updated % assessments with enhanced text representation', v_count;
END $$;

-- ============================================================================
-- Update the trigger to use the new function
-- ============================================================================

CREATE OR REPLACE FUNCTION update_assessments_search_vector()
RETURNS TRIGGER AS $$
DECLARE
    v_block_name TEXT;
    v_district_name TEXT;
    v_state_name TEXT;
BEGIN
    -- Fetch location names
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
    
    -- Generate enhanced text representation if not set
    IF NEW.text_representation IS NULL OR NEW.text_representation = '' THEN
        NEW.text_representation := generate_enhanced_text_representation(NEW.assessment_id);
    END IF;
    
    -- Update search vector with all searchable content
    NEW.search_vector := to_tsvector('english',
        COALESCE(NEW.year, '') || ' ' ||
        COALESCE(NEW.category, '') || ' ' ||
        COALESCE(NEW.text_representation, '') || ' ' ||
        COALESCE(v_block_name, '') || ' ' ||
        COALESCE(v_district_name, '') || ' ' ||
        COALESCE(v_state_name, '') || ' ' ||
        'irrigation domestic industry recharge extraction rainfall groundwater'
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger
DROP TRIGGER IF EXISTS trigger_update_assessments_search_vector ON assessments_summary;
CREATE TRIGGER trigger_update_assessments_search_vector
    BEFORE INSERT OR UPDATE ON assessments_summary
    FOR EACH ROW
    EXECUTE FUNCTION update_assessments_search_vector();

-- ============================================================================
-- Update search vectors with new keywords
-- ============================================================================

DO $$
BEGIN
    UPDATE assessments_summary a
    SET search_vector = to_tsvector('english',
        COALESCE(a.year, '') || ' ' ||
        COALESCE(a.category, '') || ' ' ||
        COALESCE(a.text_representation, '') || ' ' ||
        'irrigation domestic industry recharge extraction rainfall groundwater agriculture canal surface gw water'
    )
    FROM blocks b
    JOIN districts d ON b.district_uuid = d.district_uuid
    JOIN states s ON d.state_uuid = s.state_uuid
    WHERE a.block_uuid = b.block_uuid;
    
    RAISE NOTICE 'Search vectors updated with breakdown keywords for all assessments';
END $$;
