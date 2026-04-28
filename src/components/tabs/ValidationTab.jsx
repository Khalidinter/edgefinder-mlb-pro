// ═══════════════════════════════════════════════════
// Validation Tab — every check the worker runs, with status + detail
// Mirrors /validate exactly. Critical failures suspend pushes.
// ═══════════════════════════════════════════════════
import { useMemo, useState } from "react";
import { Pill, SectionHeading, EmptyState, Spinner } from '../Shared.jsx';
import { C, BRAND } from '../../utils/constants.js';
import { timeAgo, fmtClock } from '../../utils/format.js';

// Friendly labels for the worker's check IDs
const CHECK_LABELS = {
  resolution_rate:    "Resolution rate",
  null_actual_value:  "Null actual_value",
  symmetry:           "Over/Under symmetry",
  distribution:       "Outcome distribution",
  win_rate_sanity:    "Win-rate sanity",
  loose_match_rate:   "Loose-match audit",
  void_rate_spike:    "Void-rate spike",
  trailing_drift:     "Trailing-20 drift",
};

const CHECK_DESCRIPTIONS = {
  resolution_rate:   "% of older edges fully resolved (target ≥90% per stat)",
  null_actual_value: "Resolved bets with null actual_value (must be 0)",
  symmetry:          "Same player×game×line: Over+Under outcomes must be opposite",
  distribution:      "Each stat must show expected zero-rate (catches resolver gaps)",
  win_rate_sanity:   ">85% absolute or +15pp above base rate flags suspicious segments",
  loose_match_rate:  "% of resolutions matched via loose name-fuzz (must stay <5%)",
  void_rate_spike:   "Today's push rate vs alltime (>2x = matching anomaly)",
  trailing_drift:    "Last-20 win rate vs alltime for active signals (-20pp = pause)",
};

export default function ValidationTab({ validation, loading, onRefresh }) {
  if (loading && !validation) {
    return <div style={{ display: "flex", justifyContent: "center", padding: 60 }}><Spinner size={28} /></div>;
  }
  if (!validation) {
    return <EmptyState icon="◇" title="No validation data" subtitle="Worker hasn't run /validate yet." />;
  }

  // Group checks by check type
  const grouped = useMemo(() => {
    const map = new Map();
    for (const c of (validation.checks || [])) {
      if (!map.has(c.check)) map.set(c.check, []);
      map.get(c.check).push(c);
    }
    // Sort: failing first, then warning, then passing
    const groups = Array.from(map.entries()).map(([k, list]) => {
      const failed = list.some(c => c.status === "fail");
      const warned = list.some(c => c.status === "warn");
      const allPass = list.every(c => c.status === "pass");
      return { check: k, list, failed, warned, allPass };
    });
    groups.sort((a, b) => {
      if (a.failed !== b.failed) return a.failed ? -1 : 1;
      if (a.warned !== b.warned) return a.warned ? -1 : 1;
      return a.check.localeCompare(b.check);
    });
    return groups;
  }, [validation]);

  const totalChecks = (validation.checks || []).length;
  const failures = (validation.checks || []).filter(c => c.status === "fail" && c.critical).length;
  const warnings = (validation.checks || []).filter(c => c.status === "warn").length;
  const passing  = (validation.checks || []).filter(c => c.status === "pass").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {/* Banner */}
      <Banner pass={validation.pass}
              failures={failures}
              warnings={warnings}
              ts={validation.ts}
              onRefresh={onRefresh} />

      {/* Status grid — compact at-a-glance dots */}
      <div>
        <SectionHeading count={totalChecks}
                        action={
                          <div style={{ display: "flex", gap: 14, fontSize: 11, color: C.muted }}>
                            <Legend color={C.good} label={`${passing} pass`} />
                            <Legend color={C.warn} label={`${warnings} warn`} />
                            <Legend color={C.bad}  label={`${failures} fail`} />
                          </div>
                        }>
          Live Status
        </SectionHeading>
        <div style={{
          display: "flex", flexWrap: "wrap", gap: 5,
          padding: 14,
          background: C.card, border: `1px solid ${C.border}`, borderRadius: 10,
        }}>
          {(validation.checks || []).map((c, i) => (
            <CheckSquare key={i} check={c} />
          ))}
        </div>
      </div>

      {/* Detail per check group */}
      {grouped.map(g => (
        <CheckGroup key={g.check} group={g} />
      ))}
    </div>
  );
}

