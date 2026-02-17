import {
  User, Vehicle, Job, Message, Customer, CustomerComplaint,
  Notification, UserSettings, NotificationType
} from '@/lib/types';
import { store, genId, persistStore, DEFAULT_USER_SETTINGS } from '@/lib/mockStore';

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const now = () => new Date().toISOString();
export const generateId = genId;

// ─── USERS ────────────────────────────────────────────────────────────────────
export const getUserById = async (userId: string): Promise<User | null> => {
  const found = store.users.find(u => u.id === userId);
  if (!found) return null;
  const { password: _pw, ...user } = found as any;
  return user as User;
};

export const getUsers = async (): Promise<User[]> =>
  store.users.map(({ password: _pw, ...u }: any) => u as User);

export const getAllUsers = getUsers;

export const getMechanics = async (): Promise<User[]> =>
  store.users
    .filter(u => u.role === 'mechanic')
    .map(({ password: _pw, ...u }: any) => u as User);

export const addUser = async (user: Omit<User, 'id'>): Promise<string> => {
  const id = genId();
  store.users.push({ id, password: '', ...user } as any);
  persistStore();
  return id;
};

export const updateUser = async (userId: string, updates: Partial<User>): Promise<void> => {
  const idx = store.users.findIndex(u => u.id === userId);
  if (idx !== -1) { store.users[idx] = { ...store.users[idx], ...updates }; persistStore(); }
};

export const deleteUser = async (userId: string): Promise<void> => {
  const idx = store.users.findIndex(u => u.id === userId);
  if (idx !== -1) { store.users.splice(idx, 1); persistStore(); }
};

export const findUserByEmail = async (email: string): Promise<User | null> => {
  const found = store.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!found) return null;
  const { password: _pw, ...user } = found as any;
  return user as User;
};

export const getMechanicStats = async () => {
  const mechanics = await getMechanics();
  return mechanics.map(mech => {
    const mechJobs = store.jobs.filter(j => j.assignedMechanicId === mech.id);
    const completed = mechJobs.filter(j => j.status === 'completed');
    const active = mechJobs.filter(j => j.status !== 'completed');
    const avgTime = completed.length > 0
      ? completed.reduce((s, j) => s + (j.estimatedDuration || 0), 0) / completed.length
      : 0;
    return { id: mech.id, name: mech.fullName, completedJobs: completed.length, avgTime: Math.round(avgTime), activeJobs: active.length };
  });
};

// ─── VEHICLES ────────────────────────────────────────────────────────────────
export const addVehicle = async (vehicle: Omit<Vehicle, 'id' | 'createdAt'>): Promise<string> => {
  const id = genId();
  store.vehicles.push({ id, createdAt: now(), ...vehicle });
  persistStore();
  return id;
};

export const getVehicles = async (): Promise<Vehicle[]> => [...store.vehicles];

export const getVehicleById = async (vehicleId: string): Promise<Vehicle | null> =>
  store.vehicles.find(v => v.id === vehicleId) || null;

export const findVehicleByPlate = async (licensePlate: string): Promise<Vehicle | null> =>
  store.vehicles.find(v => v.licensePlate.toUpperCase() === licensePlate.toUpperCase()) || null;

export const updateVehicle = async (vehicleId: string, updates: Partial<Vehicle>): Promise<void> => {
  const idx = store.vehicles.findIndex(v => v.id === vehicleId);
  if (idx !== -1) { store.vehicles[idx] = { ...store.vehicles[idx], ...updates }; persistStore(); }
};

export const deleteVehicle = async (vehicleId: string): Promise<void> => {
  const idx = store.vehicles.findIndex(v => v.id === vehicleId);
  if (idx !== -1) { store.vehicles.splice(idx, 1); persistStore(); }
};

