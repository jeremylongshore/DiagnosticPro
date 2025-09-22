import { useState, useEffect } from "react";
import { CheckCircle, Download, Clock, AlertCircle, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiClient } from "@/services/api";
import { pollDiagnosticStatus, downloadReport, type DiagnosticStatus } from "@/services/reports";
import { useToast } from "@/components/ui/use-toast";

const PaymentSuccess = () => {
  const [orderStatus, setOrderStatus] = useState<string>('processing');
  const [orderId, setOrderId] = useState<string>('');
  const [diagnosticId, setDiagnosticId] = useState<string>('');
  const [diagnosticStatus, setDiagnosticStatus] = useState<DiagnosticStatus | null>(null);
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isPolling, setIsPolling] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Get diagnostic_id directly from URL params (new flow)
    const urlParams = new URLSearchParams(window.location.search);
    const diagnosticId = urlParams.get('diagnostic_id');
    const sessionId = urlParams.get('session_id');

    if (diagnosticId) {
      // New flow: diagnostic_id passed directly
      setDiagnosticId(diagnosticId);
      setOrderStatus('paid');
      setIsLoading(false);
    } else if (sessionId) {
      // Legacy flow: look up by session_id
      checkOrderStatus(sessionId);
    } else {
      setIsLoading(false);
    }
  }, []);

  // Start polling when diagnostic ID is available
  useEffect(() => {
    if (diagnosticId && !isPolling && !diagnosticStatus) {
      startDiagnosticPolling(diagnosticId);
    }
  }, [diagnosticId, isPolling, diagnosticStatus]);

  const checkOrderStatus = async (sessionId?: string) => {
    try {
      setIsLoading(true);

      // Find order by stripe session ID
      const response = await apiClient.get<any>(`/orders/session/${sessionId}`);

      if (!response.data) {
        console.log('No order found, using default status');
        setOrderStatus('completed');
        setIsLoading(false);
        return;
      }

      const order = response.data;
      setOrderId(order.id);
      setCustomerEmail(order.customerEmail || order.customer_email);
      setOrderStatus(order.processingStatus || order.processing_status || order.status);

      // Get diagnostic ID from order
      const diagnosticId = order.submissionId || order.submission_id || order.diagnosticId;
      if (diagnosticId) {
        setDiagnosticId(diagnosticId);
        startDiagnosticPolling(diagnosticId);
      }

    } catch (error) {
      console.error('Error checking order status:', error);
      setOrderStatus('processing');
    } finally {
      setIsLoading(false);
    }
  };

  const startDiagnosticPolling = async (diagnosticId: string) => {
    if (isPolling) return;

    setIsPolling(true);

    try {
      const finalStatus = await pollDiagnosticStatus(
        diagnosticId,
        (status) => {
          setDiagnosticStatus(status);
          // Update order status based on diagnostic status
          if (status.status === 'ready') {
            setOrderStatus('completed');
          } else if (status.status === 'failed') {
            setOrderStatus('failed');
          } else {
            setOrderStatus('processing');
          }
        },
        60, // Max 60 attempts (5 minutes)
        5000 // Check every 5 seconds
      );

      if (!finalStatus) {
        toast({
          title: "Polling Timeout",
          description: "Status check timed out. Please refresh to check again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error polling diagnostic status:', error);
      toast({
        title: "Status Check Failed",
        description: "Unable to check diagnostic status. Please refresh.",
        variant: "destructive",
      });
    } finally {
      setIsPolling(false);
    }
  };

  const handleDownloadReport = async () => {
    if (!diagnosticId) {
      toast({
        title: "Download Error",
        description: "No diagnostic ID found. Please contact support.",
        variant: "destructive",
      });
      return;
    }

    try {
      await downloadReport(diagnosticId);
      toast({
        title: "Download Started",
        description: "Your report download should begin shortly.",
      });
    } catch (error) {
      console.error('Error downloading report:', error);
      toast({
        title: "Download Failed",
        description: "Unable to download report. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStatusInfo = () => {
    // Use diagnostic status if available for more accurate info
    const currentStatus = diagnosticStatus?.status || orderStatus;

    switch (currentStatus) {
      case 'ready':
      case 'completed':
        return {
          icon: <CheckCircle className="h-8 w-8 text-green-500" />,
          title: "Analysis Complete!",
          description: "Your diagnostic report is ready for download.",
          badge: <Badge className="bg-green-500/10 text-green-600 border-green-200">Report Ready</Badge>
        };
      case 'processing':
        return {
          icon: <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />,
          title: "Processing Analysis...",
          description: diagnosticId
            ? "Our AI is analyzing your equipment data. This usually takes 2-3 minutes."
            : "Our AI is analyzing your equipment data right now.",
          badge: <Badge className="bg-blue-500/10 text-blue-600 border-blue-200">Processing</Badge>
        };
      case 'failed':
        return {
          icon: <AlertCircle className="h-8 w-8 text-red-500" />,
          title: "Analysis Failed",
          description: "We're working to resolve this. Please contact support for assistance.",
          badge: <Badge className="bg-red-500/10 text-red-600 border-red-200">Failed</Badge>
        };
      case 'paid':
        return {
          icon: <Clock className="h-8 w-8 text-blue-500" />,
          title: "Payment Confirmed",
          description: "Your payment was successful. Analysis will begin shortly.",
          badge: <Badge className="bg-blue-500/10 text-blue-600 border-blue-200">Paid</Badge>
        };
      case 'pending':
      default:
        return {
          icon: <Clock className="h-8 w-8 text-muted-foreground" />,
          title: "Preparing Analysis...",
          description: "Your payment was successful. Analysis will begin shortly.",
          badge: <Badge className="bg-muted text-muted-foreground">Pending</Badge>
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <section className="py-12 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center">
          {isLoading ? (
            <div className="mb-8">
              <RefreshCw className="h-16 w-16 text-muted-foreground mx-auto mb-4 animate-spin" />
              <h1 className="text-3xl md:text-4xl font-bold mb-4">Loading...</h1>
              <p className="text-lg text-muted-foreground">
                Checking your payment status...
              </p>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <div className="flex items-center justify-center mb-4">
                  {statusInfo.icon}
                </div>
                <div className="flex items-center justify-center mb-4">
                  {statusInfo.badge}
                </div>
                <h1 className="text-3xl md:text-4xl font-bold mb-4">Payment Successful!</h1>
                <p className="text-lg text-muted-foreground">
                  Thank you for your purchase. {statusInfo.description}
                </p>
              </div>

              <Card className="shadow-lg mb-6">
                <CardContent className="p-6">
                  <div className="flex items-center justify-center mb-4">
                    {statusInfo.icon}
                  </div>
                  <h2 className="text-xl font-semibold mb-2">{statusInfo.title}</h2>
                  <p className="text-muted-foreground mb-4">
                    {statusInfo.description}
                  </p>
                  
                  {orderId && (
                    <div className="bg-muted p-4 rounded-lg mb-4">
                      <p className="text-sm font-medium">Order ID:</p>
                      <p className="text-sm font-mono">{orderId}</p>
                      {customerEmail && (
                        <>
                          <p className="text-sm font-medium mt-2">Email:</p>
                          <p className="text-sm">{customerEmail}</p>
                        </>
                      )}
                    </div>
                  )}
                  
                   <div className="bg-muted p-4 rounded-lg">
                     <p className="text-sm font-medium">Expected completion time:</p>
                     <p className="text-2xl font-bold text-primary">
                       {orderStatus === 'completed' ? 'Ready Now' : '5-10 minutes'}
                     </p>
                     {orderStatus === 'completed' && (
                       <p className="text-sm text-green-600 font-medium mt-2">
                         Your report is ready to download below!
                       </p>
                     )}
                   </div>
                </CardContent>
              </Card>

              <div className="flex gap-3 justify-center">
                <Button
                  onClick={() => checkOrderStatus()}
                  variant="outline"
                  size="lg"
                  disabled={isLoading || isPolling}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isPolling ? 'animate-spin' : ''}`} />
                  {isPolling ? 'Checking Status...' : 'Refresh Status'}
                </Button>
                {(orderStatus === 'completed' || diagnosticStatus?.status === 'ready') && diagnosticId && (
                  <Button
                    onClick={handleDownloadReport}
                    size="lg"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Report
                  </Button>
                )}
                <Button onClick={() => (window.location.href = "/")} variant="outline" size="lg">
                  Return to Home
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default PaymentSuccess;
