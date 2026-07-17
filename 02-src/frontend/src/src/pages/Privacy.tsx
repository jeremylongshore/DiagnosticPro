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
              <li>
                <strong>Optional photos</strong> you choose to attach to your submission (up to three per
                submission, JPEG/PNG/WebP, max 2 MB each). Photo attachments are entirely optional; you
                can complete a purchase without ever attaching an image.
              </li>
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
            <h2 className="text-2xl font-semibold mb-4">3. Photo Evidence and AI Vision Processing</h2>
            <p>
              If you choose to attach photos, they are processed by an AI vision provider (OpenAI&apos;s
              GPT-4o multimodal model, configured via our self-hosted environment) to extract a caption
              and any visible printed text (for example, an error code on a dashboard). The caption and
              text are fused into your diagnostic report; the AI only describes what is visible and never
              diagnoses beyond the image.
            </p>
            <p>
              Attached photos are stored privately on a self-hosted volume alongside your submission. They
              are <strong>not</strong> publicly served — there is no public URL, no listing endpoint, and
              no CDN. They are never shared with third parties other than the configured AI vision
              provider for captioning purposes.
            </p>
            <p>
              You may delete any attached photo at any time before payment. After payment, the photos
              become part of the locked submission record and can only be removed by emailing
              privacy@diagnosticpro.io with your submission ID.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Data Security</h2>
            <p>
              We implement appropriate security measures to protect your personal information.
              Payment data is processed securely through Stripe and we do not store credit card
              information. All data — including photo attachments — is stored on a self-hosted
              infrastructure (Contabo VPS) behind a Caddy reverse proxy. SQLite databases and the
              private uploads volume are never exposed to the public internet.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Data Sharing</h2>
            <p>
              We do not sell, trade, or rent your personal information to third parties. We may
              share anonymized, aggregated data for analytical purposes. The only third party that
              ever sees your raw photo is the configured AI vision provider used solely to generate
              the caption described in Section 3.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Data Retention</h2>
            <p>
              We retain your diagnostic submission data for service delivery and improvement
              purposes. You may request deletion of your data at any time by contacting us.
              Photo attachments for unpaid submissions are automatically purged after 48 hours.
              Photo attachments tied to paid submissions are retained for the life of the
              submission record and removed on request.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Third-Party Services</h2>
            <p>We use third-party services including:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Stripe for payment processing</li>
              <li>Email delivery services for sending reports</li>
              <li>OpenAI (gpt-5.4 for the diagnostic report and gpt-4o for optional photo captioning)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Access your personal data</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data (including attached photos)</li>
              <li>Opt-out of communications</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Contact Us</h2>
            <p>For privacy-related questions or requests, contact us at privacy@diagnosticpro.io</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Updates to This Policy</h2>
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