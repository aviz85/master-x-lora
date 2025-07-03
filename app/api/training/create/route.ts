import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const {
      name,
      trigger_word,
      steps = 1000,
      is_style = false,
      create_masks = true
    } = await request.json();

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Training job name is required' },
        { status: 400 }
      );
    }

    // Validate steps
    if (steps < 100 || steps > 5000) {
      return NextResponse.json(
        { error: 'Steps must be between 100 and 5000' },
        { status: 400 }
      );
    }

    // Create training job
    const { data: trainingJob, error: insertError } = await supabaseAdmin
      .from('training_jobs')
      .insert({
        name: name.trim(),
        trigger_word: trigger_word?.trim() || null,
        steps,
        is_style,
        create_masks,
        status: 'pending',
        images_count: 0
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to create training job:', insertError);
      return NextResponse.json(
        { error: 'Failed to create training job' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      trainingJob
    });

  } catch (error) {
    console.error('Error creating training job:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Get all training jobs ordered by creation date
    const { data: trainingJobs, error } = await supabaseAdmin
      .from('training_jobs')
      .select(`
        *,
        training_images (
          id,
          file_name,
          caption,
          file_size,
          created_at
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch training jobs:', error);
      return NextResponse.json(
        { error: 'Failed to fetch training jobs' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      trainingJobs
    });

  } catch (error) {
    console.error('Error fetching training jobs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 