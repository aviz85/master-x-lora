import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const trainingJobId = formData.get('trainingJobId') as string;
    const files = formData.getAll('images') as File[];
    const captions = formData.getAll('captions') as string[];

    if (!trainingJobId) {
      return NextResponse.json(
        { error: 'Training job ID is required' },
        { status: 400 }
      );
    }

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No images provided' },
        { status: 400 }
      );
    }

    // Verify training job exists
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

    const uploadedImages = [];
    const errors = [];

    // Upload each image
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const caption = captions[i] || '';

      try {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          errors.push(`File ${file.name} is not an image`);
          continue;
        }

        // Validate file size (max 10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
          errors.push(`File ${file.name} is too large (max 10MB)`);
          continue;
        }

        // Create unique file path
        const fileExtension = file.name.split('.').pop();
        const fileName = `${trainingJobId}_${Date.now()}_${i}.${fileExtension}`;
        const filePath = `training/${trainingJobId}/${fileName}`;

        // Upload to Supabase storage
        const { data: uploadData, error: uploadError } = await supabaseAdmin
          .storage
          .from('training-images')
          .upload(filePath, file, {
            contentType: file.type,
            cacheControl: '3600'
          });

        if (uploadError) {
          console.error(`Failed to upload ${file.name}:`, uploadError);
          errors.push(`Failed to upload ${file.name}: ${uploadError.message}`);
          continue;
        }

        // Save image record to database
        const { data: imageRecord, error: insertError } = await supabaseAdmin
          .from('training_images')
          .insert({
            training_job_id: trainingJobId,
            file_name: file.name,
            file_path: filePath,
            caption: caption || null,
            file_size: file.size
          })
          .select()
          .single();

        if (insertError) {
          console.error(`Failed to save image record for ${file.name}:`, insertError);
          errors.push(`Failed to save image record for ${file.name}`);
          continue;
        }

        uploadedImages.push(imageRecord);
      } catch (error) {
        console.error(`Error processing ${file.name}:`, error);
        errors.push(`Error processing ${file.name}: ${error}`);
      }
    }

    // Update training job with image count
    const { error: updateError } = await supabaseAdmin
      .from('training_jobs')
      .update({ images_count: uploadedImages.length })
      .eq('id', trainingJobId);

    if (updateError) {
      console.error('Failed to update training job image count:', updateError);
    }

    return NextResponse.json({
      success: true,
      uploaded: uploadedImages.length,
      errors: errors.length > 0 ? errors : undefined,
      images: uploadedImages
    });

  } catch (error) {
    console.error('Error uploading images:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 