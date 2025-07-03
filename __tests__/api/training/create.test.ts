import { NextRequest } from 'next/server'

// Mock the route handlers before importing them
jest.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn()
  },
}))

import { GET, POST } from '@/app/api/training/create/route'

describe('/api/training/create', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/training/create', () => {
    it('should fetch training jobs successfully', async () => {
      const mockTrainingJobs = [
        {
          id: 'job-1',
          name: 'Test Job 1',
          status: 'pending',
          steps: 1000,
          is_style: false,
          create_masks: true,
          images_count: 5,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          training_images: [
            {
              id: 'img-1',
              training_job_id: 'job-1',
              file_name: 'test1.jpg',
              file_path: '/path/to/test1.jpg',
              caption: 'Test image 1',
              file_size: 1024000,
              created_at: '2024-01-01T00:00:00Z',
            },
          ],
        },
      ]

      mockSupabaseAdmin.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: mockTrainingJobs,
            error: null,
          })
        })
      })

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.trainingJobs).toEqual(mockTrainingJobs)
      expect(mockSupabaseAdmin.from).toHaveBeenCalledWith('training_jobs')
    })

    it('should handle database error when fetching jobs', async () => {
      const mockError = { message: 'Database connection failed' }

      mockSupabaseAdmin.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: null,
            error: mockError,
          })
        })
      })

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch training jobs')
    })

    it('should handle unexpected errors', async () => {
      mockSupabaseAdmin.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockRejectedValue(new Error('Unexpected error'))
        })
      })

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })
  })

  describe('POST /api/training/create', () => {
    it('should create a new training job successfully', async () => {
      const newJob = {
        id: 'new-job-id',
        name: 'New Test Job',
        status: 'pending',
        trigger_word: 'newtest',
        steps: 1500,
        is_style: true,
        create_masks: false,
        images_count: 0,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      mockSupabaseAdmin.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: newJob,
              error: null,
            })
          })
        })
      })

      const requestBody = {
        name: 'New Test Job',
        trigger_word: 'newtest',
        steps: 1500,
        is_style: true,
        create_masks: false,
      }

      const request = new NextRequest('http://localhost:3000/api/training/create', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.trainingJob).toEqual(newJob)
      expect(mockSupabaseAdmin.from).toHaveBeenCalledWith('training_jobs')
    })

    it('should handle missing required fields', async () => {
      const requestBody = {
        // Missing name field
        trigger_word: 'test',
        steps: 1000,
      }

      const request = new NextRequest('http://localhost:3000/api/training/create', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Training job name is required')
    })

    it('should handle invalid JSON in request body', async () => {
      const request = new NextRequest('http://localhost:3000/api/training/create', {
        method: 'POST',
        body: 'invalid json',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })

    it('should handle database error when creating job', async () => {
      const mockError = { message: 'Unique constraint violation' }

      mockSupabaseAdmin.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: mockError,
            })
          })
        })
      })

      const requestBody = {
        name: 'Test Job',
        trigger_word: 'test',
        steps: 1000,
        is_style: false,
        create_masks: true,
      }

      const request = new NextRequest('http://localhost:3000/api/training/create', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to create training job')
    })

    it('should use default values for optional fields', async () => {
      const newJob = {
        id: 'new-job-id',
        name: 'Minimal Job',
        status: 'pending',
        trigger_word: null,
        steps: 1000,
        is_style: false,
        create_masks: true,
        images_count: 0,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      mockSupabaseAdmin.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: newJob,
              error: null,
            })
          })
        })
      })

      const requestBody = {
        name: 'Minimal Job',
        // No optional fields provided
      }

      const request = new NextRequest('http://localhost:3000/api/training/create', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.trainingJob).toEqual(newJob)
    })

    it('should validate steps range', async () => {
      const requestBody = {
        name: 'Test Job',
        steps: 50, // Below minimum
      }

      const request = new NextRequest('http://localhost:3000/api/training/create', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Steps must be between 100 and 5000')
    })

    it('should validate maximum steps', async () => {
      const requestBody = {
        name: 'Test Job',
        steps: 6000, // Above maximum
      }

      const request = new NextRequest('http://localhost:3000/api/training/create', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Steps must be between 100 and 5000')
    })

    it('should handle network errors', async () => {
      mockSupabaseAdmin.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockRejectedValue(new Error('Network error'))
          })
        })
      })

      const requestBody = {
        name: 'Test Job',
        trigger_word: 'test',
        steps: 1000,
      }

      const request = new NextRequest('http://localhost:3000/api/training/create', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })
  })
})