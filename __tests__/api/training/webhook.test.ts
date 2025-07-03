import { NextRequest } from 'next/server'

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn()
  },
}))

import { POST } from '@/app/api/training/webhook/route'
import { supabaseAdmin } from '@/lib/supabase'

// Get the mocked instance
const mockSupabaseAdmin = supabaseAdmin as any

describe('/api/training/webhook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/training/webhook', () => {
    it('should handle completed training webhook', async () => {
      const webhookPayload = {
        request_id: 'fal-request-123',
        status: 'COMPLETED',
        output: {
          lora_url: 'https://example.com/lora.safetensors',
          config_url: 'https://example.com/config.json',
          debug_url: 'https://example.com/debug.zip',
        },
      }

      // Mock training job lookup and update
      mockSupabaseAdmin.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 'training-job-1', name: 'Test Job' },
              error: null,
            })
          })
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: null,
            error: null,
          })
        })
      })

      const request = new NextRequest('http://localhost:3000/api/training/webhook', {
        method: 'POST',
        body: JSON.stringify(webhookPayload),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('Webhook processed successfully')
    })

    it('should handle failed training webhook', async () => {
      const webhookPayload = {
        request_id: 'fal-request-123',
        status: 'FAILED',
        error: {
          message: 'Training failed due to insufficient data',
        },
      }

      mockSupabaseAdmin.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 'training-job-1', name: 'Test Job' },
              error: null,
            })
          })
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: null,
            error: null,
          })
        })
      })

      const request = new NextRequest('http://localhost:3000/api/training/webhook', {
        method: 'POST',
        body: JSON.stringify(webhookPayload),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('Webhook processed successfully')
    })

    it('should handle missing request_id', async () => {
      const webhookPayload = {
        status: 'COMPLETED',
        output: {},
      }

      const request = new NextRequest('http://localhost:3000/api/training/webhook', {
        method: 'POST',
        body: JSON.stringify(webhookPayload),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Missing request_id in webhook payload')
    })

    it('should handle non-existent training job', async () => {
      const webhookPayload = {
        request_id: 'non-existent-request',
        status: 'COMPLETED',
        output: {},
      }

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

      const request = new NextRequest('http://localhost:3000/api/training/webhook', {
        method: 'POST',
        body: JSON.stringify(webhookPayload),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Training job not found for request_id: non-existent-request')
    })

    it('should handle unexpected errors', async () => {
      const webhookPayload = {
        request_id: 'fal-request-123',
        status: 'COMPLETED',
        output: {},
      }

      mockSupabaseAdmin.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockRejectedValue(new Error('Database error'))
          })
        })
      })

      const request = new NextRequest('http://localhost:3000/api/training/webhook', {
        method: 'POST',
        body: JSON.stringify(webhookPayload),
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