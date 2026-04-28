// ═══════════════════════════════════════════════════
// useEdgesPoll — smart fetcher for /export
// Strategy:
//   - When /status edge count or run timestamp changes → fetch /export
//   - Otherwise re-fetch at most every `maxIdleMs` (default 5 min)
//   - Page Visibility pauses both
// ═══════════════════════════════════════════════════
import { useState, useEffect, useRef, useCallback } from "react";
import { fetchEdgesCSV, parseEdgesCSV } from '../api/worker.js';

export function useEdgesPoll({ workerUrl, token, status, maxIdleMs = 300_000 }) {
  const [edges, setEdges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);

  const lastSig = useRef(null);
  const lastFetchTs = useRef(0);
  const inFlight = useRef(false);
  const visibleRef = useRef(typeof document !== "undefined" ? !document.hidden : true);

  // Build a signature from /status that changes when there's new data to pull
  const sig = (() => {
    if (!status) return null;
    const t = status.totals || {};
    const tod = status.today || {};
    const lastRun = status.last_run || (status.recent_runs?.[0]?.ts) || "";
    return `${t.edges || 0}|${t.resolved || 0}|${tod.edges || 0}|${lastRun}`;
  })();

  const doFetch = useCallback(async (force = false) => {
    if (!workerUrl || !token) return;
    if (!visibleRef.current) return;
    if (inFlight.current) return;

    const now = Date.now();
    const idleElapsed = now - lastFetchTs.current;
    const sigChanged = sig && sig !== lastSig.current;
    if (!force && !sigChanged && idleElapsed < maxIdleMs) return;

    inFlight.current = true;
    setLoading(true);
    try {
      const csv = await fetchEdgesCSV(workerUrl, token, { all: 1 });
      const rows = parseEdgesCSV(csv);
      setEdges(rows);
      setError(null);
      lastFetchTs.current = now;
      lastSig.current = sig;
      setLastFetch(new Date().toISOString());
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
      inFlight.current = false;
    }
  }, [workerUrl, token, sig, maxIdleMs]);

  // First fetch + react to signature changes
  useEffect(() => { doFetch(false); }, [doFetch]);

  // Idle interval to honor maxIdleMs even when /status sig hasn't changed
  useEffect(() => {
    if (!workerUrl || !token) return;
    const id = setInterval(() => doFetch(false), Math.min(maxIdleMs, 60_000));
    return () => clearInterval(id);
  }, [workerUrl, token, maxIdleMs, doFetch]);

  // Visibility
  useEffect(() => {
    const onVis = () => {
      visibleRef.current = !document.hidden;
      if (visibleRef.current) doFetch(false);
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [doFetch]);

  return { edges, loading, error, lastFetch, refresh: () => doFetch(true) };
}
