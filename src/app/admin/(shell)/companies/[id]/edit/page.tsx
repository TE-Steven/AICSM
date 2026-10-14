import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { CompanyForm } from "@/components/CompanyForm";
import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";
import { SuccessToast } from "@/components/Toast";
import { Card } from "@/components/ui/Card";
import { btn } from "@/components/ui/button";
import { IconAlertTriangle, IconTrash } from "@/components/icons";
import { updateCompanyAction, deleteCompanyAction } from "../../actions";

export default async function EditCompanyPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const { id } = await params;
  const { error, success } = await searchParams;

  const company = await prisma.company.findUnique({
    where: { id },
    include: { modules: true },
  });
  if (!company) notFound();

  const [industries, modules] = await Promise.all([
    prisma.industry.findMany({ orderBy: [{ order: "asc" }, { name: "asc" }] }),
    prisma.module.findMany({ orderBy: [{ order: "asc" }] }),
  ]);

  return (
    <div className="max-w-3xl space-y-5">
      <SuccessToast message={success ?? null} />

      {error && (
        <p className="flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2.5 text-sm text-rose-600 ring-1 ring-inset ring-rose-100">
          <IconAlertTriangle className="h-4 w-4 shrink-0" />
          請填寫公司名稱並選擇行業別。
        </p>
      )}

      <Card className="p-6">
        <CompanyForm
          action={updateCompanyAction}
          industries={industries}
          modules={modules}
          submitLabel="儲存"
          company={company}
          selectedModuleIds={company.modules.map((m) => m.moduleId)}
        />
      </Card>

      <Card className="border-rose-200 bg-rose-50/50 p-6">
        <h2 className="text-base font-semibold text-rose-700">刪除公司</h2>
        <p className="mb-4 mt-1 text-sm text-rose-600">
          刪除後，這家公司的 issue、評比紀錄、專屬檢核項目都會一併移除，無法復原。
        </p>
        <form action={deleteCompanyAction}>
          <input type="hidden" name="id" value={company.id} />
          <ConfirmSubmitButton
            confirmMessage={`確定要刪除「${company.name}」嗎？此操作無法復原。`}
            className={btn("danger")}
          >
            <IconTrash className="h-4 w-4" />
            刪除此公司
          </ConfirmSubmitButton>
        </form>
      </Card>
    </div>
  );
}
