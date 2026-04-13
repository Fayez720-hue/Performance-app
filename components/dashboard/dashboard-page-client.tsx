"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { getApiUrl } from "@/lib/api";
import {
  LayoutDashboard,
  CheckSquare,
  BarChart3,
  Settings as SettingsIcon,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

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
  taskCompletion: { name: string; completion: number }[];
  performanceData: { score: number; adherence: number; size: number }[];
  employees: Employee[];
  userRole?: string;
  isPersonalView?: boolean;
}

export default function DashboardPageClient() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  // Filter states
  const [performanceFilter, setPerformanceFilter] = useState<"all" | "excellent" | "good">("all");
  const [scoreRange, setScoreRange] = useState<[number, number]>([0, 100]);
  const [adherenceRange, setAdherenceRange] = useState<[number, number]>([0, 100]);
  const [editsRange, setEditsRange] = useState<[number, number]>([0, 50]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (status !== "authenticated") return;
    fetchDashboardData();
  }, [status]);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch(getApiUrl("/api/dashboard"));
      if (!response.ok) throw new Error("Failed to fetch");
      const dashboardData = await response.json();
      setData(dashboardData);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const departmentAverages = data?.employees?.reduce((acc, emp) => {
    if (!emp.title) return acc;
    if (!acc[emp.title]) {
      acc[emp.title] = { totalScore: 0, totalAdherence: 0, count: 0 };
    }
    acc[emp.title].totalScore += emp.overallScore || 0;
    acc[emp.title].totalAdherence += emp.shiftAdherence || 0;
    acc[emp.title].count++;
    return acc;
  }, {} as Record<string, { totalScore: number; totalAdherence: number; count: number }>) || {};

  const departmentChartData = departmentAverages ? Object.entries(departmentAverages).map(([name, values]: [string, any]) => ({
    name,
    averageScore: Math.round(values.totalScore / (values.count || 1)),
    averageAdherence: Math.round(values.totalAdherence / (values.count || 1)),
  })) : [];

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading dashboard...</div>
      </div>
    );
  }

  if (status !== "authenticated") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Please sign in to access the dashboard.</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">No data available</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 transition-opacity" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed top-0 left-0 h-full w-64 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-bold">Menu</h2>
          <button onClick={() => setSidebarOpen(false)} className="p-1 hover:bg-gray-100 rounded">✕</button>
        </div>
        <nav className="p-4 space-y-2">
          <button onClick={() => router.push("/dashboard")} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-primary/10 text-primary font-medium">
            <LayoutDashboard className="h-5 w-5" /> Dashboard
          </button>
          <button onClick={() => router.push("/tasks")} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-muted">
            <CheckSquare className="h-5 w-5" /> Tasks
          </button>
          <button onClick={() => router.push("/reports")} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-muted">
            <BarChart3 className="h-5 w-5" /> Reports
          </button>
          <button onClick={() => router.push("/settings")} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-muted">
            <SettingsIcon className="h-5 w-5" /> Settings
          </button>
        </nav>
      </div>

      {/* Header Buttons */}
      <button onClick={() => setSidebarOpen(true)} className="fixed top-4 left-4 z-30 p-2 bg-white rounded-lg shadow-md">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
      </button>

      <div className="fixed top-4 right-4 z-30 flex gap-2">
        <button onClick={() => setShowProfile(!showProfile)} className="p-2 bg-white rounded-full shadow-md">
           <span className="text-blue-600 font-bold">{session?.user?.name?.charAt(0)}</span>
        </button>
      </div>

      {/* Profile Modal */}
      {showProfile && (
        <div className="fixed top-16 right-4 w-64 bg-white rounded-lg shadow-xl z-50 p-4 border">
          <p className="font-medium">{session?.user?.name}</p>
          <p className="text-xs text-gray-500 mb-3">{session?.user?.email}</p>
          <button onClick={() => signOut()} className="w-full text-left text-sm text-red-600 border-t pt-2">Sign Out</button>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6 pt-20">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">{(data as any).isPersonalView ? "My Performance" : "Team Performance"}</h1>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-white p-4 rounded-xl shadow-sm border">
            <p className="text-sm text-muted-foreground">Average Score</p>
            <p className="text-2xl font-bold">{data.avgScore}%</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border">
            <p className="text-sm text-muted-foreground">Completion</p>
            <p className="text-2xl font-bold">{data.completionRate}%</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border">
            <p className="text-sm text-muted-foreground">Adherence</p>
            <p className="text-2xl font-bold">{data.avgShiftAdherence}%</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border">
            <p className="text-sm text-muted-foreground">Total Edits</p>
            <p className="text-2xl font-bold">{data.totalEdits}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border">
            <p className="text-sm text-muted-foreground">Top Performer</p>
            <p className="text-lg font-bold truncate">{data.topPerformer}</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h3 className="font-semibold mb-4">Performance by Department</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={departmentChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="averageScore" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h3 className="font-semibold mb-4">Weekly Adherence</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.shiftTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="week" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="adherence" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
