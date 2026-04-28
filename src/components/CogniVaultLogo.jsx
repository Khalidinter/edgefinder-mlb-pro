// ═══════════════════════════════════════════════════
// CogniVault Labs — brand logo (shared with NBA app, with MLB tweaks)
// ═══════════════════════════════════════════════════
import { BRAND, C } from '../utils/constants.js';

export function HexIcon({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      {/* Outer hex */}
      <polygon points="50,5 93,27.5 93,72.5 50,95 7,72.5 7,27.5"
               stroke={BRAND.teal} strokeWidth="2.5" fill="none" opacity="0.9" />
      {/* Inner hex glow */}
      <polygon points="50,18 80,35 80,65 50,82 20,65 20,35"
               stroke={BRAND.teal} strokeWidth="1.2"
               fill={`${BRAND.teal}08`} opacity="0.5" />
      {/* Circuit traces */}
      <line x1="50" y1="5" x2="65" y2="16" stroke={BRAND.teal} strokeWidth="1" opacity="0.6" />
      <circle cx="65" cy="16" r="2.5" fill={BRAND.teal} opacity="0.8" />
      <line x1="93" y1="27.5" x2="80" y2="35" stroke={BRAND.teal} strokeWidth="1" opacity="0.6" />
      <circle cx="93" cy="27.5" r="2.5" fill={BRAND.teal} opacity="0.8" />
      <line x1="93" y1="50" x2="80" y2="50" stroke={BRAND.teal} strokeWidth="1" opacity="0.5" />
      <circle cx="93" cy="50" r="2" fill={BRAND.teal} opacity="0.6" />
      <line x1="93" y1="72.5" x2="80" y2="65" stroke={BRAND.teal} strokeWidth="1" opacity="0.6" />
      <circle cx="93" cy="72.5" r="2.5" fill={BRAND.teal} opacity="0.8" />
      <line x1="50" y1="95" x2="35" y2="84" stroke={BRAND.teal} strokeWidth="1" opacity="0.6" />
      <circle cx="35" cy="84" r="2.5" fill={BRAND.teal} opacity="0.8" />
      <line x1="7" y1="72.5" x2="20" y2="65" stroke={BRAND.teal} strokeWidth="1" opacity="0.6" />
      <circle cx="7" cy="72.5" r="2.5" fill={BRAND.teal} opacity="0.8" />
      <line x1="7" y1="50" x2="20" y2="50" stroke={BRAND.teal} strokeWidth="1" opacity="0.5" />
      <circle cx="7" cy="50" r="2" fill={BRAND.teal} opacity="0.6" />
      <line x1="7" y1="27.5" x2="20" y2="35" stroke={BRAND.teal} strokeWidth="1" opacity="0.6" />
      <circle cx="7" cy="27.5" r="2.5" fill={BRAND.teal} opacity="0.8" />
      {/* Inner nodes */}
      <circle cx="50" cy="18" r="2" fill={BRAND.teal} opacity="0.7" />
      <circle cx="80" cy="35" r="2" fill={BRAND.teal} opacity="0.7" />
      <circle cx="80" cy="65" r="2" fill={BRAND.teal} opacity="0.7" />
      <circle cx="50" cy="82" r="2" fill={BRAND.teal} opacity="0.7" />
      <circle cx="20" cy="65" r="2" fill={BRAND.teal} opacity="0.7" />
      <circle cx="20" cy="35" r="2" fill={BRAND.teal} opacity="0.7" />
      {/* Keyhole */}
      <circle cx="50" cy="44" r="8" fill={BRAND.green} opacity="0.9" />
      <rect x="46" y="48" width="8" height="14" rx="2" fill={BRAND.green} opacity="0.9" />
      <circle cx="50" cy="44" r="4" fill={C.bg} />
      <rect x="48" y="46" width="4" height="10" rx="1" fill={C.bg} />
      {/* MLB accent: subtle red stitch dots flanking the keyhole */}
      <circle cx="38" cy="50" r="1" fill={C.red} opacity="0.5" />
      <circle cx="62" cy="50" r="1" fill={C.red} opacity="0.5" />
    </svg>
  );
}

export function CogniVaultLogo({ size = 80, showSubtitle = true }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: size * 0.12 }}>
      <HexIcon size={size} />
      <div style={{ textAlign: "center" }}>
        <div style={{
          fontSize: size * 0.3, fontWeight: 800, letterSpacing: "-0.5px", lineHeight: 1.1
        }}>
          <span style={{ color: "#fff" }}>Cogni</span>
          <span style={{ color: BRAND.purple }}>V</span>
          <span style={{ color: "#fff" }}>ault</span>
        </div>
        {showSubtitle && (
          <div style={{
            fontSize: size * 0.16, fontWeight: 500,
            color: BRAND.muted, letterSpacing: "2px", marginTop: size * 0.02
          }}>
            Labs
          </div>
        )}
      </div>
    </div>
  );
}

export default CogniVaultLogo;
