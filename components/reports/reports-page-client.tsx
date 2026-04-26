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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const performanceTrends = stats?.scoreDistribution || [
    { range: "0-20%", count: 0 },
    { range: "21-40%", count: 0 },
    { range: "41-60%", count: 0 },
    { range: "61-80%", count: 0 },
    { range: "81-100%", count: 0 },
  ]

  const metrics = [
    {
      title: "Avg. Performance",
      value: `${Math.round(stats?.avgScore || 0)}%`,
      description: "Across all active tasks",
      icon: Target,
      color: "text-blue-500",
      bg: "bg-blue-500/10"
    },
    {
      title: "Shift Adherence",
      value: `${Math.round(stats?.avgShiftAdherence || 0)}%`,
      description: "Punctuality & availability",
      icon: Clock,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10"
    },
    {
      title: "Completion Rate",
      value: `${Math.round(stats?.completionRate || 0)}%`,
      description: "Tasks finished on time",
      icon: CheckSquare,
      color: "text-orange-500",
      bg: "bg-orange-500/10"
    },
    {
      title: "Total Employees",
      value: stats?.totalEmployees || 0,
      description: "Managed users",
      icon: Users,
      color: "text-purple-500",
      bg: "bg-purple-500/10"
    },
  ]

  const handleExport = () => {
    if (!stats?.employees) return;

    // Create CSV content
    const headers = ["Name", "Title", "Overall Score", "Shift Adherence", "Tasks Completed"];
    const rows = stats.employees.map((emp: any) => [
      emp.name,
      emp.title,
      `${Math.round(emp.overallScore)}%`,
      `${Math.round(emp.shiftAdherence)}%`,
      emp.completedTasks
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row: any) => row.join(","))
    ].join("\n");

    // Create a blob and download it
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Performance_Report_${new Date().toLocaleDateString()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-6xl pb-24">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-500/10">
              <BarChart3 className="h-6 w-6 text-teal-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Performance Reports</h1>
              <p className="text-muted-foreground text-sm">
                Real-time metrics synced from Google Sheets.
              </p>
            </div>
          </div>
          <Button variant="outline" className="w-full md:w-auto border-teal-500/20 hover:bg-teal-500/10 text-teal-400" onClick={handleExport}>
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

      <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-md border-t border-border shadow-lg md:hidden z-50">
        <div className="flex justify-around py-3 max-w-md mx-auto">
          <button onClick={() => router.push("/dashboard")} className="flex flex-col items-center px-4 text-muted-foreground hover:text-primary transition-colors">
            <Home className="h-5 w-5" />
            <span className="text-[10px] mt-1">Dashboard</span>
          </button>
          <button onClick={() => router.push("/tasks")} className="flex flex-col items-center px-4 text-muted-foreground hover:text-primary transition-colors">
            <CheckSquare className="h-5 w-5" />
            <span className="text-[10px] mt-1">Tasks</span>
          </button>
          <button className="flex flex-col items-center px-4 text-primary font-medium">
            <BarChart3 className="h-5 w-5" />
            <span className="text-[10px] mt-1">Reports</span>
          </button>
          <button onClick={() => router.push("/clock-in")} className="flex flex-col items-center px-4 text-muted-foreground hover:text-primary transition-colors">
            <Clock className="h-5 w-5" />
            <span className="text-[10px] mt-1">Attendance</span>
          </button>
          <button onClick={() => router.push("/settings")} className="flex flex-col items-center px-4 text-muted-foreground hover:text-primary transition-colors">
            <SettingsIcon className="h-5 w-5" />
            <span className="text-[10px] mt-1">Settings</span>
          </button>
        </div>
      </div>
    </div>
  )
}
