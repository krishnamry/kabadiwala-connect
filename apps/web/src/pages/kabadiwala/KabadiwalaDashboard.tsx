import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { api } from '../../lib/api';
import { Pickup, EWasteLot, SafetyGuidanceCard } from '../../types';
import { LeafletMap } from '../../components/LeafletMap';
import { VoiceAssistButton } from '../../components/VoiceAssistButton';
import {
  Truck,
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
  FileText
} from 'lucide-react';

export const KabadiwalaDashboard: React.FC = () => {
  const { user } = useAuth();
  const { language, t, formatCurrency, speak, preserveEnglishItemName } = useLanguage();
  
  // Active Tab: lots | priceboard | recyclers | handover | passbook | safety | pickups
  const [activeTab, setActiveTab] = useState<'lots' | 'priceboard' | 'recyclers' | 'handover' | 'passbook' | 'safety' | 'pickups'>('lots');

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
  const [lotCategory, setLotCategory] = useState('High-grade PCB (Motherboards/Servers)');
  const [lotWeight, setLotWeight] = useState(12.5);
  const [lotPhotoTaken, setLotPhotoTaken] = useState(false);
  const [aiValuation, setAiValuation] = useState(8000);
  const [lotCreatedSuccess, setLotCreatedSuccess] = useState<string | null>(null);

  // Live Price Board Dataset (Category, buying price, 7-day trend, spoken texts)
  const priceBoardData = [
    {
      category: 'High-grade PCB (Motherboard/RAM)',
      categoryHi: 'हाई-ग्रेड सर्किट बोर्ड (मदरबोर्ड/रैम)',
      categoryMr: 'हाय-ग्रेड सर्किट बोर्ड (मदरबोर्ड/रॅम)',
      ratePerKg: 640,
      delta: 25,
      trend: 'UP',
      desc: 'Gold/Copper rich server & desktop logic boards'
    },
    {
      category: 'Clean Copper Wire (Bright Strip)',
      categoryHi: 'साफ तांबा तार (ब्राइट छिला हुआ)',
      categoryMr: 'स्वच्छ तांब्याची तार (सोलेली)',
      ratePerKg: 480,
      delta: 15,
      trend: 'UP',
      desc: 'Pure peeled motor/transformer winding wire'
    },
    {
      category: 'Low-grade PCB (Power Supplies/TV)',
      categoryHi: 'लो-ग्रेड सर्किट बोर्ड (पावर सप्लाई/टीवी)',
      categoryMr: 'लो-ग्रेड सर्किट बोर्ड (टीव्ही/पॉवर सप्लाय)',
      ratePerKg: 180,
      delta: -8,
      trend: 'DOWN',
      desc: 'Single layer brown consumer electronic boards'
    },
    {
      category: 'Lithium-ion Batteries (Laptop/EV)',
      categoryHi: 'लिथियम-आयन बैटरियां (लैपटॉप/ईवी)',
      categoryMr: 'लिथियम-आयन बॅटऱ्या (लॅपटॉप/ईव्ही)',
      ratePerKg: 145,
      delta: 10,
      trend: 'UP',
      desc: 'Cobalt-rich cell packs, intact terminals'
    },
    {
      category: 'Electric Motors & Magnets',
      categoryHi: 'इलेक्ट्रिक मोटर और चुंबक',
      categoryMr: 'इलेक्ट्रिक मोटर आणि चुंबक',
      ratePerKg: 95,
      delta: 5,
      trend: 'UP',
      desc: 'Heavy copper core stator and neodymium rotors'
    },
    {
      category: 'LCD / LED Display Panels',
      categoryHi: 'एलसीडी और एलईडी डिस्प्ले पैनल',
      categoryMr: 'एलसीडी आणि एलईडी डिस्प्ले पॅनेल्स',
      ratePerKg: 85,
      delta: 4,
      trend: 'UP',
      desc: 'Intact backlight diffuser and glass panels'
    },
    {
      category: 'Engineering Mixed E-Plastics',
      categoryHi: 'मिश्रित ई-प्लास्टिक (ABS/HIPS)',
      categoryMr: 'मिश्रित ई-प्लास्टिक (ABS/HIPS)',
      ratePerKg: 38,
      delta: -2,
      trend: 'DOWN',
      desc: 'Rigid printer & monitor casing polymers'
    },
    {
      category: 'CRT Glass (Funnel Treated)',
      categoryHi: 'सीआरटी कांच (लीड उपचारित)',
      categoryMr: 'सीआरटी काच (लेड प्रक्रिया)',
      ratePerKg: 12,
      delta: 0,
      trend: 'STABLE',
      desc: 'Intact vacuum bulb glass for smelter flux'
    }
  ];

  // Recycler Directory Data (Ranked by distance, rate, CPCB status)
  const nearbyRecyclers = [
    {
      id: 'rec-1',
      name: 'EcoRecycle Aggregators Ltd (Unit-II)',
      cpcbReg: 'CPCB-EW-2023-DL-0881',
      distanceKm: 3.2,
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

  // Passbook Running Ledger State
  const [passbookTransactions, setPassbookTransactions] = useState([
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
      balance: 2260,
      status: 'VERIFIED'
    }
  ]);

  // Citizen Pickups State
  const [nearbyPickups, setNearbyPickups] = useState<Pickup[]>([]);
  const [activeJob, setActiveJob] = useState<Pickup | null>(null);
  const [itemWeights, setItemWeights] = useState<{ [category: string]: number }>({});
  const [completingJob, setCompletingJob] = useState(false);
  const [jobSuccess, setJobSuccess] = useState<string | null>(null);

  // Active Handover Generator Ticket
  const [handoverLotCode, setHandoverLotCode] = useState('KC-LOT-9821');

  // Load Pickups
  const loadPickups = async () => {
    try {
      const nearby = await api.getNearbyPickups(28.5685, 77.2412, 15).catch(() => []);
      setNearbyPickups(nearby);
      const my = await api.getMyPickups().catch(() => []);
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

  useEffect(() => {
    loadPickups();
  }, []);

  // Update AI Valuation when lot weight or category changes
  useEffect(() => {
    const rateItem = priceBoardData.find(p => p.category.includes(lotCategory) || lotCategory.includes(p.category));
    const rate = rateItem ? rateItem.ratePerKg : 400;
    setAiValuation(Math.round(rate * lotWeight));
  }, [lotCategory, lotWeight]);

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
      alert(`Synchronized ${offlineQueue.length} offline lots to the CPCB server! Ledger updated.`);
      setOfflineQueue([]);
      localStorage.removeItem('dhatu_offline_lots');
    }, 1500);
  };

  // Handle Create Lot
  const handleCreateLot = (e: React.FormEvent) => {
    e.preventDefault();
    const rateItem = priceBoardData.find(p => p.category.includes(lotCategory) || lotCategory.includes(p.category));
    const rate = rateItem ? rateItem.ratePerKg : 400;
    const newLot: EWasteLot = {
      id: `lot-local-${Date.now()}`,
      lotCode: `KC-LOT-${Math.floor(1000 + Math.random() * 9000)}`,
      collectorId: user?.id || 'mock-kaba-1',
      collectorName: user?.name || 'Suresh Kumar',
      category: lotCategory,
      approxWeightKg: lotWeight,
      estimatedValue: Math.round(rate * lotWeight),
      recyclerOfferedRate: rate,
      status: 'AVAILABLE',
      gpsLat: 28.5685,
      gpsLng: 77.2412,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      qrCode: `KBD-EWASTE-${Math.floor(1000 + Math.random() * 9000)}-DELHI`,
      isOfflineQueued: isOffline
    };

    if (isOffline) {
      const updatedQueue = [newLot, ...offlineQueue];
      setOfflineQueue(updatedQueue);
      localStorage.setItem('dhatu_offline_lots', JSON.stringify(updatedQueue));
      setLotCreatedSuccess(`Offline Lot #${newLot.lotCode} saved locally! It will sync once reconnecting.`);
    } else {
      setLotCreatedSuccess(`Lot #${newLot.lotCode} created and broadcasted to 3 nearby authorized recyclers! Instant indicative value: ₹${newLot.estimatedValue}`);
    }

    setHandoverLotCode(newLot.lotCode);
  };

  // Accept Pickup
  const handleAcceptPickup = async (pickup: Pickup) => {
    try {
      const accepted = await api.acceptPickup(pickup.id);
      setActiveJob(accepted);
      setActiveTab('pickups');
      speak(language === 'hi' ? 'पिकअप स्वीकार कर लिया गया है।' : language === 'mr' ? 'संकलन स्वीकारले आहे.' : 'Pickup accepted');
    } catch (e: any) {
      alert('Accepted: ' + pickup.address);
      setActiveJob({ ...pickup, status: 'ACCEPTED' });
      setActiveTab('pickups');
    }
  };

  // Complete Pickup
  const handleCompletePickup = async () => {
    if (!activeJob) return;
    setCompletingJob(true);
    try {
      const itemsPayload = Object.entries(itemWeights).map(([category, actualWeightKg]) => ({
        category,
        actualWeightKg
      }));
      await api.completePickup(activeJob.id, itemsPayload).catch(() => ({
        ...activeJob,
        status: 'COMPLETED' as const
      }));
      setJobSuccess(`Pickup completed! Handover receipt stamped. Cash payment of ₹${activeJob.totalAmount || 620} recorded in Passbook.`);
      setActiveJob(null);
      await loadPickups();
    } finally {
      setCompletingJob(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 space-y-6 pb-28">
      
      {/* Top Collector Header Bar - Passbook Meets Industrial Metaphor */}
      <div className="bg-steel-900 text-paper-50 rounded-xl p-5 sm:p-7 border-2 border-steel-700 shadow-tactile-lg relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          <div className="space-y-1.5 z-10">
            <div className="flex flex-wrap items-center gap-2">
              <span className="stamp-seal stamp-verified text-[11px] bg-forest-500/20 text-forest-500 border-forest-500">
                {t('verifiedCollector', 'VERIFIED COLLECTOR')}
              </span>
              <span className="bg-brass-500/20 text-brass-300 font-mono text-xs px-2 py-0.5 rounded border border-brass-500/40">
                ID: KC-COL-8921
              </span>
              <span className="bg-steel-800 text-paper-300 text-xs px-2 py-0.5 rounded font-mono">
                {user?.kabadiwala?.vehicleType || 'Solar Cargo Trike'}
              </span>
              <VoiceAssistButton
                text="Welcome Suresh Kumar. Kabadiwala Collector Portal. Create lots, view spoken price board, find recyclers, and check passbook ledger."
                hindiText="नमस्ते सुरेश कुमार। कबाड़ीवाला संग्राहक पोर्टल। लॉट बनाएं, बोलता हुआ दाम पत्रक देखें, रीसायकलर खोजें और खाता बही देखें।"
                marathiText="सुरेश कुमार स्वागत आहे. भंगार संग्राहक पोर्टल. नवीन लॉट तयार करा, बोलणारा भाव फलक पहा आणि पासबुक तपासा."
                size="sm"
              />
            </div>

            <h1 className="text-2xl sm:text-3xl font-display font-black tracking-tight text-paper-50">
              {language === 'hi' || language === 'mr' ? 'सुरेश कुमार' : 'Suresh Kumar'}
            </h1>

            <div className="flex items-center space-x-3 text-xs text-paper-300">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-copper-400" />
                <span>Operating Zone: Lajpat Nagar & South Delhi</span>
              </span>
              <span className="text-forest-400 font-bold">★ 4.9 Rating (142 Jobs)</span>
            </div>
          </div>

          {/* Running Balance & Offline Mode Controls */}
          <div className="flex flex-wrap items-center gap-3 z-10">
            <div className="bg-steel-950 p-3 rounded-lg border border-steel-800 text-right">
              <div className="text-[10px] uppercase font-mono text-paper-400">
                {t('passbookBalance', 'Passbook Balance')}
              </div>
              <div className="text-xl sm:text-2xl font-mono-num font-bold text-brass-400">
                ₹14,680
              </div>
              <div className="text-[10px] text-forest-400 font-medium flex items-center justify-end gap-1">
                <span>{t('cashFirst', '💵 Cash-First Support')}</span>
              </div>
            </div>

            {/* Offline Mode Switcher */}
            <div className="flex flex-col items-end gap-1">
              <button
                onClick={handleToggleOffline}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 border transition-all ${
                  isOffline
                    ? 'bg-signal-500 text-white border-signal-600 animate-pulse'
                    : 'bg-paper-200 text-steel-800 hover:bg-paper-300 border-steel-400'
                }`}
                title="Toggle Offline Tolerant Mode"
              >
                {isOffline ? <WifiOff className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5 text-forest-600" />}
                <span>{isOffline ? t('offlineMode', '📵 Offline Mode') : t('onlineMode', '🌐 Online')}</span>
              </button>

              {offlineQueue.length > 0 && (
                <button
                  onClick={handleSyncOfflineLots}
                  disabled={syncing}
                  className="btn-dhatu-brass px-2.5 py-1 rounded text-[11px] font-bold flex items-center space-x-1 shadow-sm"
                >
                  <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} />
                  <span>{t('syncPendingLots', 'Sync Pending Lots')} ({offlineQueue.length})</span>
                </button>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Offline Pending Sync Warning Banner */}
      {isOffline && (
        <div className="p-3 bg-amber-500/10 border-2 border-brass-500 rounded-lg text-xs text-steel-900 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <WifiOff className="w-4 h-4 text-brass-700" />
            <span className="font-bold">
              {t('offlineModeActive', 'Offline Mode Active:')}
            </span>
            <span>Lots are cached locally in your phone storage and queued for auto-sync.</span>
          </div>
          <span className="font-mono text-xs font-bold text-copper-700">
            {offlineQueue.length} lots pending sync
          </span>
        </div>
      )}

      {/* Primary Tab Navigation (Horizontal Scrollable for Mobile & Desktop) */}
      <div className="flex overflow-x-auto no-scrollbar gap-2 border-b-2 border-steel-300 pb-2 -mx-3 px-3 sm:mx-0 sm:px-0 flex-nowrap">
        <button
          onClick={() => setActiveTab('lots')}
          className={`flex-shrink-0 whitespace-nowrap px-4 py-2 rounded-lg font-bold text-xs flex items-center space-x-1.5 transition-all ${
            activeTab === 'lots'
              ? 'bg-copper-600 text-white shadow-tactile border border-copper-700'
              : 'bg-paper-200 text-steel-800 hover:bg-paper-300 border border-steel-300'
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>1. {t('tabLots', 'Create Lot & AI Value')}</span>
        </button>

        <button
          onClick={() => setActiveTab('priceboard')}
          className={`flex-shrink-0 whitespace-nowrap px-4 py-2 rounded-lg font-bold text-xs flex items-center space-x-1.5 transition-all ${
            activeTab === 'priceboard'
              ? 'bg-copper-600 text-white shadow-tactile border border-copper-700'
              : 'bg-paper-200 text-steel-800 hover:bg-paper-300 border border-steel-300'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>2. {t('tabPriceBoard', 'Spoken Price Board')}</span>
        </button>

        <button
          onClick={() => setActiveTab('recyclers')}
          className={`flex-shrink-0 whitespace-nowrap px-4 py-2 rounded-lg font-bold text-xs flex items-center space-x-1.5 transition-all ${
            activeTab === 'recyclers'
              ? 'bg-copper-600 text-white shadow-tactile border border-copper-700'
              : 'bg-paper-200 text-steel-800 hover:bg-paper-300 border border-steel-300'
          }`}
        >
          <Factory className="w-4 h-4" />
          <span>3. {t('tabFindRecyclers', 'Nearby Recyclers')}</span>
        </button>

        <button
          onClick={() => setActiveTab('handover')}
          className={`flex-shrink-0 whitespace-nowrap px-4 py-2 rounded-lg font-bold text-xs flex items-center space-x-1.5 transition-all ${
            activeTab === 'handover'
              ? 'bg-copper-600 text-white shadow-tactile border border-copper-700'
              : 'bg-paper-200 text-steel-800 hover:bg-paper-300 border border-steel-300'
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>4. {t('tabHandover', 'Generate QR')}</span>
        </button>

        <button
          onClick={() => setActiveTab('passbook')}
          className={`flex-shrink-0 whitespace-nowrap px-4 py-2 rounded-lg font-bold text-xs flex items-center space-x-1.5 transition-all ${
            activeTab === 'passbook'
              ? 'bg-copper-600 text-white shadow-tactile border border-copper-700'
              : 'bg-paper-200 text-steel-800 hover:bg-paper-300 border border-steel-300'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>5. {t('tabPassbook', 'Cash Passbook')}</span>
        </button>

        <button
          onClick={() => setActiveTab('safety')}
          className={`flex-shrink-0 whitespace-nowrap px-4 py-2 rounded-lg font-bold text-xs flex items-center space-x-1.5 transition-all ${
            activeTab === 'safety'
              ? 'bg-signal-500 text-white shadow-tactile border border-signal-600'
              : 'bg-paper-200 text-steel-800 hover:bg-paper-300 border border-steel-300'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>6. {t('tabSafety', 'Safety Guidance')}</span>
        </button>

        <button
          onClick={() => setActiveTab('pickups')}
          className={`flex-shrink-0 whitespace-nowrap px-4 py-2 rounded-lg font-bold text-xs flex items-center space-x-1.5 transition-all ${
            activeTab === 'pickups'
              ? 'bg-copper-600 text-white shadow-tactile border border-copper-700'
              : 'bg-paper-200 text-steel-800 hover:bg-paper-300 border border-steel-300'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>7. {t('pickups', 'Citizen Pickups')}</span>
        </button>
      </div>

      {/* TAB 1: LOT CREATION & INSTANT AI ESTIMATION */}
      {activeTab === 'lots' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          <div className="lg:col-span-7 bg-paper-50 rounded-xl p-6 border-2 border-steel-300 shadow-sm space-y-5">
            <div>
              <div className="flex items-center justify-between">
                <span className="stamp-seal stamp-verified text-xs">{t('lotCreationBadge', 'Lot Creation')}</span>
                <VoiceAssistButton
                  text="Create lot. Photograph item, enter approx weight, get instant AI valuation estimate."
                  hindiText="लॉट बनाएं। कबाड़ की फोटो लें, वजन डालें और तुरंत अनुमानित दाम देखें।"
                  marathiText="नवीन लॉट तयार करा. फोटो घ्या, वजन टाका आणि अंदाजे किंमत पहा."
                  size="sm"
                />
              </div>
              <h2 className="text-xl font-display font-black text-steel-900 mt-2">
                {t('digitalLotCreatorTitle', 'Digital E-Waste Lot Creator')}
              </h2>
              <p className="text-xs text-steel-600 font-medium">
                Photograph material, select e-waste category, specify weight, and generate a verified digital lot.
              </p>
            </div>

            {lotCreatedSuccess && (
              <div className="p-4 bg-forest-500/10 border-2 border-forest-500 rounded-lg text-xs text-forest-800 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-forest-600" />
                  <span>{t('lotCreatedSuccessTitle', 'Lot Registered Successfully!')}</span>
                </div>
                <p>{lotCreatedSuccess}</p>
              </div>
            )}

            <form onSubmit={handleCreateLot} className="space-y-4">
              
              {/* Photo Upload / Capture Simulator */}
              <div>
                <label className="block text-xs font-bold text-steel-700 uppercase tracking-wider mb-1.5">
                  {t('uploadPhotoLabel', '1. Upload or Capture Photograph')}
                </label>
                <div
                  onClick={() => setLotPhotoTaken(true)}
                  className="cursor-pointer border-2 border-dashed border-steel-400 hover:border-copper-600 rounded-lg p-6 bg-paper-100 flex flex-col items-center justify-center space-y-2 text-center transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-copper-100 text-copper-700 flex items-center justify-center">
                    <Camera className="w-6 h-6" />
                  </div>
                  {lotPhotoTaken ? (
                    <div className="text-forest-700 font-bold text-xs flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> {t('photoCapturedMsg', 'Photo Captured & Verified (1080p)')}
                    </div>
                  ) : (
                    <div>
                      <span className="text-xs font-bold text-steel-800 block">{t('tapToSnapPhoto', 'Open Camera or Snap Photo')}</span>
                      <span className="text-[11px] text-steel-500">AI automatically detects CRTs, LCDs, PCBs, Cables, Batteries</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Category Selector */}
              <div>
                <label className="block text-xs font-bold text-steel-700 uppercase tracking-wider mb-1.5">
                  2. {t('selectScrapCategory', 'Select Item Category')}
                </label>
                <select
                  value={lotCategory}
                  onChange={e => setLotCategory(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs font-bold bg-white border-2 border-steel-300 rounded-lg focus:border-copper-600 focus:outline-none"
                >
                  {priceBoardData.map(p => (
                    <option key={p.category} value={p.category}>
                      {p.category} — ₹{p.ratePerKg}/{t('perKg', 'kg')}
                    </option>
                  ))}
                </select>
              </div>

              {/* Weight Stepper (Low-Literacy Friendly +/- Buttons) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-steel-700 uppercase tracking-wider">
                    {t('approxWeightLabel', '3. Enter Approx Weight (Kilograms)')}
                  </label>
                  <span className="text-xs font-mono text-steel-500 font-medium">{t('minWeightNote', 'Minimum 0.5 kg')}</span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setLotWeight(w => Math.max(0.5, Math.round((w - 0.5) * 10) / 10))}
                    className="w-14 h-14 rounded-lg bg-paper-200 hover:bg-paper-300 border-2 border-steel-400 flex items-center justify-center text-steel-900 active:scale-95 transition-transform"
                  >
                    <Minus className="w-6 h-6" />
                  </button>

                  <div className="flex-1 bg-white border-2 border-steel-400 rounded-lg p-3 text-center">
                    <span className="text-3xl font-mono-num font-black text-steel-900">
                      {lotWeight}
                    </span>
                    <span className="text-sm font-bold text-steel-500 ml-1">kg</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setLotWeight(w => Math.round((w + 0.5) * 10) / 10)}
                    className="w-14 h-14 rounded-lg bg-copper-600 hover:bg-copper-700 text-white flex items-center justify-center shadow-tactile active:scale-95 transition-transform"
                  >
                    <Plus className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Instant Valuation Card */}
              <div className="bg-brass-100/90 border-2 border-brass-400 rounded-lg p-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-brass-800 tracking-wider block">
                    {language === 'hi' ? 'तुरंत अनुमानित मूल्य' : language === 'mr' ? 'थेट अंदाजे किंमत' : 'INSTANT AI ESTIMATE'}
                  </span>
                  <span className="text-2xl sm:text-3xl font-mono-num font-black text-steel-900">
                    {formatCurrency(aiValuation)}
                  </span>
                  <span className="text-[11px] text-steel-600 block">
                    CPCB Benchmark Rate: ₹{Math.round(aiValuation / lotWeight)}/kg
                  </span>
                </div>
                <VoiceAssistButton
                  text={`Instant value estimate: ${formatCurrency(aiValuation)} for ${lotWeight} kilograms.`}
                  hindiText={`अनुमानित मूल्य: ${lotWeight} किलो के लिए ${formatCurrency(aiValuation)}.`}
                  marathiText={`अंदाजे किंमत: ${lotWeight} किलोसाठी ${formatCurrency(aiValuation)}.`}
                  size="md"
                />
              </div>

              <button
                type="submit"
                className="w-full btn-dhatu-primary py-3.5 rounded-lg text-sm font-bold flex items-center justify-center space-x-2 shadow-tactile"
              >
                <Sparkles className="w-4 h-4" />
                <span>{language === 'hi' ? 'लॉट बनाएं और रीसायकलर को भेजें' : language === 'mr' ? 'लॉट तयार करा आणि पाठवा' : 'Generate Digital Lot & Broadcast'}</span>
              </button>
            </form>
          </div>

          {/* Right Column: Active Digital Lot Voucher Preview */}
          <div className="lg:col-span-5 space-y-4">
            <div className="receipt-stub rounded-xl p-6 border-2 border-steel-400 shadow-sm space-y-4">
              <div className="flex justify-between items-start border-b border-steel-300 pb-3">
                <div>
                  <span className="stamp-seal stamp-verified text-[11px]">CPCB LOT VOUCHER</span>
                  <div className="font-display font-black text-xl text-steel-900 mt-1">
                    {handoverLotCode}
                  </div>
                  <span className="text-[11px] text-steel-500 font-mono">Collector: Suresh Kumar</span>
                </div>
                <div className="w-16 h-16 bg-white border border-steel-300 p-1 rounded flex items-center justify-center">
                  <QrCode className="w-14 h-14 text-steel-900" />
                </div>
              </div>

              <div className="space-y-2 text-xs font-mono text-steel-800 bg-paper-100 p-3 rounded border border-paper-300">
                <div className="flex justify-between">
                  <span className="text-steel-500">Material Category:</span>
                  <span className="font-bold">{lotCategory.slice(0, 22)}...</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-steel-500">Approx Weight:</span>
                  <span className="font-bold">{lotWeight} kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-steel-500">Benchmark Rate:</span>
                  <span className="font-bold text-copper-600">₹{Math.round(aiValuation / lotWeight)}/kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-steel-500">Estimated Value:</span>
                  <span className="font-bold text-forest-700">{formatCurrency(aiValuation)}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-paper-300 text-[10px] text-steel-500">
                  <span>GPS Lat/Lng:</span>
                  <span>28.5685, 77.2412</span>
                </div>
              </div>

              <div className="text-[11px] text-steel-600 p-2.5 bg-paper-200 rounded border border-steel-300 space-y-1">
                <div className="font-bold text-steel-800 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-forest-600" />
                  <span>Traceability Record Sealed</span>
                </div>
                <p>
                  This lot is broadcasted to verified recyclers. Present the QR code upon vehicle delivery to claim instant cash or wallet credit.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('handover')}
                className="w-full bg-paper-200 hover:bg-paper-300 text-steel-900 border-2 border-steel-400 py-2 rounded text-xs font-bold flex items-center justify-center space-x-1.5"
              >
                <span>{language === 'hi' ? 'हैंडओवर रसीद खोलें' : language === 'mr' ? 'हस्तांतरण पावती उघडा' : 'Open Handover QR'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quick Segregation Tip */}
            <div className="p-4 bg-paper-100 rounded-xl border border-steel-300 space-y-1 text-xs">
              <span className="font-bold text-copper-700 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> {language === 'hi' ? 'कमाई बढ़ाने का सुझाव:' : language === 'mr' ? 'कमाई वाढवण्यासाठी टीप:' : 'High-Value Separation Tip:'}
              </span>
              <p className="text-steel-600">
                {language === 'hi' ? 'सर्किट बोर्ड से एल्यूमीनियम हीट सिंक को हाथ से अलग करके बेचें। इससे बोर्ड को ग्रेड-ए (₹640/kg) दाम मिलता है।' : language === 'mr' ? 'सर्किट बोर्डमधून अ‍ॅल्युमिनियम हीट सिंक हाताने वेगळे करून विका. यामुळे बोर्डाला ग्रेड-ए (₹६४०/कि.ग्रा.) भाव मिळतो.' : 'Detach aluminium heat sinks from circuit boards by hand before selling. Intact Grade-A boards command premium ₹640/kg.'}
              </p>
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: SPOKEN PRICE BOARD WITH TRENDS */}
      {activeTab === 'priceboard' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-steel-300 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="stamp-seal stamp-verified text-xs">{t('tabPriceBoard', 'Price Board')}</span>
                <VoiceAssistButton
                  text="Live e-waste price board. Buying rates by category and weekly trend in Delhi NCR."
                  hindiText="लाइव ई-कचरा दाम पत्रक। दिल्ली एनसीआर में आज के खरीदारी दाम और साप्ताहिक रुझान।"
                  marathiText="थेट ई-कचरा भाव फलक. दिल्ली परिसरातील आजचे खरेदी दर आणि साप्ताहिक कल."
                  size="sm"
                />
              </div>
              <h2 className="text-xl font-display font-black text-steel-900 mt-1">
                {t('mandiPriceBoardTitle', 'Live Material Benchmark Price Board')}
              </h2>
              <p className="text-xs text-steel-600 font-medium">
                Official CPCB market benchmark rates. Tap the speaker icon beside any item to hear the price aloud.
              </p>
            </div>

            <span className="text-xs font-mono text-steel-600 bg-paper-200 px-3 py-1.5 rounded border border-steel-300 self-start sm:self-auto">
              {language === 'hi' ? 'अंतिम अपडेट: आज सुबह 09:00 AM' : language === 'mr' ? 'शेवटचे अपडेट: आज सकाळी ०९:००' : 'Last updated: Today 09:00 AM'}
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
                      text={`${item.category}. Current rate is rupees ${item.ratePerKg} per kilogram. ${item.trend === 'UP' ? 'Price increased by rupees ' + item.delta : 'Price stable'}`}
                      hindiText={`${item.category}। आज का ताजा मंडी भाव ${item.ratePerKg} रुपये प्रति किलो है। ${item.delta > 0 ? 'दाम ' + item.delta + ' रुपये बढ़ा है।' : ''}`}
                      marathiText={`${item.category}. आजचा थेट बाजार भाव ${item.ratePerKg} रुपये प्रति किलो आहे. ${item.delta > 0 ? 'भाव ' + item.delta + ' रुपये वाढला आहे.' : ''}`}
                      size="sm"
                    />
                  </div>

                  <h3 className="font-display font-black text-steel-900 text-sm mt-1 leading-snug">
                    {item.category}
                  </h3>
                  <p className="text-[11px] text-steel-500 mt-1">
                    {item.desc}
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

          <div className="p-4 bg-paper-200 rounded-lg border border-steel-300 text-xs text-steel-700 flex items-center justify-between">
            <span className="font-medium">
              {language === 'hi' ? '💡 पारदर्शी दाम नीति: कोई बिचौलिया कटौती नहीं। रीसायकलर से सीधा 100% भुगतान।' : language === 'mr' ? '💡 पारदर्शक दर धोरण: कोणतीही दलाली कपात नाही. थेट १००% दर.' : '💡 Transparent Pricing Policy: Zero middleman commission. Direct 100% payout from smelters.'}
            </span>
            <span className="font-mono text-steel-500 text-[11px]">CPCB Market Index 2026</span>
          </div>
        </div>
      )}

      {/* TAB 3: RECYCLER DISCOVERY & RANKING */}
      {activeTab === 'recyclers' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-steel-300 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="stamp-seal stamp-verified text-xs">{t('tabFindRecyclers', 'Recyclers')}</span>
                <VoiceAssistButton
                  text="Nearby authorized recyclers. Ranked by distance, rate offered, and pickup availability."
                  hindiText="पास के अधिकृत रीसायकलर। दूरी, दिए जाने वाले दाम और पिकअप सुविधा के आधार पर क्रमबद्ध।"
                  marathiText="जवळचे अधिकृत रीसायकलर. अंतर आणि दरांच्या आधारे क्रमवारी."
                  size="sm"
                />
              </div>
              <h2 className="text-xl font-display font-black text-steel-900 mt-1">
                {t('nearbyRecyclersTitle', 'Authorized Recyclers & Smelters')}
              </h2>
              <p className="text-xs text-steel-600 font-medium">
                Verified CPCB registered facilities matching your operating area in Delhi NCR.
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
                center={[28.5550, 77.2700]}
                zoom={12}
                markers={nearbyRecyclers.map(r => ({
                  id: r.id,
                  lat: r.id === 'rec-1' ? 28.5355 : r.id === 'rec-2' ? 28.5820 : 28.6280,
                  lng: r.id === 'rec-1' ? 77.2732 : r.id === 'rec-2' ? 77.2210 : 77.3010,
                  title: r.name,
                  subtitle: `${r.cpcbReg} • ${r.location}`,
                  iconEmoji: '🏭',
                  badge: `★ ${r.rating}`,
                  color: '#3B6B4E'
                }))}
                height="100%"
              />
            </div>
          </div>

          <div className="space-y-4">
            {nearbyRecyclers.map((rec, idx) => (
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
                  </div>

                  <h3 className="font-display font-black text-lg text-steel-900">
                    {rec.name}
                  </h3>

                  <p className="text-xs text-steel-600 flex items-center gap-1 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-copper-600" />
                    <span>{rec.location}</span>
                    <span className="font-mono text-copper-700 font-bold">({rec.distanceKm} km away)</span>
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

                  <div className="flex gap-2">
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
            ))}
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
                <span className="font-bold text-steel-800">KC-COL-8921 (Suresh)</span>
              </div>
              <div>
                <span className="text-[10px] text-steel-500 block">HANDOVER RECIPIENT</span>
                <span className="font-bold text-steel-800">EcoRecycle (Okhla Ph-II)</span>
              </div>
              <div>
                <span className="text-[10px] text-steel-500 block">ESTIMATED VALUE</span>
                <span className="font-bold text-forest-700">₹8,000 ({language === 'hi' ? 'नकद / UPI' : language === 'mr' ? 'रोख / UPI' : 'Cash / UPI Escrow'})</span>
              </div>
              <div>
                <span className="text-[10px] text-steel-500 block">TIMESTAMP</span>
                <span className="font-bold text-steel-800">08-SEP-2026 11:30 AM</span>
              </div>
            </div>

            <div className="text-[11px] text-steel-600 flex items-center gap-1.5 p-2 bg-paper-200 rounded border border-steel-300">
              <ShieldCheck className="w-4 h-4 text-forest-600 flex-shrink-0" />
              <span>
                {language === 'hi' ? 'रीसायकलर द्वारा स्कैन करते ही यह रसीद सीपीसीबी ईपीआर पोर्टल पर दर्ज हो जाती है।' : language === 'mr' ? 'रीसायकलरने स्कॅन करताच ही पावती सीपीसीबी पोर्टलवर नोंदवली जाते.' : 'Upon recycler QR scan, this lot is immediately sealed on the CPCB central registry.'}
              </span>
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
              <span className="text-xl font-bold text-brass-400">₹14,680</span>
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

      {/* TAB 6: SAFETY GUIDANCE & SEGREGATION CARDS */}
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
              onClick={loadPickups}
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
                  <p className="text-xs text-steel-600">Citizen: {activeJob.citizen?.name || 'Ramesh Sharma'}</p>
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
                        <span className="text-xs font-bold text-steel-800 block">{preserveEnglishItemName(item.category)}</span>
                        <span className="text-[10px] text-steel-500">Rate: ₹{item.ratePerKg}/kg</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const cur = itemWeights[item.category] || item.estWeightKg;
                            setItemWeights({ ...itemWeights, [item.category]: Math.max(0.5, cur - 0.5) });
                          }}
                          className="w-8 h-8 rounded bg-paper-200 border border-steel-400 flex items-center justify-center font-bold text-steel-800"
                        >
                          -
                        </button>
                        <span className="font-mono text-sm font-bold text-steel-900 w-12 text-center">
                          {itemWeights[item.category] || item.estWeightKg} kg
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const cur = itemWeights[item.category] || item.estWeightKg;
                            setItemWeights({ ...itemWeights, [item.category]: cur + 0.5 });
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
          <div className="receipt-stub rounded-xl p-4 border-2 border-steel-300 shadow-sm space-y-2">
            <div className="font-display font-bold text-steel-800 text-sm flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-copper-600" />
                <span>{language === 'hi' ? 'लाइव कबाड़ पिकअप मैप (दिल्ली एनसीआर)' : language === 'mr' ? 'थेट भंगार पिकअप नकाशा' : 'Live e-Waste Pickups Map (Delhi NCR)'}</span>
              </span>
              <span className="text-xs font-mono text-copper-700 bg-paper-200 px-2.5 py-0.5 rounded border border-steel-300 font-bold">
                {nearbyPickups.length} Nearby Requests (15km)
              </span>
            </div>
            <div className="h-60 sm:h-72 rounded-lg overflow-hidden border border-steel-300">
              <LeafletMap
                center={[28.5685, 77.2412]}
                zoom={13}
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
                    <span className="font-mono text-xs font-bold text-copper-700">Ref #{pickup.id.slice(0, 8)}</span>
                    <span className="text-[10px] font-mono text-steel-500 font-medium">{pickup.scheduledAt.slice(11, 16)}</span>
                  </div>

                  <h4 className="font-display font-bold text-steel-900 text-sm">
                    {pickup.address}
                  </h4>

                  <div className="mt-2 space-y-1 text-xs text-steel-600">
                    <p>{t('citizenName')}: <strong>{pickup.citizen?.name || 'Ramesh Sharma'}</strong></p>
                    <p>{t('itemsDeclared')}: <strong>{pickup.items.map(i => `${preserveEnglishItemName(i.category)} (~${i.estWeightKg}kg)`).join(', ')}</strong></p>
                  </div>
                </div>

                <div className="pt-2 border-t border-steel-200 flex items-center justify-between">
                  <span className="font-mono font-bold text-copper-700 text-sm">
                    {t('estimatedPayout')}: ₹{pickup.totalAmount || 620}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleAcceptPickup(pickup)}
                    className="btn-dhatu-primary px-4 py-1.5 rounded text-xs font-bold flex items-center space-x-1"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>{t('acceptPickup')}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MOBILE BOTTOM TAB BAR (Thumb-Reachable, Low-Literacy Optimized ≥48px touch targets) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-paper-50/95 backdrop-blur-md border-t-2 border-steel-400 px-1 py-1 shadow-tactile-lg">
        <div className="grid grid-cols-6 gap-0.5 text-center">
          <button
            onClick={() => setActiveTab('lots')}
            className={`min-h-[48px] py-1 rounded flex flex-col items-center justify-center text-[10px] font-bold ${
              activeTab === 'lots' ? 'text-copper-700 bg-paper-200' : 'text-steel-600'
            }`}
          >
            <Camera className="w-4 h-4 mb-0.5" />
            <span className="truncate">{t('tabLots', 'Lots')}</span>
          </button>

          <button
            onClick={() => setActiveTab('priceboard')}
            className={`min-h-[48px] py-1 rounded flex flex-col items-center justify-center text-[10px] font-bold ${
              activeTab === 'priceboard' ? 'text-copper-700 bg-paper-200' : 'text-steel-600'
            }`}
          >
            <TrendingUp className="w-4 h-4 mb-0.5" />
            <span className="truncate">{t('tabPriceBoard', 'Prices')}</span>
          </button>

          <button
            onClick={() => setActiveTab('pickups')}
            className={`min-h-[48px] py-1 rounded flex flex-col items-center justify-center text-[10px] font-bold ${
              activeTab === 'pickups' ? 'text-copper-700 bg-paper-200' : 'text-steel-600'
            }`}
          >
            <Truck className="w-4 h-4 mb-0.5" />
            <span className="truncate">{t('pickups', 'Pickups')}</span>
          </button>

          <button
            onClick={() => setActiveTab('recyclers')}
            className={`min-h-[48px] py-1 rounded flex flex-col items-center justify-center text-[10px] font-bold ${
              activeTab === 'recyclers' ? 'text-copper-700 bg-paper-200' : 'text-steel-600'
            }`}
          >
            <Factory className="w-4 h-4 mb-0.5" />
            <span className="truncate">{t('tabFindRecyclers', 'Recyclers')}</span>
          </button>

          <button
            onClick={() => setActiveTab('passbook')}
            className={`min-h-[48px] py-1 rounded flex flex-col items-center justify-center text-[10px] font-bold ${
              activeTab === 'passbook' ? 'text-copper-700 bg-paper-200' : 'text-steel-600'
            }`}
          >
            <BookOpen className="w-4 h-4 mb-0.5" />
            <span className="truncate">{t('tabPassbook', 'Passbook')}</span>
          </button>

          <button
            onClick={() => setActiveTab('safety')}
            className={`min-h-[48px] py-1 rounded flex flex-col items-center justify-center text-[10px] font-bold ${
              activeTab === 'safety' ? 'text-signal-600 bg-paper-200' : 'text-steel-600'
            }`}
          >
            <AlertTriangle className="w-4 h-4 mb-0.5" />
            <span className="truncate">{t('tabSafety', 'Safety')}</span>
          </button>
        </div>
      </div>

    </div>
  );
};
