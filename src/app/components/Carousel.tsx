"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";

interface Market {
  id: string;
  question: string;
  description: string | null;
  image_url: string | null;
  yes_pool: number;
  no_pool: number;
  resolved: boolean;
  outcome: string | null;
  resolution_date: string;
}

const GRADIENTS = [
  "from-brand-600 to-brand-800",
  "from-emerald-700 to-teal-900",
  "from-brand-700 to-emerald-900",
  "from-teal-700 to-brand-900",
];

export default function Carousel({ markets }: { markets: Market[] }) {
  const [current, setCurrent] = useState(0);
  const items = markets.slice(0, 6);

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % items.length);
  }, [items.length]);

  useEffect(() => {
    if (items.length <= 1) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next, items.length]);

  if (items.length === 0) return null;

  const market = items[current];
  const yesPrice = market.no_pool / (market.yes_pool + market.no_pool);
  const pct = Math.round(yesPrice * 100);

  return (
    <div className="relative mb-8 overflow-hidden rounded-2xl">
      {/* Background */}
      <div className="relative h-[200px] sm:h-[320px]">
        {market.image_url ? (
          <Image
            src={market.image_url}
            alt={market.question}
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
        ) : (
          <div
            className={`absolute inset-0 bg-gradient-to-br ${GRADIENTS[current % GRADIENTS.length]}`}
          />
        )}
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20" />

        {/* Content */}
        <div className="absolute inset-0 flex flex-col justify-end p-4 sm:p-6">
          <Link href={`/markets/${market.id}`} className="group">
            <h2 className="mb-1 text-lg font-bold text-white drop-shadow-lg sm:mb-2 sm:text-3xl">
              {market.question}
            </h2>
            {market.description && (
              <p className="mb-4 hidden max-w-2xl text-sm text-white/70 sm:block">
                {market.description}
              </p>
            )}
          </Link>

          {/* Probability + info bar */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2 rounded-full bg-black/50 px-4 py-2 backdrop-blur-sm">
              <span className="text-sm text-white/70">YES</span>
              <span
                className="text-lg font-bold"
                style={{ color: "var(--yes)" }}
              >
                {pct}%
              </span>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-black/50 px-4 py-2 backdrop-blur-sm">
              <span className="text-sm text-white/70">NO</span>
              <span
                className="text-lg font-bold"
                style={{ color: "var(--no)" }}
              >
                {100 - pct}%
              </span>
            </div>
            <span className="text-xs text-white/50">
              Resolves {new Date(market.resolution_date).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Nav arrows */}
        {items.length > 1 && (
          <>
            <button
              onClick={() =>
                setCurrent((c) => (c - 1 + items.length) % items.length)
              }
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white backdrop-blur-sm transition hover:bg-black/60"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white backdrop-blur-sm transition hover:bg-black/60"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Dot indicators */}
      {items.length > 1 && (
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-2 rounded-full transition-all ${
                i === current
                  ? "w-6 bg-white"
                  : "w-2 bg-white/40 hover:bg-white/60"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
