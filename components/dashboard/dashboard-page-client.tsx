"use client";

import { useSession } from 'next-auth/react';
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Search,
  Calendar,
  Users,
  SlidersHorizontal,
  Plus,
  LayoutGrid,
  BarChart3,
  Activity,
  CheckSquare,
  TrendingUp,
  ChevronRight
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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

  const isTeamMember = data?.userRole === "Team Member" || data?.isPersonalView;
  const canManage = data?.userRole === "Admin" || data?.userRole === "Manager";

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      fetchDashboardData();
    }
  }, [status]);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch("/api/dashboard");
      if (!response.ok) throw new Error("Failed to fetch");
      const dashboardData = await response.json();
      setData(dashboardData);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEmployees = useMemo(() => {
    if (!data?.employees) return [];
    // For personal view, we only show the current user in the list if they exist there
    if (data.isPersonalView) {
      return data.employees.filter(emp =>
        emp.name.toLowerCase().includes(session?.user?.name?.toLowerCase() || "")
      );
    }
    return data.employees.filter(emp =>
      emp.name.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 3);
  }, [data?.employees, searchTerm, data?.isPersonalView, session?.user?.name]);

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#090a11]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090a11] text-white pb-24 font-sans selection:bg-teal-500/30">
      {/* Header */}
      <header className="px-6 py-4 flex justify-between items-center border-b border-gray-800/50 sticky top-0 bg-[#090a11]/80 backdrop-blur-md z-40">
        <div className="flex items-center gap-2">
          <LayoutGrid className="text-teal-400 h-6 w-6" />
          <h1 className="text-sm font-bold tracking-widest text-teal-400 uppercase">Dashboard</h1>
        </div>
        <Avatar className="h-9 w-9 border border-teal-500/30 cursor-pointer" onClick={() => router.push("/settings")}>
          <AvatarImage src={session?.user?.image || ""} />
          <AvatarFallback className="bg-teal-900/50 text-teal-400 text-xs uppercase">
            {session?.user?.name?.charAt(0) || "U"}
          </AvatarFallback>
        </Avatar>
      </header>

      <main className="p-6 max-w-lg mx-auto lg:max-w-7xl space-y-6">
        {/* Title & Filter */}
        <div className="flex justify-between items-end">
          <h2 className="text-3xl font-bold tracking-tight">
            {data?.isPersonalView ? "My Performance" : "Can shift"}
          </h2>
          {canManage && (
            <button className="p-2 hover:bg-white/5 rounded-lg transition-colors">
              <SlidersHorizontal className="h-5 w-5 text-gray-400" />
            </button>
          )}
        </div>

        {/* Search - Hidden for Team Members */}
        {canManage && (
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 group-focus-within:text-teal-400 transition-colors" />
            <input
              type="text"
              placeholder="Search employee name..."
              className="w-full bg-[#13151f] border border-gray-800 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-teal-500/50 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        )}

        {/* Date & Role Row */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#13151f] border border-gray-800 p-3 rounded-xl flex items-center gap-3">
            <Calendar className="h-4 w-4 text-teal-400" />
            <div>
              <p className="text-[10px] uppercase text-gray-500 font-bold tracking-wider">Date Range</p>
              <p className="text-xs font-semibold">Oct 01 - Oct 31</p>
            </div>
          </div>
          <div className={cn(
            "bg-[#13151f] border border-gray-800 p-3 rounded-xl flex items-center justify-between",
            !canManage && "opacity-50 pointer-events-none"
          )}>
            <div className="flex items-center gap-3">
              <Users className="h-4 w-4 text-teal-400" />
              <div>
                <p className="text-[10px] uppercase text-gray-500 font-bold tracking-wider">Role Selection</p>
                <p className="text-xs font-semibold">Active Only</p>
              </div>
            </div>
            {canManage && <Plus className="h-3 w-3 text-gray-500" />}
          </div>
        </div>

        {/* Performance Chart */}
        <div className="bg-[#13151f] border border-gray-800 rounded-2xl p-6">
          <h3 className="text-[11px] uppercase text-gray-400 font-bold tracking-[0.2em] mb-6">
            {data?.isPersonalView ? "My Score Over Time" : "Performance Score Distribution"}
          </h3>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.scoreDistribution || []}>
                <XAxis
                  dataKey="range"
                  axisLine={false}
                  tickLine={false}
                  tick={{fill: '#4b5563', fontSize: 10}}
                  hide
                />
                <Tooltip
                  cursor={{fill: 'rgba(255,255,255,0.05)'}}
                  contentStyle={{backgroundColor: '#13151f', border: '1px solid #1f2937', color: '#fff'}}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {data?.scoreDistribution.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={index === 3 || data?.isPersonalView ? '#4fd1c5' : '#2d4a48'}
                      fillOpacity={0.8}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-between mt-2 px-1">
            <span className="text-[9px] uppercase font-bold text-gray-500 tracking-widest italic">Low</span>
            <span className="text-[9px] uppercase font-bold text-gray-400 tracking-widest italic">Median</span>
            <span className="text-[9px] uppercase font-bold text-gray-500 tracking-widest italic">Elite</span>
          </div>
        </div>

        {/* Small Stats Row */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#13151f] border border-gray-800 rounded-2xl p-4 flex flex-col justify-between">
            <h3 className="text-[10px] uppercase text-gray-400 font-bold tracking-widest mb-4">Deadline Adherence</h3>
            <div className="h-20 w-full mb-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.shiftTrend || []}>
                  <Area type="monotone" dataKey="adherence" stroke="#4fd1c5" strokeWidth={2} fill="url(#colorAdherence)" />
                  <defs>
                    <linearGradient id="colorAdherence" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4fd1c5" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#4fd1c5" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-end justify-between">
              <p className="text-xl font-bold text-teal-400">{data?.avgShiftAdherence}%</p>
              <div className="bg-teal-500/10 px-1.5 py-0.5 rounded text-[10px] text-teal-400 font-bold">+2.1%</div>
            </div>
          </div>
          <div className="bg-[#13151f] border border-gray-800 rounded-2xl p-4 flex flex-col justify-between">
            <h3 className="text-[10px] uppercase text-gray-400 font-bold tracking-widest mb-4">
              {data?.isPersonalView ? "My Tasks" : "Tasks"}
            </h3>
            <div>
              <p className="text-3xl font-serif italic mb-1">
                {data?.isPersonalView ? `${data.employees[0]?.completed || 0}/${data.employees[0]?.tasks || 0}` : "24/30"}
              </p>
              <p className="text-[10px] text-gray-500 font-bold tracking-widest uppercase italic">
                {data?.isPersonalView ? "Current Cycle" : "6 Pending Sync"}
              </p>
            </div>
          </div>
        </div>

        {/* Employee Performance - Shown only for Managers/Admins */}
        {canManage && (
          <div className="bg-[#13151f] border border-gray-800 rounded-2xl overflow-hidden">
            <div className="p-5 flex justify-between items-center border-b border-gray-800/50">
              <h3 className="text-[11px] uppercase text-gray-400 font-bold tracking-widest">Employee Performance</h3>
              <button className="text-[10px] uppercase text-teal-400 font-bold flex items-center gap-1 hover:gap-2 transition-all">
                View All <ChevronRight className="h-3 w-3" />
              </button>
            </div>
            <div className="divide-y divide-gray-800/50">
              {filteredEmployees.map((emp, i) => (
                <div key={i} className="p-4 flex items-center justify-between group hover:bg-white/[0.02] transition-colors relative">
                  {i === 1 && <div className="absolute left-0 top-0 bottom-0 w-1 bg-teal-500" />}
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-400">
                      {emp.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold">{emp.name}</h4>
                      <p className="text-[10px] text-gray-500 font-medium">{emp.title}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-8">
                    <span className="text-sm font-bold text-teal-400">{emp.overallScore}</span>
                    <div className={cn(
                      "px-2 py-1 rounded text-[9px] font-bold tracking-widest uppercase",
                      emp.overallScore > 90 ? "bg-teal-500/10 text-teal-400" : "bg-gray-800 text-gray-500"
                    )}>
                      {emp.overallScore > 90 ? "Elite" : "Active"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Floating Button - Only for Managers/Admins */}
      {canManage && (
        <button
          onClick={() => router.push("/tasks/new")}
          className="fixed bottom-24 right-6 h-14 w-14 bg-teal-400 rounded-2xl shadow-lg shadow-teal-500/20 flex items-center justify-center group active:scale-95 transition-all z-40"
        >
          <Plus className="text-black h-8 w-8 group-hover:rotate-90 transition-transform" />
        </button>
      )}

      {/* Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#090a11] border-t border-gray-800 px-6 py-4 flex justify-between items-center z-50">
        <button className="flex flex-col items-center gap-1 text-teal-400">
          <div className="p-1.5 bg-teal-500/10 rounded-lg">
            <LayoutGrid className="h-5 w-5" />
          </div>
          <span className="text-[9px] font-bold uppercase tracking-widest">Dashboard</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-gray-500 hover:text-gray-300">
          <TrendingUp className="h-5 w-5" />
          <span className="text-[9px] font-bold uppercase tracking-widest">Analytics</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-gray-500 hover:text-gray-300">
          <Activity className="h-5 w-5" />
          <span className="text-[9px] font-bold uppercase tracking-widest">Activity</span>
        </button>
        <button onClick={() => router.push("/tasks")} className="flex flex-col items-center gap-1 text-gray-500 hover:text-gray-300">
          <CheckSquare className="h-5 w-5" />
          <span className="text-[9px] font-bold uppercase tracking-widest">Tasks</span>
        </button>
      </nav>
    </div>
  );
}
