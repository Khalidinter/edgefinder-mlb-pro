// ═══════════════════════════════════════════════════
// AuthGate — first-launch screen for token entry
// ═══════════════════════════════════════════════════
import { useState } from "react";
import { SplashBrand } from "./CogniVaultLogo.jsx";
import { BRAND, C, DEFAULT_WORKER_URL } from '../utils/constants.js';

export default function AuthGate({ onSubmit, errorMsg }) {
  const [workerUrl, setWorkerUrl] = useState(DEFAULT_WORKER_URL);
  const [token, setToken] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handle() {
    setSubmitting(true);
    try {
      await onSubmit({ workerUrl: workerUrl.trim().replace(/\/$/, ""), token: token.trim() });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", padding: 24,
      background: `radial-gradient(ellipse at center, #0F1620 0%, ${C.bg} 70%)`,
    }}>
      <div style={{ marginBottom: 36 }}>
        <SplashBrand size={80} />
      </div>
      <div style={{ fontSize: 11, color: C.muted, letterSpacing: 2.5, marginBottom: 28 }}>
        CONNECT WORKER
      </div>

      <div style={{
        width: "min(440px, 100%)",
        background: C.card, border: `1px solid ${C.border}`,
        borderRadius: 10, padding: 20,
      }}>
        <label style={{ display: "block", fontSize: 11, color: C.muted, marginBottom: 6, letterSpacing: 1 }}>
          WORKER URL
        </label>
        <input value={workerUrl} onChange={e => setWorkerUrl(e.target.value)}
               style={inputStyle} />

        <label style={{ display: "block", fontSize: 11, color: C.muted, marginBottom: 6, marginTop: 14, letterSpacing: 1 }}>
          AUTH TOKEN
        </label>
        <input type="password" value={token} onChange={e => setToken(e.target.value)}
               placeholder="Bearer token from your worker"
               style={inputStyle}
               onKeyDown={e => e.key === "Enter" && token && handle()} />

        {errorMsg && (
          <div style={{ marginTop: 12, padding: 10, background: `${C.bad}15`, border: `1px solid ${C.bad}40`, borderRadius: 6, color: C.bad, fontSize: 12 }}>
            {errorMsg}
          </div>
        )}

        <button onClick={handle} disabled={!token || submitting}
                style={{
                  width: "100%", marginTop: 16, padding: "11px",
                  background: token ? BRAND.teal : C.border,
                  color: token ? "#000" : C.muted,
                  border: "none", borderRadius: 6,
                  fontWeight: 700, fontSize: 14,
                  cursor: token && !submitting ? "pointer" : "not-allowed",
                }}>
          {submitting ? "Connecting…" : "Connect"}
        </button>

        <div style={{ marginTop: 14, fontSize: 11, color: C.muted, lineHeight: 1.6 }}>
          The token authenticates against your private Cloudflare Worker. It's stored
          locally and never transmitted to anyone except your worker URL.
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%", padding: "10px 12px",
  background: C.bg, border: `1px solid ${C.border}`,
  color: C.text, borderRadius: 6, fontSize: 13,
  fontFamily: "'JetBrains Mono', monospace",
};
