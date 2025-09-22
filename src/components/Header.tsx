import { Button } from "@/components/ui/button";

const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center">
          <span className="text-xl font-bold text-foreground">DiagnosticPro</span>
        </div>

        <nav className="hidden md:flex items-center space-x-6">
          <a
            href="#diagnostic-form"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Get Diagnosis
          </a>
          <a
            href="#how-it-works"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            How It Works
          </a>
        </nav>

        <div className="flex items-center">
          <Button
            variant="trust"
            size="sm"
            onClick={() => {
              // Change hash to trigger flash animation, then scroll
              window.location.hash = '#diagnostic-form-flash';
              
              setTimeout(() => {
                const form = document.getElementById("diagnostic-form");
                form?.scrollIntoView({ behavior: "smooth" });
              }, 100);
            }}
          >
            Start Diagnosis - $4.99
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
