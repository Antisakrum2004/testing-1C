import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const items = await db.testItem.findMany({
      where: { sessionId: id },
    });

    let matched = 0;
    let bugs = 0;
    let totalTime = 0;

    const byPriority: Record<string, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    };

    const byStatus: Record<string, number> = {
      new: 0,
      in_progress: 0,
      review: 0,
      accepted: 0,
      rejected: 0,
    };

    const byAssignee: Record<string, { total: number; matched: number; bugs: number; totalTime: number }> = {};

    for (const item of items) {
      if (item.isMatched) matched++;
      if (item.bugOrRemark.length > 0) bugs++;
      totalTime += item.timeSpent;

      byPriority[item.priority] = (byPriority[item.priority] || 0) + 1;
      byStatus[item.status] = (byStatus[item.status] || 0) + 1;

      const assignee = item.assignee || "Не назначен";
      if (!byAssignee[assignee]) {
        byAssignee[assignee] = { total: 0, matched: 0, bugs: 0, totalTime: 0 };
      }
      byAssignee[assignee].total++;
      if (item.isMatched) byAssignee[assignee].matched++;
      if (item.bugOrRemark.length > 0) byAssignee[assignee].bugs++;
      byAssignee[assignee].totalTime += item.timeSpent;
    }

    return NextResponse.json({
      total: items.length,
      matched,
      bugs,
      byPriority,
      byStatus,
      byAssignee,
      totalTime,
    });
  } catch (error) {
    console.error("GET /api/sessions/[id]/stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats", details: String(error) },
      { status: 500 }
    );
  }
}
