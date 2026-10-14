/**
 * 健康度推估（純函式，前後端皆可用）。
 *
 * 健康度 = 三塊分數加權：
 *   1. 使用數據分（預設 40%）：智能識別率、智能滿意度、客服滿意度、(100 − 智能轉接率) 平均
 *   2. 健檢分（預設 40%）：最新一次評比的「已完成項目權重 ÷ 全部項目權重」
 *   3. Issue 分（預設 20%）：100 分起扣，每個未結案 issue 依存在天數扣分
 * 缺資料的項目不計入，其權重按比例分配給有資料的項目（不會因缺資料被拉成 0）。
 *
 * 要調整計算方式，只需改這個檔案。
 */

export type HealthBand = "healthy" | "atRisk" | "critical" | "none";

export function healthBand(score: number | null): HealthBand {
  if (score === null) return "none";
  if (score >= 80) return "healthy";
  if (score >= 50) return "atRisk";
  return "critical";
}

export const HEALTH_BAND_LABEL: Record<HealthBand, string> = {
  healthy: "健康",
  atRisk: "風險",
  critical: "危急",
  none: "尚無資料",
};

export const HEALTH_WEIGHTS = { usage: 40, assessment: 40, issue: 20 } as const;

/** 未結案 issue 依存在天數的扣分：<7 天 5 分、7–30 天 10 分、>30 天 20 分 */
export function issuePenalty(ageDays: number): number {
  if (ageDays < 7) return 5;
  if (ageDays <= 30) return 10;
  return 20;
}

export interface UsageMetrics {
  aiRecognitionRate: number;
  aiSatisfaction: number;
  agentSatisfaction: number;
  aiTransferRate: number;
}

export interface HealthInput {
  usage: UsageMetrics | null;
  /** 最新一次評比分數 0–100；沒有評比時為 null */
  assessmentScore: number | null;
  /** 每個未結案 issue 已存在的天數 */
  openIssueAges: number[];
}

export interface HealthPart {
  key: "usage" | "assessment" | "issue";
  label: string;
  /** 名義權重（%） */
  weight: number;
  /** 實際占比（%），缺資料項目會把權重分給其他項目 */
  share: number;
  score: number | null;
  detail: string;
}

export interface HealthResult {
  score: number | null;
  band: HealthBand;
  parts: HealthPart[];
  /** 例如：使用 80 × 44% + 健檢 65 × 44% + Issue 60 × 12% = 72 */
  formula: string;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

export function computeHealth(input: HealthInput): HealthResult {
  const { usage, assessmentScore, openIssueAges } = input;

  const usageScore = usage
    ? round1(
        (usage.aiRecognitionRate +
          usage.aiSatisfaction +
          usage.agentSatisfaction +
          (100 - usage.aiTransferRate)) /
          4
      )
    : null;

  const issueScore = Math.max(
    0,
    100 - openIssueAges.reduce((sum, age) => sum + issuePenalty(age), 0)
  );

  const rawParts: Omit<HealthPart, "share">[] = [
    {
      key: "usage",
      label: "使用數據",
      weight: HEALTH_WEIGHTS.usage,
      score: usageScore,
      detail: usage
        ? `智能識別率 ${usage.aiRecognitionRate}%、智能滿意度 ${usage.aiSatisfaction}%、客服滿意度 ${usage.agentSatisfaction}%、(100 − 智能轉接率 ${usage.aiTransferRate}%) = ${100 - usage.aiTransferRate}%，四項取平均`
        : "尚無使用數據，此項不計入",
    },
    {
      key: "assessment",
      label: "企業健檢",
      weight: HEALTH_WEIGHTS.assessment,
      score: assessmentScore === null ? null : round1(assessmentScore),
      detail:
        assessmentScore === null
          ? "尚無評比紀錄，此項不計入"
          : "最新一次評比：已完成項目權重 ÷ 全部項目權重",
    },
    {
      key: "issue",
      label: "待處理 Issue",
      weight: HEALTH_WEIGHTS.issue,
      score: issueScore,
      detail:
        openIssueAges.length === 0
          ? "目前沒有未結案 issue，滿分"
          : `未結案 ${openIssueAges.length} 件；100 分起扣，每件依存在天數扣 5／10／20 分（<7 天／7–30 天／>30 天）`,
    },
  ];

  const available = rawParts.filter((p) => p.score !== null);
  const totalWeight = available.reduce((sum, p) => sum + p.weight, 0);
  const parts: HealthPart[] = rawParts.map((p) => ({
    ...p,
    share: p.score === null || totalWeight === 0 ? 0 : (p.weight / totalWeight) * 100,
  }));

  const score =
    available.length === 0
      ? null
      : Math.round(
          parts.reduce((sum, p) => sum + (p.score ?? 0) * (p.share / 100), 0)
        );

  const formula = available.length
    ? `${parts
        .filter((p) => p.score !== null)
        .map((p) => `${p.label} ${Math.round(p.score as number)} × ${Math.round(p.share)}%`)
        .join(" + ")} = ${score}`
    : "資料不足，無法計算";

  return { score, band: healthBand(score), parts, formula };
}
