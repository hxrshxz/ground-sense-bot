import { useEffect, useRef, useState, useCallback } from "react";

export interface ChatResponse {
  text: string;
  intent: string;
  chart?: {
    type: string;
    title: string;
    series: {
      name: string;
      data: number[];
      type?: string;
    }[];
    xAxis?: string[] | { data: string[] };
    pieData?: { name: string; value: number }[];
    echarts_option?: any;
  };
  map?: any;
  data?: any;
}

export interface Message {
  id: string;
  content: string;
  sender: "user" | "bot";
  type: "text" | "response";
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
      console.log("\n" + "=".repeat(80));
      console.log("🔌 WEBSOCKET CONNECTED");
      console.log(`├─ URL: ${url}`);
      console.log(`├─ User: ${username}`);
      console.log(`└─ Status: READY`);
      console.log("=".repeat(80) + "\n");
      setIsConnected(true);
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("\n" + "=".repeat(80));
        console.log("📨 WEBSOCKET MESSAGE RECEIVED");
        console.log(`├─ Type: ${data.type || "text"}`);
        console.log(`├─ Sender: ${data.username || "Unknown"}`);
        
        if (data.payload) {
          console.log(`├─ Intent: ${data.payload.intent || "N/A"}`);
          if (data.payload.chart) {
            console.log(`├─ Chart Type: ${data.payload.chart.type}`);
            console.log(`├─ Chart Title: ${data.payload.chart.title}`);
            if (data.payload.chart.comparisonData) {
              console.log(`├─ Comparison Type: ${data.payload.chart.comparisonData.comparisonType}`);
              console.log(`├─ Locations: ${data.payload.chart.comparisonData.locations.length}`);
            }
          }
          if (data.payload.map) {
            console.log(`├─ Map Features: ${data.payload.map.features?.length || 0}`);
          }
        }
        console.log("└─ Message parsed successfully");
        console.log("=".repeat(80) + "\n");

        // Transform backend message to frontend message format
        const newMessage: Message = {
          id: data.id || Date.now().toString(),
          content: data.content || data.payload?.text || "",
          sender: data.username === "Bot" ? "bot" : "user",
          type: data.type || "text",
          payload: data.payload,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, newMessage]);
      } catch (error) {
        console.error("❌ Error parsing message:", error);
      }
    };

    socket.onclose = () => {
      console.log("\n🔴 WEBSOCKET DISCONNECTED\n");
      setIsConnected(false);
    };

    socket.onerror = (error) => {
      console.error("❌ WEBSOCKET ERROR:", error);
    };

    ws.current = socket;

    return () => {
      socket.close();
    };
  }, [url, username]);

  const sendMessage = useCallback(
    (content: string) => {
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        const msg = {
          content,
          username,
          type: "text",
        };
        console.log("\n" + "=".repeat(80));
        console.log("📤 SENDING MESSAGE");
        console.log(`├─ User: ${username}`);
        console.log(`├─ Query: "${content}"`);
        console.log("└─ Waiting for response...");
        console.log("=".repeat(80) + "\n");
        ws.current.send(JSON.stringify(msg));
      } else {
        console.error("❌ WebSocket is not connected");
      }
    },
    [username]
  );

  return { isConnected, messages, sendMessage };
};
