import { useState, useEffect, useRef } from "react";
import { CheckCircle, Download, Clock, AlertCircle, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";

const PaymentSuccess = () => {
  const [status, setStatus] = useState<string>('checking');
  const [diagnosticId, setDiagnosticId] = useState<string>('');
  const [downloadUrl, setDownloadUrl] = useState<string>('');
  const [viewUrl, setViewUrl] = useState<string>('');
  const [attemptCount, setAttemptCount] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const { toast } = useToast();
  const pollingRef = useRef<boolean>(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');
    const submissionId = urlParams.get('submission_id');

    if (sessionId) {
      // New Buy Button flow: session_id → /checkout/session → client_reference_id
      if (!pollingRef.current) {
        pollingRef.current = true;
        fetchSubmissionIdFromSession(sessionId);
      }
    } else if (submissionId) {
      // Legacy flow: submission_id directly
      setDiagnosticId(submissionId);
      if (!pollingRef.current) {
        pollingRef.current = true;
        startAutoDownload(submissionId);
      }
    } else {
      setStatus('error');
      setErrorMessage('No session ID or submission ID provided');
    }
  }, []);

  const fetchSubmissionIdFromSession = async (sessionId: string) => {
    const API_BASE = import.meta.env.VITE_API_GATEWAY_URL || 'https://diagpro-gw-3tbssksx-3tbssksx.uc.gateway.dev';
    const API_KEY = import.meta.env.VITE_API_KEY || 'REDACTED_API_KEY';
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 2000; // 2 seconds

    setStatus('checking');

    for (let retryCount = 0; retryCount < MAX_RETRIES; retryCount++) {
      try {
        console.log(`🔍 Fetching session (attempt ${retryCount + 1}/${MAX_RETRIES}):`, sessionId);

        const response = await fetch(
          `${API_BASE}/checkout/session?id=${encodeURIComponent(sessionId)}`,
          {
            method: 'GET',
            headers: {
              'x-api-key': API_KEY
            }
          }
        );

        console.log('📡 Response status:', response.status);

        if (response.ok) {
          const data = await response.json();
          console.log('📦 Response data:', data);

          // Accept either submissionId or client_reference_id
          const submissionId = data.submissionId || data.client_reference_id;

          if (submissionId) {
            console.log('✅ Found submissionId:', submissionId);
            setDiagnosticId(submissionId);
            startAutoDownload(submissionId);
            return;
          }
        }

        // If no submission found or request failed, wait and retry
        if (retryCount < MAX_RETRIES - 1) {
          console.log(`⏳ Retrying in ${RETRY_DELAY / 1000} seconds...`);
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
          continue;
        } else {
          throw new Error('Session not ready after retries');
        }

      } catch (error) {
        console.error(`❌ Attempt ${retryCount + 1} failed:`, error);

        if (retryCount >= MAX_RETRIES - 1) {
          setStatus('error');
          setErrorMessage('Failed to retrieve checkout session details. Please refresh the page to try again.');
          return;
        }

        // Wait before retrying
        if (retryCount < MAX_RETRIES - 1) {
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        }
      }
    }
  };

  const startAutoDownload = async (submissionId: string) => {
    const API_BASE = import.meta.env.VITE_API_GATEWAY_URL || 'https://diagpro-gw-3tbssksx-3tbssksx.uc.gateway.dev';
    const API_KEY = import.meta.env.VITE_API_KEY || 'REDACTED_API_KEY';
    const MAX_ATTEMPTS = 30;

    setStatus('polling');

    for (let i = 0; i < MAX_ATTEMPTS; i++) {
      setAttemptCount(i + 1);

      try {
        const response = await fetch(
          `${API_BASE}/reports/signed-url?submissionId=${encodeURIComponent(submissionId)}`,
          {
            method: 'GET',
            headers: {
              'x-api-key': API_KEY
            }
          }
        );

        if (response.ok) {
          const data = await response.json();

          if (data.downloadUrl && data.viewUrl) {
            setDownloadUrl(data.downloadUrl);
            setViewUrl(data.viewUrl);
            setStatus('ready');

            // Auto-download
            window.location.href = data.downloadUrl;

            toast({
              title: "Report Ready!",
              description: "Your download should start automatically.",
            });
            return;
          }
        }
      } catch (error) {
        console.error(`Attempt ${i + 1} failed:`, error);
      }

      // Wait 1 second before next attempt
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Max attempts reached
    setStatus('timeout');
    setErrorMessage('Still generating... Please refresh the page in a moment.');
  };

  const getStatusInfo = () => {
    switch (status) {
      case 'ready':
        return {
          icon: <CheckCircle className="h-8 w-8 text-green-500" />,
          title: "Report Ready!",
          description: "Your diagnostic report is downloading automatically.",
          badge: <Badge className="bg-green-500/10 text-green-600 border-green-200">Ready</Badge>
        };
      case 'polling':
        return {
          icon: <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />,
          title: "Generating Report...",
          description: `Checking for report... (Attempt ${attemptCount}/30)`,
          badge: <Badge className="bg-blue-500/10 text-blue-600 border-blue-200">Processing</Badge>
        };
      case 'timeout':
        return {
          icon: <Clock className="h-8 w-8 text-yellow-500" />,
          title: "Still Processing",
          description: errorMessage || "Report generation is taking longer than expected.",
          badge: <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-200">Delayed</Badge>
        };
      case 'error':
        return {
          icon: <AlertCircle className="h-8 w-8 text-red-500" />,
          title: "Error",
          description: errorMessage || "Unable to retrieve report.",
          badge: <Badge className="bg-red-500/10 text-red-600 border-red-200">Error</Badge>
        };
      case 'checking':
      default:
        return {
          icon: <Clock className="h-8 w-8 text-muted-foreground" />,
          title: "Checking Status...",
          description: "Verifying your payment and report status.",
          badge: <Badge className="bg-muted text-muted-foreground">Checking</Badge>
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <section className="py-12 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-8">
            <div className="flex items-center justify-center mb-4">
              {statusInfo.icon}
            </div>
            <div className="flex items-center justify-center mb-4">
              {statusInfo.badge}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Payment Successful!</h1>
            <p className="text-lg text-muted-foreground">
              {statusInfo.description}
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

              {diagnosticId && (
                <div className="bg-muted p-4 rounded-lg mb-4">
                  <p className="text-sm font-medium">Submission ID:</p>
                  <p className="text-sm font-mono">{diagnosticId}</p>
                </div>
              )}

              {status === 'ready' && viewUrl && (
                <div className="mt-4">
                  <a
                    href={viewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    View Report in Browser
                  </a>
                </div>
              )}

              {status === 'timeout' && (
                <div className="mt-4">
                  <Button
                    onClick={() => window.location.reload()}
                    variant="outline"
                    size="lg"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh Page
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-3 justify-center">
            <Button onClick={() => (window.location.href = "/")} variant="outline" size="lg">
              Return to Home
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PaymentSuccess;
