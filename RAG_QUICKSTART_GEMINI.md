# 🚀 RAG Quick Start with Gemini & Docker

## ⚡ Super Quick Setup (5 minutes)

### 1️⃣ Set Your Gemini API Key

```bash
export GEMINI_API_KEY="your-gemini-api-key-here"
```

Get your key from: https://makersuite.google.com/app/apikey

### 2️⃣ Run Setup Script

```bash
./setup_rag.sh
```

This will:

- ✅ Start PostgreSQL with pgvector (Docker)
- ✅ Run database migrations
- ✅ Install Python dependencies
- ✅ Verify everything works

### 3️⃣ Ingest Data

**Option A - Test with sample (5 minutes):**

```bash
cd Data
source venv/bin/activate
python ingest_rag_data.py --data-dir ./data/2023-2024 --batch-size 10
```

**Option B - Full ingestion (2-4 hours):**

```bash
cd Data
source venv/bin/activate
python ingest_rag_data.py
```

### 4️⃣ Start Backend

```bash
cd backend
go run cmd/server/main.go
```

### 5️⃣ Test It!

```bash
./test_rag.sh
```

Or manually:

```bash
curl -X POST http://localhost:8080/api/v1/rag/search \
  -H "Content-Type: application/json" \
  -d '{"query":"water stressed regions","limit":5}'
```

---

## 📦 What's Different from OpenAI?

| Feature                | OpenAI                               | Gemini (This Setup)                       |
| ---------------------- | ------------------------------------ | ----------------------------------------- |
| **API Key**            | `OPENAI_API_KEY`                     | `GEMINI_API_KEY`                          |
| **Embedding Model**    | `text-embedding-3-small` (1536 dims) | `text-embedding-004` (768 dims)           |
| **Cost per 1M tokens** | $0.02                                | **FREE** (Gemini has generous free tier!) |
| **Rate Limit**         | 3M tokens/min                        | 1500 requests/min                         |
| **Vector Size**        | 1536 dimensions                      | 768 dimensions                            |

---

## 🐳 Docker Commands

```bash
# Start PostgreSQL
docker compose -f docker-compose-rag.yml up -d

# Stop PostgreSQL
docker compose -f docker-compose-rag.yml down

# View logs
docker logs groundsense-postgres-rag

# Connect to database
docker exec -it groundsense-postgres-rag psql -U admin -d ground_sense_bot

# Start pgAdmin (optional web UI)
docker compose -f docker-compose-rag.yml --profile tools up -d
# Then visit: http://localhost:5050
```

---

## 🔌 Database Connection Info

```
Host: localhost
Port: 5433  ← Your existing port!
Database: ground_sense_bot
User: admin
Password: admin
```

---

## 🎨 API Examples

### Hybrid Search (Keyword + Semantic)

```bash
curl -X POST http://localhost:8080/api/v1/rag/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "declining groundwater in Punjab",
    "limit": 10,
    "use_keyword": true,
    "use_semantic": true,
    "filter_state": "Punjab",
    "filter_year": "2023-2024"
  }'
```

### Keyword Only (Fast, Exact Matches)

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

### Semantic Only (Contextual Understanding)

```bash
curl -X POST http://localhost:8080/api/v1/rag/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Which regions face water scarcity?",
    "limit": 5,
    "use_keyword": false,
    "use_semantic": true
  }'
```

---

## 💰 Cost Breakdown (Gemini)

### One-Time Ingestion (27K records)

- **Gemini API**: **FREE** (within free tier limits)
- **Total Cost**: $0.00 🎉

### Per Query

- **Embedding generation**: FREE
- **1000 queries/day**: FREE
- **Monthly**: FREE

**Note:** Gemini offers 1500 requests/minute for free!

---

## 🐛 Troubleshooting

### Issue: Cannot connect to PostgreSQL

```bash
# Check if container is running
docker ps | grep groundsense-postgres-rag

# If not, start it
docker compose -f docker-compose-rag.yml up -d

# Wait for it to be ready
docker exec groundsense-postgres-rag pg_isready -U admin
```

### Issue: Gemini API key not found

```bash
# Check if set
echo $GEMINI_API_KEY

# If empty, set it
export GEMINI_API_KEY="your-key-here"

# Make it permanent (add to ~/.bashrc or ~/.zshrc)
echo 'export GEMINI_API_KEY="your-key-here"' >> ~/.bashrc
source ~/.bashrc
```

### Issue: pgvector extension not found

```bash
# Connect to database
docker exec -it groundsense-postgres-rag psql -U admin -d ground_sense_bot

# Check if extension exists
SELECT * FROM pg_extension WHERE extname = 'vector';

# If not, create it
CREATE EXTENSION vector;
```

### Issue: Port 5433 already in use

Your existing PostgreSQL might be running on 5433. Options:

**Option A:** Use the Docker container (stop existing PostgreSQL first)

```bash
sudo systemctl stop postgresql
docker compose -f docker-compose-rag.yml up -d
```

**Option B:** Change port in `docker-compose-rag.yml`

```yaml
ports:
  - "5434:5432" # Use 5434 instead
```

---

## 📊 Files Created

```
ground-sense-bot/
├── docker-compose-rag.yml       ← Docker setup with pgvector
├── setup_rag.sh                 ← Automated setup script
├── test_rag.sh                  ← Test all endpoints
├── RAG_QUICKSTART_GEMINI.md     ← This file
├── backend/
│   ├── migrations/
│   │   └── 001_add_rag_support.sql  ← Database migrations
│   └── internal/
│       ├── services/
│       │   └── rag_service.go       ← Hybrid search (Gemini)
│       ├── controllers/
│       │   └── rag_controller.go    ← API endpoints
│       └── database/
│           └── database.go          ← Updated with RAG migrations
└── Data/
    ├── ingest_rag_data.py           ← Data ingestion (Gemini)
    └── requirements-rag.txt         ← Python dependencies
```

---

## 🚀 Next Steps After Setup

1. ✅ Complete data ingestion
2. ✅ Start Go backend
3. ✅ Test hybrid search API
4. 📝 Integrate with your chat interface
5. 🎨 Build UI for search results

---

## 🔥 Pro Tips

1. **Start with sample data** - Test with 100 files first
2. **Use Docker** - Easiest way to get pgvector
3. **Gemini is FREE** - No cost worries for development!
4. **Hybrid is best** - Combines keyword precision + AI understanding
5. **Use filters** - State/year/category filters improve results

---

## 📚 Additional Resources

- [Gemini API Docs](https://ai.google.dev/docs)
- [pgvector GitHub](https://github.com/pgvector/pgvector)
- [Docker Compose Docs](https://docs.docker.com/compose/)

---

**Need help?** Check `RAG_SETUP_GUIDE.md` for detailed documentation!

**Ready? Run:** `./setup_rag.sh` 🚀
