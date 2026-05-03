"use client"

import { useSession } from '@/components/providers/session-provider'
import { useRouter } from "next/navigation"
import useSWR from "swr"
import { fetcher } from "@/lib/api"
import {
  BarChart3,
  Download,
  Users,
  Target,
  Clock,
  Loader2,
  Settings as SettingsIcon,
  Home,
  CheckSquare
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Header } from "@/components/layout/header"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts"
import { cn } from "@/lib/utils"

export default function ReportsPageClient() {
  const { data: session } = useSession()
  const router = useRouter()
  const { data: stats, isLoading } = useSWR("/api/dashboard", fetcher)

  const userRole = (session?.user as any)?.role || "Team Member"
  const canManage = userRole === "Admin" || userRole === "Manager"

  if (!isLoading && !canManage) {
    router.replace("/dashboard")
    return null
  }

  return (
    <div className="flex-1 flex flex-col">
      <Header />
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Performance Reports</h1>
              <p className="text-muted-foreground text-sm">
                Real-time metrics synced from Google Sheets.
              </p>
            </div>
          </div>
          <Button variant="outline" className="w-full md:w-auto border-primary/20 hover:bg-primary/10 text-primary" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {metrics.map((metric) => (
            <Card key={metric.title} className="border-border">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                <div className={cn("p-2 rounded-md", metric.bg)}>
                  <metric.icon className={cn("h-4 w-4", metric.color)} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {metric.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 border-border bg-card">
            <CardHeader>
              <CardTitle>Score Distribution</CardTitle>
              <CardDescription>Number of employees per performance bracket</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px] w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={performanceTrends}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="range" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                    <Tooltip cursor={{ fill: 'hsl(var(--muted)/0.5)' }} contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--card-foreground))' }} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {performanceTrends.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={index > 3 ? "hsl(var(--primary))" : "hsl(var(--primary)/0.6)"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>Top Performers</CardTitle>
              <CardDescription>Best overall scores this period</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                {stats?.employees?.sort((a: any, b: any) => b.overallScore - a.overallScore).map((emp: any, index: number) => (
                  <div key={emp.name} className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                        #{index + 1}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{emp.name}</p>
                        <p className="text-xs text-muted-foreground">{emp.title}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-primary">{Math.round(emp.overallScore)}%</p>
                      <p className="text-[10px] text-muted-foreground">Score</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
