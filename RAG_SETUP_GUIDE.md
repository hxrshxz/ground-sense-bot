# 🚀 RAG (Retrieval-Augmented Generation) Setup Guide

This guide walks you through setting up hybrid search (keyword + semantic) capabilities for the groundwater assessment system.

## 📋 Overview

The RAG system enables:

- **Keyword Search**: Fast full-text search using PostgreSQL (e.g., "over_exploited blocks")
- **Semantic Search**: AI-powered contextual search using vector embeddings (e.g., "water stressed regions")
- **Hybrid Search**: Combines both for best results

---

## 🎯 Prerequisites

### 1. PostgreSQL with pgvector Extension

**Option A: Install pgvector locally**

```bash
# Ubuntu/Debian
sudo apt install postgresql-16-pgvector

# macOS (Homebrew)
brew install pgvector

# Restart PostgreSQL
sudo systemctl restart postgresql
```

**Option B: Use Docker with pgvector**

```bash
docker run -d \
  --name postgres-pgvector \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=postgres \
  -p 5432:5432 \
  pgvector/pgvector:pg16
```

### 2. OpenAI API Key

Get your API key from: https://platform.openai.com/api-keys

```bash
export OPENAI_API_KEY="sk-your-api-key-here"
```

---

## 📦 Installation Steps

### Step 1: Install Python Dependencies (for data ingestion)

```bash
cd Data/
pip install -r requirements-rag.txt
```

### Step 2: Run Database Migrations

The migrations will automatically run when you start the Go backend:

```bash
cd backend/
go run cmd/server/main.go
```

The backend will:

1. ✅ Create base tables (states, districts, blocks, assessments)
2. ✅ Enable pgvector extension
3. ✅ Add embedding columns
4. ✅ Create full-text search indexes (GIN)
5. ✅ Create vector similarity indexes (HNSW)
6. ✅ Set up triggers for automatic search vector updates

### Step 3: Ingest Data with Embeddings

This step processes your 27K JSON files and generates embeddings:

```bash
cd Data/

# Basic ingestion (uses default settings)
python ingest_rag_data.py

# Custom settings
python ingest_rag_data.py \
  --data-dir ./data \
  --master-index ./master_index.json \
  --batch-size 50 \
  --db-host localhost \
  --db-port 5432 \
  --db-name postgres \
  --db-user postgres \
  --db-password password
```

**Expected Output:**

```
📖 Loading master index from ./master_index.json
🚀 Starting data ingestion from ./data
📁 Found 26868 JSON files to process
Processing files: 100%|████████████| 26868/26868
🔄 Generating embeddings for 50 records...
✅ Inserted 50 records
...
✅ Processing complete!
   Processed: 26868 records
   Errors: 0 records
```

**Note:**

- This may take 2-4 hours for 27K files
- OpenAI API costs: ~$2-3 for all embeddings (using text-embedding-3-small)
- Process can be resumed if interrupted (uses UPSERT)

---

## 🧪 Testing the RAG System

### Test 1: Keyword Search

```bash
curl -X POST http://localhost:8080/api/v1/rag/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "over_exploited",
    "limit": 5,
    "use_keyword": true,
    "use_semantic": false
  }'
```

### Test 2: Semantic Search

```bash
curl -X POST http://localhost:8080/api/v1/rag/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What are the most water stressed regions?",
    "limit": 5,
    "use_keyword": false,
    "use_semantic": true
  }'
```

### Test 3: Hybrid Search (Recommended)

```bash
curl -X POST http://localhost:8080/api/v1/rag/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "regions with declining water availability",
    "limit": 10,
    "use_keyword": true,
    "use_semantic": true,
    "filter_state": "Punjab"
  }'
```

### Test 4: With Filters

```bash
curl -X POST http://localhost:8080/api/v1/rag/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "high groundwater extraction",
    "limit": 10,
    "use_keyword": true,
    "use_semantic": true,
    "filter_year": "2023-2024",
    "filter_category": "over_exploited",
    "filter_state": "Punjab"
  }'
```

**Expected Response:**

```json
{
  "results": [
    {
      "assessment_id": 12345,
      "block_uuid": "abc-123",
      "block_name": "LUDHIANA",
      "district_name": "LUDHIANA",
      "state_name": "PUNJAB",
      "year": "2023-2024",
      "category": "over_exploited",
      "stage": 142.5,
      "rainfall": 450.2,
      "total_recharge": 1200.5,
      "total_extraction": 1710.7,
      "availability": -510.2,
      "text_representation": "Location: LUDHIANA | Groundwater Status: over_exploited | ...",
      "score": 0.95,
      "search_type": "hybrid"
    }
  ],
  "total_results": 10,
  "query": "high groundwater extraction",
  "search_types": ["keyword", "semantic"]
}
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    User Query                            │
└────────────────────┬────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────┐
│              Go Backend (RAG Service)                    │
│  - Query Classification                                  │
│  - Embedding Generation (OpenAI)                         │
└────────────────────┬────────────────────────────────────┘
                     ↓
        ┌────────────┴────────────┐
        ↓                         ↓
┌───────────────┐         ┌───────────────┐
│ KEYWORD       │         │ SEMANTIC      │
│ Full-Text     │         │ Vector        │
│ (PostgreSQL)  │         │ (pgvector)    │
└───────┬───────┘         └───────┬───────┘
        │                         │
        └────────────┬────────────┘
                     ↓
┌─────────────────────────────────────────────────────────┐
│           Result Fusion & Deduplication                  │
│  - Combine results                                       │
│  - Remove duplicates                                     │
│  - Sort by relevance                                     │
└────────────────────┬────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────┐
│                  JSON Response                           │
└─────────────────────────────────────────────────────────┘
```

