export const TV_LAYOUTS = [
  { key: "light", label: "明亮看板", description: "白底卡片，適合白天辦公室，資訊最完整" },
  { key: "dark", label: "深色指揮中心", description: "深藍底高對比，適合光線較暗的空間" },
  { key: "focus", label: "大字聚焦", description: "超大健康度與公司名，遠距離一眼看懂" },
] as const;

export type TvLayout = (typeof TV_LAYOUTS)[number]["key"];

export const DEFAULT_TV_LAYOUT: TvLayout = "light";

export function parseTvLayout(value: string | undefined): TvLayout {
  return TV_LAYOUTS.some((l) => l.key === value) ? (value as TvLayout) : DEFAULT_TV_LAYOUT;
}
