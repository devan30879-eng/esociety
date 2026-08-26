// ============================================================
// TypeScript type definitions for the entire application
// ============================================================

export type UserRole = 'admin' | 'resident' | 'security';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  flatNumber?: string;
  block?: string;
  avatar?: string;
  isActive: boolean;
  vehicleNumber?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relation: string;
  };
  createdAt: string;
}

export interface Visitor {
  _id: string;
  name: string;
  phone: string;
  purpose: 'guest' | 'delivery' | 'maintenance' | 'cab' | 'other';
  vehicleNumber?: string;
  resident: User | string;
  approvedBy?: User | string;
  status: 'pending' | 'approved' | 'denied' | 'inside' | 'exited';
  qrCode?: string;
  otp?: { code: string; expiresAt: string };
  entryTime?: string;
  exitTime?: string;
  expectedArrival?: string;
  notes?: string;
  preApproved: boolean;
  createdAt: string;
}

export interface Complaint {
  _id: string;
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in-progress' | 'resolved' | 'closed' | 'rejected';
  raisedBy: User | string;
  assignedTo?: User | string;
  flatNumber?: string;
  statusHistory: Array<{
    status: string;
    changedBy: User | string;
    note: string;
    changedAt: string;
  }>;
  resolutionNote?: string;
  resolvedAt?: string;
  rating?: number;
  createdAt: string;
}

export interface Facility {
  _id: string;
  name: string;
  description?: string;
  type: string;
  pricePerHour: number;
  capacity: number;
  openTime: string;
  closeTime: string;
  availableDays: number[];
  image?: string;
  isActive: boolean;
  amenities: string[];
  rules: string[];
  createdAt: string;
}

export interface Booking {
  _id: string;
  facility: Facility | string;
  bookedBy: User | string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  paymentStatus: 'pending' | 'paid' | 'refunded' | 'waived';
  attendees: number;
  purpose?: string;
  notes?: string;
  createdAt: string;
}

export interface Payment {
  _id: string;
  resident: User | string;
  type: 'maintenance' | 'facility_booking' | 'penalty' | 'other';
  billingPeriod?: string;
  amount: number;
  penalty: number;
  totalAmount: number;
  status: 'pending' | 'paid' | 'overdue' | 'partial' | 'waived';
  dueDate: string;
  paidAt?: string;
  paymentMethod?: string;
  invoiceNumber?: string;
  description?: string;
  flatNumber?: string;
  createdAt: string;
}

export interface Notice {
  _id: string;
  title: string;
  content: string;
  type: 'notice' | 'event' | 'poll' | 'emergency' | 'maintenance_alert';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  postedBy: User | string;
  targetRole: string;
  eventDate?: string;
  eventVenue?: string;
  pollOptions?: Array<{
    option: string;
    votes: Array<User | string>;
  }>;
  readBy?: Array<{ user: User | string; readAt: string }>;
  isActive: boolean;
  createdAt: string;
}

export interface Emergency {
  _id: string;
  title: string;
  description: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  raisedBy: User | string;
  location?: string;
  status: 'active' | 'responding' | 'resolved';
  resolvedBy?: User | string;
  resolvedAt?: string;
  resolutionNote?: string;
  createdAt: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  isAuthenticated: boolean;
}
