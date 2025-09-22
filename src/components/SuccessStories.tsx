import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Quote, DollarSign, CheckCircle, Shield } from "lucide-react";

const SuccessStories = () => {
  const stories = [
    {
      name: "Sarah M.",
      location: "Phoenix, AZ",
      equipment: "2019 F-150 Truck",
      problem: "Engine Overheating",
      saved: "$2,315",
      story:
        "Shop wanted $2,400 to 'rebuild my engine.' I snapped a photo of their estimate with the app. Turns out they were charging me for a full rebuild when I just needed a $85 sensor replacement. The app literally saved me from a massive scam.",
      avatar: "SM",
      category: "Ripoff Detection",
    },
    {
      name: "Mike Rodriguez",
      location: "Tampa, FL",
      equipment: "Boat Engine",
      problem: "Won't Start",
      saved: "$1,050",
      story:
        "My boat engine wouldn't start and the marina wanted to replace the entire fuel system. The app found it was just a clogged fuel filter. Fixed it myself for $20 instead of paying $1,070 for unnecessary parts.",
      avatar: "MR",
      category: "Parts Throwing",
    },
    {
      name: "Lisa Chen",
      location: "Seattle, WA",
      equipment: "Honda Civic",
      problem: "Check Engine Light",
      saved: "$950",
      story:
        "Three shops told me I needed a new catalytic converter ($800-1200). The app diagnosed a loose gas cap and told me exactly what to ask shops to check. Turns out the third shop admitted they never tested the cap - just assumed worst case.",
      avatar: "LC",
      category: "Expert Knowledge",
    },
    {
      name: "Tom Bradley",
      location: "Denver, CO",
      equipment: "HVAC System",
      problem: "Not Cooling",
      saved: "$1,800",
      story:
        "HVAC company wanted $2,200 for new compressor and lines. App connected me with an expert who diagnosed via video - just needed $40 capacitor replacement. The expert video call was better than the in-person 'inspection.'",
      avatar: "TB",
      category: "Expert Consultation",
    },
  ];

  return (
    <section id="success-stories" className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="outline" className="bg-savings/10 text-savings border-savings/20 mb-4">
              <CheckCircle className="h-3 w-3 mr-1" />
              Real Results
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Pros Use It, You Save
              <span className="block text-savings">Thousands on Markups</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Real customers using the same professional diagnostic tool trusted by repair shops.
              Skip the middleman and get direct access to pro-grade diagnostics.
            </p>
          </div>

          {/* Success Stories Grid */}
          <div className="grid lg:grid-cols-2 gap-8 mb-16">
            {stories.map((story, index) => (
              <Card
                key={index}
                className="relative overflow-hidden hover:shadow-lg transition-all duration-300"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-savings to-trust" />
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-savings/10 text-savings font-semibold">
                          {story.avatar}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-semibold">{story.name}</h4>
                        <p className="text-sm text-muted-foreground">{story.location}</p>
                        <p className="text-xs text-muted-foreground">{story.equipment}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-savings">{story.saved}</div>
                      <div className="text-xs text-muted-foreground">Saved</div>
                    </div>
                  </div>
                  <Badge variant="outline" className="w-fit text-xs">
                    {story.category}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <Quote className="absolute -top-2 -left-2 h-8 w-8 text-muted-foreground/20" />
                    <p className="text-sm text-muted-foreground italic pl-6">"{story.story}"</p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <div className="flex items-center text-xs text-muted-foreground">
                      <div className="flex items-center mr-4">
                        <CheckCircle className="h-3 w-3 text-savings mr-1" />
                        Problem: {story.problem}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Stats Summary */}
          <div className="bg-background rounded-2xl p-8 shadow-lg">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold mb-2">Total Customer Impact</h3>
              <p className="text-muted-foreground">Results from verified customer follow-ups</p>
            </div>

            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center">
                <DollarSign className="h-8 w-8 text-savings mx-auto mb-2" />
                <div className="text-2xl font-bold text-savings">$2.3M+</div>
                <div className="text-sm text-muted-foreground">Saved from ripoffs</div>
              </div>
              <div className="text-center">
                <Shield className="h-8 w-8 text-trust mx-auto mb-2" />
                <div className="text-2xl font-bold text-trust">15,000+</div>
                <div className="text-sm text-muted-foreground">Ripoffs prevented</div>
              </div>
              <div className="text-center">
                <CheckCircle className="h-8 w-8 text-primary mx-auto mb-2" />
                <div className="text-2xl font-bold text-primary">98%</div>
                <div className="text-sm text-muted-foreground">Success rate</div>
              </div>
              <div className="text-center">
                <Quote className="h-8 w-8 text-expert mx-auto mb-2" />
                <div className="text-2xl font-bold text-expert">4.9/5</div>
                <div className="text-sm text-muted-foreground">Customer rating</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SuccessStories;
