/** 行業別／公司專屬檢核項目共用的樹狀工具（純函式，不依賴資料庫，前後端皆可使用）。 */

export interface TreeRow {
  id: string;
  parentId: string | null;
  order: number;
}

export type TreeNode<T extends TreeRow> = T & { children: TreeNode<T>[] };

/** 將扁平清單組成樹狀結構（同層依 order 排序）。 */
export function buildTree<T extends TreeRow>(items: T[]): TreeNode<T>[] {
  const nodeById = new Map<string, TreeNode<T>>();
  for (const item of items) nodeById.set(item.id, { ...item, children: [] });

  const roots: TreeNode<T>[] = [];
  for (const item of items) {
    const node = nodeById.get(item.id)!;
    const parent = item.parentId ? nodeById.get(item.parentId) : undefined;
    if (parent) parent.children.push(node);
    else roots.push(node);
  }

  const sortRecursive = (nodes: TreeNode<T>[]) => {
    nodes.sort((a, b) => a.order - b.order);
    for (const n of nodes) sortRecursive(n.children);
  };
  sortRecursive(roots);
  return roots;
}

export function isLeaf<T extends TreeRow>(node: TreeNode<T>): boolean {
  return node.children.length === 0;
}

export function collectLeaves<T extends TreeRow>(node: TreeNode<T>): TreeNode<T>[] {
  return isLeaf(node) ? [node] : node.children.flatMap(collectLeaves);
}

export const PATH_SEPARATOR = " › ";

export interface LeafSnapshot {
  name: string;
  description: string | null;
  weight: number;
  defaultAction: string | null;
  /** 從頂層到葉節點（含自己）的名稱 */
  pathNames: string[];
}

interface LeafSource extends TreeRow {
  name: string;
  description: string | null;
  weight: number;
  defaultAction: string | null;
}

/** 依樹的先後順序（深度優先）攤平所有葉節點，並帶出完整路徑，用於建立評比快照。 */
export function flattenLeaves<T extends LeafSource>(
  roots: TreeNode<T>[],
  parentPath: string[] = []
): LeafSnapshot[] {
  return roots.flatMap((node) => {
    const pathNames = [...parentPath, node.name];
    if (isLeaf(node)) {
      return [
        {
          name: node.name,
          description: node.description,
          weight: node.weight,
          defaultAction: node.defaultAction,
          pathNames,
        },
      ];
    }
    return flattenLeaves(node.children, pathNames);
  });
}
