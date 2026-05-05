"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Smartphone } from "lucide-react"

/**
 * Handles the transition from a mobile browser back to the native app after sign-in.
 * Shows a smart button instead of an automatic redirect to prevent loops and 400 errors.
 */
export function ReturnToAppHandler() {
  const { status } = useSession()
  const [isMobileBrowser, setIsMobileBrowser] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isCapacitor = (window as any).Capacitor !== undefined || /CSPerformanceApp/i.test(navigator.userAgent)
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)

      // Only show if we are on mobile but NOT inside the app itself
      setIsMobileBrowser(isMobile && !isCapacitor)
    }
  }, [])

  if (status !== "authenticated" || !isMobileBrowser) return null

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-sm animate-in slide-in-from-bottom-10 duration-500">
      <Button
        onClick={() => { window.location.href = `com.canshift.performanceapp://callback` }}
        className="w-full h-14 rounded-2xl bg-teal-500 hover:bg-teal-400 text-white font-bold text-lg shadow-[0_10px_30px_rgba(20,184,166,0.3)] border border-teal-400/20 flex items-center justify-center gap-3"
      >
        <Smartphone className="h-6 w-6" />
        Return to Task App
      </Button>
    </div>
  )
}
