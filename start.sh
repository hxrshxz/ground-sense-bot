#!/bin/bash

# 🚀 ONE COMMAND TO START EVERYTHING!
# This starts PostgreSQL (with pgvector) + Redis + Go Backend

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

cd backend

echo -e "${GREEN}🚀 Starting Ground Sense Bot (with RAG support)${NC}"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env not found, creating from .env.example${NC}"
    cp .env.example .env
    echo ""
    echo "⚠️  Please edit backend/.env and add your GEMINI_API_KEY"
    echo "   Get it from: https://makersuite.google.com/app/apikey"
    exit 1
fi

# Check if GEMINI_API_KEY is set
if ! grep -q "^GEMINI_API_KEY=.\+" .env 2>/dev/null || grep -q "^GEMINI_API_KEY=your" .env 2>/dev/null; then
    echo -e "${YELLOW}⚠️  GEMINI_API_KEY not set in backend/.env${NC}"
    echo ""
    echo "Please add your Gemini API key to backend/.env:"
    echo "   GEMINI_API_KEY=your-key-here"
    echo ""
    echo "Get it from: https://makersuite.google.com/app/apikey"
    exit 1
fi

echo -e "${GREEN}✅ Configuration OK${NC}"
echo ""

# Start everything with Docker Compose
echo "Starting services..."
docker compose up -d

echo ""
echo -e "${GREEN}🎉 Services started!${NC}"
echo ""
echo "📊 Services running:"
echo "   - PostgreSQL (pgvector): localhost:5433"
echo "   - Redis: localhost:6379"
echo "   - Go Backend: localhost:8080"
echo ""
echo "🔗 API Endpoints:"
echo "   - Health: http://localhost:8080/api/v1/health"
echo "   - RAG Search: http://localhost:8080/api/v1/rag/search"
echo "   - WebSocket: ws://localhost:8080/ws"
echo ""
echo "📝 Next steps:"
echo "   1. Wait ~10 seconds for services to be ready"
echo "   2. Test: curl http://localhost:8080/api/v1/health"
echo "   3. To ingest data (one-time): docker compose --profile ingestion up ingestion"
echo ""
echo "📖 View logs: docker compose logs -f app"
echo "🛑 Stop: docker compose down"
echo ""
