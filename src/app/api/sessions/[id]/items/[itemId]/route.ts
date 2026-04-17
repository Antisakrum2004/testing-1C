import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { itemId } = await params;
    const body = await request.json();

    const item = await db.testItem.update({
      where: { id: itemId },
      data: {
        ...(body.description !== undefined && { description: body.description }),
        ...(body.expectedResult !== undefined && { expectedResult: body.expectedResult }),
        ...(body.bugOrRemark !== undefined && { bugOrRemark: body.bugOrRemark }),
        ...(body.isMatched !== undefined && { isMatched: body.isMatched }),
        ...(body.screenshot !== undefined && { screenshot: body.screenshot }),
        ...(body.orderNum !== undefined && { orderNum: body.orderNum }),
      },
    });

    return NextResponse.json(item);
  } catch {
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id, itemId } = await params;
    const item = await db.testItem.delete({ where: { id: itemId } });

    // Reorder remaining items
    const remaining = await db.testItem.findMany({
      where: { sessionId: id },
      orderBy: { orderNum: "asc" },
    });
    for (let i = 0; i < remaining.length; i++) {
      await db.testItem.update({
        where: { id: remaining[i].id },
        data: { orderNum: i + 1 },
      });
    }

    return NextResponse.json(item);
  } catch {
    return NextResponse.json({ error: "Failed to delete item" }, { status: 500 });
  }
}
