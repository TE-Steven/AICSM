import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isValidDay, parseStatValue, upsertDailyStat, type StatValues } from "@/lib/dailyStats";
import { STAT_KEYS, STAT_LABELS } from "@/lib/liveStats";

export const dynamic = "force-dynamic";

const MAX_RECORDS = 500;

function tokenMatches(header: string, token: string): boolean {
  const expected = Buffer.from(`Bearer ${token}`);
  const actual = Buffer.from(header);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/**
 * 外部系統每天寫入使用數據。
 * 認證：Authorization: Bearer <AICSM_API_TOKEN>（環境變數）。
 * 內容：單筆 { company, date, ...欄位 }，或 { records: [ ... ] }。
 * 只更新有帶的欄位；company 可為系統代碼或「客服系統企業代碼」(externalId)。
 */
export async function POST(request: Request) {
  const token = process.env.AICSM_API_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "伺服器尚未設定 AICSM_API_TOKEN，API 未啟用" }, { status: 503 });
  }
  if (!tokenMatches(request.headers.get("authorization") ?? "", token)) {
    return NextResponse.json({ error: "認證失敗" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "內容不是有效的 JSON" }, { status: 400 });
  }

  const input = body as { records?: unknown };
  const records: unknown[] = Array.isArray(input?.records) ? input.records : [body];
  if (records.length === 0 || records.length > MAX_RECORDS) {
    return NextResponse.json({ error: `一次請送 1–${MAX_RECORDS} 筆` }, { status: 400 });
  }

  let saved = 0;
  const errors: { index: number; message: string }[] = [];

  for (let index = 0; index < records.length; index++) {
    const record = records[index] as Record<string, unknown> | null;
    if (!record || typeof record !== "object") {
      errors.push({ index, message: "不是物件" });
      continue;
    }

    const companyRef = String(record.company ?? "").trim();
    const day = String(record.date ?? "").trim();
    if (!companyRef) {
      errors.push({ index, message: "缺少 company" });
      continue;
    }
    if (!isValidDay(day)) {
      errors.push({ index, message: "date 需為 YYYY-MM-DD" });
      continue;
    }

    const company = await prisma.company.findFirst({
      where: { OR: [{ id: companyRef }, { externalId: companyRef }] },
      select: { id: true },
    });
    if (!company) {
      errors.push({ index, message: `找不到公司「${companyRef}」` });
      continue;
    }

    const values: StatValues = {};
    let failed: string | null = null;
    for (const key of STAT_KEYS) {
      if (!(key in record)) continue;
      const parsed = parseStatValue(key, record[key]);
      if (!parsed.ok) {
        failed = `${STAT_LABELS[key]}（${key}）的值不正確`;
        break;
      }
      values[key] = parsed.value;
    }
    if (failed) {
      errors.push({ index, message: failed });
      continue;
    }
    if (Object.keys(values).length === 0) {
      errors.push({ index, message: "沒有帶任何數據欄位" });
      continue;
    }

    await upsertDailyStat(company.id, day, values, "api");
    saved += 1;
  }

  return NextResponse.json({ saved, errors }, { status: errors.length > 0 && saved === 0 ? 422 : 200 });
}
