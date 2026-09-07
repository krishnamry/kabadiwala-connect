export type Role = 'CITIZEN' | 'KABADIWALA' | 'ADMIN';

export type PickupStatus = 'REQUESTED' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface User {
  id: string;
  name: string;
  phone: string;
  role: Role;
  createdAt?: string;
  kabadiwala?: KabadiwalaProfile | null;
}

export interface KabadiwalaProfile {
  id: string;
  userId: string;
  verified: boolean;
  reputationScore: number;
  walletBalance: number;
  latitude?: number | null;
  longitude?: number | null;
  vehicleType?: string;
  aadhaarNumber?: string;
  serviceRadiusKm?: number;
  user?: User;
  completedJobsCount?: number;
}

export interface ScrapItem {
  id?: string;
  pickupId?: string;
  category: string;
  estWeightKg: number;
  actualWeightKg?: number | null;
  ratePerKg: number;
  imageUrl?: string | null;
}

export interface Pickup {
  id: string;
  citizenId: string;
  citizen?: {
    id: string;
    name: string;
    phone: string;
  };
  kabadiwalaId?: string | null;
  kabadiwala?: {
    id: string;
    name: string;
    phone: string;
    kabadiwala?: KabadiwalaProfile | null;
  } | null;
  status: PickupStatus;
  address: string;
  latitude: number;
  longitude: number;
  scheduledAt: string;
  completedAt?: string | null;
  items: ScrapItem[];
  totalAmount?: number | null;
  notes?: string | null;
  createdAt: string;
  distanceKm?: number;
}

export interface Transaction {
  id: string;
  pickupId: string;
  amount: number;
  kabadiwalaId: string;
  status: 'PENDING' | 'PAID' | 'FAILED';
  paymentMethod?: string;
  createdAt: string;
  pickup?: Pickup;
}

export interface ScrapRate {
  id: string;
  category: string;
  ratePerKg: number;
  unit: string;
  description: string;
  badge?: string | null;
  icon?: string | null;
}

export interface AdminStats {
  totalKg: number;
  activeKabadiwalas: number;
  verifiedPercent: number;
  totalRevenue: number;
  totalPickups: number;
  requestedCount: number;
  inProgressCount: number;
  completedCount: number;
  categoryBreakdown: {
    category: string;
    kg: number;
    revenue: number;
  }[];
  environmentalImpact: {
    co2SavedKg: number;
    treesSaved: number;
    landfillDivertedKg: number;
    waterSavedLiters: number;
  };
  pickupsTimeline?: {
    date: string;
    pickups: number;
    kg: number;
  }[];
}

export interface MLClassificationResult {
  category: string;
  confidence: number;
  estRate: number;
  advice: string;
  filename: string;
  dimensions: string;
}
