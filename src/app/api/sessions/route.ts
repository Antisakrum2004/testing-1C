import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const session = await db.testSession.create({
      data: {
        title: body.title || "Тестирование 1С",
      },
    });
    return NextResponse.json(session);
  } catch (error) {
    console.error("POST /api/sessions error:", error);
    return NextResponse.json(
      { error: "Failed to create session", details: String(error) },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const sessions = await db.testSession.findMany({
      orderBy: { updatedAt: "desc" },
      include: { _count: { select: { items: true } } },
    });
    return NextResponse.json(sessions);
  } catch (error) {
    console.error("GET /api/sessions error:", error);
    return NextResponse.json(
      { error: "Failed to fetch sessions", details: String(error) },
      { status: 500 }
    );
  }
}
