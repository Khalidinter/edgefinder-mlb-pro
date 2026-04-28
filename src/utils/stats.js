// ═══════════════════════════════════════════════════
// Stats helpers — aggregate, sort, bootstrap CI, etc.
// ═══════════════════════════════════════════════════

// American odds → implied prob
export function impliedProb(american) {
  if (american == null || isNaN(american)) return 0.5;
  const a = Number(american);
  if (a > 0)  return 100 / (a + 100);
  if (a < 0)  return Math.abs(a) / (Math.abs(a) + 100);
  return 0.5;
}

// Aggregate a list of edges → summary stats
export function aggregate(edges) {
  let n = 0, won = 0, lost = 0, push = 0, profit = 0;
  let evSum = 0, evN = 0;
  let priceSum = 0, priceN = 0;
  let clvSum = 0, clvN = 0;
  let beatClose = 0;
  for (const e of edges) {
    if (!e || e.resolved !== 1) continue;
    n++;
    if (e.outcome === "won")  won++;
    if (e.outcome === "lost") lost++;
    if (e.outcome === "push") push++;
    if (e.profit != null) profit += Number(e.profit);
    if (e.ev != null)    { evSum += Number(e.ev);   evN++; }
    if (e.price != null) { priceSum += Number(e.price); priceN++; }
    if (e.clv != null)   { clvSum += Number(e.clv); clvN++; if (e.clv > 0) beatClose++; }
  }
  const decided = won + lost;
  return {
    n, won, lost, push, profit: round(profit, 2),
    win_pct: decided > 0 ? round((won / decided) * 100, 1) : null,
    roi_pct: n > 0 ? round((profit / n) * 100, 1) : null,
    avg_ev:    evN > 0 ? round(evSum / evN, 2) : null,
    avg_price: priceN > 0 ? Math.round(priceSum / priceN) : null,
    avg_clv:   clvN > 0 ? round(clvSum / clvN, 2) : null,
    pct_beat_close: clvN > 0 ? round((beatClose / clvN) * 100, 1) : null,
  };
}

// Group edges by a key function, return list of { key, agg, edges }
export function groupBy(edges, keyFn) {
  const map = new Map();
  for (const e of edges) {
    const k = keyFn(e);
    if (k == null) continue;
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(e);
  }
  return Array.from(map.entries()).map(([k, list]) => ({
    key: k,
    edges: list,
    agg: aggregate(list),
  }));
}

// Bootstrap 95% CI for ROI (resampling profits with replacement)
// Returns { lo, hi } as percentages, or null if n < 30
export function bootstrapROI(edges, iterations = 1000) {
  const profits = edges.filter(e => e.resolved === 1).map(e => Number(e.profit) || 0);
  if (profits.length < 30) return null;
  const N = profits.length;
  const samples = [];
  for (let i = 0; i < iterations; i++) {
    let sum = 0;
    for (let j = 0; j < N; j++) sum += profits[(Math.random() * N) | 0];
    samples.push((sum / N) * 100);
  }
  samples.sort((a, b) => a - b);
  return {
    lo: round(samples[Math.floor(iterations * 0.025)], 1),
    hi: round(samples[Math.floor(iterations * 0.975)], 1),
  };
}

// Cumulative P&L over time, returns array of { date, profit, cumulative, n }
export function cumulativePL(edges) {
  const sorted = [...edges]
    .filter(e => e.resolved === 1 && e.profit != null)
    .sort((a, b) => {
      const ta = a.resolved_at || a.created_at;
      const tb = b.resolved_at || b.created_at;
      return new Date(ta).getTime() - new Date(tb).getTime();
    });
  const points = [];
  let cum = 0, n = 0;
  for (const e of sorted) {
    cum += Number(e.profit) || 0;
    n++;
    const t = e.resolved_at || e.created_at;
    points.push({ ts: t, profit: e.profit, cumulative: round(cum, 2), n });
  }
  return points;
}

// EV bucket helper
export function evBand(ev) {
  if (ev == null) return null;
  if (ev < 3)  return "<3%";
  if (ev < 4)  return "3-4%";
  if (ev < 5)  return "4-5%";
  if (ev < 7)  return "5-7%";
  if (ev < 10) return "7-10%";
  return "10%+";
}

// Price bucket helper
export function priceBand(p) {
  if (p == null) return null;
  if (p > 0)         return "+ odds";
  if (p > -110)      return "-110 or better";
  if (p > -130)      return "-110 to -129";
  if (p > -150)      return "-130 to -149";
  if (p > -170)      return "-150 to -169";
  return "-170 or worse";
}

export const PRICE_BAND_ORDER = [
  "+ odds", "-110 or better", "-110 to -129", "-130 to -149", "-150 to -169", "-170 or worse"
];
export const EV_BAND_ORDER = ["<3%", "3-4%", "4-5%", "5-7%", "7-10%", "10%+"];

function round(v, d) {
  const m = Math.pow(10, d);
  return Math.round(v * m) / m;
}
