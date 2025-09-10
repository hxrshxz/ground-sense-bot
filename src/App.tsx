import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { 
  BrowserRouter, 
  Routes, 
  Route, 
  useLocation, 
  createBrowserRouter,
  RouterProvider,
  createRoutesFromElements
} from "react-router-dom";
import { useEffect, useState } from "react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { INGRESAssistant } from "./components/INGRESAssistant";
import { ApiKeyProvider } from "./components/ApiKeyContext";

const queryClient = new QueryClient();

// Embedded Chat Component
const EmbeddedChat = () => {
  const [isEmbedded, setIsEmbedded] = useState(false);

  useEffect(() => {
    setIsEmbedded(true);

    // If embedded, hide scrollbars and adjust body
    document.body.style.overflow = 'hidden';
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.documentElement.style.height = '100%';
    document.body.style.height = '100%';
    
    // Handle messages from parent window
    window.addEventListener('message', (event) => {
      console.log('Message received:', event.data);
      
      // You can handle specific messages here
      if (event.data.type === 'set-api-key') {
        // Handle API key setting
        console.log('Setting API key:', event.data.apiKey);
      }
    });

    // Notify parent that we're ready
    if (window.parent !== window) {
      window.parent.postMessage({ type: 'embed-ready' }, '*');
    }
  }, []);

  return (
    <div style={{
      height: '100vh',
      width: '100vw',
      overflow: 'hidden',
      background: '#0f172a'
    }}>
      <ApiKeyProvider>
        <INGRESAssistant embedded={true} />
      </ApiKeyProvider>
    </div>
  );
};

const App = () => {
  const [isEmbedded, setIsEmbedded] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const embedded = urlParams.get('embedded') === 'true';
    setIsEmbedded(embedded);
    
    // Special handling for /embed.html path - always treat as embedded
    if (window.location.pathname === '/embed.html') {
      setIsEmbedded(true);
    }
  }, []);

  // If embedded, show only the chat component
  if (isEmbedded) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <EmbeddedChat />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  // Normal app routing
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route path="/" element={<Index />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
