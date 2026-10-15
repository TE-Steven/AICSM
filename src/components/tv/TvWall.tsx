"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { CompanyOverview } from "@/lib/company";
import { HEALTH_BAND_LABEL, type HealthBand } from "@/lib/health";
import { liveStatFields, type LiveStatField } from "@/lib/liveStats";
import { PATH_SEPARATOR } from "@/lib/tree";
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

/**
 * 電視牆以「最小設計尺寸」為基準整張縮放，畫布再依視窗長寬比補足，
 * 所以不論螢幕比例或解析度都會填滿整個畫面、不留白邊，也不會跑版。
 * 縮放用 CSS zoom（重新排版繪製，文字清晰），不用 transform: scale（會讓文字發糊）。
 */
const MIN_W = 1500;
const MIN_H = 880;

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
  slideSeconds,
}: {
  companies: CompanyOverview[];
  generatedAt: string;
  /** 每家公司停留幾秒 */
  slideSeconds: number;
}) {
  const router = useRouter();
  const slideMs = slideSeconds * 1000;
  /** 只有 1 家（或沒有）公司時不輪播 */
  const rotate = companies.length > 1;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || !rotate) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % companies.length), slideMs);
    return () => clearInterval(timer);
  }, [paused, rotate, companies.length, slideMs, index]);

  const [view, setView] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    const update = () => setView({ w: window.innerWidth, h: window.innerHeight });
    const first = setTimeout(update, 0);
    window.addEventListener("resize", update);
    return () => {
      clearTimeout(first);
      window.removeEventListener("resize", update);
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => router.refresh(), REFRESH_MS);
    return () => clearInterval(timer);
  }, [router]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!rotate) return;
      if (e.key === "ArrowRight") setIndex((i) => (i + 1) % companies.length);
      if (e.key === "ArrowLeft") setIndex((i) => (i - 1 + companies.length) % companies.length);
      if (e.key === " ") {
        e.preventDefault();
        setPaused((p) => !p);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [rotate, companies.length]);

  const company = companies[index < companies.length ? index : 0];

  const scale = view ? Math.min(view.w / MIN_W, view.h / MIN_H) : 1;
  const stageW = view ? view.w / scale : MIN_W;
  const stageH = view ? view.h / scale : MIN_H;

  return (
    <div
      className="font-tv fixed inset-0 overflow-hidden bg-slate-100 text-slate-900"
      style={{ visibility: view ? "visible" : "hidden" }}
    >
      <div
        className="absolute left-0 top-0"
        style={{
          width: stageW,
          height: stageH,
          zoom: scale,
        }}
      >
        {company && rotate && (
          <div className="absolute inset-x-0 top-0 z-10 h-1 bg-slate-200">
            <div
              key={`${company.id}-${index}`}
              className="h-full bg-sky-500"
              style={{
                animation: `slideProgress ${slideMs}ms linear forwards`,
                animationPlayState: paused ? "paused" : "running",
              }}
            />
          </div>
        )}

        {!company ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-lg text-slate-400">沒有可顯示的公司，請回後台重新選擇播放的公司。</p>
          </div>
        ) : (
          <Dashboard key={company.id} company={company} generatedAt={generatedAt} paused={paused} rotate={rotate} />
        )}

        {rotate && (
          <div className="absolute inset-x-0 bottom-1.5 z-10 flex items-center justify-center gap-2">
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
    </div>
  );
}

