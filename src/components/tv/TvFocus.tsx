import type { CompanyOverview } from "@/lib/company";
import { HEALTH_BAND_LABEL } from "@/lib/health";
import { liveStatFields } from "@/lib/liveStats";
import { HealthScore } from "@/components/ui/HealthScore";
import { IconCheckCircle } from "@/components/icons";

const BAND_PILL = {
  healthy: "bg-emerald-400/15 text-emerald-300 ring-emerald-300/40",
  atRisk: "bg-amber-400/15 text-amber-300 ring-amber-300/40",
  critical: "bg-rose-400/15 text-rose-300 ring-rose-300/40",
  none: "bg-slate-400/15 text-slate-300 ring-slate-300/40",
};

/** 大字聚焦：公司名與健康度超大，其餘資訊精簡，遠距離一眼看懂。 */
export function TvFocus({ company }: { company: CompanyOverview }) {
  const fields = liveStatFields(company.live.stats);

  return (
    <div className="grid flex-1 grid-rows-[1fr_auto] gap-6 p-10">
      <div className="grid gap-10 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <section className="flex flex-col justify-center">
          <div className="flex flex-wrap items-center gap-5">
            <h1 className="text-7xl font-black tracking-tight text-white">{company.name}</h1>
            <span className="rounded-xl bg-white/10 px-4 py-1.5 text-2xl font-semibold text-blue-100">
              {company.industry.name}
            </span>
          </div>

          <div className="mt-6 flex flex-wrap items-end gap-8">
            <HealthScore health={company.health} size="huge" tone="dark" />
            <div className="pb-6">
              <span
                className={`inline-flex rounded-full px-5 py-2 text-3xl font-bold ring-1 ring-inset ${BAND_PILL[company.health.band]}`}
              >
                {HEALTH_BAND_LABEL[company.health.band]}
              </span>
              <p className="mt-3 text-lg font-semibold text-blue-200">健康度</p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2.5">
            {company.modules.length === 0 ? (
              <span className="text-lg text-blue-200/60">尚未設定購買模組</span>
            ) : (
              company.modules.map((m) => (
                <span key={m.id} className="rounded-lg bg-brand-500 px-4 py-2 text-xl font-semibold text-white">
                  {m.name}
                </span>
              ))
            )}
          </div>
        </section>

        <section className="flex flex-col justify-center gap-6">
          <div className="rounded-3xl bg-white/[0.08] p-7 ring-1 ring-white/15">
            <div className="flex items-end justify-between">
              <h2 className="text-2xl font-bold text-white">未結案 Issue</h2>
              <span className="text-7xl font-black leading-none text-rose-300">{company.openIssueCount}</span>
            </div>
            {company.oldestIssues.length > 0 ? (
              <ul className="mt-4 space-y-2">
                {company.oldestIssues.map((issue) => (
                  <li key={issue.id} className="flex items-baseline justify-between gap-4 text-xl">
                    <span className="line-clamp-1 font-semibold text-white">{issue.title}</span>
                    <span className="shrink-0 text-lg font-bold text-rose-300">{issue.ageDays} 天</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 flex items-center gap-2 text-xl text-emerald-300">
                <IconCheckCircle className="h-6 w-6" />
                目前沒有未結案 issue
              </p>
            )}
          </div>

          <div className="rounded-3xl bg-white/[0.08] p-7 ring-1 ring-white/15">
            <h2 className="text-2xl font-bold text-white">最新健檢・未完成（權重前 3）</h2>
            {!company.latestAssessment ? (
              <p className="mt-3 text-xl text-blue-200/70">尚無評比紀錄</p>
            ) : company.topUnfinished.length === 0 ? (
              <p className="mt-3 flex items-center gap-2 text-xl text-emerald-300">
                <IconCheckCircle className="h-6 w-6" />
                所有項目皆已完成
              </p>
            ) : (
              <ul className="mt-4 space-y-2">
                {company.topUnfinished.map((row) => (
                  <li key={row.id} className="flex items-baseline justify-between gap-4 text-xl">
                    <span className="line-clamp-1 font-semibold text-white">{row.itemName}</span>
                    <span className="shrink-0 text-lg font-bold text-blue-200">權重 {row.weight}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>

      <section className="grid grid-cols-4 gap-x-6 gap-y-4 rounded-3xl bg-white/[0.06] px-8 py-5 ring-1 ring-white/10 lg:grid-cols-8">
        {fields.map((f) => (
          <div key={f.label}>
            <p className="truncate text-sm font-bold text-blue-200">{f.label}</p>
            <p className="truncate text-2xl font-semibold text-white">{f.value}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
