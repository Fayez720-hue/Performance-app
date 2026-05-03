"use client"

import { useState, useEffect } from "react"
import { useSession } from '@/components/providers/session-provider'
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Clock, LogIn, LogOut, Loader2, Calendar, History } from "lucide-react"
import useSWR from "swr"
import { fetcher } from "@/lib/api"
import { toast } from "sonner"
import { format } from "date-fns"

export default function ClockPageClient() {
  const { data: session } = useSession()
  const { data: history, mutate, isLoading } = useSWR("/api/attendance", fetcher)
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentTime, setCurrentTime] = useState<Date | null>(null)

  // Update clock every second
  useEffect(() => {
    setCurrentTime(new Date()) // Set initial time on mount
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const lastEntry = history && history.length > 0 ? history[history.length - 1] : null
  const isClockedIn = lastEntry && lastEntry.date === format(new Date(), "yyyy-MM-dd") && !lastEntry.clockOut

  const handleClockAction = async () => {
    setIsProcessing(true)
    const action = isClockedIn ? "clock-out" : "clock-in"

    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action })
      })

      if (!res.ok) throw new Error(await res.text())

      toast.success(isClockedIn ? "Clocked out successfully" : "Clocked in successfully")
      mutate()
    } catch (error: any) {
      toast.error(error.message || "Failed to process request")
    } finally {
      setIsProcessing(false)
    }
  }

  // Prevent hydration error by not rendering the clock until mounted
  const timeString = currentTime ? format(currentTime, "HH:mm:ss") : "--:--:--"
  const dateString = currentTime ? format(currentTime, "EEEE, MMMM do") : "Loading..."

  return (
    <div className="flex-1 flex flex-col">
      <Header />
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : (
        <main className="flex-1 container mx-auto px-4 py-8 max-w-2xl">
          <div className="text-center mb-10">
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 mb-4">
              <Clock className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight">Attendance</h1>
            <p className="text-muted-foreground mt-2">{dateString}</p>
            <p className="text-5xl font-mono mt-4 font-bold text-foreground">
              {timeString}
            </p>
          </div>

          <Card className="border-border bg-card shadow-xl overflow-hidden relative">
            <div className="absolute top-0 left-0 w-1 bg-primary h-full" />
            <CardHeader>
              <CardTitle>Daily Status</CardTitle>
              <CardDescription>Click the button below to record your shift.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center py-6">
              <Button
                size="lg"
                disabled={isProcessing || isLoading}
                onClick={handleClockAction}
                className={`h-32 w-32 rounded-full text-lg font-bold shadow-lg transition-all active:scale-95 ${
                  isClockedIn
                  ? "bg-destructive hover:bg-destructive/90 shadow-destructive/20 text-destructive-foreground"
                  : "bg-primary hover:bg-primary/90 shadow-primary/20 text-primary-foreground"
                }`}
              >
                {isProcessing ? (
                  <Loader2 className="h-10 w-10 animate-spin" />
                ) : isClockedIn ? (
                  <div className="flex flex-col items-center">
                    <LogOut className="h-8 w-8 mb-2" />
                    <span>Clock Out</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <LogIn className="h-8 w-8 mb-2" />
                    <span>Clock In</span>
                  </div>
                )}
              </Button>

              {isClockedIn && lastEntry && (
                <div className="mt-6 p-4 bg-primary/5 rounded-xl border border-primary/10 w-full text-center">
                  <p className="text-sm text-primary font-medium">Shift started at</p>
                  <p className="text-2xl font-bold">{lastEntry.clockIn}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="mt-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
                <History className="h-5 w-5 text-primary" />
                Recent History
              </h2>
            </div>
            <div className="space-y-3">
              {history?.length === 0 ? (
                <p className="text-center py-10 text-muted-foreground bg-muted/20 rounded-lg border border-dashed border-border">
                  No attendance history found.
                </p>
              ) : (
                history?.slice().reverse().map((entry: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-border bg-card">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{entry.date}</p>
                        <p className="text-xs text-muted-foreground">
                          {entry.clockIn} - {entry.clockOut || "..."}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-primary">
                        {entry.trackedTime ? entry.trackedTime : "Active"}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </main>
      )}
    </div>
  )
}
    </div>
  )
}
