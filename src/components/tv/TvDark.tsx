import type { CompanyOverview } from "@/lib/company";
import { HEALTH_BAND_LABEL } from "@/lib/health";
import { liveStatFields } from "@/lib/liveStats";
import { HealthScore } from "@/components/ui/HealthScore";
import { IconAlertTriangle, IconCheckCircle } from "@/components/icons";

const BAND_PILL = {
  healthy: "bg-emerald-400/15 text-emerald-300 ring-emerald-300/40",
  atRisk: "bg-amber-400/15 text-amber-300 ring-amber-300/40",
  critical: "bg-rose-400/15 text-rose-300 ring-rose-300/40",
  none: "bg-slate-400/15 text-slate-300 ring-slate-300/40",
};

const PANEL = "rounded-2xl bg-[#0d2554] ring-1 ring-white/15";

/** 深色指揮中心：深藍底、面板提亮，高對比。 */
export function TvDark({ company }: { company: CompanyOverview }) {
  const fields = liveStatFields(company.live.stats);

  return (
    <div className="grid flex-1 grid-rows-[auto_auto_1fr] gap-6 p-8">
      <section className={`grid gap-8 p-8 xl:grid-cols-[auto_1fr] ${PANEL}`}>
        <div>
          <p className="mb-2 text-sm font-bold tracking-wide text-blue-200">目前健康度</p>
          <HealthScore health={company.health} size="xl" tone="dark" />
          <span
            className={`mt-3 inline-flex rounded-full px-3 py-1 text-sm font-bold ring-1 ring-inset ${BAND_PILL[company.health.band]}`}
          >
            {HEALTH_BAND_LABEL[company.health.band]}
          </span>
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-4">
            <h1 className="text-5xl font-bold tracking-tight text-white">{company.name}</h1>
            <span className="rounded-lg bg-white/10 px-3 py-1 text-lg font-semibold text-blue-100">
              {company.industry.name}
            </span>
          </div>
          {company.description && (
            <p className="mt-2 line-clamp-2 max-w-3xl text-base text-blue-200">{company.description}</p>
          )}
          <p className="mt-4 text-sm font-bold tracking-wide text-blue-200">目前購買模組</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {company.modules.length === 0 ? (
              <span className="text-base text-blue-200/60">尚未設定</span>
            ) : (
              company.modules.map((m) => (
                <span
                  key={m.id}
                  className="rounded-lg bg-brand-500 px-3.5 py-1.5 text-base font-semibold text-white"
                >
                  {m.name}
                </span>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {fields.map((f) => (
          <div key={f.label} className={`${PANEL} px-5 py-4`}>
            <p className="text-sm font-bold tracking-wide text-blue-200">{f.label}</p>
            <p className="mt-1 truncate text-4xl font-bold tracking-tight text-white">{f.value}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className={`${PANEL} p-6`}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-xl font-bold text-white">
              <IconAlertTriangle className="h-6 w-6 text-rose-300" />
              未結案 Issue
            </h2>
            <span className="rounded-full bg-rose-400/20 px-4 py-1 text-2xl font-extrabold text-rose-200">
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
              <p className="mb-2 text-xs font-bold tracking-wide text-blue-200/80">最久遠的 3 筆</p>
              <ul className="space-y-2.5">
                {company.oldestIssues.map((issue) => (
                  <li key={issue.id} className="rounded-lg border-l-4 border-l-rose-400 bg-white/[0.07] px-4 py-3">
                    <p className="line-clamp-2 text-lg font-semibold text-white">{issue.title}</p>
                    <p className="mt-0.5 text-sm font-medium text-rose-300">已 {issue.ageDays} 天未結案</p>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <div className={`${PANEL} p-6`}>
          <h2 className="text-xl font-bold text-white">最新健檢・未完成項目</h2>
          <p className="mb-4 mt-0.5 text-xs font-bold tracking-wide text-blue-200/80">
            {company.latestAssessment
              ? `${company.latestAssessment.assessedAt.toLocaleDateString("zh-TW")} 評比・權重由高到低前 3 名`
              : "尚無評比紀錄"}
          </p>
          {!company.latestAssessment ? (
            <p className="text-base text-blue-200/70">請到後台為這家公司建立第一次評比。</p>
          ) : company.topUnfinished.length === 0 ? (
            <p className="flex items-center gap-2 text-base text-emerald-300">
              <IconCheckCircle className="h-5 w-5" />
              最新評比所有項目皆已完成
            </p>
          ) : (
            <ul className="space-y-2.5">
              {company.topUnfinished.map((row) => (
                <li key={row.id} className="rounded-lg border-l-4 border-l-brand-500 bg-white/[0.07] px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <p className="line-clamp-2 text-lg font-semibold text-white">{row.itemName}</p>
                    <span className="shrink-0 rounded-md bg-brand-500 px-2.5 py-0.5 text-sm font-bold text-white">
                      權重 {row.weight}
                    </span>
                  </div>
                  {(row.actionNote ?? row.defaultAction) && (
                    <p className="mt-1 line-clamp-2 text-sm text-blue-200">
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
  );
}
