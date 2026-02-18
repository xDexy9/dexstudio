import { 
  User, 
  Vehicle, 
  Service, 
  Appointment, 
  Bill, 
  GalleryImage, 
  Testimonial, 
  TeamMember,
  DashboardStats,
  RevenueData,
  ServiceBreakdown,
  BusinessHours
} from '@/types';

// Mock Users
export const mockUsers: User[] = [
  {
    id: 'user-1',
    role: 'customer',
    name: 'John Smith',
    email: 'john.smith@email.com',
    phone: '(555) 123-4567',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop',
    createdAt: '2023-06-15',
    notificationPreferences: { email: true, sms: true, call: false }
  },
  {
    id: 'user-2',
    role: 'customer',
    name: 'Sarah Johnson',
    email: 'sarah.j@email.com',
    phone: '(555) 234-5678',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop',
    createdAt: '2023-08-20',
    notificationPreferences: { email: true, sms: false, call: true }
  },
  {
    id: 'user-3',
    role: 'customer',
    name: 'Michael Chen',
    email: 'mchen@email.com',
    phone: '(555) 345-6789',
    createdAt: '2024-01-10',
    notificationPreferences: { email: true, sms: true, call: true }
  },
  {
    id: 'admin-1',
    role: 'admin',
    name: 'Joe Martinez',
    email: 'joe@joeservice.com',
    phone: '(555) 987-6543',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
    createdAt: '2020-01-01',
    notificationPreferences: { email: true, sms: true, call: true }
  }
];

// Mock Vehicles
export const mockVehicles: Vehicle[] = [
  {
    id: 'vehicle-1',
    customerId: 'user-1',
    make: 'Toyota',
    model: 'Camry',
    year: 2021,
    plate: 'ABC-1234',
    color: 'Silver',
    createdAt: '2023-06-15'
  },
  {
    id: 'vehicle-2',
    customerId: 'user-1',
    make: 'Honda',
    model: 'CR-V',
    year: 2019,
    plate: 'XYZ-5678',
    color: 'Blue',
    createdAt: '2023-07-20'
  },
  {
    id: 'vehicle-3',
    customerId: 'user-2',
    make: 'Ford',
    model: 'F-150',
    year: 2022,
    plate: 'DEF-9012',
    color: 'Black',
    createdAt: '2023-08-20'
  },
  {
    id: 'vehicle-4',
    customerId: 'user-3',
    make: 'BMW',
    model: '3 Series',
    year: 2020,
    plate: 'GHI-3456',
    color: 'White',
    createdAt: '2024-01-10'
  }
];

// Mock Services
export const mockServices: Service[] = [
  {
    id: 'service-1',
    name: 'Oil Change & Filter',
    category: 'oil-change',
    description: 'Complete oil change with premium synthetic oil and new filter. Includes fluid top-off and multi-point inspection.',
    priceRange: '$45 - $85',
    estimatedTime: '30-45 min',
    icon: 'Droplet'
  },
  {
    id: 'service-2',
    name: 'Engine Diagnostics',
    category: 'diagnostics',
    description: 'Comprehensive computer diagnostics to identify engine issues, check error codes, and pinpoint problems accurately.',
    priceRange: '$75 - $150',
    estimatedTime: '1-2 hours',
    icon: 'Activity'
  },
  {
    id: 'service-3',
    name: 'Brake Service',
    category: 'brakes',
    description: 'Complete brake inspection, pad replacement, rotor resurfacing or replacement, and brake fluid flush.',
    priceRange: '$150 - $400',
    estimatedTime: '2-3 hours',
    icon: 'CircleStop'
  },
  {
    id: 'service-4',
    name: 'Engine Repair',
    category: 'engine',
    description: 'From minor repairs to complete engine overhauls. Our expert mechanics handle all engine-related issues.',
    priceRange: '$200 - $3000+',
    estimatedTime: '1-5 days',
    icon: 'Cog'
  },
  {
    id: 'service-5',
    name: 'Tire Services',
    category: 'tires',
    description: 'Tire rotation, balancing, alignment, repair, and replacement. We work with all major tire brands.',
    priceRange: '$25 - $200',
    estimatedTime: '30 min - 2 hours',
    icon: 'Circle'
  },
  {
    id: 'service-6',
    name: 'Custom Work',
    category: 'custom',
    description: 'Performance upgrades, custom modifications, and specialty work. Tell us your vision, we make it happen.',
    priceRange: 'Contact for quote',
    estimatedTime: 'Varies',
    icon: 'Wrench'
  }
];

