import { renderHook, act, waitFor } from '@testing-library/react'
import { TrainingJob } from '@/lib/supabase'

// Mock Supabase with a factory function
// Create mock subscription that can be cleaned up
const createMockSubscription = () => ({
  unsubscribe: jest.fn(),
})

// Create mock channel that returns a subscription
const createMockChannel = () => ({
  on: jest.fn().mockReturnThis(),
  subscribe: jest.fn().mockReturnValue(createMockSubscription()),
  unsubscribe: jest.fn(),
})

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      order: jest.fn().mockReturnThis(),
    })),
    channel: jest.fn(() => createMockChannel()),
  },
  supabaseAdmin: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      order: jest.fn().mockReturnThis(),
    })),
    channel: jest.fn(() => createMockChannel()),
  },
}))

import { useTrainingJobs } from '@/hooks/useTrainingJobs'

const mockTrainingJob: TrainingJob = {
  id: 'test-job-1',
  name: 'Test Training Job',
  status: 'pending',
  trigger_word: 'test',
  steps: 1000,
  is_style: false,
  create_masks: true,
  images_count: 5,
  zip_url: 'https://example.com/test.zip',
  fal_request_id: 'fal-123',
  fal_webhook_url: 'https://example.com/webhook',
  result_lora_url: undefined,
  result_config_url: undefined,
  result_debug_url: undefined,
  error_message: undefined,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

const mockTrainingJobWithImages = {
  ...mockTrainingJob,
  training_images: [
    {
      id: 'img-1',
      training_job_id: 'test-job-1',
      file_name: 'test1.jpg',
      file_path: '/path/to/test1.jpg',
      caption: 'Test image 1',
      file_size: 1024000,
      created_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'img-2',
      training_job_id: 'test-job-1',
      file_name: 'test2.jpg',
      file_path: '/path/to/test2.jpg',
      caption: 'Test image 2',
      file_size: 2048000,
      created_at: '2024-01-01T00:00:00Z',
    },
  ],
}

describe('useTrainingJobs', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch = jest.fn()
  })

  describe('Initial State', () => {
    it('should initialize with correct default values', () => {
      const { result } = renderHook(() => useTrainingJobs())

      expect(result.current.trainingJobs).toEqual([])
      expect(result.current.loading).toBe(true)
      expect(result.current.error).toBeNull()
    })
  })

  describe('fetchJobs', () => {
    it('should fetch training jobs successfully', async () => {
      const mockResponse = {
        success: true,
        trainingJobs: [mockTrainingJobWithImages],
      }

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      const { result } = renderHook(() => useTrainingJobs())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.trainingJobs).toEqual([mockTrainingJobWithImages])
      expect(result.current.error).toBeNull()
      expect(global.fetch).toHaveBeenCalledWith('/api/training/create')
    })

    it('should handle fetch error', async () => {
      const mockResponse = {
        success: false,
        error: 'Database error',
      }

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      const { result } = renderHook(() => useTrainingJobs())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.trainingJobs).toEqual([])
      expect(result.current.error).toBe('Failed to fetch training jobs')
    })
  })

  describe('createTrainingJob', () => {
    it('should create a new training job successfully', async () => {
      const mockResponse = {
        success: true,
        trainingJob: mockTrainingJob,
      }

      // Mock both the create request and the refresh request
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, trainingJobs: [mockTrainingJob] }),
        })

      const { result } = renderHook(() => useTrainingJobs())

      const jobData = {
        name: 'New Test Job',
        trigger_word: 'newtest',
        steps: 1500,
        is_style: true,
        create_masks: false,
      }

      let createdJob: any
      await act(async () => {
        createdJob = await result.current.createTrainingJob(jobData)
      })
      
      expect(createdJob).toEqual(mockTrainingJob)

      expect(global.fetch).toHaveBeenCalledWith('/api/training/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jobData),
      })
    })

    it('should handle create job error', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: false, error: 'Creation failed' }),
      })

      const { result } = renderHook(() => useTrainingJobs())

      const jobData = {
        name: 'New Test Job',
        trigger_word: 'newtest',
        steps: 1500,
        is_style: true,
        create_masks: false,
      }

      await act(async () => {
        try {
          await result.current.createTrainingJob(jobData)
          fail('Should have thrown an error')
        } catch (error) {
          expect((error as Error).message).toBe('Creation failed')
        }
      })
    })
  })

  describe('uploadImages', () => {
    it('should upload images successfully', async () => {
      const mockResponse = {
        success: true,
        uploadedImages: [
          {
            id: 'img-1',
            training_job_id: 'test-job-1',
            file_name: 'test1.jpg',
            file_path: '/path/to/test1.jpg',
            caption: 'Test image 1',
            file_size: 1024000,
            created_at: '2024-01-01T00:00:00Z',
          },
        ],
      }

      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, trainingJobs: [mockTrainingJobWithImages] }),
        })

      const { result } = renderHook(() => useTrainingJobs())

      const files = [new File(['test'], 'test1.jpg', { type: 'image/jpeg' })]
      const captions = ['Test image 1']

      let uploadResult: any
      await act(async () => {
        uploadResult = await result.current.uploadImages('test-job-1', files, captions)
      })
      
      expect(uploadResult).toEqual(mockResponse)

      expect(global.fetch).toHaveBeenCalledWith('/api/training/upload', {
        method: 'POST',
        body: expect.any(FormData),
      })
    })

    it('should handle upload error', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: false, error: 'Upload failed' }),
      })

      const { result } = renderHook(() => useTrainingJobs())

      const files = [new File(['test'], 'test1.jpg', { type: 'image/jpeg' })]
      const captions = ['Test image 1']

      await act(async () => {
        try {
          await result.current.uploadImages('test-job-1', files, captions)
          fail('Should have thrown an error')
        } catch (error) {
          expect((error as Error).message).toBe('Upload failed')
        }
      })
    })
  })

  describe('createZip', () => {
    it('should create zip file successfully', async () => {
      const mockResponse = {
        success: true,
        zipUrl: 'https://example.com/training.zip',
      }

      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, trainingJobs: [mockTrainingJob] }),
        })

      const { result } = renderHook(() => useTrainingJobs())

      let zipResult: any
      await act(async () => {
        zipResult = await result.current.createZip('test-job-1')
      })
      
      expect(zipResult).toEqual(mockResponse)

      expect(global.fetch).toHaveBeenCalledWith('/api/training/create-zip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ trainingJobId: 'test-job-1' }),
      })
    })

    it('should handle create zip error', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: false, error: 'ZIP creation failed' }),
      })

      const { result } = renderHook(() => useTrainingJobs())

      await act(async () => {
        try {
          await result.current.createZip('test-job-1')
          fail('Should have thrown an error')
        } catch (error) {
          expect((error as Error).message).toBe('ZIP creation failed')
        }
      })
    })
  })

  describe('submitTraining', () => {
    it('should submit training job successfully', async () => {
      const mockResponse = {
        success: true,
        request_id: 'fal-request-123',
      }

      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, trainingJobs: [mockTrainingJob] }),
        })

      const { result } = renderHook(() => useTrainingJobs())

      let submitResult: any
      await act(async () => {
        submitResult = await result.current.submitTraining('test-job-1')
      })
      
      expect(submitResult).toEqual(mockResponse)

      expect(global.fetch).toHaveBeenCalledWith('/api/training/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ trainingJobId: 'test-job-1' }),
      })
    })

    it('should handle submit error', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: false, error: 'Submit failed' }),
      })

      const { result } = renderHook(() => useTrainingJobs())

      await act(async () => {
        try {
          await result.current.submitTraining('test-job-1')
          fail('Should have thrown an error')
        } catch (error) {
          expect((error as Error).message).toBe('Submit failed')
        }
      })
    })
  })

  describe('Real-time subscriptions', () => {
    it('should set up real-time subscription', async () => {
      const { supabase } = await import('@/lib/supabase')
      const mockSupabase = supabase as any

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, trainingJobs: [] }),
      })

      const { result, unmount } = renderHook(() => useTrainingJobs())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(mockSupabase.channel).toHaveBeenCalledWith('training_jobs_changes')
      
      // Clean up
      unmount()
    })
  })

  describe('Error handling', () => {
    it('should handle network errors', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() => useTrainingJobs())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
        expect(result.current.error).toBe('Failed to fetch training jobs')
      })
    })

    it('should handle HTTP errors', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      })

      const { result } = renderHook(() => useTrainingJobs())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
        expect(result.current.error).toBe('Failed to fetch training jobs')
      })
    })
  })
}) 