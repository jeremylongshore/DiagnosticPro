import {
  MessageCircle,
  Mail,
  Phone,
  Twitter,
  Facebook,
  Instagram,
  Linkedin,
  Youtube,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const Footer = () => {
  return (
    <footer className="bg-muted/30 border-t">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="lg:col-span-1">
              <div className="flex items-center space-x-2 mb-4">
                <span className="text-xl font-bold">DiagnosticPro</span>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                AI-powered diagnostic intelligence for equipment from cellphones to spaceships.
                Precise root cause analysis using advanced artificial intelligence.
              </p>
              <div className="space-y-4">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Mail className="h-4 w-4 mr-2" />
                  reports@diagnosticpro.io
                </div>

                {/* Social Media Links */}
                <div>
                  <h5 className="font-medium text-sm mb-3">Connect with Jeremy</h5>
                  <div className="flex space-x-3">
                    <a
                      href="https://x.com/asphaltcowb0y"
                      className="text-muted-foreground hover:text-primary transition-colors"
                      aria-label="Twitter"
                    >
                      <Twitter className="h-5 w-5" />
                    </a>
                    <a
                      href="https://linkedin.com/in/jeremylongshore"
                      className="text-muted-foreground hover:text-primary transition-colors"
                      aria-label="LinkedIn"
                    >
                      <Linkedin className="h-5 w-5" />
                    </a>
                  </div>
                  <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                    <div>jeremylongshore.com</div>
                    <div>linkedin.com/in/jeremylongshore</div>
                    <div>
                      <a
                        href="https://www.upwork.com/freelancers/jeremylongshore"
                        className="hover:text-foreground transition-colors"
                      >
                        upwork.com/freelancers/jeremylongshore
                      </a>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">Created by Intent Solutions Inc</p>
              </div>
            </div>

            {/* Services */}
            <div>
              <h4 className="font-semibold mb-4">Services</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a
                    href="mailto:support@diagnosticpro.io?subject=AI Diagnosis Inquiry"
                    className="hover:text-foreground transition-colors"
                  >
                    AI Diagnosis
                  </a>
                </li>
                <li>
                  <a
                    href="mailto:support@diagnosticpro.io?subject=Invoice Analysis Inquiry"
                    className="hover:text-foreground transition-colors"
                  >
                    Invoice Analysis
                  </a>
                </li>
                <li>
                  <a
                    href="mailto:support@diagnosticpro.io?subject=Expert Consultation Inquiry"
                    className="hover:text-foreground transition-colors"
                  >
                    Expert Consultation
                  </a>
                </li>
                <li>
                  <a
                    href="mailto:support@diagnosticpro.io?subject=Ripoff Protection Inquiry"
                    className="hover:text-foreground transition-colors"
                  >
                    Ripoff Protection
                  </a>
                </li>
                <li>
                  <a
                    href="mailto:support@diagnosticpro.io?subject=Parts Throwing Prevention Inquiry"
                    className="hover:text-foreground transition-colors"
                  >
                    Parts Throwing Prevention
                  </a>
                </li>
              </ul>
            </div>

            {/* For Experts */}
            <div>
              <h4 className="font-semibold mb-4">For Experts</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a
                    href="mailto:support@diagnosticpro.io?subject=Join Our Platform Inquiry"
                    className="hover:text-foreground transition-colors"
                  >
                    Join Our Platform
                  </a>
                </li>
                <li>
                  <a
                    href="mailto:support@diagnosticpro.io?subject=Expert Guidelines Inquiry"
                    className="hover:text-foreground transition-colors"
                  >
                    Expert Guidelines
                  </a>
                </li>
                <li>
                  <a
                    href="mailto:support@diagnosticpro.io?subject=Earnings Calculator Inquiry"
                    className="hover:text-foreground transition-colors"
                  >
                    Earnings Calculator
                  </a>
                </li>
                <li>
                  <a
                    href="mailto:support@diagnosticpro.io?subject=Success Stories Inquiry"
                    className="hover:text-foreground transition-colors"
                  >
                    Success Stories
                  </a>
                </li>
                <li>
                  <a
                    href="mailto:support@diagnosticpro.io?subject=Expert Support Inquiry"
                    className="hover:text-foreground transition-colors"
                  >
                    Expert Support
                  </a>
                </li>
              </ul>
            </div>

            {/* CTA */}
            <div>
              <h4 className="font-semibold mb-4">Get Started</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Ready to stop getting ripped off? Get your first diagnosis and see how much you can
                save.
              </p>
              <Button
                variant="trust"
                className="w-full mb-4"
                onClick={() => {
                  const form = document.getElementById("diagnostic-form");
                  form?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Get Diagnosis Now
              </Button>
              <div className="text-xs text-muted-foreground">
                Average customer saves $1,200+ per year
              </div>
            </div>
          </div>

          {/* Bottom */}
          <div className="border-t border-border/50 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <div className="text-sm text-muted-foreground mb-4 md:mb-0">
              © 2024 DiagnosticPro by Intent Solutions. All rights reserved. | Privacy Policy |
              Terms of Service
            </div>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <span>AI-Powered</span>
              <span>•</span>
              <span>Root Cause Analysis</span>
              <span>•</span>
              <span>Universal Equipment</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
