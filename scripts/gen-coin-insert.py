"""Generate a polished arcade coin-insert WAV (metal drop + credit chime)."""
import math
import random
import struct
import wave
from pathlib import Path

SR = 44100
out = Path(__file__).resolve().parents[1] / "public" / "arcade" / "coin-insert.wav"
out.parent.mkdir(parents=True, exist_ok=True)

n = int(SR * 0.72)
buf = [0.0] * n


def clamp(x: float) -> float:
    return max(-1.0, min(1.0, x))


def add_sine(
    freq: float,
    start: float,
    dur: float,
    amp: float,
    decay_pow: float = 2.2,
) -> None:
    s0 = int(start * SR)
    length = int(dur * SR)
    for i in range(length):
        if s0 + i >= n:
            break
        t = i / SR
        e = math.exp(-decay_pow * t / max(dur, 1e-4))
        a = min(1.0, i / (0.002 * SR))
        buf[s0 + i] += amp * a * e * math.sin(2 * math.pi * freq * t)


def add_noise_burst(start: float, dur: float, amp: float, seed: int = 0) -> None:
    s0 = int(start * SR)
    length = int(dur * SR)
    rng = random.Random(42 + seed)
    prev = 0.0
    for i in range(length):
        if s0 + i >= n:
            break
        t = i / SR
        e = math.exp(-8 * t / max(dur, 1e-4))
        white = rng.uniform(-1, 1)
        hp_s = white - prev
        prev = white * 0.6 + prev * 0.4
        buf[s0 + i] += amp * e * hp_s


# 1) Coin hits slot — bright metallic clink (inharmonic partials)
for f, a in [
    (2650, 0.35),
    (4120, 0.22),
    (5830, 0.12),
    (7900, 0.08),
    (1850, 0.15),
]:
    add_sine(f, 0.00, 0.09, a, decay_pow=18)
add_noise_burst(0.0, 0.04, 0.45, seed=1)

# 2) Tumble / rattle down chute
add_noise_burst(0.05, 0.06, 0.22, seed=2)
for delay, f, a in [
    (0.06, 2100, 0.12),
    (0.09, 3200, 0.1),
    (0.12, 1700, 0.09),
    (0.15, 2800, 0.07),
]:
    add_sine(f, delay, 0.05, a, decay_pow=22)
    add_noise_burst(delay, 0.03, 0.12, seed=int(delay * 1000))

# 3) Body thump — lands in coin box
add_sine(95, 0.17, 0.12, 0.28, decay_pow=12)
add_sine(140, 0.17, 0.08, 0.12, decay_pow=16)

# 4) Classic arcade CREDIT accept chime (iconic two-tone pattern)
add_sine(988, 0.22, 0.11, 0.32, decay_pow=9)
add_sine(988 * 2, 0.22, 0.08, 0.08, decay_pow=14)
add_sine(1319, 0.30, 0.16, 0.34, decay_pow=7)
add_sine(1319 * 2, 0.30, 0.1, 0.07, decay_pow=12)
add_sine(2637, 0.31, 0.06, 0.06, decay_pow=20)

peak = max(abs(x) for x in buf) or 1.0
gain = 0.92 / peak
frames = b"".join(struct.pack("<h", int(clamp(x * gain) * 32767)) for x in buf)

with wave.open(str(out), "w") as w:
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(frames)

print(f"wrote {out} ({out.stat().st_size} bytes)")
