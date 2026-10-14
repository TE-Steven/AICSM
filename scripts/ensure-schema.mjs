// 確保 AICSM 專用的 Postgres schema 存在（在 build 階段執行，早於 prisma migrate deploy）。
// 失敗時只印警告、不中斷 build：沒有資料庫連線的環境（例如本機純編譯）也能正常 build。
import pg from "pg";

const SCHEMA = "aicsm";
const url = process.env.DATABASE_URL;

if (!url) {
  console.log("[ensure-schema] 沒有 DATABASE_URL，略過。");
  process.exit(0);
}

const client = new pg.Client({ connectionString: url, connectionTimeoutMillis: 10000 });

try {
  await client.connect();
  await client.query(`CREATE SCHEMA IF NOT EXISTS "${SCHEMA}"`);
  console.log(`[ensure-schema] schema "${SCHEMA}" 已就緒。`);
} catch (error) {
  console.warn(`[ensure-schema] 無法確認 schema（略過）：${error.message}`);
} finally {
  await client.end().catch(() => {});
}
