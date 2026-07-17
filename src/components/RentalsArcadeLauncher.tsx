import { playCoinInsert, preloadCoinInsert } from "@/lib/arcade/coinInsert";

/**
 * Soft-discoverable arcade entry (bottom-right of Rentals hero).
 * Quiet by default — brightens on hover/focus. Desktop only (parent + md:).
 * Click = real coin-slot sample + open Time Cabinet.
 */
type RentalsArcadeLauncherProps = {
  onOpen: () => void;
};

export function RentalsArcadeLauncher({ onOpen }: RentalsArcadeLauncherProps) {
  const handleOpen = () => {
    void playCoinInsert();
    onOpen();
  };

  return (
    <button
      type="button"
      onClick={handleOpen}
      onPointerEnter={() => preloadCoinInsert()}
      onFocus={() => preloadCoinInsert()}
      aria-label="Open Penn Liberty Arcade — Time Cabinet"
      title="Time Cabinet"
      className="group absolute bottom-3 right-3 z-[25] hidden items-center gap-2 rounded-full border border-[#d6b06a]/20 bg-black/25 px-2.5 py-2 text-left shadow-[0_0_0_1px_rgba(0,0,0,0.2)] backdrop-blur-[2px] outline-none transition-all duration-300 hover:border-[#33ff66]/45 hover:bg-black/55 hover:shadow-[0_0_20px_rgba(51,255,102,0.18)] focus-visible:border-[#33ff66]/60 focus-visible:bg-black/60 focus-visible:ring-2 focus-visible:ring-[#33ff66]/40 md:inline-flex"
    >
      <span
        className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#33ff66]/25 bg-[#05100a]/40 opacity-40 transition-all duration-300 group-hover:border-[#33ff66]/70 group-hover:opacity-100 group-hover:shadow-[0_0_12px_rgba(51,255,102,0.35)] group-focus-visible:opacity-100"
        aria-hidden
      >
        <span className="absolute top-1.5 h-2 w-1 rounded-full bg-[#33ff66]/80" />
        <span className="absolute top-0.5 h-2.5 w-2.5 rounded-full bg-[#d6b06a] shadow-[0_0_6px_rgba(214,176,106,0.5)]" />
        <span className="absolute bottom-1.5 h-1.5 w-4 rounded-sm bg-[#33ff66]/50" />
      </span>

      <span className="max-w-0 overflow-hidden opacity-0 transition-all duration-300 group-hover:max-w-[7.5rem] group-hover:opacity-100 group-focus-visible:max-w-[7.5rem] group-focus-visible:opacity-100">
        <span className="block whitespace-nowrap font-mono text-[9px] font-bold tracking-[0.28em] text-[#33ff66]">
          INSERT COIN
        </span>
        <span className="mt-0.5 block whitespace-nowrap font-mono text-[8px] tracking-[0.18em] text-[#d6b06a]/80">
          TIME CABINET
        </span>
      </span>
    </button>
  );
}
