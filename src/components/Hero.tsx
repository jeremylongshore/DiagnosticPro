import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Shield, DollarSign, Clock } from "lucide-react";
import heroImage from "@/assets/hero-diagnostic.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-10"
        style={{ backgroundImage: `url(${heroImage})` }}
      />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-trust/5 via-background to-savings/5" />

      <div className="container relative z-10 mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badges */}
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            <Badge variant="outline" className="bg-trust/10 text-trust border-trust/20">
              <Shield className="h-3 w-3 mr-1" />
              AI Intelligence
            </Badge>
            <Badge variant="outline" className="bg-savings/10 text-savings border-savings/20">
              <DollarSign className="h-3 w-3 mr-1" />
              Root Cause Analysis
            </Badge>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              <Clock className="h-3 w-3 mr-1" />
              Universal Equipment
            </Badge>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4">
            Stop Expensive Guessing
            <span className="block text-transparent bg-gradient-to-r from-trust to-savings bg-clip-text">
              Pro Power, Your Control
            </span>
            The New Standard
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-muted-foreground mb-6 max-w-3xl mx-auto leading-relaxed">
            Before you pay for repairs, know what's actually wrong. Pro level diagnostics now in
            your hands, empowering you to set expectations with professional power and customer
            control.
          </p>

          {/* Value Props */}
          <div className="flex flex-wrap justify-center gap-4 mb-8 text-sm">
            <div className="flex items-center text-savings">
              <CheckCircle className="h-4 w-4 mr-2" />
              Root Cause Detection
            </div>
            <div className="flex items-center text-savings">
              <CheckCircle className="h-4 w-4 mr-2" />
              Quote Verification
            </div>
            <div className="flex items-center text-savings">
              <CheckCircle className="h-4 w-4 mr-2" />
              AI-Powered Intelligence
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-8">
            <Button
              variant="hero"
              size="lg"
              className="min-w-48"
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

          {/* Social Proof */}
          <div className="pt-6 border-t border-border/50">
            <p className="text-sm text-muted-foreground mb-3">
              Trusted by repair shops nationwide • Used by professionals daily
            </p>
            <div className="flex flex-wrap justify-center gap-6 text-xs text-muted-foreground">
              <div className="text-center">
                <div className="text-lg font-bold text-savings">Pro-Grade</div>
                <div>Shop-quality diagnostics</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-trust">Universal</div>
                <div>All equipment types</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-primary">$4.99</div>
                <div>Direct access</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
