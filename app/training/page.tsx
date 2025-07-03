'use client';

import { useState } from 'react';
import { useTrainingJobs } from '@/hooks/useTrainingJobs';
import Link from 'next/link';

interface ImageWithCaption {
  file: File;
  caption: string;
}

export default function TrainingPage() {
  const {
    trainingJobs,
    loading,
    error,
    createTrainingJob,
    uploadImages,
    createZip,
    submitTraining
  } = useTrainingJobs();

  // Form state for new training job
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    trigger_word: '',
    steps: 1000,
    is_style: false,
    create_masks: true
  });

  // Image upload state
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [uploadImages_state, setUploadImages_state] = useState<ImageWithCaption[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createTrainingJob(formData);
      setFormData({
        name: '',
        trigger_word: '',
        steps: 1000,
        is_style: false,
        create_masks: true
      });
      setShowCreateForm(false);
    } catch (err) {
      console.error('Failed to create training job:', err);
      alert('Failed to create training job');
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newImages = files.map(file => ({ file, caption: '' }));
    setUploadImages_state(prev => [...prev, ...newImages]);
  };

  const updateCaption = (index: number, caption: string) => {
    setUploadImages_state(prev => 
      prev.map((img, i) => i === index ? { ...img, caption } : img)
    );
  };

  const removeImage = (index: number) => {
    setUploadImages_state(prev => prev.filter((_, i) => i !== index));
  };

  const handleUploadSubmit = async () => {
    if (!selectedJobId || uploadImages_state.length === 0) return;

    try {
      setIsUploading(true);
      const files = uploadImages_state.map(img => img.file);
      const captions = uploadImages_state.map(img => img.caption);
      
      await uploadImages(selectedJobId, files, captions);
      setUploadImages_state([]);
      setSelectedJobId(null);
    } catch (err) {
      console.error('Failed to upload images:', err);
      alert('Failed to upload images');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateZip = async (jobId: string) => {
    try {
      await createZip(jobId);
    } catch (err) {
      console.error('Failed to create ZIP:', err);
      alert('Failed to create ZIP');
    }
  };

  const handleSubmitTraining = async (jobId: string) => {
    try {
      await submitTraining(jobId);
    } catch (err) {
      console.error('Failed to submit training:', err);
      alert('Failed to submit training');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 flex items-center justify-center">
        <div className="text-white text-xl">Loading training jobs...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 p-5">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-white mb-3">
            FLUX.1 LoRA Training
          </h1>
          <p className="text-white/80 text-lg mb-4">
            Train custom LoRA models with your own images
          </p>
          <div className="flex gap-4 justify-center">
            <Link 
              href="/"
              className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
            >
              ← Back to Generator
            </Link>
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-6 py-2 bg-white text-purple-600 hover:bg-gray-100 rounded-lg transition-colors font-semibold"
            >
              + New Training Job
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-200 rounded-xl text-red-700">
            {error}
          </div>
        )}

        {/* Create Job Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
              <h2 className="text-2xl font-bold mb-6">Create Training Job</h2>
              
              <form onSubmit={handleCreateJob} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Job Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Trigger Word
                  </label>
                  <input
                    type="text"
                    value={formData.trigger_word}
                    onChange={(e) => setFormData(prev => ({ ...prev, trigger_word: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
                    placeholder="e.g., myface, mystyle"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Training Steps
                  </label>
                  <input
                    type="number"
                    min="100"
                    max="5000"
                    value={formData.steps}
                    onChange={(e) => setFormData(prev => ({ ...prev, steps: parseInt(e.target.value) }))}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.is_style}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_style: e.target.checked }))}
                      className="mr-2"
                    />
                    Style Training
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.create_masks}
                      onChange={(e) => setFormData(prev => ({ ...prev, create_masks: e.target.checked }))}
                      className="mr-2"
                    />
                    Create Masks
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1 py-3 px-4 bg-gray-200 hover:bg-gray-300 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 px-4 bg-purple-500 hover:bg-purple-600 text-white rounded-xl transition-colors"
                  >
                    Create Job
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Training Jobs List */}
        <div className="grid gap-6">
          {trainingJobs.map((job) => (
            <div key={job.id} className="bg-white rounded-2xl shadow-xl p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-800">{job.name}</h3>
                  <p className="text-gray-600">
                    {job.trigger_word && `Trigger: ${job.trigger_word} • `}
                    Steps: {job.steps} • Images: {job.images_count}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(job.status)}`}>
                  {job.status}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mb-4">
                {job.status === 'pending' && job.images_count === 0 && (
                  <button
                    onClick={() => setSelectedJobId(job.id)}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                  >
                    Upload Images
                  </button>
                )}

                {job.status === 'pending' && job.images_count > 0 && !job.zip_url && (
                  <button
                    onClick={() => handleCreateZip(job.id)}
                    className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
                  >
                    Create ZIP
                  </button>
                )}

                {job.status === 'pending' && job.zip_url && (
                  <button
                    onClick={() => handleSubmitTraining(job.id)}
                    className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                  >
                    Start Training
                  </button>
                )}

                {job.result_lora_url && (
                  <a
                    href={job.result_lora_url}
                    download
                    className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
                  >
                    Download LoRA
                  </a>
                )}
              </div>

              {/* Error Message */}
              {job.error_message && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {job.error_message}
                </div>
              )}

              {/* Training Progress */}
              {job.status === 'processing' && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
                    <span className="text-blue-700 text-sm">Training in progress...</span>
                  </div>
                  {job.fal_request_id && (
                    <p className="text-xs text-blue-600 mt-1">Request ID: {job.fal_request_id}</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Image Upload Modal */}
        {selectedJobId && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-6">Upload Training Images</h2>
              
              <div className="mb-6">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="w-full p-3 border-2 border-dashed border-gray-300 rounded-xl"
                />
                <p className="text-sm text-gray-600 mt-2">
                  Select multiple images (JPG, PNG). Minimum 4 images recommended.
                </p>
              </div>

              {/* Image Preview */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                {uploadImages_state.map((img, index) => (
                  <div key={index} className="relative border rounded-lg p-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={URL.createObjectURL(img.file)}
                      alt={img.file.name}
                      className="w-full h-32 object-cover rounded"
                    />
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm"
                    >
                      ×
                    </button>
                    <input
                      type="text"
                      placeholder="Caption (optional)"
                      value={img.caption}
                      onChange={(e) => updateCaption(index, e.target.value)}
                      className="w-full mt-2 p-2 border rounded text-sm"
                    />
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setSelectedJobId(null);
                    setUploadImages_state([]);
                  }}
                  className="flex-1 py-3 px-4 bg-gray-200 hover:bg-gray-300 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUploadSubmit}
                  disabled={uploadImages_state.length === 0 || isUploading}
                  className="flex-1 py-3 px-4 bg-purple-500 hover:bg-purple-600 text-white rounded-xl transition-colors disabled:opacity-50"
                >
                  {isUploading ? 'Uploading...' : `Upload ${uploadImages_state.length} Images`}
                </button>
              </div>
            </div>
          </div>
        )}

        {trainingJobs.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-white/80 text-lg mb-4">No training jobs yet</div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-6 py-3 bg-white text-purple-600 hover:bg-gray-100 rounded-lg transition-colors font-semibold"
            >
              Create Your First Training Job
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 