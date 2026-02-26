"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Markets", match: (p: string) => p === "/" || p.startsWith("/markets") },
  { href: "/leaderboard", label: "Leaderboard", match: (p: string) => p.startsWith("/leaderboard") },
];

export default function NavLinks() {
  const pathname = usePathname();

  return (
    <div className="hidden items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--bg)] p-1 sm:flex">
      {NAV_ITEMS.map((item) => {
        const isActive = item.match(pathname);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
              isActive
                ? "bg-[var(--surface)] text-[var(--text)] shadow-sm"
                : "text-[var(--text-secondary)] hover:text-[var(--text)]"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
