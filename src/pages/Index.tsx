import { useState } from "react";
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

const Index = () => {
  const [currentStep, setCurrentStep] = useState<"form" | "review" | "success">("form");
  const [formData, setFormData] = useState<FormData | null>(null);

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
      <Header />
      <Hero />
      <ProblemSection />
      <HowItWorks />

      {currentStep === "form" && <DiagnosticForm onFormSubmit={handleFormSubmit} />}

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

export default Index;
