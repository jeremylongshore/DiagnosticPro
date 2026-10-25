import { Car, Ship, Thermometer, Wrench } from "lucide-react";

const examples = [
  {
    icon: Car,
    title: "Automotive: P0420",
    blurb:
      "Shop quotes a converter. Report covers O2 sensors, exhaust leaks, and the tests that should happen before a $1,200+ cat.",
  },
  {
    icon: Ship,
    title: "Marine: overheating",
    blurb:
      "Marina quotes impeller + thermostat. Report prioritizes raw-water intake blockage and cooling path checks first.",
  },
  {
    icon: Thermometer,
    title: "HVAC: short cycling",
    blurb:
      "Company quotes a compressor. Report highlights coil airflow and capacitor failure patterns with a verification sequence.",
  },
  {
    icon: Wrench,
    title: "Diesel: DPF / derate",
    blurb:
      "Dealer quotes full DPF work. Report walks sensor paths, regen failure modes, and what to verify before authorizing major parts.",
  },
];

const SuccessStories = () => {
  return (
    <section id="examples" className="py-16 md:py-24 border-b border-border/70">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12 md:mb-16 max-w-5xl">
            <h2 className="section-title mb-5">
              <span className="block">One report.</span>{" "}
              <span className="block">Equipment-specific guidance.</span>
            </h2>
            <p className="text-[length:var(--text-lead)] text-muted-foreground leading-snug max-w-2xl">
              Each run is a long-form analysis for your exact machine and symptoms, not a generic
              article with your model name pasted in. These examples show the kind of guidance a
              report gives.
            </p>
          </div>

          <div className="border-t border-border">
            {examples.map(({ icon: Icon, title, blurb }) => (
              <article
                key={title}
                className="grid gap-3 md:grid-cols-12 md:gap-x-12 py-8 border-b border-border"
              >
                <div className="flex items-center gap-3 md:col-span-5 min-w-0">
                  <Icon className="h-5 w-5 shrink-0 text-primary" strokeWidth={1.75} aria-hidden />
                  <h3 className="item-title">{title}</h3>
                </div>
                <p className="md:col-span-7 text-base text-muted-foreground leading-relaxed">
                  {blurb}
                </p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default SuccessStories;