function Dashboard({
  company,
  generatedAt,
  paused,
  rotate,
}: {
  company: CompanyOverview;
  generatedAt: string;
  paused: boolean;
  rotate: boolean;
}) {
  const fields = liveStatFields(company.live.stats);
  const topAi = fields.find((f) => f.key === "aiTopIssue");
  const topAgent = fields.find((f) => f.key === "agentTopIssue");
  const kpis = fields.filter((f) => f.key !== "aiTopIssue" && f.key !== "agentTopIssue");
  const unfinishedTotal = company.latestAssessment
    ? company.latestAssessment.stats.totalCount - company.latestAssessment.stats.doneCount
    : 0;

  return (
    <div className="grid h-full grid-rows-[auto_auto_minmax(0,1fr)] gap-4 p-5">
      {/* Header */}
      <header className="flex items-center justify-between gap-8 rounded-xl bg-slate-800 px-6 py-3.5 text-white">
        <h1 className="text-[32px] font-semibold leading-tight">企業診斷儀表板</h1>
        <div className="text-right text-slate-400">
          <p className="font-number text-base font-medium text-slate-300">{formatHeaderDate(generatedAt)}</p>
          <p className="text-sm">
            資料更新 {taipei(generatedAt, { hour: "2-digit", minute: "2-digit" })}・
            {company.live.statsDate ? `數據日期 ${company.live.statsDate.slice(5).replace("-", "/")}` : "使用數據為示意資料"}
            {rotate && paused && "・已暫停"}
          </p>
        </div>
      </header>

      {/* 上半部：健康度｜7 個數值（同一個大區塊）｜問題分類 TOP1（獨立區塊，分智能／人工） */}
      <section className="grid min-h-[300px] grid-cols-[minmax(0,3.2fr)_minmax(0,5fr)_minmax(0,2.4fr)] gap-4">
        <HealthCard company={company} />
        <StatsBlock rows={[kpis.slice(0, 4), kpis.slice(4)]} />
        <TopIssueBlock ai={topAi} agent={topAgent} />
      </section>

      {/* Middle Row：Issue ＋ 待辦（未完成健檢項目） */}
      <section className="grid min-h-0 grid-cols-2 gap-4">
        <Panel
          icon={<IconAlertTriangle className="h-5 w-5 text-red-500" />}
          title="未結案 Issue"
          sub={`共 ${company.openIssueCount} 件・最久遠 3 筆`}
        >
          <div className="grid grid-cols-[40px_1fr_70px_90px_130px] items-center gap-3 rounded-md bg-slate-50 px-3 py-2 text-sm font-medium text-slate-500">
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
                    <span className="truncate text-lg font-medium text-slate-900">{issue.title}</span>
                    <span className={`rounded-md py-1 text-center text-sm font-semibold ${priority.cls}`}>
                      {priority.label}
                    </span>
                    <span className={`rounded-full py-1 text-center text-sm font-medium ${status.cls}`}>
                      {status.label}
                    </span>
                    <span className="text-right">
                      <span className="font-number block text-sm text-slate-500">
                        {taipei(issue.occurredAt, { year: "numeric", month: "2-digit", day: "2-digit" }).replaceAll(
                          "/",
                          "-"
                        )}
                      </span>
                      <span className="font-number text-base font-bold text-red-500">已 {issue.ageDays} 天</span>
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
          <div className="grid grid-cols-[28px_1fr_130px_60px_70px] items-center gap-3 rounded-md bg-slate-50 px-3 py-2 text-sm font-medium text-slate-500">
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
                    <span className="block truncate text-lg font-medium text-slate-900">{row.itemName}</span>
                    {(row.actionNote ?? row.defaultAction) && (
                      <span className="block truncate text-sm text-slate-500">
                        {row.actionNote ?? row.defaultAction}
                      </span>
                    )}
                  </span>
                  <span className="truncate text-sm text-slate-500">{row.pathLabel.split(PATH_SEPARATOR)[0]}</span>
                  <span className="font-number text-center text-base font-bold text-slate-700">{row.weight}</span>
                  <span className="rounded-full bg-sky-100 py-1 text-center text-sm font-medium text-sky-600">
                    待辦
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </section>
    </div>
  );
}

