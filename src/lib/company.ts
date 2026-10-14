import { prisma } from "@/lib/db";
import type { CheckItem, CompanyCheckItem } from "@/generated/prisma/client";
import {
  computeAssessmentStats,
  type AssessmentStats,
  type ResultRow,
} from "@/lib/assessment";
import { computeHealth, type HealthResult } from "@/lib/health";
import { getLiveStats, type LiveStatsResult } from "@/lib/liveStats";
import { buildTree, flattenLeaves, type LeafSnapshot, type TreeNode } from "@/lib/tree";

const DAY_MS = 24 * 60 * 60 * 1000;

/** 距今幾天（至少 0）。 */
export function ageInDays(date: Date): number {
  return Math.max(0, Math.floor((Date.now() - date.getTime()) / DAY_MS));
}

export interface OpenIssueSummary {
  id: string;
  title: string;
  priority: string;
  status: string;
  occurredAt: Date;
  ageDays: number;
}

export interface CompanyOverview {
  id: string;
  name: string;
  description: string | null;
  painPoints: string | null;
  industry: { id: string; name: string };
  modules: { id: string; name: string }[];
  live: LiveStatsResult;
  health: HealthResult;
  latestAssessment: {
    id: string;
    assessedAt: Date;
    note: string | null;
    stats: AssessmentStats;
  } | null;
  /** 最新評比中未完成項目，權重高→低前 3 名 */
  topUnfinished: ResultRow[];
  openIssueCount: number;
  /** 未結案 issue 中最久遠的 3 筆 */
  oldestIssues: OpenIssueSummary[];
}

/** 一次抓齊所有（或指定）公司的總覽資料：公司、模組、最新評比、未結案 issue、即時數據與健康度。 */
export async function getCompanyOverviews(ids?: string[]): Promise<CompanyOverview[]> {
  const companies = await prisma.company.findMany({
    where: ids ? { id: { in: ids } } : undefined,
    orderBy: { name: "asc" },
    include: {
      industry: true,
      modules: { include: { module: true }, orderBy: { module: { order: "asc" } } },
    },
  });
  if (companies.length === 0) return [];

  const companyIds = companies.map((c) => c.id);
  const [latestAssessments, openIssues] = await Promise.all([
    prisma.assessment.findMany({
      where: { companyId: { in: companyIds } },
      orderBy: { assessedAt: "desc" },
      distinct: ["companyId"],
      include: { results: { orderBy: { sortOrder: "asc" } } },
    }),
    prisma.issue.findMany({
      where: { companyId: { in: companyIds }, status: { not: "resolved" } },
      orderBy: { occurredAt: "asc" },
    }),
  ]);

  const now = Date.now();

  return Promise.all(
    companies.map(async (company) => {
      const assessment = latestAssessments.find((a) => a.companyId === company.id) ?? null;
      const stats = assessment ? computeAssessmentStats(assessment.results) : null;
      const issues: OpenIssueSummary[] = openIssues
        .filter((i) => i.companyId === company.id)
        .map((i) => ({
          id: i.id,
          title: i.title,
          priority: i.priority,
          status: i.status,
          occurredAt: i.occurredAt,
          ageDays: Math.max(0, Math.floor((now - i.occurredAt.getTime()) / DAY_MS)),
        }));
      const live = await getLiveStats(company);

      const health = computeHealth({
        usage: {
          aiRecognitionRate: live.stats.aiRecognitionRate,
          aiSatisfaction: live.stats.aiSatisfaction,
          agentSatisfaction: live.stats.agentSatisfaction,
          aiTransferRate: live.stats.aiTransferRate,
        },
        assessmentScore: stats && stats.totalCount > 0 ? stats.score : null,
        openIssueAges: issues.map((i) => i.ageDays),
      });

      return {
        id: company.id,
        name: company.name,
        description: company.description,
        painPoints: company.painPoints,
        industry: { id: company.industry.id, name: company.industry.name },
        modules: company.modules.map((m) => ({ id: m.module.id, name: m.module.name })),
        live,
        health,
        latestAssessment:
          assessment && stats
            ? { id: assessment.id, assessedAt: assessment.assessedAt, note: assessment.note, stats }
            : null,
        topUnfinished: stats ? stats.unfinished.slice(0, 3) : [],
        openIssueCount: issues.length,
        oldestIssues: issues.slice(0, 3),
      };
    })
  );
}

export async function getCompanyOverview(id: string): Promise<CompanyOverview | null> {
  const [overview] = await getCompanyOverviews([id]);
  return overview ?? null;
}

export interface CompanyChecklist {
  industryName: string;
  /** 通用行業的項目（所有公司繼承） */
  common: TreeNode<CheckItem>[];
  /** 該公司所屬行業的項目 */
  industry: TreeNode<CheckItem>[];
  /** 該公司自己新增的專屬項目 */
  own: TreeNode<CompanyCheckItem>[];
}

/** 取得公司適用的完整檢核項目：通用 ＋ 所屬行業 ＋ 公司專屬。 */
export async function getCompanyChecklist(companyId: string): Promise<CompanyChecklist | null> {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: { industry: true },
  });
  if (!company) return null;

  const [commonItems, industryItems, ownItems] = await Promise.all([
    company.industry.isCommon
      ? Promise.resolve([] as CheckItem[])
      : prisma.checkItem.findMany({ where: { industry: { isCommon: true } } }),
    prisma.checkItem.findMany({ where: { industryId: company.industryId } }),
    prisma.companyCheckItem.findMany({ where: { companyId } }),
  ]);

  return {
    industryName: company.industry.name,
    common: buildTree(commonItems),
    industry: buildTree(industryItems),
    own: buildTree(ownItems),
  };
}

/** 依顯示順序（通用 → 行業 → 公司專屬）攤平成評比快照用的葉節點清單。 */
export function checklistLeaves(checklist: CompanyChecklist): LeafSnapshot[] {
  return [
    ...flattenLeaves(checklist.common),
    ...flattenLeaves(checklist.industry),
    ...flattenLeaves(checklist.own),
  ];
}
