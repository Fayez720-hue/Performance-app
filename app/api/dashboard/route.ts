

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDashboardStats, getUserByEmail } from "@/lib/google-sheets";

// Satisfy 'output: export' for the APK build
export const dynamic = "force-static"

export async function GET() {
  // If we are building for the APK, return a dummy response
  if (process.env.STATIC_BUILD === 'true') {
    return NextResponse.json({ static: true })
  }
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user info to check role
    const foundUser = await getUserByEmail(session.user.email);

    const user = foundUser || {
      email: session.user.email,
      name: session.user.name || "Guest",
      role: "Viewer"
    };

    const dashboardData = await getDashboardStats();

    // Normalize role for comparisons
    const normalizedRole = (user.role || "Viewer").trim();

    // If Team Member, filter data to only show THEIR stats
    if (normalizedRole === "Team Member") {
      const personalStats = dashboardData.employees.find(
        (emp: any) => emp.name.toLowerCase() === user.name.toLowerCase() ||
                     emp.email?.toLowerCase() === user.email.toLowerCase()
      );

      if (personalStats) {
        return NextResponse.json({
          ...dashboardData,
          totalEmployees: 1,
          avgScore: personalStats.overallScore,
          completionRate: personalStats.tasks > 0 ? Math.round((personalStats.completed / personalStats.tasks) * 100) : 0,
          avgShiftAdherence: personalStats.shiftAdherence,
          totalEdits: personalStats.edits,
          topPerformer: user.name,
          topPerformerScore: personalStats.overallScore,
          employees: [personalStats], // Only themselves
          isPersonalView: true,
          userRole: user.role
        });
      }

      return NextResponse.json({
        ...dashboardData,
        totalEmployees: 0,
        avgScore: 0,
        completionRate: 0,
        avgShiftAdherence: 0,
        totalEdits: 0,
        topPerformer: "N/A",
        topPerformerScore: 0,
        employees: [],
        isPersonalView: true,
        userRole: user.role
      });
    }

    return NextResponse.json({
      ...dashboardData,
      userRole: user.role
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
