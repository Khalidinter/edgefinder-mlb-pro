import { C, BRAND } from '../../utils/constants.js';

export default function Placeholder({ title, milestone }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      minHeight: 400, padding: 40, gap: 14, color: C.muted,
    }}>
      <div style={{
        fontSize: 12, letterSpacing: 2, color: BRAND.teal, fontWeight: 700, textTransform: "uppercase",
      }}>{milestone || "Coming up"}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: C.text }}>{title}</div>
      <div style={{ fontSize: 13, maxWidth: 420, textAlign: "center", lineHeight: 1.6 }}>
        This tab is part of the next build milestone. Skeleton complete; UI lights up when its milestone ships.
      </div>
    </div>
  );
}
