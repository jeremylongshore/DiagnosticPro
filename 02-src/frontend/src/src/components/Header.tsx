import { Button } from "@/components/ui/button";

const scrollToForm = () => {
  window.location.hash = "#diagnostic-form-flash";
  setTimeout(() => {
    document.getElementById("diagnostic-form")?.scrollIntoView({ behavior: "smooth" });
  }, 80);
};

const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/85 backdrop-blur-md supports-[backdrop-filter]:bg-background/75">
      <div className="container mx-auto px-4 h-14 md:h-16 flex items-center justify-between gap-4">
        <a href="/" className="flex items-baseline gap-0.5 group">
          <span className="font-display text-lg md:text-xl font-bold tracking-tight text-foreground">
            Diagnostic
          </span>
          <span className="font-display text-lg md:text-xl font-bold tracking-tight text-primary">
            Pro
          </span>
        </a>

        <nav className="hidden md:flex items-center gap-7">
          <a
            href="#diagnostic-form"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
          >
            Diagnosis
          </a>
          <a
            href="#how-it-works"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
          >
            How it works
          </a>
          <a
            href="#pricing"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
          >
            Pricing
          </a>
        </nav>

        <Button variant="default" size="sm" className="font-medium" onClick={scrollToForm}>
          Start — $4.99
        </Button>
      </div>
    </header>
  );
};

export default Header;
