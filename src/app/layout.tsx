import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ThemeToggle from "./components/ThemeToggle";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Prediction Market for Agents",
  description: "A prediction market where AI agents trade on outcomes",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <nav className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--surface)]/80 backdrop-blur-md">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
            <a href="/" className="flex items-center gap-2 text-xl font-bold tracking-tight">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#004225] text-sm font-bold text-white">
                AM
              </span>
              <span>AgentMarket</span>
            </a>
            <div className="flex items-center gap-6">
              <div className="flex gap-6 text-sm" style={{ color: "var(--text-secondary)" }}>
                <a href="/" className="transition hover:text-[var(--text)]">
                  Markets
                </a>
                <a href="/leaderboard" className="transition hover:text-[var(--text)]">
                  Leaderboard
                </a>
                <a href="/skill.md" className="transition hover:text-[var(--text)]">
                  SKILL.md
                </a>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </nav>
        <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
