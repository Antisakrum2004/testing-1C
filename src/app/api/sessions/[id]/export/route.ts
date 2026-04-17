import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

const PRIORITY_LABELS: Record<string, string> = {
  critical: "Критический",
  high: "Высокий",
  medium: "Средний",
  low: "Низкий",
};

const STATUS_LABELS: Record<string, string> = {
  new: "Новый",
  in_progress: "В работе",
  review: "Проверяется",
  accepted: "Принят",
  rejected: "Отклонён",
};

function escapeCSV(value: string): string {
  if (value.includes(";") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await db.testSession.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: { orderNum: "asc" },
        },
      },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const headers = [
      "№",
      "Что тестируем",
      "Ожидаемый результат",
      "Баг/замечание",
      "Приоритет",
      "Статус",
      "Исполнитель",
      "Время(мин)",
      "Совпадает",
      "Ссылка",
    ];

    const rows: string[] = [];
    rows.push(headers.join(";"));

    let totalMatched = 0;
    let totalBugs = 0;
    let totalMinutes = 0;

    for (const item of session.items) {
      const row = [
        String(item.orderNum),
        escapeCSV(item.description),
        escapeCSV(item.expectedResult),
        escapeCSV(item.bugOrRemark),
        PRIORITY_LABELS[item.priority] || item.priority,
        STATUS_LABELS[item.status] || item.status,
        escapeCSV(item.assignee),
        String(item.timeSpent),
        item.isMatched ? "Да" : "Нет",
        escapeCSV(item.screenshot),
      ];
      rows.push(row.join(";"));

      if (item.isMatched) totalMatched++;
      if (item.bugOrRemark.length > 0) totalBugs++;
      totalMinutes += item.timeSpent;
    }

    // Summary row
    const summaryRow = [
      "",
      `Итого: ${session.items.length} тестов`,
      "",
      totalBugs > 0 ? `${totalBugs} багов` : "",
      "",
      "",
      "",
      `${totalMinutes} мин`,
      `${totalMatched} из ${session.items.length}`,
      "",
    ];
    rows.push(summaryRow.join(";"));

    const csvContent = "\uFEFF" + rows.join("\n");
    const safeTitle = session.title.replace(/[^a-zA-Zа-яА-Я0-9_\- ]/g, "").replace(/\s+/g, "_");

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8-sig",
        "Content-Disposition": `attachment; filename="test-report-${safeTitle}.csv"`,
      },
    });
  } catch (error) {
    console.error("GET /api/sessions/[id]/export error:", error);
    return NextResponse.json(
      { error: "Failed to export session", details: String(error) },
      { status: 500 }
    );
  }
}
