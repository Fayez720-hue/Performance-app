import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Return your Google Sheets data here
    const dashboardData = {
      totalEmployees: 7,
      avgScore: 85.1,
      completionRate: 85.3,
      avgShiftAdherence: 83.9,
      totalEdits: 26,
      topPerformer: "Amira Sobhy",
      topPerformerScore: 99.8,
      scoreDistribution: [
        { range: "0-20%", count: 0 }, { range: "21-40%", count: 0 },
        { range: "41-60%", count: 0 }, { range: "61-80%", count: 3 },
        { range: "81-100%", count: 4 },
      ],
      shiftTrend: [
        { week: "Week 1", adherence: 82 }, { week: "Week 2", adherence: 84 },
        { week: "Week 3", adherence: 83 }, { week: "Week 4", adherence: 86 },
      ],
      taskCompletion: [
        { name: "Content Creation", completion: 92 }, { name: "Media Buying", completion: 88 },
        { name: "Video Editing", completion: 76 }, { name: "Graphic Design", completion: 94 },
        { name: "Data Analysis", completion: 71 },
      ],
      performanceData: [
        { score: 99.8, adherence: 92.4, size: 300 }, { score: 88.5, adherence: 87.1, size: 280 },
        { score: 68.2, adherence: 74.5, size: 250 }, { score: 94.3, adherence: 88, size: 290 },
        { score: 71, adherence: 69.3, size: 260 }, { score: 77.5, adherence: 81, size: 270 },
        { score: 96.2, adherence: 94.8, size: 310 },
      ],
      employees: [
        { name: "Amira Sobhy", title: "Content Creator", tasks: 5, completed: 5, overallScore: 99.8, shiftAdherence: 92.4, edits: 2, performance: "Excellent" },
        { name: "Mohamed Abdel Sattar", title: "Media Buyer", tasks: 4, completed: 4, overallScore: 88.5, shiftAdherence: 87.1, edits: 3, performance: "Excellent" },
        { name: "Obada Hisham", title: "Videographer", tasks: 6, completed: 4, overallScore: 68.2, shiftAdherence: 74.5, edits: 8, performance: "Good" },
        { name: "Haneen Abdel Fattah", title: "Graphic Designer", tasks: 3, completed: 3, overallScore: 94.3, shiftAdherence: 88, edits: 1, performance: "Excellent" },
        { name: "Youssef Gamal", title: "Data Analyst", tasks: 7, completed: 5, overallScore: 71, shiftAdherence: 69.3, edits: 9, performance: "Good" },
        { name: "Salma Hisham", title: "Content Creator", tasks: 4, completed: 3, overallScore: 77.5, shiftAdherence: 81, edits: 2, performance: "Good" },
        { name: "Karim Walid", title: "Media Buyer", tasks: 5, completed: 5, overallScore: 96.2, shiftAdherence: 94.8, edits: 1, performance: "Excellent" },
      ],
    };

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 });
  }
}