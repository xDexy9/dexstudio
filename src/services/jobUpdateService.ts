import { store, persistStore } from '@/lib/mockStore';
import { Job, JobStatus } from '@/lib/types';
import { logJobActivity } from './jobActivityService';
import { createAuditLog, generateAuditSummary } from './auditService';
import { getUserById } from './firestoreService';

const now = () => new Date().toISOString();

export async function safeUpdateJobStatus(
  jobId: string, newStatus: JobStatus, userId: string
): Promise<{ success: boolean; error?: string }> {
  const idx = store.jobs.findIndex(j => j.id === jobId);
  if (idx === -1) return { success: false, error: 'Job not found' };
  const oldJob = store.jobs[idx];
  store.jobs[idx] = {
    ...oldJob, status: newStatus, updatedAt: now(), version: (oldJob.version || 0) + 1,
    ...(newStatus === 'completed' ? { completedAt: now() } : {}),
  };
  persistStore();
  await logJobActivity(jobId, userId, 'status_changed', { oldValue: oldJob.status, newValue: newStatus });
  const user = await getUserById(userId);
  const summary = generateAuditSummary('status_changed', user?.fullName || 'Unknown', 'status', oldJob.status, newStatus);
  await createAuditLog(jobId, userId, 'status_changed', summary, { fieldChanged: 'status', oldValue: oldJob.status, newValue: newStatus });
  return { success: true };
}

export async function safeUpdateJob(
  jobId: string, updates: Partial<Job>, userId: string
): Promise<{ success: boolean; error?: string }> {
  const idx = store.jobs.findIndex(j => j.id === jobId);
  if (idx === -1) return { success: false, error: 'Job not found' };
  const oldJob = store.jobs[idx];
  store.jobs[idx] = { ...oldJob, ...updates, updatedAt: now(), version: (oldJob.version || 0) + 1 };
  persistStore();
  return { success: true };
}

export async function safeAssignMechanic(
  jobId: string, mechanicId: string | null, userId: string
): Promise<{ success: boolean; error?: string }> {
  const idx = store.jobs.findIndex(j => j.id === jobId);
  if (idx === -1) return { success: false, error: 'Job not found' };
  const oldJob = store.jobs[idx];
  store.jobs[idx] = {
    ...oldJob,
    assignedMechanicId: mechanicId || undefined,
    assignedAt: mechanicId ? now() : undefined,
    updatedAt: now(),
    version: (oldJob.version || 0) + 1,
  };
  persistStore();
  if (mechanicId) {
    await logJobActivity(jobId, userId, 'assigned', { newValue: mechanicId });
    const user = await getUserById(userId);
    const summary = generateAuditSummary('assigned', user?.fullName || 'Unknown', 'mechanicId', undefined, mechanicId);
    await createAuditLog(jobId, userId, 'assigned', summary, { fieldChanged: 'mechanicId', newValue: mechanicId });
  }
  return { success: true };
}
