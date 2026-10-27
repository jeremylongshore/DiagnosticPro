import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="border-t border-border bg-background">
      <div className="container mx-auto px-4 py-16 md:py-20">
        <div className="max-w-6xl mx-auto">
          <p className="font-display text-[length:var(--text-display)] font-bold leading-none mb-10 md:mb-12">
            Diagnostic<span className="text-primary">Pro</span>
          </p>

          <div className="grid gap-10 lg:grid-cols-12 lg:gap-x-12">
            <div className="min-w-0 lg:col-span-5">
              <p className="text-base text-muted-foreground leading-relaxed mb-4 max-w-md">
                AI diagnostic second opinion for equipment owners who want root cause and pricing
                clarity before authorizing repairs.
              </p>
              <p className="text-sm text-muted-foreground max-w-md">
                Built by{" "}
                <a
                  href="https://intentsolutions.io"
                  className="underline-offset-2 hover:underline hover:text-foreground active:text-primary transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Intent Solutions
                </a>, an applied AI engineering company. {" "}
                <a href="https://startaitools.com/deployment-thesis/" className="underline underline-offset-4 hover:text-foreground active:text-primary transition-colors">
                  Engineering, evidence, and practical knowledge
                </a>.
              </p>
            </div>

            <nav aria-label="Footer" className="min-w-0 lg:col-span-7 border-t border-border text-sm">
              <div className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-4 py-4 border-b border-border">
                <p className="text-muted-foreground">Product</p>
                <ul className="flex flex-wrap gap-x-6 gap-y-2 text-foreground">
                  <li>
                    <a href="/#diagnostic-form" className="inline-flex min-h-11 items-center underline-offset-4 hover:underline hover:text-primary active:text-primary transition-colors">
                      Start diagnosis
                    </a>
                  </li>
                  <li>
                    <a href="/#how-it-works" className="inline-flex min-h-11 items-center underline-offset-4 hover:underline hover:text-primary active:text-primary transition-colors">
                      How it works
                    </a>
                  </li>
                  <li>
                    <a href="/#pricing" className="inline-flex min-h-11 items-center underline-offset-4 hover:underline hover:text-primary active:text-primary transition-colors">
                      Pricing
                    </a>
                  </li>
                </ul>
              </div>
              <div className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-4 py-4 border-b border-border">
                <p className="text-muted-foreground">Company</p>
                <ul className="flex flex-wrap gap-x-6 gap-y-2 text-foreground">
                  <li>
                    <Link to="/about" className="inline-flex min-h-11 items-center underline-offset-4 hover:underline hover:text-primary active:text-primary transition-colors">
                      About
                    </Link>
                  </li>
                  <li>
                    <a href="https://intentsolutions.io/about/#team" className="inline-flex min-h-11 items-center underline-offset-4 hover:underline hover:text-primary active:text-primary transition-colors">
                      Our team
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://intentsolutions.io"
                      className="inline-flex min-h-11 items-center underline-offset-4 hover:underline hover:text-primary active:text-primary transition-colors"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      intentsolutions.io
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://github.com/jeremylongshore"
                      className="inline-flex min-h-11 items-center underline-offset-4 hover:underline hover:text-primary active:text-primary transition-colors"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      github.com/jeremylongshore
                    </a>
                  </li>
                </ul>
              </div>
              <div className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-4 py-4 border-b border-border">
                <p className="text-muted-foreground">Legal</p>
                <ul className="flex flex-wrap gap-x-6 gap-y-2 text-foreground">
                  <li>
                    <Link to="/terms" className="inline-flex min-h-11 items-center underline-offset-4 hover:underline hover:text-primary active:text-primary transition-colors">
                      Terms
                    </Link>
                  </li>
                  <li>
                    <Link to="/privacy" className="inline-flex min-h-11 items-center underline-offset-4 hover:underline hover:text-primary active:text-primary transition-colors">
                      Privacy
                    </Link>
                  </li>
                  <li>
                    <Link to="/acceptable-use" className="inline-flex min-h-11 items-center underline-offset-4 hover:underline hover:text-primary active:text-primary transition-colors">
                      Acceptable use
                    </Link>
                  </li>
                  <li>
                    <a href="mailto:support@diagnosticpro.io" className="inline-flex min-h-11 items-center underline-offset-4 hover:underline hover:text-primary active:text-primary transition-colors">
                      support@diagnosticpro.io
                    </a>
                  </li>
                </ul>
              </div>
            </nav>
          </div>
        </div>

        <div className="max-w-6xl mx-auto mt-12 pt-6 border-t border-border/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} intentsolutions.io LLC. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <a
              href="https://intentsolutions.io"
              className="hover:text-foreground active:text-primary transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              intentsolutions.io
            </a>
            <a
              href="https://github.com/jeremylongshore"
              className="hover:text-foreground active:text-primary transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
            <span className="tabular-nums">diagnosticpro.io</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
