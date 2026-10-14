"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { withSuccess } from "@/lib/toast";

const BASE = "/admin/companies";

function parseCompany(formData: FormData) {
  return {
    name: String(formData.get("name") ?? "").trim(),
    industryId: String(formData.get("industryId") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim() || null,
    painPoints: String(formData.get("painPoints") ?? "").trim() || null,
    externalId: String(formData.get("externalId") ?? "").trim() || null,
    moduleIds: formData.getAll("moduleIds").map(String),
  };
}

export async function createCompanyAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const { moduleIds, ...fields } = parseCompany(formData);
  if (!fields.name || !fields.industryId) redirect(`${BASE}/new?error=1`);

  const company = await prisma.company.create({ data: fields });
  if (moduleIds.length) {
    await prisma.companyModule.createMany({
      data: moduleIds.map((moduleId) => ({ companyId: company.id, moduleId })),
    });
  }

  revalidatePath(BASE);
  redirect(withSuccess(`${BASE}/${company.id}`, `已建立公司「${company.name}」`));
}

export async function updateCompanyAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const { moduleIds, ...fields } = parseCompany(formData);
  const back = `${BASE}/${id}/edit`;
  if (!fields.name || !fields.industryId) redirect(`${back}?error=1`);

  await prisma.$transaction([
    prisma.company.update({ where: { id }, data: fields }),
    prisma.companyModule.deleteMany({
      where: { companyId: id, moduleId: { notIn: moduleIds } },
    }),
  ]);
  // 只補新增的，保留既有模組的購買時間
  await prisma.companyModule.createMany({
    data: moduleIds.map((moduleId) => ({ companyId: id, moduleId })),
    skipDuplicates: true,
  });

  revalidatePath(BASE);
  revalidatePath(`${BASE}/${id}`);
  redirect(withSuccess(back, "已儲存公司資料"));
}

export async function deleteCompanyAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const company = await prisma.company.findUnique({ where: { id } });
  await prisma.company.delete({ where: { id } });

  revalidatePath(BASE);
  redirect(withSuccess(BASE, `已刪除公司「${company?.name ?? ""}」`));
}
