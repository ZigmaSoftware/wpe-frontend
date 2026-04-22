import { useState, useCallback } from "react";

export interface ScanResult {
  code: string;
  type: "QR" | "BARCODE";
  timestamp: Date;
  valid: boolean;
  data?: Record<string, string>;
}

interface UseScannerInputOptions {
  onScan?: (result: ScanResult) => void;
  validateFn?: (code: string) => boolean;
}

export function useScannerInput({ onScan, validateFn }: UseScannerInputOptions = {}) {
  const [lastScan, setLastScan] = useState<ScanResult | null>(null);
  const [scanning, setScanning] = useState(false);
  const [history, setHistory] = useState<ScanResult[]>([]);

  const processScan = useCallback(
    (code: string, type: "QR" | "BARCODE" = "QR") => {
      const valid = validateFn ? validateFn(code) : code.length > 0;
      const parsedData: Record<string, string> = {};

      // Parse structured QR codes (e.g., BIN-R/ITEM-1006/REF-300235)
      if (code.includes("/")) {
        code.split("/").forEach((part) => {
          const [key, val] = part.split("-");
          if (key && val) parsedData[key] = val;
        });
      }

      const result: ScanResult = {
        code,
        type,
        timestamp: new Date(),
        valid,
        data: Object.keys(parsedData).length > 0 ? parsedData : undefined,
      };

      setLastScan(result);
      setHistory((prev) => [result, ...prev].slice(0, 50));
      onScan?.(result);
      return result;
    },
    [onScan, validateFn]
  );

  const simulateScan = useCallback(
    (code?: string) => {
      setScanning(true);
      setTimeout(() => {
        const scanCode = code || `BIN-${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${Math.floor(Math.random() * 999).toString().padStart(3, "0")}/ITEM-${1000 + Math.floor(Math.random() * 500)}/REF-${300000 + Math.floor(Math.random() * 300)}`;
        processScan(scanCode);
        setScanning(false);
      }, 800);
    },
    [processScan]
  );

  const clearHistory = useCallback(() => {
    setHistory([]);
    setLastScan(null);
  }, []);

  return { lastScan, scanning, history, processScan, simulateScan, clearHistory };
}