// ─── CUSTOMERS ───────────────────────────────────────────────────────────────
export const addCustomer = async (customer: Omit<Customer, 'id' | 'createdAt'>): Promise<string> => {
  const id = genId();
  store.customers.push({ id, createdAt: now(), ...customer });
  persistStore();
  return id;
};

export const getCustomers = async (): Promise<Customer[]> => [...store.customers];

export const getCustomerById = async (customerId: string): Promise<Customer | null> =>
  store.customers.find(c => c.id === customerId) || null;

export const findCustomerByPhone = async (phone: string): Promise<Customer | null> =>
  store.customers.find(c => c.phone === phone) || null;

export const findCustomerByName = async (name: string): Promise<Customer[]> => {
  const s = name.toLowerCase();
  return store.customers.filter(c =>
    c.name.toLowerCase().includes(s) ||
    c.phone.includes(name) ||
    c.email?.toLowerCase().includes(s)
  );
};

export const updateCustomer = async (customerId: string, updates: Partial<Customer>): Promise<void> => {
  const idx = store.customers.findIndex(c => c.id === customerId);
  if (idx !== -1) { store.customers[idx] = { ...store.customers[idx], ...updates, updatedAt: now() }; persistStore(); }
};

export const deleteCustomer = async (customerId: string): Promise<void> => {
  const idx = store.customers.findIndex(c => c.id === customerId);
  if (idx !== -1) { store.customers.splice(idx, 1); persistStore(); }
};

export const findOrCreateCustomer = async (
  name: string, phone: string, email?: string, postCode?: string, region?: string
): Promise<string> => {
  const existing = await findCustomerByPhone(phone);
  if (existing) {
    const updates: Partial<Customer> = {};
    if (existing.name !== name) updates.name = name;
    if (email && existing.email !== email) updates.email = email;
    if (postCode && existing.postCode !== postCode) updates.postCode = postCode;
    if (region && existing.region !== region) updates.region = region;
    if (Object.keys(updates).length > 0) await updateCustomer(existing.id, updates);
    return existing.id;
  }
  return addCustomer({ name, phone, ...(email && { email }), ...(postCode && { postCode }), ...(region && { region }) });
};

export const addCustomerComplaint = async (
  customerId: string,
  complaint: Omit<CustomerComplaint, 'id' | 'createdAt'>
): Promise<void> => {
  const idx = store.customers.findIndex(c => c.id === customerId);
  if (idx !== -1) {
    const newComplaint: CustomerComplaint = {
      ...complaint, id: genId(), createdAt: now(),
    };
    if (!store.customers[idx].complaints) store.customers[idx].complaints = [];
    store.customers[idx].complaints!.push(newComplaint);
    store.customers[idx].updatedAt = now();
    persistStore();
  }
};

export const linkVehicleToCustomer = async (customerId: string, vehicleId: string): Promise<void> => {
  const idx = store.customers.findIndex(c => c.id === customerId);
  if (idx !== -1) {
    if (!store.customers[idx].vehicleIds) store.customers[idx].vehicleIds = [];
    if (!store.customers[idx].vehicleIds!.includes(vehicleId)) {
      store.customers[idx].vehicleIds!.push(vehicleId);
      persistStore();
    }
  }
};

export const getUniqueCustomersFromJobs = async () => {
  const customerMap = new Map<string, { name: string; phone: string; email?: string; jobCount: number }>();
  store.jobs.forEach(job => {
    const key = job.customerPhone;
    if (customerMap.has(key)) { customerMap.get(key)!.jobCount++; }
    else { customerMap.set(key, { name: job.customerName, phone: job.customerPhone, email: job.customerEmail, jobCount: 1 }); }
  });
  return Array.from(customerMap.values()).sort((a, b) => b.jobCount - a.jobCount);
};

// ─── JOBS ────────────────────────────────────────────────────────────────────
export const addJob = async (job: Omit<Job, 'id' | 'createdAt' | 'updatedAt'>, _userId: string): Promise<string> => {
  const id = genId();
  store.jobs.unshift({ id, createdAt: now(), updatedAt: now(), ...job } as Job);
  persistStore();
  return id;
};

