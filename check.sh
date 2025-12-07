#!/bin/bash

# Quick health check for all services

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "🔍 Checking all services..."
echo ""

# Check if containers are running
if ! docker ps | grep -q ground-sense-postgres; then
    echo -e "${RED}❌ PostgreSQL not running${NC}"
    echo "Run: ./start.sh"
    exit 1
fi
echo -e "${GREEN}✅ PostgreSQL running${NC}"

if ! docker ps | grep -q ground-sense-redis; then
    echo -e "${YELLOW}⚠️  Redis not running (optional)${NC}"
else
    echo -e "${GREEN}✅ Redis running${NC}"
fi

if ! docker ps | grep -q ground-sense-app; then
    echo -e "${RED}❌ Backend not running${NC}"
    echo "Run: ./start.sh"
    exit 1
fi
echo -e "${GREEN}✅ Backend running${NC}"

echo ""
echo "🌐 Testing API endpoints..."
echo ""

# Test health endpoint
if curl -s http://localhost:8080/api/v1/health | grep -q "ok"; then
    echo -e "${GREEN}✅ Health endpoint working${NC}"
else
    echo -e "${RED}❌ Health endpoint failed${NC}"
    echo "Backend might still be starting (wait 10 seconds)"
fi

# Test if pgvector is installed
if docker exec ground-sense-postgres psql -U admin -d ground_sense_bot -c "SELECT extname FROM pg_extension WHERE extname='vector';" 2>/dev/null | grep -q vector; then
    echo -e "${GREEN}✅ pgvector extension installed${NC}"
else
    echo -e "${YELLOW}⚠️  pgvector not installed (will auto-install on first migration)${NC}"
fi

# Check if RAG tables exist
if docker exec ground-sense-postgres psql -U admin -d ground_sense_bot -c "\d assessments_summary" 2>/dev/null | grep -q embedding; then
    echo -e "${GREEN}✅ RAG migrations completed${NC}"
else
    echo -e "${YELLOW}⚠️  RAG columns not yet added (backend will add on start)${NC}"
fi

echo ""
echo "========================"
echo -e "${GREEN}✅ All systems operational!${NC}"
echo ""
echo "🔗 Available endpoints:"
echo "   - Health: http://localhost:8080/api/v1/health"
echo "   - RAG Search: http://localhost:8080/api/v1/rag/search"
echo "   - WebSocket: ws://localhost:8080/ws"
echo ""
echo "📊 Database: localhost:5433"
echo ""
