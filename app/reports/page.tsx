"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { BarChart3, TrendingUp, PieChart, FileText, Download, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Header } from "@/components/layout/header"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts"

export default function ReportsPage() {
  const { data: session } = useSession()
  const router = useRouter()

  // Mock data for initial layout
  const performanceTrends = [
    { month: "Jan", score: 85, adherence: 90 },
    { month: "Feb", score: 88, adherence: 92 },
    { month: "Mar", score: 92, adherence: 95 },
  ]

  const reports = [
    { title: "Performance Review", description: "Comprehensive analysis of team productivity", icon: TrendingUp },
    { title: "Attendance Report", description: "Shift adherence and punctuality trends", icon: Calendar },
    { title: "Task Completion", description: "Detailed breakdown of task status across teams", icon: PieChart },
    { title: "Custom Export", description: "Generate a custom report with specific metrics", icon: Download },
  ]

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-6xl pb-24">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
              <p className="text-muted-foreground text-sm">
                Analyze performance metrics and generate detailed reports.
              </p>
            </div>
          </div>
          <Button variant="outline" className="w-full md:w-auto">
            <Download className="mr-2 h-4 w-4" /> Export All Data
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {reports.map((report) => (
            <Card key={report.title} className="hover:border-primary/50 transition-colors cursor-pointer group">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-md bg-muted group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    <report.icon className="h-5 w-5" />
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
                <CardTitle className="text-base">{report.title}</CardTitle>
                <CardDescription className="text-xs line-clamp-2">
                  {report.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="secondary" className="w-full text-xs h-8">
                  View Report
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
              <CardDescription>Average performance score and adherence over the last 3 months</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={performanceTrends}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2} name="Avg Score" />
                    <Line type="monotone" dataKey="adherence" stroke="#10b981" strokeWidth={2} name="Adherence" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Access</CardTitle>
              <CardDescription>Recent reports generated</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: "March_Monthly_Review.pdf", date: "2 days ago", size: "1.2 MB" },
                  { name: "Team_Attendance_Q1.xlsx", date: "5 days ago", size: "850 KB" },
                  { name: "Task_Efficiency_Report.pdf", date: "1 week ago", size: "2.4 MB" },
                ].map((file) => (
                  <div key={file.name} className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                    <FileText className="h-8 w-8 text-muted-foreground shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{file.date} • {file.size}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Bottom Navigation for Mobile */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t shadow-lg md:hidden">
        <div className="flex justify-around py-2 max-w-md mx-auto">
          <button onClick={() => router.push("/dashboard")} className="flex flex-col items-center px-4 py-1 text-muted-foreground">
            <span>🏠</span><span className="text-[10px]">Home</span>
          </button>
          <button onClick={() => router.push("/tasks")} className="flex flex-col items-center px-4 py-1 text-muted-foreground">
            <span>✅</span><span className="text-[10px]">Tasks</span>
          </button>
          <button className="flex flex-col items-center px-4 py-1 text-primary font-medium">
            <BarChart3 className="h-5 w-5" /><span className="text-[10px]">Reports</span>
          </button>
          <button onClick={() => router.push("/settings")} className="flex flex-col items-center px-4 py-1 text-muted-foreground">
            <Settings className="h-5 w-5" /><span className="text-[10px]">Settings</span>
          </button>
        </div>
      </div>
    </div>
  )
}

function Settings(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}
