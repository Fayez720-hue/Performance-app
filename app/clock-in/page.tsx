"use client"

import dynamic from 'next/dynamic'

const ClockPageClient = dynamic(() => import("@/components/clock/clock-page-client"), {
  ssr: false,
})

export default function ClockInPage() {
  return <ClockPageClient />
}
