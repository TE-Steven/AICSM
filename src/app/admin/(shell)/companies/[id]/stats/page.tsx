import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { GRID_DAYS, addDays, dayToDate, isValidDay, todayInTaipei } from "@/lib/dailyStats";
import { STAT_LABELS, type StatKey } from "@/lib/liveStats";
import { SuccessToast } from "@/components/Toast";
import { Card, CardHeader } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";
import { btn } from "@/components/ui/button";
import { IconAlertTriangle } from "@/components/icons";
import { saveDailyStatsAction } from "./actions";

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

const COLUMNS: { key: StatKey; head: string; width: string; unit?: string; text?: boolean }[] = [
  { key: "aiServiceCount", head: "智能服務人次", width: "w-24" },
  { key: "aiRecognitionRate", head: "智能識別率 %", width: "w-20" },
  { key: "aiSatisfaction", head: "智能滿意度 %", width: "w-20" },
  { key: "aiTransferRate", head: "智能轉接率 %", width: "w-20" },
  { key: "agentServiceCount", head: "客服服務人次", width: "w-24" },
  { key: "agentSatisfaction", head: "客服滿意度 %", width: "w-20" },
  { key: "ticketCount", head: "工單數", width: "w-20" },
  { key: "aiTopIssueCategory", head: "智能問題分類 TOP1", width: "w-36", text: true },
  { key: "agentTopIssueCategory", head: "人工問題分類 TOP1", width: "w-36", text: true },
];

export default async function CompanyStatsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ end?: string; error?: string; success?: string }>;
}) {
  const { id } = await params;
  const { end: endParam, error, success } = await searchParams;

  const company = await prisma.company.findUnique({ where: { id } });
  if (!company) notFound();

  const today = todayInTaipei();
  const end = endParam && isValidDay(endParam) && endParam <= today ? endParam : today;
  const days = Array.from({ length: GRID_DAYS }, (_, i) => addDays(end, -i));
  const start = days[days.length - 1];

  const records = await prisma.companyDailyStat.findMany({
    where: { companyId: id, date: { gte: dayToDate(start), lte: dayToDate(end) } },
  });
  const byDay = new Map(records.map((r) => [r.date.toISOString().slice(0, 10), r]));
  const filledDays = records.length;

  const prevEnd = addDays(end, -GRID_DAYS);
  const nextEnd = addDays(end, GRID_DAYS) > today ? today : addDays(end, GRID_DAYS);
  const base = `/admin/companies/${id}/stats`;

  return (
    <div className="space-y-5">
      <SuccessToast message={success ?? null} />

      {error && (
        <p className="flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2.5 text-sm text-rose-600 ring-1 ring-inset ring-rose-100">
          <IconAlertTriangle className="h-4 w-4 shrink-0" />
          「{error}」的數值不正確：比率請填 0–100，人次與工單數請填 0 以上的整數。整頁尚未儲存，請修正後再按儲存。
        </p>
      )}

      <Card>
        <CardHeader
          title="每日使用數據"
          description="每天一列。電視牆每個欄位顯示「最新一天有填的值」，並與 7 天前同一天比較（較上週 ▲▼）。留白＝當天沒有這項資料；整列留白會刪除那一天。也可以由外部系統透過 API 每天寫入（見下方說明）。"
          action={
            <div className="flex items-center gap-2">
              <Link href={`${base}?end=${prevEnd}`} className={btn("secondary", "sm")}>
                ← 更早 {GRID_DAYS} 天
              </Link>
              {end !== today && (
                <>
                  <Link href={`${base}?end=${nextEnd}`} className={btn("secondary", "sm")}>
                    更近 {GRID_DAYS} 天 →
                  </Link>
                  <Link href={base} className={btn("ghost", "sm")}>
                    回到今天
                  </Link>
                </>
              )}
            </div>
          }
        />

        <form action={saveDailyStatsAction}>
          <input type="hidden" name="companyId" value={company.id} />
          <input type="hidden" name="end" value={end} />

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1180px] text-sm">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-500">
                <tr>
                  <th className="px-4 py-2.5 text-left">日期</th>
                  {COLUMNS.map((c) => (
                    <th key={c.key} className="px-1.5 py-2.5 text-left">
                      {c.head}
                    </th>
                  ))}
                  <th className="px-3 py-2.5 text-left">來源</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {days.map((day) => {
                  const record = byDay.get(day);
                  const weekday = WEEKDAYS[new Date(`${day}T00:00:00Z`).getUTCDay()];
                  return (
                    <tr key={day} className={day === today ? "bg-sky-50/60" : undefined}>
                      <td className="whitespace-nowrap px-4 py-1.5 font-medium text-slate-700">
                        {day}
                        <span className="ml-1.5 text-xs text-slate-400">週{weekday}</span>
                        {day === today && <span className="ml-1.5 text-xs font-semibold text-sky-600">今天</span>}
                      </td>
                      {COLUMNS.map((c) => (
                        <td key={c.key} className="px-1.5 py-1.5">
                          <input
                            name={`${day}__${c.key}`}
                            defaultValue={record?.[c.key] ?? ""}
                            aria-label={`${day} ${STAT_LABELS[c.key]}`}
                            inputMode={c.text ? "text" : "decimal"}
                            maxLength={c.text ? 40 : 12}
                            className={`${c.width} rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100`}
                          />
                        </td>
                      ))}
                      <td className="px-3 py-1.5">
                        {record ? (
                          <Pill tone={record.source === "api" ? "blue" : "slate"}>
                            {record.source === "api" ? "API" : "手動"}
                          </Pill>
                        ) : (
                          <span className="text-xs text-slate-300">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 p-5">
            <button type="submit" className={btn("primary")}>
              儲存這 {GRID_DAYS} 天
            </button>
            <span className="text-sm text-slate-500">
              這一頁（{start} ～ {end}）已有 {filledDays} 天的紀錄
            </span>
          </div>
        </form>
      </Card>

      <Card className="p-5">
        <h3 className="text-sm font-semibold text-slate-700">用 API 每天寫入數據</h3>
        <p className="mt-1 text-sm text-slate-500">
          外部系統可以每天呼叫下面的 API，把前一天的數據寫進來（同一天重複寫入會更新，只更新有帶的欄位）。
          需要在 Render 的環境變數設定 <code className="rounded bg-slate-100 px-1">AICSM_API_TOKEN</code>（自訂一組長密碼）。
        </p>
        <pre className="mt-3 overflow-x-auto rounded-lg bg-slate-900 p-4 text-xs leading-relaxed text-slate-100">{`POST /api/stats
Authorization: Bearer <AICSM_API_TOKEN>
Content-Type: application/json

{
  "company": "${company.externalId ?? company.id}",
  "date": "${today}",
  "aiServiceCount": 1788,
  "aiRecognitionRate": 89,
  "aiSatisfaction": 78,
  "aiTransferRate": 18,
  "agentServiceCount": 310,
  "agentSatisfaction": 90,
  "ticketCount": 176,
  "aiTopIssueCategory": "訂單查詢",
  "agentTopIssueCategory": "客訴處理"
}`}</pre>
        <p className="mt-2 text-xs text-slate-400">
          company 可以填這家公司的「客服系統企業代碼」（基本資料頁設定）或系統代碼；也可以用 {`{ "records": [ … ] }`} 一次送多筆。
        </p>
      </Card>
    </div>
  );
}
