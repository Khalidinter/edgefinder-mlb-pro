// ═══════════════════════════════════════════════════
// Tab bar — 5 tabs (Live / Trajectory / Performance / Validation / Resolved)
// ═══════════════════════════════════════════════════
import { C, BRAND } from '../utils/constants.js';

export const TABS = [
  { id: "live",        label: "Live Board",  icon: "🎯" },
  { id: "trajectory",  label: "Trajectory",  icon: "📈" },
  { id: "performance", label: "Performance", icon: "📊" },
  { id: "validation",  label: "Validation",  icon: "✅" },
  { id: "resolved",    label: "Resolved",    icon: "📜" },
];

export default function TabBar({ active, onChange }) {
  return (
    <div style={{
      display: "flex",
      borderBottom: `1px solid ${C.border}`,
      background: C.bg,
      paddingLeft: 8, paddingRight: 8,
      overflowX: "auto",
    }}>
      {TABS.map(t => {
        const isActive = active === t.id;
        return (
          <button key={t.id} onClick={() => onChange(t.id)}
                  style={{
                    background: "none",
                    border: "none",
                    borderBottom: isActive ? `2px solid ${BRAND.teal}` : "2px solid transparent",
                    color: isActive ? C.text : C.muted,
                    padding: "12px 18px",
                    fontWeight: isActive ? 700 : 500,
                    fontSize: 14,
                    fontFamily: "inherit",
                    transition: "all 0.15s",
                    whiteSpace: "nowrap",
                    display: "flex", alignItems: "center", gap: 6,
                  }}>
            <span style={{ fontSize: 14 }}>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}
