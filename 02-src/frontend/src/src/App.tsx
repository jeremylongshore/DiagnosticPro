import React, { Suspense } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ErrorBoundary from "@/components/ErrorBoundary";
import LoadingSpinner from "@/components/LoadingSpinner";
import { RouteSeo } from "@/components/RouteSeo";

// Lazy load all routes for better performance
const Index = React.lazy(() => import("./pages/Index"));
const Terms = React.lazy(() => import("./pages/Terms"));
const Privacy = React.lazy(() => import("./pages/Privacy"));
const AcceptableUse = React.lazy(() => import("./pages/AcceptableUse"));
const NotFound = React.lazy(() => import("./pages/NotFound"));
const TestMonitor = React.lazy(() => import("./pages/TestMonitor"));
const PaymentSuccess = React.lazy(() => import("./components/PaymentSuccess"));
const Report = React.lazy(() => import("./pages/Report"));
const EquipmentLanding = React.lazy(() => import("./pages/EquipmentLanding"));
// Whop OAuth callback kept for later; route not linked from the public UI.
const AuthCallback = React.lazy(() => import("./pages/AuthCallback"));

// Optimized QueryClient configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Sonner
          position="top-right"
          richColors
          closeButton
          toastOptions={{
            duration: 4000,
          }}
        />
        <BrowserRouter>
          <RouteSeo />
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/acceptable-use" element={<AcceptableUse />} />
              <Route path="/test-monitor" element={<TestMonitor />} />
              <Route path="/success" element={<PaymentSuccess />} />
              <Route path="/payment-success" element={<PaymentSuccess />} />
              <Route path="/report/:reportId" element={<Report />} />
              <Route path="/equipment/:equipmentSlug" element={<EquipmentLanding />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
