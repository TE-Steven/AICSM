import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { CompanyTabs } from "@/components/CompanyTabs";
import { Pill } from "@/components/ui/Pill";
import { IconArrowLeft } from "@/components/icons";

export default async function CompanyLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const company = await prisma.company.findUnique({
    where: { id },
    include: { industry: true },
  });
  if (!company) notFound();

  return (
    <div>
      <Link
        href="/admin/companies"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800"
      >
        <IconArrowLeft className="h-4 w-4" />
        返回公司管理
      </Link>

      <div className="mb-5">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">{company.name}</h1>
          <Pill tone="blue">{company.industry.name}</Pill>
        </div>
        {company.description && (
          <p className="mt-1.5 max-w-3xl text-sm text-slate-500">{company.description}</p>
        )}
      </div>

      <CompanyTabs companyId={id} />
      {children}
    </div>
  );
}
