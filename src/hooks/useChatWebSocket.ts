import { useEffect, useRef, useState, useCallback } from 'react';

export interface ChatResponse {
  text: string;
  intent: string;
  chart?: {
    type: string;
    title: string;
    series: {
      name: string;
      data: number[];
      type: string;
    }[];
    xAxis?: {
      data: string[];
    };
  };
  map?: any;
  data?: any;
}

export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  type: 'text' | 'response';
  payload?: ChatResponse;
  timestamp: Date;
}

export const useChatWebSocket = (url: string, username: string) => {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    const socket = new WebSocket(`${url}?username=${username}`);

    socket.onopen = () => {
      console.log('WebSocket Connected');
      setIsConnected(true);
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('WebSocket Message:', data);
        
        // Transform backend message to frontend message format
        const newMessage: Message = {
          id: data.id || Date.now().toString(),
          content: data.content || (data.payload?.text) || '',
          sender: data.username === 'Bot' ? 'bot' : 'user',
          type: data.type || 'text',
          payload: data.payload,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, newMessage]);
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    };

    socket.onclose = () => {
      console.log('WebSocket Disconnected');
      setIsConnected(false);
    };

    socket.onerror = (error) => {
      console.error('WebSocket Error:', error);
    };

    ws.current = socket;

    return () => {
      socket.close();
    };
  }, [url, username]);

  const sendMessage = useCallback((content: string) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      const msg = {
        content,
        username,
        type: 'text'
      };
      ws.current.send(JSON.stringify(msg));
    } else {
      console.error('WebSocket is not connected');
    }
  }, [username]);

  return { isConnected, messages, sendMessage };
};
