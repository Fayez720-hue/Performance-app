"use client"

import { useSession } from "next-auth/react"
import { useEffect } from "react"

export function ReturnToAppHandler() {
  const { data: session, status } = useSession()

  useEffect(() => {
    // Only attempt if authenticated and we're on a mobile browser (not in Capacitor)
    if (status === "authenticated" && typeof window !== "undefined") {
      // Improved detection: check for Capacitor bridge, the UserAgent we set,
      // or if we are already in a "native" state via URL param
      const isCapacitor =
        (window as any).Capacitor?.isNative ||
        (window as any).Capacitor !== undefined ||
        /CSPerformanceApp/i.test(navigator.userAgent) ||
        /Capacitor/i.test(navigator.userAgent);

      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      const hasNativeParam = window.location.search.includes('native=true');
      const isCallback = window.location.pathname.includes('/api/auth/callback');

      // If we are on mobile but NOT inside the Capacitor app and haven't been redirected yet
      // And we are NOT currently in the middle of an auth callback
      if (isMobile && !isCapacitor && !hasNativeParam && !isCallback) {
        console.log("Detecting authenticated session in mobile browser. Triggering return to app.");

        // Custom scheme to jump back to the APK
        const appUrl = `com.canshift.performanceapp://callback?session=active`;

        // Small delay to allow the page to settle
        const timeout = setTimeout(() => {
          try {
            // Check again right before redirecting to be absolutely sure
            if (!(/CapacitorApp/i.test(navigator.userAgent))) {
              window.location.href = appUrl;
            }
          } catch (e) {
            console.error("Failed to redirect to app scheme", e);
          }
        }, 2000);

        return () => clearTimeout(timeout);
      }
    }
  }, [status])

  return null // This component doesn't render anything
}
