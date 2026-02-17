import { Language } from './i18n';

export type UserRole = 'admin' | 'manager' | 'office_staff' | 'mechanic';

export type JobStatus = 'not_started' | 'in_progress' | 'waiting_for_parts' | 'ready_for_pickup' | 'completed';

export type JobPriority = 'low' | 'normal' | 'urgent';

export type ServiceType = 'repair' | 'maintenance' | 'inspection' | 'diagnostic';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  preferredLanguage: Language;
  avatarUrl?: string;
  createdAt: string;
}

export interface CustomerComplaint {
  id: string;
  description: string;
  createdAt: string;
  createdBy: string;
  createdByName: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  postCode?: string;
  region?: string;
  vehicleIds?: string[];
  complaints?: CustomerComplaint[];
  createdAt: string;
  updatedAt?: string;
}

export type FuelType = 'petrol' | 'diesel' | 'electric' | 'hybrid' | 'lpg' | 'other';

export interface Vehicle {
  id: string;
  brand: string;
  model?: string;
  year?: number;
  licensePlate: string;
  vin?: string;
  color?: string;
  fuelType?: FuelType;
  mileage?: number;
  customerId?: string; // Link vehicle to customer
  createdAt: string;
}

export interface Job {
  id: string;
  jobNumber: string; // Unique tracking ID (e.g., "A1B2C3")
  vehicleId: string;
  // Denormalized vehicle fields for display without lookup
  vehicleLicensePlate?: string;
  vehicleBrand?: string;
  vehicleModel?: string;
  vehicleYear?: number;
  vehicleVin?: string;
  vehicleFuelType?: FuelType;
  vehicleMileage?: number;
  // Customer info
  customerId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerPostCode?: string;
  customerRegion?: string;
  customerNotes?: string;
  problemDescription: string;
  problemDescriptionLanguage?: Language;
  problemDescriptionTranslations?: Partial<Record<Language, string>>;
  priority: JobPriority;
  serviceType?: ServiceType;
  faultCategory?: string; // Comma-separated categories selected during job creation (e.g., "brakes,fluids")
  status: JobStatus;
  assignedMechanicId?: string;
  assignedAt?: string; // When the job was assigned to a mechanic
  scheduledDate?: string;
  estimatedDuration?: number; // in minutes
  mileage?: number;
  partsNeeded?: Array<{ categoryId: string; status: 'order' | 'in_stock' }>; // Parts needed with individual status

  // Parts and Services (for invoicing)
  partsUsed?: JobPart[]; // Actual parts consumed in this job
  servicesProvided?: JobService[]; // Services performed
  totalPartsCost?: number; // Sum of partsUsed totalCost
  totalServicesCost?: number; // Sum of servicesProvided totalPrice
  estimatedTotal?: number; // For quotes

  // Work Order (staged diagnostic and quote system)
  workOrderData?: WorkOrderData;
  workOrderStage?: 1 | 2 | 3 | 4 | 5 | 6; // Current completion stage

  // Quote/Invoice references
  quoteId?: string;
  invoiceId?: string; // Latest/active invoice
  invoiceIds?: string[]; // All invoices (versioning)
  quoteSentAt?: string;
  quoteApprovedAt?: string;
  invoiceSentAt?: string;
  invoicePaidAt?: string;

  createdBy: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  version: number; // For optimistic locking and conflict detection
}

export interface Message {
  id: string;
  jobId: string;
  senderId: string;
  originalText: string;
  originalLanguage: Language;
  translations: Partial<Record<Language, string>>;
  imageUrl?: string;
  audioUrl?: string;
  audioDuration?: number; // seconds
  videoUrl?: string;
  videoDuration?: number; // seconds
  createdAt: string;
  isTranslating?: boolean;
  readBy?: string[]; // Array of user IDs who have read this message
}

export type NotificationType =
  | 'job_created'
  | 'job_assigned'
  | 'job_status_changed'
  | 'job_completed'
  | 'new_message'
  | 'parts_status_changed';

