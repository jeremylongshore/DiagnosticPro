import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"; 
import { apiClient } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

export default function WebhookTester() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const testWebhookEndpoint = async () => {
    setIsLoading(true);
    try {
      // Test if the webhook endpoint is reachable
      const apiBase = import.meta.env.VITE_API_BASE || 'https://diagnosticpro-api-REPLACE_ME.run.app';
      const response = await fetch(`${apiBase}/webhooks/stripe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'stripe-signature': 'test-signature'
        },
        body: JSON.stringify({
          type: 'test.event',
          data: { object: { test: true } }
        })
      });

      const result = await response.text();
      
      toast({
        title: response.ok ? "Webhook Endpoint Active" : "Webhook Error",
        description: `Status: ${response.status} - ${result}`,
        variant: response.ok ? "default" : "destructive"
      });
      
    } catch (error) {
      toast({
        title: "Connection Error",
        description: `Failed to reach webhook: ${error}`,
        variant: "destructive"
      });
    }
    setIsLoading(false);
  };

  const processStuckOrder = async () => {
    setIsLoading(true);
    try {
      // Find a stuck order and manually trigger processing
      const response = await apiClient.get('/orders?status=paid&processingStatus=pending&limit=1');
      const stuckOrder = response.data?.[0];

      if (!stuckOrder) {
        toast({
          title: "No Stuck Orders",
          description: "No orders found that need processing",
        });
        return;
      }

      // Simulate webhook event for this order
      const mockEvent = {
        type: 'checkout.session.completed',
        data: {
          object: {
            id: stuckOrder.stripe_session_id,
            customer_email: stuckOrder.customer_email,
            amount_total: stuckOrder.amount,
            currency: stuckOrder.currency,
            client_reference_id: stuckOrder.id
          }
        }
      };

      const apiBase = import.meta.env.VITE_API_BASE || 'https://diagnosticpro-api-REPLACE_ME.run.app';
      const response = await fetch(`${apiBase}/webhooks/stripe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'stripe-signature': 't=1234567890,v1=test-signature-for-manual-processing'
        },
        body: JSON.stringify(mockEvent)
      });

      const result = await response.text();
      
      toast({
        title: "Manual Processing",
        description: `Attempted to process order ${stuckOrder.id}: ${response.status}`,
        variant: response.ok ? "default" : "destructive"
      });

    } catch (error) {
      toast({
        title: "Processing Error", 
        description: `Failed to process stuck order: ${error}`,
        variant: "destructive"
      });
    }
    setIsLoading(false);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Webhook Diagnostics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground space-y-2">
          <p><strong>Endpoint:</strong> {import.meta.env.VITE_API_BASE || 'https://diagnosticpro-api-REPLACE_ME.run.app'}/webhooks/stripe</p>
          <p><strong>Webhook ID:</strong> we_1RxEQNJfyCDmId8XcV4hIv7i</p>
        </div>
        
        <div className="space-y-2">
          <Button 
            onClick={testWebhookEndpoint}
            disabled={isLoading}
            variant="outline"
            className="w-full"
          >
            {isLoading ? "Testing..." : "Test Webhook Endpoint"}
          </Button>
          
          <Button 
            onClick={processStuckOrder}
            disabled={isLoading}
            variant="default"
            className="w-full"
          >
            {isLoading ? "Processing..." : "Process Stuck Order"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}