// ═══════════════════════════════════════════════════
// CogniVault Labs — EdgeFinder MLB brand logo
// Matches the EdgeFinder Assists pattern: boxed letter logo with brand text
// ═══════════════════════════════════════════════════
import { BRAND, C } from '../utils/constants.js';

// ── Boxed M logo (match Assists "A" box) ──
export function BoxLogo({ size = 44, letter = "M" }) {
  const r = size * 0.22;
  return (
    <div style={{
      width: size, height: size,
      borderRadius: r,
      background: `linear-gradient(135deg, ${BRAND.teal} 0%, #1f7a6e 100%)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0,
      boxShadow: `0 2px 12px ${BRAND.teal}30, inset 0 1px 0 ${BRAND.teal}80`,
    }}>
      <span style={{
        color: "#fff",
        fontSize: size * 0.55,
        fontWeight: 800,
        letterSpacing: "-1px",
        lineHeight: 1,
      }}>
        {letter}
      </span>
    </div>
  );
}

// ── Brand block: logo + stacked text (header style) ──
export function BrandBlock({ size = 44 }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <BoxLogo size={size} />
      <div style={{ lineHeight: 1.15 }}>
        <div style={{
          fontSize: size * 0.5, fontWeight: 700, letterSpacing: "-0.4px",
          color: C.text,
        }}>
          <span style={{ color: C.text }}>EdgeFinder</span>{" "}
          <span style={{ color: C.muted, fontWeight: 600 }}>MLB</span>
        </div>
        <div style={{
          fontSize: size * 0.21, fontWeight: 500,
          color: C.dim, letterSpacing: "1.5px", textTransform: "uppercase",
          marginTop: 2,
        }}>
          MLB Prop Edges <span style={{ color: C.muted }}>·</span>{" "}
          <span style={{ color: BRAND.teal }}>by CogniVaultLabs</span>
        </div>
      </div>
    </div>
  );
}

// ── Splash version: bigger box, centered, with full brand stack ──
export function SplashBrand({ size = 96 }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", gap: 18,
    }}>
      <BoxLogo size={size} />
      <div style={{ textAlign: "center" }}>
        <div style={{
          fontSize: size * 0.42, fontWeight: 700, letterSpacing: "-0.5px",
        }}>
          <span style={{ color: C.text }}>EdgeFinder</span>{" "}
          <span style={{ color: C.muted, fontWeight: 600 }}>MLB</span>
        </div>
        <div style={{
          fontSize: size * 0.16, fontWeight: 500,
          color: C.dim, letterSpacing: "2px", textTransform: "uppercase",
          marginTop: 6,
        }}>
          by <span style={{ color: BRAND.teal }}>CogniVaultLabs</span>
        </div>
      </div>
    </div>
  );
}

// Back-compat exports (some files import the old names)
export const CogniVaultLogo = SplashBrand;
export const HexIcon = BoxLogo;
export default BrandBlock;
