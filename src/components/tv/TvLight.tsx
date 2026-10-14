import type { CompanyOverview } from "@/lib/company";
import { HEALTH_BAND_LABEL } from "@/lib/health";
import { liveStatFields } from "@/lib/liveStats";
import { HealthScore } from "@/components/ui/HealthScore";
import { IconAlertTriangle, IconCheckCircle } from "@/components/icons";

const BAND_PILL = {
  healthy: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  atRisk: "bg-amber-50 text-amber-700 ring-amber-200",
  critical: "bg-rose-50 text-rose-700 ring-rose-200",
  none: "bg-slate-100 text-slate-600 ring-slate-200",
};

/** 明亮看板：白底卡片、深藍標題列，資訊最完整。 */
export function TvLight({ company }: { company: CompanyOverview }) {
  const fields = liveStatFields(company.live.stats);

  return (
    <div className="grid flex-1 grid-rows-[auto_auto_1fr] gap-6 p-8">
      {/* 公司＋健康度＋購買模組 */}
      <section className="grid gap-6 rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200 xl:grid-cols-[auto_1fr]">
        <div className="flex items-center gap-8">
          <div>
            <p className="mb-2 text-sm font-bold tracking-wide text-slate-500">目前健康度</p>
            <HealthScore health={company.health} size="xl" />
            <span
              className={`mt-3 inline-flex rounded-full px-3 py-1 text-sm font-bold ring-1 ring-inset ${BAND_PILL[company.health.band]}`}
            >
              {HEALTH_BAND_LABEL[company.health.band]}
            </span>
          </div>
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-4">
            <h1 className="text-5xl font-bold tracking-tight text-slate-900">{company.name}</h1>
            <span className="rounded-lg bg-brand-50 px-3 py-1 text-lg font-semibold text-brand-700">
              {company.industry.name}
            </span>
          </div>
          {company.description && (
            <p className="mt-2 line-clamp-2 max-w-3xl text-base text-slate-500">
              {company.description}
            </p>
          )}
          <p className="mt-4 text-sm font-bold tracking-wide text-slate-500">目前購買模組</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {company.modules.length === 0 ? (
              <span className="text-base text-slate-400">尚未設定</span>
            ) : (
              company.modules.map((m) => (
                <span
                  key={m.id}
                  className="rounded-lg bg-brand-600 px-3.5 py-1.5 text-base font-semibold text-white shadow-sm"
                >
                  {m.name}
                </span>
              ))
            )}
          </div>
        </div>
      </section>

      {/* 8 項使用數據 */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {fields.map((f) => (
          <div key={f.label} className="rounded-xl bg-white px-5 py-4 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm font-bold tracking-wide text-slate-500">{f.label}</p>
            <p className="mt-1 truncate text-4xl font-bold tracking-tight text-slate-900">{f.value}</p>
          </div>
        ))}
      </section>

      {/* Issue ＋ 最新健檢未完成 */}
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900">
              <IconAlertTriangle className="h-6 w-6 text-rose-500" />
              未結案 Issue
            </h2>
            <span className="rounded-full bg-rose-50 px-4 py-1 text-2xl font-extrabold text-rose-600">
              {company.openIssueCount}
            </span>
          </div>
          {company.oldestIssues.length === 0 ? (
            <p className="flex items-center gap-2 text-base text-emerald-600">
              <IconCheckCircle className="h-5 w-5" />
              目前沒有未結案 issue
            </p>
          ) : (
            <>
              <p className="mb-2 text-xs font-bold tracking-wide text-slate-400">最久遠的 3 筆</p>
              <ul className="space-y-2.5">
                {company.oldestIssues.map((issue) => (
                  <li key={issue.id} className="rounded-lg border-l-4 border-l-rose-500 bg-rose-50/50 px-4 py-3">
                    <p className="line-clamp-2 text-lg font-semibold text-slate-900">{issue.title}</p>
                    <p className="mt-0.5 text-sm font-medium text-rose-600">已 {issue.ageDays} 天未結案</p>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-xl font-bold text-slate-900">最新健檢・未完成項目</h2>
          <p className="mb-4 mt-0.5 text-xs font-bold tracking-wide text-slate-400">
            {company.latestAssessment
              ? `${company.latestAssessment.assessedAt.toLocaleDateString("zh-TW")} 評比・權重由高到低前 3 名`
              : "尚無評比紀錄"}
          </p>
          {!company.latestAssessment ? (
            <p className="text-base text-slate-400">請到後台為這家公司建立第一次評比。</p>
          ) : company.topUnfinished.length === 0 ? (
            <p className="flex items-center gap-2 text-base text-emerald-600">
              <IconCheckCircle className="h-5 w-5" />
              最新評比所有項目皆已完成
            </p>
          ) : (
            <ul className="space-y-2.5">
              {company.topUnfinished.map((row) => (
                <li key={row.id} className="rounded-lg border-l-4 border-l-brand-600 bg-brand-50/60 px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <p className="line-clamp-2 text-lg font-semibold text-slate-900">{row.itemName}</p>
                    <span className="shrink-0 rounded-md bg-brand-600 px-2.5 py-0.5 text-sm font-bold text-white">
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
        </div>
      </section>
    </div>
  );
}
