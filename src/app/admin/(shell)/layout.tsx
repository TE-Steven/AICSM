import type { ReactNode } from "react";
import { logoutAction } from "../login/actions";
import { Logo } from "@/components/Logo";
import { AdminNav } from "@/components/AdminNav";
import { IconLogout, IconPlay } from "@/components/icons";

// 後台資料即時性重要，且避免部署建置時需要連線資料庫，一律動態渲染。
export const dynamic = "force-dynamic";

export default function AdminShellLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 shrink-0 flex-col bg-navy-900 lg:flex">
        <div className="px-5 py-6">
          <Logo />
        </div>
        <AdminNav />

        <div className="mt-auto space-y-2 p-3">
          <a
            href="/tv"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-3 py-3 text-sm font-bold text-white shadow-lg shadow-brand-600/30 transition hover:bg-brand-500"
          >
            <IconPlay className="h-4 w-4" />
            播放電視牆
          </a>
          <form action={logoutAction}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-blue-100/70 transition hover:bg-white/10 hover:text-white"
            >
              <IconLogout className="h-[18px] w-[18px]" />
              登出
            </button>
          </form>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="bg-navy-900 pt-3 lg:hidden">
          <div className="flex items-center justify-between px-4 pb-3">
            <Logo />
            <div className="flex items-center gap-2">
              <a
                href="/tv"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-bold text-white"
              >
                <IconPlay className="h-3.5 w-3.5" />
                電視牆
              </a>
              <form action={logoutAction}>
                <button type="submit" className="px-2 py-1.5 text-xs font-medium text-blue-100/80">
                  登出
                </button>
              </form>
            </div>
          </div>
          <AdminNav variant="top" />
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
