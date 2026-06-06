/** THREE mesh/material builders for the remaster. Everything is authored in
 *  "game pixel" units; scene3d scales the whole playfield group to world units. */
import * as THREE from "three";
import { HEX, PLAYER, UFO, type BossKind, type LootType } from "./constants3d";

export const LOOT_HEX: Record<LootType, number> = {
  spread: HEX.cyan,
  rail: HEX.magenta,
  homing: HEX.green,
  overdrive: HEX.orange,
  life: HEX.red,
};

function neon(hex: number, intensity = 1.5): THREE.MeshStandardMaterial {
  const c = new THREE.Color(hex);
  return new THREE.MeshStandardMaterial({
    color: c.clone().multiplyScalar(0.32),
    emissive: c,
    // global tame so the scene reads as lit ships, not white blobs
    emissiveIntensity: intensity * 0.62,
    metalness: 0.4,
    roughness: 0.45,
  });
}

export function buildPlayer(): THREE.Group {
  const g = new THREE.Group();
  const bodyMat = neon(HEX.gold, 1.3);
  const accentMat = neon(HEX.goldLight, 1.8);

  const nose = new THREE.Mesh(new THREE.ConeGeometry(7, 22, 6), bodyMat);
  nose.position.y = 4;
  g.add(nose);

  const hull = new THREE.Mesh(new THREE.BoxGeometry(20, 8, 12), bodyMat);
  hull.position.y = -6;
  g.add(hull);

  const wingGeo = new THREE.BoxGeometry(10, 4, 8);
  const wl = new THREE.Mesh(wingGeo, accentMat);
  wl.position.set(-16, -7, 0);
  wl.rotation.z = 0.5;
  g.add(wl);
  const wr = wl.clone();
  wr.position.x = 16;
  wr.rotation.z = -0.5;
  g.add(wr);

  const engine = new THREE.Mesh(new THREE.SphereGeometry(4, 12, 12), neon(HEX.cyan, 2.2));
  engine.position.y = -12;
  g.add(engine);
  g.userData.engine = engine;

  g.scale.setScalar(PLAYER.width / 40);
  return g;
}

/** Five detailed alien archetypes (type = mesh design index). Authored in px. */
export function buildInvader(type: number): THREE.Group {
  const g = new THREE.Group();
  switch (type) {
    case 0: {
      // Scout — cyan manta dart
      const body = new THREE.Mesh(new THREE.IcosahedronGeometry(8, 0), neon(HEX.cyan, 1.3));
      body.scale.set(1.35, 0.7, 1);
      g.add(body);
      const wing = new THREE.Mesh(new THREE.ConeGeometry(4, 15, 4), neon(HEX.cyan, 1.0));
      wing.rotation.z = Math.PI / 2;
      wing.position.x = -11;
      g.add(wing);
      const wr = wing.clone();
      wr.position.x = 11;
      wr.rotation.z = -Math.PI / 2;
      g.add(wr);
      const eye = new THREE.Mesh(new THREE.SphereGeometry(2.4, 8, 8), neon(HEX.white, 2));
      eye.position.z = 4;
      g.add(eye);
      break;
    }
    case 1: {
      // Drone — magenta saucer with dome + under-lights
      const disc = new THREE.Mesh(new THREE.CylinderGeometry(13, 15, 4, 18), neon(HEX.magenta, 1.2));
      g.add(disc);
      const dome = new THREE.Mesh(new THREE.SphereGeometry(7, 16, 12), neon(HEX.cyan, 1.4));
      dome.scale.y = 0.7;
      dome.position.y = 3;
      g.add(dome);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(15, 1.2, 8, 24), neon(HEX.white, 1.0));
      ring.rotation.x = Math.PI / 2;
      g.add(ring);
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI * 2;
        const l = new THREE.Mesh(new THREE.SphereGeometry(1.6, 8, 8), neon(HEX.goldLight, 2));
        l.position.set(Math.cos(a) * 9, -2.5, Math.sin(a) * 9);
        g.add(l);
      }
      break;
    }
    case 2: {
      // Gunship — orange heavy cruiser
      g.add(new THREE.Mesh(new THREE.BoxGeometry(30, 14, 14), neon(HEX.orange, 1.05)));
      const cockpit = new THREE.Mesh(new THREE.SphereGeometry(5, 12, 10), neon(HEX.red, 1.8));
      cockpit.position.set(0, 2, 7);
      g.add(cockpit);
      const cannon = new THREE.CylinderGeometry(2, 2, 12, 8);
      const cl = new THREE.Mesh(cannon, neon(HEX.red, 1.2));
      cl.position.set(-11, -7, 4);
      g.add(cl);
      const cr = cl.clone();
      cr.position.x = 11;
      g.add(cr);
      const pod = new THREE.BoxGeometry(5, 8, 8);
      const pl = new THREE.Mesh(pod, neon(HEX.orange, 0.95));
      pl.position.set(-17, 0, 0);
      g.add(pl);
      const pr = pl.clone();
      pr.position.x = 17;
      g.add(pr);
      break;
    }
    case 3: {
      // Stinger — green wasp interceptor
      g.add(new THREE.Mesh(new THREE.CapsuleGeometry(5, 14, 6, 10), neon(HEX.green, 1.3)));
      const stinger = new THREE.Mesh(new THREE.ConeGeometry(3, 10, 8), neon(HEX.white, 1.6));
      stinger.position.y = -13;
      stinger.rotation.x = Math.PI;
      g.add(stinger);
      const wingMat = new THREE.MeshBasicMaterial({
        color: HEX.green,
        transparent: true,
        opacity: 0.4,
        side: THREE.DoubleSide,
      });
      const wing = new THREE.Mesh(new THREE.CircleGeometry(8, 12), wingMat);
      wing.position.set(-8, 4, 0);
      wing.rotation.y = 0.5;
      g.add(wing);
      const w2 = wing.clone();
      w2.position.x = 8;
      w2.rotation.y = -0.5;
      g.add(w2);
      const eye = new THREE.Mesh(new THREE.SphereGeometry(2.6, 8, 8), neon(HEX.red, 2));
      eye.position.set(0, 6, 4);
      g.add(eye);
      break;
    }
    default: {
      // Brute — red armored tank (3 hp)
      g.add(new THREE.Mesh(new THREE.DodecahedronGeometry(13, 0), neon(HEX.red, 0.95)));
      g.add(new THREE.Mesh(new THREE.SphereGeometry(6, 12, 12), neon(HEX.orange, 2)));
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        const sp = new THREE.Mesh(new THREE.ConeGeometry(3, 9, 6), neon(HEX.red, 1.2));
        sp.position.set(Math.cos(a) * 13, Math.sin(a) * 13, 0);
        sp.rotation.z = -a + Math.PI / 2;
        g.add(sp);
      }
      break;
    }
  }
  return g;
}

