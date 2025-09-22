import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, TrendingUp, Users, Wrench } from "lucide-react";

const ProblemSection = () => {
  return (
    <section className="py-12 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="outline" className="bg-ripoff/10 text-ripoff border-ripoff/20 mb-4">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Stop Expensive Guessing
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Professional Power, Customer Control
              <span className="block text-primary">The New Standard</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Before you pay for repairs, know what's actually wrong. Pro level diagnostics now in
              your hands, empowering you to set expectations with professional power and customer
              control.
            </p>
          </div>

          {/* Example Scenario */}
          <div className="bg-background rounded-2xl p-8 shadow-lg mb-12">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold mb-2">Real Example: Rough Idle Problem</h3>
              <p className="text-muted-foreground">
                How "parts throwing" turns a $30 fix into a $1,430 nightmare
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Bad Shop Approach */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-ripoff flex items-center">
                  <Wrench className="h-5 w-5 mr-2" />
                  Shop Markup Method
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-ripoff/10 rounded-lg">
                    <span>Replace spark plugs</span>
                    <span className="font-semibold text-ripoff">$200</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-ripoff/10 rounded-lg">
                    <span>Replace ignition coils</span>
                    <span className="font-semibold text-ripoff">$400</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-ripoff/10 rounded-lg">
                    <span>Replace fuel injectors</span>
                    <span className="font-semibold text-ripoff">$800</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-ripoff/20 rounded-lg border-2 border-ripoff/30">
                    <span className="font-semibold">Finally find vacuum hose</span>
                    <span className="font-semibold text-ripoff">$30</span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between items-center font-bold text-lg">
                      <span>Total Cost</span>
                      <span className="text-ripoff">$1,430</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Our Approach */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-savings flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Direct Pro Tool Access
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-savings/10 rounded-lg">
                    <span>AI diagnosis fee</span>
                    <span className="font-semibold text-savings">$4.99</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-savings/20 rounded-lg border-2 border-savings/30">
                    <span className="font-semibold">Finds vacuum hose leak immediately</span>
                    <span className="font-semibold text-savings">$30</span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between items-center font-bold text-lg">
                      <span>Total Cost</span>
                      <span className="text-savings">$34.99</span>
                    </div>
                    <div className="text-right mt-2">
                      <span className="text-2xl font-bold text-savings">$1,395.01 Saved!</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Problem Stats */}
          <div className="grid md:grid-cols-4 gap-6">
            <Card className="text-center">
              <CardHeader className="pb-3">
                <TrendingUp className="h-8 w-8 text-ripoff mx-auto" />
                <CardTitle className="text-2xl text-ripoff">$600B</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Wasted annually on unnecessary repairs
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader className="pb-3">
                <Users className="h-8 w-8 text-ripoff mx-auto" />
                <CardTitle className="text-2xl text-ripoff">73%</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Of customers overcharged by repair shops
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader className="pb-3">
                <AlertTriangle className="h-8 w-8 text-ripoff mx-auto" />
                <CardTitle className="text-2xl text-ripoff">3.2x</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Average markup on parts throwing</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader className="pb-3">
                <Wrench className="h-8 w-8 text-ripoff mx-auto" />
                <CardTitle className="text-2xl text-ripoff">$1,200</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Average customer loses per year</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;
