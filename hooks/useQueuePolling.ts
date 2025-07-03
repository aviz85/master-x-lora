import { useState, useEffect, useCallback } from 'react';

export type QueueStatus = 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';

export interface QueueRequest {
  request_id: string;
  response_url: string;
  status_url: string;
  cancel_url: string;
}

export interface QueueStatusResponse {
  status: QueueStatus;
  queue_position?: number;
  logs?: Array<{
    message: string;
    level: string;
    source: string;
    timestamp: string;
  }>;
  response_url: string;
  request_id: string;
  cancel_url: string;
}

export interface QueueResult {
  status: QueueStatus;
  logs?: Array<{
    message: string;
    level: string;
    source: string;
    timestamp: string;
  }>;
  response: any;
}

export function useQueuePolling() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [queueStatus, setQueueStatus] = useState<QueueStatusResponse | null>(null);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<Array<{
    message: string;
    level: string;
    source: string;
    timestamp: string;
  }>>([]);

  const submitToQueue = useCallback(async (prompt: string, imageSize: string) => {
    setIsGenerating(true);
    setError(null);
    setResult(null);
    setQueueStatus(null);
    setLogs([]);

    try {
      // Submit request to queue
      const submitResponse = await fetch('/api/fal/queue/fal-ai/flux/schnell', {
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
      });

      if (!submitResponse.ok) {
        throw new Error(`Failed to submit request: ${submitResponse.status}`);
      }

      const queueRequest: QueueRequest = await submitResponse.json();
      
      // Start polling for status
      await pollForStatus(queueRequest.request_id);

    } catch (err) {
      console.error('Error submitting to queue:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit request');
      setIsGenerating(false);
    }
  }, []);

  const pollForStatus = useCallback(async (requestId: string) => {
    const pollInterval = 2000; // Poll every 2 seconds
    let attempts = 0;
    const maxAttempts = 300; // 10 minutes maximum

    const poll = async () => {
      try {
        attempts++;
        
        const statusResponse = await fetch(
          `/api/fal/queue/fal-ai/flux/schnell/requests/${requestId}/status?logs=1`
        );

        if (!statusResponse.ok) {
          throw new Error(`Failed to get status: ${statusResponse.status}`);
        }

        const statusData: QueueStatusResponse = await statusResponse.json();
        setQueueStatus(statusData);

        // Update logs if available
        if (statusData.logs) {
          setLogs(statusData.logs);
        }

        if (statusData.status === 'COMPLETED') {
          // Get the final result
          const resultResponse = await fetch(
            `/api/fal/queue/fal-ai/flux/schnell/requests/${requestId}`
          );

          if (!resultResponse.ok) {
            throw new Error(`Failed to get result: ${resultResponse.status}`);
          }

          const resultData: QueueResult = await resultResponse.json();
          setResult(resultData.response);
          setIsGenerating(false);
          return;
        }

        if (statusData.status === 'FAILED') {
          setError('Image generation failed');
          setIsGenerating(false);
          return;
        }

        // Continue polling if still in queue or in progress
        if (attempts < maxAttempts) {
          setTimeout(poll, pollInterval);
        } else {
          setError('Request timeout - please try again');
          setIsGenerating(false);
        }

      } catch (err) {
        console.error('Error polling status:', err);
        setError(err instanceof Error ? err.message : 'Failed to check status');
        setIsGenerating(false);
      }
    };

    // Start polling
    poll();
  }, []);

  const cancelRequest = useCallback(async (requestId: string) => {
    try {
      const cancelResponse = await fetch(
        `/api/fal/queue/fal-ai/flux/schnell/requests/${requestId}/cancel`,
        { method: 'PUT' }
      );

      if (cancelResponse.ok) {
        setIsGenerating(false);
        setError('Request cancelled');
      }
    } catch (err) {
      console.error('Error cancelling request:', err);
    }
  }, []);

  return {
    isGenerating,
    queueStatus,
    result,
    error,
    logs,
    submitToQueue,
    cancelRequest,
  };
} 