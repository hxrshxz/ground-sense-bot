# Ground Sense Bot - Embedding Guide

This guide shows you how to embed the Ground Sense Bot chatbot on any website.

## 🚀 Quick Start

### Option 1: Simple Script Tag (Recommended)

Add this script tag to your website's HTML:

```html
<script
  src="https://ground-sense-bot.vercel.app/embed.js"
  data-api-key="your-gemini-api-key-here"
  data-position="bottom-right"
  data-theme="dark"
  data-color="#00d4ff">
</script>
```

### Option 2: Manual Installation

If you prefer to host the files yourself:

```html
<!-- 1. Add the embed script -->
<script src="/path/to/embed.js"></script>

<!-- 2. Initialize manually (optional) -->
<script>
  // Optional: Control the widget programmatically
  window.GroundSenseBot.show();  // Show the chat
  window.GroundSenseBot.hide();  // Hide the chat
</script>
```

## ⚙️ Configuration Options

### Script Attributes

| Attribute | Default | Description |
|-----------|---------|-------------|
| `data-api-key` | `null` | Your Gemini AI API key |
| `data-position` | `bottom-right` | Widget position: `bottom-right`, `bottom-left`, `top-right`, `top-left` |
| `data-theme` | `dark` | Theme: `dark`, `light` |
| `data-color` | `#00d4ff` | Primary color for the widget |
| `data-size` | `medium` | Widget size: `small`, `medium`, `large` |

### Examples

#### Basic Setup
```html
<script src="https://ground-sense-bot.vercel.app/embed.js"></script>
```

#### With API Key
```html
<script
  src="https://ground-sense-bot.vercel.app/embed.js"
  data-api-key="AIzaSy...">
</script>
```

#### Custom Styling
```html
<script
  src="https://ground-sense-bot.vercel.app/embed.js"
  data-position="bottom-left"
  data-theme="light"
  data-color="#ff6b35">
</script>
```

## 🎨 Customization

### CSS Variables

You can override the default styles by adding CSS variables:

```css
:root {
  --ground-sense-primary: #00d4ff;
  --ground-sense-secondary: #00ff88;
  --ground-sense-background: #0f172a;
  --ground-sense-text: #ffffff;
}
```

### Custom Styles

```css
/* Override widget styles */
.ground-sense-bot-widget {
  /* Your custom styles */
}

.ground-sense-bot-toggle {
  /* Custom toggle button */
}

.ground-sense-bot-chat {
  /* Custom chat window */
}
```

## 🔧 Advanced Usage

### Programmatic Control

```javascript
// Show the chat widget
window.GroundSenseBot.show();

// Hide the chat widget
window.GroundSenseBot.hide();

// Check if widget is ready
document.addEventListener('groundSenseBotReady', function(event) {
  console.log('Ground Sense Bot is ready!', event.detail);
});
```

### Custom Integration

```javascript
// Listen for widget events
window.addEventListener('message', function(event) {
  if (event.data.type === 'embed-ready') {
    console.log('Chatbot iframe is loaded');
  }
});
```

## 🌐 Cross-Origin Setup

If you're embedding on a different domain, make sure your server allows the embedding domain:

### Apache (.htaccess)
```
Header set Access-Control-Allow-Origin "https://your-website.com"
Header set Access-Control-Allow-Headers "Content-Type"
```

### Nginx
```
add_header Access-Control-Allow-Origin "https://your-website.com";
add_header Access-Control-Allow-Headers "Content-Type";
```

## 🔒 Security Considerations

1. **API Key Protection**: Never expose your Gemini API key in client-side code
2. **HTTPS Only**: Always use HTTPS for production deployments
3. **Content Security Policy**: Configure CSP headers if needed

## 🐛 Troubleshooting

### Widget Not Loading
- Check browser console for errors
- Verify the script URL is accessible
- Ensure HTTPS is used in production

### API Key Issues
- Verify your Gemini API key is valid
- Check API key permissions
- Ensure the key is not exposed in client-side code

### Styling Issues
- Check for CSS conflicts
- Use browser dev tools to inspect elements
- Override styles with higher specificity

## 📱 Mobile Support

The widget is fully responsive and works on:
- 📱 Mobile phones
- 📱 Tablets
- 💻 Desktop computers

On mobile devices, the chat opens in full-screen mode for better usability.

## 🔄 Updates

The embed script automatically loads the latest version. To force a specific version:

```html
<script src="https://ground-sense-bot.vercel.app/embed.js?v=1.0.0"></script>
```

## 📞 Support

For issues or questions:
- Check the browser console for errors
- Verify your API key configuration
- Test with different browsers

---

**Happy embedding! 🤖**
