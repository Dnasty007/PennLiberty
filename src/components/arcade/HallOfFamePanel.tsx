import { useEffect, useState } from "react";
import { ARCADE_CATALOG } from "@/lib/arcade/catalog";
import {
  type Champion,
  type ScoreEntry,
  fetchChampions,
  fetchTopScores,
  isHallOfFameEnabled,
} from "@/lib/arcade/hallOfFame";

type HallOfFamePanelProps = {
  /** When set, show detail top-10 for this game */
  focusGameId?: string | null;
  onCloseDetail?: () => void;
};

/**
 * Global leaderboard panel — champions strip + optional per-game top 10.
 */
export function HallOfFamePanel({
  focusGameId = null,
  onCloseDetail,
}: HallOfFamePanelProps) {
  const enabled = isHallOfFameEnabled();
  const [champs, setChamps] = useState<Champion[]>([]);
  const [detail, setDetail] = useState<ScoreEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailGame, setDetailGame] = useState<string | null>(focusGameId);

  useEffect(() => {
    setDetailGame(focusGameId);
  }, [focusGameId]);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void (async () => {
      const list = await fetchChampions();
      if (!cancelled) {
        setChamps(list);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !detailGame) {
      setDetail([]);
      return;
    }
    let cancelled = false;
    void (async () => {
      const top = await fetchTopScores(detailGame, 10);
      if (!cancelled) setDetail(top);
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled, detailGame]);

  if (!enabled) {
    return (
      <div className="rounded-xl border border-dashed border-[#d6b06a]/30 bg-black/30 px-4 py-3">
        <p className="font-mono text-[10px] tracking-[0.3em] text-[#d6b06a]">
          HALL OF FAME
        </p>
        <p className="mt-1 font-mono text-[11px] leading-relaxed text-white/50">
          Global scores ready to go live — connect Supabase (2 min) and the
          whole city can challenge each other. Local HI-SCOREs already save on
          every machine.
        </p>
      </div>
    );
  }

  const detailMeta = ARCADE_CATALOG.find((g) => g.id === detailGame);

  return (
    <div className="rounded-xl border border-[#d6b06a]/25 bg-black/40 px-3 py-3 sm:px-4">
      <div className="flex items-baseline justify-between gap-2">
        <div>
          <p className="font-mono text-[10px] tracking-[0.35em] text-[#d6b06a]">
            ★ HALL OF FAME
          </p>
          <p className="mt-0.5 font-mono text-[10px] text-white/40">
            PENN LIBERTY · GLOBAL · LIVE
          </p>
        </div>
        {loading && (
          <span className="font-mono text-[10px] text-[#33ff66]/60 animate-pulse">
            LOADING…
          </span>
        )}
      </div>

      {detailGame && detailMeta ? (
        <div className="mt-3">
          <div className="mb-2 flex items-center justify-between">
            <p
              className="font-mono text-xs font-bold tracking-wider"
              style={{ color: detailMeta.accent }}
            >
              {detailMeta.title} · TOP 10
            </p>
            <button
              type="button"
              onClick={() => {
                setDetailGame(null);
                onCloseDetail?.();
              }}
              className="font-mono text-[10px] tracking-widest text-white/50 hover:text-white"
            >
              ← ALL
            </button>
          </div>
          {detail.length === 0 ? (
            <p className="font-mono text-[11px] text-white/45">
              No scores yet — be the first legend.
            </p>
          ) : (
            <ol className="space-y-1 font-mono text-[11px]">
              {detail.map((e, i) => (
                <li
                  key={e.id ?? `${e.initials}-${e.score}-${i}`}
                  className="flex items-center justify-between rounded-md bg-white/[0.03] px-2 py-1.5"
                >
                  <span className="text-white/50">
                    <span className="inline-block w-5 text-[#d6b06a]">
                      {i + 1}.
                    </span>
                    <span
                      className="ml-1 font-bold tracking-[0.2em]"
                      style={{ color: detailMeta.accent }}
                    >
                      {e.initials}
                    </span>
                  </span>
                  <span className="tabular-nums text-[#e8ffe8]">
                    {e.score.toLocaleString()}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
      ) : (
        <div className="mt-3 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {ARCADE_CATALOG.map((g) => {
            const champ = champs.find((c) => c.gameId === g.id);
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => setDetailGame(g.id)}
                className="flex items-center justify-between gap-2 rounded-lg border border-white/5 bg-black/30 px-2.5 py-2 text-left transition hover:border-[#33ff66]/30 hover:bg-black/50"
              >
                <div className="min-w-0">
                  <p
                    className="truncate font-mono text-[10px] font-bold tracking-wider"
                    style={{ color: g.accent }}
                  >
                    {g.title}
                  </p>
                  <p className="mt-0.5 font-mono text-[9px] text-white/40">
                    {g.year}
                  </p>
                </div>
                <div className="shrink-0 text-right font-mono">
                  {champ ? (
                    <>
                      <p
                        className="text-[11px] font-bold tracking-[0.15em]"
                        style={{ color: g.accent }}
                      >
                        {champ.initials}
                      </p>
                      <p className="text-[10px] tabular-nums text-white/60">
                        {champ.score.toLocaleString()}
                      </p>
                    </>
                  ) : (
                    <p className="text-[10px] text-white/30">— OPEN —</p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