function buildTentacle(color: number): { root: THREE.Group; segments: THREE.Object3D[] } {
  const root = new THREE.Group();
  const segCount = 7;
  const segLen = 15;
  const segments: THREE.Object3D[] = [];
  let parent: THREE.Object3D = root;
  const mat = neon(color, 1.0);
  for (let i = 0; i < segCount; i++) {
    const seg = new THREE.Group();
    if (i > 0) seg.position.y = -segLen;
    const r = 4 * (1 - (i / segCount) * 0.75);
    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(Math.max(0.6, r * 0.7), r, segLen, 6),
      mat,
    );
    mesh.position.y = -segLen / 2;
    seg.add(mesh);
    parent.add(seg);
    parent = seg;
    segments.push(seg);
  }
  return { root, segments };
}

function buildOctopus(): THREE.Group {
  const g = new THREE.Group();
  const headR = 46;
  const head = new THREE.Mesh(new THREE.SphereGeometry(headR, 24, 18), neon(HEX.magenta, 0.85));
  head.scale.set(1.1, 0.92, 1);
  g.add(head);

  const ridge = new THREE.Mesh(new THREE.TorusGeometry(headR * 0.7, 4, 10, 28), neon(HEX.cyan, 1.1));
  ridge.rotation.x = Math.PI / 2;
  ridge.position.y = headR * 0.2;
  g.add(ridge);

  const eyeMat = neon(0xffe66b, 2.2);
  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(8, 14, 12), eyeMat);
  eyeL.position.set(-16, 2, headR * 0.66);
  g.add(eyeL);
  const eyeR = eyeL.clone();
  eyeR.position.x = 16;
  g.add(eyeR);
  const pupilMat = new THREE.MeshBasicMaterial({ color: 0x120016 });
  const pL = new THREE.Mesh(new THREE.SphereGeometry(3.4, 10, 10), pupilMat);
  pL.position.set(-16, 2, headR * 0.66 + 5);
  g.add(pL);
  const pR = pL.clone();
  pR.position.x = 16;
  g.add(pR);

  const beak = new THREE.Mesh(new THREE.ConeGeometry(7, 12, 6), neon(HEX.orange, 1.4));
  beak.position.set(0, -headR * 0.5, headR * 0.5);
  beak.rotation.x = Math.PI;
  g.add(beak);

  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(14, 1), neon(HEX.cyan, 2.2));
  core.position.set(0, -headR * 0.18, 0);
  g.add(core);

  const tentacles: THREE.Object3D[][] = [];
  const N = 8;
  for (let i = 0; i < N; i++) {
    const fx = i / (N - 1) - 0.5;
    const { root, segments } = buildTentacle(i % 2 ? HEX.magenta : HEX.cyan);
    root.position.set(fx * headR * 1.45, -headR * 0.52, (Math.random() - 0.5) * 18);
    root.rotation.z = -fx * 0.85;
    g.add(root);
    tentacles.push(segments);
  }

  g.userData.core = core;
  g.userData.eyeMat = eyeMat;
  g.userData.tentacles = tentacles;
  return g;
}

