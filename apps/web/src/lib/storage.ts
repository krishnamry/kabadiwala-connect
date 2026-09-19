import { User, Pickup, EWasteLot, LotBid, ScrapRate, TransactionAnomaly, AdminStats, Role, KycDocumentData, InAppNotification, ChatMessage, ChatPartner, ChatThreadSummary } from '../types';

// Storage Keys
export const STORAGE_KEYS = {
  TOKEN: 'token',
  CURRENT_USER: 'currentUser',
  USERS: 'dhatu_users',
  PICKUPS: 'dhatu_pickups',
  LOTS: 'dhatu_lots',
  PASSBOOK_TXNS: 'dhatu_passbook_txns',
  WALLET_BALANCE: 'dhatu_wallet_balance',
  RATES: 'dhatu_rates',
  COLLECTORS: 'dhatu_collectors',
  ANOMALIES: 'dhatu_anomalies',
  OFFLINE_MODE: 'dhatu_offline_mode',
  OFFLINE_LOTS: 'dhatu_offline_lots',
  LANGUAGE: 'dhatu_language',
  NOTIFICATIONS: 'dhatu_notifications',
  PASSWORDS: 'dhatu_passwords',
  CHAT_MESSAGES: 'dhatu_chat_messages'
} as const;

// Broadcast custom event for reactive in-app synchronization
export function notifyStorageChange(key: string, data?: any) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('dhatu-storage-change', { detail: { key, data } }));
  }
}

// Generic safe storage helper
export function getFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const item = localStorage.getItem(key);
    if (!item) return defaultValue;
    return JSON.parse(item) as T;
  } catch (err) {
    console.warn(`Error reading ${key} from localStorage:`, err);
    return defaultValue;
  }
}

export function saveToStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    notifyStorageChange(key, value);
  } catch (err) {
    console.warn(`Error saving ${key} to localStorage:`, err);
  }
}

// Initial Seed Data
const SEED_USERS: User[] = [
  {
    id: 'mock-citizen-1',
    name: 'Ramesh Sharma',
    phone: '9811100001',
    role: 'CITIZEN',
    kycStatus: 'VERIFIED'
  },
  {
    id: 'mock-kaba-1',
    name: 'Suresh Kumar',
    phone: '9876543210',
    role: 'KABADIWALA',
    kycStatus: 'VERIFIED',
    kycDocuments: {
      idType: 'AADHAAR',
      idNumber: '9821 4455 8921',
      submittedAt: '2026-09-10T10:00:00Z',
      verifiedAt: '2026-09-11T12:30:00Z'
    },
    kabadiwala: {
      id: 'prof-1',
      userId: 'mock-kaba-1',
      verified: true,
      reputationScore: 4.9,
      walletBalance: 14680,
      vehicleType: 'Solar Cargo Trike',
      aadhaarNumber: 'XXXX-XXXX-8921',
      serviceRadiusKm: 6.5,
      completedJobsCount: 142
    }
  },
  {
    id: 'mock-recycler-1',
    name: 'EcoRecycle Aggregators Ltd',
    phone: '9822200002',
    role: 'RECYCLER',
    kycStatus: 'VERIFIED',
    kycDocuments: {
      idType: 'PAN',
      idNumber: 'AAECE1234F',
      submittedAt: '2026-09-08T09:00:00Z',
      verifiedAt: '2026-09-09T14:00:00Z'
    },
    recycler: {
      id: 'rec-fac-01',
      facilityName: 'EcoRecycle Aggregators Ltd (Unit-II)',
      cpcbRegNumber: 'CPCB-EW-2023-DL-0881',
      statePcb: 'Delhi Pollution Control Committee (DPCC)',
      latitude: 28.5355,
      longitude: 77.2690,
      address: 'Plot 42, Okhla Phase-II Industrial Area, New Delhi - 110020',
      materialsAccepted: ['High-grade PCB', 'Copper Cables', 'Li-ion Batteries', 'CRT Glass', 'Engineering E-Plastics'],
      offeredRates: {
        'High-grade Printed Circuit Boards (PCBs)': 640,
        'Copper Cables & Insulated Wires': 480,
        'Lithium-ion Batteries': 145,
        'Electric Motors & Compressors': 95,
        'Low-grade Printed Circuit Boards (PCBs)': 180,
        'CRT Monitor Glass Unit': 12,
        'Engineering E-Plastics (ABS/HIPS)': 38,
        'LCD/LED Display Panels': 85
      },
      dailyCapacityKg: 5000,
      pickupAvailable: true,
      verified: true,
      rating: 4.9
    }
  },
  {
    id: 'mock-admin-1',
    name: 'NDMC Waste & Mines Cell',
    phone: '9999900000',
    role: 'ADMIN',
    kycStatus: 'VERIFIED'
  }
];

const SEED_PICKUPS: Pickup[] = [
  {
    id: 'p-active-01',
    citizenId: 'mock-citizen-1',
    citizen: { id: 'mock-citizen-1', name: 'Ramesh Sharma', phone: '9811100001' },
    kabadiwalaId: 'mock-kaba-1',
    kabadiwala: {
      id: 'mock-kaba-1',
      name: 'Suresh Kumar',
      phone: '9876543210',
      kabadiwala: {
        id: 'prof-1',
        userId: 'mock-kaba-1',
        vehicleType: 'Solar Cargo Trike',
        verified: true,
        reputationScore: 4.9,
        walletBalance: 14680
      }
    },
    status: 'IN_PROGRESS',
    address: 'Block D, Flat 402, Lajpat Nagar II, New Delhi',
    latitude: 28.5700,
    longitude: 77.2400,
    scheduledAt: '2026-09-08 11:30 AM',
    items: [
      { category: 'Printed Circuit Boards (PCBs)', estWeightKg: 3.5, ratePerKg: 640, quantity: 2 },
      { category: 'Copper Cables & Insulated Wires', estWeightKg: 4.0, ratePerKg: 480, quantity: 3 },
      { category: 'CRT Monitor Glass Unit', estWeightKg: 12.0, ratePerKg: 12, quantity: 1 }
    ],
    totalItems: 6,
    totalAmount: 4304,
    notes: 'Doorstep pickup requested with live tracking.',
    traceabilityHash: '0x8f4a9b2c7e103984fa55',
    verificationOtp: '4821',
    isVerified: false,
    createdAt: '2026-09-08 09:15 AM',
    distanceKm: 0.8
  },
  {
    id: 'p-comp-02',
    citizenId: 'mock-citizen-1',
    citizen: { id: 'mock-citizen-1', name: 'Ramesh Sharma', phone: '9811100001' },
    kabadiwalaId: 'mock-kaba-1',
    kabadiwala: {
      id: 'mock-kaba-1',
      name: 'Suresh Kumar',
      phone: '9876543210',
      kabadiwala: {
        id: 'prof-1',
        userId: 'mock-kaba-1',
        vehicleType: 'Solar Cargo Trike',
        verified: true,
        reputationScore: 4.9,
        walletBalance: 14680
      }
    },
    status: 'COMPLETED',
    address: 'Block D, Flat 402, Lajpat Nagar II, New Delhi',
    latitude: 28.5700,
    longitude: 77.2400,
    scheduledAt: '2026-09-01 10:00 AM',
    completedAt: '2026-09-01 10:45 AM',
    items: [
      { category: 'Lithium-ion Batteries', estWeightKg: 5.0, ratePerKg: 145, quantity: 4 },
      { category: 'LCD/LED Display Panels', estWeightKg: 8.5, ratePerKg: 85, quantity: 2 }
    ],
    totalItems: 6,
    totalAmount: 1447,
    notes: 'Safe recycling completed. Handover certificate generated.',
    traceabilityHash: '0x3c7e9184a298bf0182dd',
    verificationOtp: '3912',
    isVerified: true,
    verifiedAt: '2026-09-01 10:45 AM',
    createdAt: '2026-09-01 10:00 AM',
    distanceKm: 0.8
  },
  {
    id: 'p-open-03',
    citizenId: 'mock-citizen-2',
    citizen: { id: 'mock-citizen-2', name: 'Ananya Deshmukh', phone: '9811122334' },
    status: 'REQUESTED',
    address: 'B-14, Defence Colony Market, New Delhi',
    latitude: 28.5732,
    longitude: 77.2315,
    scheduledAt: '2026-09-08 02:00 PM',
    items: [
      { category: 'Printed Circuit Boards (PCBs)', estWeightKg: 2.5, ratePerKg: 640, quantity: 2 },
      { category: 'Electric Motors & Compressors', estWeightKg: 6.0, ratePerKg: 95, quantity: 2 }
    ],
    totalItems: 4,
    totalAmount: 2170,
    notes: '2 desktop towers, want fast pickup today.',
    traceabilityHash: '0x7e8b91a20c34567def12',
    verificationOtp: '7194',
    isVerified: false,
    createdAt: '2026-09-08 10:00 AM',
    distanceKm: 1.4
  },
  {
    id: 'p-open-04',
    citizenId: 'mock-citizen-3',
    citizen: { id: 'mock-citizen-3', name: 'Vikram Seth', phone: '9811133445' },
    status: 'REQUESTED',
    address: 'M-Block, Greater Kailash-I, New Delhi',
    latitude: 28.5520,
    longitude: 77.2380,
    scheduledAt: '2026-09-08 04:30 PM',
    items: [
      { category: 'Copper Cables & Insulated Wires', estWeightKg: 5.0, ratePerKg: 480, quantity: 3 },
      { category: 'Lithium-ion Batteries', estWeightKg: 3.0, ratePerKg: 145, quantity: 2 }
    ],
    totalItems: 5,
    totalAmount: 2835,
    notes: 'Office network cabling and laptop battery replacements.',
    traceabilityHash: '0x12a9b34c89df70123ef4',
    verificationOtp: '5520',
    isVerified: false,
    createdAt: '2026-09-08 10:30 AM',
    distanceKm: 2.8
  }
];

