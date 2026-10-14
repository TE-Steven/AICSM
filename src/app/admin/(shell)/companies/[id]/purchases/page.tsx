import { Card } from "@/components/ui/Card";
import { IconCart } from "@/components/icons";

export default function PurchasesPage() {
  return (
    <Card className="flex flex-col items-center px-6 py-16 text-center">
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
        <IconCart className="h-7 w-7" />
      </span>
      <h2 className="text-lg font-bold text-slate-900">購買功能管理</h2>
      <p className="mt-2 max-w-md text-sm text-slate-500">
        之後會在這裡勾選客戶要加價購的模組與 RAG 知識上傳等功能。功能規劃中，敬請期待。
      </p>
      <span className="mt-4 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
        Coming soon
      </span>
    </Card>
  );
}
