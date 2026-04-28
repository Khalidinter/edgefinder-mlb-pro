// ═══════════════════════════════════════════════════
// Trajectory Tab — pick a player → chart + side panel
// ═══════════════════════════════════════════════════
import { useState, useEffect, useMemo, useCallback } from "react";
import PriceChart from '../PriceChart.jsx';
import TrajectorySidebar from '../TrajectorySidebar.jsx';
import { Pill, SectionHeading, EmptyState, Spinner } from '../Shared.jsx';
import { C, BRAND, BOOKS_DISPLAY, STAT_LABELS, classifySignal } from '../../utils/constants.js';
import { fmtAmerican, fmtSignedPct } from '../../utils/format.js';
import { fetchTrajectory } from '../../api/worker.js';

export default function TrajectoryTab({
  edges, edgesLoading, todayDate,
  workerUrl, token,
  preselectedEdge, onConsumePreselect,
}) {
  // Build list of trackable props from today's edges. One entry per unique
  // (player, stat, side, line, book) combo — that's the granularity of
  // price_observations.
  const props = useMemo(() => {
    const seen = new Map();
    for (const e of edges || []) {
      if (e.game_date !== todayDate) continue;
      // Only props that v3 would track (price_observations only captures these)
      const tier = classifySignal({ ...e, ev: 5 }); // EV doesn't matter for tracking eligibility
      if (!tier) continue;
      const key = `${e.player}|${e.stat}|${e.side}|${e.line}|${e.book}`;
      if (!seen.has(key)) {
        seen.set(key, {
          key,
          player: e.player, stat: e.stat, side: e.side, line: e.line, book: e.book,
          anchor_book: e.anchor_book, game: e.game,
          edge: e,    // keep one representative edge for context
          tier: classifySignal(e),  // real tier for display
        });
      }
    }
    return Array.from(seen.values()).sort((a, b) => {
      // CONFIRMED first, then alpha
      const ta = a.tier === "CONFIRMED" ? 0 : a.tier === "WATCH" ? 1 : 2;
      const tb = b.tier === "CONFIRMED" ? 0 : b.tier === "WATCH" ? 1 : 2;
      if (ta !== tb) return ta - tb;
      return a.player.localeCompare(b.player);
    });
  }, [edges, todayDate]);

  const [selectedKey, setSelectedKey] = useState(null);

  // Honor preselected edge from Live Board click
  useEffect(() => {
    if (!preselectedEdge) return;
    const key = `${preselectedEdge.player}|${preselectedEdge.stat}|${preselectedEdge.side}|${preselectedEdge.line}|${preselectedEdge.book}`;
    setSelectedKey(key);
    onConsumePreselect?.();
  }, [preselectedEdge, onConsumePreselect]);

  // If nothing selected and we have props, default to the first
  useEffect(() => {
    if (!selectedKey && props.length > 0) setSelectedKey(props[0].key);
  }, [props, selectedKey]);

  const selected = props.find(p => p.key === selectedKey) || null;

  // Fetch trajectory when selection changes
  const [traj, setTraj] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadTraj = useCallback(async () => {
    if (!selected || !workerUrl || !token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTrajectory(workerUrl, token, {
        player: selected.player,
        stat: selected.stat,
        side: selected.side,
        line: String(selected.line),
        book: selected.book,
        game_date: todayDate,
      });
      setTraj(data);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [selected, workerUrl, token, todayDate]);

  useEffect(() => { loadTraj(); }, [loadTraj]);

  // Auto-refresh every 60s if a prop is selected
  useEffect(() => {
    if (!selected) return;
    const id = setInterval(loadTraj, 60_000);
    return () => clearInterval(id);
  }, [selected, loadTraj]);

  // Distinguish initial load (parent still fetching /export) from genuine empty
  if (props.length === 0) {
    if (edgesLoading || !edges || edges.length === 0) {
      return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 80, gap: 12 }}>
          <Spinner size={28} />
          <div style={{ color: C.muted, fontSize: 12 }}>Loading today's slate…</div>
        </div>
      );
    }
    return (
      <EmptyState
        icon="◇"
        title="No tracked props yet today"
        subtitle="Trajectory tracks signal-tier candidates (TB Under 1.5, K Under 6.5, Hits Under 0.5). Once today's slate has those, this tab populates."
      />
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Player picker */}
      <PropPicker props={props} selectedKey={selectedKey} onSelect={setSelectedKey} />

      {/* Chart + side panel */}
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <ChartHeader selected={selected} />
          <div style={{
            background: C.card, border: `1px solid ${C.border}`,
            borderRadius: 10, padding: 14, paddingBottom: 8,
            minHeight: 360,
          }}>
            {/* Loading takes priority over error: while loading,
                hide any prior error so we don't flash "Failed to fetch"
                during a transient retry. */}
            {loading ? (
              <div style={{
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                padding: 60, gap: 12,
              }}>
                <Spinner size={28} />
                <div style={{ color: C.muted, fontSize: 12 }}>Loading trajectory…</div>
              </div>
            ) : error ? (
              <div style={{
                padding: 24, textAlign: "center",
                color: C.muted, fontSize: 13,
              }}>
                <div style={{ fontSize: 28, color: C.dim, marginBottom: 10 }}>⚠</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 6 }}>
                  Couldn't load trajectory
                </div>
                <div style={{ marginBottom: 14, fontSize: 12 }}>
                  {error.message === "Failed to fetch"
                    ? "Network blip or worker cold-start. Tap retry."
                    : error.message}
                </div>
                <button onClick={loadTraj} style={{
                  padding: "6px 14px", fontSize: 12, fontWeight: 600,
                  background: "transparent", border: `1px solid ${C.border}`,
                  color: C.text, borderRadius: 6,
                  cursor: "pointer", fontFamily: "inherit",
                }}>Retry</button>
              </div>
            ) : !traj?.observations || traj.observations.length === 0 ? (
              <EmptyState
                icon="◌"
                title="No observations yet"
                subtitle="The price tracker captures one snapshot per scan (every 5 min). Hold tight — first data lands shortly."
              />
            ) : (
              <PriceChart
                observations={traj.observations}
                pushEvents={selected?.edge?.pushed_at &&
                  selected.edge.pushed_at !== "no-signal" &&
                  selected.edge.pushed_at !== "historical"
                    ? [{ ts: selected.edge.pushed_at }]
                    : []
                }
              />
            )}
          </div>
          <ChartLegend hasPush={
            selected?.edge?.pushed_at &&
            selected.edge.pushed_at !== "no-signal" &&
            selected.edge.pushed_at !== "historical"
          } />
        </div>

        <div style={{ width: 280, flexShrink: 0 }}>
          <TrajectorySidebar traj={traj} edge={selected?.edge} />
        </div>
      </div>
    </div>
  );
}

