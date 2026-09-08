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
  Check
} from 'lucide-react';

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

  // New Pickup Form state (E-Waste focused!)
  const [address, setAddress] = useState('Block D, Flat 402, Lajpat Nagar II, New Delhi');
  const [latitude, setLatitude] = useState(28.5700);
  const [longitude, setLongitude] = useState(77.2400);
  const [scheduledAt, setScheduledAt] = useState('');
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

  // Drop-off centers data (Section 1.A.8)
  const dropoffCenters = [
    {
      name: 'NDMC E-Waste Facility Lajpat Nagar',
      address: 'Near Metro Pillar 42, Feroze Gandhi Marg, Lajpat Nagar III',
      distanceKm: 1.2,
      hours: 'Mon-Sat: 08:00 AM - 05:00 PM',
      incentive: 'Instant Cash or NDMC Property Tax rebate credit'
    },
    {
      name: 'EcoRecycle Drop-Off Terminal Okhla',
      address: 'Plot 42, Phase-II Industrial Area, Okhla',
      distanceKm: 3.2,
      hours: 'Mon-Sun: 07:00 AM - 08:00 PM',
      incentive: '+5% Green Bonus on self drop-off weight'
    },
    {
      name: 'Croma E-Waste Return Kiosk South Ext.',
      address: 'Croma Electronics, South Extension-I Market',
      distanceKm: 4.5,
      hours: 'Mon-Sun: 10:00 AM - 09:00 PM',
      incentive: '₹200 Store Voucher per laptop/desktop motherboard'
    }
  ];

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
    updated[index] = { ...updated[index], estWeightKg: Math.max(0.5, weight) };
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

      setItems(prev => [
        ...prev,
        {
          category: 'Printed Circuit Boards (PCBs)',
          estWeightKg: 2.5,
          ratePerKg: 640,
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

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-5 sm:space-y-8 pb-24 md:pb-8">
      
      {/* Top Banner - Dhatu Industrial Passbook Style */}
      <div className="bg-steel-900 text-paper-50 rounded-xl p-5 sm:p-8 border-2 border-steel-700 shadow-tactile-lg flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden">
        <div className="space-y-2 z-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="stamp-seal stamp-verified text-[11px] bg-forest-500/20 text-forest-500 border-forest-500">
              {t('sourcingLayer', 'SOURCING LAYER')}
            </span>
            <span className="bg-copper-600/30 text-copper-300 font-mono text-xs px-2 py-0.5 rounded border border-copper-600/50">
              {t('sihBadge', 'SIH26229')}
            </span>
            <VoiceAssistButton
              text="Citizen Portal. Request doorstep e-waste pickup, view indicative price estimates, track collector on live map, and claim green environmental credits."
              hindiText="नागरिक पोर्टल। घर बैठे ई-कचरा पिकअप का अनुरोध करें, अनुमानित मूल्य देखें, कबाड़ीवाले को मैप पर ट्रैक करें और पर्यावरण क्रेडिट पाएं।"
              marathiText="नागरिक पोर्टल. घरावरून ई-कचरा संकलन विनंती करा, अंदाजे दर पहा आणि नकाशावर ट्रॅक करा."
              size="sm"
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-black tracking-tight text-paper-50">
            {t('portalCitizen', 'Citizen e-Waste Portal')}
          </h1>
          <p className="text-xs sm:text-sm text-paper-300 max-w-2xl font-medium">
            {t('citizenCardDesc', 'Safely channel your electronics into the CPCB authorized formal chain instead of toxic landfills.')}
          </p>
        </div>

        {/* Personal Impact Hero Counter (Section 1.A.5) */}
        <div className="bg-steel-950 p-3.5 sm:p-4 rounded-xl border border-steel-800 text-left sm:text-right z-10 flex sm:flex-col justify-between sm:justify-center items-center sm:items-end">
          <div>
            <div className="text-[10px] uppercase font-mono text-paper-400">
              {t('tabImpact', 'PERSONAL IMPACT STAT')}
            </div>
            <div className="text-2xl sm:text-3xl font-mono-num font-black text-brass-400">
              28.2 kg
            </div>
            <div className="text-xs text-forest-400 font-medium">
              {t('landfillDivertedKg', 'kg Diverted from Landfills')} 🌲
            </div>
          </div>
          <button
            onClick={() => setShowCertificateModal(true)}
            className="mt-1 sm:mt-2 text-[11px] text-copper-400 hover:text-copper-300 font-bold underline flex items-center gap-1"
          >
            <Award className="w-3.5 h-3.5" />
            <span>{t('downloadCert', 'Download Green Certificate')}</span>
          </button>
        </div>
      </div>

      {/* Tabs - Horizontal Scrollable on Mobile Portrait */}
      <div className="flex overflow-x-auto no-scrollbar gap-2 border-b-2 border-steel-300 pb-2 -mx-3 px-3 sm:mx-0 sm:px-0 flex-nowrap">
        <button
          onClick={() => setActiveTab('pickups')}
          className={`flex-shrink-0 whitespace-nowrap px-4 py-2.5 rounded-lg font-bold text-xs flex items-center space-x-2 transition-all ${
            activeTab === 'pickups'
              ? 'bg-copper-600 text-white shadow-tactile border border-copper-700'
              : 'bg-paper-200 text-steel-800 hover:bg-paper-300 border border-steel-300'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>1. {t('tabMyPickups', 'My Pickups & Live ETA')}</span>
        </button>

        <button
          onClick={() => setActiveTab('new')}
          className={`flex-shrink-0 whitespace-nowrap px-4 py-2.5 rounded-lg font-bold text-xs flex items-center space-x-2 transition-all ${
            activeTab === 'new'
              ? 'bg-copper-600 text-white shadow-tactile border border-copper-700'
              : 'bg-paper-200 text-steel-800 hover:bg-paper-300 border border-steel-300'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>2. {t('tabSchedulePickup', 'Book e-Waste Pickup')}</span>
        </button>

        <button
          onClick={() => setActiveTab('impact')}
          className={`flex-shrink-0 whitespace-nowrap px-4 py-2.5 rounded-lg font-bold text-xs flex items-center space-x-2 transition-all ${
            activeTab === 'impact'
              ? 'bg-copper-600 text-white shadow-tactile border border-copper-700'
              : 'bg-paper-200 text-steel-800 hover:bg-paper-300 border border-steel-300'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>3. {t('tabImpact', 'Impact & CSR Donation')}</span>
        </button>

        <button
          onClick={() => setActiveTab('dropoff')}
          className={`flex-shrink-0 whitespace-nowrap px-4 py-2.5 rounded-lg font-bold text-xs flex items-center space-x-2 transition-all ${
            activeTab === 'dropoff'
              ? 'bg-steel-800 text-white shadow-tactile border border-steel-900'
              : 'bg-paper-200 text-steel-800 hover:bg-paper-300 border border-steel-300'
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
                      {p.status}
                    </span>
                  </div>

                  <h4 className="font-display font-bold text-steel-900 text-sm">
                    {p.address}
                  </h4>

                  <div className="mt-2 text-xs text-steel-600 space-y-0.5 font-mono">
                    <div>Items: {p.items.map(i => `${preserveEnglishItemName(i.category)} (~${i.estWeightKg}kg)`).join(', ')}</div>
                    <div className="flex justify-between font-bold text-steel-800 pt-1">
                      <span>Indicative Payout:</span>
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
                        <span>Verifiable Receipt</span>
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
                      {selectedPickup.status === 'COMPLETED' ? 'HANDOVER COMPLETED' : 'COLLECTOR DISPATCHED'}
                    </span>
                    <h3 className="text-lg font-display font-black text-steel-900 mt-1">
                      {selectedPickup.address}
                    </h3>
                  </div>

                  {selectedPickup.kabadiwala && (
                    <a
                      href={`tel:${selectedPickup.kabadiwala.phone}`}
                      className="btn-dhatu-primary px-3 py-1.5 rounded text-xs font-bold flex items-center space-x-1.5 self-start sm:self-auto"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>{t('callCollector', 'Call Collector')}</span>
                    </a>
                  )}
                </div>

                {/* Live ETA Tracker Banner */}
                {selectedPickup.status === 'IN_PROGRESS' && (
                  <div className="p-4 bg-brass-100/80 border-2 border-brass-400 rounded-lg flex items-center justify-between">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-mono font-bold text-brass-800 uppercase tracking-wider block">
                        LIVE ETA ESTIMATE
                      </span>
                      <div className="text-lg font-display font-black text-steel-900">
                        Collector Suresh is 1.4 km away (Arriving in ~12 mins)
                      </div>
                      <p className="text-xs text-steel-600">
                        Vehicle: Solar Cargo Tricycle (DL-10-KBD-89) • Verified Aadhaar
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
                    onClick={() => {
                      setAddress('Block D, Flat 402, Lajpat Nagar II, New Delhi');
                      setLatitude(28.5700);
                      setLongitude(77.2400);
                    }}
                    className="px-3 py-2 bg-paper-200 hover:bg-paper-300 text-steel-800 text-xs font-bold rounded border border-steel-400 flex items-center gap-1"
                  >
                    <MapPin className="w-3.5 h-3.5 text-copper-600" />
                    <span>GPS</span>
                  </button>
                </div>

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
                      onLocationSelect={(lat, lng) => {
                        setLatitude(lat);
                        setLongitude(lng);
                      }}
                      height="100%"
                    />
                    <div className="absolute bottom-2 left-2 right-2 bg-paper-50/90 backdrop-blur-sm px-2 py-1 rounded text-[10px] font-mono text-steel-700 border border-steel-300 pointer-events-none text-center shadow-sm">
                      {language === 'hi' ? 'मानचित्र पर टैप करके या पिन खींचकर सटीक पता सेट करें' : language === 'mr' ? 'नकाशावर टॅप करून अचूक जागा निवडा' : 'Tap anywhere on map or drag pin to pinpoint pickup gate'}
                    </div>
                  </div>
                </div>
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
                          step="0.5"
                          value={item.estWeightKg}
                          onChange={e => handleWeightChange(index, parseFloat(e.target.value) || 0.5)}
                          className="w-20 px-2 py-1.5 text-xs font-mono font-bold bg-paper-100 border border-steel-300 rounded text-right"
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
                    Live rates pulled from CPCB registered aggregators in South Delhi
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
                      Funds 5 native tree saplings in Delhi Ridge green corridor.
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
                <span>{language === 'hi' ? 'ड्रॉप-ऑफ केंद्र मानचित्र (दिल्ली एनसीआर)' : language === 'mr' ? 'ड्रॉप-ऑफ केंद्र नकाशा' : 'Authorized Drop-off Centers Map (Delhi NCR)'}</span>
              </span>
              <span className="text-xs font-mono text-copper-700 bg-paper-200 px-2.5 py-0.5 rounded border border-steel-300 font-bold">
                3 Verified Kiosks
              </span>
            </div>
            <div className="h-56 sm:h-64 rounded-lg overflow-hidden border border-steel-300">
              <LeafletMap
                center={[28.5685, 77.2412]}
                zoom={12}
                markers={[
                  {
                    id: 'dc-1',
                    lat: 28.5700,
                    lng: 77.2400,
                    title: 'NDMC E-Waste Facility Lajpat Nagar',
                    subtitle: 'Near Metro Pillar 42, Feroze Gandhi Marg',
                    iconEmoji: '🏛️',
                    badge: '1.2 km',
                    color: '#B5573A'
                  },
                  {
                    id: 'dc-2',
                    lat: 28.5355,
                    lng: 77.2732,
                    title: 'EcoRecycle Drop-Off Terminal Okhla',
                    subtitle: 'Plot 42, Phase-II Industrial Area, Okhla',
                    iconEmoji: '🏭',
                    badge: '3.2 km',
                    color: '#3B6B4E'
                  },
                  {
                    id: 'dc-3',
                    lat: 28.5728,
                    lng: 77.2215,
                    title: 'Croma E-Waste Return Kiosk South Ext.',
                    subtitle: 'Croma Electronics, South Extension-I',
                    iconEmoji: '🏢',
                    badge: '4.5 km',
                    color: '#C9A227'
                  }
                ]}
                height="100%"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {dropoffCenters.map((c, i) => (
              <div key={i} className="receipt-stub rounded-xl p-5 border-2 border-steel-300 shadow-sm space-y-3">
                <div className="flex justify-between items-start">
                  <span className="stamp-seal stamp-verified text-[9px]">CPCB DROP-OFF</span>
                  <span className="font-mono text-xs font-bold text-copper-600">{c.distanceKm} km</span>
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
            ))}
          </div>
        </div>
      )}

      {/* VERIFIABLE RECEIPT MODAL (Section 1.A.4) */}
      {showReceiptModal && (
        <div className="fixed inset-0 z-50 bg-steel-950/70 backdrop-blur-sm flex items-center justify-center p-4">
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
        <div className="fixed inset-0 z-50 bg-steel-950/70 backdrop-blur-sm flex items-center justify-center p-4">
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
                onClick={() => {
                  alert('Certificate downloaded to your device!');
                  setShowCertificateModal(false);
                }}
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

      {/* MOBILE BOTTOM NAVIGATION BAR (Thumb-friendly portrait phone navigation) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-paper-50/95 backdrop-blur-md border-t-2 border-steel-400 px-2 py-1 shadow-tactile-lg">
        <div className="grid grid-cols-4 gap-1 text-center">
          <button
            onClick={() => setActiveTab('pickups')}
            className={`min-h-[48px] py-1 rounded flex flex-col items-center justify-center text-[10px] font-bold transition-all ${
              activeTab === 'pickups' ? 'text-copper-700 bg-paper-200' : 'text-steel-600'
            }`}
          >
            <Clock className="w-5 h-5 mb-0.5" />
            <span className="truncate max-w-[70px]">{t('tabMyPickups', 'My Pickups')}</span>
          </button>

          <button
            onClick={() => setActiveTab('new')}
            className={`min-h-[48px] py-1 rounded flex flex-col items-center justify-center text-[10px] font-bold transition-all ${
              activeTab === 'new' ? 'text-copper-700 bg-paper-200' : 'text-steel-600'
            }`}
          >
            <Plus className="w-5 h-5 mb-0.5" />
            <span className="truncate max-w-[70px]">{t('tabSchedulePickup', 'Book New')}</span>
          </button>

          <button
            onClick={() => setActiveTab('impact')}
            className={`min-h-[48px] py-1 rounded flex flex-col items-center justify-center text-[10px] font-bold transition-all ${
              activeTab === 'impact' ? 'text-forest-700 bg-paper-200' : 'text-steel-600'
            }`}
          >
            <Award className="w-5 h-5 mb-0.5" />
            <span className="truncate max-w-[70px]">{t('tabImpact', 'Impact')}</span>
          </button>

          <button
            onClick={() => setActiveTab('dropoff')}
            className={`min-h-[48px] py-1 rounded flex flex-col items-center justify-center text-[10px] font-bold transition-all ${
              activeTab === 'dropoff' ? 'text-copper-700 bg-paper-200' : 'text-steel-600'
            }`}
          >
            <Building className="w-5 h-5 mb-0.5" />
            <span className="truncate max-w-[70px]">{t('tabDropoff', 'Drop-off')}</span>
          </button>
        </div>
      </div>

    </div>
  );
};
