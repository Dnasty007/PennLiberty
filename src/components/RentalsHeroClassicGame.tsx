import { useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw, Volume2, VolumeX, X } from "lucide-react";
import { ScoreSubmitBar } from "@/components/arcade/ScoreSubmitBar";
import {
  ARCADE_CATALOG,
  type ClassicShellId,
} from "@/lib/arcade/catalog";
import type { ClassicController, Phase } from "@/lib/arcade/shared";

type RentalsHeroClassicGameProps = {
  gameId: ClassicShellId;
  heroRef: React.RefObject<HTMLDivElement | null>;
  onExit: () => void;
};

type Overlay = { phase: Phase; score: number; highScore: number };

/** Shared shell for lazy-loaded childhood classics (not Invaders/Tetris). */
export function RentalsHeroClassicGame({
  gameId,
  heroRef,
  onExit,
}: RentalsHeroClassicGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const controllerRef = useRef<ClassicController | null>(null);
  const [overlay, setOverlay] = useState<Overlay>({
    phase: "ready",
    score: 0,
    highScore: 0,
  });
  const [loading, setLoading] = useState(true);
  const [muted, setMuted] = useState(false);
  const onExitRef = useRef(onExit);
  onExitRef.current = onExit;

  const meta = ARCADE_CATALOG.find((g) => g.id === gameId);
  const accent = meta?.accent ?? "#33ff66";
  const title = meta?.title ?? "ARCADE";

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !heroRef.current) return;

    let cancelled = false;
    let controller: ClassicController | null = null;

    import("@/lib/arcade/loadClassic")
      .then((mod) =>
        mod.loadClassicGame(gameId, {
          canvas,
          onPhaseChange: (phase, info) =>
            setOverlay({
              phase,
              score: info.score,
              highScore: info.highScore,
            }),
        }),
      )
      .then((c) => {
        if (cancelled) {
          c.dispose();
          return;
        }
        controller = c;
        controllerRef.current = c;
        setLoading(false);
      })
      .catch((err) => {
        console.error(`Failed to load ${gameId}:`, err);
        if (!cancelled) onExitRef.current();
      });

    const unlock = () => void controllerRef.current?.unlockAudio();

    const mapKey = (code: string): string | null => {
      if (code === "ArrowLeft" || code === "KeyA") return "left";
      if (code === "ArrowRight" || code === "KeyD") return "right";
      if (code === "ArrowUp" || code === "KeyW") return "up";
      if (code === "ArrowDown" || code === "KeyS") return "down";
      if (code === "Space") return "fire";
      if (code === "KeyP") return "pause";
      if (code === "KeyF") return "flag";
      return null;
    };

    const captured = new Set([
      "ArrowLeft",
      "ArrowRight",
      "ArrowUp",
      "ArrowDown",
      "KeyA",
      "KeyD",
      "KeyW",
      "KeyS",
      "Space",
      "KeyP",
      "KeyF",
    ]);

    const onKeyDown = (e: KeyboardEvent) => {
      unlock();
      if (e.code === "Escape") {
        e.preventDefault();
        onExitRef.current();
        return;
      }
      const action = mapKey(e.code);
      if (!action) return;
      if (captured.has(e.code)) e.preventDefault();
      if (action === "pause") {
        if (!e.repeat) controllerRef.current?.setKey("pause", true);
      } else {
        controllerRef.current?.setKey(action, true);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      const action = mapKey(e.code);
      if (!action || action === "pause") return;
      if (captured.has(e.code)) e.preventDefault();
      controllerRef.current?.setKey(action, false);
    };

    const cssPos = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const onPtrDown = (e: PointerEvent) => {
      unlock();
      if (e.target instanceof Element && e.target.closest("button")) return;
      const { x, y } = cssPos(e);
      // Right-click = flag for minesweeper
      if (e.button === 2) {
        controllerRef.current?.setKey("flag", true);
        controllerRef.current?.setKey("secondary", true);
        controllerRef.current?.pointer?.("down", x, y);
        controllerRef.current?.setKey("flag", false);
        controllerRef.current?.setKey("secondary", false);
        return;
      }
      controllerRef.current?.setKey("fire", true);
      controllerRef.current?.pointer?.("down", x, y);
    };
    const onPtrMove = (e: PointerEvent) => {
      const { x, y } = cssPos(e);
      controllerRef.current?.pointer?.("move", x, y);
    };
    const onPtrUp = (e: PointerEvent) => {
      const { x, y } = cssPos(e);
      controllerRef.current?.setKey("fire", false);
      controllerRef.current?.pointer?.("up", x, y);
    };
    const onContext = (e: Event) => e.preventDefault();

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    canvas.addEventListener("pointerdown", onPtrDown);
    canvas.addEventListener("pointermove", onPtrMove);
    canvas.addEventListener("pointerup", onPtrUp);
    canvas.addEventListener("pointerleave", onPtrUp);
    canvas.addEventListener("contextmenu", onContext);

    return () => {
      cancelled = true;
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      canvas.removeEventListener("pointerdown", onPtrDown);
      canvas.removeEventListener("pointermove", onPtrMove);
      canvas.removeEventListener("pointerup", onPtrUp);
      canvas.removeEventListener("pointerleave", onPtrUp);
      canvas.removeEventListener("contextmenu", onContext);
      controller?.dispose();
      controllerRef.current = null;
    };
  }, [gameId, heroRef]);

  const paused = overlay.phase === "paused";
  const over = overlay.phase === "over" || overlay.phase === "win";
  const won = overlay.phase === "win";

  return (
    <div
      className="absolute inset-0 z-[30] overflow-hidden rounded-[26px]"
      role="application"
      aria-label={`${title} mini game`}
      onPointerDown={() => void controllerRef.current?.unlockAudio()}
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

      <div className="absolute right-3 top-3 z-[35] flex items-center gap-2">
        <button
          type="button"
          onClick={() => setMuted(controllerRef.current?.toggleMute() ?? false)}
          aria-label={muted ? "Unmute" : "Mute"}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border bg-black/60 backdrop-blur-md transition-colors hover:bg-black/80"
          style={{ borderColor: `${accent}55`, color: accent }}
        >
          {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>
        <button
          type="button"
          onClick={() => controllerRef.current?.togglePause()}
          aria-label={paused ? "Resume" : "Pause"}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border bg-black/60 backdrop-blur-md transition-colors hover:bg-black/80"
          style={{ borderColor: `${accent}55`, color: accent }}
        >
          {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
        </button>
        <button
          type="button"
          onClick={onExit}
          aria-label="Back to arcade menu"
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border bg-black/60 backdrop-blur-md transition-colors hover:bg-black/80"
          style={{ borderColor: `${accent}55`, color: accent }}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {loading && (
        <div className="absolute inset-0 z-[34] flex items-center justify-center bg-black/50">
          <p
            className="animate-pulse font-mono text-sm tracking-[0.3em]"
            style={{ color: accent }}
          >
            LOADING {title}…
          </p>
        </div>
      )}

      {paused && (
        <div className="absolute inset-0 z-[34] flex flex-col items-center justify-center gap-4 bg-black/50 backdrop-blur-sm">
          <p
            className="font-mono text-lg font-semibold tracking-[0.3em]"
            style={{ color: accent }}
          >
            PAUSED
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => controllerRef.current?.togglePause()}
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-[#05100a]"
              style={{ backgroundColor: accent }}
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
          <p
            className="font-mono text-3xl font-black tracking-[0.2em]"
            style={{ color: won ? accent : "#ff6688" }}
          >
            {won ? "YOU WIN" : "GAME OVER"}
          </p>
          <p className="font-mono text-sm text-[#e8ffe8]/90">
            SCORE{" "}
            <span className="font-semibold" style={{ color: accent }}>
              {String(overlay.score).padStart(5, "0")}
            </span>
            {overlay.score >= overlay.highScore && overlay.score > 0 ? (
              <span className="ml-2 text-[#d6b06a]">★ HI</span>
            ) : (
              <span className="ml-2 text-white/55">
                HI {String(overlay.highScore).padStart(5, "0")}
              </span>
            )}
          </p>
          <ScoreSubmitBar
            gameId={gameId}
            score={overlay.score}
            accent={accent}
          />
          <div className="mt-2 flex gap-3">
            <button
              type="button"
              onClick={() => controllerRef.current?.restart()}
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-[#05100a]"
              style={{ backgroundColor: accent }}
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
