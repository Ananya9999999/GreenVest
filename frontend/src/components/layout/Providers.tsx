"use client";

import { useState, useCallback } from "react";
import { Splash } from "@/components/layout/Splash";
import { AuthProvider } from "@/context/AuthContext";

export function Providers({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(true);
  const [contentReady, setContentReady] = useState(false);

  const onSplashFinish = useCallback(() => {
    setShowSplash(false);
    // slight delay so exit animation completes before content feels "live"
    setTimeout(() => setContentReady(true), 100);
  }, []);

  return (
    <AuthProvider>
      {showSplash && <Splash onFinish={onSplashFinish} minDurationMs={2600} />}
      <div
        className={
          contentReady || !showSplash
            ? "opacity-100 transition-opacity duration-500"
            : "opacity-0"
        }
      >
        {children}
      </div>
    </AuthProvider>
  );
}
