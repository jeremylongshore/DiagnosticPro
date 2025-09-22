import Header from "@/components/Header";
import Footer from "@/components/Footer";

const Terms = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-16 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>

        <div className="prose prose-lg max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p>
              By accessing and using this AI diagnostic service, you accept and agree to be bound by
              the terms and provision of this agreement.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Service Description</h2>
            <p>
              Our service provides AI-powered diagnostic analysis for equipment issues. The analysis
              is for informational purposes only and should not replace professional mechanical
              consultation.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Payment Terms</h2>
            <p>
              Payment for diagnostic analysis is $4.99 per submission. All payments are processed
              securely through Stripe. Payments are non-refundable once the analysis is delivered.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Limitation of Liability</h2>
            <p>
              Our AI diagnostic service provides analysis based on the information you provide. We
              do not guarantee the accuracy of the diagnosis or recommendations. You acknowledge
              that any actions taken based on our analysis are at your own risk.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Data Usage</h2>
            <p>
              The information you provide will be used solely for generating your diagnostic
              analysis. We may retain anonymized data for service improvement purposes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Modifications</h2>
            <p>
              We reserve the right to modify these terms at any time. Changes will be effective
              immediately upon posting on this page.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Contact Information</h2>
            <p>
              For questions about these Terms of Service, please contact us at
              support@diagnosticpro.io
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Terms;
