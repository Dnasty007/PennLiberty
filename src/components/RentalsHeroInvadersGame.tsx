import { useEffect, useRef, useState } from "react";
import { Heart, Pause, Play, RotateCcw, Volume2, VolumeX, X, Zap } from "lucide-react";
import type { PhysicsBody } from "@/lib/rentalHeroPhysics";
import { CAPTURED_CODES, KEYS } from "@/lib/rentalsInvaders3d/constants3d";
import type { GameController, HudInfo } from "@/lib/rentalsInvaders3d/scene3d";
import type { Phase } from "@/lib/rentalsInvaders3d/types3d";

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
  const [overlay, setOverlay] = useState<Overlay>({ phase: "ready", score: 0, highScore: 0 });
  const [loading, setLoading] = useState(true);
  const [muted, setMuted] = useState(false);

  // HUD elements updated imperatively (no per-frame React render)
  const scoreRef = useRef<HTMLSpanElement>(null);
  const waveRef = useRef<HTMLSpanElement>(null);
  const livesRef = useRef<HTMLSpanElement>(null);
  const weaponRef = useRef<HTMLSpanElement>(null);
  const overdriveRef = useRef<HTMLSpanElement>(null);
  const toastRef = useRef<HTMLDivElement>(null);
  const bossWrapRef = useRef<HTMLDivElement>(null);
  const bossNameRef = useRef<HTMLSpanElement>(null);
  const bossFillRef = useRef<HTMLDivElement>(null);

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
      if (scoreRef.current) scoreRef.current.textContent = String(hud.score).padStart(5, "0");
      if (waveRef.current) waveRef.current.textContent = String(hud.wave);
      if (livesRef.current) livesRef.current.textContent = String(hud.lives);
      if (weaponRef.current) weaponRef.current.textContent = hud.weapon;
      if (overdriveRef.current) overdriveRef.current.style.opacity = hud.overdrive ? "1" : "0";
      if (toastRef.current) {
        toastRef.current.textContent = hud.toast ?? "";
        toastRef.current.style.opacity = hud.toast ? "1" : "0";
      }
      if (bossWrapRef.current) {
        bossWrapRef.current.style.opacity = hud.boss ? "1" : "0";
        if (hud.boss) {
          if (bossNameRef.current) bossNameRef.current.textContent = hud.boss.name;
          if (bossFillRef.current) {
            bossFillRef.current.style.width = `${(hud.boss.hp / hud.boss.maxHp) * 100}%`;
          }
        }
      }
    };

    import("@/lib/rentalsInvaders3d/scene3d")
      .then((mod) => {
        if (cancelled) return;
        controller = mod.createGame({
          canvas,
          getPins: () =>
            pinsRef.current().map((b) => ({ x: b.x, y: b.y, radius: b.radius })),
          onPhaseChange: (phase, info) =>
            setOverlay({ phase, score: info.score, highScore: info.highScore }),
          onHud,
        });
        controllerRef.current = controller;
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load 3D game:", err);
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
  const ready = overlay.phase === "ready";

  return (
    <div
      className="absolute inset-0 z-[30] overflow-hidden rounded-[26px]"
      role="application"
      aria-label="Space Invaders 3D mini game"
      onPointerDown={() => void controllerRef.current?.unlockAudio()}
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

      {/* HUD */}
      <div className="pointer-events-none absolute inset-0 z-[33] font-mono text-[#f4dfb4]">
        <div className="absolute left-4 top-3 text-sm font-bold tracking-widest drop-shadow-[0_0_6px_rgba(53,224,255,0.6)]">
          SCORE <span ref={scoreRef}>00000</span>
          <span className="ml-3 text-white/70">WAVE <span ref={waveRef}>1</span></span>
        </div>
        <div className="absolute right-24 top-3 flex items-center gap-1.5 text-sm font-semibold tracking-wide text-[#35e0ff]">
          <span className="inline-flex items-center gap-1">
            <Heart className="h-3.5 w-3.5 fill-[#ff5a6e] text-[#ff5a6e]" />
            <span ref={livesRef}>3</span>
          </span>
        </div>

        {/* Boss health bar */}
        <div
          ref={bossWrapRef}
          className="absolute left-1/2 top-9 w-[60%] max-w-md -translate-x-1/2 opacity-0 transition-opacity duration-300"
        >
          <div className="mb-1 text-center text-[10px] font-bold uppercase tracking-[0.3em] text-[#ff5a6e] drop-shadow-[0_0_6px_rgba(255,90,110,0.7)]">
            <span ref={bossNameRef}>BOSS</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full border border-[#ff5a6e]/50 bg-black/55">
            <div
              ref={bossFillRef}
              className="h-full rounded-full bg-gradient-to-r from-[#ff5a6e] via-[#ffa23d] to-[#f4dfb4] transition-[width] duration-150"
              style={{ width: "100%" }}
            />
          </div>
        </div>
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#d6b06a]/40 bg-black/55 px-3 py-1 text-xs font-semibold tracking-widest backdrop-blur-md">
            <Zap className="h-3.5 w-3.5 text-[#d6b06a]" />
            <span ref={weaponRef}>Blaster</span>
            <span ref={overdriveRef} className="text-[#ffa23d] opacity-0 transition-opacity">
              · OVERDRIVE
            </span>
          </div>
        </div>
        <div
          ref={toastRef}
          className="absolute left-1/2 top-[38%] -translate-x-1/2 text-2xl font-black tracking-[0.18em] text-[#f4dfb4] opacity-0 drop-shadow-[0_0_12px_rgba(214,176,106,0.8)] transition-opacity duration-200"
        />
      </div>

      {/* top-right controls */}
      <div className="absolute right-3 top-3 z-[35] flex items-center gap-2">
        <button
          type="button"
          onClick={() => setMuted(controllerRef.current?.toggleMute() ?? false)}
          aria-label={muted ? "Unmute" : "Mute"}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white/90 backdrop-blur-md transition-colors hover:bg-black/80"
        >
          {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>
        <button
          type="button"
          onClick={() => controllerRef.current?.togglePause()}
          aria-label={paused ? "Resume" : "Pause"}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white/90 backdrop-blur-md transition-colors hover:bg-black/80"
        >
          {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
        </button>
        <button
          type="button"
          onClick={onExit}
          aria-label="Quit game"
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white/90 backdrop-blur-md transition-colors hover:bg-black/80"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {loading && (
        <div className="absolute inset-0 z-[34] flex items-center justify-center bg-black/50">
          <p className="animate-pulse font-mono text-sm tracking-[0.3em] text-[#35e0ff]">
            INITIALIZING…
          </p>
        </div>
      )}

      {!loading && ready && (
        <div className="pointer-events-none absolute inset-0 z-[34] flex flex-col items-center justify-center gap-3">
          <p className="animate-pulse text-2xl font-black tracking-[0.25em] text-[#f4dfb4] drop-shadow-[0_0_14px_rgba(53,224,255,0.7)]">
            CLICK OR PRESS SPACE
          </p>
          <p className="font-mono text-[11px] tracking-widest text-white/70">
            ← → MOVE · CLICK / SPACE FIRE · P PAUSE · ESC QUIT · GRAB FALLEN WEAPONS
          </p>
        </div>
      )}

      {paused && (
        <div className="absolute inset-0 z-[34] flex flex-col items-center justify-center gap-4 bg-black/45 backdrop-blur-sm">
          <p className="text-lg font-semibold tracking-[0.25em] text-[#f4dfb4]">PAUSED</p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => controllerRef.current?.togglePause()}
              className="inline-flex items-center gap-2 rounded-full bg-[#d6b06a] px-5 py-2.5 text-sm font-semibold text-[#08111f] hover:bg-[#e4be78]"
            >
              <Play className="h-4 w-4" /> Resume
            </button>
            <button
              type="button"
              onClick={onExit}
              className="inline-flex items-center gap-2 rounded-full border border-white/25 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
            >
              Quit
            </button>
          </div>
        </div>
      )}

      {over && (
        <div className="absolute inset-0 z-[34] flex flex-col items-center justify-center gap-3 bg-black/60 backdrop-blur-sm">
          <p className="text-3xl font-black tracking-[0.22em] text-[#ff5a6e] drop-shadow-[0_0_16px_rgba(255,90,110,0.7)]">
            GAME OVER
          </p>
          <p className="text-sm text-white/85">
            Score <span className="font-semibold text-[#f4dfb4]">{overlay.score}</span>
            {overlay.score >= overlay.highScore && overlay.score > 0 ? (
              <span className="ml-2 text-[#d6b06a]">★ New best</span>
            ) : (
              <span className="ml-2 text-white/55">Best {overlay.highScore}</span>
            )}
          </p>
          <div className="mt-2 flex gap-3">
            <button
              type="button"
              onClick={() => controllerRef.current?.restart()}
              className="inline-flex items-center gap-2 rounded-full bg-[#d6b06a] px-5 py-2.5 text-sm font-semibold text-[#08111f] hover:bg-[#e4be78]"
            >
              <RotateCcw className="h-4 w-4" /> Play again
            </button>
            <button
              type="button"
              onClick={onExit}
              className="inline-flex items-center gap-2 rounded-full border border-white/25 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
            >
              Quit
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
