"use client"

import { Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PROGRESS_OPTIONS, type TaskProgress } from "@/types/task"

interface TaskFiltersProps {
  search: string
  onSearchChange: (value: string) => void
  progressFilter: TaskProgress | "all"
  onProgressFilterChange: (value: TaskProgress | "all") => void
  assigneeFilter: string
  onAssigneeFilterChange: (value: string) => void
  assignees: string[]
}

export function TaskFilters({
  search,
  onSearchChange,
  progressFilter,
  onProgressFilterChange,
  assigneeFilter,
  onAssigneeFilterChange,
  assignees,
}: TaskFiltersProps) {
  const hasFilters = search || progressFilter !== "all" || assigneeFilter !== "all"

  function clearFilters() {
    onSearchChange("")
    onProgressFilterChange("all")
    onAssigneeFilterChange("all")
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search tasks..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Progress Filter */}
      <Select value={progressFilter} onValueChange={(v) => onProgressFilterChange(v as TaskProgress | "all")}>
        <SelectTrigger className="w-full sm:w-[160px]">
          <SelectValue placeholder="All Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          {PROGRESS_OPTIONS.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Assignee Filter */}
      <Select value={assigneeFilter} onValueChange={onAssigneeFilterChange}>
        <SelectTrigger className="w-full sm:w-[160px]">
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

      {/* Clear Filters */}
      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
          <X className="h-4 w-4" />
          Clear
        </Button>
      )}
    </div>
  )
}
