// ═══════════════════════════════════════════════════
// PriceChart — SVG dual-axis line chart
// X: time (observed_at)
// Y left:  implied probability % (from American odds — natural scale)
// Y right: EV %
// Markers per observation; tooltip on hover.
// ═══════════════════════════════════════════════════
import { useState, useMemo } from "react";
import { C, BRAND } from '../utils/constants.js';
import { fmtAmerican, fmtSignedPct, fmtClock } from '../utils/format.js';

// American odds → implied probability (0-1)
function impliedProb(american) {
  if (american == null || isNaN(american)) return null;
  const a = Number(american);
  if (a > 0)  return 100 / (a + 100);
  if (a < 0)  return Math.abs(a) / (Math.abs(a) + 100);
  return 0.5;
}

const PADDING = { top: 30, right: 60, bottom: 40, left: 60 };

export default function PriceChart({ observations, pushEvents = [], height = 320, width = null }) {
  const [hover, setHover] = useState(null);
  const [size, setSize] = useState({ w: 720, h: height });

  const obs = (observations || []).slice().sort(
    (a, b) => new Date(a.observed_at).getTime() - new Date(b.observed_at).getTime()
  );

  const computed = useMemo(() => {
    if (obs.length === 0) return null;
    const ts = obs.map(o => new Date(o.observed_at).getTime());
    const ip = obs.map(o => impliedProb(o.price));
    const ev = obs.map(o => Number(o.ev) || 0);

    const tMin = ts[0];
    const tMax = ts[ts.length - 1];
    const tRange = Math.max(tMax - tMin, 1);

    // Implied prob axis bounds — 5pp padding around min/max, but always include 50% midline
    const ipMin = Math.min(...ip, 0.5) - 0.05;
    const ipMax = Math.max(...ip, 0.5) + 0.05;
    const ipRange = ipMax - ipMin;

    // EV axis bounds — fixed 0-10 typical for our edges, expand if needed
    const evMin = Math.min(0, ...ev) - 1;
    const evMax = Math.max(8, ...ev) + 1;
    const evRange = evMax - evMin;

    return { obs, ts, ip, ev, tMin, tMax, tRange, ipMin, ipMax, ipRange, evMin, evMax, evRange };
  }, [obs]);

  if (!computed) return <EmptyChart height={height} />;

  const { tMin, tRange, ipMin, ipRange, evMin, evRange } = computed;

  const W = size.w, H = size.h;
  const innerW = W - PADDING.left - PADDING.right;
  const innerH = H - PADDING.top - PADDING.bottom;

  const xOf = (t) => PADDING.left + ((t - tMin) / tRange) * innerW;
  const yOfIP = (p) => PADDING.top + (1 - (p - ipMin) / ipRange) * innerH;
  const yOfEV = (e) => PADDING.top + (1 - (e - evMin) / evRange) * innerH;

  // Path strings
  const pricePath = computed.obs.map((o, i) => {
    const x = xOf(computed.ts[i]);
    const y = yOfIP(computed.ip[i]);
    return (i === 0 ? "M" : "L") + x + "," + y;
  }).join(" ");

  const evPath = computed.obs.map((o, i) => {
    const x = xOf(computed.ts[i]);
    const y = yOfEV(computed.ev[i]);
    return (i === 0 ? "M" : "L") + x + "," + y;
  }).join(" ");

  // Push event x positions
  const pushXs = pushEvents
    .map(p => new Date(p.ts).getTime())
    .filter(t => t >= computed.tMin && t <= computed.tMax)
    .map(t => xOf(t));

  // Y gridlines for implied prob
  const ipTicks = computeTicks(computed.ipMin, computed.ipMax, 5);
  const evTicks = computeTicks(computed.evMin, computed.evMax, 5);
  const xTicks = computeTimeTicks(computed.tMin, computed.tMax, 5);

  // Hover positioning
  function onMouseMove(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    if (px < PADDING.left || px > W - PADDING.right) { setHover(null); return; }
    // Find nearest observation
    let nearestI = 0;
    let nearestD = Infinity;
    for (let i = 0; i < computed.ts.length; i++) {
      const x = xOf(computed.ts[i]);
      const d = Math.abs(x - px);
      if (d < nearestD) { nearestD = d; nearestI = i; }
    }
    setHover({ i: nearestI, x: xOf(computed.ts[nearestI]) });
  }

  return (
    <div ref={el => {
      if (el) {
        const w = el.clientWidth;
        if (w > 0 && Math.abs(w - size.w) > 4) setSize(s => ({ ...s, w }));
      }
    }} style={{ width: "100%", position: "relative" }}>
      <svg width={W} height={H}
           onMouseMove={onMouseMove}
           onMouseLeave={() => setHover(null)}
           style={{ display: "block" }}>

        {/* Background grid */}
        {ipTicks.map((p, i) => (
          <g key={"hg" + i}>
            <line x1={PADDING.left} x2={W - PADDING.right}
                  y1={yOfIP(p)} y2={yOfIP(p)}
                  stroke={C.borderSoft} strokeWidth="1" strokeDasharray="2 4" />
            <text x={PADDING.left - 8} y={yOfIP(p) + 3}
                  textAnchor="end" fontSize="10" fill={C.muted}
                  fontFamily="JetBrains Mono">
              {(p * 100).toFixed(0)}%
            </text>
          </g>
        ))}

        {/* Right axis (EV) */}
        {evTicks.map((e, i) => (
          <text key={"ev" + i}
                x={W - PADDING.right + 8} y={yOfEV(e) + 3}
                textAnchor="start" fontSize="10" fill={C.cyan}
                fontFamily="JetBrains Mono" opacity="0.7">
            {e.toFixed(0)}%
          </text>
        ))}

        {/* X axis time ticks */}
        {xTicks.map((t, i) => (
          <g key={"xt" + i}>
            <line x1={xOf(t)} x2={xOf(t)} y1={H - PADDING.bottom} y2={H - PADDING.bottom + 4}
                  stroke={C.muted} strokeWidth="1" />
            <text x={xOf(t)} y={H - PADDING.bottom + 18}
                  textAnchor="middle" fontSize="10" fill={C.muted}
                  fontFamily="JetBrains Mono">
              {fmtTimeTick(t)}
            </text>
          </g>
        ))}

        {/* 50% midline (book breakeven for +100/-100) */}
        <line x1={PADDING.left} x2={W - PADDING.right}
              y1={yOfIP(0.5)} y2={yOfIP(0.5)}
              stroke={C.dim} strokeWidth="1" strokeDasharray="4 4" opacity="0.4" />

        {/* Push event vertical markers */}
        {pushXs.map((px, i) => (
          <g key={"push" + i}>
            <line x1={px} x2={px} y1={PADDING.top} y2={H - PADDING.bottom}
                  stroke={C.gold} strokeWidth="1.5" strokeDasharray="3 3" opacity="0.7" />
            <circle cx={px} cy={PADDING.top - 6} r="4" fill={C.gold} />
          </g>
        ))}

        {/* EV line */}
        <path d={evPath} fill="none" stroke={C.cyan} strokeWidth="2"
              opacity="0.5" strokeDasharray="4 3" />

        {/* Price (implied prob) line */}
        <path d={pricePath} fill="none" stroke={BRAND.teal} strokeWidth="2.5" />

        {/* Observation dots */}
        {computed.obs.map((o, i) => (
          <circle key={i} cx={xOf(computed.ts[i])} cy={yOfIP(computed.ip[i])}
                  r={hover?.i === i ? 5 : 3}
                  fill={BRAND.teal} stroke={C.bg} strokeWidth="1.5" />
        ))}

        {/* Hover crosshair + tooltip */}
        {hover && (
          <g>
            <line x1={hover.x} x2={hover.x} y1={PADDING.top} y2={H - PADDING.bottom}
                  stroke={C.text} strokeWidth="1" opacity="0.3" />
          </g>
        )}

        {/* Axis titles */}
        <text x={PADDING.left} y={PADDING.top - 12} fontSize="10" fill={BRAND.teal}
              fontWeight="700" letterSpacing="1">
          IMPLIED PROB
        </text>
        <text x={W - PADDING.right} y={PADDING.top - 12} textAnchor="end"
              fontSize="10" fill={C.cyan} fontWeight="700" letterSpacing="1">
          EV %
        </text>
      </svg>

      {/* Hover tooltip */}
      {hover && computed.obs[hover.i] && (
        <Tooltip o={computed.obs[hover.i]} x={hover.x} W={W} />
      )}
    </div>
  );
}

