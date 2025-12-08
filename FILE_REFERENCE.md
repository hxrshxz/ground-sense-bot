# 📂 ACTUAL FILES IN CODEBASE - For Quick Reference

## BACKEND FILES (Go)

### Core Files

- `backend/main.tf` - Terraform infrastructure config
- `backend/docker-compose.yml` - Docker setup (PostgreSQL, Redis, Ollama)
- `backend/go.mod` - Go dependencies
- `backend/server` - Compiled binary

### Source Code (`backend/internal/`)

**Services** (Business Logic)

- `backend/internal/services/nlp_service.go` - Intent classification & entity extraction
- `backend/internal/services/chat_service.go` - Main message processor & handlers
- `backend/internal/services/database_service.go` - Database queries
- `backend/internal/services/llm_service.go` - LLM API calls (Gemini, Ollama)

**Routes & Controllers**

- `backend/internal/routes/routes.go` - API endpoints setup
- `backend/internal/controllers/chat_controller.go` - Message handling

**Data Access**

- `backend/internal/repositories/` - Database access layer
  - `assessment_repository.go`
  - `block_repository.go`
  - `district_repository.go`
  - `state_repository.go`

**Models** (Data Structures)

- `backend/internal/models/chat.go` - ChatMessage, ChatResponse structs
- `backend/internal/models/assessment.go` - Assessment data models
- `backend/internal/models/enums.go` - Intent enums, constants

**Configuration & Setup**

- `backend/internal/config/config.go` - App configuration
- `backend/internal/database/connection.go` - Database connection

**WebSocket**

- `backend/pkg/websocket/handler.go` - WebSocket message handling

### Entry Point

- `backend/cmd/server/main.go` - Application entry point

---

## FRONTEND FILES (React + TypeScript)

### Core Setup

- `src/main.tsx` - React app entry point
- `src/App.tsx` - Root component
- `src/vite-env.d.ts` - Vite TypeScript definitions
- `vite.config.ts` - Vite bundler config
- `tailwind.config.ts` - Tailwind CSS config
- `postcss.config.js` - PostCSS config

### Chat Interface

- `src/components/INGRESAssistant.tsx` - Main chat UI (2585 lines!)
- `src/hooks/useChatWebSocket.ts` - WebSocket connection hook

### Charts & Visualization

**Main Router**

- `src/components/charts/echarts/ChartRenderer.tsx` - Routes data to correct chart

**Chart Components**

- `src/components/charts/echarts/ComparisonChart.tsx` - Horizontal bars (districts/states)
- `src/components/charts/echarts/TrendAnalysisCard.tsx` - Timeline with autoplay
- `src/components/charts/echarts/MetricsCard.tsx` - Summary numbers
- `src/components/cards/ComparisonCard.tsx` - Legacy comparison (old format)

### Specialized Components

- `src/components/GroundWaterComponent.tsx` - Groundwater analysis
- `src/components/MapLibreGroundwaterMap.tsx` - Geographic map
- `src/components/AIResponseIntegration.tsx` - AI-generated text display
- `src/components/BlockAssessmentCard.tsx` - Block details card
- `src/components/CropRecommendationCard.tsx` - Crop suggestions
- `src/components/PolicyRechargeCard.tsx` - Policy recommendations

### Utilities

- `src/hooks/use-mobile.tsx` - Mobile detection hook
- `src/hooks/use-toast.ts` - Toast notifications
- `src/lib/utils.ts` - Helper functions
- `src/lib/stateDetection.ts` - Location parsing
- `src/services/geminiApi.ts` - Gemini API client
- `src/services/mapAutomationService.ts` - Map API service

### Data Files

- `src/data/groundWaterData.ts` - Hardcoded test data
- `src/data/stateGroundwaterData.ts` - State reference data
- `src/types/` - TypeScript type definitions

---

## CONFIGURATION FILES

### Root Level

- `package.json` - NPM dependencies & scripts
- `tsconfig.json` - TypeScript config
- `tsconfig.app.json` - App TypeScript config
- `tsconfig.node.json` - Node TypeScript config
- `eslint.config.js` - Code linting rules
- `components.json` - shadcn/ui config
- `vercel.json` - Vercel deployment config

### HTML & CSS

- `index.html` - Main HTML file
- `src/index.css` - Global CSS
- `src/App.css` - App component CSS

---

## DATABASE FILES

