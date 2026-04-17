import { db } from "@/lib/db";

export async function setupDatabase() {
  try {
    // Test connection and ensure tables exist
    await db.$queryRaw`SELECT 1`;
    console.log("Database connected successfully");

    // Create tables if they don't exist using raw SQL
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "TestSession" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "title" TEXT NOT NULL DEFAULT 'Тестирование 1С',
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS "TestItem" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "sessionId" TEXT NOT NULL,
        "orderNum" INTEGER NOT NULL,
        "description" TEXT NOT NULL DEFAULT '',
        "expectedResult" TEXT NOT NULL DEFAULT '',
        "bugOrRemark" TEXT NOT NULL DEFAULT '',
        "isMatched" BOOLEAN NOT NULL DEFAULT false,
        "screenshot" TEXT NOT NULL DEFAULT '',
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "TestItem_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "TestSession"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );

      CREATE INDEX IF NOT EXISTS "TestItem_sessionId_idx" ON "TestItem"("sessionId");
      CREATE INDEX IF NOT EXISTS "TestItem_sessionId_orderNum_idx" ON "TestItem"("sessionId", "orderNum");
    `);

    console.log("Tables ensured");
  } catch (error) {
    console.error("Database setup failed:", error);
    throw error;
  }
}
