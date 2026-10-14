import "dotenv/config";
import { defineConfig } from "prisma/config";

// AICSM 使用獨立的 Postgres schema（aicsm），migration 紀錄表也放在這個 schema 裡，
// 不會跟同一個資料庫內其他專案的 _prisma_migrations 互相干擾。
function databaseUrl(): string | undefined {
  const raw = process.env["DATABASE_URL"];
  if (!raw) return raw;
  const url = new URL(raw);
  url.searchParams.set("schema", "aicsm");
  return url.toString();
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: databaseUrl(),
  },
});
