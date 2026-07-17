/**
 * Centipede-style shooter for Penn Liberty Arcade.
 * Move · shoot · mushrooms · multi-segment centipede splits.
 */
import {
  BeepAudio,
  bootLoop,
  clamp,
  drawCenterText,
  drawCrtPlate,
  drawHudBar,
  loadHs,
  rand,
  saveHs,
  type ClassicController,
  type CreateClassicOpts,
  type HudInfo,
  type Phase,
} from "@/lib/arcade/shared";

const HS_KEY = "pl-arcade-centipede-hs";
const TITLE = "CENTIPEDE";

type Pt = { x: number; y: number };
type Seg = { x: number; y: number };
type Centi = { segs: Seg[]; dir: 1 | -1; drop: boolean };
type Bullet = { x: number; y: number; alive: boolean };
type Mushroom = { x: number; y: number; hp: number };

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
  let lives = 3;
  let wave = 1;

  let cols = 20;
  let rows = 22;
  let cell = 14;
  let ox = 0;
  let oy = 48;

  let player: Pt = { x: 10, y: 20 };
  let bullets: Bullet[] = [];
  let mushrooms: Mushroom[] = [];
  let centipedes: Centi[] = [];
  let fireCd = 0;
  let stepAcc = 0;
  let stepMs = 140;
  let fireWas = false;
  let pauseWas = false;
  const keys = {
    left: false,
    right: false,
    up: false,
    down: false,
    fire: false,
    pause: false,
  };

  const hud = (): HudInfo => ({
    score,
    highScore,
    extra: `W${wave} · ♥${lives}`,
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
    const playH = Math.max(120, h - 56);
    const playW = Math.max(120, w - 12);
    cell = Math.floor(Math.min(playW / 22, playH / 24));
    cell = Math.max(10, Math.min(18, cell));
    cols = Math.floor(playW / cell);
    rows = Math.floor(playH / cell);
    ox = Math.floor((w - cols * cell) / 2);
    oy = 48 + Math.floor((playH - rows * cell) / 2);
  };

  const mushAt = (x: number, y: number) =>
    mushrooms.find((m) => m.x === x && m.y === y && m.hp > 0);

  const spawnMushrooms = () => {
    mushrooms = [];
    const count = 18 + wave * 2;
    for (let i = 0; i < count; i++) {
      const x = Math.floor(rand(0, cols));
      const y = Math.floor(rand(1, rows - 5));
      if (!mushAt(x, y)) mushrooms.push({ x, y, hp: 4 });
    }
  };

  const spawnCenti = () => {
    const len = Math.min(12, 8 + Math.floor(wave / 2));
    const segs: Seg[] = [];
    for (let i = 0; i < len; i++) segs.push({ x: i, y: 0 });
    centipedes = [{ segs, dir: 1, drop: false }];
    stepMs = Math.max(70, 150 - wave * 8);
  };

  const softReset = () => {
    score = 0;
    lives = 3;
    wave = 1;
    layout();
    player = { x: Math.floor(cols / 2), y: rows - 2 };
    bullets = [];
    spawnMushrooms();
    spawnCenti();
    fireCd = 0;
    stepAcc = 0;
    emitHud();
  };

  softReset();

  const killPlayer = () => {
    lives -= 1;
    audio.die();
    emitHud();
    if (lives <= 0) {
      maybeHs();
      setPhase("over");
    } else {
      player = { x: Math.floor(cols / 2), y: rows - 2 };
      bullets = [];
      spawnCenti();
    }
  };

  const splitCenti = (ci: number, hitIdx: number) => {
    const c = centipedes[ci]!;
    const left = c.segs.slice(0, hitIdx);
    const right = c.segs.slice(hitIdx + 1);
    centipedes.splice(ci, 1);
    if (left.length) {
      centipedes.push({
        segs: left,
        dir: (c.dir * -1) as 1 | -1,
        drop: false,
      });
    }
    if (right.length) {
      centipedes.push({
        segs: right,
        dir: c.dir,
        drop: false,
      });
    }
  };

  const playerCell = () => ({
    x: Math.round(player.x),
    y: Math.round(player.y),
  });

  /** Segment touches ship (player uses smooth floats — must round). */
  const hitsPlayer = (sx: number, sy: number) => {
    const p = playerCell();
    return sx === p.x && sy === p.y;
  };

  const stepCentipedes = () => {
    for (const c of centipedes) {
      if (!c.segs.length) continue;
      const head = c.segs[0]!;
      let nx = head.x + c.dir;
      let ny = head.y;
      const blocked =
        nx < 0 || nx >= cols || mushAt(nx, ny) || c.drop;
      if (blocked) {
        c.dir = (c.dir * -1) as 1 | -1;
        ny = head.y + 1;
        nx = head.x;
        c.drop = false;
        // Reached past the bottom of the field → invasion: lose a life
        if (ny >= rows) {
          killPlayer();
          return;
        }
      }
      // move body
      for (let i = c.segs.length - 1; i > 0; i--) {
        c.segs[i] = { ...c.segs[i - 1]! };
      }
      c.segs[0] = { x: nx, y: ny };

      // Any segment on the bottom row of the playfield also costs a life
      // (classic “they got through” — no endless side-scroll on the floor)
      for (const s of c.segs) {
        if (s.y >= rows - 1) {
          killPlayer();
          return;
        }
        if (hitsPlayer(s.x, s.y)) {
          killPlayer();
          return;
        }
      }
    }
    centipedes = centipedes.filter((c) => c.segs.length > 0);
    if (centipedes.length === 0 && phase === "playing") {
      wave += 1;
      score += 200;
      maybeHs();
      audio.win();
      spawnMushrooms();
      spawnCenti();
      emitHud();
    }
  };

  const tick = (dt: number) => {
    if (keys.pause && !pauseWas) {
      if (phase === "playing") setPhase("paused");
      else if (phase === "paused") setPhase("playing");
    }
    pauseWas = keys.pause;

    if (phase === "ready" || phase === "over") {
      if (keys.fire && !fireWas) {
        softReset();
        setPhase("playing");
      }
      fireWas = keys.fire;
      return;
    }
    if (phase !== "playing") {
      fireWas = keys.fire;
      return;
    }

    // player move in lower zone (grid units)
    const minY = rows - 6;
    const spd = 9 * (dt / 1000);
    if (keys.left) player.x -= spd;
    if (keys.right) player.x += spd;
    if (keys.up) player.y -= spd;
    if (keys.down) player.y += spd;
    player.x = clamp(player.x, 0, cols - 1);
    player.y = clamp(player.y, minY, rows - 1);

    fireCd -= dt;
    if (keys.fire && fireCd <= 0) {
      bullets.push({
        x: Math.round(player.x),
        y: Math.round(player.y) - 0.4,
        alive: true,
      });
      fireCd = 170;
      audio.blip(500);
    }
    fireWas = keys.fire;

    for (const b of bullets) {
      if (!b.alive) continue;
      b.y -= 14 * (dt / 1000) * 3.2;
      if (b.y < 0) b.alive = false;
      const bx = Math.round(b.x);
      const by = Math.round(b.y);
      const m = mushAt(bx, by);
      if (m) {
        m.hp -= 1;
        b.alive = false;
        if (m.hp <= 0) {
          score += 5;
          audio.hit(200);
        }
        continue;
      }
      for (let ci = 0; ci < centipedes.length; ci++) {
        const c = centipedes[ci]!;
        for (let si = 0; si < c.segs.length; si++) {
          const s = c.segs[si]!;
          if (s.x === bx && s.y === by) {
            b.alive = false;
            score += si === 0 ? 100 : 10;
            mushrooms.push({ x: s.x, y: s.y, hp: 4 });
            splitCenti(ci, si);
            audio.score();
            maybeHs();
            emitHud();
            break;
          }
        }
        if (!b.alive) break;
      }
    }
    bullets = bullets.filter((b) => b.alive);
    mushrooms = mushrooms.filter((m) => m.hp > 0);

    stepAcc += dt;
    while (stepAcc >= stepMs) {
      stepAcc -= stepMs;
      stepCentipedes();
      if (phase !== "playing") break;
    }
  };

  const paint = (ctx: CanvasRenderingContext2D) => {
    drawCrtPlate(ctx, w, h);
    drawHudBar(ctx, TITLE, score, highScore, w, `W${wave} ♥${lives}`);

    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.fillRect(ox, oy, cols * cell, rows * cell);
    ctx.strokeStyle = "rgba(51,255,102,0.25)";
    ctx.strokeRect(ox, oy, cols * cell, rows * cell);

    for (const m of mushrooms) {
      if (m.hp <= 0) continue;
      const a = 0.35 + m.hp * 0.15;
      ctx.fillStyle = `rgba(244,223,180,${a})`;
      ctx.fillRect(
        ox + m.x * cell + 2,
        oy + m.y * cell + 2,
        cell - 4,
        cell - 4,
      );
    }

    for (const c of centipedes) {
      c.segs.forEach((s, i) => {
        ctx.fillStyle = i === 0 ? "#33ff66" : "#86efac";
        ctx.beginPath();
        ctx.arc(
          ox + s.x * cell + cell / 2,
          oy + s.y * cell + cell / 2,
          cell * 0.38,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      });
    }

    for (const b of bullets) {
      if (!b.alive) continue;
      ctx.fillStyle = "#fde047";
      ctx.fillRect(
        ox + b.x * cell + cell * 0.4,
        oy + b.y * cell,
        cell * 0.2,
        cell * 0.5,
      );
    }

    // player ship
    const px = ox + player.x * cell + cell / 2;
    const py = oy + player.y * cell + cell / 2;
    ctx.fillStyle = "#5ec8ff";
    ctx.beginPath();
    ctx.moveTo(px, py - cell * 0.35);
    ctx.lineTo(px - cell * 0.35, py + cell * 0.3);
    ctx.lineTo(px + cell * 0.35, py + cell * 0.3);
    ctx.closePath();
    ctx.fill();

    if (phase === "ready") {
      drawCenterText(ctx, ["CENTIPEDE", "ARROWS MOVE · SPACE FIRE", "BLAST THE BUG"], w, h);
    } else if (phase === "paused") {
      drawCenterText(ctx, ["PAUSED"], w, h);
    } else if (phase === "over") {
      drawCenterText(ctx, ["GAME OVER", `SCORE ${score}`, "SPACE RETRY"], w, h, "#ff6688");
    }
  };

  const loop = bootLoop(
    canvas,
    tick,
    paint,
    (nw, nh) => {
      w = nw;
      h = nh;
      layout();
      player.x = clamp(player.x, 0, cols - 1);
      player.y = clamp(player.y, rows - 6, rows - 1);
    },
  );

  return {
    setKey: (action, down) => {
      if (action === "left") keys.left = down;
      else if (action === "right") keys.right = down;
      else if (action === "up") keys.up = down;
      else if (action === "down") keys.down = down;
      else if (action === "fire") keys.fire = down;
      else if (action === "pause") keys.pause = down;
    },
    pointer: (kind, x, y) => {
      if (kind === "move" || kind === "down") {
        player.x = clamp((x - ox) / cell, 0, cols - 1);
        player.y = clamp((y - oy) / cell, rows - 6, rows - 1);
      }
      if (kind === "down") {
        if (phase === "ready" || phase === "over") {
          softReset();
          setPhase("playing");
        } else if (phase === "playing" && fireCd <= 0) {
          bullets.push({
            x: Math.round(player.x),
            y: Math.round(player.y) - 0.4,
            alive: true,
          });
          fireCd = 160;
          audio.blip(500);
        }
      }
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
