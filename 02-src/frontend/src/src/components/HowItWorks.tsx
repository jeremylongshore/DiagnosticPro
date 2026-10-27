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
    <section id="how-it-works" className="py-20 md:py-28 border-b border-border/70">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12 md:mb-16 max-w-3xl">
            <h2 className="section-title mb-5">
              Three steps.
              <span className="block">One clear second opinion.</span>
            </h2>
            <p className="text-[length:var(--text-lead)] text-muted-foreground leading-snug max-w-xl">
              Built for people who want signal before they authorize expensive work, not another
              vague checklist.
            </p>
          </div>

          <ol className="grid md:grid-cols-3 border-y border-border">
            {steps.map((step) => (
              <li
                key={step.n}
                className="py-8 md:px-8 md:first:pl-0 md:last:pr-0 border-b last:border-b-0 md:border-b-0 md:border-l md:first:border-l-0 border-border"
              >
                <span className="block font-display text-[length:var(--text-section)] font-bold leading-none tabular-nums text-primary mb-6">
                  {step.n}
                </span>
                <h3 className="item-title mb-3">{step.title}</h3>
                <p className="text-base text-muted-foreground leading-relaxed">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
