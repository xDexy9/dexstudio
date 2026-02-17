import { JobActivity, JobActivityType } from '@/lib/types';
import { store, genId, persistStore } from '@/lib/mockStore';
import { getUserById } from './firestoreService';

export async function logJobActivity(
  jobId: string,
  userId: string,
  type: JobActivityType,
  details?: { oldValue?: string; newValue?: string; description?: string; messageId?: string; partsData?: any }
): Promise<string> {
  const user = await getUserById(userId);
  const id = genId();
  store.activities.push({
    id, jobId, userId, type,
    userName: user?.fullName || 'Unknown User',
    timestamp: new Date().toISOString(),
    details: details || {},
  });
  persistStore();
  return id;
}

export async function getJobActivities(jobId: string): Promise<JobActivity[]> {
  return store.activities
    .filter(a => a.jobId === jobId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function subscribeToJobActivities(
  jobId: string,
  callback: (activities: JobActivity[]) => void
): () => void {
  const activities = store.activities
    .filter(a => a.jobId === jobId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  callback(activities);
  return () => {};
}

export async function getRecentActivities(limit: number = 20): Promise<JobActivity[]> {
  return [...store.activities]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);
}

export function getActivityDescription(activity: JobActivity): string {
  const { type, details, userName } = activity;
  const name = userName || 'Unknown User';
  switch (type) {
    case 'created': return `${name} created this job`;
    case 'assigned': return details?.newValue ? `${name} assigned to ${details.newValue}` : `${name} assigned this job`;
    case 'status_changed':
      return details?.oldValue && details?.newValue
        ? `${name} changed status from ${details.oldValue} to ${details.newValue}`
        : `${name} updated job status`;
    case 'message_sent': return details?.description ? `${name}: ${details.description}` : `${name} sent a message`;
    case 'parts_ordered': return details?.description ? `${name} ordered parts: ${details.description}` : `${name} ordered parts`;
    case 'parts_received': return `${name} received parts`;
    case 'completed': return `${name} marked job as completed`;
    case 'note_added': return details?.description ? `${name} added note: ${details.description}` : `${name} added a note`;
    default: return `${name} performed an action`;
  }
}

export function getActivityIcon(type: JobActivityType): string {
  switch (type) {
    case 'created': return 'plus-circle';
    case 'assigned': return 'user-check';
    case 'status_changed': return 'arrow-right-circle';
    case 'message_sent': return 'message-square';
    case 'parts_ordered': return 'shopping-cart';
    case 'parts_received': return 'package-check';
    case 'completed': return 'check-circle';
    case 'note_added': return 'file-text';
    default: return 'circle';
  }
}
