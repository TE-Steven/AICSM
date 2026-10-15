/**
 * 智能客服／真人客服的使用數據（7 項數字＋智能／人工問題分類 TOP1）。
 *
 * 資料來源優先順序：
 *   1. 每日數據（AICSM_CompanyDailyStat）：後台逐天手動填寫，或外部系統每天透過 API 寫入。
 *      每個欄位取「最新一天」的值，並與 7 天前同一天比較，算出「較上週」趨勢。
 *   2. 示意資料（mock）：公司完全沒有某欄位的每日數據時暫時顯示，並標示為示意。
 */
export interface LiveStats {
  aiServiceCount: number; // 智能服務人次
  aiRecognitionRate: number; // 智能識別率（%）
  aiSatisfaction: number; // 智能滿意度（%）
  aiTransferRate: number; // 智能轉接率（%）
  agentServiceCount: number; // 客服服務人次
  agentSatisfaction: number; // 客服滿意度（%）
  ticketCount: number; // 工單數
  aiTopIssueCategory: string; // 智能客服問題分類 TOP1
  agentTopIssueCategory: string; // 人工客服問題分類 TOP1
  /**
   * 較上週變化：人次／工單數為百分比（%），各種比率為百分點（pt）。
   * 沒有資料的欄位不用填，畫面就不顯示趨勢。
   */
  trends?: Partial<Record<
    "aiServiceCount" | "aiRecognitionRate" | "aiSatisfaction" | "aiTransferRate" | "agentServiceCount" | "agentSatisfaction" | "ticketCount",
    number
  >>;
}

/** 每日數據的欄位（7 項數字＋智能／人工問題分類 TOP1）。 */
export const STAT_KEYS = [
  "aiServiceCount",
  "aiRecognitionRate",
  "aiSatisfaction",
  "aiTransferRate",
  "agentServiceCount",
  "agentSatisfaction",
  "ticketCount",
  "aiTopIssueCategory",
  "agentTopIssueCategory",
] as const;

export type StatKey = (typeof STAT_KEYS)[number];
type NumericStatKey = Exclude<StatKey, "aiTopIssueCategory" | "agentTopIssueCategory">;

/** 人次／工單數（整數）；趨勢以百分比計算。 */
export const COUNT_STAT_KEYS: StatKey[] = ["aiServiceCount", "agentServiceCount", "ticketCount"];
/** 各種比率（0–100）；趨勢以百分點計算。 */
export const RATE_STAT_KEYS: StatKey[] = [
  "aiRecognitionRate",
  "aiSatisfaction",
  "aiTransferRate",
  "agentSatisfaction",
];
export const TEXT_STAT_KEYS: StatKey[] = ["aiTopIssueCategory", "agentTopIssueCategory"];

export const STAT_LABELS: Record<StatKey, string> = {
  aiServiceCount: "智能服務人次",
  aiRecognitionRate: "智能識別率",
  aiSatisfaction: "智能滿意度",
  aiTransferRate: "智能轉接率",
  agentServiceCount: "客服服務人次",
  agentSatisfaction: "客服滿意度",
  ticketCount: "工單數",
  aiTopIssueCategory: "智能客服・問題分類 TOP1",
  agentTopIssueCategory: "人工客服・問題分類 TOP1",
};

/** 一天的數據（欄位可以只填一部分，沒填＝null）。date 為 YYYY-MM-DD 或 Date。 */
export type DailyStatRow = { date: Date | string } & {
  [K in StatKey]?: (K extends NumericStatKey ? number : string) | null;
};

/** 日期（Date 或字串）轉成 YYYY-MM-DD。 */
export function dateKey(value: Date | string): string {
  return typeof value === "string" ? value.slice(0, 10) : value.toISOString().slice(0, 10);
}

/** YYYY-MM-DD 加減天數。 */
export function addDays(day: string, delta: number): string {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + delta)).toISOString().slice(0, 10);
}

export interface LiveStatsResult {
  stats: LiveStats;
  /** 資料來源：mock＝完全是示意資料；data＝至少有一個欄位來自每日數據 */
  source: "mock" | "data";
  /** 來自每日數據的欄位（其餘欄位暫時是示意資料） */
  recordedFields: StatKey[];
  /** 這些數據最新一筆的日期（YYYY-MM-DD）；沒有每日數據時為 null */
  statsDate: string | null;
}

const TOP_ISSUE_CATEGORIES = [
  "訂單查詢",
  "帳號登入問題",
  "退換貨申請",
  "帳單與扣款",
  "功能操作教學",
  "服務中斷回報",
];

const AGENT_TOP_ISSUE_CATEGORIES = [
  "客訴處理",
  "退換貨爭議",
  "訂單異常",
  "帳務與退款",
  "設備故障排除",
  "複雜案件轉單",
];

