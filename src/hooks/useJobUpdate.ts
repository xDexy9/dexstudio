/**
 * Custom hook for safe job updates with conflict detection
 *
 * Provides a simple interface for updating jobs with automatic
 * version conflict detection and error handling.
 */

import { useState } from 'react';
import { Job, JobStatus } from '@/lib/types';
import {
  updateJobSafely,
  updateJobStatus,
  assignJobToMechanic,
  JobVersionConflictError,
  InvalidJobTransitionError
} from '@/services/jobUpdateService';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

export interface UseJobUpdateResult {
  isUpdating: boolean;
  error: string | null;
  updateJob: (jobId: string, updates: Partial<Job>, currentVersion: number, userId: string) => Promise<Job | null>;
  updateStatus: (jobId: string, newStatus: JobStatus, currentVersion: number, userId: string) => Promise<Job | null>;
  assignMechanic: (jobId: string, mechanicId: string, currentVersion: number, userId: string) => Promise<Job | null>;
  clearError: () => void;
}

/**
 * Hook for safely updating jobs with conflict detection
 *
 * Usage:
 * ```tsx
 * const { updateJob, isUpdating, error } = useJobUpdate();
 *
 * const handleUpdate = async () => {
 *   const result = await updateJob(job.id, { status: 'in_progress' }, job.version, user.id);
 *   if (result) {
 *     // Update was successful, result contains updated job
 *     setJob(result);
 *   }
 * };
 * ```
 */
export function useJobUpdate(): UseJobUpdateResult {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useLanguage();

  const handleError = (err: unknown): null => {
    if (err instanceof JobVersionConflictError) {
      const message = t('notif.jobUpdatedByOther');
      setError(message);
      toast.error(message, {
        description: t('notif.autoReloadIn3s'),
        duration: 3000,
      });

      // Auto-reload after 3 seconds
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    } else if (err instanceof InvalidJobTransitionError) {
      const message = err.message;
      setError(message);
      toast.error(t('notif.invalidStatusChange'), {
        description: message,
        duration: 5000,
      });
    } else if (err instanceof Error) {
      const message = err.message || t('notif.failedToUpdateJob');
      setError(message);
      toast.error(t('notif.updateFailed'), {
        description: message,
        duration: 5000,
      });
    } else {
      setError(t('notif.unexpectedError'));
      toast.error(t('notif.updateFailed'), {
        description: t('notif.unexpectedError'),
        duration: 5000,
      });
    }

    return null;
  };

  const updateJob = async (
    jobId: string,
    updates: Partial<Job>,
    currentVersion: number,
    userId: string
  ): Promise<Job | null> => {
    setIsUpdating(true);
    setError(null);

    try {
      const result = await updateJobSafely(jobId, updates, currentVersion, userId);
      toast.success(t('notif.jobUpdatedSuccess'));
      return result;
    } catch (err) {
      return handleError(err);
    } finally {
      setIsUpdating(false);
    }
  };

  const updateStatus = async (
    jobId: string,
    newStatus: JobStatus,
    currentVersion: number,
    userId: string
  ): Promise<Job | null> => {
    setIsUpdating(true);
    setError(null);

    try {
      const result = await updateJobStatus(jobId, newStatus, currentVersion, userId);
      toast.success(t('notif.statusChangedTo', { status: newStatus }));
      return result;
    } catch (err) {
      return handleError(err);
    } finally {
      setIsUpdating(false);
    }
  };

  const assignMechanic = async (
    jobId: string,
    mechanicId: string,
    currentVersion: number,
    userId: string
  ): Promise<Job | null> => {
    setIsUpdating(true);
    setError(null);

    try {
      const result = await assignJobToMechanic(jobId, mechanicId, currentVersion, userId);
      toast.success(t('notif.jobAssignedSuccess'));
      return result;
    } catch (err) {
      return handleError(err);
    } finally {
      setIsUpdating(false);
    }
  };

  const clearError = () => setError(null);

  return {
    isUpdating,
    error,
    updateJob,
    updateStatus,
    assignMechanic,
    clearError
  };
}
