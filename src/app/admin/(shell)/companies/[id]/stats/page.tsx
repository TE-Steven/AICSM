import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import {
  getLiveStats,
  liveStatFields,
  parseManualStats,
  type ManualStatKey,
} from "@/lib/liveStats";
import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";
import { SuccessToast } from "@/components/Toast";
import { Card, CardHeader } from "@/components/ui/Card";
import { btn, inputClass } from "@/components/ui/button";
import { IconAlertTriangle } from "@/components/icons";
import { updateManualStatsAction } from "./actions";

interface FieldSpec {
  key: ManualStatKey;
  label: string;
  kind: "count" | "rate" | "text";
  unit?: string;
}

const NUMERIC_FIELDS: FieldSpec[] = [
  { key: "aiServiceCount", label: "智能服務人次", kind: "count", unit: "人次" },
  { key: "aiRecognitionRate", label: "智能識別率", kind: "rate", unit: "%" },
  { key: "aiSatisfaction", label: "智能滿意度", kind: "rate", unit: "%" },
  { key: "aiTransferRate", label: "智能轉接率", kind: "rate", unit: "%" },
  { key: "agentServiceCount", label: "客服服務人次", kind: "count", unit: "人次" },
  { key: "agentSatisfaction", label: "客服滿意度", kind: "rate", unit: "%" },
  { key: "ticketCount", label: "工單數", kind: "count", unit: "張" },
];

const TEXT_FIELDS: FieldSpec[] = [
  { key: "aiTopIssueCategory", label: "智能客服・問題分類 TOP1", kind: "text" },
  { key: "agentTopIssueCategory", label: "人工客服・問題分類 TOP1", kind: "text" },
];

export default async function CompanyStatsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const { id } = await params;
  const { error, success } = await searchParams;

  const company = await prisma.company.findUnique({ where: { id } });
  if (!company) notFound();

  const manual = parseManualStats(company.manualStats);
  // 系統資料（示意或 API）：顯示在輸入框的提示文字，讓人知道留白時實際會顯示什麼
  const system = await getLiveStats({ id: company.id, externalId: company.externalId, manualStats: null });
  const systemValues = Object.fromEntries(liveStatFields(system.stats).map((f) => [f.key, f.value]));
  const placeholderOf = (key: ManualStatKey) =>
    ({
      aiTopIssueCategory: systemValues.aiTopIssue,
      agentTopIssueCategory: systemValues.agentTopIssue,
    })[key as "aiTopIssueCategory" | "agentTopIssueCategory"] ?? systemValues[key] ?? "";
  const manualCount = Object.keys(manual).length;

  return (
    <div className="max-w-4xl space-y-5">
      <SuccessToast message={success ?? null} />

      {error && (
        <p className="flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2.5 text-sm text-rose-600 ring-1 ring-inset ring-rose-100">
          <IconAlertTriangle className="h-4 w-4 shrink-0" />
          「{error}」的數值不正確：比率請填 0–100，人次與工單數請填 0 以上的整數。
        </p>
      )}

      <Card>
        <CardHeader
          title="使用數據（手動輸入）"
          description="電視牆與健康度會優先使用這裡填的數值；欄位留白就沿用系統資料（目前是示意資料，之後串接 API 會自動換成真實數據）。"
        />
        <form action={updateManualStatsAction} className="space-y-6 p-5">
          <input type="hidden" name="companyId" value={company.id} />

          <div>
            <h3 className="mb-3 text-sm font-semibold text-slate-700">7 項數據</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {NUMERIC_FIELDS.map((f) => (
                <div key={f.key}>
                  <label className="mb-1.5 flex items-center justify-between text-sm font-medium text-slate-700">
                    {f.label}
                    {manual[f.key] !== undefined && (
                      <span className="rounded bg-sky-100 px-1.5 py-0.5 text-xs font-semibold text-sky-700">
                        手動
                      </span>
                    )}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      name={f.key}
                      inputMode="decimal"
                      defaultValue={manual[f.key] ?? ""}
                      placeholder={`系統：${placeholderOf(f.key)}`}
                      className={inputClass}
                    />
                    <span className="w-10 shrink-0 text-sm text-slate-500">{f.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-slate-700">問題分類 TOP1</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {TEXT_FIELDS.map((f) => (
                <div key={f.key}>
                  <label className="mb-1.5 flex items-center justify-between text-sm font-medium text-slate-700">
                    {f.label}
                    {manual[f.key] !== undefined && (
                      <span className="rounded bg-sky-100 px-1.5 py-0.5 text-xs font-semibold text-sky-700">
                        手動
                      </span>
                    )}
                  </label>
                  <input
                    name={f.key}
                    maxLength={40}
                    defaultValue={manual[f.key] ?? ""}
                    placeholder={`系統：${placeholderOf(f.key)}`}
                    className={inputClass}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" className={btn("primary")}>
              儲存
            </button>
            <span className="text-sm text-slate-500">
              {manualCount > 0 ? `目前已手動輸入 ${manualCount} / 9 項` : "目前全部使用系統資料"}
            </span>
          </div>
        </form>
      </Card>

      {manualCount > 0 && (
        <Card className="p-5">
          <form action={updateManualStatsAction} className="flex flex-wrap items-center justify-between gap-3">
            <input type="hidden" name="companyId" value={company.id} />
            <input type="hidden" name="clearAll" value="1" />
            <p className="text-sm text-slate-500">清除所有手動輸入，全部改回使用系統資料。</p>
            <ConfirmSubmitButton
              confirmMessage="確定要清除這家公司所有手動輸入的使用數據嗎？"
              className={btn("danger")}
            >
              清除手動輸入
            </ConfirmSubmitButton>
          </form>
        </Card>
      )}
    </div>
  );
}
