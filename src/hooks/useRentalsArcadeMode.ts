import { useCallback, useState } from "react";
import {
  type ArcadeGameId,
  isArcadeGameId,
} from "@/lib/arcade/catalog";

export type { ArcadeGameId };

export type ArcadeScreen = "idle" | "hub" | ArcadeGameId;

/** Desktop Rentals-hero arcade: hub → pick a classic → play → back to hub. */
export function useRentalsArcadeMode() {
  const [screen, setScreen] = useState<ArcadeScreen>("idle");

  const openHub = useCallback(() => setScreen("hub"), []);
  const closeAll = useCallback(() => setScreen("idle"), []);
  const play = useCallback((game: ArcadeGameId) => {
    if (isArcadeGameId(game)) setScreen(game);
  }, []);
  const backToHub = useCallback(() => setScreen("hub"), []);

  const active = screen !== "idle";
  const inGame = screen !== "idle" && screen !== "hub";

  return { screen, active, inGame, openHub, closeAll, play, backToHub };
}
