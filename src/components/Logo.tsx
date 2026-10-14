import { IconShieldCheck } from "@/components/icons";

export function Logo({ subtitle = "客服專案管理", dark = true }: { subtitle?: string; dark?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white shadow-lg shadow-brand-600/30">
        <IconShieldCheck className="h-6 w-6" />
      </span>
      <div className="leading-tight">
        <p className={`text-lg font-extrabold tracking-wide ${dark ? "text-white" : "text-slate-900"}`}>
          AICSM
        </p>
        <p className={`text-[11px] tracking-wider ${dark ? "text-blue-200/70" : "text-slate-500"}`}>
          {subtitle}
        </p>
      </div>
    </div>
  );
}
