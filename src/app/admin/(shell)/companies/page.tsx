import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCompanyOverviews } from "@/lib/company";
import { HEALTH_BAND_LABEL, healthBand, type HealthBand } from "@/lib/health";
import { SuccessToast } from "@/components/Toast";
import { Card } from "@/components/ui/Card";
import { HealthBar } from "@/components/ui/HealthBar";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pill, type PillTone } from "@/components/ui/Pill";
import { StatCard } from "@/components/ui/StatCard";
import { btn, inputClass } from "@/components/ui/button";
import { IconAlertTriangle, IconBuilding, IconPlus } from "@/components/icons";

const BAND_TONE: Record<HealthBand, PillTone> = {
  healthy: "green",
  atRisk: "amber",
  critical: "red",
  none: "slate",
};

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: Promise<{ industry?: string; band?: string; success?: string }>;
}) {
  const { industry, band, success } = await searchParams;

  const [overviews, industries] = await Promise.all([
    getCompanyOverviews(),
    prisma.industry.findMany({
      where: { isCommon: false },
      orderBy: [{ order: "asc" }, { name: "asc" }],
    }),
  ]);

  const filtered = overviews.filter(
    (c) =>
      (!industry || c.industry.id === industry) && (!band || c.health.band === (band as HealthBand))
  );

  const scored = overviews.filter((c) => c.health.score !== null);
  const avg = scored.length
    ? Math.round(scored.reduce((sum, c) => sum + (c.health.score ?? 0), 0) / scored.length)
    : null;
  const critical = overviews.filter((c) => c.health.band === "critical").length;
  const atRisk = overviews.filter((c) => c.health.band === "atRisk").length;
  const openIssues = overviews.reduce((sum, c) => sum + c.openIssueCount, 0);

  return (
    <div>
      <SuccessToast message={success ?? null} />
      <PageHeader
        title="公司管理"
        description={`目前管理 ${overviews.length} 家客戶公司`}
        actions={
          <Link href="/admin/companies/new" className={btn("primary")}>
            <IconPlus className="h-4 w-4" />
            新增公司
          </Link>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="客戶公司數" value={overviews.length} icon={<IconBuilding className="h-5 w-5" />} />
        <StatCard label="平均健康度" value={avg ?? "—"} hint="含使用數據、健檢、issue" />
        <StatCard
          label="風險／危急公司"
          value={`${atRisk} / ${critical}`}
          accent={critical > 0 ? "border-l-rose-500" : undefined}
          hint="健康度 <80 風險、<50 危急"
        />
        <StatCard
          label="未結案 Issue"
          value={openIssues}
          icon={<IconAlertTriangle className="h-5 w-5" />}
          accent={openIssues > 0 ? "border-l-amber-500" : undefined}
        />
      </div>

      <Card className="mb-4 p-4">
        <form method="GET" className="flex flex-wrap items-center gap-3">
          <select name="industry" defaultValue={industry ?? ""} className={`${inputClass} max-w-[200px]`}>
            <option value="">所有行業別</option>
            {industries.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </select>
          <select name="band" defaultValue={band ?? ""} className={`${inputClass} max-w-[200px]`}>
            <option value="">所有健康狀態</option>
            {(["healthy", "atRisk", "critical"] as const).map((b) => (
              <option key={b} value={b}>
                {HEALTH_BAND_LABEL[b]}
              </option>
            ))}
          </select>
          <button type="submit" className={btn("secondary")}>
            套用篩選
          </button>
          {(industry || band) && (
            <Link href="/admin/companies" className="text-sm text-slate-500 hover:text-slate-800">
              清除
            </Link>
          )}
        </form>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">公司</th>
                <th className="px-3 py-3">行業別</th>
                <th className="px-3 py-3">購買模組</th>
                <th className="px-3 py-3">健康度</th>
                <th className="px-3 py-3">未結 Issue</th>
                <th className="px-3 py-3">最新評比</th>
                <th className="px-5 py-3">狀態</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((c) => (
                <tr key={c.id} className="transition hover:bg-slate-50/70">
                  <td className="px-5 py-3">
                    <Link href={`/admin/companies/${c.id}`} className="flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-sm font-bold text-brand-700">
                        {c.name.slice(0, 1)}
                      </span>
                      <span className="font-semibold text-slate-900 hover:text-brand-600">
                        {c.name}
                      </span>
                    </Link>
                  </td>
                  <td className="px-3 py-3 text-slate-600">{c.industry.name}</td>
                  <td className="px-3 py-3">
                    {c.modules.length === 0 ? (
                      <span className="text-xs text-slate-400">尚未設定</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {c.modules.map((m) => (
                          <Pill key={m.id} tone="blue">
                            {m.name}
                          </Pill>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <HealthBar score={c.health.score} />
                  </td>
                  <td className="px-3 py-3">
                    {c.openIssueCount > 0 ? (
                      <span className="font-semibold text-amber-600">{c.openIssueCount} 件</span>
                    ) : (
                      <span className="text-slate-400">0</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-xs text-slate-500">
                    {c.latestAssessment
                      ? c.latestAssessment.assessedAt.toLocaleDateString("zh-TW")
                      : "尚無"}
                  </td>
                  <td className="px-5 py-3">
                    <Pill tone={BAND_TONE[healthBand(c.health.score)]}>
                      {HEALTH_BAND_LABEL[c.health.band]}
                    </Pill>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-sm text-slate-400">
                    {overviews.length === 0
                      ? "尚無公司。可到「總覽」按「初始化基礎資料」匯入現有客戶，或按「新增公司」。"
                      : "沒有符合條件的公司。"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
