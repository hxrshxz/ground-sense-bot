import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Key, Shield, ExternalLink } from "lucide-react";

interface ApiKeyInputProps {
  onApiKeySubmit: (apiKey: string) => void;
  onSkip: () => void;
}

export const ApiKeyInput: React.FC<ApiKeyInputProps> = ({ onApiKeySubmit, onSkip }) => {
  const [apiKey, setApiKey] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!apiKey.trim()) return;
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 500)); // Brief loading
    onApiKeySubmit(apiKey.trim());
    setIsSubmitting(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50"
    >
      <Card className="w-full max-w-md bg-white/95 backdrop-blur-xl border-white/50 shadow-elevated">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center mb-4">
            <Key className="w-6 h-6 text-white" />
          </div>
          <CardTitle className="text-xl text-slate-800">Connect to Gemini AI</CardTitle>
          <p className="text-sm text-slate-600">
            Enter your Gemini API key to enable intelligent responses
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Input
              type="password"
              placeholder="Enter your Gemini API key..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full"
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Shield className="w-3 h-3" />
              <span>Your API key is stored locally and never sent to our servers</span>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={handleSubmit} 
              disabled={!apiKey.trim() || isSubmitting}
              className="flex-1 bg-gradient-primary"
            >
              {isSubmitting ? 'Connecting...' : 'Connect'}
            </Button>
            <Button variant="outline" onClick={onSkip} className="flex-1">
              Skip (Demo Mode)
            </Button>
          </div>
          
          <div className="text-center pt-2 border-t border-slate-200/50">
            <p className="text-xs text-slate-500 mb-2">
              Don't have an API key?
            </p>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => window.open('https://makersuite.google.com/app/apikey', '_blank')}
              className="text-xs"
            >
              <ExternalLink className="w-3 h-3 mr-1" />
              Get one from Google AI Studio
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};