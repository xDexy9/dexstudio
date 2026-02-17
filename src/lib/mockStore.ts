import {
  User, Vehicle, Job, Message, Customer, Notification, UserSettings,
  Part, Service, StockTransaction, Quote, Invoice, CompanySettings,
  JobActivity, AuditLog
} from './types';

// ─── ID GENERATOR ────────────────────────────────────────────────────────────
export const genId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// ─── DEMO USERS ──────────────────────────────────────────────────────────────
const DEMO_USERS: (User & { password: string })[] = [
  {
    id: 'user-manager-001',
    email: 'manager@garage.com',
    password: 'manager123',
    fullName: 'Carlos Manager',
    role: 'manager',
    preferredLanguage: 'en',
    createdAt: '2025-01-01T08:00:00.000Z',
  },
  {
    id: 'user-office-001',
    email: 'sarah@garage.com',
    password: 'office123',
    fullName: 'Sarah Johnson',
    role: 'office_staff',
    preferredLanguage: 'en',
    createdAt: '2025-01-02T08:00:00.000Z',
  },
  {
    id: 'user-mech-001',
    email: 'pierre@garage.com',
    password: 'mech123',
    fullName: 'Pierre Dupont',
    role: 'mechanic',
    preferredLanguage: 'fr',
    createdAt: '2025-01-03T08:00:00.000Z',
  },
  {
    id: 'user-mech-002',
    email: 'ion@garage.com',
    password: 'mech123',
    fullName: 'Ion Popescu',
    role: 'mechanic',
    preferredLanguage: 'ro',
    createdAt: '2025-01-04T08:00:00.000Z',
  },
  {
    id: 'user-mech-003',
    email: 'joao@garage.com',
    password: 'mech123',
    fullName: 'João Silva',
    role: 'mechanic',
    preferredLanguage: 'pt',
    createdAt: '2025-01-05T08:00:00.000Z',
  },
];

// ─── DEMO CUSTOMERS ───────────────────────────────────────────────────────────
const DEMO_CUSTOMERS: Customer[] = [
  {
    id: 'cust-001', name: 'John Smith', phone: '+44 7911 123456',
    email: 'john.smith@email.com', postCode: 'SW1A 1AA', region: 'London',
    createdAt: '2025-10-01T09:00:00.000Z',
  },
  {
    id: 'cust-002', name: 'Marie Dubois', phone: '+33 6 12 34 56 78',
    email: 'marie.dubois@email.fr', postCode: '75001', region: 'Paris',
    createdAt: '2025-10-05T10:00:00.000Z',
  },
  {
    id: 'cust-003', name: 'Alexandru Ionescu', phone: '+40 722 334 455',
    email: 'alex.ionescu@email.ro', postCode: '010101', region: 'Bucharest',
    createdAt: '2025-10-10T11:00:00.000Z',
  },
  {
    id: 'cust-004', name: 'Emily Clarke', phone: '+44 7800 654321',
    email: 'emily.clarke@email.com', postCode: 'M1 1AA', region: 'Manchester',
    createdAt: '2025-11-01T08:30:00.000Z',
  },
  {
    id: 'cust-005', name: 'Marco Rossi', phone: '+39 347 1234567',
    email: 'marco.rossi@email.it', postCode: '20100', region: 'Milan',
    createdAt: '2025-11-15T09:00:00.000Z',
  },
];

// ─── DEMO VEHICLES ────────────────────────────────────────────────────────────
const DEMO_VEHICLES: Vehicle[] = [
  {
    id: 'veh-001', brand: 'BMW', model: '3 Series', year: 2020,
    licensePlate: 'AB12 CDE', vin: 'WBA8E9G58GNT09850', color: 'Midnight Blue',
    fuelType: 'petrol', mileage: 45000, customerId: 'cust-001',
    createdAt: '2025-10-01T09:00:00.000Z',
  },
  {
    id: 'veh-002', brand: 'Renault', model: 'Clio', year: 2019,
    licensePlate: 'AB-123-CD', vin: 'VF1R9800564382910', color: 'Red',
    fuelType: 'diesel', mileage: 62000, customerId: 'cust-002',
    createdAt: '2025-10-05T10:00:00.000Z',
  },
  {
    id: 'veh-003', brand: 'Dacia', model: 'Logan', year: 2021,
    licensePlate: 'B 345 XYZ', vin: 'UU1LSDAUHBZ123456', color: 'White',
    fuelType: 'lpg', mileage: 30000, customerId: 'cust-003',
    createdAt: '2025-10-10T11:00:00.000Z',
  },
  {
    id: 'veh-004', brand: 'Ford', model: 'Focus', year: 2022,
    licensePlate: 'EF34 GHI', vin: 'WF0WXXGCDW1A00001', color: 'Silver',
    fuelType: 'petrol', mileage: 18000, customerId: 'cust-004',
    createdAt: '2025-11-01T08:30:00.000Z',
  },
  {
    id: 'veh-005', brand: 'Fiat', model: '500', year: 2023,
    licensePlate: 'MI 456 CD', vin: 'ZFA3120000J100001', color: 'Yellow',
    fuelType: 'electric', mileage: 9500, customerId: 'cust-005',
    createdAt: '2025-11-15T09:00:00.000Z',
  },
];

