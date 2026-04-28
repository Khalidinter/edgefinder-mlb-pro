// ═══════════════════════════════════════════════════
// CumulativePLChart — SVG line chart of cumulative P&L
// ═══════════════════════════════════════════════════
import { useState, useMemo } from "react";
import { C, BRAND } from '../utils/constants.js';
import { fmtUnits } from '../utils/format.js';

const PADDING = { top: 24, right: 24, bottom: 36, left: 56 };

export default function CumulativePLChart({ points, height = 280 }) {
  const [hover, setHover] = useState(null);
  const [w, setW] = useState(720);

  const computed = useMemo(() => {
    if (!points || points.length < 2) return null;
    const ts = points.map(p => new Date(p.ts).getTime());
    const cum = points.map(p => p.cumulative);
    const tMin = ts[0], tMax = ts[ts.length - 1];
    const tRange = Math.max(tMax - tMin, 1);

    let yMin = Math.min(0, ...cum);
    let yMax = Math.max(0, ...cum);
    const pad = Math.max((yMax - yMin) * 0.08, 0.5);
    yMin -= pad; yMax += pad;

    return { ts, cum, tMin, tMax, tRange, yMin, yMax, yRange: yMax - yMin };
  }, [points]);

  if (!computed) {
    return (
      <div style={{
        height, padding: 20, color: C.muted, fontSize: 13,
        border: `1px dashed ${C.border}`, borderRadius: 8,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        Need at least 2 resolved bets to draw the curve.
      </div>
    );
  }

  const W = w, H = height;
  const innerW = W - PADDING.left - PADDING.right;
  const innerH = H - PADDING.top - PADDING.bottom;

  const xOf = (t) => PADDING.left + ((t - computed.tMin) / computed.tRange) * innerW;
  const yOf = (v) => PADDING.top + (1 - (v - computed.yMin) / computed.yRange) * innerH;

  // Build path string for the line
  const path = computed.cum.map((v, i) => {
    const x = xOf(computed.ts[i]);
    const y = yOf(v);
    return (i === 0 ? "M" : "L") + x + "," + y;
  }).join(" ");

  // Build path for area fill (line down to zero)
  const yZero = yOf(0);
  const lastX = xOf(computed.ts[computed.ts.length - 1]);
  const firstX = xOf(computed.ts[0]);
  const areaPath = `${path} L${lastX},${yZero} L${firstX},${yZero} Z`;

  // Y axis ticks (signed units)
  const yTicks = computeTicks(computed.yMin, computed.yMax, 4);
  // X axis: 5 evenly-spaced time labels
  const xTicks = [];
  for (let i = 0; i <= 4; i++) xTicks.push(computed.tMin + (computed.tRange * i) / 4);

  function onMove(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    if (px < PADDING.left || px > W - PADDING.right) { setHover(null); return; }
    let nearestI = 0, nearestD = Infinity;
    for (let i = 0; i < computed.ts.length; i++) {
      const x = xOf(computed.ts[i]);
      const d = Math.abs(x - px);
      if (d < nearestD) { nearestD = d; nearestI = i; }
    }
    setHover({ i: nearestI, x: xOf(computed.ts[nearestI]) });
  }

  // Final-point styling
  const lastIdx = points.length - 1;
  const finalCum = computed.cum[lastIdx];
  const finalColor = finalCum >= 0 ? C.good : C.bad;

  return (
    <div ref={el => {
      if (el) {
        const cw = el.clientWidth;
        if (cw > 0 && Math.abs(cw - w) > 4) setW(cw);
      }
    }} style={{ width: "100%", position: "relative" }}>
      <svg width={W} height={H} onMouseMove={onMove} onMouseLeave={() => setHover(null)}
           style={{ display: "block" }}>

        {/* Y gridlines */}
        {yTicks.map((v, i) => (
          <g key={"y" + i}>
            <line x1={PADDING.left} x2={W - PADDING.right}
                  y1={yOf(v)} y2={yOf(v)}
                  stroke={v === 0 ? C.muted : C.borderSoft}
                  strokeWidth={v === 0 ? "1" : "1"}
                  strokeDasharray={v === 0 ? "0" : "2 4"} />
            <text x={PADDING.left - 8} y={yOf(v) + 3}
                  textAnchor="end" fontSize="10" fill={C.muted}
                  fontFamily="JetBrains Mono">
              {v >= 0 ? "+" : ""}{v.toFixed(1)}u
            </text>
          </g>
        ))}

        {/* X labels */}
        {xTicks.map((t, i) => (
          <text key={"x" + i} x={xOf(t)} y={H - PADDING.bottom + 18}
                textAnchor="middle" fontSize="10" fill={C.muted}
                fontFamily="JetBrains Mono">
            {fmtTimeTick(t, computed.tRange)}
          </text>
        ))}

        {/* Filled area under/above zero */}
        <path d={areaPath} fill={finalColor} opacity="0.12" />

        {/* Main line */}
        <path d={path} fill="none" stroke={finalColor} strokeWidth="2.2" />

        {/* Final point dot */}
        <circle cx={xOf(computed.ts[lastIdx])} cy={yOf(finalCum)}
                r="4" fill={finalColor} stroke={C.bg} strokeWidth="2" />

        {/* Hover crosshair */}
        {hover && (
          <g>
            <line x1={hover.x} x2={hover.x}
                  y1={PADDING.top} y2={H - PADDING.bottom}
                  stroke={C.text} strokeWidth="1" opacity="0.3" />
            <circle cx={hover.x} cy={yOf(computed.cum[hover.i])}
                    r="5" fill={finalColor} stroke={C.bg} strokeWidth="2" />
          </g>
        )}
      </svg>

      {/* Hover tooltip */}
      {hover && points[hover.i] && (
        <Tooltip p={points[hover.i]} x={hover.x} W={W} />
      )}
    </div>
  );
}

function Tooltip({ p, x, W }) {
  const right = x > W * 0.6;
  return (
    <div style={{
      position: "absolute", top: 8,
      [right ? "right" : "left"]: right ? (W - x + 8) : (x + 8),
      background: C.card, border: `1px solid ${C.border}`,
      padding: "8px 10px", borderRadius: 6,
      fontSize: 11, lineHeight: 1.55,
      fontFamily: "'JetBrains Mono', monospace",
      pointerEvents: "none", whiteSpace: "nowrap",
      boxShadow: "0 4px 12px rgba(0,0,0,0.4)", zIndex: 5,
    }}>
      <div style={{ color: C.muted, marginBottom: 4 }}>{fmtTooltipDate(p.ts)}</div>
      <div>cum: <span style={{ color: p.cumulative >= 0 ? C.good : C.bad, fontWeight: 700 }}>
        {fmtUnits(p.cumulative)}
      </span></div>
      <div>bet:  <span style={{ color: p.profit >= 0 ? C.good : C.bad }}>
        {fmtUnits(p.profit)}
      </span> · #{p.n}</div>
    </div>
  );
}

function computeTicks(min, max, target) {
  const range = max - min;
  if (range === 0) return [min];
  const rough = range / target;
  const mag = Math.pow(10, Math.floor(Math.log10(Math.max(rough, 0.001))));
  const norm = rough / mag;
  const step = norm < 1.5 ? mag : norm < 3 ? 2 * mag : norm < 7 ? 5 * mag : 10 * mag;
  const start = Math.ceil(min / step) * step;
  const out = [];
  for (let v = start; v <= max + 1e-9; v += step) out.push(v);
  return out;
}

function fmtTimeTick(ms, range) {
  const d = new Date(ms);
  const useDate = range > 24 * 3600 * 1000;
  return useDate
    ? d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "America/New_York" })
    : d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "America/New_York" });
}

function fmtTooltipDate(iso) {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
    hour12: true, timeZone: "America/New_York",
  });
}
