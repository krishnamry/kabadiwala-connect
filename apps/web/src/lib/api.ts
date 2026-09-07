import { Pickup, ScrapRate, AdminStats, MLClassificationResult, User } from '../types';

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
  register: (payload: any) => request<{ token: string; user: User }>('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  login: (payload: { phone: string; password: string }) => request<{ token: string; user: User }>('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  getMe: () => request<User>('/auth/me'),
  getDemoUsers: () => request<User[]>('/auth/demo-users'),

  // Rates
  getRates: () => request<ScrapRate[]>('/rates'),

  // Pickups
  createPickup: (payload: any) => request<Pickup>('/pickups', { method: 'POST', body: JSON.stringify(payload) }),
  getMyPickups: () => request<Pickup[]>('/pickups/my'),
  getNearbyPickups: (lat?: number, lng?: number, radius?: number) =>
    request<Pickup[]>(`/pickups/nearby?lat=${lat || 28.5685}&lng=${lng || 77.2412}&radius=${radius || 15}`),
  getPickupById: (id: string) => request<Pickup>(`/pickups/${id}`),
  acceptPickup: (id: string) => request<Pickup>(`/pickups/${id}/accept`, { method: 'POST' }),
  startPickupProgress: (id: string) => request<Pickup>(`/pickups/${id}/in-progress`, { method: 'POST' }),
  completePickup: (id: string, items: { category: string; actualWeightKg: number }[]) =>
    request<{ pickup: Pickup; transaction: any; totalAmount: number }>(`/pickups/${id}/complete`, {
      method: 'POST',
      body: JSON.stringify({ items })
    }),
  cancelPickup: (id: string) => request<Pickup>(`/pickups/${id}/cancel`, { method: 'POST' }),

  // Kabadiwala
  getKabadiwalaWallet: () => request<{ walletBalance: number; totalEarned: number; transactionCount: number; transactions: any[] }>('/kabadiwala/wallet'),
  getKabadiwalaProfile: () => request<any>('/kabadiwala/profile'),
  updateKabadiwalaLocation: (latitude: number, longitude: number) =>
    request<any>('/kabadiwala/location', { method: 'POST', body: JSON.stringify({ latitude, longitude }) }),

  // Admin
  getAdminStats: () => request<AdminStats>('/admin/stats'),
  getAdminKabadiwalas: () => request<any[]>('/admin/kabadiwalas'),
  verifyKabadiwala: (id: string, verified: boolean) =>
    request<any>(`/admin/kabadiwalas/${id}/verify`, { method: 'POST', body: JSON.stringify({ verified }) }),
  getEPRReport: () => request<any>('/admin/reports/epr'),

  // ML Scrap Classification
  classifyScrapImage: async (file: File): Promise<MLClassificationResult> => {
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
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Failed to classify image');
    }

    return data.data;
  }
};
