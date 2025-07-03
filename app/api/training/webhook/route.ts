import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Types for training webhook payload
interface TrainingWebhookPayload {
  request_id: string;
  gateway_request_id: string;
  status: 'OK' | 'ERROR';
  payload?: {
    diffusers_lora_file?: {
      url: string;
      content_type: string;
      file_name: string;
      file_size: number;
    };
    config_file?: {
      url: string;
      content_type: string;
      file_name: string;
      file_size: number;
    };
    debug_preprocessed_output?: {
      url: string;
      content_type: string;
      file_name: string;
      file_size: number;
    };
  };
  error?: string;
  payload_error?: string;
}

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
    console.log('Training webhook verification - timestamp OK, signature verification skipped for demo');
    console.log('Request details:', { requestId, userId, timestamp, signatureLength: signature.length });
    
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
    const payload: TrainingWebhookPayload = JSON.parse(body.toString());

    console.log('Received valid training webhook:', {
      request_id: payload.request_id,
      status: payload.status,
    });

    // Find the training job by FAL request ID
    const { data: trainingJob, error: findError } = await supabaseAdmin
      .from('training_jobs')
      .select('*')
      .eq('fal_request_id', payload.request_id)
      .single();

    if (findError || !trainingJob) {
      console.error('Training job not found for request ID:', payload.request_id);
      return NextResponse.json(
        { error: 'Training job not found' },
        { status: 404 }
      );
    }

    // Update training job based on webhook status
    if (payload.status === 'OK' && payload.payload) {
      // Training completed successfully
      const updateData: any = {
        status: 'completed',
        result_lora_url: payload.payload.diffusers_lora_file?.url || null,
        result_config_url: payload.payload.config_file?.url || null,
        result_debug_url: payload.payload.debug_preprocessed_output?.url || null,
        error_message: null
      };

      const { error: updateError } = await supabaseAdmin
        .from('training_jobs')
        .update(updateData)
        .eq('id', trainingJob.id);

      if (updateError) {
        console.error('Failed to update training job:', updateError);
        return NextResponse.json(
          { error: 'Failed to update training job' },
          { status: 500 }
        );
      }

      console.log('Training completed successfully:', trainingJob.id);
    } else if (payload.status === 'ERROR') {
      // Training failed
      const { error: updateError } = await supabaseAdmin
        .from('training_jobs')
        .update({
          status: 'failed',
          error_message: payload.error || 'Unknown error occurred'
        })
        .eq('id', trainingJob.id);

      if (updateError) {
        console.error('Failed to update training job:', updateError);
        return NextResponse.json(
          { error: 'Failed to update training job' },
          { status: 500 }
        );
      }

      console.log('Training failed:', trainingJob.id, payload.error);
    }

    // Return success response
    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Training webhook processing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 