// ─── DEMO JOBS ────────────────────────────────────────────────────────────────
const DEMO_JOBS: Job[] = [
  {
    id: 'job-001', jobNumber: 'A1B2C3',
    vehicleId: 'veh-001', vehicleLicensePlate: 'AB12 CDE', vehicleBrand: 'BMW',
    vehicleModel: '3 Series', vehicleYear: 2020, vehicleFuelType: 'petrol', vehicleMileage: 45000,
    customerId: 'cust-001', customerName: 'John Smith', customerPhone: '+44 7911 123456',
    customerEmail: 'john.smith@email.com',
    problemDescription: 'Full service + brake pads replacement needed. Customer reported squeaking noise when braking.',
    problemDescriptionLanguage: 'en', priority: 'urgent', serviceType: 'maintenance',
    faultCategory: 'brakes,fluids', status: 'in_progress',
    assignedMechanicId: 'user-mech-001', assignedAt: '2026-02-10T08:00:00.000Z',
    scheduledDate: '2026-02-17T09:00:00.000Z', estimatedDuration: 180,
    createdBy: 'user-office-001', createdAt: '2026-02-10T07:30:00.000Z',
    updatedAt: '2026-02-10T08:00:00.000Z', version: 2,
  },
  {
    id: 'job-002', jobNumber: 'D4E5F6',
    vehicleId: 'veh-002', vehicleLicensePlate: 'AB-123-CD', vehicleBrand: 'Renault',
    vehicleModel: 'Clio', vehicleYear: 2019, vehicleFuelType: 'diesel', vehicleMileage: 62000,
    customerId: 'cust-002', customerName: 'Marie Dubois', customerPhone: '+33 6 12 34 56 78',
    customerEmail: 'marie.dubois@email.fr',
    problemDescription: 'Engine warning light on. Possible injector issue. Check timing belt.',
    problemDescriptionLanguage: 'fr', priority: 'normal', serviceType: 'diagnostic',
    faultCategory: 'engine', status: 'waiting_for_parts',
    assignedMechanicId: 'user-mech-002', assignedAt: '2026-02-12T09:00:00.000Z',
    scheduledDate: '2026-02-18T10:00:00.000Z', estimatedDuration: 240,
    createdBy: 'user-manager-001', createdAt: '2026-02-12T08:00:00.000Z',
    updatedAt: '2026-02-13T14:00:00.000Z', version: 3,
  },
  {
    id: 'job-003', jobNumber: 'G7H8I9',
    vehicleId: 'veh-003', vehicleLicensePlate: 'B 345 XYZ', vehicleBrand: 'Dacia',
    vehicleModel: 'Logan', vehicleYear: 2021, vehicleFuelType: 'lpg', vehicleMileage: 30000,
    customerId: 'cust-003', customerName: 'Alexandru Ionescu', customerPhone: '+40 722 334 455',
    customerEmail: 'alex.ionescu@email.ro',
    problemDescription: 'Annual inspection and oil change. Tyre rotation requested.',
    problemDescriptionLanguage: 'ro', priority: 'low', serviceType: 'inspection',
    faultCategory: 'fluids,tyres', status: 'not_started',
    scheduledDate: '2026-02-20T08:00:00.000Z', estimatedDuration: 90,
    createdBy: 'user-office-001', createdAt: '2026-02-15T11:00:00.000Z',
    updatedAt: '2026-02-15T11:00:00.000Z', version: 1,
  },
  {
    id: 'job-004', jobNumber: 'J1K2L3',
    vehicleId: 'veh-004', vehicleLicensePlate: 'EF34 GHI', vehicleBrand: 'Ford',
    vehicleModel: 'Focus', vehicleYear: 2022, vehicleFuelType: 'petrol', vehicleMileage: 18000,
    customerId: 'cust-004', customerName: 'Emily Clarke', customerPhone: '+44 7800 654321',
    customerEmail: 'emily.clarke@email.com',
    problemDescription: 'AC not cooling. Suspected refrigerant leak and compressor check needed.',
    problemDescriptionLanguage: 'en', priority: 'normal', serviceType: 'repair',
    faultCategory: 'ac_heating', status: 'ready_for_pickup',
    assignedMechanicId: 'user-mech-003', assignedAt: '2026-02-08T10:00:00.000Z',
    scheduledDate: '2026-02-09T09:00:00.000Z', estimatedDuration: 120,
    createdBy: 'user-office-001', createdAt: '2026-02-08T09:30:00.000Z',
    updatedAt: '2026-02-16T15:00:00.000Z', version: 5,
  },
  {
    id: 'job-005', jobNumber: 'M4N5O6',
    vehicleId: 'veh-005', vehicleLicensePlate: 'MI 456 CD', vehicleBrand: 'Fiat',
    vehicleModel: '500', vehicleYear: 2023, vehicleFuelType: 'electric', vehicleMileage: 9500,
    customerId: 'cust-005', customerName: 'Marco Rossi', customerPhone: '+39 347 1234567',
    customerEmail: 'marco.rossi@email.it',
    problemDescription: 'Battery range significantly reduced. On-board diagnostics showing cell degradation.',
    problemDescriptionLanguage: 'en', priority: 'urgent', serviceType: 'diagnostic',
    faultCategory: 'electrical', status: 'completed',
    assignedMechanicId: 'user-mech-001', assignedAt: '2026-02-05T08:00:00.000Z',
    scheduledDate: '2026-02-05T09:00:00.000Z', estimatedDuration: 300,
    createdBy: 'user-manager-001', createdAt: '2026-02-04T16:00:00.000Z',
    updatedAt: '2026-02-07T17:00:00.000Z', completedAt: '2026-02-07T17:00:00.000Z', version: 6,
  },
  {
    id: 'job-006', jobNumber: 'P7Q8R9',
    vehicleId: 'veh-001', vehicleLicensePlate: 'AB12 CDE', vehicleBrand: 'BMW',
    vehicleModel: '3 Series', vehicleYear: 2020, vehicleFuelType: 'petrol', vehicleMileage: 44500,
    customerId: 'cust-001', customerName: 'John Smith', customerPhone: '+44 7911 123456',
    problemDescription: 'Suspension noise from front right. Check wheel bearings and struts.',
    problemDescriptionLanguage: 'en', priority: 'normal', serviceType: 'repair',
    faultCategory: 'suspension', status: 'completed',
    assignedMechanicId: 'user-mech-002', assignedAt: '2025-12-10T09:00:00.000Z',
    scheduledDate: '2025-12-11T09:00:00.000Z', estimatedDuration: 150,
    createdBy: 'user-office-001', createdAt: '2025-12-10T08:00:00.000Z',
    updatedAt: '2025-12-12T16:00:00.000Z', completedAt: '2025-12-12T16:00:00.000Z', version: 4,
  },
];

