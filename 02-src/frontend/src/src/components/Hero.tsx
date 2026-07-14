import { Button } from "@/components/ui/button";

const scrollToForm = () => {
  window.location.hash = "#diagnostic-form-flash";
  setTimeout(() => {
    document.getElementById("diagnostic-form")?.scrollIntoView({ behavior: "smooth" });
  }, 80);
};

const Hero = () => {
  return (
    <section className="relative border-b border-border/70">
      {/* Quiet technical field — no stock photo, no rainbow gradient */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 80% 60% at 70% -10%, hsl(24 95% 48% / 0.09), transparent 55%), linear-gradient(to bottom, transparent, hsl(var(--background)))",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.4]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--border) / 0.55) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border) / 0.55) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage: "radial-gradient(ellipse 70% 60% at 50% 30%, black, transparent)",
        }}
      />

      <div className="container relative z-10 mx-auto px-4 py-16 md:py-24">
        <div className="max-w-3xl mx-auto text-center">
          <p className="section-label mb-5">Equipment diagnostic second opinion</p>

          <h1 className="font-display text-4xl md:text-5xl lg:text-[3.4rem] font-bold tracking-tight text-foreground text-balance mb-5 leading-[1.08]">
            Know What&apos;s Wrong
            <span className="block text-foreground/80 mt-1">Before You Authorize Repairs</span>
          </h1>

          <p className="text-base md:text-lg text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed text-balance">
            AI diagnostic second opinion for $4.99. Get a 2,000+ word report with root cause analysis,
            fair pricing estimates, and word-for-word scripts to use at the shop. Cars, trucks,
            boats, HVAC, farm equipment, and more.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-12">
            <Button
              variant="hero"
              size="lg"
              className="min-w-48 cursor-pointer"
              onClick={scrollToForm}
            >
              Start Diagnosis - $4.99
            </Button>
            <a
              href="#how-it-works"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 underline-offset-4 hover:underline"
            >
              See how it works
            </a>
          </div>

          <dl className="grid grid-cols-3 gap-4 max-w-lg mx-auto border-t border-border/80 pt-8">
            <div className="text-center">
              <dt className="text-[0.68rem] uppercase tracking-[0.14em] text-muted-foreground mb-1">
                Report
              </dt>
              <dd className="font-display text-lg md:text-xl font-semibold tabular-nums">
                2,000+ Words
              </dd>
            </div>
            <div className="text-center border-x border-border/80">
              <dt className="text-[0.68rem] uppercase tracking-[0.14em] text-muted-foreground mb-1">
                Structure
              </dt>
              <dd className="font-display text-lg md:text-xl font-semibold tabular-nums">
                15 Sections
              </dd>
            </div>
            <div className="text-center">
              <dt className="text-[0.68rem] uppercase tracking-[0.14em] text-muted-foreground mb-1">
                Price
              </dt>
              <dd className="font-display text-lg md:text-xl font-semibold tabular-nums text-primary">
                $4.99
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
};

export default Hero;
