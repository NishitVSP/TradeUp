/**
 * optionsKnowledge.ts
 *
 * Knowledge base for the "explain concepts" side of the assistant.
 *
 * At this scale (a few dozen short docs), we skip a vector database and just
 * do simple keyword-based retrieval — find docs whose keywords appear in the
 * user's question, then inject ONLY those into the prompt (not the whole KB).
 * This keeps the same RAG pattern (retrieve → augment → generate) without the
 * infra overhead of embeddings + a vector store.
 *
 * If you want to upgrade this later to "real" RAG for the interview:
 *   - Precompute an embedding for each doc (Claude/OpenAI embeddings API)
 *   - Embed the user's question the same way
 *   - Cosine-similarity rank docs, take top-3
 *   - Same injection step below
 * The retrieval mechanism changes; everything downstream stays identical.
 */

export interface KnowledgeDoc {
  id: string;
  keywords: string[];
  content: string;
}

export const OPTIONS_KNOWLEDGE_BASE: KnowledgeDoc[] = [
  {
    id: 'what-is-option',
    keywords: ['option', 'call', 'put', 'ce', 'pe', 'contract'],
    content:
      'An options contract gives the buyer the right (not obligation) to buy (Call/CE) or sell (Put/PE) ' +
      'an underlying index at a fixed "strike price" before expiry. CE gains value when the underlying rises; ' +
      'PE gains value when it falls. On TradeUp, contracts are simulated using Black-Scholes pricing based on ' +
      'live-ish spot prices for indices like NIFTY and BANKNIFTY.',
  },
  {
    id: 'atm-itm-otm',
    keywords: ['atm', 'itm', 'otm', 'at the money', 'in the money', 'out of the money', 'strike'],
    content:
      'ATM (At-The-Money) = strike price closest to the current spot price. ITM (In-The-Money) = a strike that ' +
      'already has intrinsic value (e.g. a CE with strike below spot). OTM (Out-of-The-Money) = a strike with no ' +
      'intrinsic value yet (e.g. a CE with strike above spot) — it only has "time value." On TradeUp, ATM strike ' +
      'is computed as round(spotPrice / stepSize) * stepSize, where stepSize is 50 for NIFTY, 100 for BANKNIFTY, etc.',
  },
  {
    id: 'theta-time-decay',
    keywords: ['theta', 'time decay', 'expiry', 'decay'],
    content:
      'Theta is the rate at which an option loses value purely from time passing, holding spot price constant. ' +
      'It accelerates sharply in the final days before expiry. This is why an OTM option can lose most of its ' +
      'value even if the underlying barely moves — time value evaporates. On TradeUp this is reflected because ' +
      'getDaysToExpiry() feeds directly into the Black-Scholes T parameter; as T shrinks, option price shrinks ' +
      'toward pure intrinsic value.',
  },
  {
    id: 'black-scholes',
    keywords: ['black-scholes', 'black scholes', 'pricing model', 'how is ltp calculated', 'ltp calculation'],
    content:
      'Black-Scholes is a mathematical model that prices European-style options using 5 inputs: spot price (S), ' +
      'strike price (K), time to expiry (T), risk-free rate (r), and volatility (σ). TradeUp hardcodes r=7% and ' +
      'σ=20% (a fixed VIX proxy) and computes live LTPs every 500ms-2000ms depending on how far the strike is ' +
      'from ATM (hot/warm/cold tiers), using worker threads so pricing math never blocks the main server thread.',
  },
  {
    id: 'stop-loss-target-trailing',
    keywords: ['stop loss', 'stoploss', 'target', 'trailing', 'trail', 'risk control', 'mtm'],
    content:
      'TradeUp position risk controls: Target closes a position once profit hits a set level. Stop-Loss closes it ' +
      'once loss hits a set level. Trailing stop-loss moves the stop-loss up as the position becomes more profitable, ' +
      'locking in gains. MTM Trail does the same but across your WHOLE portfolio\'s mark-to-market P&L rather than a ' +
      'single position. These are monitored client-side by useLimitOrderMonitor and checked against live LTPs.',
  },
  {
    id: 'market-vs-limit-order',
    keywords: ['market order', 'limit order', 'mkt', 'lmt', 'order type'],
    content:
      'A Market order (MKT) executes immediately at the current LTP. A Limit order (LMT) only executes once the ' +
      'market price crosses your specified limit price — it stays in a PENDING state until then, and can be ' +
      'cancelled before it fills.',
  },
  {
    id: 'lots-lotsize',
    keywords: ['lot', 'lot size', 'quantity'],
    content:
      'Options are traded in fixed lot sizes, not single units — e.g. NIFTY lot size might be 25, so buying 2 lots ' +
      'means quantity = 2 × 25 = 50 units. On TradeUp, total quantity = lots × lotSize, and this quantity is what ' +
      'gets multiplied by execution price to compute cost/credit against your virtual balance.',
  },
  {
    id: 'pnl',
    keywords: ['pnl', 'p&l', 'profit', 'loss', 'realized', 'unrealized'],
    content:
      'Unrealized P&L is the paper profit/loss on a position still open, based on current LTP vs entry price. ' +
      'Realized P&L is locked in once you close the position — TradeUp credits/debits your virtual balance and ' +
      'stores the result in positions.realized_pnl at that point.',
  },
];

/**
 * Simple keyword-based retrieval — returns docs relevant to the query.
 * Case-insensitive substring match against each doc's keyword list.
 */
export function retrieveRelevantDocs(query: string, maxDocs = 3): KnowledgeDoc[] {
  const q = query.toLowerCase();
  const scored = OPTIONS_KNOWLEDGE_BASE.map((doc) => {
    const score = doc.keywords.filter((kw) => q.includes(kw.toLowerCase())).length;
    return { doc, score };
  });
  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxDocs)
    .map((s) => s.doc);
}