function Banner({ pass, failures, warnings, ts, onRefresh }) {
  const color = !pass ? C.bad : warnings > 0 ? C.warn : C.good;
  const icon  = !pass ? "✗" : warnings > 0 ? "⚠" : "✓";
  const title = !pass ? "VALIDATION FAILED" : warnings > 0 ? "VALIDATION OK · WITH WARNINGS" : "VALIDATION OK";
  const subtitle = !pass
    ? `${failures} critical ${failures === 1 ? "failure" : "failures"} — push alerts are SUSPENDED until resolved`
    : warnings > 0
      ? `${warnings} non-critical warning${warnings === 1 ? "" : "s"} — alerts continue normally`
      : "All data integrity checks passing — alerts active";

  return (
    <div style={{
      background: `${color}15`, border: `1px solid ${color}50`,
      borderRadius: 10, padding: "16px 20px",
      display: "flex", alignItems: "center", gap: 16,
      flexWrap: "wrap",
    }}>
      <div style={{
        fontSize: 36, fontWeight: 700, color, lineHeight: 1, padding: "0 6px",
      }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 200 }}>
        <div style={{
          fontSize: 13, fontWeight: 800, color,
          letterSpacing: "1.5px",
        }}>{title}</div>
        <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{subtitle}</div>
      </div>
      <div style={{ fontSize: 11, color: C.muted, fontFamily: "'JetBrains Mono', monospace" }}>
        Last check: {fmtClock(ts)} · {timeAgo(ts)}
      </div>
      <button onClick={onRefresh} style={refreshBtnStyle}>Re-run now</button>
    </div>
  );
}

function CheckSquare({ check }) {
  const color = check.status === "pass" ? C.good
              : check.status === "warn" ? C.warn
              : check.status === "fail" ? C.bad
              : C.muted;
  return (
    <div title={`${CHECK_LABELS[check.check] || check.check} · ${check.stat}\n${check.detail}`}
         style={{
           width: 32, height: 32,
           background: `${color}1a`,
           border: `1px solid ${color}55`,
           borderRadius: 4,
           display: "inline-flex", alignItems: "center", justifyContent: "center",
           color,
           fontSize: 13, fontWeight: 700,
           cursor: "default",
           flexShrink: 0,
         }}>
      {check.status === "pass" ? "✓" : check.status === "warn" ? "⚠" : "✗"}
    </div>
  );
}

function CheckGroup({ group }) {
  const [open, setOpen] = useState(group.failed || group.warned);
  const accent = group.failed ? C.bad : group.warned ? C.warn : C.good;

  return (
    <div style={{
      background: C.card, border: `1px solid ${C.border}`,
      borderLeft: `3px solid ${accent}`,
      borderRadius: 10,
    }}>
      <button onClick={() => setOpen(!open)}
              style={{
                width: "100%", textAlign: "left", padding: "12px 16px",
                background: "none", border: "none",
                cursor: "pointer", fontFamily: "inherit",
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 2 }}>
            {open ? "▼" : "▶"} {CHECK_LABELS[group.check] || group.check}
          </div>
          <div style={{ fontSize: 11, color: C.muted, fontStyle: "italic", marginLeft: 16 }}>
            {CHECK_DESCRIPTIONS[group.check] || ""}
          </div>
        </div>
        <Pill color={accent} size="sm">
          {group.list.length} {group.failed ? "FAIL" : group.warned ? "WARN" : "OK"}
        </Pill>
      </button>
      {open && (
        <div style={{ borderTop: `1px solid ${C.borderSoft}`, padding: 12 }}>
          {group.list.map((c, i) => (
            <div key={i} style={{
              padding: "8px 12px",
              borderLeft: `2px solid ${
                c.status === "pass" ? C.good : c.status === "warn" ? C.warn : C.bad
              }`,
              marginBottom: i < group.list.length - 1 ? 6 : 0,
              background: C.bg,
              borderRadius: "0 6px 6px 0",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                <span style={{
                  fontSize: 12, fontWeight: 700, color: C.text,
                  fontFamily: c.stat.startsWith("_") ? "'JetBrains Mono', monospace" : "inherit",
                }}>
                  {c.stat}
                </span>
                <Pill color={c.status === "pass" ? C.good : c.status === "warn" ? C.warn : C.bad} size="sm">
                  {c.status}
                  {c.critical && c.status === "fail" ? " · CRITICAL" : ""}
                </Pill>
              </div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 4, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.5 }}>
                {c.detail}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Legend({ color, label }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
      <span style={{
        width: 10, height: 10, borderRadius: 2,
        background: `${color}30`, border: `1px solid ${color}80`,
      }} />
      <span>{label}</span>
    </span>
  );
}

const refreshBtnStyle = {
  padding: "6px 12px", fontSize: 11, fontWeight: 600,
  background: "transparent", border: `1px solid ${C.border}`,
  color: C.text, borderRadius: 6,
  cursor: "pointer", fontFamily: "inherit",
  letterSpacing: "0.3px",
};
