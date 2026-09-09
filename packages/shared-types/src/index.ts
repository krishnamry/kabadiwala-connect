export type Role = 'CITIZEN' | 'KABADIWALA' | 'RECYCLER' | 'ADMIN';

export type PickupStatus = 'REQUESTED' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface User {
  id: string;
  name: string;
  phone: string;
  role: Role;
  createdAt: string;
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
  user?: User;
}

export interface ScrapItem {
  id?: string;
  pickupId?: string;
  category: string; // "Plastic" | "Paper" | "E-waste" | "Metal" | "Glass" | "Organic"
  estWeightKg: number;
  actualWeightKg?: number;
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
  items: ScrapItem[];
  totalAmount?: number | null;
  createdAt: string;
  notes?: string;
  verificationOtp?: string;
  isVerified?: boolean;
  verifiedAt?: string;
  traceabilityHash?: string;
}

export interface Transaction {
  id: string;
  pickupId: string;
  amount: number;
  kabadiwalaId: string;
  status: 'PENDING' | 'PAID' | 'FAILED';
  createdAt: string;
  pickup?: Pickup;
}

export interface ScrapRate {
  category: string;
  ratePerKg: number;
  unit: string;
  description: string;
  badge?: string;
  icon?: string;
}

export interface AdminStats {
  totalKg: number;
  activeKabadiwalas: number;
  verifiedPercent: number;
  totalRevenue: number;
  categoryBreakdown: {
    category: string;
    kg: number;
    revenue: number;
  }[];
  monthlyTrends?: {
    date: string;
    pickups: number;
    kg: number;
  }[];
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface MLClassificationResult {
  category: string;
  confidence: number;
  estRate: number;
  advice?: string;
}

export interface LotBid {
  id: string;
  recyclerId: string;
  recyclerName: string;
  bidAmount: number;
  bidPerKg: number;
  createdAt: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
}

export interface EWasteLotItem {
  id?: string;
  category: string;
  weightKg: number;
  ratePerKg: number;
  subtotal?: number;
}

export interface EWasteLot {
  id: string;
  lotCode: string;
  collectorId: string;
  collectorName: string;
  category: string;
  approxWeightKg: number;
  estimatedValue: number;
  askingPrice?: number;
  minBidAmount?: number;
  recyclerOfferedRate: number;
  status: 'DRAFT' | 'AVAILABLE' | 'REQUESTED' | 'BIDDING' | 'HANDOVER_PENDING' | 'CONFIRMED' | 'REJECTED';
  bids?: LotBid[];
  highestBid?: number;
  winningBid?: LotBid;
  imageUrl?: string;
  gpsLat: number;
  gpsLng: number;
  locationAddress?: string;
  locationZone?: string;
  createdAt: string;
  confirmedAt?: string;
  recyclerId?: string;
  recyclerName?: string;
  qrCode: string;
  isOfflineQueued?: boolean;
  traceabilityHash?: string;
  weighbridgeOperatorId?: string;
  verifiedAtWeighbridge?: boolean;
  isCustomLot?: boolean;
  items?: EWasteLotItem[];
}
