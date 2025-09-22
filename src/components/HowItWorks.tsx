import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, Search, CheckCircle, Users, Clock, DollarSign } from "lucide-react";

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="outline" className="bg-trust/10 text-trust border-trust/20 mb-4">
              <CheckCircle className="h-3 w-3 mr-1" />
              The New Standard
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Pro Power, Your Control
              <span className="block text-trust">Stop Expensive Guessing</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Before you pay for repairs, know what's actually wrong. Professional diagnostic power
              now in your hands, empowering you to set expectations with customer control.
            </p>
          </div>

          {/* Steps */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-trust to-savings" />
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 mx-auto mb-4 bg-trust/10 rounded-full flex items-center justify-center">
                  <MessageSquare className="h-8 w-8 text-trust" />
                </div>
                <Badge variant="outline" className="w-fit mx-auto mb-2 text-xs">
                  Step 1
                </Badge>
                <CardTitle className="text-xl">Input Equipment Data</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Equipment specifications and details</li>
                  <li>• Symptoms and error codes</li>
                  <li>• Operating conditions and environment</li>
                  <li>• Comprehensive data collection</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-trust to-savings" />
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 mx-auto mb-4 bg-savings/10 rounded-full flex items-center justify-center">
                  <Search className="h-8 w-8 text-savings" />
                </div>
                <Badge variant="outline" className="w-fit mx-auto mb-2 text-xs">
                  Step 2
                </Badge>
                <CardTitle className="text-xl">AI Analysis Engine</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Advanced pattern recognition</li>
                  <li>• Multi-dimensional data analysis</li>
                  <li>• Root cause identification</li>
                  <li>• Intelligent fault isolation</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-trust to-savings" />
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 mx-auto mb-4 bg-expert/10 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-expert" />
                </div>
                <Badge variant="outline" className="w-fit mx-auto mb-2 text-xs">
                  Step 3
                </Badge>
                <CardTitle className="text-xl">Diagnostic Results</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Comprehensive diagnostic report</li>
                  <li>• Root cause explanation</li>
                  <li>• Repair recommendations</li>
                  <li>• Technical documentation</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Example Output */}
          <div className="bg-muted/30 rounded-2xl p-8 mb-12">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold mb-2">What You Get: Complete Protection Report</h3>
              <p className="text-muted-foreground">
                Real diagnosis for "truck won't start" problem
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="bg-background rounded-lg p-6">
                  <h4 className="font-semibold text-savings mb-3 flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Root Cause Diagnosis
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    <strong>Real problem:</strong> Loose battery cable connection, not a dead
                    battery. The clicking sound indicates the starter is getting some power but not
                    enough.
                  </p>
                </div>

                <div className="bg-background rounded-lg p-6">
                  <h4 className="font-semibold text-trust mb-3 flex items-center">
                    <DollarSign className="h-5 w-5 mr-2" />
                    Ripoff Protection
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    <strong>Why shops get it wrong:</strong> Many would replace the battery ($150),
                    then starter ($400), then finally find the loose cable. You'd pay $550 for a
                    free fix.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-background rounded-lg p-6">
                  <h4 className="font-semibold text-primary mb-3 flex items-center">
                    <Clock className="h-5 w-5 mr-2" />
                    The Actual Fix
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    <strong>Solution:</strong> Tighten battery cable connections. Takes 5 minutes
                    with basic wrench. Check both positive and negative terminals.
                  </p>
                </div>

                <div className="bg-savings/10 rounded-lg p-6 border border-savings/20">
                  <h4 className="font-semibold text-savings mb-3 flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    Your Savings
                  </h4>
                  <p className="text-sm text-savings">
                    <strong>Avoiding this ripoff saves you $550</strong> plus you know the real fix.
                    Free repair instead of expensive parts throwing.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <Button
              variant="hero"
              size="lg"
              onClick={() => {
                const form = document.getElementById("diagnostic-form");
                form?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Start AI Analysis
            </Button>
            <p className="text-sm text-muted-foreground mt-4">
              Professional diagnostic tool - used by repair shops, now available direct
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
