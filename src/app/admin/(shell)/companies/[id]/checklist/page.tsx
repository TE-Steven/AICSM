import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { checklistLeaves, getCompanyChecklist } from "@/lib/company";
import { computeAssessmentStats } from "@/lib/assessment";
import { collectLeaves } from "@/lib/tree";
import { CheckItemEditor } from "@/components/CheckItemEditor";
import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";
import { SuccessToast } from "@/components/Toast";
import { Card, CardHeader } from "@/components/ui/Card";
import { HealthBar } from "@/components/ui/HealthBar";
import { btn, inputClass } from "@/components/ui/button";
import { IconAlertTriangle, IconPencil, IconTrash } from "@/components/icons";
import {
  createAssessmentAction,
  deleteAssessmentAction,
  createOwnItemAction,
  updateOwnItemAction,
  deleteOwnItemAction,
} from "./actions";

export default async function CompanyChecklistPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const { id } = await params;
  const { error, success } = await searchParams;

  const [company, checklist, assessments] = await Promise.all([
    prisma.company.findUnique({ where: { id }, include: { industry: true } }),
    getCompanyChecklist(id),
    prisma.assessment.findMany({
      where: { companyId: id },
      orderBy: { assessedAt: "desc" },
      include: { results: true },
    }),
  ]);
  if (!company || !checklist) notFound();

  const commonLeafCount = checklist.common.reduce((n, r) => n + collectLeaves(r).length, 0);
  const industryLeafCount = checklist.industry.reduce((n, r) => n + collectLeaves(r).length, 0);
  const ownLeafCount = checklist.own.reduce((n, r) => n + collectLeaves(r).length, 0);
  const totalLeaves = checklistLeaves(checklist).length;
  const today = new Date().toISOString().slice(0, 10);

  const commonIndustry = await prisma.industry.findFirst({ where: { isCommon: true } });

  return (
    <div className="space-y-5">
      <SuccessToast message={success ?? null} />

      {error && (
        <p className="flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2.5 text-sm text-rose-600 ring-1 ring-inset ring-rose-100">
          <IconAlertTriangle className="h-4 w-4 shrink-0" />
          請輸入項目名稱。
        </p>
      )}

      <Card>
        <CardHeader
          title="評比紀錄"
          description={`建立新評比時，會自動帶入目前適用的 ${totalLeaves} 個檢核點（通用 ${commonLeafCount}＋${company.industry.name} ${industryLeafCount}＋公司專屬 ${ownLeafCount}）並存成快照。`}
        />
        <form action={createAssessmentAction} className="grid gap-3 border-b border-slate-100 p-5 sm:grid-cols-[180px_1fr_auto]">
          <input type="hidden" name="companyId" value={id} />
          <input type="date" name="assessedAt" defaultValue={today} required className={inputClass} />
          <input name="note" placeholder="備註（選填）例如：Q4 例行健檢" className={inputClass} />
          <button type="submit" className={btn("primary")}>
            建立新評比
          </button>
        </form>

        {assessments.length === 0 ? (
          <p className="p-10 text-center text-sm text-slate-400">尚無評比紀錄，建立第一次評比開始健檢。</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {assessments.map((a) => {
              const stats = computeAssessmentStats(a.results);
              return (
                <div key={a.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-900">
                      {a.assessedAt.toLocaleDateString("zh-TW")}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">{a.note || "（無備註）"}</p>
                  </div>
                  <HealthBar score={stats.totalCount > 0 ? stats.score : null} />
                  <span className="w-20 text-right text-xs text-slate-500">
                    {stats.doneCount}/{stats.totalCount} 項
                  </span>
                  <Link href={`/admin/companies/${id}/checklist/${a.id}`} className={btn("secondary", "sm")}>
                    <IconPencil className="h-3.5 w-3.5" />
                    評比作業
                  </Link>
                  <form action={deleteAssessmentAction}>
                    <input type="hidden" name="id" value={a.id} />
                    <input type="hidden" name="companyId" value={id} />
                    <ConfirmSubmitButton
                      confirmMessage={`確定要刪除 ${a.assessedAt.toLocaleDateString("zh-TW")} 這次評比嗎？`}
                      className={btn("danger", "sm")}
                    >
                      <IconTrash className="h-3.5 w-3.5" />
                    </ConfirmSubmitButton>
                  </form>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Card>
        <CardHeader
          title="自動帶入的檢核項目"
          description="這些由行業別管理維護，所有同行業的公司共用；要調整請到對應的行業別。"
        />
        <div className="grid gap-3 p-5 sm:grid-cols-2">
          <div className="rounded-lg bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">通用</p>
            <p className="mt-0.5 text-xs text-slate-500">所有公司繼承・{commonLeafCount} 個檢核點</p>
            {commonIndustry && (
              <Link
                href={`/admin/industries/${commonIndustry.id}`}
                className="mt-2 inline-block text-xs font-semibold text-brand-600"
              >
                前往管理 →
              </Link>
            )}
          </div>
          <div className="rounded-lg bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">{company.industry.name}</p>
            <p className="mt-0.5 text-xs text-slate-500">所屬行業別・{industryLeafCount} 個檢核點</p>
            <Link
              href={`/admin/industries/${company.industryId}`}
              className="mt-2 inline-block text-xs font-semibold text-brand-600"
            >
              前往管理 →
            </Link>
          </div>
        </div>
      </Card>

      <div>
        <div className="mb-3">
          <h2 className="text-base font-semibold text-slate-900">公司專屬檢核項目</h2>
          <p className="text-sm text-slate-500">
            只屬於「{company.name}」的項目，會跟著自動帶入的項目一起出現在這家公司的評比裡。
          </p>
        </div>
        <CheckItemEditor
          nodes={checklist.own}
          scope={{ name: "companyId", value: id }}
          actions={{
            create: createOwnItemAction,
            update: updateOwnItemAction,
            remove: deleteOwnItemAction,
          }}
          emptyHint="尚無專屬項目。需要針對這家公司額外盤點的項目，可在上方新增。"
        />
      </div>
    </div>
  );
}