---

## 📊 Database Schema Changes

### New Columns Added

**assessments_summary:**

- `embedding` (vector(1536)) - OpenAI embeddings for semantic search
- `text_representation` (TEXT) - Rich text description for embedding generation
- `search_vector` (tsvector) - Full-text search index

**blocks:**

- `embedding` (vector(1536)) - Location embeddings
- `description` (TEXT) - Block descriptions
- `search_vector` (tsvector) - Full-text search on block names

### New Indexes

1. **GIN Indexes** (for keyword search):

   - `idx_assessments_search_vector`
   - `idx_blocks_search_vector`

2. **HNSW Indexes** (for vector similarity):

   - `idx_assessments_embedding`
   - `idx_blocks_embedding`

3. **B-Tree Indexes** (for filtering):
   - `idx_assessments_year`
   - `idx_assessments_category`
   - `idx_assessments_stage`
   - `idx_assessments_block_year`

---

## 🔧 Configuration

### Environment Variables

Add to your `.env` or backend config:

```bash
# OpenAI Configuration
OPENAI_API_KEY=sk-your-api-key-here

# Database Configuration (if different from defaults)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=password
```

### Go Backend Config

The RAG service is automatically initialized in `routes.go`:

```go
ragService := services.NewRAGService(db, cfg, logger)
ragController := controllers.NewRAGController(ragService, logger)
```

---

## 🎨 Integration with Frontend

### Example React/TypeScript Integration

```typescript
// services/ragService.ts
export const hybridSearch = async (query: string, filters?: any) => {
  const response = await fetch("http://localhost:8080/api/v1/rag/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query,
      limit: 10,
      use_keyword: true,
      use_semantic: true,
      ...filters,
    }),
  });
  return response.json();
};

// Usage in component
const results = await hybridSearch("water stressed regions in Punjab", {
  filter_year: "2023-2024",
});
```

---

## 🐛 Troubleshooting

### Issue: pgvector extension not found

**Solution:**

```sql
-- Connect to PostgreSQL
psql -U postgres

-- Check if extension exists
SELECT * FROM pg_available_extensions WHERE name = 'vector';

-- If not available, install pgvector first
-- See Prerequisites section above
```

### Issue: Embedding generation fails

**Error:** `OpenAI API error: 401 Unauthorized`

**Solution:**

```bash
# Check if API key is set
echo $OPENAI_API_KEY

# If not, export it
export OPENAI_API_KEY="sk-your-key-here"
```

### Issue: Slow vector search

**Solution:**

```sql
-- Check if HNSW index exists
SELECT indexname FROM pg_indexes
WHERE tablename = 'assessments_summary'
AND indexname LIKE '%embedding%';

-- If missing, create it manually
CREATE INDEX idx_assessments_embedding
ON assessments_summary
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);
```

### Issue: Out of memory during ingestion

**Solution:**

```bash
# Reduce batch size
python ingest_rag_data.py --batch-size 25

# Or process in chunks by year
python ingest_rag_data.py --data-dir ./data/2023-2024
python ingest_rag_data.py --data-dir ./data/2022-2023
# etc.
```

---

## 📈 Performance Tips

1. **Batch Size**: Start with 50, adjust based on API rate limits
2. **HNSW Parameters**:
   - `m = 16`: Good balance of speed/accuracy
   - `ef_construction = 64`: Build quality
3. **Limit Results**: Don't fetch more than needed
4. **Use Filters**: Narrow down search space when possible

---

## 💰 Cost Estimation

### OpenAI API Costs (one-time ingestion)

- **Model**: text-embedding-3-small ($0.02 / 1M tokens)
- **Records**: ~27K assessments
- **Avg tokens per record**: ~200 tokens
- **Total tokens**: 5.4M tokens
- **Estimated cost**: **$0.11** (very cheap!)

### Ongoing Costs (per query)

- **Embedding generation**: $0.000004 per query
- **1000 queries/day**: ~$0.12/month

---

## 🚀 Next Steps

1. ✅ Complete database migration
2. ✅ Run data ingestion
3. ✅ Test hybrid search endpoints
4. 📝 Integrate with your chat interface
5. 🎨 Build UI components for search results
6. 📊 Add analytics and monitoring

---

## 📚 Additional Resources

- [pgvector Documentation](https://github.com/pgvector/pgvector)
- [OpenAI Embeddings Guide](https://platform.openai.com/docs/guides/embeddings)
- [PostgreSQL Full-Text Search](https://www.postgresql.org/docs/current/textsearch.html)
- [HNSW Algorithm](https://arxiv.org/abs/1603.09320)

---

## 🤝 Support

If you encounter any issues:

1. Check the troubleshooting section above
2. Review Go backend logs: `backend/logs/`
3. Check PostgreSQL logs for migration errors
4. Verify OpenAI API key is valid

---

**Built with ❤️ for India Groundwater Assessment System**
