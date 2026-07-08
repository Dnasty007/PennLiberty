import { Suspense, lazy, useState } from "react";
import { Building2, FileBarChart, LineChart, MapPin, Percent } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionDivider } from "@/components/owners/SectionDivider";
import { useRentalsHeroPhysicsMode } from "@/hooks/useRentalsHeroPhysicsMode";

const ReportShowcase3D = lazy(() => import("@/components/owners/ReportShowcase3D"));
const InspectionBrochureViewer = lazy(
  () => import("@/components/owners/InspectionBrochureViewer"),
);

const REPORT_URL = "/owners/sample-market-report.pdf";

const sampleStats = [
  ["$2,310", "est. market rent"],
  ["88%", "confidence score"],
  ["30", "comps mapped"],
  ["27", "pages of data"],
] as const;

const inclusions = [
  { icon: MapPin, text: "Comparable rentals around your address — rent, size, distance" },
  { icon: LineChart, text: "County rent trends by bedroom count, single- & multi-family" },
  { icon: Percent, text: "Gross-yield percentages across your ten nearest ZIP codes" },
  { icon: Building2, text: "Vacancy, days-on-market, and rental-saturation benchmarks" },
] as const;

type OwnersMarketReportsProps = {
  lightMode: boolean;
  mutedText: string;
  subtleText: string;
};

export function OwnersMarketReports({ lightMode, mutedText, subtleText }: OwnersMarketReportsProps) {
  const [reportOpen, setReportOpen] = useState(false);
  const { isMobile } = useRentalsHeroPhysicsMode();

  const eyebrow = lightMode ? "text-[#926d28]" : "text-[#dcb672]/92";
  const heading = lightMode ? "text-black" : "text-white";
  const headingSub = lightMode ? "text-black/[0.82]" : "text-white/[0.88]";
  const statShell = lightMode
    ? "border-black/[0.09] bg-white/[0.45]"
    : "border-white/[0.09] bg-white/[0.035]";
  const rowInk = mutedText;

  const scrollToReview = () => {
    document
      .getElementById("owners-property-review")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section id="owners-market-reports" className="scroll-mt-24 lg:scroll-mt-36">
      <SectionDivider lightMode={lightMode} label="Property data reports" number="04" />

      <div className="mt-9 grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(300px,0.95fr)] lg:items-center lg:gap-12">
        {/* Copy */}
        <div className="min-w-0">
          <p className={`text-[11px] font-semibold uppercase tracking-[0.24em] ${eyebrow}`}>
            Owner intelligence · on request
          </p>
          <h3 className={`mt-4 text-[clamp(1.75rem,2.6vw,2.25rem)] font-semibold leading-snug tracking-[-0.02em] md:leading-[1.1] ${heading}`}>
            Know exactly what your property should earn.
            <span className={`mt-3 block font-medium text-[0.88em] md:font-semibold md:text-[0.9em] ${headingSub}`}>
              A full market analysis, pulled for your address.
            </span>
          </h3>
          <p className={`mt-6 max-w-xl text-[0.985rem] leading-relaxed md:text-[1.02rem] ${mutedText}`}>
            New to Penn Liberty — or just want a current read on a property you already own? We
            prepare a professional rental analysis for your exact address: an estimated market
            rent with a confidence score, live comparables mapped around you, and the
            neighborhood-level data behind every number.
          </p>

          {/* From the sample */}
          <div className="mt-7">
            <p className={`text-[10px] font-bold uppercase tracking-[0.24em] ${subtleText}`}>
              From the sample report
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {sampleStats.map(([value, label]) => (
                <div key={label} className={`rounded-2xl border px-3 py-3 text-center ${statShell}`}>
                  <div className="text-xl font-semibold tabular-nums tracking-tight text-[#d6b06a]">
                    {value}
                  </div>
                  <div className={`mt-0.5 text-[11px] leading-snug ${mutedText}`}>{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* What's inside */}
          <ul className="mt-6 space-y-2.5">
            {inclusions.map((item) => (
              <li key={item.text} className={`flex items-start gap-2.5 text-[13.5px] leading-snug ${rowInk}`}>
                <item.icon className="mt-0.5 h-4 w-4 shrink-0 text-[#d6b06a]" aria-hidden />
                <span>{item.text}</span>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              type="button"
              onClick={() => setReportOpen(true)}
              className="rounded-full bg-[#d6b06a] px-7 py-6 text-[15px] font-semibold text-[#08111f] transition-transform hover:bg-[#e4be78] active:scale-[0.985]"
            >
              <span className="inline-flex items-center gap-2">
                <FileBarChart className="h-4 w-4" aria-hidden />
                View the sample report
              </span>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={scrollToReview}
              className={`rounded-full px-7 py-6 text-[15px] font-medium transition-transform active:scale-[0.985] ${
                lightMode
                  ? "border-black/15 bg-white/40 text-black/80 hover:bg-white/65"
                  : "border-white/20 bg-white/[0.03] text-white/85 hover:bg-white/[0.08]"
              }`}
            >
              Request yours — free
            </Button>
          </div>
        </div>

        {/* The report as an object — 3D on desktop, floating cover on mobile */}
        <div className="relative h-[340px] sm:h-[400px] lg:h-[460px]">
          <Suspense
            fallback={
              <div className="flex h-full w-full items-center justify-center">
                <p className="animate-pulse text-xs tracking-[0.25em] text-[#d6b06a]/75">
                  PREPARING THE REPORT…
                </p>
              </div>
            }
          >
            <ReportShowcase3D flat={isMobile} onOpen={() => setReportOpen(true)} />
          </Suspense>
          <p className={`pointer-events-none absolute inset-x-0 -bottom-1 text-center text-[10px] uppercase tracking-[0.24em] ${subtleText}`}>
            {isMobile ? "Tap the report to read it" : "Click the report to read it"}
          </p>
        </div>
      </div>

      {reportOpen && (
        <Suspense
          fallback={
            <div className="fixed inset-0 z-[220] flex items-center justify-center bg-[rgba(3,8,16,0.9)] backdrop-blur-md">
              <p className="animate-pulse text-sm tracking-[0.2em] text-[#d6b06a]/80">
                OPENING THE REPORT…
              </p>
            </div>
          }
        >
          <InspectionBrochureViewer
            onClose={() => setReportOpen(false)}
            url={REPORT_URL}
            downloadName="Penn-Liberty-Sample-Market-Report.pdf"
            eyebrow="Penn Liberty · Market Report"
            subline="Sample rental analysis report"
          />
        </Suspense>
      )}
    </section>
  );
}
