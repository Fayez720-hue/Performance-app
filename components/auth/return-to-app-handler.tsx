"use client"

import { useSession } from "next-auth/react"
import { useEffect } from "react"

export function ReturnToAppHandler() {
  const { data: session, status } = useSession()

  useEffect(() => {
    // Only attempt if authenticated and we're on a mobile browser (not in Capacitor)
    if (status === "authenticated" && typeof window !== "undefined") {
      const isCapacitor = (window as any).Capacitor !== undefined || navigator.userAgent.includes("Capacitor")
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)

      // If we are on mobile but NOT inside the Capacitor app
      if (isMobile && !isCapacitor) {
        console.log("Detecting authenticated session in mobile browser. Triggering return to app.")

        // Custom scheme to jump back to the APK
        const appUrl = `com.canshift.performanceapp://callback?session=active`

        // Small delay to allow the page to settle
        const timeout = setTimeout(() => {
          window.location.href = appUrl
        }, 1500)

        return () => clearTimeout(timeout)
      }
    }
  }, [status])

  return null // This component doesn't render anything
}
