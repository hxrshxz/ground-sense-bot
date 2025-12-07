# RAG Keyword Search Fix - Location Name Matching

## Problem

Comparison queries like "Compare Amritsar and Ludhiana" were failing because:

1. **Missing Location Names in Search Vector**: The `search_vector` column in `assessments_summary` only included:

   - `year`
   - `category`
   - `text_representation` (which doesn't contain district/block/state names)

2. **Query Format Issue**: PostgreSQL's `websearch_to_tsquery` treats multiple words as AND by default:
   - "Amritsar Ludhiana" → both must match (returns 0)
   - "Amritsar OR Ludhiana" → either matches (returns 96)

## Solution

### 1. Database Migration (002_fix_search_vector_locations.sql)

Updated the trigger function to include location names in `search_vector`:

```sql
CREATE OR REPLACE FUNCTION update_assessments_search_vector()
RETURNS TRIGGER AS $$
DECLARE
    v_block_name TEXT;
    v_district_name TEXT;
    v_state_name TEXT;
BEGIN
    -- Fetch location names from related tables
    SELECT b.block_name, d.district_name, s.state_name
    INTO v_block_name, v_district_name, v_state_name
    FROM blocks b
    JOIN districts d ON b.district_uuid = d.district_uuid
    JOIN states s ON b.state_uuid = s.state_uuid
    WHERE b.block_uuid = NEW.block_uuid;

    -- Include location names in search_vector
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
```

### 2. Query Preprocessing (chat_service.go)

For comparison queries, convert location names to OR format:

```go
if isComparisonQuery {
    // "Compare Amritsar and Ludhiana" → "Amritsar OR Ludhiana"
    queryWithOR := strings.ReplaceAll(message, " and ", " OR ")
    queryWithOR = strings.ReplaceAll(queryWithOR, " & ", " OR ")
    queryWithOR = strings.ReplaceAll(queryWithOR, ",", " OR ")
    queryWithOR = strings.ReplaceAll(queryWithOR, "Compare ", "")
    queryWithOR = strings.ReplaceAll(queryWithOR, "compare ", "")
    queryWithOR = strings.ReplaceAll(queryWithOR, "versus ", "")
    queryWithOR = strings.ReplaceAll(queryWithOR, " vs ", " OR ")

    searchReq := HybridSearchRequest{
        Query:       queryWithOR,
        UseKeyword:  true,
        UseSemantic: false, // Keyword-only for better location matching
        Limit:       30,
    }
}
```

### 3. Location-Aware Filtering

Enhanced filtering to prioritize results matching mentioned locations:

```go
if isComparisonQuery {
    resultLocationMatch := strings.Contains(queryLower, strings.ToLower(result.DistrictName)) ||
        strings.Contains(queryLower, strings.ToLower(result.BlockName)) ||
        strings.Contains(queryLower, strings.ToLower(result.StateName))

    // Skip results that don't match mentioned locations
    if !resultLocationMatch && len(filteredResults) >= 5 {
        continue
    }
}
```

## Results

### Before Fix

```
Query: "Compare Amritsar and Ludhiana"
Result: 0 assessments found (semantic search returned wrong locations)
```

### After Fix

```
Query: "Compare Amritsar and Ludhiana"
Result: 10 assessments found
- Amritsar Urban (Stage: 324%, Rainfall: 670mm)
- Ludhiana-2 (Stage: 211%, Rainfall: 684mm)
- Ludhiana-1 (Stage: 395%, Rainfall: 641mm)
- Ludhiana City (Stage: 426%, Rainfall: 641mm)
Chart: Generated with Stage % and Rainfall metrics
```

## Testing

```bash
# Test comparison query
curl -X POST http://localhost:8080/api/debug/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Compare Amritsar and Ludhiana", "username": "test"}'

# Verify keyword search in PostgreSQL
docker exec ground-sense-postgres psql -U admin -d ground_sense_bot \
  -c "SELECT COUNT(*) FROM assessments_summary a
      WHERE a.search_vector @@ websearch_to_tsquery('english', 'Amritsar OR Ludhiana');"
```

## Migration Applied

```
UPDATE 24682 (all assessments updated)
40 Amritsar records now searchable by keyword
```

## Key Learnings

1. **Full-text search vectors must include all searchable fields** - not just semantic descriptions
2. **PostgreSQL `websearch_to_tsquery` defaults to AND** - use OR for multi-location queries
3. **Semantic search is poor at exact location matching** - keyword search is better for place names
4. **Triggers can query related tables** - use JOINs in trigger functions to enrich search vectors
