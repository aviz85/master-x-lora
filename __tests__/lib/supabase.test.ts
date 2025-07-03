import { TrainingJob, TrainingImage } from '@/lib/supabase'

// Mock Supabase
const mockSupabaseClient = {
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
  })),
  auth: {
    signUp: jest.fn(),
    signInWithPassword: jest.fn(),
    signOut: jest.fn(),
  },
  storage: {
    from: jest.fn(() => ({
      upload: jest.fn(),
      download: jest.fn(),
      remove: jest.fn(),
    })),
  },
}

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabaseClient),
}))

describe('Supabase Configuration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Client Creation', () => {
    it('should create supabase clients', async () => {
      // Import after mocking
      const { supabase, supabaseAdmin } = await import('@/lib/supabase')
      
      expect(supabase).toBeDefined()
      expect(supabaseAdmin).toBeDefined()
    })
  })

  describe('TypeScript Interfaces', () => {
    it('should validate TrainingJob interface structure', () => {
      const trainingJob: TrainingJob = {
        id: 'test-id',
        name: 'Test Job',
        status: 'pending',
        trigger_word: 'test',
        steps: 1000,
        is_style: false,
        create_masks: true,
        images_count: 5,
        zip_url: 'https://example.com/test.zip',
        fal_request_id: 'fal-123',
        fal_webhook_url: 'https://example.com/webhook',
        result_lora_url: 'https://example.com/lora.safetensors',
        result_config_url: 'https://example.com/config.json',
        result_debug_url: 'https://example.com/debug.zip',
        error_message: undefined,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      expect(trainingJob.id).toBe('test-id')
      expect(trainingJob.status).toBe('pending')
      expect(trainingJob.steps).toBe(1000)
      expect(trainingJob.is_style).toBe(false)
      expect(trainingJob.create_masks).toBe(true)
    })

    it('should validate TrainingImage interface structure', () => {
      const trainingImage: TrainingImage = {
        id: 'image-id',
        training_job_id: 'job-id',
        file_name: 'test.jpg',
        file_path: '/path/to/test.jpg',
        caption: 'Test image caption',
        file_size: 1024000,
        created_at: '2024-01-01T00:00:00Z',
      }

      expect(trainingImage.id).toBe('image-id')
      expect(trainingImage.training_job_id).toBe('job-id')
      expect(trainingImage.file_name).toBe('test.jpg')
      expect(trainingImage.file_size).toBe(1024000)
    })

    it('should validate TrainingJob status enum values', () => {
      const statuses: TrainingJob['status'][] = ['pending', 'processing', 'completed', 'failed']
      
      statuses.forEach(status => {
        const job: TrainingJob = {
          id: 'test',
          name: 'Test',
          status,
          steps: 1000,
          is_style: false,
          create_masks: true,
          images_count: 0,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        }
        expect(job.status).toBe(status)
      })
    })
  })

  describe('Client Methods', () => {
    it('should have database query methods', async () => {
      const { supabase } = await import('@/lib/supabase')
      
      expect(supabase.from).toBeDefined()
      expect(typeof supabase.from).toBe('function')
    })

    it('should have auth methods', async () => {
      const { supabase } = await import('@/lib/supabase')
      
      expect(supabase.auth).toBeDefined()
      expect(supabase.auth.signUp).toBeDefined()
      expect(supabase.auth.signInWithPassword).toBeDefined()
      expect(supabase.auth.signOut).toBeDefined()
    })

    it('should have storage methods', async () => {
      const { supabase } = await import('@/lib/supabase')
      
      expect(supabase.storage).toBeDefined()
      expect(supabase.storage.from).toBeDefined()
      expect(typeof supabase.storage.from).toBe('function')
    })
  })

  describe('Environment Variables', () => {
    it('should use correct environment variables', () => {
      expect(process.env.NEXT_PUBLIC_SUPABASE_URL).toBe('https://test-project.supabase.co')
      expect(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBe('test-anon-key')
      expect(process.env.SUPABASE_SERVICE_ROLE_KEY).toBe('test-service-role-key')
    })
  })
}) 