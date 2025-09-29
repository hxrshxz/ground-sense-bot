# Deployment Guide

## Vercel Deployment (Serverless)

This project is designed to work seamlessly with Vercel's serverless functions, eliminating the need for a separate server.

### How it works:

1. **Local Development**: Uses `automation:server` script for development
2. **Production (Vercel)**: Uses serverless function at `/api/map-automation`

### Deployment Steps:

1. **Push to GitHub**:

   ```bash
   git add .
   git commit -m "Add Vercel serverless automation"
   git push origin main
   ```

2. **Deploy to Vercel**:

   - Connect your GitHub repo to Vercel
   - Vercel will automatically detect the build settings
   - The `vercel.json` configures the serverless function

3. **Environment Variables**:
   - Add your `VITE_GEMINI_API_KEY` in Vercel dashboard
   - Go to Project Settings > Environment Variables

### Key Files for Vercel:

- `api/map-automation.js` - Serverless function that runs Playwright
- `vercel.json` - Vercel configuration
- Updated `src/services/mapAutomationClient.ts` - Handles both local and production

### Benefits:

- ✅ No separate server needed
- ✅ Scales automatically with Vercel
- ✅ Works in development and production
- ✅ Playwright runs in serverless environment
- ✅ Returns base64 images directly to frontend

### Testing:

**Local Development**:

```bash
npm run automation:server  # Terminal 1
npm run dev                # Terminal 2
```

**Production**: Just deploy to Vercel - no server setup needed!
