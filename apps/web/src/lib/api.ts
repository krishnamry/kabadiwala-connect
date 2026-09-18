import { Pickup, ScrapRate, AdminStats, MLClassificationResult, User, EWasteLot, LotBid, SaleToken, Review, ChatMessage, KycInfo, RecyclerProfile } from '../types';
import { storage } from './storage';
import { classifyImageWithGeminiClient } from './geminiClient';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

export function getAuthToken(): string | null {
  return localStorage.getItem('token');
}

export function setAuthToken(token: string) {
  localStorage.setItem('token', token);
}

export function clearAuthToken() {
  localStorage.removeItem('token');
  localStorage.removeItem('currentUser');
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    (headers as any)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Request failed');
  }

  return data.data !== undefined ? data.data : data;
}

export const api = {
  // Auth
  register: async (payload: any): Promise<{ token: string; user: User }> => {
    try {
      const res = await request<{ token: string; user: User }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      storage.setCurrentUser(res.user);
      storage.saveUser(res.user);
      return res;
    } catch {
      // Offline fallback using localStorage
      const user: User = {
        id: `user-${Date.now()}`,
        name: payload.name || 'New Registered User',
        phone: payload.phone,
        role: payload.role || 'CITIZEN'
      };
      storage.saveUser(user);
      storage.setCurrentUser(user);
      return { token: `local-token-${Date.now()}`, user };
    }
  },

  login: async (payload: { phone: string; password?: string }): Promise<{ token: string; user: User }> => {
    try {
      const res = await request<{ token: string; user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      storage.setCurrentUser(res.user);
      return res;
    } catch {
      // LocalStorage-backed authentication
      const user = storage.getUserByPhone(payload.phone);
      if (user) {
        storage.setCurrentUser(user);
        return { token: `local-token-${Date.now()}`, user };
      }
      // Demo fallback user
      const defaultUser: User = {
        id: `user-${payload.phone}`,
        name: 'User ' + payload.phone.slice(-4),
        phone: payload.phone,
        role: 'CITIZEN'
      };
      storage.saveUser(defaultUser);
      storage.setCurrentUser(defaultUser);
      return { token: `local-token-${Date.now()}`, user: defaultUser };
    }
  },

  getMe: async (): Promise<User> => {
    try {
      const me = await request<User>('/auth/me');
      storage.setCurrentUser(me);
      return me;
    } catch {
      const stored = storage.getCurrentUser();
      if (stored) return stored;
      throw new Error('No user session found in localStorage');
    }
  },

  getDemoUsers: async (): Promise<User[]> => {
    try {
      const users = await request<User[]>('/auth/demo-users');
      if (users && users.length > 0) return users;
    } catch {}
    return storage.getUsers();
  },

  // Rates
  getRates: async (): Promise<ScrapRate[]> => {
    try {
      const rates = await request<ScrapRate[]>('/rates');
      if (rates && rates.length > 0) {
        storage.saveRates(rates);
        return rates;
      }
    } catch {}
    return storage.getRates();
  },

  // Pickups
  createPickup: async (payload: any): Promise<Pickup> => {
    const pickup = storage.savePickup(payload);
    // Background sync attempt
    request<Pickup>('/pickups', { method: 'POST', body: JSON.stringify(payload) }).catch(() => {});
    return pickup;
  },

  getMyPickups: async (): Promise<Pickup[]> => {
    const currentUser = storage.getCurrentUser();
    try {
      const pickups = await request<Pickup[]>('/pickups/my');
      if (pickups && pickups.length > 0) {
        pickups.forEach(p => storage.savePickup(p));
        return storage.getMyPickups(currentUser?.id, currentUser?.role);
      }
    } catch {}
    return storage.getMyPickups(currentUser?.id, currentUser?.role);
  },

  getNearbyPickups: async (lat?: number, lng?: number, radius?: number): Promise<Pickup[]> => {
    try {
      const pickups = await request<Pickup[]>(`/pickups/nearby?lat=${lat || 28.5685}&lng=${lng || 77.2412}&radius=${radius || 15}`);
      if (pickups && pickups.length > 0) {
        pickups.forEach(p => storage.savePickup(p));
      }
    } catch {}
    return storage.getNearbyPickups(lat, lng, radius);
  },

  getPickupById: async (id: string): Promise<Pickup> => {
    const found = storage.getPickupById(id);
    if (found) return found;
    return request<Pickup>(`/pickups/${id}`);
  },

  acceptPickup: async (id: string): Promise<Pickup> => {
    const currentUser = storage.getCurrentUser();
    const updated = storage.updatePickupStatus(id, 'ACCEPTED', {
      kabadiwalaId: currentUser?.id || 'mock-kaba-1',
      kabadiwala: {
        id: currentUser?.id || 'mock-kaba-1',
        name: currentUser?.name || 'Suresh Kumar',
        phone: currentUser?.phone || '9876543210'
      }
    });
    request<Pickup>(`/pickups/${id}/accept`, { method: 'POST' }).catch(() => {});
    return updated || storage.getPickupById(id)!;
  },

  startPickupProgress: async (id: string): Promise<Pickup> => {
    const updated = storage.updatePickupStatus(id, 'IN_PROGRESS');
    request<Pickup>(`/pickups/${id}/in-progress`, { method: 'POST' }).catch(() => {});
    return updated || storage.getPickupById(id)!;
  },

  completePickup: async (id: string, items: { category: string; actualWeightKg: number; [key: string]: any }[]): Promise<{ pickup: Pickup; transaction: any; totalAmount: number }> => {
    const currentPickup = storage.getPickupById(id);
    const rates = storage.getRates();
    let totalAmount = 0;

    const updatedItems = (currentPickup?.items || []).map(item => {
      const matched = items.find(i => i.category === item.category);
      const actualWeight = matched ? matched.actualWeightKg : (item.actualWeightKg || item.estWeightKg);
      const rate = rates.find(r => r.category.toLowerCase().includes(item.category.toLowerCase()))?.ratePerKg || item.ratePerKg;
      totalAmount += Math.round(actualWeight * rate);
      return {
        ...item,
        actualWeightKg: actualWeight,
        ratePerKg: rate
      };
    });

    const totalUnits = currentPickup?.totalItems || updatedItems.reduce((s, it) => s + (it.quantity || 1), 0);
    const updated = storage.updatePickupStatus(id, 'COMPLETED', {
      items: updatedItems,
      totalItems: totalUnits,
      totalAmount: totalAmount || currentPickup?.totalAmount || 620,
      completedAt: new Date().toISOString()
    });

    // Record digital payout transaction in Passbook
    const txn = storage.addPassbookTransaction({
      date: new Date().toISOString().slice(0, 16).replace('T', ' '),
      ref: `KC-PICKUP-${id.slice(-4).toUpperCase()}`,
      desc: `Doorstep Pickup: ${updatedItems.map(i => `${i.actualWeightKg || i.estWeightKg}kg ${i.category.split(' ')[0]}`).join(', ')}`,
      party: currentPickup?.citizen?.name || 'Citizen Customer',
      type: 'CREDIT',
      amount: totalAmount || currentPickup?.totalAmount || 620,
      paymentMode: 'WALLET_ESCROW',
      status: 'VERIFIED'
    });

    request(`/pickups/${id}/complete`, {
      method: 'POST',
      body: JSON.stringify({ items })
    }).catch(() => {});

    return {
      pickup: updated || currentPickup!,
      transaction: txn,
      totalAmount: totalAmount || currentPickup?.totalAmount || 620
    };
  },

  cancelPickup: async (id: string): Promise<Pickup> => {
    const updated = storage.updatePickupStatus(id, 'CANCELLED');
    request<Pickup>(`/pickups/${id}/cancel`, { method: 'POST' }).catch(() => {});
    return updated || storage.getPickupById(id)!;
  },

  // Kabadiwala
  getKabadiwalaWallet: async () => {
    const txns = storage.getPassbookTransactions();
    const walletBalance = storage.getWalletBalance();
    const totalEarned = txns.filter(t => t.type === 'CREDIT').reduce((sum, t) => sum + t.amount, 0);
    return {
      walletBalance,
      totalEarned,
      transactionCount: txns.length,
      transactions: txns
    };
  },

  getKabadiwalaProfile: async () => {
    const currentUser = storage.getCurrentUser();
    return currentUser?.kabadiwala || {
      id: 'prof-1',
      userId: 'mock-kaba-1',
      verified: true,
      reputationScore: 4.9,
      walletBalance: storage.getWalletBalance(),
      vehicleType: 'Solar Cargo Trike',
      aadhaarNumber: 'XXXX-XXXX-8921',
      serviceRadiusKm: 6.5,
      completedJobsCount: 142
    };
  },

  updateKabadiwalaLocation: async (latitude: number, longitude: number) => {
    return { latitude, longitude, updated: true };
  },

  // Admin
  getAdminStats: async (): Promise<AdminStats> => {
    try {
      const stats = await request<AdminStats>('/admin/stats');
      if (stats) return stats;
    } catch {}
    return storage.getAdminStats();
  },

  getAdminKabadiwalas: async (): Promise<any[]> => {
    try {
      const collectors = await request<any[]>('/admin/kabadiwalas');
      if (collectors && collectors.length > 0) return collectors;
    } catch {}
    return storage.getCollectors();
  },

  verifyKabadiwala: async (id: string, verified: boolean) => {
    try {
      await request(`/admin/kabadiwalas/${id}/verify`, { method: 'POST', body: JSON.stringify({ verified }) });
    } catch {}
    return storage.verifyCollector(id, verified);
  },

  getEPRReport: async () => {
    try {
      const report = await request<any>('/admin/reports/epr');
      if (report) return report;
    } catch {}
    const pickups = storage.getPickups().filter(p => p.status === 'COMPLETED');
    const lots = storage.getLots();
    const collectors = storage.getCollectors();
    return {
      reportType: 'CPCB E-Waste Central Portal Filing (Form-2/6)',
      reportId: `EPR-CPCB-${Date.now().toString().slice(-6)}`,
      generatedAt: new Date().toISOString(),
      governingBody: 'Central Pollution Control Board (CPCB) / MoEFCC Guidelines',
      compliancePeriod: 'FY 2026-2027',
      ulbJurisdiction: 'New Delhi Municipal Council (NDMC)',
      complianceYear: '2026-2027',
      totalTonnageMT: 28.45 + (pickups.length * 0.015),
      formalizationRate: '88.4%',
      traceabilityCoverage: '100%',
      completedPickups: pickups.length,
      activeLots: lots.length,
      verifiedCollectors: collectors.filter(c => c.verified).length
    };
  },

  // ML Scrap Classification
  classifyScrapImage: async (file: File): Promise<MLClassificationResult> => {
    // 1. Attempt Primary Backend Classification (/api/ml/classify)
    try {
      const token = getAuthToken();
      const formData = new FormData();
      formData.append('image', file);

      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${BASE_URL}/ml/classify`, {
        method: 'POST',
        headers,
        body: formData
      });

      const data = await response.json();
      if (response.ok && data.success && data.data) {
        return data.data;
      }
    } catch {
      // Backend not running or unreachable (common in standalone frontend/APK)
    }

    // 2. Direct Client-Side Google Gemini Multimodal Vision API
    try {
      const geminiResult = await classifyImageWithGeminiClient(file);
      if (geminiResult && geminiResult.category) {
        return geminiResult;
      }
    } catch (geminiErr) {
      console.warn('[API] Client-side Gemini detector error, falling back to heuristics:', geminiErr);
    }

    // 3. Offline Heuristic Fallback based on filename cues
    const lowerName = file.name.toLowerCase();
    if (lowerName.includes('battery') || lowerName.includes('cell') || lowerName.includes('li') || lowerName.includes('powerbank')) {
      return {
        category: 'Lithium-ion Batteries',
        detectedItem: 'Lithium Battery Pack',
        confidence: 0.94,
        estRate: 145,
        advice: 'Secondary rechargeable battery pack detected. Terminal taping advised before transit.',
        filename: file.name,
        dimensions: '1920x1080'
      };
    } else if (lowerName.includes('wire') || lowerName.includes('cable') || lowerName.includes('copper') || lowerName.includes('cord')) {
      return {
        category: 'Copper Cables & Insulated Wires',
        detectedItem: 'Copper Conductor Cable',
        confidence: 0.95,
        estRate: 480,
        advice: 'Clean bright copper conductor cables detected. High recovery rate for smelter drawing.',
        filename: file.name,
        dimensions: '1920x1080'
      };
    } else if (lowerName.includes('crt') || lowerName.includes('glass') || lowerName.includes('monitor') || lowerName.includes('tv')) {
      return {
        category: 'CRT Monitor Glass Unit',
        detectedItem: 'CRT Cathode Ray Glass Unit',
        confidence: 0.92,
        estRate: 12,
        advice: 'Heavy leaded silicate vacuum glass detected. Handle with personal protective equipment.',
        filename: file.name,
        dimensions: '1920x1080'
      };
    } else if (lowerName.includes('screen') || lowerName.includes('lcd') || lowerName.includes('led') || lowerName.includes('panel')) {
      return {
        category: 'LCD/LED Display Panels',
        detectedItem: 'Flat Display Panel',
        confidence: 0.94,
        estRate: 85,
        advice: 'Flat display panel unit detected. Store vertically, avoid glass rupture.',
        filename: file.name,
        dimensions: '1920x1080'
      };
    } else if (lowerName.includes('motor') || lowerName.includes('compressor')) {
      return {
        category: 'Electric Motors & Compressors',
        detectedItem: 'Electric Motor Unit',
        confidence: 0.93,
        estRate: 95,
        advice: 'Dense copper-wound motor unit detected. Separate iron chassis for higher value.',
        filename: file.name,
        dimensions: '1920x1080'
      };
    }

    return {
      category: 'High-grade Printed Circuit Boards (PCBs)',
      detectedItem: 'Electronic Circuit Board',
      confidence: 0.95,
      estRate: 640,
      advice: 'Server/desktop motherboard detected with high gold/copper pin density. Remove heat sinks for maximum yield.',
      filename: file.name,
      dimensions: '1920x1080'
    };
  },

  // --- EWaste Lots & Live Bidding ---
  getLots: async (params?: { collectorId?: string; status?: string; category?: string }): Promise<EWasteLot[]> => {
    try {
      const qs = new URLSearchParams();
      if (params?.collectorId) qs.append('collectorId', params.collectorId);
      if (params?.status) qs.append('status', params.status);
      if (params?.category) qs.append('category', params.category);
      const queryString = qs.toString() ? `?${qs.toString()}` : '';
      const lots = await request<EWasteLot[]>(`/lots${queryString}`);
      if (lots && lots.length > 0) {
        lots.forEach(l => storage.saveLot(l));
        return lots;
      }
    } catch {}
    if (params?.collectorId) {
      return storage.getMyLots(params.collectorId);
    }
    return storage.getLots();
  },

  getLotById: async (id: string): Promise<EWasteLot> => {
    try {
      const lot = await request<EWasteLot>(`/lots/${id}`);
      if (lot) {
        storage.saveLot(lot);
        return lot;
      }
    } catch {}
    const local = storage.getLotById(id);
    if (local) return local;
    throw new Error('Lot not found');
  },

  createLot: async (payload: any): Promise<EWasteLot> => {
    try {
      const lot = await request<EWasteLot>('/lots', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      storage.saveLot(lot);
      return lot;
    } catch {
      // Local fallback
      const ask = Number(payload.askingPrice || payload.estimatedValue || 1500);
      const newLot: EWasteLot = {
        id: `lot-${Date.now()}`,
        lotCode: `KC-LOT-${Math.floor(1000 + Math.random() * 9000)}`,
        collectorId: payload.collectorId || 'mock-kaba-1',
        collectorName: payload.collectorName || 'Suresh Kumar',
        category: payload.category || 'Motherboards',
        approxWeightKg: Number(payload.approxWeightKg) || 10,
        totalItems: Number(payload.totalItems) || 1,
        estimatedValue: Number(payload.estimatedValue) || ask,
        askingPrice: ask,
        minBidAmount: payload.minBidAmount || Math.floor(ask * 0.5),
        recyclerOfferedRate: payload.recyclerOfferedRate || 0,
        status: 'AVAILABLE',
        gpsLat: payload.gpsLat || 28.5685,
        gpsLng: payload.gpsLng || 77.2412,
        locationAddress: payload.locationAddress || 'Mayapuri Scrap Yard',
        locationZone: payload.locationZone || 'West Delhi',
        auctionDurationMins: payload.auctionDurationMins || 60,
        createdAt: new Date().toISOString(),
        qrCode: `KBD-EWASTE-${Date.now().toString().slice(-6)}-IN`,
        traceabilityHash: `0x${Math.random().toString(16).slice(2, 18)}`,
        items: payload.items || []
      };
      storage.saveLot(newLot);
      return newLot;
    }
  },

  placeBid: async (lotId: string, payload: { bidAmount: number; notes?: string; bidPerKg?: number }): Promise<{ lot: EWasteLot; bid: LotBid }> => {
    try {
      const res = await request<{ lot: EWasteLot; bid: LotBid }>(`/lots/${lotId}/bid`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      if (res?.lot) {
        storage.saveLot(res.lot);
      }
      return res;
    } catch {
      const currentUser = storage.getCurrentUser();
      return storage.addBidToLot(lotId, {
        recyclerId: currentUser?.id || 'mock-recycler-1',
        recyclerName: currentUser?.name || 'EcoRecycle Aggregators Ltd',
        bidAmount: payload.bidAmount
      });
    }
  },

  acceptBid: async (lotId: string, bidId?: string): Promise<EWasteLot> => {
    try {
      const res = await request<EWasteLot>(`/lots/${lotId}/accept-bid`, {
        method: 'POST',
        body: JSON.stringify({ bidId })
      });
      if (res) {
        storage.saveLot(res);
        return res;
      }
    } catch {}
    return storage.acceptLotBid(lotId, bidId || '');
  },

  cancelLot: async (lotId: string): Promise<EWasteLot> => {
    try {
      const res = await request<EWasteLot>(`/lots/${lotId}/cancel`, { method: 'POST' });
      if (res) {
        storage.saveLot(res);
        return res;
      }
    } catch {}
    const updated = storage.updateLotStatus(lotId, 'CANCELLED');
    return updated || storage.getLotById(lotId)!;
  },

  // --- Universal Sale Tokens ---
  mintSaleToken: async (payload: any): Promise<SaleToken> => {
    try {
      const token = await request<SaleToken>('/sales/mint', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      return token;
    } catch {
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const hash6 = Math.random().toString(16).slice(2, 8).toUpperCase();
      const tokenNumber = `KBD-SL-${dateStr}-DL-${hash6}`;
      const mockToken: SaleToken = {
        id: `sale-${Date.now()}`,
        tokenNumber,
        lotId: payload.lotId,
        collectorId: payload.collectorId,
        collectorName: payload.collectorName || 'Suresh Kumar',
        collectorPhone: payload.collectorPhone || '9876543210',
        recyclerId: payload.recyclerId,
        recyclerName: payload.recyclerName || 'EcoRecycle Aggregators Ltd',
        cpcbRegNumber: payload.cpcbRegNumber || 'CPCB-EW-2023-DL-0881',
        category: payload.category || 'Motherboards',
        cpcbCategoryCode: 'ITEW2',
        grossWeightKg: payload.grossWeightKg || 25,
        tareWeightKg: payload.tareWeightKg || 2,
        netWeightKg: payload.netWeightKg || 23,
        ratePerKg: payload.ratePerKg || 240,
        totalAmount: payload.totalAmount || 5520,
        paymentMode: payload.paymentMode || 'ESCROW_WALLET',
        eprCredits: payload.netWeightKg || 23,
        createdAt: new Date().toISOString()
      };
      return mockToken;
    }
  },

  getSaleTokens: async (params?: { collectorId?: string; recyclerId?: string }): Promise<SaleToken[]> => {
    try {
      const qs = new URLSearchParams();
      if (params?.collectorId) qs.append('collectorId', params.collectorId);
      if (params?.recyclerId) qs.append('recyclerId', params.recyclerId);
      const queryString = qs.toString() ? `?${qs.toString()}` : '';
      return await request<SaleToken[]>(`/sales${queryString}`);
    } catch {
      return [];
    }
  },

  getSaleTokenByNumber: async (tokenNumber: string): Promise<SaleToken> => {
    return request<SaleToken>(`/sales/${tokenNumber}`);
  },

  verifyPublicSaleToken: async (tokenNumber: string): Promise<any> => {
    return request<any>(`/sales/verify/${tokenNumber}`);
  },

  // --- Double-Blind Reviews ---
  submitReview: async (payload: {
    targetUserId: string;
    saleTokenId?: string;
    ratingOverall: number;
    ratingScaleAcc?: number;
    ratingPayoutSpd?: number;
    ratingPurity?: number;
    reviewText?: string;
  }): Promise<{ review: Review; bothRevealed: boolean }> => {
    return request<{ review: Review; bothRevealed: boolean }>('/reviews', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  getMyReviews: async (): Promise<Review[]> => {
    try {
      return await request<Review[]>('/reviews/my');
    } catch {
      return [];
    }
  },

  getUserReviews: async (userId: string): Promise<Review[]> => {
    try {
      return await request<Review[]>(`/reviews/user/${userId}`);
    } catch {
      return [];
    }
  },

  // --- Contextual Chat & Voice Notes ---
  getChatMessages: async (contextType: 'LOT' | 'PICKUP', contextId: string): Promise<ChatMessage[]> => {
    try {
      return await request<ChatMessage[]>(`/chat/${contextType}/${contextId}`);
    } catch {
      return [];
    }
  },

  sendChatMessage: async (payload: {
    contextType: 'LOT' | 'PICKUP';
    contextId: string;
    text?: string;
    audioUrl?: string;
    imageUrl?: string;
  }): Promise<ChatMessage> => {
    return request<ChatMessage>('/chat', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  markChatRead: async (contextType: 'LOT' | 'PICKUP', contextId: string): Promise<{ success: boolean }> => {
    try {
      return await request<{ success: boolean }>(`/chat/read/${contextType}/${contextId}`, { method: 'POST' });
    } catch {
      return { success: true };
    }
  },

  // --- KYC & Verification ---
  getKycStatus: async (): Promise<KycInfo> => {
    try {
      return await request<KycInfo>('/kyc/status');
    } catch {
      return {
        kycStatus: 'VERIFIED',
        dailyWeightLimitKg: 500,
        maxLotValueInr: 100000,
        canInitiateAuctions: true,
        canReceiveDirectEscrow: true
      };
    }
  },

  submitKycDocuments: async (payload: {
    documentType: string;
    documentNumber: string;
    documentUrl?: string;
    remarks?: string;
  }): Promise<{ kycStatus: string }> => {
    return request<{ kycStatus: string }>('/kyc/submit', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  getPendingKyc: async (): Promise<any[]> => {
    try {
      return await request<any[]>('/kyc/pending');
    } catch {
      return [];
    }
  },

  verifyKyc: async (userId: string, status: 'VERIFIED' | 'REJECTED', remarks?: string): Promise<any> => {
    return request<any>(`/kyc/verify/${userId}`, {
      method: 'POST',
      body: JSON.stringify({ status, remarks })
    });
  },

  // --- Recyclers ---
  getRecyclers: async (): Promise<RecyclerProfile[]> => {
    try {
      return await request<RecyclerProfile[]>('/rates/recyclers');
    } catch {
      const currentUser = storage.getCurrentUser();
      if (currentUser?.recycler) return [currentUser.recycler];
      return [];
    }
  }
};
