import Link from "next/link";
import { prisma } from "@/lib/db";
import { CompanyForm } from "@/components/CompanyForm";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { IconAlertTriangle, IconArrowLeft } from "@/components/icons";
import { createCompanyAction } from "../actions";

export default async function NewCompanyPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const [industries, modules] = await Promise.all([
    prisma.industry.findMany({ orderBy: [{ order: "asc" }, { name: "asc" }] }),
    prisma.module.findMany({ where: { isActive: true }, orderBy: [{ order: "asc" }] }),
  ]);

  return (
    <div className="max-w-3xl">
      <Link
        href="/admin/companies"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800"
      >
        <IconArrowLeft className="h-4 w-4" />
        返回公司管理
      </Link>
      <PageHeader title="新增公司" />

      {error && (
        <p className="mb-4 flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2.5 text-sm text-rose-600 ring-1 ring-inset ring-rose-100">
          <IconAlertTriangle className="h-4 w-4 shrink-0" />
          請填寫公司名稱並選擇行業別。
        </p>
      )}

      <Card className="p-6">
        <CompanyForm
          action={createCompanyAction}
          industries={industries}
          modules={modules}
          submitLabel="建立公司"
        />
      </Card>
    </div>
  );
}
