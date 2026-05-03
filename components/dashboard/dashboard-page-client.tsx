"use client";

import { useSession } from '@/components/providers/session-provider';
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { format, subDays } from "date-fns";
import {
  Search,
  Users,
  SlidersHorizontal,
  Plus,
  ChevronRight,
  CalendarDays,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Cell
} from "recharts";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Header } from "@/components/layout/header";

interface Employee {
  name: string;
  title: string;
  tasks: number;
  completed: number;
  overallScore: number;
  shiftAdherence: number;
  edits: number;
  performance: "Excellent" | "Good" | "Needs Improvement";
}

interface DashboardData {
  totalEmployees: number;
  avgScore: number;
  completionRate: number;
  totalTasks?: number;
  completedTasks?: number;
  avgShiftAdherence: number;
  totalEdits: number;
  topPerformer: string;
  topPerformerScore: number;
  scoreDistribution: { range: string; count: number }[];
  shiftTrend: { week: string; adherence: number }[];
  employees: Employee[];
  userRole?: string;
  isPersonalView?: boolean;
}

export default function DashboardPageClient() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [dateRange, setDateRange] = useState<{
    from: Date;
    to: Date;
  }>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  const canManage = data?.userRole === "Admin" || data?.userRole === "Manager";

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      fetchDashboardData();
    }
  }, [status, dateRange]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        startDate: format(dateRange.from, "yyyy-MM-dd"),
        endDate: format(dateRange.to, "yyyy-MM-dd"),
      });
      const response = await fetch(`/api/dashboard?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch");
      const dashboardData = await response.json();
      setData(dashboardData);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const currentUserStats = useMemo(() => {
    if (!data?.employees) return null;
    if (data.isPersonalView && data.employees.length > 0) {
      return data.employees[0];
    }
    if (session?.user?.name) {
      const name = session.user.name.toLowerCase();
      return data.employees.find(emp => emp.name.toLowerCase().includes(name)) || null;
    }
    return null;
  }, [data?.employees, data?.isPersonalView, session?.user?.name]);

  const filteredEmployees = useMemo(() => {
    if (!data?.employees) return [];
    if (data.isPersonalView) {
      return currentUserStats ? [currentUserStats] : [];
    }
    return data.employees.filter(emp =>
      emp.name.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 3);
  }, [data?.employees, searchTerm, data?.isPersonalView, currentUserStats]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col font-sans selection:bg-teal-500/30">
      <Header />

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <main className="flex-1 p-4 lg:p-8 max-w-7xl mx-auto w-full space-y-8">
          <div className="flex justify-between items-end mb-2">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-foreground">
                {data?.isPersonalView ? "My Performance" : "Dashboard"}
              </h2>
              <p className="text-muted-foreground">Welcome back, {session?.user?.name || 'User'}</p>
            </div>
            {canManage && (
              <button className="p-2 hover:bg-muted rounded-xl transition-colors border border-border/50">
                <SlidersHorizontal className="h-5 w-5 text-muted-foreground" />
              </button>
            )}
          </div>

          {canManage && (
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                placeholder="Search employee name..."
                className="w-full bg-card border border-border rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-primary/50 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Popover>
              <PopoverTrigger asChild>
                <button className="bg-card border border-border p-3 rounded-xl flex items-center gap-3 text-left hover:border-primary/50 transition-all">
                  <CalendarDays className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Date Range</p>
                    <p className="text-[11px] font-semibold">
                      {format(dateRange.from, "MMM dd")} - {format(dateRange.to, "MMM dd")}
                    </p>
                  </div>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-background border-border" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange.from}
                  selected={{
                    from: dateRange.from,
                    to: dateRange.to,
                  }}
                  onSelect={(range: any) => {
                    if (range?.from && range?.to) {
                      setDateRange({ from: range.from, to: range.to });
                    }
                  }}
                  numberOfMonths={1}
                  className="bg-background text-foreground"
                />
              </PopoverContent>
            </Popover>
            <div className={cn(
              "bg-card border border-border p-3 rounded-xl flex items-center justify-between",
              !canManage && "opacity-50 pointer-events-none"
            )}>
              <div className="flex items-center gap-3">
                <Users className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Role Selection</p>
                  <p className="text-xs font-semibold">Active Only</p>
                </div>
              </div>
              {canManage && <Plus className="h-3 w-3 text-muted-foreground" />}
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="text-[11px] uppercase text-muted-foreground font-bold tracking-[0.2em] mb-6">
              {data?.isPersonalView ? "My Score Over Time" : "Performance Score Distribution"}
            </h3>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.scoreDistribution || []}>
                  <XAxis dataKey="range" hide />
                  <Tooltip
                    cursor={{fill: 'rgba(0,0,0,0.05)'}}
                    contentStyle={{backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))'}}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {data?.scoreDistribution?.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={index === 3 || data?.isPersonalView ? 'hsl(var(--primary))' : 'hsl(var(--muted))'}
                        fillOpacity={0.8}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-card border border-border rounded-2xl p-4 flex flex-col justify-between">
              <h3 className="text-[10px] uppercase text-muted-foreground font-bold tracking-widest mb-4">Deadline Adherence</h3>
              <div className="h-20 w-full mb-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data?.shiftTrend || []}>
                    <Area type="monotone" dataKey="adherence" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#colorAdherence)" />
                    <defs>
                      <linearGradient id="colorAdherence" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-end justify-between">
                <p className="text-xl font-bold text-primary">
                  {typeof data?.avgShiftAdherence === 'number'
                    ? data.avgShiftAdherence.toFixed(1).replace(/\.0$/, '')
                    : 0}%
                </p>
              </div>
            </div>
            <div className="bg-card border border-border rounded-2xl p-4 flex flex-col justify-between">
              <h3 className="text-[10px] uppercase text-muted-foreground font-bold tracking-widest mb-4">
                {data?.isPersonalView ? "My Tasks" : "Tasks"}
              </h3>
              <div>
                <p className="text-3xl font-serif italic mb-1">
                  {data?.isPersonalView
                    ? `${currentUserStats?.completed ?? 0}/${currentUserStats?.tasks ?? 0}`
                    : `${data?.completedTasks ?? 0}/${data?.totalTasks ?? 0}`
                  }
                </p>
                <p className="text-[10px] text-muted-foreground font-bold tracking-widest uppercase italic">
                  Live Sync
                </p>
              </div>
            </div>
          </div>

          {canManage && (
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="p-5 flex justify-between items-center border-b border-border">
                <h3 className="text-[11px] uppercase text-muted-foreground font-bold tracking-widest">Employee Performance</h3>
                <button
                  onClick={() => router.push("/reports")}
                  className="text-[10px] uppercase text-primary font-bold flex items-center gap-1 hover:gap-2 transition-all"
                >
                  View All <ChevronRight className="h-3 w-3" />
                </button>
              </div>
              <div className="divide-y divide-border">
                {filteredEmployees.map((emp, i) => (
                  <div key={i} className="p-4 flex items-center justify-between group hover:bg-muted/50 transition-colors relative">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                        {emp.name.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase()}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold">{emp.name}</h4>
                        <p className="text-[10px] text-muted-foreground font-medium">{emp.title}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <span className="text-sm font-bold text-primary">{emp.overallScore}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      )}

      {canManage && (
        <button
          onClick={() => router.push("/tasks/new")}
          className="fixed bottom-6 right-6 h-14 w-14 bg-teal-500 rounded-2xl shadow-lg shadow-teal-500/20 flex items-center justify-center group active:scale-95 transition-all z-40 border border-teal-400/20"
        >
          <Plus className="text-white h-8 w-8 group-hover:rotate-90 transition-transform" />
        </button>
      )}
    </div>
  );
}
