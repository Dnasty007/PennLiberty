/** Procedural Web Audio — classic Tetris-ish bleeps. */
export class TetrisAudio {
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
      this.master.gain.value = 0.16;
      this.master.connect(this.ctx.destination);
    }
    void this.ctx.resume();
  }

  setMuted(muted: boolean) {
    if (this.master) this.master.gain.value = muted ? 0 : 0.16;
  }

  dispose() {
    void this.ctx?.close();
    this.ctx = null;
    this.master = null;
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
    g.gain.exponentialRampToValueAtTime(gain, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(master);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  move() {
    this.tone("square", 220, 200, 0.04, 0.25);
  }

  rotate() {
    this.tone("square", 440, 520, 0.06, 0.35);
  }

  lock() {
    this.tone("triangle", 160, 90, 0.08, 0.4);
  }

  lineClear(count: number) {
    const base = 400 + count * 80;
    this.tone("square", base, base * 1.5, 0.12, 0.45);
    if (count >= 4) {
      window.setTimeout(() => this.tone("square", 880, 1320, 0.2, 0.5), 80);
    }
  }

  gameOver() {
    const notes = [392, 349, 330, 262];
    notes.forEach((f, i) => {
      window.setTimeout(
        () => this.tone("triangle", f, f * 0.9, 0.22, 0.5),
        i * 140,
      );
    });
  }
}
