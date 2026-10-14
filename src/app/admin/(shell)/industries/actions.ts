"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { withSuccess } from "@/lib/toast";

const BASE = "/admin/industries";

export async function createIndustryAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) redirect(`${BASE}?error=1`);

  const exists = await prisma.industry.findUnique({ where: { name } });
  if (exists) redirect(`${BASE}?error=dup&name=${encodeURIComponent(name)}`);

  const order = await prisma.industry.count();
  await prisma.industry.create({ data: { name, order } });

  revalidatePath(BASE);
  redirect(withSuccess(BASE, `已新增行業別「${name}」`));
}

export async function updateIndustryAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!name) redirect(`${BASE}?error=1`);

  const clash = await prisma.industry.findFirst({ where: { name, NOT: { id } } });
  if (clash) redirect(`${BASE}?error=dup&name=${encodeURIComponent(name)}`);

  await prisma.industry.update({ where: { id }, data: { name } });

  revalidatePath(BASE);
  redirect(withSuccess(BASE, `已儲存行業別「${name}」`));
}

export async function deleteIndustryAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const industry = await prisma.industry.findUnique({
    where: { id },
    include: { _count: { select: { companies: true } } },
  });
  if (!industry) redirect(BASE);

  if (industry.isCommon) redirect(`${BASE}?error=common`);
  if (industry._count.companies > 0) {
    redirect(
      `${BASE}?error=inuse&name=${encodeURIComponent(industry.name)}&count=${industry._count.companies}`
    );
  }

  await prisma.industry.delete({ where: { id } });

  revalidatePath(BASE);
  redirect(withSuccess(BASE, `已刪除行業別「${industry.name}」`));
}

// ---------- 行業別檢核項目（多層樹） ----------

function parseItem(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const defaultAction = String(formData.get("defaultAction") ?? "").trim() || null;
  const weightRaw = Number(formData.get("weight") ?? 1);
  const weight = Number.isFinite(weightRaw) && weightRaw > 0 ? weightRaw : 1;
  return { name, description, defaultAction, weight };
}

export async function createCheckItemAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const industryId = String(formData.get("industryId") ?? "");
  const parentId = String(formData.get("parentId") ?? "").trim() || null;
  const fields = parseItem(formData);
  const back = `${BASE}/${industryId}`;
  if (!fields.name) redirect(`${back}?error=1`);

  const order = await prisma.checkItem.count({ where: { industryId, parentId } });
  await prisma.checkItem.create({ data: { ...fields, industryId, parentId, order } });

  revalidatePath(back);
  redirect(withSuccess(back, `已新增「${fields.name}」`));
}

export async function updateCheckItemAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const industryId = String(formData.get("industryId") ?? "");
  const fields = parseItem(formData);
  const back = `${BASE}/${industryId}`;
  if (!fields.name) redirect(`${back}?error=1`);

  await prisma.checkItem.update({ where: { id }, data: fields });

  revalidatePath(back);
  redirect(withSuccess(back, `已儲存「${fields.name}」`));
}

export async function deleteCheckItemAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const industryId = String(formData.get("industryId") ?? "");
  const item = await prisma.checkItem.findUnique({ where: { id } });
  await prisma.checkItem.delete({ where: { id } });

  const back = `${BASE}/${industryId}`;
  revalidatePath(back);
  redirect(withSuccess(back, `已刪除「${item?.name ?? "檢核項目"}」`));
}
