// ═══════════════════════════════════════════════════
// EdgeFinder MLB — top-level shell + data plumbing
// ═══════════════════════════════════════════════════
import { useState, useEffect, useMemo, useCallback } from "react";
import SplashScreen from './components/SplashScreen.jsx';
import AuthGate from './components/AuthGate.jsx';
import TopBar from './components/TopBar.jsx';
import TabBar from './components/TabBar.jsx';
import SettingsDrawer from './components/SettingsDrawer.jsx';
import LiveBoardTab from './components/tabs/LiveBoardTab.jsx';
import TrajectoryTab from './components/tabs/TrajectoryTab.jsx';
import PerformanceTab from './components/tabs/PerformanceTab.jsx';
import ValidationTab from './components/tabs/ValidationTab.jsx';
import ResolvedTab from './components/tabs/ResolvedTab.jsx';
import { C, POLL, DEFAULT_WORKER_URL } from './utils/constants.js';
import { usePolling } from './hooks/usePolling.js';
import { useEdgesPoll } from './hooks/useEdgesPoll.js';
import {
  fetchStatus, fetchValidation, fetchSchedule,
  fetchTrackedBets, trackBet,
} from './api/worker.js';

const LS = {
  load(k, def) {
    try { const v = localStorage.getItem("efmlb_" + k); return v ? JSON.parse(v) : def; }
    catch { return def; }
  },
  save(k, v) {
    try { localStorage.setItem("efmlb_" + k, JSON.stringify(v)); } catch {}
  },
};

// Today's date in ET, ISO format (YYYY-MM-DD)
function todayET() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
}

