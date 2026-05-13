// app/tasks/page.tsx
import TasksPageClient from "@/components/tasks/tasks-page-client"
import { Suspense } from "react";

export default function TasksPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-12">Loading...</div>}>
      <TasksPageClient />
    </Suspense>
  );
}