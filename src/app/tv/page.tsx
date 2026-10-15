import type { Metadata } from "next";
import { currentIsoTime, getCompanyOverviews } from "@/lib/company";
import { TvWall } from "@/components/tv/TvWall";

// 電視牆（公開頁面，不需登入）：資料即時性重要，一律動態渲染。
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "AICSM 電視牆",
};

const DEFAULT_SECONDS = 15;
const MIN_SECONDS = 5;
const MAX_SECONDS = 600;

function parseSeconds(raw: string | undefined): number {
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) return DEFAULT_SECONDS;
  return Math.min(MAX_SECONDS, Math.max(MIN_SECONDS, Math.round(value)));
}

export default async function TvPage({
  searchParams,
}: {
  searchParams: Promise<{ companies?: string; interval?: string }>;
}) {
  const { companies: companiesParam, interval } = await searchParams;
  // 沒帶 companies 參數＝播放全部公司；帶了就只播放勾選的公司（只有 1 家時不輪播）
  const ids = companiesParam ? companiesParam.split(",").filter(Boolean) : undefined;
  const companies = await getCompanyOverviews(ids);

  return <TvWall companies={companies} generatedAt={currentIsoTime()} slideSeconds={parseSeconds(interval)} />;
}
