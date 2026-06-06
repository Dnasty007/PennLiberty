import { useEffect, useState } from "react";

const DESKTOP_QUERY = "(min-width: 768px)";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/**
 * Desktop hero uses physics pins when md+ and motion is allowed.
 * Mobile keeps legacy static pins; reduced-motion desktop uses a static grid.
 */
export function useRentalsHeroPhysicsMode() {
  const [isDesktop, setIsDesktop] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const desktopMq = window.matchMedia(DESKTOP_QUERY);
    const motionMq = window.matchMedia(REDUCED_MOTION_QUERY);

    const sync = () => {
      setIsDesktop(desktopMq.matches);
      setPrefersReducedMotion(motionMq.matches);
    };

    sync();
    desktopMq.addEventListener("change", sync);
    motionMq.addEventListener("change", sync);
    return () => {
      desktopMq.removeEventListener("change", sync);
      motionMq.removeEventListener("change", sync);
    };
  }, []);

  return {
    usePhysicsPins: isDesktop && !prefersReducedMotion,
    useStaticDesktopPins: isDesktop && prefersReducedMotion,
    isMobile: !isDesktop,
  };
}
