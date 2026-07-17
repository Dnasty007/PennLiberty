/**
 * Bootstraps classic Tetris engine + canvas loop for the Rentals hero.
 */
import { TetrisAudio } from "./audio";
import { TetrisEngine, type KeyAction } from "./engine";
import { render } from "./render";
import type { Phase } from "./types";

export type HudInfo = {
  score: number;
  highScore: number;
  level: number;
  lines: number;
};

export type GameController = {
  setKey: (action: KeyAction, down: boolean) => void;
  togglePause: () => void;
  toggleMute: () => boolean;
  restart: () => void;
  unlockAudio: () => void;
  dispose: () => void;
};

export type CreateGameOpts = {
  canvas: HTMLCanvasElement;
  onPhaseChange?: (phase: Phase, info: HudInfo) => void;
  onHud?: (hud: HudInfo) => void;
};

function hudFrom(engine: TetrisEngine): HudInfo {
  const s = engine.getState();
  return {
    score: s.score,
    highScore: s.highScore,
    level: s.level,
    lines: s.lines,
  };
}

export function createGame(opts: CreateGameOpts): GameController {
  const { canvas, onPhaseChange, onHud } = opts;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");

  const audio = new TetrisAudio();
  audio.resume();

  let muted = false;
  let disposed = false;
  let raf = 0;
  let last = performance.now();
  let lastHud = "";
  let overSoundPlayed = false;

  const parent = canvas.parentElement;
  const measure = () => {
    const el = parent ?? canvas;
    const rect = el.getBoundingClientRect();
    return {
      cssW: Math.max(1, Math.floor(rect.width)),
      cssH: Math.max(1, Math.floor(rect.height)),
    };
  };

  const { cssW, cssH } = measure();
  const engine = new TetrisEngine(cssW, cssH, {
    onPhaseChange: (phase, state) => {
      if (phase === "over" && !overSoundPlayed) {
        overSoundPlayed = true;
        audio.gameOver();
      }
      if (phase === "playing") overSoundPlayed = false;
      onPhaseChange?.(phase, {
        score: state.score,
        highScore: state.highScore,
        level: state.level,
        lines: state.lines,
      });
    },
    onLineClear: (n) => audio.lineClear(n),
    onLock: () => audio.lock(),
    onRotate: () => audio.rotate(),
    onMove: () => audio.move(),
  });

  onPhaseChange?.(engine.getState().phase, hudFrom(engine));

  const applySize = () => {
    const { cssW: w, cssH: h } = measure();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
    engine.setBounds(w, h);
  };

  applySize();

  const ro =
    typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(() => {
          if (!disposed) applySize();
        })
      : null;
  if (parent && ro) ro.observe(parent);
  else if (ro) ro.observe(canvas);

  const frame = (now: number) => {
    if (disposed) return;
    const dt = now - last;
    last = now;
    engine.update(dt);
    render(ctx, engine.getState(), now);

    const hud = hudFrom(engine);
    const key = `${hud.score}|${hud.level}|${hud.lines}|${hud.highScore}`;
    if (key !== lastHud) {
      lastHud = key;
      onHud?.(hud);
    }
    raf = requestAnimationFrame(frame);
  };

  raf = requestAnimationFrame(frame);

  return {
    setKey: (action, down) => engine.setKey(action, down),
    togglePause: () => engine.togglePause(),
    toggleMute: () => {
      muted = !muted;
      audio.setMuted(muted);
      return muted;
    },
    restart: () => {
      overSoundPlayed = false;
      engine.restart();
      onPhaseChange?.(engine.getState().phase, hudFrom(engine));
    },
    unlockAudio: () => audio.resume(),
    dispose: () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro?.disconnect();
      audio.dispose();
    },
  };
}
