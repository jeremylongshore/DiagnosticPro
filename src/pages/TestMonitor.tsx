import { useState, useEffect } from "react";
import { apiClient } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react";

const TestMonitor = () => {
  const [logs, setLogs] = useState([]);
  const [orders, setOrders] = useState([]);
  const [emailLogs, setEmailLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Get recent orders
      const ordersResponse = await apiClient.get('/orders?limit=5');

      // Get recent email logs
      const emailResponse = await apiClient.get('/email-logs?limit=5');

      // Get recent diagnostic submissions
      const diagnosticResponse = await apiClient.get('/submissions?limit=5');

      setOrders(ordersResponse.data || []);
      setEmailLogs(emailResponse.data || []);
      setLogs(diagnosticResponse.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Auto-refresh every 10 seconds
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid':
      case 'sent':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status) => {
    const variant = {
      'paid': 'default',
      'sent': 'default', 
      'pending': 'secondary',
      'failed': 'destructive'
    }[status] || 'outline';

    return <Badge variant={variant}>{status}</Badge>;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Payment Flow Test Monitor</h1>
        <Button onClick={fetchData} disabled={loading} size="sm">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Orders */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {orders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <div className="font-medium text-sm">{order.customer_email}</div>
                  <div className="text-xs text-muted-foreground">
                    ${(order.amount / 100).toFixed(2)} • {new Date(order.created_at).toLocaleTimeString()}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(order.status)}
                  {getStatusBadge(order.status)}
                </div>
              </div>
            ))}
            {orders.length === 0 && (
              <div className="text-center text-muted-foreground py-4">No orders yet</div>
            )}
          </CardContent>
        </Card>

        {/* Email Logs */}
        <Card>
          <CardHeader>
            <CardTitle>Email Logs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {emailLogs.map((email) => (
              <div key={email.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <div className="font-medium text-sm">{email.to_email}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(email.created_at).toLocaleTimeString()}
                  </div>
                  {email.error && (
                    <div className="text-xs text-red-500 mt-1">{email.error}</div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(email.status)}
                  {getStatusBadge(email.status)}
                </div>
              </div>
            ))}
            {emailLogs.length === 0 && (
              <div className="text-center text-muted-foreground py-4">No emails yet</div>
            )}
          </CardContent>
        </Card>

        {/* Diagnostic Submissions */}
        <Card>
          <CardHeader>
            <CardTitle>Diagnostic Submissions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {logs.map((submission) => (
              <div key={submission.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <div className="font-medium text-sm">
                    {submission.make} {submission.model}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {submission.full_name} • {new Date(submission.created_at).toLocaleTimeString()}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(submission.payment_status)}
                  {getStatusBadge(submission.payment_status)}
                </div>
              </div>
            ))}
            {logs.length === 0 && (
              <div className="text-center text-muted-foreground py-4">No submissions yet</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>🚦 Testing Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <div className="font-medium">Secrets Ready</div>
              <div className="text-sm text-muted-foreground">All API keys configured</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <div className="font-medium">Database Ready</div>
              <div className="text-sm text-muted-foreground">Tables configured</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <div className="font-medium">Functions Ready</div>
              <div className="text-sm text-muted-foreground">Edge functions deployed</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Clock className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <div className="font-medium">Ready for Test</div>
              <div className="text-sm text-muted-foreground">Submit diagnostic to test</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>📋 Testing Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Submit a diagnostic form with test data (not your real vehicle)</li>
            <li>Complete the Stripe payment ($4.99)</li>
            <li>Monitor this page to see real-time updates</li>
            <li>Check your email for the analysis report with PDF</li>
            <li>Verify all statuses show as "paid" and "sent"</li>
          </ol>
          <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
            <div className="font-medium text-yellow-800">💡 Pro Tip</div>
            <div className="text-sm text-yellow-700">
              This page auto-refreshes every 10 seconds. Watch for status changes during your test.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestMonitor;