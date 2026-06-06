/** Procedural Web Audio — synthwave ambience + layered arcade SFX. */
import type { BossKind, WeaponId } from "./constants3d";

const BPM = 118;
const BEAT_MS = Math.round((60_000 / BPM) / 2);

const ARP_NOTES = [110, 130.81, 164.81, 196, 220, 261.63, 329.63];

let primedInstance: GameAudio3D | null = null;

export function primeGameAudio(): void {
  if (!primedInstance) primedInstance = new GameAudio3D();
  primedInstance.resume();
  void primedInstance.ensureRunning();
}

export function takeGameAudio(): GameAudio3D {
  const audio = primedInstance ?? new GameAudio3D();
  primedInstance = null;
  audio.resume();
  return audio;
}

export class GameAudio3D {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private sfxBus: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private muted = false;

  private musicTimer: number | null = null;
  private musicStep = 0;
  private bassOsc: OscillatorNode | null = null;
  private bassGain: GainNode | null = null;

  resume() {
    if (!this.ctx) {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.38;
      this.master.connect(this.ctx.destination);

      this.musicBus = this.ctx.createGain();
      this.musicBus.gain.value = 0.7;
      this.musicBus.connect(this.master);

      this.sfxBus = this.ctx.createGain();
      this.sfxBus.gain.value = 0.85;
      this.sfxBus.connect(this.master);
    }
    void this.ctx.resume();
  }