export interface Notification {
  id: string;
  userId: string; // Who receives this notification
  type: NotificationType;
  title: string;
  message: string;
  jobId?: string; // Related job if applicable
  senderId?: string; // Who triggered this notification
  read: boolean;
  createdAt: string;
}

export interface DashboardWidget {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface UserSettings {
  userId: string;
  // Notification preferences
  notifyJobCreated: boolean;
  notifyJobAssigned: boolean;
  notifyJobStatusChanged: boolean;
  notifyJobCompleted: boolean;
  notifyNewMessage: boolean;
  notifyPartsStatusChanged: boolean;
  // Smart notification preferences
  notifyUrgentOnly?: boolean; // Only notify for urgent jobs
  quietHoursEnabled?: boolean; // Enable quiet hours
  quietHoursStart?: string; // "HH:MM" format (24h)
  quietHoursEnd?: string; // "HH:MM" format (24h)
  quietHoursIgnoreUrgent?: boolean; // Allow urgent notifications during quiet hours
  // Display preferences
  preferredLanguage: Language;
  // Dashboard layout
  dashboardLayout?: DashboardWidget[];
  // Updated timestamp
  updatedAt: string;
}

// Job Health Types
export type JobHealth = 'healthy' | 'warning' | 'critical' | 'overdue';

export interface JobHealthIndicator {
  health: JobHealth;
  reason: string;
  daysOld: number;
  daysOverdue: number;
  isInactive: boolean;
  lastUpdate: Date;
}

// Job Activity Types (for timeline)
export type JobActivityType =
  | 'created'
  | 'assigned'
  | 'status_changed'
  | 'message_sent'
  | 'parts_ordered'
  | 'parts_received'
  | 'completed'
  | 'note_added';

export interface JobActivity {
  id: string;
  jobId: string;
  type: JobActivityType;
  timestamp: string;
  userId: string;
  userName?: string; // Cached for display
  details?: {
    oldValue?: string;
    newValue?: string;
    description?: string;
    messageId?: string;
    partsData?: any;
  };
}

// Audit Log Types
export type AuditAction =
  | 'created'
  | 'status_changed'
  | 'assigned'
  | 'reassigned'
  | 'parts_updated'
  | 'completed'
  | 'deleted'
  | 'field_updated';

export interface AuditLog {
  id: string;
  jobId: string;
  userId: string;
  userName?: string; // Cached user name
  action: AuditAction;
  fieldChanged?: string;
  oldValue?: any;
  newValue?: any;
  summary: string; // Human-readable summary
  timestamp: string;
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
  };
}

// Customer Intelligence Types
export type RecurringPattern = 'monthly' | 'quarterly' | 'biannual' | 'random';

export interface RecurringIssue {
  category: string;
  occurrences: number;
  lastOccurrenceDate: string;
  daysAgo: number;
  pattern: RecurringPattern;
}

export interface CustomerIntelligence {
  customerPhone: string;
  customerName: string;
  totalJobs: number;
  recurringIssues: RecurringIssue[];
  averageServiceInterval: number; // days
  lastServiceDate: string;
  nextRecommendedService?: string;
  commonProblems: Array<{ description: string; frequency: number }>;
}

// Message Template Types
export type TemplateCategory = 'status' | 'greeting' | 'issue' | 'parts' | 'scheduling' | 'payment' | 'diagnostic' | 'follow_up' | 'approval';

export interface MessageTemplate {
  id: string;
  text: string;
  category: TemplateCategory;
  availableRoles: UserRole[];
  translationKey?: string; // Optional i18n key
}

// Parts & Services Management Types

export type PartUnit = 'piece' | 'liter' | 'meter' | 'kilogram' | 'set';
export type PricingType = 'hourly' | 'fixed';
export type SkillLevel = 'junior' | 'senior' | 'specialist';
export type StockTransactionType = 'purchase' | 'usage' | 'adjustment' | 'return';

export interface PartSupplier {
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  website?: string;
  notes?: string;
}

export interface Part {
  id: string;

  // Basic Info
  partNumber: string; // Internal SKU or manufacturer part number
  name: string;
  description?: string;
  category: string; // Links to fault categories or custom

