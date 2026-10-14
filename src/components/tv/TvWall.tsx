"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { CompanyOverview } from "@/lib/company";
import { HEALTH_BAND_LABEL, type HealthBand } from "@/lib/health";
import { liveStatFields, type LiveStatField } from "@/lib/liveStats";
import { LiveClock } from "@/components/LiveClock";
import { Logo } from "@/components/Logo";
import { healthBarClass } from "@/components/ui/HealthBar";
import { HealthScore } from "@/components/ui/HealthScore";
import {
  IconAlertTriangle,
  IconCheckCircle,
  IconClipboard,
  IconPackage,
  IconShieldCheck,
  IconTag,
  IconUsers,
} from "@/components/icons";

/** 每家公司在電視牆停留的時間（毫秒）。 */
const SLIDE_MS = 15000;
/** 自動重新抓取最新資料的間隔（毫秒）。 */
const REFRESH_MS = 5 * 60 * 1000;

const CARD = "rounded-2xl bg-white shadow-[0_1px_3px_rgba(15,23,42,0.08)]";

const BAND_PILL: Record<HealthBand, string> = {
  healthy: "bg-emerald-400/20 text-emerald-300",
  atRisk: "bg-amber-400/20 text-amber-300",
  critical: "bg-rose-400/20 text-rose-300",
  none: "bg-slate-400/20 text-slate-300",
};

const STAT_ICON: Record<string, { icon: typeof IconUsers; tint: string }> = {
  aiServiceCount: { icon: IconUsers, tint: "bg-blue-50 text-blue-600" },
  aiRecognitionRate: { icon: IconShieldCheck, tint: "bg-indigo-50 text-indigo-600" },
  aiSatisfaction: { icon: IconCheckCircle, tint: "bg-emerald-50 text-emerald-600" },
  aiTransferRate: { icon: IconPackage, tint: "bg-amber-50 text-amber-600" },
  agentServiceCount: { icon: IconUsers, tint: "bg-sky-50 text-sky-600" },
  agentSatisfaction: { icon: IconCheckCircle, tint: "bg-teal-50 text-teal-600" },
  ticketCount: { icon: IconClipboard, tint: "bg-violet-50 text-violet-600" },
  topIssueCategory: { icon: IconTag, tint: "bg-rose-50 text-rose-600" },
};

function rateBarColor(field: LiveStatField): string {
  const rate = field.rate ?? 0;
  if (field.lowerIsBetter) return rate <= 15 ? "bg-emerald-500" : rate <= 25 ? "bg-amber-500" : "bg-rose-500";
  return rate >= 85 ? "bg-emerald-500" : rate >= 70 ? "bg-amber-500" : "bg-rose-500";
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("zh-TW", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Taipei",
  });
}

function formatShortDate(date: Date): string {
  return new Date(date).toLocaleDateString("zh-TW", {
    month: "numeric",
    day: "numeric",
    timeZone: "Asia/Taipei",
  });
}

export function TvWall({
  companies,
  generatedAt,
}: {
  companies: CompanyOverview[];
  generatedAt: string;
}) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || companies.length <= 1) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % companies.length), SLIDE_MS);
    return () => clearInterval(timer);
  }, [paused, companies.length, index]);

  useEffect(() => {
    const timer = setInterval(() => router.refresh(), REFRESH_MS);
    return () => clearInterval(timer);
  }, [router]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (companies.length === 0) return;
      if (e.key === "ArrowRight") setIndex((i) => (i + 1) % companies.length);
      if (e.key === "ArrowLeft") setIndex((i) => (i - 1 + companies.length) % companies.length);
      if (e.key === " ") {
        e.preventDefault();
        setPaused((p) => !p);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [companies.length]);

  const company = companies[index < companies.length ? index : 0];

  return (
    <div className="flex min-h-screen flex-col bg-[#f6f8fb] text-slate-900">
      <header className="flex items-center justify-between gap-6 bg-white px-10 py-3 shadow-sm">
        <Logo subtitle="客服專案健康度電視牆" dark={false} />
        <div className="flex items-center gap-6">
          {paused && (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
              已暫停（空白鍵繼續）
            </span>
          )}
          <LiveClock />
        </div>
      </header>

      <div className="h-1 w-full bg-slate-200">
        {company && (
          <div
            key={company.id}
            className="h-full bg-brand-600"
            style={{
              animation: `slideProgress ${SLIDE_MS}ms linear forwards`,
              animationPlayState: paused ? "paused" : "running",
            }}
          />
        )}
      </div>

      {!company ? (
        <main className="flex flex-1 items-center justify-center">
          <p className="text-lg text-slate-400">尚無公司資料，請先到後台新增公司。</p>
        </main>
      ) : (
        <main
          key={company.id}
          className="flex flex-1 flex-col gap-5 px-10 py-5"
          style={{ animation: "fadeIn 0.4s ease-out" }}
        >
          <Slide company={company} generatedAt={generatedAt} />
        </main>
      )}

      {companies.length > 1 && (
        <footer className="flex flex-wrap items-center justify-center gap-2 pb-4">
          {companies.map((c, i) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setIndex(i)}
              title={c.name}
              aria-label={`切換到 ${c.name}`}
              className={`h-2 rounded-full transition-all ${
                i === index ? "w-10 bg-brand-600" : "w-2 bg-slate-300 hover:bg-slate-400"
              }`}
            />
          ))}
        </footer>
      )}
    </div>
  );
}

