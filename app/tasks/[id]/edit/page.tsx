import EditTaskPageClient from "@/components/tasks/edit-task-page-client"

// Required for static export (APK build)
export function generateStaticParams() {
  // We export a placeholder ID.
  // In a Capacitor app, the actual data fetching happens client-side.
  return [{ id: 'static' }]
}

export default function EditTaskPage() {
  return <EditTaskPageClient />
}
