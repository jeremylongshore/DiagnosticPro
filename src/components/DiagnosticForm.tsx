import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import {
  Brain,
  Smartphone,
  Car,
  Ship,
  Plane,
  Wrench,
  AlertCircle,
  Truck,
  Home,
  Drill,
} from "lucide-react";
import { getManufacturers, getModels } from "@/data/manufacturers";

export interface FormData {
  equipmentType: string;
  make: string;
  model: string;
  year: string;
  mileageHours: string;
  serialNumber: string;
  errorCodes: string;
  symptoms: string[];
  whenStarted: string;
  frequency: string;
  urgencyLevel: string;
  locationEnvironment: string;
  usagePattern: string;
  problemDescription: string;
  previousRepairs: string;
  modifications: string;
  troubleshootingSteps: string;
  shopQuoteAmount: string;
  shopRecommendation: string;
  fullName: string;
  email: string;
  phone: string;
}

interface DiagnosticFormProps {
  onFormSubmit: (formData: FormData) => void;
}

const DiagnosticForm = ({ onFormSubmit }: DiagnosticFormProps) => {
  const [equipmentType, setEquipmentType] = useState("");
  const [selectedMake, setSelectedMake] = useState("");
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [showFlashingBorder, setShowFlashingBorder] = useState(false);

  // Form state for all fields
  const [formData, setFormData] = useState({
    equipmentType: "",
    make: "",
    model: "",
    year: "",
    mileageHours: "",
    serialNumber: "",
    errorCodes: "",
    symptoms: [] as string[],
    whenStarted: "",
    frequency: "",
    urgencyLevel: "normal",
    locationEnvironment: "",
    usagePattern: "",
    problemDescription: "",
    previousRepairs: "",
    modifications: "",
    troubleshootingSteps: "",
    shopQuoteAmount: "",
    shopRecommendation: "",
    fullName: "",
    email: "",
    phone: "",
  });

  const equipmentTypes = [
    { value: "automotive", label: "Automotive", icon: Car },
    { value: "marine", label: "Marine", icon: Ship },
    { value: "aerospace", label: "Aerospace", icon: Plane },
    { value: "electronics", label: "Electronics", icon: Smartphone },
    { value: "industrial", label: "Industrial", icon: Wrench },
    { value: "other", label: "Other Equipment", icon: AlertCircle },
    { value: "semi-trucks", label: "Semi Trucks", icon: Truck },
    { value: "appliances", label: "Appliances", icon: Home },
    { value: "power-tools", label: "Power Tools", icon: Drill },
  ];

  const commonSymptoms = [
    "Won't start",
    "Strange noises",
    "Overheating",
    "Power loss",
    "Electrical issues",
    "Leaking fluids",
    "Performance problems",
    "Error messages",
    "Intermittent operation",
    "Complete failure",
  ];

  const handleSymptomChange = (symptom: string, checked: boolean) => {
    const newSymptoms = checked ? [...symptoms, symptom] : symptoms.filter((s) => s !== symptom);

    setSymptoms(newSymptoms);
    setFormData((prev) => ({ ...prev, symptoms: newSymptoms }));
  };

  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Update local state for equipment type and make
    if (field === "equipmentType" && typeof value === "string") {
      setEquipmentType(value);
      setSelectedMake(""); // Reset make when equipment type changes
      setFormData((prev) => ({ ...prev, make: "", model: "" }));
    } else if (field === "make" && typeof value === "string") {
      setSelectedMake(value);
      setFormData((prev) => ({ ...prev, model: "" })); // Reset model when make changes
    }
  };

  const handleSubmit = () => {
    // Validate required fields
    if (!formData.fullName || !formData.email) {
      alert("Please fill in your name and email address.");
      return;
    }

    onFormSubmit(formData);
  };

  // Listen for flash trigger from URL hash
  useEffect(() => {
    const handleFlashTrigger = () => {
      if (window.location.hash === '#diagnostic-form-flash') {
        // Clear the hash to avoid repeated triggers
        window.history.replaceState(null, null, '#diagnostic-form');
        
        // Start flashing border
        setShowFlashingBorder(true);
      }
    };

    handleFlashTrigger();
    window.addEventListener('hashchange', handleFlashTrigger);
    
    return () => window.removeEventListener('hashchange', handleFlashTrigger);
  }, []);

  return (
    <section className="py-12 bg-muted/30" id="diagnostic-form">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 mb-4">
              <Brain className="h-3 w-3 mr-1" />
              AI-Powered Diagnosis
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Equipment Diagnostic Input
              <span className="block text-primary">Cellphones to Spaceships</span>
            </h2>
            <p 
              className={`text-xl text-muted-foreground max-w-3xl mx-auto rounded-lg px-6 py-4 transition-all duration-300 border-2 ${
                showFlashingBorder 
                  ? 'animate-flash-border bg-primary/10 text-primary font-semibold' 
                  : 'border-transparent'
              }`}
            >
              Maximum data input = maximum diagnostic accuracy. The more comprehensive your
              equipment details, the higher probability our AI achieves in identifying the precise
              root cause.
            </p>
          </div>

          <Card className={`shadow-lg transition-all duration-300 ${
            showFlashingBorder ? 'border-primary/50 border-2' : ''
          }`}>
            <CardHeader>
              <CardTitle className="text-2xl">Diagnostic Information Form</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Equipment Type */}
              <div className="space-y-4">
                <Label className="text-lg font-semibold">Equipment Type</Label>
                <div className="grid grid-cols-3 gap-3">
                  {equipmentTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <div
                        key={type.value}
                        onClick={() => handleInputChange("equipmentType", type.value)}
                        className={`p-4 border rounded-lg cursor-pointer transition-all hover:bg-primary/5 ${
                          equipmentType === type.value
                            ? "border-primary bg-primary/10"
                            : "border-border"
                        }`}
                      >
                        <Icon className="h-6 w-6 mx-auto mb-2" />
                        <p className="text-sm font-medium text-center">{type.label}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Equipment Details */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Label htmlFor="make">Make</Label>
                  <Select
                    onValueChange={(value) => handleInputChange("make", value)}
                    value={formData.make}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select manufacturer" />
                    </SelectTrigger>
                    <SelectContent>
                      {equipmentType &&
                        getManufacturers(equipmentType).map((make) => (
                          <SelectItem key={make} value={make}>
                            {make}
                          </SelectItem>
                        ))}
                      <SelectItem value="other">Other/Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-4">
                  <Label htmlFor="model">Model</Label>
                  <Select
                    onValueChange={(value) => handleInputChange("model", value)}
                    value={formData.model}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select model" />
                    </SelectTrigger>
                    <SelectContent>
                      {equipmentType &&
                        selectedMake &&
                        getModels(equipmentType, selectedMake).map((model) => (
                          <SelectItem key={model} value={model}>
                            {model}
                          </SelectItem>
                        ))}
                      <SelectItem value="other">Other/Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-4">
                  <Label htmlFor="year">Year</Label>
                  <Select
                    onValueChange={(value) => handleInputChange("year", value)}
                    value={formData.year}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2024">2024</SelectItem>
                      <SelectItem value="2023">2023</SelectItem>
                      <SelectItem value="2022">2022</SelectItem>
                      <SelectItem value="2021">2021</SelectItem>
                      <SelectItem value="2020">2020</SelectItem>
                      <SelectItem value="2019">2019</SelectItem>
                      <SelectItem value="2018">2018</SelectItem>
                      <SelectItem value="2017">2017</SelectItem>
                      <SelectItem value="2016">2016</SelectItem>
                      <SelectItem value="2015">2015</SelectItem>
                      <SelectItem value="older">2014 or older</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-4">
                  <Label htmlFor="mileage">Mileage/Hours</Label>
                  <Input
                    id="mileage"
                    placeholder="e.g., 50,000 miles or 1,200 hours"
                    value={formData.mileageHours}
                    onChange={(e) => handleInputChange("mileageHours", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <Label htmlFor="serial">VIN / Hull / Serial Number</Label>
                <Input
                  id="serial"
                  placeholder="Equipment identification number"
                  value={formData.serialNumber}
                  onChange={(e) => handleInputChange("serialNumber", e.target.value)}
                />
              </div>

              {/* Diagnostic Details */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Diagnostic Details</h3>

                <div className="space-y-4">
                  <Label htmlFor="error-codes">Error Codes</Label>
                  <Input
                    id="error-codes"
                    placeholder="P0171, B1234, etc."
                    value={formData.errorCodes}
                    onChange={(e) => handleInputChange("errorCodes", e.target.value)}
                  />
                </div>

                <div className="space-y-4">
                  <Label>Common Symptoms (select all that apply)</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {commonSymptoms.map((symptom) => (
                      <div key={symptom} className="flex items-center space-x-2">
                        <Checkbox
                          id={symptom}
                          checked={symptoms.includes(symptom)}
                          onCheckedChange={(checked) =>
                            handleSymptomChange(symptom, checked as boolean)
                          }
                        />
                        <Label htmlFor={symptom} className="text-sm">
                          {symptom}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <Label htmlFor="when-started">When did this start?</Label>
                    <Select
                      onValueChange={(value) => handleInputChange("whenStarted", value)}
                      value={formData.whenStarted}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select timeframe" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="week">This week</SelectItem>
                        <SelectItem value="month">This month</SelectItem>
                        <SelectItem value="gradual">Gradual over time</SelectItem>
                        <SelectItem value="sudden">Sudden onset</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-4">
                    <Label htmlFor="frequency">How often does it occur?</Label>
                    <Select
                      onValueChange={(value) => handleInputChange("frequency", value)}
                      value={formData.frequency}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="always">Always</SelectItem>
                        <SelectItem value="often">Often</SelectItem>
                        <SelectItem value="sometimes">Sometimes</SelectItem>
                        <SelectItem value="rarely">Rarely</SelectItem>
                        <SelectItem value="once">Only once</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label>Urgency Level</Label>
                  <RadioGroup
                    value={formData.urgencyLevel}
                    onValueChange={(value) => handleInputChange("urgencyLevel", value)}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="low" id="low" />
                      <Label htmlFor="low">Low - Can wait</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="normal" id="normal" />
                      <Label htmlFor="normal">Normal - Needs attention soon</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="high" id="high" />
                      <Label htmlFor="high">High - Critical issue</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="emergency" id="emergency" />
                      <Label htmlFor="emergency">Emergency - Safety concern</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <Label htmlFor="location">Primary Location/Environment</Label>
                    <Select
                      onValueChange={(value) => handleInputChange("locationEnvironment", value)}
                      value={formData.locationEnvironment}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select environment" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="city">City/Urban</SelectItem>
                        <SelectItem value="highway">Highway/Road</SelectItem>
                        <SelectItem value="ocean">Ocean/Marine</SelectItem>
                        <SelectItem value="indoor">Indoor Office</SelectItem>
                        <SelectItem value="industrial">Industrial Site</SelectItem>
                        <SelectItem value="home">Home Use</SelectItem>
                        <SelectItem value="outdoor">Outdoor/Field</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-4">
                    <Label htmlFor="usage">Usage Pattern</Label>
                    <Select
                      onValueChange={(value) => handleInputChange("usagePattern", value)}
                      value={formData.usagePattern}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select usage pattern" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily Use</SelectItem>
                        <SelectItem value="weekly">Weekly Use</SelectItem>
                        <SelectItem value="occasional">Occasional Use</SelectItem>
                        <SelectItem value="heavy">Heavy Duty</SelectItem>
                        <SelectItem value="light">Light Use</SelectItem>
                        <SelectItem value="commercial">Commercial</SelectItem>
                        <SelectItem value="recreational">Recreational</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Problem Information */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Problem Information</h3>

                <div className="space-y-4">
                  <Label htmlFor="description">Problem Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the problem in detail. Include sounds, behaviors, conditions when it happens, etc."
                    className="min-h-[100px]"
                    value={formData.problemDescription}
                    onChange={(e) => handleInputChange("problemDescription", e.target.value)}
                  />
                </div>

                <div className="space-y-4">
                  <Label htmlFor="previous-repairs">Previous Repairs</Label>
                  <Textarea
                    id="previous-repairs"
                    placeholder="List any previous repairs, parts replaced, or work done"
                    className="min-h-[80px]"
                    value={formData.previousRepairs}
                    onChange={(e) => handleInputChange("previousRepairs", e.target.value)}
                  />
                </div>

                <div className="space-y-4">
                  <Label htmlFor="modifications">Modifications or Upgrades</Label>
                  <Textarea
                    id="modifications"
                    placeholder="Any modifications, upgrades, or aftermarket parts"
                    className="min-h-[80px]"
                    value={formData.modifications}
                    onChange={(e) => handleInputChange("modifications", e.target.value)}
                  />
                </div>

                <div className="space-y-4">
                  <Label htmlFor="troubleshooting">Steps Taken to Troubleshoot</Label>
                  <Textarea
                    id="troubleshooting"
                    placeholder="What have you already tried to fix the problem?"
                    className="min-h-[80px]"
                    value={formData.troubleshootingSteps}
                    onChange={(e) => handleInputChange("troubleshootingSteps", e.target.value)}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <Label htmlFor="quote-amount">Shop Quote Amount</Label>
                    <Input
                      id="quote-amount"
                      placeholder="$0.00"
                      type="number"
                      value={formData.shopQuoteAmount}
                      onChange={(e) => handleInputChange("shopQuoteAmount", e.target.value)}
                    />
                  </div>
                  <div className="space-y-4">
                    <Label htmlFor="shop-recommendation">What the Shop/Dealer Recommended</Label>
                    <Input
                      id="shop-recommendation"
                      placeholder="Parts or services recommended"
                      value={formData.shopRecommendation}
                      onChange={(e) => handleInputChange("shopRecommendation", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Contact Information</h3>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <Label htmlFor="full-name">Full Name</Label>
                    <Input
                      id="full-name"
                      placeholder="Your full name"
                      value={formData.fullName}
                      onChange={(e) => handleInputChange("fullName", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-4">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@example.com"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="(555) 123-4567"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                  />
                </div>
              </div>

              <div className="pt-6 text-center">
                <Button size="lg" className="min-w-48" onClick={handleSubmit}>
                  <Brain className="h-4 w-4 mr-2" />
                  Review
                </Button>
                <p className="text-sm text-muted-foreground mt-4">
                  Review your information and proceed to payment for AI analysis ($4.99). After payment, you'll get instant access to download your report. Support available at support@diagnosticpro.io
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default DiagnosticForm;