function Slide({ company, generatedAt }: { company: CompanyOverview; generatedAt: string }) {
  const fields = liveStatFields(company.live.stats);
  const oldestDays = company.oldestIssues.length
    ? Math.max(...company.oldestIssues.map((i) => i.ageDays))
    : 0;
  const unfinishedCount = company.latestAssessment
    ? company.latestAssessment.stats.totalCount - company.latestAssessment.stats.doneCount
    : 0;

  return (
    <>
      {/* 標題：公司名稱＋購買模組 */}
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <span className="rounded bg-brand-600 px-2.5 py-1 text-xs font-bold tracking-widest text-white">
              {company.industry.name}
            </span>
            <span className="text-sm font-medium text-slate-500">
              客戶健康度總覽・資料更新於 {formatTime(generatedAt)}
            </span>
          </div>
          <h1 className="mt-1 text-6xl font-extrabold leading-tight tracking-tight text-slate-900">
            {company.name}
          </h1>
          {company.description && (
            <p className="mt-1 line-clamp-1 max-w-3xl text-lg text-slate-500">{company.description}</p>
          )}
        </div>
        <div className="max-w-xl">
          <p className="mb-2 text-right text-xs font-bold tracking-widest text-slate-400">目前購買模組</p>
          <div className="flex flex-wrap justify-end gap-2">
            {company.modules.length === 0 ? (
              <span className="text-base text-slate-400">尚未設定</span>
            ) : (
              company.modules.map((m) => (
                <span
                  key={m.id}
                  className="rounded-lg bg-white px-4 py-2 text-lg font-bold text-brand-700 shadow-[0_1px_3px_rgba(15,23,42,0.08)] ring-1 ring-brand-100"
                >
                  {m.name}
                </span>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 三欄：使用數據｜健康度＋構面完成度｜Issue＋未完成項目 */}
      <div className="grid min-h-0 flex-1 gap-5 xl:grid-cols-3">
        {/* 使用數據 */}
        <section className={`${CARD} flex flex-col p-5`}>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900">使用數據</h2>
            {company.live.source === "mock" && (
              <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-bold tracking-widest text-slate-500">
                示意資料
              </span>
            )}
          </div>
          <div className="grid flex-1 auto-rows-fr grid-cols-2 gap-3">
            {fields.map((f) => {
              const meta = STAT_ICON[f.key];
              const Icon = meta.icon;
              return (
                <div key={f.key} className="flex flex-col justify-between rounded-xl bg-slate-50 p-3.5">
                  <div className="flex items-center gap-2">
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${meta.tint}`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <p className="truncate text-sm font-bold tracking-wide text-slate-500">{f.label}</p>
                  </div>
                  <div>
                    <p className="truncate text-4xl font-extrabold tracking-tight text-slate-900">{f.value}</p>
                    {f.rate !== undefined && (
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className={`h-full rounded-full ${rateBarColor(f)}`}
                          style={{ width: `${f.rate}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 健康度（深色重點卡）＋各構面完成度 */}
        <div className="flex min-h-0 flex-col gap-5">
          <section className="rounded-2xl bg-gradient-to-br from-navy-900 to-navy-700 p-5 text-white shadow-[0_8px_24px_rgba(6,26,66,0.25)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="mb-2 text-sm font-bold tracking-widest text-blue-200">目前健康度</p>
                <HealthScore health={company.health} size="xl" tone="dark" />
                <span
                  className={`mt-3 inline-flex rounded px-2.5 py-1 text-xs font-bold tracking-widest ${BAND_PILL[company.health.band]}`}
                >
                  {HEALTH_BAND_LABEL[company.health.band]}
                </span>
              </div>
              <HistoryChart history={company.assessmentHistory} />
            </div>
            <p className="mt-4 text-sm leading-relaxed text-blue-100/80">{company.health.formula}</p>
          </section>

          <section className={`${CARD} flex min-h-0 flex-1 flex-col p-5`}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900">各構面完成度</h2>
              {company.latestAssessment && (
                <span className="text-sm font-medium text-slate-400">
                  {formatShortDate(company.latestAssessment.assessedAt)} 評比
                </span>
              )}
            </div>
            {company.categoryProgress.length === 0 ? (
              <p className="text-base text-slate-400">尚無評比紀錄，請到後台建立第一次評比。</p>
            ) : (
              <ul className="flex flex-1 flex-col justify-between gap-2">
                {company.categoryProgress.map((c) => (
                  <li key={c.name}>
                    <div className="mb-1 flex items-baseline justify-between gap-3">
                      <span className="truncate text-base font-semibold text-slate-800">{c.name}</span>
                      <span className="shrink-0 text-sm font-bold tabular-nums text-slate-500">
                        {c.score === null ? "—" : `${Math.round(c.score)}%`}
                      </span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${healthBarClass(c.score)}`}
                        style={{ width: `${c.score ?? 0}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* 未結案 Issue ＋ 最新健檢未完成項目 */}
        <div className="flex min-h-0 flex-col gap-4">
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
                <IconAlertTriangle className="h-6 w-6 text-rose-600" />
                未結案 Issue
              </h2>
              <span className="rounded bg-rose-100 px-2.5 py-1 text-xs font-bold tracking-widest text-rose-700">
                {company.openIssueCount} 件・最久 3 筆
              </span>
            </div>
            {company.oldestIssues.length === 0 ? (
              <div className={`${CARD} flex items-center gap-2 p-5 text-lg font-semibold text-emerald-600`}>
                <IconCheckCircle className="h-6 w-6" />
                目前沒有未結案 issue
              </div>
            ) : (
              <ul className="space-y-3">
                {company.oldestIssues.map((issue) => (
                  <li key={issue.id} className={`${CARD} flex items-center justify-between gap-4 border-l-4 border-l-rose-600 px-5 py-3`}>
                    <p className="line-clamp-2 text-lg font-bold text-slate-900">{issue.title}</p>
                    <span className="shrink-0 text-right">
                      <span className="block text-3xl font-extrabold leading-none text-rose-600">
                        {issue.ageDays}
                      </span>
                      <span className="text-xs font-bold tracking-widest text-slate-400">天未結</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="min-h-0 flex-1">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
                <IconClipboard className="h-6 w-6 text-brand-600" />
                未完成健檢項目
              </h2>
              <span className="rounded bg-brand-50 px-2.5 py-1 text-xs font-bold tracking-widest text-brand-700">
                權重前 3 名
              </span>
            </div>
            {!company.latestAssessment ? (
              <div className={`${CARD} p-5 text-base text-slate-400`}>尚無評比紀錄。</div>
            ) : company.topUnfinished.length === 0 ? (
              <div className={`${CARD} flex items-center gap-2 p-5 text-lg font-semibold text-emerald-600`}>
                <IconCheckCircle className="h-6 w-6" />
                最新評比所有項目皆已完成
              </div>
            ) : (
              <ul className="space-y-3">
                {company.topUnfinished.map((row) => (
                  <li key={row.id} className={`${CARD} border-l-4 border-l-brand-600 px-5 py-3`}>
                    <div className="flex items-start justify-between gap-3">
                      <p className="line-clamp-2 text-lg font-bold text-slate-900">{row.itemName}</p>
                      <span className="shrink-0 rounded bg-brand-600 px-2 py-0.5 text-xs font-bold tracking-wider text-white">
                        權重 {row.weight}
                      </span>
                    </div>
                    {(row.actionNote ?? row.defaultAction) && (
                      <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                        {row.actionNote ?? row.defaultAction}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      {/* 底部統計方塊 */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Tile label="未結案 Issue" value={company.openIssueCount} color="border-l-rose-600 text-rose-600" />
        <Tile
          label="最久未結（天）"
          value={oldestDays}
          color="border-l-amber-500 text-amber-600"
        />
        <Tile
          label="最新健檢未完成項目"
          value={company.latestAssessment ? unfinishedCount : "—"}
          color="border-l-brand-600 text-brand-600"
        />
        <Tile
          label="已購買模組"
          value={company.modules.length}
          color="border-l-emerald-600 text-emerald-600"
        />
      </div>
    </>
  );
}

function Tile({
  label,
  value,
  color,
}: {
  label: string;
  value: number | string;
  color: string;
}) {
  const [border, text] = color.split(" ");
  return (
    <div className={`rounded-2xl border-l-4 bg-slate-100 px-6 py-3 ${border}`}>
      <p className="text-sm font-bold tracking-widest text-slate-500">{label}</p>
      <p className={`mt-0.5 text-4xl font-extrabold leading-none tracking-tight tabular-nums ${text}`}>{value}</p>
    </div>
  );
}

/** 深色卡片右側的小長條圖：歷次評比分數。 */
function HistoryChart({ history }: { history: CompanyOverview["assessmentHistory"] }) {
  if (history.length === 0) {
    return <p className="max-w-[10rem] text-right text-xs leading-relaxed text-blue-200/70">尚無評比紀錄</p>;
  }
  return (
    <div className="shrink-0">
      <p className="mb-2 text-right text-xs font-bold tracking-widest text-blue-200">歷次評比</p>
      <div className="flex h-28 items-end gap-2.5">
        {history.map((h, i) => {
          const isLast = i === history.length - 1;
          const pct = h.score ?? 0;
          return (
            <div key={h.id} className="flex w-9 flex-col items-center justify-end gap-1">
              <span className="text-xs font-bold tabular-nums text-blue-100">
                {h.score === null ? "—" : Math.round(h.score)}
              </span>
              <div
                className={`w-full rounded-t ${isLast ? "bg-brand-500" : "bg-white/25"}`}
                style={{ height: `${Math.max(4, pct * 0.7)}px` }}
              />
              <span className="text-[10px] font-semibold text-blue-200/70">{formatShortDate(h.assessedAt)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
