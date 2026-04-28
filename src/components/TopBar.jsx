// ═══════════════════════════════════════════════════
// Top bar — brand block + status pills
// Matches EdgeFinder Assists branding pattern
// ═══════════════════════════════════════════════════
import { BrandBlock } from './CogniVaultLogo.jsx';
import { BRAND, C } from '../utils/constants.js';
import { fmtUnits, timeAgo } from '../utils/format.js';

function Pill({ children, color, dim = false }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "6px 12px", borderRadius: 999,
      background: `${color}15`, border: `1px solid ${color}40`,
      color: dim ? C.muted : color,
      fontSize: 12, fontWeight: 600,
      fontFamily: "'JetBrains Mono', monospace",
      whiteSpace: "nowrap",
      letterSpacing: "0.3px",
    }}>
      {children}
    </span>
  );
}

function DatePill({ date }) {
  return (
    <span style={{
      padding: "8px 14px",
      borderRadius: 8,
      background: "transparent",
      border: `1px solid ${BRAND.teal}50`,
      color: BRAND.teal,
      fontSize: 13,
      fontWeight: 600,
      fontFamily: "'JetBrains Mono', monospace",
      letterSpacing: "0.5px",
    }}>
      {date}
    </span>
  );
}

export default function TopBar({ status, validation, onOpenSettings, onRefresh, lastFetch }) {
  const isLoaded = !!status;                // status came back at least once
  const valLoaded = !!validation;            // validation came back at least once
  const totals  = status?.totals || {};
  const today   = status?.today || {};
  const profit  = totals.profit;             // can be undefined while loading
  const profitColor = !isLoaded ? C.muted : profit >= 0 ? C.good : C.bad;
  const valPass = valLoaded && validation.pass !== false;

  // ISO date for the pill
  const todayISO = today.date || new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });

  return (
    <div className="ef-topbar" style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "16px 20px",
      background: C.card,
      borderBottom: `1px solid ${C.border}`,
      gap: 12, flexWrap: "wrap",
    }}>
      <a href="https://cognivaultlabs.com" target="_blank" rel="noopener noreferrer"
         style={{ textDecoration: "none", display: "inline-block" }}
         title="Visit CogniVault Labs">
        <BrandBlock size={44} />
      </a>

      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        {isLoaded ? (
          <Pill color={profitColor}>{fmtUnits(profit)} all-time</Pill>
        ) : (
          <Pill color={C.muted} dim>— all-time</Pill>
        )}
        {isLoaded ? (
          <Pill color={today.edges ? BRAND.teal : C.muted} dim={!today.edges}>
            {today.edges || 0} today
          </Pill>
        ) : (
          <Pill color={C.muted} dim>— today</Pill>
        )}
        {valLoaded ? (
          <Pill color={valPass ? C.good : C.bad}>
            {valPass ? "Validation OK" : "Validation FAIL"}
          </Pill>
        ) : (
          <Pill color={C.muted} dim>Validation …</Pill>
        )}
        {lastFetch ? (
          <Pill color={C.muted} dim>↻ {timeAgo(lastFetch)}</Pill>
        ) : (
          <Pill color={C.muted} dim>connecting…</Pill>
        )}
        <button onClick={onRefresh} title="Force refresh"
                style={btnStyle}>↻</button>
        <button onClick={onOpenSettings} title="Settings"
                style={btnStyle}>⚙</button>
        <DatePill date={todayISO} />
      </div>
    </div>
  );
}

const btnStyle = {
  background: "transparent",
  border: `1px solid ${C.border}`,
  color: C.muted,
  borderRadius: 6,
  padding: "6px 10px",
  fontSize: 13,
  cursor: "pointer",
  fontFamily: "inherit",
};
