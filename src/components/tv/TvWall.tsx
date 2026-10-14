"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { CompanyOverview } from "@/lib/company";
import { HEALTH_BAND_LABEL, type HealthBand } from "@/lib/health";
import { liveStatFields, type LiveStatField } from "@/lib/liveStats";
import { PATH_SEPARATOR } from "@/lib/tree";
import { CategoryBarChart, ScoreTrendChart } from "@/components/tv/TvCharts";
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

/** 卡片／面板共用樣式（規範：白底、10px 圓角、shadow-md、淺色邊框） */
const CARD =
  "rounded-[10px] border border-slate-200 bg-white shadow-[0_4px_6px_-1px_rgba(15,23,42,0.08),0_2px_4px_-1px_rgba(15,23,42,0.04)]";

const BAND_PILL: Record<HealthBand, string> = {
  healthy: "bg-emerald-100 text-emerald-600",
  atRisk: "bg-amber-100 text-amber-600",
  critical: "bg-red-100 text-red-500",
  none: "bg-slate-100 text-slate-500",
};

const KPI_ICON: Record<string, { icon: typeof IconUsers; tint: string }> = {
  aiServiceCount: { icon: IconUsers, tint: "bg-blue-100 text-blue-500" },
  aiRecognitionRate: { icon: IconShieldCheck, tint: "bg-indigo-100 text-indigo-500" },
  aiSatisfaction: { icon: IconCheckCircle, tint: "bg-emerald-100 text-emerald-500" },
  aiTransferRate: { icon: IconPackage, tint: "bg-amber-100 text-amber-500" },
  agentServiceCount: { icon: IconUsers, tint: "bg-sky-100 text-sky-500" },
  agentSatisfaction: { icon: IconCheckCircle, tint: "bg-teal-100 text-teal-500" },
  ticketCount: { icon: IconClipboard, tint: "bg-violet-100 text-violet-500" },
  topIssueCategory: { icon: IconTag, tint: "bg-red-100 text-red-500" },
};

const PRIORITY_PILL: Record<string, { label: string; cls: string }> = {
  high: { label: "高", cls: "bg-red-100 text-red-500" },
  medium: { label: "中", cls: "bg-amber-100 text-amber-600" },
  low: { label: "低", cls: "bg-blue-100 text-blue-500" },
};

const ISSUE_STATUS: Record<string, { label: string; cls: string; dot: string }> = {
  open: { label: "未解決", cls: "bg-red-100 text-red-500", dot: "bg-red-500" },
  in_progress: { label: "處理中", cls: "bg-amber-100 text-amber-600", dot: "bg-amber-500" },
};

function taipei(value: string | Date, options: Intl.DateTimeFormatOptions): string {
  return new Date(value).toLocaleString("zh-TW", { ...options, timeZone: "Asia/Taipei", hour12: false });
}

