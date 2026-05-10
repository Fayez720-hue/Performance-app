"use client"

import { signIn } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ClipboardList, Loader2, LogIn } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"


async function registerPushNotifications() {
  try {
    const isCapacitor = typeof window !== 'undefined' && (window as any).Capacitor !== undefined
    if (!isCapacitor) return

    const { PushNotifications } = await import('@capacitor/push-notifications')

    const status = await PushNotifications.checkPermissions()
    if (status.receive !== 'granted') {
      const result = await PushNotifications.requestPermissions()
      if (result.receive !== 'granted') return
    }

    await PushNotifications.register()

    PushNotifications.addListener('registration', async (token) => {
      await fetch('/api/users/push-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token.value }),
      })
    })

    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Push received:', notification)
    })

    PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      console.log('Push tapped:', notification)
    })
  } catch (error) {
    console.error('Push registration error:', error)
  }
}

export default function LoginPageClient() {
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const result = await signIn("credentials", {
        email,
        password,
        callbackUrl: "/dashboard",
        redirect: false
      })
      if (result?.error) {
        toast.error("Invalid email or password")
      } else {
        await registerPushNotifications()
        router.push("/dashboard")
      }
    } catch (error) {
      toast.error("Login failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#090a11] p-4 font-sans">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(20,184,166,0.05),transparent_70%)] pointer-events-none" />

      <Card className="w-full max-w-md border-white/5 bg-white/[0.02] backdrop-blur-xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-teal-500/50 to-transparent" />

        <CardHeader className="text-center pb-6 pt-10">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-500/10 border border-teal-500/20 shadow-[0_0_20px_rgba(20,184,166,0.1)]">
            <ClipboardList className="h-8 w-8 text-teal-400" />
          </div>
          <CardTitle className="text-3xl font-bold text-white tracking-tight">
            Task Manager
          </CardTitle>
          <CardDescription className="text-white/40 mt-2 font-medium">
            Sign in to manage tasks and track progress
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 pb-10 px-8">
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white/70 text-sm font-medium">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-white/5 border-white/10 text-white placeholder:text-white/25 h-11 rounded-lg focus:border-teal-500/50 focus:ring-teal-500/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-white/70 text-sm font-medium">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-white/5 border-white/10 text-white placeholder:text-white/25 h-11 rounded-lg focus:border-teal-500/50 focus:ring-teal-500/20"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-teal-500 hover:bg-teal-400 text-white font-semibold rounded-xl transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] shadow-[0_4px_20px_rgba(20,184,166,0.25)] hover:shadow-[0_6px_25px_rgba(20,184,166,0.35)] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <LogIn className="h-5 w-5 mr-2" />
                  Sign In
                </>
              )}
            </Button>
          </form>

          <div className="text-center space-y-2 pt-2">
            <p className="text-[10px] text-white/20 font-bold uppercase tracking-[0.2em]">
              Powered by Can Shift
            </p>
            <p className="text-xs text-white/40 px-6">
              Manage your daily performance and track team metrics with ease.
            </p>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}