const SEED_LOTS: EWasteLot[] = [
  {
    id: 'lot-101',
    lotCode: 'KC-LOT-9821',
    collectorId: 'mock-kaba-1',
    collectorName: 'Suresh Kumar',
    category: 'High-grade Printed Circuit Boards (PCBs)',
    approxWeightKg: 18.5,
    totalItems: 8,
    estimatedValue: 11840,
    askingPrice: 11840,
    minBidAmount: 5920,
    recyclerOfferedRate: 640,
    status: 'BIDDING',
    gpsLat: 28.5685,
    gpsLng: 77.2412,
    locationAddress: 'Suresh Scrap Yard, Near Gate 3, Mayapuri Industrial Area Phase II, New Delhi',
    locationZone: 'Mayapuri Scrap Cluster, Delhi',
    createdAt: '2026-09-08 09:30 AM',
    qrCode: 'KBD-EWASTE-9821-IN',
    items: [
      { id: 'it-101', category: 'High-grade Printed Circuit Boards (PCBs)', weightKg: 18.5, ratePerKg: 640, quantity: 8, subtotal: 11840 }
    ],
    bids: [
      {
        id: 'bid-01',
        recyclerId: 'mock-recycler-1',
        recyclerName: 'EcoRecycle Aggregators Ltd',
        bidAmount: 11200,
        bidPerKg: 605,
        createdAt: '2026-09-08 10:00 AM',
        status: 'PENDING'
      }
    ],
    highestBid: 11200
  },
  {
    id: 'lot-102',
    lotCode: 'KC-LOT-9824',
    collectorId: 'prof-3',
    collectorName: 'Mohan Lal',
    category: 'Copper Cables & Insulated Wires',
    approxWeightKg: 24.0,
    totalItems: 12,
    estimatedValue: 11520,
    askingPrice: 11520,
    minBidAmount: 5760,
    recyclerOfferedRate: 480,
    status: 'REQUESTED',
    gpsLat: 28.5420,
    gpsLng: 77.2580,
    locationAddress: 'Mohan Scrap Depot, Plot 42, Okhla Industrial Area Phase-1, New Delhi',
    locationZone: 'Okhla Scrap Zone, Delhi',
    createdAt: '2026-09-08 10:15 AM',
    qrCode: 'KBD-EWASTE-9824-IN',
    items: [
      { id: 'it-102', category: 'Copper Cables & Insulated Wires', weightKg: 24.0, ratePerKg: 480, quantity: 12, subtotal: 11520 }
    ],
    bids: []
  },
  {
    id: 'lot-103',
    lotCode: 'KC-LOT-9830',
    collectorId: 'prof-4',
    collectorName: 'Radhe Shyam',
    category: 'Lithium-ion Batteries',
    approxWeightKg: 32.0,
    totalItems: 25,
    estimatedValue: 4640,
    askingPrice: 4640,
    minBidAmount: 2320,
    recyclerOfferedRate: 145,
    status: 'AVAILABLE',
    gpsLat: 28.5210,
    gpsLng: 77.2740,
    locationAddress: 'Radhe E-Waste Hub, Near Metro Pillar 142, Seelampur, Delhi',
    locationZone: 'Seelampur E-Waste Market, Delhi',
    createdAt: '2026-09-08 11:00 AM',
    qrCode: 'KBD-EWASTE-9830-IN',
    items: [
      { id: 'it-103', category: 'Lithium-ion Batteries', weightKg: 32.0, ratePerKg: 145, quantity: 25, subtotal: 4640 }
    ],
    bids: []
  },
  {
    id: 'lot-104',
    lotCode: 'KC-LOT-9840',
    collectorId: 'mock-kaba-1',
    collectorName: 'Suresh Kumar',
    category: 'Custom Mixed Lot (3 Materials)',
    approxWeightKg: 27.0,
    totalItems: 16,
    estimatedValue: 12885,
    askingPrice: 12885,
    minBidAmount: 6443,
    recyclerOfferedRate: 477,
    status: 'AVAILABLE',
    gpsLat: 28.5685,
    gpsLng: 77.2412,
    locationAddress: 'Suresh Scrap Yard, Near Gate 3, Mayapuri Industrial Area Phase II, New Delhi',
    locationZone: 'Mayapuri Scrap Cluster, Delhi',
    createdAt: '2026-09-08 11:30 AM',
    qrCode: 'KBD-EWASTE-9840-IN',
    isCustomLot: true,
    items: [
      { id: 'it-104-1', category: 'High-grade Printed Circuit Boards (PCBs)', weightKg: 10.0, ratePerKg: 640, quantity: 6, subtotal: 6400 },
      { id: 'it-104-2', category: 'Copper Cables & Insulated Wires', weightKg: 12.0, ratePerKg: 480, quantity: 4, subtotal: 5760 },
      { id: 'it-104-3', category: 'Lithium-ion Batteries', weightKg: 5.0, ratePerKg: 145, quantity: 6, subtotal: 725 }
    ],
    bids: []
  }
];

export interface PassbookTxn {
  id: string;
  date: string;
  ref: string;
  desc: string;
  party: string;
  type: 'CREDIT' | 'DEBIT';
  amount: number;
  paymentMode: string;
  balance: number;
  status: 'VERIFIED' | 'PENDING';
}

const SEED_TXNS: PassbookTxn[] = [
  {
    id: 'TXN-089',
    date: '2026-09-08 09:45',
    ref: 'KC-LOT-9821',
    desc: 'Handover Lot: High-grade PCB (18.5 kg)',
    party: 'EcoRecycle Aggregators (Okhla)',
    type: 'CREDIT',
    amount: 11840,
    paymentMode: 'CASH',
    balance: 14680,
    status: 'VERIFIED'
  },
  {
    id: 'TXN-088',
    date: '2026-09-07 14:15',
    ref: 'KC-PICKUP-331',
    desc: 'Household Scrap: 8kg E-Plastics + Cables',
    party: 'Ramesh Sharma (Lajpat Nagar)',
    type: 'DEBIT',
    amount: 620,
    paymentMode: 'CASH',
    balance: 2840,
    status: 'VERIFIED'
  },
  {
    id: 'TXN-087',
    date: '2026-09-06 17:30',
    ref: 'KC-LOT-9812',
    desc: 'Handover Lot: Copper Wiring (15.0 kg)',
    party: 'GreenEarth Refiners',
    type: 'CREDIT',
    amount: 7200,
    paymentMode: 'UPI Escrow',
    balance: 3460,
    status: 'VERIFIED'
  },
  {
    id: 'TXN-086',
    date: '2026-09-05 11:20',
    ref: 'KC-BONUS-04',
    desc: 'CPCB Formalization Loyalty Bonus',
    party: 'Ministry of Mines Platform Subsidy',
    type: 'CREDIT',
    amount: 500,
    paymentMode: 'Direct Bank Transfer',
    balance: 1260,
    status: 'VERIFIED'
  }
];

