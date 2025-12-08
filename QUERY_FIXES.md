# Query Fixes Applied - December 7, 2025

## Summary

Fixed category detection for TOP_RANKING, LIST_BLOCKS, and MAP_CATEGORY query handlers to properly parse category keywords ("critical", "over-exploited", "safe", etc.) directly from the query text when the AI NLP fails to extract them.

## Changes Made

### 1. **handleTopRanking()** - Line ~2851

**Issue**: Query "top 10 critical blocks" was defaulting to "over_exploited" category
**Fix**: Added keyword-based category detection that checks query text FIRST before falling back to AI extraction

```go
// ALWAYS parse category from query text for reliability
queryLower := strings.ToLower(e.OriginalQuery)
category := ""

// Check query text first (most reliable)
if strings.Contains(queryLower, "critical") && !strings.Contains(queryLower, "semi") {
    category = "critical"
} else if strings.Contains(queryLower, "semi-critical") || strings.Contains(queryLower, "semi critical") {
    category = "semi_critical"
} else if strings.Contains(queryLower, "over-exploited") || strings.Contains(queryLower, "over exploited") {
    category = "over_exploited"
} else if strings.Contains(queryLower, "safe") {
    category = "safe"
} else if strings.Contains(queryLower, "salinity") {
    category = "salinity"
} else if e.Category != "" {
    category = e.Category  // Fall back to AI
} else {
    category = "over_exploited"  // Final default
}
```

### 2. **handleListBlocks()** - Line ~2466

**Issue**: "show me critical blocks" not detecting category
**Fix**: Added same keyword-based category detection before processing

### 3. **handleMapCategory()** - Line ~2386

**Issue**: "map critical blocks" requiring manual category specification
**Fix**: Added keyword parsing to auto-detect category from query text

### 4. **Location Boosting in RAG Search** - rag_service.go Line ~210

**Issue**: Query "bihar" matching blocks named "BIHAR" from other states
**Fix**: Added SQL-level location boosting:

- State exact match: +10.0 boost
- District exact match: +5.0 boost
- State partial match: +3.0 boost
- District partial match: +2.0 boost

### 5. **Gemini Reranking** - rag_service.go

**Status**: Implemented but requires GEMINI_API_KEY environment variable
**Function**: `rerankResults()` uses Gemini 2.0 Flash to semantically rerank search results

## Database Validation

Categories in database (2024-2025 year):

- `critical`: 188 blocks
- `semi_critical`: 596 blocks
- `over_exploited`: 632 blocks
- `safe`: 3,995 blocks
- `salinity`: 119 blocks
- `Hilly Area`: 265 blocks

## Testing

### Queries That Should Now Work:

**TOP RANKING:**

- ✅ "top 10 critical blocks"
- ✅ "top 5 over-exploited blocks"
- ✅ "worst 10 safe areas"
- ✅ "top 10 semi-critical blocks"

**LIST BLOCKS:**

- ✅ "show me critical blocks"
- ✅ "list over-exploited blocks in Punjab"
- ✅ "safe blocks in bihar"

**MAP CATEGORY:**

- ✅ "map critical blocks"
- ✅ "show me over-exploited blocks on map"

**LOCATION QUERIES:**

- ✅ "groundwater data for bihar" (now returns Bihar state blocks, not "BIHAR" block from UP)
- ✅ "show me data for Patna"
- ✅ "blocks in Bihar" (aggregates to state level)

**COMPARE:**

- ✅ "compare Amritsar and Ludhiana"
- ✅ "compare Punjab and Haryana"

## How to Test

1. **Start the server:**

```bash
cd backend
~/go/bin/air
```

2. **Run test script:**

```bash
cd backend
bash test_queries.sh
```

3. **Or test manually in browser:**
   - Open http://localhost:5173
   - Try queries like:
     - "top 10 critical blocks"
     - "show me over-exploited blocks in Punjab"
     - "groundwater data for bihar"

## Notes

- All category keywords are case-insensitive
- Location boosting ensures state/district names prioritized over block names
- Fallback logic: Query text → AI extraction → Default (over_exploited)
- Reranking improves relevance but requires API key configuration

## Files Modified

1. `/backend/internal/services/chat_service.go`

   - handleTopRanking()
   - handleListBlocks()
   - handleMapCategory()

2. `/backend/internal/services/rag_service.go`

   - KeywordSearch() - Added location boosting
   - rerankResults() - New function for Gemini reranking

3. `/backend/test_queries.sh` - New comprehensive test script
