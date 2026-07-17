/**
 * Invisible Easter-egg hit zone (bottom-right of Rentals hero).
 * Opens the classic arcade hub. Desktop only — parent gates on usePhysicsPins.
 */
type RentalsArcadeLauncherProps = {
  onOpen: () => void;
};

export function RentalsArcadeLauncher({ onOpen }: RentalsArcadeLauncherProps) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label="Open classic arcade games"
      tabIndex={0}
      className="absolute bottom-4 right-4 z-[25] hidden h-11 w-11 cursor-default opacity-0 outline-none focus:outline-none md:inline-flex"
    />
  );
}
