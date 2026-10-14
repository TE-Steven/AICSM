import { healthBand, type HealthBand } from "@/lib/health";

const BAR: Record<HealthBand, string> = {
  healthy: "bg-emerald-500",
  atRisk: "bg-amber-500",
  critical: "bg-rose-500",
  none: "bg-slate-300",
};

const TEXT: Record<HealthBand, string> = {
  healthy: "text-emerald-600",
  atRisk: "text-amber-600",
  critical: "text-rose-600",
  none: "text-slate-400",
};

export function healthTextClass(score: number | null): string {
  return TEXT[healthBand(score)];
}

export function healthBarClass(score: number | null): string {
  return BAR[healthBand(score)];
}

/** 表格內用的細長健康度條＋分數。 */
export function HealthBar({ score }: { score: number | null }) {
  const band = healthBand(score);
  const pct = score === null ? 0 : Math.max(0, Math.min(100, score));
  return (
    <div className="flex items-center gap-2.5">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${BAR[band]}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`w-7 text-right text-sm font-bold tabular-nums ${TEXT[band]}`}>
        {score === null ? "—" : Math.round(score)}
      </span>
    </div>
  );
}
