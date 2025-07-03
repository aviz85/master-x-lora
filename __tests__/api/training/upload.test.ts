import { NextRequest } from 'next/server'

// Mock Supabase with simplified structure
jest.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn(),
    storage: {
      from: jest.fn()
    }
  },
}))

import { POST } from '@/app/api/training/upload/route'
import { supabaseAdmin } from '@/lib/supabase'

// Get the mocked instance
const mockSupabaseAdmin = supabaseAdmin as any

// Mock crypto for UUID generation
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: jest.fn(() => 'mock-uuid-1234'),
  },
})

describe('/api/training/upload', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/training/upload', () => {
    it('should upload images successfully', async () => {
      const mockTrainingJob = {
        id: 'training-job-1',
        name: 'Test Job',
        status: 'pending',
        images_count: 0,
      }

      const mockUploadedImages = [
        {
          id: 'img-1',
          training_job_id: 'training-job-1',
          file_name: 'test1.jpg',
          file_path: 'training-images/training-job-1/mock-uuid-1234-test1.jpg',
          caption: 'Test image 1',
          file_size: 1024000,
          created_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'img-2',
          training_job_id: 'training-job-1',
          file_name: 'test2.jpg',
          file_path: 'training-images/training-job-1/mock-uuid-1234-test2.jpg',
          caption: 'Test image 2',
          file_size: 2048000,
          created_at: '2024-01-01T00:00:00Z',
        },
      ]

      // Mock training job exists
      mockSupabaseAdmin.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockTrainingJob,
              error: null,
            })
          })
        }),
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue({
            data: mockUploadedImages,
            error: null,
          })
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: null,
            error: null,
          })
        })
      })

      // Mock successful file uploads
      mockSupabaseAdmin.storage.from.mockReturnValue({
        upload: jest.fn().mockResolvedValue({
          data: { path: 'mock-path' },
          error: null,
        })
      })

      const formData = new FormData()
      formData.append('trainingJobId', 'training-job-1')
      formData.append('images', new File(['test content 1'], 'test1.jpg', { type: 'image/jpeg' }))
      formData.append('images', new File(['test content 2'], 'test2.jpg', { type: 'image/jpeg' }))
      formData.append('captions', 'Test image 1')
      formData.append('captions', 'Test image 2')

      const request = new NextRequest('http://localhost:3000/api/training/upload', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.uploadedImages).toEqual(mockUploadedImages)
      expect(data.message).toBe('Images uploaded successfully')
    })

    it('should handle missing training job ID', async () => {
      const formData = new FormData()
      formData.append('images', new File(['test'], 'test.jpg', { type: 'image/jpeg' }))

      const request = new NextRequest('http://localhost:3000/api/training/upload', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Training job ID is required')
    })

    it('should handle no images uploaded', async () => {
      const formData = new FormData()
      formData.append('trainingJobId', 'training-job-1')

      const request = new NextRequest('http://localhost:3000/api/training/upload', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('No images provided')
    })

    it('should handle non-existent training job', async () => {
      mockSupabaseAdmin.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'No rows returned' },
            })
          })
        })
      })

      const formData = new FormData()
      formData.append('trainingJobId', 'non-existent-job')
      formData.append('images', new File(['test'], 'test.jpg', { type: 'image/jpeg' }))

      const request = new NextRequest('http://localhost:3000/api/training/upload', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Training job not found')
    })

    it('should validate file types', async () => {
      const mockTrainingJob = {
        id: 'training-job-1',
        name: 'Test Job',
        status: 'pending',
        images_count: 0,
      }

      mockSupabaseAdmin.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockTrainingJob,
              error: null,
            })
          })
        })
      })

      const formData = new FormData()
      formData.append('trainingJobId', 'training-job-1')
      formData.append('images', new File(['test'], 'test.txt', { type: 'text/plain' }))

      const request = new NextRequest('http://localhost:3000/api/training/upload', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Only image files are allowed')
    })

    it('should validate file size limits', async () => {
      const mockTrainingJob = {
        id: 'training-job-1',
        name: 'Test Job',
        status: 'pending',
        images_count: 0,
      }

      mockSupabaseAdmin.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockTrainingJob,
              error: null,
            })
          })
        })
      })

      // Create a large file (11MB)
      const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' })

      const formData = new FormData()
      formData.append('trainingJobId', 'training-job-1')
      formData.append('images', largeFile)

      const request = new NextRequest('http://localhost:3000/api/training/upload', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('File size must be less than 10MB')
    })

    it('should handle storage upload errors', async () => {
      const mockTrainingJob = {
        id: 'training-job-1',
        name: 'Test Job',
        status: 'pending',
        images_count: 0,
      }

      mockSupabaseAdmin.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockTrainingJob,
              error: null,
            })
          })
        })
      })

      // Mock storage upload failure
      mockSupabaseAdmin.storage.from.mockReturnValue({
        upload: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Storage upload failed' },
        })
      })

      const formData = new FormData()
      formData.append('trainingJobId', 'training-job-1')
      formData.append('images', new File(['test'], 'test.jpg', { type: 'image/jpeg' }))
      formData.append('captions', 'Test image')

      const request = new NextRequest('http://localhost:3000/api/training/upload', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Failed to upload images')
    })

    it('should handle database insertion errors', async () => {
      const mockTrainingJob = {
        id: 'training-job-1',
        name: 'Test Job',
        status: 'pending',
        images_count: 0,
      }

      mockSupabaseAdmin.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockTrainingJob,
              error: null,
            })
          })
        }),
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database insertion failed' },
          })
        })
      })

      // Mock successful upload
      mockSupabaseAdmin.storage.from.mockReturnValue({
        upload: jest.fn().mockResolvedValue({
          data: { path: 'mock-path' },
          error: null,
        })
      })

      const formData = new FormData()
      formData.append('trainingJobId', 'training-job-1')
      formData.append('images', new File(['test'], 'test.jpg', { type: 'image/jpeg' }))
      formData.append('captions', 'Test image')

      const request = new NextRequest('http://localhost:3000/api/training/upload', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Failed to upload images')
    })

    it('should handle caption count mismatch', async () => {
      const mockTrainingJob = {
        id: 'training-job-1',
        name: 'Test Job',
        status: 'pending',
        images_count: 0,
      }

      mockSupabaseAdmin.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockTrainingJob,
              error: null,
            })
          })
        })
      })

      const formData = new FormData()
      formData.append('trainingJobId', 'training-job-1')
      formData.append('images', new File(['test1'], 'test1.jpg', { type: 'image/jpeg' }))
      formData.append('images', new File(['test2'], 'test2.jpg', { type: 'image/jpeg' }))
      formData.append('captions', 'Caption 1')
      // Missing caption for second image

      const request = new NextRequest('http://localhost:3000/api/training/upload', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Number of captions must match number of images')
    })

    it('should handle unexpected errors', async () => {
      mockSupabaseAdmin.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockRejectedValue(new Error('Unexpected error'))
          })
        })
      })

      const formData = new FormData()
      formData.append('trainingJobId', 'training-job-1')
      formData.append('images', new File(['test'], 'test.jpg', { type: 'image/jpeg' }))

      const request = new NextRequest('http://localhost:3000/api/training/upload', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Internal server error')
    })
  })
})