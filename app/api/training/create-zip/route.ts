import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import archiver from 'archiver';
import { Readable } from 'stream';

export async function POST(request: NextRequest) {
  try {
    const { trainingJobId } = await request.json();

    if (!trainingJobId) {
      return NextResponse.json(
        { error: 'Training job ID is required' },
        { status: 400 }
      );
    }

    // Get training job and images
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

    const { data: images, error: imagesError } = await supabaseAdmin
      .from('training_images')
      .select('*')
      .eq('training_job_id', trainingJobId);

    if (imagesError || !images || images.length === 0) {
      return NextResponse.json(
        { error: 'No images found for this training job' },
        { status: 404 }
      );
    }

    // Create ZIP archive
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    });

    const chunks: Buffer[] = [];
    
    // Collect archive data
    archive.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });

    // Handle archive completion
    const archivePromise = new Promise<Buffer>((resolve, reject) => {
      archive.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
      
      archive.on('error', (err: Error) => {
        reject(err);
      });
    });

    // Add images to archive
    for (const image of images) {
      try {
        // Download image from Supabase storage
        const { data: imageData, error: downloadError } = await supabaseAdmin
          .storage
          .from('training-images')
          .download(image.file_path);

        if (downloadError || !imageData) {
          console.error(`Failed to download image ${image.file_name}:`, downloadError);
          continue;
        }

        // Convert Blob to Buffer
        const arrayBuffer = await imageData.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Add image to archive
        archive.append(buffer, { name: image.file_name });

        // Add caption file if exists
        if (image.caption) {
          const captionFileName = image.file_name.replace(/\.[^/.]+$/, '.txt');
          archive.append(image.caption, { name: captionFileName });
        }
      } catch (error) {
        console.error(`Error processing image ${image.file_name}:`, error);
        continue;
      }
    }

    // Finalize archive
    archive.finalize();

    // Wait for archive to complete
    const zipBuffer = await archivePromise;

    // Upload ZIP to Supabase storage
    const zipFileName = `training-${trainingJobId}-${Date.now()}.zip`;
    const zipPath = `zips/${zipFileName}`;

    const { data: uploadData, error: uploadError } = await supabaseAdmin
      .storage
      .from('training-images')
      .upload(zipPath, zipBuffer, {
        contentType: 'application/zip',
        cacheControl: '3600'
      });

    if (uploadError) {
      console.error('Failed to upload ZIP:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload ZIP file' },
        { status: 500 }
      );
    }

    // Get public URL for the ZIP file
    const { data: publicUrlData } = supabaseAdmin
      .storage
      .from('training-images')
      .getPublicUrl(zipPath);

    const zipUrl = publicUrlData.publicUrl;

    // Update training job with ZIP URL
    const { error: updateError } = await supabaseAdmin
      .from('training_jobs')
      .update({ zip_url: zipUrl })
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
      zipUrl,
      zipPath,
      imagesCount: images.length
    });

  } catch (error) {
    console.error('Error creating ZIP:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 