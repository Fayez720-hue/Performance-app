"use client";

import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";

export default function EditTaskPage() {
  const searchParams = useSearchParams();
  const taskId = searchParams.get("id");
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-2xl font-bold mb-4">Edit Task</h1>
      {taskId ? (
        <>
          <p>Task ID: {taskId}</p>
          <p>User: {session?.user?.name || "Guest"}</p>
          <div className="mt-4">
            <a href="/tasks" className="text-blue-500 hover:underline">Back to Tasks</a>
          </div>
        </>
      ) : (
        <p>No task selected. <a href="/tasks" className="text-blue-500 hover:underline">Go back to Tasks</a></p>
      )}
    </div>
  );
}
