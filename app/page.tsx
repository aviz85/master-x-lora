'use client';

import { useState } from 'react';
import { fal } from '@fal-ai/client';

// Configure the client to use our proxy
fal.config({
  proxyUrl: '/api/fal/proxy',
});

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [imageSize, setImageSize] = useState<string>('landscape_4_3');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!prompt.trim()) {
      setError('Please enter a description for your image.');
      return;
    }

    setError(null);
    setGeneratedImage(null);
    setIsGenerating(true);

    try {
              const result = await fal.subscribe('fal-ai/flux/schnell', {
          input: {
            prompt: prompt.trim(),
            image_size: imageSize as any,
            num_inference_steps: 4,
            num_images: 1,
            enable_safety_checker: true
          },
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === 'IN_PROGRESS') {
            console.log('Generation in progress...');
          }
        },
      });

      if (result.data.images && result.data.images.length > 0) {
        setGeneratedImage(result.data.images[0].url);
      } else {
        throw new Error('No image was generated');
      }
    } catch (err) {
      console.error('Error generating image:', err);
      setError('Failed to generate image. Please try again.');
    } finally {
      setIsGenerating(false);
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
            <p className="text-gray-600">Generating your image... This may take a few moments.</p>
          </div>
        )}

        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {generatedImage && (
          <div className="mt-8 text-center">
            <img
              src={generatedImage}
              alt="Generated image"
              className="max-w-full h-auto rounded-2xl shadow-lg mb-4"
            />
            <a
              href={generatedImage}
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
