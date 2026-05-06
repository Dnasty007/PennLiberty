import { GlassCard } from "@/components/GlassCard";
import { Card, CardContent } from "@/components/ui/card";
import type { Rental } from "@/lib/data";

type RentalsSectionProps = {
  lightMode: boolean;
  mutedText: string;
  rentals: Rental[];
  subtleText: string;
};

export function RentalsSection({
  lightMode,
  mutedText,
  rentals,
  subtleText,
}: RentalsSectionProps) {
  return (
    <section className="space-y-6">
      <div>
        <h2 className="mb-2 text-3xl font-semibold">Available Rentals</h2>
        <p className={mutedText}>Only currently available rentals are shown here.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <GlassCard lightMode={lightMode} className="p-4 md:p-5">
          <div className="relative min-h-[580px] overflow-hidden rounded-[28px] border border-white/10 bg-[#111a27]">
            <img
              src="https://images.unsplash.com/photo-1519999482648-25049ddd37b1?auto=format&fit=crop&w=1800&q=80"
              alt="Philadelphia rental map"
              className="h-full w-full object-cover opacity-90"
            />
            <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(6,10,18,0.15),rgba(6,10,18,0.45))]" />
            {rentals.map((rental, index) => {
              const positions = [
                { top: "34%", left: "58%" },
                { top: "24%", left: "72%" },
                { top: "18%", left: "51%" },
              ];
              const position = positions[index] ?? positions[0];

              return (
                <div
                  key={rental.id}
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                  style={{ top: position.top, left: position.left }}
                >
                  <div className="rounded-full border border-white/20 bg-black/50 px-3 py-2 text-sm text-white backdrop-blur-md">
                    {rental.price}
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>

        <div className="grid gap-4">
          {rentals.map((rental) => (
            <Card
              key={rental.id}
              className={
                lightMode
                  ? "overflow-hidden border-black/10 bg-white/60 text-black"
                  : "overflow-hidden border-white/10 bg-white/[0.01] text-white"
              }
            >
              <img src={rental.image} alt={rental.title} className="h-48 w-full object-cover" />
              <CardContent className="p-4">
                <h3 className="text-xl font-semibold">{rental.title}</h3>
                <p className={mutedText}>{rental.meta}</p>
                <p className="mt-2 font-medium">{rental.price}</p>
                <p className={`mt-1 text-sm ${subtleText}`}>{rental.area}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