const SEED_RATES: ScrapRate[] = [
  {
    id: 'rate-1',
    category: 'High-grade Printed Circuit Boards (PCBs)',
    hindiName: 'सर्किट बोर्ड (मदरबोर्ड/सर्वर)',
    marathiName: 'सर्किट बोर्ड (मदरबोर्ड)',
    ratePerKg: 640,
    weeklyDelta: 25,
    unit: '₹/kg',
    description: 'Server motherboards, telecom cards, gold/tantalum-rich PCBs.',
    badge: 'HIGH VALUE'
  },
  {
    id: 'rate-2',
    category: 'Copper Cables & Insulated Wires',
    hindiName: 'तांबे के तार और केबल',
    marathiName: 'तांब्याची वायर आणि केबल्स',
    ratePerKg: 480,
    weeklyDelta: 15,
    unit: '₹/kg',
    description: 'Single/multi-core insulated power cords, network Cat6 cables.',
    badge: 'FAST TRADE'
  },
  {
    id: 'rate-3',
    category: 'Low-grade Printed Circuit Boards (PCBs)',
    hindiName: 'साधारण पीसीबी (पावर सप्लाई/टीवी)',
    marathiName: 'साधारण पीसीबी',
    ratePerKg: 180,
    weeklyDelta: -5,
    unit: '₹/kg',
    description: 'Single-sided CRT television power boards, audio amp boards.',
    badge: null
  },
  {
    id: 'rate-4',
    category: 'Lithium-ion Batteries',
    hindiName: 'लिथियम-आयन बैटरी',
    marathiName: 'लिथियम-आयन बॅटरी',
    ratePerKg: 145,
    weeklyDelta: 5,
    unit: '₹/kg',
    description: 'Laptop cells, EV battery modules, powerbank pouch cells.',
    badge: 'HAZARDOUS'
  },
  {
    id: 'rate-5',
    category: 'Electric Motors & Compressors',
    hindiName: 'मोटर और कंप्रेसर स्क्रैप',
    marathiName: 'इलेक्ट्रिक मोटर्स आणि कॉम्प्रेसर',
    ratePerKg: 95,
    weeklyDelta: 0,
    unit: '₹/kg',
    description: 'Washing machine induction motors, AC sealed compressor units.',
    badge: null
  },
  {
    id: 'rate-6',
    category: 'LCD/LED Display Panels',
    hindiName: 'एलसीडी / एलईडी डिस्प्ले स्क्रीन',
    marathiName: 'एलसीडी / एलईडी डिस्प्ले स्क्रीन',
    ratePerKg: 85,
    weeklyDelta: 10,
    unit: '₹/kg',
    description: 'Intact panel glass with driver ICs and ribbon connectors.',
    badge: null
  },
  {
    id: 'rate-7',
    category: 'Engineering E-Plastics (ABS/HIPS)',
    hindiName: 'इंजीनियरिंग प्लास्टिक चेसिस',
    marathiName: 'प्लॅस्टिक कॅबिनेट आणि कव्हर्स',
    ratePerKg: 38,
    weeklyDelta: 2,
    unit: '₹/kg',
    description: 'Flame-retardant printer housings, PC monitor back shells.',
    badge: null
  },
  {
    id: 'rate-8',
    category: 'CRT Monitor Glass Unit',
    hindiName: 'सीआरटी मॉनिटर पिक्चर ट्यूब',
    marathiName: 'सीआरटी मॉनिटर काच',
    ratePerKg: 12,
    weeklyDelta: 0,
    unit: '₹/kg',
    description: 'Leaded funnel and panel glass (Must be unbroken).',
    badge: 'HEAVY'
  }
];

const SEED_COLLECTORS = [
  {
    id: 'prof-1',
    userId: 'mock-kaba-1',
    verified: true,
    reputationScore: 4.9,
    walletBalance: 14680,
    vehicleType: 'Solar Cargo Trike',
    aadhaarNumber: 'XXXX-XXXX-8921',
    user: { name: 'Suresh Kumar', phone: '9876543210' },
    completedJobsCount: 142
  },
  {
    id: 'prof-2',
    userId: 'user-2',
    verified: false,
    reputationScore: 4.4,
    walletBalance: 3200,
    vehicleType: 'Cargo Tricycle',
    aadhaarNumber: 'XXXX-XXXX-4412',
    user: { name: 'Raju Pandit', phone: '9812345678' },
    completedJobsCount: 38
  },
  {
    id: 'prof-3',
    userId: 'user-3',
    verified: true,
    reputationScore: 4.8,
    walletBalance: 8940,
    vehicleType: 'Electric Auto',
    aadhaarNumber: 'XXXX-XXXX-9901',
    user: { name: 'Mohan Lal', phone: '9898989898' },
    completedJobsCount: 109
  }
];

const SEED_ANOMALIES: TransactionAnomaly[] = [
  {
    id: 'anom-1',
    lotCode: 'KC-LOT-9780',
    collectorName: 'Deepak Verma',
    category: 'High-grade Printed Circuit Boards (PCBs)',
    weightKg: 14.5,
    declaredValue: 14500,
    benchmarkValue: 9280,
    divergencePercent: 56.2,
    reason: 'Unit valuation ₹1,000/kg exceeds regional CPCB cap (₹640/kg) by 56%. Suspected price arbitrage anomaly.',
    severity: 'HIGH',
    status: 'FLAGGED',
    flaggedAt: '2026-09-07 16:45'
  },
  {
    id: 'anom-2',
    lotCode: 'KC-LOT-9762',
    collectorName: 'Raju Pandit',
    category: 'Lithium-ion Batteries',
    weightKg: 85.0,
    declaredValue: 12325,
    benchmarkValue: 12325,
    divergencePercent: 120.0,
    reason: 'Weight 85kg logged for single tricycle payload exceeds certified safe carrying capacity (50kg).',
    severity: 'MEDIUM',
    status: 'FLAGGED',
    flaggedAt: '2026-09-07 14:10'
  },
  {
    id: 'anom-3',
    lotCode: 'KC-LOT-9755',
    collectorName: 'Mukesh Yadav',
    category: 'CRT Monitor Glass Unit',
    weightKg: 40.0,
    declaredValue: 3800,
    benchmarkValue: 480,
    divergencePercent: 691.0,
    reason: 'Unit rate entered as ₹95/kg instead of benchmark ₹12/kg (Data entry typo flagged by Z-score filter).',
    severity: 'HIGH',
    status: 'FLAGGED',
    flaggedAt: '2026-09-06 18:20'
  }
];

