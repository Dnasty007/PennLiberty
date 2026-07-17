import { useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw, Volume2, VolumeX, X } from "lucide-react";
import { ScoreSubmitBar } from "@/components/arcade/ScoreSubmitBar";
import { CAPTURED_CODES, KEYS } from "@/lib/rentalsTetris/constants";
import type { GameController, HudInfo } from "@/lib/rentalsTetris/createGame";
import type { Phase } from "@/lib/rentalsTetris/types";

type RentalsHeroTetrisGameProps = {
  heroRef: React.RefObject<HTMLDivElement | null>;
  onExit: () => void;
};

type Overlay = { phase: Phase; score: number; highScore: number };

type Action =
  | "left"
  | "right"
  | "soft"
  | "hard"
  | "rotCW"
  | "rotCCW"
  | "pause";

const codeAction = (code: string): Action | null => {
  if ((KEYS.left as readonly string[]).includes(code)) return "left";
  if ((KEYS.right as readonly string[]).includes(code)) return "right";
  if ((KEYS.soft as readonly string[]).includes(code)) return "soft";
  if ((KEYS.hard as readonly string[]).includes(code)) return "hard";
  if ((KEYS.rotCW as readonly string[]).includes(code)) return "rotCW";
  if ((KEYS.rotCCW as readonly string[]).includes(code)) return "rotCCW";
  if ((KEYS.pause as readonly string[]).includes(code)) return "pause";
  return null;
};

export function RentalsHeroTetrisGame({
  heroRef,
  onExit,
}: RentalsHeroTetrisGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const controllerRef = useRef<GameController | null>(null);
  const [overlay, setOverlay] = useState<Overlay>({
    phase: "ready",
    score: 0,
    highScore: 0,
  });
  const [loading, setLoading] = useState(true);
  const [muted, setMuted] = useState(false);

  const onExitRef = useRef(onExit);
  onExitRef.current = onExit;

  useEffect(() => {
    const hero = heroRef.current;
    const canvas = canvasRef.current;
    if (!hero || !canvas) return;

    let cancelled = false;
    let controller: GameController | null = null;

    const onHud = (_hud: HudInfo) => {
      /* canvas draws full HUD */
    };

    import("@/lib/rentalsTetris/createGame")
      .then((mod) => {
        if (cancelled) return;
        controller = mod.createGame({
          canvas,
          onPhaseChange: (phase, info) =>
            setOverlay({
              phase,
              score: info.score,
              highScore: info.highScore,
            }),
          onHud,
        });
        controllerRef.current = controller;
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load Tetris:", err);
        if (!cancelled) onExitRef.current();
      });

    const unlock = () => void controllerRef.current?.unlockAudio();

    const onKeyDown = (e: KeyboardEvent) => {
      unlock();
      if (e.code === "Escape") {
        e.preventDefault();
        onExitRef.current();
        return;
      }
      const action = codeAction(e.code);
      if (!action) return;
      if (CAPTURED_CODES.has(e.code)) e.preventDefault();
      if (action === "pause") {
        if (!e.repeat) controllerRef.current?.setKey("pause", true);
      } else {
        controllerRef.current?.setKey(action, true);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      const action = codeAction(e.code);
      if (!action || action === "pause") return;
      if (CAPTURED_CODES.has(e.code)) e.preventDefault();
      controllerRef.current?.setKey(action, false);
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    return () => {
      cancelled = true;
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      controller?.dispose();
      controllerRef.current = null;
    };
  }, [heroRef]);

  const paused = overlay.phase === "paused";
  const over = overlay.phase === "over";

  return (
    <div
      className="absolute inset-0 z-[30] overflow-hidden rounded-[26px]"
      role="application"
      aria-label="Classic Tetris mini game"
      onPointerDown={() => void controllerRef.current?.unlockAudio()}
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

      <div className="absolute right-3 top-3 z-[35] flex items-center gap-2">
        <button
          type="button"
          onClick={() => setMuted(controllerRef.current?.toggleMute() ?? false)}
          aria-label={muted ? "Unmute" : "Mute"}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#5ec8ff]/30 bg-black/60 text-[#5ec8ff] backdrop-blur-md transition-colors hover:bg-black/80"
        >
          {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>
        <button
          type="button"
          onClick={() => controllerRef.current?.togglePause()}
          aria-label={paused ? "Resume" : "Pause"}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#5ec8ff]/30 bg-black/60 text-[#5ec8ff] backdrop-blur-md transition-colors hover:bg-black/80"
        >
          {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
        </button>
        <button
          type="button"
          onClick={onExit}
          aria-label="Back to arcade menu"
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#5ec8ff]/30 bg-black/60 text-[#5ec8ff] backdrop-blur-md transition-colors hover:bg-black/80"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {loading && (
        <div className="absolute inset-0 z-[34] flex items-center justify-center bg-black/50">
          <p className="animate-pulse font-mono text-sm tracking-[0.3em] text-[#5ec8ff]">
            LOADING TETRIS…
          </p>
        </div>
      )}

      {paused && (
        <div className="absolute inset-0 z-[34] flex flex-col items-center justify-center gap-4 bg-black/50 backdrop-blur-sm">
          <p className="font-mono text-lg font-semibold tracking-[0.3em] text-[#5ec8ff]">
            PAUSED
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => controllerRef.current?.togglePause()}
              className="inline-flex items-center gap-2 rounded-full bg-[#5ec8ff] px-5 py-2.5 text-sm font-semibold text-[#051018] hover:bg-[#7dd3fc]"
            >
              <Play className="h-4 w-4" /> Resume
            </button>
            <button
              type="button"
              onClick={onExit}
              className="inline-flex items-center gap-2 rounded-full border border-white/25 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
            >
              Menu
            </button>
          </div>
        </div>
      )}

      {over && (
        <div className="absolute inset-0 z-[34] flex flex-col items-center justify-center gap-3 bg-black/60 backdrop-blur-sm">
          <p className="font-mono text-3xl font-black tracking-[0.22em] text-[#ff6688]">
            GAME OVER
          </p>
          <p className="font-mono text-sm text-[#e8ffe8]/90">
            SCORE{" "}
            <span className="font-semibold text-[#5ec8ff]">
              {String(overlay.score).padStart(6, "0")}
            </span>
            {overlay.score >= overlay.highScore && overlay.score > 0 ? (
              <span className="ml-2 text-[#d6b06a]">★ NEW HI-SCORE</span>
            ) : (
              <span className="ml-2 text-white/55">
                HI {String(overlay.highScore).padStart(6, "0")}
              </span>
            )}
          </p>
          <ScoreSubmitBar
            gameId="tetris"
            score={overlay.score}
            accent="#5ec8ff"
          />
          <div className="mt-2 flex gap-3">
            <button
              type="button"
              onClick={() => controllerRef.current?.restart()}
              className="inline-flex items-center gap-2 rounded-full bg-[#5ec8ff] px-5 py-2.5 text-sm font-semibold text-[#051018] hover:bg-[#7dd3fc]"
            >
              <RotateCcw className="h-4 w-4" /> Play again
            </button>
            <button
              type="button"
              onClick={onExit}
              className="inline-flex items-center gap-2 rounded-full border border-white/25 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
            >
              Menu
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
