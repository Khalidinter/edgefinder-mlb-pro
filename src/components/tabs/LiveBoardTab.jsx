// ═══════════════════════════════════════════════════
// Live Board — main signal feed + Game Box sidebar
// Validation failure downgrades CONFIRMED → WATCH visually
// "I bet this" persists via POST /track-bet (server-side)
// ═══════════════════════════════════════════════════
import { useState, useMemo } from "react";
import EdgeCard from '../EdgeCard.jsx';
import GameBox from '../GameBox.jsx';
import FilteredEdges from '../FilteredEdges.jsx';
import { Pill, SectionHeading, EmptyState, Spinner } from '../Shared.jsx';
import { C, BRAND, classifySignal } from '../../utils/constants.js';
import { fmtUnits, fmtSignedPct } from '../../utils/format.js';

// Compute filter reason for non-signal edges (used by FilteredEdges expander)
function filterReason(edge) {
  if (edge.ev == null) return "not_signal";
  if (edge.ev < 4)    return "ev_low";
  if (edge.ev > 7)    return "ev_high";
  if (edge.book === "betmgm") return "betmgm_target";
  return "not_signal";
}

export default function LiveBoardTab({
  edges, edgesLoading,
  schedule, scheduleLoading,
  validation,
  trackedIds,            // Set of edge IDs (or fp keys) the user has tracked
  onTrackBet,            // (edge) => void
  onOpenTrajectory,      // (edge) => void
  todayDate,
}) {
  const [selectedGame, setSelectedGame] = useState(null);

  const validationFail = validation?.pass === false;

  // Today's edges only (or selected date)
  const todayEdges = useMemo(() => {
    return (edges || []).filter(e => e.game_date === todayDate);
  }, [edges, todayDate]);

  // Game-filter
  const gameFiltered = useMemo(() => {
    if (!selectedGame) return todayEdges;
    return todayEdges.filter(e => e.game === selectedGame);
  }, [todayEdges, selectedGame]);

  // Classify each edge
  const classified = useMemo(() => {
    return gameFiltered.map(e => {
      const tier = classifySignal(e);
      return { edge: e, origTier: tier, effTier: validationFail && tier === "CONFIRMED" ? "WATCH" : tier };
    });
  }, [gameFiltered, validationFail]);

  // Split signal vs filtered
  const signals = classified.filter(c => c.origTier).map(c => ({ ...c, _filterReason: null }));
  const filteredOut = classified.filter(c => !c.origTier).map(c => ({
    ...c.edge, _filterReason: filterReason(c.edge),
  }));

  // Sort: CONFIRMED first, then WATCH, then by EV desc
  const sortedSignals = [...signals].sort((a, b) => {
    const order = { CONFIRMED: 0, WATCH: 1 };
    const oa = order[a.effTier] ?? 99;
    const ob = order[b.effTier] ?? 99;
    if (oa !== ob) return oa - ob;
    return (b.edge.ev || 0) - (a.edge.ev || 0);
  });

  // Hero stats
  const confCount  = classified.filter(c => c.origTier === "CONFIRMED").length;
  const watchCount = classified.filter(c => c.origTier === "WATCH").length;
  const resolvedToday = todayEdges.filter(e => e.resolved === 1);
  const settledProfit = resolvedToday.reduce((s, e) => s + (e.profit || 0), 0);

  return (
    <div style={{
      display: "grid",
      // Sidebar 280px on the right when there's room (>= 880px wide),
      // single column otherwise (sidebar drops below).
      gridTemplateColumns: "minmax(0, 1fr) 280px",
      gap: 24,
      alignItems: "start",      // KEY for sticky to work in grid
    }}
    className="lb-grid"
    >
      {/* Main column */}
      <div style={{ minWidth: 0 }}>
        {/* Hero stat strip */}
        <div style={{
          display: "flex", gap: 12, marginBottom: 18, flexWrap: "wrap",
          padding: 16,
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 10,
        }}>
          <Stat label="Today" value={todayDate} mono />
          <Stat label="Live edges" value={signals.length} accent={signals.length > 0 ? BRAND.teal : C.muted} />
          <Stat label="Confirmed" value={confCount} accent={validationFail ? C.muted : C.gold} />
          <Stat label="Watch" value={watchCount} accent={C.cyan} />
          <Stat label="Resolved" value={`${resolvedToday.length}/${todayEdges.length}`} />
          <Stat label="Settled today" value={fmtUnits(settledProfit)}
                accent={settledProfit >= 0 ? C.good : C.bad} mono />
        </div>

        {/* Selected game banner */}
        {selectedGame && (
          <div style={{
            padding: "10px 14px",
            background: `${BRAND.teal}10`, border: `1px solid ${BRAND.teal}40`,
            borderRadius: 8, marginBottom: 16,
            display: "flex", justifyContent: "space-between", alignItems: "center",
            fontSize: 13, color: C.text,
          }}>
            <span>Filtering to: <strong style={{ color: BRAND.teal }}>{selectedGame}</strong></span>
            <button onClick={() => setSelectedGame(null)}
                    style={{
                      background: "none", border: "none", color: C.muted,
                      cursor: "pointer", fontSize: 16, padding: 4,
                    }}>×</button>
          </div>
        )}

        {/* Signal list */}
        <SectionHeading count={sortedSignals.length}>
          {selectedGame ? "Signals in this game" : "Live Signals"}
        </SectionHeading>

        {edgesLoading && sortedSignals.length === 0 ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
            <Spinner size={28} />
          </div>
        ) : sortedSignals.length === 0 ? (
          <EmptyState
            icon="◇"
            title={selectedGame ? "No signals in this game" : "No signals yet today"}
            subtitle={selectedGame ? "Try clearing the game filter." : "Worker scans every 5 min during active hours."}
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {sortedSignals.map(({ edge, origTier, effTier }) => (
              <EdgeCard
                key={edge.id || `${edge.player}-${edge.book}-${edge.line}-${edge.created_at}`}
                edge={edge}
                effectiveTier={effTier}
                origTier={origTier}
                isTracked={trackedIds.has(edge.id)}
                isResolved={edge.resolved === 1}
                validationFail={validationFail}
                onTrack={() => onTrackBet(edge, origTier)}
                onTrajectory={() => onOpenTrajectory(edge)}
              />
            ))}
          </div>
        )}

        {/* Below-threshold expander */}
        <FilteredEdges edges={filteredOut} />
      </div>

      {/* Sidebar */}
      <GameBox
        schedule={schedule}
        loading={scheduleLoading}
        selectedGame={selectedGame}
        onSelectGame={setSelectedGame}
      />

      <style>{`
        @media (max-width: 880px) {
          .lb-grid { grid-template-columns: minmax(0, 1fr) !important; }
        }
      `}</style>
    </div>
  );
}

function Stat({ label, value, accent = C.text, mono = false }) {
  return (
    <div style={{ minWidth: 100 }}>
      <div style={{ fontSize: 10, color: C.muted, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 4 }}>
        {label}
      </div>
      <div style={{
        fontSize: 18, fontWeight: 700, color: accent,
        fontFamily: mono ? "'JetBrains Mono', monospace" : "inherit",
      }}>
        {value}
      </div>
    </div>
  );
}
