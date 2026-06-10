import { useEffect, useState } from "react";

type UseDeferredMountOptions = {
  delayMs?: number;
  enabled?: boolean;
};

export const useDeferredMount = ({ delayMs = 0, enabled = true }: UseDeferredMountOptions = {}) => {
  const [mounted, setMounted] = useState(!enabled);

  useEffect(() => {
    if (!enabled) {
      setMounted(true);
      return;
    }

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let idleHandle: number | null = null;

    const commit = () => {
      if (!cancelled) {
        setMounted(true);
      }
    };

    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      idleHandle = window.requestIdleCallback(
        () => {
          if (delayMs > 0) {
            timeoutId = setTimeout(commit, delayMs);
            return;
          }

          commit();
        },
        { timeout: Math.max(delayMs, 250) },
      );
    } else {
      timeoutId = setTimeout(commit, delayMs);
    }

    return () => {
      cancelled = true;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (idleHandle !== null && typeof window !== "undefined" && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(idleHandle);
      }
    };
  }, [delayMs, enabled]);

  return mounted;
};

export default useDeferredMount;
