"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { withSuccess } from "@/lib/toast";

const BASE = "/admin/modules";

export async function createModuleAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  if (!name) redirect(`${BASE}?error=1`);

  const exists = await prisma.module.findUnique({ where: { name } });
  if (exists) redirect(`${BASE}?error=dup&name=${encodeURIComponent(name)}`);

  const order = await prisma.module.count();
  await prisma.module.create({ data: { name, description, order } });

  revalidatePath(BASE);
  redirect(withSuccess(BASE, `已新增模組「${name}」`));
}

export async function updateModuleAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const isActive = formData.get("isActive") === "on";
  if (!name) redirect(`${BASE}?error=1`);

  const clash = await prisma.module.findFirst({ where: { name, NOT: { id } } });
  if (clash) redirect(`${BASE}?error=dup&name=${encodeURIComponent(name)}`);

  await prisma.module.update({ where: { id }, data: { name, description, isActive } });

  revalidatePath(BASE);
  redirect(withSuccess(BASE, `已儲存模組「${name}」`));
}

export async function deleteModuleAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const existing = await prisma.module.findUnique({ where: { id } });
  await prisma.module.delete({ where: { id } });

  revalidatePath(BASE);
  revalidatePath("/admin/companies");
  redirect(withSuccess(BASE, `已刪除模組「${existing?.name ?? ""}」`));
}
