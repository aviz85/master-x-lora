-- Create training_jobs table
CREATE TABLE training_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  trigger_word VARCHAR(255),
  steps INTEGER NOT NULL DEFAULT 1000,
  is_style BOOLEAN NOT NULL DEFAULT false,
  create_masks BOOLEAN NOT NULL DEFAULT true,
  images_count INTEGER NOT NULL DEFAULT 0,
  zip_url TEXT,
  fal_request_id VARCHAR(255),
  fal_webhook_url TEXT,
  result_lora_url TEXT,
  result_config_url TEXT,
  result_debug_url TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create training_images table
CREATE TABLE training_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  training_job_id UUID NOT NULL REFERENCES training_jobs(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  caption TEXT,
  file_size INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_training_jobs_status ON training_jobs(status);
CREATE INDEX idx_training_jobs_created_at ON training_jobs(created_at);
CREATE INDEX idx_training_images_job_id ON training_images(training_job_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_training_jobs_updated_at
  BEFORE UPDATE ON training_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE training_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_images ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (you can modify these based on your auth requirements)
CREATE POLICY "Allow all operations on training_jobs" ON training_jobs
  FOR ALL USING (true);

CREATE POLICY "Allow all operations on training_images" ON training_images
  FOR ALL USING (true);

-- Create storage bucket for training images
INSERT INTO storage.buckets (id, name, public) VALUES ('training-images', 'training-images', true);

-- Create storage policy for training images bucket
CREATE POLICY "Allow public uploads to training-images bucket"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'training-images');

CREATE POLICY "Allow public downloads from training-images bucket"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'training-images');

CREATE POLICY "Allow public deletes from training-images bucket"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'training-images'); 