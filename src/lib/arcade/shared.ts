/** Shared helpers for Rentals-hero childhood arcade games. */

export type Phase = "ready" | "playing" | "paused" | "over" | "win";

export type HudInfo = {
  score: number;
  highScore: number;
  extra?: string;
};

export type ClassicController = {
  setKey: (action: string, down: boolean) => void;
  pointer?: (kind: "down" | "move" | "up", x: number, y: number) => void;
  togglePause: () => void;
  toggleMute: () => boolean;
  restart: () => void;
  unlockAudio: () => void;
  dispose: () => void;
};

export type CreateClassicOpts = {
  canvas: HTMLCanvasElement;
  onPhaseChange?: (phase: Phase, info: HudInfo) => void;
  onHud?: (hud: HudInfo) => void;
};

export class BeepAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private enabled = true;

  resume() {
    if (!this.enabled) return;
    if (!this.ctx) {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!Ctor) {
        this.enabled = false;
        return;
      }
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.14;
      this.master.connect(this.ctx.destination);
    }
    void this.ctx.resume();
  }

  setMuted(muted: boolean) {
    if (this.master) this.master.gain.value = muted ? 0 : 0.14;
  }

  dispose() {
    void this.ctx?.close();
    this.ctx = null;
    this.master = null;
  }

  tone(
    type: OscillatorType,
    from: number,
    to: number,
    dur: number,
    gain = 0.5,
  ) {
    const ctx = this.ctx;
    const master = this.master;
    if (!ctx || !master) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(from, t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(master);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  blip(f = 440) {
    this.tone("square", f, f * 0.9, 0.05, 0.35);
  }
  hit(f = 200) {
    this.tone("triangle", f, 80, 0.1, 0.45);
  }
  score() {
    this.tone("square", 520, 780, 0.1, 0.4);
  }
  die() {
    this.tone("sawtooth", 300, 60, 0.35, 0.5);
  }
  win() {
    [523, 659, 784, 1046].forEach((f, i) => {
      window.setTimeout(() => this.tone("square", f, f * 1.02, 0.12, 0.4), i * 90);
    });
  }
}

export function loadHs(key: string): number {
  try {
    return Number(localStorage.getItem(key)) || 0;
  } catch {
    return 0;
  }
}

export function saveHs(key: string, value: number) {
  try {
    localStorage.setItem(key, String(value));
  } catch {
    /* ignore */
  }
}

export function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}

export function rand(a: number, b: number) {
  return a + Math.random() * (b - a);
}

export function drawCrtPlate(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, "rgba(2,12,10,0.55)");
  g.addColorStop(1, "rgba(0,6,4,0.78)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.save();
  ctx.globalAlpha = 0.05;
  ctx.fillStyle = "#000";
  for (let y = 0; y < h; y += 3) ctx.fillRect(0, y, w, 1);
  ctx.restore();
}

export function drawHudBar(
  ctx: CanvasRenderingContext2D,
  title: string,
  score: number,
  hi: number,
  w: number,
  extra = "",
) {
  ctx.font = "bold 13px 'Courier New', monospace";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillStyle = "#33ff66";
  ctx.fillText(title, 14, 10);
  ctx.fillStyle = "#e8ffe8";
  ctx.fillText(`SCORE ${String(score).padStart(5, "0")}`, 14, 28);
  ctx.fillStyle = "#f4dfb4";
  ctx.textAlign = "right";
  ctx.fillText(`HI ${String(hi).padStart(5, "0")}`, w - 14, 10);
  if (extra) {
    ctx.fillStyle = "#5ec8ff";
    ctx.fillText(extra, w - 14, 28);
  }
}

export function drawCenterText(
  ctx: CanvasRenderingContext2D,
  lines: string[],
  w: number,
  h: number,
  color = "#33ff66",
) {
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = color;
  ctx.font = "bold 20px 'Courier New', monospace";
  const start = h / 2 - ((lines.length - 1) * 22) / 2;
  lines.forEach((line, i) => {
    if (i > 0) {
      ctx.font = "12px 'Courier New', monospace";
      ctx.fillStyle = "rgba(232,255,232,0.7)";
    }
    ctx.fillText(line, w / 2, start + i * 24);
  });
}

/** Boot canvas loop + DPR sizing. Returns dispose + resize helpers. */
export function bootLoop(
  canvas: HTMLCanvasElement,
  tick: (dt: number, now: number) => void,
  paint: (ctx: CanvasRenderingContext2D, now: number) => void,
  onResize?: (w: number, h: number) => void,
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no 2d");
  let disposed = false;
  let raf = 0;
  let last = performance.now();
  const parent = canvas.parentElement;

  const applySize = () => {
    const el = parent ?? canvas;
    const rect = el.getBoundingClientRect();
    const w = Math.max(1, Math.floor(rect.width));
    const h = Math.max(1, Math.floor(rect.height));
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
    onResize?.(w, h);
    return { w, h };
  };

  applySize();
  const ro =
    typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(() => {
          if (!disposed) applySize();
        })
      : null;
  if (parent && ro) ro.observe(parent);

  const frame = (now: number) => {
    if (disposed) return;
    const dt = Math.min(50, now - last);
    last = now;
    tick(dt, now);
    paint(ctx, now);
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);

  return {
    ctx,
    dispose: () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro?.disconnect();
    },
    measure: () => {
      const el = parent ?? canvas;
      const r = el.getBoundingClientRect();
      return {
        w: Math.max(1, Math.floor(r.width)),
        h: Math.max(1, Math.floor(r.height)),
      };
    },
  };
}
