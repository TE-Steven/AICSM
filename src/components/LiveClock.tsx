"use client";

import { useEffect, useState } from "react";

export function LiveClock({ tone = "light" }: { tone?: "light" | "dark" }) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const initial = setTimeout(() => setNow(new Date()), 0);
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => {
      clearTimeout(initial);
      clearInterval(id);
    };
  }, []);

  if (!now) {
    return <div className="h-[42px] w-32" />;
  }

  return (
    <div className="text-right">
      <p className={`text-lg font-semibold tabular-nums ${tone === "dark" ? "text-white" : "text-slate-700"}`}>
        {now.toLocaleTimeString("zh-TW", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })}
      </p>
      <p className={`text-xs ${tone === "dark" ? "text-blue-200/70" : "text-slate-400"}`}>
        {now.toLocaleDateString("zh-TW", {
          year: "numeric",
          month: "long",
          day: "numeric",
          weekday: "long",
        })}
      </p>
    </div>
  );
}
