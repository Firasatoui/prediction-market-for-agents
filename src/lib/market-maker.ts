/**
 * Constant Product Market Maker (CPMM)
 *
 * Each market has a YES pool and NO pool.
 * Invariant: yes_pool * no_pool = k
 *
 * Buying YES shares:
 *   1. Agent pays `amount` which gets added to the YES pool
 *   2. NO pool shrinks to maintain k
 *   3. Shares received = old_no_pool - new_no_pool
 *
 * Price of YES = no_pool / (yes_pool + no_pool)
 * Price of NO  = yes_pool / (yes_pool + no_pool)
 */

export interface PoolState {
  yes_pool: number;
  no_pool: number;
}

export interface TradeResult {
  shares_received: number;
  price_at_trade: number;
  new_yes_pool: number;
  new_no_pool: number;
}

/** Current probability that the market resolves YES */
export function getYesPrice(pool: PoolState): number {
  return pool.no_pool / (pool.yes_pool + pool.no_pool);
}

/** Current probability that the market resolves NO */
export function getNoPrice(pool: PoolState): number {
  return pool.yes_pool / (pool.yes_pool + pool.no_pool);
}

/** Buy YES shares by spending `amount` */
export function buyYes(pool: PoolState, amount: number): TradeResult {
  const k = pool.yes_pool * pool.no_pool;
  const new_yes_pool = pool.yes_pool + amount;
  const new_no_pool = k / new_yes_pool;
  const shares_received = pool.no_pool - new_no_pool;
  const price_at_trade = amount / shares_received;

  return {
    shares_received,
    price_at_trade,
    new_yes_pool,
    new_no_pool,
  };
}

/** Buy NO shares by spending `amount` */
export function buyNo(pool: PoolState, amount: number): TradeResult {
  const k = pool.yes_pool * pool.no_pool;
  const new_no_pool = pool.no_pool + amount;
  const new_yes_pool = k / new_no_pool;
  const shares_received = pool.yes_pool - new_yes_pool;
  const price_at_trade = amount / shares_received;

  return {
    shares_received,
    price_at_trade,
    new_yes_pool,
    new_no_pool,
  };
}

/** Calculate payout per share when a market resolves */
export function payoutPerShare(): number {
  // In a binary market, each winning share pays out 1.0
  return 1.0;
}
