import { X } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { SaleListing } from "@/lib/data";

type TourForm = {
  name: string;
  email: string;
  phone: string;
};

type ScheduleTourModalProps = {
  form: TourForm;
  lightMode: boolean;
  listing: SaleListing | null;
  mutedText: string;
  onChange: (value: TourForm) => void;
  onClose: () => void;
  onSubmit: () => void;
};

export function ScheduleTourModal({
  form,
  lightMode,
  listing,
  mutedText: _mutedText,
  onChange,
  onClose,
  onSubmit,
}: ScheduleTourModalProps) {
  if (!listing) {
    return null;
  }

  const inputClasses = lightMode
    ? "border-black/12 bg-white/48 text-black placeholder:text-black/35"
    : "border-white/10 bg-white/[0.05] text-white placeholder:text-white/36";
  const shellText = lightMode ? "text-black" : "text-white";
  const closeButton = lightMode
    ? "border-black/10 bg-white/40 text-black"
    : "border-white/10 bg-white/[0.05] text-white";
  const cancelButton = lightMode
    ? "rounded-full border-black/12 bg-white/40 px-6 py-6 text-black hover:bg-white/60"
    : "rounded-full border-white/15 bg-white/[0.04] px-6 py-6 text-white hover:bg-white/[0.08]";
  const detailMutedText = lightMode ? "text-black/62" : "text-white/68";
  const lightShellClasses =
    "border-black/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.58),rgba(255,255,255,0.46))] shadow-[0_28px_90px_rgba(12,18,28,0.14)] backdrop-blur-[20px]";

  return (
    <div
      className={`fixed inset-0 z-[60] flex items-center justify-center p-4 backdrop-blur-lg ${
        lightMode ? "bg-[rgba(9,16,26,0.18)]" : "bg-[rgba(4,10,16,0.66)]"
      }`}
    >
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      <GlassCard
        variant={lightMode ? "frost" : "chrome"}
        lightMode={lightMode}
        className={`relative z-10 w-full max-w-[560px] p-5 md:p-7 ${shellText} ${
          lightMode ? lightShellClasses : ""
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className={`text-xs uppercase tracking-[0.18em] ${detailMutedText}`}>Schedule Tour</div>
            <h3 className="mt-2 text-2xl font-semibold">{listing.title}</h3>
            <p className={`mt-2 text-sm leading-relaxed ${detailMutedText}`}>{listing.address}</p>
          </div>
          <button
            onClick={onClose}
            className={`inline-flex h-10 w-10 items-center justify-center rounded-full border ${closeButton}`}
            aria-label="Close schedule tour"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 space-y-4">
          <Input
            value={form.name}
            onChange={(event) => onChange({ ...form, name: event.target.value })}
            placeholder="Name"
            className={inputClasses}
          />
          <Input
            type="email"
            value={form.email}
            onChange={(event) => onChange({ ...form, email: event.target.value })}
            placeholder="Email"
            className={inputClasses}
          />
          <Input
            type="tel"
            value={form.phone}
            onChange={(event) => onChange({ ...form, phone: event.target.value })}
            placeholder="Phone Number"
            className={inputClasses}
          />
        </div>

        <p className={`mt-4 text-sm leading-relaxed ${detailMutedText}`}>
          This opens a prefilled email draft so Penn Liberty can follow up on this property.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button
            onClick={onSubmit}
            className="rounded-full bg-[#d6b06a] px-6 py-6 text-[#08111f] hover:bg-[#e4be78]"
          >
            Request Tour
          </Button>
          <Button variant="outline" className={cancelButton} onClick={onClose}>
            Cancel
          </Button>
        </div>
      </GlassCard>
    </div>
  );
}
