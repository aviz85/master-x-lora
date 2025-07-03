'use client';

import { useState } from 'react';
import { useWebhookQueue } from '@/hooks/useWebhookQueue';
import Link from 'next/link';

export default function WebhookPage() {
  const [prompt, setPrompt] = useState('');
  const [imageSize, setImageSize] = useState<string>('landscape_4_3');
  
  const {
    isGenerating,
    currentRequestId,
    result,
    error,
    submitWithWebhook,
    cancelRequest,
  } = useWebhookQueue();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!prompt.trim()) {
      return;
    }

    await submitWithWebhook(prompt, imageSize);
  };

  const handleCancel = () => {
    cancelRequest();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-500 via-teal-500 to-blue-700 flex items-center justify-center p-5">
      <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-2xl w-full">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-3">
            FLUX.1 Webhook Generator
          </h1>
          <p className="text-gray-600 text-lg mb-4">
            Create images using webhook-based queue system
          </p>
          <div className="flex gap-4 justify-center">
            <Link 
              href="/"
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
            >
              ← Polling Version
            </Link>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="prompt" className="block text-sm font-semibold text-gray-700 mb-2">
              Image Description
            </label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the image you want to generate... (e.g., A beautiful sunset over mountains with vibrant colors)"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none transition-colors resize-none"
              rows={4}
              required
            />
          </div>

          <div>
            <label htmlFor="imageSize" className="block text-sm font-semibold text-gray-700 mb-2">
              Image Size
            </label>
            <select
              id="imageSize"
              value={imageSize}
              onChange={(e) => setImageSize(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none transition-colors bg-white"
            >
              <option value="square_hd">Square HD (1024x1024)</option>
              <option value="square">Square (512x512)</option>
              <option value="portrait_4_3">Portrait 4:3</option>
              <option value="portrait_16_9">Portrait 16:9</option>
              <option value="landscape_4_3">Landscape 4:3</option>
              <option value="landscape_16_9">Landscape 16:9</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isGenerating}
            className="w-full bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isGenerating ? 'Waiting for Webhook...' : 'Generate with Webhook'}
          </button>
        </form>

        {isGenerating && (
          <div className="mt-8 text-center">
            <div className="inline-block animate-pulse rounded-full h-8 w-8 bg-green-500 mb-4"></div>
            <p className="text-gray-600 mb-4">
              Request submitted! Waiting for webhook notification...
            </p>
            
            {currentRequestId && (
              <div className="mb-4 p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-green-700">
                  <strong>Request ID:</strong> {currentRequestId}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  The result will be delivered via webhook when ready
                </p>
              </div>
            )}
            
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
            >
              Cancel Request
            </button>
          </div>
        )}

        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {result && result.images && result.images.length > 0 && (
          <div className="mt-8 text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={result.images[0].url}
              alt="Generated image"
              className="max-w-full h-auto rounded-2xl shadow-lg mb-4"
            />
            <a
              href={result.images[0].url}
              download="generated-image.png"
              className="inline-block bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
            >
              Download Image
            </a>
          </div>
        )}

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">How Webhooks Work:</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Request is submitted to FAL AI queue with webhook URL</li>
            <li>• You get immediate confirmation with request ID</li>
            <li>• FAL AI processes the request asynchronously</li>
            <li>• When complete, FAL AI sends result to your webhook endpoint</li>
            <li>• No need for continuous polling - more efficient!</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 