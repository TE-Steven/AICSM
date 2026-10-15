import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCompanyOverviews } from "@/lib/company";
import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";
import { SuccessToast } from "@/components/Toast";
import { TvLaunchButton } from "@/components/TvLaunchButton";
import { Card, CardHeader } from "@/components/ui/Card";
import { HealthBar } from "@/components/ui/HealthBar";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pill } from "@/components/ui/Pill";
import { StatCard } from "@/components/ui/StatCard";
import { btn } from "@/components/ui/button";
import { IconAlertTriangle, IconBuilding, IconPlay } from "@/components/icons";
import { seedAicsmAction } from "./actions";

export default async function AdminHomePage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  const { success } = await searchParams;

  const [companies, modules] = await Promise.all([
    getCompanyOverviews(),
    prisma.module.findMany({ where: { isActive: true }, orderBy: { order: "asc" } }),
  ]);

  const scored = companies.filter((c) => c.health.score !== null);
  const avg = scored.length
    ? Math.round(scored.reduce((s, c) => s + (c.health.score ?? 0), 0) / scored.length)
    : null;
  const critical = companies.filter((c) => c.health.band === "critical").length;
  const openIssues = companies.reduce((s, c) => s + c.openIssueCount, 0);

  const needAttention = [...scored]
    .sort((a, b) => (a.health.score ?? 0) - (b.health.score ?? 0))
    .slice(0, 5);

  const oldestIssues = companies
    .flatMap((c) => c.oldestIssues.map((i) => ({ ...i, companyId: c.id, companyName: c.name })))
    .sort((a, b) => b.ageDays - a.ageDays)
    .slice(0, 5);

  const moduleAdoption = modules.map((m) => ({
    id: m.id,
    name: m.name,
    count: companies.filter((c) => c.modules.some((cm) => cm.id === m.id)).length,
  }));

  return (
    <div>
      <SuccessToast message={success ?? null} />
      <PageHeader
        title="總覽"
        description="所有客戶公司的健康度、未結案 issue 與模組採用概況"
        actions={
          <TvLaunchButton
            companies={companies.map((c) => ({ id: c.id, name: c.name }))}
            className={btn("primary")}
          >
            <IconPlay className="h-4 w-4" />
            播放電視牆
          </TvLaunchButton>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="客戶公司數" value={companies.length} icon={<IconBuilding className="h-5 w-5" />} />
        <StatCard label="平均健康度" value={avg ?? "—"} hint="使用數據＋健檢＋issue" />
        <StatCard
          label="危急公司"
          value={critical}
          accent={critical > 0 ? "border-l-rose-500" : undefined}
          hint="健康度低於 50"
        />
        <StatCard
          label="未結案 Issue"
          value={openIssues}
          icon={<IconAlertTriangle className="h-5 w-5" />}
          accent={openIssues > 0 ? "border-l-amber-500" : undefined}
        />
      </div>

      <div className="mb-6 grid gap-5 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader
            title="最需要關注的公司"
            description="健康度由低到高前 5 名"
            action={
              <Link href="/admin/companies" className="text-sm font-semibold text-brand-600">
                全部公司 →
              </Link>
            }
          />
          {needAttention.length === 0 ? (
            <p className="p-8 text-center text-sm text-slate-400">尚無資料。</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {needAttention.map((c) => (
                <Link
                  key={c.id}
                  href={`/admin/companies/${c.id}`}
                  className="flex items-center gap-4 px-5 py-3 transition hover:bg-slate-50"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-sm font-bold text-brand-700">
                    {c.name.slice(0, 1)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">{c.name}</p>
                    <p className="text-xs text-slate-400">{c.industry.name}</p>
                  </div>
                  {c.openIssueCount > 0 && (
                    <Pill tone="amber">{c.openIssueCount} 件 issue</Pill>
                  )}
                  <HealthBar score={c.health.score} />
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="最久未結案 Issue" description="跨公司最久遠的 5 件" />
          {oldestIssues.length === 0 ? (
            <p className="p-8 text-center text-sm text-slate-400">目前沒有未結案 issue 🎉</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {oldestIssues.map((i) => (
                <li key={i.id} className="border-l-4 border-l-rose-500 px-4 py-3">
                  <Link href={`/admin/companies/${i.companyId}/issues`} className="block">
                    <p className="text-sm font-semibold text-slate-900">{i.title}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {i.companyName}・<span className="text-rose-600">已 {i.ageDays} 天</span>
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader title="模組採用概況" description="每個模組有幾家公司購買" />
          <div className="space-y-4 p-5">
            {moduleAdoption.length === 0 ? (
              <p className="text-sm text-slate-400">尚無模組。</p>
            ) : (
              moduleAdoption.map((m) => (
                <div key={m.id}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700">{m.name}</span>
                    <span className="text-xs text-slate-500">
                      {m.count} / {companies.length} 家
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-brand-600"
                      style={{
                        width: `${companies.length ? (m.count / companies.length) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="系統維護" />
          <div className="space-y-3 p-5">
            <p className="text-sm text-slate-500">
              一次補齊行業別、5 個產品模組、現有客戶公司，以及各行業的健檢項目（三層、含權重與 Action）。
              只會補缺的，不會覆蓋或刪除你已經改過的資料，可以重複按。
            </p>
            <form action={seedAicsmAction}>
              <ConfirmSubmitButton
                confirmMessage="要初始化基礎資料嗎？只會補上缺少的項目，不會覆蓋既有資料。"
                className={btn("secondary")}
              >
                初始化基礎資料
              </ConfirmSubmitButton>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
}
