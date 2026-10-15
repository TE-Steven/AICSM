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
const COMPANY_DETAILS: Record<string, { description: string; painPoints: string }> = {
  "王品": {
    "description": "國內大型餐飲集團，旗下多個品牌與門市，客服涵蓋訂位、外送與客訴。",
    "painPoints": "多品牌、多門市的訂位、外送與客訴詢問量大，且集中在用餐尖峰時段；各分店的回覆說法與補償標準不一；LINE、官網與電話等渠道分散，缺少統一的客服紀錄。希望導入智能客服分流訂位與常見問題，降低客服人力負擔並縮短回覆時間。（草擬，待確認）"
  },
  "星巴克": {
    "description": "連鎖咖啡品牌，台灣門市遍布，客服涵蓋會員、行動訂購與門市服務。",
    "painPoints": "會員點數、隨行杯與行動訂購相關詢問量大且重複性高；新品與節慶活動檔期詢問量暴增。希望以智能客服處理會員與訂單常見問題，讓真人客服專注在客訴與例外狀況。（草擬，待確認）"
  },
  "昇恆昌": {
    "description": "免稅與精品零售通路，服務包含機場與市區門市及線上預購。",
    "painPoints": "旅客預購、取貨與退換貨詢問集中在出入境時段，時效要求高；商品、優惠與庫存資訊更新頻繁，客服不易即時查證。希望導入智能客服提供預購取貨與優惠查詢，並在尖峰時段自動分流。（草擬，待確認）"
  },
  "萬通教育": {
    "description": "教育訓練與線上學習服務提供者，客服涵蓋課程諮詢、報名與學習問題。",
    "painPoints": "課程諮詢與報名季詢問量暴增；學員帳號登入、課程存取與付款問題重複性高；缺少統一管理各渠道詢問的工具。希望以智能客服處理課程與報名常見問題，並以工單追蹤學員問題。（草擬，待確認）"
  },
  "鼎恒": {
    "description": "數位平台服務業者，提供線上服務與會員帳號。",
    "painPoints": "帳號登入、金流扣款與服務異常的詢問多，且需要快速回應；客服人力有限，夜間與假日無人值守。希望導入智能客服與語音客服延長服務時間，降低錯過客戶詢問的風險。（草擬，待確認）"
  },
  "曜胜": {
    "description": "美業品牌與門市，客服涵蓋預約、療程諮詢與會員服務。",
    "painPoints": "預約、改期與取消詢問大量集中在 LINE，容易漏接；療程與產品諮詢需要一致且專業的回覆；會員儲值與療程券問題需要查證。希望以智能客服處理預約與常見諮詢，並保留真人處理客訴與術後照護。（草擬，待確認）"
  },
  "群光電子": {
    "description": "電子產品製造與品牌業者，客服涵蓋產品使用、保固與維修。",
    "painPoints": "產品故障排除與保固查詢重複性高；新品上市期間詢問量暴增；售後維修進度需要人工查詢。希望導入智能客服提供故障排除指引與保固查詢，並整合工單追蹤維修進度。（草擬，待確認）"
  },
  "追覓家電": {
    "description": "智能家電品牌，客服涵蓋產品使用教學、保固維修與電商訂單。",
    "painPoints": "智能家電的操作設定與連線問題多，需要圖文或影片引導；配件耗材相容性與電商訂單物流查詢量大；多個電商平台的詢問分散。希望以智能客服提供操作教學與訂單查詢，並整合各渠道的客服紀錄。（草擬，待確認）"
  },
  "柯達飯店": {
    "description": "旅宿業者，客服涵蓋訂房、入住退房與住宿期間需求。",
    "painPoints": "訂房、改期與房況房價詢問多，且分散在官網、LINE 與 OTA；入住期間的客房需求與報修需要即時回應；旺季與連假詢問量暴增；OTA 與 Google 評論需要及時回覆。希望以智能客服處理訂房與常見問題，讓櫃檯專注在現場服務。（草擬，待確認）"
  }
};

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
  companyDetails: number;
  checkItems: number;
}

export async function seedAicsm(prisma: PrismaClient): Promise<SeedReport> {
  const report: SeedReport = { industries: 0, modules: 0, companies: 0, companyDetails: 0, checkItems: 0 };

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
    const details = COMPANY_DETAILS[spec.name];
    const exists = await prisma.company.findFirst({ where: { name: spec.name } });
    if (!exists) {
      await prisma.company.create({
        data: {
          name: spec.name,
          industryId: industryIdByName.get(spec.industry)!,
          description: details?.description ?? null,
          painPoints: details?.painPoints ?? null,
        },
      });
      report.companies += 1;
      continue;
    }
    // 只補空白欄位，已經有內容（包含你自己改過的）一律不覆蓋
    const fill: { description?: string; painPoints?: string } = {};
    if (!exists.description && details?.description) fill.description = details.description;
    if (!exists.painPoints && details?.painPoints) fill.painPoints = details.painPoints;
    if (Object.keys(fill).length > 0) {
      await prisma.company.update({ where: { id: exists.id }, data: fill });
      report.companyDetails += 1;
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
