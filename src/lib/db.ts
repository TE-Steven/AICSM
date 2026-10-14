import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { AICSM_SCHEMA } from "@/lib/dbSchema";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  // 故意不在這裡對缺少 DATABASE_URL 拋錯：Next.js build 階段會匯入這個模組來
  // 收集所有路由（含動態渲染的路由）的設定，若在此拋錯會讓整個 build 失敗，
  // 即使該路由其實不需要在 build 時連資料庫。真正連線失敗時，Prisma 會在
  // 實際查詢當下才報錯，錯誤仍然清楚可追蹤。
  // AICSM 使用獨立的 Postgres schema，與同一個資料庫裡其他專案的資料表、migration 紀錄完全隔離。
  const adapter = new PrismaPg(
    { connectionString: process.env.DATABASE_URL ?? "" },
    { schema: AICSM_SCHEMA }
  );
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
