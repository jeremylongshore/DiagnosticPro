import Header from "@/components/Header";
import Footer from "@/components/Footer";

const AcceptableUse = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-16 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">Acceptable Use Policy</h1>

        <div className="prose prose-lg max-w-none space-y-6">
          <section>
            <p>
              This Acceptable Use Policy governs your use of DiagnosticPro. By submitting a
              diagnostic request or otherwise using the service, you agree to the terms below. It
              supplements our{" "}
              <a href="/terms" className="underline hover:text-foreground transition-colors">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="/privacy" className="underline hover:text-foreground transition-colors">
                Privacy Policy
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Permitted Use</h2>
            <p>
              DiagnosticPro provides AI-generated diagnostic analysis for equipment and vehicles.
              You may use the service to obtain diagnostic guidance for equipment you own, operate,
              or are authorized to service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Prohibited Conduct</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Submit unlawful, fraudulent, or deliberately misleading information</li>
              <li>Use the service to build, train, or benchmark a competing product</li>
              <li>Scrape, harvest, or bulk-extract reports or other content</li>
              <li>Attempt to reverse engineer, probe, or circumvent access controls or rate limits</li>
              <li>Resell, sublicense, or redistribute reports without written permission</li>
              <li>Upload malware or attempt to disrupt the service or its infrastructure</li>
              <li>Infringe the intellectual-property or privacy rights of others</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Safety and No Warranty</h2>
            <p>
              Diagnostic reports are AI-generated guidance, not a substitute for a qualified
              technician's inspection. Always follow manufacturer procedures and applicable safety
              regulations. Do not rely solely on a report for repairs affecting safety, and never
              attempt work beyond your competence or authorization. The service is provided "as is"
              without warranty of accuracy or fitness for a particular purpose.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Fair Use and Automated Access</h2>
            <p>
              Access is intended for individual, human-initiated diagnostic requests. Automated or
              high-volume access is not permitted without prior written agreement. We may apply rate
              limits and suspend accounts that place an unreasonable load on the service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Enforcement</h2>
            <p>
              We may investigate suspected violations and may suspend or terminate access, remove
              content, and cooperate with law enforcement where appropriate. Violations may be
              actioned without prior notice where necessary to protect the service or its users.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Changes to This Policy</h2>
            <p>
              We may update this Acceptable Use Policy from time to time. Changes will be posted on
              this page with an updated effective date.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Contact</h2>
            <p>
              Questions about acceptable use can be sent to support@diagnosticpro.io.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AcceptableUse;
