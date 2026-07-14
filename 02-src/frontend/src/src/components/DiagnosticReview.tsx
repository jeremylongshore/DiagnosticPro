import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, Edit } from "lucide-react";
import { startAnalysis } from "@/services/diagnostics";
import { useToast } from "@/components/ui/use-toast";
import type { FormData } from "./DiagnosticForm";

// Stripe Checkout only. Whop membership UI is deferred (backend left intact).

interface DiagnosticReviewProps {
  formData: FormData;
  onEdit: () => void;
  onPaymentSuccess: () => void;
}

const DiagnosticReview = ({ formData, onEdit, onPaymentSuccess }: DiagnosticReviewProps) => {
  const [isDataSaved, setIsDataSaved] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [paymentInitiated, setPaymentInitiated] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const { toast } = useToast();
  const paymentSectionRef = useRef<HTMLDivElement>(null);

  // Set client-reference-id on Buy Button after it loads
  useEffect(() => {
    if (isDataSaved && submissionId) {
      const setBuyButtonReference = () => {
        const buyButton = document.querySelector('stripe-buy-button');
        if (buyButton) {
          buyButton.setAttribute('client-reference-id', submissionId);
          console.log('Buy Button client-reference-id set:', submissionId);
        } else {
          // Retry if button not yet loaded
          setTimeout(setBuyButtonReference, 100);
        }
      };
      setBuyButtonReference();
    }
  }, [isDataSaved, submissionId]);

  // Handle payment success and trigger analysis
  const handlePaymentSuccess = async () => {
    if (!submissionId) return;

    try {
      console.log("Payment successful, starting analysis for:", submissionId);

      // Convert form data to the format expected by the analysis function
      const diagnosticData = {
        make: formData.make,
        model: formData.model,
        year: formData.year,
        equipmentType: formData.equipmentType,
        problemDescription: formData.problemDescription,
        errorCodes: formData.errorCodes,
        symptoms: formData.symptoms,
        urgencyLevel: formData.urgencyLevel,
        shopQuoteAmount: formData.shopQuoteAmount,
        // Add other relevant fields
      };

      // Start the analysis using Firebase Cloud Function
      const analysisResult = await startAnalysis(submissionId, diagnosticData);

      if (analysisResult.success) {
        toast({
          title: "Analysis Complete!",
          description: "Your diagnostic report is ready. Redirecting to download...",
        });

        // Trigger success callback to parent component
        // Backend handles status updates via SQLite
        onPaymentSuccess();
      } else {
        throw new Error(analysisResult.error || 'Analysis failed');
      }
    } catch (error) {
      console.error("Error during analysis:", error);
      toast({
        title: "Analysis Error",
        description: error instanceof Error ? error.message : "Failed to analyze diagnostic data",
        variant: "destructive",
      });
    }
  };

  // Save diagnostic data when component mounts
  useEffect(() => {
    const saveData = async () => {
      try {
        setIsProcessing(true);

        // Validate required fields before submission
        if (!formData.fullName || !formData.email || !formData.equipmentType) {
          throw new Error("Missing required fields: name, email, or equipment type");
        }

        // Generate request ID for tracking
        const reqId = crypto.randomUUID();

        // Build complete payload with ALL fields (per persistence rules)
        const payload = {
          equipmentType: formData.equipmentType ?? "",
          make: formData.make ?? "",
          model: formData.model ?? "",
          year: formData.year ?? "",
          mileageHours: formData.mileageHours ?? "",
          serialNumber: formData.serialNumber ?? "",
          errorCodes: formData.errorCodes ?? "",
          // Backend expects symptoms as a string, not array
          symptoms: Array.isArray(formData.symptoms) ? formData.symptoms.join(", ") : (formData.symptoms || ""),
          whenStarted: formData.whenStarted ?? "",
          frequency: formData.frequency ?? "",
          urgencyLevel: formData.urgencyLevel ?? "normal",
          locationEnvironment: formData.locationEnvironment ?? "",
          usagePattern: formData.usagePattern ?? "",
          problemDescription: formData.problemDescription ?? "",
          previousRepairs: formData.previousRepairs ?? "",
          modifications: formData.modifications ?? "",
          troubleshootingSteps: formData.troubleshootingSteps ?? "",
          shopQuoteAmount: formData.shopQuoteAmount ?? "",
          shopRecommendation: formData.shopRecommendation ?? "",
          fullName: formData.fullName ?? "",
          email: formData.email ?? "",
          phone: formData.phone ?? ""
        };

        // Prepare full submission data
        const submissionRequest = {
          payload,
          priceCents: 499,
          status: 'pending',
          reqId,
          userAgent: navigator.userAgent,
          clientIp: '' // Will be set by backend
        };

        console.log("Saving data via API Gateway...", {
          phase: 'saveSubmission',
          reqId,
          payloadKeys: Object.keys(payload),
          keyCount: Object.keys(payload).length
        });

        // Call backend endpoint (empty base = same-origin; Caddy proxies API paths)
        const apiGatewayUrl = import.meta.env.VITE_API_GATEWAY_URL || import.meta.env.VITE_API_BASE || '';
        const apiKey = import.meta.env.VITE_API_KEY || '';

        const response = await fetch(`${apiGatewayUrl}/saveSubmission`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(apiKey ? { 'x-api-key': apiKey } : {}),
            'x-dp-reqid': reqId
          },
          body: JSON.stringify(submissionRequest)
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Save failed:', {
            phase: 'saveSubmission',
            status: 'error',
            reqId,
            httpCode: response.status,
            error: errorText
          });
          throw new Error(`Failed to save data: ${response.status} ${errorText}`);
        }

        const result = await response.json();
        const submissionId = result.submissionId;

        console.log("Data saved successfully via API Gateway", {
          phase: 'saveSubmission',
          status: 'ok',
          reqId,
          submissionId,
          payloadKeys: Object.keys(payload)
        });

        // Store debugging info in window for verification
        (window as any).__dp_lastPayload = {
          reqId,
          submissionId,
          payloadKeys: Object.keys(payload),
          ts: new Date().toISOString()
        };

        // Store the submission ID and request ID for payment processing
        setSubmissionId(submissionId);
        (window as any).__dp_reqId = reqId;
        setIsDataSaved(true);
        setSaveError(null);

        toast({
          title: "Data Saved Successfully",
          description:
            "Your diagnostic information has been saved. You can now proceed with payment.",
        });

        // Scroll to payment section after data is saved
        setTimeout(() => {
          paymentSectionRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }, 500);
      } catch (error: unknown) {
        const errorObj = error as Error;
        console.error("Critical error during data save:", errorObj);
        console.error("Error details:", JSON.stringify(errorObj, null, 2));
        console.error("Form data state:", {
          hasRequiredFields: !!(formData.fullName && formData.email && formData.equipmentType),
          formDataKeys: Object.keys(formData),
        });

        // Provide specific error messages based on error type
        let errorMessage = "Unknown error occurred. Please try again.";

        if (errorObj?.message?.includes("row-level security")) {
          errorMessage = "Permission error: Unable to save data. Please refresh and try again.";
        } else if (errorObj?.message?.includes("required fields")) {
          errorMessage = "Please fill in all required fields before proceeding.";
        } else if (errorObj?.message?.includes("Database error")) {
          errorMessage = errorObj.message;
        } else if (errorObj?.message) {
          errorMessage = errorObj.message;
        }

        toast({
          title: "Unable to Save Data",
          description: errorMessage,
          variant: "destructive",
        });

        // Reset processing state so user can try again
        setIsDataSaved(false);
        setSaveError(errorMessage);
      } finally {
        setIsProcessing(false);
      }
    };

    saveData();
  }, [formData, toast]);

  return (
    <section className="py-12 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 mb-4">
              <Brain className="h-3 w-3 mr-1" />
              Review & Purchase
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Review Your Diagnostic Information
            </h2>
            <p className="text-lg text-muted-foreground">
              Please review your information below. Once confirmed, proceed to payment for your AI
              analysis.
            </p>
          </div>

          <Card className="shadow-lg mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Diagnostic Information Summary
                <Button variant="outline" size="sm" onClick={onEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Equipment Information */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Equipment Information</h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Type:</span> {formData.equipmentType}
                  </div>
                  <div>
                    <span className="font-medium">Make:</span> {formData.make || "Not specified"}
                  </div>
                  <div>
                    <span className="font-medium">Model:</span> {formData.model || "Not specified"}
                  </div>
                  <div>
                    <span className="font-medium">Year:</span> {formData.year || "Not specified"}
                  </div>
                  <div>
                    <span className="font-medium">Mileage/Hours:</span>{" "}
                    {formData.mileageHours || "Not specified"}
                  </div>
                  <div>
                    <span className="font-medium">Serial Number:</span>{" "}
                    {formData.serialNumber || "Not specified"}
                  </div>
                </div>
              </div>

              {/* Diagnostic Details */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Diagnostic Details</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Error Codes:</span>{" "}
                    {formData.errorCodes || "None reported"}
                  </div>
                  <div>
                    <span className="font-medium">Symptoms:</span>
                    {formData.symptoms?.length > 0 ? (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {formData.symptoms.map((symptom: string, index: number) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {symptom}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      " None selected"
                    )}
                  </div>
                  <div>
                    <span className="font-medium">When Started:</span>{" "}
                    {formData.whenStarted || "Not specified"}
                  </div>
                  <div>
                    <span className="font-medium">Frequency:</span>{" "}
                    {formData.frequency || "Not specified"}
                  </div>
                  <div>
                    <span className="font-medium">Urgency:</span>{" "}
                    {formData.urgencyLevel || "Normal"}
                  </div>
                </div>
              </div>

              {/* Problem Description */}
              {formData.problemDescription && (
                <div>
                  <h3 className="font-semibold text-lg mb-3">Problem Description</h3>
                  <p className="text-sm bg-muted p-3 rounded">{formData.problemDescription}</p>
                </div>
              )}

              {/* Contact Information */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Contact Information</h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Name:</span> {formData.fullName}
                  </div>
                  <div>
                    <span className="font-medium">Email:</span> {formData.email}
                  </div>
                  <div>
                    <span className="font-medium">Phone:</span> {formData.phone || "Not provided"}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Section — Stripe $4.99 only */}
          <Card ref={paymentSectionRef} className="shadow-lg">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <img
                    src="https://js.stripe.com/v3/fingerprinted/img/stripe-badge-transparent@2x.png"
                    alt="Powered by Stripe"
                    className="h-6"
                  />
                  <span className="text-sm text-muted-foreground">
                    Secure payments powered by Stripe
                  </span>
                </div>
                <h3 className="text-xl font-semibold mb-4">AI Diagnostic Analysis</h3>
                <div className="text-3xl font-bold text-primary mb-2">$4.99</div>
                <p className="text-muted-foreground mb-6">
                  Get your comprehensive AI-powered diagnostic report - instant download after payment
                </p>
                {saveError ? (
                  <div className="space-y-4">
                    <div className="text-destructive text-sm bg-destructive/10 p-3 rounded-lg">
                      <p className="font-medium">Unable to proceed with payment</p>
                      <p>{saveError}</p>
                    </div>
                    <Button
                      onClick={() => window.location.reload()}
                      variant="outline"
                      className="w-full"
                    >
                      Try Again
                    </Button>
                  </div>
                ) : isDataSaved && submissionId ? (
                  <div className="space-y-4">
                    {/* Env vars win so a Stripe account swap only needs a rebuild with new
                        VITE_STRIPE_* values; publishable keys are public, so a hardcoded
                        fallback to the current live account is acceptable. */}
                    <stripe-buy-button
                      buy-button-id={import.meta.env.VITE_STRIPE_BUY_BUTTON_ID || "buy_btn_1SC6LyJfyCDmId8XPHZozmzJ"}
                      publishable-key={import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "pk_live_51RgbAkJfyCDmId8XfY0H7dLS8v2mjL6887WNfScroA9v6ggvcPbXSQUjrLkY2dVZh26QdbcS3nXegFKnf6C6RMEb00po2qC8Fg"}
                    >
                    </stripe-buy-button>
                    <div className="text-center space-y-2">
                      <p className="text-xs text-muted-foreground">
                        Submission ID: {submissionId || "Not generated"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-muted-foreground">
                    {isProcessing ? "Saving your data..." : "Preparing payment..."}
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-4">
                  Secure payment processed by Stripe. After payment, you'll get instant access to download your report.
                </p>
                <div className="text-xs text-muted-foreground mt-2">
                  By purchasing, you agree to our{" "}
                  <a href="/terms" className="underline hover:text-primary">
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a href="/privacy" className="underline hover:text-primary">
                    Privacy Policy
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default DiagnosticReview;
