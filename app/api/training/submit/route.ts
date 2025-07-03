import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

function getFalKey(): string | undefined {
  return process.env.FAL_KEY;
}

export async function POST(request: NextRequest) {
  try {
    const { trainingJobId } = await request.json();

    if (!trainingJobId) {
      return NextResponse.json(
        { error: 'Training job ID is required' },
        { status: 400 }
      );
    }

    const falKey = getFalKey();
    if (!falKey) {
      return NextResponse.json(
        { error: 'FAL API key not configured' },
        { status: 500 }
      );
    }

    // Get training job
    const { data: trainingJob, error: jobError } = await supabaseAdmin
      .from('training_jobs')
      .select('*')
      .eq('id', trainingJobId)
      .single();

    if (jobError || !trainingJob) {
      return NextResponse.json(
        { error: 'Training job not found' },
        { status: 404 }
      );
    }

    if (!trainingJob.zip_url) {
      return NextResponse.json(
        { error: 'ZIP file not ready for this training job' },
        { status: 400 }
      );
    }

    // Create webhook URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                   (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
    const webhookUrl = `${baseUrl}/api/training/webhook`;

    // Prepare training request payload
    const trainingPayload = {
      images_data_url: trainingJob.zip_url,
      trigger_word: trainingJob.trigger_word || undefined,
      create_masks: trainingJob.create_masks,
      steps: trainingJob.steps,
      is_style: trainingJob.is_style,
      is_input_format_already_preprocessed: false,
      data_archive_format: 'zip'
    };

    // Submit to FAL AI queue with webhook
    const falResponse = await fetch(
      `https://queue.fal.run/fal-ai/flux-lora-fast-training?fal_webhook=${encodeURIComponent(webhookUrl)}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Key ${falKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(trainingPayload),
      }
    );

    if (!falResponse.ok) {
      const errorText = await falResponse.text();
      console.error('FAL API error:', errorText);
      return NextResponse.json(
        { error: `FAL API error: ${falResponse.status}` },
        { status: falResponse.status }
      );
    }

    const falResult = await falResponse.json();

    // Update training job with FAL request info
    const { error: updateError } = await supabaseAdmin
      .from('training_jobs')
      .update({
        status: 'processing',
        fal_request_id: falResult.request_id,
        fal_webhook_url: webhookUrl
      })
      .eq('id', trainingJobId);

    if (updateError) {
      console.error('Failed to update training job:', updateError);
      return NextResponse.json(
        { error: 'Failed to update training job' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      requestId: falResult.request_id,
      gatewayRequestId: falResult.gateway_request_id,
      webhookUrl,
      trainingPayload
    });

  } catch (error) {
    console.error('Error submitting training job:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 