const SEED_NOTIFICATIONS: InAppNotification[] = [
  // Citizen Notifications (Ramesh Sharma)
  {
    id: 'notif-cit-1',
    userId: 'mock-citizen-1',
    userRole: 'CITIZEN',
    title: 'Pickup Accepted • Suresh Kumar',
    message: 'Kabadiwala Suresh Kumar has accepted your pickup request #p-active-01. Arriving with calibrated digital scale.',
    type: 'PICKUP',
    timestamp: '15 mins ago',
    read: false,
    actionTab: 'pickups',
    entityId: 'p-active-01',
    entityType: 'PICKUP'
  },
  {
    id: 'notif-cit-2',
    userId: 'mock-citizen-1',
    userRole: 'CITIZEN',
    title: 'Collector En Route (0.8 km)',
    message: 'Solar Cargo Trike (DL-10-KBD-89) is approx 10 minutes away. Doorstep OTP: 4821.',
    type: 'PICKUP',
    timestamp: '8 mins ago',
    read: false,
    actionTab: 'pickups',
    entityId: 'p-active-01',
    entityType: 'PICKUP'
  },
  {
    id: 'notif-cit-3',
    userId: 'mock-citizen-1',
    userRole: 'CITIZEN',
    title: 'Eco-Karma Points Awarded! 🌱',
    message: 'You earned 185 Green Karma Points and offset 24.6 kg CO2 eq for your previous e-waste recycling.',
    type: 'SYSTEM',
    timestamp: '1 hour ago',
    read: false,
    actionTab: 'impact'
  },
  {
    id: 'notif-cit-4',
    userId: 'mock-citizen-1',
    userRole: 'CITIZEN',
    title: '₹4,304 Payout Credited via UPI',
    message: 'Payment for completed pickup #p-comp-02 was successfully transferred to your linked UPI ID.',
    type: 'PAYMENT',
    timestamp: '2 hours ago',
    read: true,
    actionTab: 'pickups',
    entityId: 'p-comp-02'
  },
  {
    id: 'notif-cit-5',
    userId: 'mock-citizen-1',
    userRole: 'CITIZEN',
    title: 'CPCB Green Certificate Ready',
    message: 'Official e-Waste Safe Disposal Certificate #CPCB-2026-DEL-0881 is verified and ready to download.',
    type: 'CERTIFICATE',
    timestamp: 'Yesterday',
    read: true,
    actionTab: 'impact'
  },

  // Kabadiwala Notifications (Suresh Kumar)
  {
    id: 'notif-kab-1',
    userId: 'mock-kaba-1',
    userRole: 'KABADIWALA',
    title: 'New Bid Received on Lot #KC-LOT-9821',
    message: 'EcoRecycle Aggregators Ltd placed a high bid of ₹11,200 (₹605/kg) for your High-grade PCB lot.',
    type: 'BID',
    timestamp: '10 mins ago',
    read: false,
    actionTab: 'bids',
    entityId: 'lot-101',
    entityType: 'LOT'
  },
  {
    id: 'notif-kab-2',
    userId: 'mock-kaba-1',
    userRole: 'KABADIWALA',
    title: 'New Bulk Pickup in Indiranagar (0.8 km)',
    message: 'Ramesh Sharma requested doorstep pickup for 19.5 kg high-grade scrap. Estimated payout ₹4,304.',
    type: 'PICKUP',
    timestamp: '25 mins ago',
    read: false,
    actionTab: 'pickups',
    entityId: 'p-active-01',
    entityType: 'PICKUP'
  },
  {
    id: 'notif-kab-3',
    userId: 'mock-kaba-1',
    userRole: 'KABADIWALA',
    title: 'Daily APMC Scrap Rate Revision',
    message: 'Benchmark rates updated: High-grade PCB +₹25/kg, Copper Cables +₹15/kg. Review your asking prices.',
    type: 'RATE',
    timestamp: '2 hours ago',
    read: false,
    actionTab: 'rates'
  },
  {
    id: 'notif-kab-4',
    userId: 'mock-kaba-1',
    userRole: 'KABADIWALA',
    title: 'Regulatory Trade KYC Approved! ✅',
    message: 'Your Aadhaar and informal collector registration has been verified by the State Pollution Control Board.',
    type: 'KYC',
    timestamp: 'Yesterday',
    read: true,
    actionTab: 'profile'
  },
  {
    id: 'notif-kab-5',
    userId: 'mock-kaba-1',
    userRole: 'KABADIWALA',
    title: 'Weighbridge Calibration Slot Confirmed',
    message: 'Inward weighing slot reserved at Okhla Industrial Cluster Scale-04 for today 3:30 PM.',
    type: 'LOT',
    timestamp: 'Yesterday',
    read: true,
    actionTab: 'handover'
  },

  // Recycler Notifications (EcoRecycle Aggregators Ltd)
  {
    id: 'notif-rec-1',
    userId: 'mock-recycler-1',
    userRole: 'RECYCLER',
    title: 'Bid Leading: Lot #KC-LOT-9821',
    message: 'Your bid of ₹11,200 is currently the highest offer on Suresh Kumar\'s 18.5kg High-grade PCB Lot.',
    type: 'BID',
    timestamp: '12 mins ago',
    read: false,
    actionTab: 'incoming',
    entityId: 'lot-101',
    entityType: 'LOT'
  },
  {
    id: 'notif-rec-2',
    userId: 'mock-recycler-1',
    userRole: 'RECYCLER',
    title: 'Consignment Dispatched via Solar Trike',
    message: 'Collector Suresh Kumar has initiated transit for Lot #KC-LOT-9821 to Okhla Unit-II facility. ETA 40 mins.',
    type: 'LOT',
    timestamp: '30 mins ago',
    read: false,
    actionTab: 'handover',
    entityId: 'lot-101',
    entityType: 'LOT'
  },
  {
    id: 'notif-rec-3',
    userId: 'mock-recycler-1',
    userRole: 'RECYCLER',
    title: 'Weighbridge Gross Slip Uploaded',
    message: 'Weighbridge slip #WB-OKHLA-SCALE-04 recorded 18.5 kg gross weight. Awaiting dual-key confirmation.',
    type: 'ORDER',
    timestamp: '1 hour ago',
    read: false,
    actionTab: 'handover'
  },
  {
    id: 'notif-rec-4',
    userId: 'mock-recycler-1',
    userRole: 'RECYCLER',
    title: 'MoEFCC EPR Credit Certificate Issued',
    message: 'CPCB e-Waste portal issued 18.5 recycling credits (Ref: EPR-2026-DL-0881). Available in audit log.',
    type: 'CERTIFICATE',
    timestamp: 'Yesterday',
    read: true,
    actionTab: 'reports'
  },
  {
    id: 'notif-rec-5',
    userId: 'mock-recycler-1',
    userRole: 'RECYCLER',
    title: 'New High-Purity Copper Lot Broadcasted',
    message: '24.0 kg Copper Cables & Wires listed by Mohan Lal in Mayapuri cluster. Asking rate ₹480/kg.',
    type: 'LOT',
    timestamp: 'Yesterday',
    read: true,
    actionTab: 'incoming',
    entityId: 'lot-102',
    entityType: 'LOT'
  }
];

const SEED_CHAT_MESSAGES: ChatMessage[] = [
  // --- Pickup p-active-01 Thread 1: Suresh Kumar (Collector) & Ramesh Sharma (Citizen) ---
  {
    id: 'msg-p1-1',
    senderId: 'mock-kaba-1',
    senderName: 'Suresh Kumar',
    senderRole: 'KABADIWALA',
    receiverId: 'mock-citizen-1',
    receiverName: 'Ramesh Sharma',
    receiverRole: 'CITIZEN',
    contextType: 'PICKUP',
    contextId: 'p-active-01',
    contextTitle: 'Pickup #p-active-01 (19.5kg scrap)',
    text: 'Namaste Ramesh ji! I have accepted your scrap pickup request. I am equipped with calibrated digital scales and will be arriving shortly.',
    isRead: true,
    createdAt: new Date(Date.now() - 35 * 60 * 1000).toISOString()
  },
  {
    id: 'msg-p1-2',
    senderId: 'mock-citizen-1',
    senderName: 'Ramesh Sharma',
    senderRole: 'CITIZEN',
    receiverId: 'mock-kaba-1',
    receiverName: 'Suresh Kumar',
    receiverRole: 'KABADIWALA',
    contextType: 'PICKUP',
    contextId: 'p-active-01',
    contextTitle: 'Pickup #p-active-01 (19.5kg scrap)',
    text: 'Namaste Suresh ji. Please enter through Gate 2 of Block D. The scrap is kept near the elevator on 4th floor.',
    isRead: true,
    createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString()
  },
  {
    id: 'msg-p1-3',
    senderId: 'mock-kaba-1',
    senderName: 'Suresh Kumar',
    senderRole: 'KABADIWALA',
    receiverId: 'mock-citizen-1',
    receiverName: 'Ramesh Sharma',
    receiverRole: 'CITIZEN',
    contextType: 'PICKUP',
    contextId: 'p-active-01',
    contextTitle: 'Pickup #p-active-01 (19.5kg scrap)',
    text: 'Ji bilkul! Reached near Lajpat market main signal. Arriving at your doorstep in approx 8-10 minutes with Solar Cargo Trike.',
    isRead: false,
    createdAt: new Date(Date.now() - 8 * 60 * 1000).toISOString()
  },

  // --- Pickup p-active-01 Thread 2: Rajesh Yadav (Another Collector who reached out) ---
  {
    id: 'msg-p1-4',
    senderId: 'prof-2',
    senderName: 'Rajesh Yadav',
    senderRole: 'KABADIWALA',
    receiverId: 'mock-citizen-1',
    receiverName: 'Ramesh Sharma',
    receiverRole: 'CITIZEN',
    contextType: 'PICKUP',
    contextId: 'p-active-01',
    contextTitle: 'Pickup #p-active-01 (19.5kg scrap)',
    text: 'Hello Ramesh ji, if you have additional copper cables or battery scrap, I am also available in your sector with high instant cash payout.',
    isRead: false,
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString()
  },

  // --- Lot lot-101 Thread 1: EcoRecycle Aggregators (Recycler) & Suresh Kumar (Collector) ---
  {
    id: 'msg-l1-1',
    senderId: 'mock-recycler-1',
    senderName: 'EcoRecycle Aggregators Ltd',
    senderRole: 'RECYCLER',
    receiverId: 'mock-kaba-1',
    receiverName: 'Suresh Kumar',
    receiverRole: 'KABADIWALA',
    contextType: 'LOT',
    contextId: 'lot-101',
    contextTitle: 'High-grade PCBs (18.5kg)',
    text: 'Namaste Suresh ji. We inspected your High-grade PCB lot #KC-LOT-9821. Are these server grade or mixed telecom boards?',
    isRead: true,
    createdAt: new Date(Date.now() - 40 * 60 * 1000).toISOString()
  },
  {
    id: 'msg-l1-2',
    senderId: 'mock-kaba-1',
    senderName: 'Suresh Kumar',
    senderRole: 'KABADIWALA',
    receiverId: 'mock-recycler-1',
    receiverName: 'EcoRecycle Aggregators Ltd',
    receiverRole: 'RECYCLER',
    contextType: 'LOT',
    contextId: 'lot-101',
    contextTitle: 'High-grade PCBs (18.5kg)',
    text: '100% server motherboard grade with dual gold pin sockets. No desoldering done.',
    isRead: true,
    createdAt: new Date(Date.now() - 28 * 60 * 1000).toISOString()
  },
  {
    id: 'msg-l1-3',
    senderId: 'mock-recycler-1',
    senderName: 'EcoRecycle Aggregators Ltd',
    senderRole: 'RECYCLER',
    receiverId: 'mock-kaba-1',
    receiverName: 'Suresh Kumar',
    receiverRole: 'KABADIWALA',
    contextType: 'LOT',
    contextId: 'lot-101',
    contextTitle: 'High-grade PCBs (18.5kg)',
    text: 'We placed a bid of ₹11,200. If you accept on platform, our weighbridge slot at Okhla Unit-II is open for instant intake.',
    isRead: false,
    createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString()
  },

  // --- Lot lot-101 Thread 2: Apex Metallics & Smelters (Another Recycler) ---
  {
    id: 'msg-l1-4',
    senderId: 'rec-02',
    senderName: 'Apex Metallics & Smelters',
    senderRole: 'RECYCLER',
    receiverId: 'mock-kaba-1',
    receiverName: 'Suresh Kumar',
    receiverRole: 'KABADIWALA',
    contextType: 'LOT',
    contextId: 'lot-101',
    contextTitle: 'High-grade PCBs (18.5kg)',
    text: 'Can you deliver before 5:00 PM? We can offer ₹620/kg if certified dry with no casing.',
    isRead: false,
    createdAt: new Date(Date.now() - 18 * 60 * 1000).toISOString()
  }
];

