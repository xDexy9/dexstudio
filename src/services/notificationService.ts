import { store, genId, persistStore } from '@/lib/mockStore';
import { UserSettings, Job } from '@/lib/types';
import { translations, Language } from '@/lib/i18n';

export type NotificationType =
  | 'job_completed'
  | 'job_assigned'
  | 'job_updated'
  | 'message_received'
  | 'payment_received';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  titleKey?: string;
  messageKey?: string;
  messageVars?: Record<string, string>;
  jobId?: string;
  isRead: boolean;
  createdAt: string;
  expiresAt?: string;
}

function translate(lang: Language, key: string, vars?: Record<string, string>): string {
  let text = (translations[lang] as any)?.[key] || (translations['en'] as any)?.[key] || key;
  if (vars) Object.entries(vars).forEach(([k, v]) => { text = text.replace(`{${k}}`, v); });
  return text;
}

function getUserLanguage(userId: string): Language {
  const user = store.users.find(u => u.id === userId);
  return (user?.preferredLanguage as Language) || 'en';
}

function getVehicleDescription(job: Job): string {
  const parts: string[] = [];
  if (job.vehicleBrand) parts.push(job.vehicleBrand);
  if (job.vehicleModel) parts.push(job.vehicleModel);
  const vehicleName = parts.length > 0 ? parts.join(' ') : 'Vehicle';
  const plate = job.vehicleLicensePlate ? ` (${job.vehicleLicensePlate})` : '';
  return `${vehicleName}${plate}`;
}

export async function createNotification(
  userId: string, type: NotificationType, title: string, message: string,
  jobId?: string, titleKey?: string, messageKey?: string, messageVars?: Record<string, string>
): Promise<string | null> {
  const id = genId();
  (store.notifications as any[]).push({
    id, userId, type, title, message, jobId, isRead: false, read: false,
    createdAt: new Date().toISOString(),
    ...(titleKey && { titleKey }),
    ...(messageKey && { messageKey }),
    ...(messageVars && { messageVars }),
  });
  persistStore();
  return id;
}

export async function notifyUsers(
  userIds: string[], type: NotificationType, title: string, message: string, jobId?: string
): Promise<void> {
  for (const userId of userIds) {
    await createNotification(userId, type, title, message, jobId);
  }
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  const n = store.notifications.find(n => n.id === notificationId);
  if (n) { (n as any).isRead = true; n.read = true; persistStore(); }
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  store.notifications.filter(n => n.userId === userId).forEach(n => {
    n.read = true; (n as any).isRead = true;
  });
  persistStore();
}

export async function deleteAllReadNotifications(userId: string): Promise<number> {
  const before = store.notifications.length;
  const toKeep = store.notifications.filter(n => !(n.userId === userId && ((n as any).isRead || n.read)));
  store.notifications.length = 0;
  store.notifications.push(...toKeep);
  persistStore();
  return before - store.notifications.length;
}

export function subscribeToNotifications(
  userId: string, callback: (notifications: Notification[]) => void
): () => void {
  const notifs = (store.notifications as any[])
    .filter((n: any) => n.userId === userId)
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  callback(notifs);
  return () => {};
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  return store.notifications.filter(n => n.userId === userId && !n.read && !(n as any).isRead).length;
}

export async function notifyJobCompleted(jobId: string, jobDescription: string, excludeUserId?: string): Promise<void> {
  const job = store.jobs.find(j => j.id === jobId);
  const vehicleDesc = job ? getVehicleDescription(job) : jobDescription;
  const staffUsers = store.users.filter(u => ['admin', 'manager', 'office_staff'].includes(u.role) && u.id !== excludeUserId);
  for (const u of staffUsers) {
    const lang = getUserLanguage(u.id);
    await createNotification(u.id, 'job_completed', translate(lang, 'notif.jobCompleted'), translate(lang, 'notif.jobCompletedMsg', { vehicle: vehicleDesc }), jobId);
  }
}

export async function notifyJobAssigned(jobId: string, mechanicId: string, jobDescription: string): Promise<void> {
  const job = store.jobs.find(j => j.id === jobId);
  const vehicleDesc = job ? getVehicleDescription(job) : jobDescription;
  const lang = getUserLanguage(mechanicId);
  await createNotification(mechanicId, 'job_assigned', translate(lang, 'notif.newJobAssigned'), translate(lang, 'notif.newJobAssignedMsg', { vehicle: vehicleDesc }), jobId);
}

export async function notifyJobUpdated(jobId: string, userIds: string[], updateDescription: string): Promise<void> {
  for (const userId of userIds) {
    const lang = getUserLanguage(userId);
    await createNotification(userId, 'job_updated', translate(lang, 'notif.jobUpdated'), updateDescription, jobId);
  }
}

export async function notifyPartsNeeded(jobId: string, jobDescription: string, excludeUserId?: string): Promise<void> {
  const job = store.jobs.find(j => j.id === jobId);
  const vehicleDesc = job ? getVehicleDescription(job) : jobDescription;
  const staffUsers = store.users.filter(u => ['admin', 'manager', 'office_staff'].includes(u.role) && u.id !== excludeUserId);
  for (const u of staffUsers) {
    const lang = getUserLanguage(u.id);
    await createNotification(u.id, 'job_updated', translate(lang, 'notif.partsRequired'), translate(lang, 'notif.partsRequiredMsg', { vehicle: vehicleDesc }), jobId);
  }
}
