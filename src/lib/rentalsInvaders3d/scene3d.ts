/** THREE scene + render loop that visualizes InvadersEngine3D. Dynamically
 *  imported by the game component so three.js only loads when you press play. */
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";

import { GameAudio3D, takeGameAudio } from "./audio3d";
import { HEX, SHIELD, WEAPONS, waveTheme } from "./constants3d";
import { InvadersEngine3D } from "./engine3d";
import {
  buildBoss,
  buildBullet,
  buildGridBackdrop,
  buildInvader,
  buildLoot,
  buildPlayer,
  buildShield,
  buildStarfield,
  buildUfo,
  LOOT_HEX,
} from "./meshes3d";
import type { GameState, Phase, PinObstacle } from "./types3d";

function disposeObject(obj: THREE.Object3D) {
  obj.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (mesh.geometry) mesh.geometry.dispose();
    const mat = mesh.material;
    if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
    else if (mat) (mat as THREE.Material).dispose();
  });
}

export type HudInfo = {
  score: number;
  highScore: number;
  lives: number;
  wave: number;
  weapon: string;
  overdrive: boolean;
  toast: string | null;
  boss: { hp: number; maxHp: number; name: string } | null;
};

export type GameController = {
  setKey: (action: "left" | "right" | "fire" | "pause", down: boolean) => void;
  togglePause: () => void;
  toggleMute: () => boolean;
  unlockAudio: () => Promise<boolean>;
  restart: () => void;
  dispose: () => void;
};

export type CreateGameOpts = {
  canvas: HTMLCanvasElement;
  getPins: () => PinObstacle[];
  onPhaseChange?: (phase: Phase, info: { score: number; highScore: number }) => void;
  onHud?: (hud: HudInfo) => void;
};

const MAX_PARTICLES = 1000;

