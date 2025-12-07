# 🎯 RAG Quick Start

## 1️⃣ Install pgvector (Choose one)

```bash
# Docker (Easiest)
docker run -d --name postgres-pgvector \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  pgvector/pgvector:pg16

# OR Ubuntu/Debian
sudo apt install postgresql-16-pgvector

# OR macOS
brew install pgvector
```

## 2️⃣ Set OpenAI API Key

```bash
export OPENAI_API_KEY="sk-your-key-here"
```

## 3️⃣ Start Backend (Runs Migrations Automatically)

```bash
cd backend/
go run cmd/server/main.go
```

## 4️⃣ Install Python Dependencies

```bash
cd Data/
pip install -r requirements-rag.txt
```

## 5️⃣ Ingest Data with Embeddings

```bash
cd Data/
python ingest_rag_data.py
```

⏱️ **This takes 2-4 hours for 27K files**
💰 **Cost: ~$0.11 (one-time)**

## 6️⃣ Test the API

```bash
# Hybrid search
curl -X POST http://localhost:8080/api/v1/rag/search \
  -H "Content-Type: application/json" \
  -d '{"query":"water stressed regions","limit":5}'
```

## 📋 What Was Created

### ✅ Backend Files:

- `backend/migrations/001_add_rag_support.sql` - Database migrations
- `backend/internal/services/rag_service.go` - Hybrid search service
- `backend/internal/controllers/rag_controller.go` - API controllers
- `backend/internal/routes/routes.go` - Updated with RAG endpoints
- `backend/internal/database/database.go` - Updated with RAG migrations

### ✅ Data Ingestion:

- `Data/ingest_rag_data.py` - Ingestion script
- `Data/requirements-rag.txt` - Python dependencies

### ✅ Documentation:

- `RAG_SETUP_GUIDE.md` - Comprehensive setup guide
- `RAG_QUICKSTART.md` - This file!

## 🎨 API Endpoints

### POST `/api/v1/rag/search`

Hybrid search (keyword + semantic)

**Request:**

```json
{
  "query": "water stressed regions in Punjab",
  "limit": 10,
  "use_keyword": true,
  "use_semantic": true,
  "filter_state": "Punjab",
  "filter_year": "2023-2024",
  "filter_category": "over_exploited"
}
```

**Response:**

```json
{
  "results": [
    {
      "assessment_id": 12345,
      "block_name": "LUDHIANA",
      "district_name": "LUDHIANA",
      "state_name": "PUNJAB",
      "year": "2023-2024",
      "category": "over_exploited",
      "stage": 142.5,
      "score": 0.95,
      "search_type": "hybrid",
      "text_representation": "Location: LUDHIANA | Status: over_exploited | ..."
    }
  ],
  "total_results": 10,
  "search_types": ["keyword", "semantic"]
}
```

### GET `/api/v1/rag/assessment?id=12345`

Get specific assessment by ID

## 🔥 Use Cases

### 1. Natural Language Questions

```json
{ "query": "Which regions have declining groundwater?" }
```

### 2. Exact Keyword Match

```json
{ "query": "over_exploited", "use_semantic": false }
```

### 3. Contextual Search

```json
{ "query": "areas at risk of water scarcity" }
```

### 4. Filtered Search

```json
{
  "query": "high extraction",
  "filter_state": "Punjab",
  "filter_year": "2023-2024"
}
```

## 🐛 Quick Troubleshooting

**pgvector not found?**

```sql
psql -U postgres -c "CREATE EXTENSION vector;"
```

**OpenAI API errors?**

```bash
echo $OPENAI_API_KEY  # Should show your key
```

**Slow ingestion?**

```bash
python ingest_rag_data.py --batch-size 25
```

## 💡 Pro Tips

1. **Start small**: Test with 100 files first
2. **Use filters**: Narrow search for better performance
3. **Hybrid is best**: Combines keyword precision + semantic understanding
4. **Monitor costs**: ~$0.000004 per search query

## 📖 Full Documentation

See `RAG_SETUP_GUIDE.md` for:

- Detailed architecture
- Troubleshooting guide
- Frontend integration examples
- Performance tuning
- Cost breakdowns

---

**Ready to go! 🚀**
