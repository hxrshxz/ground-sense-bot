# 🚀 ONE COMMAND START!

Everything you need in ONE command! No extra setup needed! 🎉

## ⚡ Quick Start

```bash
./start.sh
```

**That's it!** This starts:

- ✅ PostgreSQL with pgvector (port 5433)
- ✅ Redis
- ✅ Go Backend with RAG support (port 8080)
- ✅ Auto-runs RAG migrations

## 🛑 Stop Everything

```bash
./stop.sh
```

---

## 📋 What You Need

1. **Docker** - Make sure Docker is running
2. **Gemini API Key** - Already in `backend/.env` ✅

Your API key: `AIzaSyBTJVcNHYNA0SejNpwuqdmC4lcvRu6g-BE` ✅

---

## 🎯 Available APIs

Once started (wait ~10 seconds):

### Health Check

```bash
curl http://localhost:8080/api/v1/health
```

### RAG Hybrid Search

```bash
curl -X POST http://localhost:8080/api/v1/rag/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "water stressed regions",
    "limit": 5
  }'
```

### WebSocket Chat

```
ws://localhost:8080/ws
```

---

## 📥 Data Ingestion (Optional - One Time Only)

After everything is running, ingest your 27K files **once**:

```bash
cd backend
docker compose --profile ingestion up ingestion
```

This will:

- Read all JSON files from `Data/data/`
- Generate Gemini embeddings
- Populate PostgreSQL
- Takes 2-4 hours (run once only!)

**Alternative - Quick test (100 files, 5 mins):**

```bash
# Install Python deps
cd Data
pip install -r requirements-rag.txt

# Run ingestion with sample data
python3 ingest_rag_data.py --data-dir ./data/2023-2024 --batch-size 10
```

---

## 🔍 View Logs

```bash
# All services
cd backend && docker compose logs -f

# Just backend
docker logs ground-sense-app -f

# Just database
docker logs ground-sense-postgres -f
```

---

## 🐛 Troubleshooting

### Port already in use?

```bash
# Stop any existing PostgreSQL
sudo systemctl stop postgresql

# Or change port in backend/docker-compose.yml
```

### Docker not installed?

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
# Log out and back in
```

### Services won't start?

```bash
# Clean restart
./stop.sh
docker system prune -f
./start.sh
```

---

## 📊 Database Access

**Connection Info:**

- Host: `localhost`
- Port: `5433`
- Database: `ground_sense_bot`
- User: `admin`
- Password: `admin`

**Connect via psql:**

```bash
docker exec -it ground-sense-postgres psql -U admin -d ground_sense_bot
```

---

## 🎨 What's Different?

### Before (Manual Setup):

```bash
# Start PostgreSQL
docker run -d postgres...

# Install pgvector
sudo apt install pgvector...

# Run migrations
psql < migrations...

# Set env vars
export GEMINI_API_KEY=...

# Start backend
go run cmd/server/main.go
```

### Now (ONE Command):

```bash
./start.sh  # Done! 🎉
```

---

## 🔥 Key Features

✅ **All-in-One** - PostgreSQL + Redis + Go Backend  
✅ **pgvector Built-in** - Ready for RAG  
✅ **Auto-Migrations** - Runs on first start  
✅ **Gemini Integrated** - Uses your API key from `.env`  
✅ **Hot Reload** - Backend restarts on crashes  
✅ **Easy Logs** - `docker compose logs -f`

---

## 📁 File Structure

```
ground-sense-bot/
├── start.sh              ← Run this!
├── stop.sh               ← Stop everything
├── backend/
│   ├── docker-compose.yml  ← Updated with pgvector
│   ├── .env                ← Your Gemini key is here
│   └── migrations/
│       └── 001_add_rag_support.sql  ← Auto-runs
└── Data/
    └── ingest_rag_data.py  ← Run once to populate
```

---

## 🚀 Deployment Workflow

### Development (Daily Use)

```bash
# Start everything
./start.sh

# Code changes? Just restart
docker compose restart app

# View logs
docker compose logs -f app
```

### First Time Setup

```bash
# 1. Start services
./start.sh

# 2. Wait for services (10 seconds)
sleep 10

# 3. Ingest data (one time, 2-4 hours)
cd backend
docker compose --profile ingestion up ingestion
```

### Production

```bash
# Same command!
./start.sh

# Data already ingested? Just start!
```

---

## 💡 Pro Tips

1. **Check health first**: `curl http://localhost:8080/api/v1/health`
2. **Keyword search works immediately** (no embeddings needed)
3. **Semantic search needs ingestion** (run once)
4. **Logs are your friend**: `docker compose logs -f`
5. **Clean slate**: `./stop.sh && docker volume prune -f && ./start.sh`

---

## 🎯 Quick Commands

```bash
# Start
./start.sh

# Stop
./stop.sh

# Restart backend only
cd backend && docker compose restart app

# View logs
cd backend && docker compose logs -f

# Connect to DB
docker exec -it ground-sense-postgres psql -U admin -d ground_sense_bot

# Ingest data (one time)
cd backend && docker compose --profile ingestion up ingestion
```

---

**Everything runs with ONE command!** 🚀

No complex setup, no manual steps, just:

```bash
./start.sh
```

🎉 **Done!**
