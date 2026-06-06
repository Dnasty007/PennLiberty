/**
 * Procedural Web Audio bleeps — no asset files. Created lazily on the first
 * user gesture (game start) so the AudioContext is allowed to run.
 */
export class GameAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private enabled = true;
  private noiseBuffer: AudioBuffer | null = null;

  /** Call from within a user gesture (launcher click) to unlock audio. */
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
      this.master.gain.value = 0.18;
      this.master.connect(this.ctx.destination);
    }
    void this.ctx.resume();
  }

  setMuted(muted: boolean) {
    if (this.master) this.master.gain.value = muted ? 0 : 0.18;
  }

  dispose() {
    void this.ctx?.close();
    this.ctx = null;
    this.master = null;
    this.noiseBuffer = null;
  }

  private tone(
    type: OscillatorType,
    from: number,
    to: number,
    dur: number,
    gain = 1,
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

  private noise(dur: number, gain = 1) {
    const ctx = this.ctx;
    const master = this.master;
    if (!ctx || !master) return;
    if (!this.noiseBuffer) {
      const len = Math.floor(ctx.sampleRate * 0.4);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      this.noiseBuffer = buf;
    }
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const g = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 1400;
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filter).connect(g).connect(master);
    src.start(t);
    src.stop(t + dur);
  }

  shoot() {
    this.tone("square", 880, 220, 0.12, 0.6);
  }

  step(frame: 0 | 1) {
    this.tone("square", frame === 0 ? 120 : 96, frame === 0 ? 118 : 94, 0.07, 0.5);
  }

  explosion() {
    this.noise(0.22, 0.7);
  }

  ufo() {
    this.tone("sawtooth", 520, 660, 0.18, 0.35);
  }

  ufoHit() {
    this.tone("square", 1200, 300, 0.25, 0.6);
  }

  playerDeath() {
    this.noise(0.4, 0.9);
    this.tone("sawtooth", 300, 60, 0.5, 0.5);
  }

  gameOver() {
    const steps = [440, 330, 247, 165];
    steps.forEach((f, i) => {
      window.setTimeout(() => this.tone("triangle", f, f * 0.92, 0.28, 0.6), i * 160);
    });
  }
}