// ─── DEMO MESSAGES ────────────────────────────────────────────────────────────
const DEMO_MESSAGES: Message[] = [
  {
    id: 'msg-001', jobId: 'job-001', senderId: 'user-mech-001',
    originalText: 'Brake pads received. Starting installation now.',
    originalLanguage: 'en', translations: {},
    readBy: ['user-mech-001', 'user-office-001'],
    createdAt: '2026-02-10T09:30:00.000Z',
  },
  {
    id: 'msg-002', jobId: 'job-001', senderId: 'user-office-001',
    originalText: 'Great! Customer called asking for an update. How long until ready?',
    originalLanguage: 'en', translations: {},
    readBy: ['user-office-001'],
    createdAt: '2026-02-10T10:00:00.000Z',
  },
  {
    id: 'msg-003', jobId: 'job-001', senderId: 'user-mech-001',
    originalText: 'About 2 more hours. Also found worn rotors — do we replace?',
    originalLanguage: 'en', translations: {},
    readBy: ['user-mech-001'],
    createdAt: '2026-02-10T10:15:00.000Z',
  },
  {
    id: 'msg-004', jobId: 'job-002', senderId: 'user-mech-002',
    originalText: 'Injecteur défaillant confirmé. Besoin de la pièce de rechange.',
    originalLanguage: 'fr', translations: { en: 'Faulty injector confirmed. Need the replacement part.' },
    readBy: ['user-mech-002', 'user-manager-001'],
    createdAt: '2026-02-12T14:00:00.000Z',
  },
  {
    id: 'msg-005', jobId: 'job-004', senderId: 'user-mech-003',
    originalText: 'AC system recharged and tested. Car is ready for pickup.',
    originalLanguage: 'en', translations: {},
    readBy: ['user-mech-003', 'user-office-001'],
    createdAt: '2026-02-16T15:00:00.000Z',
  },
];

