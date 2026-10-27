import { useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import ProblemSection from "@/components/ProblemSection";
import HowItWorks from "@/components/HowItWorks";
import DiagnosticForm from "@/components/DiagnosticForm";
import DiagnosticReview from "@/components/DiagnosticReview";
import PaymentSuccess from "@/components/PaymentSuccess";
import SuccessStories from "@/components/SuccessStories";
import Pricing from "@/components/Pricing";
import Footer from "@/components/Footer";
import type { FormData } from "@/components/DiagnosticForm";

const VALID_EQUIPMENT_SLUGS: Record<string, string> = {
  "automotive": "automotive",
  "cars": "automotive",
  "gas-trucks": "gas-trucks",
  "diesel-trucks": "diesel-trucks",
  "semi-trucks": "semi-trucks",
  "motorcycles": "motorcycles",
  "atvs-utvs": "atvs-utvs",
  "rvs": "rvs",
  "marine": "marine",
  "boats": "marine",
  "farm-ag": "farm-ag",
  "farm": "farm-ag",
  "compact-equipment": "compact-equipment",
  "lawn-garden": "lawn-garden",
  "power-tools": "power-tools",
  "hvac": "hvac",
  "golf-carts": "golf-carts",
  "electronics": "electronics",
};

const EquipmentLanding = () => {
  const { equipmentSlug } = useParams<{ equipmentSlug: string }>();
  const equipmentType = equipmentSlug ? VALID_EQUIPMENT_SLUGS[equipmentSlug] : undefined;

  const [currentStep, setCurrentStep] = useState<"form" | "review" | "success">("form");
  const [formData, setFormData] = useState<FormData | null>(null);

  if (!equipmentType) {
    return <Navigate to="/" replace />;
  }

  const handleFormSubmit = (data: FormData) => {
    setFormData(data);
    setCurrentStep("review");
  };

  const handleEdit = () => {
    setCurrentStep("form");
  };

  const handlePaymentSuccess = () => {
    setCurrentStep("success");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header showPartner={false} />
      <Hero />
      <ProblemSection />
      <HowItWorks />

      {currentStep === "form" && (
        <DiagnosticForm onFormSubmit={handleFormSubmit} initialEquipmentType={equipmentType} />
      )}

      {currentStep === "review" && formData && (
        <DiagnosticReview
          formData={formData}
          onEdit={handleEdit}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}

      {currentStep === "success" && <PaymentSuccess />}

      <SuccessStories />
      <Pricing />
      <Footer />
    </div>
  );
};

export default EquipmentLanding;
