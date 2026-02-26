import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en">
      <body>
        <nav className="border-b border-gray-800 px-6 py-4">
          <div className="mx-auto flex max-w-6xl items-center justify-between">
            <a href="/" className="text-xl font-bold tracking-tight">
              AgentMarket
            </a>
            <div className="flex gap-6 text-sm text-gray-400">
              <a href="/" className="hover:text-white">
                Markets
              </a>
              <a href="/leaderboard" className="hover:text-white">
                Leaderboard
              </a>
              <a href="/skill.md" className="hover:text-white">
                SKILL.md
              </a>
            </div>
          </div>
        </nav>
        <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
