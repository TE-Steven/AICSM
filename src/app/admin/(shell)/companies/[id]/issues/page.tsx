import Link from "next/link";
import { prisma } from "@/lib/db";
import { ageInDays } from "@/lib/company";
import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";
import { SuccessToast } from "@/components/Toast";
import { Card, CardHeader } from "@/components/ui/Card";
import { Pill, type PillTone } from "@/components/ui/Pill";
import { btn, inputClass } from "@/components/ui/button";
import { IconAlertTriangle, IconTrash } from "@/components/icons";
import { createIssueAction, updateIssueAction, deleteIssueAction } from "./actions";

const STATUS_LABEL: Record<string, string> = {
  open: "待處理",
  in_progress: "處理中",
  resolved: "已解決",
};
const STATUS_TONE: Record<string, PillTone> = {
  open: "red",
  in_progress: "amber",
  resolved: "green",
};
const PRIORITY_LABEL: Record<string, string> = { high: "高", medium: "中", low: "低" };
const PRIORITY_TONE: Record<string, PillTone> = { high: "red", medium: "amber", low: "slate" };

export default async function IssuesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ status?: string; error?: string; success?: string }>;
}) {
  const { id } = await params;
  const { status, error, success } = await searchParams;

  const issues = await prisma.issue.findMany({
    where: { companyId: id, ...(status ? { status } : {}) },
    orderBy: [{ occurredAt: "asc" }],
  });

  const filters = [
    { key: "", label: "全部" },
    { key: "open", label: "待處理" },
    { key: "in_progress", label: "處理中" },
    { key: "resolved", label: "已解決" },
  ];

  return (
    <div className="space-y-5">
      <SuccessToast message={success ?? null} />

      {error && (
        <p className="flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2.5 text-sm text-rose-600 ring-1 ring-inset ring-rose-100">
          <IconAlertTriangle className="h-4 w-4 shrink-0" />
          請輸入 issue 標題。
        </p>
      )}

      <Card>
        <CardHeader
          title="新增 Issue"
          description="之後也可以由外部系統 API 自動匯入；這裡可以手動補登。"
        />
        <form action={createIssueAction} className="grid gap-3 p-5 sm:grid-cols-6">
          <input type="hidden" name="companyId" value={id} />
          <input
            name="title"
            placeholder="Issue 標題"
            required
            className={`${inputClass} sm:col-span-3`}
          />
          <select name="priority" defaultValue="medium" className={`${inputClass} sm:col-span-1`}>
            <option value="high">優先度：高</option>
            <option value="medium">優先度：中</option>
            <option value="low">優先度：低</option>
          </select>
          <input
            name="occurredAt"
            type="date"
            title="發生日期（空白＝今天）"
            className={`${inputClass} sm:col-span-2`}
          />
          <input
            name="description"
            placeholder="說明（選填）"
            className={`${inputClass} sm:col-span-5`}
          />
          <button type="submit" className={`${btn("primary")} sm:col-span-1`}>
            新增
          </button>
        </form>
      </Card>

      <Card>
        <CardHeader
          title={`Issue 清單（${issues.length}）`}
          description="依發生時間由舊到新排列，最久遠的在最上面"
          action={
            <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
              {filters.map((f) => (
                <Link
                  key={f.key}
                  href={f.key ? `/admin/companies/${id}/issues?status=${f.key}` : `/admin/companies/${id}/issues`}
                  className={`rounded-md px-3 py-1 text-xs font-semibold transition ${
                    (status ?? "") === f.key
                      ? "bg-white text-brand-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {f.label}
                </Link>
              ))}
            </div>
          }
        />
        {issues.length === 0 ? (
          <p className="p-10 text-center text-sm text-slate-400">沒有符合條件的 issue。</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {issues.map((issue) => {
              const ageDays = ageInDays(issue.occurredAt);
              return (
                <div key={issue.id} className="flex flex-wrap items-start gap-3 px-5 py-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900">{issue.title}</p>
                      <Pill tone={STATUS_TONE[issue.status] ?? "slate"}>
                        {STATUS_LABEL[issue.status] ?? issue.status}
                      </Pill>
                      <Pill tone={PRIORITY_TONE[issue.priority] ?? "slate"}>
                        優先度 {PRIORITY_LABEL[issue.priority] ?? issue.priority}
                      </Pill>
                      {issue.source === "api" && <Pill tone="blue">API 匯入</Pill>}
                    </div>
                    {issue.description && (
                      <p className="mt-1 text-sm text-slate-500">{issue.description}</p>
                    )}
                    <p className="mt-1 text-xs text-slate-400">
                      發生於 {issue.occurredAt.toLocaleDateString("zh-TW")}
                      {issue.status !== "resolved" && `・已 ${ageDays} 天`}
                      {issue.resolvedAt && `・${issue.resolvedAt.toLocaleDateString("zh-TW")} 解決`}
                    </p>
                  </div>
                  <form action={updateIssueAction} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={issue.id} />
                    <input type="hidden" name="companyId" value={id} />
                    <select name="status" defaultValue={issue.status} className={`${inputClass} w-28 py-1.5`}>
                      <option value="open">待處理</option>
                      <option value="in_progress">處理中</option>
                      <option value="resolved">已解決</option>
                    </select>
                    <select name="priority" defaultValue={issue.priority} className={`${inputClass} w-24 py-1.5`}>
                      <option value="high">高</option>
                      <option value="medium">中</option>
                      <option value="low">低</option>
                    </select>
                    <button type="submit" className={btn("secondary", "sm")}>
                      更新
                    </button>
                  </form>
                  <form action={deleteIssueAction}>
                    <input type="hidden" name="id" value={issue.id} />
                    <input type="hidden" name="companyId" value={id} />
                    <ConfirmSubmitButton
                      confirmMessage={`確定要刪除 issue「${issue.title}」嗎？`}
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
    </div>
  );
}
