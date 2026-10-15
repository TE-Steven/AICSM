import type { PrismaClient } from "@/generated/prisma/client";
import { CHECKLIST_FRAMEWORK } from "@/lib/seedChecklists";

/**
 * AICSM 基礎資料種子：行業別、產品模組、現有客戶公司、各行業健檢項目。
 *
 * 冪等：每一筆都「先找、找不到才建」，只補缺的，絕不覆蓋或刪除後台已經修改過的資料，
 * 所以可以安心重複執行（後台「初始化基礎資料」按鈕就是呼叫它）。
 */

const COMMON_INDUSTRY = "通用";
const INDUSTRIES = [COMMON_INDUSTRY, "餐飲連鎖", "零售", "數位平台", "消費家電", "美業", "旅宿服務"];
const MODULES = ["文字智能", "語音智能", "文字客服", "文字顧問", "語音"];
const COMPANIES: { name: string; industry: string }[] = [
  { name: "王品", industry: "餐飲連鎖" },
  { name: "星巴克", industry: "餐飲連鎖" },
  { name: "昇恆昌", industry: "零售" },
  { name: "萬通教育", industry: "數位平台" },
  { name: "鼎恒", industry: "數位平台" },
  { name: "曜胜", industry: "美業" },
  { name: "群光電子", industry: "消費家電" },
  { name: "追覓家電", industry: "消費家電" },
  { name: "柯達飯店", industry: "旅宿服務" },
];

export interface SeedReport {
  industries: number;
  modules: number;
  companies: number;
  checkItems: number;
}

export async function seedAicsm(prisma: PrismaClient): Promise<SeedReport> {
  const report: SeedReport = { industries: 0, modules: 0, companies: 0, checkItems: 0 };

  const industryIdByName = new Map<string, string>();
  for (let i = 0; i < INDUSTRIES.length; i++) {
    const name = INDUSTRIES[i];
    let industry = await prisma.industry.findUnique({ where: { name } });
    if (!industry) {
      industry = await prisma.industry.create({
        data: { name, order: i, isCommon: name === COMMON_INDUSTRY },
      });
      report.industries += 1;
    }
    industryIdByName.set(name, industry.id);
  }

  for (let i = 0; i < MODULES.length; i++) {
    const name = MODULES[i];
    const exists = await prisma.module.findUnique({ where: { name } });
    if (!exists) {
      await prisma.module.create({ data: { name, order: i } });
      report.modules += 1;
    }
  }

  for (const spec of COMPANIES) {
    const exists = await prisma.company.findFirst({ where: { name: spec.name } });
    if (!exists) {
      await prisma.company.create({
        data: { name: spec.name, industryId: industryIdByName.get(spec.industry)! },
      });
      report.companies += 1;
    }
  }

  async function ensureItem(
    industryId: string,
    parentId: string | null,
    name: string,
    order: number,
    extra: { description?: string; weight?: number; defaultAction?: string }
  ): Promise<string> {
    const existing = await prisma.checkItem.findFirst({
      where: { industryId, parentId, name },
    });
    if (existing) return existing.id;
    const created = await prisma.checkItem.create({
      data: {
        industryId,
        parentId,
        name,
        order,
        description: extra.description ?? null,
        weight: extra.weight ?? 1,
        defaultAction: extra.defaultAction ?? null,
      },
    });
    report.checkItems += 1;
    return created.id;
  }

  for (let rootIndex = 0; rootIndex < CHECKLIST_FRAMEWORK.length; rootIndex++) {
    const root = CHECKLIST_FRAMEWORK[rootIndex];
    const targets = root.isUniversal ? [COMMON_INDUSTRY] : (root.industryNames ?? []);

    for (const industryName of targets) {
      const industryId = industryIdByName.get(industryName);
      if (!industryId) continue;

      const rootId = await ensureItem(industryId, null, root.name, rootIndex, {
        description: root.description,
      });
      for (let catIndex = 0; catIndex < root.categories.length; catIndex++) {
        const category = root.categories[catIndex];
        const categoryId = await ensureItem(industryId, rootId, category.name, catIndex, {
          description: category.description,
        });
        for (let leafIndex = 0; leafIndex < category.leaves.length; leafIndex++) {
          const leaf = category.leaves[leafIndex];
          await ensureItem(industryId, categoryId, leaf.name, leafIndex, {
            weight: leaf.defaultWeight,
            defaultAction: leaf.defaultAction,
          });
        }
      }
    }
  }

  return report;
}
