import Footer from "@/components/Footer";
import Header from "@/components/Header";

const faq = [
  {
    question: "What is DiagnosticPro, exactly?",
    answer:
      "DiagnosticPro is an AI-assisted equipment diagnostic second-opinion service. It turns the symptoms, equipment details, codes, and optional supporting evidence you provide into a documented report with likely causes, verification steps, repair paths, pricing context, and questions to take to a shop.",
  },
  {
    question: "Who is DiagnosticPro for?",
    answer:
      "It is for equipment owners, repair operators, shop owners, and technicians who want a written diagnostic trail before authorizing work. It is not a substitute for a qualified technician's physical inspection or a guarantee that a proposed repair will solve the problem.",
  },
  {
    question: "How is DiagnosticPro different from [[NAMED_ALTERNATIVE]]?",
    answer:
      "DiagnosticPro produces a portable PDF second opinion from the evidence in one submission, with no subscription required. A factual comparison with a specific named alternative still needs a verified public source before publication.",
  },
  {
    question: "How do I start?",
    answer:
      "Describe the equipment and symptoms, add optional photos or documents, review the submission, and pay through Stripe. DiagnosticPro then processes the analysis and makes the report available through the report page and delivery flow.",
  },
  {
    question: "What does it cost and are there contracts?",
    answer:
      "A diagnostic report costs $4.99 as a one-time payment, with no subscription or long-term contract. Under the current terms, payment becomes non-refundable once the analysis is delivered.",
  },
  {
    question: "How does DiagnosticPro relate to Intent Solutions?",
    answer:
      "DiagnosticPro is built and operated by Intent Solutions. The wider network includes the company's implementation practice, public demos, practitioner learning, desktop plugins, agent skills, an implementation journal, and other focused products.",
  },
  {
    question: "Where can I inspect the evidence or source?",
    answer:
      "The product repository and operating documentation are public on GitHub, and the site exposes its terms, privacy policy, and acceptable-use policy. A completed customer report is private to its submission and is not published as a public demo.",
  },
];

