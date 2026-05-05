"use client"

import { signIn } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ClipboardList, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"

export default function LoginPageClient() {
  const [isLoading, setIsLoading] = useState(false)
  const [isApp, setIsApp] = useState(false)

  useEffect(() => {
    // Detect Capacitor environment
    const isCapacitor = (window as any).Capacitor !== undefined || /CSPerformanceApp/i.test(navigator.userAgent)
    setIsApp(isCapacitor)
  }, [])

  const handleLogin = async () => {
    setIsLoading(true)
    try {
      const callbackUrl = isApp ? "/auth/callback?callbackUrl=/dashboard&app=1" : "/dashboard"
      // Use standard signIn. NextAuth will handle the CSRF and callback logic.
      await signIn("google", { callbackUrl })
    } catch (error) {
      console.error("Login failed:", error)
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#090a11] p-4 font-sans">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(20,184,166,0.05),transparent_70%)] pointer-events-none" />

      <Card className="w-full max-w-md border-white/5 bg-white/[0.02] backdrop-blur-xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-teal-500/50 to-transparent" />

        <CardHeader className="text-center pb-8 pt-10">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-500/10 border border-teal-500/20 shadow-[0_0_20px_rgba(20,184,166,0.1)]">
            <ClipboardList className="h-8 w-8 text-teal-400" />
          </div>
          <CardTitle className="text-3xl font-bold text-white tracking-tight">
            Task Manager
          </CardTitle>
          <CardDescription className="text-white/40 mt-2 font-medium">
            {isApp ? "Sign in within the app to continue" : "Sign in to manage tasks and track progress"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-8 pb-10">
          <button
            onClick={handleLogin}
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-3 rounded-xl bg-teal-500 px-8 py-4 text-sm font-bold text-white shadow-[0_4px_20px_rgba(20,184,166,0.3)] transition-all hover:bg-teal-400 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed group"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <svg className="h-5 w-5 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            )}
            {isLoading ? "Signing in..." : "Continue with Google"}
          </button>

          <div className="text-center space-y-2">
            <p className="text-[10px] text-white/20 font-bold uppercase tracking-[0.2em]">
              Powered by Can Shift
            </p>
            <p className="text-xs text-white/40 px-8">
              Manage your daily performance and track team metrics with ease.
            </p>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
