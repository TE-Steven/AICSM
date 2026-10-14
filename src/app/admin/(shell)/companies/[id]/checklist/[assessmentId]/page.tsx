import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { AssessmentEditor } from "@/components/AssessmentEditor";
import { SuccessToast } from "@/components/Toast";
import { IconArrowLeft } from "@/components/icons";
import { saveAssessmentAction } from "../actions";

export default async function AssessmentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; assessmentId: string }>;
  searchParams: Promise<{ success?: string }>;
}) {
  const { id, assessmentId } = await params;
  const { success } = await searchParams;

  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    include: { results: { orderBy: { sortOrder: "asc" } } },
  });
  if (!assessment || assessment.companyId !== id) notFound();

  return (
    <div className="max-w-4xl">
      <SuccessToast message={success ?? null} />
      <Link
        href={`/admin/companies/${id}/checklist`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800"
      >
        <IconArrowLeft className="h-4 w-4" />
        返回評比紀錄
      </Link>

      <AssessmentEditor
        action={saveAssessmentAction}
        assessment={{
          id: assessment.id,
          companyId: id,
          assessedAt: assessment.assessedAt.toISOString().slice(0, 10),
          note: assessment.note ?? "",
        }}
        rows={assessment.results}
      />
    </div>
  );
}