// Initialize Storage with Seed Data if not present
export function initStorage(): void {
  if (typeof window === 'undefined') return;

  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    saveToStorage(STORAGE_KEYS.USERS, SEED_USERS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.PICKUPS)) {
    saveToStorage(STORAGE_KEYS.PICKUPS, SEED_PICKUPS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.LOTS)) {
    saveToStorage(STORAGE_KEYS.LOTS, SEED_LOTS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.PASSBOOK_TXNS)) {
    saveToStorage(STORAGE_KEYS.PASSBOOK_TXNS, SEED_TXNS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.WALLET_BALANCE)) {
    localStorage.setItem(STORAGE_KEYS.WALLET_BALANCE, '14680');
  }
  if (!localStorage.getItem(STORAGE_KEYS.RATES)) {
    saveToStorage(STORAGE_KEYS.RATES, SEED_RATES);
  }
  if (!localStorage.getItem(STORAGE_KEYS.COLLECTORS)) {
    saveToStorage(STORAGE_KEYS.COLLECTORS, SEED_COLLECTORS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.ANOMALIES)) {
    saveToStorage(STORAGE_KEYS.ANOMALIES, SEED_ANOMALIES);
  }
  if (!localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) {
    saveToStorage(STORAGE_KEYS.NOTIFICATIONS, SEED_NOTIFICATIONS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.CHAT_MESSAGES)) {
    saveToStorage(STORAGE_KEYS.CHAT_MESSAGES, SEED_CHAT_MESSAGES);
  }
}

// Auto-run initialization immediately upon module load
initStorage();

