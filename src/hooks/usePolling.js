// ═══════════════════════════════════════════════════
// usePolling — periodic fetcher with Page Visibility pause
// ═══════════════════════════════════════════════════
import { useState, useEffect, useRef, useCallback } from "react";

export function usePolling(fetcher, intervalMs, deps = []) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastFetch, setLastFetch] = useState(null);

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const inFlight = useRef(false);
  const visibleRef = useRef(typeof document !== "undefined" ? !document.hidden : true);

  const run = useCallback(async () => {
    if (inFlight.current) return;
    if (!visibleRef.current) return;
    inFlight.current = true;
    setLoading(true);
    try {
      const out = await fetcherRef.current();
      setData(out);
      setError(null);
      setLastFetch(new Date().toISOString());
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
      inFlight.current = false;
    }
  }, []);

  // Initial + interval
  useEffect(() => {
    run();
    if (!intervalMs || intervalMs <= 0) return;
    const id = setInterval(run, intervalMs);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intervalMs, ...deps]);

  // Page Visibility — pause when hidden, refresh on resume
  useEffect(() => {
    const onVis = () => {
      visibleRef.current = !document.hidden;
      if (visibleRef.current) run();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [run]);

  return { data, error, loading, lastFetch, refresh: run };
}
