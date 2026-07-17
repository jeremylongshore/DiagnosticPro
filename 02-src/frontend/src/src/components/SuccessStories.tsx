import { Car, Ship, Thermometer, Wrench } from "lucide-react";

const examples = [
  {
    icon: Car,
    title: "Automotive — P0420",
    blurb:
      "Shop quotes a converter. Report covers O2 sensors, exhaust leaks, and the tests that should happen before a $1,200+ cat.",
  },
  {
    icon: Ship,
    title: "Marine — overheating",
    blurb:
      "Marina quotes impeller + thermostat. Report prioritizes raw-water intake blockage and cooling path checks first.",
  },
  {
    icon: Thermometer,
    title: "HVAC — short cycling",
    blurb:
      "Company quotes a compressor. Report highlights coil airflow and capacitor failure patterns with a verification sequence.",
  },
  {
    icon: Wrench,
    title: "Diesel — DPF / derate",
    blurb:
      "Dealer quotes full DPF work. Report walks sensor paths, regen failure modes, and what to verify before authorizing major parts.",
  },
];

const SuccessStories = () => {
  return (
    <section id="examples" className="py-16 md:py-20 border-b border-border/70">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <div className="mb-10 max-w-xl">
            <p className="section-label mb-3">What you get</p>
            <h2 className="font-display text-2xl md:text-3xl font-bold tracking-tight mb-3">
              One report. Equipment-specific guidance.
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Each run is a long-form analysis for your exact machine and symptoms — not a generic
              article with your model name pasted in.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 md:gap-5">
            {examples.map(({ icon: Icon, title, blurb }) => (
              <article
                key={title}
                className="rounded-lg border border-border bg-card p-5 md:p-6 shadow-[var(--shadow-card)]"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-muted/60">
                    <Icon className="h-4 w-4 text-foreground/80" strokeWidth={1.75} />
                  </span>
                  <h3 className="font-display text-sm font-semibold tracking-tight">{title}</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{blurb}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default SuccessStories;
