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
  email: string;
  name: string;
  role: string;
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
  const [roleFilter, setRoleFilter] = useState<string>("all");
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
    return data.employees
      .filter(emp => {
        const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase());
        // Match role: check if employee title contains the role filter word
        const matchesRole = roleFilter === "all" || 
          emp.title?.toLowerCase().includes(roleFilter.toLowerCase()) ||
          emp.performance?.toLowerCase().includes(roleFilter.toLowerCase());
        return matchesSearch && matchesRole;
      })
      .slice(0, 10);
  }, [data?.employees, searchTerm, data?.isPersonalView, currentUserStats, roleFilter]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col font-sans selection:bg-teal-500/30 bg-[#090a11]">
      <Header />

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500 shadow-[0_0_15px_rgba(20,184,166,0.2)]"></div>
        </div>
      ) : (
        <main className="flex-1 p-4 lg:p-8 max-w-7xl mx-auto w-full space-y-8 animate-in fade-in duration-700">
          <div className="flex justify-between items-end mb-2">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-white">
                {data?.isPersonalView ? "My Performance" : "Dashboard"}
              </h2>
              <p className="text-white/40 text-sm font-medium">Welcome back, {session?.user?.name || 'User'}</p>
            </div>
            {canManage && (
              <button className="p-2.5 hover:bg-white/5 rounded-xl transition-all border border-white/5 hover:border-white/10 group">
                <SlidersHorizontal className="h-5 w-5 text-white/40 group-hover:text-white" />
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
                <button className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl flex items-center gap-4 text-left hover:bg-white/[0.04] transition-all hover:border-white/10 group">
                  <div className="h-10 w-10 rounded-xl bg-teal-500/10 flex items-center justify-center border border-teal-500/20 group-hover:scale-110 transition-transform">
                    <CalendarDays className="h-5 w-5 text-teal-400" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-white/30 font-bold tracking-[0.1em]">Date Range</p>
                    <p className="text-xs font-bold text-white/90">
                      {format(dateRange.from, "MMM dd")} - {format(dateRange.to, "MMM dd")}
                    </p>
                  </div>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-[#090a11] border-white/10" align="start">
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
                  className="bg-[#090a11] text-white"
                />
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <button className={cn(
                  "bg-white/[0.02] border border-white/5 p-4 rounded-2xl flex items-center justify-between text-left hover:bg-white/[0.04] transition-all hover:border-white/10 w-full",
                  !canManage && "opacity-40 pointer-events-none grayscale"
                )}>
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-teal-500/10 flex items-center justify-center border border-teal-500/20">
                      <Users className="h-5 w-5 text-teal-400" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-white/30 font-bold tracking-[0.1em]">Role Selection</p>
                      <p className="text-xs font-bold text-white/90 capitalize">{roleFilter === "all" ? "All Roles" : roleFilter}</p>
                    </div>
                  </div>
                  {canManage && <ChevronRight className="h-4 w-4 text-white/20" />}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-2 bg-[#090a11] border-white/10" align="start">
                <div className="space-y-1">
                  {["all", "Admin", "Manager", "Team Member", "Viewer"].map((role) => (
                    <button
                      key={role}
                      onClick={() => setRoleFilter(role)}
                      className={cn(
                        "w-full text-left px-3 py-2 text-sm rounded-lg transition-colors capitalize",
                        roleFilter === role ? "bg-teal-500/20 text-teal-400" : "text-white/60 hover:bg-white/5 hover:text-white"
                      )}
                    >
                      {role === "all" ? "All Roles" : role}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/5 blur-[80px] -mr-32 -mt-32" />
            <h3 className="text-[11px] uppercase text-white/30 font-bold tracking-[0.2em] mb-8 flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-teal-400 shadow-[0_0_8px_#2dd4bf]" />
              {data?.isPersonalView ? "My Score Over Time" : "Performance Score Distribution"}
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.scoreDistribution || []}>
                  <XAxis dataKey="range" hide />
                  <Tooltip
                    cursor={{fill: 'rgba(255,255,255,0.03)'}}
                    contentStyle={{backgroundColor: '#090a11', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff'}}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {data?.scoreDistribution?.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={index === 3 || data?.isPersonalView ? '#2dd4bf' : 'rgba(255,255,255,0.05)'}
                        fillOpacity={0.9}
                        className="transition-all duration-500 hover:fill-teal-300"
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 flex flex-col justify-between group hover:bg-white/[0.04] transition-all">
              <h3 className="text-[10px] uppercase text-white/30 font-bold tracking-[0.15em] mb-4">Deadline Adherence</h3>
              <div className="h-24 w-full mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data?.shiftTrend || []}>
                    <defs>
                      <linearGradient id="colorAdherence" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="adherence" stroke="#2dd4bf" strokeWidth={3} fill="url(#colorAdherence)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-end justify-between">
                <p className="text-3xl font-bold text-teal-400">
                  {typeof data?.avgShiftAdherence === 'number'
                    ? data.avgShiftAdherence.toFixed(1).replace(/\.0$/, '')
                    : 0}%
                </p>
                <div className="bg-teal-500/10 px-2 py-1 rounded-lg text-[10px] text-teal-400 font-bold border border-teal-500/10 shadow-[0_0_10px_rgba(20,184,166,0.1)]">
                  +2.1%
                </div>
              </div>
            </div>
            <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 flex flex-col justify-between group hover:bg-white/[0.04] transition-all">
              <h3 className="text-[10px] uppercase text-white/30 font-bold tracking-[0.15em] mb-4">
                {data?.isPersonalView ? "My Tasks" : "Total Tasks"}
              </h3>
              <div className="py-2">
                <p className="text-5xl font-serif italic text-white mb-2">
                  {data?.isPersonalView
                    ? `${data.completedTasks ?? 0}/${data.totalTasks ?? 0}`
                    : `${data?.completedTasks ?? 0}/${data?.totalTasks ?? 0}`
                  }
                </p>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="text-[10px] text-white/40 font-bold tracking-widest uppercase">
                    Live Syncing
                  </p>
                </div>
              </div>
            </div>
          </div>

          {canManage && (
            <div className="bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden">
              <div className="p-6 flex justify-between items-center border-b border-white/5">
                <h3 className="text-[11px] uppercase text-white/30 font-bold tracking-widest">Employee Performance</h3>
                <button
                  onClick={() => router.push("/reports")}
                  className="text-[10px] uppercase text-teal-400 font-bold flex items-center gap-1 hover:gap-2 transition-all"
                >
                  Analysis <ChevronRight className="h-3 w-3" />
                </button>
              </div>
              <div className="divide-y divide-white/5">
                {filteredEmployees.map((emp, i) => (
                  <div key={i} className="p-5 flex items-center justify-between group hover:bg-white/[0.03] transition-colors relative">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-white/5 flex items-center justify-center text-xs font-bold text-white/40 border border-white/5 group-hover:border-teal-500/30 transition-all">
                        {emp.name.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase()}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white/90 group-hover:text-white transition-colors">{emp.name}</h4>
                        <p className="text-[10px] text-white/30 font-bold uppercase tracking-wide">{emp.title}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="text-right">
                        <span className="text-sm font-bold text-teal-400">{emp.overallScore}</span>
                        <p className="text-[9px] text-white/20 font-bold uppercase tracking-widest">Score</p>
                      </div>
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
          className="fixed bottom-8 right-8 h-14 w-14 bg-teal-500 rounded-2xl shadow-[0_10px_30px_rgba(20,184,166,0.3)] flex items-center justify-center group active:scale-90 transition-all z-40 border border-teal-400/20"
        >
          <Plus className="text-white h-7 w-7 group-hover:rotate-90 transition-transform duration-500" />
        </button>
      )}
    </div>
  );
}
