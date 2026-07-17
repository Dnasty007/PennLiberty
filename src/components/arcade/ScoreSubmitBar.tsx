import { useState } from "react";
import {
  isHallOfFameEnabled,
  loadSavedInitials,
  sanitizeInitials,
  submitScore,
} from "@/lib/arcade/hallOfFame";

type ScoreSubmitBarProps = {
  gameId: string;
  score: number;
  accent?: string;
};

/**
 * Classic arcade initials entry — posts to Penn Liberty global Hall of Fame.
 */
export function ScoreSubmitBar({
  gameId,
  score,
  accent = "#33ff66",
}: ScoreSubmitBarProps) {
  const enabled = isHallOfFameEnabled();
  const [initials, setInitials] = useState(loadSavedInitials);
  const [status, setStatus] = useState<
    "idle" | "sending" | "done" | "error"
  >("idle");
  const [message, setMessage] = useState("");

  if (!enabled || score <= 0) return null;

  const onSubmit = async () => {
    if (status === "sending" || status === "done") return;
    setStatus("sending");
    setMessage("");
    const result = await submitScore(gameId, score, initials);
    if (result.ok) {
      setStatus("done");
      setMessage(
        result.rank
          ? `POSTED · RANK #${result.rank} WORLDWIDE`
          : "POSTED TO HALL OF FAME",
      );
    } else {
      setStatus("error");
      setMessage(result.error);
    }
  };

  return (
    <div className="mt-3 w-full max-w-sm rounded-xl border border-white/15 bg-black/50 px-4 py-3 backdrop-blur-md">
      <p className="font-mono text-[10px] tracking-[0.28em] text-[#d6b06a]">
        PENN LIBERTY HALL OF FAME
      </p>
      <p className="mt-1 font-mono text-[11px] text-white/60">
        Challenge the city. 3 initials. Global board.
      </p>

      {status === "done" ? (
        <p
          className="mt-3 font-mono text-sm font-bold tracking-wider"
          style={{ color: accent }}
        >
          {message}
        </p>
      ) : (
        <div className="mt-3 flex items-center gap-2">
          <input
            type="text"
            maxLength={3}
            value={initials}
            onChange={(e) => setInitials(sanitizeInitials(e.target.value))}
            onKeyDown={(e) => {
              if (e.key === "Enter") void onSubmit();
            }}
            aria-label="Your initials"
            className="w-20 rounded-lg border border-white/20 bg-black/60 px-2 py-2 text-center font-mono text-lg font-black tracking-[0.3em] text-[#e8ffe8] outline-none focus:border-[#33ff66]/60"
            style={{ color: accent }}
          />
          <button
            type="button"
            disabled={status === "sending"}
            onClick={() => void onSubmit()}
            className="flex-1 rounded-lg px-3 py-2.5 font-mono text-xs font-bold tracking-[0.2em] text-[#05100a] transition hover:brightness-110 disabled:opacity-60"
            style={{ backgroundColor: accent }}
          >
            {status === "sending" ? "POSTING…" : "SUBMIT SCORE"}
          </button>
        </div>
      )}

      {status === "error" && (
        <p className="mt-2 font-mono text-[11px] text-[#ff6688]">{message}</p>
      )}
    </div>
  );
}
