import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Download, CheckCircle, FileText, AlertCircle, RefreshCw, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getDiagnosticStatus, downloadReport, pollDiagnosticStatus, type DiagnosticStatus } from "@/services/reports";
import { useToast } from "@/hooks/use-toast";

const Report = () => {
  const { reportId } = useParams<{ reportId: string }>();
  const [diagnosticStatus, setDiagnosticStatus] = useState<DiagnosticStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPolling, setIsPolling] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchDiagnosticStatus = async () => {
      if (!reportId) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await getDiagnosticStatus(reportId);

        if (!response.data) {
          console.error('Diagnostic not found');
          setDiagnosticStatus(null);
        } else {
          setDiagnosticStatus(response.data);

          // If status is still processing, start polling
          if (response.data.status === 'processing' || response.data.status === 'pending') {
            startPolling(reportId);
          }
        }
      } catch (error) {
        console.error('Error fetching diagnostic status:', error);
        setDiagnosticStatus(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDiagnosticStatus();
  }, [reportId]);

  const startPolling = async (diagnosticId: string) => {
    if (isPolling) return;

    setIsPolling(true);

    try {
      const finalStatus = await pollDiagnosticStatus(
        diagnosticId,
        (status) => {
          setDiagnosticStatus(status);
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
      } else if (finalStatus.status === 'ready') {
        toast({
          title: "Report Ready!",
          description: "Your diagnostic report is now ready for download.",
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

  const handleDownload = async () => {
    if (!reportId) return;

    setIsDownloading(true);
    try {
      await downloadReport(reportId);
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
    } finally {
      setIsDownloading(false);
    }
  };

  const handleRefreshStatus = async () => {
    if (!reportId) return;

    setIsLoading(true);
    try {
      const response = await getDiagnosticStatus(reportId);
      if (response.data) {
        setDiagnosticStatus(response.data);

        // If still processing, restart polling
        if (response.data.status === 'processing' || response.data.status === 'pending') {
          startPolling(reportId);
        }
      }
    } catch (error) {
      console.error('Error refreshing status:', error);
      toast({
        title: "Refresh Failed",
        description: "Unable to refresh status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusInfo = () => {
    if (!diagnosticStatus) {
      return {
        icon: <AlertCircle className="h-8 w-8 text-red-500" />,
        title: "Report Not Found",
        description: "The requested diagnostic report could not be found.",
        badge: <Badge variant="destructive">Not Found</Badge>,
        canDownload: false
      };
    }

    switch (diagnosticStatus.status) {
      case 'ready':
        return {
          icon: <CheckCircle className="h-8 w-8 text-green-500" />,
          title: "Report Ready",
          description: "Your diagnostic report is ready for download.",
          badge: <Badge className="bg-green-500/10 text-green-600 border-green-200">Ready</Badge>,
          canDownload: true
        };
      case 'processing':
        return {
          icon: <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />,
          title: "Generating Report",
          description: "Your diagnostic report is being generated. This usually takes 2-3 minutes.",
          badge: <Badge className="bg-blue-500/10 text-blue-600 border-blue-200">Processing</Badge>,
          canDownload: false
        };
      case 'failed':
        return {
          icon: <AlertCircle className="h-8 w-8 text-red-500" />,
          title: "Generation Failed",
          description: "Report generation failed. Please contact support for assistance.",
          badge: <Badge variant="destructive">Failed</Badge>,
          canDownload: false
        };
      case 'pending':
      default:
        return {
          icon: <Clock className="h-8 w-8 text-muted-foreground" />,
          title: "Report Pending",
          description: "Your diagnostic report is queued for generation.",
          badge: <Badge variant="secondary">Pending</Badge>,
          canDownload: false
        };
    }
  };

  const statusInfo = getStatusInfo();

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto text-center">
          <RefreshCw className="h-16 w-16 text-muted-foreground mx-auto mb-4 animate-spin" />
          <h1 className="text-3xl font-bold mb-4">Loading Report...</h1>
          <p className="text-muted-foreground">Checking report status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            {statusInfo.icon}
          </div>
          <div className="flex items-center justify-center mb-4">
            {statusInfo.badge}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">{statusInfo.title}</h1>
          <p className="text-lg text-muted-foreground">{statusInfo.description}</p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Diagnostic Report
            </CardTitle>
          </CardHeader>
          <CardContent>
            {diagnosticStatus && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Report ID:</span>
                    <p className="font-mono text-muted-foreground">{diagnosticStatus.id}</p>
                  </div>
                  <div>
                    <span className="font-medium">Status:</span>
                    <p className="capitalize">{diagnosticStatus.status}</p>
                  </div>
                  <div>
                    <span className="font-medium">Created:</span>
                    <p>{new Date(diagnosticStatus.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <span className="font-medium">Updated:</span>
                    <p>{new Date(diagnosticStatus.updatedAt).toLocaleDateString()}</p>
                  </div>
                </div>

                {diagnosticStatus.gcsPath && (
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-sm font-medium mb-1">Storage Location:</p>
                    <p className="text-sm font-mono text-muted-foreground">{diagnosticStatus.gcsPath}</p>
                  </div>
                )}

                {(diagnosticStatus.status === 'processing' || diagnosticStatus.status === 'pending') && (
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-800">
                      <strong>Processing Time:</strong> Typically 2-3 minutes for comprehensive analysis.
                    </p>
                    {isPolling && (
                      <p className="text-sm text-blue-600 mt-2">
                        🔄 Automatically checking for updates...
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-3 justify-center">
          <Button
            onClick={handleRefreshStatus}
            variant="outline"
            size="lg"
            disabled={isLoading || isPolling}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading || isPolling ? 'animate-spin' : ''}`} />
            {isLoading || isPolling ? 'Updating...' : 'Refresh Status'}
          </Button>

          {statusInfo.canDownload && (
            <Button
              onClick={handleDownload}
              size="lg"
              disabled={isDownloading}
              className="bg-green-600 hover:bg-green-700"
            >
              <Download className="h-4 w-4 mr-2" />
              {isDownloading ? 'Downloading...' : 'Download Report'}
            </Button>
          )}

          <Button
            onClick={() => (window.location.href = "/")}
            variant="outline"
            size="lg"
          >
            Return to Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Report;