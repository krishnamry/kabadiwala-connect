import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { api } from '../../lib/api';
import { storage, STORAGE_KEYS } from '../../lib/storage';
import { Pickup, ScrapRate, MLClassificationResult, ChatPartner } from '../../types';
import { LeafletMap } from '../../components/LeafletMap';
import { VoiceAssistButton } from '../../components/VoiceAssistButton';
import { ChatDrawer } from '../../components/ChatDrawer';
import { ChatPartnerSelectorModal } from '../../components/ChatPartnerSelectorModal';
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
  Loader2,
  Search,
  Link2,
  ExternalLink,
  MessageSquare,
  Package
} from 'lucide-react';
import { getCurrentPosition, reverseGeocode, searchAddress, calculateDistanceKm, getDirectionsUrl } from '../../lib/location';
import { triggerHaptic, hapticSuccess } from '../../lib/haptics';
import { KycStatusBanner } from '../../components/KycStatusBanner';
import { KycVerifiedModal } from '../../components/KycVerifiedModal';

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

  // Contextual In-App Chat State
  const [activePartnerSelector, setActivePartnerSelector] = useState<{
    pickup: Pickup;
    partners: ChatPartner[];
  } | null>(null);

  const [activeChatContext, setActiveChatContext] = useState<{
    type: 'LOT' | 'PICKUP';
    id: string;
    title: string;
    partnerId?: string;
    partnerName: string;
    partnerRole?: string;
    partnerPhone?: string;
    pickup?: Pickup;
  } | null>(null);

  const [chatTick, setChatTick] = useState(0);

  const openPickupChat = (pickup: Pickup) => {
    triggerHaptic(15);
    const partners = storage.getChatPartnersForContext('PICKUP', pickup.id, user?.id);

    const defaultCollector = pickup.kabadiwala ? {
      id: pickup.kabadiwala.id,
      name: pickup.kabadiwala.name,
      role: 'KABADIWALA',
      phone: pickup.kabadiwala.phone,
      vehicleType: pickup.kabadiwala.kabadiwala?.vehicleType || 'Solar Cargo Trike'
    } : null;

    if (partners.length > 1 || (partners.length === 0 && defaultCollector)) {
      setActivePartnerSelector({
        pickup,
        partners
      });
    } else if (partners.length === 1) {
      const p = partners[0];
      setActiveChatContext({
        type: 'PICKUP',
        id: pickup.id,
        title: `Pickup #${pickup.id.slice(0, 10)} (${pickup.address.slice(0, 24)}...)`,
        partnerId: p.id,
        partnerName: p.name,
        partnerRole: p.role,
        partnerPhone: p.phone || pickup.kabadiwala?.phone,
        pickup
      });
    } else {
      setActivePartnerSelector({
        pickup,
        partners: []
      });
    }
  };

  const [address, setAddress] = useState('Detecting Live Location...');
  const [latitude, setLatitude] = useState(28.6139);
  const [longitude, setLongitude] = useState(77.2090);
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [gpsFeedback, setGpsFeedback] = useState<string | null>(null);
  const [scheduledAt, setScheduledAt] = useState(() => new Date(Date.now() + 2 * 3600 * 1000).toISOString().slice(0, 16));
  const [notes, setNotes] = useState('');
  
  // E-waste items list (multi-item, quantity per item and custom-typed products supported)
  const [items, setItems] = useState<Array<{
    category: string;
    estWeightKg: number;
    ratePerKg: number;
    quantity?: number;
    isCustom?: boolean;
    customName?: string;
    imageUrl?: string;
  }>>([
    { category: 'Printed Circuit Boards (PCBs)', estWeightKg: 3.0, ratePerKg: 640, quantity: 1 },
    { category: 'Copper Cables & Insulated Wires', estWeightKg: 4.0, ratePerKg: 480, quantity: 1 }
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

  // Total Items and Weight Summary
  const totalItemsCount = items.reduce((sum, i) => sum + (i.quantity || 1), 0);
  const totalEstWeight = Math.round(items.reduce((sum, i) => sum + i.estWeightKg, 0) * 100) / 100;

  // Indicative Price Range Calculation (Section 1.A.2)
  const indicativeMin = items.reduce((sum, i) => sum + i.estWeightKg * (i.ratePerKg || eWasteRates[i.category] || 100) * 0.9, 0);
  const indicativeMax = items.reduce((sum, i) => sum + i.estWeightKg * (i.ratePerKg || eWasteRates[i.category] || 100) * 1.15, 0);

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
      if (e.detail?.key === STORAGE_KEYS.CHAT_MESSAGES || e.detail?.key === '*') {
        setChatTick(t => t + 1);
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

  const [googleMapsLink, setGoogleMapsLink] = useState('');
  const [isGeocodingAddress, setIsGeocodingAddress] = useState(false);

  // Helper to parse coordinates from Google Maps link or raw coordinates
  const parseCoordinatesFromText = (text: string): [number, number] | null => {
    if (!text) return null;
    const atMatch = text.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (atMatch) return [parseFloat(atMatch[1]), parseFloat(atMatch[2])];
    
    const qMatch = text.match(/[?&](?:q|ll)=(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (qMatch) return [parseFloat(qMatch[1]), parseFloat(qMatch[2])];

    const rawMatch = text.match(/(-?\d{1,2}\.\d+)[,\s]+(-?\d{1,3}\.\d+)/);
    if (rawMatch) return [parseFloat(rawMatch[1]), parseFloat(rawMatch[2])];

    return null;
  };

  const handleFetchLocationFromAddress = async () => {
    const query = googleMapsLink.trim() || address.trim();
    if (!query || query === 'Detecting Live Location...') {
      setGpsFeedback('Please enter an address or Google Maps link first.');
      return;
    }

    setIsGeocodingAddress(true);
    setGpsFeedback(null);
    try {
      // 1. Try direct coordinate parsing (e.g. from Google Maps link or lat,lng)
      const parsedCoords = parseCoordinatesFromText(query);
      if (parsedCoords) {
        setLatitude(parsedCoords[0]);
        setLongitude(parsedCoords[1]);
        setUserCoords(parsedCoords);
        const geo = await reverseGeocode(parsedCoords[0], parsedCoords[1]);
        if (!address || address === 'Detecting Live Location...') {
          setAddress(geo.address);
        }
        setGpsFeedback(`✓ Location confirmed on map from link: ${geo.shortAddress} (${parsedCoords[0].toFixed(4)}° N, ${parsedCoords[1].toFixed(4)}° E)`);
        hapticSuccess();
        return;
      }

      // 2. Query geocoder via robust multi-tier resolver (cache -> backend proxy -> Photon -> Nominatim fallback)
      const searchTarget = googleMapsLink.trim() ? (address.trim() || query) : address.trim();
      const results = await searchAddress(searchTarget);
      if (results && results.length > 0) {
        const lat = results[0].lat;
        const lon = results[0].lng;
        setLatitude(lat);
        setLongitude(lon);
        setUserCoords([lat, lon]);
        setGpsFeedback(`✓ Location confirmed on map: ${results[0].shortName || results[0].displayName.split(',').slice(0, 3).join(', ')}`);
        hapticSuccess();
      } else {
        setGpsFeedback('Could not resolve exact coordinates. Tap or drag pin on map to set location.');
      }
    } catch (err) {
      console.warn('Geocoding error', err);
      setGpsFeedback('Error fetching location from address. Please pinpoint on map.');
    } finally {
      setIsGeocodingAddress(false);
    }
  };

  const handleMapLocationSelect = async (lat: number, lng: number, addr?: string) => {
    setLatitude(lat);
    setLongitude(lng);
    if (addr) {
      setAddress(addr);
      setGpsFeedback(`✓ Pin placed & confirmed at: ${addr.split(',').slice(0, 2).join(',')}`);
    } else {
      try {
        const geo = await reverseGeocode(lat, lng);
        setAddress(geo.address);
        setGpsFeedback(`✓ Pin placed & confirmed at: ${geo.shortAddress}`);
      } catch (err) {
        console.warn(err);
      }
    }
  };

  const handleAddItem = () => {
    setItems(prev => [
      ...prev,
      { category: 'Printed Circuit Boards (PCBs)', estWeightKg: 2.0, ratePerKg: 640, quantity: 1, isCustom: false, customName: '' }
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleQuantityChange = (index: number, qty: number) => {
    const updated = [...items];
    updated[index] = { ...updated[index], quantity: Math.max(1, Math.floor(qty)) };
    setItems(updated);
  };

  const handleCategoryChange = (index: number, newCategory: string) => {
    const updated = [...items];
    if (newCategory === 'CUSTOM') {
      updated[index] = {
        ...updated[index],
        isCustom: true,
        category: updated[index].customName?.trim() || 'Custom E-Waste',
        ratePerKg: updated[index].ratePerKg || 50
      };
    } else {
      const rate = eWasteRates[newCategory] || 100;
      updated[index] = {
        ...updated[index],
        category: newCategory,
        ratePerKg: rate,
        isCustom: false,
        customName: ''
      };
    }
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
        detectedItem: 'Electronic Circuit Board',
        confidence: 0.95,
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
      } else if (catLower.includes('wire') || catLower.includes('cable') || catLower.includes('copper') || catLower.includes('cord')) {
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
      } else if (catLower.includes('plastic') || catLower.includes('abs') || catLower.includes('hips')) {
        detectedCat = 'Engineering E-Plastics (ABS/HIPS)';
        detectedRate = result.estRate || 38;
      } else if (catLower.includes('low-grade')) {
        detectedCat = 'Low-grade Printed Circuit Boards (PCBs)';
        detectedRate = result.estRate || 180;
      } else {
        detectedCat = 'Printed Circuit Boards (PCBs)';
        detectedRate = result.estRate || 640;
      }

      setItems(prev => [
        ...prev,
        {
          category: detectedCat,
          estWeightKg: 2.5,
          ratePerKg: detectedRate,
          quantity: 1,
          customName: result.detectedItem,
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
      alert(t('pleaseAddOneItem', 'Please add at least one e-waste item.'));
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
        items: items.map(it => ({ ...it, quantity: it.quantity || 1 })),
        totalItems: totalItemsCount,
        totalAmount: Math.round((indicativeMin + indicativeMax) / 2),
        notes: notes + (donateToCsr ? ' [CSR DONATION TO GREEN FOUNDATION]' : ''),
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        traceabilityHash: `0x${Math.random().toString(16).substr(2, 20)}`
      };

      await api.createPickup(newPickup);
      const updatedList = storage.getMyPickups(user?.id, 'CITIZEN');
      setPickups(updatedList);
      setSelectedPickup(newPickup);
      setSuccessMessage(
        language === 'hi'
          ? 'पिकअप अनुरोध सफलतापूर्वक दर्ज किया गया! निकटतम कबाड़ीवाले को सूचित कर दिया गया है।'
          : language === 'mr'
          ? 'पिकअप विनंती यशस्वीरित्या नोंदवली गेली! जवळच्या संग्राहकाला सूचना पाठवली आहे.'
          : 'Pickup request successfully submitted and saved locally! Nearest formalized collector has been alerted.'
      );
      setActiveTab('pickups');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelPickup = async (pickupId: string) => {
    const confirmMsg = language === 'hi' 
      ? 'क्या आप वाकई इस पिकअप अनुरोध को रद्द करना चाहते हैं?' 
      : language === 'mr' 
      ? 'तुम्हाला खात्री आहे की तुम्ही ही विनंती रद्द करू इच्छिता?' 
      : 'Are you sure you want to cancel this pickup request?';
    if (!confirm(confirmMsg)) return;
    try {
      await api.cancelPickup(pickupId);
      const updated = storage.getMyPickups(user?.id, 'CITIZEN');
      setPickups(updated);
      setSelectedPickup(prev => (prev?.id === pickupId ? updated.find(p => p.id === pickupId) || null : prev));
      setSuccessMessage(
        language === 'hi'
          ? 'पिकअप अनुरोध सफलतापूर्वक रद्द कर दिया गया।'
          : language === 'mr'
          ? 'पिकअप विनंती यशस्वीरित्या रद्द केली गेली.'
          : 'Pickup request cancelled successfully.'
      );
    } catch (e: any) {
      alert(t('failedToCancelPickup', 'Failed to cancel pickup:') + ' ' + (e.message || ''));
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
      {/* Dynamic KYC Status Banner */}
      <KycStatusBanner />

      {/* One-Time Congratulations Modal upon Verification Approval */}
      <KycVerifiedModal />
      
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
      <div className="flex overflow-x-auto no-scrollbar gap-2.5 pb-2 px-1 flex-nowrap w-full">
        <button
          onClick={() => setActiveTab('pickups')}
          className={`flex-shrink-0 whitespace-nowrap px-5 py-2.5 rounded-full font-bold text-sm flex items-center space-x-2 transition-all ${
            activeTab === 'pickups'
              ? 'm3-tab-pill-active'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700 shadow-sm'
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
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700 shadow-sm'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>2. {t('tabRequestPickup', 'Request Doorstep Pickup')}</span>
        </button>

        <button
          onClick={() => setActiveTab('impact')}
          className={`flex-shrink-0 whitespace-nowrap px-5 py-2.5 rounded-full font-bold text-sm flex items-center space-x-2 transition-all ${
            activeTab === 'impact'
              ? 'm3-tab-pill-active'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700 shadow-sm'
          }`}
        >
          <Heart className="w-4 h-4" />
          <span>3. {t('tabGreenImpact', 'Green Impact & Carbon')}</span>
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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-display font-black text-slate-900 dark:text-white text-lg tracking-tight">
                  {t('yourPickupRequests', 'Your Pickup Requests')}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-100/70 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-800">
                  {pickups.length}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {pickups.map(p => (
                <div
                  key={p.id}
                  onClick={() => setSelectedPickup(p)}
                  className={`rounded-2xl p-4 sm:p-5 border transition-all duration-200 cursor-pointer ${
                    selectedPickup?.id === p.id
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/25 border-emerald-500 shadow-md ring-2 ring-emerald-500/20 dark:ring-emerald-400/20'
                      : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700/60 hover:shadow-md'
                  }`}
                >
                  {/* Header: Ref & Status Pill */}
                  <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800/80">
                    <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80">
                      Ref #{p.id.slice(0, 10)}
                    </span>
                    <span
                      className={`text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs ${
                        p.status === 'COMPLETED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800'
                          : p.status === 'IN_PROGRESS' || p.status === 'ACCEPTED'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800'
                          : 'bg-sky-50 text-sky-800 border border-sky-200 dark:bg-sky-950/70 dark:text-sky-300 dark:border-sky-800'
                      }`}
                    >
                      {p.status === 'COMPLETED' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      ) : (
                        <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                      )}
                      <span>{t(p.status)}</span>
                    </span>
                  </div>

                  {/* Address */}
                  <div className="mt-3 flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm leading-snug line-clamp-2">
                      {p.address}
                    </h4>
                  </div>

                  {/* Total Items & Item Chips */}
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                        <span>{t('totalItems', 'Total Items')}:</span>
                      </span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md text-[11px] border border-slate-200/60 dark:border-slate-700/60">
                        {p.totalItems || p.items?.reduce((s, it) => s + (it.quantity || 1), 0) || 1} {t('pieces', 'pcs')} ({p.items?.length || 1} {t('items', 'types')})
                      </span>
                    </div>

                    {/* Structured Item Chips */}
                    <div className="flex flex-wrap gap-1.5">
                      {p.items?.map((item, idx) => (
                        <div
                          key={idx}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-xs"
                        >
                          <span className="font-medium text-slate-800 dark:text-slate-200">
                            {preserveEnglishItemName(item.category)}
                          </span>
                          <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-200/60 dark:border-emerald-800/60">
                            {item.quantity || 1} {t('pieces', 'pcs')} • ~{item.estWeightKg}kg
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Indicative Payout Highlight */}
                    <div className="mt-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        {t('indicative payout:', 'Indicative Payout:')}
                      </span>
                      <span className="text-base font-black font-mono text-emerald-600 dark:text-emerald-400">
                        ₹{p.totalAmount || 620}
                      </span>
                    </div>
                  </div>

                  {/* Card Footer: Chat & Collector Info */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                    {/* Contextual Chat Button with Live Unread Indicator */}
                    {(() => {
                      const unreadCount = storage.getUnreadChatCountForContext('PICKUP', p.id, user?.id);
                      return (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openPickupChat(p);
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-2xs ${
                            unreadCount > 0
                              ? 'bg-rose-50 text-rose-700 border-2 border-rose-400 dark:bg-rose-950/70 dark:text-rose-300 dark:border-rose-700'
                              : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700'
                          }`}
                          title="Open Collector Messages"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>{t('messages', 'Messages / Chat')}</span>
                          {unreadCount > 0 && (
                            <span className="flex items-center gap-1 ml-0.5">
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600"></span>
                              </span>
                              <span className="text-[10px] font-extrabold text-rose-700 dark:text-rose-300 font-mono">
                                ({unreadCount})
                              </span>
                            </span>
                          )}
                        </button>
                      );
                    })()}

                    {p.status === 'COMPLETED' ? (
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded-full">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>{t('verifiedHandover', 'Verified Handover')}</span>
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowReceiptModal(p);
                          }}
                          className="text-xs text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 font-bold underline flex items-center gap-1"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>{t('viewReceipt', 'Receipt')}</span>
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-600 dark:text-slate-400 font-medium flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span>{p.kabadiwala?.name ? `Assigned: ${p.kabadiwala.name}` : t('awaitingCollector', 'Awaiting Collector')}</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Map & Live Collector ETA Column (Section 1.A.3) */}
          <div className="lg:col-span-7 space-y-4">
            {selectedPickup ? (
              <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 sm:p-7 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                      selectedPickup.status === 'COMPLETED'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                        : 'bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                    }`}>
                      {selectedPickup.status === 'COMPLETED' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      )}
                      <span>{selectedPickup.status === 'COMPLETED' ? t('HANDOVER COMPLETED', 'HANDOVER COMPLETED') : t('COLLECTOR DISPATCHED', 'COLLECTOR DISPATCHED')}</span>
                    </span>
                    <h3 className="text-xl font-display font-black text-slate-900 dark:text-white mt-2">
                      {selectedPickup.address}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    {selectedPickup.status === 'REQUESTED' && (
                      <button
                        type="button"
                        onClick={() => handleCancelPickup(selectedPickup.id)}
                        className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800 border border-rose-200 rounded-xl text-xs font-bold transition-colors shadow-2xs"
                      >
                        {t('cancel', 'Cancel Request')}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => openPickupChat(selectedPickup)}
                      className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors relative shadow-2xs"
                      title="Chat with Collector"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>{t('chat', 'Chat / Messages')}</span>
                      {(() => {
                        const unread = storage.getUnreadChatCountForContext('PICKUP', selectedPickup.id, user?.id);
                        if (unread > 0) {
                          return (
                            <span className="flex items-center gap-1 ml-0.5">
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600"></span>
                              </span>
                              <span className="text-[10px] font-extrabold text-rose-700 dark:text-rose-300 font-mono">
                                ({unread})
                              </span>
                            </span>
                          );
                        }
                        return null;
                      })()}
                    </button>

                    {selectedPickup.kabadiwala && (
                      <a
                        href={`tel:${selectedPickup.kabadiwala.phone}`}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-2xs transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>{t('callCollector', 'Call Collector')}</span>
                      </a>
                    )}
                  </div>
                </div>

                {/* Live ETA Tracker Banner */}
                {selectedPickup.status === 'IN_PROGRESS' && (
                  <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-50 to-amber-100/60 dark:from-amber-950/40 dark:to-amber-900/20 border border-amber-300/80 dark:border-amber-800/80 rounded-2xl flex items-center justify-between gap-4 shadow-xs">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-mono font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider block">
                        {t('LIVE ETA ESTIMATE', 'LIVE ETA ESTIMATE')}
                      </span>
                      <div className="text-lg font-display font-black text-slate-900 dark:text-white">
                        {language === 'hi' ? 'कबाड़ीवाला सुरेश लगभग 1.4 किमी दूर है (~12 मिनट में आगमन)' : language === 'mr' ? 'संग्राहक सुरेश अंदाजे 1.4 किमी अंतरावर आहे (~12 मिनिटांत आगमन)' : 'Collector Suresh is 1.4 km away (Arriving in ~12 mins)'}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
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
                  <div className="p-5 bg-gradient-to-br from-emerald-50/60 via-white to-slate-50 dark:from-slate-800/90 dark:to-slate-900 rounded-2xl border border-emerald-300/80 dark:border-emerald-800/80 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-300/60 dark:border-emerald-800">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>{t('layer 1 verification: citizen handover otp', 'LAYER 1 VERIFICATION • DOORSTEP SCRAP HANDOVER')}</span>
                      </span>
                      <span className="font-mono text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-300/60 dark:border-emerald-800">
                        {t('SECURE OTP', 'SECURE OTP')}
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                      <div>
                        <span className="text-xs font-bold text-slate-900 dark:text-white block">
                          {language === 'hi' ? 'भौतिक हस्तांतरण प्राधिकरण कोड' : language === 'mr' ? 'प्रत्यक्ष हस्तांतरण प्रमाणीकरण कोड' : 'Physical Handover Authorization Code'}
                        </span>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                          {language === 'hi' ? 'वजन सत्यापन एवं आधिकारिक हस्तांतरण हेतु कबाड़ीवाले के आने पर यह 4-अंकीय कोड साझा करें।' : language === 'mr' ? 'वजन तपासणी व प्रमाणित हस्तांतरणासाठी संग्राहक आल्यावर हा 4-अंकी कोड सांगा.' : 'Share this 4-digit code with the collector upon arrival to verify physical weighing & authorized handover.'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                        <span className="font-mono text-3xl font-black text-emerald-700 dark:text-emerald-300 tracking-widest bg-white dark:bg-slate-800 px-5 py-2 rounded-xl border border-emerald-200 dark:border-emerald-700/60 shadow-sm">
                          {selectedPickup.verificationOtp || '4821'}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-2xl space-y-2 text-xs text-emerald-900 dark:text-emerald-100 shadow-xs">
                    <div className="flex items-center justify-between font-bold">
                      <span className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-200">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span>{t('layer 1 verified: physical doorstep handover confirmed', 'Layer 1 Verified: Physical Doorstep Handover Confirmed')}</span>
                      </span>
                      <span className="font-mono text-[11px] text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/80 px-2.5 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-700">
                        OTP {selectedPickup.verificationOtp || '4821'} MATCHED
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-mono">
                      Audit Hash: {selectedPickup.traceabilityHash || '0x8f4a9b2c7e103984fa55'} • Digitally signed & credited
                    </p>
                  </div>
                )}

                {/* Leaflet Map Visualizer */}
                <div className="h-64 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
                  <LeafletMap
                    center={[selectedPickup.latitude, selectedPickup.longitude]}
                    zoom={15}
                    pickups={[selectedPickup]}
                    pinLocation={[selectedPickup.latitude, selectedPickup.longitude]}
                    height="256px"
                  />
                </div>

                {/* Material Item Breakdown */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-slate-400" />
                      <span>{t('itemsToRecycle')}:</span>
                    </span>
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/70 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 font-mono">
                      {t('totalItems', 'Total Items')}: {selectedPickup.totalItems || selectedPickup.items?.reduce((s, it) => s + (it.quantity || 1), 0) || 1} {t('pieces', 'pcs')} ({selectedPickup.items?.length || 1} {t('items', 'types')})
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                    {selectedPickup.items.map((item, i) => (
                      <div key={i} className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700/80 flex flex-col justify-between shadow-2xs">
                        <div>
                          <span className="font-bold text-slate-900 dark:text-slate-100 block">{preserveEnglishItemName(item.category)}</span>
                          <div className="text-slate-600 dark:text-slate-400 mt-1.5 flex justify-between text-[11px]">
                            <span>{item.quantity || 1} {t('pieces', 'pcs')}</span>
                            <span className="font-mono">~{item.estWeightKg} kg</span>
                          </div>
                        </div>
                        <div className="mt-2 pt-1.5 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                          <span className="text-[10px] text-slate-400">Rate:</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">₹{item.ratePerKg}/kg</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Verifiable Hash Footer */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="font-mono">Traceability Hash: {selectedPickup.traceabilityHash || '0x9a8f2736b4...'}</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>100% CPCB Audit Logged</span>
                  </span>
                </div>
              </div>
            ) : (
              <div className="rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 p-12 text-center text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900/50">
                {t('selectPickupPrompt', 'Select a pickup from the left list to view live tracking and digital handover status.')}
              </div>
            )}
          </div>

        </div>
      )}

      {/* TAB 2: BOOK NEW E-WASTE PICKUP */}
      {activeTab === 'new' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Booking Form */}
          <div className="lg:col-span-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800">{t('householdPickupBadge', 'Doorstep Pickup')}</span>
              <h2 className="text-xl font-display font-black text-slate-900 dark:text-white mt-2">
                {t('bookPickupHeader', 'Book Doorstep E-Waste Pickup')}
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Upload photos of your obsolete electronics. Our AI classifies the material and provides an indicative price range before booking.
              </p>
            </div>

            {/* AI Photo Scanner */}
            <div className="p-5 bg-slate-50/80 dark:bg-slate-800/40 rounded-2xl border-2 border-dashed border-emerald-300 dark:border-emerald-700/60 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>{t('aiPhotoScanner', 'AI Photo Scanner (Upload Photo for Auto-Classification)')}</span>
                </span>
                {classifying && <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 animate-pulse">Scanning PCB...</span>}
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
                className="btn-primary-m3 px-4 py-2.5 text-xs font-bold cursor-pointer inline-flex items-center space-x-2 shadow-sm"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>{t('scanAiPhoto', 'Upload e-Waste Photo (AI Category Scan)')}</span>
              </label>

              {mlResult && (
                <div className="p-3 bg-white rounded border border-forest-500/40 text-xs text-steel-800 space-y-1">
                  <div className="font-bold text-forest-700 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-forest-600 shrink-0" />
                    <span>
                      AI Detected: {mlResult.detectedItem ? `${mlResult.detectedItem} — ${preserveEnglishItemName(mlResult.category)}` : preserveEnglishItemName(mlResult.category)} ({Math.round(mlResult.confidence * 100)}% match)
                    </span>
                  </div>
                  <p className="text-[11px] text-steel-600">{mlResult.advice}</p>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmitPickup} className="space-y-4">
              
              {/* Pickup Address & Location Geocoding */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-steel-700 dark:text-slate-300 uppercase tracking-wider mb-1 flex items-center justify-between">
                    <span>{t('pickupAddress', 'Pickup Address')}</span>
                    <span className="text-[10px] text-slate-400 font-normal">{t('manualOrGps', 'Type address, paste link, or use map')}</span>
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={address}
                      onChange={e => setAddress(e.target.value)}
                      placeholder={t('pickupAddressPlaceholder', 'House/flat no., street name, locality, landmark, pincode...')}
                      className="flex-1 px-3 py-2 text-xs font-mono bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:border-emerald-600 dark:focus:border-emerald-500 focus:outline-none shadow-xs"
                      required
                    />
                    <div className="flex gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={handleFetchLocationFromAddress}
                        disabled={isGeocodingAddress}
                        title={t('fetchLocation', 'Fetch Location')}
                        className="px-3 py-2 bg-paper-200 dark:bg-slate-800 hover:bg-copper-100 dark:hover:bg-slate-700 active:bg-copper-200 text-steel-800 dark:text-slate-200 text-xs font-bold rounded-xl border border-steel-400 dark:border-slate-600 flex items-center gap-1.5 transition-colors disabled:opacity-50 shadow-2xs"
                      >
                        {isGeocodingAddress ? (
                          <Loader2 className="w-3.5 h-3.5 text-copper-600 dark:text-copper-400 animate-spin" />
                        ) : (
                          <Search className="w-3.5 h-3.5 text-copper-600 dark:text-copper-400" />
                        )}
                        <span>{isGeocodingAddress ? t('fetchingLocation', 'Fetching...') : t('fetchLocation', 'Fetch Location')}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleFetchLiveGPS}
                        disabled={isLocating}
                        title={t('locatingGps', 'Locating...')}
                        className="px-3 py-2 bg-paper-200 dark:bg-slate-800 hover:bg-copper-100 dark:hover:bg-slate-700 active:bg-copper-200 text-steel-800 dark:text-slate-200 text-xs font-bold rounded-xl border border-steel-400 dark:border-slate-600 flex items-center gap-1.5 transition-colors disabled:opacity-50 shadow-2xs"
                      >
                        {isLocating ? (
                          <Loader2 className="w-3.5 h-3.5 text-copper-600 dark:text-copper-400 animate-spin" />
                        ) : (
                          <MapPin className="w-3.5 h-3.5 text-copper-600 dark:text-copper-400" />
                        )}
                        <span>{isLocating ? t('locatingGps', 'Locating...') : t('gpsBtn', 'GPS')}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Optional Google Maps Link */}
                <div>
                  <label className="block text-xs font-bold text-steel-700 dark:text-slate-300 uppercase tracking-wider mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Link2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>{t('gmapsLinkOpt', 'Google Maps Link')} <span className="text-slate-400 font-normal lowercase">({t('optional', 'optional')})</span></span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">{t('pasteLinkOrCoords', 'paste maps.app.goo.gl or coordinates')}</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={googleMapsLink}
                      onChange={e => setGoogleMapsLink(e.target.value)}
                      placeholder="e.g. https://maps.app.goo.gl/xyz or 28.6139, 77.2090"
                      className="flex-1 px-3 py-2 text-xs font-mono bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:border-emerald-600 dark:focus:border-emerald-500 focus:outline-none shadow-xs"
                    />
                    {googleMapsLink.trim() && (
                      <button
                        type="button"
                        onClick={handleFetchLocationFromAddress}
                        disabled={isGeocodingAddress}
                        className="px-3.5 py-2 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 text-xs font-bold rounded-xl border border-emerald-300 dark:border-emerald-700 flex items-center gap-1 shrink-0 shadow-2xs"
                        title={t('locateBtn', 'Locate')}
                      >
                        <Search className="w-3.5 h-3.5" />
                        <span>{t('locateBtn', 'Locate')}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Location Feedback / Confirmation Banner */}
                {gpsFeedback && (
                  <div className="p-2.5 bg-forest-50 dark:bg-emerald-950/40 border border-forest-300 dark:border-emerald-700/60 rounded-xl text-xs font-mono text-forest-800 dark:text-emerald-300 flex items-center justify-between animate-fade-in shadow-2xs">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>{gpsFeedback}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setGpsFeedback(null)}
                      className="text-forest-600 dark:text-emerald-400 hover:opacity-75 font-bold ml-2 text-sm"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* Interactive Doorstep Location Pin Map Confirmation */}
                <div className="space-y-1 pt-1">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-700 dark:text-slate-300 font-bold flex items-center gap-1">
                      <span>📍 {language === 'hi' ? 'मानचित्र पर सटीक गेट चुनें (पिन पुष्टी)' : language === 'mr' ? 'नकाशावर अचूक जागा निवडा (पिन पुष्टी)' : 'Doorstep Location Map Confirmation'}:</span>
                    </span>
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                      {latitude.toFixed(4)}° N, {longitude.toFixed(4)}° E
                    </span>
                  </div>
                  <div className="h-52 sm:h-60 rounded-2xl overflow-hidden border border-slate-300 dark:border-slate-700 shadow-inner relative">
                    <LeafletMap
                      center={[latitude, longitude]}
                      zoom={15}
                      selectableLocation={true}
                      pinLocation={[latitude, longitude]}
                      userPosition={userCoords}
                      onLocationSelect={handleMapLocationSelect}
                      height="100%"
                    />
                    <div className="absolute bottom-2 left-2 right-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm px-3 py-1.5 rounded-lg text-[10px] font-mono text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 pointer-events-none text-center shadow-sm">
                      {language === 'hi' ? 'मानचित्र पर क्लिक करके सटीक पिकअप गेट बदलें' : language === 'mr' ? 'अचूक गेट निवडण्यासाठी नकाशावर कुठेही क्लिक करा' : 'Click anywhere on map to reposition your pickup pin'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Pickup Schedule Slot Selector */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    📅 {t('schedulePickupSlot', 'Schedule Pickup Slot')}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const now = new Date();
                      now.setHours(now.getHours() + 2);
                      const formatted = now.toISOString().slice(0, 16);
                      setScheduledAt(formatted);
                    }}
                    className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 hover:underline font-bold"
                  >
                    +2 hrs ({t('earliestSlot', 'Earliest Slot')})
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setScheduledAt(new Date(Date.now() + 2 * 3600 * 1000).toISOString().slice(0, 16))}
                    className="p-2.5 text-left rounded-xl border text-xs font-mono bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:border-emerald-300 dark:hover:border-emerald-700 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 transition-colors"
                  >
                    <span className="font-bold block">⚡ {t('slotToday', 'Today')}</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">{t('slotWithin2Hrs', 'Within 2 hrs')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date();
                      d.setDate(d.getDate() + 1);
                      d.setHours(10, 0, 0, 0);
                      setScheduledAt(d.toISOString().slice(0, 16));
                    }}
                    className="p-2.5 text-left rounded-xl border text-xs font-mono bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:border-emerald-300 dark:hover:border-emerald-700 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 transition-colors"
                  >
                    <span className="font-bold block">🌅 {t('slotTomorrow', 'Tomorrow')}</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">10:00 AM</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date();
                      d.setDate(d.getDate() + 1);
                      d.setHours(16, 0, 0, 0);
                      setScheduledAt(d.toISOString().slice(0, 16));
                    }}
                    className="p-2.5 text-left rounded-xl border text-xs font-mono bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:border-emerald-300 dark:hover:border-emerald-700 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 transition-colors"
                  >
                    <span className="font-bold block">🌆 {t('slotTomorrow', 'Tomorrow')}</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">04:00 PM</span>
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
                    className="p-2.5 text-left rounded-xl border text-xs font-mono bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:border-emerald-300 dark:hover:border-emerald-700 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 transition-colors"
                  >
                    <span className="font-bold block">🗓️ {t('slotWeekend', 'Weekend')}</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">{t('slotSat11AM', 'Saturday 11 AM')}</span>
                  </button>
                </div>
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={e => setScheduledAt(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:border-emerald-600 dark:focus:border-emerald-500 focus:outline-none"
                  required
                />
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-steel-700 dark:text-slate-300 uppercase tracking-wider">
                    {t('itemsToRecycle', 'E-Waste Items to Recycle')}
                  </label>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-xs text-copper-700 dark:text-copper-400 font-bold hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> {t('addMoreItems', 'Add Item')}
                  </button>
                </div>

                <div className="space-y-2">
                  {items.map((item, index) => (
                    <div key={index} className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-steel-300 dark:border-slate-700 flex flex-col gap-2.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <select
                          value={item.isCustom ? 'CUSTOM' : item.category}
                          onChange={e => handleCategoryChange(index, e.target.value)}
                          className="flex-1 px-2.5 py-2 text-xs font-bold bg-paper-100 dark:bg-slate-900 border border-steel-300 dark:border-slate-700 rounded-lg text-steel-900 dark:text-slate-100 focus:outline-none"
                        >
                          {Object.keys(eWasteRates).map(cat => (
                            <option key={cat} value={cat}>
                              {preserveEnglishItemName(cat)} (₹{eWasteRates[cat]}/kg)
                            </option>
                          ))}
                          <option value="CUSTOM">
                            ➕ {t('otherCustomProduct', 'Other / Custom Product (Type name)')}
                          </option>
                        </select>

                        <div className="flex flex-wrap items-center gap-2">
                          {/* Item Quantity Stepper */}
                          <div className="flex items-center gap-1 bg-paper-100 dark:bg-slate-900 px-2 py-1 rounded-lg border border-steel-300 dark:border-slate-700" title={t('quantity', 'Quantity (Pieces / Units)')}>
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(index, (item.quantity || 1) - 1)}
                              className="w-5 h-5 rounded bg-paper-200 dark:bg-slate-800 text-steel-700 dark:text-slate-300 flex items-center justify-center font-bold text-xs hover:bg-paper-300 active:scale-95"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity || 1}
                              onChange={e => {
                                const val = parseInt(e.target.value);
                                handleQuantityChange(index, isNaN(val) ? 1 : val);
                              }}
                              className="w-9 text-center text-xs font-mono font-bold bg-transparent text-steel-900 dark:text-slate-100 focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(index, (item.quantity || 1) + 1)}
                              className="w-5 h-5 rounded bg-paper-200 dark:bg-slate-800 text-steel-700 dark:text-slate-300 flex items-center justify-center font-bold text-xs hover:bg-paper-300 active:scale-95"
                            >
                              +
                            </button>
                            <span className="text-[10px] text-steel-500 font-medium">{t('pieces', 'pcs')}</span>
                          </div>

                          {/* Item Weight */}
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              step="any"
                              min="0.01"
                              value={item.estWeightKg}
                              onChange={e => {
                                const val = parseFloat(e.target.value);
                                handleWeightChange(index, isNaN(val) ? 0.01 : val);
                              }}
                              className="w-18 px-2 py-1.5 text-xs font-mono font-bold bg-paper-100 dark:bg-slate-900 border border-steel-300 dark:border-slate-700 rounded-lg text-right text-steel-900 dark:text-slate-100"
                            />
                            <span className="text-xs text-steel-500 font-mono">kg</span>
                          </div>

                          <span className="font-mono text-xs font-bold text-copper-600 dark:text-emerald-400 w-16 text-right">
                            ₹{Math.round(item.estWeightKg * (item.ratePerKg || eWasteRates[item.category] || 100))}
                          </span>

                          {items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(index)}
                              className="p-1 text-rose-500 hover:text-rose-700"
                              title="Remove item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Custom Typed Product Row */}
                      {item.isCustom && (
                        <div className="w-full flex flex-col sm:flex-row gap-2 pt-2 border-t border-dashed border-steel-200 dark:border-slate-700 animate-fade-in">
                          <div className="flex-1">
                            <label className="block text-[10px] font-bold uppercase text-steel-600 dark:text-slate-400 mb-1">
                              {t('enterProductName', 'Type Product Name (e.g. Old Microwave, Inverter)')}
                            </label>
                            <input
                              type="text"
                              value={item.customName || ''}
                              placeholder={t('productNamePlaceholder', 'e.g. Inverter, Microwave, Stabilizer, TV...')}
                              onChange={e => {
                                const val = e.target.value;
                                const updated = [...items];
                                updated[index] = {
                                  ...updated[index],
                                  customName: val,
                                  category: val.trim() ? val.trim() : 'Custom E-Waste'
                                };
                                setItems(updated);
                              }}
                              className="w-full px-3 py-1.5 text-xs font-mono bg-paper-50 dark:bg-slate-900 border border-emerald-500 rounded-lg text-steel-900 dark:text-white focus:outline-none"
                              required
                            />
                          </div>
                          <div className="w-full sm:w-36">
                            <label className="block text-[10px] font-bold uppercase text-steel-600 dark:text-slate-400 mb-1">
                              {t('customRatePerKg', 'Expected Rate (₹/kg)')}
                            </label>
                            <div className="flex items-center gap-1">
                              <span className="text-xs font-bold text-steel-500">₹</span>
                              <input
                                type="number"
                                min="1"
                                value={item.ratePerKg}
                                onChange={e => {
                                  const val = parseFloat(e.target.value) || 1;
                                  const updated = [...items];
                                  updated[index] = {
                                    ...updated[index],
                                    ratePerKg: val
                                  };
                                  setItems(updated);
                                }}
                                className="w-full px-2 py-1.5 text-xs font-mono bg-paper-50 dark:bg-slate-900 border border-steel-300 dark:border-slate-700 rounded-lg text-steel-900 dark:text-white text-right focus:outline-none"
                              />
                              <span className="text-[10px] text-steel-500 font-mono">/kg</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Total Items & Consignment Summary Card */}
                  <div className="p-3 bg-paper-100 dark:bg-slate-900 rounded-xl border border-steel-300 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-steel-700 dark:text-slate-300 uppercase tracking-wider">
                        {t('totalItems', 'Total Items')}:
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-copper-100 dark:bg-emerald-950 text-copper-800 dark:text-emerald-300 border border-copper-300 dark:border-emerald-700 font-mono">
                        {totalItemsCount} {t('pieces', 'pieces')} ({items.length} {t('items', 'types')})
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-mono">
                      <span className="text-steel-600 dark:text-slate-400">
                        {t('weight', 'Weight')}: <strong className="text-steel-900 dark:text-white font-bold">~{totalEstWeight} kg</strong>
                      </span>
                      <span className="text-copper-700 dark:text-emerald-400 font-bold">
                        {t('indicativePriceRange', 'Est')}: ₹{Math.round(indicativeMin)} — ₹{Math.round(indicativeMax)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Indicative Value Range Display (Section 1.A.2) */}
              <div className="p-5 bg-gradient-to-r from-emerald-50 via-teal-50/40 to-slate-50 dark:from-emerald-950/30 dark:via-slate-800/60 dark:to-slate-900 border border-emerald-200/80 dark:border-emerald-800/80 rounded-2xl flex items-center justify-between gap-4 shadow-xs">
                <div>
                  <span className="text-[10px] font-mono font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block">
                    {t('priceRangeTitle', 'Indicative Market Price Range')}
                  </span>
                  <div className="text-xl sm:text-2xl font-mono-num font-black text-slate-900 dark:text-white mt-0.5">
                    {formatCurrency(indicativeMin)} — {formatCurrency(indicativeMax)}
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {t('currentPriceNotice', 'Live rates pulled from CPCB registered aggregators across India')}
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
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <Heart className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      {t('donateToCsrLabel', 'Donate Value to Environmental NGO (Plant Trees)')}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {t('treeDonationNotice', 'Funds 5 native tree saplings in national reforestation green corridors.')}
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
                  <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full btn-primary-m3 py-3.5 text-sm font-bold flex items-center justify-center space-x-2 shadow-md hover:shadow-lg transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{t('confirmPickupBtn', 'Confirm & Request Doorstep Pickup')}</span>
              </button>
            </form>
          </div>

          {/* Right Column: Information & Traceability Guarantee */}
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 sm:p-7 space-y-4 shadow-sm">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800">{t('traceabilityBadge', 'Verified Chain')}</span>
              <h3 className="font-display font-black text-slate-900 dark:text-white text-lg">
                {t('traceabilityGuarantee', 'Dhatu Traceability & Chain of Custody Guarantee')}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                How your discarded devices are protected from dangerous open burning:
              </p>

              <div className="space-y-3 text-xs">
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700 space-y-1">
                  <div className="font-bold text-emerald-700 dark:text-emerald-400">1. Verified Doorstep Collector</div>
                  <p className="text-slate-600 dark:text-slate-400">Aadhaar KYC verified kabadiwala visits with calibrated scales.</p>
                </div>
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700 space-y-1">
                  <div className="font-bold text-emerald-700 dark:text-emerald-400">2. Tamper-Proof Digital Receipt</div>
                  <p className="text-slate-600 dark:text-slate-400">Instant QR receipt generated with GPS stamp and weight verification.</p>
                </div>
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700 space-y-1">
                  <div className="font-bold text-emerald-700 dark:text-emerald-400">3. CPCB Smelter Handover</div>
                  <p className="text-slate-600 dark:text-slate-400">Lot confirmed by authorized aggregator EcoRecycle for zero-landfill recovery.</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* TAB 3: PERSONAL ENVIRONMENTAL IMPACT & GREEN CREDITS */}
      {activeTab === 'impact' && (
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800">{t('environmentalImpactHeader', 'Environmental Impact')}</span>
              <h2 className="text-xl font-display font-black text-slate-900 dark:text-white mt-2">
                {t('personalImpactTitle', 'Your Environmental & Landfill Diversion Impact')}
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Official metrics audited by Central Pollution Control Board (CPCB) methodology.
              </p>
            </div>

            <button
              onClick={() => setShowCertificateModal(true)}
              className="btn-primary-m3 px-4 py-2 text-xs font-bold flex items-center space-x-1.5 self-start sm:self-auto shadow-sm"
            >
              <Award className="w-4 h-4" />
              <span>{t('downloadCertBtn', 'Download Disposal Certificate')}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-center">
            <div className="bg-slate-50 dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-xs">
              <span className="text-slate-500 dark:text-slate-400 text-[10px] uppercase block tracking-wider">{t('ewasteDiverted', 'E-Waste Diverted from Landfills')}</span>
              <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 block mt-1">28.2 kg</span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block mt-1 font-semibold">Zero toxic leaching</span>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-xs">
              <span className="text-slate-500 dark:text-slate-400 text-[10px] uppercase block tracking-wider">{t('carbonSaved', 'Carbon Emissions Avoided')}</span>
              <span className="text-3xl font-bold text-teal-600 dark:text-teal-400 block mt-1">64.5 kg</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-1">Equivalent to 4 trees</span>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-xs">
              <span className="text-slate-500 dark:text-slate-400 text-[10px] uppercase block tracking-wider">{t('metalsRecycled', 'Metals & Copper Recycled')}</span>
              <span className="text-3xl font-bold text-amber-600 dark:text-amber-400 block mt-1">8.4 kg</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-1">Smelter pure ingot</span>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-xs">
              <span className="text-slate-500 dark:text-slate-400 text-[10px] uppercase block tracking-wider">{t('csrCreditsEarned', 'CSR Green Credits Earned')}</span>
              <span className="text-3xl font-bold text-slate-900 dark:text-white block mt-1">420 Pts</span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block mt-1 font-semibold">Eligible for tax rebate</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: AUTHORIZED DROP-OFF CENTERS (Section 1.A.8) */}
      {activeTab === 'dropoff' && (
        <div className="space-y-6">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800">{t('selfDropoffBadge', 'Self Drop-Off Option')}</span>
            <h2 className="text-xl font-display font-black text-slate-900 dark:text-white mt-2">
              {t('selfDropoffTitle', 'Authorized E-Waste Drop-Off Centers')}
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              For citizens who prefer dropping off items in person without scheduling a home pickup.
            </p>
          </div>

          {/* Drop-off Terminals Map Preview */}
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm p-5 sm:p-6 space-y-3">
            <div className="font-display font-bold text-slate-800 dark:text-slate-200 text-sm flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-bold">
                <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>{language === 'hi' ? 'ड्रॉप-ऑफ केंद्र मानचित्र' : language === 'mr' ? 'ड्रॉप-ऑफ केंद्र नकाशा' : 'Authorized Drop-off Centers Map'}</span>
              </span>
              <span className="text-xs font-mono text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 font-bold">
                3 Verified Kiosks
              </span>
            </div>
            <div className="h-56 sm:h-64 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
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
              <div key={i} className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm flex flex-col justify-between space-y-3 hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-700 transition-all">
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">CPCB DROP-OFF</span>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-200/80 dark:border-slate-700">
                      📍 {c.distanceKm} km away
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    {c.name}
                  </h3>

                  <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                    <p className="flex items-start gap-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>{c.address}</span>
                    </p>
                    <p className="text-slate-500 dark:text-slate-400">{c.hours}</p>
                  </div>

                  <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/50 rounded-xl border border-emerald-200/80 dark:border-emerald-800/80 text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                    🎁 <strong>Incentive:</strong> {c.incentive}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <a
                    href={c.directionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full btn-primary-m3 py-2 px-3 text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-98 transition-transform text-center"
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
        <div className="fixed inset-0 z-[60] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full border border-slate-200/80 dark:border-slate-800 shadow-2xl p-6 sm:p-7 space-y-4">
            <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800">{t('verifiedReceiptModalTitle', 'Verified Digital Receipt')}</span>
                <h3 className="font-display font-black text-xl text-slate-900 dark:text-white mt-1">
                  E-Waste Handover Voucher
                </h3>
              </div>
              <button
                onClick={() => setShowReceiptModal(null)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-700 flex flex-col items-center justify-center space-y-2">
              <QrCode className="w-32 h-32 text-slate-900 dark:text-white" />
              <div className="font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400">
                RECEIPT #{showReceiptModal.id.slice(0, 12).toUpperCase()}
              </div>
            </div>

            <div className="space-y-2 text-xs font-mono bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Citizen:</span>
                <span className="font-bold text-slate-900 dark:text-white">Ramesh Sharma</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Verified Collector:</span>
                <span className="font-bold text-slate-900 dark:text-white">Suresh Kumar (KC-COL-8921)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Status:</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-bold">100% Closed Loop Recycled</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">{t('totalItems', 'Total Items')}:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {showReceiptModal.totalItems || showReceiptModal.items?.reduce((s, it) => s + (it.quantity || 1), 0) || 1} {t('pieces', 'pcs')} ({showReceiptModal.items?.length || 1} {t('items', 'types')})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Total Scrap Value:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">₹{showReceiptModal.totalAmount || 598}</span>
              </div>
              {showReceiptModal.items && showReceiptModal.items.length > 0 && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-1">
                  <span className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold tracking-wider block">
                    {t('itemsToRecycle', 'Itemized Manifest')}:
                  </span>
                  {showReceiptModal.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between text-[11px] text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                      <span className="truncate pr-1">• {preserveEnglishItemName(it.category)}</span>
                      <span className="font-bold shrink-0 font-mono text-emerald-700 dark:text-emerald-400">
                        {it.quantity ? `${it.quantity} ${t('pieces', 'pcs')} • ` : ''}{it.actualWeightKg || it.estWeightKg} kg
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-700 text-[10px] text-slate-500 dark:text-slate-400">
                <span>Cryptographic Hash:</span>
                <span className="font-mono">{showReceiptModal.traceabilityHash || '0x19283746...'}</span>
              </div>
            </div>

            <button
              onClick={() => {
                alert('Receipt PDF downloaded! (CPCB EPR Compliant)');
                setShowReceiptModal(null);
              }}
              className="w-full btn-primary-m3 py-3 rounded-2xl text-xs font-bold flex items-center justify-center space-x-1.5 shadow-sm"
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

      {/* CONTEXTUAL CHAT PARTNER SELECTOR MODAL */}
      {activePartnerSelector && (
        <ChatPartnerSelectorModal
          isOpen={!!activePartnerSelector}
          contextType="PICKUP"
          contextTitle={`Pickup #${activePartnerSelector.pickup.id.slice(0, 10)} (${activePartnerSelector.pickup.address.slice(0, 24)}...)`}
          partners={activePartnerSelector.partners}
          defaultAssignee={activePartnerSelector.pickup.kabadiwala ? {
            id: activePartnerSelector.pickup.kabadiwala.id,
            name: activePartnerSelector.pickup.kabadiwala.name,
            role: 'KABADIWALA',
            phone: activePartnerSelector.pickup.kabadiwala.phone,
            vehicleType: activePartnerSelector.pickup.kabadiwala.kabadiwala?.vehicleType || 'Solar Cargo Trike'
          } : null}
          onSelectPartner={(partner) => {
            const currentPickup = activePartnerSelector.pickup;
            setActivePartnerSelector(null);
            setActiveChatContext({
              type: 'PICKUP',
              id: currentPickup.id,
              title: `Pickup #${currentPickup.id.slice(0, 10)} (${currentPickup.address.slice(0, 24)}...)`,
              partnerId: partner.id,
              partnerName: partner.name,
              partnerRole: partner.role,
              partnerPhone: partner.phone || currentPickup.kabadiwala?.phone,
              pickup: currentPickup
            });
          }}
          onClose={() => setActivePartnerSelector(null)}
        />
      )}

      {/* CONTEXTUAL CHAT DRAWER */}
      {activeChatContext && (
        <ChatDrawer
          contextType={activeChatContext.type}
          contextId={activeChatContext.id}
          title={activeChatContext.title}
          partnerId={activeChatContext.partnerId}
          partnerName={activeChatContext.partnerName}
          partnerRole={activeChatContext.partnerRole}
          partnerPhone={activeChatContext.partnerPhone}
          onBackToPartners={() => {
            if (activeChatContext.pickup) {
              const currentPickup = activeChatContext.pickup;
              const partners = storage.getChatPartnersForContext('PICKUP', currentPickup.id, user?.id);
              setActiveChatContext(null);
              setActivePartnerSelector({
                pickup: currentPickup,
                partners
              });
            } else {
              setActiveChatContext(null);
            }
          }}
          onClose={() => setActiveChatContext(null)}
        />
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
