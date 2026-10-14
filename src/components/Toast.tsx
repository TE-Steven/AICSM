"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { IconCheckCircle } from "@/components/icons";

/** 讀取網址上的 ?success= 參數，短暫顯示成功提示後自動消失並清掉網址參數。 */
export function SuccessToast({ message }: { message: string | null }) {
  const router = useRouter();
  const [visible, setVisible] = useState(!!message);

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      setVisible(false);
      const url = new URL(window.location.href);
      url.searchParams.delete("success");
      router.replace(url.pathname + url.search, { scroll: false });
    }, 3000);
    return () => clearTimeout(timer);
  }, [message, router]);

  if (!message || !visible) return null;

  return (
    <div
      className="fixed right-4 top-4 z-50 flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-medium text-white shadow-lg"
      style={{ animation: "fadeInUp 0.3s ease-out" }}
    >
      <IconCheckCircle className="h-5 w-5 shrink-0" />
      {message}
    </div>
  );
}