  // Inventory
  stockQuantity: number;
  minStockLevel: number; // Alert when below this
  maxStockLevel: number; // Recommended max
  unit: PartUnit;
  location?: string; // Shelf/bin location

  // Pricing
  costPrice: number; // Purchase price from supplier
  sellingPrice: number; // Price charged to customer
  markup: number; // Percentage calculated
  taxRate: number; // VAT/Tax rate

  // Supplier
  primarySupplier?: PartSupplier;
  alternativeSuppliers?: PartSupplier[];

  // Metadata
  isActive: boolean;
  imageUrl?: string;
  barcode?: string;
  notes?: string;

  // Tracking
  lastRestocked?: string;
  lastUsed?: string;
  totalUsageCount: number;

  // Audit
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
}

export interface Service {
  id: string;

  // Basic Info
  serviceCode: string; // e.g., "SRV-001"
  name: string;
  description?: string;
  category: string;

  // Pricing
  pricingType: PricingType;
  hourlyRate?: number; // For hourly services
  fixedPrice?: number; // For fixed-price services
  estimatedDuration?: number; // In hours
  taxRate: number;

  // Details
  skillLevel?: SkillLevel; // Which mechanic level can perform this
  includesParts: boolean; // Whether parts are included in price

  // Metadata
  isActive: boolean;
  imageUrl?: string;
  notes?: string;

  // Tracking
  timesPerformed: number; // Usage counter
  averageActualDuration?: number; // Real average from jobs

  // Audit
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
}

export interface StockTransaction {
  id: string;
  partId: string;
  partName: string; // Denormalized for easy display

  type: StockTransactionType;
  quantity: number; // Positive for additions, negative for usage

  // Related entities
  jobId?: string; // If used in a job
  supplierId?: string;
  invoiceNumber?: string; // Supplier invoice

  // Pricing
  costPerUnit?: number;
  totalCost?: number;

  // Details
  reason?: string; // For adjustments
  notes?: string;

  // Audit
  performedBy: string;
  performedAt: string;
}

export interface JobPart {
  partId: string;
  partName: string; // Denormalized
  partNumber: string; // Denormalized
  quantity: number;
  costPrice: number; // What it cost us
  sellingPrice: number; // What we charge
  totalCost: number; // quantity * sellingPrice
}

export interface JobService {
  serviceId: string;
  serviceName: string; // Denormalized
  serviceCode: string; // Denormalized
  quantity: number; // Usually 1, but can be hours for hourly services
  pricePerUnit: number;
  totalPrice: number; // quantity * pricePerUnit
}

// Work Order Data - Staged diagnostic and quote system
export interface WorkOrderItem {
  id: string;
  serviceId?: string;
  serviceName: string;
  serviceCode?: string;
  description: string;
  isImmediate: boolean;
  isCustom: boolean; // true = manually added, not from catalog
  durationHours: number;
  pricePerHour?: number;
  fixedPrice?: number;
}

export interface WorkOrderFinding {
  id: string;
  description: string;
  requiresReplacement: boolean;
  inStock?: boolean; // defaults to true
}

export interface WorkOrderPart {
  id: string;
  partId?: string;
  partName: string;
  partNumber?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  isCustom: boolean; // true = manually added, not from catalog
  needsOrdering: boolean;
}

export interface WorkOrderData {
  // Header (auto-populated)
  department?: string;
  date: string;
  vehiclePlate: string;
  vehicleMake: string;
  vehicleModel: string;
  mileage?: number;
  mechanicName: string;
  mechanicId?: string;

  // Work Items (services)
  workItems: WorkOrderItem[];

  // Diagnostic Findings
  findings: WorkOrderFinding[];

  // Parts Used
  parts: WorkOrderPart[];

  // Summary
  returnTime?: string;
  urgencyPercent: number;
  laborSubtotal: number;
  partsSubtotal: number;
  discountPercent: number;
  grandTotal: number;

  // Status
  completedAt?: string;
}

// Company Settings for Quotes & Invoices
export interface CompanyAddress {
  street: string;
  city: string;
  postalCode: string;
  country: string;
}

