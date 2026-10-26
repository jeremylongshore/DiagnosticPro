import { Button } from "@/components/ui/button";
import IntentPartner from "./IntentPartner";

const scrollToForm = () => {
  window.location.hash = "#diagnostic-form-flash";
  setTimeout(() => {
    document.getElementById("diagnostic-form")?.scrollIntoView({ behavior: "smooth" });
  }, 80);
};

// What one report contains, from the product's own facts (the report prompt
// requires 15 sections; see promptV3.js).
const ledger = [
  { term: "Diagnosis", detail: "The most likely cause, with a confidence number" },
  { term: "Pricing", detail: "What a fair price looks like" },
  { term: "Includes", detail: "Questions to ask" },
  { term: "Structure", detail: "15 sections" },
  { term: "Equipment", detail: "Cars, trucks, boats, HVAC, farm equipment and more" },
];

const Hero = () => {
  return (
    <section className="border-b border-border/70">
      <div className="container mx-auto px-4 py-12 md:py-16 lg:py-14 lg:min-h-[calc(92svh-3.5rem)] lg:flex lg:items-center">
        <div className="w-full max-w-6xl mx-auto grid gap-12 lg:grid-cols-12 lg:gap-x-12 lg:items-center">
          <div className="min-w-0 lg:col-span-7">
            <h1 className="font-display text-[length:var(--text-display)] font-bold leading-[1.02] text-foreground [overflow-wrap:break-word] min-w-0 mb-6">
              <span className="sm:block">Know What&apos;s Wrong</span>{" "}
              <span className="sm:block">Before You Authorize Repairs</span>
            </h1>

            <p className="text-[length:var(--text-lead)] text-muted-foreground leading-snug mb-8 max-w-xl">
              A second opinion on your repair, for $4.99.
            </p>

            <div className="flex flex-col sm:flex-row gap-x-6 gap-y-3 sm:items-center">
              <Button
                variant="hero"
                size="lg"
                className="min-w-48 cursor-pointer self-start"
                onClick={scrollToForm}
              >
                Start Diagnosis - $4.99
              </Button>
              <a
                href="#how-it-works"
                className="inline-flex min-h-11 items-center self-start text-sm text-muted-foreground underline-offset-4 transition-colors duration-200 hover:text-foreground hover:underline active:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
              >
                See how it works
              </a>
            </div>

            <div className="mt-10 pt-6 border-t border-border/80 max-w-xl">
              <IntentPartner variant="inline" />
            </div>
          </div>

          <div className="min-w-0 lg:col-span-5 lg:border-l lg:border-border lg:pl-12">
            <p className="text-sm text-muted-foreground">One diagnostic report</p>
            <p className="font-display text-[length:var(--text-price)] font-bold leading-none tabular-nums text-primary mt-2 mb-8 lg:mb-10">
              $4.99
            </p>
            <dl className="border-t border-border">
              {ledger.map(({ term, detail }) => (
                <div
                  key={term}
                  className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-4 py-3 lg:py-4 border-b border-border"
                >
                  <dt className="text-sm lg:text-base text-muted-foreground">{term}</dt>
                  <dd className="text-sm lg:text-base font-medium text-foreground">{detail}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