// Mock Appointments
export const mockAppointments: Appointment[] = [
  {
    id: 'apt-1',
    customerId: 'user-1',
    customerName: 'John Smith',
    customerEmail: 'john.smith@email.com',
    customerPhone: '(555) 123-4567',
    vehicleId: 'vehicle-1',
    vehicle: mockVehicles[0],
    servicesRequested: [mockServices[0]],
    date: '2024-02-15',
    time: '09:00',
    status: 'completed',
    jobCode: 'JS-2024-001',
    issueDescription: 'Regular maintenance oil change',
    progressNotes: [
      { id: 'note-1', content: 'Vehicle received', author: 'Mike', timestamp: '2024-02-15T09:05:00', isPublic: true },
      { id: 'note-2', content: 'Oil change completed, all fluids topped off', author: 'Mike', timestamp: '2024-02-15T09:35:00', isPublic: true }
    ],
    costEstimate: 65,
    assignedMechanic: 'Mike Thompson',
    photos: [],
    createdAt: '2024-02-10',
    updatedAt: '2024-02-15'
  },
  {
    id: 'apt-2',
    customerId: 'user-2',
    customerName: 'Sarah Johnson',
    customerEmail: 'sarah.j@email.com',
    customerPhone: '(555) 234-5678',
    vehicleId: 'vehicle-3',
    vehicle: mockVehicles[2],
    servicesRequested: [mockServices[2], mockServices[1]],
    date: '2024-02-20',
    time: '10:30',
    status: 'in_progress',
    jobCode: 'JS-2024-002',
    issueDescription: 'Squeaking noise when braking, check engine light on',
    progressNotes: [
      { id: 'note-3', content: 'Vehicle received, starting diagnostic', author: 'Carlos', timestamp: '2024-02-20T10:35:00', isPublic: true },
      { id: 'note-4', content: 'Found worn brake pads, recommending replacement', author: 'Carlos', timestamp: '2024-02-20T11:20:00', isPublic: true },
      { id: 'note-5', content: 'Check engine light - O2 sensor needs replacement', author: 'Carlos', timestamp: '2024-02-20T11:45:00', isPublic: true }
    ],
    costEstimate: 450,
    assignedMechanic: 'Carlos Rivera',
    photos: [],
    createdAt: '2024-02-18',
    updatedAt: '2024-02-20'
  },
  {
    id: 'apt-3',
    customerId: 'user-3',
    customerName: 'Michael Chen',
    customerEmail: 'mchen@email.com',
    customerPhone: '(555) 345-6789',
    vehicleId: 'vehicle-4',
    vehicle: mockVehicles[3],
    servicesRequested: [mockServices[3]],
    date: '2024-02-22',
    time: '08:00',
    status: 'waiting_parts',
    jobCode: 'JS-2024-003',
    issueDescription: 'Engine overheating, coolant leak suspected',
    progressNotes: [
      { id: 'note-6', content: 'Diagnosed water pump failure', author: 'Joe', timestamp: '2024-02-22T09:00:00', isPublic: true },
      { id: 'note-7', content: 'OEM part ordered, ETA 2 days', author: 'Joe', timestamp: '2024-02-22T10:30:00', isPublic: true }
    ],
    costEstimate: 850,
    assignedMechanic: 'Joe Martinez',
    photos: [],
    createdAt: '2024-02-21',
    updatedAt: '2024-02-22'
  },
  {
    id: 'apt-4',
    customerId: 'user-1',
    customerName: 'John Smith',
    customerEmail: 'john.smith@email.com',
    customerPhone: '(555) 123-4567',
    vehicleId: 'vehicle-2',
    vehicle: mockVehicles[1],
    servicesRequested: [mockServices[4]],
    date: '2024-02-25',
    time: '14:00',
    status: 'pending',
    jobCode: 'JS-2024-004',
    issueDescription: 'Need tire rotation and alignment check',
    progressNotes: [],
    costEstimate: 120,
    photos: [],
    createdAt: '2024-02-23',
    updatedAt: '2024-02-23'
  }
];

// Mock Bills
export const mockBills: Bill[] = [
  {
    id: 'bill-1',
    appointmentId: 'apt-1',
    customerId: 'user-1',
    laborCost: 35,
    partsCost: 45,
    laborItems: [
      { description: 'Oil Change Labor', quantity: 1, unitPrice: 35, total: 35 }
    ],
    partsItems: [
      { description: 'Synthetic Oil (5W-30)', quantity: 5, unitPrice: 7, total: 35 },
      { description: 'Oil Filter', quantity: 1, unitPrice: 10, total: 10 }
    ],
    subtotal: 80,
    taxRate: 0.08,
    taxAmount: 6.40,
    total: 86.40,
    paid: true,
    paymentMethod: 'card',
    paidAt: '2024-02-15',
    createdAt: '2024-02-15'
  }
];

// Mock Gallery Images
export const mockGalleryImages: GalleryImage[] = [
  {
    id: 'gallery-1',
    url: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800',
    thumbnail: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=300',
    title: 'Engine Rebuild',
    description: 'Complete engine overhaul on a classic muscle car',
    category: 'work',
    createdAt: '2024-01-15'
  },
  {
    id: 'gallery-2',
    url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
    thumbnail: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300',
    title: 'Our Workshop',
    description: 'State-of-the-art facility equipped with the latest tools',
    category: 'shop',
    createdAt: '2024-01-10'
  },
  {
    id: 'gallery-3',
    url: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800',
    thumbnail: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=300',
    title: 'Brake Service',
    description: 'Professional brake pad and rotor replacement',
    category: 'work',
    createdAt: '2024-02-01'
  },
  {
    id: 'gallery-4',
    url: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800',
    thumbnail: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=300',
    title: 'Custom Paint Job',
    description: 'Before and after of a stunning custom paint restoration',
    category: 'before-after',
    createdAt: '2024-02-10'
  }
];

