import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import * as pdfjsLib from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

const REPORT_URL = "/owners/sample-market-report.pdf";
const GOLD = 0xd6b06a;

/** Render page 1 of the sample report to a canvas — used as the 3D cover
 *  texture on desktop and shown directly as the cover image on mobile. */
async function renderCoverCanvas(targetWidth: number): Promise<HTMLCanvasElement> {
  const task = pdfjsLib.getDocument({ url: REPORT_URL });
  try {
    const doc = await task.promise;
    const page = await doc.getPage(1);
    const base = page.getViewport({ scale: 1 });
    const scale = targetWidth / base.width;
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, canvas, viewport }).promise;
    return canvas;
  } finally {
    void task.destroy();
  }
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return reduced;
}

type ReportShowcase3DProps = {
  onOpen: () => void;
  /** Static (no WebGL) presentation — used on phones and small screens. */
  flat?: boolean;
};

/** The sample report as a physical object: its real cover (rendered by pdf.js)
 *  textured onto a floating gold-edged document that leans toward the cursor,
 *  ringed by drifting gold motes. Click opens the full reader. */
export default function ReportShowcase3D({ onOpen, flat = false }: ReportShowcase3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const reducedMotion = usePrefersReducedMotion();
  const useFlat = flat || reducedMotion;

  /* Flat mode: render the cover once, show as an <img> */
  useEffect(() => {
    if (!useFlat) return;
    let cancelled = false;
    renderCoverCanvas(560)
      .then((canvas) => {
        if (!cancelled) setCoverUrl(canvas.toDataURL("image/jpeg", 0.92));
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [useFlat]);

  /* 3D mode */
  useEffect(() => {
    if (useFlat) return;
    const mount = mountRef.current;
    if (!mount) return;

    let disposed = false;
    let raf = 0;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.domElement.style.display = "block";
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 50);
    camera.position.set(0, 0, 5.4);

    scene.add(new THREE.AmbientLight(0xffffff, 0.9));
    const key = new THREE.DirectionalLight(0xffffff, 1.35);
    key.position.set(2.4, 3.2, 4.2);
    scene.add(key);
    const rim = new THREE.PointLight(GOLD, 14, 0, 2);
    rim.position.set(-3.2, -1.4, -2.4);
    scene.add(rim);

    const group = new THREE.Group();
    scene.add(group);

    /* The document — thin gold-edged slab; cover texture lands on the front */
    const W = 2.16;
    const H = 2.8;
    const geo = new THREE.BoxGeometry(W, H, 0.05);
    const edgeMat = new THREE.MeshStandardMaterial({
      color: GOLD,
      metalness: 0.85,
      roughness: 0.32,
    });
    const backMat = new THREE.MeshStandardMaterial({
      color: 0x0d1a2c,
      metalness: 0.35,
      roughness: 0.5,
    });
    const frontMat = new THREE.MeshStandardMaterial({
      color: 0xf5f2ec,
      roughness: 0.55,
      metalness: 0.04,
    });
    const doc = new THREE.Mesh(geo, [edgeMat, edgeMat, edgeMat, edgeMat, frontMat, backMat]);
    group.add(doc);

    /* Gold motes drifting around the document */
    const MOTES = 56;
    const motePos = new Float32Array(MOTES * 3);
    for (let i = 0; i < MOTES; i++) {
      const r = 2.1 + Math.random() * 1.1;
      const theta = Math.random() * Math.PI * 2;
      const y = (Math.random() - 0.5) * 3.4;
      motePos[i * 3] = Math.cos(theta) * r;
      motePos[i * 3 + 1] = y;
      motePos[i * 3 + 2] = Math.sin(theta) * r - 0.6;
    }
    const moteGeo = new THREE.BufferGeometry();
    moteGeo.setAttribute("position", new THREE.BufferAttribute(motePos, 3));
    const spriteCanvas = document.createElement("canvas");
    spriteCanvas.width = spriteCanvas.height = 64;
    const sctx = spriteCanvas.getContext("2d")!;
    const grad = sctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, "rgba(244,223,180,1)");
    grad.addColorStop(0.4, "rgba(214,176,106,0.55)");
    grad.addColorStop(1, "rgba(214,176,106,0)");
    sctx.fillStyle = grad;
    sctx.fillRect(0, 0, 64, 64);
    const moteMat = new THREE.PointsMaterial({
      size: 0.085,
      map: new THREE.CanvasTexture(spriteCanvas),
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      opacity: 0.85,
    });
    const motes = new THREE.Points(moteGeo, moteMat);
    scene.add(motes);

    /* Cover texture — real page 1, rendered by pdf.js */
    let coverTex: THREE.CanvasTexture | null = null;
    renderCoverCanvas(1024)
      .then((canvas) => {
        if (disposed) return;
        coverTex = new THREE.CanvasTexture(canvas);
        coverTex.colorSpace = THREE.SRGBColorSpace;
        coverTex.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
        frontMat.map = coverTex;
        frontMat.color.set(0xffffff);
        frontMat.needsUpdate = true;
      })
      .catch(() => {
        /* slab stays parchment-toned — still reads as a document */
      });

    /* Cursor lean */
    const target = { x: 0, y: 0 };
    const onPointerMove = (e: PointerEvent) => {
      const rect = mount.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
      target.y = nx * 0.5;
      target.x = -ny * 0.32;
    };
    const onPointerLeave = () => {
      target.x = 0;
      target.y = 0;
    };
    mount.addEventListener("pointermove", onPointerMove);
    mount.addEventListener("pointerleave", onPointerLeave);

    const size = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      if (w <= 0 || h <= 0) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    size();
    const ro = new ResizeObserver(size);
    ro.observe(mount);

    const t0 = performance.now();
    const tick = (now: number) => {
      const t = (now - t0) / 1000;
      group.rotation.y += (target.y + Math.sin(t * 0.4) * 0.14 - group.rotation.y) * 0.06;
      group.rotation.x += (target.x + Math.cos(t * 0.53) * 0.05 - group.rotation.x) * 0.06;
      group.position.y = Math.sin(t * 0.8) * 0.07;
      motes.rotation.y = t * 0.055;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      mount.removeEventListener("pointermove", onPointerMove);
      mount.removeEventListener("pointerleave", onPointerLeave);
      geo.dispose();
      edgeMat.dispose();
      backMat.dispose();
      frontMat.dispose();
      coverTex?.dispose();
      moteGeo.dispose();
      moteMat.map?.dispose();
      moteMat.dispose();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, [useFlat]);

  if (useFlat) {
    return (
      <button
        type="button"
        onClick={onOpen}
        aria-label="Open the sample market report"
        className="group relative mx-auto block w-full max-w-[300px] cursor-pointer"
      >
        <div className="overflow-hidden rounded-[14px] border border-[#d6b06a]/45 shadow-[0_26px_60px_rgba(0,0,0,0.4),0_0_0_1px_rgba(214,176,106,0.18)] transition-transform duration-300 group-active:scale-[0.98]">
          {failed || !coverUrl ? (
            <div className="flex aspect-[0.77] w-full items-center justify-center bg-[#0d1a2c]">
              <span className={`text-xs tracking-[0.2em] text-[#d6b06a]/80 ${failed ? "" : "animate-pulse"}`}>
                {failed ? "SAMPLE REPORT" : "RENDERING…"}
              </span>
            </div>
          ) : (
            <img src={coverUrl} alt="Sample rental analysis report cover" className="block w-full" />
          )}
        </div>
        <span className="pointer-events-none absolute inset-x-0 -bottom-3 mx-auto h-4 w-3/4 rounded-full bg-black/45 blur-md" aria-hidden />
      </button>
    );
  }

  return (
    <div
      ref={mountRef}
      role="button"
      tabIndex={0}
      aria-label="Open the sample market report"
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      className="h-full w-full cursor-pointer outline-none focus-visible:rounded-[24px]"
    />
  );
}
