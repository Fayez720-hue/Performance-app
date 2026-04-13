"use client";

export const runtime = 'edge'

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

export default function DashboardPage() {
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
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // Graph filter states
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [chartMetric, setChartMetric] = useState<"score" | "adherence" | "completion">("score");

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

  const getScoreColor = (score: number) => {
    if (score >= 85) return "bg-green-100 text-green-800";
    if (score >= 70) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  const departments = data?.employees ? ["all", ...new Set(data.employees.map(emp => emp.title))] : ["all"];
  
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

  const filteredEmployees = data?.employees.filter((emp) => {
    if (performanceFilter !== "all" && emp.performance.toLowerCase() !== performanceFilter) return false;
    if (emp.overallScore < scoreRange[0] || emp.overallScore > scoreRange[1]) return false;
    if (emp.shiftAdherence < adherenceRange[0] || emp.shiftAdherence > adherenceRange[1]) return false;
    if (emp.edits < editsRange[0] || emp.edits > editsRange[1]) return false;
    if (searchTerm && !emp.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !emp.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  }) || [];

  const resetFilters = () => {
    setPerformanceFilter("all");
    setScoreRange([0, 100]);
    setAdherenceRange([0, 100]);
    setEditsRange([0, 50]);
    setSearchTerm("");
    setSelectedDepartment("all");
  };

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
      {/* Three Dashes Side Menu Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md hover:bg-gray-100 transition-colors"
      >
        <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Sidebar Menu */}
      {sidebarOpen && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setSidebarOpen(false)} />
          <div className="fixed top-0 left-0 h-full w-64 bg-white shadow-xl z-50">
            <div className="p-4 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-800">Menu</h2>
                <button onClick={() => setSidebarOpen(false)} className="p-1 hover:bg-gray-100 rounded">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <nav className="p-4">
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={() => router.push("/dashboard")}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-primary/10 text-primary font-medium transition-colors"
                  >
                    <LayoutDashboard className="h-5 w-5" />
                    Dashboard
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => router.push("/tasks")}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
                  >
                    <CheckSquare className="h-5 w-5" />
                    Tasks
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => router.push("/reports")}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
                  >
                    <BarChart3 className="h-5 w-5" />
                    Reports
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => router.push("/settings")}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
                  >
                    <SettingsIcon className="h-5 w-5" />
                    Settings
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </>
      )}

      {/* Settings Gear and Profile Icons */}
      <button onClick={() => setShowSettings(!showSettings)} className="fixed top-4 right-16 z-40 p-2 bg-white rounded-lg shadow-md hover:bg-gray-100">
        <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

      <button onClick={() => setShowProfile(!showProfile)} className="fixed top-4 right-4 z-40 p-2 bg-white rounded-full shadow-md hover:bg-gray-100">
        <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </button>

      {/* Settings Panel */}
      {showSettings && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setShowSettings(false)} />
          <div className="fixed top-16 right-16 w-80 bg-white rounded-lg shadow-xl z-50 p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-gray-800">Settings</h3>
              <button onClick={() => setShowSettings(false)}>✕</button>
            </div>
            <div className="space-y-3">
              <div><label className="block text-sm text-gray-600 mb-1">Theme</label><select className="w-full px-3 py-1 border rounded-lg"><option>Light</option><option>Dark</option><option>System</option></select></div>
              <div><label className="block text-sm text-gray-600 mb-1">Notifications</label><select className="w-full px-3 py-1 border rounded-lg"><option>All</option><option>Important Only</option><option>None</option></select></div>
            </div>
          </div>
        </>
      )}

      {/* Profile Panel */}
      {showProfile && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setShowProfile(false)} />
          <div className="fixed top-16 right-4 w-72 bg-white rounded-lg shadow-xl z-50 p-4">
            <div className="flex items-center gap-3 mb-4 pb-3 border-b">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-bold text-lg">{session?.user?.name?.charAt(0) || "U"}</span>
              </div>
              <div>
                <p className="font-medium text-gray-800">{session?.user?.name || "User"}</p>
                <p className="text-xs text-gray-500">{session?.user?.email}</p>
              </div>
            </div>
            <button onClick={() => signOut()} className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg">🚪 Sign Out</button>
          </div>
        </>
      )}

      {/* Main Content - Keep all your charts, KPIs, and table here */}
      <div className="max-w-7xl mx-auto px-4 py-6 pt-20 pb-24">
        <div className="bg-white shadow-sm border-b rounded-lg mb-6">
          <div className="px-4 py-4">
            <h1 className="text-2xl font-bold text-gray-900">
              {(data as any).isPersonalView ? "My Performance Dashboard" : "CanShift Performance Dashboard"}
            </h1>
            <p className="text-sm text-gray-500">
              {(data as any).isPersonalView ? "Your personal analytics" : "Real-time Team Analytics"}
            </p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <div className="bg-white rounded-lg shadow p-3">
            <p className="text-xs text-gray-500">{(data as any).isPersonalView ? "Status" : "Total Employees"}</p>
            <p className="text-xl font-bold">{(data as any).isPersonalView ? "Active" : data?.totalEmployees || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-3"><p className="text-xs text-gray-500">{(data as any).isPersonalView ? "My Score" : "Average Score"}</p><p className="text-xl font-bold">{data?.avgScore || 0}%</p></div>
          <div className="bg-white rounded-lg shadow p-3"><p className="text-xs text-gray-500">Completion Rate</p><p className="text-xl font-bold">{data?.completionRate || 0}%</p></div>
          <div className="bg-white rounded-lg shadow p-3"><p className="text-xs text-gray-500">{(data as any).isPersonalView ? "My Adherence" : "Avg Shift Adherence"}</p><p className="text-xl font-bold">{data?.avgShiftAdherence || 0}%</p></div>
          <div className="bg-white rounded-lg shadow p-3"><p className="text-xs text-gray-500">My Edits</p><p className="text-xl font-bold">{data?.totalEdits || 0}</p></div>
          <div className="bg-white rounded-lg shadow p-3"><p className="text-xs text-gray-500">{(data as any).isPersonalView ? "Target" : "Top Performer"}</p><p className="text-xl font-bold truncate">{(data as any).isPersonalView ? "100%" : data?.topPerformer || "N/A"}</p></div>
        </div>

        {/* Charts - Hide Distribution chart for personal view as it's not useful for 1 person */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {!(data as any).isPersonalView && (
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold mb-3">Performance Score Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.scoreDistribution}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="range" /><YAxis /><Tooltip /><Bar dataKey="count" fill="#3b82f6" /></BarChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className={cn("bg-white rounded-lg shadow p-4", (data as any).isPersonalView && "lg:col-span-2")}>
            <h3 className="font-semibold mb-3">{(data as any).isPersonalView ? "Weekly Adherence Trend" : "Department Performance"}</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={(data as any).isPersonalView ? data.shiftTrend : departmentChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey={(data as any).isPersonalView ? "week" : "name"} />
                <YAxis domain={[0,100]} />
                <Tooltip />
                <Bar dataKey={(data as any).isPersonalView ? "adherence" : "averageScore"} fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Employee Table - Hide for Team Members */}
        {!(data as any).isPersonalView && (
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-semibold mb-4">Team Performance List</h3>
            {/* ... table content ... */}
          </div>
        )}

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-md border-t border-border shadow-lg z-30 md:hidden">
          <div className="max-w-md mx-auto flex justify-around py-3">
            <button
              onClick={() => router.push("/dashboard")}
              className="flex flex-col items-center px-4 text-primary font-medium"
            >
              <LayoutDashboard className="h-5 w-5" />
              <span className="text-[10px] mt-1">Home</span>
            </button>
            <button
              onClick={() => router.push("/tasks")}
              className="flex flex-col items-center px-4 text-muted-foreground hover:text-primary transition-colors"
            >
              <CheckSquare className="h-5 w-5" />
              <span className="text-[10px] mt-1">Tasks</span>
            </button>
            <button
              onClick={() => router.push("/reports")}
              className="flex flex-col items-center px-4 text-muted-foreground hover:text-primary transition-colors"
            >
              <BarChart3 className="h-5 w-5" />
              <span className="text-[10px] mt-1">Reports</span>
            </button>
            <button
              onClick={() => router.push("/settings")}
              className="flex flex-col items-center px-4 text-muted-foreground hover:text-primary transition-colors"
            >
              <SettingsIcon className="h-5 w-5" />
              <span className="text-[10px] mt-1">Profile</span>
            </button>
          </div>
        </div>

        {/* Floating Action Button - Only for Admins and Managers */}
        {(data?.userRole?.toLowerCase() === "admin" || data?.userRole?.toLowerCase() === "manager") && (
          <div className="fixed bottom-28 left-0 right-0 pointer-events-none z-50">
            <div className="max-w-7xl mx-auto px-4 relative h-0">
              <button
                onClick={() => router.push("/tasks/new")}
                className="absolute right-4 bottom-0 pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-2xl transition-transform hover:scale-110 active:scale-95 sm:right-8"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}