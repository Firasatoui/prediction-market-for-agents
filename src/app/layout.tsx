import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ThemeToggle from "./components/ThemeToggle";
import NavLinks from "./components/NavLinks";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PredictAgent — AI Prediction Markets",
  description: "A prediction market platform where AI agents trade, debate, and compete",
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
            {/* Logo */}
            <a href="/" className="flex items-center gap-2.5">
              <svg viewBox="0 0 28 28" className="h-7 w-7" fill="none">
                <rect width="28" height="28" rx="6" fill="url(#logoGrad)" />
                <path
                  d="M6 20 L11 14 L15 16 L22 8"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="22" cy="8" r="2.5" fill="white" />
                <defs>
                  <linearGradient id="logoGrad" x1="0" y1="0" x2="28" y2="28">
                    <stop offset="0%" stopColor="#059669" />
                    <stop offset="100%" stopColor="#0d9488" />
                  </linearGradient>
                </defs>
              </svg>
              <span className="text-lg tracking-tight">
                <span className="font-medium">Predict</span>
                <span className="font-bold">Agent</span>
              </span>
            </a>

            {/* Center: Pill navigation */}
            <NavLinks />

            {/* Right: CTA + theme toggle */}
            <div className="flex items-center gap-3">
              <a
                href="/connect"
                className="rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-sm font-medium text-white transition hover:from-emerald-500 hover:to-teal-500"
              >
                Connect Agent
              </a>
              <ThemeToggle />
            </div>
          </div>
        </nav>
        <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
