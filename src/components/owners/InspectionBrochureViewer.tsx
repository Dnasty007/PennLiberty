import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, Download, X } from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";
import type { PDFDocumentProxy, RenderTask } from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

const BROCHURE_URL = "/owners/inspection-program.pdf";

/** Full-screen brochure reader for the Inspection Program PDF. Lazy-loaded —
 *  pdf.js only downloads when an owner actually opens the brochure. Renders the
 *  designed pages onto canvas, so it reads identically on desktop and phones
 *  (where a bare PDF link would often force-download instead of displaying). */
export default function InspectionBrochureViewer({ onClose }: { onClose: () => void }) {
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [page, setPage] = useState(1);
  const [error, setError] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const renderTaskRef = useRef<RenderTask | null>(null);
  const touchStartX = useRef<number | null>(null);

  /* Load the document once */
  useEffect(() => {
    let cancelled = false;
    const task = pdfjsLib.getDocument({ url: BROCHURE_URL });
    task.promise
      .then((loaded) => {
        if (cancelled) return; // cleanup's task.destroy() releases the doc
        setDoc(loaded);
        setPageCount(loaded.numPages);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
      void task.destroy();
    };
  }, []);

  /* Render the current page, sized to the frame (re-runs on resize) */
  const renderPage = useCallback(async () => {
    const canvas = canvasRef.current;
    const frame = frameRef.current;
    if (!doc || !canvas || !frame) return;

    renderTaskRef.current?.cancel();

    try {
      const pdfPage = await doc.getPage(page);
      const base = pdfPage.getViewport({ scale: 1 });
      const maxW = frame.clientWidth;
      const maxH = frame.clientHeight;
      const fit = Math.min(maxW / base.width, maxH / base.height);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const viewport = pdfPage.getViewport({ scale: fit * dpr });

      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      canvas.style.width = `${Math.floor(viewport.width / dpr)}px`;
      canvas.style.height = `${Math.floor(viewport.height / dpr)}px`;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const task = pdfPage.render({ canvasContext: ctx, canvas, viewport });
      renderTaskRef.current = task;
      await task.promise;
    } catch {
      /* cancelled mid-render (page flip / close) — fine */
    }
  }, [doc, page]);

  useEffect(() => {
    void renderPage();
  }, [renderPage]);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const ro = new ResizeObserver(() => void renderPage());
    ro.observe(frame);
    return () => ro.disconnect();
  }, [renderPage]);

  /* Keys + background scroll lock */
  const goPrev = useCallback(() => setPage((p) => Math.max(1, p - 1)), []);
  const goNext = useCallback(
    () => setPage((p) => Math.min(pageCount || 1, p + 1)),
    [pageCount],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose, goPrev, goNext]);

  const controlBtn =
    "inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/[0.08] text-white backdrop-blur-md transition hover:bg-white/[0.16] disabled:pointer-events-none disabled:opacity-30";

  return createPortal(
    <div
      data-pl-no-page-swipe
      className="pl-overlay-enter fixed inset-0 z-[220] flex flex-col bg-[rgba(3,8,16,0.94)] backdrop-blur-md"
      onClick={onClose}
    >
      {/* Top bar */}
      <div
        className="flex shrink-0 items-center justify-between gap-3 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-[#d6b06a]">
            Penn Liberty · Inspection Program
          </p>
          <p className="mt-0.5 hidden text-xs text-white/55 sm:block">
            The full program brochure, as mailed to owners
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <a
            href={BROCHURE_URL}
            download="Penn-Liberty-Inspection-Program.pdf"
            className="inline-flex items-center gap-2 rounded-full border border-[#d6b06a]/45 bg-[#d6b06a]/12 px-4 py-2.5 text-[13px] font-semibold text-[#f4dfb4] backdrop-blur-md transition hover:bg-[#d6b06a]/22"
          >
            <Download className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">Download PDF</span>
            <span className="sm:hidden">PDF</span>
          </a>
          <button type="button" onClick={onClose} aria-label="Close brochure" className={controlBtn}>
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Page stage */}
      <div
        ref={frameRef}
        className="relative min-h-0 flex-1 px-3 pb-3 sm:px-16"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => {
          touchStartX.current = e.touches[0]?.clientX ?? null;
        }}
        onTouchEnd={(e) => {
          const start = touchStartX.current;
          touchStartX.current = null;
          if (start == null) return;
          const dx = (e.changedTouches[0]?.clientX ?? start) - start;
          if (Math.abs(dx) < 48) return;
          if (dx < 0) goNext();
          else goPrev();
        }}
      >
        <div className="flex h-full w-full items-center justify-center">
          {error ? (
            <div className="max-w-sm rounded-[22px] border border-white/15 bg-white/[0.05] px-6 py-8 text-center">
              <p className="text-sm text-white/85">The brochure couldn&apos;t load here.</p>
              <a
                href={BROCHURE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#d6b06a] px-5 py-2.5 text-sm font-semibold text-[#08111f]"
              >
                Open the PDF instead
              </a>
            </div>
          ) : !doc ? (
            <p className="animate-pulse text-sm tracking-[0.2em] text-[#d6b06a]/80">
              OPENING THE BROCHURE…
            </p>
          ) : (
            <canvas
              ref={canvasRef}
              className="pl-sheet-enter rounded-lg shadow-[0_30px_90px_rgba(0,0,0,0.7),0_0_0_1px_rgba(214,176,106,0.22)]"
            />
          )}
        </div>

        {/* Arrows */}
        {doc && pageCount > 1 && (
          <>
            <button
              type="button"
              onClick={goPrev}
              disabled={page <= 1}
              aria-label="Previous page"
              className={`${controlBtn} absolute left-3 top-1/2 -translate-y-1/2 sm:left-4`}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={goNext}
              disabled={page >= pageCount}
              aria-label="Next page"
              className={`${controlBtn} absolute right-3 top-1/2 -translate-y-1/2 sm:right-4`}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      {/* Pager */}
      {doc && pageCount > 1 && (
        <div
          className="flex shrink-0 items-center justify-center gap-3 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-1"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-1.5">
            {Array.from({ length: pageCount }, (_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setPage(i + 1)}
                aria-label={`Go to page ${i + 1}`}
                className={`h-1.5 rounded-full transition-all duration-200 ${
                  page === i + 1 ? "w-6 bg-[#d6b06a]" : "w-1.5 bg-white/25 hover:bg-white/45"
                }`}
              />
            ))}
          </div>
          <span className="text-xs tabular-nums text-white/55">
            {page} / {pageCount}
          </span>
        </div>
      )}
    </div>,
    document.body,
  );
}
