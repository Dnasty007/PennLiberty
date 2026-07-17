/**
 * Arcade coin-slot SFX.
 * Prefers real sample at /arcade/coin-insert.wav (metal drop + credit ding).
 * Falls back to procedural Web Audio if the file can't load.
 */

const SAMPLE_URL = "/arcade/coin-insert.wav";

let sampleBuf: AudioBuffer | null = null;
let sampleLoading: Promise<AudioBuffer | null> | null = null;
let ctx: AudioContext | null = null;
let master: GainNode | null = null;

function ensureCtx(): AudioContext | null {
  if (ctx) return ctx;
  const Ctor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctor) return null;
  ctx = new Ctor();
  master = ctx.createGain();
  master.gain.value = 0.55;
  master.connect(ctx.destination);
  return ctx;
}

async function loadSample(): Promise<AudioBuffer | null> {
  if (sampleBuf) return sampleBuf;
  if (sampleLoading) return sampleLoading;
  const audioCtx = ensureCtx();
  if (!audioCtx) return null;

  sampleLoading = (async () => {
    try {
      const res = await fetch(SAMPLE_URL, { cache: "force-cache" });
      if (!res.ok) return null;
      const raw = await res.arrayBuffer();
      sampleBuf = await audioCtx.decodeAudioData(raw.slice(0));
      return sampleBuf;
    } catch {
      return null;
    } finally {
      sampleLoading = null;
    }
  })();

  return sampleLoading;
}

function playBuffer(buffer: AudioBuffer) {
  const audioCtx = ensureCtx();
  if (!audioCtx || !master) return;
  const src = audioCtx.createBufferSource();
  src.buffer = buffer;
  src.connect(master);
  src.start(0);
}

function noiseBurst(
  audioCtx: AudioContext,
  dest: AudioNode,
  start: number,
  dur: number,
  gain: number,
  hpFreq: number,
) {
  const samples = Math.floor(audioCtx.sampleRate * dur);
  const buffer = audioCtx.createBuffer(1, samples, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < samples; i++) {
    const t = i / samples;
    data[i] = (Math.random() * 2 - 1) * (1 - t) * (1 - t);
  }
  const src = audioCtx.createBufferSource();
  src.buffer = buffer;
  const filter = audioCtx.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = hpFreq;
  const g = audioCtx.createGain();
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(gain, start + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  src.connect(filter).connect(g).connect(dest);
  src.start(start);
  src.stop(start + dur + 0.02);
}

function ping(
  audioCtx: AudioContext,
  dest: AudioNode,
  start: number,
  freq: number,
  dur: number,
  gain: number,
  type: OscillatorType = "square",
) {
  const osc = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  osc.frequency.exponentialRampToValueAtTime(freq * 0.92, start + dur);
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(gain, start + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(g).connect(dest);
  osc.start(start);
  osc.stop(start + dur + 0.03);
}

/** Procedural fallback if WAV missing. */
function playProcedural() {
  const audioCtx = ensureCtx();
  if (!audioCtx || !master) return;
  const t0 = audioCtx.currentTime + 0.02;
  noiseBurst(audioCtx, master, t0, 0.045, 0.55, 2800);
  ping(audioCtx, master, t0, 2400, 0.06, 0.35, "triangle");
  noiseBurst(audioCtx, master, t0 + 0.055, 0.07, 0.28, 1800);
  ping(audioCtx, master, t0 + 0.07, 1600, 0.05, 0.2, "triangle");
  noiseBurst(audioCtx, master, t0 + 0.12, 0.05, 0.18, 2200);
  ping(audioCtx, master, t0 + 0.18, 880, 0.09, 0.4, "square");
  ping(audioCtx, master, t0 + 0.26, 1175, 0.14, 0.38, "square");
  ping(audioCtx, master, t0 + 0.2, 120, 0.12, 0.22, "sine");
}

/**
 * Classic feel: quarter hits the slot → rattles down → machine accepts credit.
 * Call from a user gesture (click).
 */
export async function playCoinInsert(): Promise<void> {
  const audioCtx = ensureCtx();
  if (!audioCtx) return;
  await audioCtx.resume();

  const buf = await loadSample();
  if (buf) {
    playBuffer(buf);
    return;
  }
  playProcedural();
}

/** Optional: warm the sample on hover so first click is instant. */
export function preloadCoinInsert(): void {
  void loadSample();
}
