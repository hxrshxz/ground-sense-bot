# 🎯 Your RAG Setup - Complete Guide

**Configured for:**

- ✅ Gemini AI (FREE embeddings!)
- ✅ PostgreSQL on port 5433
- ✅ Docker for easy setup
- ✅ Your existing database structure

---

## 🚀 Quick Start (3 Commands!)

```bash
# 1. Set Gemini API key
export GEMINI_API_KEY="your-key-here"

# 2. Test Gemini connection
python3 test_gemini.py

# 3. Run setup (starts Docker, migrations, everything!)
./setup_rag.sh
```

**That's it!** Your RAG system is ready! 🎉

---

## 📦 What Was Created For You

### 1️⃣ **Docker Setup** (`docker-compose-rag.yml`)

- PostgreSQL with pgvector on port **5433** (your port!)
- Automatic migration execution
- Optional pgAdmin web UI

### 2️⃣ **Database Migrations**

- `backend/migrations/001_add_rag_support.sql`
- `backend/internal/database/database.go` (updated)
- Adds vector columns (768 dims for Gemini)
- Creates indexes for fast search

### 3️⃣ **Data Ingestion** (`Data/ingest_rag_data.py`)

- Reads your 27K JSON files
- Generates Gemini embeddings
- Populates PostgreSQL
- Configured for port **5433** and your DB credentials

### 4️⃣ **Go Backend RAG Service**

- `backend/internal/services/rag_service.go` - Hybrid search with Gemini
- `backend/internal/controllers/rag_controller.go` - API endpoints
- `backend/internal/routes/routes.go` - Routes added

### 5️⃣ **Helper Scripts**

- `setup_rag.sh` - Automated setup
- `test_rag.sh` - Test all endpoints
- `test_gemini.py` - Verify Gemini connectivity

### 6️⃣ **Documentation**

- `RAG_QUICKSTART_GEMINI.md` - Quick reference
- `RAG_SETUP_GUIDE.md` - Detailed guide
- `YOUR_RAG_SETUP.md` - This file!

---

## 🎬 Step-by-Step Setup

### Step 1: Get Gemini API Key (FREE!)

1. Go to: https://makersuite.google.com/app/apikey
2. Click "Create API Key"
3. Copy the key
4. Set it:
   ```bash
   export GEMINI_API_KEY="AIzaSy..."
   ```

### Step 2: Test Gemini

```bash
# Install library
pip3 install google-generativeai

# Test connection
python3 test_gemini.py
```

Expected output:

```
✅ API key found
✅ Gemini configured
✅ Embedding generated successfully!
   Dimensions: 768
```

### Step 3: Start PostgreSQL (Docker)

```bash
# Start with migrations
docker compose -f docker-compose-rag.yml up -d

# Verify it's running
docker ps | grep groundsense-postgres-rag
```

Your database:

- Host: `localhost`
- Port: `5433` ← Your port!
- Database: `ground_sense_bot`
- User: `admin`
- Password: `admin`

### Step 4: Run Backend (Triggers Migrations)

```bash
cd backend
GEMINI_API_KEY=$GEMINI_API_KEY go run cmd/server/main.go
```

Watch for:

```
✅ Running RAG migrations...
✅ RAG migrations completed successfully
```

### Step 5: Ingest Data

**Option A - Test First (100 files, 5 mins):**

```bash
cd Data
pip3 install -r requirements-rag.txt
python3 ingest_rag_data.py --data-dir ./data/2023-2024 --batch-size 10
```

**Option B - Full Dataset (27K files, 2-4 hours):**

```bash
python3 ingest_rag_data.py
```

Expected output:

```
📁 Found 26868 JSON files to process
🔄 Generating embeddings for 50 records...
✅ Inserted 50 records
...
✅ Processing complete!
```

### Step 6: Test It!

```bash
# Start backend
cd backend
go run cmd/server/main.go

# In another terminal, test
./test_rag.sh
```

Or manually:

```bash
curl -X POST http://localhost:8080/api/v1/rag/search \
  -H "Content-Type: application/json" \
  -d '{"query":"water stressed regions","limit":5}'
```

---

## 🔥 Key Features

### Hybrid Search

Combines **keyword** (fast, exact) + **semantic** (AI, contextual):

```bash
curl -X POST http://localhost:8080/api/v1/rag/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "declining groundwater in Punjab",
    "limit": 10,
    "use_keyword": true,
    "use_semantic": true,
    "filter_state": "Punjab"
  }'
```

### Smart Filtering

```json
{
  "query": "high extraction",
  "filter_state": "Punjab",
  "filter_year": "2023-2024",
  "filter_category": "over_exploited"
}
```

