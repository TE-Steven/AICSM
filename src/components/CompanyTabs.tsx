"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function CompanyTabs({ companyId }: { companyId: string }) {
  const pathname = usePathname();
  const base = `/admin/companies/${companyId}`;
  const tabs = [
    { href: base, label: "概況", exact: true },
    { href: `${base}/edit`, label: "基本資料", exact: false },
    { href: `${base}/stats`, label: "使用數據", exact: false },
    { href: `${base}/issues`, label: "Issue 管理", exact: false },
    { href: `${base}/checklist`, label: "企業健檢檢核管理", exact: false },
    { href: `${base}/purchases`, label: "購買功能管理", exact: false },
  ];

  return (
    <nav className="mb-6 flex gap-1 overflow-x-auto border-b border-slate-200">
      {tabs.map((tab) => {
        const active = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`-mb-px shrink-0 border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
              active
                ? "border-brand-600 text-brand-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
