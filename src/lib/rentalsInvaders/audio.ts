/**
 * Procedural Web Audio — classic 1978 Space Invaders feel, no asset files.
 * Created lazily on first user gesture so AudioContext is allowed to run.
 */
export class GameAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private enabled = true;
  private noiseBuffer: AudioBuffer | null = null;
  /** 4-note march index (advances on each step()). */
  private marchIndex = 0;
  /** Classic descending bass-ish march frequencies (Hz). */
  private readonly marchNotes = [55, 58, 62, 65] as const;

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
    this.marchIndex = 0;
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

  /** Fixed-pitch blip (no ramp) — better for march thumps. */
  private blip(type: OscillatorType, freq: number, dur: number, gain = 1) {
    const ctx = this.ctx;
    const master = this.master;
    if (!ctx || !master) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(master);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  private noise(dur: number, gain = 1, cutoff = 1400) {
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
    filter.frequency.value = cutoff;
    filter.frequency.exponentialRampToValueAtTime(Math.max(200, cutoff * 0.35), t + dur);
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filter).connect(g).connect(master);
    src.start(t);
    src.stop(t + dur);
  }

  /** Player laser — rising-then-falling square zap. */
  shoot() {
    const ctx = this.ctx;
    const master = this.master;
    if (!ctx || !master) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(880, t);
    osc.frequency.linearRampToValueAtTime(1240, t + 0.04);
    osc.frequency.exponentialRampToValueAtTime(180, t + 0.14);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.55, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
    osc.connect(g).connect(master);
    osc.start(t);
    osc.stop(t + 0.16);
  }

  /**
   * Formation march — classic 4-note descending bass loop.
   * `frame` kept for API compat with engine; internal index advances every call.
   */
  step(_frame: 0 | 1) {
    const freq = this.marchNotes[this.marchIndex % this.marchNotes.length]!;
    this.marchIndex = (this.marchIndex + 1) % this.marchNotes.length;
    // Square thump with a hair of saw grit — short like the cabinet
    this.blip("square", freq, 0.09, 0.62);
    this.blip("sawtooth", freq * 0.5, 0.06, 0.18);
  }

  /** Invader / bunker hit — filtered noise burst. */
  explosion() {
    this.noise(0.2, 0.75, 1800);
    this.tone("square", 160, 40, 0.12, 0.25);
  }

  /** UFO fly-by — wobbly continuous-ish siren blip. */
  ufo() {
    const ctx = this.ctx;
    const master = this.master;
    if (!ctx || !master) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    const g = ctx.createGain();
    osc.type = "square";
    lfo.type = "sine";
    lfo.frequency.value = 7;
    lfoGain.gain.value = 40;
    osc.frequency.setValueAtTime(540, t);
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.32, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
    osc.connect(g).connect(master);
    osc.start(t);
    lfo.start(t);
    osc.stop(t + 0.3);
    lfo.stop(t + 0.3);
  }

  /** UFO destroyed — triumphant descending fanfare. */
  ufoHit() {
    const notes = [880, 1175, 1480, 880];
    notes.forEach((f, i) => {
      window.setTimeout(() => this.tone("square", f, f * 0.85, 0.1, 0.5), i * 55);
    });
    this.noise(0.18, 0.4, 2200);
  }

  playerDeath() {
    this.noise(0.45, 0.9, 1200);
    this.tone("sawtooth", 280, 48, 0.55, 0.55);
    this.tone("square", 200, 40, 0.4, 0.35);
  }

  gameOver() {
    // Descending arcade funeral march
    const steps = [392, 330, 262, 196, 147];
    steps.forEach((f, i) => {
      window.setTimeout(() => this.tone("square", f, f * 0.9, 0.3, 0.55), i * 170);
    });
  }
}
