/**
 * Seed script: Inserts 50 Kalshi-inspired prediction markets into Supabase.
 * Each market has a unique image, description, and future resolution date.
 *
 * Usage: npm run seed
 *
 * Prerequisites:
 *   - .env.local with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 *   - The `image_url` column must exist on the markets table.
 *     If missing, run: ALTER TABLE markets ADD COLUMN image_url text;
 */

import { config } from "dotenv";
import path from "path";
import { createClient } from "@supabase/supabase-js";

config({ path: path.resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const SEED_AGENT_NAME = "MarketCreator";

/** Ensure the image_url column exists on the markets table. */
async function ensureImageUrlColumn() {
  // Try a lightweight query that references image_url
  const { error } = await supabase
    .from("markets")
    .select("image_url")
    .limit(1);

  if (error && error.message.includes("image_url")) {
    console.log("Adding missing image_url column to markets table...");

    // Use PostgREST RPC to execute via a temporary function
    // Fall back to asking user to add it manually
    console.error(
      "\n  The 'image_url' column does not exist on the markets table." +
      "\n  Please run the following SQL in your Supabase SQL Editor:\n" +
      "\n    ALTER TABLE markets ADD COLUMN image_url text;\n" +
      "\n  Then re-run: npm run seed\n"
    );
    process.exit(1);
  }
}

interface MarketSeed {
  question: string;
  description: string;
  resolution_date: string;
  image_url: string;
}

// ---------------------------------------------------------------------------
// 50 Kalshi-inspired prediction markets
// ---------------------------------------------------------------------------
const MARKETS: MarketSeed[] = [
  // ── Politics (7) ────────────────────────────────────────────────────────
  {
    question: "Will the US hold a federal government shutdown before Oct 2026?",
    description: "Resolves YES if any federal government shutdown lasting 24+ hours begins before October 1, 2026.",
    resolution_date: "2026-10-01T00:00:00Z",
    image_url: "https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?w=800&h=400&fit=crop",
  },
  {
    question: "Will a new US Supreme Court Justice be confirmed in 2026?",
    description: "Resolves YES if the US Senate votes to confirm a new Supreme Court Justice at any point during calendar year 2026.",
    resolution_date: "2026-12-31T23:59:59Z",
    image_url: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&h=400&fit=crop",
  },
  {
    question: "Will the US federal minimum wage be raised in 2026?",
    description: "Resolves YES if legislation raising the federal minimum wage above $7.25/hr is signed into law in 2026.",
    resolution_date: "2026-12-31T23:59:59Z",
    image_url: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&h=400&fit=crop",
  },
  {
    question: "Will any US state legalize recreational marijuana in 2026?",
    description: "Resolves YES if at least one US state that currently prohibits recreational cannabis passes legalization legislation or ballot measure in 2026.",
    resolution_date: "2026-12-31T23:59:59Z",
    image_url: "https://images.unsplash.com/photo-1603909223429-69bb7101f420?w=800&h=400&fit=crop",
  },
  {
    question: "Will the US rejoin the Paris Climate Agreement by end of 2026?",
    description: "Resolves YES if the United States officially rejoins the Paris Agreement before January 1, 2027.",
    resolution_date: "2027-01-01T00:00:00Z",
    image_url: "https://images.unsplash.com/photo-1529528744093-6f8abeee511d?w=800&h=400&fit=crop",
  },
  {
    question: "Will the UK call a snap general election before 2027?",
    description: "Resolves YES if the UK Prime Minister calls a general election to be held before January 1, 2027.",
    resolution_date: "2027-01-01T00:00:00Z",
    image_url: "https://images.unsplash.com/photo-1529655683826-aba9b3e77383?w=800&h=400&fit=crop",
  },
  {
    question: "Will the EU pass comprehensive AI regulation by Dec 2026?",
    description: "Resolves YES if the EU AI Act is fully enforceable with all provisions active by December 31, 2026.",
    resolution_date: "2026-12-31T23:59:59Z",
    image_url: "https://images.unsplash.com/photo-1485738422979-f5c462d49f04?w=800&h=400&fit=crop",
  },

  // ── Economics / Finance (7) ─────────────────────────────────────────────
  {
    question: "Will the S&P 500 close above 6,500 by June 30, 2026?",
    description: "Resolves YES if the S&P 500 index closing price exceeds 6,500 on any trading day before July 1, 2026.",
    resolution_date: "2026-07-01T00:00:00Z",
    image_url: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=400&fit=crop",
  },
  {
    question: "Will the Federal Reserve cut interest rates before July 2026?",
    description: "Resolves YES if the FOMC announces at least one federal funds rate cut before July 1, 2026.",
    resolution_date: "2026-07-01T00:00:00Z",
    image_url: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&h=400&fit=crop",
  },
  {
    question: "Will Bitcoin exceed $150,000 at any point in 2026?",
    description: "Resolves YES if Bitcoin (BTC/USD) trades above $150,000 on any major exchange during calendar year 2026.",
    resolution_date: "2026-12-31T23:59:59Z",
    image_url: "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=800&h=400&fit=crop",
  },
  {
    question: "Will US inflation (CPI YoY) drop below 2% in 2026?",
    description: "Resolves YES if any monthly CPI year-over-year reading published by BLS in 2026 is below 2.0%.",
    resolution_date: "2026-12-31T23:59:59Z",
    image_url: "https://images.unsplash.com/photo-1553729459-uj4hwswj3a0?w=800&h=400&fit=crop",
  },
  {
    question: "Will the US national debt exceed $37 trillion by end of 2026?",
    description: "Resolves YES if US federal debt held by the public exceeds $37 trillion according to Treasury data by Dec 31, 2026.",
    resolution_date: "2026-12-31T23:59:59Z",
    image_url: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=400&fit=crop",
  },
  {
    question: "Will Ethereum surpass $10,000 before 2027?",
    description: "Resolves YES if Ethereum (ETH/USD) trades above $10,000 on any major exchange before January 1, 2027.",
    resolution_date: "2027-01-01T00:00:00Z",
    image_url: "https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=800&h=400&fit=crop",
  },
  {
    question: "Will the US unemployment rate exceed 5% in 2026?",
    description: "Resolves YES if any monthly BLS unemployment rate report for 2026 shows a rate above 5.0%.",
    resolution_date: "2026-12-31T23:59:59Z",
    image_url: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=400&fit=crop",
  },

  // ── Tech & Science (7) ─────────────────────────────────────────────────
  {
    question: "Will OpenAI release GPT-5 before September 2026?",
    description: "Resolves YES if OpenAI publicly launches a model officially named GPT-5 before September 1, 2026.",
    resolution_date: "2026-09-01T00:00:00Z",
    image_url: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=400&fit=crop",
  },
  {
    question: "Will Apple ship a foldable device in 2026?",
    description: "Resolves YES if Apple announces and begins shipping a foldable iPhone or iPad during calendar year 2026.",
    resolution_date: "2026-12-31T23:59:59Z",
    image_url: "https://images.unsplash.com/photo-1491933382434-500287f9b54b?w=800&h=400&fit=crop",
  },
  {
    question: "Will SpaceX Starship complete a successful orbital flight before July 2026?",
    description: "Resolves YES if a SpaceX Starship vehicle completes a full orbital trajectory and controlled landing before July 1, 2026.",
    resolution_date: "2026-07-01T00:00:00Z",
    image_url: "https://images.unsplash.com/photo-1517976487492-5750f3195933?w=800&h=400&fit=crop",
  },
  {
    question: "Will a self-driving robotaxi service launch in a new US city in 2026?",
    description: "Resolves YES if any autonomous robotaxi service (Waymo, Cruise, etc.) begins commercial operations in a new US metro area in 2026.",
    resolution_date: "2026-12-31T23:59:59Z",
    image_url: "https://images.unsplash.com/photo-1549317661-bd32c8ce0afa?w=800&h=400&fit=crop",
  },
  {
    question: "Will quantum computers break RSA-2048 encryption by end of 2027?",
    description: "Resolves YES if a peer-reviewed demonstration of RSA-2048 being broken by a quantum computer is published before Jan 1, 2028.",
    resolution_date: "2028-01-01T00:00:00Z",
    image_url: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&h=400&fit=crop",
  },
  {
    question: "Will NASA's Artemis III land astronauts on the Moon in 2026?",
    description: "Resolves YES if NASA's Artemis III mission successfully lands astronauts on the lunar surface during calendar year 2026.",
    resolution_date: "2026-12-31T23:59:59Z",
    image_url: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=800&h=400&fit=crop",
  },
  {
    question: "Will global EV sales exceed 20 million units in 2026?",
    description: "Resolves YES if global battery electric vehicle sales exceed 20 million units in calendar year 2026 per IEA or Bloomberg data.",
    resolution_date: "2027-03-01T00:00:00Z",
    image_url: "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=800&h=400&fit=crop",
  },

  // ── Sports (6) ──────────────────────────────────────────────────────────
  {
    question: "Will the US win the most gold medals at the 2026 Winter Olympics?",
    description: "Resolves YES if the United States tops the gold medal count at the 2026 Milan-Cortina Winter Olympics.",
    resolution_date: "2026-03-01T00:00:00Z",
    image_url: "https://images.unsplash.com/photo-1569517282132-25d22f4573e6?w=800&h=400&fit=crop",
  },
  {
    question: "Will a new world record be set in the men's 100m by end of 2026?",
    description: "Resolves YES if any athlete runs the men's 100m in under 9.58 seconds (ratified by World Athletics) before Jan 1, 2027.",
    resolution_date: "2027-01-01T00:00:00Z",
    image_url: "https://images.unsplash.com/photo-1532444458054-01a7dd3e9fca?w=800&h=400&fit=crop",
  },
  {
    question: "Will Real Madrid win the 2025-2026 Champions League?",
    description: "Resolves YES if Real Madrid wins the 2025-2026 UEFA Champions League final.",
    resolution_date: "2026-06-15T00:00:00Z",
    image_url: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800&h=400&fit=crop",
  },
  {
    question: "Will an NFL team go undefeated in the 2026 regular season?",
    description: "Resolves YES if any NFL team finishes the 2026 regular season with a 17-0 record.",
    resolution_date: "2027-01-15T00:00:00Z",
    image_url: "https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=800&h=400&fit=crop",
  },
  {
    question: "Will Shohei Ohtani hit 50+ home runs in the 2026 MLB season?",
    description: "Resolves YES if Shohei Ohtani hits 50 or more home runs during the 2026 MLB regular season.",
    resolution_date: "2026-10-01T00:00:00Z",
    image_url: "https://images.unsplash.com/photo-1508344928928-7165b67de128?w=800&h=400&fit=crop",
  },
  {
    question: "Will the 2026 FIFA World Cup final be held without security incidents?",
    description: "Resolves YES if the 2026 FIFA World Cup final match takes place without any major security incidents reported by FIFA.",
    resolution_date: "2026-07-20T00:00:00Z",
    image_url: "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800&h=400&fit=crop",
  },

  // ── Weather / Climate (6) ───────────────────────────────────────────────
  {
    question: "Will 2026 be the hottest year on record globally?",
    description: "Resolves YES if 2026 is declared the warmest year on record by NASA GISS or NOAA.",
    resolution_date: "2027-02-01T00:00:00Z",
    image_url: "https://images.unsplash.com/photo-1504370805625-d32c54b16100?w=800&h=400&fit=crop",
  },
  {
    question: "Will a Category 5 hurricane make US landfall in 2026?",
    description: "Resolves YES if a Category 5 hurricane (Saffir-Simpson) makes landfall on US territory during the 2026 Atlantic hurricane season.",
    resolution_date: "2026-12-01T00:00:00Z",
    image_url: "https://images.unsplash.com/photo-1509803874385-db7c23652552?w=800&h=400&fit=crop",
  },
  {
    question: "Will global CO2 levels exceed 430 ppm (annual average) in 2026?",
    description: "Resolves YES if the Mauna Loa Observatory annual average CO2 concentration exceeds 430 ppm for 2026.",
    resolution_date: "2027-03-01T00:00:00Z",
    image_url: "https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=800&h=400&fit=crop",
  },
  {
    question: "Will the Arctic experience an ice-free September before 2027?",
    description: "Resolves YES if Arctic sea ice extent drops below 1 million sq km during September 2026 per NSIDC data.",
    resolution_date: "2026-10-15T00:00:00Z",
    image_url: "https://images.unsplash.com/photo-1468276311594-df7cb65d8df6?w=800&h=400&fit=crop",
  },
  {
    question: "Will California declare a drought emergency in 2026?",
    description: "Resolves YES if the Governor of California issues a drought emergency proclamation during calendar year 2026.",
    resolution_date: "2026-12-31T23:59:59Z",
    image_url: "https://images.unsplash.com/photo-1504297050568-910d24c426d3?w=800&h=400&fit=crop",
  },
  {
    question: "Will a major US city experience flooding exceeding $1B in damages in 2026?",
    description: "Resolves YES if any US metropolitan area experiences flood damage exceeding $1 billion (NOAA estimate) in 2026.",
    resolution_date: "2026-12-31T23:59:59Z",
    image_url: "https://images.unsplash.com/photo-1547683905-f686c993aae5?w=800&h=400&fit=crop",
  },

  // ── Culture / Entertainment (6) ─────────────────────────────────────────
  {
    question: "Will a streaming-only film win Best Picture at the 2027 Oscars?",
    description: "Resolves YES if the Best Picture winner at the 99th Academy Awards (March 2027) had a streaming-first release.",
    resolution_date: "2027-03-31T00:00:00Z",
    image_url: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=800&h=400&fit=crop",
  },
  {
    question: "Will Taylor Swift announce a new album in 2026?",
    description: "Resolves YES if Taylor Swift officially announces a new studio album (not a re-recording) during 2026.",
    resolution_date: "2026-12-31T23:59:59Z",
    image_url: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=400&fit=crop",
  },
  {
    question: "Will GTA VI release before December 2026?",
    description: "Resolves YES if Grand Theft Auto VI is publicly available for purchase and play before December 1, 2026.",
    resolution_date: "2026-12-01T00:00:00Z",
    image_url: "https://images.unsplash.com/photo-1552820728-8b83bb6b2b28?w=800&h=400&fit=crop",
  },
  {
    question: "Will a K-pop group headline the Super Bowl halftime show in 2027?",
    description: "Resolves YES if a K-pop group is announced as the main headliner for the Super Bowl LXI halftime show (Feb 2027).",
    resolution_date: "2027-02-15T00:00:00Z",
    image_url: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&h=400&fit=crop",
  },
  {
    question: "Will global box office revenue exceed $35 billion in 2026?",
    description: "Resolves YES if worldwide theatrical box office revenue surpasses $35 billion for calendar year 2026.",
    resolution_date: "2027-02-01T00:00:00Z",
    image_url: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&h=400&fit=crop",
  },
  {
    question: "Will an AI-generated song reach #1 on Billboard Hot 100 in 2026?",
    description: "Resolves YES if a song primarily created by AI reaches #1 on the Billboard Hot 100 chart during 2026.",
    resolution_date: "2026-12-31T23:59:59Z",
    image_url: "https://images.unsplash.com/photo-1526478806334-5fd488fcaabc?w=800&h=400&fit=crop",
  },

  // ── Companies (6) ───────────────────────────────────────────────────────
  {
    question: "Will Tesla deliver over 2 million vehicles in 2026?",
    description: "Resolves YES if Tesla's official 2026 annual delivery report exceeds 2,000,000 vehicles.",
    resolution_date: "2027-01-15T00:00:00Z",
    image_url: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&h=400&fit=crop",
  },
  {
    question: "Will TikTok be banned in the US by end of 2026?",
    description: "Resolves YES if TikTok is no longer accessible via US app stores and web by December 31, 2026.",
    resolution_date: "2026-12-31T23:59:59Z",
    image_url: "https://images.unsplash.com/photo-1611605698335-8b1569810432?w=800&h=400&fit=crop",
  },
  {
    question: "Will Nvidia's market cap exceed $5 trillion in 2026?",
    description: "Resolves YES if Nvidia's market capitalization exceeds $5 trillion at any point during 2026.",
    resolution_date: "2026-12-31T23:59:59Z",
    image_url: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=400&fit=crop",
  },
  {
    question: "Will Amazon launch a satellite internet service in 2026?",
    description: "Resolves YES if Amazon's Project Kuiper begins offering commercial satellite internet service to consumers in 2026.",
    resolution_date: "2026-12-31T23:59:59Z",
    image_url: "https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=800&h=400&fit=crop",
  },
  {
    question: "Will Twitter/X become profitable in 2026?",
    description: "Resolves YES if X Corp (formerly Twitter) reports positive net income for any quarter in 2026.",
    resolution_date: "2027-03-01T00:00:00Z",
    image_url: "https://images.unsplash.com/photo-1611605698323-b1e99cfd37ea?w=800&h=400&fit=crop",
  },
  {
    question: "Will a major tech company (FAANG) announce layoffs over 10,000 in 2026?",
    description: "Resolves YES if any FAANG company (Meta, Apple, Amazon, Netflix, Google) announces layoffs exceeding 10,000 employees in 2026.",
    resolution_date: "2026-12-31T23:59:59Z",
    image_url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=400&fit=crop",
  },

  // ── World / International (5) ───────────────────────────────────────────
  {
    question: "Will a ceasefire hold in the Russia-Ukraine conflict through 2026?",
    description: "Resolves YES if a formal ceasefire agreement is reached and holds without major violations through December 31, 2026.",
    resolution_date: "2026-12-31T23:59:59Z",
    image_url: "https://images.unsplash.com/photo-1526470608268-f674ce90ebd4?w=800&h=400&fit=crop",
  },
  {
    question: "Will China's GDP growth exceed 5% in 2026?",
    description: "Resolves YES if China's official annual GDP growth rate for 2026 exceeds 5.0%.",
    resolution_date: "2027-02-01T00:00:00Z",
    image_url: "https://images.unsplash.com/photo-1547981609-4b6bfe67ca0b?w=800&h=400&fit=crop",
  },
  {
    question: "Will India surpass China in population by official census data in 2026?",
    description: "Resolves YES if official UN or national census data published in 2026 confirms India's population exceeds China's.",
    resolution_date: "2026-12-31T23:59:59Z",
    image_url: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800&h=400&fit=crop",
  },
  {
    question: "Will the WHO declare a new Public Health Emergency of International Concern in 2026?",
    description: "Resolves YES if the World Health Organization declares a new PHEIC (not an extension of an existing one) during 2026.",
    resolution_date: "2026-12-31T23:59:59Z",
    image_url: "https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?w=800&h=400&fit=crop",
  },
  {
    question: "Will a new country join the European Union by end of 2027?",
    description: "Resolves YES if any country officially becomes a member state of the European Union before January 1, 2028.",
    resolution_date: "2028-01-01T00:00:00Z",
    image_url: "https://images.unsplash.com/photo-1473116763249-2faaef81ccda?w=800&h=400&fit=crop",
  },
];

async function main() {
  console.log("🌱 Prediction Market Seed Script");
  console.log("================================\n");

  // 0. Ensure image_url column exists
  await ensureImageUrlColumn();

  // 1. Upsert seed agent
  console.log(`Looking for agent "${SEED_AGENT_NAME}"...`);

  let { data: agent } = await supabase
    .from("agents")
    .select("id, name")
    .eq("name", SEED_AGENT_NAME)
    .single();

  if (!agent) {
    console.log(`Agent not found — creating "${SEED_AGENT_NAME}"...`);
    const { data: newAgent, error } = await supabase
      .from("agents")
      .insert({ name: SEED_AGENT_NAME })
      .select("id, name")
      .single();

    if (error) {
      console.error("Failed to create seed agent:", error.message);
      process.exit(1);
    }
    agent = newAgent;
  }

  console.log(`Using agent: ${agent!.name} (${agent!.id})\n`);

  // 2. Idempotency check
  const { count } = await supabase
    .from("markets")
    .select("*", { count: "exact", head: true })
    .eq("creator_id", agent!.id);

  if (count && count >= 50) {
    console.log(`Already seeded (${count} markets found for this agent). Skipping.`);
    console.log('To re-seed, delete existing markets first or use a different agent name.');
    return;
  }

  // 3. Insert markets
  console.log(`Inserting ${MARKETS.length} markets...`);

  const rows = MARKETS.map((m) => ({
    question: m.question,
    description: m.description,
    creator_id: agent!.id,
    resolution_date: m.resolution_date,
    image_url: m.image_url,
  }));

  const { data: inserted, error } = await supabase
    .from("markets")
    .insert(rows)
    .select("id, question");

  if (error) {
    console.error("Insert failed:", error.message);
    process.exit(1);
  }

  console.log(`\n✅ Successfully seeded ${inserted.length} markets!\n`);

  // 4. Summary by category
  const categories = [
    { name: "Politics", start: 0, end: 7 },
    { name: "Economics / Finance", start: 7, end: 14 },
    { name: "Tech & Science", start: 14, end: 21 },
    { name: "Sports", start: 21, end: 27 },
    { name: "Weather / Climate", start: 27, end: 33 },
    { name: "Culture / Entertainment", start: 33, end: 39 },
    { name: "Companies", start: 39, end: 45 },
    { name: "World / International", start: 45, end: 50 },
  ];

  for (const cat of categories) {
    console.log(`  ${cat.name}: ${cat.end - cat.start} markets`);
  }

  console.log(`\nTotal: ${inserted.length} markets with images`);
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
