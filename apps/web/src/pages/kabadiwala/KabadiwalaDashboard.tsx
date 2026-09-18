import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { api } from '../../lib/api';
import { storage, STORAGE_KEYS, PassbookTxn } from '../../lib/storage';
import { Pickup, ScrapItem, EWasteLot, EWasteLotItem, LotBid, SafetyGuidanceCard, ScrapRate, MLClassificationResult, KycInfo, SaleToken } from '../../types';
import { triggerHaptic, hapticSuccess } from '../../lib/haptics';
import { LeafletMap } from '../../components/LeafletMap';
import { VoiceAssistButton } from '../../components/VoiceAssistButton';
import { getCurrentPosition, reverseGeocode, calculateDistanceKm, getDirectionsUrl } from '../../lib/location';
import { LiveBiddingRoom } from './LiveBiddingRoom';
import { CollectorKycCard } from './CollectorKycCard';
import { RatingModal } from './RatingModal';
import { ChatDrawer } from './ChatDrawer';
import {
  Truck,
  Gavel,
  BadgeCheck,
  MapPin,
  Phone,
  CheckCircle2,
  Navigation,
  BookOpen,
  ArrowRight,
  RefreshCw,
  Clock,
  Plus,
  Minus,
  Sparkles,
  ShieldCheck,
  Award,
  Volume2,
  Camera,
  QrCode,
  AlertTriangle,
  Factory,
  Wifi,
  WifiOff,
  Scale,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Info,
  Check,
  ExternalLink,
  Flame,
  FileText,
  X,
  Tag,
  Eye,
  CheckCircle,
  Package,
  Layers,
  Trash2,
  Building2,
  Edit3,
  MessageSquare
} from 'lucide-react';

export interface ScrapHubPreset {
  id: string;
  nameEn: string;
  nameHi: string;
  nameMr: string;
  address: string;
  zone: string;
  lat: number;
  lng: number;
}

export const SCRAP_HUB_PRESETS: ScrapHubPreset[] = [
  {
    id: 'mayapuri',
    nameEn: 'Mayapuri Scrap Yard (Phase II, West Delhi)',
    nameHi: 'मायापुरी कबाड़ मंडी (फेज 2, पश्चिम दिल्ली)',
    nameMr: 'मायापुरी भंगार बाजार (फेज 2, नवी दिल्ली)',
    address: 'Suresh Scrap Yard, Near Gate 3, Mayapuri Industrial Area Phase II, New Delhi',
    zone: 'Mayapuri Scrap Cluster, Delhi',
    lat: 28.6369,
    lng: 77.1264
  },
  {
    id: 'okhla',
    nameEn: 'Okhla Industrial Scrap Yard (Phase 1, South Delhi)',
    nameHi: 'ओखला औद्योगिक कबाड़ क्षेत्र (फेज 1, दक्षिण दिल्ली)',
    nameMr: 'ओखला औद्योगिक भंगार क्षेत्र (फेज 1, नवी दिल्ली)',
    address: 'Plot 42, Container Road, Okhla Industrial Area Phase-1, New Delhi',
    zone: 'Okhla Scrap Zone, Delhi',
    lat: 28.5284,
    lng: 77.2798
  },
  {
    id: 'seelampur',
    nameEn: 'Seelampur E-Waste Dismantling Market (East Delhi)',
    nameHi: 'सीलमपुर ई-कचरा मार्केट (पूर्वी दिल्ली)',
    nameMr: 'सीलमपूर ई-कचरा बाजार (पूर्व दिल्ली)',
    address: 'Shop 14, Main Market, Near Metro Pillar 142, Seelampur, Delhi',
    zone: 'Seelampur E-Waste Market, Delhi',
    lat: 28.6692,
    lng: 77.2685
  },
  {
    id: 'dharavi',
    nameEn: 'Dharavi Scrap Transit Yard (Mumbai)',
    nameHi: 'धारावी स्क्रैप ट्रांजिट यार्ड (मुंबई)',
    nameMr: 'धारावी भंगार ट्रान्झिट यार्ड (मुंबई)',
    address: 'Transit Yard 9, 60 Feet Road, Dharavi, Mumbai',
    zone: 'Dharavi Recycling Cluster, Mumbai',
    lat: 19.0416,
    lng: 72.8535
  },
  {
    id: 'kurla',
    nameEn: 'Kurla West Scrap Market (Mumbai)',
    nameHi: 'कुर्ला वेस्ट कबाड़ बाजार (मुंबई)',
    nameMr: 'कुर्ला पश्चिम भंगार बाजार (मुंबई)',
    address: 'CST Road Scrap Yard, Kurla West, Mumbai',
    zone: 'Kurla West Scrap Market, Mumbai',
    lat: 19.0688,
    lng: 72.8797
  },
  {
    id: 'pune_shivajinagar',
    nameEn: 'Shivaji Nagar Scrap Cluster (Pune)',
    nameHi: 'शिवाजी नगर स्क्रैप क्लस्टर (पुणे)',
    nameMr: 'शिवाजी नगर भंगार क्लस्टर (पुणे)',
    address: 'Kasba Peth Scrap Depot, Shivaji Nagar, Pune',
    zone: 'Shivaji Nagar Scrap Cluster, Pune',
    lat: 18.5314,
    lng: 73.8446
  }
];

