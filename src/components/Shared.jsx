// ═══════════════════════════════════════════════════
// Shared primitives
// ═══════════════════════════════════════════════════
import { C } from '../utils/constants.js';

export function Pill({ children, color, dim = false, size = "md" }) {
  const padding = size === "sm" ? "3px 8px" : "5px 11px";
  const fontSize = size === "sm" ? 11 : 12;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding, borderRadius: 999,
      background: `${color}15`, border: `1px solid ${color}40`,
      color: dim ? C.muted : color,
      fontSize, fontWeight: 600,
      fontFamily: "'JetBrains Mono', monospace",
      whiteSpace: "nowrap",
      letterSpacing: "0.3px",
    }}>
      {children}
    </span>
  );
}

export function Card({ children, style = {}, hover = false, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: C.card,
      border: `1px solid ${C.border}`,
      borderRadius: 10,
      padding: 16,
      transition: "all 0.15s",
      cursor: onClick ? "pointer" : "default",
      ...style,
    }}
    onMouseEnter={hover && onClick ? e => e.currentTarget.style.background = C.cardHover : undefined}
    onMouseLeave={hover && onClick ? e => e.currentTarget.style.background = C.card : undefined}
    >
      {children}
    </div>
  );
}

export function SectionHeading({ children, count, action }) {
  return (
    <div style={{
      display: "flex", alignItems: "baseline", justifyContent: "space-between",
      marginBottom: 10, paddingTop: 4,
    }}>
      <div style={{
        fontSize: 11, fontWeight: 700, color: C.muted,
        letterSpacing: "1.5px", textTransform: "uppercase",
      }}>
        {children}{count != null && <span style={{ marginLeft: 8, color: C.dim }}>· {count}</span>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ icon = "—", title, subtitle }) {
  return (
    <div style={{
      padding: "48px 24px", textAlign: "center", color: C.muted,
    }}>
      <div style={{ fontSize: 36, color: C.dim, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontSize: 15, fontWeight: 600, color: C.text, marginBottom: 6 }}>{title}</div>
      {subtitle && <div style={{ fontSize: 12, color: C.muted }}>{subtitle}</div>}
    </div>
  );
}

export function Spinner({ size = 20 }) {
  return (
    <div style={{
      width: size, height: size,
      border: `2px solid ${C.border}`,
      borderTopColor: C.text,
      borderRadius: "50%",
      animation: "efmlbSpin 0.8s linear infinite",
      display: "inline-block",
    }}>
      <style>{`@keyframes efmlbSpin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
