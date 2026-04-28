// ═══════════════════════════════════════════════════
// Splash Screen — CogniVault Labs × EdgeFinder MLB
// ═══════════════════════════════════════════════════
import { useState, useEffect } from "react";
import { SplashBrand } from "./CogniVaultLogo.jsx";
import { BRAND, C } from '../utils/constants.js';

export default function SplashScreen({ onComplete }) {
  const [phase, setPhase] = useState("enter");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("hold"), 100);
    const t2 = setTimeout(() => setPhase("exit"), 1300);
    const t3 = setTimeout(() => { setPhase("done"); onComplete?.(); }, 1700);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onComplete]);

  if (phase === "done") return null;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 99999,
      background: `radial-gradient(ellipse at center, #0F1620 0%, ${C.bg} 70%)`,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      opacity: phase === "exit" ? 0 : 1,
      transition: "opacity 0.4s ease-out",
    }}>
      <div style={{
        position: "absolute", width: "320px", height: "320px", borderRadius: "50%",
        background: `radial-gradient(circle, ${BRAND.teal}14 0%, transparent 70%)`,
        top: "50%", left: "50%", transform: "translate(-50%, -60%)",
        filter: "blur(40px)", pointerEvents: "none",
      }} />

      <div style={{
        opacity: phase === "enter" ? 0 : 1,
        transform: phase === "enter" ? "scale(0.94) translateY(8px)" : "scale(1) translateY(0)",
        transition: "all 0.6s cubic-bezier(0.22, 1, 0.36, 1)",
      }}>
        <SplashBrand size={92} />
      </div>

      <div style={{
        marginTop: 36,
        opacity: phase === "enter" ? 0 : 0.6,
        transition: "opacity 0.4s ease 0.5s",
      }}>
        <div style={{
          width: 22, height: 22,
          border: `2px solid ${BRAND.teal}30`,
          borderTopColor: BRAND.teal,
          borderRadius: "50%",
          animation: "cvSpin 0.8s linear infinite",
        }} />
      </div>

      <style>{`@keyframes cvSpin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
