"use client";

import { useSession } from '@/components/providers/session-provider';
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { fetcher } from "@/lib/api";
import {
  BarChart3,
  Download,
  Users,
  Target,
  Clock,
  Loader2,
  CheckSquare,
  Filter,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/layout/header";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";

export default function ReportsPageClient() {
  const { data: session } = useSession();
  const router = useRouter();
  const { data: stats, isLoading } = useSWR("/api/dashboard", fetcher);
  const { data: tasks } = useSWR("/api/tasks", fetcher);

  const userRole = (session?.user as any)?.role || "Team Member";
  const canManage = userRole === "Admin" || userRole === "Manager";

  // Filter states
  const [selectedEmployee, setSelectedEmployee] = useState<string>("all");
  const [selectedProgress, setSelectedProgress] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);

  // Get unique employee names from tasks
  const employeeNames = useMemo(() => {
    if (!tasks) return [];
    const names = new Set(tasks.map((t: any) => t.name).filter(Boolean));
    return Array.from(names).sort();
  }, [tasks]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    if (!tasks) return [];
    return tasks.filter((task: any) => {
      if (selectedEmployee !== "all" && task.name !== selectedEmployee) return false;
      if (selectedProgress !== "all" && task.progress !== selectedProgress) return false;
      if (dateFrom && task.date && new Date(task.date) < new Date(dateFrom)) return false;
      if (dateTo && task.date && new Date(task.date) > new Date(dateTo + "T23:59:59")) return false;
      return true;
    });
  }, [tasks, selectedEmployee, selectedProgress, dateFrom, dateTo]);

  // Calculate filtered metrics
  const filteredMetrics = useMemo(() => {
    const uniqueEmployees = new Set(filteredTasks.map((t: any) => t.name));
    const completed = filteredTasks.filter((t: any) => t.progress === "Completed").length;
    const scores = filteredTasks
      .filter((t: any) => t.overallScore)
      .map((t: any) => parseFloat(t.overallScore))
      .filter((s: number) => !isNaN(s));
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length) : 0;
    const totalTimeTaken = filteredTasks
      .filter((t: any) => t.taskTimeTaken)
      .reduce((sum: number, t: any) => {
        const match = t.taskTimeTaken.match(/(\d+)h\s*(\d+)m/);
        if (match) return sum + parseInt(match[1]) + parseInt(match[2]) / 60;
        return sum;
      }, 0);

    return {
      totalEmployees: uniqueEmployees.size,
      completedTasks: completed,
      avgScore,
      totalHours: Math.round(totalTimeTaken),
    };
  }, [filteredTasks]);

  // Filtered score distribution
  const performanceTrends = useMemo(() => {
    const buckets = { "0-20": 0, "21-40": 0, "41-60": 0, "61-80": 0, "81-100": 0 };
    filteredTasks.forEach((t: any) => {
      const score = parseFloat(t.overallScore);
      if (isNaN(score)) return;
      if (score <= 20) buckets["0-20"]++;
      else if (score <= 40) buckets["21-40"]++;
      else if (score <= 60) buckets["41-60"]++;
      else if (score <= 80) buckets["61-80"]++;
      else buckets["81-100"]++;
    });
    return Object.entries(buckets).map(([range, count]) => ({ range, count }));
  }, [filteredTasks]);

  // Filtered top performers
  const topPerformers = useMemo(() => {
    const employeeScores: Record<string, { name: string; tasks: number; completed: number; totalScore: number }> = {};
    filteredTasks.forEach((t: any) => {
      if (!employeeScores[t.name]) {
        employeeScores[t.name] = { name: t.name, tasks: 0, completed: 0, totalScore: 0 };
      }
      employeeScores[t.name].tasks++;
      if (t.progress === "Completed") employeeScores[t.name].completed++;
      if (t.overallScore) {
        const s = parseFloat(t.overallScore);
        if (!isNaN(s)) employeeScores[t.name].totalScore += s;
      }
    });
    return Object.values(employeeScores)
      .map(emp => ({
        ...emp,
        overallScore: emp.tasks > 0 ? Math.round(emp.totalScore / emp.tasks) : 0,
      }))
      .sort((a, b) => b.overallScore - a.overallScore)
      .slice(0, 10);
  }, [filteredTasks]);

  const clearFilters = () => {
    setSelectedEmployee("all");
    setSelectedProgress("all");
    setDateFrom("");
    setDateTo("");
  };

  const hasActiveFilters = selectedEmployee !== "all" || selectedProgress !== "all" || dateFrom !== "" || dateTo !== "";

  const metrics = [
    {
      title: "Total Employees",
      value: filteredMetrics.totalEmployees,
      description: "Active team members",
      icon: Users,
      bg: "bg-blue-500/10",
      color: "text-blue-500"
    },
    {
      title: "Tasks Completed",
      value: filteredMetrics.completedTasks,
      description: "Filtered results",
      icon: CheckSquare,
      bg: "bg-emerald-500/10",
      color: "text-emerald-500"
    },
    {
      title: "Avg. Score",
      value: filteredMetrics.avgScore ? `${filteredMetrics.avgScore}%` : "N/A",
      description: "Overall performance",
      icon: Target,
      bg: "bg-purple-500/10",
      color: "text-purple-500"
    },
    {
      title: "Hours Tracked",
      value: filteredMetrics.totalHours || 0,
      description: "Total time spent",
      icon: Clock,
      bg: "bg-amber-500/10",
      color: "text-amber-500"
    }
  ];

  const handleExport = () => {
    if (filteredTasks.length === 0) {
      toast.error("No data available to export");
      return;
    }
    const headers = ["Employee", "Task", "Progress", "Deadline", "Submission Date", "Deadline Adherence", "Overall Score"];
    const rows = filteredTasks.map((t: any) => [
      `"${t.name || ""}"`,
      `"${t.task || ""}"`,
      `"${t.progress || ""}"`,
      `"${t.deadline || ""}"`,
      `"${t.submissionDate || ""}"`,
      `"${t.deadlineAdherence || ""}"`,
      `"${t.overallScore || ""}"`
    ]);
    const csvContent = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.setAttribute("download", `filtered-report-${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Report exported!");
  };

  if (!isLoading && !canManage) {
    router.replace("/dashboard");
    return null;
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
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Performance Reports</h1>
                <p className="text-muted-foreground text-sm">
                  {hasActiveFilters ? "Filtered results" : "Real-time metrics from database"}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={showFilters ? "default" : "outline"}
                className="border-primary/20 hover:bg-primary/10"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="mr-2 h-4 w-4" />
                Filters
                {hasActiveFilters && (
                  <span className="ml-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                    !
                  </span>
                )}
              </Button>
              <Button variant="outline" className="border-primary/20 hover:bg-primary/10 text-primary" onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" /> Export CSV
              </Button>
            </div>
          </div>

          {/* Filter Bar */}
          {showFilters && (
            <Card className="mb-6 border-border bg-card/50">
              <CardContent className="pt-4 pb-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Employee</label>
                    <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="All employees" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Employees</SelectItem>
                        {employeeNames.map(name => (
                          <SelectItem key={name} value={name}>{name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Progress</label>
                    <Select value={selectedProgress} onValueChange={setSelectedProgress}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="All statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="To-do">To-do</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="Review">Review</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Date From</label>
                    <Input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Date To</label>
                    <Input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="h-9"
                    />
                  </div>
                </div>
                {hasActiveFilters && (
                  <div className="mt-3 flex justify-end">
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs h-7">
                      <X className="mr-1 h-3 w-3" /> Clear Filters
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

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
                <CardDescription>Number of tasks per performance bracket</CardDescription>
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
                  {topPerformers.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">No data for current filters</p>
                  ) : (
                    topPerformers.map((emp: any, index: number) => (
                      <div key={emp.name} className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                            #{index + 1}
                          </div>
                          <div>
                            <p className="text-sm font-semibold">{emp.name}</p>
                            <p className="text-xs text-muted-foreground">{emp.tasks} tasks • {emp.completed} done</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-primary">{emp.overallScore}%</p>
                          <p className="text-[10px] text-muted-foreground">Score</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filtered Tasks Count */}
          <p className="text-xs text-muted-foreground text-center mt-6">
            Showing {filteredTasks.length} of {tasks?.length || 0} tasks
            {hasActiveFilters && " (filtered)"}
          </p>
        </main>
      )}
    </div>
  );
}