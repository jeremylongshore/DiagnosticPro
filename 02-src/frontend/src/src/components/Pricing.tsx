import { Button } from "@/components/ui/button";

const included = [
  "Root cause ranking grounded in your symptoms and codes",
  "Fair pricing ranges for common repair paths",
  "Verification steps a shop should run before big parts",
  "Negotiation scripts you can use verbatim",
  "Cars, trucks, boats, HVAC, farm equipment, and more",
];

const Pricing = () => {
  return (
    <section id="pricing" className="py-20 md:py-28 border-b border-border/70 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto grid gap-12 lg:grid-cols-12 lg:gap-x-12 lg:items-center">
          <div className="min-w-0 lg:col-span-5">
            <h2 className="section-title mb-8">Simple. One report.</h2>
            <p className="text-sm text-muted-foreground mb-2">Diagnostic analysis</p>
            <p className="font-display text-[length:var(--text-section)] font-bold leading-none tabular-nums text-foreground mb-3">
              $4.99
            </p>
            <p className="text-base text-muted-foreground mb-8">
              Pay once. Your PDF is delivered after the analysis.
            </p>
            <Button
              variant="hero"
              size="lg"
              className="w-full sm:w-auto sm:min-w-64 cursor-pointer"
              onClick={() => {
                document.getElementById("diagnostic-form")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Start Diagnosis - $4.99
            </Button>
          </div>

          <ul className="min-w-0 lg:col-span-7 space-y-4">
            {included.map((item) => (
              <li key={item} className="flex gap-4 text-[length:var(--text-lead)] leading-snug text-foreground">
                <span className="mt-[0.6em] h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
