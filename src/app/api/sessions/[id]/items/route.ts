import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Get max orderNum for this session
    const maxItem = await db.testItem.findFirst({
      where: { sessionId: id },
      orderBy: { orderNum: "desc" },
      select: { orderNum: true },
    });
    const nextOrder = (maxItem?.orderNum ?? 0) + 1;

    const item = await db.testItem.create({
      data: {
        sessionId: id,
        orderNum: nextOrder,
        description: body.description || "",
        expectedResult: body.expectedResult || "",
        bugOrRemark: body.bugOrRemark || "",
        isMatched: body.isMatched || false,
        screenshot: body.screenshot || "",
      },
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error("POST /api/sessions/[id]/items error:", error);
    return NextResponse.json(
      { error: "Failed to create item", details: String(error) },
      { status: 500 }
    );
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const items = await db.testItem.findMany({
      where: { sessionId: id },
      orderBy: { orderNum: "asc" },
    });
    return NextResponse.json(items);
  } catch (error) {
    console.error("GET /api/sessions/[id]/items error:", error);
    return NextResponse.json(
      { error: "Failed to fetch items", details: String(error) },
      { status: 500 }
    );
  }
}