// ─── DEMO NOTIFICATIONS ───────────────────────────────────────────────────────
const DEMO_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif-001', userId: 'user-manager-001', type: 'job_created',
    title: 'New Job Created', message: 'Job A1B2C3 created for John Smith (BMW 3 Series)',
    jobId: 'job-001', read: false, createdAt: '2026-02-10T07:30:00.000Z',
  },
  {
    id: 'notif-002', userId: 'user-manager-001', type: 'job_completed',
    title: 'Job Completed', message: 'Job M4N5O6 completed — Fiat 500 (Marco Rossi)',
    jobId: 'job-005', read: false, createdAt: '2026-02-07T17:00:00.000Z',
  },
  {
    id: 'notif-003', userId: 'user-mech-001', type: 'job_assigned',
    title: 'New Job Assigned', message: 'BMW 3 Series (AB12 CDE) has been assigned to you',
    jobId: 'job-001', read: true, createdAt: '2026-02-10T08:00:00.000Z',
  },
  {
    id: 'notif-004', userId: 'user-office-001', type: 'job_status_changed',
    title: 'Job Ready for Pickup', message: 'Ford Focus (EF34 GHI) is ready for pickup',
    jobId: 'job-004', read: false, createdAt: '2026-02-16T15:00:00.000Z',
  },
];

// ─── DEMO PARTS ───────────────────────────────────────────────────────────────
const DEMO_PARTS: Part[] = [
  {
    id: 'part-001', partNumber: 'BP-BMW-001', name: 'BMW Front Brake Pads',
    description: 'OEM front brake pads for BMW 3 Series (F30)', category: 'brakes',
    stockQuantity: 8, minStockLevel: 2, maxStockLevel: 20, unit: 'set',
    location: 'Shelf A1', costPrice: 45.00, sellingPrice: 89.99, markup: 99.98, taxRate: 20,
    primarySupplier: { name: 'AutoParts Pro', phone: '+44 20 1234 5678', email: 'orders@autopartspro.com' },
    isActive: true, totalUsageCount: 12,
    createdBy: 'user-manager-001', createdAt: '2025-06-01T08:00:00.000Z',
    updatedBy: 'user-manager-001', updatedAt: '2026-01-15T10:00:00.000Z',
  },
  {
    id: 'part-002', partNumber: 'OIL-5W30-4L', name: 'Synthetic Oil 5W-30 4L',
    description: 'Full synthetic engine oil, suitable for most petrol engines', category: 'fluids',
    stockQuantity: 25, minStockLevel: 10, maxStockLevel: 50, unit: 'liter',
    location: 'Shelf B2', costPrice: 22.00, sellingPrice: 38.00, markup: 72.73, taxRate: 20,
    primarySupplier: { name: 'LubriMax', phone: '+44 161 234 5678' },
    isActive: true, totalUsageCount: 87,
    createdBy: 'user-manager-001', createdAt: '2025-06-01T08:00:00.000Z',
    updatedBy: 'user-manager-001', updatedAt: '2026-02-01T09:00:00.000Z',
  },
  {
    id: 'part-003', partNumber: 'FILT-AIR-REN', name: 'Renault Air Filter',
    description: 'OEM air filter for Renault Clio IV', category: 'engine',
    stockQuantity: 3, minStockLevel: 5, maxStockLevel: 15, unit: 'piece',
    location: 'Shelf C3', costPrice: 12.00, sellingPrice: 24.99, markup: 108.25, taxRate: 20,
    primarySupplier: { name: 'EuroParts', email: 'stock@europarts.eu' },
    isActive: true, totalUsageCount: 23,
    createdBy: 'user-manager-001', createdAt: '2025-07-01T08:00:00.000Z',
    updatedBy: 'user-manager-001', updatedAt: '2026-01-20T11:00:00.000Z',
  },
];

