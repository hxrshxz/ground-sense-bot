# 📊 INGRES AI Assistant - Live Logging System

## For Hackathon Demo

This logging system provides real-time visibility into the AI processing pipeline for judges to see exactly what's happening behind the scenes.

## 🎯 What Gets Logged

### Backend (Go Server)

Located in terminal running `air` in `/backend` directory:

1. **📨 User Message Reception**

   - Username, timestamp, query text
   - Session management (new/existing)

2. **🧠 AI Processing Pipeline**

   - Intent classification results
   - Entity extraction (locations, years)
   - Dynamic SQL generation
   - Context merging (using conversation history)

3. **🔍 Database Operations**

   - SQL query execution
   - Number of rows retrieved
   - Error handling

4. **⚖️ Comparison Handler**

   - Location resolution (states/districts/blocks)
   - Best/worst performer calculation
   - Chart payload construction

5. **📊 Chart Generation**

   - Chart type selection
   - LLM-assisted visualization
   - Data transformation

6. **📤 Response Summary**
   - Intent, chart type, response length
   - Map features count

### Frontend (Browser Console - F12)

Press F12 in browser to see:

1. **🔌 WebSocket Connection**

   - Connection status, URL, username
   - Reconnection attempts

2. **📤 Message Sending**

   - User queries being sent
   - Request timestamp

3. **📨 Message Reception**

   - Response type (text, chart, map)
   - Intent classification
   - Chart/map metadata

4. **📊 Chart Rendering**
   - Chart type and configuration
   - Location data details
   - Metrics values (rainfall, recharge, stage)

## 🚀 How to Use During Demo

### Setup (Before Demo):

1. **Terminal 1 - Backend Server**

   ```bash
   cd backend
   air
   ```

   Keep this visible! This shows all AI processing.

2. **Terminal 2 - Frontend Dev Server**

   ```bash
   npm run dev
   ```

3. **Browser Console**
   - Open application: http://localhost:5173
   - Press F12 to open Developer Tools
   - Go to "Console" tab
   - Keep this visible on second monitor/screen

### During Demo:

1. **Show Backend Terminal to Judges**

   - Point out the structured logging format
   - Explain each pipeline step as it processes

2. **Show Browser Console**

   - Demonstrate WebSocket real-time communication
   - Show chart data being processed
   - Highlight the separation of concerns

3. **Example Demo Flow**:

   ```
   User types: "compare amritsar and ludhiana"

   BACKEND SHOWS:
   ════════════════════════════════════════════════════════
   📨 NEW USER MESSAGE | User: demo | Time: 02:45:30
   💬 Query: "compare amritsar and ludhiana"
   ════════════════════════════════════════════════════════

   🧠 AI PROCESSING PIPELINE
   ├─ Step 1: Intent Classification & Entity Extraction...
   ├─ ✅ Intent Detected: INTENT_COMPARE
   ├─ 📍 Locations Found: [amritsar ludhiana]
   ├─ 📅 Year: 2024-2025

   ├─ Step 2: Intent Handler Routing
   ├─ 🎯 Routing to handler: INTENT_COMPARE
   ├─ ⚖️  Executing Comparison Handler...

   🔍 COMPARISON HANDLER
   ├─ Comparing 2 locations: [amritsar ludhiana]
   ├─ Year: 2024-2025
   ├─ Searching database for locations...
   ├─ ✅ Found: 0 states, 2 districts, 0 blocks
   ├─ 🏙️  Routing to DISTRICT comparison handler
   ├─ ✅ Retrieved data for 2 districts
   ├─ 📊 Calculating best/worst performers...
   ├─ 🏆 Best: Amritsar (156.2% stage)
   ├─ ⚠️  Worst: Ludhiana (179.8% stage)
   ├─ 📦 Building comparison chart payload...
   ├─ ✅ Chart created with 2 locations
   └─ 📤 Sending response to frontend...

   📤 RESPONSE SUMMARY
   ├─ Intent: INTENT_COMPARE
   ├─ Chart Type: comparison-card
   ├─ Chart Title: District Comparison - 2024-2025
   └─ Response Length: 387 characters
   ════════════════════════════════════════════════════════

   BROWSER CONSOLE SHOWS:
   ════════════════════════════════════════════════════════
   📨 WEBSOCKET MESSAGE RECEIVED
   ├─ Type: response
   ├─ Sender: Bot
   ├─ Intent: INTENT_COMPARE
   ├─ Chart Type: comparison-card
   ├─ Chart Title: District Comparison - 2024-2025
   ├─ Comparison Type: district
   ├─ Locations: 2
   └─ Message parsed successfully
   ════════════════════════════════════════════════════════

   📊 COMPARISON CHART RENDERING
   ├─ Type: DISTRICT
   ├─ Year: 2024-2025
   ├─ Locations: 2
   ├─ [1] Amritsar:
   │  ├─ Rainfall: 582mm
   │  ├─ Recharge: 1234.5 MCM
   │  ├─ Stage: 156.2%
   │  └─ Category: Critical
   ├─ [2] Ludhiana:
   │  ├─ Rainfall: 623mm
   │  ├─ Recharge: 1456.7 MCM
   │  ├─ Stage: 179.8%
   │  └─ Category: Over-exploited
   └─ Rendering horizontal bar chart...
   ════════════════════════════════════════════════════════
   ```

## 🎨 Log Format Explanation

- **📨** User input/messages
- **🧠** AI/ML processing
- **🔍** Database operations
- **📊** Data visualization
- **✅** Success operations
- **❌** Errors
- **⚠️** Warnings
- **📤** Outgoing data
- **📥** Incoming data
- **🔌** Connection status
- **⚖️** Comparison operations
- **🏆** Best performers
- **📍** Location data
- **📅** Time/date information

## 💡 Talking Points for Judges

1. **Real-time AI Processing**

   - "Notice how the system immediately classifies intent from natural language"
   - "Entity extraction automatically identifies locations and time periods"

2. **Context Awareness**

   - "The system maintains conversation context - users can ask follow-up questions"
   - "Previous locations are remembered for contextual queries"

3. **Smart Routing**

   - "Different intents route to specialized handlers"
   - "Database queries are optimized per handler type"

4. **Visualization Intelligence**

   - "LLM helps choose appropriate chart types"
   - "Charts adapt based on data characteristics"

5. **Error Handling**

   - "Every step has validation and error recovery"
   - "Users get helpful feedback when data is missing"

6. **Performance**
   - "Full pipeline typically completes in < 500ms"
   - "Hot reload enabled for instant updates during development"

## 🔧 Customization

To add more logging, edit:

- **Backend**: `/backend/internal/services/chat_service.go`
- **Frontend**: `/src/hooks/useChatWebSocket.ts` and chart components

Use consistent emoji prefixes and structured format:

```go
fmt.Printf("├─ 📊 Your log message: %v\n", data)
```

```typescript
console.log(`├─ 📊 Your log message: ${data}`);
```

## 📝 Notes

- Logs are color-coded in terminals that support ANSI colors
- All timestamps use IST (Indian Standard Time)
- WebSocket connection logs help debug connectivity issues
- Chart rendering logs show exact data being visualized
