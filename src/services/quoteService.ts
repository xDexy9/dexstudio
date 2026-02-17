import { store, genId, persistStore } from '@/lib/mockStore';
import { Quote, QuoteStatus, QuoteLineItem } from '@/lib/types';

export const calculateLineItem = (item: Omit<QuoteLineItem, 'subtotal' | 'discountAmount' | 'taxAmount' | 'total'> & Partial<Pick<QuoteLineItem, 'subtotal' | 'discountAmount' | 'taxAmount' | 'total'>>): QuoteLineItem => {
  const subtotal = item.quantity * item.unitPrice;
  const discountAmount = subtotal * (item.discount / 100);
  const taxAmount = (subtotal - discountAmount) * item.taxRate;
  const total = subtotal - discountAmount + taxAmount;
  return { ...item, subtotal, discountAmount, taxAmount, total } as QuoteLineItem;
};

export const calculateQuoteTotals = (lineItems: QuoteLineItem[]) => {
  const subtotal = lineItems.reduce((s, i) => s + i.subtotal, 0);
  const discountTotal = lineItems.reduce((s, i) => s + i.discountAmount, 0);
  const taxTotal = lineItems.reduce((s, i) => s + i.taxAmount, 0);
  const grandTotal = lineItems.reduce((s, i) => s + i.total, 0);
  return { subtotal, discountTotal, taxTotal, grandTotal };
};

export const createQuoteFromJob = async (
  jobId: string, lineItems: QuoteLineItem[], userId: string, options?: Record<string, any>
): Promise<string> => {
  const job = store.jobs.find(j => j.id === jobId);
  const customer = store.customers.find(c => c.id === job?.customerId);
  const vehicle = store.vehicles.find(v => v.id === job?.vehicleId);
  const totals = calculateQuoteTotals(lineItems);
  return createQuote({
    jobId, customerId: job?.customerId, vehicleId: job?.vehicleId,
    customer: { name: job?.customerName || '', phone: job?.customerPhone || '', email: customer?.email },
    vehicle: { brand: job?.vehicleBrand || '', model: job?.vehicleModel || '', year: job?.vehicleYear || 0, licensePlate: job?.vehicleLicensePlate || '' },
    lineItems, ...totals, currency: 'EUR', status: 'draft' as QuoteStatus,
    validUntil: new Date(Date.now() + 30 * 86400000).toISOString(),
    notes: options?.notes, termsAndConditions: options?.termsAndConditions,
    laborHours: options?.laborHours, laborRate: options?.laborRate,
  }, userId);
};

const now = () => new Date().toISOString();

export const createQuote = async (
  quoteData: Omit<Quote, 'id' | 'quoteNumber' | 'createdAt' | 'updatedAt' | 'publicToken'>,
  userId: string
): Promise<string> => {
  const id = genId();
  const num = store.companySettings.nextQuoteNumber;
  store.companySettings.nextQuoteNumber++;
  const quoteNumber = `${store.companySettings.quotePrefix}-${new Date().getFullYear()}-${String(num).padStart(3, '0')}`;
  const publicToken = genId();
  store.quotes.push({
    id, quoteNumber, publicToken,
    createdAt: now(), updatedAt: now(),
    createdBy: userId, updatedBy: userId,
    ...quoteData,
  });
  persistStore();
  return id;
};

export const getQuoteById = async (quoteId: string): Promise<Quote | null> =>
  store.quotes.find(q => q.id === quoteId) || null;

export const getQuoteByToken = async (token: string): Promise<Quote | null> =>
  store.quotes.find(q => q.publicToken === token) || null;

export const getQuotesByJob = async (jobId: string): Promise<Quote[]> =>
  store.quotes.filter(q => q.jobId === jobId);

export const getAllQuotes = async (): Promise<Quote[]> =>
  [...store.quotes].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

export const updateQuote = async (quoteId: string, updates: Partial<Quote>, userId: string): Promise<void> => {
  const idx = store.quotes.findIndex(q => q.id === quoteId);
  if (idx !== -1) {
    store.quotes[idx] = { ...store.quotes[idx], ...updates, updatedAt: now(), updatedBy: userId };
    persistStore();
  }
};

export const approveQuote = async (
  quoteId: string, signatureDataUrl: string, _signatureIpAddress?: string
): Promise<void> => {
  const idx = store.quotes.findIndex(q => q.id === quoteId);
  if (idx !== -1) {
    store.quotes[idx] = {
      ...store.quotes[idx], status: 'approved',
      approvedAt: now(), signatureDataUrl,
      signatureTimestamp: now(), updatedAt: now(),
    };
    persistStore();
  }
};

export const rejectQuote = async (quoteId: string): Promise<void> => {
  const idx = store.quotes.findIndex(q => q.id === quoteId);
  if (idx !== -1) {
    store.quotes[idx] = { ...store.quotes[idx], status: 'rejected', rejectedAt: now(), updatedAt: now() };
    persistStore();
  }
};

export const sendQuote = async (quoteId: string, userId: string): Promise<void> => {
  const idx = store.quotes.findIndex(q => q.id === quoteId);
  if (idx !== -1) {
    store.quotes[idx] = { ...store.quotes[idx], status: 'sent', sentAt: now(), updatedAt: now(), updatedBy: userId };
    persistStore();
  }
};

export const deleteQuote = async (quoteId: string): Promise<void> => {
  const idx = store.quotes.findIndex(q => q.id === quoteId);
  if (idx !== -1) { store.quotes.splice(idx, 1); persistStore(); }
};

export const generateQuotePdf = async (_quoteId: string): Promise<string> => {
  return ''; // PDF generation not available in demo mode
};

export const markQuoteAsSent = async (quoteId: string, userId: string): Promise<void> =>
  sendQuote(quoteId, userId);

export interface QuoteStats {
  total: number; draft: number; sent: number; viewed: number;
  approved: number; rejected: number; totalValue: number; approvedValue: number;
}

export const getQuoteStats = async (): Promise<QuoteStats> => {
  const quotes = store.quotes;
  return {
    total: quotes.length,
    draft: quotes.filter(q => q.status === 'draft').length,
    sent: quotes.filter(q => q.status === 'sent').length,
    viewed: quotes.filter(q => q.status === 'viewed').length,
    approved: quotes.filter(q => q.status === 'approved').length,
    rejected: quotes.filter(q => q.status === 'rejected').length,
    totalValue: quotes.reduce((s, q) => s + q.grandTotal, 0),
    approvedValue: quotes.filter(q => q.status === 'approved').reduce((s, q) => s + q.grandTotal, 0),
  };
};

export const syncPublicQuoteStatus = async (_quoteId: string, _userId: string): Promise<void> => {
  // No-op in demo mode
};

export const getQuotesForJob = (jobId: string) => getQuotesByJob(jobId);

export const approveQuoteByToken = async (token: string, signatureDataUrl: string): Promise<void> => {
  const quote = await getQuoteByToken(token);
  if (quote) await approveQuote(quote.id, signatureDataUrl);
};

export const rejectQuoteByToken = async (token: string): Promise<void> => {
  const quote = await getQuoteByToken(token);
  if (quote) await rejectQuote(quote.id);
};
