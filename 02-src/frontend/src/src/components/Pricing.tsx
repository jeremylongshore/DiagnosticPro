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
    <section id="pricing" className="py-16 md:py-20 border-b border-border/70 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-8">
            <p className="section-label mb-3">Pricing</p>
            <h2 className="font-display text-2xl md:text-3xl font-bold tracking-tight">
              Simple. One report.
            </h2>
          </div>

          <div className="rounded-lg border border-border bg-card p-8 shadow-[var(--shadow-card)] text-center">
            <p className="text-sm text-muted-foreground mb-2">Diagnostic analysis</p>
            <p className="font-display text-5xl font-bold tracking-tight tabular-nums text-foreground mb-1">
              $4.99
            </p>
            <p className="text-sm text-muted-foreground mb-8">Pay once · PDF delivered after analysis</p>

            <ul className="space-y-3 text-left mb-8">
              {included.map((item) => (
                <li key={item} className="flex gap-3 text-sm text-foreground/90">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <Button
              variant="hero"
              size="lg"
              className="w-full cursor-pointer"
              onClick={() => {
                document.getElementById("diagnostic-form")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Start Diagnosis - $4.99
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
