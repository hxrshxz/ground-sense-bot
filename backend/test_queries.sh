#!/bin/bash

# Comprehensive Query Test Script
# Tests all major query types to ensure they work correctly

API_URL="http://localhost:8081/api/v1/chat"
SESSION_ID="test-$(date +%s)"

echo "🧪 INGRES AI Assistant - Comprehensive Query Tests"
echo "=================================================="
echo ""

# Function to test a query
test_query() {
    local query="$1"
    local expected_pattern="$2"
    
    echo "📝 Testing: \"$query\""
    echo "   Expecting: $expected_pattern"
    
    response=$(curl -s -X POST "$API_URL" \
        -H "Content-Type: application/json" \
        -d "{\"message\":\"$query\",\"session_id\":\"$SESSION_ID\"}")
    
    text=$(echo "$response" | jq -r '.text // empty')
    
    if [ -z "$text" ]; then
        echo "   ❌ FAIL: No response text"
        return 1
    fi
    
    if echo "$text" | grep -qi "$expected_pattern"; then
        echo "   ✅ PASS"
        echo "   Response: ${text:0:100}..."
    else
        echo "   ❌ FAIL: Expected pattern not found"
        echo "   Response: $text"
    fi
    echo ""
}

# Wait for server to be ready
echo "⏳ Waiting for server to be ready..."
for i in {1..10}; do
    if curl -s "$API_URL" > /dev/null 2>&1; then
        echo "✅ Server is ready!"
        break
    fi
    sleep 1
done
echo ""

# Category: TOP_RANKING queries
echo "🏆 TOP RANKING QUERIES"
echo "----------------------"
test_query "top 10 critical blocks" "critical"
test_query "top 5 over-exploited blocks" "over"
test_query "worst 10 safe areas" "safe"
test_query "top 10 semi-critical blocks" "semi"

# Category: LIST_BLOCKS queries
echo "📋 LIST BLOCKS QUERIES"
echo "----------------------"
test_query "show me critical blocks" "critical"
test_query "list over-exploited blocks in Punjab" "punjab"
test_query "safe blocks in bihar" "safe"

# Category: MAP_CATEGORY queries
echo "🗺️  MAP CATEGORY QUERIES"
echo "------------------------"
test_query "map critical blocks" "critical"
test_query "show me over-exploited blocks on map" "over"

# Category: COMPARE queries
echo "⚖️  COMPARE QUERIES"
echo "------------------"
test_query "compare Amritsar and Ludhiana" "amritsar"
test_query "compare Punjab and Haryana" "punjab"

# Category: SUMMARY queries
echo "📊 SUMMARY QUERIES"
echo "------------------"
test_query "groundwater status in Bihar" "bihar"
test_query "show me data for Patna" "patna"
test_query "give me groundwater data for punjab" "punjab"

# Category: TREND queries
echo "📈 TREND QUERIES"
echo "----------------"
test_query "groundwater trend in Punjab" "punjab"
test_query "show me trend for Bihar over years" "bihar"

# Summary
echo ""
echo "=================================================="
echo "✅ Test suite complete!"
echo "   Check the results above for any failures"
echo "=================================================="
