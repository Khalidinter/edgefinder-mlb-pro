// ═══════════════════════════════════════════════════
// Resolved Tab — historical bet ledger
// Shows resolved edges + tracked bets side-by-side
// ═══════════════════════════════════════════════════
import { useState, useMemo } from "react";
import { Pill, SectionHeading, EmptyState, Spinner } from '../Shared.jsx';
import StatsKPIs from '../StatsKPIs.jsx';
import { C, BRAND, BOOKS_DISPLAY, STAT_LABELS, classifySignal } from '../../utils/constants.js';
import { fmtAmerican, fmtUnits, fmtSignedPct, fmtPct, timeAgo } from '../../utils/format.js';
import { aggregate } from '../../utils/stats.js';

const PAGE_SIZE = 50;

export default function ResolvedTab({ edges, edgesLoading, trackedBets }) {
  const [outcomeFilter, setOutcomeFilter] = useState("all");        // "all"|"won"|"lost"|"push"
  const [trackedFilter, setTrackedFilter] = useState("all");        // "all"|"tracked"|"untracked"
  const [tierFilter, setTierFilter] = useState("all");              // "all"|"signal"|"non-signal"
  const [page, setPage] = useState(0);

  // Build a Set of edge_ids from tracked bets
  const trackedIds = useMemo(() => {
    const set = new Set();
    (trackedBets?.bets || []).forEach(b => { if (b.edge_id) set.add(b.edge_id); });
    return set;
  }, [trackedBets]);

  // Resolved edges only, sorted newest first
  const resolved = useMemo(() => {
    return (edges || [])
      .filter(e => e.resolved === 1)
      .sort((a, b) => {
        const ta = a.resolved_at || a.created_at || "";
        const tb = b.resolved_at || b.created_at || "";
        return tb.localeCompare(ta);
      });
  }, [edges]);

  // Apply filters
  const filtered = useMemo(() => {
    return resolved.filter(e => {
      if (outcomeFilter !== "all" && e.outcome !== outcomeFilter) return false;
      if (trackedFilter === "tracked"   && !trackedIds.has(e.id))  return false;
      if (trackedFilter === "untracked" &&  trackedIds.has(e.id))  return false;
      if (tierFilter !== "all") {
        const tier = classifySignal(e);
        if (tierFilter === "signal" && !tier)    return false;
        if (tierFilter === "non-signal" && tier) return false;
      }
      return true;
    });
  }, [resolved, outcomeFilter, trackedFilter, tierFilter, trackedIds]);

  // Paginate
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // KPIs for the filtered view
  const filteredAgg  = useMemo(() => aggregate(filtered), [filtered]);
  const trackedAgg   = useMemo(() => aggregate(filtered.filter(e => trackedIds.has(e.id))), [filtered, trackedIds]);

  if (edgesLoading && (!edges || edges.length === 0)) {
    return <div style={{ display: "flex", justifyContent: "center", padding: 80 }}><Spinner size={32} /></div>;
  }

  if (resolved.length === 0) {
    return <EmptyState icon="◇" title="Nothing resolved yet" subtitle="Once games complete and the resolver fires, the history populates here." />;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Filter row */}
      <div style={{
        display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap",
        padding: "12px 16px",
        background: C.card, border: `1px solid ${C.border}`, borderRadius: 10,
      }}>
        <FilterGroup label="Outcome" value={outcomeFilter} onChange={setOutcomeFilter}
                     options={[
                       { v: "all", l: "All" },
                       { v: "won", l: "Won", color: C.good },
                       { v: "lost", l: "Lost", color: C.bad },
                       { v: "push", l: "Push", color: C.muted },
                     ]} />
        <FilterGroup label="Tracked" value={trackedFilter} onChange={setTrackedFilter}
                     options={[
                       { v: "all", l: "All" },
                       { v: "tracked", l: "Tracked", color: BRAND.teal },
                       { v: "untracked", l: "Not tracked" },
                     ]} />
        <FilterGroup label="Tier" value={tierFilter} onChange={setTierFilter}
                     options={[
                       { v: "all", l: "All" },
                       { v: "signal", l: "Signal", color: C.gold },
                       { v: "non-signal", l: "Non-signal" },
                     ]} />
        <div style={{ marginLeft: "auto", color: C.muted, fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}>
          {filtered.length} of {resolved.length}
        </div>
      </div>

      <StatsKPIs agg={filteredAgg} />

      {/* Tracked-bets panel */}
      {trackedBets && trackedBets.n > 0 && (
        <div style={{
          background: C.card, border: `1px solid ${C.border}`,
          borderLeft: `3px solid ${BRAND.teal}`,
          borderRadius: 10, padding: 16,
        }}>
          <div style={{ fontSize: 11, color: BRAND.teal, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 8 }}>
            YOUR TRACKED BETS · {trackedBets.n}
          </div>
          {trackedAgg && trackedAgg.n > 0 ? (
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              <Stat label="Resolved" value={`${trackedAgg.won}-${trackedAgg.lost}${trackedAgg.push ? `-${trackedAgg.push}` : ""}`} mono />
              <Stat label="Profit" value={fmtUnits(trackedAgg.profit)} color={trackedAgg.profit >= 0 ? C.good : C.bad} mono />
              <Stat label="Win %" value={fmtPct(trackedAgg.win_pct)} mono />
              <Stat label="ROI" value={fmtPct(trackedAgg.roi_pct)}
                    color={trackedAgg.roi_pct >= 0 ? C.good : C.bad} mono />
            </div>
          ) : (
            <div style={{ fontSize: 13, color: C.muted, fontStyle: "italic" }}>
              All your tracked bets are still pending resolution.
            </div>
          )}
        </div>
      )}

      {/* Ledger */}
      <SectionHeading count={filtered.length}>Resolved Ledger</SectionHeading>
      <div style={{
        background: C.card, border: `1px solid ${C.border}`,
        borderRadius: 10, overflowX: "auto",
      }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 920 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.border}` }}>
              <Th>Date</Th><Th>Player</Th><Th>Prop</Th><Th>Book</Th>
              <Th align="right">Price</Th><Th align="right">EV</Th>
              <Th align="right">Actual</Th><Th align="right">Result</Th>
              <Th align="right">Profit</Th><Th align="right">CLV</Th>
              <Th align="center">Tracked</Th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map(e => (
              <Row key={e.id} edge={e} tracked={trackedIds.has(e.id)} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div style={{ display: "flex", gap: 8, justifyContent: "center", padding: 8 }}>
          <PageBtn disabled={page === 0} onClick={() => setPage(0)}>« First</PageBtn>
          <PageBtn disabled={page === 0} onClick={() => setPage(p => p - 1)}>‹ Prev</PageBtn>
          <span style={{ alignSelf: "center", color: C.muted, fontSize: 12, padding: "0 8px",
                          fontFamily: "'JetBrains Mono', monospace" }}>
            {page + 1} / {pages}
          </span>
          <PageBtn disabled={page >= pages - 1} onClick={() => setPage(p => p + 1)}>Next ›</PageBtn>
          <PageBtn disabled={page >= pages - 1} onClick={() => setPage(pages - 1)}>Last »</PageBtn>
        </div>
      )}
    </div>
  );
}

function Row({ edge, tracked }) {
  const tier = classifySignal(edge);
  const tierColor = tier === "CONFIRMED" ? C.gold : tier === "WATCH" ? C.cyan : null;
  const outcomeColor = edge.outcome === "won" ? C.good
                     : edge.outcome === "lost" ? C.bad : C.muted;
  return (
    <tr style={{ borderBottom: `1px solid ${C.borderSoft}` }}>
      <Td mono dim>{edge.game_date}</Td>
      <Td>
        <span style={{ color: C.text, fontWeight: 600 }}>{edge.player}</span>
        {tier && (
          <span style={{
            display: "inline-block", marginLeft: 6,
            fontSize: 9, padding: "1px 5px", borderRadius: 3,
            background: `${tierColor}25`, color: tierColor,
            fontWeight: 700, letterSpacing: "0.5px",
          }}>
            {tier === "CONFIRMED" ? "CONF" : "WATCH"}
          </span>
        )}
      </Td>
      <Td dim>
        <span style={{ color: C.text, fontWeight: 600 }}>{edge.side} {edge.line}</span>{" "}
        {STAT_LABELS[edge.stat] || edge.stat}
      </Td>
      <Td dim>{BOOKS_DISPLAY[edge.book] || edge.book}</Td>
      <Td mono align="right">{fmtAmerican(edge.price)}</Td>
      <Td mono dim align="right">{fmtSignedPct(edge.ev)}</Td>
      <Td mono align="right">{edge.actual_value != null ? edge.actual_value : "—"}</Td>
      <Td align="right">
        <Pill color={outcomeColor} size="sm">{edge.outcome}</Pill>
      </Td>
      <Td mono align="right" color={
        edge.profit > 0 ? C.good : edge.profit < 0 ? C.bad : C.muted
      }>
        {edge.profit != null ? fmtUnits(edge.profit) : "—"}
      </Td>
      <Td mono align="right" dim>
        {edge.clv != null ? fmtSignedPct(edge.clv) : "—"}
      </Td>
      <Td align="center">
        {tracked ? <span style={{ color: BRAND.teal, fontSize: 14 }}>✓</span> : <span style={{ color: C.dim }}>·</span>}
      </Td>
    </tr>
  );
}

function FilterGroup({ label, value, onChange, options }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ fontSize: 10, color: C.muted, letterSpacing: "1.5px", textTransform: "uppercase", fontWeight: 700, marginRight: 4 }}>
        {label}
      </span>
      {options.map(o => {
        const active = value === o.v;
        const accent = o.color || BRAND.teal;
        return (
          <button key={o.v} onClick={() => onChange(o.v)}
                  style={{
                    padding: "4px 10px", borderRadius: 5,
                    border: `1px solid ${active ? accent : C.border}`,
                    background: active ? `${accent}15` : "transparent",
                    color: active ? accent : C.muted,
                    fontSize: 11, fontWeight: active ? 600 : 500,
                    cursor: "pointer", fontFamily: "inherit",
                  }}>
            {o.l}
          </button>
        );
      })}
    </div>
  );
}

function Th({ children, align = "left" }) {
  return (
    <th style={{
      padding: "10px 12px", fontSize: 10, fontWeight: 700,
      color: C.muted, letterSpacing: "1px", textTransform: "uppercase",
      textAlign: align, whiteSpace: "nowrap",
    }}>{children}</th>
  );
}

function Td({ children, align = "left", mono = false, dim = false, color }) {
  return (
    <td style={{
      padding: "8px 12px", fontSize: 12,
      textAlign: align,
      color: color || (dim ? C.muted : C.text),
      fontFamily: mono ? "'JetBrains Mono', monospace" : "inherit",
      whiteSpace: "nowrap",
    }}>{children}</td>
  );
}

function PageBtn({ disabled, onClick, children }) {
  return (
    <button onClick={onClick} disabled={disabled}
            style={{
              padding: "5px 11px", fontSize: 12,
              background: "transparent",
              border: `1px solid ${disabled ? C.borderSoft : C.border}`,
              color: disabled ? C.dim : C.text,
              borderRadius: 5, fontFamily: "inherit",
              cursor: disabled ? "default" : "pointer",
            }}>
      {children}
    </button>
  );
}

function Stat({ label, value, color = C.text, mono = false }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: C.muted, letterSpacing: "1.5px", textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: 17, fontWeight: 700, color, fontFamily: mono ? "'JetBrains Mono', monospace" : "inherit", marginTop: 2 }}>
        {value}
      </div>
    </div>
  );
}
