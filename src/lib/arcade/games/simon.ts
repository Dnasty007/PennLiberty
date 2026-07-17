/**
 * Simon-style memory sequence for Penn Liberty Arcade.
 * Watch the colors · click the pattern · it gets longer & faster.
 */
import {
  BeepAudio,
  bootLoop,
  drawCenterText,
  drawCrtPlate,
  drawHudBar,
  loadHs,
  saveHs,
  type ClassicController,
  type CreateClassicOpts,
  type HudInfo,
  type Phase,
} from "@/lib/arcade/shared";

const HS_KEY = "pl-arcade-simon-hs";
const TITLE = "SIMON";

const COLORS = [
  { fill: "#33ff66", dim: "#14532d", freq: 329.63 },
  { fill: "#ff4466", dim: "#7f1d1d", freq: 261.63 },
  { fill: "#fde047", dim: "#713f12", freq: 220.0 },
  { fill: "#5ec8ff", dim: "#1e3a5f", freq: 164.81 },
] as const;

type Mode = "playback" | "input" | "gap";

export function createGame(opts: CreateClassicOpts): ClassicController {
  const { canvas, onPhaseChange, onHud } = opts;
  const audio = new BeepAudio();
  audio.resume();

  let muted = false;
  let phase: Phase = "ready";
  let score = 0;
  let highScore = loadHs(HS_KEY);
  let w = 320;
  let h = 240;

  let sequence: number[] = [];
  let inputIndex = 0;
  let mode: Mode = "playback";
  let lit = -1;
  let flashTimer = 0;
  let playTimer = 0;
  let playIndex = 0;
  let stepMs = 520;
  let pauseWas = false;
  let fireWas = false;
  const keys = { fire: false, pause: false };

  const hud = (): HudInfo => ({
    score,
    highScore,
    extra: mode === "input" ? "YOUR TURN" : "WATCH",
  });

  const setPhase = (p: Phase) => {
    phase = p;
    onPhaseChange?.(p, hud());
  };

  const emitHud = () => onHud?.(hud());

  const maybeHs = () => {
    if (score > highScore) {
      highScore = score;
      saveHs(HS_KEY, highScore);
    }
  };

  const layout = () => {
    const size = Math.min(w, h - 60) * 0.72;
    const cx = w / 2;
    const cy = h / 2 + 10;
    const half = size / 2;
    return {
      pads: [
        { x: cx - half, y: cy - half, s: half - 4 },
        { x: cx + 4, y: cy - half, s: half - 4 },
        { x: cx - half, y: cy + 4, s: half - 4 },
        { x: cx + 4, y: cy + 4, s: half - 4 },
      ],
    };
  };

  const hitPad = (px: number, py: number): number => {
    const { pads } = layout();
    for (let i = 0; i < 4; i++) {
      const p = pads[i]!;
      if (px >= p.x && px <= p.x + p.s && py >= p.y && py <= p.y + p.s) return i;
    }
    return -1;
  };

  const flash = (id: number, dur: number) => {
    lit = id;
    flashTimer = dur;
    const c = COLORS[id]!;
    audio.tone("square", c.freq, c.freq, Math.max(0.05, dur / 1000), 0.4);
  };

  const beginPlayback = () => {
    mode = "playback";
    playIndex = 0;
    inputIndex = 0;
    lit = -1;
    stepMs = Math.max(240, 540 - sequence.length * 16);
    playTimer = 300;
    emitHud();
  };

  const addStepAndPlay = () => {
    sequence.push(Math.floor(Math.random() * 4));
    beginPlayback();
  };

  const softReset = () => {
    score = 0;
    sequence = [];
    inputIndex = 0;
    lit = -1;
    flashTimer = 0;
    playTimer = 0;
    emitHud();
  };

  const startGame = () => {
    softReset();
    setPhase("playing");
    addStepAndPlay();
  };

  const onPad = (id: number) => {
    if (phase !== "playing" || mode !== "input") return;
    flash(id, 180);
    if (id !== sequence[inputIndex]) {
      audio.die();
      maybeHs();
      setPhase("over");
      return;
    }
    inputIndex += 1;
    if (inputIndex >= sequence.length) {
      score = sequence.length;
      maybeHs();
      emitHud();
      audio.score();
      mode = "gap";
      playTimer = 500;
    }
  };

  const tick = (dt: number) => {
    if (keys.pause && !pauseWas) {
      if (phase === "playing") setPhase("paused");
      else if (phase === "paused") setPhase("playing");
    }
    pauseWas = keys.pause;

    if (phase === "ready" || phase === "over") {
      if (keys.fire && !fireWas) startGame();
      fireWas = keys.fire;
      return;
    }
    if (phase !== "playing") {
      fireWas = keys.fire;
      return;
    }

    if (lit >= 0) {
      flashTimer -= dt;
      if (flashTimer <= 0) lit = -1;
    }

    if (mode === "gap") {
      playTimer -= dt;
      if (playTimer <= 0) addStepAndPlay();
      return;
    }

    if (mode === "playback") {
      playTimer -= dt;
      if (playTimer > 0) return;
      if (playIndex < sequence.length) {
        flash(sequence[playIndex]!, stepMs * 0.55);
        playIndex += 1;
        playTimer = stepMs;
      } else {
        mode = "input";
        inputIndex = 0;
        lit = -1;
        emitHud();
      }
    }
  };

  const paint = (ctx: CanvasRenderingContext2D) => {
    drawCrtPlate(ctx, w, h);
    drawHudBar(
      ctx,
      TITLE,
      score,
      highScore,
      w,
      phase === "playing" && mode === "input" ? "YOUR TURN" : "WATCH",
    );

    const { pads } = layout();
    for (let i = 0; i < 4; i++) {
      const p = pads[i]!;
      const c = COLORS[i]!;
      ctx.fillStyle = lit === i ? c.fill : c.dim;
      ctx.strokeStyle = c.fill;
      ctx.lineWidth = 2;
      ctx.fillRect(p.x, p.y, p.s, p.s);
      ctx.strokeRect(p.x, p.y, p.s, p.s);
    }

    const knob = Math.min(w, h) * 0.08;
    ctx.fillStyle = "#0a1610";
    ctx.beginPath();
    ctx.arc(w / 2, h / 2 + 10, knob, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#33ff66";
    ctx.stroke();
    ctx.fillStyle = "#33ff66";
    ctx.font = "bold 11px 'Courier New', monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("PL", w / 2, h / 2 + 10);

    if (phase === "ready") {
      drawCenterText(ctx, ["SIMON", "CLICK PADS TO MATCH", "SPACE START"], w, h);
    } else if (phase === "paused") {
      drawCenterText(ctx, ["PAUSED"], w, h);
    } else if (phase === "over") {
      drawCenterText(ctx, ["WRONG!", `SCORE ${score}`, "SPACE RETRY"], w, h, "#ff6688");
    }
  };

  const loop = bootLoop(
    canvas,
    tick,
    paint,
    (nw, nh) => {
      w = nw;
      h = nh;
    },
  );

  return {
    setKey: (action, down) => {
      if (action === "fire") keys.fire = down;
      if (action === "pause") keys.pause = down;
    },
    pointer: (kind, x, y) => {
      if (kind !== "down") return;
      if (phase === "ready" || phase === "over") {
        startGame();
        return;
      }
      const id = hitPad(x, y);
      if (id >= 0) onPad(id);
    },
    togglePause: () => {
      if (phase === "playing") setPhase("paused");
      else if (phase === "paused") setPhase("playing");
    },
    toggleMute: () => {
      muted = !muted;
      audio.setMuted(muted);
      return muted;
    },
    restart: () => {
      softReset();
      setPhase("ready");
    },
    unlockAudio: () => audio.resume(),
    dispose: () => {
      loop.dispose();
      audio.dispose();
    },
  };
}
