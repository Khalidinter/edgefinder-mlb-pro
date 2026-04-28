// ═══════════════════════════════════════════════════
// StatsKPIs — top KPI strip for Performance tab
// ═══════════════════════════════════════════════════
import { C } from '../utils/constants.js';
import { fmtUnits, fmtPct } from '../utils/format.js';

export default function StatsKPIs({ agg, label = "Filtered set" }) {
  if (!agg || agg.n === 0) {
    return (
      <div style={containerStyle}>
        <div style={{ color: C.muted, fontSize: 13, padding: "8px 4px" }}>
          {label}: no resolved bets in this filter.
        </div>
      </div>
    );
  }

  const profitColor = agg.profit > 0 ? C.good : agg.profit < 0 ? C.bad : C.muted;
  const roiColor = agg.roi_pct > 0 ? C.good : agg.roi_pct < 0 ? C.bad : C.muted;
  const winColor = agg.win_pct > 55 ? C.good : agg.win_pct < 50 ? C.bad : C.text;

  return (
    <div style={containerStyle}>
      <KPI label="Bets" value={agg.n} />
      <KPI label="Record"
           value={`${agg.won}-${agg.lost}${agg.push ? `-${agg.push}` : ""}`}
           color={C.text} mono />
      <KPI label="Win %"  value={fmtPct(agg.win_pct)}  color={winColor} mono />
      <KPI label="Profit" value={fmtUnits(agg.profit)} color={profitColor} mono large />
      <KPI label="ROI"    value={fmtPct(agg.roi_pct)}  color={roiColor} mono />
      <KPI label="Avg EV" value={fmtPct(agg.avg_ev)}   color={C.text} />
      <KPI label="Avg Price" value={agg.avg_price > 0 ? `+${agg.avg_price}` : agg.avg_price} mono />
      {agg.pct_beat_close != null && (
        <KPI label="Beat Close" value={fmtPct(agg.pct_beat_close)} mono />
      )}
    </div>
  );
}

function KPI({ label, value, color = C.text, mono = false, large = false }) {
  return (
    <div style={{ minWidth: 90 }}>
      <div style={{
        fontSize: 10, color: C.muted, letterSpacing: "1.5px",
        textTransform: "uppercase", marginBottom: 4,
      }}>
        {label}
      </div>
      <div style={{
        fontSize: large ? 22 : 18,
        fontWeight: 700,
        color,
        fontFamily: mono ? "'JetBrains Mono', monospace" : "inherit",
      }}>
        {value}
      </div>
    </div>
  );
}

const containerStyle = {
  display: "flex",
  gap: 18,
  flexWrap: "wrap",
  padding: 16,
  background: C.card,
  border: `1px solid ${C.border}`,
  borderRadius: 10,
};
