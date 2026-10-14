import Link from "next/link";
import { prisma } from "@/lib/db";
import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";
import { SuccessToast } from "@/components/Toast";
import { Card, CardHeader } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";
import { PageHeader } from "@/components/ui/PageHeader";
import { btn, inputClass } from "@/components/ui/button";
import { IconAlertTriangle, IconTrash } from "@/components/icons";
import { createIndustryAction, updateIndustryAction, deleteIndustryAction } from "./actions";

export default async function IndustriesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; name?: string; count?: string; success?: string }>;
}) {
  const { error, name, count, success } = await searchParams;

  const [industries, leafCounts] = await Promise.all([
    prisma.industry.findMany({
      orderBy: [{ isCommon: "desc" }, { order: "asc" }, { name: "asc" }],
      include: { _count: { select: { companies: true } } },
    }),
    // 每個行業的檢核點（葉節點）數：沒有子項目的項目
    prisma.checkItem.findMany({
      where: { children: { none: {} } },
      select: { industryId: true },
    }),
  ]);
  const leafCountByIndustry = new Map<string, number>();
  for (const row of leafCounts) {
    leafCountByIndustry.set(row.industryId, (leafCountByIndustry.get(row.industryId) ?? 0) + 1);
  }

  const errorMessage =
    error === "inuse"
      ? `「${name}」目前仍有 ${count} 家公司使用中，請先把這些公司改成其他行業別再刪除。`
      : error === "common"
        ? "「通用」是內建行業（所有公司共用的檢核項目），不能刪除。"
        : error === "dup"
          ? `已經有「${name}」這個行業別了。`
          : error
            ? "請輸入行業別名稱。"
            : null;

  return (
    <div className="max-w-4xl">
      <SuccessToast message={success ?? null} />
      <PageHeader
        title="行業別管理"
        description="每個行業別維護自己的多層檢核項目與權重；「通用」行業的項目所有公司都會自動套用。"
      />

      {errorMessage && (
        <p className="mb-4 flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2.5 text-sm text-rose-600 ring-1 ring-inset ring-rose-100">
          <IconAlertTriangle className="h-4 w-4 shrink-0" />
          {errorMessage}
        </p>
      )}

      <Card className="mb-5">
        <CardHeader title="新增行業別" />
        <form action={createIndustryAction} className="flex flex-wrap gap-2 p-5">
          <input
            name="name"
            placeholder="例如：餐飲連鎖"
            required
            className={`${inputClass} max-w-xs`}
          />
          <button type="submit" className={btn("primary")}>
            新增
          </button>
        </form>
      </Card>

      <Card>
        <CardHeader title={`行業別清單（${industries.length}）`} />
        {industries.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-400">
            尚無行業別。到「總覽」按「初始化基礎資料」可一次建立常用行業與健檢項目。
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {industries.map((industry) => (
              <div key={industry.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                <form
                  action={updateIndustryAction}
                  className="flex min-w-0 flex-1 items-center gap-2"
                >
                  <input type="hidden" name="id" value={industry.id} />
                  <input
                    name="name"
                    defaultValue={industry.name}
                    required
                    className={`${inputClass} max-w-xs`}
                  />
                  <button type="submit" className={btn("secondary", "sm")}>
                    儲存
                  </button>
                  {industry.isCommon && <Pill tone="blue">內建・所有公司繼承</Pill>}
                </form>
                <span className="shrink-0 text-xs text-slate-400">
                  {leafCountByIndustry.get(industry.id) ?? 0} 個檢核點・{industry._count.companies} 家公司
                </span>
                <Link href={`/admin/industries/${industry.id}`} className={btn("primary", "sm")}>
                  管理檢核項目
                </Link>
                {!industry.isCommon && (
                  <form action={deleteIndustryAction}>
                    <input type="hidden" name="id" value={industry.id} />
                    <ConfirmSubmitButton
                      confirmMessage={`確定要刪除行業別「${industry.name}」嗎？其下所有檢核項目會一併刪除。`}
                      className={btn("danger", "sm")}
                    >
                      <IconTrash className="h-3.5 w-3.5" />
                      刪除
                    </ConfirmSubmitButton>
                  </form>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
