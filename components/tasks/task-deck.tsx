"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import useSWR from "swr";
import { ClipboardX, Loader2 } from "lucide-react";
import { TaskCard } from "./task-card";
import { TaskFilters } from "./task-filters";
import { TaskStats } from "./task-stats";
import type { User } from "@/types/user";
import { fetcher } from "@/lib/api";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyMedia,
} from "@/components/ui/empty";
import type { Task, TaskProgress } from "@/types/task";
import type { UserRole } from "@/types/user";
import { ROLE_PERMISSIONS } from "@/types/user";

interface TaskDeckProps {
  user: User;
  projectId?: number;
  reviewOnly?: boolean;  // Add this prop
}

export function TaskDeck({ user, projectId, reviewOnly = false }: TaskDeckProps) {
  const userRole = user.role || "Team Member";
  const userName = user.name || "Guest";

  const { data: tasks, error, isLoading, mutate } = useSWR<Task[]>(
    projectId ? `/api/projects/${projectId}` : "/api/tasks",
    async (url: string) => {
      const res = await fetch(url);
      const data = await res.json();
      return projectId ? data.tasks : data;
    },
    { refreshInterval: 30000 }
  );

  const { data: users } = useSWR<User[]>("/api/users", fetcher);

  const [search, setSearch] = useState("");
  const [progressFilter, setProgressFilter] = useState<TaskProgress | "all">("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [highlightedTaskId, setHighlightedTaskId] = useState<number | null>(null);

  const searchParams = useSearchParams();

  // Handle auto-opening from notifications
  useEffect(() => {
    const taskIdParam = searchParams.get("taskId");
    const timestamp = searchParams.get("t");
    
    if (taskIdParam) {
      const id = parseInt(taskIdParam, 10);
      
      // Clear filters so the task is visible
      setSearch("");
      setProgressFilter("all");
      setAssigneeFilter("all");

      // Scroll to and highlight the task
      setTimeout(() => {
        setHighlightedTaskId(id);
        const element = document.getElementById(`task-${id}`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 300);

      // Reset highlight after delay
      setTimeout(() => {
        setHighlightedTaskId(null);
      }, 3000);

      // Clean URL
      const url = new URL(window.location.href);
      url.searchParams.delete("taskId");
      url.searchParams.delete("t");
      window.history.replaceState({}, "", url.toString());
    }
  }, [searchParams]);

  const permissions = ROLE_PERMISSIONS[userRole] || ROLE_PERMISSIONS.Viewer;

  // Unique assignees
  const assignees = useMemo(() => {
    if (Array.isArray(users) && users.length > 0) {
      return [...new Set(users.map((u) => u.name).filter(Boolean))].sort();
    }
    if (Array.isArray(tasks)) {
      return [...new Set(tasks.map((t) => t.name).filter(Boolean))].sort();
    }
    return [];
  }, [tasks, users]);

  // Filter tasks – now includes reviewOnly filter
  const filteredTasks = useMemo(() => {
    if (!Array.isArray(tasks)) return [];

    return tasks.filter((task) => {
      // Apply reviewOnly filter first (if true, only show Review tasks)
      if (reviewOnly && task.progress !== "Review") {
        return false;
      }

      const matchesSearch =
        task.task.toLowerCase().includes(search.toLowerCase()) ||
        task.name.toLowerCase().includes(search.toLowerCase());

      const matchesProgress = progressFilter === "all" || task.progress === progressFilter;
      const matchesAssignee = assigneeFilter === "all" || task.name === assigneeFilter;

      return matchesSearch && matchesProgress && matchesAssignee;
    });
  }, [tasks, search, progressFilter, assigneeFilter, projectId, reviewOnly]);

  // Group tasks by progress
  const groupedTasks = useMemo(() => {
    const groups: Record<TaskProgress, Task[]> = {
      "To-do": [],
      "In Progress": [],
      Review: [],
      Completed: [],
    };

    filteredTasks.forEach((task) => {
      const progress = task.progress as TaskProgress;
      if (groups[progress]) {
        groups[progress].push(task);
      } else {
        groups["To-do"].push(task);
      }
    });
    return groups;
  }, [filteredTasks]);

  if (error) {
    return (
      <Empty className="py-20">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ClipboardX />
          </EmptyMedia>
          <EmptyTitle>Failed to load tasks</EmptyTitle>
          <EmptyDescription>
            There was an error loading the tasks. Please try again.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Only show stats if not in reviewOnly mode */}
      {tasks && tasks.length > 0 && !reviewOnly && <TaskStats tasks={tasks} />}

      {/* Only show filters if not in reviewOnly mode */}
      {!reviewOnly && (
        <TaskFilters
          search={search}
          onSearchChange={setSearch}
          progressFilter={progressFilter}
          onProgressFilterChange={setProgressFilter}
          assigneeFilter={assigneeFilter}
          onAssigneeFilterChange={setAssigneeFilter}
          assignees={assignees}
          userRole={userRole}
        />
      )}

      {tasks && tasks.length === 0 && (
        <Empty className="py-20">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ClipboardX />
            </EmptyMedia>
            <EmptyTitle>No tasks yet</EmptyTitle>
            <EmptyDescription>
              {permissions.canCreateTasks
                ? "Create your first task to get started."
                : "No tasks have been assigned to you yet."}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      {tasks && tasks.length > 0 && filteredTasks.length === 0 && (
        <Empty className="py-20">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ClipboardX />
            </EmptyMedia>
            <EmptyTitle>No matching tasks</EmptyTitle>
            <EmptyDescription>
              {reviewOnly 
                ? "No tasks waiting for review" 
                : "Try adjusting your search or filters."}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      {filteredTasks.length > 0 && (
        <div className="space-y-8">
          {(Object.keys(groupedTasks) as TaskProgress[]).map((status) => {
            const statusTasks = groupedTasks[status];
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
                    const canEdit =
                      permissions.canEditAllTasks ||
                      (permissions.canEditOwnTasks &&
                        !isUnderReview &&
                        (task.name.toLowerCase() === userName.toLowerCase() ||
                          (user.email && task.name.toLowerCase() === user.email.toLowerCase())));
                    const canDelete = permissions.canDeleteTasks;

                    return (
                      <TaskCard
                        key={task.id}
                        task={task}
                        canEdit={canEdit}
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
      )}
    </div>
  );
}