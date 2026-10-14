"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { checklistLeaves, getCompanyChecklist } from "@/lib/company";
import { PATH_SEPARATOR } from "@/lib/tree";
import { withSuccess } from "@/lib/toast";

function back(companyId: string) {
  return `/admin/companies/${companyId}/checklist`;
}

function refresh(companyId: string) {
  revalidatePath(back(companyId));
  revalidatePath(`/admin/companies/${companyId}`);
  revalidatePath("/admin/companies");
  revalidatePath("/tv");
}

// ---------- 公司專屬檢核項目 ----------

function parseItem(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const defaultAction = String(formData.get("defaultAction") ?? "").trim() || null;
  const weightRaw = Number(formData.get("weight") ?? 1);
  const weight = Number.isFinite(weightRaw) && weightRaw > 0 ? weightRaw : 1;
  return { name, description, defaultAction, weight };
}

export async function createOwnItemAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const companyId = String(formData.get("companyId") ?? "");
  const parentId = String(formData.get("parentId") ?? "").trim() || null;
  const fields = parseItem(formData);
  if (!fields.name) redirect(`${back(companyId)}?error=1`);

  const order = await prisma.companyCheckItem.count({ where: { companyId, parentId } });
  await prisma.companyCheckItem.create({ data: { ...fields, companyId, parentId, order } });

  refresh(companyId);
  redirect(withSuccess(back(companyId), `已新增專屬項目「${fields.name}」`));
}

export async function updateOwnItemAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const companyId = String(formData.get("companyId") ?? "");
  const fields = parseItem(formData);
  if (!fields.name) redirect(`${back(companyId)}?error=1`);

  await prisma.companyCheckItem.update({ where: { id }, data: fields });

  refresh(companyId);
  redirect(withSuccess(back(companyId), `已儲存「${fields.name}」`));
}

export async function deleteOwnItemAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const companyId = String(formData.get("companyId") ?? "");
  const item = await prisma.companyCheckItem.findUnique({ where: { id } });
  await prisma.companyCheckItem.delete({ where: { id } });

  refresh(companyId);
  redirect(withSuccess(back(companyId), `已刪除「${item?.name ?? "專屬項目"}」`));
}

// ---------- 評比 ----------

function parseDate(raw: string): Date {
  if (!raw) return new Date();
  const date = new Date(`${raw}T12:00:00`);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

/** 建立評比：把「通用＋行業別＋公司專屬」目前的項目拍成快照存進這次評比。 */
export async function createAssessmentAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const companyId = String(formData.get("companyId") ?? "");
  const assessedAt = parseDate(String(formData.get("assessedAt") ?? ""));
  const note = String(formData.get("note") ?? "").trim() || null;

  const checklist = await getCompanyChecklist(companyId);
  if (!checklist) redirect("/admin/companies");
  const leaves = checklistLeaves(checklist);

  const assessment = await prisma.assessment.create({
    data: { companyId, assessedAt, note },
  });

  if (leaves.length) {
    await prisma.assessmentResult.createMany({
      data: leaves.map((leaf, index) => ({
        assessmentId: assessment.id,
        itemName: leaf.name,
        pathLabel: leaf.pathNames.join(PATH_SEPARATOR),
        description: leaf.description,
        defaultAction: leaf.defaultAction,
        weight: leaf.weight,
        sortOrder: index,
        done: false,
        actionNote: leaf.defaultAction,
      })),
    });
  }

  refresh(companyId);
  redirect(
    withSuccess(`${back(companyId)}/${assessment.id}`, `已建立評比（共 ${leaves.length} 個檢核點）`)
  );
}

export async function saveAssessmentAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const assessmentId = String(formData.get("assessmentId") ?? "");
  const companyId = String(formData.get("companyId") ?? "");
  const assessedAt = parseDate(String(formData.get("assessedAt") ?? ""));
  const note = String(formData.get("note") ?? "").trim() || null;

  const results = await prisma.assessmentResult.findMany({ where: { assessmentId } });

  await prisma.$transaction([
    prisma.assessment.update({ where: { id: assessmentId }, data: { assessedAt, note } }),
    ...results.map((result) =>
      prisma.assessmentResult.update({
        where: { id: result.id },
        data: {
          done: formData.get(`done_${result.id}`) === "on",
          actionNote: String(formData.get(`action_${result.id}`) ?? "").trim() || null,
        },
      })
    ),
  ]);

  refresh(companyId);
  redirect(withSuccess(`${back(companyId)}/${assessmentId}`, "已儲存評比"));
}

export async function deleteAssessmentAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const companyId = String(formData.get("companyId") ?? "");
  await prisma.assessment.delete({ where: { id } });

  refresh(companyId);
  redirect(withSuccess(back(companyId), "已刪除評比紀錄"));
}
