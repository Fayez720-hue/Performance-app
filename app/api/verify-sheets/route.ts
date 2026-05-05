import { NextResponse } from "next/server"
import { verifySpreadsheetAccess } from "@/lib/google-sheets"

export async function GET() {
  try {
    const result = await verifySpreadsheetAccess()
    return NextResponse.json(result)
  } catch (error) {
    console.error("Spreadsheet verification error:", error)
    return NextResponse.json(
      {
        valid: false,
        sheets: [],
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}