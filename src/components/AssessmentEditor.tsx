"use client";

import { useMemo, useState } from "react";
import {
  computeAssessmentStats,
  groupResults,
  type ResultGroup,
  type ResultRow,
} from "@/lib/assessment";
import { healthBarClass, healthTextClass } from "@/components/ui/HealthBar";
import { Card } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";
import { btn, inputClass } from "@/components/ui/button";
import { IconChevronRight } from "@/components/icons";

function collectIds(group: ResultGroup): string[] {
  return [...group.leaves.map((r) => r.id), ...group.groups.flatMap(collectIds)];
}

/** 一開始有未完成項目的群組預設展開（只在載入時決定，之後勾選不會讓群組自己收合）。 */
function collectOpenKeys(groups: ResultGroup[]): string[] {
  return groups.flatMap((g) => [
    ...(g.doneCount < g.totalCount ? [g.key] : []),
    ...collectOpenKeys(g.groups),
  ]);
}

function ProgressLine({ score }: { score: number | null }) {
  return (
    <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100">
      <div
        className={`h-full rounded-full ${healthBarClass(score)}`}
        style={{ width: `${score ?? 0}%` }}
      />
    </div>
  );
}

/**
 * 評比作業頁：構面／類別可收合、顯示各層完成度、批次勾選、只看未完成。
 * 所有項目的 checkbox 與 Action 欄位一律保留在 DOM 內（只用 CSS 隱藏），
 * 這樣不論怎麼篩選，儲存時送出的資料都是完整的。
 */
export function AssessmentEditor({
  action,
  assessment,
  rows,
}: {
  action: (formData: FormData) => Promise<void>;
  assessment: { id: string; companyId: string; assessedAt: string; note: string };
  rows: ResultRow[];
}) {
  const [doneMap, setDoneMap] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(rows.map((r) => [r.id, r.done]))
  );
  const [onlyUnfinished, setOnlyUnfinished] = useState(false);
  const [initialOpenKeys] = useState(() => new Set(collectOpenKeys(groupResults(rows).groups)));

  const liveRows = useMemo(
    () => rows.map((r) => ({ ...r, done: doneMap[r.id] ?? false })),
    [rows, doneMap]
  );
  const stats = computeAssessmentStats(liveRows);
  const { groups, looseLeaves } = groupResults(liveRows);

  const setMany = (ids: string[], value: boolean) =>
    setDoneMap((prev) => {
      const next = { ...prev };
      for (const id of ids) next[id] = value;
      return next;
    });

  const renderLeaf = (row: ResultRow) => {
    const done = doneMap[row.id] ?? false;
    return (
      <li
        key={row.id}
        className={`rounded-lg border px-3.5 py-3 ${
          done ? "border-emerald-200 bg-emerald-50/40" : "border-slate-200 bg-white"
        } ${onlyUnfinished && done ? "hidden" : ""}`}
      >
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            name={`done_${row.id}`}
            checked={done}
            onChange={(e) => setMany([row.id], e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-emerald-600 focus:ring-emerald-400"
          />
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-slate-900">{row.itemName}</span>
              <Pill tone="blue">權重 {row.weight}</Pill>
            </span>
            {row.description && <span className="block text-xs text-slate-400">{row.description}</span>}
          </span>
        </label>
        <div className={done ? "hidden" : "mt-2 pl-7"}>
          <textarea
            name={`action_${row.id}`}
            rows={2}
            defaultValue={row.actionNote ?? row.defaultAction ?? ""}
            placeholder="未達成時的 Action（待辦事項）"
            className={`${inputClass} py-1.5 text-xs`}
          />
        </div>
      </li>
    );
  };

  const renderGroup = (group: ResultGroup, depth: number) => {
    const ids = collectIds(group);
    const allDone = group.totalCount > 0 && group.doneCount === group.totalCount;
    return (
      <li key={group.key} className={onlyUnfinished && allDone ? "hidden" : ""}>
        <details
          open={initialOpenKeys.has(group.key)}
          className="group rounded-xl border border-slate-200 bg-white shadow-sm"
        >
          <summary className="flex cursor-pointer list-none flex-wrap items-center gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
            <IconChevronRight className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:rotate-90" />
            <span
              className={`min-w-0 flex-1 truncate ${depth === 0 ? "text-sm font-bold" : "text-sm font-semibold"} text-slate-900`}
            >
              {group.name}
            </span>
            <ProgressLine score={group.score} />
            <span className="w-12 text-right text-xs font-semibold tabular-nums text-slate-500">
              {group.doneCount}/{group.totalCount}
            </span>
            <span className="flex gap-1">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setMany(ids, true);
                }}
                className={btn("secondary", "sm")}
              >
                全部完成
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setMany(ids, false);
                }}
                className={btn("ghost", "sm")}
              >
                全部未完成
              </button>
            </span>
          </summary>
          <div className="space-y-2 border-t border-slate-100 px-4 py-3">
            {group.groups.length > 0 && (
              <ul className="space-y-2">{group.groups.map((g) => renderGroup(g, depth + 1))}</ul>
            )}
            {group.leaves.length > 0 && <ul className="space-y-2">{group.leaves.map(renderLeaf)}</ul>}
          </div>
        </details>
      </li>
    );
  };

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="assessmentId" value={assessment.id} />
      <input type="hidden" name="companyId" value={assessment.companyId} />

      <Card className="p-5">
        <div className="grid gap-4 sm:grid-cols-[200px_1fr]">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">評比日期</label>
            <input
              type="date"
              name="assessedAt"
              defaultValue={assessment.assessedAt}
              required
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">備註</label>
            <input
              name="note"
              defaultValue={assessment.note}
              placeholder="例如：Q4 例行健檢、與客戶開會後調整"
              className={inputClass}
            />
          </div>
        </div>
      </Card>

      <div className="sticky top-0 z-20 flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-white/95 px-5 py-3 shadow-sm backdrop-blur">
        <div>
          <p className="text-xs font-semibold text-slate-500">目前分數</p>
          <p className={`text-2xl font-extrabold tabular-nums ${healthTextClass(stats.score)}`}>
            {stats.score === null ? "—" : Math.round(stats.score)}
          </p>
        </div>
        <div className="text-sm text-slate-600">
          已完成 <b className="text-slate-900">{stats.doneCount}</b> / {stats.totalCount} 項
        </div>
        <label className="ml-auto flex cursor-pointer items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={onlyUnfinished}
            onChange={(e) => setOnlyUnfinished(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-brand-600"
          />
          只看未完成
        </label>
        <button type="submit" className={btn("primary")}>
          儲存評比
        </button>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white/60 p-10 text-center text-sm text-slate-400">
          這次評比沒有任何檢核項目（建立當時該公司沒有適用的項目）。
        </div>
      ) : (
        <ul className="space-y-3">
          {groups.map((g) => renderGroup(g, 0))}
          {looseLeaves.length > 0 && <li><ul className="space-y-2">{looseLeaves.map(renderLeaf)}</ul></li>}
        </ul>
      )}
    </form>
  );
}
