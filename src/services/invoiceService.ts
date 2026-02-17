import { store, genId, persistStore } from '@/lib/mockStore';
import { Invoice, PaymentRecord, InvoiceStatus, QuoteLineItem } from '@/lib/types';

export const createInvoiceFromJob = async (
  jobId: string, lineItems: QuoteLineItem[], userId: string, options?: Record<string, any>
): Promise<string> => {
  const job = store.jobs.find(j => j.id === jobId);
  const customer = store.customers.find(c => c.id === job?.customerId);
  const subtotal = lineItems.reduce((s, i) => s + i.subtotal, 0);
  const discountTotal = lineItems.reduce((s, i) => s + i.discountAmount, 0);
  const taxTotal = lineItems.reduce((s, i) => s + i.taxAmount, 0);
  const grandTotal = lineItems.reduce((s, i) => s + i.total, 0);
  return createInvoice({
    jobId, customerId: job?.customerId, vehicleId: job?.vehicleId,
    customer: { name: job?.customerName || '', phone: job?.customerPhone || '', email: customer?.email },
    vehicle: { brand: job?.vehicleBrand || '', model: job?.vehicleModel || '', year: job?.vehicleYear || 0, licensePlate: job?.vehicleLicensePlate || '' },
    lineItems, subtotal, discountTotal, taxTotal, grandTotal, currency: 'EUR',
    paymentStatus: 'unpaid' as InvoiceStatus, paidAmount: 0, remainingAmount: grandTotal,
    dueDate: new Date(Date.now() + 30 * 86400000).toISOString(),
    notes: options?.notes, payments: [],
  }, userId);
};

const now = () => new Date().toISOString();

export const createInvoice = async (
  invoiceData: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt' | 'updatedAt'>,
  userId: string
): Promise<string> => {
  const id = genId();
  const num = store.companySettings.nextInvoiceNumber;
  store.companySettings.nextInvoiceNumber++;
  const invoiceNumber = `${store.companySettings.invoicePrefix}-${new Date().getFullYear()}-${String(num).padStart(3, '0')}`;
  store.invoices.push({
    id, invoiceNumber,
    createdAt: now(), updatedAt: now(),
    createdBy: userId, updatedBy: userId,
    ...invoiceData,
  });
  persistStore();
  return id;
};

export const getInvoiceById = async (invoiceId: string): Promise<Invoice | null> =>
  store.invoices.find(i => i.id === invoiceId) || null;

export const getInvoicesByJob = async (jobId: string): Promise<Invoice[]> =>
  store.invoices.filter(i => i.jobId === jobId);

export const getAllInvoices = async (): Promise<Invoice[]> =>
  [...store.invoices].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

export const updateInvoice = async (invoiceId: string, updates: Partial<Invoice>, userId: string): Promise<void> => {
  const idx = store.invoices.findIndex(i => i.id === invoiceId);
  if (idx !== -1) {
    store.invoices[idx] = { ...store.invoices[idx], ...updates, updatedAt: now(), updatedBy: userId };
    persistStore();
  }
};

export const recordPayment = async (
  invoiceId: string, payment: Omit<PaymentRecord, 'id'>, userId: string
): Promise<void> => {
  const idx = store.invoices.findIndex(i => i.id === invoiceId);
  if (idx === -1) return;
  const invoice = store.invoices[idx];
  const newPayment: PaymentRecord = { id: genId(), ...payment };
  const payments = [...(invoice.payments || []), newPayment];
  const paidAmount = payments.reduce((s, p) => s + p.amount, 0);
  const remainingAmount = invoice.grandTotal - paidAmount;
  const paymentStatus: InvoiceStatus = remainingAmount <= 0 ? 'paid' : paidAmount > 0 ? 'partial' : 'unpaid';
  store.invoices[idx] = { ...invoice, payments, paidAmount, remainingAmount, paymentStatus, updatedAt: now(), updatedBy: userId };
  persistStore();
};

export const deleteInvoice = async (invoiceId: string): Promise<void> => {
  const idx = store.invoices.findIndex(i => i.id === invoiceId);
  if (idx !== -1) { store.invoices.splice(idx, 1); persistStore(); }
};

export const generateInvoicePdf = async (_invoiceId: string): Promise<string> => {
  return ''; // PDF generation not available in demo mode
};

export const createInvoiceFromQuote = async (quoteId: string, userId: string): Promise<string> => {
  const quote = store.quotes.find(q => q.id === quoteId);
  if (!quote) throw new Error('Quote not found');
  return createInvoice({
    jobId: quote.jobId, customerId: quote.customerId, vehicleId: quote.vehicleId,
    quoteId: quote.id, customer: quote.customer, vehicle: quote.vehicle,
    lineItems: quote.lineItems, subtotal: quote.subtotal, discountTotal: quote.discountTotal,
    taxTotal: quote.taxTotal, grandTotal: quote.grandTotal, currency: quote.currency,
    paymentStatus: 'unpaid' as InvoiceStatus, paidAmount: 0, remainingAmount: quote.grandTotal,
    dueDate: new Date(Date.now() + 30 * 86400000).toISOString(), payments: [],
  }, userId);
};

export interface InvoiceStats {
  total: number; unpaid: number; partial: number; paid: number; overdue: number;
  totalValue: number; paidValue: number; outstandingValue: number;
}

export const getInvoicesForJob = (jobId: string) => getInvoicesByJob(jobId);

export const markInvoiceAsSent = async (invoiceId: string, userId: string): Promise<void> =>
  updateInvoice(invoiceId, { paymentStatus: 'unpaid' as InvoiceStatus }, userId);

export const getInvoiceStats = async (): Promise<InvoiceStats> => {
  const invoices = store.invoices;
  return {
    total: invoices.length,
    unpaid: invoices.filter(i => i.paymentStatus === 'unpaid').length,
    partial: invoices.filter(i => i.paymentStatus === 'partial').length,
    paid: invoices.filter(i => i.paymentStatus === 'paid').length,
    overdue: invoices.filter(i => i.paymentStatus === 'overdue').length,
    totalValue: invoices.reduce((s, i) => s + i.grandTotal, 0),
    paidValue: invoices.reduce((s, i) => s + (i.paidAmount || 0), 0),
    outstandingValue: invoices.reduce((s, i) => s + (i.remainingAmount || i.grandTotal), 0),
  };
};
