import { NextResponse } from "next/server"

// Satisfy 'output: export' for the APK build
export const dynamic = "force-static"

// Required for catch-all/dynamic routes in static export
export function generateStaticParams() {
  return [{ id: 'placeholder' }]
}

export async function GET() {
  return NextResponse.json({ static: true })
}

export async function PUT() {
  return NextResponse.json({ static: true })
}

export async function DELETE() {
  return NextResponse.json({ static: true })
}