function formatHeaderDate(iso: string): string {
  const parts = new Intl.DateTimeFormat("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Taipei",
  }).formatToParts(new Date(iso));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("year")}.${get("month")}.${get("day")}`;
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
    <div className="font-tv relative min-h-screen bg-slate-100 text-slate-900 xl:h-screen xl:overflow-hidden">
      {company && (
        <div className="absolute inset-x-0 top-0 z-10 h-1 bg-slate-200">
          <div
            key={company.id}
            className="h-full bg-sky-500"
            style={{
              animation: `slideProgress ${SLIDE_MS}ms linear forwards`,
              animationPlayState: paused ? "paused" : "running",
            }}
          />
        </div>
      )}

      {!company ? (
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-lg text-slate-400">尚無公司資料，請先到後台新增公司。</p>
        </div>
      ) : (
        <Dashboard key={company.id} company={company} generatedAt={generatedAt} paused={paused} />
      )}

      {companies.length > 1 && (
        <div className="absolute inset-x-0 bottom-1.5 z-10 flex flex-wrap items-center justify-center gap-2">
          {companies.map((c, i) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setIndex(i)}
              title={c.name}
              aria-label={`切換到 ${c.name}`}
              className={`h-1.5 rounded-full transition-all ${
                i === index ? "w-8 bg-sky-500" : "w-1.5 bg-slate-300 hover:bg-slate-400"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Dashboard({
  company,
  generatedAt,
  paused,
}: {
  company: CompanyOverview;
  generatedAt: string;
  paused: boolean;
}) {
  const fields = liveStatFields(company.live.stats);
  const unfinishedTotal = company.latestAssessment
    ? company.latestAssessment.stats.totalCount - company.latestAssessment.stats.doneCount
    : 0;

  return (
    <div className="grid gap-5 p-6 min-[1920px]:p-8 xl:h-full xl:grid-rows-[auto_auto_minmax(0,1fr)_220px]">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-x-8 gap-y-3 rounded-xl bg-slate-800 px-6 py-4 text-white">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="text-2xl font-bold tracking-[0.02em]">{company.name}</span>
          <span className="rounded-md bg-sky-500/20 px-2.5 py-1 text-sm font-semibold text-sky-300">
            {company.industry.name}
          </span>
          <span className="hidden h-6 w-px bg-white/20 md:block" />
          <h1 className="text-[28px] font-semibold leading-tight">企業診斷儀表板</h1>
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-slate-400">購買模組</span>
            {company.modules.length === 0 ? (
              <span className="text-sm text-slate-500">尚未設定</span>
            ) : (
              company.modules.map((m) => (
                <span key={m.id} className="rounded-md bg-white/10 px-2.5 py-1 text-sm font-medium text-slate-100">
                  {m.name}
                </span>
              ))
            )}
          </div>
          <div className="flex items-center gap-3 rounded-lg bg-white/10 px-4 py-1.5">
            <span className="text-sm text-slate-300">健康度</span>
            <div className="font-number">
              <HealthScore health={company.health} size="md" tone="dark" popoverSide="right" />
            </div>
            <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${BAND_PILL[company.health.band]}`}>
              {HEALTH_BAND_LABEL[company.health.band]}
            </span>
          </div>
          <div className="text-right text-slate-400">
            <p className="font-number text-base font-medium text-slate-300">{formatHeaderDate(generatedAt)}</p>
            <p className="text-xs">
              資料更新 {taipei(generatedAt, { hour: "2-digit", minute: "2-digit" })}
              {paused && "・已暫停"}
            </p>
          </div>
        </div>
      </header>

      {/* KPI Row：8 項使用數據 */}
      <section className="grid grid-cols-2 gap-4 md:grid-cols-4 2xl:grid-cols-8">
        {fields.map((f, i) => (
          <KpiCard key={f.key} field={f} index={i} isMock={company.live.source === "mock"} />
        ))}
      </section>

      {/* Middle Row：Issue ＋ 待辦（未完成健檢項目） */}
      <section className="grid min-h-0 gap-5 lg:grid-cols-2">
        <Panel
          icon={<IconAlertTriangle className="h-5 w-5 text-red-500" />}
          title="未結案 Issue"
          sub={`共 ${company.openIssueCount} 件・最久遠 3 筆`}
        >
          <div className="grid grid-cols-[40px_1fr_70px_90px_130px] items-center gap-3 rounded-md bg-slate-50 px-3 py-2 text-xs font-medium text-slate-500">
            <span />
            <span>項目名稱</span>
            <span className="text-center">優先級</span>
            <span className="text-center">狀態</span>
            <span className="text-right">發生日期</span>
          </div>
          {company.oldestIssues.length === 0 ? (
            <EmptyRow>目前沒有未結案 issue</EmptyRow>
          ) : (
            <ul className="flex flex-1 flex-col divide-y divide-slate-100 overflow-hidden">
              {company.oldestIssues.map((issue) => {
                const status = ISSUE_STATUS[issue.status] ?? ISSUE_STATUS.open;
                const priority = PRIORITY_PILL[issue.priority] ?? PRIORITY_PILL.medium;
                return (
                  <li
                    key={issue.id}
                    className="grid flex-1 grid-cols-[40px_1fr_70px_90px_130px] items-center gap-3 px-3 py-2"
                  >
                    <span
                      className={`mx-auto flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold text-white ${status.dot}`}
                    >
                      !
                    </span>
                    <span className="truncate text-base font-medium text-slate-900">{issue.title}</span>
                    <span className={`rounded-md py-1 text-center text-xs font-semibold ${priority.cls}`}>
                      {priority.label}
                    </span>
                    <span className={`rounded-full py-1 text-center text-xs font-medium ${status.cls}`}>
                      {status.label}
                    </span>
                    <span className="text-right">
                      <span className="font-number block text-sm text-slate-500">
                        {taipei(issue.occurredAt, { year: "numeric", month: "2-digit", day: "2-digit" }).replaceAll(
                          "/",
                          "-"
                        )}
                      </span>
                      <span className="font-number text-sm font-bold text-red-500">已 {issue.ageDays} 天</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <Panel
          icon={<IconClipboard className="h-5 w-5 text-sky-500" />}
          title="未完成健檢項目"
          sub={
            company.latestAssessment
              ? `最新評比 ${taipei(company.latestAssessment.assessedAt, { month: "numeric", day: "numeric" })}・未完成 ${unfinishedTotal} 項・權重前 3 名`
              : "尚無評比紀錄"
          }
        >
          <div className="grid grid-cols-[28px_1fr_130px_60px_70px] items-center gap-3 rounded-md bg-slate-50 px-3 py-2 text-xs font-medium text-slate-500">
            <span />
            <span>檢核項目</span>
            <span>構面</span>
            <span className="text-center">權重</span>
            <span className="text-center">狀態</span>
          </div>
          {!company.latestAssessment ? (
            <EmptyRow muted>請到後台為這家公司建立第一次評比</EmptyRow>
          ) : company.topUnfinished.length === 0 ? (
            <EmptyRow>最新評比所有項目皆已完成 🎉</EmptyRow>
          ) : (
            <ul className="flex flex-1 flex-col divide-y divide-slate-100 overflow-hidden">
              {company.topUnfinished.map((row) => (
                <li
                  key={row.id}
                  className="grid flex-1 grid-cols-[28px_1fr_130px_60px_70px] items-center gap-3 px-3 py-2"
                >
                  <span className="mx-auto h-[18px] w-[18px] rounded border-2 border-slate-300" />
                  <span className="min-w-0">
                    <span className="block truncate text-base font-medium text-slate-900">{row.itemName}</span>
                    {(row.actionNote ?? row.defaultAction) && (
                      <span className="block truncate text-sm text-slate-500">
                        {row.actionNote ?? row.defaultAction}
                      </span>
                    )}
                  </span>
                  <span className="truncate text-sm text-slate-500">{row.pathLabel.split(PATH_SEPARATOR)[0]}</span>
                  <span className="font-number text-center text-base font-bold text-slate-700">{row.weight}</span>
                  <span className="rounded-full bg-sky-100 py-1 text-center text-xs font-medium text-sky-600">
                    待辦
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </section>

      {/* Chart Row */}
      <section className="grid gap-5 lg:grid-cols-2">
        <ChartCard
          title="各構面完成度"
          legend={[
            { color: "bg-sky-500", label: "已完成" },
            { color: "bg-amber-500", label: "未完成" },
          ]}
        >
          {company.categoryProgress.length === 0 ? (
            <ChartEmpty>尚無評比紀錄</ChartEmpty>
          ) : (
            <CategoryBarChart data={company.categoryProgress} />
          )}
        </ChartCard>
        <ChartCard
          title="健康度趨勢（歷次評比）"
          legend={[
            { color: "bg-sky-500", label: "評比分數" },
            { color: "bg-emerald-500", label: "健康門檻 80%" },
          ]}
        >
          {company.assessmentHistory.length === 0 ? (
            <ChartEmpty>尚無評比紀錄</ChartEmpty>
          ) : (
            <ScoreTrendChart
              data={company.assessmentHistory.map((h) => ({
                label: taipei(h.assessedAt, { month: "2-digit", day: "2-digit" }).replace("/", "."),
                score: h.score,
              }))}
            />
          )}
        </ChartCard>
      </section>
    </div>
  );
}

function KpiCard({ field, index, isMock }: { field: LiveStatField; index: number; isMock: boolean }) {
  const meta = KPI_ICON[field.key];
  const Icon = meta.icon;
  const isText = field.key === "topIssueCategory";
  const trend = field.trend;
  const up = trend ? trend.value >= 0 : false;
  // 方向 ≠ 好壞：轉接率、工單數下降是好事
  const good = trend ? (field.lowerIsBetter ? !up : up) : false;

  return (
    <div
      className={`${CARD} flex flex-col justify-between px-4 py-3.5`}
      style={{ animation: "slideUpSoft 0.5s ease-out both", animationDelay: `${0.05 + index * 0.05}s` }}
    >
      <div className="mb-2 flex items-center gap-2.5">
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${meta.tint}`}>
          <Icon className="h-4 w-4" />
        </span>
        <span className="truncate text-sm font-medium text-slate-500">{field.label}</span>
      </div>
      <p
        className={`font-number truncate font-bold leading-tight text-slate-900 ${
          isText ? "text-xl" : "text-[34px]"
        }`}
      >
        {field.value}
      </p>
      <p
        className={`font-number mt-1 inline-flex items-center gap-1 text-xs font-medium ${
          trend ? (good ? "text-emerald-500" : "text-red-500") : "text-slate-400"
        }`}
      >
        {trend ? (
          <>
            <span>{up ? "▲" : "▼"}</span>
            較上週 {up ? "+" : ""}
            {Number.isInteger(trend.value) ? trend.value : trend.value.toFixed(1)}
            {trend.unit}
          </>
        ) : isMock ? (
          "本週最常被詢問"
        ) : (
          "本週最多"
        )}
      </p>
    </div>
  );
}

