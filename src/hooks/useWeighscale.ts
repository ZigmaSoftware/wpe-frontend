import { useState, useEffect, useCallback, useRef } from "react";
import { coreApi } from "@/lib/api";
import { BACKEND_WS } from "@/lib/env";

export type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";

export interface SerialPort {
  device: string;
  description: string;
  manufacturer: string;
  hwid: string;
}

export interface WeightReading {
  event: "weight";
  raw: string;
  weight: number;
  unit: string;
  stable: boolean;
  timestamp: string;
}

const MAX_LOG = 50;
const WS_PATH = `${BACKEND_WS}/ws/weighscale/`;
const WEIGHSCALE_API_BASE = "/api/weighscale";
const WEIGHSCALE_PORTS_PATH = `${WEIGHSCALE_API_BASE}/ports/`;
const WEIGHSCALE_CONNECT_PATH = `${WEIGHSCALE_API_BASE}/connect/`;
const WEIGHSCALE_DISCONNECT_PATH = `${WEIGHSCALE_API_BASE}/disconnect/`;

function buildWsUrl(): string {
  return WS_PATH;
}

export function useWeighscale() {
  const [ports, setPorts] = useState<SerialPort[]>([]);
  const [selectedPort, setSelectedPort] = useState<string>("");
  const [baudRate, setBaudRate] = useState<number>(9600);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("disconnected");
  const [lastReading, setLastReading] = useState<WeightReading | null>(null);
  const [readingLog, setReadingLog] = useState<WeightReading[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const wsRef = useRef<WebSocket | null>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryDelayRef = useRef<number>(1000);
  const [retryCountdown, setRetryCountdown] = useState<number>(0);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isConnectedRef = useRef(false);

  const clearRetryTimer = () => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    setRetryCountdown(0);
  };

  const startCountdown = (seconds: number) => {
    setRetryCountdown(seconds);
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setRetryCountdown((prev) => {
        if (prev <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const openWebSocket = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.onopen = null;
      wsRef.current.onmessage = null;
      wsRef.current.onerror = null;
      wsRef.current.onclose = null;
      wsRef.current.close();
      wsRef.current = null;
    }

    const ws = new WebSocket(buildWsUrl());
    wsRef.current = ws;

    ws.onopen = () => {
      retryDelayRef.current = 1000;
      clearRetryTimer();
    };

    ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data);
        if (msg.event === "weight") {
          const reading: WeightReading = {
            event: "weight",
            raw: msg.raw ?? "",
            weight: Number(msg.weight),
            unit: msg.unit ?? "kg",
            stable: Boolean(msg.stable),
            timestamp: msg.timestamp ?? new Date().toISOString(),
          };
          setLastReading(reading);
          setReadingLog((prev) => [reading, ...prev].slice(0, MAX_LOG));
        } else if (msg.event === "disconnected") {
          isConnectedRef.current = false;
          setConnectionStatus("disconnected");
          setErrorMessage(msg.reason === "device_removed" ? "Scale unplugged" : "Scale disconnected");
        } else if (msg.event === "status") {
          if (msg.connected) {
            setConnectionStatus("connected");
            setErrorMessage("");
          } else if (msg.error) {
            setConnectionStatus("error");
            setErrorMessage(msg.error);
          }
        }
      } catch {
        // ignore parse errors
      }
    };

    ws.onerror = () => {
      if (isConnectedRef.current) {
        isConnectedRef.current = false;
        setConnectionStatus("disconnected");
      }
    };

    ws.onclose = () => {
      wsRef.current = null;
      if (!isConnectedRef.current) return;

      isConnectedRef.current = false;
      setConnectionStatus("disconnected");

      const delay = Math.min(retryDelayRef.current, 30000);
      retryDelayRef.current = Math.min(retryDelayRef.current * 2, 30000);
      startCountdown(Math.ceil(delay / 1000));

      retryTimerRef.current = setTimeout(() => {
        if (isConnectedRef.current) return;
        openWebSocket();
      }, delay);
    };
  }, []);

  const refreshPorts = useCallback(async () => {
    try {
      const res = await coreApi.get<{ ports: SerialPort[] }>(WEIGHSCALE_PORTS_PATH);
      setPorts(res.data.ports ?? []);
    } catch {
      setPorts([]);
    }
  }, []);

  useEffect(() => {
    refreshPorts();
  }, [refreshPorts]);

  const connect = useCallback(async () => {
    if (!selectedPort) {
      setErrorMessage("Select a port first");
      return;
    }

    setConnectionStatus("connecting");
    setErrorMessage("");

    try {
      await coreApi.post(WEIGHSCALE_CONNECT_PATH, {
        port: selectedPort,
        baud_rate: baudRate,
      });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Failed to connect";
      setConnectionStatus("error");
      setErrorMessage(msg);
      return;
    }

    isConnectedRef.current = true;
    retryDelayRef.current = 1000;
    setConnectionStatus("connected");
    openWebSocket();
  }, [selectedPort, baudRate, openWebSocket]);

  const disconnect = useCallback(async () => {
    clearRetryTimer();
    isConnectedRef.current = false;

    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
      wsRef.current = null;
    }

    try {
      await coreApi.post(WEIGHSCALE_DISCONNECT_PATH);
    } catch {
      // ignore if already disconnected
    }

    setConnectionStatus("disconnected");
    setLastReading(null);
  }, [clearRetryTimer]);

  useEffect(() => {
    return () => {
      clearRetryTimer();
      isConnectedRef.current = false;
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    };
  }, []);

  return {
    ports,
    selectedPort,
    setSelectedPort,
    baudRate,
    setBaudRate,
    connectionStatus,
    lastReading,
    readingLog,
    errorMessage,
    retryCountdown,
    connect,
    disconnect,
    refreshPorts,
  };
}
