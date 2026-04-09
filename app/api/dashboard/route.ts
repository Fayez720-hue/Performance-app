import { NextResponse } from "next/server";
import { getDashboardStats } from "@/lib/google-sheets";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dashboardData = await getDashboardStats();

    // If the data is empty (user not found/error), provide a safe structure
    if (!dashboardData || dashboardData.totalEmployees === 0) {
       console.warn("No dashboard data found, returning empty state");
    }

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}