import { store, genId, persistStore } from '@/lib/mockStore';
import { Service } from '@/lib/types';

export const getAllServices = async (): Promise<Service[]> => [...store.services];

export const getServiceById = async (serviceId: string): Promise<Service | null> =>
  store.services.find(s => s.id === serviceId) || null;

export const getServicesByCategory = async (category: string): Promise<Service[]> =>
  store.services.filter(s => s.category === category && s.isActive);

export const createService = async (
  serviceData: Omit<Service, 'id' | 'createdAt' | 'updatedAt' | 'timesPerformed'>,
  userId: string
): Promise<string> => {
  const id = genId();
  const now = new Date().toISOString();
  store.services.push({
    id, timesPerformed: 0, createdAt: now, updatedAt: now,
    createdBy: userId, updatedBy: userId, ...serviceData,
  });
  persistStore();
  return id;
};

export const updateService = async (
  serviceId: string, updates: Partial<Service>, userId: string
): Promise<void> => {
  const idx = store.services.findIndex(s => s.id === serviceId);
  if (idx !== -1) {
    store.services[idx] = { ...store.services[idx], ...updates, updatedAt: new Date().toISOString(), updatedBy: userId };
    persistStore();
  }
};

export const deleteService = async (serviceId: string): Promise<void> => {
  const idx = store.services.findIndex(s => s.id === serviceId);
  if (idx !== -1) { store.services.splice(idx, 1); persistStore(); }
};

export const searchServices = async (query: string): Promise<Service[]> => {
  const q = query.toLowerCase();
  return store.services.filter(s =>
    s.isActive && (
      s.name.toLowerCase().includes(q) ||
      s.serviceCode.toLowerCase().includes(q) ||
      s.description?.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q)
    )
  );
};

export const getServicesForJobCreation = async (): Promise<Service[]> =>
  store.services.filter(s => s.isActive);

export const getActiveServices = async (): Promise<Service[]> =>
  store.services.filter(s => s.isActive);

export const generateServiceCode = async (): Promise<string> => {
  const num = store.services.length + 1;
  return `SVC-${String(num).padStart(3, '0')}`;
};

export const addService = async (
  serviceData: Omit<Service, 'id' | 'createdAt' | 'updatedAt' | 'timesPerformed'>,
  userId: string
): Promise<string> => createService(serviceData, userId);
