"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Smartphone } from "lucide-react"

export function ReturnToAppHandler() {
  const { data: session, status } = useSession()
  const [showButton, setShowButton] = useState(false)

  useEffect(() => {
    // Only attempt if authenticated and on a mobile browser
    if (status === "authenticated" && typeof window !== "undefined") {
      const isCapacitor = (window as any).Capacitor !== undefined || /CSPerformanceApp/i.test(navigator.userAgent)
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)

      // If we are on mobile but NOT inside the Capacitor app
      if (isMobile && !isCapacitor) {
        console.log("Detected authenticated session in mobile browser. Triggering return to app.")

        const appUrl = `com.canshift.performanceapp://callback?session=active`

        // 1. Try automatic redirect
        window.location.href = appUrl

        // 2. If it hasn't redirected after 2 seconds, show the manual button
        const timer = setTimeout(() => {
          setShowButton(true)
        }, 2000)

        return () => clearTimeout(timer)
      }
    }
  }, [status])

  if (!showButton) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#090a11]/90 backdrop-blur-md p-6 animate-in fade-in duration-500">
      <div className="w-full max-w-sm bg-white/[0.03] border border-white/10 rounded-3xl p-8 text-center shadow-2xl">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-teal-500/10 border border-teal-500/20 shadow-[0_0_20px_rgba(20,184,166,0.1)]">
          <Smartphone className="h-10 w-10 text-teal-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Sign-In Successful!</h2>
        <p className="text-white/60 mb-8 leading-relaxed">
          You are now signed in. Tap the button below to return to the app and start managing your tasks.
        </p>
        <Button
          onClick={() => { window.location.href = `com.canshift.performanceapp://callback` }}
          className="w-full h-14 rounded-2xl bg-teal-500 hover:bg-teal-400 text-white font-bold text-lg shadow-[0_10px_20px_rgba(20,184,166,0.2)] transition-all"
        >
          Open App
        </Button>
      </div>
    </div>
  )
}
