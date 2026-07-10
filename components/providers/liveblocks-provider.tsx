"use client";

import * as React from "react";
import { LiveblocksProvider } from "@liveblocks/react";

export function LiveblocksProviderWrapper({ children }: { children: React.ReactNode }) {
  const [isOfflineMode, setIsOfflineMode] = React.useState(false);
  const authCountRef = React.useRef(0);
  const authTimerRef = React.useRef<number | null>(null);

  const customAuthEndpoint = React.useCallback(async (room?: string) => {
    // If local offline mode is active, do not perform any authentication requests
    if (isOfflineMode) {
      return new Promise<any>(() => {});
    }

    // Track authentication attempt frequency to detect infinite reconnect loops (e.g. clock skew)
    authCountRef.current += 1;
    
    // Reset count if no auth requests occur for 10 seconds
    if (authTimerRef.current) {
      window.clearTimeout(authTimerRef.current);
    }
    authTimerRef.current = window.setTimeout(() => {
      authCountRef.current = 0;
    }, 10000);

    // If more than 3 requests occur in a short time, trigger fallback local/offline mode
    if (authCountRef.current > 3) {
      console.warn("[Liveblocks] High frequency auth loop detected. Switching to local offline mode to prevent network flooding and timeout errors.");
      setIsOfflineMode(true);
      return new Promise<any>(() => {});
    }

    try {
      const response = await fetch("/api/liveblocks-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ room }),
      });

      if (!response.ok) {
        throw new Error(`Authentication endpoint returned status ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("[Liveblocks] Authentication fetch error:", error);
      throw error;
    }
  }, [isOfflineMode]);

  const resolveUsers = React.useCallback(async ({ userIds }: { userIds: string[] }) => {
    try {
      const response = await fetch("/api/liveblocks-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds }),
      });
      if (!response.ok) return [];
      return await response.json();
    } catch (error) {
      console.error("resolveUsers error:", error);
      return [];
    }
  }, []);

  return (
    <LiveblocksProvider authEndpoint={customAuthEndpoint} resolveUsers={resolveUsers}>
      {children}
    </LiveblocksProvider>
  );
}
