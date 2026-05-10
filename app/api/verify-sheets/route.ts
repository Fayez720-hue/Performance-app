import { NextResponse } from "next/server"
import { verifySpreadsheetAccess } from "@/lib/db-queries"

export async function GET() {
  try {
    console.log("Environment check:")
    console.log("GOOGLE_SHEETS_SPREADSHEET_ID:", process.env.GOOGLE_SHEETS_SPREADSHEET_ID)
    console.log("GOOGLE_SHEETS_CLIENT_EMAIL length:", process.env.GOOGLE_SHEETS_CLIENT_EMAIL?.length)
    console.log("GOOGLE_SHEETS_PRIVATE_KEY length:", process.env.GOOGLE_SHEETS_PRIVATE_KEY?.length)

    const result = await verifySpreadsheetAccess()
    console.log("Verification result:", result)
    return NextResponse.json(result)
  } catch (error) {
    console.error("Spreadsheet verification error:", error)
    return NextResponse.json(
      {
        valid: false,
        sheets: [],
        error: error instanceof Error ? error.message : String(error),
        env: {
          spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
          clientEmailLength: process.env.GOOGLE_SHEETS_CLIENT_EMAIL?.length,
          privateKeyLength: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.length
        }
      },
      { status: 500 }
    )
  }
}