"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { CompanyOverview } from "@/lib/company";
import { HEALTH_BAND_LABEL } from "@/lib/health";
import { liveStatFields } from "@/lib/liveStats";
import { LiveClock } from "@/components/LiveClock";
import { Logo } from "@/components/Logo";
import { HealthScore } from "@/components/ui/HealthScore";
import { IconAlertTriangle, IconCheckCircle } from "@/components/icons";

/** 每家公司在電視牆停留的時間（毫秒）。 */
const SLIDE_MS = 15000;
/** 自動重新抓取最新資料的間隔（毫秒）。 */
const REFRESH_MS = 5 * 60 * 1000;

const BAND_STYLE = {
  healthy: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30",
  atRisk: "bg-amber-500/15 text-amber-300 ring-amber-400/30",
  critical: "bg-rose-500/15 text-rose-300 ring-rose-400/30",
  none: "bg-slate-500/15 text-slate-300 ring-slate-400/30",
};

export function TvWall({ companies }: { companies: CompanyOverview[] }) {
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
    <div className="flex min-h-screen flex-col bg-navy-950 text-white">
      <header className="flex items-center justify-between gap-6 border-b border-white/10 px-10 py-5">
        <Logo subtitle="客服專案健康度電視牆" />
        <div className="flex items-center gap-8">
          {paused && (
            <span className="rounded-full bg-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-300">
              已暫停（按空白鍵繼續）
            </span>
          )}
          <LiveClock tone="dark" />
        </div>
      </header>

      {!company ? (
        <main className="flex flex-1 items-center justify-center">
          <p className="text-lg text-blue-200/60">尚無公司資料，請先到後台新增公司。</p>
        </main>
      ) : (
        <Slide key={company.id} company={company} paused={paused} />
      )}

      {companies.length > 1 && (
        <footer className="flex flex-wrap items-center justify-center gap-2 px-10 pb-6">
          {companies.map((c, i) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setIndex(i)}
              title={c.name}
              aria-label={`切換到 ${c.name}`}
              className={`h-2 rounded-full transition-all ${
                i === index ? "w-10 bg-brand-500" : "w-2 bg-white/25 hover:bg-white/50"
              }`}
            />
          ))}
        </footer>
      )}
    </div>
  );
}

