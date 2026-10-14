"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { CompanyOverview } from "@/lib/company";
import { LiveClock } from "@/components/LiveClock";
import { Logo } from "@/components/Logo";
import { TV_LAYOUTS, type TvLayout } from "@/components/tv/layouts";
import { TvDark } from "@/components/tv/TvDark";
import { TvFocus } from "@/components/tv/TvFocus";
import { TvLight } from "@/components/tv/TvLight";

/** 每家公司在電視牆停留的時間（毫秒）。 */
const SLIDE_MS = 15000;
/** 自動重新抓取最新資料的間隔（毫秒）。 */
const REFRESH_MS = 5 * 60 * 1000;

const ROOT_BG: Record<TvLayout, string> = {
  light: "bg-[#eef2f8] text-slate-900",
  dark: "bg-navy-950 text-white",
  focus: "bg-gradient-to-br from-navy-800 via-navy-900 to-navy-950 text-white",
};

export function TvWall({
  companies,
  initialLayout,
}: {
  companies: CompanyOverview[];
  initialLayout: TvLayout;
}) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [layout, setLayoutState] = useState<TvLayout>(initialLayout);

  const setLayout = (next: TvLayout) => {
    setLayoutState(next);
    // 把版型寫進網址，書籤／重新整理後仍是同一個版型
    const url = new URL(window.location.href);
    url.searchParams.set("layout", next);
    window.history.replaceState(null, "", url.toString());
  };

  useEffect(() => {
    if (paused || companies.length <= 1) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % companies.length), SLIDE_MS);
    return () => clearInterval(timer);
  }, [paused, companies.length, index]);

  useEffect(() => {
    const timer = setInterval(() => router.refresh(), REFRESH_MS);
    return () => clearInterval(timer);
  }, [router]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" && companies.length > 0) setIndex((i) => (i + 1) % companies.length);
      if (e.key === "ArrowLeft" && companies.length > 0)
        setIndex((i) => (i - 1 + companies.length) % companies.length);
      if (e.key === " ") {
        e.preventDefault();
        setPaused((p) => !p);
      }
      if (e.key === "l" || e.key === "L") {
        const keys = TV_LAYOUTS.map((l) => l.key);
        const next = keys[(keys.indexOf(layout) + 1) % keys.length];
        setLayoutState(next);
        const url = new URL(window.location.href);
        url.searchParams.set("layout", next);
        window.history.replaceState(null, "", url.toString());
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [companies.length, layout]);

  const company = companies[index < companies.length ? index : 0];
  const isLight = layout === "light";

  return (
    <div className={`flex min-h-screen flex-col ${ROOT_BG[layout]}`}>
      <header className="flex items-center justify-between gap-6 bg-navy-900 px-10 py-4">
        <Logo subtitle="客服專案健康度電視牆" />
        <div className="flex items-center gap-6">
          <div className="hidden gap-1 rounded-lg bg-white/10 p-1 md:flex" title="按 L 鍵也可切換版型">
            {TV_LAYOUTS.map((l) => (
              <button
                key={l.key}
                type="button"
                onClick={() => setLayout(l.key)}
                className={`rounded-md px-3 py-1 text-xs font-semibold transition ${
                  layout === l.key ? "bg-white text-navy-900" : "text-blue-100/80 hover:text-white"
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
          {paused && (
            <span className="rounded-full bg-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-300">
              已暫停（空白鍵繼續）
            </span>
          )}
          <LiveClock tone="dark" />
        </div>
      </header>

      <div className="h-1 w-full bg-navy-900">
        {company && (
          <div
            key={company.id}
            className="h-full bg-brand-500"
            style={{
              animation: `slideProgress ${SLIDE_MS}ms linear forwards`,
              animationPlayState: paused ? "paused" : "running",
            }}
          />
        )}
      </div>

      {!company ? (
        <main className="flex flex-1 items-center justify-center">
          <p className={`text-lg ${isLight ? "text-slate-400" : "text-blue-200/60"}`}>
            尚無公司資料，請先到後台新增公司。
          </p>
        </main>
      ) : (
        <main key={`${layout}-${company.id}`} className="flex flex-1 flex-col" style={{ animation: "fadeIn 0.5s ease-out" }}>
          {layout === "light" && <TvLight company={company} />}
          {layout === "dark" && <TvDark company={company} />}
          {layout === "focus" && <TvFocus company={company} />}
          {company.live.source === "mock" && (
            <p className={`px-10 pb-2 text-xs ${isLight ? "text-slate-400" : "text-blue-200/50"}`}>
              ※ 使用數據目前為示意資料
            </p>
          )}
        </main>
      )}

      {companies.length > 1 && (
        <footer className="flex flex-wrap items-center justify-center gap-2 px-10 pb-5 pt-1">
          {companies.map((c, i) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setIndex(i)}
              title={c.name}
              aria-label={`切換到 ${c.name}`}
              className={`h-2 rounded-full transition-all ${
                i === index
                  ? "w-10 bg-brand-500"
                  : isLight
                    ? "w-2 bg-slate-300 hover:bg-slate-400"
                    : "w-2 bg-white/30 hover:bg-white/60"
              }`}
            />
          ))}
        </footer>
      )}
    </div>
  );
}
