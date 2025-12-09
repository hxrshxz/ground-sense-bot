#!/bin/bash
# Cache Warming Script for Ground Sense Bot
# Run this after starting the backend to pre-populate Redis cache

API_URL="http://localhost:8081/api/debug/chat"
CONTENT_TYPE="Content-Type: application/json"

echo "🔥 Starting Cache Warming for Ground Sense Bot..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Counter for tracking
COUNT=0
TOTAL=0

send_query() {
    local query="$1"
    ((TOTAL++))
    echo -n "[$TOTAL] $query... "
    RESPONSE=$(curl -s -X POST "$API_URL" -H "$CONTENT_TYPE" -d "{\"message\": \"$query\"}" 2>/dev/null)
    if [[ $? -eq 0 ]] && [[ ! "$RESPONSE" =~ "error" ]]; then
        echo "✅ Cached"
        ((COUNT++))
    else
        echo "⚠️ Warning"
    fi
}

echo "📊 Caching State Queries..."
echo "─────────────────────────────"
STATES=("Punjab" "Haryana" "Rajasthan" "Gujarat" "Maharashtra" "Madhya Pradesh" "Uttar Pradesh" "Karnataka" "Tamil Nadu" "Andhra Pradesh")
for state in "${STATES[@]}"; do
    send_query "$state groundwater status"
done
echo ""

echo "🏙️ Caching District Queries..."
echo "─────────────────────────────"
DISTRICTS=("Ludhiana" "Amritsar" "Patiala" "Gurdaspur" "Bathinda" "Jaipur" "Ahmedabad" "Pune" "Nagpur" "Indore")
for district in "${DISTRICTS[@]}"; do
    send_query "$district district overview"
done
echo ""

echo "📋 Caching List Queries..."
echo "─────────────────────────────"
send_query "Show all states"
send_query "Show districts in Punjab"
send_query "Show districts in Haryana"
send_query "Show districts in Rajasthan"
send_query "Show districts in Gujarat"
echo ""

echo "🔴 Caching Category Queries..."
echo "─────────────────────────────"
send_query "Critical blocks in Punjab"
send_query "Over-exploited blocks in Punjab"
send_query "Safe blocks in Punjab"
send_query "Critical blocks in Haryana"
send_query "Over-exploited blocks in Haryana"
send_query "Safe blocks in Haryana"
send_query "Critical blocks in Rajasthan"
send_query "Safe blocks in Uttar Pradesh"
echo ""

echo "📈 Caching Comparison Queries..."
echo "─────────────────────────────"
send_query "Compare Punjab and Haryana"
send_query "Compare Ludhiana and Amritsar"
send_query "Compare Rajasthan and Gujarat"
send_query "Compare Punjab and Rajasthan"
echo ""

echo "📉 Caching Trend Queries..."
echo "─────────────────────────────"
send_query "Show trend for Punjab"
send_query "Show trend for Haryana"
send_query "Show trend for Ludhiana"
echo ""

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 Cache Warming Complete!"
echo "✅ Successfully cached: $COUNT / $TOTAL queries"
echo ""
echo "📊 Redis Status:"
docker exec ground-sense-redis redis-cli DBSIZE
echo ""
echo "⚡ All common queries will now be INSTANT for users!"
