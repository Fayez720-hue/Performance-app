"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import useSWR from "swr";
import { ClipboardX, Loader2 } from "lucide-react";
import { TaskCard } from "./task-card";
import { TaskFilters } from "./task-filters";
import { TaskStats } from "./task-stats";
import type { User } from "@/types/user";
import type { Task, TaskProgress } from "@/types/task";
import { ROLE_PERMISSIONS } from "@/types/user";

interface TaskDeckProps {
  user: User;
  projectId?: number;
  reviewOnly?: boolean;
}

export function TaskDeck({ user, projectId, reviewOnly = false }: TaskDeckProps) {
  const userRole = user.role || "Team Member";
  const userName = user.name || "Guest";

  const { data: tasks, error, isLoading, mutate } = useSWR<Task[]>(
    user ? (projectId ? `/api/projects/${projectId}` : "/api/tasks") : null,
    async (url: string) => {
      const res = await fetch(url);
      const data = await res.json();
      return projectId ? data.tasks : data;
    },
    { refreshInterval: 30000 }
  );

  const [search, setSearch] = useState("");
  const [progressFilter, setProgressFilter] = useState<TaskProgress | "all">("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [highlightedTaskId, setHighlightedTaskId] = useState<number | null>(null);

  const searchParams = useSearchParams();

  // Handle auto-opening from notifications
  useEffect(() => {
    const taskIdParam = searchParams.get("taskId");
    if (taskIdParam) {
      const id = parseInt(taskIdParam, 10);
      setSearch("");
      setProgressFilter("all");
      setAssigneeFilter("all");

      setTimeout(() => {
        setHighlightedTaskId(id);
        const element = document.getElementById(`task-${id}`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 300);

      setTimeout(() => {
        setHighlightedTaskId(null);
      }, 3000);
    }
  }, [searchParams]);

  const permissions = ROLE_PERMISSIONS[userRole as keyof typeof ROLE_PERMISSIONS] || ROLE_PERMISSIONS.TeamMember;

  // Get unique assignees from tasks
  const assignees = useMemo(() => {
    if (!Array.isArray(tasks)) return [];
    return [...new Set(tasks.map((t) => t.name).filter(Boolean))].sort();
  }, [tasks]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    if (!Array.isArray(tasks)) return [];

    return tasks.filter((task) => {
      // Apply reviewOnly filter
      if (reviewOnly && task.progress !== "Review") {
        return false;
      }

      const matchesSearch = search === "" || 
        task.task.toLowerCase().includes(search.toLowerCase()) ||
        task.name.toLowerCase().includes(search.toLowerCase());

      const matchesProgress = progressFilter === "all" || task.progress === progressFilter;
      const matchesAssignee = assigneeFilter === "all" || task.name === assigneeFilter;

      return matchesSearch && matchesProgress && matchesAssignee;
    });
  }, [tasks, search, progressFilter, assigneeFilter, reviewOnly]);

  // Group tasks by progress
  const groupedTasks = useMemo(() => {
    const groups: Record<string, Task[]> = {
      "To-do": [],
      "In Progress": [],
      "Review": [],
      "Completed": [],
    };

    filteredTasks.forEach((task) => {
      const progress = task.progress as string;
      if (groups[progress]) {
        groups[progress].push(task);
      } else {
        groups["To-do"].push(task);
      }
    });
    return groups;
  }, [filteredTasks]);

  // Error state
  if (error) {
    return (
      <div className="py-20 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
          <ClipboardX className="h-6 w-6 text-red-600 dark:text-red-400" />
        </div>
        <h3 className="mt-4 text-lg font-semibold">Failed to load tasks</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          There was an error loading the tasks. Please try again.
        </p>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // No tasks state
  if (!tasks || tasks.length === 0) {
    return (
      <div className="py-20 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <ClipboardX className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="mt-4 text-lg font-semibold">No tasks yet</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          {permissions?.canCreateTasks
            ? "Create your first task to get started."
            : "No tasks have been assigned to you yet."}
        </p>
      </div>
    );
  }

  // No matching tasks state
  if (filteredTasks.length === 0) {
    return (
      <div className="py-20 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <ClipboardX className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="mt-4 text-lg font-semibold">No matching tasks</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          {reviewOnly 
            ? "No tasks waiting for review" 
            : "Try adjusting your search or filters."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Task Stats - only show when not in review mode */}
      {!reviewOnly && tasks.length > 0 && (
        <TaskStats tasks={tasks} />
      )}

      {/* Task Filters - only show when not in review mode */}
      {!reviewOnly && (
        <TaskFilters
          search={search}
          onSearchChange={setSearch}
          progressFilter={progressFilter}
          onProgressFilterChange={setProgressFilter}
          assigneeFilter={assigneeFilter}
          onAssigneeFilterChange={setAssigneeFilter}
          assignees={assignees}
          userRole={userRole as any}
        />
      )}

      {/* Task Groups */}
      <div className="space-y-8">
        {Object.entries(groupedTasks).map(([status, statusTasks]) => {
          if (statusTasks.length === 0) return null;

          return (
            <div key={status}>
              <div className="mb-4 flex items-center gap-2">
                <h2 className="text-lg font-semibold text-foreground">{status}</h2>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  {statusTasks.length}
                </span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {statusTasks.map((task) => {
                  const isUnderReview = task.progress === "Review" || task.progress === "Completed";
                  const canEdit = permissions?.canEditAllTasks ||
                    (permissions?.canEditOwnTasks &&
                      !isUnderReview &&
                      (task.name.toLowerCase() === userName.toLowerCase() ||
                        (user.email && task.name.toLowerCase() === user.email.toLowerCase())));
                  const canDelete = permissions?.canDeleteTasks || false;

                  return (
                    <TaskCard
                      key={task.id}
                      task={task}
                      canEdit={canEdit || false}
                      canDelete={canDelete}
                      onDelete={() => mutate()}
                      autoExpand={highlightedTaskId === task.id}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}