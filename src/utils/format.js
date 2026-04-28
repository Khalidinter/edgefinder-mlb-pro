// ═══════════════════════════════════════════════════
// FORMAT helpers — odds, units, percentages, time
// ═══════════════════════════════════════════════════

// American odds → string with sign
export function fmtAmerican(p) {
  if (p == null || isNaN(p)) return "—";
  const n = Math.round(Number(p));
  return n > 0 ? `+${n}` : String(n);
}

// Units (signed, fixed 2 decimals)
export function fmtUnits(u) {
  if (u == null || isNaN(u)) return "—";
  const n = Number(u);
  return (n >= 0 ? "+" : "") + n.toFixed(2) + "u";
}

export function fmtPct(n, decimals = 1) {
  if (n == null || isNaN(n)) return "—";
  return Number(n).toFixed(decimals) + "%";
}

export function fmtSignedPct(n, decimals = 1) {
  if (n == null || isNaN(n)) return "—";
  const v = Number(n);
  return (v >= 0 ? "+" : "") + v.toFixed(decimals) + "%";
}

// Time helpers
export function timeAgo(iso) {
  if (!iso) return "—";
  const ms = Date.now() - new Date(iso).getTime();
  const s = Math.floor(ms / 1000);
  if (s < 60)   return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60)   return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)   return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function fmtClock(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", {
    hour: "numeric", minute: "2-digit", hour12: true, timeZone: "America/New_York"
  }) + " ET";
}

// "Time-to-game" — given a game commence time string (or game date), returns "3h 24m" etc.
// Worker doesn't currently store commence_time, so fall back gracefully.
export function fmtETA(commenceIso) {
  if (!commenceIso) return null;
  const ms = new Date(commenceIso).getTime() - Date.now();
  if (ms < 0) return "live";
  const m = Math.floor(ms / 60_000);
  if (m < 60)  return `${m}m`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

export function fmtCount(n) {
  if (n == null) return "0";
  return n.toLocaleString("en-US");
}