// Mock Testimonials
export const mockTestimonials: Testimonial[] = [
  {
    id: 'test-1',
    customerName: 'David Wilson',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop',
    rating: 5,
    content: 'Joe and his team are absolute professionals. They fixed my transmission issue that two other shops couldnt figure out. Fair prices and honest service. Highly recommend!',
    service: 'Transmission Repair',
    date: '2024-01-28'
  },
  {
    id: 'test-2',
    customerName: 'Emily Rodriguez',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop',
    rating: 5,
    content: 'Best auto shop in town! They kept me updated throughout the entire repair process. My car runs better than ever. Will definitely be back for all my car needs.',
    service: 'Engine Diagnostics',
    date: '2024-02-05'
  },
  {
    id: 'test-3',
    customerName: 'Robert Kim',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
    rating: 5,
    content: 'Quick, reliable, and affordable. Got my brakes done in under 2 hours and the price was exactly what they quoted. No surprises, just great service.',
    service: 'Brake Service',
    date: '2024-02-12'
  }
];

// Mock Team Members
export const mockTeamMembers: TeamMember[] = [
  {
    id: 'team-1',
    name: 'Joe Martinez',
    role: 'Owner & Master Mechanic',
    bio: 'With over 25 years of experience, Joe founded Joe Service with a simple mission: honest, quality auto repair. ASE Master Certified and passionate about helping customers.',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop',
    specialties: ['Engine Repair', 'Diagnostics', 'Classic Cars'],
    yearsExperience: 25
  },
  {
    id: 'team-2',
    name: 'Mike Thompson',
    role: 'Senior Technician',
    bio: 'Mike brings 15 years of dealership experience to our team. Specializing in European vehicles, he ensures every car gets the attention it deserves.',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop',
    specialties: ['European Vehicles', 'Electrical Systems', 'Oil Services'],
    yearsExperience: 15
  },
  {
    id: 'team-3',
    name: 'Carlos Rivera',
    role: 'Brake & Suspension Specialist',
    bio: 'Carlos is our go-to expert for all brake and suspension work. His precision and attention to detail ensure your vehicle stops safely every time.',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&h=300&fit=crop',
    specialties: ['Brakes', 'Suspension', 'Wheel Alignment'],
    yearsExperience: 12
  }
];

// Mock Dashboard Stats
export const mockDashboardStats: DashboardStats = {
  todaysAppointments: 8,
  carsInService: 5,
  monthlyRevenue: 24850,
  pendingAppointments: 12,
  totalCustomers: 342,
  completedThisMonth: 47
};

// Mock Revenue Data
export const mockRevenueData: RevenueData[] = [
  { month: 'Jan', revenue: 18500, appointments: 42 },
  { month: 'Feb', revenue: 22300, appointments: 51 },
  { month: 'Mar', revenue: 19800, appointments: 45 },
  { month: 'Apr', revenue: 25100, appointments: 58 },
  { month: 'May', revenue: 28400, appointments: 64 },
  { month: 'Jun', revenue: 31200, appointments: 72 },
  { month: 'Jul', revenue: 29800, appointments: 68 },
  { month: 'Aug', revenue: 27500, appointments: 62 },
  { month: 'Sep', revenue: 24200, appointments: 55 },
  { month: 'Oct', revenue: 26800, appointments: 61 },
  { month: 'Nov', revenue: 23400, appointments: 53 },
  { month: 'Dec', revenue: 21900, appointments: 48 }
];

// Mock Service Breakdown
export const mockServiceBreakdown: ServiceBreakdown[] = [
  { name: 'Oil Change', value: 35, color: 'hsl(217, 91%, 60%)' },
  { name: 'Brakes', value: 25, color: 'hsl(190, 95%, 50%)' },
  { name: 'Diagnostics', value: 20, color: 'hsl(142, 76%, 46%)' },
  { name: 'Engine', value: 12, color: 'hsl(38, 92%, 50%)' },
  { name: 'Tires', value: 8, color: 'hsl(0, 84%, 60%)' }
];

// Mock Business Hours
export const mockBusinessHours: BusinessHours[] = [
  { day: 'Monday', open: '8:00 AM', close: '6:00 PM', isClosed: false },
  { day: 'Tuesday', open: '8:00 AM', close: '6:00 PM', isClosed: false },
  { day: 'Wednesday', open: '8:00 AM', close: '6:00 PM', isClosed: false },
  { day: 'Thursday', open: '8:00 AM', close: '6:00 PM', isClosed: false },
  { day: 'Friday', open: '8:00 AM', close: '6:00 PM', isClosed: false },
  { day: 'Saturday', open: '9:00 AM', close: '4:00 PM', isClosed: false },
  { day: 'Sunday', open: '', close: '', isClosed: true }
];
