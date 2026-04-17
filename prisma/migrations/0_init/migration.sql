-- CreateTable
CREATE TABLE "TestSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL DEFAULT 'Тестирование 1С',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "TestItem" (
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

-- CreateIndex
CREATE INDEX "TestItem_sessionId_idx" ON "TestItem"("sessionId");

-- CreateIndex
CREATE INDEX "TestItem_sessionId_orderNum_idx" ON "TestItem"("sessionId", "orderNum");
