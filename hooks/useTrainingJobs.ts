import { useState, useEffect, useCallback } from 'react';
import { supabase, TrainingJob } from '@/lib/supabase';

export function useTrainingJobs() {
  const [trainingJobs, setTrainingJobs] = useState<TrainingJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch training jobs
  const fetchTrainingJobs = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/training/create');
      const data = await response.json();

      if (data.success) {
        setTrainingJobs(data.trainingJobs);
        setError(null);
      } else {
        setError('Failed to fetch training jobs');
      }
    } catch (err) {
      console.error('Error fetching training jobs:', err);
      setError('Failed to fetch training jobs');
    } finally {
      setLoading(false);
    }
  }, []);

  // Create new training job
  const createTrainingJob = useCallback(async (jobData: {
    name: string;
    trigger_word?: string;
    steps?: number;
    is_style?: boolean;
    create_masks?: boolean;
  }) => {
    try {
      const response = await fetch('/api/training/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jobData),
      });

      const data = await response.json();

      if (data.success) {
        // Refresh the list
        fetchTrainingJobs();
        return data.trainingJob;
      } else {
        throw new Error(data.error || 'Failed to create training job');
      }
    } catch (err) {
      console.error('Error creating training job:', err);
      throw err;
    }
  }, [fetchTrainingJobs]);

  // Upload images for a training job
  const uploadImages = useCallback(async (
    trainingJobId: string,
    files: File[],
    captions: string[] = []
  ) => {
    try {
      const formData = new FormData();
      formData.append('trainingJobId', trainingJobId);
      
      files.forEach((file) => {
        formData.append('images', file);
      });
      
      captions.forEach((caption) => {
        formData.append('captions', caption);
      });

      const response = await fetch('/api/training/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        // Refresh the list to show updated image count
        fetchTrainingJobs();
        return data;
      } else {
        throw new Error(data.error || 'Failed to upload images');
      }
    } catch (err) {
      console.error('Error uploading images:', err);
      throw err;
    }
  }, [fetchTrainingJobs]);

  // Create ZIP file for training job
  const createZip = useCallback(async (trainingJobId: string) => {
    try {
      const response = await fetch('/api/training/create-zip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ trainingJobId }),
      });

      const data = await response.json();

      if (data.success) {
        // Refresh the list to show ZIP URL
        fetchTrainingJobs();
        return data;
      } else {
        throw new Error(data.error || 'Failed to create ZIP');
      }
    } catch (err) {
      console.error('Error creating ZIP:', err);
      throw err;
    }
  }, [fetchTrainingJobs]);

  // Submit training job to FAL AI
  const submitTraining = useCallback(async (trainingJobId: string) => {
    try {
      const response = await fetch('/api/training/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ trainingJobId }),
      });

      const data = await response.json();

      if (data.success) {
        // Refresh the list to show updated status
        fetchTrainingJobs();
        return data;
      } else {
        throw new Error(data.error || 'Failed to submit training');
      }
    } catch (err) {
      console.error('Error submitting training:', err);
      throw err;
    }
  }, [fetchTrainingJobs]);

  // Set up real-time subscription
  useEffect(() => {
    fetchTrainingJobs();

    // Subscribe to training_jobs changes
    const subscription = supabase
      .channel('training_jobs_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'training_jobs'
        },
        (payload) => {
          console.log('Training job change received:', payload);
          
          if (payload.eventType === 'INSERT') {
            const newJob = payload.new as TrainingJob;
            setTrainingJobs(prev => [newJob, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            const updatedJob = payload.new as TrainingJob;
            setTrainingJobs(prev => 
              prev.map(job => job.id === updatedJob.id ? updatedJob : job)
            );
          } else if (payload.eventType === 'DELETE') {
            const deletedJob = payload.old as TrainingJob;
            setTrainingJobs(prev => 
              prev.filter(job => job.id !== deletedJob.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchTrainingJobs]);

  return {
    trainingJobs,
    loading,
    error,
    createTrainingJob,
    uploadImages,
    createZip,
    submitTraining,
    refreshJobs: fetchTrainingJobs
  };
} 