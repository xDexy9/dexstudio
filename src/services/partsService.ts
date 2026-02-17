import { store, genId, persistStore } from '@/lib/mockStore';
import { Part, StockTransaction, JobPart } from '@/lib/types';

export const calculateMarkup = (costPrice: number, sellingPrice: number): number => {
  if (costPrice === 0) return 0;
  return Number((((sellingPrice - costPrice) / costPrice) * 100).toFixed(2));
};

export const calculateSellingPrice = (costPrice: number, markupPercent: number): number =>
  Number((costPrice * (1 + markupPercent / 100)).toFixed(2));

export const getAllParts = async (): Promise<Part[]> => [...store.parts];

export const getPartById = async (partId: string): Promise<Part | null> =>
  store.parts.find(p => p.id === partId) || null;

export const getPartsByCategory = async (category: string): Promise<Part[]> =>
  store.parts.filter(p => p.category === category && p.isActive);

export const getLowStockParts = async (): Promise<Part[]> =>
  store.parts.filter(p => p.stockQuantity <= p.minStockLevel && p.isActive);

export const createPart = async (
  partData: Omit<Part, 'id' | 'createdAt' | 'updatedAt' | 'totalUsageCount'>,
  userId: string
): Promise<string> => {
  const id = genId();
  const now = new Date().toISOString();
  store.parts.push({
    id, totalUsageCount: 0, createdAt: now, updatedAt: now,
    createdBy: userId, updatedBy: userId, ...partData,
  });
  persistStore();
  return id;
};

export const updatePart = async (
  partId: string, updates: Partial<Part>, userId: string
): Promise<void> => {
  const idx = store.parts.findIndex(p => p.id === partId);
  if (idx !== -1) {
    store.parts[idx] = { ...store.parts[idx], ...updates, updatedAt: new Date().toISOString(), updatedBy: userId };
    persistStore();
  }
};

export const deletePart = async (partId: string): Promise<void> => {
  const idx = store.parts.findIndex(p => p.id === partId);
  if (idx !== -1) { store.parts.splice(idx, 1); persistStore(); }
};

export const adjustStock = async (
  partId: string, quantity: number, type: 'purchase' | 'usage' | 'adjustment' | 'return',
  userId: string, options?: { jobId?: string; reason?: string; costPerUnit?: number; notes?: string }
): Promise<void> => {
  const idx = store.parts.findIndex(p => p.id === partId);
  if (idx === -1) return;
  const part = store.parts[idx];
  store.parts[idx] = { ...part, stockQuantity: part.stockQuantity + quantity, updatedAt: new Date().toISOString(), updatedBy: userId };
  const tx: StockTransaction = {
    id: genId(), partId, partName: part.name, type, quantity,
    jobId: options?.jobId, costPerUnit: options?.costPerUnit,
    totalCost: options?.costPerUnit ? Math.abs(quantity) * options.costPerUnit : undefined,
    reason: options?.reason, notes: options?.notes, performedBy: userId,
    performedAt: new Date().toISOString(),
  };
  store.stockTransactions.push(tx);
  persistStore();
};

export const getStockTransactions = async (partId?: string): Promise<StockTransaction[]> => {
  const txs = partId ? store.stockTransactions.filter(t => t.partId === partId) : [...store.stockTransactions];
  return txs.sort((a, b) => new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime());
};

export const searchParts = async (query: string): Promise<Part[]> => {
  const q = query.toLowerCase();
  return store.parts.filter(p =>
    p.isActive && (
      p.name.toLowerCase().includes(q) ||
      p.partNumber.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    )
  );
};

export const getPartsForJobCreation = async (): Promise<Part[]> =>
  store.parts.filter(p => p.isActive);

export const getActiveParts = async (): Promise<Part[]> =>
  store.parts.filter(p => p.isActive);

export const getPartByPartNumber = async (partNumber: string): Promise<Part | null> =>
  store.parts.find(p => p.partNumber === partNumber && p.isActive) || null;

export const deductStockForJob = async (
  parts: Array<{ partId: string; quantity: number; costPerUnit?: number; sellingPrice?: number; totalCost?: number }>,
  jobId: string, userId: string
): Promise<void> => {
  for (const p of parts) {
    await adjustStock(p.partId, -p.quantity, 'usage', userId, {
      jobId, costPerUnit: p.costPerUnit, reason: `Used in job ${jobId}`,
    });
  }
};

export const addPart = async (
  partData: Omit<Part, 'id' | 'createdAt' | 'updatedAt' | 'totalUsageCount'>,
  userId: string
): Promise<string> => createPart(partData, userId);
