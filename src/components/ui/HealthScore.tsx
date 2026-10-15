"use client";

import { useState } from "react";
import { HEALTH_BAND_LABEL, type HealthResult } from "@/lib/health";
import { healthTextClass, healthTextClassDark } from "@/components/ui/HealthBar";
import { IconInfo } from "@/components/icons";

/** 健康度分數＋「小 i」：滑過或點擊顯示各分項分數、權重與計算公式。 */
export function HealthScore({
  health,
  size = "md",
  popoverSide = "left",
  tone = "light",
}: {
  health: HealthResult;
  size?: "md" | "lg" | "xl" | "hero" | "huge";
  popoverSide?: "left" | "right";
  /** dark＝放在深色背景上，數字改用較亮的顏色、資訊圖示改淺色 */
  tone?: "light" | "dark";
}) {
  const [open, setOpen] = useState(false);
  const numberSize =
    size === "huge"
      ? "text-[11rem]"
      : size === "hero"
        ? "text-[7.5rem]"
        : size === "xl"
          ? "text-7xl"
          : size === "lg"
            ? "text-5xl"
            : "text-3xl";
  const numberColor =
    tone === "dark" ? healthTextClassDark(health.score) : healthTextClass(health.score);

  return (
    <div className="relative inline-flex items-start gap-2">
      <span
        className={`${numberSize} font-extrabold leading-none tracking-tight tabular-nums ${numberColor}`}
      >
        {health.score === null ? "—" : health.score}
      </span>
      <button
        type="button"
        aria-label="查看健康度計算方式"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen((v) => !v)}
        className={`mt-0.5 rounded-full transition ${
          tone === "dark" ? "text-blue-200/70 hover:text-white" : "text-slate-400 hover:text-brand-600"
        }`}
      >
        <IconInfo
          className={
            size === "huge" ? "h-10 w-10" : size === "hero" ? "h-8 w-8" : size === "xl" ? "h-6 w-6" : "h-5 w-5"
          }
        />
      </button>

      {open && (
        <div
          role="tooltip"
          className={`absolute top-full z-30 mt-2 w-80 rounded-xl border border-slate-200 bg-white p-4 text-left shadow-xl ${
            popoverSide === "left" ? "left-0" : "right-0"
          }`}
        >
          <p className="text-sm font-bold text-slate-900">
            健康度 {health.score ?? "—"}・{HEALTH_BAND_LABEL[health.band]}
          </p>
          <p className="mt-1 rounded-md bg-slate-50 px-2 py-1.5 text-xs font-medium text-slate-700">
            {health.formula}
          </p>
          <ul className="mt-3 space-y-2.5">
            {health.parts.map((part) => (
              <li key={part.key} className="text-xs">
                <div className="flex items-center justify-between font-semibold text-slate-800">
                  <span>
                    {part.label}（權重 {part.weight}%
                    {part.score !== null && Math.round(part.share) !== part.weight
                      ? `，實際 ${Math.round(part.share)}%`
                      : ""}
                    ）
                  </span>
                  <span className={healthTextClass(part.score)}>
                    {part.score === null ? "不計入" : Math.round(part.score)}
                  </span>
                </div>
                <p className="mt-0.5 leading-relaxed text-slate-500">{part.detail}</p>
              </li>
            ))}
          </ul>
          <p className="mt-3 border-t border-slate-100 pt-2 text-[11px] leading-relaxed text-slate-400">
            ≥80 健康、50–79 風險、&lt;50 危急。缺資料的項目不計入，權重會按比例分給其他項目。
          </p>
        </div>
      )}
    </div>
  );
}
