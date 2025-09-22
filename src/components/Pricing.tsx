import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, MessageSquare, Video, Shield, Crown } from "lucide-react";

const Pricing = () => {
  return (
    <section id="pricing" className="py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Equipment Diagnostic Service</h2>
            <p className="text-lg text-muted-foreground">
              AI-powered diagnosis with quote verification
            </p>
          </div>

          <Card className="text-center shadow-lg">
            <CardHeader className="py-6">
              <div className="w-12 h-12 mx-auto mb-4 bg-trust/10 rounded-full flex items-center justify-center">
                <Shield className="h-6 w-6 text-trust" />
              </div>
              <CardTitle className="text-xl">Diagnostic Analysis</CardTitle>
              <div className="text-3xl font-bold text-trust">$4.99</div>
              <p className="text-sm text-muted-foreground">Complete diagnostic report</p>
            </CardHeader>

            <CardContent className="space-y-4 py-6">
              <ul className="space-y-2 text-left">
                <li className="flex items-start text-sm">
                  <CheckCircle className="h-4 w-4 mr-3 mt-0.5 flex-shrink-0 text-trust" />
                  <span>AI root cause analysis</span>
                </li>
                <li className="flex items-start text-sm">
                  <CheckCircle className="h-4 w-4 mr-3 mt-0.5 flex-shrink-0 text-trust" />
                  <span>Equipment compatibility (cellphones to spaceships)</span>
                </li>
                <li className="flex items-start text-sm">
                  <CheckCircle className="h-4 w-4 mr-3 mt-0.5 flex-shrink-0 text-trust" />
                  <span>Repair quote verification</span>
                </li>
                <li className="flex items-start text-sm">
                  <CheckCircle className="h-4 w-4 mr-3 mt-0.5 flex-shrink-0 text-trust" />
                  <span>Detailed diagnostic report</span>
                </li>
                <li className="flex items-start text-sm">
                  <CheckCircle className="h-4 w-4 mr-3 mt-0.5 flex-shrink-0 text-trust" />
                  <span>Repair recommendations</span>
                </li>
              </ul>

              <div className="pt-4">
                <Button
                  variant="trust"
                  className="w-full"
                  size="lg"
                  onClick={() => {
                    const form = document.getElementById("diagnostic-form");
                    form?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  Start Diagnosis - $4.99
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
