"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { MANUAL_STAT_KEYS, type ManualStatKey, type ManualStats } from "@/lib/liveStats";
import { withSuccess } from "@/lib/toast";

const LABELS: Record<ManualStatKey, string> = {
  aiServiceCount: "智能服務人次",
  aiRecognitionRate: "智能識別率",
  aiSatisfaction: "智能滿意度",
  aiTransferRate: "智能轉接率",
  agentServiceCount: "客服服務人次",
  agentSatisfaction: "客服滿意度",
  ticketCount: "工單數",
  aiTopIssueCategory: "智能問題分類 TOP1",
  agentTopIssueCategory: "人工問題分類 TOP1",
};

const RATE_KEYS: ManualStatKey[] = ["aiRecognitionRate", "aiSatisfaction", "aiTransferRate", "agentSatisfaction"];
const TEXT_KEYS: ManualStatKey[] = ["aiTopIssueCategory", "agentTopIssueCategory"];

function refresh(companyId: string) {
  revalidatePath(`/admin/companies/${companyId}`);
  revalidatePath(`/admin/companies/${companyId}/stats`);
  revalidatePath("/admin/companies");
  revalidatePath("/tv");
}

/** 儲存手動輸入的使用數據：欄位留白＝沿用系統資料（示意或 API），不是 0。 */
export async function updateManualStatsAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const companyId = String(formData.get("companyId") ?? "");
  const back = `/admin/companies/${companyId}/stats`;

  if (formData.get("clearAll") === "1") {
    await prisma.company.update({ where: { id: companyId }, data: { manualStats: Prisma.DbNull } });
    refresh(companyId);
    redirect(withSuccess(back, "已清除手動輸入，改回使用系統資料"));
  }

  const out: ManualStats = {};
  for (const key of MANUAL_STAT_KEYS) {
    const raw = String(formData.get(key) ?? "").trim();
    if (!raw) continue;

    if (TEXT_KEYS.includes(key)) {
      out[key] = raw.slice(0, 40);
      continue;
    }

    const value = Number(raw.replaceAll(",", ""));
    const isRate = RATE_KEYS.includes(key);
    const valid = Number.isFinite(value) && value >= 0 && (isRate ? value <= 100 : Number.isInteger(value) && value <= 100_000_000);
    if (!valid) {
      redirect(`${back}?error=${encodeURIComponent(LABELS[key])}`);
    }
    out[key] = isRate ? Math.round(value * 10) / 10 : value;
  }

  await prisma.company.update({
    where: { id: companyId },
    data: { manualStats: Object.keys(out).length > 0 ? (out as Prisma.InputJsonObject) : Prisma.DbNull },
  });

  refresh(companyId);
  redirect(withSuccess(back, "已儲存使用數據"));
}
