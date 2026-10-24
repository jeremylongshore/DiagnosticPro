import IntentPartner from "./IntentPartner";

const scrollToForm = () => {
  if (!document.getElementById("diagnostic-form")) {
    window.location.assign("/#diagnostic-form-flash");
    return;
  }
  window.location.hash = "#diagnostic-form-flash";
  setTimeout(() => {
    document.getElementById("diagnostic-form")?.scrollIntoView({ behavior: "smooth" });
  }, 80);
};

const Header = () => {
  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-background">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <a href="/" className="flex items-baseline gap-0.5 shrink-0">
            <span className="font-display text-base md:text-lg font-bold tracking-tight text-foreground">
              Diagnostic
            </span>
            <span className="font-display text-base md:text-lg font-bold tracking-tight text-primary">
              Pro
            </span>
          </a>

          <nav className="hidden md:flex items-center gap-6 absolute left-1/2 -translate-x-1/2">
            <a
              href="/#diagnostic-form"
              className="inline-flex min-h-11 items-center text-[0.8125rem] text-muted-foreground hover:text-foreground active:text-primary transition-colors duration-200"
            >
              Diagnosis
            </a>
            <a
              href="/#how-it-works"
              className="inline-flex min-h-11 items-center text-[0.8125rem] text-muted-foreground hover:text-foreground active:text-primary transition-colors duration-200"
            >
              How it works
            </a>
            <a
              href="/#pricing"
              className="inline-flex min-h-11 items-center text-[0.8125rem] text-muted-foreground hover:text-foreground active:text-primary transition-colors duration-200"
            >
              Pricing
            </a>
            <a
              href="/about"
              className="inline-flex min-h-11 items-center text-[0.8125rem] text-muted-foreground hover:text-foreground active:text-primary transition-colors duration-200"
            >
              About
            </a>
          </nav>

          {/* Quiet utility control — price lives in hero/pricing, not the nav */}
          <button
            type="button"
            onClick={scrollToForm}
            className="inline-flex h-11 items-center rounded-md border border-input bg-background px-3 text-[0.8125rem] font-medium text-foreground shadow-none transition-colors duration-200 hover:bg-muted active:bg-secondary cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Start diagnosis
          </button>
        </div>
      </header>
      <IntentPartner />
    </>
  );
};

export default Header;