export interface CompanySettings {
  id: string;

  // Business Identity
  companyName: string; // Trading name
  legalName?: string; // Legal registered name (if different)
  address: CompanyAddress;
  taxId: string; // VAT number / Tax ID
  registrationNumber?: string; // Company registration number

  // Contact Info
  phone: string;
  email: string;
  website?: string;

  // Branding
  logoUrl?: string;

  // Quote/Invoice Settings
  quotePrefix: string; // e.g., "QTE"
  invoicePrefix: string; // e.g., "INV"
  nextQuoteNumber: number;
  nextInvoiceNumber: number;

  // Financial Defaults
  defaultTaxRate: number; // e.g., 20 for 20%
  currency: string; // e.g., "EUR"
  defaultPaymentTermsDays: number; // e.g., 30

  // Legal Text
  termsAndConditions: string;
  quoteValidityDays: number; // e.g., 30
  invoiceFooter?: string;

  // Audit
  updatedBy: string;
  updatedAt: string;
}

// Quote Types
export type QuoteStatus = 'draft' | 'sent' | 'viewed' | 'approved' | 'rejected' | 'expired' | 'converted';

export interface QuoteLineItem {
  id: string;
  type: 'part' | 'service' | 'custom';
  referenceId?: string; // partId or serviceId
  code?: string; // partNumber or serviceCode for display on documents
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  discount: number; // Percentage: 0-100
  subtotal: number; // quantity * unitPrice
  discountAmount: number; // subtotal * (discount / 100)
  taxAmount: number; // (subtotal - discountAmount) * taxRate
  total: number; // subtotal - discountAmount + taxAmount
}

export interface QuoteCustomerSnapshot {
  name: string;
  email?: string;
  phone: string;
  address?: string;
  postCode?: string;
  region?: string;
}

export interface QuoteVehicleSnapshot {
  brand: string;
  model: string;
  year: number;
  licensePlate: string;
  vin?: string;
}

export interface Quote {
  id: string;
  quoteNumber: string; // e.g., "QTE-2026-001"

  // References
  jobId: string;
  customerId?: string;
  vehicleId?: string;

  // Snapshots (immutable after creation)
  customer: QuoteCustomerSnapshot;
  vehicle: QuoteVehicleSnapshot;

  // Financial
  lineItems: QuoteLineItem[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  grandTotal: number;
  currency: string;

  // Validity
  issueDate: string;
  validUntil: string;

  // Status
  status: QuoteStatus;
  sentAt?: string;
  viewedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  convertedAt?: string;

  // Signature (for approved quotes)
  signatureDataUrl?: string;
  signatureIpAddress?: string;
  signatureTimestamp?: string;

  // Notes
  notes?: string; // Internal notes
  customerNotes?: string; // Visible to customer

  // PDF
  pdfUrl?: string;

  // Public access token
  publicToken: string;

  // Audit
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
}

// Invoice Types
export type InvoiceStatus = 'unpaid' | 'partial' | 'paid' | 'overdue' | 'cancelled';
export type PaymentMethod = 'cash' | 'card' | 'bank_transfer' | 'check' | 'other';

export interface PaymentRecord {
  id: string;
  amount: number;
  method: PaymentMethod;
  reference?: string;
  paidAt: string;
  recordedBy: string;
  notes?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string; // e.g., "INV-2026-001"

  // References
  quoteId?: string;
  jobId: string;
  customerId?: string;
  vehicleId?: string;

  // Snapshots
  customer: QuoteCustomerSnapshot;
  vehicle: QuoteVehicleSnapshot;

  // Financial
  lineItems: QuoteLineItem[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  grandTotal: number;
  currency: string;

  // Payment
  issueDate: string;
  dueDate: string;
  paymentTermsDays: number;
  paymentStatus: InvoiceStatus;
  payments: PaymentRecord[];
  paidAmount: number;
  remainingAmount: number;

  // Notes
  notes?: string;

  // PDF
  pdfUrl?: string;

  // Audit
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
}
