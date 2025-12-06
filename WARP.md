# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Ground Sense Bot is an AI-powered groundwater data analytics chatbot for India's InGRES (India-Water Resources Information System) data. It features a React/TypeScript frontend, Go backend with WebSocket support, and integration with Google Gemini AI for natural language processing and image analysis.

## Development Commands

### Frontend (React + Vite)

```bash
# Development server (runs on http://localhost:5173)
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Linting
npm run lint

# Build in development mode
npm run build:dev
```

### Backend (Go)

```bash
# Navigate to backend directory
cd backend

# Build and run server directly
go build -o server ./cmd/server/main.go
./server

# Run with hot-reload (requires Air - https://github.com/cosmtrek/air)
air

# Build for production
go build -o server ./cmd/server/main.go

# Run with Docker Compose (includes PostgreSQL and Redis)
docker-compose up -d

# View logs
docker-compose logs -f app
```

### Testing

No test runner scripts are configured. The project uses ad-hoc testing:
- Frontend: Manual testing via browser
- Backend: WebSocket test scripts exist (`test_websocket.py`, `test_ws.py`)
- To run Python tests: `python3 test_websocket.py` or `python3 test_ws.py`

### Automation & Demo

```bash
# Run automation server (for Playwright map scraping)
npm run automation:server

# Show demo instructions
npm run demo
```

### Deployment

```bash
# Setup for Vercel deployment
npm run deploy:setup

# Deploy to Vercel (requires Vercel CLI)
npm run deploy:vercel
```

## Architecture

### High-Level System Design

```
┌─────────────────┐     WebSocket      ┌──────────────────┐
│  React Frontend │◄──────────────────►│   Go Backend     │
│   (Port 5173)   │                    │   (Port 8080)    │
└─────────────────┘                    └──────────────────┘
        │                                       │
        │                                       ├─► PostgreSQL (Port 5433)
        │                                       ├─► Redis (Port 6379)
        │                                       └─► InGRES API (External)
        ▼
  Google Gemini AI
```

### Frontend Architecture

**Tech Stack**: React 18, TypeScript, Vite, Tailwind CSS, Framer Motion, Recharts

**Key Components**:
- `INGRESAssistant.tsx` - Main chatbot interface with WebSocket connection
- `BusinessTools.tsx` - Dashboard component
- `StateDeepDiveCard.tsx` - Advanced state-level groundwater analytics visualization
- `ApiKeyContext.tsx` - Manages API key state

**Services**:
- `geminiApi.ts` - Google Gemini AI integration with fallback model support
- Handles both text generation and image analysis (vision capabilities)

**State Management**:
- React Query (`@tanstack/react-query`) for server state
- Context API for API keys and global state

### Backend Architecture

**Tech Stack**: Go 1.24, PostgreSQL, Redis, WebSocket (gorilla/websocket)

**Directory Structure** (Standard Go project layout):
```
backend/
├── cmd/server/main.go          # Application entry point
├── internal/
│   ├── config/                 # Configuration management
│   ├── database/               # Database connection & setup
│   ├── chat/                   # WebSocket hub & client management
│   ├── controllers/            # HTTP handlers (INGRES API endpoints)
│   ├── services/               # Business logic layer
│   │   ├── chat_service.go     # Chat orchestration
│   │   ├── nlp_service.go      # Natural language processing
│   │   ├── llm_service.go      # Google Gemini LLM integration
│   │   └── ingres_service.go   # InGRES API integration
│   ├── repositories/           # Data access layer
│   │   └── ingres_repository.go
│   └── routes/                 # Route registration
│       └── routes.go
└── pkg/                        # Public packages (if any)
```

**Service Layer Pattern**:
The backend follows a clean architecture with three main layers:

1. **Controllers** (`internal/controllers/`) - HTTP request/response handling
2. **Services** (`internal/services/`) - Business logic and orchestration
   - `ChatService` - Processes chat messages, coordinates NLP and data fetching
   - `NLPService` - Extracts intents and entities using Gemini LLM
   - `LLMService` - Direct Gemini API wrapper
   - `IngresService` - Business logic for InGRES data operations
3. **Repositories** (`internal/repositories/`) - Database queries and external API calls

**WebSocket Flow**:
```
Client Connection → Hub.Register → Hub.Run (goroutine)
User Message → Client.readPump → Hub.Broadcast
Hub.Broadcast → ChatService.ProcessMessage (async goroutine)
ChatService → NLPService → LLMService → Gemini AI
ChatService → IngresService → InGRES API / PostgreSQL
Response → Hub.Broadcast → Client.writePump → Frontend
```

### Data Flow

