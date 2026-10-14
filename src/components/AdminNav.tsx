"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconDashboard, IconBuilding, IconTag, IconPackage } from "@/components/icons";

const NAV_ITEMS = [
  { href: "/admin", label: "總覽", icon: IconDashboard, exact: true },
  { href: "/admin/companies", label: "公司管理", icon: IconBuilding, exact: false },
  { href: "/admin/industries", label: "行業別管理", icon: IconTag, exact: false },
  { href: "/admin/modules", label: "產品模組管理", icon: IconPackage, exact: false },
];

export function AdminNav({ variant = "sidebar" }: { variant?: "sidebar" | "top" }) {
  const pathname = usePathname();

  return (
    <nav className={variant === "sidebar" ? "space-y-1 px-3" : "flex gap-1 overflow-x-auto px-3 pb-2"}>
      {NAV_ITEMS.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex shrink-0 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
              active
                ? "bg-brand-600 text-white shadow-md shadow-brand-600/30"
                : "text-blue-100/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.1 : 1.8} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
