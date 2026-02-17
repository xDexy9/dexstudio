import { AuditLog, AuditAction } from '@/lib/types';
import { store, genId, persistStore } from '@/lib/mockStore';
import { getUserById } from './firestoreService';

export async function createAuditLog(
  jobId: string,
  userId: string,
  action: AuditAction,
  summary: string,
  options?: { fieldChanged?: string; oldValue?: any; newValue?: any; metadata?: { ipAddress?: string; userAgent?: string } }
): Promise<string> {
  const user = await getUserById(userId);
  const id = genId();
  store.auditLogs.push({
    id, jobId, userId,
    userName: user?.fullName || 'Unknown User',
    action, summary,
    fieldChanged: options?.fieldChanged,
    oldValue: options?.oldValue,
    newValue: options?.newValue,
    metadata: options?.metadata || {},
    timestamp: new Date().toISOString(),
  });
  persistStore();
  return id;
}

export async function getJobAuditLogs(jobId: string): Promise<AuditLog[]> {
  return store.auditLogs
    .filter(l => l.jobId === jobId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function subscribeToJobAuditLogs(
  jobId: string,
  callback: (logs: AuditLog[]) => void
): () => void {
  callback(store.auditLogs
    .filter(l => l.jobId === jobId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
  return () => {};
}

export async function getRecentAuditLogs(limitCount: number = 50): Promise<AuditLog[]> {
  return [...store.auditLogs]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limitCount);
}

export async function getUserAuditLogs(userId: string): Promise<AuditLog[]> {
  return store.auditLogs
    .filter(l => l.userId === userId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function generateAuditSummary(
  action: AuditAction, userName: string, fieldChanged?: string, oldValue?: any, newValue?: any
): string {
  switch (action) {
    case 'created': return `${userName} created this job`;
    case 'status_changed':
      return oldValue && newValue
        ? `${userName} changed status from "${oldValue}" to "${newValue}"`
        : `${userName} changed job status`;
    case 'assigned': return newValue ? `${userName} assigned job to ${newValue}` : `${userName} assigned this job`;
    case 'reassigned':
      return oldValue && newValue
        ? `${userName} reassigned job from ${oldValue} to ${newValue}`
        : `${userName} reassigned this job`;
    case 'parts_updated':
      return fieldChanged
        ? `${userName} updated ${fieldChanged}: ${oldValue || 'none'} → ${newValue}`
        : `${userName} updated parts information`;
    case 'completed': return `${userName} marked job as completed`;
    case 'deleted': return `${userName} deleted this job`;
    case 'field_updated':
      return fieldChanged && oldValue && newValue
        ? `${userName} changed ${fieldChanged} from "${oldValue}" to "${newValue}"`
        : fieldChanged
          ? `${userName} updated ${fieldChanged}`
          : `${userName} updated job information`;
    default: return `${userName} performed an action`;
  }
}

export function getAuditActionColor(action: AuditAction): string {
  switch (action) {
    case 'created': return 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/20';
    case 'status_changed': return 'text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-950/20';
    case 'assigned':
    case 'reassigned': return 'text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-950/20';
    case 'parts_updated': return 'text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-950/20';
    case 'completed': return 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-950/20';
    case 'deleted': return 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950/20';
    default: return 'text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-950/20';
  }
}
