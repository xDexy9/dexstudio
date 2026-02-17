import { store, persistStore } from '@/lib/mockStore';
import { CompanySettings } from '@/lib/types';

export const getCompanySettings = async (): Promise<CompanySettings | null> =>
  store.companySettings ? { ...store.companySettings } : null;

export const saveCompanySettings = async (
  settings: Omit<CompanySettings, 'id' | 'updatedAt'>, userId: string
): Promise<void> => {
  store.companySettings = {
    ...store.companySettings,
    ...settings,
    id: 'default',
    updatedBy: userId,
    updatedAt: new Date().toISOString(),
  };
  persistStore();
};

export const uploadCompanyLogo = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const deleteCompanyLogo = async (_logoUrl: string): Promise<void> => {};

export const initializeDefaultSettings = async (_userId: string): Promise<CompanySettings> => {
  const existing = await getCompanySettings();
  if (existing) return existing;
  return { ...store.companySettings };
};
