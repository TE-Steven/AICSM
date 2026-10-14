import type { Industry, Module } from "@/generated/prisma/client";
import { btn, inputClass } from "@/components/ui/button";

/** 新增／編輯公司共用表單：名稱、行業別、說明、購買系統痛點需求、購買模組（多選）。 */
export function CompanyForm({
  action,
  industries,
  modules,
  submitLabel,
  company,
  selectedModuleIds = [],
}: {
  action: (formData: FormData) => Promise<void>;
  industries: Industry[];
  modules: Module[];
  submitLabel: string;
  company?: {
    id: string;
    name: string;
    industryId: string;
    description: string | null;
    painPoints: string | null;
    externalId: string | null;
  };
  selectedModuleIds?: string[];
}) {
  const selected = new Set(selectedModuleIds);

  return (
    <form action={action} className="space-y-5">
      {company && <input type="hidden" name="id" value={company.id} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">公司名稱</label>
          <input name="name" required defaultValue={company?.name} className={inputClass} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">行業別</label>
          <select
            name="industryId"
            required
            defaultValue={company?.industryId ?? ""}
            className={inputClass}
          >
            <option value="" disabled>
              請選擇行業別
            </option>
            {industries
              .filter((i) => !i.isCommon)
              .map((industry) => (
                <option key={industry.id} value={industry.id}>
                  {industry.name}
                </option>
              ))}
          </select>
          <p className="mt-1 text-xs text-slate-400">
            建立評比時會自動帶入「通用」項目＋此行業別的項目。
          </p>
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">公司說明</label>
        <textarea
          name="description"
          rows={2}
          defaultValue={company?.description ?? ""}
          className={inputClass}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">
          當時購買系統的痛點與需求
        </label>
        <textarea
          name="painPoints"
          rows={4}
          defaultValue={company?.painPoints ?? ""}
          placeholder="例如：客服人力不足、LINE 詢問量大回不完、想導入智能客服分流…"
          className={inputClass}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">購買模組（可複選）</label>
        {modules.length === 0 ? (
          <p className="text-sm text-slate-400">尚無模組，請先到「產品模組管理」新增。</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {modules.map((m) => (
              <label
                key={m.id}
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50 has-[:checked]:text-brand-700"
              >
                <input
                  type="checkbox"
                  name="moduleIds"
                  value={m.id}
                  defaultChecked={selected.has(m.id)}
                  className="h-4 w-4 rounded border-slate-300 text-brand-600"
                />
                {m.name}
                {!m.isActive && <span className="text-xs text-slate-400">（已停用）</span>}
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="max-w-sm">
        <label className="mb-1.5 block text-sm font-medium text-slate-700">
          客服系統企業代碼（選填）
        </label>
        <input
          name="externalId"
          defaultValue={company?.externalId ?? ""}
          placeholder="之後串接即時數據 API 用"
          className={inputClass}
        />
      </div>

      <button type="submit" className={btn("primary")}>
        {submitLabel}
      </button>
    </form>
  );
}