// ── Prop picker (horizontal scrollable list) ──
function PropPicker({ props, selectedKey, onSelect }) {
  return (
    <div>
      <SectionHeading count={props.length}>Today's Tracked Props</SectionHeading>
      <div style={{
        display: "flex", gap: 8, overflowX: "auto",
        padding: "2px 2px 8px",
      }}>
        {props.map(p => {
          const isActive = p.key === selectedKey;
          const accent = p.tier === "CONFIRMED" ? C.gold : p.tier === "WATCH" ? C.cyan : C.muted;
          return (
            <button key={p.key} onClick={() => onSelect(p.key)}
                    style={{
                      flexShrink: 0,
                      background: isActive ? `${accent}15` : C.card,
                      border: `1px solid ${isActive ? accent : C.border}`,
                      borderLeft: `3px solid ${accent}`,
                      borderRadius: 8, padding: "9px 14px",
                      color: C.text, cursor: "pointer",
                      fontFamily: "inherit", textAlign: "left",
                      transition: "all 0.15s",
                      minWidth: 200,
                    }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 2 }}>
                {p.player}
              </div>
              <div style={{ fontSize: 11, color: C.muted }}>
                {p.side} {p.line} {STAT_LABELS[p.stat] || p.stat} · {BOOKS_DISPLAY[p.book] || p.book}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ChartHeader({ selected }) {
  if (!selected) return null;
  return (
    <div style={{ marginBottom: 10, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
      <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>
        {selected.player}
      </div>
      <div style={{ fontSize: 13, color: C.muted }}>
        {selected.side} {selected.line} {STAT_LABELS[selected.stat] || selected.stat}
      </div>
      <Pill color={selected.tier === "CONFIRMED" ? C.gold : selected.tier === "WATCH" ? C.cyan : C.muted}>
        {selected.tier || "—"}
      </Pill>
      <Pill color={C.muted} size="sm">
        @ {BOOKS_DISPLAY[selected.book] || selected.book}
      </Pill>
      <Pill color={C.dim} size="sm" dim>
        anchor: {BOOKS_DISPLAY[selected.anchor_book] || selected.anchor_book}
      </Pill>
      {selected.game && (
        <span style={{ fontSize: 12, color: C.muted, marginLeft: "auto" }}>
          {selected.game}
        </span>
      )}
    </div>
  );
}

function ChartLegend({ hasPush }) {
  return (
    <div style={{
      display: "flex", gap: 18, justifyContent: "center", flexWrap: "wrap",
      paddingTop: 10, paddingBottom: 4,
      fontSize: 11, color: C.muted,
    }}>
      <LegendDot color={BRAND.teal}>Implied probability (price)</LegendDot>
      <LegendDot color={C.cyan} dashed>EV %</LegendDot>
      {hasPush && <LegendDot color={C.gold}>Pushover sent</LegendDot>}
    </div>
  );
}

function LegendDot({ color, dashed = false, children }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <span style={{
        width: 18, height: 2,
        background: dashed
          ? `repeating-linear-gradient(90deg, ${color} 0 4px, transparent 4px 7px)`
          : color,
      }} />
      <span>{children}</span>
    </span>
  );
}
