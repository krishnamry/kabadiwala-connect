export type Role = 'CITIZEN' | 'KABADIWALA' | 'RECYCLER' | 'ADMIN' | 'COLLECTOR' | 'REGULATORY' | 'citizen' | 'collector' | 'recycler' | 'regulatory';

export type PickupStatus = 'REQUESTED' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface User {
  id: string;
  name: string;
  phone: string;
  role: Role;
  email?: string;
  address?: string;
  kycStatus?: 'UNVERIFIED' | 'UNDER_REVIEW' | 'VERIFIED' | 'REJECTED';
  kycDocuments?: any;
  createdAt?: string;
  kabadiwala?: KabadiwalaProfile | null;
  recycler?: RecyclerProfile | null;
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

export interface RecyclerProfile {
  id: string;
  facilityName: string;
  cpcbRegNumber: string;
  statePcb: string;
  latitude: number;
  longitude: number;
  address: string;
  materialsAccepted: string[];
  offeredRates: { [category: string]: number };
  dailyCapacityKg: number;
  pickupAvailable: boolean;
  verified: boolean;
  rating: number;
}

export interface ScrapItem {
  id?: string;
  pickupId?: string;
  category: string;
  estWeightKg: number;
  actualWeightKg?: number | null;
  ratePerKg: number;
  quantity?: number;
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
  totalItems?: number;
  totalAmount?: number | null;
  notes?: string | null;
  createdAt: string;
  distanceKm?: number;
  donatedToCsr?: boolean;
  traceabilityHash?: string;
  verificationOtp?: string;
  isVerified?: boolean;
  verifiedAt?: string;
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
  quantity?: number;
  subtotal?: number;
}

export interface EWasteLot {
  id: string;
  lotCode: string;
  collectorId: string;
  collectorName: string;
  category: string;
  approxWeightKg: number;
  totalItems?: number;
  estimatedValue: number;
  askingPrice?: number;
  minBidAmount?: number;
  recyclerOfferedRate: number;
  status: 'DRAFT' | 'AVAILABLE' | 'REQUESTED' | 'BIDDING' | 'HANDOVER_PENDING' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED';
  bids?: LotBid[];
  highestBid?: number;
  winningBid?: LotBid;
  winningBidId?: string;
  imageUrl?: string;
  gpsLat: number;
  gpsLng: number;
  locationAddress?: string;
  locationZone?: string;
  auctionDurationMins?: number;
  auctionExpiresAt?: string;
  antiSnipingExtensions?: number;
  saleTokenNumber?: string;
  saleTokenId?: string;
  finalPrice?: number;
  actualWeightKg?: number;
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

export interface SaleToken {
  id: string;
  tokenNumber: string;
  lotId: string;
  collectorId: string;
  collectorName: string;
  collectorPhone: string;
  collectorAadhaarRef?: string;
  recyclerId: string;
  recyclerName: string;
  cpcbRegNumber: string;
  category: string;
  cpcbCategoryCode?: string;
  grossWeightKg: number;
  tareWeightKg: number;
  netWeightKg: number;
  ratePerKg: number;
  totalAmount: number;
  paymentMode?: string;
  weighbridgeGpsLat?: number;
  weighbridgeGpsLng?: number;
  weighbridgeId?: string;
  operatorId?: string;
  sha256Signature?: string;
  eprCredits?: number;
  createdAt: string;
}

export interface Review {
  id: string;
  reviewerId: string;
  reviewerName?: string;
  reviewerRole?: string;
  targetUserId: string;
  targetUserName?: string;
  targetRole?: string;
  saleTokenId?: string;
  status: 'PENDING_MUTUAL' | 'REVEALED' | 'EXPIRED';
  revealedAt?: string;
  ratingOverall: number;
  ratingScaleAcc?: number;
  ratingPayoutSpd?: number;
  ratingPurity?: number;
  reviewText?: string;
  isVerifiedTrade?: boolean;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId?: string;
  senderName?: string;
  senderRole?: string;
  contextType: 'LOT' | 'PICKUP';
  contextId: string;
  text?: string;
  audioUrl?: string;
  imageUrl?: string;
  isRead?: boolean;
  createdAt: string;
}

export interface KycInfo {
  kycStatus: 'UNVERIFIED' | 'UNDER_REVIEW' | 'VERIFIED' | 'REJECTED';
  kycDocuments?: {
    documentType?: string;
    documentNumber?: string;
    documentUrl?: string;
    submittedAt?: string;
    remarks?: string;
  };
  dailyWeightLimitKg: number;
  maxLotValueInr: number;
  canInitiateAuctions: boolean;
  canReceiveDirectEscrow: boolean;
}

export interface SafetyGuidanceCard {
  id: string;
  hazardTitleEn: string;
  hazardTitleHi: string;
  hazardTitleMr: string;
  category: string;
  severity: 'CRITICAL' | 'HIGH' | 'WARNING';
  dosEn: string[];
  dosHi: string[];
  dosMr: string[];
  dontsEn: string[];
  dontsHi: string[];
  dontsMr: string[];
  spokenEn: string;
  spokenHi: string;
  spokenMr: string;
}

export interface TransactionAnomaly {
  id: string;
  lotCode: string;
  collectorName: string;
  category: string;
  weightKg: number;
  declaredValue: number;
  benchmarkValue: number;
  divergencePercent: number;
  reason: string;
  severity: 'HIGH' | 'MEDIUM';
  status: 'FLAGGED' | 'REVIEWED' | 'DISMISSED';
  flaggedAt: string;
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
  isCash?: boolean;
}

export interface ScrapRate {
  id: string;
  category: string;
  hindiName?: string;
  marathiName?: string;
  ratePerKg: number;
  weeklyDelta: number; // e.g. +15 or -8
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
  detectedItem?: string;
  confidence: number;
  estRate: number;
  advice: string;
  filename: string;
  dimensions: string;
}

