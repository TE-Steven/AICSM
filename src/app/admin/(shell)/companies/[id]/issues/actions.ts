"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { withSuccess } from "@/lib/toast";

const STATUSES = ["open", "in_progress", "resolved"];
const PRIORITIES = ["low", "medium", "high"];

function back(companyId: string) {
  return `/admin/companies/${companyId}/issues`;
}

function refresh(companyId: string) {
  revalidatePath(back(companyId));
  revalidatePath(`/admin/companies/${companyId}`);
  revalidatePath("/admin/companies");
  revalidatePath("/tv");
}

export async function createIssueAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const companyId = String(formData.get("companyId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const priorityRaw = String(formData.get("priority") ?? "medium");
  const priority = PRIORITIES.includes(priorityRaw) ? priorityRaw : "medium";
  const occurredRaw = String(formData.get("occurredAt") ?? "");
  const occurredAt = occurredRaw ? new Date(occurredRaw) : new Date();
  if (!title) redirect(`${back(companyId)}?error=1`);

  await prisma.issue.create({
    data: {
      companyId,
      title,
      description,
      priority,
      occurredAt: Number.isNaN(occurredAt.getTime()) ? new Date() : occurredAt,
    },
  });

  refresh(companyId);
  redirect(withSuccess(back(companyId), `已新增 issue「${title}」`));
}

export async function updateIssueAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const companyId = String(formData.get("companyId") ?? "");
  const statusRaw = String(formData.get("status") ?? "open");
  const status = STATUSES.includes(statusRaw) ? statusRaw : "open";
  const priorityRaw = String(formData.get("priority") ?? "medium");
  const priority = PRIORITIES.includes(priorityRaw) ? priorityRaw : "medium";

  await prisma.issue.update({
    where: { id },
    data: {
      status,
      priority,
      resolvedAt: status === "resolved" ? new Date() : null,
    },
  });

  refresh(companyId);
  redirect(withSuccess(back(companyId), "已更新 issue"));
}

export async function deleteIssueAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const companyId = String(formData.get("companyId") ?? "");
  await prisma.issue.delete({ where: { id } });

  refresh(companyId);
  redirect(withSuccess(back(companyId), "已刪除 issue"));
}