// ─── DEMO SERVICES ────────────────────────────────────────────────────────────
const DEMO_SERVICES: Service[] = [
  {
    id: 'svc-001', serviceCode: 'SRV-001', name: 'Full Service', category: 'maintenance',
    description: 'Complete vehicle service including oil change, filter replacement, and safety check',
    pricingType: 'fixed', fixedPrice: 149.99, estimatedDuration: 2, taxRate: 20,
    skillLevel: 'junior', includesParts: false, isActive: true, timesPerformed: 45,
    createdBy: 'user-manager-001', createdAt: '2025-06-01T08:00:00.000Z',
    updatedBy: 'user-manager-001', updatedAt: '2026-01-01T08:00:00.000Z',
  },
  {
    id: 'svc-002', serviceCode: 'SRV-002', name: 'Brake Inspection & Replacement', category: 'brakes',
    description: 'Inspect brake system and replace pads/discs as needed',
    pricingType: 'hourly', hourlyRate: 75.00, estimatedDuration: 2.5, taxRate: 20,
    skillLevel: 'senior', includesParts: false, isActive: true, timesPerformed: 38,
    createdBy: 'user-manager-001', createdAt: '2025-06-01T08:00:00.000Z',
    updatedBy: 'user-manager-001', updatedAt: '2026-01-01T08:00:00.000Z',
  },
  {
    id: 'svc-003', serviceCode: 'SRV-003', name: 'Diagnostic Scan', category: 'diagnostic',
    description: 'Full computer diagnostic scan with report',
    pricingType: 'fixed', fixedPrice: 49.99, estimatedDuration: 0.5, taxRate: 20,
    skillLevel: 'junior', includesParts: false, isActive: true, timesPerformed: 112,
    createdBy: 'user-manager-001', createdAt: '2025-06-01T08:00:00.000Z',
    updatedBy: 'user-manager-001', updatedAt: '2026-01-01T08:00:00.000Z',
  },
];

// ─── DEMO JOB ACTIVITIES ──────────────────────────────────────────────────────
const DEMO_ACTIVITIES: JobActivity[] = [
  {
    id: 'act-001', jobId: 'job-001', type: 'created', userId: 'user-office-001',
    userName: 'Sarah Johnson', timestamp: '2026-02-10T07:30:00.000Z',
    details: { description: 'Job created for John Smith' },
  },
  {
    id: 'act-002', jobId: 'job-001', type: 'assigned', userId: 'user-manager-001',
    userName: 'Carlos Manager', timestamp: '2026-02-10T08:00:00.000Z',
    details: { newValue: 'Pierre Dupont', description: 'Assigned to Pierre Dupont' },
  },
  {
    id: 'act-003', jobId: 'job-001', type: 'status_changed', userId: 'user-mech-001',
    userName: 'Pierre Dupont', timestamp: '2026-02-10T09:00:00.000Z',
    details: { oldValue: 'not_started', newValue: 'in_progress', description: 'Status changed to In Progress' },
  },
  {
    id: 'act-004', jobId: 'job-005', type: 'completed', userId: 'user-mech-001',
    userName: 'Pierre Dupont', timestamp: '2026-02-07T17:00:00.000Z',
    details: { description: 'Job marked as completed' },
  },
];

// ─── DEMO AUDIT LOGS ──────────────────────────────────────────────────────────
const DEMO_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'audit-001', jobId: 'job-001', userId: 'user-office-001', userName: 'Sarah Johnson',
    action: 'created', summary: 'Sarah Johnson created this job', timestamp: '2026-02-10T07:30:00.000Z',
  },
  {
    id: 'audit-002', jobId: 'job-001', userId: 'user-manager-001', userName: 'Carlos Manager',
    action: 'assigned', summary: 'Carlos Manager assigned job to Pierre Dupont',
    fieldChanged: 'mechanicId', newValue: 'Pierre Dupont', timestamp: '2026-02-10T08:00:00.000Z',
  },
];

