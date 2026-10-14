import type { Metadata } from "next";
import { getCompanyOverviews } from "@/lib/company";
import { parseTvLayout } from "@/components/tv/layouts";
import { TvWall } from "@/components/tv/TvWall";

// 電視牆（公開頁面，不需登入）：資料即時性重要，一律動態渲染。
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "AICSM 電視牆",
};

export default async function TvPage({
  searchParams,
}: {
  searchParams: Promise<{ layout?: string }>;
}) {
  const { layout } = await searchParams;
  const companies = await getCompanyOverviews();
  return <TvWall companies={companies} initialLayout={parseTvLayout(layout)} />;
}
