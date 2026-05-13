"use client"

import { useSession } from '@/components/providers/session-provider'
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useEffect, useState } from "react"
import { Loader2 } from "lucide-react"

function TasksPageContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const filter = searchParams?.get('filter')
  const statusFilter = searchParams?.get('status')
  
  const isReviewFilter = filter === 'review' || statusFilter === 'REVIEW'

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login")
    }
  }, [status, router])

  if (status === "loading") {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col p-8">
      <h1 className="text-3xl font-bold">
        {isReviewFilter ? 'Review Tasks' : 'Tasks'}
      </h1>
      <p className="text-muted-foreground mt-2">
        Filter: {filter || 'none'} | Status: {statusFilter || 'none'}
      </p>
      <p className="mt-4 text-green-600">
        If you can see this, the tasks page loads correctly.
      </p>
      <p className="mt-2">
        Session status: {status}
      </p>
    </div>
  )
}

export default function TasksPageClient() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TasksPageContent />
    </Suspense>
  )
}