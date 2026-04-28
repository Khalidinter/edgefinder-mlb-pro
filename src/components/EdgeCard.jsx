// ═══════════════════════════════════════════════════
// EdgeCard — single signal-tier edge on Live Board
// Shows player, prop, book, price, EV, push status
// "I bet this" → POST /track-bet (server-side)
// If validation failed, CONFIRMED is downgraded to WATCH visually.
// ═══════════════════════════════════════════════════
import { C, BRAND, BOOKS_DISPLAY, BOOK_URLS, STAT_LABELS } from '../utils/constants.js';
import { fmtAmerican, fmtSignedPct, timeAgo } from '../utils/format.js';
import { Pill } from './Shared.jsx';

export default function EdgeCard({
  edge,
  effectiveTier,    // tier after validation downgrade (CONFIRMED | WATCH | null)
  origTier,         // original tier from classifier (for downgrade indication)
  isTracked,        // boolean
  isResolved,       // boolean — show outcome chip instead of bet button
  validationFail,   // true if validation suspended → all tiers visually muted
  onTrack,          // () => void — POST /track-bet
  onTrajectory,     // () => void — open price chart
}) {
  const tier = effectiveTier;
  const isConf = tier === "CONFIRMED";
  const wasDowngraded = validationFail && origTier === "CONFIRMED";

  // Color theme per tier (with downgrade muting)
  const accent = validationFail
    ? C.muted
    : isConf
      ? C.gold
      : tier === "WATCH"
        ? C.cyan
        : C.muted;
  const tierLabel = wasDowngraded ? "WATCH (downgraded)" : tier || "—";

  // Outcome chip if resolved
  const outcome = edge.outcome;
  const outcomeColor = outcome === "won" ? C.good : outcome === "lost" ? C.bad : C.muted;

  // Push status
  const pushed = edge.pushed_at && edge.pushed_at !== "no-signal" && edge.pushed_at !== "historical";
  const pushTimeAgo = pushed ? timeAgo(edge.pushed_at) : null;

  return (
    <div style={{
      background: C.card,
      border: `1px solid ${isConf && !validationFail ? `${accent}50` : C.border}`,
      borderLeft: `3px solid ${accent}`,
      borderRadius: 10,
      padding: 16,
      transition: "all 0.15s",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* subtle accent glow on top edge if CONFIRMED */}
      {isConf && !validationFail && (
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 2,
          background: `linear-gradient(90deg, transparent, ${accent}80, transparent)`,
        }} />
      )}

      {/* Top row: tier + EV + push status */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, gap: 8, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <Pill color={accent}>{tierLabel}</Pill>
          {wasDowngraded && (
            <span style={{ fontSize: 10, color: C.warn, fontWeight: 600 }}>
              alerts suspended
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {edge.ev != null && (
            <Pill color={edge.ev >= 5 ? C.good : C.text}>
              EV {fmtSignedPct(edge.ev)}
            </Pill>
          )}
          {pushed && (
            <Pill color={C.cyan} size="sm" dim>
              ✓ pushed {pushTimeAgo}
            </Pill>
          )}
        </div>
      </div>

      {/* Player + prop */}
      <div style={{ marginBottom: 8 }}>
        <div style={{
          fontSize: 18, fontWeight: 700, color: C.text,
          letterSpacing: "-0.2px", marginBottom: 2,
        }}>
          {edge.player}
        </div>
        <div style={{ fontSize: 13, color: C.muted }}>
          <span style={{ color: C.text, fontWeight: 600 }}>{edge.side} {edge.line}</span>{" "}
          {STAT_LABELS[edge.stat] || edge.stat}
        </div>
      </div>

      {/* Book + price + anchor */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        marginBottom: 12, flexWrap: "wrap",
        fontSize: 13,
      }}>
        <BookBadge book={edge.book} />
        <span className="mono" style={{ color: C.text, fontWeight: 700, fontSize: 15 }}>
          {fmtAmerican(edge.price)}
        </span>
        <span style={{ color: C.dim, fontSize: 12 }}>
          anchor: <span style={{ color: C.muted }}>{BOOKS_DISPLAY[edge.anchor_book] || edge.anchor_book || "—"}</span>
        </span>
      </div>

      {/* Game */}
      {edge.game && (
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 12 }}>
          {edge.game}
        </div>
      )}

      {/* Bottom: action buttons OR outcome */}
      {isResolved ? (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Pill color={outcomeColor}>
            {outcome === "won" ? "Won" : outcome === "lost" ? "Lost" : outcome === "push" ? "Push" : "—"}
            {edge.actual_value != null && ` · actual ${edge.actual_value}`}
          </Pill>
          {edge.profit != null && (
            <span className="mono" style={{
              color: edge.profit > 0 ? C.good : edge.profit < 0 ? C.bad : C.muted,
              fontWeight: 700, fontSize: 13,
            }}>
              {edge.profit > 0 ? "+" : ""}{Number(edge.profit).toFixed(2)}u
            </span>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onTrajectory}
                  style={btnSecondary}>
            Trajectory
          </button>
          {edge.book && BOOK_URLS[edge.book] && (
            <a href={BOOK_URLS[edge.book]} target="_blank" rel="noopener noreferrer"
               style={{ ...btnSecondary, textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
              Open {BOOKS_DISPLAY[edge.book] || edge.book} ↗
            </a>
          )}
          <div style={{ flex: 1 }} />
          <button onClick={onTrack} disabled={isTracked}
                  style={isTracked ? btnTracked : btnPrimary(accent)}>
            {isTracked ? "✓ Tracked" : "I bet this"}
          </button>
        </div>
      )}
    </div>
  );
}

function BookBadge({ book }) {
  return (
    <span style={{
      padding: "3px 8px", borderRadius: 5,
      background: `${C.borderSoft}`, color: C.text,
      fontSize: 11, fontWeight: 600,
      letterSpacing: "0.3px",
    }}>
      {BOOKS_DISPLAY[book] || book}
    </span>
  );
}

const btnSecondary = {
  background: "transparent",
  border: `1px solid ${C.border}`,
  color: C.muted,
  padding: "6px 12px",
  borderRadius: 6,
  fontSize: 12,
  fontWeight: 500,
  fontFamily: "inherit",
  cursor: "pointer",
};

const btnTracked = {
  background: `${C.good}15`,
  border: `1px solid ${C.good}40`,
  color: C.good,
  padding: "6px 14px",
  borderRadius: 6,
  fontSize: 12,
  fontWeight: 600,
  fontFamily: "inherit",
  cursor: "default",
};

const btnPrimary = (accent) => ({
  background: `${accent}20`,
  border: `1px solid ${accent}80`,
  color: accent,
  padding: "6px 14px",
  borderRadius: 6,
  fontSize: 12,
  fontWeight: 600,
  fontFamily: "inherit",
  cursor: "pointer",
});
