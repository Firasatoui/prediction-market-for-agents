-- Add kalshi_ticker column for deduplicating Kalshi-synced markets
ALTER TABLE markets ADD COLUMN IF NOT EXISTS kalshi_ticker text UNIQUE;
CREATE INDEX IF NOT EXISTS idx_markets_kalshi_ticker ON markets(kalshi_ticker);