  async ensureRunning(): Promise<boolean> {
    this.resume();
    const ctx = this.ctx;
    if (!ctx) return false;
    if (ctx.state === "running") return true;
    try {
      await ctx.resume();
    } catch {
      return false;
    }
    return ctx.state !== "suspended" && ctx.state !== "closed";
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.master) this.master.gain.value = m ? 0 : 0.38;
    if (m) this.stopMusic();
    else if (this.musicTimer) this.startMusic();
  }

  toggleMuted() {
    this.setMuted(!this.muted);
    return this.muted;
  }

  isMuted() {
    return this.muted;
  }

  dispose() {
    this.stopMusic();
    void this.ctx?.close();
    this.ctx = null;
    this.master = null;
    this.musicBus = null;
    this.sfxBus = null;
    this.noiseBuffer = null;
  }

  startMusic() {
    if (this.muted || this.musicTimer) return;
    if (!this.ctx) this.resume();
    if (!this.ctx || this.ctx.state !== "running") return;
    this.startBassDrone();
    this.musicTimer = window.setInterval(() => this.tickArp(), BEAT_MS);
  }

  stopMusic() {
    if (this.musicTimer) {
      window.clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
    this.stopBassDrone();
    this.musicStep = 0;
  }

  private startBassDrone() {
    const ctx = this.ctx;
    const bus = this.musicBus;
    if (!ctx || !bus) return;
    this.stopBassDrone();
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 220;
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(55, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.12, t + 0.4);
    osc.connect(filter).connect(g).connect(bus);
    osc.start(t);
    this.bassOsc = osc;
    this.bassGain = g;
  }

  private stopBassDrone() {
    const ctx = this.ctx;
    const osc = this.bassOsc;
    const g = this.bassGain;
    if (!ctx || !osc || !g) return;
    const t = ctx.currentTime;
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
    osc.stop(t + 0.3);
    this.bassOsc = null;
    this.bassGain = null;
  }

  private tickArp() {
    const ctx = this.ctx;
    const bus = this.musicBus;
    if (!ctx || !bus || this.muted) return;

    const note = ARP_NOTES[this.musicStep % ARP_NOTES.length]!;
    this.musicStep++;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 2800;
    osc.type = "square";
    osc.frequency.setValueAtTime(note * 2, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.06, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
    osc.connect(filter).connect(g).connect(bus);
    osc.start(t);
    osc.stop(t + 0.16);
  }

  private dest() {
    return this.sfxBus ?? this.master;
  }

  private tone(
    type: OscillatorType,
    from: number,
    to: number,
    dur: number,
    gain = 1,
    delay = 0,
    bus = this.dest(),
  ) {
    const ctx = this.ctx;
    if (!ctx || !bus) return;
    const t = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(from, t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(bus);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  private chord(notes: number[], dur: number, gain = 0.25, delay = 0) {
    notes.forEach((f, i) => this.tone("triangle", f, f * 0.98, dur, gain, delay + i * 0.02));
  }

  private noise(dur: number, gain = 1, cutoff = 1500) {
    const ctx = this.ctx;
    const bus = this.dest();
    if (!ctx || !bus) return;
    if (!this.noiseBuffer) {
      const len = Math.floor(ctx.sampleRate * 0.5);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      this.noiseBuffer = buf;
    }
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = cutoff;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filter).connect(g).connect(bus);
    src.start(t);
    src.stop(t + dur);
  }

  gameStart() {
    this.chord([220, 277.18, 329.63, 440], 0.22, 0.35);
    this.tone("sawtooth", 880, 1320, 0.18, 0.3, 0.08);
    this.startMusic();
  }

  waveClear() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
      this.tone("square", f, f * 1.02, 0.14, 0.38, i * 0.07),
    );
  }

  bossAppear(kind: BossKind) {
    this.noise(0.5, 0.5, 400);
    if (kind === "octopus") {
      this.tone("sawtooth", 48, 32, 0.9, 0.55);
      this.tone("square", 90, 55, 0.7, 0.4, 0.05);
    } else {
      this.tone("sawtooth", 72, 45, 0.55, 0.45);
    }
    this.chord([98, 123.47, 146.83], 0.35, 0.3, 0.12);
  }

  bossAttack() {
    this.noise(0.12, 0.35, 2200);
    this.tone("sawtooth", 180, 90, 0.2, 0.35);
  }

  overdrive() {
    this.chord([392, 523.25, 659.25], 0.25, 0.4);
    this.tone("sawtooth", 660, 1200, 0.2, 0.35, 0.05);
  }

  /** Weapon fire — kept faint so BGM and other SFX stay audible. */
  shoot(weapon: WeaponId) {
    switch (weapon) {
      case "spread":
        this.tone("square", 820, 280, 0.09, 0.09);
        this.tone("square", 1040, 360, 0.08, 0.06, 0.012);
        this.noise(0.04, 0.03, 3000);
        break;
      case "rail":
        this.tone("sawtooth", 1800, 520, 0.16, 0.1);
        this.noise(0.06, 0.04, 4000);
        break;
      case "homing":
        this.tone("triangle", 620, 1100, 0.14, 0.09);
        this.tone("sine", 310, 580, 0.1, 0.05, 0.04);
        break;
      default:
        this.tone("square", 920, 280, 0.09, 0.1);
        this.tone("square", 460, 220, 0.06, 0.05, 0.02);
    }
  }

  step(low: boolean) {
    this.tone("square", low ? 92 : 116, low ? 88 : 112, 0.05, 0.28);
  }

  explosion() {
    this.noise(0.28, 0.65, 1800);
    this.tone("sawtooth", 280, 45, 0.22, 0.38);
    this.tone("square", 140, 60, 0.14, 0.22, 0.04);
  }

  ufo() {
    this.tone("sawtooth", 420, 780, 0.28, 0.32);
    this.tone("triangle", 210, 390, 0.22, 0.18, 0.06);
  }

  ufoHit() {
    this.tone("square", 1400, 320, 0.28, 0.55);
    this.chord([523.25, 659.25, 783.99], 0.12, 0.3);
  }

  pickup() {
    this.tone("triangle", 523, 1046, 0.1, 0.48);
    this.tone("triangle", 784, 1318, 0.1, 0.35, 0.05);
    this.tone("sine", 1046, 1568, 0.08, 0.22, 0.1);
  }

  shieldHit() {
    this.tone("square", 380, 200, 0.06, 0.28);
    this.noise(0.05, 0.18, 900);
  }

  shieldBreak() {
    this.noise(0.35, 0.55, 600);
    this.tone("sawtooth", 200, 40, 0.3, 0.4);
    [196, 155.56, 130.81].forEach((f, i) => this.tone("square", f, f * 0.7, 0.12, 0.25, i * 0.04));
  }

  playerDeath() {
    this.stopMusic();
    this.noise(0.5, 0.75, 1100);
    this.tone("sawtooth", 360, 40, 0.6, 0.52);
    this.chord([196, 155.56, 130.81], 0.4, 0.35, 0.08);
  }

  gameOver() {
    this.stopMusic();
    [392, 311.13, 261.63, 196].forEach((f, i) =>
      window.setTimeout(() => this.tone("triangle", f, f * 0.92, 0.32, 0.5), i * 180),
    );
  }
}
