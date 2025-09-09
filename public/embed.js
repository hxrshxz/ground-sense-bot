// Ground Sense Bot Embed Script
// This script loads the chatbot widget on any website

(function() {
  'use strict';

  // Configuration
  const CONFIG = {
    scriptUrl: window.location.origin + '/embed.js',
    widgetUrl: window.location.origin + '/embed.html',
    apiKey: null,
    position: 'bottom-right',
    theme: 'dark',
    primaryColor: '#00d4ff',
    size: 'medium'
  };

  // Utility functions
  function createElement(tag, attrs = {}) {
    const element = document.createElement(tag);
    Object.keys(attrs).forEach(key => {
      if (key === 'style' && typeof attrs[key] === 'object') {
        element.style.cssText = Object.entries(attrs[key])
          .map(([prop, value]) => `${prop.replace(/([A-Z])/g, '-$1').toLowerCase()}:${value}`)
          .join(';');
      } else {
        element.setAttribute(key, attrs[key]);
      }
    });
    return element;
  }

  function loadStyles() {
    const styles = `
      .ground-sense-bot-widget {
        position: fixed;
        z-index: 999999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
        border-radius: 16px;
        overflow: hidden;
        transition: all 0.3s ease;
      }

      .ground-sense-bot-widget.bottom-right {
        bottom: 20px;
        right: 20px;
      }

      .ground-sense-bot-widget.bottom-left {
        bottom: 20px;
        left: 20px;
      }

      .ground-sense-bot-widget.top-right {
        top: 20px;
        right: 20px;
      }

      .ground-sense-bot-widget.top-left {
        top: 20px;
        left: 20px;
      }

      .ground-sense-bot-toggle {
        width: 60px;
        height: 60px;
        background: linear-gradient(135deg, #00d4ff, #00ff88);
        border: none;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 24px;
        transition: all 0.3s ease;
        box-shadow: 0 4px 20px rgba(0, 212, 255, 0.4);
      }
      
      /* Toggle button sizes */
      .ground-sense-bot-widget.small .ground-sense-bot-toggle {
        width: 50px;
        height: 50px;
        font-size: 20px;
      }
      
      .ground-sense-bot-widget.large .ground-sense-bot-toggle {
        width: 70px;
        height: 70px;
        font-size: 28px;
      }

      .ground-sense-bot-toggle:hover {
        transform: scale(1.05);
        box-shadow: 0 6px 25px rgba(0, 212, 255, 0.6);
      }

      .ground-sense-bot-chat {
        width: 380px;
        height: 600px;
        background: #0f172a;
        border: 1px solid #1e293b;
        display: none;
      }
      
      /* Size variations */
      .ground-sense-bot-widget.small .ground-sense-bot-chat {
        width: 320px;
        height: 500px;
      }
      
      .ground-sense-bot-widget.medium .ground-sense-bot-chat {
        width: 980px;
        height: 700px;
      }
      
      .ground-sense-bot-widget.large .ground-sense-bot-chat {
        width: 450px;
        height: 700px;
      }

      .ground-sense-bot-chat.open {
        display: block;
      }

      .ground-sense-bot-iframe {
        width: 100%;
        height: 100%;
        border: none;
        border-radius: 16px;
      }

      .ground-sense-bot-minimize {
        position: absolute;
        top: 10px;
        right: 10px;
        background: rgba(255, 255, 255, 0.1);
        border: none;
        border-radius: 50%;
        width: 30px;
        height: 30px;
        color: white;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        z-index: 1000000;
      }

      @media (max-width: 480px) {
        .ground-sense-bot-chat {
          width: 100vw;
          height: 100vh;
          position: fixed;
          top: 0;
          left: 0;
          border-radius: 0;
        }

        .ground-sense-bot-widget.bottom-right,
        .ground-sense-bot-widget.bottom-left {
          bottom: 10px;
          right: 10px;
          left: auto;
        }
      }
    `;

    const styleSheet = createElement('style', { type: 'text/css' });
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
  }

  function createWidget() {
    // Create main widget container
    const widget = createElement('div', {
      class: `ground-sense-bot-widget ${CONFIG.position} ${CONFIG.size}`,
      id: 'ground-sense-bot-widget'
    });

    // Create toggle button
    const toggle = createElement('button', {
      class: 'ground-sense-bot-toggle',
      id: 'ground-sense-bot-toggle',
      'aria-label': 'Open Ground Sense Bot Chat'
    });
    toggle.innerHTML = '🤖';

    // Create chat container
    const chat = createElement('div', {
      class: 'ground-sense-bot-chat',
      id: 'ground-sense-bot-chat'
    });

    // Create minimize button
    const minimize = createElement('button', {
      class: 'ground-sense-bot-minimize',
      id: 'ground-sense-bot-minimize',
      'aria-label': 'Minimize chat'
    });
    minimize.innerHTML = '×';

    // Create iframe
    const iframe = createElement('iframe', {
      class: 'ground-sense-bot-iframe',
      src: `${CONFIG.widgetUrl}?apiKey=${CONFIG.apiKey || ''}&theme=${CONFIG.theme}&color=${encodeURIComponent(CONFIG.primaryColor)}`,
      title: 'Ground Sense Bot Chat'
    });

    // Assemble the widget
    chat.appendChild(minimize);
    chat.appendChild(iframe);
    widget.appendChild(toggle);
    widget.appendChild(chat);

    // Add event listeners
    let isOpen = false;

    toggle.addEventListener('click', function() {
      isOpen = !isOpen;
      chat.classList.toggle('open', isOpen);
      toggle.style.display = isOpen ? 'none' : 'flex';
    });

    minimize.addEventListener('click', function() {
      isOpen = false;
      chat.classList.remove('open');
      toggle.style.display = 'flex';
    });

    return widget;
  }

  // Initialize the widget
  function init() {
    // Load configuration from script attributes
    let script;
    
    // Look for our script in the document
    const scripts = document.getElementsByTagName('script');
    for (let i = 0; i < scripts.length; i++) {
      const s = scripts[i];
      if (s.src && s.src.includes('embed.js')) {
        script = s;
        break;
      }
    }
    
    if (script) {
      CONFIG.apiKey = script.getAttribute('data-api-key');
      CONFIG.position = script.getAttribute('data-position') || CONFIG.position;
      CONFIG.theme = script.getAttribute('data-theme') || CONFIG.theme;
      CONFIG.primaryColor = script.getAttribute('data-color') || CONFIG.primaryColor;
      CONFIG.size = script.getAttribute('data-size') || CONFIG.size;
    }

    // Load styles
    loadStyles();

    // Create and append widget
    const widget = createWidget();
    document.body.appendChild(widget);

    // Dispatch ready event
    window.dispatchEvent(new CustomEvent('groundSenseBotReady', {
      detail: { widget, config: CONFIG }
    }));
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose global API
  window.GroundSenseBot = {
    init: init,
    config: CONFIG,
    show: function() {
      const chat = document.getElementById('ground-sense-bot-chat');
      const toggle = document.getElementById('ground-sense-bot-toggle');
      if (chat && toggle) {
        chat.classList.add('open');
        toggle.style.display = 'none';
      }
    },
    hide: function() {
      const chat = document.getElementById('ground-sense-bot-chat');
      const toggle = document.getElementById('ground-sense-bot-toggle');
      if (chat && toggle) {
        chat.classList.remove('open');
        toggle.style.display = 'flex';
      }
    }
  };

})();