function Panel({
  icon,
  title,
  sub,
  children,
}: {
  icon: ReactNode;
  title: string;
  sub?: string;
  children: ReactNode;
}) {
  return (
    <div className={`${CARD} flex min-h-0 flex-col p-5`}>
      <div className="mb-3 flex items-center justify-between border-b-2 border-slate-200 pb-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-700">
          {icon}
          {title}
        </h2>
        {sub && <span className="text-xs font-medium text-sky-500">{sub}</span>}
      </div>
      {children}
    </div>
  );
}

function EmptyRow({ children, muted }: { children: ReactNode; muted?: boolean }) {
  return (
    <div
      className={`flex flex-1 items-center justify-center text-base font-medium ${
        muted ? "text-slate-400" : "text-emerald-600"
      }`}
    >
      {children}
    </div>
  );
}

function ChartCard({
  title,
  legend,
  children,
}: {
  title: string;
  legend: { color: string; label: string }[];
  children: ReactNode;
}) {
  return (
    <div className={`${CARD} flex min-h-[220px] flex-col p-4`}>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-700">{title}</h3>
        <div className="flex gap-4 text-xs text-slate-500">
          {legend.map((l) => (
            <span key={l.label} className="flex items-center gap-1.5">
              <span className={`h-2.5 w-2.5 rounded-full ${l.color}`} />
              {l.label}
            </span>
          ))}
        </div>
      </div>
      <div className="relative min-h-0 flex-1">{children}</div>
    </div>
  );
}

function ChartEmpty({ children }: { children: ReactNode }) {
  return <div className="flex h-full items-center justify-center text-sm text-slate-400">{children}</div>;
}
