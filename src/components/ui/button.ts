export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-brand-600 text-white shadow-sm shadow-brand-600/25 hover:bg-brand-700 disabled:opacity-50",
  secondary:
    "border border-slate-300 bg-white text-slate-700 shadow-sm hover:border-slate-400 hover:bg-slate-50",
  danger: "border border-rose-200 bg-white text-rose-600 hover:bg-rose-50",
  ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
};

/** 按鈕樣式（可用在 <button> 或 <Link>）。 */
export function btn(variant: ButtonVariant = "primary", size: "md" | "sm" = "md"): string {
  const sizing = size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2.5 text-sm";
  return `inline-flex items-center justify-center gap-1.5 rounded-lg font-semibold transition ${sizing} ${VARIANTS[variant]}`;
}

export const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm shadow-sm transition placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100";
