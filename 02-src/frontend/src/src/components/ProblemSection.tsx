// Illustrative ranges, checked 2026-10-25 against public cost guides:
// misfire chain: RepairPal ignition coil $227-$335 and fuel injector $751-$971 per job;
// AC compressor: HomeAdvisor/Angi $800-$2,800 (average about $1,200), capacitor parts
// $8-$60 and contactor parts $15-$120 (PickHVAC); DPF alone: $3,000-$5,000 (fleet and
// owner reports), a full aftertreatment system can exceed $10,000, so the row names the DPF.
const rows = [
  {
    problem: "Rough idle / misfire",
    guess: "Plugs → coils → injectors",
    guessCost: "$1,400+",
    smarter: "Confirm vacuum leak / cylinder isolation first",
    smarterCost: "Often under $50 in parts",
  },
  {
    problem: "AC not cooling",
    guess: "New compressor package",
    guessCost: "$800–$2,800",
    smarter: "Capacitor / contactor / airflow checks first",
    smarterCost: "Often under $100 in parts",
  },
  {
    problem: "Diesel derate / DPF",
    guess: "New DPF assembly",
    guessCost: "$3,000–$5,000",
    smarter: "Sensor, regen path, and code sequence first",
    smarterCost: "Verify before major parts",
  },
];

const ProblemSection = () => {
  return (
    <section className="py-24 md:py-32 border-b border-border/70 bg-muted/40">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12 md:mb-16 grid gap-5 lg:grid-cols-12 lg:gap-x-12 lg:items-end">
            <h2 className="section-title lg:col-span-7">
              Guessing is expensive. Sequencing is not.
            </h2>
            <p className="lg:col-span-5 text-base text-muted-foreground leading-relaxed">
              Shops often replace parts until something works. A second opinion helps you ask for the
              right tests and walk away from premature big-ticket replacements.
            </p>
          </div>

          <div className="overflow-hidden rounded-lg border border-border bg-card shadow-[var(--shadow-card)]">
            <div className="hidden md:grid grid-cols-12 gap-0 border-b border-border bg-muted/50 px-6 py-3 text-sm text-muted-foreground">
              <div className="col-span-3">Symptom</div>
              <div className="col-span-4">Parts-throwing path</div>
              <div className="col-span-5">Smarter first pass</div>
            </div>
            {rows.map((row, i) => (
              <div
                key={row.problem}
                className={`grid md:grid-cols-12 gap-3 md:gap-0 px-6 py-6 ${
                  i < rows.length - 1 ? "border-b border-border" : ""
                }`}
              >
                <div className="md:col-span-3">
                  <p className="item-title">{row.problem}</p>
                </div>
                <div className="md:col-span-4">
                  <p className="text-base text-muted-foreground">{row.guess}</p>
                  <p className="font-display text-xl font-bold mt-2 tabular-nums text-destructive">{row.guessCost}</p>
                </div>
                <div className="md:col-span-5">
                  <p className="text-base text-foreground">{row.smarter}</p>
                  <p className="font-display text-xl font-bold mt-2 tabular-nums text-success">{row.smarterCost}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Typical cost ranges, shown for illustration. They are not a quote; your shop&apos;s price
            depends on your equipment, parts and labor rates.
          </p>
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;
