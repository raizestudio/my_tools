// app/providers/HealthProvider.tsx
"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";

interface HealthContextValue {
  isLive: boolean | null;
  version: string | null;
  lastChecked: Date | null;
  checkHealth: () => Promise<void>;
}

const HealthContext = createContext<HealthContextValue | undefined>(undefined);

export function HealthProvider({ children }: { children: React.ReactNode }) {
  const [isLive, setIsLive] = useState<boolean | null>(null);
  const [version, setVersion] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const isCheckingRef = useRef(false);

  const checkHealth = useCallback(async () => {
    if (isCheckingRef.current) return;
    isCheckingRef.current = true;

    try {
      const res = await fetch("/api/health", {
        cache: "no-store",
        signal: AbortSignal.timeout(3500),
      });
      const data = await res.json();
      setIsLive(Boolean(data.live));
      setVersion(data.version ?? null);
    } catch {
      setIsLive(false);
      setVersion(null);
    } finally {
      setLastChecked(new Date());
      isCheckingRef.current = false;
    }
  }, []);

  useEffect(() => {
    // 1. Initial check on mount
    checkHealth();

    // 2. Periodic background heartbeat (every 45s, tab-aware)
    const interval = setInterval(() => {
      if (typeof document !== "undefined" && !document.hidden) {
        checkHealth();
      }
    }, 45000);

    // 3. Instant re-check on tab focus / visibility restore
    const handleVisibility = () => {
      if (typeof document !== "undefined" && !document.hidden) {
        checkHealth();
      }
    };

    window.addEventListener("focus", handleVisibility);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleVisibility);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [checkHealth]);

  return (
    <HealthContext.Provider
      value={{
        isLive,
        version,
        lastChecked,
        checkHealth,
      }}
    >
      {children}
    </HealthContext.Provider>
  );
}

export function useHealth(): HealthContextValue {
  const context = useContext(HealthContext);
  if (!context) {
    throw new Error("useHealth must be used within a HealthProvider");
  }
  return context;
}
