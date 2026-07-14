import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="border-t border-border bg-background">
      <div className="container mx-auto px-4 py-12 md:py-14">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-start md:justify-between gap-10">
          <div className="max-w-sm">
            <p className="font-display text-lg font-bold tracking-tight mb-2">
              Diagnostic<span className="text-primary">Pro</span>
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              AI diagnostic second opinion for equipment owners who want root cause and pricing
              clarity before authorizing repairs.
            </p>
            <p className="text-xs text-muted-foreground">
              Built by{" "}
              <a
                href="https://intentsolutions.io"
                className="underline-offset-2 hover:underline hover:text-foreground transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                Intent Solutions
              </a>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-10 text-sm">
            <div>
              <p className="font-display text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground mb-3">
                Product
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <a href="#diagnostic-form" className="hover:text-foreground transition-colors">
                    Start diagnosis
                  </a>
                </li>
                <li>
                  <a href="#how-it-works" className="hover:text-foreground transition-colors">
                    How it works
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="hover:text-foreground transition-colors">
                    Pricing
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <p className="font-display text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground mb-3">
                Legal
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <Link to="/terms" className="hover:text-foreground transition-colors">
                    Terms
                  </Link>
                </li>
                <li>
                  <Link to="/privacy" className="hover:text-foreground transition-colors">
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link to="/acceptable-use" className="hover:text-foreground transition-colors">
                    Acceptable use
                  </Link>
                </li>
                <li>
                  <a
                    href="mailto:support@diagnosticpro.io"
                    className="hover:text-foreground transition-colors"
                  >
                    support@diagnosticpro.io
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto mt-10 pt-6 border-t border-border/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Intent Solutions Inc. All rights reserved.</p>
          <p className="tabular-nums">diagnosticpro.io</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
