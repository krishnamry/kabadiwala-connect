import { User, Pickup, EWasteLot, LotBid, ScrapRate, TransactionAnomaly, AdminStats, Role } from '../types';

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
  LANGUAGE: 'dhatu_language'
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
    role: 'CITIZEN'
  },
  {
    id: 'mock-kaba-1',
    name: 'Suresh Kumar',
    phone: '9876543210',
    role: 'KABADIWALA',
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
    role: 'ADMIN'
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
      { category: 'Printed Circuit Boards (PCBs)', estWeightKg: 3.5, ratePerKg: 640 },
      { category: 'Copper Cables & Insulated Wires', estWeightKg: 4.0, ratePerKg: 480 },
      { category: 'CRT Monitor Glass Unit', estWeightKg: 12.0, ratePerKg: 12 }
    ],
    totalAmount: 4304,
    notes: 'Doorstep pickup requested with live tracking.',
    traceabilityHash: '0x8f4a9b2c7e103984fa55',
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
      { category: 'Lithium-ion Batteries', estWeightKg: 5.0, ratePerKg: 145 },
      { category: 'LCD/LED Display Panels', estWeightKg: 8.5, ratePerKg: 85 }
    ],
    totalAmount: 1447,
    notes: 'Safe recycling completed. Handover certificate generated.',
    traceabilityHash: '0x3c7e9184a298bf0182dd',
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
      { category: 'Printed Circuit Boards (PCBs)', estWeightKg: 2.5, ratePerKg: 640 },
      { category: 'Electric Motors & Compressors', estWeightKg: 6.0, ratePerKg: 95 }
    ],
    totalAmount: 2170,
    notes: '2 desktop towers, want fast pickup today.',
    traceabilityHash: '0x7e8b91a20c34567def12',
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
      { category: 'Copper Cables & Insulated Wires', estWeightKg: 5.0, ratePerKg: 480 },
      { category: 'Lithium-ion Batteries', estWeightKg: 3.0, ratePerKg: 145 }
    ],
    totalAmount: 2835,
    notes: 'Office network cabling and laptop battery replacements.',
    traceabilityHash: '0x12a9b34c89df70123ef4',
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
    estimatedValue: 11840,
    askingPrice: 11840,
    minBidAmount: 5920,
    recyclerOfferedRate: 640,
    status: 'BIDDING',
    gpsLat: 28.5685,
    gpsLng: 77.2412,
    createdAt: '2026-09-08 09:30 AM',
    qrCode: 'KBD-EWASTE-9821-DELHI',
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
    estimatedValue: 11520,
    askingPrice: 11520,
    minBidAmount: 5760,
    recyclerOfferedRate: 480,
    status: 'REQUESTED',
    gpsLat: 28.5420,
    gpsLng: 77.2580,
    createdAt: '2026-09-08 10:15 AM',
    qrCode: 'KBD-EWASTE-9824-DELHI',
    bids: []
  },
  {
    id: 'lot-103',
    lotCode: 'KC-LOT-9830',
    collectorId: 'prof-4',
    collectorName: 'Radhe Shyam',
    category: 'Lithium-ion Batteries',
    approxWeightKg: 32.0,
    estimatedValue: 4640,
    askingPrice: 4640,
    minBidAmount: 2320,
    recyclerOfferedRate: 145,
    status: 'AVAILABLE',
    gpsLat: 28.5210,
    gpsLng: 77.2740,
    createdAt: '2026-09-08 11:00 AM',
    qrCode: 'KBD-EWASTE-9830-DELHI',
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

  // Pickups
  getPickups: (): Pickup[] => getFromStorage(STORAGE_KEYS.PICKUPS, SEED_PICKUPS),
  getPickupById: (id: string): Pickup | undefined => {
    return storage.getPickups().find(p => p.id === id);
  },
  savePickup: (pickup: Pickup): Pickup => {
    const pickups = storage.getPickups();
    const existingIndex = pickups.findIndex(p => p.id === pickup.id);
    let updated: Pickup[];
    if (existingIndex >= 0) {
      updated = [...pickups];
      updated[existingIndex] = pickup;
    } else {
      updated = [pickup, ...pickups];
    }
    saveToStorage(STORAGE_KEYS.PICKUPS, updated);
    return pickup;
  },
  updatePickupStatus: (
    id: string,
    status: Pickup['status'],
    details?: Partial<Pickup>
  ): Pickup | null => {
    const pickups = storage.getPickups();
    const idx = pickups.findIndex(p => p.id === id);
    if (idx === -1) return null;

    const updatedPickup: Pickup = {
      ...pickups[idx],
      ...details,
      status
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
    const ask = lot.askingPrice || lot.estimatedValue;
    const minBid = Math.round(ask * 0.5);
    if (bidData.bidAmount < minBid) {
      throw new Error(`Invalid bid: Must be at least ₹${minBid} (50% of asking price ₹${ask})`);
    }

    const newBid: LotBid = {
      id: `bid-${Date.now()}`,
      recyclerId: bidData.recyclerId,
      recyclerName: bidData.recyclerName,
      bidAmount: bidData.bidAmount,
      bidPerKg: Math.round(bidData.bidAmount / (lot.approxWeightKg || 1)),
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'PENDING'
    };

    const existingBids = lot.bids || [];
    const updatedBids = [newBid, ...existingBids];
    const highestBid = Math.max(...updatedBids.map(b => b.bidAmount));

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
    const idx = rates.findIndex(r => r.category.toLowerCase().includes(category.toLowerCase()));
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