function HealthCard({ company }: { company: CompanyOverview }) {
  return (
    <div className={`${CARD} flex flex-col gap-3 px-6 py-4`}>
      <div className="flex items-center gap-5">
        <div className="min-w-0 flex-1">
          <h2 className="break-words text-[32px] font-bold leading-tight text-slate-900">{company.name}</h2>
          <span className="mt-2 inline-block rounded-md bg-sky-100 px-2.5 py-1 text-base font-semibold text-sky-700">
            {company.industry.name}
          </span>
        </div>
        <div className="shrink-0 border-l border-slate-200 pl-5">
          <div className="mb-0.5 flex items-center gap-2">
            <span className="text-lg font-semibold text-slate-700">目前健康度</span>
            <span className={`rounded-md px-2 py-0.5 text-sm font-semibold ${BAND_PILL[company.health.band]}`}>
              {HEALTH_BAND_LABEL[company.health.band]}
            </span>
          </div>
          <div className="font-number">
            <HealthScore health={company.health} size="hero" />
          </div>
        </div>
      </div>

      <div className="min-h-0 border-t border-slate-200 pt-3">
        <p className="mb-1 text-base font-semibold text-slate-700">痛點說明</p>
        {company.painPoints ? (
          <p className="line-clamp-4 text-[15px] leading-relaxed text-slate-600">{company.painPoints}</p>
        ) : (
          <p className="text-sm text-slate-400">尚未填寫（後台「公司管理 → 基本資料」可編輯）</p>
        )}
      </div>

      <div className="mt-auto">
        <p className="mb-1.5 text-base font-semibold text-slate-700">購買模組</p>
        <div className="flex flex-wrap gap-1.5">
          {company.modules.length === 0 ? (
            <span className="text-sm text-slate-400">尚未設定</span>
          ) : (
            company.modules.map((m) => (
              <span key={m.id} className="rounded-md bg-sky-100 px-2.5 py-1 text-sm font-medium text-sky-700">
                {m.name}
              </span>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/** 7 個數值放在同一個大區塊裡，用細線分隔（智能 4 項一排、客服 3 項一排）。 */
function StatsBlock({ rows }: { rows: LiveStatField[][] }) {
  return (
    <div
      className={`${CARD} flex flex-col divide-y divide-slate-200 px-2 py-1`}
    >
      {rows.map((row, rowIndex) => (
        <div
          key={rowIndex}
          className={`grid flex-1 divide-x divide-slate-200 ${row.length === 4 ? "grid-cols-4" : "grid-cols-3"}`}
        >
          {row.map((field) => (
            <StatItem key={field.key} field={field} />
          ))}
        </div>
      ))}
    </div>
  );
}

function StatItem({ field }: { field: LiveStatField }) {
  const meta = KPI_ICON[field.key];
  const Icon = meta.icon;
  const trend = field.trend;
  const up = trend ? trend.value >= 0 : false;
  // 方向 ≠ 好壞：轉接率、工單數下降是好事
  const good = trend ? (field.lowerIsBetter ? !up : up) : false;

  return (
    <div className="flex min-w-0 flex-col justify-center gap-1 px-3 py-2">
      <div className="flex items-center gap-2">
        <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${meta.tint}`}>
          <Icon className="h-3.5 w-3.5" />
        </span>
        <span className="truncate text-lg font-semibold text-slate-700">{field.label}</span>
      </div>
      <p className="font-number truncate text-[44px] font-bold leading-none text-slate-900">{field.value}</p>
      <p
        className={`font-number text-base font-medium ${
          trend ? (good ? "text-emerald-500" : "text-red-500") : "text-slate-400"
        }`}
      >
        {trend && (
          <>
            {up ? "▲" : "▼"} 較上週 {up ? "+" : ""}
            {Number.isInteger(trend.value) ? trend.value : trend.value.toFixed(1)}
            {trend.unit}
          </>
        )}
      </p>
    </div>
  );
}

/** 問題分類 TOP1：完全獨立的區塊，分「智能客服」與「人工客服」兩種。 */
function TopIssueBlock({ ai, agent }: { ai?: LiveStatField; agent?: LiveStatField }) {
  return (
    <div className={`${CARD} flex flex-col`}>
      <p className="flex items-center gap-2 px-5 pb-1 pt-4 text-xl font-semibold text-slate-700">
        <IconTag className="h-5 w-5 text-sky-500" />
        問題分類 TOP1
      </p>
      <div className="flex flex-1 flex-col divide-y divide-slate-200">
        <TopIssueRow label="智能客服" value={ai?.value} />
        <TopIssueRow label="人工客服" value={agent?.value} />
      </div>
    </div>
  );
}

function TopIssueRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex flex-1 flex-col justify-center px-5 py-2">
      <span className="text-lg font-semibold text-slate-700">{label}</span>
      <span className="truncate text-[32px] font-bold leading-tight text-slate-900">{value ?? "—"}</span>
      <span className="text-base text-slate-500">本週最常被詢問</span>
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
        <h2 className="flex items-center gap-2 text-xl font-semibold text-slate-700">
          {icon}
          {title}
        </h2>
        {sub && <span className="text-sm font-medium text-sky-500">{sub}</span>}
      </div>
      {children}
    </div>
  );
}

function EmptyRow({ children, muted }: { children: ReactNode; muted?: boolean }) {
  return (
    <div
      className={`flex flex-1 items-center justify-center text-lg font-medium ${
        muted ? "text-slate-400" : "text-emerald-600"
      }`}
    >
      {children}
    </div>
  );
}
