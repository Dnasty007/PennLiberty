import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Rental } from "@/lib/data";

type RentalApplicationModalProps = {
  lightMode: boolean;
  rental: Rental | null;
  onClose: () => void;
  onSubmit: (contact: { name: string; email: string; phone: string }) => void;
  status?: "idle" | "sending" | "success" | "error";
  openedExternalApplication?: boolean;
};

export function RentalApplicationModal({
  lightMode,
  rental,
  onClose,
  onSubmit,
  status = "idle",
  openedExternalApplication = false,
}: RentalApplicationModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [attempted, setAttempted] = useState(false);

  useEffect(() => {
    if (status !== "success" || !rental) return;
    const timer = window.setTimeout(() => onClose(), 3000);
    return () => window.clearTimeout(timer);
  }, [status, rental, onClose]);

  if (!rental) {
    return null;
  }

  const nameEmpty = name.trim().length === 0;
  const emailEmpty = email.trim().length === 0;
  const phoneEmpty = phone.trim().length === 0;
  const isValid = !nameEmpty && !emailEmpty && !phoneEmpty;

  const inputAutofillLight =
    "[&:-webkit-autofill]:!text-black [&:-webkit-autofill]:shadow-[inset_0_0_0_1000px_#ffffff] [&:-webkit-autofill]:[-webkit-text-fill-color:#000]";

  const inputBase = lightMode
    ? `border-black/15 !bg-white py-6 text-[15px] !text-black placeholder:!text-black/55 focus-visible:ring-[#d6b06a]/40 ${inputAutofillLight}`
    : "border-white/10 bg-white/[0.05] py-6 text-[15px] text-white placeholder:text-white/45 focus-visible:ring-[#d6b06a]/50";

  const inputError = lightMode
    ? `border-red-500/70 !bg-white py-6 text-[15px] !text-black placeholder:!text-black/55 focus-visible:ring-red-400/40 ${inputAutofillLight}`
    : "border-red-400/60 bg-white/[0.05] py-6 text-[15px] text-white placeholder:text-white/45";

  const shellText = lightMode ? "text-black" : "text-white";
  const detailMutedText = lightMode ? "text-black/78" : "text-white/68";
  const closeButton = lightMode
    ? "border-black/12 bg-white/85 text-black"
    : "border-white/10 bg-white/[0.05] text-white";
  const cancelButton = lightMode
    ? "rounded-full border-black/12 bg-white/88 px-6 py-6 text-black hover:bg-white"
    : "rounded-full border-white/15 bg-white/[0.04] px-6 py-6 text-white hover:bg-white/[0.08]";
  const lightShellClasses =
    "border-black/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(250,247,243,0.96))] shadow-[0_28px_90px_rgba(12,18,28,0.16)] backdrop-blur-[20px]";

  const fieldLabel = (label: string) => (
    <span className="flex items-center gap-1 text-[12px] font-medium text-red-500">
      <span>*</span> {label} is required
    </span>
  );

  const handleSubmit = () => {
    if (!isValid) {
      setAttempted(true);
      return;
    }

    onSubmit({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
    });
  };

  return (
    <div
      className={`fixed inset-0 z-[70] flex items-center justify-center p-4 backdrop-blur-lg ${
        lightMode ? "bg-[rgba(9,16,26,0.18)]" : "bg-[rgba(4,10,16,0.66)]"
      }`}
      data-pl-no-page-swipe
    >
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      <GlassCard
        variant={lightMode ? "frost" : "chrome"}
        lightMode={lightMode}
        className={`relative z-10 w-full max-w-[560px] p-5 md:p-7 ${shellText} ${
          lightMode ? lightShellClasses : ""
        }`}
      >
        {status === "success" ? (
          <div className="relative z-10 flex flex-col items-center justify-center gap-4 py-8 text-center md:py-10">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#d6b06a]/15 text-3xl text-[#d6b06a]">
              ✓
            </div>
            <p className="text-[1.25rem] font-semibold text-[#d6b06a]">Application sent!</p>
            <p className={`max-w-[300px] text-[14px] leading-relaxed ${detailMutedText}`}>
              We received your details for {rental.title} and will follow up on availability.
              {openedExternalApplication
                ? " Complete your application in the new tab if one opened."
                : null}
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className={`text-xs uppercase tracking-[0.18em] ${detailMutedText}`}>Rental application</div>
                <h3 className="mt-2 text-2xl font-semibold">{rental.title}</h3>
                <p className={`mt-2 text-sm leading-relaxed ${detailMutedText}`}>
                  {rental.price} · {rental.area}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className={`inline-flex h-10 w-10 items-center justify-center rounded-full border ${closeButton}`}
                aria-label="Close application form"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className={`mt-5 text-sm leading-relaxed ${detailMutedText}`}>
              Share your contact details so we can route your application and follow up on availability.
            </p>

            <div className="mt-6 space-y-3">
              <div className="grid gap-1">
                {attempted && nameEmpty && fieldLabel("Name")}
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Name"
                  autoComplete="name"
                  className={attempted && nameEmpty ? inputError : inputBase}
                />
              </div>
              <div className="grid gap-1">
                {attempted && phoneEmpty && fieldLabel("Phone number")}
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Phone number"
                  autoComplete="tel"
                  className={attempted && phoneEmpty ? inputError : inputBase}
                />
              </div>
              <div className="grid gap-1">
                {attempted && emailEmpty && fieldLabel("Email")}
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  autoComplete="email"
                  className={attempted && emailEmpty ? inputError : inputBase}
                />
              </div>
            </div>

            {status === "error" && (
              <p className="mt-4 text-[12px] text-red-500">
                Something went wrong. Please try again or call us directly.
              </p>
            )}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={status === "sending"}
                className="rounded-full bg-[#d6b06a] px-6 py-6 text-[#08111f] hover:bg-[#e4be78] disabled:opacity-60"
              >
                {status === "sending" ? "Submitting…" : "Continue to application"}
              </Button>
              <Button variant="outline" type="button" className={cancelButton} onClick={onClose}>
                Cancel
              </Button>
            </div>
          </>
        )}
      </GlassCard>
    </div>
  );
}
