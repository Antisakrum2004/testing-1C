import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { itemId } = await params;
    const comments = await db.testComment.findMany({
      where: { itemId },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(comments);
  } catch (error) {
    console.error("GET /api/sessions/[id]/items/[itemId]/comments error:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments", details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { itemId } = await params;
    const body = await request.json();

    const comment = await db.testComment.create({
      data: {
        itemId,
        author: body.author,
        text: body.text,
      },
    });

    return NextResponse.json(comment);
  } catch (error) {
    console.error("POST /api/sessions/[id]/items/[itemId]/comments error:", error);
    return NextResponse.json(
      { error: "Failed to add comment", details: String(error) },
      { status: 500 }
    );
  }
}
