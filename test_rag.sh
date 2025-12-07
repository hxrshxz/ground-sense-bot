#!/bin/bash

# RAG System Test Script
# This script tests all RAG endpoints to verify the system is working

set -e

API_BASE="http://localhost:8080/api/v1"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🧪 Testing RAG System"
echo "===================="
echo ""

# Test 1: Health Check
echo "📡 Test 1: Health Check"
response=$(curl -s -X GET "$API_BASE/../health")
if echo "$response" | grep -q "ok"; then
    echo -e "${GREEN}✅ Health check passed${NC}"
else
    echo -e "${RED}❌ Health check failed${NC}"
    exit 1
fi
echo ""

# Test 2: Keyword Search
echo "🔍 Test 2: Keyword Search"
response=$(curl -s -X POST "$API_BASE/rag/search" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "over_exploited",
    "limit": 5,
    "use_keyword": true,
    "use_semantic": false
  }')

if echo "$response" | grep -q "results"; then
    result_count=$(echo "$response" | jq '.total_results')
    echo -e "${GREEN}✅ Keyword search passed - Found $result_count results${NC}"
    echo "Sample result:"
    echo "$response" | jq '.results[0]' | head -10
else
    echo -e "${RED}❌ Keyword search failed${NC}"
    echo "$response"
fi
echo ""

# Test 3: Semantic Search
echo "🧠 Test 3: Semantic Search"
response=$(curl -s -X POST "$API_BASE/rag/search" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Which regions have declining groundwater availability?",
    "limit": 5,
    "use_keyword": false,
    "use_semantic": true
  }')

if echo "$response" | grep -q "results"; then
    result_count=$(echo "$response" | jq '.total_results')
    echo -e "${GREEN}✅ Semantic search passed - Found $result_count results${NC}"
    echo "Sample result:"
    echo "$response" | jq '.results[0].block_name, .results[0].state_name, .results[0].category'
else
    echo -e "${YELLOW}⚠️  Semantic search failed (embeddings may not be generated yet)${NC}"
    echo "$response"
fi
echo ""

# Test 4: Hybrid Search
echo "🔥 Test 4: Hybrid Search (Keyword + Semantic)"
response=$(curl -s -X POST "$API_BASE/rag/search" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "water stressed regions",
    "limit": 10,
    "use_keyword": true,
    "use_semantic": true
  }')

if echo "$response" | grep -q "results"; then
    result_count=$(echo "$response" | jq '.total_results')
    search_types=$(echo "$response" | jq '.search_types')
    echo -e "${GREEN}✅ Hybrid search passed - Found $result_count results${NC}"
    echo "Search types used: $search_types"
    echo "Top 3 results:"
    echo "$response" | jq '.results[0:3] | .[] | {block_name, state_name, category, score}'
else
    echo -e "${RED}❌ Hybrid search failed${NC}"
    echo "$response"
fi
echo ""

# Test 5: Filtered Search
echo "🎯 Test 5: Filtered Search (by state and year)"
response=$(curl -s -X POST "$API_BASE/rag/search" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "high groundwater extraction",
    "limit": 5,
    "use_keyword": true,
    "use_semantic": false,
    "filter_state": "Punjab",
    "filter_year": "2023-2024"
  }')

if echo "$response" | grep -q "results"; then
    result_count=$(echo "$response" | jq '.total_results')
    echo -e "${GREEN}✅ Filtered search passed - Found $result_count results${NC}"
    echo "Results from Punjab (2023-2024):"
    echo "$response" | jq '.results[] | {block_name, state_name, year, category}'
else
    echo -e "${RED}❌ Filtered search failed${NC}"
    echo "$response"
fi
echo ""

# Test 6: Get Specific Assessment
echo "📋 Test 6: Get Specific Assessment"

# First get an assessment ID from search
assessment_id=$(curl -s -X POST "$API_BASE/rag/search" \
  -H "Content-Type: application/json" \
  -d '{"query": "over_exploited", "limit": 1, "use_keyword": true}' \
  | jq -r '.results[0].assessment_id')

if [ "$assessment_id" != "null" ] && [ -n "$assessment_id" ]; then
    response=$(curl -s -X GET "$API_BASE/rag/assessment?id=$assessment_id")
    
    if echo "$response" | grep -q "assessment_id"; then
        echo -e "${GREEN}✅ Get assessment passed - Retrieved ID: $assessment_id${NC}"
        echo "Assessment details:"
        echo "$response" | jq '{block_name, district_name, state_name, year, category, stage}'
    else
        echo -e "${RED}❌ Get assessment failed${NC}"
        echo "$response"
    fi
else
    echo -e "${YELLOW}⚠️  Skipped - No assessments found to test with${NC}"
fi
echo ""

# Summary
echo "===================="
echo "🎉 Test Suite Complete"
echo ""
echo -e "${YELLOW}Note:${NC} If semantic search tests failed, you may need to:"
echo "  1. Run the data ingestion script: python Data/ingest_rag_data.py"
echo "  2. Ensure OPENAI_API_KEY is set"
echo ""
echo "For full setup instructions, see: RAG_SETUP_GUIDE.md"
