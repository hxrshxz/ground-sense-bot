-- Migration: Add RAG (Retrieval-Augmented Generation) Support
-- This migration adds vector embeddings and full-text search capabilities
-- to enable hybrid search (keyword + semantic) on groundwater data

-- ============================================================================
-- STEP 1: Enable pgvector extension for vector similarity search
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================================
-- STEP 2: Add vector embedding columns
-- ============================================================================

-- Add embedding column to assessments_summary for semantic search
-- Using 768 dimensions (Gemini text-embedding-004 default)
ALTER TABLE assessments_summary 
ADD COLUMN IF NOT EXISTS embedding vector(768);

-- Add text representation column for generating embeddings
ALTER TABLE assessments_summary 
ADD COLUMN IF NOT EXISTS text_representation TEXT;

-- Add embedding column to blocks for location-based semantic search
ALTER TABLE blocks 
ADD COLUMN IF NOT EXISTS embedding vector(768);

ALTER TABLE blocks 
ADD COLUMN IF NOT EXISTS description TEXT;

-- ============================================================================
-- STEP 3: Add full-text search support (for keyword search)
-- ============================================================================

-- Add tsvector column for fast keyword search on assessments
ALTER TABLE assessments_summary 
ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Add tsvector column for blocks
ALTER TABLE blocks 
ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- ============================================================================
-- STEP 4: Create indexes for hybrid search
-- ============================================================================

-- GIN index for full-text keyword search (assessments)
CREATE INDEX IF NOT EXISTS idx_assessments_search_vector 
ON assessments_summary USING GIN(search_vector);

-- GIN index for full-text keyword search (blocks)
CREATE INDEX IF NOT EXISTS idx_blocks_search_vector 
ON blocks USING GIN(search_vector);

-- HNSW index for fast vector similarity search (assessments)
-- Using cosine distance for semantic similarity
CREATE INDEX IF NOT EXISTS idx_assessments_embedding 
ON assessments_summary 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- HNSW index for vector similarity search (blocks)
CREATE INDEX IF NOT EXISTS idx_blocks_embedding 
ON blocks 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- ============================================================================
-- STEP 5: Create trigger functions to auto-update search vectors
-- ============================================================================

-- Function to update search_vector for assessments_summary
CREATE OR REPLACE FUNCTION update_assessments_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    -- Combine relevant fields into searchable text
    NEW.search_vector := to_tsvector('english',
        COALESCE(NEW.year, '') || ' ' ||
        COALESCE(NEW.category, '') || ' ' ||
        COALESCE(NEW.text_representation, '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update search_vector for blocks
CREATE OR REPLACE FUNCTION update_blocks_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := to_tsvector('english',
        COALESCE(NEW.block_name, '') || ' ' ||
        COALESCE(NEW.description, '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 6: Create triggers to auto-update search vectors on INSERT/UPDATE
-- ============================================================================

-- Trigger for assessments_summary
DROP TRIGGER IF EXISTS trigger_update_assessments_search_vector ON assessments_summary;
CREATE TRIGGER trigger_update_assessments_search_vector
    BEFORE INSERT OR UPDATE ON assessments_summary
    FOR EACH ROW
    EXECUTE FUNCTION update_assessments_search_vector();

-- Trigger for blocks
DROP TRIGGER IF EXISTS trigger_update_blocks_search_vector ON blocks;
CREATE TRIGGER trigger_update_blocks_search_vector
    BEFORE INSERT OR UPDATE ON blocks
    FOR EACH ROW
    EXECUTE FUNCTION update_blocks_search_vector();

-- ============================================================================
-- STEP 7: Add indexes for common query patterns
-- ============================================================================

-- Index for filtering by year
CREATE INDEX IF NOT EXISTS idx_assessments_year 
ON assessments_summary(year);

-- Index for filtering by category
CREATE INDEX IF NOT EXISTS idx_assessments_category 
ON assessments_summary(category);

-- Index for filtering by extraction stage
CREATE INDEX IF NOT EXISTS idx_assessments_stage 
ON assessments_summary(stage);

-- Composite index for block + year queries
CREATE INDEX IF NOT EXISTS idx_assessments_block_year 
ON assessments_summary(block_uuid, year);

-- Index for state-level queries
CREATE INDEX IF NOT EXISTS idx_blocks_state 
ON blocks(state_uuid);

-- Index for district-level queries
CREATE INDEX IF NOT EXISTS idx_blocks_district 
ON blocks(district_uuid);

-- ============================================================================
-- STEP 8: Create helper views for RAG queries
-- ============================================================================

-- View for enriched assessments with location information
CREATE OR REPLACE VIEW v_assessments_enriched AS
SELECT 
    a.assessment_id,
    a.block_uuid,
    a.year,
    a.rainfall,
    a.total_recharge,
    a.total_discharge,
    a.total_extractable,
    a.total_extraction,
    a.category,
    a.stage,
    a.availability,
    a.text_representation,
    a.embedding,
    a.search_vector,
    b.block_name,
    b.description as block_description,
    d.district_name,
    s.state_name,
    a.raw as raw_data,
    a.created_at
FROM assessments_summary a
JOIN blocks b ON a.block_uuid = b.block_uuid
JOIN districts d ON b.district_uuid = d.district_uuid
JOIN states s ON b.state_uuid = s.state_uuid;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Log migration completion
DO $$
BEGIN
    RAISE NOTICE 'Migration 001_add_rag_support.sql completed successfully';
    RAISE NOTICE 'Added pgvector support, vector columns, full-text search, and indexes';
END $$;
