import { useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw, Volume2, VolumeX, X } from "lucide-react";
import { ScoreSubmitBar } from "@/components/arcade/ScoreSubmitBar";
import type { PhysicsBody } from "@/lib/rentalHeroPhysics";
import { CAPTURED_CODES, KEYS } from "@/lib/rentalsInvaders/constants";
import type { GameController, HudInfo } from "@/lib/rentalsInvaders/createGame";
import type { Phase } from "@/lib/rentalsInvaders/types";

type RentalsHeroInvadersGameProps = {
  heroRef: React.RefObject<HTMLDivElement | null>;
  getPinBodies: () => PhysicsBody[];
  onExit: () => void;
};

type Overlay = { phase: Phase; score: number; highScore: number };

const codeAction = (code: string) => {
  if ((KEYS.left as readonly string[]).includes(code)) return "left" as const;
  if ((KEYS.right as readonly string[]).includes(code)) return "right" as const;
  if ((KEYS.fire as readonly string[]).includes(code)) return "fire" as const;
  if ((KEYS.pause as readonly string[]).includes(code)) return "pause" as const;
  return null;
};

export function RentalsHeroInvadersGame({
  heroRef,
  getPinBodies,
  onExit,
}: RentalsHeroInvadersGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const controllerRef = useRef<GameController | null>(null);
  const [overlay, setOverlay] = useState<Overlay>({
    phase: "ready",
    score: 0,
    highScore: 0,
  });
  const [loading, setLoading] = useState(true);
  const [muted, setMuted] = useState(false);

  // Imperative HUD (avoid React re-renders every frame)
  const scoreRef = useRef<HTMLSpanElement>(null);
  const waveRef = useRef<HTMLSpanElement>(null);
  const livesRef = useRef<HTMLSpanElement>(null);

  const pinsRef = useRef(getPinBodies);
  pinsRef.current = getPinBodies;
  const onExitRef = useRef(onExit);
  onExitRef.current = onExit;

  useEffect(() => {
    const hero = heroRef.current;
    const canvas = canvasRef.current;
    if (!hero || !canvas) return;

    let cancelled = false;
    let controller: GameController | null = null;

    const onHud = (hud: HudInfo) => {
      if (scoreRef.current) {
        scoreRef.current.textContent = String(hud.score).padStart(4, "0");
      }
      if (waveRef.current) waveRef.current.textContent = String(hud.wave);
      if (livesRef.current) livesRef.current.textContent = String(hud.lives);
    };

    import("@/lib/rentalsInvaders/createGame")
      .then((mod) => {
        if (cancelled) return;
        controller = mod.createGame({
          canvas,
          getPins: () =>
            pinsRef.current().map((b) => ({
              x: b.x,
              y: b.y,
              radius: b.radius,
            })),
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
        console.error("Failed to load classic Space Invaders:", err);
        if (!cancelled) onExitRef.current();
      });

    const unlockAudio = () => {
      void controllerRef.current?.unlockAudio();
    };

    const isUiTarget = (target: EventTarget | null) =>
      target instanceof Element && Boolean(target.closest("button"));

    const onPointerDown = (e: PointerEvent) => {
      unlockAudio();
      if (isUiTarget(e.target)) return;
      controllerRef.current?.setKey("fire", true);
    };

    const releaseFire = () => controllerRef.current?.setKey("fire", false);

    const onKeyDown = (e: KeyboardEvent) => {
      unlockAudio();
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
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointerup", releaseFire);
    canvas.addEventListener("pointerleave", releaseFire);
    canvas.addEventListener("pointercancel", releaseFire);
    window.addEventListener("pointerup", releaseFire);

    return () => {
      cancelled = true;
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointerup", releaseFire);
      canvas.removeEventListener("pointerleave", releaseFire);
      canvas.removeEventListener("pointercancel", releaseFire);
      window.removeEventListener("pointerup", releaseFire);
      controller?.dispose();
      controllerRef.current = null;
    };
  }, [heroRef]);

  const paused = overlay.phase === "paused";
  const over = overlay.phase === "over";
  // Canvas draws ready/wave text; React only needs pause/over chrome

  return (
    <div
      className="absolute inset-0 z-[30] overflow-hidden rounded-[26px]"
      role="application"
      aria-label="Classic Space Invaders mini game"
      onPointerDown={() => void controllerRef.current?.unlockAudio()}
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

      {/* Minimal DOM HUD mirror (canvas also draws full arcade HUD) */}
      <div className="pointer-events-none absolute inset-0 z-[33] font-mono text-[#33ff66]">
        <div className="sr-only">
          SCORE <span ref={scoreRef}>0000</span>
          WAVE <span ref={waveRef}>1</span>
          LIVES <span ref={livesRef}>3</span>
        </div>
      </div>

      {/* Top-right controls */}
      <div className="absolute right-3 top-3 z-[35] flex items-center gap-2">
        <button
          type="button"
          onClick={() => setMuted(controllerRef.current?.toggleMute() ?? false)}
          aria-label={muted ? "Unmute" : "Mute"}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#33ff66]/30 bg-black/60 text-[#33ff66] backdrop-blur-md transition-colors hover:bg-black/80"
        >
          {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>
        <button
          type="button"
          onClick={() => controllerRef.current?.togglePause()}
          aria-label={paused ? "Resume" : "Pause"}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#33ff66]/30 bg-black/60 text-[#33ff66] backdrop-blur-md transition-colors hover:bg-black/80"
        >
          {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
        </button>
        <button
          type="button"
          onClick={onExit}
          aria-label="Back to arcade menu"
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#33ff66]/30 bg-black/60 text-[#33ff66] backdrop-blur-md transition-colors hover:bg-black/80"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {loading && (
        <div className="absolute inset-0 z-[34] flex items-center justify-center bg-black/50">
          <p className="animate-pulse font-mono text-sm tracking-[0.3em] text-[#33ff66]">
            INSERT COIN…
          </p>
        </div>
      )}

      {paused && (
        <div className="absolute inset-0 z-[34] flex flex-col items-center justify-center gap-4 bg-black/50 backdrop-blur-sm">
          <p className="font-mono text-lg font-semibold tracking-[0.3em] text-[#33ff66]">
            PAUSED
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => controllerRef.current?.togglePause()}
              className="inline-flex items-center gap-2 rounded-full bg-[#33ff66] px-5 py-2.5 text-sm font-semibold text-[#05100a] hover:bg-[#5dff8a]"
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
          <p className="font-mono text-3xl font-black tracking-[0.22em] text-[#ff4466] drop-shadow-[0_0_16px_rgba(255,68,102,0.7)]">
            GAME OVER
          </p>
          <p className="font-mono text-sm text-[#e8ffe8]/90">
            SCORE{" "}
            <span className="font-semibold text-[#33ff66]">
              {String(overlay.score).padStart(4, "0")}
            </span>
            {overlay.score >= overlay.highScore && overlay.score > 0 ? (
              <span className="ml-2 text-[#d6b06a]">★ NEW HI-SCORE</span>
            ) : (
              <span className="ml-2 text-white/55">
                HI {String(overlay.highScore).padStart(4, "0")}
              </span>
            )}
          </p>
          <ScoreSubmitBar
            gameId="invaders"
            score={overlay.score}
            accent="#33ff66"
          />
          <div className="mt-2 flex gap-3">
            <button
              type="button"
              onClick={() => controllerRef.current?.restart()}
              className="inline-flex items-center gap-2 rounded-full bg-[#33ff66] px-5 py-2.5 text-sm font-semibold text-[#05100a] hover:bg-[#5dff8a]"
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
