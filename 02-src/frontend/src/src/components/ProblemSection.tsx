const rows = [
  {
    problem: "Rough idle / misfire",
    guess: "Plugs → coils → injectors",
    guessCost: "$1,400+",
    smarter: "Confirm vacuum leak / cylinder isolation first",
    smarterCost: "Often under $50 parts",
  },
  {
    problem: "AC not cooling",
    guess: "New compressor package",
    guessCost: "$2,000+",
    smarter: "Capacitor / contactor / airflow checks first",
    smarterCost: "Often under $100",
  },
  {
    problem: "Diesel derate / DPF",
    guess: "Full aftertreatment replace",
    guessCost: "$3,000–$6,000",
    smarter: "Sensor, regen path, and code sequence first",
    smarterCost: "Verify before major parts",
  },
];

const ProblemSection = () => {
  return (
    <section className="py-16 md:py-20 border-b border-border/70 bg-muted/40">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <div className="mb-10 max-w-xl">
            <p className="section-label mb-3">Why it matters</p>
            <h2 className="font-display text-2xl md:text-3xl font-bold tracking-tight mb-3">
              Guessing is expensive. Sequencing is not.
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Shops often replace parts until something works. A second opinion helps you ask for the
              right tests — and walk away from premature big-ticket replacements.
            </p>
          </div>

          <div className="overflow-hidden rounded-lg border border-border bg-card shadow-[var(--shadow-card)]">
            <div className="hidden md:grid grid-cols-12 gap-0 border-b border-border bg-muted/50 px-5 py-3 text-[0.7rem] uppercase tracking-[0.12em] text-muted-foreground font-medium">
              <div className="col-span-3">Symptom</div>
              <div className="col-span-4">Parts-throwing path</div>
              <div className="col-span-5">Smarter first pass</div>
            </div>
            {rows.map((row, i) => (
              <div
                key={row.problem}
                className={`grid md:grid-cols-12 gap-3 md:gap-0 px-5 py-5 ${
                  i < rows.length - 1 ? "border-b border-border" : ""
                }`}
              >
                <div className="md:col-span-3">
                  <p className="font-medium text-sm">{row.problem}</p>
                </div>
                <div className="md:col-span-4">
                  <p className="text-sm text-muted-foreground">{row.guess}</p>
                  <p className="text-xs mt-1 tabular-nums text-destructive/90">{row.guessCost}</p>
                </div>
                <div className="md:col-span-5">
                  <p className="text-sm text-foreground/90">{row.smarter}</p>
                  <p className="text-xs mt-1 tabular-nums text-success">{row.smarterCost}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;
