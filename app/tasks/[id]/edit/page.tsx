import EditTaskPageClient from "@/components/tasks/edit-task-page-client"

export default function EditTaskPage({ params }: { params: { id: string } }) {
  return <EditTaskPageClient id={params.id} />
}
