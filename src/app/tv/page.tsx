import type { Metadata } from "next";
import { getCompanyOverviews } from "@/lib/company";
import { TvWall } from "@/components/TvWall";

// 電視牆（公開頁面，不需登入）：資料即時性重要，一律動態渲染。
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "AICSM 電視牆",
};

export default async function TvPage() {
  const companies = await getCompanyOverviews();
  return <TvWall companies={companies} />;
}
