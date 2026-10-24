const steps = [
  {
    n: "01",
    title: "Describe the equipment",
    body: "Make, model, year, symptoms, codes, and what the shop already told you. More detail yields a sharper report.",
  },
  {
    n: "02",
    title: "Pay $4.99 once",
    body: "Secure Stripe checkout. No subscription required. You get a full diagnostic package for one problem.",
  },
  {
    n: "03",
    title: "Read the report",
    body: "Root cause ranking, fair pricing ranges, verification steps, and scripts you can use with the shop.",
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-16 md:py-20 border-b border-border/70">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <div className="mb-10 md:mb-12 max-w-xl">
            <h2 className="font-display text-2xl md:text-3xl font-bold tracking-tight mb-3">
              Three steps.
              <span className="block">One clear second opinion.</span>
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Built for people who want signal before they authorize expensive work, not another
              vague checklist.
            </p>
          </div>

          <ol className="grid md:grid-cols-3 border-y border-border">
            {steps.map((step) => (
              <li
                key={step.n}
                className="py-6 md:px-6 md:first:pl-0 md:last:pr-0 border-b last:border-b-0 md:border-b-0 md:border-l md:first:border-l-0 border-border"
              >
                <div className="flex items-baseline gap-3 mb-2">
                  <span className="text-lg tabular-nums text-primary">{step.n}</span>
                  <h3 className="font-display text-lg font-semibold tracking-tight">
                    {step.title}
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
