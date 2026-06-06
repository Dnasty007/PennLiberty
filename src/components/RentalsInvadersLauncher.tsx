import { primeGameAudio } from "@/lib/rentalsInvaders3d/audio3d";

/** Invisible Easter-egg hit zone (bottom-right of Rentals hero) — starts game on click.
 *  Desktop only; the parent already gates on usePhysicsPins (no reduced motion). */
type RentalsInvadersLauncherProps = {
  onStart: () => void;
};

export function RentalsInvadersLauncher({ onStart }: RentalsInvadersLauncherProps) {
  const handleStart = () => {
    primeGameAudio();
    onStart();
  };

  return (
    <button
      type="button"
      onClick={handleStart}
      aria-label="Play Space Invaders"
      tabIndex={0}
      className="absolute bottom-4 right-4 z-[25] hidden h-11 w-11 cursor-default opacity-0 outline-none focus:outline-none md:inline-flex"
    />
  );
}
