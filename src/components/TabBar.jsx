// ═══════════════════════════════════════════════════
// Tab bar — text-only tabs (no icons)
// ═══════════════════════════════════════════════════
import { C, BRAND } from '../utils/constants.js';

export const TABS = [
  { id: "live",        label: "Live Board"  },
  { id: "trajectory",  label: "Trajectory"  },
  { id: "performance", label: "Performance" },
  { id: "validation",  label: "Validation"  },
  { id: "resolved",    label: "Resolved"    },
];

export default function TabBar({ active, onChange }) {
  return (
    <div style={{
      display: "flex",
      borderBottom: `1px solid ${C.border}`,
      background: C.bg,
      paddingLeft: 16, paddingRight: 16,
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
                    padding: "14px 20px",
                    fontWeight: isActive ? 600 : 500,
                    fontSize: 14,
                    fontFamily: "inherit",
                    letterSpacing: "0.2px",
                    transition: "color 0.15s, border-color 0.15s",
                    whiteSpace: "nowrap",
                    cursor: "pointer",
                  }}>
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
