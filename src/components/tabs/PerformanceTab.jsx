// ═══════════════════════════════════════════════════
// Performance Tab — KPIs + P&L curve + filterable analytics breakdowns
// ═══════════════════════════════════════════════════
import { useState, useMemo } from "react";
import StatsKPIs from '../StatsKPIs.jsx';
import CumulativePLChart from '../CumulativePLChart.jsx';
import BreakdownTable from '../BreakdownTable.jsx';
import FilterBuilder, { EMPTY_FILTER, applyFilter } from '../FilterBuilder.jsx';
import { Spinner, EmptyState, SectionHeading } from '../Shared.jsx';
import { C, BRAND, BOOKS_DISPLAY, STAT_LABELS } from '../../utils/constants.js';
import {
  aggregate, groupBy, cumulativePL,
  evBand, priceBand, EV_BAND_ORDER, PRICE_BAND_ORDER,
} from '../../utils/stats.js';

export default function PerformanceTab({ edges, edgesLoading }) {
  const [filter, setFilter] = useState(EMPTY_FILTER);

  // Apply filter (memoized)
  const filtered = useMemo(() => applyFilter(edges || [], filter), [edges, filter]);

  // Top-level aggregate
  const topAgg = useMemo(() => aggregate(filtered), [filtered]);

  // Cumulative P&L
  const plPoints = useMemo(() => cumulativePL(filtered), [filtered]);

  // Breakdown groupings
  const byStatSideLine = useMemo(
    () => groupBy(filtered, e => `${e.stat}|${e.side}|${e.line}`),
    [filtered]
  );
  const byAnchorBook = useMemo(
    () => groupBy(filtered, e => `${e.anchor_book || "?"} → ${e.book || "?"}`),
    [filtered]
  );
  const byEvBand = useMemo(
    () => groupBy(filtered, e => evBand(e.ev)),
    [filtered]
  );
  const byPriceBand = useMemo(
    () => groupBy(filtered, e => priceBand(e.price)),
    [filtered]
  );
  const byTiming = useMemo(
    () => groupBy(filtered, e => e.timing),
    [filtered]
  );
  const byDate = useMemo(
    () => groupBy(filtered, e => e.game_date),
    [filtered]
  );

  // Pre-sort for ordered axes
  const sortedEvBands = useMemo(() => {
    return [...byEvBand].sort((a, b) =>
      EV_BAND_ORDER.indexOf(a.key) - EV_BAND_ORDER.indexOf(b.key)
    );
  }, [byEvBand]);

  const sortedPriceBands = useMemo(() => {
    return [...byPriceBand].sort((a, b) =>
      PRICE_BAND_ORDER.indexOf(a.key) - PRICE_BAND_ORDER.indexOf(b.key)
    );
  }, [byPriceBand]);

  const sortedDates = useMemo(() => {
    return [...byDate].sort((a, b) => b.key.localeCompare(a.key));
  }, [byDate]);

  // Loading takes priority — only declare "no edges yet" after the fetch lands
  if (edgesLoading || !edges) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: 80, gap: 14 }}>
        <Spinner size={32} />
        <div style={{ color: C.muted, fontSize: 13 }}>Loading edges…</div>
      </div>
    );
  }

  if (edges.length === 0) {
    return (
      <EmptyState
        icon="◇"
        title="No edges yet"
        subtitle="Performance lights up once the worker writes its first edge."
      />
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <FilterBuilder filter={filter} onChange={setFilter} edges={edges} />

      <StatsKPIs agg={topAgg} />

      {/* Cumulative P&L */}
      <div>
        <SectionHeading>Cumulative P&amp;L</SectionHeading>
        <div style={{
          background: C.card, border: `1px solid ${C.border}`,
          borderRadius: 10, padding: 14, paddingBottom: 4,
        }}>
          <CumulativePLChart points={plPoints} />
        </div>
      </div>

      {/* Breakdowns */}
      <BreakdownTable
        title="By Stat × Side × Line"
        groups={byStatSideLine}
        keyFormatter={k => {
          const [stat, side, line] = k.split("|");
          return `${STAT_LABELS[stat] || stat} ${side} ${line}`;
        }}
        minRows={2}
      />

      <BreakdownTable
        title="By Anchor → Target pipe"
        groups={byAnchorBook.map(g => ({
          ...g,
          key: g.key.split(" → ").map(p =>
            p === "?" ? "?" : (BOOKS_DISPLAY[p] || p)
          ).join(" → "),
        }))}
        minRows={3}
      />

      <BreakdownTable
        title="By EV band"
        groups={sortedEvBands}
        defaultSort={null}
        showCI={false}
      />

      <BreakdownTable
        title="By Price bucket"
        groups={sortedPriceBands}
        defaultSort={null}
        showCI={false}
      />

      <BreakdownTable
        title="By Timing"
        groups={byTiming}
        keyFormatter={k => k || "(unknown)"}
        showCI={false}
      />

      <BreakdownTable
        title="Daily P&L"
        groups={sortedDates}
        defaultSort={null}
        showCI={false}
      />
    </div>
  );
}
