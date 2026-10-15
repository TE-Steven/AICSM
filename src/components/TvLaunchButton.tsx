"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { IconPlay } from "@/components/icons";
import { btn, inputClass } from "@/components/ui/button";

const PRESETS = [10, 15, 20, 30, 60];
const MIN_SECONDS = 5;
const MAX_SECONDS = 600;
const STORAGE_KEY = "aicsm-tv-settings";

interface Saved {
  seconds?: number;
  ids?: string[];
}

/**
 * 「播放電視牆」按鈕：先跳出設定視窗，選每家公司停幾秒、勾選要播放的公司，
 * 再開新分頁播放。只勾選 1 家公司時不輪播（固定顯示那一家）。
 */
export function TvLaunchButton({
  companies,
  className,
  children,
}: {
  companies: { id: string; name: string }[];
  className: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [seconds, setSeconds] = useState(15);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const openDialog = () => {
    // 沿用上次的設定（瀏覽器儲存，讀不到就用預設：全部公司、15 秒）
    let saved: Saved = {};
    try {
      saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as Saved;
    } catch {
      saved = {};
    }
    const valid = new Set(companies.map((c) => c.id));
    const ids = Array.isArray(saved.ids) ? saved.ids.filter((id) => valid.has(id)) : [];
    setSelected(new Set(ids.length ? ids : companies.map((c) => c.id)));
    setSeconds(
      typeof saved.seconds === "number" && saved.seconds >= MIN_SECONDS ? saved.seconds : 15
    );
    setOpen(true);
  };

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const clampedSeconds = Math.min(MAX_SECONDS, Math.max(MIN_SECONDS, Math.round(seconds) || 15));
  const chosen = companies.filter((c) => selected.has(c.id));

  const start = () => {
    if (chosen.length === 0) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ seconds: clampedSeconds, ids: chosen.map((c) => c.id) })
      );
    } catch {
      // 瀏覽器不允許儲存時略過，不影響播放
    }
    const params = new URLSearchParams();
    // 全選時不帶公司參數，之後新增的公司也會自動加入輪播
    if (chosen.length < companies.length) params.set("companies", chosen.map((c) => c.id).join(","));
    params.set("interval", String(clampedSeconds));
    window.open(`/tv?${params.toString()}`, "_blank", "noopener");
    setOpen(false);
  };

  return (
    <>
      <button type="button" onClick={openDialog} className={className}>
        {children}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-label="電視牆播放設定"
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-slate-900">電視牆播放設定</h2>

            <div className="mt-5">
              <p className="mb-2 text-sm font-semibold text-slate-700">每家公司停留秒數</p>
              <div className="flex flex-wrap items-center gap-2">
                {PRESETS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSeconds(s)}
                    className={`rounded-lg px-3.5 py-2 text-sm font-semibold transition ${
                      clampedSeconds === s && seconds === s
                        ? "bg-brand-600 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {s} 秒
                  </button>
                ))}
                <span className="flex items-center gap-1.5 text-sm text-slate-500">
                  自訂
                  <input
                    type="number"
                    min={MIN_SECONDS}
                    max={MAX_SECONDS}
                    value={seconds}
                    onChange={(e) => setSeconds(Number(e.target.value))}
                    className={`${inputClass} !w-20 !py-1.5 text-center`}
                  />
                  秒
                </span>
              </div>
              <p className="mt-1.5 text-xs text-slate-400">可設定 {MIN_SECONDS}–{MAX_SECONDS} 秒</p>
            </div>

            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-700">
                  要播放的公司（已選 {chosen.length} / {companies.length}）
                </p>
                <span className="flex gap-3 text-xs font-semibold">
                  <button
                    type="button"
                    className="text-brand-600 hover:underline"
                    onClick={() => setSelected(new Set(companies.map((c) => c.id)))}
                  >
                    全選
                  </button>
                  <button
                    type="button"
                    className="text-slate-500 hover:underline"
                    onClick={() => setSelected(new Set())}
                  >
                    清除
                  </button>
                </span>
              </div>
              <div className="grid max-h-64 grid-cols-2 gap-2 overflow-y-auto pr-1">
                {companies.map((c) => (
                  <label
                    key={c.id}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50 has-[:checked]:text-brand-700"
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(c.id)}
                      onChange={() => toggle(c.id)}
                      className="h-4 w-4 rounded border-slate-300 text-brand-600"
                    />
                    <span className="truncate">{c.name}</span>
                  </label>
                ))}
              </div>
              <p className="mt-2 text-xs text-slate-500">
                {chosen.length === 0
                  ? "請至少勾選 1 家公司。"
                  : chosen.length === 1
                    ? "只勾選 1 家公司：不會輪播，固定顯示這一家。"
                    : `將每 ${clampedSeconds} 秒輪播到下一家，共 ${chosen.length} 家。`}
              </p>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setOpen(false)} className={btn("secondary")}>
                取消
              </button>
              <button type="button" onClick={start} disabled={chosen.length === 0} className={btn("primary")}>
                <IconPlay className="h-4 w-4" />
                開始播放
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
