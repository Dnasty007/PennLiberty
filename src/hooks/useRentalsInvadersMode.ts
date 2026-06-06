import { useCallback, useState } from "react";

/** Tiny toggle for the Rentals-hero Space Invaders Easter egg. */
export function useRentalsInvadersMode() {
  const [active, setActive] = useState(false);
  const start = useCallback(() => setActive(true), []);
  const exit = useCallback(() => setActive(false), []);
  return { active, start, exit };
}
