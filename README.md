# Ground Sense Bot 🤖

An intelligent AI-powered chatbot for India's groundwater data analytics, featuring real-time insights, interactive visualizations, and comprehensive data analysis capabilities.

## ✨ Features

- 🤖 **AI-Powered Analysis** - Advanced groundwater data insights using Google Gemini AI
- 📊 **Real-time Dashboard** - Live statistics and proactive alerts
- 💬 **Natural Language Chat** - Conversational interface for data queries
- 📱 **Responsive Design** - Works seamlessly on all devices
- 🎨 **Modern UI** - Beautiful animations and smooth interactions
- 🔧 **Embeddable Widget** - Easy integration into any website
- 🌍 **Multi-language Support** - English and Hindi language options
- 📁 **File Upload Support** - Analyze custom datasets
- 🔒 **Secure Authentication** - API key management system

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

## 🎯 Embedding on Your Website

### Simple Integration

Add this script tag to embed the chatbot on any website:

```html
<script
  src="https://ground-sense-bot.vercel.app/embed.js"
  data-api-key="your-gemini-api-key-here"
  data-position="bottom-right"
  data-theme="dark"
  data-color="#00d4ff"
></script>
```

### Configuration Options

| Attribute       | Default        | Description            |
| --------------- | -------------- | ---------------------- |
| `data-api-key`  | `null`         | Your Gemini AI API key |
| `data-position` | `bottom-right` | Widget position        |
| `data-theme`    | `dark`         | Theme: `dark`, `light` |
| `data-color`    | `#00d4ff`      | Primary color          |

### Programmatic Control

```javascript
// Show/hide the chat widget
window.GroundSenseBot.show();
window.GroundSenseBot.hide();

// Listen for events
document.addEventListener("groundSenseBotReady", function (event) {
  console.log("Chatbot is ready!");
});
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
│   ├── embed.js          # Embeddable script
│   ├── embed.html        # Embed iframe page
│   └── example-embed.html # Usage example
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
├── EMBEDDING_GUIDE.md            # Detailed embedding guide
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
- 📖 Docs: [Embedding Guide](./EMBEDDING_GUIDE.md)

## 🙏 Acknowledgments

- Google Gemini AI for powering the conversational interface
- India's Central Ground Water Board for data insights
- Open source community for amazing tools and libraries

---

**Built with ❤️ for India's groundwater conservation**
