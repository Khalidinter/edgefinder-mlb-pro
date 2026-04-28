// ═══════════════════════════════════════════════════
// GameBox — sidebar listing today's MLB games
// Click a game to filter the Live Board to its edges
// Games with 0 edges shown dimmed
// ═══════════════════════════════════════════════════
import { C, BRAND } from '../utils/constants.js';
import { Pill, SectionHeading, EmptyState, Spinner } from './Shared.jsx';
import { fmtUnits } from '../utils/format.js';

export default function GameBox({ schedule, loading, selectedGame, onSelectGame }) {
  const games = schedule?.games || [];
  const total = games.length;

  return (
    <aside style={{
      position: "sticky",
      top: 16,
      maxHeight: "calc(100vh - 130px)",
      overflowY: "auto",
      // padding-right so scrollbar doesn't crowd the cards
      paddingRight: 2,
    }}>
      <SectionHeading
        count={total}
        action={selectedGame ? (
          <button onClick={() => onSelectGame(null)}
                  style={{
                    background: "transparent", border: `1px solid ${C.border}`,
                    color: C.muted, fontSize: 10, padding: "2px 8px",
                    borderRadius: 4, cursor: "pointer", fontFamily: "inherit",
                    letterSpacing: "0.5px",
                  }}>
            CLEAR FILTER
          </button>
        ) : null}
      >
        Today's Slate
      </SectionHeading>

      {loading && total === 0 ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 30 }}>
          <Spinner />
        </div>
      ) : total === 0 ? (
        <EmptyState icon="◇" title="No games yet" subtitle="Schedule loads once the worker finds games." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {games.map(g => (
            <GameCard key={g.game}
                      game={g}
                      isSelected={selectedGame === g.game}
                      onClick={() => onSelectGame(selectedGame === g.game ? null : g.game)} />
          ))}
        </div>
      )}
    </aside>
  );
}

function GameCard({ game, isSelected, onClick }) {
  const teams = (game.game || "").split(" @ ");
  const away = teams[0] || game.game;
  const home = teams[1] || "";
  const active = game.active_edges || 0;
  const resolved = (game.wins || 0) + (game.losses || 0) + (game.pushes || 0);
  const isComplete = resolved > 0 && active === 0;
  const profit = game.profit || 0;

  // Color: gold border if active edges, dim if complete or no edges
  const accent = active > 0
    ? BRAND.teal
    : isComplete
      ? (profit >= 0 ? C.good : C.bad)
      : C.dim;

  const hasNoEdges = active === 0 && resolved === 0;

  return (
    <div onClick={onClick}
         style={{
           background: isSelected ? `${BRAND.teal}10` : C.card,
           border: `1px solid ${isSelected ? BRAND.teal : C.border}`,
           borderLeft: `3px solid ${accent}`,
           borderRadius: 8,
           padding: "10px 12px",
           cursor: "pointer",
           transition: "all 0.15s",
           opacity: hasNoEdges ? 0.5 : 1,
         }}
         onMouseEnter={e => !isSelected && (e.currentTarget.style.background = C.cardHover)}
         onMouseLeave={e => !isSelected && (e.currentTarget.style.background = C.card)}
    >
      <div style={{ fontSize: 12, color: C.text, fontWeight: 600, lineHeight: 1.4 }}>
        {away}
      </div>
      <div style={{ fontSize: 11, color: C.muted, marginBottom: 6 }}>
        @ {home}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6 }}>
        {active > 0 ? (
          <Pill color={BRAND.teal} size="sm">
            {active} active
          </Pill>
        ) : isComplete ? (
          <Pill color={profit >= 0 ? C.good : C.bad} size="sm">
            {game.wins}-{game.losses} · {fmtUnits(profit)}
          </Pill>
        ) : (
          <span style={{ fontSize: 10, color: C.dim, letterSpacing: "0.5px" }}>NO EDGES</span>
        )}
      </div>
    </div>
  );
}