function buildWarship(kind: BossKind): THREE.Group {
  const g = new THREE.Group();
  const big = kind === "cruiser";
  const w = big ? 130 : 96;
  const h = big ? 46 : 38;
  const accent = big ? HEX.orange : HEX.red;

  g.add(new THREE.Mesh(new THREE.BoxGeometry(w, h * 0.5, 40), neon(accent, 0.9)));

  const bridge = new THREE.Mesh(new THREE.SphereGeometry(h * 0.3, 16, 12), neon(HEX.cyan, 1.4));
  bridge.scale.y = 0.6;
  bridge.position.set(0, h * 0.28, 10);
  g.add(bridge);

  for (let i = -1; i <= 1; i++) {
    const t = new THREE.Mesh(new THREE.SphereGeometry(6, 10, 8), neon(HEX.red, 1.8));
    t.position.set(i * w * 0.28, -h * 0.18, 14);
    g.add(t);
  }

  const wing = new THREE.Mesh(new THREE.BoxGeometry(w * 1.05, 6, 16), neon(accent, 0.7));
  wing.position.y = -h * 0.28;
  g.add(wing);

  const engL = new THREE.Mesh(new THREE.SphereGeometry(7, 12, 12), neon(HEX.cyan, 2));
  engL.position.set(-w * 0.5, -h * 0.1, -8);
  g.add(engL);
  const engR = engL.clone();
  engR.position.x = w * 0.5;
  g.add(engR);

  g.userData.core = bridge;
  return g;
}

export function buildBoss(kind: BossKind): THREE.Group {
  return kind === "octopus" ? buildOctopus() : buildWarship(kind);
}

export function buildUfo(): THREE.Group {
  const g = new THREE.Group();
  const dome = new THREE.Mesh(new THREE.SphereGeometry(12, 18, 12), neon(HEX.cyan, 1.8));
  dome.scale.y = 0.5;
  g.add(dome);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(16, 3, 10, 28), neon(HEX.gold, 1.6));
  rim.rotation.x = Math.PI / 2;
  g.add(rim);
  g.scale.setScalar(UFO.width / 36);
  return g;
}

export function buildBullet(): THREE.Mesh {
  const mat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(2, 10, 4, 8), mat);
  mesh.userData.mat = mat;
  return mesh;
}

export function buildLoot(): THREE.Group {
  const g = new THREE.Group();
  const coreMat = neon(HEX.gold, 1.8);
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(9), coreMat);
  g.add(core);
  const cageMat = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true });
  const cage = new THREE.Mesh(new THREE.IcosahedronGeometry(13, 0), cageMat);
  g.add(cage);
  g.userData.coreMat = coreMat;
  g.userData.cageMat = cageMat;
  return g;
}

/** Shield bubble authored at radius 1 — scaled to each pin's radius at runtime.
 *  Three crossed gyro-rings, a pulsing core, a faceted field, and a hit-ripple. */
export function buildShield(): THREE.Group {
  const g = new THREE.Group();

  const bubbleMat = new THREE.MeshBasicMaterial({
    color: HEX.gold,
    transparent: true,
    opacity: 0.05,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  g.add(new THREE.Mesh(new THREE.SphereGeometry(1, 20, 16), bubbleMat));

  const ringMat = neon(HEX.gold, 1.0);
  const rings: THREE.Mesh[] = [];
  for (let i = 0; i < 3; i++) {
    const r = new THREE.Mesh(new THREE.TorusGeometry(1, 0.045, 8, 36), ringMat);
    r.rotation.set(i * 1.1, i * 0.7, 0);
    g.add(r);
    rings.push(r);
  }

  const hexMat = new THREE.MeshBasicMaterial({
    color: HEX.goldLight,
    wireframe: true,
    transparent: true,
    opacity: 0.18,
    depthWrite: false,
  });
  const hex = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), hexMat);
  g.add(hex);

  const coreMat = neon(HEX.goldLight, 1.6);
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.3, 0), coreMat);
  g.add(core);

  const rippleMat = new THREE.MeshBasicMaterial({
    color: HEX.white,
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const ripple = new THREE.Mesh(new THREE.RingGeometry(0.92, 1.02, 32), rippleMat);
  g.add(ripple);

  g.userData.bubbleMat = bubbleMat;
  g.userData.ringMat = ringMat;
  g.userData.hexMat = hexMat;
  g.userData.coreMat = coreMat;
  g.userData.hex = hex;
  g.userData.core = core;
  g.userData.rings = rings;
  g.userData.ripple = ripple;
  g.userData.rippleMat = rippleMat;
  return g;
}

export function buildStarfield(count: number): THREE.Points {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 600;
    pos[i * 3 + 1] = (Math.random() - 0.5) * 400;
    pos[i * 3 + 2] = -40 - Math.random() * 260;
  }
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({
    color: 0x9fd8ff,
    size: 1.5,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.6,
  });
  return new THREE.Points(geo, mat);
}

export function buildGridBackdrop(): THREE.GridHelper {
  // Both colors dim blue — no bright center cross, just a subtle backdrop.
  const grid = new THREE.GridHelper(440, 44, 0x16304f, 0x0e2138);
  grid.rotation.x = Math.PI / 2;
  grid.position.z = -75;
  (grid.material as THREE.Material).transparent = true;
  (grid.material as THREE.Material).opacity = 0.16;
  return grid;
}
