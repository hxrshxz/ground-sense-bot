# 🎯 Quick Demo Guide - Live Logging System

## Setup (2 minutes before demo)

### 1. Backend Terminal (LEFT SCREEN)
```bash
cd backend
air
```
**Keep this terminal VISIBLE and MAXIMIZED during demo!**

### 2. Frontend Terminal (Background)
```bash
npm run dev
```

### 3. Browser (RIGHT SCREEN)
- Open: http://localhost:5173
- Press **F12** → **Console** tab
- **Keep Console visible** during demo

## Demo Script (Show Judges)

### Example 1: Comparison Query
**Type**: "compare amritsar and ludhiana"

**Point Out**:
1. **Backend Terminal** (LEFT):
   - ✅ Intent classified as COMPARE
   - ✅ Locations extracted: [amritsar, ludhiana]
   - ✅ Database retrieves 2 districts
   - ✅ Best/worst calculated
   - ✅ Chart payload created

2. **Browser Console** (RIGHT):
   - ✅ WebSocket receives message
   - ✅ Chart rendering with location details
   - ✅ Data validation and transformation

### Example 2: Trend Analysis
**Type**: "show trend for punjab"

**Point Out**:
- Intent: TREND
- Historical data retrieval
- Timeline chart generation
- Year-over-year analysis

### Example 3: Map Visualization
**Type**: "show map of critical blocks"

**Point Out**:
- Geographic data processing
- GeoJSON generation
- Category-based coloring

## Key Talking Points

1. **"Notice the real-time AI processing in the left terminal"**
   - Natural language → Intent classification
   - Entity extraction (locations, years)
   - Smart context awareness

2. **"The system routes to specialized handlers"**
   - Compare → Comparison handler
   - Trend → Trend handler
   - Each optimized for specific query types

3. **"Database queries are executed efficiently"**
   - SQL generation based on intent
   - Results validated and transformed
   - Error handling at every step

4. **"Frontend receives structured data"**
   - WebSocket real-time communication
   - Chart components render dynamically
   - Responsive visualization

5. **"Full pipeline < 500ms"**
   - From query input to visualization
   - Hot reload for instant updates

## Emoji Legend (for judges)
- 📨 User message
- 🧠 AI processing
- 🔍 Database query
- 📊 Visualization
- ✅ Success
- ❌ Error
- 🏆 Best performer
- ⚠️ Warning

## Emergency Recovery
If logs stop appearing:
1. Check Air is running: `ps aux | grep air`
2. Restart: `cd backend && air`
3. Refresh browser: F5
4. Check WebSocket: Look for "🔌 WEBSOCKET CONNECTED"
