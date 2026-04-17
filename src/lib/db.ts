import { PrismaClient } from "@prisma/client";
import { neon } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (databaseUrl && databaseUrl.startsWith("postgres")) {
    // Use Neon serverless adapter for PostgreSQL (Vercel)
    const sql = neon(databaseUrl);
    const adapter = new PrismaNeon(sql);
    return new PrismaClient({ adapter });
  }
  
  // Fallback for local SQLite development
  return new PrismaClient();
}

export const db =
  globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