// Storage Repository API
export const storage = {
  // Reset all to seed data
  resetAll: () => {
    saveToStorage(STORAGE_KEYS.USERS, SEED_USERS);
    saveToStorage(STORAGE_KEYS.PICKUPS, SEED_PICKUPS);
    saveToStorage(STORAGE_KEYS.LOTS, SEED_LOTS);
    saveToStorage(STORAGE_KEYS.PASSBOOK_TXNS, SEED_TXNS);
    localStorage.setItem(STORAGE_KEYS.WALLET_BALANCE, '14680');
    saveToStorage(STORAGE_KEYS.RATES, SEED_RATES);
    saveToStorage(STORAGE_KEYS.COLLECTORS, SEED_COLLECTORS);
    saveToStorage(STORAGE_KEYS.ANOMALIES, SEED_ANOMALIES);
    saveToStorage(STORAGE_KEYS.NOTIFICATIONS, SEED_NOTIFICATIONS);
    saveToStorage(STORAGE_KEYS.CHAT_MESSAGES, SEED_CHAT_MESSAGES);
    notifyStorageChange('*');
  },

  // Auth & Users
  getUsers: (): User[] => getFromStorage(STORAGE_KEYS.USERS, SEED_USERS),
  getUserByPhone: (phone: string): User | undefined => {
    const users = storage.getUsers();
    return users.find(u => u.phone === phone);
  },
  getUserById: (id: string): User | undefined => {
    const users = storage.getUsers();
    return users.find(u => u.id === id);
  },
  getCurrentUser: (): User | null => {
    const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (!saved) return null;
    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  },
  setCurrentUser: (user: User | null): void => {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
    notifyStorageChange(STORAGE_KEYS.CURRENT_USER, user);
  },
  saveUser: (user: User): User => {
    const users = storage.getUsers();
    const idx = users.findIndex(u => u.id === user.id || u.phone === user.phone);
    if (idx >= 0) {
      users[idx] = { ...users[idx], ...user };
    } else {
      users.push(user);
    }
    saveToStorage(STORAGE_KEYS.USERS, users);
    return user;
  },

  // Password lookup for local auth simulation
  getUserPassword: (phone: string): string => {
    const passwords = getFromStorage<Record<string, string>>(STORAGE_KEYS.PASSWORDS, {});
    return passwords[phone] || 'password123';
  },
  setUserPassword: (phone: string, password: string): void => {
    const passwords = getFromStorage<Record<string, string>>(STORAGE_KEYS.PASSWORDS, {});
    passwords[phone] = password;
    saveToStorage(STORAGE_KEYS.PASSWORDS, passwords);
  },

  // Update user KYC (submission or re-application upon rejection)
  updateUserKyc: (userId: string, kycData: KycDocumentData): User | null => {
    const users = storage.getUsers();
    const idx = users.findIndex(u => u.id === userId);
    if (idx === -1) return null;
    const updated: User = {
      ...users[idx],
      kycStatus: 'UNDER_REVIEW',
      kycDocuments: {
        ...kycData,
        rejectionReason: undefined // Clear active rejection upon re-application
      },
      kabadiwala: users[idx].kabadiwala ? {
        ...users[idx].kabadiwala!,
        verified: false
      } : undefined,
      recycler: users[idx].recycler ? {
        ...users[idx].recycler!,
        verified: false
      } : undefined
    };
    users[idx] = updated;
    saveToStorage(STORAGE_KEYS.USERS, users);

    // Update collector record in collectors list if collector
    if (users[idx].role === 'KABADIWALA') {
      const collectors = storage.getCollectors();
      const cIdx = collectors.findIndex(c => c.userId === userId || c.id === userId);
      if (cIdx >= 0) {
        collectors[cIdx].verified = false;
        saveToStorage(STORAGE_KEYS.COLLECTORS, collectors);
      }
    }

    const currentUser = storage.getCurrentUser();
    if (currentUser?.id === userId) {
      storage.setCurrentUser(updated);
    }
    return updated;
  },

  // Regulatory verify or reject user KYC
  verifyUserKyc: (userId: string, status: 'VERIFIED' | 'REJECTED', reason?: string): User | null => {
    const users = storage.getUsers();
    const idx = users.findIndex(u => u.id === userId);
    if (idx === -1) return null;
    const existingDocs = users[idx].kycDocuments || {
      idType: 'AADHAAR' as const,
      idNumber: '1234 5678 9012',
      submittedAt: new Date().toISOString()
    };
    const updated: User = {
      ...users[idx],
      kycStatus: status,
      kycDocuments: {
        ...existingDocs,
        verifiedAt: status === 'VERIFIED' ? new Date().toISOString() : undefined,
        rejectionReason: status === 'REJECTED' ? (reason || 'Document verification failed') : undefined
      },
      kabadiwala: users[idx].kabadiwala ? {
        ...users[idx].kabadiwala!,
        verified: status === 'VERIFIED'
      } : undefined,
      recycler: users[idx].recycler ? {
        ...users[idx].recycler!,
        verified: status === 'VERIFIED'
      } : undefined
    };
    users[idx] = updated;
    saveToStorage(STORAGE_KEYS.USERS, users);

    // Also update collector record in collectors list if collector
    if (users[idx].role === 'KABADIWALA') {
      const collectors = storage.getCollectors();
      const cIdx = collectors.findIndex(c => c.userId === userId || c.id === userId);
      if (cIdx >= 0) {
        collectors[cIdx].verified = status === 'VERIFIED';
        saveToStorage(STORAGE_KEYS.COLLECTORS, collectors);
      }
    }

    // Add In-App notification
    const notif: InAppNotification = {
      id: `notif-${Date.now()}`,
      userId,
      title: status === 'VERIFIED' ? 'KYC Verification Approved' : 'KYC Verification Rejected',
      message: status === 'VERIFIED'
        ? 'Congratulations! Your profile and KYC have been successfully verified by the Regulatory Authority. Full platform access (lot creation and bidding) is now unlocked.'
        : `Your KYC verification request was rejected. Reason: ${reason || 'Details could not be verified'}. Please update and resubmit your documents.`,
      type: 'KYC',
      timestamp: new Date().toISOString(),
      read: false
    };
    storage.addNotification(notif);

    const currentUser = storage.getCurrentUser();
    if (currentUser?.id === userId) {
      storage.setCurrentUser(updated);
    }
    return updated;
  },

  // Notifications
  getNotifications: (userIdOrRole?: string): InAppNotification[] => {
    const all = getFromStorage<InAppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, SEED_NOTIFICATIONS);
    if (!userIdOrRole) return all;
    const lower = userIdOrRole.toLowerCase();
    return all.filter(n => 
      (n.userId && n.userId.toLowerCase() === lower) || 
      (n.userRole && n.userRole.toLowerCase() === lower)
    );
  },
  getUnreadNotificationCount: (userIdOrRole?: string): number => {
    return storage.getNotifications(userIdOrRole).filter(n => !n.read).length;
  },
  addNotification: (notif: InAppNotification): void => {
    const all = getFromStorage<InAppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, SEED_NOTIFICATIONS);
    all.unshift(notif);
    saveToStorage(STORAGE_KEYS.NOTIFICATIONS, all);
  },
  markNotificationRead: (notificationId: string): void => {
    const all = getFromStorage<InAppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, SEED_NOTIFICATIONS);
    const updated = all.map(n => n.id === notificationId ? { ...n, read: true } : n);
    saveToStorage(STORAGE_KEYS.NOTIFICATIONS, updated);
  },
  markAllNotificationsRead: (userIdOrRole?: string): void => {
    const all = getFromStorage<InAppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, SEED_NOTIFICATIONS);
    const lower = userIdOrRole?.toLowerCase();
    const updated = all.map(n => {
      if (!lower) return { ...n, read: true };
      if ((n.userId && n.userId.toLowerCase() === lower) || (n.userRole && n.userRole.toLowerCase() === lower)) {
        return { ...n, read: true };
      }
      return n;
    });
    saveToStorage(STORAGE_KEYS.NOTIFICATIONS, updated);
  },

  // --- Contextual Chat & Messages ---
  getChatMessages: (contextType: 'LOT' | 'PICKUP', contextId: string, partnerId?: string): ChatMessage[] => {
    const all = getFromStorage<ChatMessage[]>(STORAGE_KEYS.CHAT_MESSAGES, SEED_CHAT_MESSAGES);
    const cType = contextType.toUpperCase();
    const filtered = all.filter(m => m.contextType === cType && m.contextId === contextId);
    if (!partnerId) return filtered;
    return filtered.filter(m => m.senderId === partnerId || m.receiverId === partnerId);
  },
  sendChatMessage: (msg: Omit<ChatMessage, 'id' | 'createdAt'>): ChatMessage => {
    const all = getFromStorage<ChatMessage[]>(STORAGE_KEYS.CHAT_MESSAGES, SEED_CHAT_MESSAGES);
    const newMsg: ChatMessage = {
      ...msg,
      id: `chat-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      createdAt: new Date().toISOString(),
      isRead: false
    };
    all.push(newMsg);
    saveToStorage(STORAGE_KEYS.CHAT_MESSAGES, all);
    return newMsg;
  },
  markChatRead: (contextType: 'LOT' | 'PICKUP', contextId: string, currentUserId?: string, partnerId?: string): void => {
    const all = getFromStorage<ChatMessage[]>(STORAGE_KEYS.CHAT_MESSAGES, SEED_CHAT_MESSAGES);
    const cType = contextType.toUpperCase();
    let hasChanges = false;
    const updated = all.map(m => {
      if (m.contextType === cType && m.contextId === contextId && !m.isRead) {
        if (partnerId && m.senderId === partnerId) {
          hasChanges = true;
          return { ...m, isRead: true };
        }
        if (currentUserId && (m.receiverId === currentUserId || m.senderId !== currentUserId)) {
          hasChanges = true;
          return { ...m, isRead: true };
        }
        if (!partnerId && !currentUserId) {
          hasChanges = true;
          return { ...m, isRead: true };
        }
      }
      return m;
    });
    if (hasChanges) {
      saveToStorage(STORAGE_KEYS.CHAT_MESSAGES, updated);
    }
  },
  getUnreadChatCountForContext: (contextType: 'LOT' | 'PICKUP', contextId: string, currentUserId?: string): number => {
    const messages = storage.getChatMessages(contextType, contextId);
    return messages.filter(m => {
      if (m.isRead) return false;
      if (currentUserId && m.senderId === currentUserId) return false;
      return true;
    }).length;
  },
  getTotalUnreadChatCount: (currentUserId?: string): number => {
    const all = getFromStorage<ChatMessage[]>(STORAGE_KEYS.CHAT_MESSAGES, SEED_CHAT_MESSAGES);
    return all.filter(m => {
      if (m.isRead) return false;
      if (currentUserId && m.senderId === currentUserId) return false;
      return true;
    }).length;
  },
  getChatPartnersForContext: (contextType: 'LOT' | 'PICKUP', contextId: string, currentUserId?: string): ChatPartner[] => {
    const messages = storage.getChatMessages(contextType, contextId);
    const partnerMap = new Map<string, ChatPartner>();

    messages.forEach(m => {
      const isMe = currentUserId ? m.senderId === currentUserId : false;
      const partnerId = isMe ? (m.receiverId || 'other') : m.senderId;
      const partnerName = isMe ? (m.receiverName || 'Participant') : (m.senderName || 'Participant');
      const partnerRole = isMe ? (m.receiverRole || 'COLLECTOR') : (m.senderRole || 'COLLECTOR');

      if (!partnerMap.has(partnerId)) {
        partnerMap.set(partnerId, {
          id: partnerId,
          name: partnerName,
          role: partnerRole,
          lastMessage: m.text,
          lastMessageTime: m.createdAt,
          unreadCount: 0
        });
      }

      const entry = partnerMap.get(partnerId)!;
      entry.lastMessage = m.text || (m.audioUrl ? '🎙️ Voice Note' : 'Image');
      entry.lastMessageTime = m.createdAt;
      if (!m.isRead && (!currentUserId || m.senderId !== currentUserId)) {
        entry.unreadCount += 1;
      }
    });

    return Array.from(partnerMap.values());
  },
  getAllChatThreads: (currentUserId?: string, userRole?: string): ChatThreadSummary[] => {
    const allMessages = getFromStorage<ChatMessage[]>(STORAGE_KEYS.CHAT_MESSAGES, SEED_CHAT_MESSAGES);
    const threadMap = new Map<string, ChatThreadSummary>();

    // 1. Parse all messages into distinct threads
    allMessages.forEach(m => {
      const isSender = currentUserId ? m.senderId === currentUserId : m.senderRole === userRole;
      const partnerId = isSender ? (m.receiverId || 'partner-default') : m.senderId;
      const partnerName = isSender ? (m.receiverName || 'Partner') : (m.senderName || 'Partner');
      const partnerRole = isSender ? (m.receiverRole || 'COLLECTOR') : (m.senderRole || 'COLLECTOR');

      const threadKey = `${m.contextType}:${m.contextId}:${partnerId}`;

      if (!threadMap.has(threadKey)) {
        threadMap.set(threadKey, {
          threadKey,
          contextType: m.contextType,
          contextId: m.contextId,
          contextTitle: m.contextTitle || `${m.contextType === 'PICKUP' ? 'Pickup' : 'Lot'} #${m.contextId}`,
          partnerId,
          partnerName,
          partnerRole,
          lastMessage: m.text || (m.audioUrl ? '🎙️ Voice note' : 'Attachment'),
          lastMessageTime: m.createdAt,
          unreadCount: 0
        });
      }

      const thread = threadMap.get(threadKey)!;
      if (new Date(m.createdAt).getTime() >= new Date(thread.lastMessageTime).getTime()) {
        thread.lastMessage = m.text || (m.audioUrl ? '🎙️ Voice note' : 'Attachment');
        thread.lastMessageTime = m.createdAt;
      }
      if (!m.isRead && !isSender) {
        thread.unreadCount += 1;
      }
    });

    // 2. Also ensure active pickups with assigned partners have a visible thread entry
    try {
      const pickups = storage.getPickups();
      pickups.forEach(p => {
        if (p.kabadiwala) {
          const partnerId = p.kabadiwala.id;
          const threadKey = `PICKUP:${p.id}:${partnerId}`;
          if (!threadMap.has(threadKey)) {
            threadMap.set(threadKey, {
              threadKey,
              contextType: 'PICKUP',
              contextId: p.id,
              contextTitle: `Pickup #${p.id.slice(0, 10)} (${p.address ? p.address.slice(0, 20) + '...' : 'Doorstep'})`,
              partnerId,
              partnerName: p.kabadiwala.name,
              partnerRole: 'KABADIWALA',
              partnerPhone: p.kabadiwala.phone,
              lastMessage: 'Tap to coordinate arrival, weighing & OTP verification',
              lastMessageTime: p.scheduledAt || p.createdAt || new Date().toISOString(),
              unreadCount: 0
            });
          } else {
            const existing = threadMap.get(threadKey)!;
            if (!existing.partnerPhone && p.kabadiwala.phone) {
              existing.partnerPhone = p.kabadiwala.phone;
            }
          }
        }
      });
    } catch {}

    // 3. Ensure active lots with bids have visible thread entry
    try {
      const lots = storage.getLots();
      lots.forEach(l => {
        if (l.collectorId && l.bids && l.bids.length > 0) {
          l.bids.forEach(b => {
            const partnerId = b.recyclerId;
            const threadKey = `LOT:${l.id}:${partnerId}`;
            if (!threadMap.has(threadKey)) {
              threadMap.set(threadKey, {
                threadKey,
                contextType: 'LOT',
                contextId: l.id,
                contextTitle: `Lot #${l.id.slice(0, 10)} (${l.category} ${l.approxWeightKg}kg)`,
                partnerId,
                partnerName: b.recyclerName,
                partnerRole: 'RECYCLER',
                lastMessage: `Bid submitted: ₹${b.bidAmount}. Tap to coordinate dispatch & gate pass.`,
                lastMessageTime: b.createdAt || l.createdAt,
                unreadCount: 0
              });
            }
          });
        }
      });
    } catch {}

    return Array.from(threadMap.values()).sort(
      (a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
    );
  },


  // Pickups
  getPickups: (): Pickup[] => getFromStorage(STORAGE_KEYS.PICKUPS, SEED_PICKUPS),
  getPickupById: (id: string): Pickup | undefined => {
    return storage.getPickups().find(p => p.id === id);
  },
  savePickup: (pickup: Pickup): Pickup => {
    const pickups = storage.getPickups();
    const existingIndex = pickups.findIndex(p => p.id === pickup.id);
    const enriched: Pickup = {
      ...pickup,
      verificationOtp: pickup.verificationOtp || String(Math.floor(1000 + Math.random() * 9000)),
      traceabilityHash: pickup.traceabilityHash || `0x${Math.random().toString(16).substr(2, 16)}`,
      isVerified: pickup.status === 'COMPLETED' ? true : (pickup.isVerified || false)
    };
    let updated: Pickup[];
    if (existingIndex >= 0) {
      updated = [...pickups];
      updated[existingIndex] = enriched;
    } else {
      updated = [enriched, ...pickups];
    }
    saveToStorage(STORAGE_KEYS.PICKUPS, updated);
    return enriched;
  },
  updatePickupStatus: (
    id: string,
    status: Pickup['status'],
    details?: Partial<Pickup>
  ): Pickup | null => {
    const pickups = storage.getPickups();
    const idx = pickups.findIndex(p => p.id === id);
    if (idx === -1) return null;

    const isNowCompleted = status === 'COMPLETED';
    const updatedPickup: Pickup = {
      ...pickups[idx],
      ...details,
      status,
      isVerified: isNowCompleted ? true : (pickups[idx].isVerified || false),
      verifiedAt: isNowCompleted ? (details?.verifiedAt || new Date().toISOString()) : pickups[idx].verifiedAt,
      traceabilityHash: pickups[idx].traceabilityHash || `0x${Math.random().toString(16).substr(2, 16)}`
    };
    pickups[idx] = updatedPickup;
    saveToStorage(STORAGE_KEYS.PICKUPS, pickups);
    return updatedPickup;
  },
  getMyPickups: (userId?: string, role?: Role): Pickup[] => {
    const all = storage.getPickups();
    if (!userId || !role) return all;
    if (role === 'CITIZEN') {
      return all.filter(p => p.citizenId === userId || p.citizen?.id === userId);
    }
    if (role === 'KABADIWALA') {
      return all.filter(p => p.kabadiwalaId === userId || p.kabadiwala?.id === userId);
    }
    return all;
  },
  getNearbyPickups: (lat?: number, lng?: number, radiusKm: number = 15): Pickup[] => {
    const all = storage.getPickups();
    // Return all REQUESTED pickups and any unassigned ones
    return all.filter(p => p.status === 'REQUESTED' || !p.kabadiwalaId);
  },

  // Lots
  getLots: (): EWasteLot[] => getFromStorage(STORAGE_KEYS.LOTS, SEED_LOTS),
  getLotById: (id: string): EWasteLot | undefined => {
    return storage.getLots().find(l => l.id === id || l.lotCode === id);
  },
  saveLot: (lot: EWasteLot): EWasteLot => {
    const lots = storage.getLots();
    const idx = lots.findIndex(l => l.id === lot.id || l.lotCode === lot.lotCode);
    let updated: EWasteLot[];
    if (idx >= 0) {
      updated = [...lots];
      updated[idx] = lot;
    } else {
      updated = [lot, ...lots];
    }
    saveToStorage(STORAGE_KEYS.LOTS, updated);
    return lot;
  },
  updateLotStatus: (lotCodeOrId: string, status: EWasteLot['status'], updates?: Partial<EWasteLot>): EWasteLot | null => {
    const lots = storage.getLots();
    const idx = lots.findIndex(l => l.id === lotCodeOrId || l.lotCode.toLowerCase() === lotCodeOrId.toLowerCase());
    if (idx === -1) return null;

    const updatedLot: EWasteLot = {
      ...lots[idx],
      ...updates,
      status
    };
    lots[idx] = updatedLot;
    saveToStorage(STORAGE_KEYS.LOTS, lots);
    return updatedLot;
  },
  getMyLots: (collectorId?: string): EWasteLot[] => {
    const all = storage.getLots();
    if (!collectorId) return all;
    return all.filter(l => l.collectorId === collectorId || l.collectorName?.toLowerCase().includes('suresh') || !l.collectorId);
  },
  addBidToLot: (lotCodeOrId: string, bidData: { recyclerId: string; recyclerName: string; bidAmount: number }): { lot: EWasteLot; bid: LotBid } => {
    const lots = storage.getLots();
    const idx = lots.findIndex(l => l.id === lotCodeOrId || l.lotCode.toLowerCase() === lotCodeOrId.toLowerCase());
    if (idx === -1) throw new Error('Lot not found');

    const lot = lots[idx];
    const ask = Number(lot.askingPrice || lot.estimatedValue || 0);
    const minBid = Number(lot.minBidAmount) || Math.floor(ask * 0.5);
    const numericBid = Number(bidData.bidAmount);
    if (isNaN(numericBid) || numericBid < minBid) {
      throw new Error(`Invalid bid: Must be at least ₹${minBid} (50% of asking price ₹${ask})`);
    }

    const weight = Number(lot.approxWeightKg) || 1;
    const newBid: LotBid = {
      id: `bid-${Date.now()}`,
      recyclerId: bidData.recyclerId,
      recyclerName: bidData.recyclerName,
      bidAmount: numericBid,
      bidPerKg: Math.round(numericBid / weight),
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'PENDING'
    };

    const existingBids = lot.bids || [];
    const updatedBids = [newBid, ...existingBids];
    const highestBid = Math.max(...updatedBids.map(b => Number(b.bidAmount)));

    const updatedLot: EWasteLot = {
      ...lot,
      bids: updatedBids,
      highestBid,
      status: lot.status === 'AVAILABLE' || lot.status === 'REQUESTED' ? 'BIDDING' : lot.status
    };

    lots[idx] = updatedLot;
    saveToStorage(STORAGE_KEYS.LOTS, lots);
    return { lot: updatedLot, bid: newBid };
  },
  acceptLotBid: (lotCodeOrId: string, bidId: string): EWasteLot => {
    const lots = storage.getLots();
    const idx = lots.findIndex(l => l.id === lotCodeOrId || l.lotCode.toLowerCase() === lotCodeOrId.toLowerCase());
    if (idx === -1) throw new Error('Lot not found');

    const lot = lots[idx];
    const bids = (lot.bids || []).map(b => ({
      ...b,
      status: (b.id === bidId ? 'ACCEPTED' : 'REJECTED') as LotBid['status']
    }));
    const winningBid = bids.find(b => b.id === bidId);

    const updatedLot: EWasteLot = {
      ...lot,
      bids,
      winningBid,
      recyclerId: winningBid?.recyclerId,
      recyclerName: winningBid?.recyclerName,
      recyclerOfferedRate: winningBid?.bidPerKg || lot.recyclerOfferedRate,
      estimatedValue: winningBid ? winningBid.bidAmount : lot.estimatedValue,
      status: 'HANDOVER_PENDING'
    };

    lots[idx] = updatedLot;
    saveToStorage(STORAGE_KEYS.LOTS, lots);
    return updatedLot;
  },
  rejectLotBid: (lotCodeOrId: string, bidId: string): EWasteLot => {
    const lots = storage.getLots();
    const idx = lots.findIndex(l => l.id === lotCodeOrId || l.lotCode.toLowerCase() === lotCodeOrId.toLowerCase());
    if (idx === -1) throw new Error('Lot not found');

    const lot = lots[idx];
    const bids = (lot.bids || []).map(b => (b.id === bidId ? { ...b, status: 'REJECTED' as const } : b));
    const activeBids = bids.filter(b => b.status === 'PENDING');
    const highestBid = activeBids.length > 0 ? Math.max(...activeBids.map(b => b.bidAmount)) : undefined;

    const updatedLot: EWasteLot = {
      ...lot,
      bids,
      highestBid,
      status: activeBids.length > 0 ? 'BIDDING' : 'AVAILABLE'
    };

    lots[idx] = updatedLot;
    saveToStorage(STORAGE_KEYS.LOTS, lots);
    return updatedLot;
  },

  // Passbook & Wallet
  getPassbookTransactions: (): PassbookTxn[] => getFromStorage(STORAGE_KEYS.PASSBOOK_TXNS, SEED_TXNS),
  getWalletBalance: (): number => {
    const val = localStorage.getItem(STORAGE_KEYS.WALLET_BALANCE);
    return val ? parseFloat(val) : 14680;
  },
  setWalletBalance: (newBalance: number): void => {
    localStorage.setItem(STORAGE_KEYS.WALLET_BALANCE, String(newBalance));
    notifyStorageChange(STORAGE_KEYS.WALLET_BALANCE, newBalance);
  },
  addPassbookTransaction: (txn: Omit<PassbookTxn, 'id' | 'balance'>): PassbookTxn => {
    const txns = storage.getPassbookTransactions();
    const currentBalance = storage.getWalletBalance();
    const newBalance = txn.type === 'CREDIT' ? currentBalance + txn.amount : currentBalance - txn.amount;
    
    const newTxn: PassbookTxn = {
      ...txn,
      id: `TXN-${String(txns.length + 90).padStart(3, '0')}`,
      balance: newBalance
    };

    const updatedTxns = [newTxn, ...txns];
    saveToStorage(STORAGE_KEYS.PASSBOOK_TXNS, updatedTxns);
    storage.setWalletBalance(newBalance);
    return newTxn;
  },

  // Rates
  getRates: (): ScrapRate[] => getFromStorage(STORAGE_KEYS.RATES, SEED_RATES),
  saveRates: (rates: ScrapRate[]): void => {
    saveToStorage(STORAGE_KEYS.RATES, rates);
  },
  updateRate: (category: string, newRate: number): void => {
    const rates = storage.getRates();
    const catLower = category.toLowerCase();
    const idx = rates.findIndex(r => {
      const rLower = r.category.toLowerCase();
      if (rLower === catLower) return true;
      if (rLower.includes(catLower) || catLower.includes(rLower)) return true;
      // Keyword matching
      if ((catLower.includes('pcb') || catLower.includes('circuit')) && (rLower.includes('pcb') || rLower.includes('circuit'))) {
        const isHigh = catLower.includes('high') || catLower.includes('server') || catLower.includes('motherboard');
        const rIsHigh = rLower.includes('high') || rLower.includes('server') || rLower.includes('motherboard');
        return isHigh === rIsHigh;
      }
      if ((catLower.includes('copper') || catLower.includes('wire') || catLower.includes('cable')) && (rLower.includes('copper') || rLower.includes('cable'))) return true;
      if ((catLower.includes('battery') || catLower.includes('li-ion')) && (rLower.includes('battery') || rLower.includes('li-ion'))) return true;
      if (catLower.includes('motor') && rLower.includes('motor')) return true;
      if ((catLower.includes('lcd') || catLower.includes('led') || catLower.includes('display')) && (rLower.includes('lcd') || rLower.includes('display'))) return true;
      if ((catLower.includes('plastic') || catLower.includes('abs')) && (rLower.includes('plastic') || rLower.includes('abs'))) return true;
      if (catLower.includes('crt') && rLower.includes('crt')) return true;
      return false;
    });

    if (idx >= 0) {
      const oldRate = rates[idx].ratePerKg;
      rates[idx] = {
        ...rates[idx],
        ratePerKg: newRate,
        weeklyDelta: newRate - oldRate
      };
      saveToStorage(STORAGE_KEYS.RATES, rates);
    }
  },

  // Collectors KYC
  getCollectors: () => getFromStorage(STORAGE_KEYS.COLLECTORS, SEED_COLLECTORS),
  verifyCollector: (collectorId: string, verified: boolean) => {
    const collectors = storage.getCollectors();
    const updated = collectors.map(c => (c.id === collectorId ? { ...c, verified } : c));
    saveToStorage(STORAGE_KEYS.COLLECTORS, updated);
    return updated;
  },

  // Anomalies
  getAnomalies: (): TransactionAnomaly[] => getFromStorage(STORAGE_KEYS.ANOMALIES, SEED_ANOMALIES),
  updateAnomalyStatus: (id: string, status: 'FLAGGED' | 'REVIEWED' | 'DISMISSED') => {
    const anomalies = storage.getAnomalies();
    const updated = anomalies.map(a => (a.id === id ? { ...a, status } : a));
    saveToStorage(STORAGE_KEYS.ANOMALIES, updated);
    return updated;
  },

  // Aggregate Admin Stats
  getAdminStats: (): AdminStats => {
    const pickups = storage.getPickups();
    const collectors = storage.getCollectors();
    const lots = storage.getLots();

    const completed = pickups.filter(p => p.status === 'COMPLETED');
    const inProgress = pickups.filter(p => p.status === 'IN_PROGRESS');
    const requested = pickups.filter(p => p.status === 'REQUESTED');

    const totalRevenue = pickups.reduce((sum, p) => sum + (p.totalAmount || 0), 0) +
      lots.reduce((sum, l) => sum + (l.estimatedValue || 0), 0);

    const verifiedCollectorsCount = collectors.filter(c => c.verified).length;
    const verifiedPercent = collectors.length > 0 ? Math.round((verifiedCollectorsCount / collectors.length) * 100) : 88;

    return {
      totalKg: 28450.5 + completed.length * 15,
      activeKabadiwalas: collectors.length,
      verifiedPercent,
      totalRevenue: totalRevenue || 3420500,
      totalPickups: pickups.length || 1248,
      requestedCount: requested.length,
      inProgressCount: inProgress.length,
      completedCount: completed.length || 1212,
      categoryBreakdown: [
        { category: 'PCBs & Logic Boards', kg: 9420, revenue: 6028800 },
        { category: 'Copper Cables & Winding', kg: 8150, revenue: 3912000 },
        { category: 'Li-ion Batteries', kg: 4680, revenue: 678600 },
        { category: 'CRT Monitor Glass', kg: 3800, revenue: 45600 },
        { category: 'Engineering E-Plastics', kg: 2400.5, revenue: 91219 }
      ],
      environmentalImpact: {
        co2SavedKg: 58240,
        treesSaved: 3840,
        landfillDivertedKg: 28450.5,
        waterSavedLiters: 194000
      },
      pickupsTimeline: [
        { date: '01 Sep', pickups: 38, kg: 820 },
        { date: '03 Sep', pickups: 44, kg: 1040 },
        { date: '05 Sep', pickups: 52, kg: 1320 },
        { date: '07 Sep', pickups: 68, kg: 1850 }
      ]
    };
  }
};
