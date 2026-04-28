// ═══════════════════════════════════════════════════
// EdgeFinder MLB — design tokens, book maps, signal rules
// ═══════════════════════════════════════════════════

// ── Brand palette ────────────────────────────────────
// CogniVault constants (kept identical across NBA / MLB)
export const BRAND = {
  teal:   "#2A9D8F",  // primary brand
  purple: "#7B2FF7",  // V in CogniVault wordmark
  green:  "#7FFF00",  // keyhole / accent / positive
  text:   "#D5D3CF",
  muted:  "#5A6478",
};

// MLB-specific palette (warmer dark + deep red accent)
export const C = {
  bg:        "#0E1419",  // page bg (slightly warmer than NBA's #0B0F15)
  card:      "#172029",  // card panel
  cardHover: "#1c2731",
  border:    "#243042",
  borderSoft:"#1a2330",
  text:      "#E2E8F0",
  muted:     "#7B8794",
  dim:       "#4B5568",

  // Sport accents
  red:       "#C81030",  // MLB deep red — used sparingly
  redSoft:   "#7A1020",  // muted red for backgrounds
  diamond:   "#2D5F3F",  // diamond green — won-chip background

  // Signal colors
  good:      "#00E676",  // wins, profit
  bad:       "#FF5252",  // losses
  warn:      "#FFD740",  // warnings
  cyan:      "#00E5FF",  // info / push
  gold:      "#FFB800",  // CONFIRMED tier highlight
};

// ── Book registry ────────────────────────────────────
export const BOOKS_DISPLAY = {
  draftkings: "DraftKings",
  fanduel:    "FanDuel",
  betmgm:     "BetMGM",
  caesars:    "Caesars",
  bet365:     "bet365",
  betrivers:  "BetRivers",
  espnbet:    "ESPN BET",
  fanatics:   "Fanatics",
  pinnacle:   "Pinnacle",
  bookmaker:  "Bookmaker",
  circa:      "Circa",
  bovada:     "Bovada",
};

export const LEGAL_BOOKS = new Set([
  "draftkings", "fanduel", "betmgm", "caesars",
  "bet365", "betrivers", "fanatics", "espnbet",
]);

// Deep links (Ohio variants where applicable)
export const BOOK_URLS = {
  draftkings: "https://sportsbook.draftkings.com",
  fanduel:    "https://sportsbook.fanduel.com",
  betmgm:     "https://oh.betmgm.com",
  caesars:    "https://sportsbook.caesars.com",
  bet365:     "https://www.oh.bet365.com",
  betrivers:  "https://oh.betrivers.com",
  fanatics:   "https://sportsbook.fanatics.com",
  espnbet:    "https://espnbet.com",
};

// ── Stat icons (text glyphs, no external deps) ──────
export const STAT_ICONS = {
  total_bases:   "◆", // diamond — TB
  hits:          "≡", // hit lines
  home_runs:     "★", // HR
  rbis:          "⚑", // flag — RBI
  strikeouts:    "✕", // K
};

export const STAT_LABELS = {
  total_bases: "Total Bases",
  hits:        "Hits",
  home_runs:   "Home Runs",
  rbis:        "RBIs",
  strikeouts:  "Strikeouts",
};

// ── v3 Signal Classifier (mirror of worker logic) ───
// Used client-side to show "CONFIRMED" / "WATCH" / null tags
// AND to classify edges that the worker's push pass hasn't touched yet.
// Source of truth is still the worker; this is for instant display only.
export function classifySignal(edge) {
  const { stat, side, line, anchor_book, book, ev } = edge;
  if (ev == null || ev < 4.0 || ev > 7.0) return null;
  if (book === "betmgm") return null;

  if (stat === "total_bases" && side === "Under" && Number(line) === 1.5
      && (anchor_book === "pinnacle" || anchor_book === "betmgm")
      && (book === "draftkings" || book === "fanatics")) {
    return "CONFIRMED";
  }
  if (stat === "strikeouts" && side === "Under" && Number(line) === 6.5
      && anchor_book === "fanduel"
      && (book === "fanatics" || book === "betrivers" || book === "draftkings")) {
    return "WATCH";
  }
  if (stat === "hits" && side === "Under" && Number(line) === 0.5
      && anchor_book === "betmgm"
      && (book === "draftkings" || book === "fanatics")) {
    return "WATCH";
  }
  return null;
}

// ── Polling intervals (ms) ───────────────────────────
export const POLL = {
  status:     30_000,    // /status — top bar refresh
  edges:      300_000,   // /export — only triggered if /status count changed
  validate:   300_000,   // /validate — 5 min
  schedule:   60_000,    // /schedule — 1 min
};

// Default worker URL
export const DEFAULT_WORKER_URL = "https://edgefinder-mlb.edgefinder.workers.dev";
