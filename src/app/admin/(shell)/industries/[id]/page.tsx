import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { buildTree } from "@/lib/tree";
import { CheckItemEditor } from "@/components/CheckItemEditor";
import { SuccessToast } from "@/components/Toast";
import { Pill } from "@/components/ui/Pill";
import { PageHeader } from "@/components/ui/PageHeader";
import { IconAlertTriangle, IconArrowLeft } from "@/components/icons";
import {
  createCheckItemAction,
  updateCheckItemAction,
  deleteCheckItemAction,
} from "../actions";

export default async function IndustryDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const { id } = await params;
  const { error, success } = await searchParams;

  const industry = await prisma.industry.findUnique({ where: { id } });
  if (!industry) notFound();

  const items = await prisma.checkItem.findMany({ where: { industryId: id } });
  const tree = buildTree(items);

  return (
    <div className="max-w-4xl">
      <SuccessToast message={success ?? null} />
      <Link
        href="/admin/industries"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800"
      >
        <IconArrowLeft className="h-4 w-4" />
        返回行業別管理
      </Link>
      <PageHeader
        title={`${industry.name}・檢核項目`}
        badge={industry.isCommon ? <Pill tone="blue">所有公司繼承</Pill> : undefined}
        description={
          industry.isCommon
            ? "這裡的項目所有公司建立評比時都會自動帶入。結構為：構面 → 類別 → 檢核點，只有最底層的檢核點計分，依權重加總。"
            : "這個行業別的公司建立評比時，會自動帶入「通用」項目加上這裡的項目。結構為：構面 → 類別 → 檢核點，只有最底層的檢核點計分。"
        }
      />

      {error && (
        <p className="mb-4 flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2.5 text-sm text-rose-600 ring-1 ring-inset ring-rose-100">
          <IconAlertTriangle className="h-4 w-4 shrink-0" />
          請輸入項目名稱。
        </p>
      )}

      <CheckItemEditor
        nodes={tree}
        scope={{ name: "industryId", value: industry.id }}
        actions={{
          create: createCheckItemAction,
          update: updateCheckItemAction,
          remove: deleteCheckItemAction,
        }}
      />
    </div>
  );
}