- `schema.sql` - Database schema (tables, indexes)
- `backend/migrations/` - Migration scripts directory

---

## DOCUMENTATION FILES

- `README.md` - Main project documentation
- `DEPLOY_GUIDE.md` - Deployment instructions
- `DEPLOYMENT.md` - Additional deployment info
- `DEMO.md` - Demo walkthrough
- `CHARTS.md` - Chart types documentation
- `CODE_WALKTHROUGH.md` - ⭐ System architecture deep-dive
- `INTENT_ARCHITECTURE.md` - ⭐ 2-layer intent system
- `REDIS_STATUS.md` - ⭐ Redis analysis
- `JUDGE_CHEAT_SHEET.md` - ⭐ Judge Q&A reference

---

## SCRIPTS & UTILITIES

- `load_data.py` - Python script to load initial data
- `test_websocket.py` - WebSocket testing script
- `test_ws.py` - Alternative WebSocket test
- `scripts/deploy-setup.sh` - Deployment setup script
- `scripts/automationServer.cjs` - Server automation
- `scripts/mapAutomation.cjs` - Map API automation
- `api/map-automation.js` - Map API handler

---

## DATA & ASSETS

- `Data/ingres_gec_data_collector.py` - Data collection script
- `Data/master_index.json` - Data index
- `Data/requirements.txt` - Python dependencies
- `public/robots.txt` - SEO robots file
- `downloads/` - Download directory
- `files/` - Files directory
- `uploads/` - File uploads directory

---

## KEY FILES TO MEMORIZE FOR DEMO

**For Intent & Processing Pipeline:**

1. `backend/internal/services/nlp_service.go` - Where intent detection happens
2. `backend/internal/services/chat_service.go` - Main message processor
3. `src/components/INGRESAssistant.tsx` - Chat UI

**For Comparison Feature:** 4. `backend/internal/services/chat_service.go` - `compareDistricts()` function 5. `src/components/charts/echarts/ComparisonChart.tsx` - Renders horizontal bars

**For Trend Feature:** 6. `backend/internal/services/chat_service.go` - `handleTrend()` function 7. `src/components/charts/echarts/TrendAnalysisCard.tsx` - Timeline visualization

**For Data Structures:** 8. `backend/internal/models/chat.go` - Response payloads 9. `backend/internal/models/enums.go` - Intent types

**For Database:** 10. `schema.sql` - Table definitions 11. `backend/internal/repositories/` - Data access

**For WebSocket:** 12. `backend/pkg/websocket/handler.go` - Real-time communication

---

## JUDGE DEMO FLOW

When judges ask about a feature, point them to:

| Feature         | Backend File                                            | Frontend File                |
| --------------- | ------------------------------------------------------- | ---------------------------- |
| **Compare**     | `nlp_service.go` + `chat_service.go` (compareDistricts) | `ComparisonChart.tsx`        |
| **Trend**       | `nlp_service.go` + `chat_service.go` (handleTrend)      | `TrendAnalysisCard.tsx`      |
| **Map**         | `chat_service.go` (handleMapCategory)                   | `MapLibreGroundwaterMap.tsx` |
| **List Blocks** | `chat_service.go` (handleListBlocks)                    | `INGRESAssistant.tsx`        |
| **Chat UI**     | `routes.go`                                             | `INGRESAssistant.tsx`        |
| **WebSocket**   | `websocket/handler.go`                                  | `useChatWebSocket.ts`        |
| **LLM SQL**     | `llm_service.go` + `nlp_service.go`                     | `ChartRenderer.tsx`          |

---

## QUICK FILE SEARCH TIPS

**If they ask about intent classification:** → `nlp_service.go` line 70
**If they ask about message processing:** → `chat_service.go` line 230
**If they ask about chart rendering:** → `ChartRenderer.tsx` line 115
**If they ask about comparison:** → `chat_service.go` line 2733
**If they ask about database:** → `schema.sql`
**If they ask about API routes:** → `routes.go`
**If they ask about WebSocket:** → `websocket/handler.go`
**If they ask about chat UI:** → `INGRESAssistant.tsx` line 300

---

## FILE COUNT SUMMARY

- **Backend Go files**: 15+ files
- **Frontend React files**: 25+ files
- **Configuration files**: 8 files
- **Documentation files**: 9 files
- **Database files**: 2 files
- **Script files**: 6 files

**Total: 65+ meaningful source files**
