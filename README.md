# Ground Sense Bot 🤖

An intelligent AI-powered chatbot for India's groundwater data analytics, featuring real-time insights, interactive visualizations, and comprehensive data analysis capabilities.

## ✨ Features

- 🤖 **AI-Powered Analysis** - Advanced groundwater data insights using Google Gemini AI
- 📊 **Real-time Dashboard** - Live statistics and proactive alerts
- 💬 **Natural Language Chat** - Conversational interface for data queries
- 📱 **Responsive Design** - Works seamlessly on all devices
- 🎨 **Modern UI** - Beautiful animations and smooth interactions
- 🌍 **Multi-language Support** - English and Hindi language options
- 📁 **File Upload Support** - Analyze custom datasets
- 🔒 **Secure Authentication** - API key management system
- 📥 **Report Download** - Save and share reports as PDF or images

## 🚀 Quick Start

### Local Development

1. **Clone the repository:**

   ```bash
   git clone https://github.com/your-username/ground-sense-bot.git
   cd ground-sense-bot
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Set up environment:**

   ```bash
   cp .env.example .env
   # Edit .env with your Gemini API key
   ```

4. **Start development server:**

   ```bash
   npm run dev
   ```

5. **Open your browser:**
   ```
   http://localhost:5173
   ```

### Production Build

```bash
npm run build
npm run preview
```

## 🔧 Configuration

Create a `.env` file with your configuration:

```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
VITE_API_BASE_URL=http://localhost:8080/api/v1
```

## 📚 Usage Examples

### Sample Queries

- "Show data for Delhi block"
- "List all critical blocks in Rajasthan"
- "Generate a proactive insight summary"
- "Compare extraction stages of and Delhi"
- "What are the rainfall patterns this year?"

### API Integration

The chatbot integrates with:

- **Google Gemini AI** for natural language processing
- **Real-time data feeds** for current groundwater levels
- **Historical databases** for trend analysis
- **Satellite imagery** for land use analysis

## 🏗️ Project Structure

```
ground-sense-bot/
├── public/
│   └── placeholder.svg    # Default placeholder image
├── src/
│   ├── components/
│   │   ├── INGRESAssistant.tsx    # Main chatbot component
│   │   ├── BusinessTools.tsx      # Dashboard component
│   │   ├── ApiKeyContext.tsx      # API key management
│   │   └── ui/                    # UI components
│   ├── pages/
│   │   ├── Index.tsx             # Main page
│   │   └── NotFound.tsx          # 404 page
│   ├── services/
│   │   └── geminiApi.ts          # Gemini AI integration
│   └── lib/
│       └── utils.ts              # Utility functions
└── README.md                     # This file
```

## 🛠️ Technologies Used

- **Frontend:** React 18, TypeScript, Vite
- **Styling:** Tailwind CSS, Framer Motion
- **AI:** Google Gemini AI
- **Icons:** Lucide React
- **Charts:** Recharts
- **State:** React Query, Context API

## 🔒 Security

- API keys are stored securely in environment variables
- No sensitive data is exposed in client-side code
- HTTPS required for production deployments
- CORS configured for cross-origin embedding

## 📱 Mobile Support

- Fully responsive design
- Touch-optimized interactions
- Mobile-first approach
- Optimized for all screen sizes

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For support and questions:

- 📧 Email: support@ground-sense-bot.com
- 🐛 Issues: GitHub Issues

## � Downloading Reports

GroundSense Bot provides the ability to download any generated report in multiple formats:

1. **PDF Download**: Perfect for sharing in formal contexts or archiving data.
2. **Image Download**: Quick visual capture of any report for easy sharing.
3. **Share Feature**: On compatible devices, directly share reports through messaging apps, email, etc.

To download a report:

1. Generate any report by asking a question to the AI assistant
2. Once the report is displayed, look for the "Download" button at the bottom
3. Choose your preferred format (PDF or Image) or use the Share option
4. Save the file to your device or share it directly

This feature works with all report types including block assessments, comparison charts, trend analyses, and policy recommendations.

## �🙏 Acknowledgments

- Google Gemini AI for powering the conversational interface
- India's Central Ground Water Board for data insights
- Open source community for amazing tools and libraries

---

**Built with ❤️ for India's groundwater conservation**
