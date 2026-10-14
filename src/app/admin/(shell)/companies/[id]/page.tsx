import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCompanyOverview } from "@/lib/company";
import { HEALTH_BAND_LABEL } from "@/lib/health";
import { liveStatFields } from "@/lib/liveStats";
import { SuccessToast } from "@/components/Toast";
import { Card, CardHeader } from "@/components/ui/Card";
import { HealthScore } from "@/components/ui/HealthScore";
import { Pill, type PillTone } from "@/components/ui/Pill";
import { IconAlertTriangle, IconCheckCircle } from "@/components/icons";

const PRIORITY: Record<string, { label: string; tone: PillTone }> = {
  high: { label: "高", tone: "red" },
  medium: { label: "中", tone: "amber" },
  low: { label: "低", tone: "slate" },
};

export default async function CompanyOverviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ success?: string }>;
}) {
  const { id } = await params;
  const { success } = await searchParams;

  const [overview, allModules] = await Promise.all([
    getCompanyOverview(id),
    prisma.module.findMany({ where: { isActive: true }, orderBy: { order: "asc" } }),
  ]);
  if (!overview) notFound();

  const purchased = new Set(overview.modules.map((m) => m.id));
  const bandTone: PillTone =
    overview.health.band === "healthy"
      ? "green"
      : overview.health.band === "atRisk"
        ? "amber"
        : overview.health.band === "critical"
          ? "red"
          : "slate";

  return (
    <div className="space-y-5">
      <SuccessToast message={success ?? null} />

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="p-6">
          <p className="text-xs font-semibold tracking-wide text-slate-500">目前健康度</p>
          <div className="mt-3 flex items-center gap-4">
            <HealthScore health={overview.health} size="xl" />
            <Pill tone={bandTone}>{HEALTH_BAND_LABEL[overview.health.band]}</Pill>
          </div>
          <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-600">
            {overview.health.formula}
          </p>
          <p className="mt-2 text-xs text-slate-400">點右上角的 ⓘ 可看完整計算邏輯</p>
        </Card>

        <Card className="p-6 lg:col-span-2">
          <p className="text-xs font-semibold tracking-wide text-slate-500">
            當時購買系統的痛點與需求
          </p>
          {overview.painPoints ? (
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
              {overview.painPoints}
            </p>
          ) : (
            <p className="mt-3 text-sm text-slate-400">
              尚未填寫。到「基本資料」補上當時的痛點與需求，之後做健檢與提案才有依據。
            </p>
          )}
          <Link
            href={`/admin/companies/${id}/edit`}
            className="mt-4 inline-block text-sm font-semibold text-brand-600 hover:text-brand-700"
          >
            編輯基本資料 →
          </Link>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="使用數據"
          description={
            overview.live.source === "mock"
              ? "目前為示意資料，串接客服系統 API 後會自動換成真實數據"
              : "來自客服系統 API"
          }
        />
        <div className="grid grid-cols-2 gap-3 p-5 md:grid-cols-4">
          {liveStatFields(overview.live.stats).map((f) => (
            <div key={f.label} className="rounded-lg bg-slate-50 px-4 py-3">
              <p className="text-xs font-bold text-slate-700">{f.label}</p>
              <p className="mt-1 truncate text-2xl font-semibold text-slate-800">{f.value}</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader title="購買模組" description="已購買的模組與可加購的模組" />
          <div className="divide-y divide-slate-100">
            {allModules.map((m) => (
              <div key={m.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{m.name}</p>
                  {m.description && <p className="text-xs text-slate-500">{m.description}</p>}
                </div>
                {purchased.has(m.id) ? (
                  <Pill tone="green">
                    <IconCheckCircle className="h-3.5 w-3.5" />
                    已購買
                  </Pill>
                ) : (
                  <Pill tone="slate">可加購</Pill>
                )}
              </div>
            ))}
            {allModules.length === 0 && (
              <p className="p-6 text-center text-sm text-slate-400">尚無模組</p>
            )}
          </div>
        </Card>

        <div className="space-y-5 lg:col-span-2">
          <Card>
            <CardHeader
              title="未結案 Issue"
              action={
                <Link
                  href={`/admin/companies/${id}/issues`}
                  className="text-sm font-semibold text-brand-600"
                >
                  全部 {overview.openIssueCount} 件 →
                </Link>
              }
            />
            {overview.oldestIssues.length === 0 ? (
              <p className="p-5 text-sm text-slate-400">目前沒有未結案 issue 🎉</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {overview.oldestIssues.map((issue) => (
                  <li key={issue.id} className="border-l-4 border-l-rose-500 px-4 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-900">{issue.title}</p>
                      <Pill tone={PRIORITY[issue.priority]?.tone ?? "slate"}>
                        {PRIORITY[issue.priority]?.label ?? issue.priority}
                      </Pill>
                    </div>
                    <p className="mt-0.5 text-xs text-rose-600">已 {issue.ageDays} 天未結案</p>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader
              title="最新健檢未完成項目"
              action={
                <Link
                  href={`/admin/companies/${id}/checklist`}
                  className="text-sm font-semibold text-brand-600"
                >
                  前往健檢 →
                </Link>
              }
            />
            {!overview.latestAssessment ? (
              <p className="p-5 text-sm text-slate-400">尚無評比紀錄。</p>
            ) : overview.topUnfinished.length === 0 ? (
              <p className="p-5 text-sm text-emerald-600">最新評比所有項目皆已完成。</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {overview.topUnfinished.map((row) => (
                  <li key={row.id} className="border-l-4 border-l-brand-600 px-4 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-900">{row.itemName}</p>
                      <Pill tone="blue">權重 {row.weight}</Pill>
                    </div>
                    {(row.actionNote ?? row.defaultAction) && (
                      <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">
                        <IconAlertTriangle className="mr-1 inline h-3 w-3 text-amber-500" />
                        {row.actionNote ?? row.defaultAction}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
