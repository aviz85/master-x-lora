import { useState, useCallback } from 'react';

export interface WebhookQueueRequest {
  request_id: string;
  gateway_request_id: string;
}

export function useWebhookQueue() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentRequestId, setCurrentRequestId] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const getWebhookUrl = useCallback(() => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                   (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
    return `${baseUrl}/api/fal/webhook`;
  }, []);

  const submitWithWebhook = useCallback(async (prompt: string, imageSize: string) => {
    setIsGenerating(true);
    setError(null);
    setResult(null);
    setCurrentRequestId(null);

    try {
      const webhookUrl = getWebhookUrl();
      
      // Submit request to queue with webhook
      const submitResponse = await fetch(
        `/api/fal/queue/fal-ai/flux/schnell?fal_webhook=${encodeURIComponent(webhookUrl)}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: prompt.trim(),
            image_size: imageSize,
            num_inference_steps: 4,
            num_images: 1,
            enable_safety_checker: true
          }),
        }
      );

      if (!submitResponse.ok) {
        throw new Error(`Failed to submit request: ${submitResponse.status}`);
      }

      const queueRequest: WebhookQueueRequest = await submitResponse.json();
      setCurrentRequestId(queueRequest.request_id);
      
      console.log('Request submitted with webhook:', {
        request_id: queueRequest.request_id,
        webhook_url: webhookUrl
      });

      // Note: The result will come via webhook, not polling
      // The UI should show "waiting for webhook" state

    } catch (err) {
      console.error('Error submitting to webhook queue:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit request');
      setIsGenerating(false);
    }
  }, [getWebhookUrl]);

  // This would be called when webhook is received
  // In a real app, you'd need a way to communicate between the webhook endpoint and the UI
  // (e.g., WebSocket, Server-Sent Events, or database polling)
  const handleWebhookResult = useCallback((webhookPayload: any) => {
    if (webhookPayload.request_id === currentRequestId) {
      if (webhookPayload.status === 'OK') {
        setResult(webhookPayload.payload);
        setError(null);
      } else {
        setError(webhookPayload.error || 'Generation failed');
      }
      setIsGenerating(false);
    }
  }, [currentRequestId]);

  const cancelRequest = useCallback(async () => {
    if (currentRequestId) {
      try {
        const cancelResponse = await fetch(
          `/api/fal/queue/fal-ai/flux/schnell/requests/${currentRequestId}/cancel`,
          { method: 'PUT' }
        );

        if (cancelResponse.ok) {
          setIsGenerating(false);
          setError('Request cancelled');
        }
      } catch (err) {
        console.error('Error cancelling request:', err);
      }
    }
  }, [currentRequestId]);

  return {
    isGenerating,
    currentRequestId,
    result,
    error,
    submitWithWebhook,
    handleWebhookResult,
    cancelRequest,
  };
} 