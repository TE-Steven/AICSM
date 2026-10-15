"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import {
  GRID_DAYS,
  addDays,
  dayToDate,
  isValidDay,
  parseStatValue,
  upsertDailyStat,
  type StatValues,
} from "@/lib/dailyStats";
import { STAT_KEYS, STAT_LABELS } from "@/lib/liveStats";
import { withSuccess } from "@/lib/toast";

function refresh(companyId: string) {
  revalidatePath(`/admin/companies/${companyId}`);
  revalidatePath(`/admin/companies/${companyId}/stats`);
  revalidatePath("/admin/companies");
  revalidatePath("/tv");
}

/**
 * 儲存一整頁（14 天）的每日數據。
 * - 整列都留白：刪除該天的紀錄。
 * - 有填任何欄位：該天寫入／更新，留白的欄位視為當天沒有資料（電視牆會往前找最新一天有填的值）。
 */
export async function saveDailyStatsAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const companyId = String(formData.get("companyId") ?? "");
  const end = String(formData.get("end") ?? "");
  if (!isValidDay(end)) redirect(`/admin/companies/${companyId}/stats`);
  const back = `/admin/companies/${companyId}/stats?end=${end}`;

  const parsed: { day: string; values: StatValues; blank: boolean }[] = [];
  for (let i = 0; i < GRID_DAYS; i++) {
    const day = addDays(end, -i);
    const values: StatValues = {};
    let blank = true;
    for (const key of STAT_KEYS) {
      const result = parseStatValue(key, formData.get(`${day}__${key}`));
      if (!result.ok) {
        redirect(`${back}&error=${encodeURIComponent(`${day} ${STAT_LABELS[key]}`)}`);
      }
      values[key] = result.value;
      if (result.value !== null) blank = false;
    }
    parsed.push({ day, values, blank });
  }

  for (const row of parsed) {
    if (row.blank) {
      await prisma.companyDailyStat.deleteMany({ where: { companyId, date: dayToDate(row.day) } });
    } else {
      await upsertDailyStat(companyId, row.day, row.values, "manual");
    }
  }

  refresh(companyId);
  redirect(withSuccess(back, "已儲存每日使用數據"));
}
