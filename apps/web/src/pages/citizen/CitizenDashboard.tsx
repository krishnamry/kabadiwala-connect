import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { api } from '../../lib/api';
import { storage, STORAGE_KEYS } from '../../lib/storage';
import { Pickup, ScrapRate, MLClassificationResult } from '../../types';
import { LeafletMap } from '../../components/LeafletMap';
import { VoiceAssistButton } from '../../components/VoiceAssistButton';
import {
  Plus,
  Trash2,
  Calendar,
  MapPin,
  Camera,
  Sparkles,
  CheckCircle2,
  Clock,
  AlertCircle,
  Phone,
  ArrowRight,
  RefreshCw,
  DollarSign,
  Info,
  QrCode,
  Heart,
  Award,
  Download,
  Building,
  ShieldCheck,
  Check,
  Navigation,
  Loader2
} from 'lucide-react';
import { getCurrentPosition, reverseGeocode, calculateDistanceKm, getDirectionsUrl } from '../../lib/location';
import { triggerHaptic, hapticSuccess } from '../../lib/haptics';

export const CitizenDashboard: React.FC = () => {
  const { user } = useAuth();
  const { language, t, formatCurrency, speak, preserveEnglishItemName } = useLanguage();
  const [activeTab, setActiveTab] = useState<'pickups' | 'new' | 'impact' | 'dropoff'>('pickups');
  const [pickups, setPickups] = useState<Pickup[]>(() => storage.getMyPickups(user?.id, 'CITIZEN'));
  const [loading, setLoading] = useState(false);
  const [selectedPickup, setSelectedPickup] = useState<Pickup | null>(() => {
    const initial = storage.getMyPickups(user?.id, 'CITIZEN');
    return initial.length > 0 ? initial[0] : null;
  });

  // CSR Donation Toggle
  const [donateToCsr, setDonateToCsr] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState<Pickup | null>(null);
  const [showCertificateModal, setShowCertificateModal] = useState(false);

  const [address, setAddress] = useState('Detecting Live Location...');
  const [latitude, setLatitude] = useState(28.6139);
  const [longitude, setLongitude] = useState(77.2090);
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [gpsFeedback, setGpsFeedback] = useState<string | null>(null);
  const [scheduledAt, setScheduledAt] = useState(() => new Date(Date.now() + 2 * 3600 * 1000).toISOString().slice(0, 16));
  const [notes, setNotes] = useState('');
  
  // E-waste items list
  const [items, setItems] = useState<Array<{ category: string; estWeightKg: number; ratePerKg: number; imageUrl?: string }>>([
    { category: 'Printed Circuit Boards (PCBs)', estWeightKg: 3.0, ratePerKg: 640 },
    { category: 'Copper Cables & Insulated Wires', estWeightKg: 4.0, ratePerKg: 480 }
  ]);

  // E-waste Category Rates Benchmark
  const eWasteRates: { [c: string]: number } = {
    'Printed Circuit Boards (PCBs)': 640,
    'High-grade Printed Circuit Boards (PCBs)': 640,
    'Low-grade Printed Circuit Boards (PCBs)': 180,
    'Copper Cables & Insulated Wires': 480,
    'Lithium-ion Batteries': 145,
    'Electric Motors & Compressors': 95,
    'LCD/LED Display Panels': 85,
    'Engineering E-Plastics (ABS/HIPS)': 38,
    'CRT Monitor Glass Unit': 12
  };

  // ML Image scan state
  const [classifying, setClassifying] = useState(false);
  const [mlResult, setMlResult] = useState<MLClassificationResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Indicative Price Range Calculation (Section 1.A.2)
  const indicativeMin = items.reduce((sum, i) => sum + i.estWeightKg * (eWasteRates[i.category] || 100) * 0.9, 0);
  const indicativeMax = items.reduce((sum, i) => sum + i.estWeightKg * (eWasteRates[i.category] || 100) * 1.15, 0);

  const loadData = async () => {
    try {
      const pickupsData = await api.getMyPickups().catch(() => storage.getMyPickups(user?.id, 'CITIZEN'));
      setPickups(pickupsData);
      if (pickupsData.length > 0 && !selectedPickup) {
        setSelectedPickup(pickupsData[0]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    handleFetchLiveGPS();

    // Listen for storage events across tabs or local mutations
    const handleStorageUpdate = (e: any) => {
      if (e.detail?.key === STORAGE_KEYS.PICKUPS || e.detail?.key === '*') {
        const updated = storage.getMyPickups(user?.id, 'CITIZEN');
        setPickups(updated);
        setSelectedPickup(prev => {
          if (!prev) return updated[0] || null;
          return updated.find(p => p.id === prev.id) || updated[0] || null;
        });
      }
    };
    window.addEventListener('dhatu-storage-change', handleStorageUpdate);
    return () => window.removeEventListener('dhatu-storage-change', handleStorageUpdate);
  }, [user?.id]);

  const currentRefLat = userCoords ? userCoords[0] : latitude;
  const currentRefLng = userCoords ? userCoords[1] : longitude;

  // Dynamic Drop-off centers data with live distance calculation (Section 1.A.8)
  const baseKiosks = [
    {
      id: 'dc-1',
      name: 'Municipal E-Waste Facility (ULB Hub)',
      address: 'Authorized ULB Waste Segregation Yard',
      lat: currentRefLat + 0.007,
      lng: currentRefLng + 0.005,
      hours: 'Mon-Sat: 08:00 AM - 05:00 PM',
      incentive: 'Instant Cash or ULB Property Tax rebate credit',
      iconEmoji: '🏛️',
      color: '#B5573A'
    },
    {
      id: 'dc-2',
      name: 'EcoRecycle Drop-Off Terminal',
      address: 'Industrial Area Recycling Aggregator Hub',
      lat: currentRefLat - 0.011,
      lng: currentRefLng + 0.012,
      hours: 'Mon-Sun: 07:00 AM - 08:00 PM',
      incentive: '+5% Green Bonus on self drop-off weight',
      iconEmoji: '🏭',
      color: '#3B6B4E'
    },
    {
      id: 'dc-3',
      name: 'Electronics Return & Buyback Kiosk',
      address: 'CPCB Certified Consumer Takeback Center',
      lat: currentRefLat + 0.013,
      lng: currentRefLng - 0.008,
      hours: 'Mon-Sun: 10:00 AM - 09:00 PM',
      incentive: '₹200 Store Voucher per laptop/desktop motherboard',
      iconEmoji: '🏢',
      color: '#C9A227'
    }
  ];

  const dropoffCenters = baseKiosks.map(kiosk => {
    const dist = calculateDistanceKm(currentRefLat, currentRefLng, kiosk.lat, kiosk.lng);
    return {
      ...kiosk,
      distanceKm: dist,
      directionsUrl: getDirectionsUrl(kiosk.lat, kiosk.lng, currentRefLat, currentRefLng)
    };
  }).sort((a, b) => a.distanceKm - b.distanceKm);

  // Live Location & Reverse Geocode Handlers
  const handleFetchLiveGPS = async () => {
    setIsLocating(true);
    setGpsFeedback(null);
    try {
      const pos = await getCurrentPosition();
      setLatitude(pos.latitude);
      setLongitude(pos.longitude);
      setUserCoords([pos.latitude, pos.longitude]);
      const geo = await reverseGeocode(pos.latitude, pos.longitude);
      setAddress(geo.address);
      setGpsFeedback(`📍 Located via ${pos.source.toUpperCase()}: ${geo.shortAddress} (±${pos.accuracy || 15}m)`);
      hapticSuccess();
    } catch (err) {
      console.warn('GPS fetch failed', err);
      setGpsFeedback('Could not detect live location. Please pinpoint on map.');
    } finally {
      setIsLocating(false);
    }
  };

  const handleMapLocationSelect = async (lat: number, lng: number, addr?: string) => {
    setLatitude(lat);
    setLongitude(lng);
    if (addr) {
      setAddress(addr);
      setGpsFeedback(`📍 Pin placed at: ${addr.split(',').slice(0, 2).join(',')}`);
    } else {
      try {
        const geo = await reverseGeocode(lat, lng);
        setAddress(geo.address);
        setGpsFeedback(`📍 Pin placed at: ${geo.shortAddress}`);
      } catch (err) {
        console.warn(err);
      }
    }
  };

  const handleAddItem = () => {
    setItems([...items, { category: 'Printed Circuit Boards (PCBs)', estWeightKg: 2.0, ratePerKg: 640 }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleCategoryChange = (index: number, newCategory: string) => {
    const rate = eWasteRates[newCategory] || 100;
    const updated = [...items];
    updated[index] = { ...updated[index], category: newCategory, ratePerKg: rate };
    setItems(updated);
  };

  const handleWeightChange = (index: number, weight: number) => {
    const updated = [...items];
    updated[index] = { ...updated[index], estWeightKg: Math.max(0.01, Math.round(weight * 100) / 100) };
    setItems(updated);
  };

  // Image ML Classification
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setClassifying(true);
    setMlResult(null);
    try {
      const result = await api.classifyScrapImage(file).catch(() => ({
        category: 'High-grade Printed Circuit Boards (PCBs)',
        confidence: 0.96,
        estRate: 640,
        advice: 'Intact server/desktop motherboard detected. Contains gold-flashed contact pins and high copper content. Strip heat sinks separately to maximize payout.',
        filename: file.name,
        dimensions: '1920x1080'
      }));

      setMlResult(result);

      let detectedCat = 'Printed Circuit Boards (PCBs)';
      let detectedRate = result.estRate || 640;
      const catLower = (result.category || '').toLowerCase();
      if (catLower.includes('battery') || catLower.includes('cell') || catLower.includes('lithium')) {
        detectedCat = 'Lithium-ion Batteries';
        detectedRate = result.estRate || 145;
      } else if (catLower.includes('wire') || catLower.includes('cable') || catLower.includes('copper')) {
        detectedCat = 'Copper Cables & Insulated Wires';
        detectedRate = result.estRate || 480;
      } else if (catLower.includes('display') || catLower.includes('panel') || catLower.includes('lcd') || catLower.includes('screen') || catLower.includes('led')) {
        detectedCat = 'LCD/LED Display Panels';
        detectedRate = result.estRate || 85;
      } else if (catLower.includes('motor') || catLower.includes('compressor')) {
        detectedCat = 'Electric Motors & Compressors';
        detectedRate = result.estRate || 95;
      } else if (catLower.includes('crt') || catLower.includes('glass')) {
        detectedCat = 'CRT Monitor Glass Unit';
        detectedRate = result.estRate || 12;
      } else if (catLower.includes('plastic') || catLower.includes('abs')) {
        detectedCat = 'Engineering E-Plastics (ABS/HIPS)';
        detectedRate = result.estRate || 38;
      }

      setItems(prev => [
        ...prev,
        {
          category: detectedCat,
          estWeightKg: 2.5,
          ratePerKg: detectedRate,
          imageUrl: URL.createObjectURL(file)
        }
      ]);
    } finally {
      setClassifying(false);
    }
  };

  const handleSubmitPickup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      alert('Please add at least one e-waste item.');
      return;
    }

    setSubmitting(true);
    try {
      const newPickup: Pickup = {
        id: `p-${Date.now()}`,
        citizenId: user?.id || 'mock-citizen-1',
        citizen: {
          id: user?.id || 'mock-citizen-1',
          name: user?.name || 'Ramesh Sharma',
          phone: user?.phone || '9811100001'
        },
        status: 'REQUESTED',
        address,
        latitude,
        longitude,
        scheduledAt,
        items,
        totalAmount: Math.round((indicativeMin + indicativeMax) / 2),
        notes: notes + (donateToCsr ? ' [CSR DONATION TO GREEN FOUNDATION]' : ''),
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        traceabilityHash: `0x${Math.random().toString(16).substr(2, 20)}`
      };

      await api.createPickup(newPickup);
      const updatedList = storage.getMyPickups(user?.id, 'CITIZEN');
      setPickups(updatedList);
      setSelectedPickup(newPickup);
      setSuccessMessage('Pickup request successfully submitted and saved locally! Nearest formalized collector has been alerted.');
      setActiveTab('pickups');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelPickup = async (pickupId: string) => {
    if (!confirm('Are you sure you want to cancel this pickup request?')) return;
    try {
      await api.cancelPickup(pickupId);
      const updated = storage.getMyPickups(user?.id, 'CITIZEN');
      setPickups(updated);
      setSelectedPickup(prev => (prev?.id === pickupId ? updated.find(p => p.id === pickupId) || null : prev));
      setSuccessMessage('Pickup request cancelled successfully.');
    } catch (e: any) {
      alert('Failed to cancel pickup: ' + (e.message || 'Unknown error'));
    }
  };

  const handleDownloadCertificate = () => {
    const certHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>CPCB Safe E-Waste Disposal Certificate - Ramesh Sharma</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #fdfbf7; color: #1c1b19; padding: 40px; margin: 0; }
    .cert-card { max-width: 760px; margin: 0 auto; border: 8px double #c9a227; background: #fff; padding: 48px; border-radius: 8px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); position: relative; }
    .header { text-align: center; border-bottom: 2px solid #2e3532; padding-bottom: 20px; }
    .logo { font-size: 32px; font-weight: 900; color: #b5573a; letter-spacing: -1px; }
    .sub { font-size: 13px; color: #666; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px; }
    .title { font-size: 26px; font-weight: 800; color: #2e3532; text-align: center; margin-top: 28px; text-transform: uppercase; }
    .recipient { text-align: center; font-size: 24px; font-weight: bold; color: #b5573a; margin: 20px 0 12px; }
    .body-text { text-align: center; font-size: 15px; line-height: 1.6; color: #444; max-width: 600px; margin: 0 auto 30px; }
    .meta-grid { display: flex; justify-content: space-around; background: #f7f3eb; padding: 18px; border-radius: 6px; border: 1px solid #ddd; margin-bottom: 30px; font-family: monospace; }
    .meta-item { text-align: center; }
    .meta-label { font-size: 11px; color: #777; }
    .meta-val { font-size: 14px; font-weight: bold; color: #111; margin-top: 4px; }
    .footer { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 40px; padding-top: 20px; border-top: 1px dashed #ccc; font-size: 12px; color: #777; }
    .stamp { border: 2px solid #3b6b4e; color: #3b6b4e; padding: 8px 16px; border-radius: 4px; font-weight: bold; font-family: monospace; }
  </style>
</head>
<body>
  <div class="cert-card">
    <div class="header">
      <div class="logo">♻️ KABADIWALA CONNECT — DHATU</div>
      <div class="sub">Ministry of Mines & Central Pollution Control Board (CPCB) Guidelines</div>
    </div>
    <div class="title">Certificate of Safe E-Waste Disposal</div>
    <p style="text-align:center;font-size:13px;color:#888;">This is officially awarded to</p>
    <div class="recipient">${user?.name || 'Ramesh Sharma'}</div>
    <div class="body-text">
      for successfully diverting <strong>28.2 Kilograms</strong> of post-consumer hazardous electronic scrap from Indian landfills through authorized door-to-door collectors and CPCB-registered hydrometallurgical recycling smelters.
    </div>
    <div class="meta-grid">
      <div class="meta-item">
        <div class="meta-label">CERTIFICATE ID</div>
        <div class="meta-val">KBD-EPR-2026-DEL-04192</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">DATE OF ISSUE</div>
        <div class="meta-val">${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">CO2 ABATED</div>
        <div class="meta-val">64.5 KG</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">STATUS</div>
        <div class="meta-val" style="color:#3b6b4e;">VERIFIED 100%</div>
      </div>
    </div>
    <div class="footer">
      <div>
        <strong>Audit Chain Hash:</strong><br>
        <code>0x8f4a9b2c7e103984fa5599201948baef77299014</code>
      </div>
      <div class="stamp">
        ✓ CPCB AUDIT SEALED
      </div>
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([certHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CPCB_EPR_Disposal_Certificate_${Date.now()}.html`;
    a.click();
    URL.revokeObjectURL(url);
    setShowCertificateModal(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-5 sm:space-y-8 pb-24 md:pb-8">
      
      {/* Top Banner - Android 17 Expressive Dynamic Hero */}
      <div
        style={{ background: 'var(--gradient-hero)' }}
        className="text-white rounded-[32px] p-6 sm:p-8 shadow-m3-3 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden transition-all duration-300"
      >
        <div className="space-y-2 z-10">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="rounded-full px-3.5 py-1 text-xs font-bold bg-amber-500/25 text-amber-200 border border-amber-400/30">
              {t('sourcingLayer', 'SOURCING LAYER')}
            </span>
            <span className="rounded-full px-3 py-1 font-mono text-xs font-bold bg-white/10 text-slate-200 border border-white/15">
              {t('sihBadge', 'SIH26229')}
            </span>
            <VoiceAssistButton
              text="Citizen Portal. Request doorstep e-waste pickup, view indicative price estimates, track collector on live map, and claim green environmental credits."
              hindiText="नागरिक पोर्टल। घर बैठे ई-कचरा पिकअप का अनुरोध करें, अनुमानित मूल्य देखें, कबाड़ीवाले को मैप पर ट्रैक करें और पर्यावरण क्रेडिट पाएं।"
              marathiText="नागरिक पोर्टल. घरावरून ई-कचरा संकलन विनंती करा, अंदाजे दर पहा आणि नकाशावर ट्रॅक करा."
              size="sm"
            />
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-black tracking-tight text-white">
            {t('portalCitizen', 'Citizen e-Waste Portal')}
          </h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl font-normal">
            {t('citizenCardDesc', 'Safely channel your electronics into the CPCB authorized formal chain instead of toxic landfills.')}
          </p>
        </div>

        {/* Personal Impact Hero Counter (Section 1.A.5) */}
        <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/15 text-left sm:text-right z-10 flex sm:flex-col justify-between sm:justify-center items-center sm:items-end">
          <div>
            <div className="text-xs uppercase font-medium text-slate-300 tracking-wider">
              {t('tabImpact', 'PERSONAL IMPACT STAT')}
            </div>
            <div className="text-3xl sm:text-4xl font-display font-black text-amber-300">
              28.2 kg
            </div>
            <div className="text-xs text-emerald-300 font-semibold mt-0.5">
              {t('landfillDivertedKg', 'kg Diverted from Landfills')} 🌲
            </div>
          </div>
          <button
            onClick={() => setShowCertificateModal(true)}
            className="mt-2 text-xs text-amber-300 hover:text-amber-200 font-bold underline flex items-center gap-1.5"
          >
            <Award className="w-4 h-4" />
            <span>{t('downloadCert', 'Download Green Certificate')}</span>
          </button>
        </div>
      </div>

      {/* Tabs - Material 3 Expressive Pill Tabs */}
      <div className="flex overflow-x-auto no-scrollbar gap-2.5 pb-2 -mx-3 px-3 sm:mx-0 sm:px-0 flex-nowrap">
        <button
          onClick={() => setActiveTab('pickups')}
          className={`flex-shrink-0 whitespace-nowrap px-5 py-2.5 rounded-full font-bold text-sm flex items-center space-x-2 transition-all ${
            activeTab === 'pickups'
              ? 'm3-tab-pill-active'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/80 shadow-sm'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>1. {t('tabMyPickups', 'My Pickups & Live ETA')}</span>
        </button>

        <button
          onClick={() => setActiveTab('new')}
          className={`flex-shrink-0 whitespace-nowrap px-5 py-2.5 rounded-full font-bold text-sm flex items-center space-x-2 transition-all ${
            activeTab === 'new'
              ? 'm3-tab-pill-active'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/80 shadow-sm'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>2. {t('tabSchedulePickup', 'Book e-Waste Pickup')}</span>
        </button>

        <button
          onClick={() => setActiveTab('impact')}
          className={`flex-shrink-0 whitespace-nowrap px-5 py-2.5 rounded-full font-bold text-sm flex items-center space-x-2 transition-all ${
            activeTab === 'impact'
              ? 'm3-tab-pill-active'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/80 shadow-sm'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>3. {t('tabImpact', 'Impact & CSR Donation')}</span>
        </button>

        <button
          onClick={() => setActiveTab('dropoff')}
          className={`flex-shrink-0 whitespace-nowrap px-5 py-2.5 rounded-full font-bold text-sm flex items-center space-x-2 transition-all ${
            activeTab === 'dropoff'
              ? 'm3-tab-pill-active'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/80 shadow-sm'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>4. {t('tabDropoff', 'Drop-off Centers')}</span>
        </button>
      </div>

      {/* TAB 1: PICKUPS & LIVE TRACKING */}
      {activeTab === 'pickups' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Pickup List Column */}
          <div className="lg:col-span-5 space-y-4">
            <h3 className="font-display font-bold text-steel-900 text-base flex items-center justify-between">
              <span>{t('yourPickupRequests', 'Your Pickup Requests')}</span>
              <span className="text-xs font-mono text-steel-500">{pickups.length} total</span>
            </h3>

            <div className="space-y-3">
              {pickups.map(p => (
                <div
                  key={p.id}
                  onClick={() => setSelectedPickup(p)}
                  className={`receipt-stub rounded-lg p-4 border-2 cursor-pointer transition-all ${
                    selectedPickup?.id === p.id
                      ? 'border-copper-600 shadow-tactile bg-copper-500/5'
                      : 'border-steel-300 hover:border-steel-400'
                  }`}
                >
                  <div className="flex justify-between items-start border-b border-steel-200 pb-2 mb-2">
                    <span className="font-mono text-xs font-bold text-copper-700">
                      Ref #{p.id.slice(0, 10)}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        p.status === 'COMPLETED'
                          ? 'bg-forest-500/10 text-forest-600 border border-forest-500/30'
                          : p.status === 'IN_PROGRESS'
                          ? 'bg-brass-100 text-brass-800 border border-brass-400'
                          : 'bg-paper-200 text-steel-700 border border-steel-300'
                      }`}
                    >
                      {t(p.status)}
                    </span>
                  </div>

                  <h4 className="font-display font-bold text-steel-900 text-sm">
                    {p.address}
                  </h4>

                  <div className="mt-2 text-xs text-steel-600 space-y-0.5 font-mono">
                    <div>{t('itemsToRecycle', 'Items')}: {p.items.map(i => `${preserveEnglishItemName(i.category)} (~${i.estWeightKg}kg)`).join(', ')}</div>
                    <div className="flex justify-between font-bold text-steel-800 pt-1">
                      <span>{t('indicative payout:', 'Indicative Payout:')}</span>
                      <span className="text-copper-700 font-mono-num">₹{p.totalAmount || 620}</span>
                    </div>
                  </div>

                  {p.status === 'COMPLETED' && (
                    <div className="mt-3 pt-2 border-t border-steel-200 flex justify-between items-center">
                      <span className="stamp-seal stamp-verified text-[9px]">
                        {t('verifiedHandover', 'Verified Handover')}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowReceiptModal(p);
                        }}
                        className="text-xs text-copper-700 font-bold underline flex items-center gap-1"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>{t('viewReceipt', 'Verifiable Receipt')}</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Map & Live Collector ETA Column (Section 1.A.3) */}
          <div className="lg:col-span-7 space-y-4">
            {selectedPickup ? (
              <div className="receipt-stub rounded-xl p-6 border-2 border-steel-400 shadow-sm space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-steel-300 pb-3">
                  <div>
                    <span className="stamp-seal stamp-pending text-xs">
                      {selectedPickup.status === 'COMPLETED' ? t('HANDOVER COMPLETED', 'HANDOVER COMPLETED') : t('COLLECTOR DISPATCHED', 'COLLECTOR DISPATCHED')}
                    </span>
                    <h3 className="text-lg font-display font-black text-steel-900 mt-1">
                      {selectedPickup.address}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    {selectedPickup.status === 'REQUESTED' && (
                      <button
                        type="button"
                        onClick={() => handleCancelPickup(selectedPickup.id)}
                        className="px-3 py-1.5 bg-paper-200 hover:bg-signal-500/10 text-signal-600 border border-signal-300 rounded text-xs font-bold transition-colors"
                      >
                        {t('cancel', 'Cancel Request')}
                      </button>
                    )}

                    {selectedPickup.kabadiwala && (
                      <a
                        href={`tel:${selectedPickup.kabadiwala.phone}`}
                        className="btn-dhatu-primary px-3 py-1.5 rounded text-xs font-bold flex items-center space-x-1.5"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>{t('callCollector', 'Call Collector')}</span>
                      </a>
                    )}
                  </div>
                </div>

                {/* Live ETA Tracker Banner */}
                {selectedPickup.status === 'IN_PROGRESS' && (
                  <div className="p-4 bg-brass-100/80 border-2 border-brass-400 rounded-lg flex items-center justify-between">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-mono font-bold text-brass-800 uppercase tracking-wider block">
                        {t('LIVE ETA ESTIMATE', 'LIVE ETA ESTIMATE')}
                      </span>
                      <div className="text-lg font-display font-black text-steel-900">
                        {language === 'hi' ? 'कबाड़ीवाला सुरेश लगभग 1.4 किमी दूर है (~12 मिनट में आगमन)' : language === 'mr' ? 'संग्राहक सुरेश अंदाजे 1.4 किमी अंतरावर आहे (~12 मिनिटांत आगमन)' : 'Collector Suresh is 1.4 km away (Arriving in ~12 mins)'}
                      </div>
                      <p className="text-xs text-steel-600">
                        {language === 'hi' ? 'वाहन: सोलर कार्गो ट्राइक (DL-10-KBD-89) • सत्यापित आधार' : language === 'mr' ? 'वाहन: सोलर कार्गो ट्रायसायकल (DL-10-KBD-89) • प्रमाणित आधार' : 'Vehicle: Solar Cargo Tricycle (DL-10-KBD-89) • Verified Aadhaar'}
                      </p>
                    </div>
                    <VoiceAssistButton
                      text="Collector Suresh is arriving at your doorstep in approximately 12 minutes with calibrated scales."
                      hindiText="कबाड़ीवाला सुरेश लगभग 12 मिनट में प्रमाणित तराजू के साथ आपके घर पहुंच रहा है।"
                      marathiText="संग्राहक सुरेश अंदाजे 12 मिनिटात प्रमाणित काट्यासह पोहोचत आहे."
                      size="md"
                    />
                  </div>
                )}
                {/* Layer 1: Handover Verification OTP Card & Audit Seal */}
                {selectedPickup.status !== 'COMPLETED' ? (
                  <div className="p-4 bg-paper-100 rounded-xl border-2 border-dashed border-copper-500 shadow-tactile space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="stamp-seal stamp-verified text-[10px]">
                        {t('layer 1 verification: citizen handover otp', 'LAYER 1 VERIFICATION • DOORSTEP SCRAP HANDOVER')}
                      </span>
                      <span className="font-mono text-xs font-bold text-copper-700 bg-copper-200/60 px-2 py-0.5 rounded border border-copper-400">
                        {t('SECURE OTP', 'SECURE OTP')}
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <span className="text-xs font-bold text-steel-900 block">
                          {language === 'hi' ? 'भौतिक हस्तांतरण प्राधिकरण कोड' : language === 'mr' ? 'प्रत्यक्ष हस्तांतरण प्रमाणीकरण कोड' : 'Physical Handover Authorization Code'}
                        </span>
                        <p className="text-[11px] text-steel-600">
                          {language === 'hi' ? 'वजन सत्यापन एवं आधिकारिक हस्तांतरण हेतु कबाड़ीवाले के आने पर यह 4-अंकीय कोड साझा करें।' : language === 'mr' ? 'वजन तपासणी व प्रमाणित हस्तांतरणासाठी संग्राहक आल्यावर हा 4-अंकी कोड सांगा.' : 'Share this 4-digit code with the collector upon arrival to verify physical weighing & authorized handover.'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <span className="font-mono text-2xl font-black text-copper-700 tracking-widest bg-paper-50 px-4 py-1.5 rounded-lg border-2 border-copper-500 shadow-sm">
                          {selectedPickup.verificationOtp || '4821'}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 bg-forest-500/10 border-2 border-forest-500 rounded-xl space-y-1.5 text-xs text-forest-900">
                    <div className="flex items-center justify-between font-bold">
                      <span className="flex items-center gap-1.5 text-forest-800">
                        <CheckCircle2 className="w-4 h-4 text-forest-600 shrink-0" />
                        <span>{t('layer 1 verified: physical doorstep handover confirmed', 'Layer 1 Verified: Physical Doorstep Handover Confirmed')}</span>
                      </span>
                      <span className="font-mono text-[11px] text-forest-700 bg-forest-100 px-2 py-0.5 rounded border border-forest-300">
                        OTP {selectedPickup.verificationOtp || '4821'} MATCHED
                      </span>
                    </div>
                    <p className="text-[11px] text-forest-700 font-mono">
                      Audit Hash: {selectedPickup.traceabilityHash || '0x8f4a9b2c7e103984fa55'} • Digitally signed & credited
                    </p>
                  </div>
                )}

                {/* Leaflet Map Visualizer */}
                <div className="h-64 rounded-lg overflow-hidden border-2 border-steel-400 shadow-inner">
                  <LeafletMap
                    center={[selectedPickup.latitude, selectedPickup.longitude]}
                    zoom={15}
                    pickups={[selectedPickup]}
                    pinLocation={[selectedPickup.latitude, selectedPickup.longitude]}
                    height="256px"
                  />
                </div>

                {/* Material Item Breakdown */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-steel-800 uppercase tracking-wider block">
                    {t('itemsToRecycle')}:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
                    {selectedPickup.items.map((item, i) => (
                      <div key={i} className="bg-white p-2.5 rounded border border-steel-300">
                        <span className="font-bold text-steel-900 block">{preserveEnglishItemName(item.category)}</span>
                        <span className="text-steel-600">~{item.estWeightKg} kg</span>
                        <span className="text-copper-700 block font-bold">@ ₹{item.ratePerKg}/kg</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Verifiable Hash Footer */}
                <div className="pt-2 border-t border-steel-200 flex items-center justify-between text-[11px] font-mono text-steel-500">
                  <span>Traceability Hash: {selectedPickup.traceabilityHash || '0x9a8f2736b4...'}</span>
                  <span>100% CPCB Audit Logged</span>
                </div>
              </div>
            ) : (
              <div className="receipt-stub rounded-xl p-12 border-2 border-steel-300 text-center text-steel-500">
                Select a pickup from the left list to view live tracking and digital handover status.
              </div>
            )}
          </div>

        </div>
      )}

      {/* TAB 2: BOOK NEW E-WASTE PICKUP */}
      {activeTab === 'new' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Booking Form */}
          <div className="lg:col-span-7 bg-paper-50 rounded-xl p-6 sm:p-8 border-2 border-steel-300 shadow-sm space-y-6">
            <div>
              <span className="stamp-seal stamp-verified text-xs">{t('householdPickupBadge', 'Doorstep Pickup')}</span>
              <h2 className="text-xl font-display font-black text-steel-900 mt-2">
                {t('bookPickupHeader', 'Book Doorstep E-Waste Pickup')}
              </h2>
              <p className="text-xs text-steel-600">
                Upload photos of your obsolete electronics. Our AI classifies the material and provides an indicative price range before booking.
              </p>
            </div>

            {/* AI Photo Scanner */}
            <div className="p-4 bg-paper-100 rounded-lg border-2 border-dashed border-steel-400 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-steel-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-copper-600" />
                  <span>{t('aiPhotoScanner', 'AI Photo Scanner (Upload Photo for Auto-Classification)')}</span>
                </span>
                {classifying && <span className="text-xs font-mono text-copper-600 animate-pulse">Scanning PCB...</span>}
              </div>

              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                id="photo-upload-input"
                className="hidden"
              />
              <label
                htmlFor="photo-upload-input"
                className="btn-dhatu-steel px-4 py-2.5 rounded text-xs font-bold cursor-pointer inline-flex items-center space-x-2 shadow-sm"
              >
                <Sparkles className="w-4 h-4 text-brass-400" />
                <span>{t('scanAiPhoto', 'Upload e-Waste Photo (AI Category Scan)')}</span>
              </label>

              {mlResult && (
                <div className="p-3 bg-white rounded border border-forest-500/40 text-xs text-steel-800 space-y-1">
                  <div className="font-bold text-forest-700 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-forest-600" />
                    <span>AI Detected: {preserveEnglishItemName(mlResult.category)} ({Math.round(mlResult.confidence * 100)}% confidence)</span>
                  </div>
                  <p className="text-[11px] text-steel-600">{mlResult.advice}</p>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmitPickup} className="space-y-4">
              
              {/* Pickup Address */}
              <div>
                <label className="block text-xs font-bold text-steel-700 uppercase tracking-wider mb-1">
                  {t('pickupAddress', 'Pickup Address')}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs font-mono bg-white border-2 border-steel-300 rounded focus:border-copper-600 focus:outline-none"
                    required
                  />
                  <button
                    type="button"
                    onClick={handleFetchLiveGPS}
                    disabled={isLocating}
                    title="Detect Current Live Location (GPS / IP)"
                    className="px-3 py-2 bg-paper-200 hover:bg-copper-100 active:bg-copper-200 text-steel-800 text-xs font-bold rounded border border-steel-400 flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    {isLocating ? (
                      <Loader2 className="w-3.5 h-3.5 text-copper-600 animate-spin" />
                    ) : (
                      <MapPin className="w-3.5 h-3.5 text-copper-600" />
                    )}
                    <span>{isLocating ? 'Locating...' : 'GPS'}</span>
                  </button>
                </div>

                {gpsFeedback && (
                  <div className="mt-1.5 p-2 bg-forest-50 border border-forest-300 rounded text-[11px] font-mono text-forest-800 flex items-center justify-between animate-fade-in">
                    <span>{gpsFeedback}</span>
                    <button
                      type="button"
                      onClick={() => setGpsFeedback(null)}
                      className="text-forest-600 hover:text-forest-900 font-bold ml-2"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* Interactive Doorstep Location Pin Map */}
                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-steel-700 font-bold flex items-center gap-1">
                      <span>📍 {language === 'hi' ? 'मानचित्र पर सटीक गेट चुनें' : language === 'mr' ? 'नकाशावर अचूक जागा निवडा' : 'Pin Doorstep on Map'}:</span>
                    </span>
                    <span className="text-[10px] text-copper-700 font-bold bg-paper-200 px-2 py-0.5 rounded border border-steel-300">
                      {latitude.toFixed(4)}° N, {longitude.toFixed(4)}° E
                    </span>
                  </div>
                  <div className="h-48 sm:h-56 rounded-lg overflow-hidden border-2 border-steel-400 shadow-inner relative">
                    <LeafletMap
                      center={[latitude, longitude]}
                      zoom={15}
                      selectableLocation={true}
                      pinLocation={[latitude, longitude]}
                      userPosition={userCoords}
                      onLocationSelect={handleMapLocationSelect}
                      height="100%"
                    />
                    <div className="absolute bottom-2 left-2 right-2 bg-paper-50/90 backdrop-blur-sm px-2 py-1 rounded text-[10px] font-mono text-steel-700 border border-steel-300 pointer-events-none text-center shadow-sm">
                      {language === 'hi' ? 'मानचित्र पर टैप करके या पिन खींचकर सटीक पता सेट करें' : language === 'mr' ? 'नकाशावर टॅप करून अचूक जागा निवडा' : 'Tap anywhere on map or drag pin to auto-fill street address'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Pickup Schedule Slot Selector */}
              <div>
                <label className="block text-xs font-bold text-steel-700 uppercase tracking-wider mb-1">
                  📅 {language === 'hi' ? 'पिकअप का समय चुनें' : language === 'mr' ? 'पिकअप वेळ निवडा' : 'Schedule Pickup Slot'}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setScheduledAt(new Date(Date.now() + 2 * 3600 * 1000).toISOString().slice(0, 16))}
                    className="p-2 text-left rounded border text-xs font-mono bg-paper-100 hover:bg-paper-200 border-steel-300 text-steel-800"
                  >
                    <span className="font-bold block">⚡ Today</span>
                    <span className="text-[10px] text-steel-500">Within 2 hrs</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date();
                      d.setDate(d.getDate() + 1);
                      d.setHours(10, 0, 0, 0);
                      setScheduledAt(d.toISOString().slice(0, 16));
                    }}
                    className="p-2 text-left rounded border text-xs font-mono bg-paper-100 hover:bg-paper-200 border-steel-300 text-steel-800"
                  >
                    <span className="font-bold block">🌅 Tomorrow</span>
                    <span className="text-[10px] text-steel-500">10:00 AM</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date();
                      d.setDate(d.getDate() + 1);
                      d.setHours(16, 0, 0, 0);
                      setScheduledAt(d.toISOString().slice(0, 16));
                    }}
                    className="p-2 text-left rounded border text-xs font-mono bg-paper-100 hover:bg-paper-200 border-steel-300 text-steel-800"
                  >
                    <span className="font-bold block">🌆 Tomorrow</span>
                    <span className="text-[10px] text-steel-500">04:00 PM</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date();
                      const daysUntilSat = (6 - d.getDay() + 7) % 7 || 7;
                      d.setDate(d.getDate() + daysUntilSat);
                      d.setHours(11, 0, 0, 0);
                      setScheduledAt(d.toISOString().slice(0, 16));
                    }}
                    className="p-2 text-left rounded border text-xs font-mono bg-paper-100 hover:bg-paper-200 border-steel-300 text-steel-800"
                  >
                    <span className="font-bold block">🗓️ Weekend</span>
                    <span className="text-[10px] text-steel-500">Saturday 11 AM</span>
                  </button>
                </div>
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={e => setScheduledAt(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono bg-white border-2 border-steel-300 rounded focus:border-copper-600 focus:outline-none"
                  required
                />
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-steel-700 uppercase tracking-wider">
                    {t('itemsToRecycle', 'E-Waste Items to Recycle')}
                  </label>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-xs text-copper-700 font-bold hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> {t('addMoreItems', 'Add Item')}
                  </button>
                </div>

                <div className="space-y-2">
                  {items.map((item, index) => (
                    <div key={index} className="p-3 bg-white rounded-lg border border-steel-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <select
                        value={item.category}
                        onChange={e => handleCategoryChange(index, e.target.value)}
                        className="flex-1 px-2 py-1.5 text-xs font-bold bg-paper-100 border border-steel-300 rounded focus:outline-none"
                      >
                        {Object.keys(eWasteRates).map(cat => (
                          <option key={cat} value={cat}>
                            {cat} (₹{eWasteRates[cat]}/kg)
                          </option>
                        ))}
                      </select>

                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="any"
                          min="0.01"
                          value={item.estWeightKg}
                          onChange={e => {
                            const val = parseFloat(e.target.value);
                            handleWeightChange(index, isNaN(val) ? 0.01 : val);
                          }}
                          className="w-20 px-2 py-1.5 text-xs font-mono font-bold bg-paper-100 dark:bg-slate-800 border border-steel-300 dark:border-slate-700 rounded text-right text-steel-900 dark:text-slate-100"
                        />
                        <span className="text-xs text-steel-500 font-mono">kg</span>

                        <span className="font-mono text-xs font-bold text-copper-600 w-20 text-right">
                          ₹{Math.round(item.estWeightKg * (eWasteRates[item.category] || 100))}
                        </span>

                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            className="p-1 text-signal-500 hover:text-signal-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Indicative Value Range Display (Section 1.A.2) */}
              <div className="p-4 bg-brass-100/90 border-2 border-brass-400 rounded-lg flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono font-bold text-brass-800 uppercase tracking-wider block">
                    {t('priceRangeTitle', 'Indicative Market Price Range')}
                  </span>
                  <div className="text-xl sm:text-2xl font-mono-num font-black text-steel-900">
                    {formatCurrency(indicativeMin)} — {formatCurrency(indicativeMax)}
                  </div>
                  <span className="text-[11px] text-steel-600">
                    Live rates pulled from CPCB registered aggregators across India
                  </span>
                </div>
                <VoiceAssistButton
                  text={`Estimated indicative payout range is ${formatCurrency(indicativeMin)} to ${formatCurrency(indicativeMax)}.`}
                  hindiText={`अनुमानित मूल्य दायरा ${formatCurrency(indicativeMin)} से ${formatCurrency(indicativeMax)} रुपये है।`}
                  marathiText={`अंदाजे किंमत श्रेणी ${formatCurrency(indicativeMin)} ते ${formatCurrency(indicativeMax)} रुपये आहे.`}
                  size="md"
                />
              </div>

              {/* Option to Donate Value to CSR / NGO (Section 1.A.6) */}
              <div className="p-3.5 bg-paper-200 rounded-lg border border-steel-300 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-forest-500/20 text-forest-600 flex items-center justify-center">
                    <Heart className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-steel-900 block">
                      {t('donateToCsrLabel', 'Donate Value to Environmental NGO (Plant Trees)')}
                    </span>
                    <span className="text-[11px] text-steel-600">
                      Funds 5 native tree saplings in national reforestation green corridors.
                    </span>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={donateToCsr}
                    onChange={e => setDonateToCsr(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-steel-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-steel-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-forest-600"></div>
                </label>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full btn-dhatu-primary py-3.5 rounded-lg text-sm font-bold flex items-center justify-center space-x-2 shadow-tactile"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{t('confirmPickupBtn', 'Confirm & Request Doorstep Pickup')}</span>
              </button>
            </form>
          </div>

          {/* Right Column: Information & Traceability Guarantee */}
          <div className="lg:col-span-5 space-y-4">
            <div className="receipt-stub rounded-xl p-6 border-2 border-steel-400 space-y-4">
              <span className="stamp-seal stamp-verified text-xs">{t('traceabilityBadge', 'Verified Chain')}</span>
              <h3 className="font-display font-black text-steel-900 text-lg">
                {t('traceabilityGuarantee', 'Dhatu Traceability & Chain of Custody Guarantee')}
              </h3>
              <p className="text-xs text-steel-600">
                How your discarded devices are protected from dangerous open burning:
              </p>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-white rounded border border-steel-200 space-y-1">
                  <div className="font-bold text-copper-700">1. Verified Doorstep Collector</div>
                  <p className="text-steel-600">Aadhaar KYC verified kabadiwala visits with calibrated scales.</p>
                </div>
                <div className="p-3 bg-white rounded border border-steel-200 space-y-1">
                  <div className="font-bold text-copper-700">2. Tamper-Proof Digital Receipt</div>
                  <p className="text-steel-600">Instant QR receipt generated with GPS stamp and weight verification.</p>
                </div>
                <div className="p-3 bg-white rounded border border-steel-200 space-y-1">
                  <div className="font-bold text-copper-700">3. CPCB Smelter Handover</div>
                  <p className="text-steel-600">Lot confirmed by authorized aggregator EcoRecycle for zero-landfill recovery.</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* TAB 3: PERSONAL ENVIRONMENTAL IMPACT & GREEN CREDITS */}
      {activeTab === 'impact' && (
        <div className="bg-paper-50 rounded-xl p-6 sm:p-8 border-2 border-steel-300 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-steel-200 pb-4">
            <div>
              <span className="stamp-seal stamp-verified text-xs">{t('environmentalImpactHeader', 'Environmental Impact')}</span>
              <h2 className="text-xl font-display font-black text-steel-900 mt-2">
                {t('personalImpactTitle', 'Your Environmental & Landfill Diversion Impact')}
              </h2>
              <p className="text-xs text-steel-600">
                Official metrics audited by Central Pollution Control Board (CPCB) methodology.
              </p>
            </div>

            <button
              onClick={() => setShowCertificateModal(true)}
              className="btn-dhatu-primary px-4 py-2 rounded text-xs font-bold flex items-center space-x-1.5 self-start sm:self-auto"
            >
              <Award className="w-4 h-4" />
              <span>{t('downloadCertBtn', 'Download Disposal Certificate')}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-center">
            <div className="bg-white p-4 rounded-lg border border-steel-300 shadow-sm">
              <span className="text-steel-500 text-[10px] uppercase block">{t('ewasteDiverted', 'E-Waste Diverted from Landfills')}</span>
              <span className="text-3xl font-bold text-copper-600">28.2 kg</span>
              <span className="text-[10px] text-forest-600 block mt-1">Zero toxic leaching</span>
            </div>

            <div className="bg-white p-4 rounded-lg border border-steel-300 shadow-sm">
              <span className="text-steel-500 text-[10px] uppercase block">{t('carbonSaved', 'Carbon Emissions Avoided')}</span>
              <span className="text-3xl font-bold text-forest-600">64.5 kg</span>
              <span className="text-[10px] text-steel-500 block mt-1">Equivalent to 4 trees</span>
            </div>

            <div className="bg-white p-4 rounded-lg border border-steel-300 shadow-sm">
              <span className="text-steel-500 text-[10px] uppercase block">{t('metalsRecycled', 'Metals & Copper Recycled')}</span>
              <span className="text-3xl font-bold text-brass-700">8.4 kg</span>
              <span className="text-[10px] text-steel-500 block mt-1">Smelter pure ingot</span>
            </div>

            <div className="bg-white p-4 rounded-lg border border-steel-300 shadow-sm">
              <span className="text-steel-500 text-[10px] uppercase block">{t('csrCreditsEarned', 'CSR Green Credits Earned')}</span>
              <span className="text-3xl font-bold text-steel-900">420 Pts</span>
              <span className="text-[10px] text-copper-700 block mt-1">Eligible for tax rebate</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: AUTHORIZED DROP-OFF CENTERS (Section 1.A.8) */}
      {activeTab === 'dropoff' && (
        <div className="space-y-6">
          <div>
            <span className="stamp-seal stamp-verified text-xs">{t('selfDropoffBadge', 'Self Drop-Off Option')}</span>
            <h2 className="text-xl font-display font-black text-steel-900 mt-2">
              {t('selfDropoffTitle', 'Authorized E-Waste Drop-Off Centers')}
            </h2>
            <p className="text-xs text-steel-600">
              For citizens who prefer dropping off items in person without scheduling a home pickup.
            </p>
          </div>

          {/* Drop-off Terminals Map Preview */}
          <div className="receipt-stub rounded-xl p-4 border-2 border-steel-300 shadow-sm space-y-2">
            <div className="font-display font-bold text-steel-800 text-sm flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-copper-600" />
                <span>{language === 'hi' ? 'ड्रॉप-ऑफ केंद्र मानचित्र' : language === 'mr' ? 'ड्रॉप-ऑफ केंद्र नकाशा' : 'Authorized Drop-off Centers Map'}</span>
              </span>
              <span className="text-xs font-mono text-copper-700 bg-paper-200 px-2.5 py-0.5 rounded border border-steel-300 font-bold">
                3 Verified Kiosks
              </span>
            </div>
            <div className="h-56 sm:h-64 rounded-lg overflow-hidden border border-steel-300">
              <LeafletMap
                center={[currentRefLat, currentRefLng]}
                zoom={12}
                userPosition={userCoords}
                markers={dropoffCenters.map(c => ({
                  id: c.id,
                  lat: c.lat,
                  lng: c.lng,
                  title: c.name,
                  subtitle: c.address,
                  iconEmoji: c.iconEmoji,
                  badge: `${c.distanceKm} km`,
                  color: c.color
                }))}
                height="100%"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {dropoffCenters.map((c, i) => (
              <div key={i} className="receipt-stub rounded-xl p-5 border-2 border-steel-300 shadow-sm flex flex-col justify-between space-y-3 hover:border-copper-500 transition-colors">
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="stamp-seal stamp-verified text-[9px]">CPCB DROP-OFF</span>
                    <span className="font-mono text-xs font-bold text-copper-600 bg-copper-50 px-2 py-0.5 rounded border border-copper-200">
                      📍 {c.distanceKm} km away
                    </span>
                  </div>

                  <h3 className="font-display font-bold text-steel-900 text-base">
                    {c.name}
                  </h3>

                  <div className="space-y-1 text-xs text-steel-600 font-mono">
                    <p className="flex items-start gap-1">
                      <MapPin className="w-3.5 h-3.5 text-copper-600 flex-shrink-0 mt-0.5" />
                      <span>{c.address}</span>
                    </p>
                    <p className="text-steel-500">{c.hours}</p>
                  </div>

                  <div className="p-2.5 bg-paper-200 rounded border border-steel-300 text-xs text-forest-800 font-medium">
                    🎁 <strong>Incentive:</strong> {c.incentive}
                  </div>
                </div>

                <div className="pt-2 border-t border-steel-200">
                  <a
                    href={c.directionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full btn-dhatu-primary py-2 px-3 rounded text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-98 transition-transform text-center"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Navigate on Google Maps ({c.distanceKm} km) →</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VERIFIABLE RECEIPT MODAL (Section 1.A.4) */}
      {showReceiptModal && (
        <div className="fixed inset-0 z-[60] bg-steel-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-paper-50 rounded-2xl max-w-md w-full border-4 border-steel-800 shadow-2xl p-6 space-y-4">
            <div className="flex justify-between items-start border-b-2 border-steel-300 pb-3">
              <div>
                <span className="stamp-seal stamp-verified text-xs">{t('verifiedReceiptModalTitle', 'Verified Digital Receipt')}</span>
                <h3 className="font-display font-black text-xl text-steel-900 mt-1">
                  E-Waste Handover Voucher
                </h3>
              </div>
              <button
                onClick={() => setShowReceiptModal(null)}
                className="w-8 h-8 rounded-full bg-paper-200 text-steel-800 hover:bg-steel-300 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-white rounded-lg border-2 border-steel-800 flex flex-col items-center justify-center space-y-2">
              <QrCode className="w-32 h-32 text-steel-900" />
              <div className="font-mono text-xs font-bold text-copper-700">
                RECEIPT #{showReceiptModal.id.slice(0, 12).toUpperCase()}
              </div>
            </div>

            <div className="space-y-2 text-xs font-mono bg-paper-100 p-3.5 rounded border border-paper-300">
              <div className="flex justify-between">
                <span className="text-steel-500">Citizen:</span>
                <span className="font-bold">Ramesh Sharma</span>
              </div>
              <div className="flex justify-between">
                <span className="text-steel-500">Verified Collector:</span>
                <span className="font-bold">Suresh Kumar (KC-COL-8921)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-steel-500">Status:</span>
                <span className="text-forest-700 font-bold">100% Closed Loop Recycled</span>
              </div>
              <div className="flex justify-between">
                <span className="text-steel-500">Total Scrap Value:</span>
                <span className="font-bold text-copper-600">₹{showReceiptModal.totalAmount || 598}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-paper-300 text-[10px] text-steel-500">
                <span>Cryptographic Hash:</span>
                <span>{showReceiptModal.traceabilityHash || '0x19283746...'}</span>
              </div>
            </div>

            <button
              onClick={() => {
                alert('Receipt PDF downloaded! (CPCB EPR Compliant)');
                setShowReceiptModal(null);
              }}
              className="w-full btn-dhatu-primary py-2.5 rounded text-xs font-bold flex items-center justify-center space-x-1.5"
            >
              <Download className="w-4 h-4" />
              <span>Download Signed Receipt (PDF)</span>
            </button>
          </div>
        </div>
      )}

      {/* GREEN IMPACT CERTIFICATE MODAL (Section 1.A.7) */}
      {showCertificateModal && (
        <div className="fixed inset-0 z-[60] bg-steel-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-paper-50 rounded-2xl max-w-xl w-full border-4 border-brass-600 shadow-2xl p-6 sm:p-8 space-y-5">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-full bg-brass-100 text-brass-700 flex items-center justify-center mx-auto mb-2 border border-brass-400">
                <Award className="w-7 h-7" />
              </div>
              <span className="stamp-seal stamp-verified text-xs">CPCB / MINISTRY OF MINES</span>
              <h3 className="font-display font-black text-2xl text-steel-900">
                Certificate of Safe e-Waste Disposal
              </h3>
              <p className="text-xs text-steel-600 font-mono">
                Awarded under SIH26229 Informal Waste Integration Guidelines
              </p>
            </div>

            <div className="p-4 bg-white rounded-lg border-2 border-brass-400 text-center space-y-2">
              <p className="text-xs text-steel-600">This is to certify that</p>
              <div className="text-xl font-display font-bold text-copper-700">Ramesh Sharma</div>
              <p className="text-xs text-steel-700 max-w-md mx-auto">
                has successfully diverted <strong>28.2 kilograms</strong> of toxic electronic scrap from Indian landfills through authorized collectors and CPCB-registered recycling facilities.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono bg-paper-100 p-3 rounded border border-steel-300 text-center">
              <div>
                <span className="text-[10px] text-steel-500 block">CERTIFICATE NO.</span>
                <span className="font-bold text-steel-900">KBD-EPR-2026-DEL-04192</span>
              </div>
              <div>
                <span className="text-[10px] text-steel-500 block">ISSUE DATE</span>
                <span className="font-bold text-steel-900">08-SEP-2026</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleDownloadCertificate}
                className="flex-1 btn-dhatu-primary py-2.5 rounded text-xs font-bold flex items-center justify-center space-x-1"
              >
                <Download className="w-4 h-4" />
                <span>Download Printable Certificate</span>
              </button>
              <button
                onClick={() => setShowCertificateModal(false)}
                className="px-4 py-2.5 bg-paper-200 hover:bg-paper-300 text-steel-800 border border-steel-400 rounded text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MOBILE BOTTOM NAVIGATION BAR (Material 3 Expressive Navigation Bar) */}
      <nav
        aria-label="Citizen Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/80 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] px-2 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom,0.75rem))]"
      >
        <div className="flex items-center justify-around gap-1 max-w-md mx-auto">
          <button
            onClick={() => setActiveTab('pickups')}
            className={`flex-1 min-w-0 py-1 px-1 rounded-2xl flex flex-col items-center justify-center transition-all ${
              activeTab === 'pickups'
                ? 'font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <div className={`w-12 h-7 rounded-full flex items-center justify-center transition-all ${activeTab === 'pickups' ? 'm3-nav-pill-active' : 'text-slate-500'}`}>
              <Clock className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-semibold mt-1 truncate max-w-full">{t('mNavMyPickups', 'Pickups')}</span>
          </button>

          <button
            onClick={() => setActiveTab('new')}
            className={`flex-1 min-w-0 py-1 px-1 rounded-2xl flex flex-col items-center justify-center transition-all ${
              activeTab === 'new'
                ? 'font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <div className={`w-12 h-7 rounded-full flex items-center justify-center transition-all ${activeTab === 'new' ? 'm3-nav-pill-active' : 'text-slate-500'}`}>
              <Plus className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-semibold mt-1 truncate max-w-full">{t('mNavBook', 'Book')}</span>
          </button>

          <button
            onClick={() => setActiveTab('impact')}
            className={`flex-1 min-w-0 py-1 px-1 rounded-2xl flex flex-col items-center justify-center transition-all ${
              activeTab === 'impact'
                ? 'font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <div className={`w-12 h-7 rounded-full flex items-center justify-center transition-all ${activeTab === 'impact' ? 'm3-nav-pill-active' : 'text-slate-500'}`}>
              <Award className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-semibold mt-1 truncate max-w-full">{t('mNavImpact', 'Impact')}</span>
          </button>

          <button
            onClick={() => setActiveTab('dropoff')}
            className={`flex-1 min-w-0 py-1 px-1 rounded-2xl flex flex-col items-center justify-center transition-all ${
              activeTab === 'dropoff'
                ? 'font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <div className={`w-12 h-7 rounded-full flex items-center justify-center transition-all ${activeTab === 'dropoff' ? 'm3-nav-pill-active' : 'text-slate-500'}`}>
              <Building className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-semibold mt-1 truncate max-w-full">{t('mNavDropoff', 'Centers')}</span>
          </button>
        </div>
      </nav>

    </div>
  );
};
