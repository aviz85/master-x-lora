'use client';

import { useState } from 'react';
import { useQueuePolling } from '@/hooks/useQueuePolling';

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [imageSize, setImageSize] = useState<string>('landscape_4_3');
  
  const {
    isGenerating,
    queueStatus,
    result,
    error,
    logs,
    submitToQueue,
    cancelRequest,
  } = useQueuePolling();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!prompt.trim()) {
      return;
    }

    await submitToQueue(prompt, imageSize);
  };

  const handleCancel = () => {
    if (queueStatus?.request_id) {
      cancelRequest(queueStatus.request_id);
    }
  };

  const getStatusMessage = () => {
    if (!queueStatus) return '';
    
    switch (queueStatus.status) {
      case 'IN_QUEUE':
        return `In queue (position: ${queueStatus.queue_position || 0})`;
      case 'IN_PROGRESS':
        return 'Generating your image...';
      case 'COMPLETED':
        return 'Image generated successfully!';
      case 'FAILED':
        return 'Generation failed';
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-purple-700 flex items-center justify-center p-5">
      <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-2xl w-full">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
            FLUX.1 Image Generator
          </h1>
          <p className="text-gray-600 text-lg">
            Create stunning images with AI-powered text-to-image generation
          </p>
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
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors resize-none"
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
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors bg-white"
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
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isGenerating ? 'Generating...' : 'Generate Image'}
          </button>
        </form>

        {isGenerating && (
          <div className="mt-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-600 mb-4">{getStatusMessage()}</p>
            
            {queueStatus && queueStatus.status === 'IN_QUEUE' && (
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
              >
                Cancel Request
              </button>
            )}
            
            {logs.length > 0 && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg text-left max-h-32 overflow-y-auto">
                <h4 className="font-semibold text-gray-700 mb-2">Generation Logs:</h4>
                {logs.map((log, index) => (
                  <div key={index} className="text-sm text-gray-600 mb-1">
                    <span className="font-mono text-xs text-gray-500">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    {' '}
                    <span className={`font-semibold ${
                      log.level === 'ERROR' ? 'text-red-600' : 
                      log.level === 'WARN' ? 'text-yellow-600' : 
                      'text-blue-600'
                    }`}>
                      [{log.level}]
                    </span>
                    {' '}
                    {log.message}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {result && result.images && result.images.length > 0 && (
          <div className="mt-8 text-center">
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
      </div>
    </div>
  );
}