### Natural Language

```json
{
  "query": "Which regions face water scarcity?"
}
```

---

## 💰 Costs (Gemini is FREE!)

| Operation                  | OpenAI        | Gemini       |
| -------------------------- | ------------- | ------------ |
| 27K embeddings (ingestion) | $0.11         | **FREE** ✨  |
| 1000 searches/day          | $0.12/month   | **FREE** ✨  |
| Rate limit                 | 3M tokens/min | 1500 req/min |

Gemini's free tier is **very generous** for development! 🎉

---

## 🐛 Common Issues

### "Cannot connect to database on port 5433"

Your existing PostgreSQL might be using 5433:

```bash
# Check what's using port 5433
sudo lsof -i :5433

# Option 1: Stop existing PostgreSQL
sudo systemctl stop postgresql

# Option 2: Use Docker (different port)
# Edit docker-compose-rag.yml: change 5433 to 5434
```

### "GEMINI_API_KEY not found"

```bash
# Check if set
echo $GEMINI_API_KEY

# Set it
export GEMINI_API_KEY="your-key-here"

# Make permanent (add to ~/.bashrc)
echo 'export GEMINI_API_KEY="your-key-here"' >> ~/.bashrc
source ~/.bashrc
```

### "pgvector extension not found"

```bash
# Connect to DB
docker exec -it groundsense-postgres-rag psql -U admin -d ground_sense_bot

# Create extension
CREATE EXTENSION vector;
```

### "Slow ingestion"

```bash
# Reduce batch size
python3 ingest_rag_data.py --batch-size 25

# Or test with sample first
python3 ingest_rag_data.py --data-dir ./data/2023-2024
```

---

## 📊 Database Schema (What Changed)

### New Columns Added

**assessments_summary:**

```sql
embedding vector(768)           -- Gemini embeddings
text_representation TEXT        -- Rich description
search_vector tsvector          -- Full-text search
```

**blocks:**

```sql
embedding vector(768)           -- Location embeddings
description TEXT                -- Block description
search_vector tsvector          -- Full-text search
```

### New Indexes

- `idx_assessments_embedding` (HNSW) - Fast vector search
- `idx_assessments_search_vector` (GIN) - Full-text search
- `idx_assessments_year`, `idx_assessments_category` - Fast filtering

**Your existing data is untouched!** ✅

---

## 🎯 API Endpoints

### POST `/api/v1/rag/search`

Hybrid search

**Request:**

```json
{
  "query": "water stressed regions",
  "limit": 10,
  "use_keyword": true,
  "use_semantic": true,
  "filter_state": "Punjab",
  "filter_year": "2023-2024"
}
```

**Response:**

```json
{
  "results": [
    {
      "assessment_id": 12345,
      "block_name": "LUDHIANA",
      "state_name": "PUNJAB",
      "year": "2023-2024",
      "category": "over_exploited",
      "stage": 142.5,
      "score": 0.95,
      "search_type": "hybrid"
    }
  ],
  "total_results": 10,
  "search_types": ["keyword", "semantic"]
}
```

### GET `/api/v1/rag/assessment?id=12345`

Get specific assessment

---

## 🚀 Production Checklist

Before deploying:

- [ ] Set `GEMINI_API_KEY` in production environment
- [ ] Update database credentials in production
- [ ] Run full data ingestion (27K files)
- [ ] Test all API endpoints
- [ ] Monitor Gemini API usage
- [ ] Set up database backups
- [ ] Configure CORS for frontend
- [ ] Add rate limiting (already in your backend!)

---

## 📚 Quick Commands Reference

```bash
# Docker
docker compose -f docker-compose-rag.yml up -d      # Start
docker compose -f docker-compose-rag.yml down       # Stop
docker logs groundsense-postgres-rag                # Logs

# Database
docker exec -it groundsense-postgres-rag psql -U admin -d ground_sense_bot

# Backend
cd backend && go run cmd/server/main.go

# Ingestion
cd Data && python3 ingest_rag_data.py

# Testing
./test_rag.sh
./test_gemini.py
```

---

## 🎉 You're All Set!

Your RAG system with Gemini is ready to use!

**Next steps:**

1. Run `./setup_rag.sh`
2. Ingest data
3. Test with `./test_rag.sh`
4. Integrate with your chat interface

**Questions?** Check:

- `RAG_QUICKSTART_GEMINI.md` - Quick reference
- `RAG_SETUP_GUIDE.md` - Detailed guide

---

**Built with ❤️ using Gemini AI (FREE!), PostgreSQL, pgvector, and Go**
