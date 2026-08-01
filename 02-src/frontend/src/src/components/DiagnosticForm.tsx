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
  Smartphone,
  Camera,
  Car,
  Ship,
  Wrench,
  AlertCircle,
  Truck,
  Home,
  Drill,
  Bike,
  Tractor,
  TreePine,
  Thermometer,
  Zap,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { getManufacturers, getModels } from "@/data/manufacturers";
import { getEquipmentConfig } from "@/data/equipment-configs";
import type { EquipmentField } from "@/data/equipment-configs";

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
  // Dynamic equipment-specific fields stored here
  [key: string]: string | string[];
}

interface DiagnosticFormProps {
  onFormSubmit: (formData: FormData) => void;
  initialEquipmentType?: string;
}

const DiagnosticForm = ({ onFormSubmit, initialEquipmentType }: DiagnosticFormProps) => {
  const [equipmentType, setEquipmentType] = useState(initialEquipmentType || "");
  const [selectedMake, setSelectedMake] = useState("");
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [showFlashingBorder, setShowFlashingBorder] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    equipmentType: initialEquipmentType || "",
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
    { value: "automotive", label: "Cars & SUVs", icon: Car },
    { value: "gas-trucks", label: "Gas Trucks", icon: Truck },
    { value: "diesel-trucks", label: "Diesel Trucks", icon: Truck },
    { value: "semi-trucks", label: "Semi Trucks", icon: Truck },
    { value: "motorcycles", label: "Motorcycles", icon: Bike },
    { value: "atvs-utvs", label: "ATVs / UTVs", icon: Bike },
    { value: "rvs", label: "RVs", icon: Car },
    { value: "marine", label: "Marine", icon: Ship },
    { value: "farm-ag", label: "Farm & Ag", icon: Tractor },
    { value: "compact-equipment", label: "Compact Equipment", icon: Wrench },
    { value: "lawn-garden", label: "Lawn & Garden", icon: TreePine },
    { value: "power-tools", label: "Power Tools", icon: Drill },
    { value: "hvac", label: "HVAC", icon: Thermometer },
    { value: "golf-carts", label: "Golf Carts", icon: Zap },
    { value: "electronics", label: "Electronics", icon: Smartphone },
  ];

  // Get equipment-specific config
  const equipmentConfig = equipmentType ? getEquipmentConfig(equipmentType) : undefined;

  // Dynamic labels based on equipment type
  const identifierLabel = equipmentConfig?.identifierLabel || "VIN / Serial Number";
  const usageMetricLabel = equipmentConfig?.usageMetricLabel || "Mileage / Hours";
  const usageMetricPlaceholder = equipmentConfig?.usageMetricPlaceholder || "e.g., 50,000 miles or 1,200 hours";
  const errorCodeHint = equipmentConfig?.errorCodeHint || "P0171, B1234, etc.";
  const currentSymptoms = equipmentConfig?.symptoms || [
    "Won't start", "Strange noises", "Overheating", "Power loss",
    "Electrical issues", "Leaking fluids", "Performance problems",
    "Error messages", "Intermittent operation", "Complete failure",
  ];
  const locationOptions = equipmentConfig?.locationOptions || [
    { value: "city", label: "City/Urban" },
    { value: "highway", label: "Highway/Road" },
    { value: "indoor", label: "Indoor" },
    { value: "outdoor", label: "Outdoor/Field" },
    { value: "other", label: "Other" },
  ];

  const handleSymptomChange = (symptom: string, checked: boolean) => {
    const newSymptoms = checked ? [...symptoms, symptom] : symptoms.filter((s) => s !== symptom);
    setSymptoms(newSymptoms);
    setFormData((prev) => ({ ...prev, symptoms: newSymptoms }));
  };

  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    if (field === "equipmentType" && typeof value === "string") {
      setEquipmentType(value);
      setSelectedMake("");
      setSymptoms([]);
      // Reset to base fields only — clear any equipment-specific dynamic fields
      setFormData((prev) => ({
        ...prev,
        equipmentType: value,
        make: "",
        model: "",
        symptoms: [],
        errorCodes: "",
        mileageHours: "",
        serialNumber: "",
        whenStarted: "",
        frequency: "",
        locationEnvironment: "",
        usagePattern: "",
        previousRepairs: "",
        modifications: "",
        troubleshootingSteps: "",
        shopQuoteAmount: "",
        shopRecommendation: "",
      }));
    } else if (field === "make" && typeof value === "string") {
      setSelectedMake(value);
      setFormData((prev) => ({ ...prev, model: "" }));
    }
  };

  const handleSubmit = () => {
    if (!formData.fullName || !formData.email) {
      alert("Please fill in your name and email address.");
      return;
    }
    // Mirror the backend saveSubmission contract, which requires `symptoms`
    // OR `problemDescription`. Without this gate a customer could reach the
    // Stripe payment step with an un-analyzable submission and hit a raw 400
    // there, with "Try Again" re-POSTing the same empty data in a loop.
    const hasProblemText = formData.problemDescription.trim().length > 0;
    const hasSymptoms = Array.isArray(formData.symptoms) && formData.symptoms.length > 0;
    if (!hasProblemText && !hasSymptoms) {
      alert("Please describe the problem or select at least one symptom before continuing.");
      return;
    }
    onFormSubmit(formData);
  };

  // Listen for flash trigger from URL hash
  useEffect(() => {
    const handleFlashTrigger = () => {
      if (window.location.hash === '#diagnostic-form-flash') {
        window.history.replaceState(null, null as unknown as string, '#diagnostic-form');
        setShowFlashingBorder(true);
      }
    };
    handleFlashTrigger();
    window.addEventListener('hashchange', handleFlashTrigger);
    return () => window.removeEventListener('hashchange', handleFlashTrigger);
  }, []);

  // Render a dynamic equipment-specific field
  const renderEquipmentField = (field: EquipmentField) => {
    if (field.type === 'select' && field.options) {
      return (
        <div key={field.id} className="space-y-2">
          <Label htmlFor={field.id}>{field.label}</Label>
          <Select
            onValueChange={(value) => handleInputChange(field.id, value)}
            value={(formData[field.id] as string) || ""}
          >
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder || `Select ${field.label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {field.options.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }

    if (field.type === 'checkbox' && field.options) {
      return (
        <div key={field.id} className="space-y-2">
          <Label>{field.label}</Label>
          <div className="grid grid-cols-2 gap-2">
            {field.options.map((opt) => {
              const currentValues = (formData[field.id] as string[] | undefined) || [];
              return (
                <div key={opt.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${field.id}-${opt.value}`}
                    checked={currentValues.includes(opt.value)}
                    onCheckedChange={(checked) => {
                      const newValues = checked
                        ? [...currentValues, opt.value]
                        : currentValues.filter((v) => v !== opt.value);
                      handleInputChange(field.id, newValues);
                    }}
                  />
                  <Label htmlFor={`${field.id}-${opt.value}`} className="text-sm">
                    {opt.label}
                  </Label>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    // Default: text input
    return (
      <div key={field.id} className="space-y-2">
        <Label htmlFor={field.id}>{field.label}</Label>
        <Input
          id={field.id}
          placeholder={field.placeholder || ""}
          value={(formData[field.id] as string) || ""}
          onChange={(e) => handleInputChange(field.id, e.target.value)}
        />
      </div>
    );
  };

  return (
    <section className="py-14 md:py-16 border-b border-border/70" id="diagnostic-form">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8 md:mb-10 max-w-xl">
            <p className="section-label mb-3">Diagnosis</p>
            <h2 className="font-display text-2xl md:text-3xl font-bold tracking-tight mb-3">
              Tell us what&apos;s going on
            </h2>
            <p
              className={`text-muted-foreground leading-relaxed rounded-md px-0 py-1 transition-all duration-300 border-2 ${
                showFlashingBorder
                  ? 'animate-flash-border bg-primary/5 text-foreground font-medium px-4 py-3'
                  : 'border-transparent'
              }`}
            >
              Equipment, symptoms, and codes — more detail yields a sharper report. One problem,
              one $4.99 analysis.
            </p>
          </div>

          <Card className={`shadow-[var(--shadow-card)] border-border transition-all duration-300 ${
            showFlashingBorder ? 'border-primary/50 border-2' : ''
          }`}>
            <CardHeader>
              <CardTitle className="font-display text-xl tracking-tight">Basic information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Equipment Type Grid */}
              <div className="space-y-4">
                <Label className="text-lg font-semibold">What type of equipment?</Label>
                <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                  {equipmentTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <div
                        key={type.value}
                        onClick={() => handleInputChange("equipmentType", type.value)}
                        className={`p-3 border rounded-lg cursor-pointer transition-all hover:bg-primary/5 ${
                          equipmentType === type.value
                            ? "border-primary bg-primary/10"
                            : "border-border"
                        }`}
                      >
                        <Icon className="h-5 w-5 mx-auto mb-1" />
                        <p className="text-xs font-medium text-center">{type.label}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Make / Model / Year */}
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
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
                <div className="space-y-2">
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
                <div className="space-y-2">
                  <Label htmlFor="year">Year</Label>
                  <Select
                    onValueChange={(value) => handleInputChange("year", value)}
                    value={formData.year}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => 2026 - i).map((year) => (
                        <SelectItem key={year} value={String(year)}>
                          {year}
                        </SelectItem>
                      ))}
                      <SelectItem value="older">2014 or older</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Problem Description */}
              <div className="space-y-2">
                <Label htmlFor="description">What's the problem?</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the problem in detail — sounds, behaviors, conditions when it happens, etc."
                  className="min-h-[100px]"
                  value={formData.problemDescription}
                  onChange={(e) => handleInputChange("problemDescription", e.target.value)}
                />
              </div>

              {/* Contact Info */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full-name">Full Name *</Label>
                  <Input
                    id="full-name"
                    placeholder="Your full name"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange("fullName", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
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

              {/* Expandable Details Section */}
              <div className="border-t pt-6">
                <button
                  type="button"
                  onClick={() => setShowDetails(!showDetails)}
                  className="flex items-center gap-2 text-primary hover:text-primary/80 font-medium transition-colors w-full justify-center"
                >
                  {showDetails ? (
                    <>
                      <ChevronUp className="h-4 w-4" />
                      Hide Additional Details
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4" />
                      Add Details for Better Results
                    </>
                  )}
                </button>

                {showDetails && (
                  <div className="mt-6 space-y-8">
                    <CardTitle className="text-xl">Step 2: Detailed Information</CardTitle>

                    {/* Equipment-Specific Fields */}
                    {equipmentConfig && equipmentConfig.fields.length > 0 && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">{equipmentConfig.displayName} Details</h3>
                        <div className="grid md:grid-cols-2 gap-4">
                          {equipmentConfig.fields.map(renderEquipmentField)}
                        </div>
                      </div>
                    )}

                    {/* Identifier & Usage */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="serial">{identifierLabel}</Label>
                        <Input
                          id="serial"
                          placeholder={`Enter ${identifierLabel.toLowerCase()}`}
                          value={formData.serialNumber}
                          onChange={(e) => handleInputChange("serialNumber", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="mileage">{usageMetricLabel}</Label>
                        <Input
                          id="mileage"
                          placeholder={usageMetricPlaceholder}
                          value={formData.mileageHours}
                          onChange={(e) => handleInputChange("mileageHours", e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Error Codes */}
                    <div className="space-y-2">
                      <Label htmlFor="error-codes">Error Codes</Label>
                      <Input
                        id="error-codes"
                        placeholder={errorCodeHint}
                        value={formData.errorCodes}
                        onChange={(e) => handleInputChange("errorCodes", e.target.value)}
                      />
                    </div>

                    {/* Symptoms */}
                    <div className="space-y-2">
                      <Label>Symptoms (select all that apply)</Label>
                      <div className="grid grid-cols-2 gap-3">
                        {currentSymptoms.map((symptom) => (
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

                    {/* Timing & Frequency */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
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
                      <div className="space-y-2">
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

                    {/* Urgency */}
                    <div className="space-y-2">
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

                    {/* Location & Usage */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="location">Primary Location/Environment</Label>
                        <Select
                          onValueChange={(value) => handleInputChange("locationEnvironment", value)}
                          value={formData.locationEnvironment}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select environment" />
                          </SelectTrigger>
                          <SelectContent>
                            {locationOptions.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
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

                    {/* Previous Repairs & Context */}
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="previous-repairs">Previous Repairs</Label>
                        <Textarea
                          id="previous-repairs"
                          placeholder="List any previous repairs, parts replaced, or work done"
                          className="min-h-[80px]"
                          value={formData.previousRepairs}
                          onChange={(e) => handleInputChange("previousRepairs", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="modifications">Modifications or Upgrades</Label>
                        <Textarea
                          id="modifications"
                          placeholder="Any modifications, upgrades, or aftermarket parts"
                          className="min-h-[60px]"
                          value={formData.modifications}
                          onChange={(e) => handleInputChange("modifications", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="troubleshooting">Steps Taken to Troubleshoot</Label>
                        <Textarea
                          id="troubleshooting"
                          placeholder="What have you already tried to fix the problem?"
                          className="min-h-[60px]"
                          value={formData.troubleshootingSteps}
                          onChange={(e) => handleInputChange("troubleshootingSteps", e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Shop Quote */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="quote-amount">Shop Quote Amount</Label>
                        <Input
                          id="quote-amount"
                          placeholder="$0.00"
                          type="number"
                          value={formData.shopQuoteAmount}
                          onChange={(e) => handleInputChange("shopQuoteAmount", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="shop-recommendation">What the Shop Recommended</Label>
                        <Input
                          id="shop-recommendation"
                          placeholder="Parts or services recommended"
                          value={formData.shopRecommendation}
                          onChange={(e) => handleInputChange("shopRecommendation", e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Phone */}
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number (optional)</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="(555) 123-4567"
                        value={formData.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Submit */}
              <div className="pt-6 text-center">
                <Button size="lg" className="min-w-48" onClick={handleSubmit}>
                  Review
                </Button>
                <p className="text-sm text-muted-foreground mt-4">
                  Review your information, then continue to payment for AI analysis ($4.99). After payment,
                  you'll get instant access to download your report.
                </p>
                <div
                  className="mt-5 mx-auto max-w-xl rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-left"
                  data-testid="photo-upload-handoff"
                >
                  <div className="flex items-start gap-3">
                    <Camera className="h-5 w-5 shrink-0 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold">Have a photo of the issue?</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Click Review first. On the next step, you can attach up to 3 photos before payment.
                        Photos are optional.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default DiagnosticForm;
