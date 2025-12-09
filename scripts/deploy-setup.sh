#!/bin/bash

echo "🚀 Setting up Ground Sense Bot for deployment..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the project
echo "🔨 Building project..."
npm run build

# Create deployment info
echo "📋 Creating deployment info..."
cat > dist/DEPLOYMENT_INFO.txt << EOL
🎉 Ground Sense Bot - Deployment Ready!

Features included:
✅ Playwright automation (simulated in production)
✅ AI-powered groundwater analysis
✅ Visual chart enhancements
✅ Serverless functions for Vercel
✅ Auto-scaling architecture

Deploy to Vercel:
1. Connect this repo to Vercel
3. Deploy automatically!

Local testing:
- npm run dev (basic app)
- npm run automation:server + npm run dev (full automation)

Generated at: $(date)
EOL

echo "✅ Deployment setup complete!"
echo ""
echo "🚀 Next steps:"
echo "1. Push to GitHub: git add . && git commit -m 'Deploy ready' && git push"
echo "2. Connect to Vercel and deploy"echo ""
echo "🎭 For judges: npm run dev to see the automation demo!"