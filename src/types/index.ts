// User & Auth Types
export interface User {
  id: string;
  role: 'customer' | 'admin';
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  createdAt: string;
  notificationPreferences: NotificationPreferences;
}

export interface NotificationPreferences {
  email: boolean;
  sms: boolean;
  call: boolean;
}

// Vehicle Types
export interface Vehicle {
  id: string;
  customerId: string;
  make: string;
  model: string;
  year: number;
  plate: string;
  color?: string;
  vin?: string;
  image?: string;
  createdAt: string;
}

// Service Types
export interface Service {
  id: string;
  name: string;
  category: ServiceCategory;
  description: string;
  priceRange: string;
  estimatedTime: string;
  icon: string;
}

export type ServiceCategory = 
  | 'oil-change'
  | 'diagnostics'
  | 'brakes'
  | 'engine'
  | 'tires'
  | 'custom';

// Appointment Types
export interface Appointment {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  vehicleId: string;
  vehicle: Vehicle;
  servicesRequested: Service[];
  date: string;
  time: string;
  status: AppointmentStatus;
  jobCode: string;
  issueDescription: string;
  progressNotes: ProgressNote[];
  costEstimate?: number;
  finalBill?: Bill;
  assignedMechanic?: string;
  photos: string[];
  createdAt: string;
  updatedAt: string;
}

export type AppointmentStatus = 
  | 'pending'
  | 'approved'
  | 'in_progress'
  | 'waiting_parts'
  | 'completed'
  | 'picked_up';

export interface ProgressNote {
  id: string;
  content: string;
  author: string;
  timestamp: string;
  isPublic: boolean;
}

// Billing Types
export interface Bill {
  id: string;
  appointmentId: string;
  customerId: string;
  laborCost: number;
  partsCost: number;
  laborItems: BillItem[];
  partsItems: BillItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  paid: boolean;
  paymentMethod?: PaymentMethod;
  paidAt?: string;
  createdAt: string;
}

export interface BillItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export type PaymentMethod = 'cash' | 'card' | 'check' | 'transfer';

// Gallery Types
export interface GalleryImage {
  id: string;
  url: string;
  thumbnail: string;
  title: string;
  description?: string;
  category: 'before-after' | 'work' | 'shop' | 'team';
  beforeImage?: string;
  afterImage?: string;
  createdAt: string;
}

// Testimonial Types
export interface Testimonial {
  id: string;
  customerName: string;
  avatar?: string;
  rating: number;
  content: string;
  service: string;
  date: string;
}

// Team Member Types
export interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  avatar: string;
  specialties: string[];
  yearsExperience: number;
}

// Contact Form Types
export interface ContactInquiry {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  createdAt: string;
  read: boolean;
}

// Analytics Types
export interface DashboardStats {
  todaysAppointments: number;
  carsInService: number;
  monthlyRevenue: number;
  pendingAppointments: number;
  totalCustomers: number;
  completedThisMonth: number;
}

export interface RevenueData {
  month: string;
  revenue: number;
  appointments: number;
}

export interface ServiceBreakdown {
  name: string;
  value: number;
  color: string;
}

// Business Hours Types
export interface BusinessHours {
  day: string;
  open: string;
  close: string;
  isClosed: boolean;
}

// Notification Types
export interface AdminNotification {
  id: string;
  type: 'appointment' | 'payment' | 'reminder' | 'system';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  link?: string;
}

// Customer Notes/Loyalty Types
export interface CustomerNote {
  id: string;
  customerId: string;
  content: string;
  author: string;
  createdAt: string;
  tags: CustomerTag[];
}

export type CustomerTag = 'vip' | 'frequent' | 'new' | 'fleet' | 'commercial' | 'referred';

export interface CustomerProfile extends User {
  notes: CustomerNote[];
  tags: CustomerTag[];
  totalSpent: number;
  visitCount: number;
  lastVisit?: string;
}

// Service Reminder Types
export interface ServiceReminder {
  id: string;
  customerId: string;
  customerName: string;
  vehicleId: string;
  vehicle: Vehicle;
  serviceType: string;
  dueDate: string;
  dueMileage?: number;
  status: 'pending' | 'sent' | 'scheduled' | 'dismissed';
  lastServiceDate?: string;
  createdAt: string;
}

// Location Types
export interface GarageLocation {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  email: string;
  isMain: boolean;
  mechanics: number;
  bays: number;
}

// Payment/Invoice Types
export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  appointmentId?: string;
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  dueDate: string;
  paidAt?: string;
  paymentMethod?: PaymentMethod;
  createdAt: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

// Chat Types
export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'bot' | 'agent';
  timestamp: string;
  isTyping?: boolean;
}