// ─── COMPANY SETTINGS ─────────────────────────────────────────────────────────
const DEFAULT_COMPANY_SETTINGS: CompanySettings = {
  id: 'default',
  companyName: 'GaragePro Demo',
  legalName: 'GaragePro Services Ltd',
  address: { street: '42 Motor Lane', city: 'London', postalCode: 'SW1A 2AA', country: 'United Kingdom' },
  taxId: 'GB123456789',
  registrationNumber: '12345678',
  phone: '+44 20 7123 4567',
  email: 'hello@garagepro.demo',
  website: 'https://garagepro.demo',
  quotePrefix: 'QTE',
  invoicePrefix: 'INV',
  nextQuoteNumber: 5,
  nextInvoiceNumber: 5,
  defaultTaxRate: 20,
  currency: 'GBP',
  defaultPaymentTermsDays: 30,
  quoteValidityDays: 30,
  termsAndConditions: `Terms and Conditions:\n\n1. QUOTATION VALIDITY\nThis quotation is valid for 30 days from the date of issue.\n\n2. PAYMENT TERMS\nPayment is due within 30 days from the invoice date.\n\n3. WARRANTY\nAll repairs are covered by a 12-month warranty on parts and labor.\n\n4. AUTHORIZATION\nBy approving this quote, you authorize us to perform the work described above.`,
  updatedBy: 'user-manager-001',
  updatedAt: '2026-02-01T08:00:00.000Z',
};

// ─── USER SETTINGS ────────────────────────────────────────────────────────────
const DEFAULT_USER_SETTINGS: Omit<UserSettings, 'userId'> = {
  notifyJobCreated: true,
  notifyJobAssigned: true,
  notifyJobStatusChanged: true,
  notifyJobCompleted: true,
  notifyNewMessage: true,
  notifyPartsStatusChanged: true,
  preferredLanguage: 'en',
  updatedAt: new Date().toISOString(),
};

// ─── IN-MEMORY STORE ──────────────────────────────────────────────────────────
interface Store {
  users: (User & { password: string })[];
  customers: Customer[];
  vehicles: Vehicle[];
  jobs: Job[];
  messages: Message[];
  notifications: Notification[];
  parts: Part[];
  services: Service[];
  stockTransactions: StockTransaction[];
  quotes: Quote[];
  invoices: Invoice[];
  activities: JobActivity[];
  auditLogs: AuditLog[];
  userSettings: Record<string, UserSettings>;
  companySettings: CompanySettings;
}

const STORAGE_KEY = 'garagepro_store';

function loadStore(): Store {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Always merge demo users in so they are always available
      const savedIds = new Set(parsed.users?.map((u: User) => u.id) || []);
      const missingDemoUsers = DEMO_USERS.filter(u => !savedIds.has(u.id));
      return { ...parsed, users: [...missingDemoUsers, ...(parsed.users || [])] };
    }
  } catch {
    // ignore
  }
  return {
    users: [...DEMO_USERS],
    customers: [...DEMO_CUSTOMERS],
    vehicles: [...DEMO_VEHICLES],
    jobs: [...DEMO_JOBS],
    messages: [...DEMO_MESSAGES],
    notifications: [...DEMO_NOTIFICATIONS],
    parts: [...DEMO_PARTS],
    services: [...DEMO_SERVICES],
    stockTransactions: [],
    quotes: [],
    invoices: [],
    activities: [...DEMO_ACTIVITIES],
    auditLogs: [...DEMO_AUDIT_LOGS],
    userSettings: {},
    companySettings: { ...DEFAULT_COMPANY_SETTINGS },
  };
}

export const store: Store = loadStore();

export function persistStore() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // ignore
  }
}

// ─── AUTH HELPERS ─────────────────────────────────────────────────────────────
export function findUserByEmail(email: string) {
  return store.users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
}

export function findUserByEmailAndPassword(email: string, password: string) {
  return store.users.find(
    u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
  ) || null;
}

export function addUserToStore(user: User & { password: string }) {
  store.users.push(user);
  persistStore();
}

export function updateUserInStore(userId: string, updates: Partial<User>) {
  const idx = store.users.findIndex(u => u.id === userId);
  if (idx !== -1) {
    store.users[idx] = { ...store.users[idx], ...updates };
    persistStore();
  }
}

export { DEFAULT_USER_SETTINGS };
