import { useEffect, useMemo, useState } from "react";
import { Trophy, X } from "lucide-react";
import { HallOfFamePanel } from "@/components/arcade/HallOfFamePanel";
import {
  catalogByEra,
  type ArcadeGameId,
  type ArcadeGameMeta,
} from "@/lib/arcade/catalog";
import { isHallOfFameEnabled } from "@/lib/arcade/hallOfFame";

type RentalsArcadeHubProps = {
  onPlay: (game: ArcadeGameId) => void;
  onQuit: () => void;
};

type HubTab = "games" | "fame";

/** CRT timeline hub — games sorted by year + global Hall of Fame. */
export function RentalsArcadeHub({ onPlay, onQuit }: RentalsArcadeHubProps) {
  const eras = useMemo(() => catalogByEra(), []);
  const [tab, setTab] = useState<HubTab>("games");
  const hofLive = isHallOfFameEnabled();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Escape") {
        e.preventDefault();
        onQuit();
        return;
      }
      if (e.code === "KeyH" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        // H = Hall of Fame (when not typing)
        e.preventDefault();
        setTab((t) => (t === "fame" ? "games" : "fame"));
        return;
      }
      if (tab !== "games") return;
      const digit = e.code.match(/^(?:Digit|Numpad)(\d)$/)?.[1];
      if (digit !== undefined) {
        const game = eras
          .flatMap((er) => er.games)
          .find((g) => g.hotkey === digit);
        if (game) {
          e.preventDefault();
          onPlay(game.id);
        }
        return;
      }
      const letter = e.code.match(/^Key([A-Z])$/)?.[1];
      if (letter && letter !== "H") {
        const game = eras
          .flatMap((er) => er.games)
          .find((g) => g.hotkey.toUpperCase() === letter);
        if (game) {
          e.preventDefault();
          onPlay(game.id);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onPlay, onQuit, eras, tab]);

  const total = eras.reduce((n, e) => n + e.games.length, 0);

  return (
    <div
      className="absolute inset-0 z-[30] overflow-hidden rounded-[26px]"
      role="dialog"
      aria-label="Classic arcade game select — chronological"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(6,28,18,0.85)_0%,rgba(0,4,3,0.94)_70%)]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, #000 2px, #000 3px)",
        }}
      />
      <div className="pointer-events-none absolute inset-0 rounded-[26px] shadow-[inset_0_0_80px_rgba(214,176,106,0.08)]" />

      <button
        type="button"
        onClick={onQuit}
        aria-label="Close arcade"
        className="absolute right-3 top-3 z-[35] inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#33ff66]/30 bg-black/60 text-[#33ff66] backdrop-blur-md transition-colors hover:bg-black/80"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="relative z-[32] flex h-full flex-col">
        <header className="shrink-0 border-b border-[#33ff66]/10 px-5 pb-3 pt-5 sm:px-7">
          <div className="flex flex-wrap items-end justify-between gap-2 pr-10">
            <div>
              <p className="font-mono text-[10px] tracking-[0.5em] text-[#33ff66]/65">
                PENN LIBERTY ARCADE
              </p>
              <h2 className="mt-1 font-mono text-xl font-black tracking-[0.14em] text-[#33ff66] drop-shadow-[0_0_16px_rgba(51,255,102,0.4)] sm:text-2xl">
                TIME CABINET
              </h2>
            </div>
            <div className="text-right font-mono text-[10px] leading-relaxed tracking-widest text-[#e8ffe8]/45">
              <div>CHRONOLOGICAL · 1959→2014</div>
              <div>
                {total} CLASSICS · ESC QUIT
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setTab("games")}
              className={`rounded-full border px-3 py-1 font-mono text-[10px] font-bold tracking-[0.2em] transition ${
                tab === "games"
                  ? "border-[#33ff66]/50 bg-[#33ff66]/15 text-[#33ff66]"
                  : "border-white/10 text-white/45 hover:border-white/25 hover:text-white/70"
              }`}
            >
              GAMES
            </button>
            <button
              type="button"
              onClick={() => setTab("fame")}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[10px] font-bold tracking-[0.2em] transition ${
                tab === "fame"
                  ? "border-[#d6b06a]/60 bg-[#d6b06a]/15 text-[#d6b06a]"
                  : "border-white/10 text-white/45 hover:border-white/25 hover:text-white/70"
              }`}
            >
              <Trophy className="h-3 w-3" />
              HALL OF FAME
              {hofLive ? (
                <span className="ml-0.5 rounded bg-[#33ff66]/20 px-1 text-[8px] text-[#33ff66]">
                  LIVE
                </span>
              ) : (
                <span className="ml-0.5 rounded bg-white/10 px-1 text-[8px] text-white/40">
                  SETUP
                </span>
              )}
            </button>
            {tab === "games" &&
              eras.map(({ era }) => (
                <span
                  key={era}
                  className="hidden rounded-full border border-[#33ff66]/15 bg-[#33ff66]/5 px-2 py-0.5 font-mono text-[9px] tracking-[0.2em] text-[#33ff66]/70 sm:inline"
                >
                  {era}
                </span>
              ))}
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
          {tab === "fame" ? (
            <div className="mx-auto max-w-4xl">
              <HallOfFamePanel />
              <p className="mt-4 text-center font-mono text-[10px] tracking-widest text-white/35">
                BEAT A SCORE · SUBMIT INITIALS · YOUR NAME ON THE CABINET
              </p>
            </div>
          ) : (
            <div className="mx-auto max-w-4xl space-y-6">
              {eras.map(({ era, games }, eraIdx) => (
                <section key={era} className="relative">
                  <div className="mb-2.5 flex items-center gap-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#d6b06a]/40 bg-black/50 font-mono text-[10px] font-bold text-[#d6b06a]">
                      {String(eraIdx + 1).padStart(2, "0")}
                    </div>
                    <div className="h-px flex-1 bg-gradient-to-r from-[#d6b06a]/50 to-transparent" />
                    <h3 className="shrink-0 font-mono text-xs font-bold tracking-[0.35em] text-[#d6b06a]">
                      {era}
                    </h3>
                    <div className="h-px flex-1 bg-gradient-to-l from-[#d6b06a]/50 to-transparent" />
                  </div>

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {games.map((g) => (
                      <GameTile key={g.id} game={g} onPlay={onPlay} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>

        <footer className="shrink-0 border-t border-white/5 px-5 py-2.5 text-center font-mono text-[9px] tracking-[0.25em] text-white/30">
          H · HALL OF FAME · HOTKEYS ON TILES · DESKTOP ONLY
        </footer>
      </div>
    </div>
  );
}

function GameTile({
  game,
  onPlay,
}: {
  game: ArcadeGameMeta;
  onPlay: (id: ArcadeGameId) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onPlay(game.id)}
      className="group relative flex items-stretch overflow-hidden rounded-xl border border-white/[0.08] bg-black/40 text-left backdrop-blur-md transition-all hover:-translate-y-0.5 hover:border-[#33ff66]/35 hover:bg-black/55 hover:shadow-[0_8px_28px_rgba(51,255,102,0.12)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#33ff66]/55"
    >
      <div
        className="flex w-14 shrink-0 flex-col items-center justify-center border-r border-white/5 px-1 py-3"
        style={{ background: `${game.accent}12` }}
      >
        <span
          className="font-mono text-lg font-black leading-none tracking-tight"
          style={{ color: game.accent }}
        >
          {String(game.year).slice(2)}
        </span>
        <span className="mt-1 font-mono text-[8px] tracking-widest text-white/40">
          {game.year}
        </span>
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-center px-3 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <span
            className="truncate font-mono text-[12px] font-bold tracking-[0.1em]"
            style={{ color: game.accent }}
          >
            {game.title}
          </span>
          <span className="shrink-0 rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[9px] font-bold tracking-wider text-white/50">
            {game.hotkey}
          </span>
        </div>
        <p className="mt-1 line-clamp-2 font-mono text-[10px] leading-snug text-white/50">
          {game.blurb}
        </p>
        <span
          className="mt-1.5 font-mono text-[9px] font-semibold tracking-[0.22em] opacity-50 transition-opacity group-hover:opacity-100"
          style={{ color: game.accent }}
        >
          INSERT COIN →
        </span>
      </div>
    </button>
  );
}