export function createGame(opts: CreateGameOpts): GameController {
  const { canvas } = opts;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(new THREE.Color(0x070d18), 0.94);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x060c16, 0.0016);

  const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 2000);

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  // strength, radius, threshold — high threshold so only bright cores bloom (no white-out)
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.5, 0.4, 0.62);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  // lights (materials are emissive; these add gentle form)
  scene.add(new THREE.AmbientLight(0x33405f, 0.9));
  const p1 = new THREE.PointLight(HEX.cyan, 0.4, 0, 1.5);
  p1.position.set(-120, 80, 120);
  scene.add(p1);
  const p2 = new THREE.PointLight(HEX.magenta, 0.4, 0, 1.5);
  p2.position.set(120, -60, 120);
  scene.add(p2);

  const stars = buildStarfield(420);
  scene.add(stars);
  const grid = buildGridBackdrop();
  scene.add(grid);

  const playfield = new THREE.Group();
  playfield.rotation.x = -0.05;
  scene.add(playfield);

  // singletons
  const playerMesh = buildPlayer();
  playfield.add(playerMesh);
  const ufoMesh = buildUfo();
  ufoMesh.visible = false;
  playfield.add(ufoMesh);

  // pools
  const invaderMeshes = new Map<number, THREE.Group>();
  const playerBulletPool: THREE.Mesh[] = [];
  const enemyBulletPool: THREE.Mesh[] = [];
  const lootPool: THREE.Group[] = [];
  const shieldPool: THREE.Group[] = [];
  let bossMesh: THREE.Group | null = null;
  let bossKind: string | null = null;
  let themeWave = -1;

  // particle system
  const pGeo = new THREE.BufferGeometry();
  const pPos = new Float32Array(MAX_PARTICLES * 3);
  const pCol = new Float32Array(MAX_PARTICLES * 3);
  const pSize = new Float32Array(MAX_PARTICLES);
  pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
  pGeo.setAttribute("color", new THREE.BufferAttribute(pCol, 3));
  pGeo.setAttribute("size", new THREE.BufferAttribute(pSize, 1));
  // custom points so each debris chunk keeps its own size (big rocks + fine dust)
  const pMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: `
      attribute float size;
      attribute vec3 color;
      varying vec3 vColor;
      void main() {
        vColor = color;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size * (260.0 / max(1.0, -mv.z));
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      varying vec3 vColor;
      void main() {
        float d = length(gl_PointCoord - vec2(0.5));
        float a = smoothstep(0.5, 0.05, d);
        gl_FragColor = vec4(vColor, a);
      }`,
  });
  const particles = new THREE.Points(pGeo, pMat);
  particles.frustumCulled = false;
  playfield.add(particles);

  const audio = takeGameAudio();
  void audio.ensureRunning();

  let W = Math.max(1, canvas.clientWidth);
  let H = Math.max(1, canvas.clientHeight);

  const engine = new InvadersEngine3D(W, H, audio, {
    onPhaseChange: (phase, s) => opts.onPhaseChange?.(phase, { score: s.score, highScore: s.highScore }),
  });

  const lx = (x: number) => x - W / 2;
  const ly = (y: number) => H / 2 - y;

  function layout() {
    W = Math.max(1, canvas.clientWidth);
    H = Math.max(1, canvas.clientHeight);
    renderer.setSize(W, H, false);
    composer.setSize(W, H);
    bloom.setSize(W, H);

    const worldScale = 100 / H;
    playfield.scale.setScalar(worldScale);

    camera.aspect = W / H;
    const halfH = (100 / 2) * 1.16;
    camera.position.set(0, 0, halfH / Math.tan((camera.fov * Math.PI) / 360));
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();

    engine.setBounds(W, H);
  }
  layout();

  const ro = new ResizeObserver(() => layout());
  ro.observe(canvas);

  function getOrMakeBullet(pool: THREE.Mesh[], i: number): THREE.Mesh {
    let m = pool[i];
    if (!m) {
      m = buildBullet();
      pool[i] = m;
      playfield.add(m);
    }
    return m;
  }
  function getOrMakeLoot(i: number): THREE.Group {
    let m = lootPool[i];
    if (!m) {
      m = buildLoot();
      lootPool[i] = m;
      playfield.add(m);
    }
    return m;
  }
  function getOrMakeShield(i: number): THREE.Group {
    let m = shieldPool[i];
    if (!m) {
      m = buildShield();
      shieldPool[i] = m;
      playfield.add(m);
    }
    return m;
  }

  function syncInvaders(s: GameState, now: number) {
    const seen = new Set<number>();
    for (const inv of s.invaders) {
      const visible = inv.alive || inv.dying > 0;
      if (!visible) continue;
      seen.add(inv.id);
      let m = invaderMeshes.get(inv.id);
      if (!m) {
        m = buildInvader(inv.type);
        invaderMeshes.set(inv.id, m);
        playfield.add(m);
      }
      m.position.set(lx(inv.x), ly(inv.y) + Math.sin(now * 0.003 + inv.id) * 2, 0);
      m.rotation.y = now * 0.0012 + inv.id;
      const dyingScale = inv.dying > 0 ? 1 + (1 - inv.dying / 120) * 0.6 : 1;
      m.scale.setScalar(dyingScale);
      m.visible = inv.dying > 0 ? Math.floor(now / 40) % 2 === 0 : true;
    }
    for (const [id, mesh] of invaderMeshes) {
      if (!seen.has(id)) {
        playfield.remove(mesh);
        invaderMeshes.delete(id);
      }
    }
  }

  function applyBullet(m: THREE.Mesh, b: { x: number; y: number; vx: number; vy: number; hex: number }) {
    m.visible = true;
    m.position.set(lx(b.x), ly(b.y), 0);
    (m.userData.mat as THREE.MeshBasicMaterial).color.setHex(b.hex);
    m.rotation.z = Math.atan2(b.vy, b.vx) + Math.PI / 2;
  }

  function syncBullets(s: GameState) {
    for (let i = 0; i < s.playerBullets.length; i++) {
      applyBullet(getOrMakeBullet(playerBulletPool, i), s.playerBullets[i]!);
    }
    for (let i = s.playerBullets.length; i < playerBulletPool.length; i++) {
      playerBulletPool[i]!.visible = false;
    }
    for (let i = 0; i < s.enemyBullets.length; i++) {
      applyBullet(getOrMakeBullet(enemyBulletPool, i), s.enemyBullets[i]!);
    }
    for (let i = s.enemyBullets.length; i < enemyBulletPool.length; i++) {
      enemyBulletPool[i]!.visible = false;
    }
  }

  function syncLoot(s: GameState, now: number) {
    for (let i = 0; i < s.loot.length; i++) {
      const m = getOrMakeLoot(i);
      const l = s.loot[i]!;
      m.visible = true;
      m.position.set(lx(l.x), ly(l.y) + Math.sin(now * 0.005 + i) * 2, 0);
      m.rotation.y = l.spin;
      m.rotation.x = l.spin * 0.6;
      const hex = LOOT_HEX[l.type];
      const core = m.userData.coreMat as THREE.MeshStandardMaterial;
      core.color.setHex(hex).multiplyScalar(0.3);
      core.emissive.setHex(hex);
      (m.userData.cageMat as THREE.MeshBasicMaterial).color.setHex(hex);
    }
    for (let i = s.loot.length; i < lootPool.length; i++) {
      lootPool[i]!.visible = false;
    }
  }

  function syncShields(s: GameState, now: number) {
    const n = s.pins.length;
    for (let i = 0; i < Math.max(shieldPool.length, n); i++) {
      const pin = s.pins[i];
      if (!pin) {
        if (shieldPool[i]) shieldPool[i]!.visible = false;
        continue;
      }
      const m = getOrMakeShield(i);
      m.visible = true;
      m.position.set(lx(pin.x), ly(pin.y), 0);
      const breathe = 1 + Math.sin(now * 0.002 + i) * 0.03;
      m.scale.setScalar(pin.radius * breathe);

      const hp = s.shieldHp[i] ?? 0;
      const flashMs = s.shieldFlash[i] ?? 0;
      const flash = flashMs > 0;
      const t = hp / SHIELD.hp;
      const col = flash ? HEX.white : hp <= 0 ? HEX.red : HEX.gold;

      const bubble = m.userData.bubbleMat as THREE.MeshBasicMaterial;
      const ringMat = m.userData.ringMat as THREE.MeshStandardMaterial;
      const hexMesh = m.userData.hex as THREE.Mesh;
      const hexMat = m.userData.hexMat as THREE.MeshBasicMaterial;
      const coreMat = m.userData.coreMat as THREE.MeshStandardMaterial;
      const core = m.userData.core as THREE.Mesh;
      const rings = m.userData.rings as THREE.Mesh[];
      const ripple = m.userData.ripple as THREE.Mesh;
      const rippleMat = m.userData.rippleMat as THREE.MeshBasicMaterial;

      bubble.color.setHex(col);
      bubble.opacity = hp <= 0 ? 0.015 : 0.025 + t * 0.08;
      ringMat.emissive.setHex(col);
      ringMat.emissiveIntensity = hp <= 0 ? 0.2 : 0.4 + t * 0.7;
      hexMat.color.setHex(col);
      hexMat.opacity = hp <= 0 ? 0.05 : 0.1 + t * 0.22;
      hexMesh.rotation.set(now * 0.0005 + i, now * 0.0004, 0);

      // gyroscoping rings
      rings.forEach((r, ri) => {
        r.rotation.x = now * 0.0011 * (ri + 1) + ri;
        r.rotation.y = now * 0.0009 * (ri + 1);
      });

      // pulsing inner core
      core.scale.setScalar(0.75 + Math.sin(now * 0.005 + i) * 0.22 + t * 0.25);
      coreMat.emissive.setHex(col);
      coreMat.emissiveIntensity = hp <= 0 ? 0.3 : 1.0 + t * 0.8;

      // hit ripple (drives off the flash timer)
      const fv = flashMs / SHIELD.flashMs; // 1 → 0
      ripple.scale.setScalar(1 + (1 - fv) * 0.55);
      rippleMat.opacity = fv * 0.65;
      rippleMat.color.setHex(col);
    }
  }

  function applyTheme(wave: number) {
    if (wave === themeWave) return;
    themeWave = wave;
    const th = waveTheme(wave);
    renderer.setClearColor(new THREE.Color(th.bg), 0.94);
    (scene.fog as THREE.FogExp2).color.setHex(th.fog);
    const gm = grid.material as THREE.LineBasicMaterial;
    gm.vertexColors = false;
    gm.color.setHex(th.grid);
    gm.needsUpdate = true;
  }

  function syncBoss(s: GameState, now: number) {
    const b = s.boss;
    if (!b || !b.active) {
      if (bossMesh) bossMesh.visible = false;
      return;
    }
    if (bossKind !== b.kind) {
      if (bossMesh) {
        playfield.remove(bossMesh);
        disposeObject(bossMesh);
      }
      bossMesh = buildBoss(b.kind);
      playfield.add(bossMesh);
      bossKind = b.kind;
    }
    const mesh = bossMesh!;
    mesh.position.set(lx(b.x), ly(b.y), -4);
    mesh.visible = b.dying > 0 ? Math.floor(now / 50) % 2 === 0 : true;
    mesh.scale.setScalar(b.hitFlash > 0 ? 1.04 : 1);

    const core = mesh.userData.core as THREE.Mesh | undefined;
    if (core) core.scale.setScalar(1 + Math.sin(b.t * 0.006) * 0.22);

    if (b.kind === "octopus") {
      mesh.rotation.z = Math.sin(b.t * 0.0008) * 0.05;
      const tentacles = mesh.userData.tentacles as THREE.Object3D[][] | undefined;
      tentacles?.forEach((segs, ti) =>
        segs.forEach((seg, si) => {
          seg.rotation.z = Math.sin(b.t * 0.003 + ti * 0.7 + si * 0.55) * 0.24;
        }),
      );
    } else {
      mesh.rotation.z = Math.sin(b.t * 0.001) * 0.04;
    }
  }

  function syncParticles(s: GameState) {
    const count = Math.min(s.particles.length, MAX_PARTICLES);
    for (let i = 0; i < count; i++) {
      const p = s.particles[i]!;
      pPos[i * 3] = lx(p.x);
      pPos[i * 3 + 1] = ly(p.y) + p.z;
      pPos[i * 3 + 2] = p.z;
      const c = new THREE.Color(p.hex);
      const a = Math.max(0, p.life / p.maxLife);
      pCol[i * 3] = c.r * a;
      pCol[i * 3 + 1] = c.g * a;
      pCol[i * 3 + 2] = c.b * a;
      pSize[i] = p.size;
    }
    pGeo.setDrawRange(0, count);
    (pGeo.getAttribute("position") as THREE.BufferAttribute).needsUpdate = true;
    (pGeo.getAttribute("color") as THREE.BufferAttribute).needsUpdate = true;
    (pGeo.getAttribute("size") as THREE.BufferAttribute).needsUpdate = true;
  }

  function syncScene(s: GameState, now: number) {
    const blink = s.player.invuln > 0 && Math.floor(now / 90) % 2 === 0;
    playerMesh.visible = s.phase !== "over" && !blink;
    playerMesh.position.set(lx(s.player.x), ly(s.player.y), 6);
    playerMesh.rotation.z = ((s.keys.right ? -1 : 0) + (s.keys.left ? 1 : 0)) * 0.18;
    const eng = playerMesh.userData.engine as THREE.Mesh;
    eng.scale.setScalar(1 + Math.sin(now * 0.02) * 0.2 + (s.player.overdriveMs > 0 ? 0.6 : 0));

    ufoMesh.visible = s.ufo.active;
    if (s.ufo.active) {
      ufoMesh.position.set(lx(s.ufo.x), ly(s.ufo.y), 0);
      ufoMesh.rotation.y = now * 0.004;
    }

    applyTheme(s.wave);
    syncInvaders(s, now);
    syncBoss(s, now);
    syncBullets(s);
    syncLoot(s, now);
    syncShields(s, now);
    syncParticles(s);

    stars.rotation.z = now * 0.00002;
    grid.position.y = Math.sin(now * 0.0004) * 4;

    if (s.shake > 0) {
      const a = (s.shake / 240) * 1.4;
      camera.position.x = (Math.random() - 0.5) * a;
      camera.position.y = (Math.random() - 0.5) * a;
    } else {
      camera.position.x = 0;
      camera.position.y = 0;
    }
  }

  function hudOf(s: GameState): HudInfo {
    return {
      score: s.score,
      highScore: s.highScore,
      lives: s.lives,
      wave: s.wave,
      weapon: WEAPONS[s.player.weapon].name,
      overdrive: s.player.overdriveMs > 0,
      toast: s.toast?.text ?? null,
      boss:
        s.boss && s.boss.active
          ? { hp: Math.max(0, s.boss.hp), maxHp: s.boss.maxHp, name: s.boss.name }
          : null,
    };
  }

  let raf = 0;
  let last = performance.now();
  const loop = (now: number) => {
    const dt = now - last;
    last = now;
    engine.setPins(opts.getPins());
    engine.update(dt);
    const s = engine.getState();
    syncScene(s, now);
    composer.render();
    opts.onHud?.(hudOf(s));
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);

  return {
    setKey: (a, d) => engine.setKey(a, d),
    togglePause: () => engine.togglePause(),
    toggleMute: () => {
      const m = audio.toggleMuted();
      if (!m && engine.getState().phase === "playing") audio.startMusic();
      return m;
    },
    unlockAudio: () => audio.ensureRunning(),
    restart: () => engine.restart(),
    dispose: () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      audio.dispose();
      scene.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        const mat = (mesh as THREE.Mesh).material;
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
        else if (mat) (mat as THREE.Material).dispose();
      });
      composer.dispose();
      renderer.dispose();
    },
  };
}
