import { useEffect, useRef, useState, useCallback } from "react";
import type { GPUResponse } from "../types";

export type ConnectionState = "connecting" | "connected" | "disconnected";

const STALE_TIMEOUT_MS = 8000;

export function useGpuStream(url: string) {
  const [data, setData] = useState<GPUResponse | null>(null);
  const [connectionState, setConnectionState] =
    useState<ConnectionState>("connecting");
  const [lastUpdate, setLastUpdate] = useState<number>(0);
  const staleTimer = useRef<ReturnType<typeof setTimeout>>(null);
  const esRef = useRef<EventSource | null>(null);

  const resetStaleTimer = useCallback(() => {
    if (staleTimer.current) clearTimeout(staleTimer.current);
    staleTimer.current = setTimeout(() => {
      setConnectionState("disconnected");
    }, STALE_TIMEOUT_MS);
  }, []);

  useEffect(() => {
    const es = new EventSource(url);
    esRef.current = es;
    setConnectionState("connecting");

    es.onopen = () => {
      setConnectionState("connected");
      resetStaleTimer();
    };

    es.onmessage = (event) => {
      try {
        const parsed: GPUResponse = JSON.parse(event.data);
        setData(parsed);
        setConnectionState("connected");
        setLastUpdate(Date.now());
        resetStaleTimer();
      } catch {
        // ignore malformed messages
      }
    };

    es.onerror = () => {
      setConnectionState("disconnected");
      resetStaleTimer();
    };

    return () => {
      es.close();
      esRef.current = null;
      if (staleTimer.current) clearTimeout(staleTimer.current);
    };
  }, [url, resetStaleTimer]);

  return { data, connectionState, lastUpdate };
}
