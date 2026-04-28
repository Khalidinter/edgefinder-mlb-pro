// ═══════════════════════════════════════════════════
// Top bar — logo, status pills, settings cog
// ═══════════════════════════════════════════════════
import { HexIcon } from './CogniVaultLogo.jsx';
import { BRAND, C } from '../utils/constants.js';
import { fmtUnits, timeAgo } from '../utils/format.js';

function Pill({ children, color, dim = false }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "5px 10px", borderRadius: 999,
      background: `${color}18`, border: `1px solid ${color}40`,
      color: dim ? C.muted : color,
      fontSize: 12, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace",
      whiteSpace: "nowrap",
    }}>
      {children}
    </span>
  );
}

export default function TopBar({ status, validation, onOpenSettings, onRefresh, lastFetch }) {
  const totals  = status?.totals || {};
  const today   = status?.today || {};
  const profit  = totals.profit ?? 0;
  const profitColor = profit >= 0 ? C.good : C.bad;
  const valPass = validation?.pass !== false; // null/undef → assume ok until known

  // ET date string
  const todayStr = today.date ||
    new Date().toLocaleDateString("en-US", {
      weekday: "short", month: "short", day: "numeric", timeZone: "America/New_York"
    });

  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "12px 18px",
      background: C.card,
      borderBottom: `1px solid ${C.border}`,
      gap: 14, flexWrap: "wrap",
    }}>
      {/* Left: logo + brand */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <HexIcon size={36} />
        <div style={{ lineHeight: 1.1 }}>
          <div style={{ fontSize: 11, color: BRAND.muted, letterSpacing: 1.4, fontWeight: 500 }}>
            COGNIVAULT LABS
          </div>
          <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: "-0.3px", color: C.text }}>
            EdgeFinder <span style={{ color: C.red }}>MLB</span>
          </div>
        </div>
      </div>

      {/* Right: pills + cog */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <Pill color={C.cyan}>⚾ {todayStr}</Pill>
        <Pill color={profitColor}>{fmtUnits(profit)} all-time</Pill>
        <Pill color={today.edges ? C.gold : C.muted} dim={!today.edges}>
          {today.edges || 0} today
        </Pill>
        <Pill color={valPass ? C.good : C.bad}>
          {valPass ? "✓ Validation OK" : "✗ Validation FAIL"}
        </Pill>
        {lastFetch && (
          <Pill color={C.muted} dim>
            ↻ {timeAgo(lastFetch)}
          </Pill>
        )}
        <button onClick={onRefresh} title="Force refresh"
                style={{
                  background: "none", border: `1px solid ${C.border}`,
                  color: C.muted, borderRadius: 6, padding: "4px 8px",
                  fontSize: 14,
                }}>
          ↻
        </button>
        <button onClick={onOpenSettings} title="Settings"
                style={{
                  background: "none", border: `1px solid ${C.border}`,
                  color: C.muted, borderRadius: 6, padding: "4px 8px",
                  fontSize: 14,
                }}>
          ⚙
        </button>
      </div>
    </div>
  );
}
