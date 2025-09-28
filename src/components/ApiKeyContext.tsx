"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ApiKeyContextType {
  apiKey: string;
  setApiKey: (key: string) => void;
  clearApiKey: () => void;
  hasApiKey: boolean;
}

const ApiKeyContext = createContext<ApiKeyContextType | undefined>(undefined);

export const useApiKey = () => {
  const context = useContext(ApiKeyContext);
  if (context === undefined) {
    throw new Error('useApiKey must be used within an ApiKeyProvider');
  }
  return context;
};

interface ApiKeyProviderProps {
  children: ReactNode;
}

export const ApiKeyProvider: React.FC<ApiKeyProviderProps> = ({ children }) => {
  const [apiKey, setApiKeyState] = useState<string>('');

  // Load API key from localStorage on mount
  useEffect(() => {
    const savedApiKey = localStorage.getItem('gemini-api-key');
    if (savedApiKey) {
      setApiKeyState(savedApiKey);
    }
  }, []);

  const setApiKey = (key: string) => {
    setApiKeyState(key);
    localStorage.setItem('gemini-api-key', key);
  };

  const clearApiKey = () => {
    setApiKeyState('');
    localStorage.removeItem('gemini-api-key');
  };

  const hasApiKey = apiKey.length > 0;

  const value: ApiKeyContextType = {
    apiKey,
    setApiKey,
    clearApiKey,
    hasApiKey,
  };

  return (
    <ApiKeyContext.Provider value={value}>
      {children}
    </ApiKeyContext.Provider>
  );
};
