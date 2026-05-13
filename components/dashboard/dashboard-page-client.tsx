"use client";

import { useSession } from '@/components/providers/session-provider';
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { format, subDays } from "date-fns";
import {
  Search,
  Users,
  SlidersHorizontal,
  Plus,
  ChevronRight,
  CalendarDays,
  CheckCircle2,
  Clock,
  Circle,
  Eye,
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
  Cell,
  PieChart,
  Pie,
  Legend
} from "recharts";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Header } from "@/components/layout/header";
import { TaskFilters } from "@/components/tasks/task-filters";
import { TaskCard } from "@/components/tasks/task-card";
import type { Task, TaskProgress } from "@/types/task";
import { cn } from "@/lib/utils";

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
  const [titleFilter, setTitleFilter] = useState<string>("all");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [dateRange, setDateRange] = useState<{
    from: Date;
    to: Date;
  }>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  // Task filter states
  const [taskSearch, setTaskSearch] = useState("");
  const [taskProgressFilter, setTaskProgressFilter] = useState<TaskProgress | "all">("all");
  const [taskAssigneeFilter, setTaskAssigneeFilter] = useState("all");

  const canManage = data?.userRole === "Admin" || data?.userRole === "Manager";

  // Fetch tasks with SWR for real-time updates
  const { data: tasks, error: tasksError, isLoading: tasksLoading, mutate: mutateTasks } = useSWR<Task[]>(
    session?.user ? '/api/tasks' : null,
    async (url: string) => {
      const res = await fetch(url);
      return res.json();
    },
    { refreshInterval: 30000 } // Auto-refresh every 30 seconds
  );

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

  // Calculate task statistics from real data
  const taskStats = useMemo(() => {
    if (!tasks) return { todo: 0, inProgress: 0, review: 0, completed: 0, total: 0, completionRate: 0 };
    
    const todo = tasks.filter(t => t.progress === "To-do").length;
    const inProgress = tasks.filter(t => t.progress === "In Progress").length;
    const review = tasks.filter(t => t.progress === "Review").length;
    const completed = tasks.filter(t => t.progress === "Completed").length;
    const total = tasks.length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return { todo, inProgress, review, completed, total, completionRate };
  }, [tasks]);

  // Get unique assignees for task filters
  const taskAssignees = useMemo(() => {
    if (!Array.isArray(tasks)) return [];
    return [...new Set(tasks.map((t) => t.name).filter(Boolean))].sort();
  }, [tasks]);

  // Filter tasks based on user selections
  const filteredTasks = useMemo(() => {
    if (!Array.isArray(tasks)) return [];

    return tasks.filter((task) => {
      const matchesSearch = taskSearch === "" || 
        task.task.toLowerCase().includes(taskSearch.toLowerCase()) ||
        (task.name && task.name.toLowerCase().includes(taskSearch.toLowerCase()));

      const matchesProgress = taskProgressFilter === "all" || task.progress === taskProgressFilter;
      const matchesAssignee = taskAssigneeFilter === "all" || task.name === taskAssigneeFilter;

      return matchesSearch && matchesProgress && matchesAssignee;
    });
  }, [tasks, taskSearch, taskProgressFilter, taskAssigneeFilter]);

  // Prepare chart data from real tasks
  const taskDistributionData = useMemo(() => {
    return [
      { name: "To-do", value: taskStats.todo, color: "#64748b" },
      { name: "In Progress", value: taskStats.inProgress, color: "#eab308" },
      { name: "Review", value: taskStats.review, color: "#3b82f6" },
      { name: "Completed", value: taskStats.completed, color: "#10b981" },
    ].filter(item => item.value > 0);
  }, [taskStats]);

  const weeklyTaskTrend = useMemo(() => {
    if (!tasks) return [];
    
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), i);
      return format(date, "EEE");
    }).reverse();
    
    return last7Days.map(day => ({
      day,
      tasks: tasks.filter(t => format(new Date(t.createdAt || new Date()), "EEE") === day).length
    }));
  }, [tasks]);

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

  const searchSuggestions = useMemo(() => {
    if (!searchTerm || !data?.employees) return [];
    const term = searchTerm.toLowerCase();
    return data.employees
      .filter(emp => emp.name.toLowerCase().includes(term))
      .slice(0, 5)
      .map(emp => emp.name);
  }, [searchTerm, data?.employees]);

  const titles = useMemo(() => {
    if (!data?.employees) return [];
    return [...new Set(data.employees.map(e => e.title).filter(Boolean))].sort();
  }, [data?.employees]);

  const filteredEmployees = useMemo(() => {
    if (!data?.employees) return [];
    if (data.isPersonalView) {
      return currentUserStats ? [currentUserStats] : [];
    }
    return data.employees
      .filter(emp => {
        const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesTitle = titleFilter === "all" || emp.title?.toLowerCase().includes(titleFilter.toLowerCase());
        return matchesSearch && matchesTitle;
      })
      .slice(0, 10);
  }, [data?.employees, searchTerm, data?.isPersonalView, currentUserStats, titleFilter]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col font-sans bg-background">
      <Header />

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <main className="flex-1 p-4 lg:p-8 max-w-7xl mx-auto w-full space-y-8 animate-in fade-in duration-700">
          {/* Header */}
          <div className="flex justify-between items-end mb-2">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-foreground">
                {data?.isPersonalView ? "My Performance" : "Dashboard"}
              </h2>
              <p className="text-muted-foreground text-sm font-medium">Welcome back, {session?.user?.name || 'User'}</p>
            </div>
            {canManage && (
              <button className="p-2.5 hover:bg-accent rounded-xl transition-all border border-border hover:border-primary/20 group">
                <SlidersHorizontal className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />
              </button>
            )}
          </div>

          {/* Task Statistics Cards - Live Data */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-card border border-border rounded-2xl p-5 hover:border-primary/30 transition-all">
              <div className="flex items-center justify-between mb-3">
                <Circle className="h-5 w-5 text-slate-500" />
                <span className="text-2xl font-bold text-foreground">{taskStats.todo}</span>
              </div>
              <p className="text-sm text-muted-foreground">To-do</p>
            </div>
            
            <div className="bg-card border border-border rounded-2xl p-5 hover:border-primary/30 transition-all">
              <div className="flex items-center justify-between mb-3">
                <Clock className="h-5 w-5 text-amber-500" />
                <span className="text-2xl font-bold text-foreground">{taskStats.inProgress}</span>
              </div>
              <p className="text-sm text-muted-foreground">In Progress</p>
            </div>
            
            <div className="bg-card border border-border rounded-2xl p-5 hover:border-primary/30 transition-all">
              <div className="flex items-center justify-between mb-3">
                <Eye className="h-5 w-5 text-blue-500" />
                <span className="text-2xl font-bold text-foreground">{taskStats.review}</span>
              </div>
              <p className="text-sm text-muted-foreground">Review</p>
            </div>
            
            <div className="bg-card border border-border rounded-2xl p-5 hover:border-primary/30 transition-all">
              <div className="flex items-center justify-between mb-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                <span className="text-2xl font-bold text-foreground">{taskStats.completed}</span>
              </div>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
          </div>

          {/* Task Distribution Chart */}
          <div className="bg-card border border-border rounded-3xl p-6 relative overflow-hidden">
            <h3 className="text-[11px] uppercase text-muted-foreground font-bold tracking-[0.2em] mb-6 flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-primary" />
              Task Distribution by Status
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={taskDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {taskDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Weekly Task Trend */}
          <div className="bg-card border border-border rounded-3xl p-6">
            <h3 className="text-[11px] uppercase text-muted-foreground font-bold tracking-[0.2em] mb-6">
              Weekly Task Trend
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyTaskTrend}>
                  <defs>
                    <linearGradient id="taskGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  />
                  <Area type="monotone" dataKey="tasks" stroke="#2dd4bf" strokeWidth={3} fill="url(#taskGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Task Filters */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-[11px] uppercase text-muted-foreground font-bold tracking-[0.2em] flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-primary" />
                Tasks
              </h3>
              <button 
                onClick={() => router.push("/tasks")}
                className="text-[10px] uppercase text-primary font-bold flex items-center gap-1 hover:gap-2 transition-all"
              >
                View All <ChevronRight className="h-3 w-3" />
              </button>
            </div>

            <TaskFilters
              search={taskSearch}
              onSearchChange={setTaskSearch}
              progressFilter={taskProgressFilter}
              onProgressFilterChange={setTaskProgressFilter}
              assigneeFilter={taskAssigneeFilter}
              onAssigneeFilterChange={setTaskAssigneeFilter}
              assignees={taskAssignees}
              userRole={data?.userRole || "Team Member"}
            />
          </div>

          {/* Task List */}
          {tasksLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="text-center py-12 bg-card border border-border rounded-2xl">
              <p className="text-muted-foreground">No tasks found</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredTasks.slice(0, 6).map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  canEdit={data?.userRole === "Admin" || data?.userRole === "Manager"}
                  canDelete={data?.userRole === "Admin"}
                  onDelete={() => mutateTasks()}
                />
              ))}
            </div>
          )}

          {/* Employee Performance Section (only for managers/admins) */}
          {canManage && (
            <div className="bg-card border border-border rounded-3xl overflow-hidden">
              <div className="p-6 flex justify-between items-center border-b border-border">
                <h3 className="text-[11px] uppercase text-muted-foreground font-bold tracking-widest">Employee Performance</h3>
                <button
                  onClick={() => router.push("/reports")}
                  className="text-[10px] uppercase text-primary font-bold flex items-center gap-1 hover:gap-2 transition-all"
                >
                  Analysis <ChevronRight className="h-3 w-3" />
                </button>
              </div>
              <div className="divide-y divide-border">
                {filteredEmployees.map((emp, i) => (
                  <div key={i} className="p-5 flex items-center justify-between group hover:bg-accent/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground border border-border group-hover:border-primary/30 transition-all">
                        {emp.name.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase()}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{emp.name}</h4>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wide">{emp.title}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="text-right">
                        <span className="text-sm font-bold text-primary">{emp.overallScore}</span>
                        <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">Score</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      )}

      {/* Floating Action Button */}
      {canManage && (
        <button
          onClick={() => router.push("/tasks/new")}
          className="fixed bottom-8 right-8 h-14 w-14 bg-primary rounded-2xl shadow-[0_10px_30px_rgba(20,184,166,0.3)] flex items-center justify-center group active:scale-90 transition-all z-40"
        >
          <Plus className="text-primary-foreground h-7 w-7 group-hover:rotate-90 transition-transform duration-500" />
        </button>
      )}
    </div>
  );
}