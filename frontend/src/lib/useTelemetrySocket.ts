import { useEffect, useRef, useState } from "react";
import { tokenStorage } from "./tokenStorage";

const WS_BASE_URL: string =
  import.meta.env.VITE_WS_BASE_URL || "ws://localhost:8080/ws";

export interface TelemetryReadingEvent {
  metric_key: string;
  value: number | boolean | string;
  recorded_at: string;
}

export interface TelemetryMessage {
  type: string;
  device_id: string;
  device_code: string;
  status: string;
  readings: TelemetryReadingEvent[];
}

/** Subscribes to live telemetry for one device over WebSocket, with
 * exponential-backoff auto-reconnect (JWT passed as a query param since
 * browsers can't set ws:// Authorization headers). */
export function useTelemetrySocket(deviceId: string | null) {
  const [lastMessage, setLastMessage] = useState<TelemetryMessage | null>(null);
  const [connected, setConnected] = useState(false);
  const retryDelay = useRef(1000);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!deviceId) return;
    let cancelled = false;
    let socket: WebSocket;

    function connect() {
      const token = tokenStorage.getAccess();
      socket = new WebSocket(
        `${WS_BASE_URL}/telemetry/${deviceId}/?token=${encodeURIComponent(token ?? "")}`,
      );
      socketRef.current = socket;

      socket.onopen = () => {
        if (cancelled) return;
        setConnected(true);
        retryDelay.current = 1000;
      };
      socket.onmessage = (event) => {
        if (cancelled) return;
        try {
          setLastMessage(JSON.parse(event.data));
        } catch {
          // ignore malformed frame
        }
      };
      socket.onclose = () => {
        if (cancelled) return;
        setConnected(false);
        setTimeout(connect, retryDelay.current);
        retryDelay.current = Math.min(retryDelay.current * 2, 15000);
      };
      socket.onerror = () => socket.close();
    }

    connect();
    return () => {
      cancelled = true;
      socketRef.current?.close();
    };
  }, [deviceId]);

  return { lastMessage, connected };
}
