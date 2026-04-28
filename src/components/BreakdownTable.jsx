// ═══════════════════════════════════════════════════
// BreakdownTable — sortable performance breakdown
// Shows: rowKey | n | W-L-P | win% | profit | ROI | avg EV | CI95 (if n>=30)
// ═══════════════════════════════════════════════════
import { useState, useMemo } from "react";
import { C, BRAND } from '../utils/constants.js';
import { fmtUnits, fmtPct } from '../utils/format.js';
import { bootstrapROI } from '../utils/stats.js';
import { SectionHeading, EmptyState } from './Shared.jsx';

export default function BreakdownTable({
  title,
  groups,            // [{ key, agg, edges }]
  keyFormatter,      // (key) => string display
  defaultSort = "profit",
  showCI = true,
  minRows = 0,       // hide rows with n < minRows
  pinnedKey = null,  // pin a specific row to the top
}) {
  const [sortKey, setSortKey] = useState(defaultSort);
  const [sortDesc, setSortDesc] = useState(true);

  // Bootstrap CI is expensive — memoize
  const cis = useMemo(() => {
    if (!showCI) return {};
    const out = {};
    for (const g of groups) {
      if (g.agg.n >= 30) {
        out[g.key] = bootstrapROI(g.edges, 500);  // 500 iter is fast and ~good
      }
    }
    return out;
  }, [groups, showCI]);

  const sorted = useMemo(() => {
    const filtered = groups.filter(g => g.agg.n >= minRows);
    return [...filtered].sort((a, b) => {
      // Pinned row goes first (always)
      if (pinnedKey != null) {
        if (a.key === pinnedKey) return -1;
        if (b.key === pinnedKey) return 1;
      }
      const av = a.agg[sortKey];
      const bv = b.agg[sortKey];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      const cmp = sortDesc ? (bv - av) : (av - bv);
      return cmp;
    });
  }, [groups, sortKey, sortDesc, minRows, pinnedKey]);

  function setSort(k) {
    if (k === sortKey) setSortDesc(d => !d);
    else { setSortKey(k); setSortDesc(true); }
  }

  if (groups.length === 0) {
    return (
      <div>
        {title && <SectionHeading>{title}</SectionHeading>}
        <EmptyState icon="◇" title="No data in this filter" />
      </div>
    );
  }

  return (
    <div>
      {title && <SectionHeading count={sorted.length}>{title}</SectionHeading>}
      <div style={{
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: 10,
        overflowX: "auto",
      }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 720 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.border}` }}>
              <Th onClick={null}>{keyHeader(title)}</Th>
              <Th onClick={() => setSort("n")} active={sortKey === "n"} desc={sortDesc} align="right">n</Th>
              <Th align="right">W-L-P</Th>
              <Th onClick={() => setSort("win_pct")} active={sortKey === "win_pct"} desc={sortDesc} align="right">Win %</Th>
              <Th onClick={() => setSort("profit")} active={sortKey === "profit"} desc={sortDesc} align="right">Profit</Th>
              <Th onClick={() => setSort("roi_pct")} active={sortKey === "roi_pct"} desc={sortDesc} align="right">ROI</Th>
              <Th align="right">Avg EV</Th>
              {showCI && <Th align="right">95% CI ROI</Th>}
            </tr>
          </thead>
          <tbody>
            {sorted.map((g, idx) => {
              const isPinned = g.key === pinnedKey;
              const a = g.agg;
              return (
                <tr key={g.key}
                    style={{
                      borderBottom: idx === sorted.length - 1 ? "none" : `1px solid ${C.borderSoft}`,
                      background: isPinned ? `${BRAND.teal}10` : "transparent",
                    }}>
                  <Td>
                    <span style={{ color: isPinned ? BRAND.teal : C.text, fontWeight: isPinned ? 700 : 500 }}>
                      {keyFormatter ? keyFormatter(g.key) : g.key}
                    </span>
                  </Td>
                  <Td align="right" mono>{a.n}</Td>
                  <Td align="right" mono dim>
                    {a.won}-{a.lost}{a.push ? `-${a.push}` : ""}
                  </Td>
                  <Td align="right" mono color={a.win_pct > 55 ? C.good : a.win_pct < 50 ? C.bad : C.text}>
                    {fmtPct(a.win_pct)}
                  </Td>
                  <Td align="right" mono color={a.profit > 0 ? C.good : a.profit < 0 ? C.bad : C.muted}>
                    {fmtUnits(a.profit)}
                  </Td>
                  <Td align="right" mono color={a.roi_pct > 0 ? C.good : a.roi_pct < 0 ? C.bad : C.muted}>
                    {fmtPct(a.roi_pct)}
                  </Td>
                  <Td align="right" mono dim>{fmtPct(a.avg_ev)}</Td>
                  {showCI && (
                    <Td align="right" mono dim>
                      {cis[g.key] ? `[${cis[g.key].lo}%, ${cis[g.key].hi}%]` : "—"}
                    </Td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children, onClick, active, desc, align = "left" }) {
  return (
    <th onClick={onClick} style={{
      padding: "10px 14px",
      fontSize: 10,
      fontWeight: 700,
      color: active ? BRAND.teal : C.muted,
      letterSpacing: "1px",
      textTransform: "uppercase",
      textAlign: align,
      cursor: onClick ? "pointer" : "default",
      userSelect: "none",
      whiteSpace: "nowrap",
    }}>
      {children}{active ? (desc ? " ↓" : " ↑") : ""}
    </th>
  );
}

function Td({ children, align = "left", mono = false, dim = false, color }) {
  return (
    <td style={{
      padding: "9px 14px",
      fontSize: 12,
      textAlign: align,
      color: color || (dim ? C.muted : C.text),
      fontFamily: mono ? "'JetBrains Mono', monospace" : "inherit",
      whiteSpace: "nowrap",
    }}>
      {children}
    </td>
  );
}

function keyHeader(title) {
  if (!title) return "Group";
  // Make a header that fits the breakdown
  if (title.toLowerCase().includes("stat")) return "Prop";
  if (title.toLowerCase().includes("anchor")) return "Pipe";
  if (title.toLowerCase().includes("book")) return "Book";
  if (title.toLowerCase().includes("ev")) return "EV Band";
  if (title.toLowerCase().includes("timing")) return "Timing";
  if (title.toLowerCase().includes("date") || title.toLowerCase().includes("daily")) return "Date";
  return "Group";
}
