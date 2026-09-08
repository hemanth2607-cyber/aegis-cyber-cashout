// frontend/hooks/useRealtimeAlerts.ts
"use client";

import { useEffect, useRef, useState } from "react";

export function useRealtimeAlerts(url = "ws://localhost:8000/ws/alerts") {
  const [lastMessage, setLastMessage] = useState<any>(null);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let isMounted = true;

    function connect() {
      if (typeof window === "undefined") return;

      try {
        const ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onopen = () => {
          if (!isMounted) return;
          setConnected(true);
          console.log("[useRealtimeAlerts] Connected to", url);
        };

        ws.onclose = () => {
          if (!isMounted) return;
          setConnected(false);
          // Try reconnecting after 3 seconds
          reconnectTimeoutRef.current = setTimeout(() => {
            if (isMounted) connect();
          }, 3000);
        };

        ws.onerror = (err) => {
          console.warn("[useRealtimeAlerts] WebSocket error:", err);
          ws.close();
        };

        ws.onmessage = (evt) => {
          if (!isMounted) return;
          try {
            const data = JSON.parse(evt.data);
            setLastMessage(data);
          } catch {
            console.warn("Non-JSON WS payload:", evt.data);
          }
        };
      } catch (err) {
        console.warn("[useRealtimeAlerts] Connection failed:", err);
      }
    }

    connect();

    return () => {
      isMounted = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [url]);

  return { lastMessage, connected };
}
