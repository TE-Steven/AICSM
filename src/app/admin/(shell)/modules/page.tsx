import { prisma } from "@/lib/db";
import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";
import { SuccessToast } from "@/components/Toast";
import { Card, CardHeader } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { btn, inputClass } from "@/components/ui/button";
import { IconAlertTriangle, IconTrash } from "@/components/icons";
import { createModuleAction, updateModuleAction, deleteModuleAction } from "./actions";

export default async function ModulesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; name?: string; success?: string }>;
}) {
  const { error, name, success } = await searchParams;
  const modules = await prisma.module.findMany({
    orderBy: [{ order: "asc" }, { name: "asc" }],
    include: { _count: { select: { companies: true } } },
  });

  return (
    <div className="max-w-4xl">
      <SuccessToast message={success ?? null} />
      <PageHeader
        title="產品模組管理"
        description="維護可販售的產品模組。公司管理裡可以複選每家公司購買了哪些模組。"
      />

      {error && (
        <p className="mb-4 flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2.5 text-sm text-rose-600 ring-1 ring-inset ring-rose-100">
          <IconAlertTriangle className="h-4 w-4 shrink-0" />
          {error === "dup" ? `已經有「${name}」這個模組了。` : "請輸入模組名稱。"}
        </p>
      )}

      <Card className="mb-5">
        <CardHeader title="新增模組" />
        <form action={createModuleAction} className="grid gap-3 p-5 sm:grid-cols-[1fr_2fr_auto]">
          <input name="name" placeholder="模組名稱，例如：文字智能" required className={inputClass} />
          <input name="description" placeholder="說明（選填）" className={inputClass} />
          <button type="submit" className={btn("primary")}>
            新增
          </button>
        </form>
      </Card>

      <Card>
        <CardHeader title={`模組清單（${modules.length}）`} />
        {modules.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-400">
            尚無模組。到「總覽」按「初始化基礎資料」可一次塞入現有 5 個模組。
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {modules.map((m) => (
              <div key={m.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                <form
                  action={updateModuleAction}
                  className="grid min-w-0 flex-1 items-center gap-2 sm:grid-cols-[1fr_2fr_auto_auto]"
                >
                  <input type="hidden" name="id" value={m.id} />
                  <input name="name" defaultValue={m.name} required className={inputClass} />
                  <input
                    name="description"
                    defaultValue={m.description ?? ""}
                    placeholder="說明"
                    className={inputClass}
                  />
                  <label className="flex items-center gap-1.5 text-sm text-slate-600">
                    <input
                      type="checkbox"
                      name="isActive"
                      defaultChecked={m.isActive}
                      className="h-4 w-4 rounded border-slate-300 text-brand-600"
                    />
                    啟用
                  </label>
                  <button type="submit" className={btn("secondary", "sm")}>
                    儲存
                  </button>
                </form>
                <span className="shrink-0 text-xs text-slate-400">{m._count.companies} 家公司購買</span>
                <form action={deleteModuleAction}>
                  <input type="hidden" name="id" value={m.id} />
                  <ConfirmSubmitButton
                    confirmMessage={`確定要刪除模組「${m.name}」嗎？已購買此模組的公司會一併移除該購買紀錄。`}
                    className={btn("danger", "sm")}
                  >
                    <IconTrash className="h-3.5 w-3.5" />
                    刪除
                  </ConfirmSubmitButton>
                </form>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
