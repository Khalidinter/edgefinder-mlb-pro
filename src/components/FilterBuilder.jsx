// ═══════════════════════════════════════════════════
// FilterBuilder — checkbox-driven filter panel for Performance/Analytics
// Saved presets persisted in localStorage
// ═══════════════════════════════════════════════════
import { useState, useMemo } from "react";
import { C, BRAND, BOOKS_DISPLAY, STAT_LABELS } from '../utils/constants.js';
import { Pill } from './Shared.jsx';

// Default empty filter state
export const EMPTY_FILTER = {
  stats: [],         // ["total_bases", "hits", ...]
  sides: [],         // ["Over", "Under"]
  lines: [],         // [0.5, 1.5, ...]
  anchors: [],       // ["pinnacle", ...]
  books: [],         // ["draftkings", ...]
  timings: [],       // ["wire","dead","morning"]
  evMin: null,       // null = no min
  evMax: null,
  resolvedOnly: false,
  fromDate: null,    // YYYY-MM-DD
  toDate: null,
};

// Built-in presets
export const PRESETS = {
  "all":      { label: "All",            filter: EMPTY_FILTER },
  "v3_conf":  {
    label: "v3 CONFIRMED",
    filter: {
      ...EMPTY_FILTER, stats: ["total_bases"], sides: ["Under"], lines: [1.5],
      anchors: ["pinnacle","betmgm"], books: ["draftkings","fanatics"],
      evMin: 4, evMax: 7, resolvedOnly: true,
    },
  },
  "v3_watch": {
    label: "v3 WATCH",
    filter: {
      ...EMPTY_FILTER, stats: ["strikeouts","hits"], sides: ["Under"],
      evMin: 4, evMax: 7, resolvedOnly: true,
    },
  },
  "sweet": {
    label: "Sweet spot 4-5%",
    filter: { ...EMPTY_FILTER, evMin: 4, evMax: 5, resolvedOnly: true },
  },
  "today": {
    label: "Resolved today",
    filter: { ...EMPTY_FILTER, resolvedOnly: true,
      fromDate: new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" }) },
  },
};

// Apply filter to edges array (pure function)
export function applyFilter(edges, f) {
  if (!edges) return [];
  return edges.filter(e => {
    if (f.resolvedOnly && e.resolved !== 1) return false;
    if (f.stats.length > 0 && !f.stats.includes(e.stat)) return false;
    if (f.sides.length > 0 && !f.sides.includes(e.side)) return false;
    if (f.lines.length > 0 && !f.lines.includes(Number(e.line))) return false;
    if (f.anchors.length > 0 && !f.anchors.includes(e.anchor_book)) return false;
    if (f.books.length > 0 && !f.books.includes(e.book)) return false;
    if (f.timings.length > 0 && !f.timings.includes(e.timing)) return false;
    if (f.evMin != null && (e.ev == null || e.ev < f.evMin)) return false;
    if (f.evMax != null && (e.ev == null || e.ev > f.evMax)) return false;
    if (f.fromDate && e.game_date < f.fromDate) return false;
    if (f.toDate   && e.game_date > f.toDate)   return false;
    return true;
  });
}

export default function FilterBuilder({ filter, onChange, edges }) {
  const [open, setOpen] = useState(false);

  // Compute available options from the edges dataset
  const opts = useMemo(() => {
    const stats = new Set(), sides = new Set(), lines = new Set(),
          anchors = new Set(), books = new Set(), timings = new Set();
    for (const e of (edges || [])) {
      if (e.stat) stats.add(e.stat);
      if (e.side) sides.add(e.side);
      if (e.line != null) lines.add(Number(e.line));
      if (e.anchor_book) anchors.add(e.anchor_book);
      if (e.book) books.add(e.book);
      if (e.timing) timings.add(e.timing);
    }
    return {
      stats: Array.from(stats).sort(),
      sides: Array.from(sides).sort(),
      lines: Array.from(lines).sort((a, b) => a - b),
      anchors: Array.from(anchors).sort(),
      books: Array.from(books).sort(),
      timings: Array.from(timings).sort(),
    };
  }, [edges]);

  // Active filter summary count
  const activeCount =
    filter.stats.length + filter.sides.length + filter.lines.length +
    filter.anchors.length + filter.books.length + filter.timings.length +
    (filter.evMin != null ? 1 : 0) + (filter.evMax != null ? 1 : 0) +
    (filter.fromDate ? 1 : 0) + (filter.toDate ? 1 : 0) +
    (filter.resolvedOnly ? 1 : 0);

  function toggleArr(field, value) {
    const arr = filter[field];
    const next = arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value];
    onChange({ ...filter, [field]: next });
  }

  function setField(field, value) {
    onChange({ ...filter, [field]: value });
  }

  function applyPreset(key) {
    const p = PRESETS[key];
    if (p) onChange(p.filter);
  }

  function clear() {
    onChange(EMPTY_FILTER);
  }

  return (
    <div style={{
      background: C.card, border: `1px solid ${C.border}`, borderRadius: 10,
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 16px",
        borderBottom: open ? `1px solid ${C.border}` : "none",
        gap: 12, flexWrap: "wrap",
      }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <button onClick={() => setOpen(!open)}
                  style={{
                    background: "transparent", border: "none",
                    color: BRAND.teal, fontSize: 12, fontWeight: 700,
                    letterSpacing: "1px", textTransform: "uppercase",
                    cursor: "pointer", fontFamily: "inherit",
                    padding: 0,
                  }}>
            {open ? "▼" : "▶"} Filters
          </button>
          {activeCount > 0 && (
            <Pill color={BRAND.teal} size="sm">{activeCount} active</Pill>
          )}
          {/* Preset buttons */}
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
            {Object.entries(PRESETS).map(([k, p]) => (
              <button key={k} onClick={() => applyPreset(k)}
                      style={presetBtnStyle}>
                {p.label}
              </button>
            ))}
          </div>
        </div>
        {activeCount > 0 && (
          <button onClick={clear} style={clearBtnStyle}>
            Clear all
          </button>
        )}
      </div>

      {/* Body — only render when open */}
      {open && (
        <div style={{ padding: 16, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
          <Group title="Stat">
            {opts.stats.map(s => (
              <Chip key={s} active={filter.stats.includes(s)} onClick={() => toggleArr("stats", s)}>
                {STAT_LABELS[s] || s}
              </Chip>
            ))}
          </Group>

          <Group title="Side">
            {opts.sides.map(s => (
              <Chip key={s} active={filter.sides.includes(s)} onClick={() => toggleArr("sides", s)}>
                {s}
              </Chip>
            ))}
          </Group>

          <Group title="Line">
            {opts.lines.map(L => (
              <Chip key={L} active={filter.lines.includes(L)} onClick={() => toggleArr("lines", L)}>
                {L}
              </Chip>
            ))}
          </Group>

          <Group title="Anchor book">
            {opts.anchors.map(a => (
              <Chip key={a} active={filter.anchors.includes(a)} onClick={() => toggleArr("anchors", a)}>
                {BOOKS_DISPLAY[a] || a}
              </Chip>
            ))}
          </Group>

          <Group title="Target book">
            {opts.books.map(b => (
              <Chip key={b} active={filter.books.includes(b)} onClick={() => toggleArr("books", b)}>
                {BOOKS_DISPLAY[b] || b}
              </Chip>
            ))}
          </Group>

          <Group title="Timing">
            {opts.timings.map(t => (
              <Chip key={t} active={filter.timings.includes(t)} onClick={() => toggleArr("timings", t)}>
                {t}
              </Chip>
            ))}
          </Group>

          <Group title="EV range %">
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <NumInput value={filter.evMin} onChange={v => setField("evMin", v)} placeholder="min" />
              <span style={{ color: C.muted, fontSize: 11 }}>to</span>
              <NumInput value={filter.evMax} onChange={v => setField("evMax", v)} placeholder="max" />
            </div>
          </Group>

          <Group title="Date range">
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <DateInput value={filter.fromDate} onChange={v => setField("fromDate", v)} />
              <span style={{ color: C.muted, fontSize: 11 }}>to</span>
              <DateInput value={filter.toDate} onChange={v => setField("toDate", v)} />
            </div>
          </Group>

          <Group title="Status">
            <Chip active={filter.resolvedOnly} onClick={() => setField("resolvedOnly", !filter.resolvedOnly)}>
              Resolved only
            </Chip>
          </Group>
        </div>
      )}
    </div>
  );
}

function Group({ title, children }) {
  return (
    <div>
      <div style={{
        fontSize: 10, color: C.muted, letterSpacing: "1.5px",
        textTransform: "uppercase", fontWeight: 700, marginBottom: 8,
      }}>{title}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
        {children}
      </div>
    </div>
  );
}

function Chip({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      padding: "5px 10px",
      borderRadius: 6,
      border: `1px solid ${active ? BRAND.teal : C.border}`,
      background: active ? `${BRAND.teal}15` : "transparent",
      color: active ? BRAND.teal : C.text,
      fontSize: 11, fontWeight: active ? 600 : 500,
      cursor: "pointer", fontFamily: "inherit",
      letterSpacing: "0.2px",
    }}>
      {children}
    </button>
  );
}

function NumInput({ value, onChange, placeholder }) {
  return (
    <input type="number" step="0.1"
           value={value ?? ""}
           onChange={e => onChange(e.target.value === "" ? null : Number(e.target.value))}
           placeholder={placeholder}
           style={{
             width: 70, padding: "4px 7px", fontSize: 12,
             background: C.bg, border: `1px solid ${C.border}`,
             color: C.text, borderRadius: 5,
             fontFamily: "'JetBrains Mono', monospace",
           }} />
  );
}

function DateInput({ value, onChange }) {
  return (
    <input type="date"
           value={value || ""}
           onChange={e => onChange(e.target.value || null)}
           style={{
             padding: "4px 7px", fontSize: 11,
             background: C.bg, border: `1px solid ${C.border}`,
             color: C.text, borderRadius: 5,
             fontFamily: "'JetBrains Mono', monospace",
           }} />
  );
}

const presetBtnStyle = {
  padding: "4px 9px", fontSize: 11, fontWeight: 500,
  background: "transparent", border: `1px solid ${C.borderSoft}`,
  color: C.muted, borderRadius: 5,
  cursor: "pointer", fontFamily: "inherit",
};

const clearBtnStyle = {
  padding: "4px 10px", fontSize: 11,
  background: "transparent", border: `1px solid ${C.bad}40`,
  color: C.bad, borderRadius: 5,
  cursor: "pointer", fontFamily: "inherit",
};