function Slide({ company, paused }: { company: CompanyOverview; paused: boolean }) {
  const fields = liveStatFields(company.live.stats);

  return (
    <main className="flex flex-1 flex-col" style={{ animation: "fadeIn 0.6s ease-out" }}>
      <div className="h-1 w-full bg-white/10">
        <div
          className="h-full bg-brand-500"
          style={{
            animation: `slideProgress ${SLIDE_MS}ms linear forwards`,
            animationPlayState: paused ? "paused" : "running",
          }}
        />
      </div>

      <div className="grid flex-1 gap-8 p-10 xl:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        {/* 左：公司、健康度、購買模組、8 項數據 */}
        <section className="flex flex-col gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-4">
              <h1 className="text-5xl font-extrabold tracking-tight">{company.name}</h1>
              <span className="rounded-lg bg-white/10 px-3 py-1 text-base font-semibold text-blue-100">
                {company.industry.name}
              </span>
            </div>
            {company.description && (
              <p className="mt-2 line-clamp-2 max-w-2xl text-base text-blue-200/70">
                {company.description}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-8 rounded-2xl bg-white/5 p-6 ring-1 ring-white/10">
            <div>
              <p className="mb-2 text-sm font-semibold text-blue-200/70">目前健康度</p>
              <div className="rounded-xl bg-white px-5 py-3">
                <HealthScore health={company.health} size="xl" />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <span
                className={`inline-flex rounded-full px-3 py-1 text-sm font-bold ring-1 ring-inset ${BAND_STYLE[company.health.band]}`}
              >
                {HEALTH_BAND_LABEL[company.health.band]}
              </span>
              <p className="mt-3 text-sm leading-relaxed text-blue-200/70">
                {company.health.formula}
              </p>
              <p className="mt-3 text-sm font-semibold text-blue-200/70">目前購買模組</p>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {company.modules.length === 0 ? (
                  <span className="text-sm text-blue-200/40">尚未設定</span>
                ) : (
                  company.modules.map((m) => (
                    <span
                      key={m.id}
                      className="rounded-md bg-brand-600/30 px-2.5 py-1 text-sm font-semibold text-blue-100 ring-1 ring-brand-500/40"
                    >
                      {m.name}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="grid flex-1 auto-rows-fr grid-cols-2 gap-3">
            {fields.map((f) => (
              <div
                key={f.label}
                className="flex flex-col justify-center rounded-xl bg-white/5 px-5 py-3 ring-1 ring-white/10"
              >
                <p className="text-sm font-bold text-blue-100">{f.label}</p>
                <p className="truncate text-3xl font-light text-white/80">{f.value}</p>
              </div>
            ))}
          </div>
          {company.live.source === "mock" && (
            <p className="-mt-3 text-xs text-blue-200/40">※ 使用數據目前為示意資料</p>
          )}
        </section>

        {/* 右：未結案 issue、最新健檢未完成項目 */}
        <section className="flex flex-col gap-6">
          <div className="flex-1 rounded-2xl bg-white/5 p-6 ring-1 ring-white/10">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-xl font-bold">
                <IconAlertTriangle className="h-6 w-6 text-rose-400" />
                未結案 Issue
              </h2>
              <span className="rounded-full bg-rose-500/20 px-4 py-1 text-2xl font-extrabold text-rose-300">
                {company.openIssueCount}
              </span>
            </div>
            {company.oldestIssues.length === 0 ? (
              <p className="flex items-center gap-2 text-base text-emerald-300">
                <IconCheckCircle className="h-5 w-5" />
                目前沒有未結案 issue
              </p>
            ) : (
              <>
                <p className="mb-2 text-xs font-semibold text-blue-200/50">最久遠的 3 筆</p>
                <ul className="space-y-3">
                  {company.oldestIssues.map((issue) => (
                    <li
                      key={issue.id}
                      className="rounded-xl border-l-4 border-l-rose-500 bg-white/5 px-4 py-3"
                    >
                      <p className="line-clamp-2 text-lg font-semibold">{issue.title}</p>
                      <p className="mt-0.5 text-sm text-rose-300">已 {issue.ageDays} 天未結案</p>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          <div className="flex-1 rounded-2xl bg-white/5 p-6 ring-1 ring-white/10">
            <div className="mb-4">
              <h2 className="text-xl font-bold">最新健檢・未完成項目</h2>
              <p className="mt-0.5 text-xs text-blue-200/50">
                {company.latestAssessment
                  ? `${company.latestAssessment.assessedAt.toLocaleDateString("zh-TW")} 評比・權重由高到低前 3 名`
                  : "尚無評比紀錄"}
              </p>
            </div>
            {!company.latestAssessment ? (
              <p className="text-base text-blue-200/50">請到後台為這家公司建立第一次評比。</p>
            ) : company.topUnfinished.length === 0 ? (
              <p className="flex items-center gap-2 text-base text-emerald-300">
                <IconCheckCircle className="h-5 w-5" />
                最新評比所有項目皆已完成
              </p>
            ) : (
              <ul className="space-y-3">
                {company.topUnfinished.map((row) => (
                  <li
                    key={row.id}
                    className="rounded-xl border-l-4 border-l-brand-500 bg-white/5 px-4 py-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="line-clamp-2 text-lg font-semibold">{row.itemName}</p>
                      <span className="shrink-0 rounded-md bg-brand-600/40 px-2.5 py-0.5 text-sm font-bold text-blue-100">
                        權重 {row.weight}
                      </span>
                    </div>
                    {(row.actionNote ?? row.defaultAction) && (
                      <p className="mt-1 line-clamp-2 text-sm text-blue-200/60">
                        {row.actionNote ?? row.defaultAction}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