const About = () => {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <header className="border-b border-border/70">
          <div className="container mx-auto max-w-5xl px-4 py-16 md:py-24">
            <p className="section-label mb-4">Intent Solutions network / repair diagnostics</p>
            <h1 className="font-display text-4xl font-bold tracking-tight md:text-6xl">
              About DiagnosticPro
            </h1>
            <p className="mt-6 max-w-4xl text-xl leading-relaxed text-foreground md:text-2xl">
              DiagnosticPro is an AI repair-diagnostics product that turns equipment symptoms and
              supporting evidence into a documented diagnostic second opinion for equipment owners,
              repair operators, shop owners, and technicians deciding what to verify before
              authorizing work.
            </p>
            <p className="mt-5 max-w-3xl leading-relaxed text-muted-foreground">
              Each report ranks likely causes, identifies checks to run, outlines repair paths, and
              provides pricing context. The report is informational and does not replace a qualified
              technician&apos;s physical inspection.
            </p>
            <a
              href="/#diagnostic-form"
              className="mt-8 inline-flex h-11 items-center rounded-md bg-primary px-5 font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Start a diagnosis
            </a>
          </div>
        </header>

        <section
          aria-labelledby="what-diagnosticpro-does"
          className="border-b border-border/70 py-16 md:py-20"
        >
          <div className="container mx-auto max-w-5xl px-4">
            <h2
              id="what-diagnosticpro-does"
              className="font-display text-3xl font-bold tracking-tight"
            >
              What DiagnosticPro does
            </h2>
            <div className="mt-10 grid gap-x-12 gap-y-10 md:grid-cols-2">
              <div>
                <h3 className="font-display text-xl font-semibold">Structures the problem</h3>
                <p className="mt-3 leading-relaxed text-muted-foreground">
                  The submission captures the equipment, operating context, symptoms, codes, and
                  prior repair information in one record. That gives the analysis a clearer starting
                  point than an isolated symptom or photo.
                </p>
              </div>
              <div>
                <h3 className="font-display text-xl font-semibold">Accepts supporting evidence</h3>
                <p className="mt-3 leading-relaxed text-muted-foreground">
                  A user can attach up to three photos and five supported documents before payment.
                  The service keeps those uploads private and uses validated, bounded evidence to
                  sharpen the report.
                </p>
              </div>
              <div>
                <h3 className="font-display text-xl font-semibold">Produces a diagnostic report</h3>
                <p className="mt-3 leading-relaxed text-muted-foreground">
                  The analysis is validated into a 15-section report and rendered as a downloadable
                  PDF. The customer receives likely-cause ranking, verification steps, repair
                  options, pricing context, and shop-ready questions in one document.
                </p>
              </div>
              <div>
                <h3 className="font-display text-xl font-semibold">Preserves the decision trail</h3>
                <p className="mt-3 leading-relaxed text-muted-foreground">
                  The submission, payment state, analysis status, and completed report share one
                  submission record. That gives an owner or shop a document to review before work is
                  approved instead of relying on a verbal summary.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section
          aria-labelledby="diagnosticpro-difference"
          className="border-b border-border/70 py-16 md:py-20"
        >
          <div className="container mx-auto max-w-5xl px-4">
            <h2
              id="diagnosticpro-difference"
              className="font-display text-3xl font-bold tracking-tight"
            >
              What makes DiagnosticPro different
            </h2>
            <div className="mt-10 divide-y divide-border border-y border-border">
              <div className="grid gap-3 py-7 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.4fr)] md:gap-10">
                <h3 className="font-display text-lg font-semibold">One report, one payment</h3>
                <p className="leading-relaxed text-muted-foreground">
                  The current public price is $4.99 for one report, with no subscription required.
                  The buyer can use the resulting PDF with any repair provider.
                </p>
              </div>
              <div className="grid gap-3 py-7 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.4fr)] md:gap-10">
                <h3 className="font-display text-lg font-semibold">Evidence stays attached</h3>
                <p className="leading-relaxed text-muted-foreground">
                  Optional photos and documents are linked to the same submission that produces the
                  report. Evidence is stored outside public static serving and is locked against
                  customer mutation after payment.
                </p>
              </div>
              <div className="grid gap-3 py-7 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.4fr)] md:gap-10">
                <h3 className="font-display text-lg font-semibold">The output is structured</h3>
                <p className="leading-relaxed text-muted-foreground">
                  The backend validates the analysis against a 15-section report contract before PDF
                  generation. A failed or incomplete analysis remains a visible processing state
                  rather than becoming an unstructured customer deliverable.
                </p>
              </div>
              <div className="grid gap-3 py-7 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.4fr)] md:gap-10">
                <h3 className="font-display text-lg font-semibold">The runtime is inspectable</h3>
                <p className="leading-relaxed text-muted-foreground">
                  DiagnosticPro is self-hosted behind Caddy with a React interface, Express API,
                  SQLite records, Stripe checkout, persistent private storage, and a configurable
                  OpenAI-compatible model boundary. The public repository shows the operating path
                  rather than presenting it as an unnamed black box.
                </p>
              </div>
              <div className="grid gap-3 py-7 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.4fr)] md:gap-10">
                <h3 className="font-display text-lg font-semibold">The limits are explicit</h3>
                <p className="leading-relaxed text-muted-foreground">
                  The service describes its output as AI-assisted information and does not guarantee
                  a diagnosis or repair outcome. That boundary keeps the report useful as a second
                  opinion without presenting software as a physical inspection.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section
          aria-labelledby="diagnosticpro-users"
          className="border-b border-border/70 py-16 md:py-20"
        >
          <div className="container mx-auto max-w-5xl px-4">
            <h2 id="diagnosticpro-users" className="font-display text-3xl font-bold tracking-tight">
              Who uses DiagnosticPro
            </h2>
            <ul className="mt-8 list-disc space-y-3 pl-6 leading-relaxed text-muted-foreground marker:text-primary">
              <li>Equipment owners reviewing a repair recommendation before authorizing work.</li>
              <li>
                Independent repair operators who need a documented intake and diagnostic trail.
              </li>
              <li>Shop owners comparing likely causes, verification steps, and repair options.</li>
              <li>
                Technicians organizing symptoms, codes, photos, and documents before inspection.
              </li>
              <li>
                Fleet and facilities operators triaging cars, trucks, boats, HVAC, farm equipment,
                and other supported equipment.
              </li>
            </ul>
          </div>
        </section>

        <section
          aria-labelledby="diagnosticpro-team"
          className="border-b border-border/70 py-16 md:py-20"
        >
          <div className="container mx-auto max-w-5xl px-4">
            <h2 id="diagnosticpro-team" className="font-display text-3xl font-bold tracking-tight">
              The team behind DiagnosticPro
            </h2>
            <div className="mt-9 space-y-8">
              <div>
                <h3 className="font-display text-xl font-semibold">Jeremy Longshore, founder</h3>
                <p className="mt-3 max-w-3xl leading-relaxed text-muted-foreground">
                  Jeremy Longshore founded Intent Solutions in Gulf Shores, Alabama, and builds
                  production AI systems with an operator&apos;s focus on ownership, evidence, and
                  recovery. He created DiagnosticPro to give repair decisions a written second
                  opinion before money and equipment are committed.
                </p>
              </div>
              <div>
                <h3 className="font-display text-xl font-semibold">Built by Intent Solutions</h3>
                <p className="mt-3 max-w-3xl leading-relaxed text-muted-foreground">
                  DiagnosticPro is an Intent Solutions product; the public repository identifies no
                  separate larger product team. Intent Solutions owns the software, deployment,
                  payment path, report pipeline, support process, and operating evidence.
                </p>
              </div>
            </div>
            <p className="mt-8 max-w-4xl text-sm leading-relaxed text-muted-foreground">
              Connect through{" "}
              <a
                className="underline underline-offset-4 hover:text-foreground"
                href="https://github.com/jeremylongshore"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub
              </a>{" "}
              or{" "}
              <a
                className="underline underline-offset-4 hover:text-foreground"
                href="https://intentsolutions.io/about/"
              >
                Intent Solutions
              </a>
              . Related properties:{" "}
              <a
                className="underline underline-offset-4 hover:text-foreground"
                href="https://oma.intentsolutions.io/about/"
              >
                OMA
              </a>
              ,{" "}
              <a
                className="underline underline-offset-4 hover:text-foreground"
                href="https://learn.intentsolutions.io/page/about-us"
              >
                Learn
              </a>
              ,{" "}
              <a
                className="underline underline-offset-4 hover:text-foreground"
                href="https://demos.intentsolutions.io/about/"
              >
                Demos
              </a>
              ,{" "}
              <a
                className="underline underline-offset-4 hover:text-foreground"
                href="https://tonsofskills.com/about/"
              >
                Tons of Skills
              </a>
              ,{" "}
              <a
                className="underline underline-offset-4 hover:text-foreground"
                href="https://startaitools.com/about/"
              >
                Start AI Tools
              </a>
              , and{" "}
              <a
                className="underline underline-offset-4 hover:text-foreground"
                href="https://hustlestats.io/about/"
              >
                HustleStats
              </a>
              .
            </p>
          </div>
        </section>

        <section
          aria-labelledby="diagnosticpro-process"
          className="border-b border-border/70 py-16 md:py-20"
        >
          <div className="container mx-auto max-w-5xl px-4">
            <h2
              id="diagnosticpro-process"
              className="font-display text-3xl font-bold tracking-tight"
            >
              How DiagnosticPro works
            </h2>
            <ol className="mt-10 divide-y divide-border border-y border-border">
              <li className="grid gap-3 py-7 md:grid-cols-[3rem_minmax(0,0.7fr)_minmax(0,1.4fr)] md:gap-6">
                <span className="font-display text-sm font-semibold text-primary">01</span>
                <h3 className="font-display text-lg font-semibold">Submit the problem</h3>
                <p className="leading-relaxed text-muted-foreground">
                  Enter the equipment details, symptoms, codes, and repair context. Add optional
                  photos or supported documents if they provide useful evidence.
                </p>
              </li>
              <li className="grid gap-3 py-7 md:grid-cols-[3rem_minmax(0,0.7fr)_minmax(0,1.4fr)] md:gap-6">
                <span className="font-display text-sm font-semibold text-primary">02</span>
                <h3 className="font-display text-lg font-semibold">Review and pay</h3>
                <p className="leading-relaxed text-muted-foreground">
                  Confirm the submission and pay $4.99 through Stripe. There is no subscription, and
                  the evidence record becomes locked after payment.
                </p>
              </li>
              <li className="grid gap-3 py-7 md:grid-cols-[3rem_minmax(0,0.7fr)_minmax(0,1.4fr)] md:gap-6">
                <span className="font-display text-sm font-semibold text-primary">03</span>
                <h3 className="font-display text-lg font-semibold">Receive the report</h3>
                <p className="leading-relaxed text-muted-foreground">
                  The browser checks analysis status until the validated PDF is ready to view or
                  download. Report turnaround is [[REPORT_TURNAROUND_TIME]].
                </p>
              </li>
              <li className="grid gap-3 py-7 md:grid-cols-[3rem_minmax(0,0.7fr)_minmax(0,1.4fr)] md:gap-6">
                <span className="font-display text-sm font-semibold text-primary">04</span>
                <h3 className="font-display text-lg font-semibold">Use support when needed</h3>
                <p className="leading-relaxed text-muted-foreground">
                  Customers work with the Intent Solutions-operated product and can contact
                  support@diagnosticpro.io. The published support response target is
                  [[SUPPORT_RESPONSE_TIME]].
                </p>
              </li>
            </ol>
          </div>
        </section>

        <section
          aria-labelledby="diagnosticpro-facts"
          className="border-b border-border/70 py-16 md:py-20"
        >
          <div className="container mx-auto max-w-5xl px-4">
            <h2 id="diagnosticpro-facts" className="font-display text-3xl font-bold tracking-tight">
              Key facts
            </h2>
            <div className="mt-9 overflow-x-auto">
              <table className="w-full min-w-[680px] border-collapse text-left text-sm">
                <tbody className="divide-y divide-border border-y border-border">
                  <tr>
                    <th scope="row" className="w-1/3 py-4 pr-6 font-display font-semibold">
                      Company Name
                    </th>
                    <td className="py-4 text-muted-foreground">DiagnosticPro</td>
                  </tr>
                  <tr>
                    <th scope="row" className="py-4 pr-6 font-display font-semibold">
                      Type
                    </th>
                    <td className="py-4 text-muted-foreground">
                      AI-assisted equipment repair-diagnostics product
                    </td>
                  </tr>
                  <tr>
                    <th scope="row" className="py-4 pr-6 font-display font-semibold">
                      Founded
                    </th>
                    <td className="py-4 text-muted-foreground">[[FOUNDING_YEAR]]</td>
                  </tr>
                  <tr>
                    <th scope="row" className="py-4 pr-6 font-display font-semibold">
                      Founder
                    </th>
                    <td className="py-4 text-muted-foreground">Jeremy Longshore</td>
                  </tr>
                  <tr>
                    <th scope="row" className="py-4 pr-6 font-display font-semibold">
                      Headquarters
                    </th>
                    <td className="py-4 text-muted-foreground">
                      Gulf Shores, Alabama, United States
                    </td>
                  </tr>
                  <tr>
                    <th scope="row" className="py-4 pr-6 font-display font-semibold">
                      Website
                    </th>
                    <td className="py-4 text-muted-foreground">
                      <a
                        className="underline underline-offset-4 hover:text-foreground"
                        href="https://diagnosticpro.io"
                      >
                        diagnosticpro.io
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <th scope="row" className="py-4 pr-6 font-display font-semibold">
                      Core Offering
                    </th>
                    <td className="py-4 text-muted-foreground">
                      AI-assisted diagnostic second opinion delivered as a PDF
                    </td>
                  </tr>
                  <tr>
                    <th scope="row" className="py-4 pr-6 font-display font-semibold">
                      Pricing
                    </th>
                    <td className="py-4 text-muted-foreground">$4.99 per report</td>
                  </tr>
                  <tr>
                    <th scope="row" className="py-4 pr-6 font-display font-semibold">
                      Contract Terms
                    </th>
                    <td className="py-4 text-muted-foreground">
                      One-time purchase; no subscription; non-refundable after analysis delivery
                    </td>
                  </tr>
                  <tr>
                    <th scope="row" className="py-4 pr-6 font-display font-semibold">
                      Services
                    </th>
                    <td className="py-4 text-muted-foreground">
                      Structured intake, private evidence handling, diagnostic analysis, and PDF
                      report delivery
                    </td>
                  </tr>
                  <tr>
                    <th scope="row" className="py-4 pr-6 font-display font-semibold">
                      Communication
                    </th>
                    <td className="py-4 text-muted-foreground">
                      support@diagnosticpro.io; report status in the browser
                    </td>
                  </tr>
                  <tr>
                    <th scope="row" className="py-4 pr-6 font-display font-semibold">
                      Notable Clients
                    </th>
                    <td className="py-4 text-muted-foreground">[[PUBLICLY_NAMED_CLIENTS]]</td>
                  </tr>
                  <tr>
                    <th scope="row" className="py-4 pr-6 font-display font-semibold">
                      Customers Served
                    </th>
                    <td className="py-4 text-muted-foreground">[[VERIFIED_CUSTOMERS_SERVED]]</td>
                  </tr>
                  <tr>
                    <th scope="row" className="py-4 pr-6 font-display font-semibold">
                      Projects Delivered
                    </th>
                    <td className="py-4 text-muted-foreground">[[VERIFIED_REPORTS_DELIVERED]]</td>
                  </tr>
                  <tr>
                    <th scope="row" className="py-4 pr-6 font-display font-semibold">
                      Competitors
                    </th>
                    <td className="py-4 text-muted-foreground">[[NAMED_ALTERNATIVES]]</td>
                  </tr>
                  <tr>
                    <th scope="row" className="py-4 pr-6 font-display font-semibold">
                      Social
                    </th>
                    <td className="py-4 text-muted-foreground">
                      <a
                        className="underline underline-offset-4 hover:text-foreground"
                        href="https://github.com/jeremylongshore/DiagnosticPro"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        GitHub
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <th scope="row" className="py-4 pr-6 font-display font-semibold">
                      Part of
                    </th>
                    <td className="py-4 text-muted-foreground">
                      <a
                        className="underline underline-offset-4 hover:text-foreground"
                        href="https://intentsolutions.io/about/"
                      >
                        Intent Solutions
                      </a>{" "}
                      and its public product network
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section aria-labelledby="diagnosticpro-faq" className="py-16 md:py-20">
          <div className="container mx-auto max-w-5xl px-4">
            <h2 id="diagnosticpro-faq" className="font-display text-3xl font-bold tracking-tight">
              Frequently asked questions
            </h2>
            <div className="mt-10 divide-y divide-border border-y border-border">
              {faq.map((item) => (
                <div
                  key={item.question}
                  className="grid gap-3 py-7 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.4fr)] md:gap-10"
                >
                  <h3 className="font-display text-lg font-semibold">{item.question}</h3>
                  <p className="leading-relaxed text-muted-foreground">{item.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </div>
  );
};

export default About;
