// ═══════════════════════════════════════════════════
// Cloudflare Worker API client
// All endpoints typed; auth header attached automatically.
// ═══════════════════════════════════════════════════

function authHeaders(token) {
  return { "Authorization": `Bearer ${token}`, "Accept": "application/json" };
}

async function getJSON(workerUrl, token, path) {
  const url = workerUrl.replace(/\/$/, "") + path;
  const res = await fetch(url, { headers: authHeaders(token) });
  if (res.status === 401) throw new Error("UNAUTHORIZED");
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json();
  return res.text();
}

async function postJSON(workerUrl, token, path, body) {
  const url = workerUrl.replace(/\/$/, "") + path;
  const res = await fetch(url, {
    method: "POST",
    headers: { ...authHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (res.status === 401) throw new Error("UNAUTHORIZED");
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  return res.json();
}

async function deleteReq(workerUrl, token, path) {
  const url = workerUrl.replace(/\/$/, "") + path;
  const res = await fetch(url, { method: "DELETE", headers: authHeaders(token) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ── Status: top-bar pills (today's count, profit, run age) ──
export async function fetchStatus(workerUrl, token) {
  return getJSON(workerUrl, token, "/status");
}

// ── Edges: full export (CSV-as-text) ──
export async function fetchEdgesCSV(workerUrl, token, opts = {}) {
  const params = new URLSearchParams();
  if (opts.all) params.set("all", "1");
  if (opts.from) params.set("from", opts.from);
  if (opts.to)   params.set("to", opts.to);
  if (opts.stat) params.set("stat", opts.stat);
  if (opts.side) params.set("side", opts.side);
  return getJSON(workerUrl, token, `/export?${params}`);
}

// Parse CSV string → array of objects with typed numeric fields
export function parseEdgesCSV(csvText) {
  if (!csvText || typeof csvText !== "string") return [];
  const lines = csvText.split("\n").filter(l => l.length > 0);
  if (lines.length < 2) return [];
  const headers = parseCSVLine(lines[0]);
  const numericFields = new Set([
    "line","price","ev","tp","raw_tp","es","epi","actual_value","profit","clv",
    "innings_pitched","at_bats","in_lineup","resolved","seen_count","closing_sharp_prob"
  ]);
  return lines.slice(1).map(line => {
    const cells = parseCSVLine(line);
    const row = {};
    headers.forEach((h, i) => {
      const v = cells[i];
      if (v === "" || v == null) { row[h] = null; return; }
      if (numericFields.has(h)) {
        const n = Number(v);
        row[h] = isNaN(n) ? null : n;
      } else {
        row[h] = v;
      }
    });
    return row;
  });
}

function parseCSVLine(line) {
  const result = [];
  let cur = "", inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQ) {
      if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') inQ = false;
      else cur += c;
    } else {
      if (c === '"') inQ = true;
      else if (c === ",") { result.push(cur); cur = ""; }
      else cur += c;
    }
  }
  result.push(cur);
  return result;
}

// ── Validation ──
export async function fetchValidation(workerUrl, token) {
  return getJSON(workerUrl, token, "/validate");
}

// ── Daily report (summary text + structured data) ──
export async function fetchDailyReport(workerUrl, token) {
  return getJSON(workerUrl, token, "/daily-report");
}

// ── Schedule: today's games with edge counts ──
export async function fetchSchedule(workerUrl, token, date) {
  const params = date ? `?date=${date}` : "";
  return getJSON(workerUrl, token, `/schedule${params}`);
}

// ── Aggregate (server-computed breakdowns) ──
export async function fetchAggregate(workerUrl, token, opts = {}) {
  const p = new URLSearchParams();
  if (opts.from) p.set("from", opts.from);
  if (opts.to)   p.set("to", opts.to);
  return getJSON(workerUrl, token, `/aggregate?${p}`);
}

// ── Trajectory ──
export async function fetchTrajectory(workerUrl, token, q) {
  const params = new URLSearchParams(q);
  return getJSON(workerUrl, token, `/price-trajectory?${params}`);
}

// ── Tracked bets ──
export async function trackBet(workerUrl, token, bet) {
  return postJSON(workerUrl, token, "/track-bet", bet);
}
export async function fetchTrackedBets(workerUrl, token, opts = {}) {
  const p = new URLSearchParams();
  if (opts.from)   p.set("from", opts.from);
  if (opts.to)     p.set("to", opts.to);
  if (opts.status) p.set("status", opts.status);
  return getJSON(workerUrl, token, `/tracked-bets?${p}`);
}
export async function untrackBet(workerUrl, token, id) {
  return deleteReq(workerUrl, token, `/track-bet?id=${id}`);
}

// ── Push pass (manual trigger) ──
export async function triggerPushPass(workerUrl, token) {
  return getJSON(workerUrl, token, "/push-pass");
}

// ── Manual scan / resolve ──
export async function triggerScan(workerUrl, token) {
  return getJSON(workerUrl, token, "/run");
}
export async function triggerResolve(workerUrl, token) {
  return getJSON(workerUrl, token, "/resolve");
}
