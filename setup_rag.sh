#!/bin/bash

# 🚀 Quick Start Script for RAG System with Gemini
# This script sets up everything you need

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "🚀 Ground Sense Bot - RAG Setup with Gemini"
echo "============================================"
echo ""

# Check if GEMINI_API_KEY is set
if [ -z "$GEMINI_API_KEY" ]; then
    echo -e "${RED}❌ GEMINI_API_KEY not set!${NC}"
    echo ""
    echo "Please set your Gemini API key:"
    echo "  export GEMINI_API_KEY='your-api-key-here'"
    echo ""
    echo "Get your key from: https://makersuite.google.com/app/apikey"
    exit 1
fi

echo -e "${GREEN}✅ Gemini API key found${NC}"
echo ""

# Step 1: Start PostgreSQL with pgvector
echo "📦 Step 1: Starting PostgreSQL with pgvector..."
if docker ps | grep -q groundsense-postgres-rag; then
    echo -e "${YELLOW}⚠️  PostgreSQL container already running${NC}"
else
    docker compose -f docker-compose-rag.yml up -d postgres
    echo "Waiting for PostgreSQL to be ready..."
    sleep 10
    echo -e "${GREEN}✅ PostgreSQL started on port 5433${NC}"
fi
echo ""

# Step 2: Verify database connection
echo "🔌 Step 2: Verifying database connection..."
if docker exec groundsense-postgres-rag pg_isready -U admin -d ground_sense_bot > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Database connection successful${NC}"
else
    echo -e "${RED}❌ Database connection failed${NC}"
    exit 1
fi
echo ""

# Step 3: Install Python dependencies
echo "🐍 Step 3: Installing Python dependencies..."
cd Data/
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate
pip install -q -r requirements-rag.txt
echo -e "${GREEN}✅ Python dependencies installed${NC}"
echo ""

# Step 4: Run backend to trigger migrations
echo "🔧 Step 4: Running backend to trigger RAG migrations..."
cd ../backend/
echo -e "${YELLOW}Starting backend server (will run in background for 10 seconds)...${NC}"
GEMINI_API_KEY=$GEMINI_API_KEY go run cmd/server/main.go > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
sleep 10
kill $BACKEND_PID 2>/dev/null || true
echo -e "${GREEN}✅ Migrations completed${NC}"
echo ""

# Step 5: Ingest data
echo "📥 Step 5: Data ingestion options"
echo ""
echo "You have two options for data ingestion:"
echo ""
echo "Option A - Full ingestion (27K files, ~2-4 hours):"
echo "  cd ../Data"
echo "  source venv/bin/activate"
echo "  python ingest_rag_data.py"
echo ""
echo "Option B - Test with sample data (100 files, ~5 minutes):"
echo "  cd ../Data"
echo "  source venv/bin/activate"
echo "  python ingest_rag_data.py --data-dir ./data/2023-2024 --batch-size 10"
echo ""
echo -e "${YELLOW}📊 Run one of the commands above to start ingestion${NC}"
echo ""

# Summary
echo "============================================"
echo -e "${GREEN}🎉 Setup Complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. Run data ingestion (see options above)"
echo "  2. Start the Go backend: cd backend && go run cmd/server/main.go"
echo "  3. Test the API: ./test_rag.sh"
echo ""
echo "Database info:"
echo "  Host: localhost"
echo "  Port: 5433"
echo "  Database: ground_sense_bot"
echo "  User: admin"
echo "  Password: admin"
echo ""
echo "Useful commands:"
echo "  - View database: docker compose -f docker-compose-rag.yml --profile tools up -d"
echo "    Then visit: http://localhost:5050 (pgAdmin)"
echo ""
echo "  - Stop database: docker compose -f docker-compose-rag.yml down"
echo "  - View logs: docker logs groundsense-postgres-rag"
echo ""
