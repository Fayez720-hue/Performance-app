"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  useEffect(() => {
    const isCapacitor = (window as any).Capacitor !== undefined;

    if (isCapacitor) {
      // Capacitor mobile app only
      window.location.href = `com.canshift.performanceapp://callback?url=${encodeURIComponent(callbackUrl)}`;
    } else {
      // Web browser
      router.push(callbackUrl);
    }
  }, [router, callbackUrl]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-background">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <div className="text-center">
        <h2 className="text-xl font-semibold">Completing Sign-In</h2>
        <p className="text-muted-foreground">Redirecting you...</p>
      </div>
    </div>
  );
}