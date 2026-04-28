// ═══════════════════════════════════════════════════
// EdgeFinder MLB — top-level shell
// Splash → AuthGate → Dashboard (TopBar + TabBar + ActiveTab)
// ═══════════════════════════════════════════════════
import { useState, useEffect, useMemo, useCallback } from "react";
import SplashScreen from './components/SplashScreen.jsx';
import AuthGate from './components/AuthGate.jsx';
import TopBar from './components/TopBar.jsx';
import TabBar, { TABS } from './components/TabBar.jsx';
import SettingsDrawer from './components/SettingsDrawer.jsx';
import Placeholder from './components/tabs/Placeholder.jsx';
import { C, POLL, DEFAULT_WORKER_URL } from './utils/constants.js';
import { usePolling } from './hooks/usePolling.js';
import { fetchStatus, fetchValidation } from './api/worker.js';

const LS = {
  load(k, def) {
    try { const v = localStorage.getItem("efmlb_" + k); return v ? JSON.parse(v) : def; }
    catch { return def; }
  },
  save(k, v) {
    try { localStorage.setItem("efmlb_" + k, JSON.stringify(v)); } catch {}
  },
};

export default function App() {
  const [splashDone, setSplashDone] = useState(false);
  const [settings, setSettings] = useState(() =>
    LS.load("settings", { workerUrl: DEFAULT_WORKER_URL, token: "" })
  );
  const [activeTab, setActiveTab] = useState(() => LS.load("activeTab", "live"));
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [authError, setAuthError] = useState("");

  // Persist
  useEffect(() => { LS.save("settings", settings); }, [settings]);
  useEffect(() => { LS.save("activeTab", activeTab); }, [activeTab]);

  const isAuthed = !!(settings.workerUrl && settings.token);

  // Status polling (top bar pills)
  const statusPoll = usePolling(
    useCallback(async () => {
      if (!isAuthed) return null;
      return fetchStatus(settings.workerUrl, settings.token);
    }, [isAuthed, settings.workerUrl, settings.token]),
    POLL.status,
    [settings.workerUrl, settings.token]
  );

  // Validation polling (5 min)
  const validationPoll = usePolling(
    useCallback(async () => {
      if (!isAuthed) return null;
      try {
        return await fetchValidation(settings.workerUrl, settings.token);
      } catch (e) {
        // /validate returns 422 when failing — but our client throws on non-2xx
        if (String(e.message).includes("422")) {
          // Re-fetch with raw fetch to get the body
          const res = await fetch(`${settings.workerUrl}/validate`, {
            headers: { "Authorization": `Bearer ${settings.token}` }
          });
          if (res.ok || res.status === 422) return res.json();
        }
        throw e;
      }
    }, [isAuthed, settings.workerUrl, settings.token]),
    POLL.validate,
    [settings.workerUrl, settings.token]
  );

  // Auth submit handler — try a /status call; if 401, show error
  async function handleAuthSubmit({ workerUrl, token }) {
    setAuthError("");
    try {
      await fetchStatus(workerUrl, token);
      setSettings({ workerUrl, token });
    } catch (e) {
      if (String(e.message) === "UNAUTHORIZED") {
        setAuthError("Token rejected by worker. Check the AUTH_TOKEN secret matches.");
      } else {
        setAuthError("Connection failed: " + e.message);
      }
    }
  }

  // ── Splash ──
  if (!splashDone) {
    return <SplashScreen onComplete={() => setSplashDone(true)} />;
  }

  // ── Auth gate ──
  if (!isAuthed) {
    return <AuthGate onSubmit={handleAuthSubmit} errorMsg={authError} />;
  }

  // ── Dashboard ──
  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text }}>
      <TopBar
        status={statusPoll.data}
        validation={validationPoll.data}
        onOpenSettings={() => setSettingsOpen(true)}
        onRefresh={() => { statusPoll.refresh(); validationPoll.refresh(); }}
        lastFetch={statusPoll.lastFetch}
      />

      <TabBar active={activeTab} onChange={setActiveTab} />

      {/* Validation banner */}
      {validationPoll.data?.pass === false && (
        <div style={{
          background: `${C.bad}15`, borderBottom: `1px solid ${C.bad}40`,
          color: C.bad, padding: "10px 18px",
          fontSize: 13, fontWeight: 600,
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <span>⚠ Validation failed — alerts suspended.</span>
          <button onClick={() => setActiveTab("validation")}
                  style={{
                    background: "none", border: `1px solid ${C.bad}80`,
                    color: C.bad, padding: "3px 8px", borderRadius: 4, fontSize: 11,
                  }}>
            View checks →
          </button>
        </div>
      )}

      <main style={{ maxWidth: 1280, margin: "0 auto", padding: 18 }}>
        {activeTab === "live"        && <Placeholder title="Live Board"       milestone="Milestone 2" />}
        {activeTab === "trajectory"  && <Placeholder title="Price Trajectory" milestone="Milestone 3" />}
        {activeTab === "performance" && <Placeholder title="Performance"      milestone="Milestone 4" />}
        {activeTab === "validation"  && <Placeholder title="Validation"       milestone="Milestone 5" />}
        {activeTab === "resolved"    && <Placeholder title="Resolved Bets"    milestone="Milestone 5" />}
      </main>

      <SettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)}
                      settings={settings} onSave={setSettings} />

      <footer style={{
        textAlign: "center", padding: "30px 16px", fontSize: 11, color: C.muted,
        borderTop: `1px solid ${C.borderSoft}`, marginTop: 40, letterSpacing: "1px",
      }}>
        EDGEFINDER MLB · BY COGNIVAULTLABS · v0.1
      </footer>
    </div>
  );
}
