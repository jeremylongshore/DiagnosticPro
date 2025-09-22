import Header from "@/components/Header";
import Footer from "@/components/Footer";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-16 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>

        <div className="prose prose-lg max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Information We Collect</h2>
            <p>We collect information you provide when using our diagnostic service, including:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Equipment information (make, model, year, serial number)</li>
              <li>Problem descriptions and symptoms</li>
              <li>Contact information (name, email, phone)</li>
              <li>Payment information (processed securely by Stripe)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. How We Use Your Information</h2>
            <p>Your information is used to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Generate your AI diagnostic analysis</li>
              <li>Deliver your analysis report via email</li>
              <li>Process payments securely</li>
              <li>Improve our service (using anonymized data)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Data Security</h2>
            <p>
              We implement appropriate security measures to protect your personal information.
              Payment data is processed securely through Stripe and we do not store credit card
              information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Data Sharing</h2>
            <p>
              We do not sell, trade, or rent your personal information to third parties. We may
              share anonymized, aggregated data for analytical purposes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Data Retention</h2>
            <p>
              We retain your diagnostic submission data for service delivery and improvement
              purposes. You may request deletion of your data by contacting us.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Third-Party Services</h2>
            <p>We use third-party services including:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Stripe for payment processing</li>
              <li>Email delivery services for sending reports</li>
              <li>Cloud hosting for data storage and processing</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Access your personal data</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Opt-out of communications</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Contact Us</h2>
            <p>For privacy-related questions or requests, contact us at privacy@diagnosticpro.io</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Updates to This Policy</h2>
            <p>
              We may update this privacy policy from time to time. Changes will be posted on this
              page with an updated effective date.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Privacy;
