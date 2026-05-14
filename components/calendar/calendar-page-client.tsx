"use client";

import { useSession } from '@/components/providers/session-provider';
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import useSWR from "swr";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isToday,
  parseISO,
} from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  Calendar as CalendarIcon,
  List,
  Grid3x3,
  User,
  CheckCircle2,
  Circle,
  Clock,
  Eye,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { Task, TaskProgress } from "@/types/task";
import { ROLE_PERMISSIONS } from "@/types/user";

type ViewMode = "month" | "week" | "day";

export default function CalendarPageClient() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter states
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  const [progressFilter, setProgressFilter] = useState<TaskProgress | "all">("all");
  const [titleFilter, setTitleFilter] = useState<string>("all");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const userRole = (session?.user as any)?.role || "Team Member";
  const isAdminOrManager = userRole === "Admin" || userRole === "Manager";

  // Redirect if not authorized
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && !isAdminOrManager) {
      router.push("/dashboard");
    }
  }, [status, isAdminOrManager, router]);

  // Fetch tasks
  const { data: tasks, error, isLoading, mutate } = useSWR<Task[]>(
    session?.user ? '/api/tasks' : null,
    async (url: string) => {
      const res = await fetch(url);
      return res.json();
    },
    { refreshInterval: 30000 }
  );

  // Get unique assignees and titles for filters
  const assignees = useMemo(() => {
    if (!Array.isArray(tasks)) return [];
    return [...new Set(tasks.map((t) => t.name).filter(Boolean))].sort();
  }, [tasks]);

  const titles = useMemo(() => {
    if (!Array.isArray(tasks)) return [];
    return [...new Set(tasks.map((t) => t.task.split(' ')[0]).filter(Boolean))].sort();
  }, [tasks]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    if (!Array.isArray(tasks)) return [];

    return tasks.filter((task) => {
      const matchesAssignee = assigneeFilter === "all" || task.name === assigneeFilter;
      const matchesProgress = progressFilter === "all" || task.progress === progressFilter;
      const matchesTitle = titleFilter === "all" || task.task.toLowerCase().includes(titleFilter.toLowerCase());
      
      return matchesAssignee && matchesProgress && matchesTitle;
    });
  }, [tasks, assigneeFilter, progressFilter, titleFilter]);

  // Group tasks by date
  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>();
    
    filteredTasks.forEach((task) => {
      // Use createdAt or a deadline field, or fallback to current date
      const date = task.deadline ? parseISO(task.deadline) : new Date(task.createdAt || Date.now());
      const dateKey = format(date, "yyyy-MM-dd");
      
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(task);
    });
    
    return map;
  }, [filteredTasks]);

  // Calendar navigation
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const nextWeek = () => setCurrentDate(addDays(currentDate, 7));
  const prevWeek = () => setCurrentDate(subDays(currentDate, 7));
  const nextDay = () => setCurrentDate(addDays(currentDate, 1));
  const prevDay = () => setCurrentDate(subDays(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  // Get days for month view
  const getMonthDays = () => {
    const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 });
    const days = [];
    let day = start;
    
    while (day <= end) {
      days.push(day);
      day = addDays(day, 1);
    }
    return days;
  };

  // Get days for week view
  const getWeekDays = () => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    const days = [];
    for (let i = 0; i < 7; i++) {
      days.push(addDays(start, i));
    }
    return days;
  };

  const monthDays = getMonthDays();
  const weekDays = getWeekDays();

  // Get tasks for a specific day
  const getTasksForDay = (date: Date) => {
    const dateKey = format(date, "yyyy-MM-dd");
    return tasksByDate.get(dateKey) || [];
  };

  // Get progress color
  const getProgressColor = (progress: string) => {
    switch (progress) {
      case "Completed":
        return "bg-emerald-500";
      case "In Progress":
        return "bg-amber-500";
      case "Review":
        return "bg-blue-500";
      default:
        return "bg-slate-500";
    }
  };

  const getProgressIcon = (progress: string) => {
    switch (progress) {
      case "Completed":
        return <CheckCircle2 className="h-3 w-3" />;
      case "In Progress":
        return <Clock className="h-3 w-3" />;
      case "Review":
        return <Eye className="h-3 w-3" />;
      default:
        return <Circle className="h-3 w-3" />;
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setAssigneeFilter("all");
    setProgressFilter("all");
    setTitleFilter("all");
  };

  const hasActiveFilters = assigneeFilter !== "all" || progressFilter !== "all" || titleFilter !== "all";

  if (!isAdminOrManager) return null;

  return (
    <div className="flex-1 flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 p-4 lg:p-6 max-w-[1600px] mx-auto w-full">
        {/* Header with Navigation */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-foreground">Calendar</h1>
              <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                <button
                  onClick={() => setViewMode("month")}
                  className={cn(
                    "p-2 rounded-md transition-all",
                    viewMode === "month" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Grid3x3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("week")}
                  className={cn(
                    "p-2 rounded-md transition-all",
                    viewMode === "week" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={goToToday}>
                Today
              </Button>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={viewMode === "month" ? prevMonth : viewMode === "week" ? prevWeek : prevDay}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-lg font-semibold min-w-[200px] text-center">
                  {viewMode === "month" && format(currentDate, "MMMM yyyy")}
                  {viewMode === "week" && `Week of ${format(startOfWeek(currentDate, { weekStartsOn: 1 }), "MMM dd")}`}
                  {viewMode === "day" && format(currentDate, "MMMM dd, yyyy")}
                </span>
                <Button variant="ghost" size="icon" onClick={viewMode === "month" ? nextMonth : viewMode === "week" ? nextWeek : nextDay}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              
              <Button
                variant={showFilters ? "default" : "outline"}
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="gap-2"
              >
                <Filter className="h-4 w-4" />
                Filters
                {hasActiveFilters && <span className="ml-1 h-2 w-2 rounded-full bg-primary" />}
              </Button>
            </div>
          </div>
          
          {/* Filters Panel */}
          {showFilters && (
            <div className="bg-card border border-border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">Filters</h3>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
                    <X className="h-3 w-3" />
                    Clear all
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Assignee</label>
                  <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Assignees" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Assignees</SelectItem>
                      {assignees.map((assignee) => (
                        <SelectItem key={assignee} value={assignee}>
                          {assignee}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Progress</label>
                  <Select value={progressFilter} onValueChange={(v) => setProgressFilter(v as TaskProgress | "all")}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="To-do">To-do</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Review">Review</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Task Title</label>
                  <Select value={titleFilter} onValueChange={setTitleFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Titles" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Titles</SelectItem>
                      {titles.map((title) => (
                        <SelectItem key={title} value={title}>
                          {title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Active filters display */}
              {hasActiveFilters && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {assigneeFilter !== "all" && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-md text-xs">
                      Assignee: {assigneeFilter}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => setAssigneeFilter("all")} />
                    </span>
                  )}
                  {progressFilter !== "all" && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-md text-xs">
                      Status: {progressFilter}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => setProgressFilter("all")} />
                    </span>
                  )}
                  {titleFilter !== "all" && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-md text-xs">
                      Title: {titleFilter}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => setTitleFilter("all")} />
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Calendar View */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {/* Month View */}
            {viewMode === "month" && (
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="grid grid-cols-7 border-b border-border">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                    <div key={day} className="p-3 text-center text-sm font-medium text-muted-foreground border-r last:border-r-0 border-border">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 auto-rows-fr">
                  {monthDays.map((day, idx) => {
                    const dayTasks = getTasksForDay(day);
                    const isCurrentMonth = isSameMonth(day, currentDate);
                    const isTodayDate = isToday(day);
                    
                    return (
                      <div
                        key={idx}
                        className={cn(
                          "min-h-[120px] p-2 border-r border-b border-border transition-all hover:bg-accent/30",
                          !isCurrentMonth && "bg-muted/20",
                          isTodayDate && "bg-primary/5"
                        )}
                      >
                        <div className={cn(
                          "text-sm mb-2",
                          isTodayDate ? "font-bold text-primary" : "text-muted-foreground",
                          !isCurrentMonth && "text-muted-foreground/50"
                        )}>
                          {format(day, "d")}
                        </div>
                        <div className="space-y-1">
                          {dayTasks.slice(0, 3).map((task) => (
                            <div
                              key={task.id}
                              onClick={() => setSelectedTask(task)}
                              className="text-xs p-1.5 rounded-md bg-primary/10 hover:bg-primary/20 cursor-pointer transition-colors truncate"
                            >
                              <div className="flex items-center gap-1">
                                {getProgressIcon(task.progress)}
                                <span className="truncate">{task.task}</span>
                              </div>
                            </div>
                          ))}
                          {dayTasks.length > 3 && (
                            <div className="text-xs text-muted-foreground pl-1">
                              +{dayTasks.length - 3} more
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Week View */}
            {viewMode === "week" && (
              <div className="bg-card border border-border rounded-xl overflow-x-auto">
                <div className="grid grid-cols-7 min-w-[700px]">
                  {weekDays.map((day, idx) => {
                    const dayTasks = getTasksForDay(day);
                    const isTodayDate = isToday(day);
                    
                    return (
                      <div key={idx} className="border-r last:border-r-0 border-border">
                        <div className={cn(
                          "p-3 text-center border-b border-border",
                          isTodayDate && "bg-primary/5"
                        )}>
                          <div className="text-sm text-muted-foreground">{format(day, "EEE")}</div>
                          <div className={cn(
                            "text-lg font-semibold",
                            isTodayDate && "text-primary"
                          )}>
                            {format(day, "d")}
                          </div>
                        </div>
                        <div className="min-h-[500px] p-2 space-y-2">
                          {dayTasks.map((task) => (
                            <div
                              key={task.id}
                              onClick={() => setSelectedTask(task)}
                              className="p-2 rounded-md bg-primary/10 hover:bg-primary/20 cursor-pointer transition-colors"
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <div className={cn("w-2 h-2 rounded-full", getProgressColor(task.progress))} />
                                <span className="text-sm font-medium truncate">{task.task}</span>
                              </div>
                              <div className="text-xs text-muted-foreground truncate">
                                {task.name}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Day View */}
            {viewMode === "day" && (
              <div className="bg-card border border-border rounded-xl">
                <div className="p-4 border-b border-border">
                  <h2 className="text-xl font-semibold text-foreground">
                    {format(currentDate, "EEEE, MMMM d, yyyy")}
                  </h2>
                </div>
                <div className="p-4 space-y-3">
                  {getTasksForDay(currentDate).length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      No tasks scheduled for this day
                    </div>
                  ) : (
                    getTasksForDay(currentDate).map((task) => (
                      <div
                        key={task.id}
                        onClick={() => setSelectedTask(task)}
                        className="p-4 rounded-lg border border-border hover:border-primary/30 cursor-pointer transition-all hover:shadow-md"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className={cn("w-2 h-2 rounded-full", getProgressColor(task.progress))} />
                            <h3 className="font-semibold text-foreground">{task.task}</h3>
                          </div>
                          <span className={cn(
                            "text-xs px-2 py-1 rounded-full",
                            task.progress === "Completed" && "bg-emerald-500/10 text-emerald-500",
                            task.progress === "In Progress" && "bg-amber-500/10 text-amber-500",
                            task.progress === "Review" && "bg-blue-500/10 text-blue-500",
                            task.progress === "To-do" && "bg-slate-500/10 text-slate-500"
                          )}>
                            {task.progress}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Assignee: {task.name}</span>
                          {task.deadline && <span>Due: {format(parseISO(task.deadline), "MMM dd, yyyy")}</span>}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </>
        )}
        
        {/* Task Detail Modal */}
        {selectedTask && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedTask(null)}>
            <div className="bg-card border border-border rounded-xl p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">{selectedTask.task}</h3>
                <Button variant="ghost" size="icon" onClick={() => setSelectedTask(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-muted-foreground">Status</label>
                  <div className="flex items-center gap-2 mt-1">
                    {getProgressIcon(selectedTask.progress)}
                    <span>{selectedTask.progress}</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Assignee</label>
                  <p className="text-foreground">{selectedTask.name}</p>
                </div>
                {selectedTask.description && (
                  <div>
                    <label className="text-sm text-muted-foreground">Description</label>
                    <p className="text-foreground text-sm">{selectedTask.description}</p>
                  </div>
                )}
                {selectedTask.deadline && (
                  <div>
                    <label className="text-sm text-muted-foreground">Due Date</label>
                    <p className="text-foreground">{format(parseISO(selectedTask.deadline), "MMMM dd, yyyy")}</p>
                  </div>
                )}
                <div className="pt-4">
                  <Button
                    className="w-full"
                    onClick={() => {
                      router.push(`/tasks/${selectedTask.id}`);
                      setSelectedTask(null);
                    }}
                  >
                    View Task Details
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}