import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server-side client with service role key for admin operations
export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Types for training data
export interface TrainingJob {
  id: string
  name: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  trigger_word?: string
  steps: number
  is_style: boolean
  create_masks: boolean
  images_count: number
  zip_url?: string
  fal_request_id?: string
  fal_webhook_url?: string
  result_lora_url?: string
  result_config_url?: string
  result_debug_url?: string
  error_message?: string
  created_at: string
  updated_at: string
}

export interface TrainingImage {
  id: string
  training_job_id: string
  file_name: string
  file_path: string
  caption?: string
  file_size: number
  created_at: string
} 