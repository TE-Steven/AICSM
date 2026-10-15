import { prisma } from "@/lib/db";
import {
  COUNT_STAT_KEYS,
  RATE_STAT_KEYS,
  STAT_KEYS,
  TEXT_STAT_KEYS,
  addDays,
  type StatKey,
} from "@/lib/liveStats";

export { addDays };

/** 後台每日數據表每頁顯示（與儲存）的天數 */
export const GRID_DAYS = 14;

/** 台北時間的今天（YYYY-MM-DD）。 */
export function todayInTaipei(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  return parts; // en-CA 格式即為 YYYY-MM-DD
}

export function isValidDay(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(`${value}T00:00:00.000Z`).getTime());
}

export function dayToDate(day: string): Date {
  return new Date(`${day}T00:00:00.000Z`);
}

export type StatValues = Partial<Record<StatKey, number | string | null>>;

/**
 * 驗證並轉換單一欄位的值。空字串／null／undefined 視為「沒填」（回傳 null）。
 * 比率需為 0–100；人次與工單數需為 0 以上的整數；問題分類為不超過 40 字的文字。
 */
export function parseStatValue(key: StatKey, raw: unknown): { ok: true; value: number | string | null } | { ok: false } {
  if (raw === null || raw === undefined) return { ok: true, value: null };
  const text = String(raw).trim();
  if (text === "") return { ok: true, value: null };

  if (TEXT_STAT_KEYS.includes(key)) return { ok: true, value: text.slice(0, 40) };

  const value = Number(text.replaceAll(",", ""));
  if (!Number.isFinite(value) || value < 0) return { ok: false };
  if (RATE_STAT_KEYS.includes(key)) {
    return value <= 100 ? { ok: true, value: Math.round(value * 10) / 10 } : { ok: false };
  }
  if (COUNT_STAT_KEYS.includes(key)) {
    return Number.isInteger(value) && value <= 100_000_000 ? { ok: true, value } : { ok: false };
  }
  return { ok: false };
}

/**
 * 寫入（新增或更新）某家公司某一天的數據。
 * 只更新 values 裡有出現的欄位；值為 null 代表把該欄位清空，沒出現的欄位保持原樣。
 */
export async function upsertDailyStat(
  companyId: string,
  day: string,
  values: StatValues,
  source: "manual" | "api"
): Promise<void> {
  const data: Record<string, number | string | null> = {};
  for (const key of STAT_KEYS) {
    if (key in values) data[key] = values[key] ?? null;
  }
  await prisma.companyDailyStat.upsert({
    where: { companyId_date: { companyId, date: dayToDate(day) } },
    create: { companyId, date: dayToDate(day), source, ...data },
    update: { source, ...data },
  });
}
