/**
 * Bootstraps the classic 2D Space Invaders engine + canvas loop.
 * React owns mount/unmount; this module owns rAF + DPR sizing.
 */
import { GameAudio } from "./audio";
import { InvadersEngine, type KeyAction } from "./engine";
import { toPinObstacles } from "./pinBridge";
import { render } from "./render";
import type { Phase, PinObstacle } from "./types";

export type HudInfo = {
  score: number;
  highScore: number;
  lives: number;
  wave: number;
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
  getPins: () => PinObstacle[];
  onPhaseChange?: (phase: Phase, info: HudInfo) => void;
  onHud?: (hud: HudInfo) => void;
};

function hudFrom(engine: InvadersEngine): HudInfo {
  const s = engine.getState();
  return {
    score: s.score,
    highScore: s.highScore,
    lives: s.lives,
    wave: s.wave,
  };
}

export function createGame(opts: CreateGameOpts): GameController {
  const { canvas, getPins, onPhaseChange, onHud } = opts;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas 2D context unavailable");
  }

  const audio = new GameAudio();
  audio.resume();

  let muted = false;
  let disposed = false;
  let raf = 0;
  let last = performance.now();
  let lastHud = "";

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
  const engine = new InvadersEngine(cssW, cssH, audio, {
    onPhaseChange: (phase, state) => {
      onPhaseChange?.(phase, {
        score: state.score,
        highScore: state.highScore,
        lives: state.lives,
        wave: state.wave,
      });
    },
  });

  // Initial phase notification (ready)
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

    const pins = getPins();
    engine.setPins(pins.length ? pins : toPinObstacles([]));
    engine.update(dt);

    const s = engine.getState();
    render(ctx, s, now);

    const hud = hudFrom(engine);
    const key = `${hud.score}|${hud.lives}|${hud.wave}|${hud.highScore}`;
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
