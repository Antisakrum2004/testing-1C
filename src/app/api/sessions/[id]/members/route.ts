import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const members = await db.sessionMember.findMany({
      where: { sessionId: id },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(members);
  } catch (error) {
    console.error("GET /api/sessions/[id]/members error:", error);
    return NextResponse.json(
      { error: "Failed to fetch members", details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const member = await db.sessionMember.create({
      data: {
        sessionId: id,
        name: body.name,
        color: body.color || "#10b981",
      },
    });

    return NextResponse.json(member);
  } catch (error) {
    console.error("POST /api/sessions/[id]/members error:", error);
    return NextResponse.json(
      { error: "Failed to add member", details: String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const member = await db.sessionMember.deleteMany({
      where: { sessionId: id, name: body.name },
    });

    return NextResponse.json({ deletedCount: member.count });
  } catch (error) {
    console.error("DELETE /api/sessions/[id]/members error:", error);
    return NextResponse.json(
      { error: "Failed to remove member", details: String(error) },
      { status: 500 }
    );
  }
}