export default function App() {
  const [splashDone, setSplashDone] = useState(false);
  const [settings, setSettings] = useState(() =>
    LS.load("settings", { workerUrl: DEFAULT_WORKER_URL, token: "" })
  );
  const [activeTab, setActiveTab] = useState(() => LS.load("activeTab", "live"));
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [authError, setAuthError] = useState("");
  const [todayDate, setTodayDate] = useState(() => todayET());
  const [trajectoryEdge, setTrajectoryEdge] = useState(null); // edge handed to Trajectory tab

  // Persist
  useEffect(() => { LS.save("settings", settings); }, [settings]);
  useEffect(() => { LS.save("activeTab", activeTab); }, [activeTab]);

  // Refresh today's date every 5 min (catches midnight rollover)
  useEffect(() => {
    const id = setInterval(() => setTodayDate(todayET()), 5 * 60_000);
    return () => clearInterval(id);
  }, []);

  // Keyboard shortcuts: 1-5 → tab, ? → settings, esc → close drawer
  useEffect(() => {
    function onKey(e) {
      // Ignore when typing in inputs
      const tag = e.target.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const tabKeys = ["1","2","3","4","5"];
      const tabs   = ["live","trajectory","performance","validation","resolved"];
      const idx = tabKeys.indexOf(e.key);
      if (idx >= 0) { setActiveTab(tabs[idx]); e.preventDefault(); return; }
      if (e.key === "?" || e.key === "/") { setSettingsOpen(true); e.preventDefault(); return; }
      if (e.key === "Escape") setSettingsOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const isAuthed = !!(settings.workerUrl && settings.token);

  // ── /status polling (top-bar + sig for edges) ──
  const statusPoll = usePolling(
    useCallback(async () => {
      if (!isAuthed) return null;
      return fetchStatus(settings.workerUrl, settings.token);
    }, [isAuthed, settings.workerUrl, settings.token]),
    POLL.status,
    [settings.workerUrl, settings.token]
  );

  // ── /validate polling ──
  const validationPoll = usePolling(
    useCallback(async () => {
      if (!isAuthed) return null;
      try {
        return await fetchValidation(settings.workerUrl, settings.token);
      } catch (e) {
        if (String(e.message).includes("422")) {
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

  // ── /export edges — gated by /status sig ──
  const edgesData = useEdgesPoll({
    workerUrl: isAuthed ? settings.workerUrl : null,
    token: isAuthed ? settings.token : null,
    status: statusPoll.data,
    maxIdleMs: POLL.edges,
  });

  // ── /schedule polling ──
  const schedulePoll = usePolling(
    useCallback(async () => {
      if (!isAuthed) return null;
      return fetchSchedule(settings.workerUrl, settings.token, todayDate);
    }, [isAuthed, settings.workerUrl, settings.token, todayDate]),
    POLL.schedule,
    [settings.workerUrl, settings.token, todayDate]
  );

  // ── tracked bets (server-side persistence) ──
  const trackedPoll = usePolling(
    useCallback(async () => {
      if (!isAuthed) return null;
      return fetchTrackedBets(settings.workerUrl, settings.token);
    }, [isAuthed, settings.workerUrl, settings.token]),
    60_000,
    [settings.workerUrl, settings.token]
  );

  // Build a Set of tracked edge_ids for fast lookup in cards
  const trackedIds = useMemo(() => {
    const set = new Set();
    (trackedPoll.data?.bets || []).forEach(b => { if (b.edge_id) set.add(b.edge_id); });
    return set;
  }, [trackedPoll.data]);

  // ── Auth submit ──
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

  // ── Track-bet handler ──
  async function handleTrackBet(edge, tier) {
    try {
      await trackBet(settings.workerUrl, settings.token, {
        edge_id: edge.id,
        game_date: edge.game_date,
        player: edge.player,
        stat: edge.stat,
        side: edge.side,
        line: Number(edge.line),
        book: edge.book,
        price: Number(edge.price),
        ev: edge.ev,
        tier: tier || null,
        game: edge.game,
      });
      trackedPoll.refresh();
    } catch (e) {
      console.error("track-bet failed:", e);
      alert("Failed to track bet: " + e.message);
    }
  }

  // ── Trajectory handler ──
  function handleOpenTrajectory(edge) {
    setTrajectoryEdge(edge);
    setActiveTab("trajectory");
  }

  // ── Splash + auth gate ──
  if (!splashDone) return <SplashScreen onComplete={() => setSplashDone(true)} />;
  if (!isAuthed)   return <AuthGate onSubmit={handleAuthSubmit} errorMsg={authError} />;

  // ── Dashboard ──
  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text }}>
      <TopBar
        status={statusPoll.data}
        validation={validationPoll.data}
        onOpenSettings={() => setSettingsOpen(true)}
        onRefresh={() => {
          statusPoll.refresh();
          validationPoll.refresh();
          edgesData.refresh();
          schedulePoll.refresh();
        }}
        lastFetch={statusPoll.lastFetch}
      />

      <TabBar active={activeTab} onChange={setActiveTab} />

      {validationPoll.data?.pass === false && (
        <div style={{
          background: `${C.bad}15`, borderBottom: `1px solid ${C.bad}40`,
          color: C.bad, padding: "10px 18px",
          fontSize: 13, fontWeight: 600,
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <span>⚠ Validation failed — alerts suspended. CONFIRMED tags are downgraded to WATCH.</span>
          <button onClick={() => setActiveTab("validation")}
                  style={{
                    background: "none", border: `1px solid ${C.bad}80`,
                    color: C.bad, padding: "3px 8px", borderRadius: 4, fontSize: 11,
                    cursor: "pointer", fontFamily: "inherit",
                  }}>
            View checks →
          </button>
        </div>
      )}

      <main style={{ maxWidth: 1280, margin: "0 auto", padding: 18 }}>
        {activeTab === "live" && (
          <LiveBoardTab
            edges={edgesData.edges}
            edgesLoading={edgesData.loading}
            schedule={schedulePoll.data}
            scheduleLoading={schedulePoll.loading}
            validation={validationPoll.data}
            trackedIds={trackedIds}
            onTrackBet={handleTrackBet}
            onOpenTrajectory={handleOpenTrajectory}
            todayDate={todayDate}
          />
        )}
        {activeTab === "trajectory" && (
          <TrajectoryTab
            edges={edgesData.edges}
            edgesLoading={edgesData.loading}
            todayDate={todayDate}
            workerUrl={settings.workerUrl}
            token={settings.token}
            preselectedEdge={trajectoryEdge}
            onConsumePreselect={() => setTrajectoryEdge(null)}
          />
        )}
        {activeTab === "performance" && (
          <PerformanceTab
            edges={edgesData.edges}
            edgesLoading={edgesData.loading}
          />
        )}
        {activeTab === "validation" && (
          <ValidationTab
            validation={validationPoll.data}
            loading={validationPoll.loading}
            onRefresh={validationPoll.refresh}
          />
        )}
        {activeTab === "resolved" && (
          <ResolvedTab
            edges={edgesData.edges}
            edgesLoading={edgesData.loading}
            trackedBets={trackedPoll.data}
          />
        )}
      </main>

      <SettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)}
                      settings={settings} onSave={setSettings} />

      <footer style={{
        textAlign: "center", padding: "30px 16px", fontSize: 11, color: C.muted,
        borderTop: `1px solid ${C.borderSoft}`, marginTop: 40, letterSpacing: "1px",
      }}>
        EDGEFINDER MLB · BY COGNIVAULTLABS · v0.8
      </footer>
    </div>
  );
}
