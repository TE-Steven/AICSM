import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";
import { Pill } from "@/components/ui/Pill";
import { btn, inputClass } from "@/components/ui/button";
import { IconChevronRight, IconPlus, IconTrash } from "@/components/icons";

export interface EditorNode {
  id: string;
  name: string;
  description: string | null;
  weight: number;
  defaultAction: string | null;
  children: EditorNode[];
}

export interface EditorActions {
  create: (formData: FormData) => Promise<void>;
  update: (formData: FormData) => Promise<void>;
  remove: (formData: FormData) => Promise<void>;
}

interface EditorContext {
  /** 表單隱藏欄位，帶出資料歸屬（例如 industryId / companyId） */
  scope: { name: string; value: string };
  actions: EditorActions;
}

function leafStats(node: EditorNode): { count: number; weight: number } {
  if (node.children.length === 0) return { count: 1, weight: node.weight };
  return node.children.reduce(
    (acc, child) => {
      const s = leafStats(child);
      return { count: acc.count + s.count, weight: acc.weight + s.weight };
    },
    { count: 0, weight: 0 }
  );
}

const DEPTH_LABEL = ["構面", "類別", "檢核點"];

function ItemFields({ node, isLeaf }: { node?: EditorNode; isLeaf: boolean }) {
  return (
    <div className="grid gap-3 sm:grid-cols-[2fr_1fr]">
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500">名稱</label>
        <input name="name" required defaultValue={node?.name} className={inputClass} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500">
          權重{isLeaf ? "" : "（最底層項目才計分）"}
        </label>
        <input
          name="weight"
          type="number"
          step="0.1"
          min="0.1"
          defaultValue={node?.weight ?? 1}
          className={inputClass}
        />
      </div>
      <div className="sm:col-span-2">
        <label className="mb-1 block text-xs font-medium text-slate-500">
          未達成時的建議 Action（待辦事項）
        </label>
        <textarea
          name="defaultAction"
          rows={2}
          defaultValue={node?.defaultAction ?? ""}
          className={inputClass}
        />
      </div>
      <div className="sm:col-span-2">
        <label className="mb-1 block text-xs font-medium text-slate-500">說明（選填）</label>
        <input name="description" defaultValue={node?.description ?? ""} className={inputClass} />
      </div>
    </div>
  );
}

function Row({
  node,
  depth,
  ctx,
}: {
  node: EditorNode;
  depth: number;
  ctx: EditorContext;
}) {
  const isLeaf = node.children.length === 0;
  const stats = leafStats(node);
  const hidden = <input type="hidden" name={ctx.scope.name} value={ctx.scope.value} />;

  return (
    <li>
      <details className="group rounded-xl border border-slate-200 bg-white shadow-sm open:border-brand-100 open:shadow-md">
        <summary className="flex cursor-pointer list-none flex-wrap items-center gap-2.5 px-4 py-3 [&::-webkit-details-marker]:hidden">
          <IconChevronRight className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:rotate-90" />
          <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-900">
            {node.name}
          </span>
          <Pill tone="slate">{DEPTH_LABEL[Math.min(depth, 2)]}</Pill>
          {isLeaf ? (
            <Pill tone="blue">權重 {node.weight}</Pill>
          ) : (
            <span className="text-xs text-slate-400">
              {stats.count} 個檢核點・權重合計 {Math.round(stats.weight * 10) / 10}
            </span>
          )}
        </summary>

        <div className="space-y-4 border-t border-slate-100 px-4 py-4">
          <form action={ctx.actions.update} className="space-y-3">
            {hidden}
            <input type="hidden" name="id" value={node.id} />
            <ItemFields node={node} isLeaf={isLeaf} />
            <button type="submit" className={btn("primary", "sm")}>
              儲存
            </button>
          </form>

          <details className="rounded-lg bg-slate-50 px-3 py-2">
            <summary className="flex cursor-pointer items-center gap-1.5 text-sm font-medium text-brand-600">
              <IconPlus className="h-4 w-4" />
              在「{node.name}」底下新增子項目
            </summary>
            <form action={ctx.actions.create} className="mt-3 space-y-3">
              {hidden}
              <input type="hidden" name="parentId" value={node.id} />
              <ItemFields isLeaf />
              <button type="submit" className={btn("secondary", "sm")}>
                新增
              </button>
            </form>
          </details>

          <form action={ctx.actions.remove}>
            {hidden}
            <input type="hidden" name="id" value={node.id} />
            <ConfirmSubmitButton
              confirmMessage={`確定要刪除「${node.name}」嗎？其下所有子項目也會一併刪除（已建立的歷史評比不受影響）。`}
              className={btn("danger", "sm")}
            >
              <IconTrash className="h-3.5 w-3.5" />
              刪除此項目
            </ConfirmSubmitButton>
          </form>
        </div>
      </details>

      {node.children.length > 0 && (
        <ul className="mt-2 space-y-2 border-l-2 border-slate-100 pl-4">
          {node.children.map((child) => (
            <Row key={child.id} node={child} depth={depth + 1} ctx={ctx} />
          ))}
        </ul>
      )}
    </li>
  );
}

/** 多層檢核項目樹編輯器（行業別與公司專屬項目共用）。點開每一列即可編輯、新增子項目或刪除。 */
export function CheckItemEditor({
  nodes,
  scope,
  actions,
  emptyHint,
}: {
  nodes: EditorNode[];
  scope: { name: string; value: string };
  actions: EditorActions;
  emptyHint?: string;
}) {
  const ctx: EditorContext = { scope, actions };

  return (
    <div className="space-y-4">
      <details className="rounded-xl border border-dashed border-brand-100 bg-brand-50/50 px-4 py-3">
        <summary className="flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-brand-700">
          <IconPlus className="h-4 w-4" />
          新增頂層構面
        </summary>
        <form action={actions.create} className="mt-3 space-y-3">
          <input type="hidden" name={scope.name} value={scope.value} />
          <ItemFields isLeaf />
          <button type="submit" className={btn("primary", "sm")}>
            新增
          </button>
        </form>
      </details>

      {nodes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white/60 p-8 text-center text-sm text-slate-400">
          {emptyHint ?? "尚無檢核項目，請先新增頂層構面。"}
        </div>
      ) : (
        <ul className="space-y-2">
          {nodes.map((node) => (
            <Row key={node.id} node={node} depth={0} ctx={ctx} />
          ))}
        </ul>
      )}
    </div>
  );
}