export const KabadiwalaDashboard: React.FC = () => {
  const { user } = useAuth();
  const { language, t, formatCurrency, speak, preserveEnglishItemName } = useLanguage();
  
  // Active Tab: lots | bids | priceboard | recyclers | handover | passbook | kyc | safety | pickups
  const [activeTab, setActiveTab] = useState<'lots' | 'bids' | 'priceboard' | 'recyclers' | 'handover' | 'passbook' | 'kyc' | 'safety' | 'pickups'>('lots');

  // KYC State
  const [kycInfo, setKycInfo] = useState<KycInfo | null>(null);

  // Contextual Chat State
  const [activeChatContext, setActiveChatContext] = useState<{
    type: 'LOT' | 'PICKUP';
    id: string;
    title: string;
    partnerName: string;
    partnerRole?: string;
  } | null>(null);

  // Rating Modal State
  const [ratingModalData, setRatingModalData] = useState<{
    saleTokenId?: string;
    partnerId: string;
    partnerName: string;
    role: string;
    lotCode?: string;
  } | null>(null);

  // Sub-view inside 'lots' tab: 'create' or 'mylots'
  const [lotsSubView, setLotsSubView] = useState<'create' | 'mylots'>('create');
  const [myLots, setMyLots] = useState<EWasteLot[]>(() => storage.getMyLots(user?.id));
  const [createdLotModal, setCreatedLotModal] = useState<EWasteLot | null>(null);
  const [lotFilter, setLotFilter] = useState<'ALL' | 'AVAILABLE' | 'BIDDING' | 'HANDOVER_PENDING' | 'CONFIRMED'>('ALL');

  // Offline Mode State
  const [isOffline, setIsOffline] = useState<boolean>(() => {
    return localStorage.getItem('dhatu_offline_mode') === 'true';
  });
  const [offlineQueue, setOfflineQueue] = useState<EWasteLot[]>(() => {
    try {
      const saved = localStorage.getItem('dhatu_offline_lots');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [syncing, setSyncing] = useState(false);

  // Lot Creation State
  const [lotTypeMode, setLotTypeMode] = useState<'single' | 'custom'>('single');
  const [lotCategory, setLotCategory] = useState('High-grade Printed Circuit Boards (PCBs)');
  const [lotWeight, setLotWeight] = useState(12.5);
  const [lotItemCount, setLotItemCount] = useState(1);
  const [lotPhotoTaken, setLotPhotoTaken] = useState(false);
  const [lotPhotoClassifying, setLotPhotoClassifying] = useState(false);
  const [lotMlResult, setLotMlResult] = useState<MLClassificationResult | null>(null);
  const [aiValuation, setAiValuation] = useState(8000);
  const [lotCreatedSuccess, setLotCreatedSuccess] = useState<string | null>(null);

  // Lot Handover Location State
  const [lotLocationMode, setLotLocationMode] = useState<'preset' | 'gps' | 'custom'>('preset');
  const [selectedHubPreset, setSelectedHubPreset] = useState<string>('mayapuri');
  const [lotLocationAddress, setLotLocationAddress] = useState<string>(SCRAP_HUB_PRESETS[0].address);
  const [lotLocationZone, setLotLocationZone] = useState<string>(SCRAP_HUB_PRESETS[0].zone);
  const [lotCoords, setLotCoords] = useState<[number, number]>([SCRAP_HUB_PRESETS[0].lat, SCRAP_HUB_PRESETS[0].lng]);
  const [isDetectingLotLocation, setIsDetectingLotLocation] = useState<boolean>(false);

  const handleDetectLotGps = async () => {
    setIsDetectingLotLocation(true);
    try {
      const pos = await getCurrentPosition();
      const coords: [number, number] = [pos.latitude, pos.longitude];
      setLotCoords(coords);
      const geo = await reverseGeocode(pos.latitude, pos.longitude);
      const addr = geo.displayName || `${geo.shortAddress}, ${geo.city}`;
      setLotLocationAddress(addr);
      setLotLocationZone(geo.suburb || geo.city || 'Live GPS Location');
      setLotLocationMode('gps');
      hapticSuccess();
    } catch (err) {
      console.warn('Lot GPS detection failed', err);
    } finally {
      setIsDetectingLotLocation(false);
    }
  };

  const handleSelectHubPreset = (hubId: string) => {
    const hub = SCRAP_HUB_PRESETS.find(h => h.id === hubId);
    if (hub) {
      setSelectedHubPreset(hubId);
      setLotLocationAddress(hub.address);
      setLotLocationZone(hub.zone);
      setLotCoords([hub.lat, hub.lng]);
      setLotLocationMode('preset');
    }
  };

  // Custom Mixed Lot Line Items State
  const [customLotItems, setCustomLotItems] = useState<Array<{ id: string; category: string; weightKg: number; ratePerKg: number; subtotal: number; quantity?: number }>>([
    { id: 'cli-1', category: 'High-grade Printed Circuit Boards (PCBs)', weightKg: 8.0, ratePerKg: 640, subtotal: 5120, quantity: 4 },
    { id: 'cli-2', category: 'Copper Cables & Insulated Wires', weightKg: 6.5, ratePerKg: 480, subtotal: 3120, quantity: 2 },
    { id: 'cli-3', category: 'Lithium-ion Batteries', weightKg: 4.0, ratePerKg: 145, subtotal: 580, quantity: 8 }
  ]);
  const [newCustomCategory, setNewCustomCategory] = useState('Engineering E-Plastics (ABS/HIPS)');
  const [newCustomWeight, setNewCustomWeight] = useState(5.0);
  const [newCustomQuantity, setNewCustomQuantity] = useState(1);

  // Custom Typed Product Support for Single and Mixed Lots
  const [isCustomSingleLot, setIsCustomSingleLot] = useState(false);
  const [customSingleLotName, setCustomSingleLotName] = useState('');
  const [customSingleLotRate, setCustomSingleLotRate] = useState(100);

  const [isCustomMixedItem, setIsCustomMixedItem] = useState(false);
  const [customMixedItemName, setCustomMixedItemName] = useState('');
  const [customMixedItemRate, setCustomMixedItemRate] = useState(100);

  // Dynamic Live Price Board Dataset (Category, buying price, 7-day trend, spoken texts)
  const [liveRates, setLiveRates] = useState<ScrapRate[]>(() => storage.getRates());

  const priceBoardData = liveRates.map(r => ({
    category: r.category,
    categoryHi: r.hindiName || r.category,
    categoryMr: r.marathiName || r.hindiName || r.category,
    ratePerKg: r.ratePerKg,
    delta: r.weeklyDelta ?? 0,
    trend: (r.weeklyDelta ?? 0) > 0 ? 'UP' : (r.weeklyDelta ?? 0) < 0 ? 'DOWN' : 'STABLE',
    desc: r.description
  }));

  // Recycler Directory Data (Ranked by distance, rate, CPCB status)
  const nearbyRecyclers = [
    {
      id: 'rec-1',
      name: 'EcoRecycle Aggregators Ltd (Unit-II)',
      cpcbReg: 'CPCB-EW-2023-DL-0881',
      distanceKm: 3.2,
      lat: 28.5355,
      lng: 77.2732,
      location: 'Okhla Phase-II, New Delhi',
      rateMultiplier: '100% Top Benchmark',
      pickupAvailable: true,
      rating: 4.9,
      acceptedMaterials: ['PCBs', 'Batteries', 'Copper Cables', 'CRT Glass', 'E-Plastics']
    },
    {
      id: 'rec-2',
      name: 'GreenEarth Refiners & Smelters',
      cpcbReg: 'CPCB-EW-2022-DL-0412',
      distanceKm: 6.8,
      lat: 28.6280,
      lng: 77.1250,
      location: 'Mayapuri Industrial Area, New Delhi',
      rateMultiplier: '98% Benchmark',
      pickupAvailable: true,
      rating: 4.8,
      acceptedMaterials: ['PCBs', 'Batteries', 'Motors']
    },
    {
      id: 'rec-3',
      name: 'Bharat Metal & E-Waste Solutions',
      cpcbReg: 'CPCB-EW-2024-UP-1190',
      distanceKm: 9.4,
      lat: 28.5820,
      lng: 77.3150,
      location: 'Sector 8, Noida (UP)',
      rateMultiplier: '104% Bulk Bonus (+4%)',
      pickupAvailable: false,
      rating: 4.7,
      acceptedMaterials: ['Copper Wire', 'PCBs', 'Magnets']
    }
  ];

  // Safety Guidance Cards
  const safetyCards: SafetyGuidanceCard[] = [
    {
      id: 'safe-1',
      hazardTitleEn: 'Li-ion Battery Puncture & Thermal Fire',
      hazardTitleHi: 'लिथियम बैटरी फटना और आग का खतरा',
      hazardTitleMr: 'लिथियम बॅटरी फुटणे आणि आगीचा धोका',
      category: 'Batteries',
      severity: 'CRITICAL',
      dosEn: ['Tape battery terminals with PVC tape', 'Store in dry sand bucket', 'Keep isolated in open air'],
      dosHi: ['टर्मिनलों पर पीवीसी टेप लगाएं', 'सूखी रेत की बाल्टी में रखें', 'खुली हवा में अलग रखें'],
      dosMr: ['टोकांना पीव्हीसी टेप लावा', 'कोरड्या वाळूच्या बादलीत ठेवा', 'मोकळ्या हवेत वेगळे ठेवा'],
      dontsEn: ['NEVER puncture or crush with hammer', 'Do not dump in water', 'Do not expose to open heat'],
      dontsHi: ['हथौड़े से कभी न तोड़ें या दबाएं', 'पानी में न फेंकें', 'आग या गर्मी के पास न रखें'],
      dontsMr: ['हातोड्याने कधीही दाबू किंवा फोडू नका', 'पाण्यात फेकू नका', 'उष्णतेजवळ ठेवू नका'],
      spokenEn: 'Critical Safety Alert. Never puncture or crush lithium batteries. They explode and cause chemical fires.',
      spokenHi: 'गंभीर चेतावनी! लिथियम बैटरी को कभी न दबाएं या हथौड़े से मारें। यह भयानक आग पकड़ सकती है।',
      spokenMr: 'गंभीर इशारा! लिथियम बॅटरी कधीही दाबू नका. तिला स्फोट होऊन रासायनिक आग लागू शकते.'
    },
    {
      id: 'safe-2',
      hazardTitleEn: 'Toxic Open Cable Burning',
      hazardTitleHi: 'तारों को खुले में जलाने का जहरीला धुआं',
      hazardTitleMr: 'तारा उघड्यावर जाळण्याचा विषारी धूर',
      category: 'Cables',
      severity: 'CRITICAL',
      dosEn: ['Use manual wire-stripper hand tool', 'Strip insulation cold', 'Sell with insulation if without tool'],
      dosHi: ['वायर स्ट्रिपर टूल का प्रयोग करें', 'ठंडा छीलकर तांबा निकालें', 'टूल न हो तो तार सहित बेचें'],
      dosMr: ['वायर स्ट्रिपर हत्यार वापरा', 'थंड सोलून तांबे काढा', 'हत्यार नसल्यास तारेसह विका'],
      dontsEn: ['NEVER burn PVC cables in open ground', 'Toxic dioxin fumes cause permanent lung cancer', 'Illegal under CPCB rules'],
      dontsHi: ['तारों को कभी आग में न जलाएं', 'जहरीला धुआं फेफड़ों को हमेशा के लिए नुकसान पहुंचाता है', 'यह पूर्णतः गैरकानूनी है'],
      dontsMr: ['तारा कधीही जाळू नका', 'विषारी धुराने फुफ्फुसाचा कर्करोग होतो', 'हे कायद्याने पूर्णतः बेकायदेशीर आहे'],
      spokenEn: 'Never burn copper cables in the open. Burning PVC produces cancer-causing dioxin fumes. Always strip manually.',
      spokenHi: 'तारों को कभी खुले में न जलाएं! पीवीसी जलने से जानलेवा कैंसर कारक धुआं निकलता है। हमेशा हाथ से छीलें।',
      spokenMr: 'तारा उघड्यावर कधीही जाळू नका! जळणाऱ्या धुराने कर्करोग होतो. नेहमी हाताने सोलून वेगळे करा.'
    },
    {
      id: 'safe-3',
      hazardTitleEn: 'CRT Glass Implosion & Lead Leaching',
      hazardTitleHi: 'सीआरटी कांच का फटना एवं सीसा (लेड) प्रदूषण',
      hazardTitleMr: 'सीआरटी काच फुटणे आणि शिसे प्रदूषण',
      category: 'CRT Screens',
      severity: 'HIGH',
      dosEn: ['Wear heavy gloves & eye protection', 'Keep vacuum funnel glass intact', 'Place in soft cardboard bed'],
      dosHi: ['मोटे दस्ताने और चश्मा पहनें', 'कांच के बल्ब को साबुत रखें', 'गत्ते के डिब्बे में सुरक्षित रखें'],
      dosMr: ['जाड हातमोजे आणि चष्मा वापरा', 'काचेचा बल्ब अखंड ठेवा', 'खोक्यात सुरक्षित ठेवा'],
      dontsEn: ['Do NOT smash CRT screen with stone', 'Lead dust is poisonous to children', 'Do not dump in regular soil'],
      dontsHi: ['स्क्रीन को पत्थर से कभी न तोड़ें', 'सीसे की धूल बच्चों के लिए जानलेवा है', 'मिट्टी में न फेंकें'],
      dontsMr: ['स्क्रीन दगडाने फोडू नका', 'शिशाची धूळ मुलांसाठी अत्यंत विषारी आहे', 'मातीत टाकू नका'],
      spokenEn: 'CRT glass contains poisonous lead. Do not smash the bulb to extract the copper coil. Keep intact.',
      spokenHi: 'सीआरटी स्क्रीन में जहरीला सीसा होता है। तांबा निकालने के लिए बल्ब को न फोड़ें। साबुत रखें।',
      spokenMr: 'सीआरटी काचेमध्ये विषारी शिसे असते. तांबे काढण्यासाठी बल्ब फोडू नका. अखंड ठेवा.'
    },
    {
      id: 'safe-4',
      hazardTitleEn: 'Informal Acid Leaching on Circuit Boards',
      hazardTitleHi: 'सर्किट बोर्ड पर तेजाब (अम्ल) का छिड़काव',
      hazardTitleMr: 'सर्किट बोर्डवर आम्ल किंवा तेजाब ओतणे',
      category: 'PCBs',
      severity: 'CRITICAL',
      dosEn: ['Sell unstripped motherboards whole to CPCB smelters', 'Hydrometallurgical recovery yields higher pay', 'Keep dry'],
      dosHi: ['मदरबोर्ड को साबुत अधिकृत रीसायकलर को बेचें', 'सीपीसीबी प्लांट ज्यादा दाम देते हैं', 'सूखा रखें'],
      dosMr: ['मदरबोर्ड अखंड अधिकृत रीसायकलरला विका', 'सीपीसीबी प्लांट जास्त पैसे देतात', 'कोरडे ठेवा'],
      dontsEn: ['NEVER wash boards in nitric acid or aqua regia', 'Causes blindness and permanent chemical burns', 'Heavy criminal fines'],
      dontsHi: ['तेजाब या तेज़ाब के टब में कभी न धोएं', 'आंखों की रोशनी जा सकती है और त्वचा जलती है', 'भारी जुर्माना हो सकता है'],
      dontsMr: ['तेजाब किंवा आम्लात कधीही धुवू नका', 'डोळे निकामी होतात आणि त्वचा जळते', 'मोठा दंड होऊ शकतो'],
      spokenEn: 'Never use acid baths on electronic circuit boards. It causes blindness and severe burns. Sell whole to authorized aggregators.',
      spokenHi: 'सर्किट बोर्ड पर तेजाब कभी न डालें! यह अंधापन और गंभीर जलन पैदा करता है। पूरा बोर्ड रीसायकलर को दें।',
      spokenMr: 'सर्किट बोर्डवर तेजाब कधीही ओतू नका! यामुळे अंधत्व येते. संपूर्ण बोर्ड अधिकृत व्यापाऱ्याला विका.'
    }
  ];

  // Passbook Running Ledger & Wallet State
  const [passbookTransactions, setPassbookTransactions] = useState<PassbookTxn[]>(() => storage.getPassbookTransactions());
  const [walletBalance, setWalletBalance] = useState<number>(() => storage.getWalletBalance());

  // Collector Live Location & Pickups State
  const [collectorCoords, setCollectorCoords] = useState<[number, number]>([28.5685, 77.2412]);
  const [collectorLocationName, setCollectorLocationName] = useState<string>('Detecting Live Location...');
  const [isUpdatingLocation, setIsUpdatingLocation] = useState<boolean>(false);
  const [nearbyPickups, setNearbyPickups] = useState<Pickup[]>([]);
  const [activeJob, setActiveJob] = useState<Pickup | null>(null);
  const [itemWeights, setItemWeights] = useState<{ [category: string]: number }>({});
  const [completingJob, setCompletingJob] = useState(false);
  const [jobSuccess, setJobSuccess] = useState<string | null>(null);
  const [citizenOtpInput, setCitizenOtpInput] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [isOtpVerified, setIsOtpVerified] = useState(false);

  // Active Handover Generator Ticket
  const [handoverLotCode, setHandoverLotCode] = useState('KC-LOT-9821');

  // Load Pickups with real distance calculation
  const loadPickups = async (overrideCoords?: [number, number]) => {
    try {
      const coords = overrideCoords || collectorCoords;
      const nearby = await api.getNearbyPickups(coords[0], coords[1], 25).catch(() => storage.getNearbyPickups(coords[0], coords[1], 25));
      const sortedNearby = nearby.map(p => ({
        ...p,
        distanceKm: calculateDistanceKm(coords[0], coords[1], p.latitude, p.longitude)
      })).sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));

      setNearbyPickups(sortedNearby);
      const my = await api.getMyPickups().catch(() => storage.getMyPickups(user?.id, 'KABADIWALA'));
      const current = my.find(p => p.status === 'IN_PROGRESS' || p.status === 'ACCEPTED');
      if (current) {
        setActiveJob(current);
        const weights: { [c: string]: number } = {};
        current.items.forEach(i => {
          weights[i.category] = i.actualWeightKg || i.estWeightKg || 5;
        });
        setItemWeights(weights);
      }
    } catch (e) {
      console.warn('Pickups fetch fallback');
    }
  };

  const detectCollectorLocation = async () => {
    setIsUpdatingLocation(true);
    try {
      const pos = await getCurrentPosition();
      const coords: [number, number] = [pos.latitude, pos.longitude];
      setCollectorCoords(coords);
      const geo = await reverseGeocode(pos.latitude, pos.longitude);
      setCollectorLocationName(geo.shortAddress);
      await loadPickups(coords);
      hapticSuccess();
    } catch (err) {
      console.warn('Collector live location fetch failed', err);
    } finally {
      setIsUpdatingLocation(false);
    }
  };

  const loadLots = async () => {
    try {
      const fetched = await api.getLots();
      if (fetched && fetched.length > 0) {
        setMyLots(fetched);
      }
    } catch {
      setMyLots(storage.getMyLots(user?.id));
    }
  };

  const loadKyc = async () => {
    try {
      const kyc = await api.getKycStatus();
      setKycInfo(kyc);
    } catch (err) {
      console.warn('KYC load error:', err);
    }
  };

  const handleSubmitKyc = async (payload: { documentType: string; documentNumber: string; remarks?: string }) => {
    await api.submitKycDocuments(payload);
    await loadKyc();
  };

  const handleSubmitReview = async (payload: any) => {
    await api.submitReview(payload);
  };

  useEffect(() => {
    loadPickups();
    detectCollectorLocation();
    loadLots();
    loadKyc();

    // Listen for storage events across tabs or local mutations
    const handleStorageChange = (e: any) => {
      const key = e.detail?.key;
      if (key === STORAGE_KEYS.PICKUPS || key === '*') {
        loadPickups();
      }
      if (key === STORAGE_KEYS.LOTS || key === '*') {
        loadLots();
      }
      if (key === STORAGE_KEYS.PASSBOOK_TXNS || key === STORAGE_KEYS.WALLET_BALANCE || key === '*') {
        setPassbookTransactions(storage.getPassbookTransactions());
        setWalletBalance(storage.getWalletBalance());
      }
      if (key === STORAGE_KEYS.RATES || key === '*') {
        setLiveRates(storage.getRates());
      }
    };

    window.addEventListener('dhatu-storage-change', handleStorageChange);
    return () => window.removeEventListener('dhatu-storage-change', handleStorageChange);
  }, [user?.id]);

  // Update AI Valuation when lot weight, category, mode, or custom items change
  useEffect(() => {
    if (lotTypeMode === 'single') {
      const rate = isCustomSingleLot
        ? customSingleLotRate
        : (priceBoardData.find(p => p.category.includes(lotCategory) || lotCategory.includes(p.category))?.ratePerKg || 400);
      setAiValuation(Math.round(rate * lotWeight));
    } else {
      const total = customLotItems.reduce((acc, it) => acc + it.subtotal, 0);
      setAiValuation(Math.round(total));
    }
  }, [lotTypeMode, lotCategory, lotWeight, customLotItems, priceBoardData, isCustomSingleLot, customSingleLotRate]);

  // Add item to custom mixed lot
  const handleAddCustomLotItem = () => {
    if (newCustomWeight <= 0) return;
    const catName = isCustomMixedItem
      ? (customMixedItemName.trim() || 'Custom E-Waste Item')
      : newCustomCategory;
    const rate = isCustomMixedItem
      ? customMixedItemRate
      : (priceBoardData.find(p => p.category.includes(newCustomCategory) || newCustomCategory.includes(p.category))?.ratePerKg || 400);
    const subtotal = Math.round(rate * newCustomWeight);
    const qty = Math.max(1, Math.floor(newCustomQuantity || 1));

    const existingIdx = customLotItems.findIndex(i => i.category.toLowerCase() === catName.toLowerCase());
    if (existingIdx >= 0) {
      setCustomLotItems(prev => prev.map((item, idx) => {
        if (idx === existingIdx) {
          const updatedWeight = Math.round((item.weightKg + newCustomWeight) * 10) / 10;
          return {
            ...item,
            weightKg: updatedWeight,
            quantity: (item.quantity || 1) + qty,
            subtotal: Math.round(item.ratePerKg * updatedWeight)
          };
        }
        return item;
      }));
    } else {
      setCustomLotItems(prev => [
        ...prev,
        {
          id: `cli-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          category: catName,
          weightKg: newCustomWeight,
          ratePerKg: rate,
          quantity: qty,
          subtotal
        }
      ]);
    }
    setNewCustomQuantity(1);
    if (isCustomMixedItem) {
      setCustomMixedItemName('');
    }
    hapticSuccess();
  };

  // Adjust weight of custom lot item (+ / - delta kg)
  const handleUpdateCustomItemWeight = (id: string, deltaKg: number) => {
    setCustomLotItems(prev => prev.map(item => {
      if (item.id === id) {
        const nextWeight = Math.max(0.01, Math.round((item.weightKg + deltaKg) * 100) / 100);
        return {
          ...item,
          weightKg: nextWeight,
          subtotal: Math.round(item.ratePerKg * nextWeight)
        };
      }
      return item;
    }));
  };

  // Directly set custom lot item weight
  const handleSetCustomItemWeight = (id: string, weight: number) => {
    setCustomLotItems(prev => prev.map(item => {
      if (item.id === id) {
        const nextWeight = Math.max(0.01, Math.round(weight * 100) / 100);
        return {
          ...item,
          weightKg: nextWeight,
          subtotal: Math.round(item.ratePerKg * nextWeight)
        };
      }
      return item;
    }));
  };

  // Adjust quantity of custom lot item (+ / - delta units)
  const handleUpdateCustomItemQuantity = (id: string, deltaQty: number) => {
    setCustomLotItems(prev => prev.map(item => {
      if (item.id === id) {
        const nextQty = Math.max(1, (item.quantity || 1) + deltaQty);
        return {
          ...item,
          quantity: nextQty
        };
      }
      return item;
    }));
  };

  // Directly set custom lot item quantity
  const handleSetCustomItemQuantity = (id: string, qty: number) => {
    setCustomLotItems(prev => prev.map(item => {
      if (item.id === id) {
        const nextQty = Math.max(1, Math.floor(qty));
        return {
          ...item,
          quantity: nextQty
        };
      }
      return item;
    }));
  };

  // Remove item from custom lot
  const handleRemoveCustomLotItem = (id: string) => {
    setCustomLotItems(prev => prev.filter(item => item.id !== id));
    hapticSuccess();
  };

  // Toggle Offline Mode
  const handleToggleOffline = () => {
    const next = !isOffline;
    setIsOffline(next);
    localStorage.setItem('dhatu_offline_mode', String(next));
  };

  // Sync Offline Queue
  const handleSyncOfflineLots = () => {
    if (offlineQueue.length === 0) return;
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      offlineQueue.forEach(lot => storage.saveLot({ ...lot, isOfflineQueued: false }));
      const count = offlineQueue.length;
      setOfflineQueue([]);
      localStorage.removeItem('dhatu_offline_lots');
      setMyLots(storage.getMyLots(user?.id));
      hapticSuccess();
      setLotCreatedSuccess(`Synchronized ${count} offline lots to the Dhatu central ledger!`);
    }, 1500);
  };

  // ML Scrap Photo Upload & Auto-Classification
  const handleLotPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLotPhotoClassifying(true);
    setLotMlResult(null);
    try {
      const result = await api.classifyScrapImage(file);
      setLotMlResult(result);
      setLotPhotoTaken(true);

      // Auto-match category based on result
      let matchedCategory = 'High-grade Printed Circuit Boards (PCBs)';
      const catLower = (result.category || '').toLowerCase();
      if (catLower.includes('battery') || catLower.includes('cell') || catLower.includes('lithium')) {
        matchedCategory = 'Lithium-ion Batteries';
      } else if (catLower.includes('cable') || catLower.includes('wire') || catLower.includes('copper') || catLower.includes('cord')) {
        matchedCategory = 'Copper Cables & Insulated Wires';
      } else if (catLower.includes('display') || catLower.includes('lcd') || catLower.includes('led') || catLower.includes('screen') || catLower.includes('panel')) {
        matchedCategory = 'LCD/LED Display Panels';
      } else if (catLower.includes('motor') || catLower.includes('compressor')) {
        matchedCategory = 'Electric Motors & Compressors';
      } else if (catLower.includes('low-grade')) {
        matchedCategory = 'Low-grade Printed Circuit Boards (PCBs)';
      } else if (catLower.includes('pcb') || catLower.includes('circuit') || catLower.includes('board') || catLower.includes('ewaste') || catLower.includes('e-waste')) {
        matchedCategory = 'High-grade Printed Circuit Boards (PCBs)';
      } else if (catLower.includes('plastic') || catLower.includes('abs') || catLower.includes('hips')) {
        matchedCategory = 'Engineering E-Plastics (ABS/HIPS)';
      } else if (catLower.includes('crt') || catLower.includes('glass')) {
        matchedCategory = 'CRT Monitor Glass Unit';
      } else if (catLower.includes('metal') || catLower.includes('steel') || catLower.includes('aluminum')) {
        matchedCategory = 'Metal';
      }
      setLotCategory(matchedCategory);
      hapticSuccess();
    } catch {
      setLotPhotoTaken(true);
    } finally {
      setLotPhotoClassifying(false);
    }
  };

  // Handle Create Lot (supports both Single Material and Custom Mixed Lots)
  const handleCreateLot = (e: React.FormEvent) => {
    e.preventDefault();

    let finalCategory = lotCategory;
    let finalWeight = lotWeight;
    let finalValuation = aiValuation;
    let offeredRate = 400;
    let isCustom = false;
    let itemsPayload: EWasteLotItem[] | undefined = undefined;

    if (lotTypeMode === 'custom') {
      if (customLotItems.length === 0) {
        alert(t('pleaseAddOneMaterial', 'Please add at least one material to the custom lot.'));
        return;
      }
      isCustom = true;
      finalWeight = Math.round(customLotItems.reduce((sum, it) => sum + it.weightKg, 0) * 10) / 10;
      finalValuation = Math.round(customLotItems.reduce((sum, it) => sum + it.subtotal, 0));
      offeredRate = finalWeight > 0 ? Math.round(finalValuation / finalWeight) : 400;
      finalCategory = `Custom Mixed Lot (${customLotItems.length} Materials)`;
      itemsPayload = customLotItems.map(it => ({
        id: it.id,
        category: it.category,
        weightKg: it.weightKg,
        ratePerKg: it.ratePerKg,
        quantity: it.quantity || 1,
        subtotal: it.subtotal
      }));
    } else {
      if (isCustomSingleLot) {
        finalCategory = customSingleLotName.trim() || 'Custom E-Waste Lot';
        offeredRate = customSingleLotRate;
      } else {
        const rateItem = priceBoardData.find(p => p.category.includes(lotCategory) || lotCategory.includes(p.category));
        offeredRate = rateItem ? rateItem.ratePerKg : 400;
        finalCategory = lotCategory;
      }
      finalValuation = Math.round(offeredRate * lotWeight);
    }

    const totalUnitsCount = lotTypeMode === 'custom'
      ? customLotItems.reduce((sum, it) => sum + (it.quantity || 1), 0)
      : Math.max(1, Math.floor(lotItemCount || 1));

    if (lotTypeMode !== 'custom') {
      itemsPayload = [
        {
          id: `item-${Date.now()}`,
          category: finalCategory,
          weightKg: finalWeight,
          ratePerKg: offeredRate,
          quantity: totalUnitsCount,
          subtotal: finalValuation
        }
      ];
    }

    const newLot: EWasteLot = {
      id: `lot-local-${Date.now()}`,
      lotCode: `KC-LOT-${Math.floor(1000 + Math.random() * 9000)}`,
      collectorId: user?.id || 'mock-kaba-1',
      collectorName: user?.name || 'Suresh Kumar',
      category: finalCategory,
      approxWeightKg: finalWeight,
      totalItems: totalUnitsCount,
      estimatedValue: finalValuation,
      askingPrice: finalValuation,
      minBidAmount: Math.round(finalValuation * 0.5),
      recyclerOfferedRate: offeredRate,
      status: 'AVAILABLE',
      gpsLat: lotCoords[0],
      gpsLng: lotCoords[1],
      locationAddress: lotLocationAddress,
      locationZone: lotLocationZone,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      qrCode: `KBD-EWASTE-${Math.floor(1000 + Math.random() * 9000)}-IN`,
      isOfflineQueued: isOffline,
      isCustomLot: isCustom,
      items: itemsPayload,
      bids: []
    };

    // Save lot to localStorage
    storage.saveLot(newLot);
    setMyLots(storage.getMyLots(user?.id));

    if (isOffline) {
      const updatedQueue = [newLot, ...offlineQueue];
      setOfflineQueue(updatedQueue);
      localStorage.setItem('dhatu_offline_lots', JSON.stringify(updatedQueue));
      setLotCreatedSuccess(`Offline Lot #${newLot.lotCode} saved locally! It will sync once reconnecting.`);
    } else {
      setLotCreatedSuccess(`Lot #${newLot.lotCode} (${isCustom ? 'Custom Mixed Lot' : newLot.category}) created and stored in local storage! Broadcasted to nearby authorized recyclers.`);
    }

    setHandoverLotCode(newLot.lotCode);
    hapticSuccess();
    setCreatedLotModal(newLot); // Trigger confirmation popup
  };

  // Handle Collector Accepting a Recycler Bid
  const handleAcceptBid = async (lotId: string, bidId: string) => {
    try {
      await api.acceptBid(lotId, bidId);
    } catch (err) {
      console.warn('API accept bid error:', err);
    }
    const updated = storage.acceptLotBid(lotId, bidId);
    await loadLots();
    setMyLots(storage.getMyLots(user?.id));
    hapticSuccess();
    setJobSuccess(`Bid of ₹${updated.estimatedValue} accepted for Lot #${updated.lotCode}! Delivery handover is now pending.`);
    setActiveTab('handover');
  };

  // Handle Collector Rejecting a Recycler Bid
  const handleRejectBid = (lotId: string, bidId: string) => {
    storage.rejectLotBid(lotId, bidId);
    setMyLots(storage.getMyLots(user?.id));
    triggerHaptic(30);
  };

  // Simulate Recycler Bid for demo/testing (must be above 50% of ask)
  const handleSimulateBid = (lot: EWasteLot) => {
    const ask = lot.askingPrice || lot.estimatedValue;
    const simAmount = Math.round(ask * 0.88); // 88% of ask (well above 50% min)
    storage.addBidToLot(lot.id, {
      recyclerId: 'rec-sim-01',
      recyclerName: 'Bharat Smelters & Aggregators Ltd',
      bidAmount: simAmount
    });
    setMyLots(storage.getMyLots(user?.id));
    hapticSuccess();
  };

  // Accept Pickup
  const handleAcceptPickup = async (pickup: Pickup) => {
    try {
      const accepted = await api.acceptPickup(pickup.id);
      const initialWeights: { [c: string]: number } = {};
      (accepted.items || []).forEach(i => {
        initialWeights[i.category] = i.actualWeightKg || i.estWeightKg || 5;
      });
      setItemWeights(initialWeights);
      setActiveJob(accepted);
      setActiveTab('pickups');
      await loadPickups();
      speak(language === 'hi' ? 'पिकअप स्वीकार कर लिया गया है।' : language === 'mr' ? 'संकलन स्वीकारले आहे.' : 'Pickup accepted');
    } catch (e: any) {
      const accepted = storage.updatePickupStatus(pickup.id, 'ACCEPTED', {
        kabadiwalaId: user?.id || 'mock-kaba-1',
        kabadiwala: {
          id: user?.id || 'mock-kaba-1',
          name: user?.name || 'Suresh Kumar',
          phone: user?.phone || '9876543210'
        }
      });
      const target = accepted || { ...pickup, status: 'ACCEPTED' as const };
      const initialWeights: { [c: string]: number } = {};
      (target.items || []).forEach(i => {
        initialWeights[i.category] = i.actualWeightKg || i.estWeightKg || 5;
      });
      setItemWeights(initialWeights);
      setActiveJob(target);
      setActiveTab('pickups');
      await loadPickups();
    }
  };

  // Complete Pickup
  const handleCompletePickup = async () => {
    if (!activeJob) return;

    // Layer 1 Handover Verification: Verify Citizen OTP
    const expectedOtp = activeJob.verificationOtp || '4821';
    if (citizenOtpInput.trim() && citizenOtpInput.trim() !== expectedOtp) {
      setOtpError(`Verification code mismatch! Enter citizen's 4-digit handover OTP (${expectedOtp})`);
      triggerHaptic(50);
      return;
    }
    if (!citizenOtpInput.trim() && !isOtpVerified) {
      setOtpError(`Physical Handover Verification Required: Enter citizen's 4-digit OTP or click 'Scan / Autofill'`);
      triggerHaptic(50);
      return;
    }

    setCompletingJob(true);
    try {
      const itemsPayload = (activeJob.items || []).map(item => ({
        ...item,
        category: item.category,
        quantity: item.quantity || 1,
        estWeightKg: item.estWeightKg || 5,
        actualWeightKg: itemWeights[item.category] ?? item.actualWeightKg ?? item.estWeightKg ?? 5,
        ratePerKg: item.ratePerKg
      }));
      const totalUnits = activeJob.totalItems || itemsPayload.reduce((s, it) => s + (it.quantity || 1), 0);
      const res = await api.completePickup(activeJob.id, itemsPayload).catch(() => ({
        pickup: storage.updatePickupStatus(activeJob.id, 'COMPLETED', {
          isVerified: true,
          items: itemsPayload,
          totalItems: totalUnits,
          verifiedAt: new Date().toISOString()
        }),
        transaction: null,
        totalAmount: activeJob.totalAmount || 620
      }));
      setJobSuccess(`Pickup completed! Layer 1 Handover Verified (OTP: ${expectedOtp}). Payment of ₹${res.totalAmount || activeJob.totalAmount || 620} recorded in Passbook.`);
      setActiveJob(null);
      setItemWeights({});
      setCitizenOtpInput('');
      setIsOtpVerified(false);
      setOtpError(null);
      setWalletBalance(storage.getWalletBalance());
      setPassbookTransactions(storage.getPassbookTransactions());
      await loadPickups();
    } finally {
      setCompletingJob(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 space-y-6 pb-28">
      
      {/* Top Collector Header Bar - Android 17 Expressive Dynamic Hero */}
      <div
        style={{ background: 'var(--gradient-hero)' }}
        className="text-white rounded-[32px] p-6 sm:p-8 shadow-m3-3 border border-white/10 relative overflow-hidden transition-all duration-300"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          
          <div className="space-y-2 z-10">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="rounded-full px-3.5 py-1 text-xs font-bold bg-emerald-500/25 text-emerald-200 border border-emerald-400/30">
                {t('verifiedCollector', 'VERIFIED COLLECTOR')}
              </span>
              <span className="rounded-full px-3 py-1 font-mono text-xs font-bold bg-amber-500/20 text-amber-200 border border-amber-400/30">
                ID: KC-COL-8921
              </span>
              <span className="rounded-full px-3 py-1 font-medium text-xs bg-white/10 text-slate-200 border border-white/15">
                {user?.kabadiwala?.vehicleType || 'Solar Cargo Trike'}
              </span>
              <VoiceAssistButton
                text="Welcome Suresh Kumar. Kabadiwala Collector Portal. Create lots, view spoken price board, find recyclers, and check passbook ledger."
                hindiText="नमस्ते सुरेश कुमार। कबाड़ीवाला संग्राहक पोर्टल। लॉट बनाएं, बोलता हुआ दाम पत्रक देखें, रीसायकलर खोजें और खाता बही देखें।"
                marathiText="सुरेश कुमार स्वागत आहे. भंगार संग्राहक पोर्टल. नवीन लॉट तयार करा, बोलणारा भाव फलक पहा आणि पासबुक तपासा."
                size="sm"
              />
            </div>

            <h1 className="text-3xl sm:text-4xl font-display font-black tracking-tight text-white">
              {language === 'hi' || language === 'mr' ? 'सुरेश कुमार' : 'Suresh Kumar'}
            </h1>

            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-300">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-300" />
                <span>{t('operatingZone', 'Operating Zone: Pan-India Active Network')}</span>
              </span>
              <span className="text-emerald-300 font-bold">★ 4.9 {language === 'hi' ? 'रेटिंग (142 कार्य)' : language === 'mr' ? 'रेटिंग (142 कामे)' : 'Rating (142 Jobs)'}</span>
            </div>
          </div>

          {/* Running Balance & Offline Mode Controls */}
          <div className="flex flex-wrap items-center gap-4 z-10">
            <div className="bg-white/10 backdrop-blur-md px-5 py-3.5 rounded-2xl border border-white/15 text-left sm:text-right">
              <div className="text-xs uppercase font-medium text-slate-300 tracking-wider">
                {t('passbookBalance', 'Passbook Balance')}
              </div>
              <div className="text-2xl sm:text-3xl font-display font-black text-amber-300">
                {formatCurrency(walletBalance)}
              </div>
              <div className="text-xs text-emerald-300 font-semibold flex items-center sm:justify-end gap-1 mt-0.5">
                <span>{t('cashFirst', '💵 Cash-First Support')}</span>
              </div>
            </div>

            {/* Offline Mode Switcher */}
            <div className="flex flex-col items-end gap-2">
              <button
                onClick={handleToggleOffline}
                className={`px-4 py-2.5 rounded-full text-xs sm:text-sm font-bold flex items-center space-x-2 transition-all shadow-sm ${
                  isOffline
                    ? 'bg-rose-600 text-white animate-pulse'
                    : 'bg-white/20 hover:bg-white/30 text-white border border-white/20'
                }`}
                title="Toggle Offline Tolerant Mode"
              >
                {isOffline ? <WifiOff className="w-4 h-4" /> : <Wifi className="w-4 h-4 text-emerald-300" />}
                <span>{isOffline ? t('offlineMode', '📵 Offline Mode') : t('onlineMode', '🌐 Online')}</span>
              </button>

              {offlineQueue.length > 0 && (
                <button
                  onClick={handleSyncOfflineLots}
                  disabled={syncing}
                  className="px-3.5 py-1.5 rounded-full bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold flex items-center space-x-1.5 shadow-sm"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                  <span>{t('syncPendingLots', 'Sync Pending Lots')} ({offlineQueue.length})</span>
                </button>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Offline Pending Sync Warning Banner */}
      {isOffline && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-sm text-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-sm">
          <div className="flex items-center space-x-2.5">
            <WifiOff className="w-5 h-5 text-amber-700 shrink-0" />
            <span className="font-bold">
              {t('offlineModeActive', 'Offline Mode Active:')}
            </span>
            <span className="text-slate-700">{t('offlineModeDesc', 'Lots are cached locally in your phone storage and queued for auto-sync.')}</span>
          </div>
          <span className="font-semibold text-xs text-amber-800 bg-amber-100 px-3 py-1 rounded-full self-start sm:self-auto">
            {t(`${offlineQueue.length} lots pending sync`, `${offlineQueue.length} lots pending sync`)}
          </span>
        </div>
      )}

      {/* Primary Tab Navigation (Material 3 Expressive Pill Tabs) */}
      <div className="flex overflow-x-auto no-scrollbar gap-2.5 pb-2 px-1 flex-nowrap w-full">
        <button
          onClick={() => setActiveTab('lots')}
          className={`flex-shrink-0 whitespace-nowrap px-5 py-2.5 rounded-full font-bold text-sm flex items-center space-x-2 transition-all ${
            activeTab === 'lots'
              ? 'm3-tab-pill-active'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700 shadow-sm'
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>1. {t('tabLots', 'Create Lot & AI Value')}</span>
        </button>

        <button
          onClick={() => setActiveTab('bids')}
          className={`flex-shrink-0 whitespace-nowrap px-5 py-2.5 rounded-full font-bold text-sm flex items-center space-x-2 transition-all ${
            activeTab === 'bids'
              ? 'm3-tab-pill-active'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700 shadow-sm'
          }`}
        >
          <Gavel className="w-4 h-4" />
          <span>2. {t('tabBids', 'Live Bidding Room')}</span>
          {myLots.filter(l => l.status === 'BIDDING' || (l.bids && l.bids.length > 0)).length > 0 && (
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('priceboard')}
          className={`flex-shrink-0 whitespace-nowrap px-5 py-2.5 rounded-full font-bold text-sm flex items-center space-x-2 transition-all ${
            activeTab === 'priceboard'
              ? 'm3-tab-pill-active'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700 shadow-sm'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>3. {t('tabPriceBoard', 'Spoken Price Board')}</span>
        </button>

        <button
          onClick={() => setActiveTab('recyclers')}
          className={`flex-shrink-0 whitespace-nowrap px-5 py-2.5 rounded-full font-bold text-sm flex items-center space-x-2 transition-all ${
            activeTab === 'recyclers'
              ? 'm3-tab-pill-active'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700 shadow-sm'
          }`}
        >
          <Factory className="w-4 h-4" />
          <span>4. {t('tabFindRecyclers', 'Nearby Recyclers')}</span>
        </button>

        <button
          onClick={() => setActiveTab('handover')}
          className={`flex-shrink-0 whitespace-nowrap px-5 py-2.5 rounded-full font-bold text-sm flex items-center space-x-2 transition-all ${
            activeTab === 'handover'
              ? 'm3-tab-pill-active'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700 shadow-sm'
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>5. {t('tabHandover', 'Generate QR & Token')}</span>
        </button>

        <button
          onClick={() => setActiveTab('passbook')}
          className={`flex-shrink-0 whitespace-nowrap px-5 py-2.5 rounded-full font-bold text-sm flex items-center space-x-2 transition-all ${
            activeTab === 'passbook'
              ? 'm3-tab-pill-active'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700 shadow-sm'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>6. {t('tabPassbook', 'Cash Passbook')}</span>
        </button>

        <button
          onClick={() => setActiveTab('kyc')}
          className={`flex-shrink-0 whitespace-nowrap px-5 py-2.5 rounded-full font-bold text-sm flex items-center space-x-2 transition-all ${
            activeTab === 'kyc'
              ? 'm3-tab-pill-active'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700 shadow-sm'
          }`}
        >
          <BadgeCheck className="w-4 h-4" />
          <span>7. {t('tabKyc', 'CPCB KYC & Badges')}</span>
          {kycInfo?.kycStatus === 'VERIFIED' && (
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('pickups')}
          className={`flex-shrink-0 whitespace-nowrap px-5 py-2.5 rounded-full font-bold text-sm flex items-center space-x-2 transition-all ${
            activeTab === 'pickups'
              ? 'm3-tab-pill-active'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700 shadow-sm'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>8. {t('pickups', 'Citizen Pickups')}</span>
        </button>

        <button
          onClick={() => setActiveTab('safety')}
          className={`flex-shrink-0 whitespace-nowrap px-5 py-2.5 rounded-full font-bold text-sm flex items-center space-x-2 transition-all ${
            activeTab === 'safety'
              ? 'bg-rose-700 text-white shadow-m3-1'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700 shadow-sm'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>9. {t('tabSafety', 'Safety Guidance')}</span>
        </button>
      </div>

      {/* TAB 1: DIGITAL LOTS (CREATOR & MY CREATED LOTS) */}
      {activeTab === 'lots' && (
        <div className="space-y-6">
          {/* Sub-view Switcher: Create Lot vs My Created Lots */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-3.5 rounded-[24px] border border-slate-200/80 shadow-m3-1">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setLotsSubView('create')}
                className={`px-6 py-3 rounded-full font-bold text-sm sm:text-base flex items-center gap-2.5 transition-all active:scale-95 ${
                  lotsSubView === 'create'
                    ? 'm3-tab-pill-active shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>{t('createDigitalLot', 'Create Digital Lot')}</span>
              </button>

              <button
                type="button"
                onClick={() => setLotsSubView('mylots')}
                className={`px-6 py-3 rounded-full font-bold text-sm sm:text-base flex items-center gap-2.5 transition-all active:scale-95 ${
                  lotsSubView === 'mylots'
                    ? 'm3-tab-pill-active shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>{t('myCreatedLots', 'My Created Lots')} ({myLots.length})</span>
                {myLots.some(l => (l.bids && l.bids.length > 0)) && (
                  <span className="bg-amber-400 text-slate-950 text-xs font-black px-2.5 py-0.5 rounded-full shadow-sm animate-pulse">
                    {myLots.reduce((sum, l) => sum + (l.bids?.length || 0), 0)} {t('bidsReceived', 'Bids')}
                  </span>
                )}
              </button>
            </div>

            <div className="text-xs sm:text-sm font-semibold text-slate-600 flex items-center gap-2 px-2">
              <span className="hidden sm:inline">{t('biddingRule', 'Recycler Bidding Rule:')}</span>
              <span className="bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-200/80 font-bold text-emerald-800 text-xs sm:text-sm">
                {t('minAskRule', 'Min 50% of Ask Value')}
              </span>
            </div>
          </div>

          {lotsSubView === 'create' ? (() => {
            const customTotalWeight = Math.round(customLotItems.reduce((sum, item) => sum + item.weightKg, 0) * 10) / 10;
            const customTotalUnits = customLotItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
            const customTotalValue = Math.round(customLotItems.reduce((sum, item) => sum + item.subtotal, 0));
            const customBlendedRate = customTotalWeight > 0 ? Math.round(customTotalValue / customTotalWeight) : 0;

            return (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              <div className="lg:col-span-7 bg-white rounded-[28px] p-6 sm:p-8 border border-slate-200/80 shadow-m3-1 space-y-6">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="rounded-full px-3.5 py-1 chip-primary-m3 text-xs font-bold shadow-xs">{t('lotCreationBadge', 'Lot Creation')}</span>
                    <VoiceAssistButton
                      text={lotTypeMode === 'custom' 
                        ? `Custom mixed lot mode. Add multiple scrap materials to bundle into one consignment. Total weight ${customTotalWeight} kilograms.`
                        : "Create lot. Photograph item, enter approx weight, get instant AI valuation estimate."
                      }
                      hindiText={lotTypeMode === 'custom'
                        ? `कस्टम मिक्स्ड लॉट मोड। एक साथ कई तरह का कबाड़ जोड़ें। कुल वजन ${customTotalWeight} किलो।`
                        : "लॉट बनाएं। कबाड़ की फोटो लें, वजन डालें और तुरंत अनुमानित दाम देखें।"
                      }
                      marathiText={lotTypeMode === 'custom'
                        ? `कस्टम मिक्स्ड लॉट मोड. एकाच लॉटमध्ये विविध प्रकारचे भंगार जोडा. एकूण वजन ${customTotalWeight} किलो.`
                        : "नवीन लॉट तयार करा. फोटो घ्या, वजन टाका आणि अंदाजे किंमत पहा."
                      }
                      size="sm"
                    />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-display font-black text-slate-900 mt-2">
                    {t('digitalLotCreatorTitle', 'Digital E-Waste Lot Creator')}
                  </h2>
                  <p className="text-sm sm:text-base text-slate-600 font-normal mt-1">
                    {lotTypeMode === 'custom'
                      ? 'Bundle multiple scrap materials into a single certified lot with itemized rates and automatic valuation.'
                      : 'Photograph material, select e-waste category, specify weight, and generate a verified digital lot.'}
                  </p>
                </div>

                {lotCreatedSuccess && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-sm sm:text-base text-emerald-900 space-y-1">
                    <div className="font-bold flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
                      <span>{t('lotCreatedSuccessTitle', 'Lot Registered Successfully!')}</span>
                    </div>
                    <p className="text-sm">{lotCreatedSuccess}</p>
                  </div>
                )}

                <form onSubmit={handleCreateLot} className="space-y-6">

                  {/* Lot Mode Toggle: Single vs Custom Mixed */}
                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wider mb-2">
                      {t('lotTypeSelection', '1. Select Lot Configuration')}
                    </label>
                    <div className="bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200 grid grid-cols-2 gap-2 shadow-inner">
                      <button
                        type="button"
                        onClick={() => setLotTypeMode('single')}
                        className={`py-3 px-4 rounded-xl text-sm sm:text-base font-bold transition-all flex items-center justify-center gap-2 ${
                          lotTypeMode === 'single'
                            ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80 font-black'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Package className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                        <span>{t('singleMaterialLot', 'Single Material Lot')}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setLotTypeMode('custom')}
                        className={`py-3 px-4 rounded-xl text-sm sm:text-base font-bold transition-all flex items-center justify-center gap-2 ${
                          lotTypeMode === 'custom'
                            ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80 font-black'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Layers className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                        <span>{t('customMixedLot', 'Custom Mixed Lot')}</span>
                        <span className="text-xs px-2.5 py-0.5 rounded-full chip-primary-m3 font-bold">
                          {customLotItems.length}
                        </span>
                      </button>
                    </div>
                  </div>
                  
                  {/* Photo Upload / Capture Simulator with Real AI Classification */}
                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wider mb-2">
                      {t('uploadPhotoLabel', '2. Upload or Capture Photograph')}
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLotPhotoUpload}
                      id="lot-camera-input"
                      className="hidden"
                    />
                    <label
                      htmlFor="lot-camera-input"
                      className="cursor-pointer border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-[28px] p-7 bg-slate-50/70 hover:bg-emerald-50/30 flex flex-col items-center justify-center space-y-3 text-center transition-all block shadow-sm"
                    >
                      <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto shadow-sm">
                        <Camera className="w-8 h-8" />
                      </div>
                      {lotPhotoClassifying ? (
                        <div className="text-emerald-800 font-bold text-sm sm:text-base flex items-center justify-center gap-2 animate-pulse">
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>AI Scanning Scrap Material...</span>
                        </div>
                      ) : lotMlResult ? (
                        <div className="space-y-1.5">
                          <div className="text-emerald-900 font-bold text-sm sm:text-base flex items-center justify-center gap-1.5">
                            <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                            <span>
                              AI Detected: {lotMlResult.detectedItem ? `${lotMlResult.detectedItem} — ${preserveEnglishItemName(lotMlResult.category)}` : preserveEnglishItemName(lotMlResult.category)} ({Math.round(lotMlResult.confidence * 100)}% match)
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm text-slate-600 font-normal">{lotMlResult.advice}</p>
                        </div>
                      ) : lotPhotoTaken ? (
                        <div className="text-emerald-800 font-bold text-sm sm:text-base flex items-center justify-center gap-1.5">
                          <CheckCircle2 className="w-5 h-5" /> {t('photoCapturedMsg', 'Photo Captured & Verified (1080p)')}
                        </div>
                      ) : (
                        <div>
                          <span className="text-base sm:text-lg font-bold text-slate-900 block">{t('tapToSnapPhoto', 'Open Camera or Snap Photo')}</span>
                          <span className="text-xs sm:text-sm text-slate-500 mt-1 block">
                            {lotTypeMode === 'custom' ? 'Snap photo of mixed consignment or composite scrap batch' : 'AI automatically detects CRTs, LCDs, PCBs, Cables, Batteries'}
                          </span>
                        </div>
                      )}
                    </label>
                  </div>

                  {lotTypeMode === 'single' ? (
                    <>
                      {/* Category Selector */}
                      <div>
                        <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                          3. {t('selectScrapCategory', 'Select Item Category')}
                        </label>
                        <select
                          value={isCustomSingleLot ? 'CUSTOM' : lotCategory}
                          onChange={e => {
                            if (e.target.value === 'CUSTOM') {
                              setIsCustomSingleLot(true);
                            } else {
                              setIsCustomSingleLot(false);
                              setLotCategory(e.target.value);
                            }
                          }}
                          className="w-full px-4 py-3.5 text-sm sm:text-base font-semibold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl focus:border-emerald-600 focus:outline-none shadow-sm text-slate-900 dark:text-slate-100"
                        >
                          {priceBoardData.map(p => (
                            <option key={p.category} value={p.category}>
                              {preserveEnglishItemName(p.category)} — ₹{p.ratePerKg}/{t('perKg', 'kg')}
                            </option>
                          ))}
                          <option value="CUSTOM">
                            ➕ {t('otherCustomProduct', 'Other / Custom Product (Type name)')}
                          </option>
                        </select>

                        {/* Custom Product Inputs for Single Lot */}
                        {isCustomSingleLot && (
                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 mt-3 p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-emerald-500/60 animate-fade-in">
                            <div className="sm:col-span-8">
                              <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                                {t('enterProductName', 'Type Product Name (e.g. Old Microwave, Inverter)')}
                              </label>
                              <input
                                type="text"
                                value={customSingleLotName}
                                placeholder={t('productNamePlaceholder', 'e.g. Inverter, Microwave, Stabilizer, TV...')}
                                onChange={e => setCustomSingleLotName(e.target.value)}
                                className="w-full px-3 py-2 text-sm font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none"
                                required
                              />
                            </div>
                            <div className="sm:col-span-4">
                              <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                                {t('customRatePerKg', 'Expected Rate (₹/kg)')}
                              </label>
                              <div className="flex items-center gap-1">
                                <span className="text-sm font-bold text-slate-500">₹</span>
                                <input
                                  type="number"
                                  min="1"
                                  value={customSingleLotRate}
                                  onChange={e => setCustomSingleLotRate(parseFloat(e.target.value) || 1)}
                                  className="w-full px-3 py-2 text-sm font-mono font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-right focus:outline-none"
                                />
                                <span className="text-xs text-slate-500 font-mono">/kg</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Weight Stepper & Direct Custom Input */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wider">
                            {t('approxWeightLabel', '4. Enter Approx Weight (Kilograms)')}
                          </label>
                          <span className="text-xs sm:text-sm text-slate-500 font-semibold">{t('minWeightNote', 'Custom weight (min 0.01 kg)')}</span>
                        </div>

                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setLotWeight(w => Math.max(0.01, Math.round((w - 0.5) * 100) / 100))}
                            className="w-14 h-14 rounded-2xl bg-slate-100 hover:bg-emerald-100 border border-slate-200 flex items-center justify-center text-slate-800 hover:text-emerald-900 active:scale-95 transition-transform shadow-sm"
                          >
                            <Minus className="w-6 h-6" />
                          </button>

                          <div className="flex-1 bg-white border border-slate-200/90 rounded-2xl p-2.5 sm:p-3 text-center shadow-sm flex items-center justify-center gap-2">
                            <input
                              type="number"
                              step="any"
                              min="0.01"
                              value={lotWeight}
                              onChange={e => {
                                const val = parseFloat(e.target.value);
                                setLotWeight(isNaN(val) ? 0.01 : Math.max(0.01, Math.round(val * 100) / 100));
                              }}
                              className="w-28 sm:w-36 text-center text-3xl sm:text-4xl font-display font-black text-slate-900 bg-transparent focus:outline-none"
                            />
                            <span className="text-base font-bold text-slate-500 uppercase">kg</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => setLotWeight(w => Math.round((w + 0.5) * 100) / 100)}
                            className="w-14 h-14 rounded-2xl bg-slate-100 hover:bg-emerald-100 border border-slate-200 flex items-center justify-center text-slate-800 hover:text-emerald-900 active:scale-95 transition-transform shadow-sm"
                          >
                            <Plus className="w-6 h-6" />
                          </button>
                        </div>
                      </div>

                      {/* Total Units / Item Pieces Stepper */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                            5. {t('totalUnits', 'Total Items / Pieces')}
                          </label>
                          <span className="text-xs text-slate-500 font-semibold">{t('optionalPieceCount', 'Count of individual pieces/units')}</span>
                        </div>

                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setLotItemCount(c => Math.max(1, c - 1))}
                            className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-100 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-800 dark:text-slate-200 hover:text-emerald-900 active:scale-95 transition-transform shadow-sm"
                          >
                            <Minus className="w-6 h-6" />
                          </button>

                          <div className="flex-1 bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 rounded-2xl p-2.5 sm:p-3 text-center shadow-sm flex items-center justify-center gap-2">
                            <input
                              type="number"
                              min="1"
                              value={lotItemCount}
                              onChange={e => {
                                const val = parseInt(e.target.value);
                                setLotItemCount(isNaN(val) ? 1 : Math.max(1, val));
                              }}
                              className="w-28 sm:w-36 text-center text-3xl sm:text-4xl font-display font-black text-slate-900 dark:text-white bg-transparent focus:outline-none"
                            />
                            <span className="text-base font-bold text-slate-500 uppercase">{t('pieces', 'pcs')}</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => setLotItemCount(c => c + 1)}
                            className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-100 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-800 dark:text-slate-200 hover:text-emerald-900 active:scale-95 transition-transform shadow-sm"
                          >
                            <Plus className="w-6 h-6" />
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    /* CUSTOM MIXED LOT BUILDER SECTION */
                    <div className="space-y-4 pt-1">
                      <div className="p-5 bg-slate-50/90 rounded-[28px] border border-slate-200/80 space-y-4 shadow-sm">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                          <div className="flex items-center gap-2">
                            <Layers className="w-5 h-5 text-slate-700" />
                            <span className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                              3. {t('addMaterialLineItems', 'Add Material Line Items')}
                            </span>
                          </div>
                          <span className="text-xs sm:text-sm chip-primary-m3 px-3 py-1 font-bold">
                            {customLotItems.length} {t('materialsInLot', 'Materials in Lot')}
                          </span>
                        </div>

                        {/* Add Item Form Controls */}
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                          <div className="sm:col-span-4">
                            <label className="block text-xs uppercase font-bold text-slate-600 mb-1.5">
                              {t('materialType', 'Material Type')}
                            </label>
                            <select
                              value={isCustomMixedItem ? 'CUSTOM' : newCustomCategory}
                              onChange={e => {
                                if (e.target.value === 'CUSTOM') {
                                  setIsCustomMixedItem(true);
                                } else {
                                  setIsCustomMixedItem(false);
                                  setNewCustomCategory(e.target.value);
                                }
                              }}
                              className="w-full px-3 py-2.5 text-sm font-bold bg-white border border-slate-300 rounded-xl focus:border-emerald-600 focus:outline-none"
                            >
                              {priceBoardData.map(p => (
                                <option key={p.category} value={p.category}>
                                  {preserveEnglishItemName(p.category)} (₹{p.ratePerKg}/kg)
                                </option>
                              ))}
                              <option value="CUSTOM">
                                ➕ {t('otherCustomProduct', 'Other / Custom Product (Type name)')}
                              </option>
                            </select>
                          </div>

                          <div className="sm:col-span-3">
                            <label className="block text-xs uppercase font-bold text-slate-600 mb-1.5">
                              {t('weightKg', 'Weight (kg)')}
                            </label>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => setNewCustomWeight(w => Math.max(0.01, Math.round((w - 0.1) * 10) / 10))}
                                className="w-8 h-10 bg-slate-200 hover:bg-slate-300 border border-slate-300 rounded-lg flex items-center justify-center text-sm font-bold"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                step="any"
                                min="0.01"
                                value={newCustomWeight}
                                onChange={e => {
                                  const val = parseFloat(e.target.value);
                                  setNewCustomWeight(isNaN(val) ? 0.01 : Math.max(0.01, Math.round(val * 100) / 100));
                                }}
                                className="w-full text-center px-1 py-2 text-sm font-bold bg-white border border-slate-300 rounded-lg"
                              />
                              <button
                                type="button"
                                onClick={() => setNewCustomWeight(w => Math.round((w + 0.1) * 10) / 10)}
                                className="w-8 h-10 bg-slate-200 hover:bg-slate-300 border border-slate-300 rounded-lg flex items-center justify-center text-sm font-bold"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          <div className="sm:col-span-2">
                            <label className="block text-xs uppercase font-bold text-slate-600 mb-1.5">
                              {t('qty', 'Qty')} ({t('pieces', 'pcs')})
                            </label>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => setNewCustomQuantity(q => Math.max(1, q - 1))}
                                className="w-7 h-10 bg-slate-200 hover:bg-slate-300 border border-slate-300 rounded-lg flex items-center justify-center text-sm font-bold"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                min="1"
                                value={newCustomQuantity}
                                onChange={e => {
                                  const val = parseInt(e.target.value);
                                  setNewCustomQuantity(isNaN(val) ? 1 : Math.max(1, val));
                                }}
                                className="w-full text-center px-1 py-2 text-sm font-bold bg-white border border-slate-300 rounded-lg"
                              />
                              <button
                                type="button"
                                onClick={() => setNewCustomQuantity(q => q + 1)}
                                className="w-7 h-10 bg-slate-200 hover:bg-slate-300 border border-slate-300 rounded-lg flex items-center justify-center text-sm font-bold"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          <div className="sm:col-span-3 flex items-end">
                            <button
                              type="button"
                              onClick={handleAddCustomLotItem}
                              className="w-full py-2.5 px-3 btn-primary-m3 text-sm font-bold flex items-center justify-center gap-1.5 shadow-sm transition-transform active:scale-95"
                            >
                              <Plus className="w-4 h-4" />
                              <span>{t('addItemToLot', 'Add Item')}</span>
                            </button>
                          </div>
                        </div>

                        {/* Custom Item Controls for Mixed Lot */}
                        {isCustomMixedItem && (
                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-3 bg-white dark:bg-slate-900 rounded-xl border border-emerald-500/60 animate-fade-in">
                            <div className="sm:col-span-8">
                              <label className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                                {t('enterProductName', 'Type Product Name (e.g. Old Microwave, Inverter)')}
                              </label>
                              <input
                                type="text"
                                value={customMixedItemName}
                                placeholder={t('productNamePlaceholder', 'e.g. Inverter, Microwave, Stabilizer, TV...')}
                                onChange={e => setCustomMixedItemName(e.target.value)}
                                className="w-full px-3 py-1.5 text-xs font-mono bg-paper-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none"
                              />
                            </div>
                            <div className="sm:col-span-4">
                              <label className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                                {t('customRatePerKg', 'Expected Rate (₹/kg)')}
                              </label>
                              <div className="flex items-center gap-1">
                                <span className="text-xs font-bold text-slate-500">₹</span>
                                <input
                                  type="number"
                                  min="1"
                                  value={customMixedItemRate}
                                  onChange={e => setCustomMixedItemRate(parseFloat(e.target.value) || 1)}
                                  className="w-full px-2 py-1.5 text-xs font-mono bg-paper-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-right focus:outline-none"
                                />
                                <span className="text-[10px] text-slate-500 font-mono">/kg</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* List of Added Custom Materials */}
                        <div className="space-y-2 pt-2">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                            Included Material Manifest:
                          </span>

                          {customLotItems.length === 0 ? (
                            <div className="text-center py-6 bg-white rounded-2xl border border-dashed border-slate-300 text-sm text-slate-500">
                              No items added yet. Choose a material and click "Add Item".
                            </div>
                          ) : (
                            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                              {customLotItems.map(item => (
                                <div
                                  key={item.id}
                                  className="p-3 bg-white rounded-2xl border border-slate-200 flex items-center justify-between text-sm gap-2 shadow-sm"
                                >
                                  <div className="min-w-0 flex-1">
                                    <div className="font-bold text-slate-900 truncate text-sm sm:text-base">
                                      {preserveEnglishItemName(item.category)}
                                    </div>
                                    <div className="text-xs text-slate-500 font-medium">
                                      Benchmark: ₹{item.ratePerKg}/kg
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap justify-end">
                                    {/* Quantity adjustment */}
                                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-700" title={t('quantity', 'Quantity (pcs)')}>
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateCustomItemQuantity(item.id, -1)}
                                        className="w-5 h-6 text-slate-600 dark:text-slate-300 hover:text-slate-900 font-bold text-xs"
                                      >
                                        -
                                      </button>
                                      <input
                                        type="number"
                                        min="1"
                                        value={item.quantity || 1}
                                        onChange={e => {
                                          const val = parseInt(e.target.value);
                                          handleSetCustomItemQuantity(item.id, isNaN(val) ? 1 : val);
                                        }}
                                        className="w-8 text-center font-bold text-slate-900 dark:text-slate-100 text-xs bg-transparent focus:outline-none"
                                      />
                                      <span className="text-[10px] text-slate-500 font-bold -ml-1">{t('pieces', 'pcs')}</span>
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateCustomItemQuantity(item.id, 1)}
                                        className="w-5 h-6 text-slate-600 dark:text-slate-300 hover:text-slate-900 font-bold text-xs"
                                      >
                                        +
                                      </button>
                                    </div>

                                    {/* Weight adjustment input & buttons */}
                                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-700">
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateCustomItemWeight(item.id, -0.1)}
                                        className="w-5 h-6 text-slate-600 dark:text-slate-300 hover:text-slate-900 font-bold"
                                      >
                                        -
                                      </button>
                                      <input
                                        type="number"
                                        step="any"
                                        min="0.01"
                                        value={item.weightKg}
                                        onChange={e => {
                                          const val = parseFloat(e.target.value);
                                          handleSetCustomItemWeight(item.id, isNaN(val) ? 0.01 : val);
                                        }}
                                        className="w-14 text-center font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm bg-transparent focus:outline-none"
                                      />
                                      <span className="text-[10px] text-slate-500 font-bold -ml-1">kg</span>
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateCustomItemWeight(item.id, 0.1)}
                                        className="w-5 h-6 text-slate-600 dark:text-slate-300 hover:text-slate-900 font-bold"
                                      >
                                        +
                                      </button>
                                    </div>

                                    {/* Subtotal */}
                                    <span className="font-display font-extrabold text-emerald-700 text-sm sm:text-base w-20 text-right">
                                      ₹{item.subtotal.toLocaleString('en-IN')}
                                    </span>

                                    {/* Delete Button */}
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveCustomLotItem(item.id)}
                                      className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                                      title="Remove item"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Mixed Lot Summary Strip */}
                        {customLotItems.length > 0 && (
                          <div className="pt-3 border-t border-slate-200 grid grid-cols-3 gap-2.5 text-center">
                            <div className="bg-white p-2.5 rounded-2xl border border-slate-200/80 shadow-2xs">
                              <span className="text-xs text-slate-500 font-semibold block uppercase">{t('totalItems', 'TOTAL ITEMS')}</span>
                              <span className="font-display font-bold text-slate-900 text-sm sm:text-base">
                                {customTotalUnits} {t('pieces', 'pcs')} ({customLotItems.length} {t('items', 'types')})
                              </span>
                            </div>
                            <div className="bg-white p-2.5 rounded-2xl border border-slate-200/80 shadow-2xs">
                              <span className="text-xs text-slate-500 font-semibold block uppercase">TOTAL NET WT</span>
                              <span className="font-display font-bold text-slate-900 text-sm sm:text-base">{customTotalWeight} kg</span>
                            </div>
                            <div className="bg-white p-2.5 rounded-2xl border border-slate-200/80 shadow-2xs">
                              <span className="text-xs text-slate-500 font-semibold block uppercase">BLENDED RATE</span>
                              <span className="font-display font-bold text-emerald-700 text-sm sm:text-base">₹{customBlendedRate}/kg</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 5. Set Handover / Scrap Yard Location */}
                  <div className="space-y-3 p-5 bg-slate-50/90 rounded-[28px] border border-slate-200/80 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-slate-700 shrink-0" />
                        <label className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider">
                          {t('lotLocationLabel', '5. Set Handover / Scrap Yard Location')}
                        </label>
                      </div>
                      <span className="text-xs font-bold uppercase bg-white px-3 py-1 rounded-full border border-slate-200 text-slate-700 shadow-2xs">
                        {lotLocationMode === 'gps' ? '🛰️ GPS Lock' : lotLocationMode === 'preset' ? '🏭 Scrap Hub' : '✏️ Custom'}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600">
                      {t('lotLocationDesc', 'Specify where the recycler will inspect and pick up this lot.')}
                    </p>

                    {/* 3 Location Mode Switcher Buttons */}
                    <div className="grid grid-cols-3 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleDetectLotGps}
                        disabled={isDetectingLotLocation}
                        className={`py-2.5 px-3 rounded-full text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all ${
                          lotLocationMode === 'gps'
                            ? 'm3-tab-pill-active shadow-sm'
                            : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <Navigation className={`w-4 h-4 ${isDetectingLotLocation ? 'animate-spin' : ''}`} />
                        <span>{isDetectingLotLocation ? t('detectingLocation', 'Detecting...') : t('detectLiveGps', 'Live GPS')}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setLotLocationMode('preset')}
                        className={`py-2.5 px-3 rounded-full text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all ${
                          lotLocationMode === 'preset'
                            ? 'm3-tab-pill-active shadow-sm'
                            : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <Building2 className="w-4 h-4" />
                        <span>{t('quickPresets', 'Scrap Hubs')}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setLotLocationMode('custom')}
                        className={`py-2.5 px-3 rounded-full text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all ${
                          lotLocationMode === 'custom'
                            ? 'm3-tab-pill-active shadow-sm'
                            : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <Edit3 className="w-4 h-4" />
                        <span>{t('customAddress', 'Custom')}</span>
                      </button>
                    </div>

                    {/* Mode 1: Preset Dropdown */}
                    {lotLocationMode === 'preset' && (
                      <div className="space-y-1.5 pt-1">
                        <select
                          value={selectedHubPreset}
                          onChange={e => handleSelectHubPreset(e.target.value)}
                          className="w-full px-4 py-3 text-sm font-bold bg-white border border-slate-300 rounded-2xl focus:border-emerald-600 focus:outline-none shadow-sm"
                        >
                          {SCRAP_HUB_PRESETS.map(hub => (
                            <option key={hub.id} value={hub.id}>
                              {language === 'hi' ? hub.nameHi : language === 'mr' ? hub.nameMr : hub.nameEn}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Mode 2: Custom Address text input */}
                    {lotLocationMode === 'custom' && (
                      <div className="space-y-1.5 pt-1">
                        <input
                          type="text"
                          value={lotLocationAddress}
                          onChange={e => {
                            setLotLocationAddress(e.target.value);
                            setLotLocationZone(e.target.value.split(',')[0] || 'Custom Yard');
                          }}
                          placeholder={t('customAddressPlaceholder', 'Enter yard address, shop number, or landmark...')}
                          className="w-full px-4 py-3 text-sm bg-white border border-slate-300 rounded-2xl focus:border-emerald-600 focus:outline-none shadow-sm"
                        />
                      </div>
                    )}

                    {/* Active Location Display Badge & Coordinates */}
                    <div className="p-3.5 bg-white rounded-2xl border border-slate-200 flex items-start justify-between gap-2 text-sm shadow-2xs">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-1.5 text-xs uppercase font-bold text-slate-600">
                          <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>{lotLocationZone || 'Active Handover Yard'}</span>
                        </div>
                        <p className="text-slate-800 text-sm truncate font-medium" title={lotLocationAddress}>
                          {lotLocationAddress}
                        </p>
                        <span className="text-xs text-slate-500 block">
                          Coordinates: {lotCoords[0].toFixed(4)}° N, {lotCoords[1].toFixed(4)}° E
                        </span>
                      </div>
                      <a
                        href={getDirectionsUrl(lotCoords[0], lotCoords[1])}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 underline pt-1"
                      >
                        <span>Map</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>

                  {/* Real-time AI Valuation Card */}
                  <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/15 border-2 border-emerald-500/40 rounded-[28px] p-5 sm:p-6 flex items-center justify-between shadow-sm">
                    <div>
                      <span className="text-xs sm:text-sm uppercase font-bold text-emerald-900 tracking-wider block">
                        {lotTypeMode === 'custom' ? 'Composite Lot Total Valuation' : t('instantAiValue', 'Instant AI Value Estimate')}
                      </span>
                      <span className="text-3xl sm:text-4xl font-display font-black text-emerald-800">
                        {formatCurrency(aiValuation)}
                      </span>
                      <span className="text-xs sm:text-sm text-slate-600 font-medium block mt-0.5">
                        {lotTypeMode === 'custom' ? (
                          <>
                            Net: {customTotalWeight} kg • Avg Rate: ₹{customBlendedRate}/kg • Min Bid: ₹{Math.round(aiValuation * 0.5).toLocaleString('en-IN')} (50%)
                          </>
                        ) : (
                          <>
                            Ask Price: ₹{lotWeight > 0 ? Math.round(aiValuation / lotWeight) : 0}/kg • Min Bid: ₹{Math.round(aiValuation * 0.5).toLocaleString('en-IN')} (50%)
                          </>
                        )}
                      </span>
                    </div>
                    <VoiceAssistButton
                      text={lotTypeMode === 'custom'
                        ? `Custom lot with ${customLotItems.length} materials. Total weight ${customTotalWeight} kilograms, estimated value ${formatCurrency(aiValuation)}.`
                        : `Indicative value: ${formatCurrency(aiValuation)} for ${lotWeight} kilograms.`
                      }
                      hindiText={lotTypeMode === 'custom'
                        ? `कस्टम लॉट में ${customLotItems.length} सामग्रियां हैं। कुल वजन ${customTotalWeight} किलो, अनुमानित मूल्य ${formatCurrency(aiValuation)}.`
                        : `अनुमानित मूल्य: ${lotWeight} किलो के लिए ${formatCurrency(aiValuation)}.`
                      }
                      marathiText={lotTypeMode === 'custom'
                        ? `कस्टम लॉटमध्ये ${customLotItems.length} प्रकार आहेत. एकूण वजन ${customTotalWeight} किलो, अंदाजे किंमत ${formatCurrency(aiValuation)}.`
                        : `अंदाजे किंमत: ${lotWeight} किलोसाठी ${formatCurrency(aiValuation)}.`
                      }
                      size="md"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full btn-primary-m3 py-4 rounded-full text-base sm:text-lg font-display font-bold flex items-center justify-center space-x-2 shadow-m3-2 hover:shadow-m3-3 transition-transform active:scale-98"
                  >
                    <Sparkles className="w-5 h-5" />
                    <span>
                      {lotTypeMode === 'custom'
                        ? (language === 'hi' ? 'कस्टम मिक्स्ड लॉट बनाएं और रीसायकलर को भेजें' : language === 'mr' ? 'कस्टम मिक्स्ड लॉट तयार करा आणि पाठवा' : 'Generate Custom Mixed Lot & Broadcast')
                        : (language === 'hi' ? 'लॉट बनाएं और रीसायकलर को भेजें' : language === 'mr' ? 'लॉट तयार करा आणि पाठवा' : 'Generate Digital Lot & Broadcast')
                      }
                    </span>
                  </button>
                </form>
              </div>

              {/* Right Column: Active Digital Lot Voucher Preview */}
              {/* Right Column: Active Digital Lot Voucher Preview */}
              <div className="lg:col-span-5 space-y-4">
                <div className="android17-card p-6 sm:p-7 space-y-5 border border-slate-200/80 shadow-m3-1">
                  <div className="flex justify-between items-start border-b border-slate-200 pb-3.5">
                    <div>
                      <span className="stamp-seal stamp-verified text-xs">
                        {lotTypeMode === 'custom' ? 'CPCB CUSTOM MIXED VOUCHER' : 'CPCB LOT VOUCHER'}
                      </span>
                      <div className="font-display font-black text-2xl text-slate-900 mt-1.5 tracking-tight">
                        {handoverLotCode}
                      </div>
                      <span className="text-xs sm:text-sm text-slate-600 font-semibold block mt-0.5">Collector: Suresh Kumar</span>
                    </div>
                    <div className="w-18 h-18 bg-white border border-slate-200 p-2 rounded-2xl flex items-center justify-center shadow-xs">
                      <QrCode className="w-14 h-14 text-slate-900" />
                    </div>
                  </div>

                  <div className="space-y-3 text-sm text-slate-800 bg-slate-50/90 p-4 rounded-2xl border border-slate-200/70">
                    <div className="flex justify-between items-center text-sm sm:text-base">
                      <span className="text-slate-500 font-medium">Material Category:</span>
                      <span className="font-bold text-slate-900">
                        {lotTypeMode === 'custom' ? `Custom Mixed (${customLotItems.length} Materials)` : `${lotCategory.slice(0, 22)}...`}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm sm:text-base">
                      <span className="text-slate-500 font-medium">Approx Weight:</span>
                      <span className="font-bold text-slate-900">
                        {lotTypeMode === 'custom' ? `${customTotalWeight} kg` : `${lotWeight} kg`}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm sm:text-base">
                      <span className="text-slate-500 font-medium">
                        {lotTypeMode === 'custom' ? 'Blended Benchmark Rate:' : 'Benchmark Rate:'}
                      </span>
                      <span className="font-bold text-emerald-700">
                        ₹{lotTypeMode === 'custom' ? customBlendedRate : (lotWeight > 0 ? Math.round(aiValuation / lotWeight) : 0)}/kg
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                      <span className="text-slate-500 font-medium text-sm sm:text-base">Estimated Value:</span>
                      <span className="font-display font-black text-xl sm:text-2xl text-emerald-700">{formatCurrency(aiValuation)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs sm:text-sm">
                      <span className="text-slate-500 font-medium">Min Acceptable Bid (50%):</span>
                      <span className="font-bold text-amber-700">{formatCurrency(Math.round(aiValuation * 0.5))}</span>
                    </div>

                    {/* Custom Lot Manifest preview in Voucher */}
                    {lotTypeMode === 'custom' && customLotItems.length > 0 && (
                      <div className="pt-2.5 border-t border-slate-200 space-y-1.5">
                        <span className="text-xs uppercase font-bold text-slate-600 block tracking-wider">
                          Manifest Breakdown:
                        </span>
                        <div className="space-y-1">
                          {customLotItems.map(item => (
                            <div key={item.id} className="flex justify-between text-xs sm:text-sm text-slate-700">
                              <span className="truncate pr-1">• {item.category.split(' ')[0]}</span>
                              <span className="font-bold text-slate-900 shrink-0">
                                {item.weightKg} kg (₹{item.subtotal.toLocaleString('en-IN')})
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between items-start pt-2 border-t border-slate-200 text-xs sm:text-sm">
                      <span className="text-slate-500 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{t('handoverLocation', 'Handover Location')}:</span>
                      </span>
                      <span className="font-bold text-slate-800 text-right max-w-[180px] truncate" title={lotLocationAddress}>
                        {lotLocationZone || lotLocationAddress}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>GPS Coordinates:</span>
                      <span>{lotCoords[0].toFixed(4)}°, {lotCoords[1].toFixed(4)}°</span>
                    </div>
                  </div>

                  <div className="text-xs sm:text-sm text-slate-600 p-3.5 bg-slate-100/90 rounded-2xl border border-slate-200 space-y-1">
                    <div className="font-bold text-slate-800 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Traceability Record Sealed</span>
                    </div>
                    <p>
                      {lotTypeMode === 'custom'
                        ? 'This composite lot contains multi-grade scrap. Recyclers can bid on the aggregated consignment.'
                        : 'This lot is broadcasted to verified recyclers. Present the QR code upon vehicle delivery to claim instant cash or wallet credit.'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => setLotsSubView('mylots')}
                      className="w-full btn-primary-m3 py-3 rounded-full text-sm font-bold flex items-center justify-center space-x-1.5 shadow-sm active:scale-95 transition-transform"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View My Lots</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('handover')}
                      className="w-full bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 py-3 rounded-full text-sm font-bold flex items-center justify-center space-x-1.5 shadow-sm active:scale-95 transition-transform"
                    >
                      <span>Open QR</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Quick Segregation Tip */}
                <div className="p-4 bg-amber-50/80 rounded-2xl border border-amber-200/70 space-y-1.5 text-xs sm:text-sm">
                  <span className="font-bold text-amber-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-700" /> {language === 'hi' ? 'कमाई बढ़ाने का सुझाव:' : language === 'mr' ? 'कमाई वाढवण्यासाठी टीप:' : 'High-Value Separation Tip:'}
                  </span>
                  <p className="text-slate-700">
                    {language === 'hi' ? 'सर्किट बोर्ड से एल्यूमीनियम हीट सिंक को हाथ से अलग करके बेचें। इससे बोर्ड को ग्रेड-ए (₹640/kg) दाम मिलता है।' : language === 'mr' ? 'सर्किट बोर्डमधून अ‍ॅल्युमिनियम हीट सिंक हाताने वेगळे करून विका. यामुळे बोर्डाला ग्रेड-ए (₹640/कि.ग्रा.) भाव मिळतो.' : 'Detach aluminium heat sinks from circuit boards by hand before selling. Intact Grade-A boards command premium ₹640/kg.'}
                  </p>
                </div>
              </div>

            </div>
            );
          })() : (
            /* MY CREATED LOTS VIEW WITH BIDDING & ACCEPTANCE */
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                  <h3 className="text-2xl sm:text-3xl font-display font-black text-slate-900">
                    {t('myCreatedLotsTitle', 'My Registered Digital Lots & Live Bids')}
                  </h3>
                  <p className="text-sm sm:text-base text-slate-600 mt-0.5 font-normal">
                    {t('myCreatedLotsDesc', 'All lots created by you, open recycler tenders, and price negotiation bids.')}
                  </p>
                </div>

                {/* Status Filter Buttons */}
                <div className="flex flex-wrap gap-2">
                  {(['ALL', 'AVAILABLE', 'BIDDING', 'HANDOVER_PENDING', 'CONFIRMED'] as const).map(f => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setLotFilter(f)}
                      className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all active:scale-95 ${
                        lotFilter === f
                          ? 'm3-tab-pill-active shadow-sm'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                      }`}
                    >
                      {f === 'ALL' ? t('allLots', 'All Lots') : t(f, f.replace('_', ' '))}
                      {f === 'ALL' && ` (${myLots.length})`}
                      {f === 'BIDDING' && ` (${myLots.filter(l => l.status === 'BIDDING' || (l.bids && l.bids.length > 0)).length})`}
                    </button>
                  ))}
                </div>
              </div>

              {myLots
                .filter(l => {
                  if (lotFilter === 'ALL') return true;
                  if (lotFilter === 'AVAILABLE') return l.status === 'AVAILABLE';
                  if (lotFilter === 'BIDDING') return l.status === 'BIDDING' || (l.bids && l.bids.length > 0);
                  if (lotFilter === 'HANDOVER_PENDING') return l.status === 'HANDOVER_PENDING';
                  if (lotFilter === 'CONFIRMED') return l.status === 'CONFIRMED';
                  return true;
                })
                .length === 0 ? (
                <div className="text-center py-16 bg-white rounded-[28px] border-2 border-dashed border-slate-300 space-y-4 shadow-sm">
                  <FileText className="w-12 h-12 text-slate-400 mx-auto" />
                  <p className="text-sm sm:text-base text-slate-700 font-bold">No digital lots found in this category.</p>
                  <button
                    type="button"
                    onClick={() => setLotsSubView('create')}
                    className="btn-primary-m3 px-6 py-3 rounded-full text-sm font-bold inline-flex items-center gap-2 shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create a New Lot Now</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {myLots
                    .filter(l => {
                      if (lotFilter === 'ALL') return true;
                      if (lotFilter === 'AVAILABLE') return l.status === 'AVAILABLE';
                      if (lotFilter === 'BIDDING') return l.status === 'BIDDING' || (l.bids && l.bids.length > 0);
                      if (lotFilter === 'HANDOVER_PENDING') return l.status === 'HANDOVER_PENDING';
                      if (lotFilter === 'CONFIRMED') return l.status === 'CONFIRMED';
                      return true;
                    })
                    .map(lot => {
                      const ask = lot.askingPrice || lot.estimatedValue;
                      const minBid = Math.round(ask * 0.5);
                      const bidsCount = lot.bids?.length || 0;
                      const hasBids = bidsCount > 0;

                      return (
                        <div
                          key={lot.id}
                          className="android17-card p-6 sm:p-7 flex flex-col justify-between space-y-5 border border-slate-200/80 shadow-m3-1 hover:shadow-m3-3 transition-all"
                        >
                          <div className="space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                              <div className="flex items-center gap-2">
                                <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs sm:text-sm font-bold tracking-wide">
                                  #{lot.lotCode}
                                </span>
                                {lot.isOfflineQueued && (
                                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                                    Offline Queued
                                  </span>
                                )}
                              </div>
                              <span
                                className={`text-xs font-bold px-3 py-1 rounded-full shadow-xs ${
                                  lot.status === 'CONFIRMED'
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                    : lot.status === 'HANDOVER_PENDING'
                                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                    : lot.status === 'BIDDING' || hasBids
                                    ? 'bg-amber-200 text-amber-900 border border-amber-400 animate-pulse'
                                    : 'bg-slate-100 text-slate-700 border border-slate-300'
                                }`}
                              >
                                {lot.status === 'BIDDING' || hasBids ? `${t('BIDDING')} (${bidsCount} ${t('bidsReceived', 'Bids')})` : t(lot.status)}
                              </span>
                            </div>

                            <div>
                              <h4 className="font-display font-black text-slate-900 text-lg sm:text-xl leading-snug">
                                {preserveEnglishItemName(lot.category)}
                              </h4>
                              <span className="text-xs sm:text-sm text-slate-500 font-medium block mt-0.5">Logged: {lot.createdAt}</span>

                              {/* Layer 2 Verification Seals */}
                              <div className="flex flex-wrap items-center gap-2 pt-2">
                                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1 shadow-2xs">
                                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>{t('layer 2: ai verified', 'Layer 2: AI Verified')}</span>
                                </span>
                                <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                                  GPS: {lot.gpsLat?.toFixed(2)}°, {lot.gpsLng?.toFixed(2)}°
                                </span>
                                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                                  KYC: KC-COL-8921
                                </span>
                              </div>

                              {/* Handover Location Banner */}
                              <div className="mt-3 text-xs sm:text-sm text-slate-700 bg-slate-50 p-3 rounded-2xl border border-slate-200 flex items-center justify-between gap-2 shadow-2xs">
                                <div className="flex items-center gap-2 min-w-0 truncate">
                                  <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                                  <span className="truncate font-medium" title={lot.locationAddress || lot.locationZone || `${lot.gpsLat?.toFixed(4)}°, ${lot.gpsLng?.toFixed(4)}°`}>
                                    {lot.locationZone || lot.locationAddress || `GPS: ${lot.gpsLat?.toFixed(2)}°, ${lot.gpsLng?.toFixed(2)}°`}
                                  </span>
                                </div>
                                <a
                                  href={getDirectionsUrl(lot.gpsLat, lot.gpsLng)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-emerald-700 hover:text-emerald-900 font-bold shrink-0 flex items-center gap-1 underline text-xs"
                                >
                                  <span>Map</span>
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              </div>

                              {/* Custom Mixed Lot Manifest Breakdown */}
                              {lot.isCustomLot && lot.items && lot.items.length > 0 && (
                                <div className="mt-3 space-y-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs sm:text-sm shadow-2xs">
                                  <div className="flex items-center justify-between text-xs uppercase font-bold text-slate-700 pb-1.5 border-b border-slate-200 tracking-wider">
                                    <span className="flex items-center gap-1.5">
                                      <Layers className="w-4 h-4 text-slate-600" />
                                      <span>{t('customMixedLot', 'Mixed Manifest')} ({lot.items.length} {t('items', 'types')})</span>
                                    </span>
                                    <span className="text-emerald-700">{t('blendedRate', 'Blended')} ₹{lot.recyclerOfferedRate}/kg</span>
                                  </div>
                                  <div className="space-y-1 pt-1">
                                    {lot.items.map((item, idx) => (
                                      <div key={idx} className="flex justify-between items-center text-xs sm:text-sm text-slate-800">
                                        <span className="truncate pr-2 font-medium">• {preserveEnglishItemName(item.category)}</span>
                                        <span className="font-bold text-slate-900 shrink-0">
                                          {item.quantity ? `${item.quantity} ${t('pieces', 'pcs')} • ` : ''}{item.weightKg} kg (₹{item.ratePerKg}/kg)
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Specs Grid */}
                            <div className="grid grid-cols-3 gap-2 bg-slate-50/90 p-3.5 rounded-2xl border border-slate-200/80 text-sm shadow-2xs">
                              <div>
                                <span className="text-slate-500 text-[11px] font-semibold block uppercase tracking-wider">{t('totalItems', 'Total Items')}</span>
                                <span className="text-base sm:text-lg font-display font-black text-slate-900 block truncate">
                                  {lot.totalItems || lot.items?.reduce((s, it) => s + (it.quantity || 1), 0) || 1} {t('pieces', 'pcs')}
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-500 text-[11px] font-semibold block uppercase tracking-wider">{t('weight', 'Weight')}</span>
                                <span className="text-base sm:text-lg font-display font-black text-slate-900 block">{lot.approxWeightKg} kg</span>
                              </div>
                              <div>
                                <span className="text-slate-500 text-[11px] font-semibold block uppercase tracking-wider">{t('askingPrice', 'Asking Price')}</span>
                                <span className="text-base sm:text-lg font-display font-black text-emerald-700 block">{formatCurrency(ask)}</span>
                              </div>
                              <div className="col-span-3 pt-2 border-t border-slate-200 flex items-center justify-between text-xs sm:text-sm">
                                <span className="text-slate-500 font-medium">{t('minAskRule', 'Min Valid Bid (50%):')}</span>
                                <span className="font-bold text-amber-700">{formatCurrency(minBid)}</span>
                              </div>
                              {lot.highestBid && (
                                <div className="col-span-3 flex items-center justify-between text-xs sm:text-sm bg-emerald-100/70 p-2.5 rounded-xl border border-emerald-300/60">
                                  <span className="text-emerald-900 font-bold">{t('highestOffer:', 'Highest Offer:')}</span>
                                  <span className="text-base sm:text-lg font-display font-black text-emerald-800">{formatCurrency(lot.highestBid)}</span>
                                </div>
                              )}
                            </div>

                            {/* Recycler Bids Section */}
                            <div className="space-y-2.5">
                              <span className="text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wider block">
                                {t('bidsReceived', 'Recycler Bids')} ({bidsCount})
                              </span>

                              {hasBids ? (
                                <div className="space-y-2.5">
                                  {lot.bids!.map(bid => (
                                    <div
                                      key={bid.id}
                                      className={`p-3.5 rounded-2xl border text-sm flex flex-col gap-2 shadow-2xs ${
                                        bid.status === 'ACCEPTED'
                                          ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                                          : bid.status === 'REJECTED'
                                          ? 'bg-slate-100 border-slate-200 text-slate-400 opacity-60'
                                          : 'bg-white border-slate-200 text-slate-800'
                                      }`}
                                    >
                                      <div className="flex justify-between items-start">
                                        <span className="font-bold text-sm sm:text-base text-slate-900">{bid.recyclerName}</span>
                                        <span className="font-display font-black text-emerald-700 text-base sm:text-lg">{formatCurrency(bid.bidAmount)}</span>
                                      </div>
                                      <div className="flex justify-between items-center text-xs text-slate-500 font-medium">
                                        <span>Rate: ₹{bid.bidPerKg}/kg ({Math.round((bid.bidAmount / ask) * 100)}% of Ask)</span>
                                        <span>{bid.createdAt}</span>
                                      </div>

                                      {bid.status === 'PENDING' && (
                                        <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-slate-100">
                                          <button
                                            type="button"
                                            onClick={() => handleAcceptBid(lot.id, bid.id)}
                                            className="btn-primary-m3 py-2 px-3 text-xs sm:text-sm font-bold rounded-full flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-transform"
                                          >
                                            <Check className="w-3.5 h-3.5" />
                                            <span>{t('acceptBid', 'Accept Bid')}</span>
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleRejectBid(lot.id, bid.id)}
                                            className="bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 py-2 px-3 text-xs sm:text-sm font-bold rounded-full transition-colors active:scale-95"
                                          >
                                            {t('decline', 'Decline')}
                                          </button>
                                        </div>
                                      )}

                                      {bid.status === 'ACCEPTED' && (
                                        <div className="text-emerald-700 font-bold text-xs sm:text-sm flex items-center gap-1.5">
                                          <CheckCircle className="w-4 h-4" /> {language === 'hi' ? 'स्वीकृत विजेता बोली' : language === 'mr' ? 'स्वीकारलेली अंतिम बोली' : 'Winning Accepted Bid'}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs sm:text-sm text-slate-600 space-y-2">
                                  <p>{t('awaitingBids', 'Awaiting bids from nearby authorized aggregators.')}</p>
                                  <button
                                    type="button"
                                    onClick={() => handleSimulateBid(lot)}
                                    className="text-xs sm:text-sm font-bold text-emerald-700 hover:text-emerald-900 underline flex items-center gap-1"
                                  >
                                    <Sparkles className="w-4 h-4" /> {language === 'hi' ? 'रीसायकलर बोली सिमुलेट करें' : language === 'mr' ? 'रीसायकलर बोली सिम्युलेट करा' : 'Simulate Recycler Bid'} ({formatCurrency(Math.round(ask * 0.88))})
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Card Bottom Actions */}
                          <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setHandoverLotCode(lot.lotCode);
                                setActiveTab('handover');
                              }}
                              className="flex-1 w-full btn-primary-m3 py-2.5 rounded-full text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-transform"
                            >
                              <QrCode className="w-4 h-4" />
                              <span>{t('openQr', 'Open QR & Handover')}</span>
                            </button>
                            {lot.status === 'CONFIRMED' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setRatingModalData({
                                    partnerId: lot.recyclerId || 'rec_1',
                                    partnerName: lot.recyclerName || 'EcoRecycle Aggregators Ltd',
                                    role: 'RECYCLER',
                                    lotCode: lot.lotCode,
                                    saleTokenId: lot.saleTokenId
                                  });
                                }}
                                className="w-full sm:w-auto bg-amber-400 hover:bg-amber-500 text-slate-950 py-2.5 px-3.5 rounded-full text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 shadow-2xs active:scale-95 transition-transform"
                              >
                                <Award className="w-3.5 h-3.5 text-slate-900" />
                                <span>Rate Recycler</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setActiveChatContext({
                                  type: 'LOT',
                                  id: lot.id,
                                  title: `${lot.category} (${lot.approxWeightKg}kg)`,
                                  partnerName: lot.recyclerName || lot.bids?.[0]?.recyclerName || 'EcoRecycle Aggregators Ltd',
                                  partnerRole: 'RECYCLER'
                                });
                              }}
                              className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 py-2.5 px-3 rounded-full text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-colors active:scale-95"
                            >
                              <MessageSquare className="w-3.5 h-3.5 text-slate-700" />
                              <span>Chat</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: LIVE BIDDING ROOM & AUCTION FLOOR */}
      {activeTab === 'bids' && (
        <LiveBiddingRoom
          lots={myLots}
          onAcceptBid={handleAcceptBid}
          onOpenChat={(lot) => {
            setActiveChatContext({
              type: 'LOT',
              id: lot.id,
              title: `${lot.category} (${lot.approxWeightKg}kg)`,
              partnerName: lot.recyclerName || lot.bids?.[0]?.recyclerName || 'EcoRecycle Aggregators Ltd',
              partnerRole: 'RECYCLER'
            });
          }}
          onRefresh={loadLots}
        />
      )}

      {/* TAB 3: SPOKEN PRICE BOARD WITH TRENDS */}
      {activeTab === 'priceboard' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-steel-300 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="stamp-seal stamp-verified text-xs">{t('tabPriceBoard', 'Price Board')}</span>
                <VoiceAssistButton
                  text="Live e-waste price board. Buying rates by category and weekly trend across India."
                  hindiText="लाइव ई-कचरा दाम पत्रक। अखिल भारतीय आज के खरीदारी दाम और साप्ताहिक रुझान।"
                  marathiText="थेट ई-कचरा भाव फलक. देशभरातील आजचे खरेदी दर आणि साप्ताहिक कल."
                  size="sm"
                />
              </div>
              <h2 className="text-xl font-display font-black text-steel-900 mt-1">
                {t('mandiPriceBoardTitle', 'Live Material Benchmark Price Board')}
              </h2>
              <p className="text-xs text-steel-600 font-medium">
                {t('liveBenchmarkSub', 'Official CPCB market benchmark rates. Tap the speaker icon beside any item to hear the price aloud.')}
              </p>
            </div>

            <span className="text-xs font-mono text-steel-600 bg-paper-200 px-3 py-1.5 rounded border border-steel-300 self-start sm:self-auto">
              {t('lastUpdatedToday', 'Last updated: Today 09:00 AM')}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {priceBoardData.map((item, idx) => (
              <div
                key={idx}
                className="receipt-stub rounded-lg p-4 border-2 border-steel-300 shadow-sm flex flex-col justify-between space-y-3 hover:border-copper-500 transition-colors"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <span className="text-[10px] font-mono text-steel-500 uppercase tracking-wider">
                      ITEM #{idx + 1}
                    </span>
                    <VoiceAssistButton
                      text={`${preserveEnglishItemName(item.category)}. Current rate is rupees ${item.ratePerKg} per kilogram. ${item.trend === 'UP' ? 'Price increased by rupees ' + item.delta : 'Price stable'}`}
                      hindiText={`${preserveEnglishItemName(item.category)}। आज का ताजा मंडी भाव ${item.ratePerKg} रुपये प्रति किलो है। ${item.delta > 0 ? 'दाम ' + item.delta + ' रुपये बढ़ा है।' : 'दाम स्थिर हैं।'}`}
                      marathiText={`${preserveEnglishItemName(item.category)}. आजचा थेट बाजार भाव ${item.ratePerKg} रुपये प्रति किलो आहे. ${item.delta > 0 ? 'भाव ' + item.delta + ' रुपये वाढला आहे.' : 'भाव स्थिर आहे.'}`}
                      size="sm"
                    />
                  </div>

                  <h3 className="font-display font-black text-steel-900 text-sm mt-1 leading-snug">
                    {preserveEnglishItemName(item.category)}
                  </h3>
                  <p className="text-[11px] text-steel-500 mt-1">
                    {language === 'hi' ? item.categoryHi : language === 'mr' ? item.categoryMr : item.desc}
                  </p>
                </div>

                <div className="pt-2 border-t border-steel-200">
                  <div className="flex items-baseline justify-between">
                    <div className="text-2xl font-mono-num font-black text-copper-600">
                      ₹{item.ratePerKg}
                      <span className="text-xs font-mono text-steel-500 ml-1">/kg</span>
                    </div>

                    <div className="flex items-center space-x-1 text-xs font-mono font-bold">
                      {item.trend === 'UP' ? (
                        <span className="text-forest-600 flex items-center">
                          <TrendingUp className="w-3.5 h-3.5 mr-0.5" /> +₹{item.delta}
                        </span>
                      ) : item.trend === 'DOWN' ? (
                        <span className="text-signal-500 flex items-center">
                          <TrendingDown className="w-3.5 h-3.5 mr-0.5" /> ₹{item.delta}
                        </span>
                      ) : (
                        <span className="text-steel-500">— {language === 'hi' ? 'स्थिर' : language === 'mr' ? 'स्थिर' : 'Steady'}</span>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: AUTHORIZED RECYCLERS DIRECTORY & MARKET INTELLIGENCE */}
      {activeTab === 'recyclers' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-steel-300 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="stamp-seal stamp-verified text-xs">{t('tabFindRecyclers', 'Recycler Hubs')}</span>
                <VoiceAssistButton
                  text="Authorized recyclers directory. Find certified smelting centers matching your location."
                  hindiText="अधिकृत रीसायकलर सूची। अपने स्थान से जुड़े अधिकृत केंद्र खोजें।"
                  marathiText="अधिकृत रीसायकलर यादी. आपल्या जवळचे अधिकृत केंद्र शोधा."
                  size="sm"
                />
              </div>
              <h2 className="text-xl font-display font-black text-steel-900 mt-1">
                {t('nearbyRecyclersTitle', 'Authorized Recyclers & Smelters')}
              </h2>
              <p className="text-xs text-steel-600 font-medium">
                Verified CPCB registered facilities matching your operating area across India.
              </p>
            </div>

            <span className="text-xs font-mono text-steel-600 bg-paper-200 px-3 py-1 rounded border border-steel-300">
              3 Nearby Matching Hubs
            </span>
          </div>

          {/* Nearby Authorized Smelters Map Preview */}
          <div className="receipt-stub rounded-xl p-4 border-2 border-steel-300 shadow-sm space-y-2">
            <div className="font-display font-bold text-steel-800 text-sm flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Factory className="w-4 h-4 text-copper-600" />
                <span>{language === 'hi' ? 'अधिकृत रीसायकलर संयंत्र मानचित्र' : language === 'mr' ? 'अधिकृत रीसायकलर नकाशा' : 'Authorized Recyclers & Smelters Map'}</span>
              </span>
              <span className="text-xs font-mono text-forest-700 bg-paper-200 px-2.5 py-0.5 rounded border border-steel-300 font-bold">
                3 CPCB Smelters
              </span>
            </div>
            <div className="h-60 sm:h-72 rounded-lg overflow-hidden border border-steel-300">
              <LeafletMap
                center={collectorCoords}
                zoom={12}
                userPosition={collectorCoords}
                markers={nearbyRecyclers.map(r => {
                  const dist = calculateDistanceKm(collectorCoords[0], collectorCoords[1], r.lat, r.lng);
                  return {
                    id: r.id,
                    lat: r.lat,
                    lng: r.lng,
                    title: r.name,
                    subtitle: `${r.cpcbReg} • ${r.location}`,
                    iconEmoji: '🏭',
                    badge: `${dist} km • ★ ${r.rating}`,
                    color: '#3B6B4E'
                  };
                })}
                height="100%"
              />
            </div>
          </div>

          <div className="space-y-4">
            {nearbyRecyclers.map((rec, idx) => {
              const liveDistance = calculateDistanceKm(collectorCoords[0], collectorCoords[1], rec.lat, rec.lng);
              const directionsUrl = getDirectionsUrl(rec.lat, rec.lng, collectorCoords[0], collectorCoords[1]);

              return (
                <div
                  key={rec.id}
                  className="receipt-stub rounded-xl p-5 border-2 border-steel-300 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-copper-500 transition-colors"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="stamp-seal stamp-verified text-[10px]">
                        CPCB REGISTERED
                      </span>
                      <span className="font-mono text-xs text-copper-700 font-bold">
                        {rec.cpcbReg}
                      </span>
                      <span className="text-xs text-forest-700 font-bold">★ {rec.rating}</span>
                      <span className="text-xs font-mono font-bold text-copper-700 bg-copper-50 px-2 py-0.5 rounded border border-copper-200">
                        📍 {liveDistance} km away
                      </span>
                    </div>

                    <h3 className="font-display font-black text-lg text-steel-900">
                      {rec.name}
                    </h3>

                    <p className="text-xs text-steel-600 flex items-center gap-1 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-copper-600" />
                      <span>{rec.location}</span>
                    </p>

                    <div className="flex flex-wrap gap-1 mt-2">
                      {rec.acceptedMaterials.map(mat => (
                        <span key={mat} className="text-[10px] font-mono bg-paper-200 text-steel-700 px-2 py-0.5 rounded border border-steel-300">
                          {mat}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col sm:items-end gap-2 border-t sm:border-t-0 pt-3 sm:pt-0 border-steel-200">
                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-copper-600 block">{rec.rateMultiplier}</span>
                      <span className="text-[11px] text-steel-500">
                        {rec.pickupAvailable ? '🚚 Doorstep Mini-Truck Pickup Available' : '🏢 Self Drop-Off at Gate'}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <a
                        href={directionsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 bg-paper-200 hover:bg-paper-300 text-steel-800 text-xs font-bold rounded border border-steel-400 flex items-center gap-1 transition-colors"
                      >
                        <Navigation className="w-3.5 h-3.5 text-copper-600" />
                        <span>Navigate ({liveDistance} km)</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => {
                          alert(`Lot dispatched to ${rec.name}! Handover reference code generated.`);
                          setActiveTab('handover');
                        }}
                        className="btn-dhatu-primary px-4 py-2 rounded text-xs font-bold flex items-center space-x-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{t('sellLotHere', 'Sell Lot to this Facility')}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: HANDOVER QR & VERIFIABLE RECORD GENERATOR */}
      {activeTab === 'handover' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="receipt-stub rounded-xl p-6 border-2 border-steel-400 space-y-6 shadow-sm">
            <div>
              <div className="flex items-center justify-between">
                <span className="stamp-seal stamp-verified text-xs">{t('handoverVoucherBadge', 'Digital Handover')}</span>
                <VoiceAssistButton
                  text="Digital verifiable handover record. Show this QR code to the authorized recycler to confirm weight and receive payment."
                  hindiText="डिजिटल हैंडओवर रसीद। वजन सत्यापित करने और भुगतान पाने के लिए अधिकृत रीसायकलर को यह क्यूआर कोड दिखाएं।"
                  marathiText="डिजिटल पावती. वजन तपासण्यासाठी आणि पैसे मिळवण्यासाठी हा क्यूआर कोड दाखवा."
                  size="sm"
                />
              </div>
              <h2 className="text-xl font-display font-black text-steel-900 mt-2">
                {t('handoverVoucherTitle', 'Digital Handover QR Voucher')}
              </h2>
              <p className="text-xs text-steel-600">
                Verifiable digital transfer record containing GPS coordinates, timestamp, weight, and unique CPCB hash.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 border-2 border-steel-800 flex flex-col items-center justify-center space-y-3 shadow-inner">
              <div className="w-44 h-44 bg-paper-100 border-4 border-steel-900 p-2 flex items-center justify-center rounded-lg">
                <QrCode className="w-36 h-36 text-steel-900" />
              </div>
              <div className="text-center font-mono">
                <span className="text-lg font-black text-copper-700 tracking-wider block">{handoverLotCode}</span>
                <span className="text-[10px] text-steel-500">Hash: 8f4a1c9e02bb44... (SHA-256)</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono bg-paper-100 p-3.5 rounded border border-paper-300">
              <div>
                <span className="text-[10px] text-steel-500 block">COLLECTOR ID</span>
                <span className="font-bold text-steel-800">{user?.id ? `KC-COL-${user.id.slice(0, 4).toUpperCase()}` : 'KC-COL-8921 (Suresh)'}</span>
              </div>
              <div>
                <span className="text-[10px] text-steel-500 block">HANDOVER RECIPIENT</span>
                <span className="font-bold text-steel-800">
                  {myLots.find(l => l.lotCode === handoverLotCode)?.recyclerName || 'EcoRecycle (Okhla Ph-II)'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-steel-500 block">ESTIMATED VALUE</span>
                <span className="font-bold text-forest-700">
                  ₹{(myLots.find(l => l.lotCode === handoverLotCode)?.finalPrice || myLots.find(l => l.lotCode === handoverLotCode)?.askingPrice || 8000).toLocaleString('en-IN')} ({language === 'hi' ? 'नकद / UPI' : language === 'mr' ? 'रोख / UPI' : 'Cash / UPI Escrow'})
                </span>
              </div>
              <div>
                <span className="text-[10px] text-steel-500 block">SALE TOKEN</span>
                <span className="font-bold text-steel-800">
                  {myLots.find(l => l.lotCode === handoverLotCode)?.saleTokenNumber || 'KBD-SL-20260917-SZ-E92A1F'}
                </span>
              </div>
            </div>

            <div className="text-[11px] text-steel-600 flex items-center gap-1.5 p-2 bg-paper-200 rounded border border-steel-300">
              <ShieldCheck className="w-4 h-4 text-forest-600 flex-shrink-0" />
              <span>
                {language === 'hi' ? 'रीसायकलर द्वारा स्कैन करते ही यह रसीद सीपीसीबी ईपीआर पोर्टल पर दर्ज हो जाती है।' : language === 'mr' ? 'रीसायकलरने स्कॅन करताच ही पावती सीपीसीबी पोर्टलवर नोंदवली जाते.' : 'Upon recycler QR scan, this lot is immediately sealed on the CPCB central registry.'}
              </span>
            </div>

            {/* Universal CPCB Sale Token & Partner Actions */}
            <div className="p-4 bg-white rounded-xl border-2 border-emerald-300 space-y-3 shadow-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-700" />
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">CPCB Universal Sale Token</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                  CPCB Rule 13(2) Verified
                </span>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs font-mono flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Audit Trace Hash</span>
                  <span className="font-bold text-slate-900">{myLots.find(l => l.lotCode === handoverLotCode)?.saleTokenNumber || 'KBD-SL-20260917-SZ-E92A1F'}</span>
                </div>
                <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                  🔒 DPDP Shield (Aadhaar Masked)
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    const l = myLots.find(lot => lot.lotCode === handoverLotCode);
                    setRatingModalData({
                      partnerId: l?.recyclerId || 'rec_1',
                      partnerName: l?.recyclerName || 'EcoRecycle Aggregators Ltd',
                      role: 'RECYCLER',
                      lotCode: handoverLotCode,
                      saleTokenId: l?.saleTokenId || 'st_seed_1'
                    });
                  }}
                  className="btn-primary-m3 py-2 px-3 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-2xs active:scale-95 transition-transform"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>Rate Recycler</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const l = myLots.find(lot => lot.lotCode === handoverLotCode);
                    setActiveChatContext({
                      type: 'LOT',
                      id: l?.id || 'lot_1',
                      title: `${l?.category || 'E-Waste Lot'} (${l?.approxWeightKg || 45}kg)`,
                      partnerName: l?.recyclerName || 'EcoRecycle Aggregators Ltd',
                      partnerRole: 'RECYCLER'
                    });
                  }}
                  className="bg-paper-200 hover:bg-paper-300 text-steel-800 border border-steel-300 py-2 px-3 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors active:scale-95"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-copper-600" />
                  <span>Chat Recycler</span>
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-paper-50 rounded-xl p-6 border-2 border-steel-300 shadow-sm space-y-4">
              <h3 className="font-display font-bold text-steel-900 text-base">
                {t('handoverStepsTitle', '3 Easy Steps for Handover')}
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex items-start gap-3 p-3 bg-white rounded border border-steel-200">
                  <div className="w-6 h-6 rounded-full bg-copper-600 text-white flex items-center justify-center font-bold font-mono text-xs flex-shrink-0">
                    1
                  </div>
                  <div>
                    <span className="font-bold text-steel-800 block">{t('step1Weight', 'Weight Check at Recycler Gate')}</span>
                    <span className="text-steel-600">{t('step1Desc', 'Weigh items on calibrated electronic scale.')}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-white rounded border border-steel-200">
                  <div className="w-6 h-6 rounded-full bg-copper-600 text-white flex items-center justify-center font-bold font-mono text-xs flex-shrink-0">
                    2
                  </div>
                  <div>
                    <span className="font-bold text-steel-800 block">{t('step2Scan', 'Scan Handover QR Code')}</span>
                    <span className="text-steel-600">{t('step2Desc', 'Recycler operator scans voucher with their phone.')}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-white rounded border border-steel-200">
                  <div className="w-6 h-6 rounded-full bg-copper-600 text-white flex items-center justify-center font-bold font-mono text-xs flex-shrink-0">
                    3
                  </div>
                  <div>
                    <span className="font-bold text-steel-800 block">{t('step3Pay', 'Receive Cash or Wallet Payout')}</span>
                    <span className="text-steel-600">{t('step3Desc', 'Receive immediate cash or wallet escrow payment. Recorded in passbook.')}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-brass-100 rounded-xl border border-brass-400 text-xs text-steel-800 space-y-1">
              <span className="font-bold text-brass-900 block flex items-center gap-1">
                <Award className="w-4 h-4 text-brass-700" /> {t('formalizationBenefitTitle', 'Ministry of Mines Formalization Incentive:')}
              </span>
              <p>
                {t('formalizationBenefitDesc', 'Earn ₹500 formalization loyalty bonus for every verified digital lot handover.')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: PASSBOOK RUNNING LEDGER */}
      {activeTab === 'passbook' && (
        <div className="bg-paper-50 rounded-xl p-5 sm:p-7 border-2 border-steel-400 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-steel-300 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="stamp-seal stamp-verified text-xs">{t('passbookBadge', 'Cash Passbook')}</span>
                <VoiceAssistButton
                  text="Earnings Passbook Ledger. Running record of transactions, payments received in cash or UPI, and balance."
                  hindiText="कमाई खाता बही और पासबुक। नकद या यूपीआई में प्राप्त भुगतानों और कुल शेष राशि का खाता।"
                  marathiText="कमाई पासबुक नोंदवही. रोख किंवा डिजिटल व्यवहारांची नोंद."
                  size="sm"
                />
              </div>
              <h2 className="text-xl font-display font-black text-steel-900 mt-1">
                {t('passbookTitle', 'Collector Running Passbook Ledger')}
              </h2>
              <p className="text-xs text-steel-600 font-medium">
                Traditional passbook-style stamped entries for maximum trust, cash reconciliation, and pending dues.
              </p>
            </div>

            <div className="bg-steel-900 text-paper-50 px-4 py-2.5 rounded-lg border border-steel-700 font-mono text-right">
              <span className="text-[10px] text-paper-400 block uppercase">TOTAL RUNNING BALANCE</span>
              <span className="text-xl font-bold text-brass-400">{formatCurrency(walletBalance)}</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead>
                <tr className="bg-paper-200 text-steel-800 border-b-2 border-steel-400 uppercase text-[11px]">
                  <th className="p-3">{t('thDate', 'Date')}</th>
                  <th className="p-3">{t('thDesc', 'Description')}</th>
                  <th className="p-3">{t('thParty', 'Party')}</th>
                  <th className="p-3">{t('thMode', 'Mode')}</th>
                  <th className="p-3 text-right">{t('thAmount', 'Amount')}</th>
                  <th className="p-3 text-right">{t('thBalance', 'Balance')}</th>
                  <th className="p-3 text-center">{t('thStamp', 'Stamp')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-steel-300 bg-white">
                {passbookTransactions.map(txn => (
                  <tr key={txn.id} className="hover:bg-paper-100 transition-colors">
                    <td className="p-3 text-steel-600 whitespace-nowrap">{txn.date}</td>
                    <td className="p-3 font-bold text-steel-900">
                      <div>{txn.desc}</div>
                      <span className="text-[10px] text-steel-500 font-normal">Ref: {txn.ref}</span>
                    </td>
                    <td className="p-3 text-steel-700">{txn.party}</td>
                    <td className="p-3 text-steel-600">
                      <span className="px-2 py-0.5 bg-paper-200 rounded border border-steel-300 text-[10px]">
                        {txn.paymentMode}
                      </span>
                    </td>
                    <td className={`p-3 text-right font-bold ${txn.type === 'CREDIT' ? 'text-forest-600' : 'text-signal-600'}`}>
                      {txn.type === 'CREDIT' ? `+₹${txn.amount}` : `-₹${txn.amount}`}
                    </td>
                    <td className="p-3 text-right font-bold text-steel-900">
                      ₹{txn.balance}
                    </td>
                    <td className="p-3 text-center">
                      <span className="stamp-seal stamp-verified text-[9px]">
                        {t('verified', 'VERIFIED')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-paper-200 rounded-lg border border-steel-300 flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="text-steel-600">
              {t('cashPaymentRule', 'Cash Payment Rule: All cash handovers are automatically stamped and logged into the running passbook.')}
            </span>
            <button
              onClick={() => alert(language === 'hi' ? 'पासबुक पीडीएफ डाउनलोड हो रही है...' : language === 'mr' ? 'पासबुक पीडीएफ डाउनलोड होत आहे...' : 'Downloading Passbook PDF Statement...')}
              className="bg-paper-100 hover:bg-paper-300 text-steel-800 border border-steel-400 px-3 py-1.5 rounded font-bold flex items-center space-x-1"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{t('downloadPassbookPdf', 'Download Passbook PDF')}</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 7: CPCB KYC & BADGES */}
      {activeTab === 'kyc' && (
        <CollectorKycCard
          kycInfo={kycInfo}
          onSubmitKyc={handleSubmitKyc}
          onRefresh={loadKyc}
        />
      )}

      {/* TAB 8: SAFETY GUIDANCE & SEGREGATION CARDS */}
      {activeTab === 'safety' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-steel-300 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="stamp-seal stamp-hazard text-xs">{t('safetyBadge', 'Safety Guidance')}</span>
                <VoiceAssistButton
                  text="Safety guidance for hazardous e-waste. Avoid battery puncture, toxic cable burning, CRT glass implosion, and acid leaching."
                  hindiText="ई-कचरा सुरक्षा मार्गदर्शन। बैटरी फटने, तारों को जलाने, सीआरटी स्क्रीन तोड़ने और तेजाब के खतरों से बचें।"
                  marathiText="ई-कचरा सुरक्षा नियम. बॅटरी, विषारी धूर, काच आणि आम्लाच्या धोक्यांपासून सावध राहा."
                  size="sm"
                />
              </div>
              <h2 className="text-xl font-display font-black text-steel-900 mt-1">
                {t('safetyCardsTitle', 'Safety Rules & Hazardous Practice Prevention')}
              </h2>
              <p className="text-xs text-steel-600 font-medium">
                Pictorial and spoken warnings to protect collectors from fatal fires, toxic fumes, and lead poisoning.
              </p>
            </div>

            <span className="text-xs font-mono text-signal-600 bg-signal-500/10 px-3 py-1.5 rounded border border-signal-500/30">
              ⚠️ {t('cpcbSafetyGuidelines', 'CPCB Mandatory E-Waste Safety Guidelines')}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {safetyCards.map(card => (
              <div
                key={card.id}
                className="receipt-stub rounded-xl p-5 border-2 border-signal-500 shadow-sm space-y-4"
              >
                <div className="flex items-start justify-between border-b border-steel-300 pb-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-9 h-9 rounded-lg bg-signal-500/10 text-signal-600 flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="stamp-seal stamp-hazard text-[9px]">{card.severity} HAZARD</span>
                      <h3 className="font-display font-bold text-steel-900 text-base leading-snug">
                        {language === 'hi' ? card.hazardTitleHi : language === 'mr' ? card.hazardTitleMr : card.hazardTitleEn}
                      </h3>
                    </div>
                  </div>

                  <VoiceAssistButton
                    text={card.spokenEn}
                    hindiText={card.spokenHi}
                    marathiText={card.spokenMr}
                    size="sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-forest-500/10 p-3 rounded border border-forest-500/30 space-y-1.5">
                    <span className="font-bold text-forest-700 flex items-center gap-1 uppercase text-[10px]">
                      <CheckCircle2 className="w-3.5 h-3.5" /> {t('dosTitle', "DO'S:")}
                    </span>
                    <ul className="space-y-1 text-steel-800 list-disc list-inside">
                      {(language === 'hi' ? card.dosHi : language === 'mr' ? card.dosMr : card.dosEn).map((d, i) => (
                        <li key={i}>{d}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-signal-500/10 p-3 rounded border border-signal-500/30 space-y-1.5">
                    <span className="font-bold text-signal-700 flex items-center gap-1 uppercase text-[10px]">
                      <Flame className="w-3.5 h-3.5" /> {t('dontsTitle', "DON'TS:")}
                    </span>
                    <ul className="space-y-1 text-steel-800 list-disc list-inside">
                      {(language === 'hi' ? card.dontsHi : language === 'mr' ? card.dontsMr : card.dontsEn).map((d, i) => (
                        <li key={i}>{d}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="text-[11px] text-steel-500 italic bg-paper-100 p-2 rounded border border-paper-300">
                  "{t('safetyQuote', 'Proper segregation protects worker health and yields up to 35% higher buyback value from formal smelters.')}"
                </div>
              </div>
            ))}
          </div>

          {/* Value-Preservation Segregation Guide Banner (Section 1.B.8) */}
          <div className="bg-paper-100 rounded-xl p-6 border-2 border-brass-400 space-y-3">
            <span className="stamp-seal stamp-verified text-xs">{t('valueBadge', 'Value Maximization Guide')}</span>
            <h3 className="font-display font-black text-steel-900 text-lg">
              {t('valuePreservationTitle', '4 Rules of Value-Preservation Disassembly for Maximum Earnings')}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="bg-white p-3 rounded border border-steel-300">
                <span className="font-bold text-copper-700 block">{t('step1Plastic', 'Step 1: Unscrew External Plastic')}</span>
                <p className="text-steel-600 mt-1">{t('step1PlasticDesc', 'Remove clean ABS plastic housing without smashing screws (sells separately at ₹38/kg).')}</p>
              </div>
              <div className="bg-white p-3 rounded border border-steel-300">
                <span className="font-bold text-copper-700 block">{t('step2Pcb', 'Step 2: Keep Circuit Boards Whole')}</span>
                <p className="text-steel-600 mt-1">{t('step2PcbDesc', 'High-grade motherboards sell at ₹640/kg when components and gold pins remain intact.')}</p>
              </div>
              <div className="bg-white p-3 rounded border border-steel-300">
                <span className="font-bold text-copper-700 block">{t('step3Copper', 'Step 3: Strip Copper Cold')}</span>
                <p className="text-steel-600 mt-1">{t('step3CopperDesc', 'Extract copper windings using hand wire-strippers without open-flame burning (₹480/kg).')}</p>
              </div>
              <div className="bg-white p-3 rounded border border-steel-300">
                <span className="font-bold text-copper-700 block">{t('step4Battery', 'Step 4: Bag Batteries Separately')}</span>
                <p className="text-steel-600 mt-1">{t('step4BatteryDesc', 'Keep lithium cells insulated in a dry bag to prevent punctures, sparks, or thermal runaways.')}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: CITIZEN PICKUPS & ROUTE MAP */}
      {activeTab === 'pickups' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-steel-300 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="stamp-seal stamp-verified text-xs">{t('citizenPickupsBadge', 'Citizen Pickups')}</span>
                <VoiceAssistButton
                  text="Household pickups. View nearby e-waste requests from citizens, accept jobs, and update verified weights."
                  hindiText="नागरिक ई-कचरा पिकअप। पास के घरों से स्क्रैप अनुरोध देखें और स्वीकार करें।"
                  marathiText="नागरिक संकलन विनंत्या पहा आणि स्वीकारा."
                  size="sm"
                />
              </div>
              <h2 className="text-xl font-display font-black text-steel-900 mt-1">
                {t('citizenPickupRequestsTitle', 'Nearby Citizen Pickup Requests')}
              </h2>
              <p className="text-xs text-steel-600 font-medium">
                Pick up e-waste directly from households and offices within your 5km operating radius.
              </p>
            </div>

            <button
              onClick={() => loadPickups()}
              className="px-3 py-1.5 bg-paper-200 hover:bg-paper-300 text-steel-800 border border-steel-400 rounded text-xs font-bold flex items-center space-x-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{t('refreshBtn', 'Refresh')}</span>
            </button>
          </div>

          {jobSuccess && (
            <div className="p-4 bg-forest-500/10 border-2 border-forest-500 rounded-lg text-xs text-forest-800 space-y-1">
              <div className="font-bold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-forest-600" /> {t('jobCompletedTitle', 'Job Successfully Completed!')}
              </div>
              <p>{jobSuccess}</p>
            </div>
          )}

          {/* Active Job in Progress */}
          {activeJob && (
            <div className="receipt-stub rounded-xl p-6 border-2 border-copper-600 shadow-md space-y-4 bg-copper-500/5">
              <div className="flex justify-between items-start border-b border-steel-300 pb-3">
                <div>
                  <span className="stamp-seal stamp-pending text-xs">{t('activeJobBadge', 'IN PROGRESS')}</span>
                  <h3 className="text-lg font-display font-black text-steel-900 mt-1">
                    {activeJob.address}
                  </h3>
                  <p className="text-xs text-steel-600">
                    Citizen: {activeJob.citizen?.name || 'Ramesh Sharma'} • {t('totalItems', 'Total Items')}: {activeJob.totalItems || activeJob.items?.reduce((s, it) => s + (it.quantity || 1), 0) || 1} {t('pieces', 'pcs')} ({activeJob.items?.length || 1} {t('items', 'types')})
                  </p>
                </div>
                <a
                  href={`tel:${activeJob.citizen?.phone || '9811100001'}`}
                  className="btn-dhatu-primary px-3 py-1.5 rounded text-xs font-bold flex items-center space-x-1"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>{t('callBtn', 'Call')}</span>
                </a>
              </div>

              {/* Weight Adjustment Stepper for Completion */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-steel-800 uppercase tracking-wider block">
                  {t('verifyWeightTitle', 'Verify & Adjust Final Weight:')}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {activeJob.items.map((item, idx) => (
                    <div key={idx} className="bg-white p-3 rounded border border-steel-300 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-steel-800 block">
                          {item.quantity ? `${item.quantity} ${t('pieces', 'pcs')} • ` : ''}{preserveEnglishItemName(item.category)}
                        </span>
                        <span className="text-[10px] text-steel-500">Rate: ₹{item.ratePerKg}/kg</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            const cur = itemWeights[item.category] || item.estWeightKg;
                            setItemWeights({ ...itemWeights, [item.category]: Math.max(0.01, Math.round((cur - 0.1) * 10) / 10) });
                          }}
                          className="w-8 h-8 rounded bg-paper-200 border border-steel-400 flex items-center justify-center font-bold text-steel-800"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          step="any"
                          min="0.01"
                          value={itemWeights[item.category] ?? item.estWeightKg}
                          onChange={e => {
                            const val = parseFloat(e.target.value);
                            setItemWeights({ ...itemWeights, [item.category]: isNaN(val) ? 0.01 : Math.max(0.01, Math.round(val * 100) / 100) });
                          }}
                          className="w-16 px-1.5 py-1 text-center font-mono text-sm font-bold bg-white border border-steel-400 rounded text-steel-900"
                        />
                        <span className="text-xs text-steel-500 font-mono">kg</span>
                        <button
                          type="button"
                          onClick={() => {
                            const cur = itemWeights[item.category] || item.estWeightKg;
                            setItemWeights({ ...itemWeights, [item.category]: Math.round((cur + 0.1) * 10) / 10 });
                          }}
                          className="w-8 h-8 rounded bg-copper-600 text-white flex items-center justify-center font-bold"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Layer 1 Verification: Citizen Handover OTP */}
              <div className="p-3.5 bg-paper-100 rounded-lg border-2 border-dashed border-steel-400 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-steel-800 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-copper-600" />
                    <span>Layer 1 Verification: Citizen Handover OTP</span>
                  </span>
                  <span className="text-[10px] text-steel-500 font-mono">
                    Mandatory physical check
                  </span>
                </div>

                <p className="text-[11px] text-steel-600">
                  Ask citizen {activeJob.citizen?.name || 'Ramesh'} for the 4-digit verification code displayed on their portal to confirm physical collection.
                </p>

                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    maxLength={4}
                    value={citizenOtpInput}
                    onChange={e => {
                      setCitizenOtpInput(e.target.value.replace(/\D/g, ''));
                      setOtpError(null);
                    }}
                    placeholder="4-digit OTP"
                    className="w-32 px-3 py-2 text-sm font-mono font-bold tracking-widest text-center bg-white border-2 border-steel-400 rounded-lg focus:border-copper-600 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const expected = activeJob.verificationOtp || '4821';
                      setCitizenOtpInput(expected);
                      setIsOtpVerified(true);
                      setOtpError(null);
                      hapticSuccess();
                    }}
                    className="btn-dhatu-steel px-3 py-2 text-xs font-bold rounded-lg flex items-center gap-1 shadow-sm"
                  >
                    <QrCode className="w-3.5 h-3.5 text-copper-600" />
                    <span>Scan / Autofill ({activeJob.verificationOtp || '4821'})</span>
                  </button>

                  {isOtpVerified && (
                    <span className="text-xs font-bold text-forest-700 flex items-center gap-1 bg-forest-50 px-2 py-1 rounded border border-forest-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-forest-600" /> Handover Verified
                    </span>
                  )}
                </div>

                {otpError && (
                  <p className="text-[11px] text-signal-600 font-bold animate-pulse">{otpError}</p>
                )}
              </div>

              <div className="pt-2 border-t border-steel-200 flex justify-end">
                <button
                  type="button"
                  onClick={handleCompletePickup}
                  disabled={completingJob}
                  className="btn-dhatu-primary px-6 py-2.5 rounded text-xs font-bold flex items-center space-x-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{t('completePickupBtn', 'Complete Pickup & Issue Digital Receipt')}</span>
                </button>
              </div>
            </div>
          )}

          {/* Live Open Pickups Map Visualizer */}
          <div className="receipt-stub rounded-xl p-4 border-2 border-steel-300 shadow-sm space-y-3">
            <div className="font-display font-bold text-steel-800 text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-copper-600" />
                <span>{t('livePickupsMapTitle', 'Live e-Waste Pickups Map')}</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={detectCollectorLocation}
                  disabled={isUpdatingLocation}
                  className="px-2.5 py-1 bg-paper-200 hover:bg-copper-100 active:bg-copper-200 text-steel-800 text-xs font-mono font-bold rounded border border-steel-300 flex items-center gap-1 transition-colors disabled:opacity-50"
                  title="Refresh live GPS position"
                >
                  <RefreshCw className={`w-3 h-3 text-copper-600 ${isUpdatingLocation ? 'animate-spin' : ''}`} />
                  <span>{isUpdatingLocation ? 'Locating...' : 'Update GPS'}</span>
                </button>
                <span className="text-xs font-mono text-copper-700 bg-paper-200 px-2.5 py-1 rounded border border-steel-300 font-bold">
                  {nearbyPickups.length} Nearby Requests
                </span>
              </div>
            </div>

            {/* Collector Base Location Live Breadcrumb */}
            <div className="text-[11px] font-mono text-steel-700 bg-paper-200/80 p-2 rounded border border-steel-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5 truncate">
                <span className="w-2 h-2 rounded-full bg-forest-600 animate-pulse shrink-0" />
                <span className="truncate">Your Live Base: <strong>{collectorLocationName}</strong></span>
              </span>
              <span className="text-copper-700 font-bold shrink-0 ml-2">
                {collectorCoords[0].toFixed(4)}°, {collectorCoords[1].toFixed(4)}°
              </span>
            </div>

            <div className="h-60 sm:h-72 rounded-lg overflow-hidden border border-steel-300">
              <LeafletMap
                center={collectorCoords}
                zoom={13}
                userPosition={collectorCoords}
                pickups={nearbyPickups}
                height="100%"
              />
            </div>
          </div>

          {/* List of Available Nearby Pickups */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {nearbyPickups.map(pickup => (
              <div
                key={pickup.id}
                className="receipt-stub rounded-lg p-5 border-2 border-steel-300 shadow-sm flex flex-col justify-between space-y-3 hover:border-copper-500 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between border-b border-steel-200 pb-2 mb-2">
                    <span className="text-xs font-bold text-copper-700">Ref #{pickup.id.slice(0, 8)}</span>
                    <div className="flex items-center gap-2">
                      {pickup.distanceKm !== undefined && (
                        <span className="text-[10px] text-forest-700 font-bold bg-forest-50 px-1.5 py-0.5 rounded border border-forest-300">
                          📍 {pickup.distanceKm} km away
                        </span>
                      )}
                      <span className="text-[10px] text-steel-500 font-medium">{pickup.scheduledAt.slice(11, 16)}</span>
                    </div>
                  </div>

                  <h4 className="font-bold text-steel-900 text-sm">
                    {pickup.address}
                  </h4>

                  <div className="mt-2 space-y-1 text-xs text-steel-600">
                    <p>{t('citizenName')}: <strong>{pickup.citizen?.name || 'Ramesh Sharma'}</strong></p>
                    <p>{t('totalItems', 'Total Items')}: <strong>{pickup.totalItems || pickup.items?.reduce((s, it) => s + (it.quantity || 1), 0) || 1} {t('pieces', 'pcs')} ({pickup.items?.length || 1} {t('items', 'types')})</strong></p>
                    <p>{t('itemsDeclared')}: <strong>{pickup.items.map(i => `${i.quantity ? `${i.quantity} ${t('pieces', 'pcs')} • ` : ''}${preserveEnglishItemName(i.category)} (~${i.estWeightKg}kg)`).join(', ')}</strong></p>
                  </div>
                </div>

                <div className="pt-2 border-t border-steel-200 flex flex-wrap items-center justify-between gap-2">
                  <span className="font-bold text-copper-700 text-sm">
                    {t('estimatedPayout')}: ₹{pickup.totalAmount || 620}
                  </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveChatContext({
                            type: 'PICKUP',
                            id: pickup.id,
                            title: `Pickup: ${pickup.address.slice(0, 24)}...`,
                            partnerName: pickup.citizen?.name || 'Citizen',
                            partnerRole: 'CITIZEN'
                          });
                        }}
                        className="px-2.5 py-1.5 bg-paper-200 hover:bg-paper-300 text-steel-800 text-xs font-bold rounded border border-steel-400 flex items-center gap-1 transition-colors"
                        title="Chat with Citizen"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-copper-600" />
                        <span>Chat</span>
                      </button>
                      <a
                        href={getDirectionsUrl(pickup.latitude, pickup.longitude, collectorCoords[0], collectorCoords[1])}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1.5 bg-paper-200 hover:bg-paper-300 text-steel-800 text-xs font-bold rounded border border-steel-400 flex items-center gap-1 transition-colors"
                        title="Open Google Maps Driving Directions"
                      >
                        <Navigation className="w-3.5 h-3.5 text-copper-600" />
                        <span>Directions</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => handleAcceptPickup(pickup)}
                        className="btn-dhatu-primary px-4 py-1.5 rounded text-xs font-bold flex items-center space-x-1 shadow-sm active:scale-98 transition-transform"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>{t('acceptPickup')}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      {/* MOBILE BOTTOM TAB BAR (Material 3 Expressive Navigation Bar) */}
      <nav
        aria-label="Collector Navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/80 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] px-1 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom,0.75rem))]"
      >
        <div className="flex items-center justify-around gap-0.5 max-w-md mx-auto">
          <button
            onClick={() => setActiveTab('lots')}
            className={`flex-1 min-w-0 py-1 px-0.5 rounded-2xl flex flex-col items-center justify-center transition-all ${
              activeTab === 'lots'
                ? 'font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <div className={`w-10 h-7 rounded-full flex items-center justify-center transition-all ${activeTab === 'lots' ? 'm3-nav-pill-active' : 'text-slate-500'}`}>
              <Camera className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-semibold mt-1 truncate max-w-full">{t('mNavLots', 'Lots')}</span>
          </button>

          <button
            onClick={() => setActiveTab('bids')}
            className={`flex-1 min-w-0 py-1 px-0.5 rounded-2xl flex flex-col items-center justify-center transition-all ${
              activeTab === 'bids'
                ? 'font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <div className={`w-10 h-7 rounded-full flex items-center justify-center transition-all ${activeTab === 'bids' ? 'm3-nav-pill-active' : 'text-slate-500'}`}>
              <Gavel className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-semibold mt-1 truncate max-w-full">{t('mNavBids', 'Bids')}</span>
          </button>

          <button
            onClick={() => setActiveTab('priceboard')}
            className={`flex-1 min-w-0 py-1 px-1 rounded-2xl flex flex-col items-center justify-center transition-all ${
              activeTab === 'priceboard'
                ? 'font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <div className={`w-12 h-7 rounded-full flex items-center justify-center transition-all ${activeTab === 'priceboard' ? 'm3-nav-pill-active' : 'text-slate-500'}`}>
              <TrendingUp className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-semibold mt-1 truncate max-w-full">{t('mNavPrices', 'Prices')}</span>
          </button>

          <button
            onClick={() => setActiveTab('pickups')}
            className={`flex-1 min-w-0 py-1 px-1 rounded-2xl flex flex-col items-center justify-center transition-all ${
              activeTab === 'pickups'
                ? 'font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <div className={`w-12 h-7 rounded-full flex items-center justify-center transition-all ${activeTab === 'pickups' ? 'm3-nav-pill-active' : 'text-slate-500'}`}>
              <Truck className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-semibold mt-1 truncate max-w-full">{t('mNavPickups', 'Pickups')}</span>
          </button>

          <button
            onClick={() => setActiveTab('recyclers')}
            className={`flex-1 min-w-0 py-1 px-1 rounded-2xl flex flex-col items-center justify-center transition-all ${
              activeTab === 'recyclers'
                ? 'font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <div className={`w-12 h-7 rounded-full flex items-center justify-center transition-all ${activeTab === 'recyclers' ? 'm3-nav-pill-active' : 'text-slate-500'}`}>
              <Factory className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-semibold mt-1 truncate max-w-full">{t('mNavRecyclers', 'Recyclers')}</span>
          </button>

          <button
            onClick={() => setActiveTab('passbook')}
            className={`flex-1 min-w-0 py-1 px-1 rounded-2xl flex flex-col items-center justify-center transition-all ${
              activeTab === 'passbook'
                ? 'font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <div className={`w-12 h-7 rounded-full flex items-center justify-center transition-all ${activeTab === 'passbook' ? 'm3-nav-pill-active' : 'text-slate-500'}`}>
              <BookOpen className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-semibold mt-1 truncate max-w-full">{t('mNavPassbook', 'Passbook')}</span>
          </button>

          <button
            onClick={() => setActiveTab('safety')}
            className={`flex-1 min-w-0 py-1 px-1 rounded-2xl flex flex-col items-center justify-center transition-all ${
              activeTab === 'safety'
                ? 'text-rose-950 font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <div className={`w-12 h-7 rounded-full flex items-center justify-center transition-all ${activeTab === 'safety' ? 'bg-rose-100 text-rose-800' : 'text-slate-500'}`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-semibold mt-1 truncate max-w-full">{t('mNavSafety', 'Safety')}</span>
          </button>
        </div>
      </nav>

      {/* LOT CREATION POPUP CONFIRMATION MODAL */}
      {createdLotModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-steel-950/80 backdrop-blur-sm animate-fade-in"
          onClick={() => setCreatedLotModal(null)}
        >
          <div
            className="bg-white rounded-[32px] border border-slate-200 max-w-md w-full p-6 sm:p-7 shadow-m3-4 space-y-5 text-slate-900 overflow-y-auto max-h-[90vh] relative"
            onClick={e => e.stopPropagation()}
          >
            {/* Close icon button */}
            <button
              onClick={() => setCreatedLotModal(null)}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header with success badge */}
            <div className="text-center space-y-2 pt-1">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-300 mx-auto shadow-sm">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <h3 className="text-2xl font-display font-black text-slate-900">
                Lot Created Successfully!
              </h3>
              <p className="text-sm text-slate-600 font-normal max-w-xs mx-auto">
                Your digital scrap lot has been registered and broadcasted to authorized recyclers for bidding.
              </p>
            </div>

            {/* Lot Details Summary Card */}
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-3 font-body">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-xs uppercase font-bold text-slate-500 tracking-wider">Lot Reference</span>
                <span className="font-display font-black text-emerald-700 text-base sm:text-lg">#{createdLotModal.lotCode}</span>
              </div>

              <div className="space-y-0.5">
                <div className="text-xs uppercase font-semibold text-slate-500">Category</div>
                <div className="text-sm sm:text-base font-bold text-slate-900">
                  {preserveEnglishItemName(createdLotModal.category)}
                </div>
              </div>

              {/* Custom Mixed Lot Manifest Breakdown in Modal */}
              {createdLotModal.isCustomLot && createdLotModal.items && createdLotModal.items.length > 0 && (
                <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1.5 text-xs sm:text-sm">
                  <div className="flex items-center justify-between text-xs uppercase font-bold text-slate-700 pb-1 border-b border-slate-200">
                    <span className="flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-slate-600" />
                      <span>Mixed Manifest ({createdLotModal.items.length} materials)</span>
                    </span>
                    <span className="text-emerald-700">Avg ₹{createdLotModal.recyclerOfferedRate}/kg</span>
                  </div>
                  <div className="space-y-1 pt-0.5">
                    {createdLotModal.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs sm:text-sm text-slate-800">
                        <span className="truncate pr-1">• {preserveEnglishItemName(it.category)}</span>
                        <span className="font-bold text-slate-900 shrink-0">
                          {it.quantity ? `${it.quantity} ${t('pieces', 'pcs')} • ` : ''}{it.weightKg} kg (₹{it.ratePerKg}/kg)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-2 pt-1 text-sm">
                <div className="bg-white p-2.5 rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-[11px] font-semibold text-slate-500 block uppercase">{t('totalItems', 'TOTAL ITEMS')}</span>
                  <span className="font-display font-black text-slate-900 text-sm sm:text-base truncate block">
                    {createdLotModal.totalItems || createdLotModal.items?.reduce((s, it) => s + (it.quantity || 1), 0) || 1} {t('pieces', 'pcs')}
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-[11px] font-semibold text-slate-500 block uppercase">EST. WEIGHT</span>
                  <span className="font-display font-black text-slate-900 text-sm sm:text-base">{createdLotModal.approxWeightKg} kg</span>
                </div>
                <div className="bg-white p-2.5 rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-[11px] font-semibold text-slate-500 block uppercase">BASE RATE</span>
                  <span className="font-display font-black text-emerald-700 text-sm sm:text-base">₹{createdLotModal.recyclerOfferedRate}/kg</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-1 text-sm">
                <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-2xl shadow-2xs">
                  <span className="text-xs font-bold text-emerald-800 block uppercase">ASKING PRICE</span>
                  <span className="font-display font-black text-emerald-900 text-lg sm:text-xl">
                    ₹{(createdLotModal.askingPrice || createdLotModal.estimatedValue).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-2xl shadow-2xs">
                  <span className="text-xs font-bold text-amber-800 block uppercase">MIN BID (50%)</span>
                  <span className="font-display font-black text-amber-900 text-lg sm:text-xl">
                    ₹{(createdLotModal.minBidAmount || Math.round((createdLotModal.askingPrice || createdLotModal.estimatedValue) * 0.5)).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="text-xs text-slate-600 flex items-center gap-1.5 pt-1 text-center justify-center">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
                <span>Bidding rule: Bids below <strong>50% of asking price</strong> are rejected.</span>
              </div>
            </div>

            {/* Quick Handover Code & QR Teaser */}
            <div className="p-3.5 bg-slate-100/90 rounded-2xl border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <QrCode className="w-8 h-8 text-slate-800 shrink-0" />
                <div>
                  <div className="text-xs sm:text-sm font-bold text-slate-900">Digital Handover Voucher</div>
                  <div className="text-xs text-slate-500">Ready for recycler scan at depot</div>
                </div>
              </div>
              <span className="px-2.5 py-1 bg-emerald-600 text-white rounded-full text-xs font-bold uppercase tracking-wider shadow-xs">
                Live
              </span>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-1">
              <button
                onClick={() => {
                  setCreatedLotModal(null);
                  setActiveTab('lots');
                  setLotsSubView('mylots');
                  triggerHaptic(25);
                }}
                className="w-full min-h-[48px] py-3.5 px-4 btn-primary-m3 font-bold rounded-full shadow-m3-2 text-sm sm:text-base flex items-center justify-center gap-2 active:scale-95 transition-transform"
              >
                <span>📦 View in My Lots & Live Bids</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setCreatedLotModal(null)}
                className="w-full min-h-[48px] py-3 px-4 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-full border border-slate-300 text-sm sm:text-base transition-colors shadow-2xs active:scale-95"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BILATERAL DOUBLE-BLIND RATING MODAL */}
      {ratingModalData && (
        <RatingModal
          saleTokenId={ratingModalData.saleTokenId}
          partnerId={ratingModalData.partnerId}
          partnerName={ratingModalData.partnerName}
          role={ratingModalData.role}
          lotCode={ratingModalData.lotCode}
          onClose={() => setRatingModalData(null)}
          onSubmit={async (data) => {
            await handleSubmitReview(data);
            hapticSuccess();
            setRatingModalData(null);
          }}
        />
      )}

      {/* CONTEXTUAL IN-APP CHAT DRAWER */}
      {activeChatContext && (
        <ChatDrawer
          contextType={activeChatContext.type}
          contextId={activeChatContext.id}
          title={activeChatContext.title}
          partnerName={activeChatContext.partnerName}
          partnerRole={activeChatContext.partnerRole}
          onClose={() => setActiveChatContext(null)}
        />
      )}

    </div>
  );
};
