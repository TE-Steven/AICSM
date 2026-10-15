/**
 * 智能客服／真人客服的即時數據（8 項）。
 *
 * TODO: 目前為示意資料。之後請改成呼叫實際的客服系統 API：
 *   依 company.externalId（客服系統的企業代碼）取得該企業的即時數據，
 *   取代 getLiveStats() 裡的 mock 產生邏輯；介面與呼叫端都不用動。
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

export interface LiveStatsResult {
  stats: LiveStats;
  /** 資料來源：mock＝示意資料；api＝真實 API */
  source: "mock" | "api";
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

export async function getLiveStats(company: {
  id: string;
  externalId: string | null;
}): Promise<LiveStatsResult> {
  return { stats: mockLiveStats(company.externalId ?? company.id), source: "mock" };
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
