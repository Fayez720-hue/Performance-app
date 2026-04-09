import { NextResponse } from "next/server";
import { getDashboardStats } from "@/lib/google-sheets";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user info to check role
    const { getUserByEmail } = await import("@/lib/google-sheets");
    const user = await getUserByEmail(session.user.email) || {
      email: session.user.email,
      name: session.user.name || "Guest",
      role: "Admin" // Default for first login
    };

    const dashboardData = await getDashboardStats();

    // If Team Member, filter data to only show THEIR stats
    if (user.role === "Team Member") {
      const personalStats = dashboardData.employees.find(
        (emp: any) => emp.name.toLowerCase() === user.name.toLowerCase()
      );

      if (personalStats) {
        return NextResponse.json({
          ...dashboardData,
          totalEmployees: 1,
          avgScore: personalStats.overallScore,
          completionRate: Math.round((personalStats.completed / (personalStats.tasks || 1)) * 100),
          avgShiftAdherence: personalStats.shiftAdherence,
          totalEdits: personalStats.edits,
          topPerformer: user.name,
          topPerformerScore: personalStats.overallScore,
          employees: [personalStats], // Only themselves
          isPersonalView: true
        });
      }
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