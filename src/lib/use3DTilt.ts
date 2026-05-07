import type React from "react";
import { useCallback, useRef } from "react";

type Use3DTiltOptions = {
  maxRotateDeg?: number;
  liftPx?: number;
  trackLightSpot?: boolean;
};

export function use3DTilt({
  maxRotateDeg = 8,
  liftPx = 0,
  trackLightSpot = false,
}: Use3DTiltOptions = {}) {
  const ref = useRef<HTMLDivElement | null>(null);

  const onMouseMove = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      const node = ref.current;

      if (!node) {
        return;
      }

      const rect = node.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      const rotateX = (0.5 - y) * maxRotateDeg * 2;
      const rotateY = (x - 0.5) * maxRotateDeg * 2;
      const lift = liftPx > 0 ? `translateY(-${liftPx}px) ` : "";

      node.style.transform = `perspective(1200px) ${lift}rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg)`;

      if (trackLightSpot) {
        node.style.setProperty("--mx", `${(x * 100).toFixed(2)}%`);
        node.style.setProperty("--my", `${(y * 100).toFixed(2)}%`);
        node.dataset.tiltActive = "true";
      }
    },
    [maxRotateDeg, liftPx, trackLightSpot],
  );

  const onMouseLeave = useCallback(() => {
    const node = ref.current;

    if (!node) {
      return;
    }

    node.style.transform = "";
    delete node.dataset.tiltActive;
  }, []);

  return { ref, onMouseMove, onMouseLeave };
}
