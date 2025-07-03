import { NextRequest, NextResponse } from 'next/server';

// Types for webhook payload
interface WebhookPayload {
  request_id: string;
  gateway_request_id: string;
  status: 'OK' | 'ERROR';
  payload?: {
    images?: Array<{
      url: string;
      content_type: string;
      file_name: string;
      file_size: number;
      width: number;
      height: number;
    }>;
    seed?: number;
  };
  error?: string;
  payload_error?: string;
}

// Note: In production, you would implement proper JWKS fetching and ED25519 signature verification
// For this demo, we're using simplified verification

async function verifyWebhookSignature(
  requestId: string,
  userId: string,
  timestamp: string,
  signature: string
): Promise<boolean> {
  try {
    // Verify timestamp (allow ±5 minutes)
    const requestTime = parseInt(timestamp);
    const currentTime = Math.floor(Date.now() / 1000);
    const timeDiff = Math.abs(currentTime - requestTime);
    
    if (timeDiff > 300) { // 5 minutes
      console.error('Webhook timestamp is too old or too far in the future');
      return false;
    }

    // For development/demo purposes, we'll skip signature verification
    // In production, you should implement proper ED25519 signature verification
    console.log('Webhook verification - timestamp OK, signature verification skipped for demo');
    console.log('Request details:', { requestId, userId, timestamp, signatureLength: signature.length });
    
    // TODO: Implement proper ED25519 signature verification
    // This would require a proper crypto library like @noble/ed25519
    return true;
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get required headers
    const requestId = request.headers.get('x-fal-webhook-request-id');
    const userId = request.headers.get('x-fal-webhook-user-id');
    const timestamp = request.headers.get('x-fal-webhook-timestamp');
    const signature = request.headers.get('x-fal-webhook-signature');

    if (!requestId || !userId || !timestamp || !signature) {
      console.error('Missing required webhook headers');
      return NextResponse.json(
        { error: 'Missing required headers' },
        { status: 400 }
      );
    }

    // Get request body as buffer
    const body = Buffer.from(await request.arrayBuffer());

    // Verify signature
    const isValid = await verifyWebhookSignature(
      requestId,
      userId,
      timestamp,
      signature
    );

    if (!isValid) {
      console.error('Invalid webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Parse the webhook payload
    const payload: WebhookPayload = JSON.parse(body.toString());

    console.log('Received valid webhook:', {
      request_id: payload.request_id,
      status: payload.status,
    });

    // Here you can add your business logic
    // For example: store in database, send notifications, etc.
    
    if (payload.status === 'OK') {
      console.log('Image generation completed successfully:', payload.request_id);
      // Handle successful generation
    } else if (payload.status === 'ERROR') {
      console.log('Image generation failed:', payload.request_id, payload.error);
      // Handle failed generation
    }

    // Return success response
    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 