function hashText(text: string): number {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/** 依公司 id 產生穩定（同一公司每次都相同）但看起來合理的示意數據。 */
function mockLiveStats(seedText: string): LiveStats {
  const seed = hashText(seedText);
  const pick = (min: number, max: number, salt: number) =>
    min + ((seed + salt * 97) % (max - min + 1));

  return {
    aiServiceCount: pick(800, 4200, 1),
    aiRecognitionRate: pick(78, 97, 3),
    aiSatisfaction: pick(70, 96, 4),
    aiTransferRate: pick(8, 32, 5),
    agentServiceCount: pick(150, 900, 2),
    agentSatisfaction: pick(80, 98, 6),
    ticketCount: pick(20, 260, 7),
    aiTopIssueCategory: TOP_ISSUE_CATEGORIES[seed % TOP_ISSUE_CATEGORIES.length],
    agentTopIssueCategory: AGENT_TOP_ISSUE_CATEGORIES[(seed >>> 3) % AGENT_TOP_ISSUE_CATEGORIES.length],
    trends: {
      aiServiceCount: pick(-8, 14, 11),
      aiRecognitionRate: pick(-3, 4, 12) + 0.5,
      aiSatisfaction: pick(-3, 4, 13) + 0.5,
      aiTransferRate: pick(-4, 3, 14) + 0.5,
      agentServiceCount: pick(-9, 12, 15),
      agentSatisfaction: pick(-3, 4, 16) + 0.5,
      ticketCount: pick(-12, 10, 17),
    },
  };
}

/** 示意資料（尚未有每日數據時的預設值）。 */
export function getSampleStats(company: { id: string; externalId: string | null }): LiveStats {
  return mockLiveStats(company.externalId ?? company.id);
}

/**
 * 組出公司目前的使用數據。rows 為該公司的每日數據，需依日期由新到舊排序。
 * 每個欄位取「最新一天有填的值」，趨勢＝與該日 7 天前同一天比較。
 */
export function getLiveStats(
  company: { id: string; externalId: string | null },
  rows: DailyStatRow[]
): LiveStatsResult {
  const base = mockLiveStats(company.externalId ?? company.id);
  const stats: LiveStats = { ...base, trends: { ...base.trends } };
  const recordedFields: StatKey[] = [];
  let statsDate: string | null = null;

  for (const key of STAT_KEYS) {
    const latest = rows.find((r) => r[key] !== null && r[key] !== undefined);
    if (!latest) continue;

    recordedFields.push(key);
    const latestDay = dateKey(latest.date);
    if (!statsDate || latestDay > statsDate) statsDate = latestDay;

    if (key === "aiTopIssueCategory" || key === "agentTopIssueCategory") {
      stats[key] = latest[key] as string;
      continue;
    }

    const current = latest[key] as number;
    stats[key] = current;
    // 系統產生的示意趨勢不再適用，改由每日數據自己算
    delete stats.trends?.[key];

    const weekAgoDay = addDays(latestDay, -7);
    const weekAgo = rows.find((r) => dateKey(r.date) === weekAgoDay && r[key] !== null && r[key] !== undefined);
    if (weekAgo && stats.trends) {
      const previous = weekAgo[key] as number;
      if (COUNT_STAT_KEYS.includes(key)) {
        if (previous > 0) stats.trends[key] = Math.round(((current - previous) / previous) * 1000) / 10;
      } else {
        stats.trends[key] = Math.round((current - previous) * 10) / 10;
      }
    }
  }

  return { stats, source: recordedFields.length > 0 ? "data" : "mock", recordedFields, statsDate };
}

export interface LiveStatField {
  key: string;
  label: string;
  value: string;
  /** 比率類指標（0–100），可畫進度條 */
  rate?: number;
  /** true＝數值越低越好（例如轉接率） */
  lowerIsBetter?: boolean;
  /** 較上週變化數值與單位（%＝百分比、pt＝百分點） */
  trend?: { value: number; unit: "%" | "pt" };
}

function trendOf(value: number | undefined, unit: "%" | "pt"): LiveStatField["trend"] {
  return value === undefined ? undefined : { value, unit };
}

/** 8 項即時數據的顯示欄位（標籤＋格式化後的數值），後台概況與電視牆共用。 */
export function liveStatFields(stats: LiveStats): LiveStatField[] {
  return [
    { key: "aiServiceCount", label: "智能服務人次", value: stats.aiServiceCount.toLocaleString("zh-TW"), trend: trendOf(stats.trends?.aiServiceCount, "%") },
    { key: "aiRecognitionRate", label: "智能識別率", value: `${stats.aiRecognitionRate}%`, rate: stats.aiRecognitionRate, trend: trendOf(stats.trends?.aiRecognitionRate, "pt") },
    { key: "aiSatisfaction", label: "智能滿意度", value: `${stats.aiSatisfaction}%`, rate: stats.aiSatisfaction, trend: trendOf(stats.trends?.aiSatisfaction, "pt") },
    { key: "aiTransferRate", label: "智能轉接率", value: `${stats.aiTransferRate}%`, rate: stats.aiTransferRate, lowerIsBetter: true, trend: trendOf(stats.trends?.aiTransferRate, "pt") },
    { key: "agentServiceCount", label: "客服服務人次", value: stats.agentServiceCount.toLocaleString("zh-TW"), trend: trendOf(stats.trends?.agentServiceCount, "%") },
    { key: "agentSatisfaction", label: "客服滿意度", value: `${stats.agentSatisfaction}%`, rate: stats.agentSatisfaction, trend: trendOf(stats.trends?.agentSatisfaction, "pt") },
    { key: "ticketCount", label: "工單數", value: stats.ticketCount.toLocaleString("zh-TW"), lowerIsBetter: true, trend: trendOf(stats.trends?.ticketCount, "%") },
    { key: "aiTopIssue", label: "智能問題分類 TOP1", value: stats.aiTopIssueCategory },
    { key: "agentTopIssue", label: "人工問題分類 TOP1", value: stats.agentTopIssueCategory },
  ];
}
