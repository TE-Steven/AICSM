import { PATH_SEPARATOR } from "@/lib/tree";

/** 評比結果列（快照），純資料，前後端皆可使用。 */
export interface ResultRow {
  id: string;
  itemName: string;
  pathLabel: string;
  description: string | null;
  defaultAction: string | null;
  weight: number;
  sortOrder: number;
  done: boolean;
  actionNote: string | null;
}

export interface AssessmentStats {
  score: number | null;
  doneCount: number;
  totalCount: number;
  /** 未完成項目，依權重高→低（同權重依原本順序） */
  unfinished: ResultRow[];
}

export function scoreOf(rows: ResultRow[]): number | null {
  const total = rows.reduce((sum, r) => sum + r.weight, 0);
  if (total <= 0) return null;
  const done = rows.reduce((sum, r) => sum + (r.done ? r.weight : 0), 0);
  return Math.round((done / total) * 1000) / 10;
}

export function computeAssessmentStats(rows: ResultRow[]): AssessmentStats {
  const sorted = [...rows].sort((a, b) => a.sortOrder - b.sortOrder);
  return {
    score: scoreOf(sorted),
    doneCount: sorted.filter((r) => r.done).length,
    totalCount: sorted.length,
    unfinished: sorted
      .filter((r) => !r.done)
      .sort((a, b) => b.weight - a.weight || a.sortOrder - b.sortOrder),
  };
}

export interface ResultGroup {
  key: string;
  name: string;
  groups: ResultGroup[];
  leaves: ResultRow[];
  doneCount: number;
  totalCount: number;
  score: number | null;
}

interface DraftGroup {
  key: string;
  name: string;
  groups: DraftGroup[];
  leaves: ResultRow[];
}

function finalize(group: DraftGroup): ResultGroup {
  const groups = group.groups.map(finalize);
  const allRows = [
    ...group.leaves,
    ...groups.flatMap(function collect(g): ResultRow[] {
      return [...g.leaves, ...g.groups.flatMap(collect)];
    }),
  ];
  return {
    key: group.key,
    name: group.name,
    groups,
    leaves: group.leaves,
    doneCount: allRows.filter((r) => r.done).length,
    totalCount: allRows.length,
    score: scoreOf(allRows),
  };
}

/** 依 pathLabel（構面 › 類別 › 檢核點）把結果列還原成可收合的階層結構。 */
export function groupResults(rows: ResultRow[]): {
  groups: ResultGroup[];
  looseLeaves: ResultRow[];
} {
  const sorted = [...rows].sort((a, b) => a.sortOrder - b.sortOrder);
  const roots: DraftGroup[] = [];
  const looseLeaves: ResultRow[] = [];
  const index = new Map<string, DraftGroup>();

  for (const row of sorted) {
    const segments = row.pathLabel ? row.pathLabel.split(PATH_SEPARATOR) : [row.itemName];
    const branchSegments = segments.slice(0, -1);
    if (branchSegments.length === 0) {
      looseLeaves.push(row);
      continue;
    }

    let siblings = roots;
    let key = "";
    let current: DraftGroup | null = null;
    for (const segment of branchSegments) {
      key = `${key}\u0000${segment}`;
      let group = index.get(key);
      if (!group) {
        group = { key, name: segment, groups: [], leaves: [] };
        index.set(key, group);
        siblings.push(group);
      }
      current = group;
      siblings = group.groups;
    }
    current!.leaves.push(row);
  }

  return { groups: roots.map(finalize), looseLeaves };
}