function Tooltip({ o, x, W }) {
  const right = x > W * 0.6;
  const ip = impliedProb(o.price);
  return (
    <div style={{
      position: "absolute",
      top: 8,
      [right ? "right" : "left"]: right ? (W - x + 8) : (x + 8),
      background: C.card, border: `1px solid ${C.border}`,
      padding: "8px 10px", borderRadius: 6,
      fontSize: 11, lineHeight: 1.55,
      fontFamily: "'JetBrains Mono', monospace",
      pointerEvents: "none",
      whiteSpace: "nowrap",
      boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
      zIndex: 5,
    }}>
      <div style={{ color: C.muted, marginBottom: 4 }}>{fmtClock(o.observed_at)}</div>
      <div><span style={{ color: BRAND.teal }}>price</span> {fmtAmerican(o.price)} ({(ip * 100).toFixed(1)}%)</div>
      <div><span style={{ color: C.cyan }}>EV</span>    {fmtSignedPct(o.ev)}</div>
      <div><span style={{ color: C.muted }}>tp</span>    {Number(o.tp || 0).toFixed(1)}%</div>
    </div>
  );
}

function EmptyChart({ height }) {
  return (
    <div style={{
      height, display: "flex", alignItems: "center", justifyContent: "center",
      color: C.muted, fontSize: 13,
      border: `1px dashed ${C.border}`, borderRadius: 8,
    }}>
      No price observations yet — tracking starts at the next scan.
    </div>
  );
}

// ── tick helpers ──
function computeTicks(min, max, target) {
  const range = max - min;
  if (range === 0) return [min];
  const rough = range / target;
  const mag = Math.pow(10, Math.floor(Math.log10(rough)));
  const norm = rough / mag;
  const step = norm < 1.5 ? 1 * mag : norm < 3 ? 2 * mag : norm < 7 ? 5 * mag : 10 * mag;
  const start = Math.ceil(min / step) * step;
  const out = [];
  for (let v = start; v <= max + 1e-9; v += step) out.push(v);
  return out;
}

function computeTimeTicks(tMin, tMax, target) {
  const range = tMax - tMin;
  if (range === 0) return [tMin];
  const ticks = [];
  for (let i = 0; i <= target; i++) ticks.push(tMin + (range * i) / target);
  return ticks;
}

function fmtTimeTick(ms) {
  const d = new Date(ms);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "America/New_York" });
}