**Chat Message Processing**:
1. User sends message via WebSocket
2. Backend NLPService extracts intent (e.g., "list_blocks", "get_assessment")
3. ChatService routes to appropriate IngresService method
4. IngresService fetches data from PostgreSQL or InGRES API
5. Response formatted (with optional chart data) and sent back via WebSocket
6. Frontend renders response with appropriate UI components

**InGRES API Integration**:
The backend calls the InGRES GEC API with a hierarchical structure:
- Level 0: COUNTRY (India root) → returns states
- Level 1: STATE → returns districts  
- Level 2: DISTRICT → returns blocks
- Level 3: BLOCK → returns full groundwater data

See `Data/API_SPECIFICATION.md` for complete API details.

### Key Data Limitation

**Critical**: InGRES API only has block-level data for 2024-2025. Historical years (2023 and earlier) only have state/district aggregates. Queries should target state-level analysis for historical data and block-level for current year.

## Environment Variables

### Frontend (.env)
```bash
VITE_GEMINI_API_KEY=your_gemini_api_key_here
VITE_API_BASE_URL=http://localhost:8080/api/v1  # Optional, for backend API
```

### Backend (.env)
```bash
# Server
SERVER_HOST=0.0.0.0
SERVER_PORT=8080

# Database
DB_HOST=localhost
DB_PORT=5433
DB_USER=admin
DB_PASSWORD=admin
DB_NAME=ground_sense_bot
DB_SSLMODE=disable

# Redis (optional)
REDIS_HOST=localhost
REDIS_PORT=6379

# Gemini AI
GEMINI_API_KEY=your_gemini_api_key_here
```

See `.env.example` files in root and `backend/` directories for templates.

## Database

**Schema**: PostgreSQL schema defined in `schema.sql`
**Setup**: Docker Compose automatically creates the database (see `backend/docker-compose.yml`)
**Connection**: Backend uses `lib/pq` driver

To manually load schema:
```bash
psql -h localhost -p 5433 -U admin -d ground_sense_bot -f schema.sql
```

## Special Features

### Playwright Map Automation
The system includes browser automation (Playwright) to scrape InGRES groundwater maps:
- Local development: `npm run automation:server` runs a Node.js server
- Production: Vercel serverless function in `api/` directory
- Demo mode: Simulates automation with realistic progress

### State Deep Dive Component
`StateDeepDiveCard` provides comprehensive single-state analytics with animated tabs:
- Overview, Sectors, Trends, Recharge, Drivers, Risk, Actions
- Auto-triggered after map analysis
- Detects state names in AI responses
- Chat commands: `deep dive <state>` or `state deep dive <state>`

### Multi-language Support
- English and Hindi support
- Language selection in UI

## File Organization

- `/api/` - Vercel serverless functions
- `/backend/` - Go backend server
- `/Data/` - Data collection scripts and documentation
- `/downloads/` - Downloaded files (gitignored)
- `/public/` - Static assets
- `/scripts/` - Deployment and automation scripts
- `/src/` - React frontend source
  - `/components/` - React components
  - `/services/` - API services
  - `/data/` - Static data and prompts
  - `/pages/` - Route pages
  - `/types/` - TypeScript types
  - `/hooks/` - Custom React hooks

## Common Workflows

### Adding a New InGRES API Endpoint
1. Add repository method in `backend/internal/repositories/ingres_repository.go`
2. Add service method in `backend/internal/services/ingres_service.go`
3. Update ChatService intent handling in `backend/internal/services/chat_service.go`
4. Update NLPService intent extraction in `backend/internal/services/nlp_service.go`
5. Add controller handler if needed in `backend/internal/controllers/`
6. Register route in `backend/internal/routes/routes.go`

### Adding a New Frontend Component
1. Create component in `src/components/`
2. Export from `src/components/index.ts` (if barrel export exists)
3. Import and use in parent component
4. Add TypeScript types in `src/types/` if needed

### Debugging WebSocket Issues
1. Check backend logs: `docker-compose logs -f app` or view `backend/server.log`
2. Use browser DevTools → Network → WS tab
3. Test with Python scripts: `python3 test_websocket.py`
4. Check Hub goroutine handling in `backend/internal/chat/hub.go`

## Deployment Notes

- **Frontend**: Deploys to Vercel as static site with API routes
- **Backend**: Can run as standalone server or containerized with Docker
- **Production**: Uses serverless functions for automation (no separate Playwright server)
- **CORS**: Configured for cross-origin requests (see `vite.config.ts` and backend routes)

## Important Conventions

- **Go Code**: Follow standard Go idioms (exported names, error handling, interfaces)
- **Frontend**: Use TypeScript, functional components with hooks
- **Styling**: Tailwind CSS utility classes, Framer Motion for animations
- **Error Handling**: Backend logs all errors with context using logrus
- **WebSocket Messages**: Use structured `models.Message` type with Type and Payload fields