export const updateJob = async (jobId: string, updates: Partial<Job>, _userId?: string): Promise<void> => {
  const idx = store.jobs.findIndex(j => j.id === jobId);
  if (idx !== -1) {
    store.jobs[idx] = { ...store.jobs[idx], ...updates, updatedAt: now() };
    persistStore();
  }
};

export const getJobs = async (): Promise<Job[]> =>
  [...store.jobs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

export const getJobById = async (jobId: string): Promise<Job | null> =>
  store.jobs.find(j => j.id === jobId) || null;

export const getJobsByMechanic = async (mechanicId: string): Promise<Job[]> =>
  store.jobs
    .filter(j => j.assignedMechanicId === mechanicId)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

export const getJobsByVehicle = async (vehicleId: string): Promise<Job[]> =>
  store.jobs
    .filter(j => j.vehicleId === vehicleId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

export const getAvailableJobs = async (): Promise<Job[]> =>
  store.jobs.filter(j => !j.assignedMechanicId && j.status === 'not_started');

export const deleteJob = async (jobId: string): Promise<void> => {
  const idx = store.jobs.findIndex(j => j.id === jobId);
  if (idx !== -1) { store.jobs.splice(idx, 1); persistStore(); }
};

// Real-time subscriptions — simulate with immediate callback + no cleanup needed
export const subscribeToJobs = (callback: (jobs: Job[]) => void): (() => void) => {
  const sorted = [...store.jobs].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  callback(sorted);
  return () => {};
};

export const subscribeToJob = (jobId: string, callback: (job: Job | null) => void): (() => void) => {
  callback(store.jobs.find(j => j.id === jobId) || null);
  return () => {};
};

// ─── MESSAGES ────────────────────────────────────────────────────────────────
export const addMessage = async (message: Omit<Message, 'id' | 'createdAt'>): Promise<string> => {
  const id = genId();
  store.messages.push({ id, createdAt: now(), readBy: [message.senderId], ...message });
  persistStore();
  return id;
};

export const getMessages = async (): Promise<Message[]> => [...store.messages];

export const getMessagesByJob = async (jobId: string): Promise<Message[]> =>
  store.messages
    .filter(m => m.jobId === jobId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

export const markMessageAsRead = async (messageId: string, userId: string): Promise<void> => {
  const msg = store.messages.find(m => m.id === messageId);
  if (msg && !msg.readBy?.includes(userId)) {
    if (!msg.readBy) msg.readBy = [];
    msg.readBy.push(userId);
    persistStore();
  }
};

export const markJobMessagesAsRead = async (userId: string, jobId: string): Promise<void> => {
  store.messages
    .filter(m => m.jobId === jobId && m.senderId !== userId)
    .forEach(m => {
      if (!m.readBy) m.readBy = [];
      if (!m.readBy.includes(userId)) m.readBy.push(userId);
    });
  persistStore();
};

export const getUnreadMessageCount = async (userId: string, jobId?: string, userRole?: string): Promise<number> => {
  const messages = jobId ? store.messages.filter(m => m.jobId === jobId) : store.messages;
  const jobIds = new Set(store.jobs.map(j => j.id));
  if (userRole === 'mechanic' && !jobId) {
    const assignedJobIds = new Set(store.jobs.filter(j => j.assignedMechanicId === userId).map(j => j.id));
    return messages.filter(m => assignedJobIds.has(m.jobId) && m.senderId !== userId && !m.readBy?.includes(userId)).length;
  }
  return messages.filter(m => jobIds.has(m.jobId) && m.senderId !== userId && !m.readBy?.includes(userId)).length;
};

export const getUnreadJobIds = async (userId: string): Promise<string[]> => {
  const set = new Set<string>();
  store.messages.forEach(m => {
    if (m.senderId !== userId && !m.readBy?.includes(userId)) set.add(m.jobId);
  });
  return Array.from(set);
};

export const deleteMessages = async (messageIds: string[], userId: string): Promise<{ deleted: number; skipped: number }> => {
  let deleted = 0; let skipped = 0;
  messageIds.forEach(id => {
    const idx = store.messages.findIndex(m => m.id === id);
    if (idx !== -1 && store.messages[idx].readBy?.includes(userId)) {
      store.messages.splice(idx, 1); deleted++;
    } else { skipped++; }
  });
  persistStore();
  return { deleted, skipped };
};

export const getDeletableMessagesForMechanic = async (mechanicId: string): Promise<Message[]> => {
  const jobIds = new Set(
    store.jobs.filter(j => j.assignedMechanicId === mechanicId && j.status !== 'completed').map(j => j.id)
  );
  return store.messages.filter(m => jobIds.has(m.jobId) && m.readBy?.includes(mechanicId));
};

export const deleteAllReadMessagesFromJob = async (jobId: string, userId: string): Promise<number> => {
  const toDelete = store.messages.filter(
    m => m.jobId === jobId && (m.senderId === userId || m.readBy?.includes(userId))
  );
  toDelete.forEach(m => {
    const idx = store.messages.findIndex(msg => msg.id === m.id);
    if (idx !== -1) store.messages.splice(idx, 1);
  });
  persistStore();
  return toDelete.length;
};

export const subscribeToJobMessages = (jobId: string, callback: (messages: Message[]) => void): (() => void) => {
  const msgs = store.messages
    .filter(m => m.jobId === jobId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  callback(msgs);
  return () => {};
};

export const subscribeToAllMessages = (callback: (messages: Message[]) => void): (() => void) => {
  const sorted = [...store.messages].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  callback(sorted);
  return () => {};
};

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
export const createNotification = async (notification: Omit<Notification, 'id' | 'createdAt'>): Promise<string> => {
  const id = genId();
  store.notifications.push({ id, createdAt: now(), ...notification });
  persistStore();
  return id;
};

export const getNotificationsByUser = async (userId: string): Promise<Notification[]> =>
  store.notifications
    .filter(n => n.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 50);

export const getUnreadNotificationCount = async (userId: string): Promise<number> =>
  store.notifications.filter(n => n.userId === userId && !n.read).length;

export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  const n = store.notifications.find(n => n.id === notificationId);
  if (n) { n.read = true; persistStore(); }
};

export const markAllNotificationsAsRead = async (userId: string): Promise<void> => {
  store.notifications.filter(n => n.userId === userId).forEach(n => { n.read = true; });
  persistStore();
};

export const deleteOldNotifications = async (_userId: string): Promise<void> => {};

export const subscribeToNotifications = (
  userId: string, onUpdate: (notifications: Notification[]) => void
): (() => void) => {
  const notifs = store.notifications
    .filter(n => n.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 50);
  onUpdate(notifs);
  return () => {};
};

// ─── USER SETTINGS ────────────────────────────────────────────────────────────
export const getUserSettings = async (userId: string): Promise<UserSettings | null> => {
  if (store.userSettings[userId]) return store.userSettings[userId];
  const user = store.users.find(u => u.id === userId);
  return {
    ...DEFAULT_USER_SETTINGS,
    userId,
    preferredLanguage: user?.preferredLanguage || 'en',
  } as UserSettings;
};

export const updateUserSettings = async (
  userId: string,
  settings: Partial<Omit<UserSettings, 'userId' | 'updatedAt'>>
): Promise<void> => {
  const current = await getUserSettings(userId);
  store.userSettings[userId] = {
    ...(current || { ...DEFAULT_USER_SETTINGS, userId }),
    ...settings,
    userId,
    updatedAt: now(),
  } as UserSettings;
  persistStore();
};
