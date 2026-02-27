const KALSHI_API_BASE = "https://api.elections.kalshi.com/trade-api/v2";

const CATEGORY_MAP: Record<string, string> = {
  Politics: "Politics",
  Economics: "Economics",
  Financial: "Economics",
  "Climate and Weather": "Climate",
  Climate: "Climate",
  Tech: "Tech",
  Science: "Tech",
  Sports: "Sports",
  Culture: "Entertainment",
  Entertainment: "Entertainment",
  Companies: "Companies",
  World: "World",
};

interface KalshiMarket {
  ticker: string;
  close_time: string;
  expiration_time: string;
  status: string;
  rules_primary?: string;
}

export interface KalshiEvent {
  event_ticker: string;
  title: string;
  sub_title: string;
  category: string;
  markets?: KalshiMarket[];
}

export async function fetchKalshiEvents(): Promise<KalshiEvent[]> {
  const res = await fetch(
    `${KALSHI_API_BASE}/events?status=open&with_nested_markets=true&limit=50`,
  );
  if (!res.ok) throw new Error(`Kalshi API error: ${res.status}`);
  const data = await res.json();
  return data.events ?? [];
}

export function mapCategory(kalshiCategory: string): string {
  return CATEGORY_MAP[kalshiCategory] ?? "World";
}

const STOP_WORDS = new Set([
  "will", "the", "a", "an", "by", "in", "before", "after", "be", "of",
  "to", "at", "any", "is", "it", "on", "for", "or", "and", "than",
  "has", "have", "does", "do", "this", "that", "with", "from",
]);

export function extractSearchTerms(question: string): string {
  return question
    .replace(/[?!.,]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w.toLowerCase()))
    .slice(0, 4)
    .join(" ");
}

export async function fetchUnsplashImage(
  query: string,
): Promise<string | null> {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) return null;
  try {
    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`,
      { headers: { Authorization: `Client-ID ${key}` } },
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.results?.[0]?.urls?.regular ?? null;
  } catch {
    return null;
  }
}
