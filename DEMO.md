# 🎭 DEMO INSTRUCTIONS FOR JUDGES

## Quick Start (2 Options)

### Option 1: Just Run the App (Easy Demo)
```bash
npm run dev
```
- Go to http://localhost:5173
- Click "Analyze Map" in the chat
- See the automation simulation with realistic progress messages
- AI will analyze the generated map data automatically

### Option 2: Full Playwright Automation (Real Deal!)
```bash
# Terminal 1
npm run automation:server

# Terminal 2  
npm run dev
```
- Go to http://localhost:5173  
- Click "Analyze Map" in the chat
- Watch REAL Playwright automation open browser and interact with INGRES map!
- Downloads actual data and analyzes with AI

## What You'll See

### 🤖 Automation Features:
- ✅ Opens browser automatically
- ✅ Navigates to INGRES groundwater map
- ✅ Performs 11 precise link clicks + 1 button click
- ✅ Downloads map image data
- ✅ Takes screenshot for analysis
- ✅ Returns data to React app

### 🧠 AI Integration:
- ✅ Automatically analyzes map data with comprehensive prompt
- ✅ Provides groundwater insights and recommendations
- ✅ Uses advanced Gemini vision capabilities

### 🚀 Deployment Ready:
- ✅ Works with Vercel serverless functions
- ✅ No separate server needed in production
- ✅ Scales automatically

## Cool Technical Details

1. **Smart Client**: Detects if running locally vs production
2. **Serverless Functions**: Uses Vercel API routes for production
3. **Progressive Enhancement**: Works with or without automation server
4. **Real Playwright**: Actual browser automation, not just simulation
5. **AI Vision**: Comprehensive groundwater analysis with predefined prompts

## Production Deployment

When deployed to Vercel:
- No server setup needed
- Automation runs as serverless function
- Returns base64 images directly to frontend
- Auto-triggers AI analysis

**Just push to GitHub + connect to Vercel = It works!** 🎉