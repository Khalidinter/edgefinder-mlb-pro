// ═══════════════════════════════════════════════════
// TrajectorySidebar — open/current/min/max stats panel
// Shows movement summary alongside the chart
// ═══════════════════════════════════════════════════
import { C, BRAND, BOOKS_DISPLAY } from '../utils/constants.js';
import { fmtAmerican, fmtSignedPct, fmtClock, timeAgo } from '../utils/format.js';
import { Pill } from './Shared.jsx';

function impliedProb(p) {
  if (p == null) return null;
  if (p > 0)  return 100 / (p + 100);
  if (p < 0)  return Math.abs(p) / (Math.abs(p) + 100);
  return 0.5;
}

export default function TrajectorySidebar({ traj, edge }) {
  if (!traj || !traj.observations || traj.observations.length === 0) {
    return (
      <div style={panelStyle}>
        <div style={{ color: C.muted, fontSize: 13, padding: 16, textAlign: "center" }}>
          No price observations recorded yet. New observations append every scan.
        </div>
      </div>
    );
  }

  const obs = traj.observations;
  const first = obs[0];
  const last = obs[obs.length - 1];
  const prices = obs.map(o => o.price);
  const evs = obs.map(o => o.ev);

  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const minEV = Math.min(...evs);
  const maxEV = Math.max(...evs);

  const priceMove = last.price - first.price;
  const evMove = last.ev - first.ev;

  // Implied prob movement (more interpretable than raw American odds delta)
  const ipFirst = impliedProb(first.price);
  const ipLast = impliedProb(last.price);
  const ipMovePp = ((ipLast - ipFirst) * 100);

  // Movement direction relative to user's bet side
  // For Under: line moving toward higher Under-prob = market moved IN our favor → negative price (more juice)
  // For Over:  line moving toward higher Over-prob = market moved IN our favor
  const side = edge?.side;
  const inFavor = side === "Under" ? ipMovePp > 0 : side === "Over" ? ipMovePp < 0 : null;
  const movementColor = ipMovePp === 0 ? C.muted : inFavor ? C.good : C.bad;
  const movementLabel = ipMovePp === 0 ? "flat"
    : inFavor ? "moved in your favor" : "moved against you";

  return (
    <div style={panelStyle}>
      {/* Title */}
      <SectionTitle>Price Movement</SectionTitle>
      <Row label="Open">
        <span className="mono">{fmtAmerican(first.price)} <Sub>({(ipFirst * 100).toFixed(1)}%)</Sub></span>
      </Row>
      <Row label="Current">
        <span className="mono">{fmtAmerican(last.price)} <Sub>({(ipLast * 100).toFixed(1)}%)</Sub></span>
      </Row>
      <Row label="Move">
        <span className="mono" style={{ color: movementColor, fontWeight: 700 }}>
          {ipMovePp >= 0 ? "+" : ""}{ipMovePp.toFixed(1)}pp
        </span>
      </Row>
      <div style={{ fontSize: 11, color: movementColor, marginTop: 6, marginBottom: 14 }}>
        {movementLabel}
      </div>

      <SectionTitle>Range</SectionTitle>
      <Row label="Min price"><span className="mono">{fmtAmerican(minPrice)}</span></Row>
      <Row label="Max price"><span className="mono">{fmtAmerican(maxPrice)}</span></Row>
      <Row label="Min EV"><span className="mono" style={{ color: minEV < 0 ? C.bad : C.muted }}>
        {fmtSignedPct(minEV)}
      </span></Row>
      <Row label="Max EV"><span className="mono" style={{ color: maxEV >= 5 ? C.good : C.text }}>
        {fmtSignedPct(maxEV)}
      </span></Row>

      <div style={{ marginTop: 18 }}>
        <SectionTitle>Observations</SectionTitle>
        <Row label="Total"><span className="mono">{obs.length}</span></Row>
        <Row label="First seen"><Sub>{fmtClock(first.observed_at)}</Sub></Row>
        <Row label="Last seen"><Sub>{timeAgo(last.observed_at)}</Sub></Row>
      </div>

      {edge && edge.outcome && (
        <div style={{ marginTop: 18 }}>
          <SectionTitle>Outcome</SectionTitle>
          <Row label="Result">
            <Pill color={edge.outcome === "won" ? C.good : edge.outcome === "lost" ? C.bad : C.muted} size="sm">
              {edge.outcome}
            </Pill>
          </Row>
          {edge.actual_value != null && (
            <Row label="Actual"><span className="mono">{edge.actual_value}</span></Row>
          )}
          {edge.profit != null && (
            <Row label="Profit">
              <span className="mono" style={{ color: edge.profit >= 0 ? C.good : C.bad, fontWeight: 700 }}>
                {edge.profit >= 0 ? "+" : ""}{Number(edge.profit).toFixed(2)}u
              </span>
            </Row>
          )}
          {edge.clv != null && (
            <Row label="CLV">
              <span className="mono" style={{ color: edge.clv >= 0 ? C.good : C.bad }}>
                {fmtSignedPct(edge.clv)}
              </span>
            </Row>
          )}
        </div>
      )}
    </div>
  );
}

function Row({ label, children }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "5px 0", fontSize: 12,
    }}>
      <span style={{ color: C.muted }}>{label}</span>
      <span style={{ color: C.text }}>{children}</span>
    </div>
  );
}

function Sub({ children }) {
  return <span style={{ color: C.dim, fontSize: 11 }}>{children}</span>;
}

function SectionTitle({ children }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 700, color: BRAND.teal,
      letterSpacing: "1.5px", textTransform: "uppercase",
      marginBottom: 8, paddingBottom: 6,
      borderBottom: `1px solid ${C.borderSoft}`,
    }}>{children}</div>
  );
}

const panelStyle = {
  background: C.card,
  border: `1px solid ${C.border}`,
  borderRadius: 10,
  padding: 16,
};
