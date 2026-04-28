// ═══════════════════════════════════════════════════
// Settings drawer — auth token + worker URL
// ═══════════════════════════════════════════════════
import { useState } from "react";
import { C, BRAND, DEFAULT_WORKER_URL } from '../utils/constants.js';

export default function SettingsDrawer({ open, onClose, settings, onSave }) {
  const [workerUrl, setWorkerUrl] = useState(settings.workerUrl || DEFAULT_WORKER_URL);
  const [token, setToken] = useState(settings.token || "");

  if (!open) return null;

  function save() {
    onSave({ workerUrl: workerUrl.trim().replace(/\/$/, ""), token: token.trim() });
    onClose();
  }

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "rgba(0,0,0,0.5)",
      display: "flex", alignItems: "flex-start", justifyContent: "flex-end",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: "min(420px, 100%)", height: "100%",
        background: C.card, borderLeft: `1px solid ${C.border}`,
        padding: 24, overflowY: "auto",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>Settings</h2>
          <button onClick={onClose} style={{
            background: "none", border: "none", color: C.muted, fontSize: 22, lineHeight: 1,
          }}>×</button>
        </div>

        <Section title="Worker connection">
          <Field label="Worker URL">
            <input value={workerUrl} onChange={e => setWorkerUrl(e.target.value)}
                   placeholder={DEFAULT_WORKER_URL}
                   style={inputStyle} />
          </Field>
          <Field label="Auth token">
            <input type="password" value={token} onChange={e => setToken(e.target.value)}
                   placeholder="Bearer token (paste once)"
                   style={inputStyle} />
            <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>
              Stored only in this browser's localStorage. Never sent anywhere except your worker.
            </div>
          </Field>
        </Section>

        <Section title="Keyboard shortcuts">
          <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.9 }}>
            <ShortcutRow keys={["1"]} label="Live Board" />
            <ShortcutRow keys={["2"]} label="Trajectory" />
            <ShortcutRow keys={["3"]} label="Performance" />
            <ShortcutRow keys={["4"]} label="Validation" />
            <ShortcutRow keys={["5"]} label="Resolved" />
            <ShortcutRow keys={["?", "/"]} label="Open settings" />
            <ShortcutRow keys={["Esc"]} label="Close drawer" />
          </div>
        </Section>

        <Section title="About">
          <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.6 }}>
            <strong style={{ color: C.text }}>EdgeFinder MLB</strong> · v0.6<br />
            by <span style={{ color: BRAND.teal }}>CogniVault Labs</span><br /><br />
            All data flows directly from your <code style={codeStyle}>edgefinder-mlb</code> Cloudflare Worker.
            No third-party tracking, no analytics.
          </p>
        </Section>

        <button onClick={save} style={primaryBtn}>Save</button>
      </div>
    </div>
  );
}

function ShortcutRow({ keys, label }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span>{label}</span>
      <span style={{ display: "inline-flex", gap: 3 }}>
        {keys.map((k, i) => (
          <kbd key={i} style={{
            padding: "1px 7px", borderRadius: 4,
            background: C.bg, border: `1px solid ${C.border}`,
            color: C.text, fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11, fontWeight: 600,
          }}>{k}</kbd>
        ))}
      </span>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h3 style={{
        fontSize: 11, fontWeight: 700, letterSpacing: 1.3,
        color: BRAND.teal, textTransform: "uppercase", marginBottom: 10
      }}>{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 12, color: C.muted, marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: "100%", padding: "9px 12px",
  background: C.bg, border: `1px solid ${C.border}`,
  color: C.text, borderRadius: 6, fontSize: 13,
  fontFamily: "'JetBrains Mono', monospace",
};

const codeStyle = {
  fontFamily: "'JetBrains Mono', monospace",
  background: C.bg, padding: "1px 4px", borderRadius: 3, fontSize: 11,
};

const primaryBtn = {
  width: "100%", padding: "11px",
  background: BRAND.teal, color: "#000",
  border: "none", borderRadius: 6,
  fontWeight: 700, fontSize: 14,
};
