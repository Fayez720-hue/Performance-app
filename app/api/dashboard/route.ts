export const dynamic = "force-dynamic"
export const runtime = "edge"


import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user info to check role
    const { getUserByEmail } = await import("@/lib/google-sheets");
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
