// ═══════════════════════════════════════════════════
// FilteredEdges — collapsible "what got rejected and why"
// Helps user understand silent filtering decisions
// ═══════════════════════════════════════════════════
import { useState } from "react";
import { C } from '../utils/constants.js';
import { fmtAmerican, fmtSignedPct } from '../utils/format.js';
import { Pill } from './Shared.jsx';

const REASON_LABEL = {
  ev_low:    "EV < 4%",
  ev_high:   "EV > 7%",
  not_signal:"Doesn't match any v3 rule",
  betmgm_target: "BetMGM target (excluded)",
};

const REASON_COLOR = {
  ev_low:    C.muted,
  ev_high:   C.warn,
  not_signal:C.dim,
  betmgm_target: C.bad,
};

export default function FilteredEdges({ edges }) {
  const [open, setOpen] = useState(false);

  if (!edges || edges.length === 0) return null;

  // Group by reason
  const groups = {};
  for (const e of edges) {
    const r = e._filterReason || "not_signal";
    if (!groups[r]) groups[r] = [];
    groups[r].push(e);
  }

  return (
    <div style={{
      marginTop: 24,
      border: `1px solid ${C.borderSoft}`,
      borderRadius: 10,
      overflow: "hidden",
    }}>
      <button onClick={() => setOpen(!open)}
              style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                width: "100%",
                padding: "12px 16px",
                background: C.card,
                border: "none",
                color: C.muted,
                fontFamily: "inherit",
                fontSize: 12,
                letterSpacing: "1px",
                fontWeight: 600,
                textTransform: "uppercase",
                cursor: "pointer",
              }}>
        <span>{open ? "▼" : "▶"} {edges.length} edges below threshold</span>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", color: C.dim, letterSpacing: 0.3 }}>
          click to {open ? "collapse" : "expand"}
        </span>
      </button>

      {open && (
        <div style={{ background: C.bg, padding: 16, borderTop: `1px solid ${C.borderSoft}` }}>
          {Object.entries(groups).map(([reason, list]) => (
            <div key={reason} style={{ marginBottom: 18 }}>
              <div style={{
                fontSize: 11, fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase",
                color: REASON_COLOR[reason] || C.muted,
                marginBottom: 8,
              }}>
                {REASON_LABEL[reason] || reason} <span style={{ color: C.dim }}>· {list.length}</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 6 }}>
                {list.slice(0, 12).map(e => (
                  <div key={e.id || `${e.player}-${e.book}-${e.line}`}
                       style={{
                         padding: "6px 10px",
                         background: C.card,
                         border: `1px solid ${C.borderSoft}`,
                         borderRadius: 6,
                         fontSize: 11,
                         color: C.muted,
                         display: "flex", justifyContent: "space-between", alignItems: "center",
                       }}>
                    <span>
                      <span style={{ color: C.text }}>{e.player}</span>{" "}
                      {e.side} {e.line} {e.stat} @{e.book}
                    </span>
                    <span className="mono" style={{ color: C.dim, fontSize: 10 }}>
                      {fmtAmerican(e.price)} · {fmtSignedPct(e.ev || 0)}
                    </span>
                  </div>
                ))}
                {list.length > 12 && (
                  <div style={{ fontSize: 11, color: C.dim, padding: 6 }}>
                    + {list.length - 12} more…
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
