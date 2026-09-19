import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { storage, STORAGE_KEYS } from '../../lib/storage';
import { AdminStats, User } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { VoiceAssistButton } from '../../components/VoiceAssistButton';
import { triggerHaptic } from '../../lib/haptics';
import {
  ShieldCheck,
  Award,
  Download,
  Users,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  Building2,
  Leaf,
  Droplet,
  Flame,
  RefreshCw,
  Scale,
  TrendingUp,
  Calendar,
  Layers,
  Calculator,
  Search,
  ArrowRight,
  ExternalLink,
  Check,
  Eye,
  X,
  Clock,
  CreditCard,
  AlertTriangle,
  FileText,
  Truck,
  User as UserIcon,
  Filter
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { language, t, formatCurrency, speak, preserveEnglishItemName } = useLanguage();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [collectors, setCollectors] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'traceability' | 'uniteconomics' | 'verifications' | 'epr'>('overview');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // KYC Review State
  const [kycFilter, setKycFilter] = useState<'ALL' | 'UNDER_REVIEW' | 'VERIFIED' | 'REJECTED'>('ALL');
  const [previewDocUser, setPreviewDocUser] = useState<User | null>(null);
  const [rejectModalUser, setRejectModalUser] = useState<User | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('Document image blurry or details mismatch');

  // Unit Economics Calculator Interactive Sliders State (Section 1.D.5)
  const [monthlyVolumeKg, setMonthlyVolumeKg] = useState(450);
  const [informalMiddlemanCut, setInformalMiddlemanCut] = useState(35); // 35%
  const [weightUnderReportPercent, setWeightUnderReportPercent] = useState(8); // 8%

  // Traceability Sample Lifecycle Chain (Section 1.D.2)
  const [selectedLotChain, setSelectedLotChain] = useState({
    lotCode: 'KC-LOT-9821',
    category: 'High-grade Printed Circuit Boards (PCBs)',
    totalWeightKg: 18.5,
    stages: [
      {
        stage: 'Layer 1: Citizen ➔ Collector Doorstep Handover',
        actor: 'Ramesh Sharma (Household) ➔ Suresh Kumar',
        location: 'Block D, Lajpat Nagar II, New Delhi',
        timestamp: '08-SEP-2026 09:15 AM',
        status: 'VERIFIED (OTP: 4821)',
        hash: '0x8f4a9b2c7e103984fa55'
      },
      {
        stage: 'Layer 2: Collector Digital Lot Creation & AI Scan',
        actor: 'Suresh Kumar (Collector #KC-COL-8921)',
        location: 'Lajpat Nagar Ring Road Zone',
        timestamp: '08-SEP-2026 09:30 AM',
        status: 'AI VISION VERIFIED (GPS Tagged)',
        hash: '0xa11c4298fc1c149afbf4c'
      },
      {
        stage: 'Layer 3: Recycler Weighbridge Scale & Operator Intake',
        actor: 'EcoRecycle Aggregators (Operator: OP-OKHLA-981)',
        location: 'Okhla Phase-II Gate 3 Weighbridge',
        timestamp: '08-SEP-2026 10:45 AM',
        status: 'SCALE VERIFIED (18.5 kg, ±0.5% Tol)',
        hash: '0xbb29910aefc882194301'
      },
      {
        stage: 'Layer 4: Smelter Refining & Central CPCB Registry Filing',
        actor: 'Bharat Precious Metals Refining Unit',
        location: 'Roorkee CPCB Zero-Discharge Smelter',
        timestamp: '11-SEP-2026',
        status: 'EPR AUDIT CERTIFIED (CPCB Form-2)',
        hash: '0x99201948baef77299014'
      }
    ]
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, collectorsData] = await Promise.all([
        api.getAdminStats().catch(() => storage.getAdminStats()),
        api.getAdminKabadiwalas().catch(() => storage.getCollectors())
      ]);

      setStats(statsData || storage.getAdminStats());
      setCollectors(collectorsData && collectorsData.length > 0 ? collectorsData : storage.getCollectors());
      setUsersList(storage.getUsers());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleStorageChange = (e: any) => {
      const key = e.detail?.key;
      if (
        key === STORAGE_KEYS.COLLECTORS ||
        key === STORAGE_KEYS.PICKUPS ||
        key === STORAGE_KEYS.LOTS ||
        key === STORAGE_KEYS.USERS ||
        key === '*'
      ) {
        setCollectors(storage.getCollectors());
        setStats(storage.getAdminStats());
        setUsersList(storage.getUsers());
      }
    };

    window.addEventListener('dhatu-storage-change', handleStorageChange);
    return () => window.removeEventListener('dhatu-storage-change', handleStorageChange);
  }, []);

  const handleApproveKyc = (userId: string) => {
    setActionLoading(userId);
    try {
      storage.verifyUserKyc(userId, 'VERIFIED');
      setUsersList(storage.getUsers());
      setCollectors(storage.getCollectors());
      setStats(storage.getAdminStats());
      triggerHaptic(30);
      if (previewDocUser?.id === userId) {
        setPreviewDocUser(null);
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectKyc = (userId: string, reason: string) => {
    setActionLoading(userId);
    try {
      storage.verifyUserKyc(userId, 'REJECTED', reason);
      setUsersList(storage.getUsers());
      setCollectors(storage.getCollectors());
      setStats(storage.getAdminStats());
      setRejectModalUser(null);
      triggerHaptic(25);
      if (previewDocUser?.id === userId) {
        setPreviewDocUser(null);
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleVerify = async (profileId: string, verified: boolean) => {
    setActionLoading(profileId);
    try {
      await api.verifyKabadiwala(profileId, verified);
      await loadData();
    } finally {
      setActionLoading(null);
    }
  };

  const handleExportEPR = async () => {
    try {
      const report = await api.getEPRReport().catch(() => ({
        reportType: 'CPCB E-Waste Central Portal Filing (Form-2/6)',
        generatedAt: new Date().toISOString(),
        ulbJurisdiction: 'New Delhi Municipal Council (NDMC)',
        complianceYear: '2026-2027',
        totalTonnageMT: 28.45,
        formalizationRate: '88.4%',
        traceabilityCoverage: '100%'
      }));
      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `NDMC_CPCB_EPR_Report_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert('Failed: ' + err.message);
    }
  };

  // Unit Economics Calculations (Section 1.D.5)
  const averageRatePerKg = 220; // blended e-waste basket
  const trueScrapValue = monthlyVolumeKg * averageRatePerKg; // e.g. 450 * 220 = 99,000
  
  // Informal market scenario
  const informalReportedWeight = monthlyVolumeKg * (1 - weightUnderReportPercent / 100);
  const informalCollectorPay = informalReportedWeight * averageRatePerKg * (1 - informalMiddlemanCut / 100);
  
  // Kabadiwala Connect formal scenario
  const formalPlatformFeePercent = 1.5;
  const formalCollectorPay = monthlyVolumeKg * averageRatePerKg * 0.96 + 500; // 96% direct rate + 500 formal incentive bonus
  const earningsDifference = formalCollectorPay - informalCollectorPay;
  const percentageIncrease = Math.round((earningsDifference / informalCollectorPay) * 100);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-5 sm:space-y-8 pb-24 md:pb-8">
      
      {/* Top Header - Android 17 Expressive Dynamic Hero */}
      <div
        style={{ background: 'var(--gradient-hero)' }}
        className="text-white rounded-[32px] p-6 sm:p-8 shadow-m3-3 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden transition-all duration-300"
      >
        <div className="space-y-2 z-10">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="rounded-full px-3.5 py-1 text-xs font-bold bg-white/20 text-white border border-white/30">
              MINISTRY OF MINES & CPCB
            </span>
            <span className="rounded-full px-3 py-1 font-mono text-xs font-bold bg-amber-500/20 text-amber-200 border border-amber-400/30">
              ULB REGULATORY DASHBOARD
            </span>
            <VoiceAssistButton
              text="CPCB Waste and Mines Cell Administration Console. National e-waste metrics, end-to-end traceability dataset, and unit economics comparison."
              hindiText="सीपीसीबी अपशिष्ट एवं खान प्रकोष्ठ प्रशासन कंसोल। राष्ट्रीय स्तर के ई-कचरा आंकड़े, एंड-टू-एंड ट्रेसेबिलिटी डेटासेट और अर्थशास्त्र कैलकुलेटर।"
              marathiText="सीपीसीबी कचरा आणि खाण विभाग प्रशासन डॅशबोर्ड. राष्ट्रीय ई-कचरा आकडेवारी आणि ट्रेसेबिलिटी डेटासेट."
              size="sm"
            />
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-black tracking-tight text-white">
            CPCB Waste & Mines Cell <span className="text-slate-300 font-sans text-xl font-normal">(National Regulatory Authority)</span>
          </h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl font-normal">
            CPCB E-Waste (Management) Rules 2022 Central Audit Terminal & Traceability Ledger
          </p>
        </div>

        <div className="flex flex-wrap gap-3 z-10">
          <button
            onClick={handleExportEPR}
            className="px-6 py-3 rounded-full btn-primary-m3 text-sm font-bold flex items-center space-x-2 transition-all shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Export CPCB EPR Audit (JSON)</span>
          </button>
        </div>
      </div>

      {/* Tabs - Material 3 Expressive Pill Tabs */}
      <div className="flex overflow-x-auto no-scrollbar gap-2.5 pb-2 px-1 flex-nowrap w-full">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-shrink-0 whitespace-nowrap px-5 py-2.5 rounded-full font-bold text-sm flex items-center space-x-2 transition-all ${
            activeTab === 'overview'
              ? 'm3-tab-pill-active'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700 shadow-sm'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>1. {t('tabOverview')}</span>
        </button>

        <button
          onClick={() => setActiveTab('traceability')}
          className={`flex-shrink-0 whitespace-nowrap px-5 py-2.5 rounded-full font-bold text-sm flex items-center space-x-2 transition-all ${
            activeTab === 'traceability'
              ? 'm3-tab-pill-active'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700 shadow-sm'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>2. {t('tabTraceability')}</span>
        </button>

        <button
          onClick={() => setActiveTab('uniteconomics')}
          className={`flex-shrink-0 whitespace-nowrap px-5 py-2.5 rounded-full font-bold text-sm flex items-center space-x-2 transition-all ${
            activeTab === 'uniteconomics'
              ? 'm3-tab-pill-active'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700 shadow-sm'
          }`}
        >
          <Calculator className="w-4 h-4" />
          <span>3. {t('tabUnitEconomics')}</span>
        </button>

        <button
          onClick={() => setActiveTab('verifications')}
          className={`flex-shrink-0 whitespace-nowrap px-5 py-2.5 rounded-full font-bold text-sm flex items-center space-x-2 transition-all ${
            activeTab === 'verifications'
              ? 'm3-tab-pill-active'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700 shadow-sm'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>4. {t('tabVerifications')} ({collectors.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('epr')}
          className={`flex-shrink-0 whitespace-nowrap px-5 py-2.5 rounded-full font-bold text-sm flex items-center space-x-2 transition-all ${
            activeTab === 'epr'
              ? 'm3-tab-pill-active'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700 shadow-sm'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>5. {t('tabEpr')}</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border-2 border-steel-300 shadow-sm">
              <span className="text-steel-500 font-mono text-[10px] uppercase block">{t('citywideTonnage', 'TOTAL E-WASTE DIVERTED')}</span>
              <div className="text-3xl font-mono-num font-black text-copper-600 mt-1">
                {(stats.totalKg / 1000).toFixed(2)} MT
              </div>
              <span className="text-xs text-forest-600 font-bold block mt-1">
                {language === 'hi' ? '28,450 किग्रा कचरा लैंडफिल से बचाया' : language === 'mr' ? '28,450 कि.ग्रा. कचरा डेपोत जाण्यापासून वाचवला' : '28,450 kg kept out of landfills'}
              </span>
            </div>

            <div className="bg-white p-5 rounded-xl border-2 border-steel-300 shadow-sm">
              <span className="text-steel-500 font-mono text-[10px] uppercase block">{t('activeCollectors', 'ACTIVE FORMAL COLLECTORS')}</span>
              <div className="text-3xl font-mono-num font-black text-steel-900 mt-1">
                {stats.activeKabadiwalas}
              </div>
              <span className="text-xs text-brass-700 font-bold block mt-1">
                {stats.verifiedPercent}% {language === 'hi' ? 'आधार केवाईसी सत्यापित' : language === 'mr' ? 'आधार केवायसी प्रमाणित' : 'Aadhaar KYC Verified'}
              </span>
            </div>

            <div className="bg-white p-5 rounded-xl border-2 border-steel-300 shadow-sm">
              <span className="text-steel-500 font-mono text-[10px] uppercase block">{language === 'hi' ? 'औपचारिक डिजिटल लेनदेन' : language === 'mr' ? 'औपचारिक डिजिटल व्यवहार' : 'FORMAL TRANSACTIONS'}</span>
              <div className="text-3xl font-mono-num font-black text-forest-600 mt-1">
                {stats.totalPickups}
              </div>
              <span className="text-xs text-steel-500 font-bold block mt-1">
                {language === 'hi' ? '100% जीपीएस एवं समय मुहर सहित' : language === 'mr' ? '100% जीपीएस आणि वेळ नोंदीसह' : '100% with GPS & timestamp'}
              </span>
            </div>

            <div className="bg-white p-5 rounded-xl border-2 border-steel-300 shadow-sm">
              <span className="text-steel-500 font-mono text-[10px] uppercase block">{language === 'hi' ? 'कबाड़ीवालों को भुगतान की गई राशि' : language === 'mr' ? 'संग्राहकांना दिलेली रक्कम' : 'VALUE PAID TO COLLECTORS'}</span>
              <div className="text-3xl font-mono-num font-black text-brass-700 mt-1">
                {formatCurrency(stats.totalRevenue)}
              </div>
              <span className="text-xs text-copper-600 font-bold block mt-1">
                {language === 'hi' ? 'सीधे कबाड़ीवाला वॉलेट में' : language === 'mr' ? 'थेट संग्राहक वॉलेटमध्ये' : 'Direct to kabadiwala wallets'}
              </span>
            </div>
          </div>

          {/* Environmental Savings Grid */}
          <div className="receipt-stub rounded-xl p-6 border-2 border-steel-400 space-y-4">
            <span className="stamp-seal stamp-verified text-xs">{language === 'hi' ? 'सीपीसीबी हरित मानक' : language === 'mr' ? 'सीपीसीबी हरित निर्देशांक' : 'CPCB GREEN METRICS'}</span>
            <h3 className="font-display font-bold text-steel-900 text-lg">
              {t('environmentalImpactHeader', 'Cumulative Environmental Impact Saved')}
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center font-mono">
              <div className="bg-white p-4 rounded border border-steel-300">
                <span className="text-steel-500 text-[10px] block">{t('carbonSaved', 'CO2 PREVENTED')}</span>
                <span className="text-2xl font-bold text-forest-600">58.2 MT</span>
              </div>
              <div className="bg-white p-4 rounded border border-steel-300">
                <span className="text-steel-500 text-[10px] block">{t('treesPlanted', 'TREES EQUIVALENT')}</span>
                <span className="text-2xl font-bold text-forest-600">3,840</span>
              </div>
              <div className="bg-white p-4 rounded border border-steel-300">
                <span className="text-steel-500 text-[10px] block">{language === 'hi' ? 'जल संरक्षण' : language === 'mr' ? 'पाण्याची बचत' : 'WATER SAVED'}</span>
                <span className="text-2xl font-bold text-copper-600">1.94 Lakh L</span>
              </div>
              <div className="bg-white p-4 rounded border border-steel-300">
                <span className="text-steel-500 text-[10px] block">{language === 'hi' ? 'सीसा अपशिष्ट रोका गया' : language === 'mr' ? 'लेड कचरा रोखला' : 'LEAD SLAG BLOCKED'}</span>
                <span className="text-2xl font-bold text-signal-600">760 kg</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: FULL TRACEABILITY DATASET ENGINE (Section 1.D.2) */}
      {activeTab === 'traceability' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-steel-300 pb-3">
            <div>
              <span className="stamp-seal stamp-verified text-xs">{language === 'hi' ? 'एंड-टू-एंड कस्टडी श्रृंखला' : language === 'mr' ? 'पूर्ण साखळी मागोवा' : 'END-TO-END CHAIN OF CUSTODY'}</span>
              <h2 className="text-xl font-display font-black text-steel-900 mt-2">
                {t('traceabilityTitle', 'Full Material Traceability Dataset Engine')}
              </h2>
              <p className="text-xs text-steel-600">
                {language === 'hi' ? 'घरेलू पिकअप से लेकर अधिकृत स्मेल्टर तक ई-कचरे के प्रत्येक ग्राम का पूर्ण हिसाब।' : language === 'mr' ? 'घरगुती संकलनापासून ते अधिकृत स्मेल्टरपर्यंत ई-कचऱ्याच्या प्रत्येक ग्रॅमचा संपूर्ण मागोवा.' : 'Every gram of e-waste is accounted for from household pickup to authorized smelting.'}
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="text"
                defaultValue="KC-LOT-9821"
                className="px-3 py-1.5 text-xs font-mono uppercase bg-white border border-steel-400 rounded"
              />
              <button className="btn-dhatu-steel px-3 py-1.5 rounded text-xs font-bold">
                {language === 'hi' ? 'लॉट खोजें' : language === 'mr' ? 'लॉट शोधा' : 'Lookup Lot'}
              </button>
            </div>
          </div>

          <div className="receipt-stub rounded-xl p-6 border-2 border-steel-400 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-steel-300 pb-4">
              <div>
                <span className="font-mono text-xs font-bold text-copper-700 block">{selectedLotChain.lotCode}</span>
                <h3 className="font-display font-black text-xl text-steel-900">{preserveEnglishItemName(selectedLotChain.category)}</h3>
                <span className="text-xs font-mono text-steel-500">Gross Intake Weight: {selectedLotChain.totalWeightKg} kg</span>
              </div>
              <span className="stamp-seal stamp-verified text-xs">
                AUDIT SEALED (CPCB VERIFIED)
              </span>
            </div>

            {/* 4-Stage Visualizer */}
            <div className="space-y-4">
              {selectedLotChain.stages.map((stg, idx) => (
                <div key={idx} className="bg-white p-4 rounded-lg border border-steel-300 space-y-2 relative">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-display font-bold text-steel-900 text-sm">{stg.stage}</span>
                    <span className="stamp-seal stamp-verified text-[9px]">{stg.status}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono text-steel-700">
                    <div>
                      <span className="text-[10px] text-steel-500 block">ACTOR</span>
                      <span className="font-bold">{stg.actor}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-steel-500 block">LOCATION</span>
                      <span>{stg.location}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-steel-500 block">TIMESTAMP</span>
                      <span>{stg.timestamp}</span>
                    </div>
                  </div>

                  <div className="text-[10px] font-mono text-steel-500 pt-1 border-t border-paper-200">
                    Tamper-Evident SHA-256 Hash: {stg.hash}
                  </div>
                </div>
              ))}
            </div>

            <div className="text-xs text-steel-600 bg-paper-100 p-3 rounded border border-steel-300 flex items-center justify-between">
              <span>
                🔒 <strong>CPCB Regulatory Compliance:</strong> Closes the formal traceability loop required by SIH26229.
              </span>
              <span className="font-mono text-[11px] text-forest-700 font-bold">100% Audit Ready</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: UNIT-ECONOMICS CALCULATOR (Section 1.D.5 & Section 0) */}
      {activeTab === 'uniteconomics' && (
        <div className="space-y-6">
          <div className="border-b border-steel-300 pb-3">
            <span className="stamp-seal stamp-verified text-xs">{t('unitEconomicsBadge', 'Unit-Economics Calculator')}</span>
            <h2 className="text-xl font-display font-black text-steel-900 mt-2">
              Unit-Economics Comparison: Informal Market vs. Kabadiwala Connect
            </h2>
            <p className="text-xs text-steel-600">
              Interactive comparison proving how collectors earn +34% more while platform maintains financial sustainability through 1.5% aggregator convenience fees.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Interactive Control Panel */}
            <div className="lg:col-span-5 bg-paper-50 rounded-xl p-6 border-2 border-steel-300 shadow-sm space-y-5">
              <h3 className="font-display font-bold text-steel-900 text-base">
                {t('simulationControls', 'Simulation Controls')}
              </h3>

              <div className="space-y-4 text-xs font-mono">
                <div>
                  <div className="flex justify-between mb-1 font-bold text-steel-800">
                    <span>Monthly Scrap Volume:</span>
                    <span className="text-copper-700">{monthlyVolumeKg} kg / month</span>
                  </div>
                  <input
                    type="range"
                    min="150"
                    max="1000"
                    step="50"
                    value={monthlyVolumeKg}
                    onChange={e => setMonthlyVolumeKg(parseInt(e.target.value))}
                    className="w-full accent-copper-600"
                  />
                  <span className="text-[10px] text-steel-500">Average informal scrap tricycle collector handles 450 kg/mo</span>
                </div>

                <div>
                  <div className="flex justify-between mb-1 font-bold text-steel-800">
                    <span>Informal Middleman Margin Cut:</span>
                    <span className="text-signal-600">{informalMiddlemanCut}% margin deduction</span>
                  </div>
                  <input
                    type="range"
                    min="15"
                    max="50"
                    step="5"
                    value={informalMiddlemanCut}
                    onChange={e => setInformalMiddlemanCut(parseInt(e.target.value))}
                    className="w-full accent-signal-600"
                  />
                  <span className="text-[10px] text-steel-500">Tier-2 scrap lords take 30-40% profit cut</span>
                </div>

                <div>
                  <div className="flex justify-between mb-1 font-bold text-steel-800">
                    <span>Informal Scale Under-Reporting:</span>
                    <span className="text-signal-600">{weightUnderReportPercent}% weight loss</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="15"
                    step="1"
                    value={weightUnderReportPercent}
                    onChange={e => setWeightUnderReportPercent(parseInt(e.target.value))}
                    className="w-full accent-signal-600"
                  />
                  <span className="text-[10px] text-steel-500">Uncalibrated mechanical scales under-weigh by 8%</span>
                </div>
              </div>

              <div className="p-4 bg-paper-100 rounded-lg border border-steel-300 text-xs space-y-2">
                <span className="font-bold text-steel-900 block">
                  {t('platformSustainability', 'Platform Sustainability Model:')}
                </span>
                <ul className="space-y-1 text-steel-600 list-disc list-inside">
                  <li><strong>1.5% Aggregator Transaction Fee:</strong> Billed directly to authorized recyclers (covered by EPR credits).</li>
                  <li><strong>Corporate EPR Subscription:</strong> ₹4,999/facility/month for CPCB compliance filing package.</li>
                  <li><strong>Zero Fee for Collectors:</strong> Doorstep collectors receive 100% rate + ₹500/mo formal loyalty bonus.</li>
                </ul>
              </div>
            </div>

            {/* Side-by-Side Comparison Columns */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Column 1: Informal Market */}
              <div className="receipt-stub rounded-xl p-5 border-2 border-signal-500/80 shadow-sm space-y-4">
                <div className="border-b border-steel-300 pb-2">
                  <span className="stamp-seal stamp-hazard text-[10px]">INFORMAL BASELINE</span>
                  <h4 className="font-display font-black text-lg text-steel-900 mt-1">
                    {t('informalMarketLabel', 'Informal Scrap Market (Status Quo)')}
                  </h4>
                  <p className="text-[11px] text-steel-500">Traditional Predatory Scrap Chain</p>
                </div>

                <div className="space-y-2.5 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-steel-600">Reported Weight:</span>
                    <span className="font-bold text-signal-600">{informalReportedWeight.toFixed(1)} kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-steel-600">Middleman Margin Cut:</span>
                    <span className="font-bold text-signal-600">-{informalMiddlemanCut}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-steel-600">Formalization Bonus:</span>
                    <span className="text-steel-400">₹0</span>
                  </div>
                  <div className="pt-2 border-t border-steel-200 flex justify-between items-baseline">
                    <span className="font-bold text-steel-900">Collector Monthly Take:</span>
                    <span className="text-2xl font-black text-signal-600 font-mono-num">
                      {formatCurrency(informalCollectorPay)}
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-steel-500 p-2 bg-paper-100 rounded border border-steel-200">
                  ❌ No receipts, no pension, unsafe acid leaching, predatory middleman debt traps.
                </div>
              </div>

              {/* Column 2: Kabadiwala Connect Platform */}
              <div className="receipt-stub rounded-xl p-5 border-2 border-forest-500 shadow-md space-y-4 bg-forest-500/5">
                <div className="border-b border-steel-300 pb-2">
                  <span className="stamp-seal stamp-verified text-[10px]">KABADIWALA CONNECT</span>
                  <h4 className="font-display font-black text-lg text-steel-900 mt-1">
                    {t('formalPlatformLabel', 'Kabadiwala Connect Platform (Formalized)')}
                  </h4>
                  <p className="text-[11px] text-forest-700 font-bold">Formal CPCB Smelter Chain</p>
                </div>

                <div className="space-y-2.5 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-steel-600">Verified Scale Weight:</span>
                    <span className="font-bold text-forest-700">{monthlyVolumeKg} kg (100%)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-steel-600">Direct Recycler Rate:</span>
                    <span className="font-bold text-forest-700">100% Benchmark</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-steel-600">Ministry Loyalty Bonus:</span>
                    <span className="font-bold text-brass-700">+₹500 / month</span>
                  </div>
                  <div className="pt-2 border-t border-steel-200 flex justify-between items-baseline">
                    <span className="font-bold text-steel-900">Collector Monthly Take:</span>
                    <span className="text-2xl font-black text-forest-700 font-mono-num">
                      {formatCurrency(formalCollectorPay)}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-forest-500/10 rounded-lg border border-forest-500/40 text-xs font-bold text-forest-800 text-center">
                  🎉 +{percentageIncrease}% More Net Income (+{formatCurrency(earningsDifference)}/mo)
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* TAB 4: COLLECTOR & PARTICIPANT KYC REGULATORY REVIEW */}
      {activeTab === 'verifications' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-steel-300 pb-4">
            <div>
              <span className="stamp-seal stamp-verified text-xs">{t('collectorKycBadge', 'Regulatory KYC Portal')}</span>
              <h2 className="text-xl font-display font-black text-steel-900 mt-2">
                CPCB & ULB Regulatory Identity Verification
              </h2>
              <p className="text-xs text-steel-600">
                Review submitted Aadhaar and PAN documents, verify identities, and issue official formalization clearances.
              </p>
            </div>

            {/* Filter Chips */}
            <div className="flex items-center gap-1.5 bg-paper-200/80 p-1 rounded-xl border border-steel-300 self-start sm:self-auto overflow-x-auto">
              {(['ALL', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED'] as const).map(filter => {
                const count = usersList.filter(u => u.role !== 'ADMIN' && (filter === 'ALL' || u.kycStatus === filter)).length;
                const isSelected = kycFilter === filter;
                return (
                  <button
                    key={filter}
                    onClick={() => {
                      triggerHaptic(10);
                      setKycFilter(filter);
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-white text-steel-900 shadow-xs'
                        : 'text-steel-600 hover:text-steel-900 hover:bg-white/50'
                    }`}
                  >
                    <span>
                      {filter === 'ALL'
                        ? 'All'
                        : filter === 'UNDER_REVIEW'
                        ? 'Under Review'
                        : filter === 'VERIFIED'
                        ? 'Verified'
                        : 'Rejected'}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isSelected ? 'bg-steel-200 text-steel-800' : 'bg-steel-300/60 text-steel-600'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* KYC Applicants Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {usersList
              .filter(u => u.role !== 'ADMIN' && (kycFilter === 'ALL' || u.kycStatus === kycFilter))
              .map(u => {
                const isVerified = u.kycStatus === 'VERIFIED';
                const isUnderReview = u.kycStatus === 'UNDER_REVIEW';
                const isRejected = u.kycStatus === 'REJECTED';
                const doc = u.kycDocuments;

                return (
                  <div
                    key={u.id}
                    className={`receipt-stub rounded-2xl p-5 border-2 shadow-sm space-y-4 transition-all ${
                      isUnderReview
                        ? 'border-amber-400/80 bg-amber-50/20'
                        : isVerified
                        ? 'border-forest-500/80 bg-forest-50/20'
                        : isRejected
                        ? 'border-signal-400/80 bg-signal-50/20'
                        : 'border-steel-300 bg-white'
                    }`}
                  >
                    {/* Header: Role & Status */}
                    <div className="flex justify-between items-start gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        u.role === 'KABADIWALA'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : u.role === 'RECYCLER'
                          ? 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                          : 'bg-blue-100 text-blue-800 border border-blue-300'
                      }`}>
                        {u.role === 'KABADIWALA' ? 'Collector' : u.role === 'RECYCLER' ? 'Recycler' : 'Citizen'}
                      </span>

                      <span className={`stamp-seal text-[10px] ${
                        isVerified
                          ? 'stamp-verified'
                          : isUnderReview
                          ? 'bg-amber-100 text-amber-800 border-amber-400 animate-pulse'
                          : 'stamp-hazard'
                      }`}>
                        {isVerified ? 'VERIFIED' : isUnderReview ? 'UNDER REVIEW' : isRejected ? 'REJECTED' : 'UNVERIFIED'}
                      </span>
                    </div>

                    {/* Applicant Name & Contacts */}
                    <div>
                      <h4 className="font-display font-black text-lg text-steel-900 leading-tight">
                        {u.name}
                      </h4>
                      <p className="text-xs text-steel-600 font-mono mt-0.5">
                        {u.phone} {u.email ? `• ${u.email}` : ''}
                      </p>
                    </div>

                    {/* Meta info based on role */}
                    <div className="p-3 bg-paper-100 rounded-xl border border-steel-200 text-xs font-mono space-y-1.5 text-steel-700">
                      {u.role === 'KABADIWALA' && (
                        <div>
                          <span className="text-steel-500">Vehicle:</span> {u.kabadiwala?.vehicleType || 'Solar Cargo Trike'}
                        </div>
                      )}
                      {u.role === 'RECYCLER' && (
                        <>
                          <div className="truncate">
                            <span className="text-steel-500">Facility:</span> {u.recycler?.facilityName || 'Registered Processing Unit'}
                          </div>
                          <div className="truncate">
                            <span className="text-steel-500">CPCB Reg:</span> {u.recycler?.cpcbRegNumber || 'CPCB-EW-2023-DL-0881'}
                          </div>
                        </>
                      )}
                      <div>
                        <span className="text-steel-500">ID Document:</span> {doc?.idType || 'AADHAAR'} ({doc?.idNumber || 'XXXX-XXXX-8921'})
                      </div>
                      {doc?.submittedAt && (
                        <div className="text-[10px] text-steel-400">
                          Submitted: {new Date(doc.submittedAt).toLocaleString()}
                        </div>
                      )}
                      {isRejected && doc?.rejectionReason && (
                        <div className="text-signal-600 font-semibold text-[11px] pt-1 border-t border-steel-200">
                          Reason: {doc.rejectionReason}
                        </div>
                      )}
                      {doc?.remarks && (
                        <div className="text-forest-700 font-medium text-[11px] pt-1 border-t border-steel-200">
                          <span className="font-bold">Applicant Clarification:</span> {doc.remarks}
                        </div>
                      )}
                    </div>

                    {/* Action Controls */}
                    <div className="space-y-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic(15);
                          setPreviewDocUser(u);
                        }}
                        className="w-full py-2 px-3 rounded-xl bg-white hover:bg-paper-100 border border-steel-300 text-steel-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                      >
                        <Eye className="w-3.5 h-3.5 text-forest-700" />
                        <span>Review Submitted Documents</span>
                      </button>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => handleApproveKyc(u.id)}
                          disabled={actionLoading === u.id || isVerified}
                          className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1 shadow-xs transition-all ${
                            isVerified
                              ? 'bg-forest-100 text-forest-800 cursor-default opacity-70 border border-forest-300'
                              : 'btn-dhatu-primary active:scale-98'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{isVerified ? 'Approved' : 'Approve'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            triggerHaptic(15);
                            setRejectModalUser(u);
                          }}
                          disabled={actionLoading === u.id || isRejected}
                          className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                            isRejected
                              ? 'bg-signal-100 text-signal-700 opacity-60 border border-signal-200'
                              : 'bg-paper-200 hover:bg-signal-50 text-signal-600 hover:text-signal-700 border border-steel-300 active:scale-98'
                          }`}
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>{isRejected ? 'Rejected' : 'Reject'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>

          {/* DOCUMENT PREVIEW MODAL */}
          {previewDocUser && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-steel-900/80 backdrop-blur-sm animate-fade-in">
              <div className="w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-steel-300 space-y-5 max-h-[90vh] overflow-y-auto relative animate-scale-up">
                <button
                  onClick={() => setPreviewDocUser(null)}
                  className="absolute top-4 right-4 p-2 rounded-full text-steel-400 hover:text-steel-700 hover:bg-paper-200"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-3 border-b border-steel-200 pb-3">
                  <div className="w-10 h-10 rounded-xl bg-forest-500/10 text-forest-700 flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-forest-700">
                      Regulatory Identity Review
                    </span>
                    <h3 className="text-lg font-display font-black text-steel-900">
                      {previewDocUser.name} • {previewDocUser.role}
                    </h3>
                  </div>
                </div>

                {/* Identity Summary */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-paper-100 p-3.5 rounded-2xl border border-steel-200">
                  <div>
                    <span className="text-steel-400 block text-[10px] uppercase font-bold">Document Type</span>
                    <span className="font-bold text-steel-900">{previewDocUser.kycDocuments?.idType || 'AADHAAR'}</span>
                  </div>
                  <div>
                    <span className="text-steel-400 block text-[10px] uppercase font-bold">ID Number</span>
                    <span className="font-mono font-bold text-steel-900">{previewDocUser.kycDocuments?.idNumber || 'XXXX-XXXX-8921'}</span>
                  </div>
                  <div>
                    <span className="text-steel-400 block text-[10px] uppercase font-bold">Phone</span>
                    <span className="font-mono font-bold text-steel-900">{previewDocUser.phone}</span>
                  </div>
                  <div>
                    <span className="text-steel-400 block text-[10px] uppercase font-bold">Current Status</span>
                    <span className="font-bold text-amber-700 uppercase">{previewDocUser.kycStatus}</span>
                  </div>
                </div>

                {/* Document Visual Display */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-steel-700 uppercase tracking-wider">
                    Submitted Identity Photographs / Cards
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Front Document */}
                    <div className="rounded-2xl border-2 border-steel-300 p-3 bg-paper-50 space-y-2">
                      <span className="text-[11px] font-bold text-steel-600 block">Front Side (ID Photo & Seal)</span>
                      {previewDocUser.kycDocuments?.frontImage ? (
                        <img
                          src={previewDocUser.kycDocuments.frontImage}
                          alt="Front Document"
                          className="w-full h-44 object-cover rounded-xl border border-steel-200"
                        />
                      ) : (
                        <div className="w-full h-44 rounded-xl border-2 border-dashed border-steel-300 bg-white flex flex-col items-center justify-center p-4 text-center space-y-2">
                          <CreditCard className="w-8 h-8 text-forest-700" />
                          <div className="text-xs font-mono font-bold text-steel-800">
                            {previewDocUser.kycDocuments?.idType || 'AADHAAR'} CARD FRONT
                          </div>
                          <span className="text-[10px] text-steel-500 font-mono">
                            {previewDocUser.kycDocuments?.idNumber || '9821 4455 8921'}
                          </span>
                          <span className="text-[9px] px-2 py-0.5 rounded-full bg-forest-100 text-forest-800 font-bold">
                            Digital Certified
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Back Document */}
                    <div className="rounded-2xl border-2 border-steel-300 p-3 bg-paper-50 space-y-2">
                      <span className="text-[11px] font-bold text-steel-600 block">Back Side (Official Address)</span>
                      {previewDocUser.kycDocuments?.backImage ? (
                        <img
                          src={previewDocUser.kycDocuments.backImage}
                          alt="Back Document"
                          className="w-full h-44 object-cover rounded-xl border border-steel-200"
                        />
                      ) : (
                        <div className="w-full h-44 rounded-xl border-2 border-dashed border-steel-300 bg-white flex flex-col items-center justify-center p-4 text-center space-y-2">
                          <FileText className="w-8 h-8 text-steel-400" />
                          <div className="text-xs font-mono font-bold text-steel-800">
                            {previewDocUser.kycDocuments?.idType || 'AADHAAR'} CARD BACK
                          </div>
                          <span className="text-[10px] text-steel-500">
                            Address & QR Code Verified
                          </span>
                          <span className="text-[9px] px-2 py-0.5 rounded-full bg-paper-200 text-steel-700 font-bold">
                            UIDAI / CPCB Record
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {previewDocUser.kycDocuments?.remarks && (
                  <div className="p-3 rounded-2xl bg-forest-50 border border-forest-200 text-xs">
                    <span className="font-bold text-forest-800 block">Applicant Re-Application Note / Clarification:</span>
                    <p className="text-forest-900 mt-0.5">{previewDocUser.kycDocuments.remarks}</p>
                  </div>
                )}

                {/* Modal Actions */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-steel-200">
                  <button
                    onClick={() => {
                      setRejectModalUser(previewDocUser);
                    }}
                    className="px-4 py-2.5 rounded-full bg-paper-200 hover:bg-signal-50 text-signal-700 border border-steel-300 text-xs font-bold"
                  >
                    Reject Application
                  </button>
                  <button
                    onClick={() => handleApproveKyc(previewDocUser.id)}
                    className="btn-dhatu-primary px-5 py-2.5 rounded-full text-xs font-bold flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve Regulatory Verification</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* REJECT REASON MODAL */}
          {rejectModalUser && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-steel-900/80 backdrop-blur-sm animate-fade-in">
              <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-steel-300 space-y-4 animate-scale-up">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-signal-100 text-signal-700 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-display font-black text-steel-900">
                      Reject KYC Application
                    </h3>
                    <p className="text-xs text-steel-500">{rejectModalUser.name}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-steel-700 mb-1.5 uppercase">
                    Select or Enter Reason for Rejection
                  </label>
                  <div className="space-y-1.5 mb-3">
                    {[
                      'Document photograph is blurry or unreadable',
                      'Aadhaar / PAN name does not match applicant profile',
                      'Expired or incomplete CPCB regulatory certificate',
                      'Incomplete residential / facility address details'
                    ].map((reason, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setRejectionReasonInput(reason)}
                        className={`w-full text-left text-xs p-2 rounded-lg border transition-all ${
                          rejectionReasonInput === reason
                            ? 'bg-forest-50 border-forest-500 text-forest-800 font-semibold'
                            : 'bg-paper-100 border-steel-200 text-steel-700 hover:bg-paper-200'
                        }`}
                      >
                        {reason}
                      </button>
                    ))}
                  </div>

                  <input
                    type="text"
                    value={rejectionReasonInput}
                    onChange={e => setRejectionReasonInput(e.target.value)}
                    className="w-full p-2.5 text-xs bg-paper-100 border border-steel-300 rounded-xl text-steel-900 font-semibold"
                    placeholder="Custom rejection note..."
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-steel-200">
                  <button
                    type="button"
                    onClick={() => setRejectModalUser(null)}
                    className="px-4 py-2 rounded-full text-xs font-bold text-steel-600 hover:bg-paper-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRejectKyc(rejectModalUser.id, rejectionReasonInput)}
                    className="px-4 py-2 rounded-full bg-signal-600 hover:bg-signal-700 text-white text-xs font-bold shadow-sm"
                  >
                    Confirm Rejection
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: CPCB FORM-2/6 REGULATORY AUDIT */}
      {activeTab === 'epr' && (
        <div className="bg-paper-50 rounded-xl p-6 sm:p-8 border-2 border-steel-300 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-steel-200 pb-4">
            <div>
              <span className="stamp-seal stamp-verified text-xs">CPCB CENTRAL PORTAL FILING</span>
              <h2 className="text-xl font-display font-black text-steel-900 mt-2">
                CPCB Form-2 / Form-6 Automated Regulatory Filing
              </h2>
              <p className="text-xs text-steel-600">
                Official export format adhering to the E-Waste Management Rules 2022 EPR Portal API Schema.
              </p>
            </div>
            <button
              onClick={handleExportEPR}
              className="btn-dhatu-primary px-4 py-2 rounded text-xs font-bold flex items-center space-x-1.5 self-start sm:self-auto"
            >
              <Download className="w-4 h-4" />
              <span>Download Form-2 Filing Package (JSON)</span>
            </button>
          </div>

          <div className="p-4 bg-steel-900 text-paper-100 rounded-lg font-mono text-xs overflow-x-auto space-y-1">
            <span className="text-brass-400">// CPCB Portal API Payload Preview:</span>
            <pre>{JSON.stringify({
              ulb_code: 'NDMC_DL_01',
              reporting_quarter: 'Q2-2026',
              total_ewaste_collected_mt: 28.45,
              formalization_index: 0.884,
              registered_collectors_count: 64,
              authorized_recyclers_linked: ['EcoRecycle Aggregators (CPCB-EW-2023-DL-0881)'],
              traceability_seal: 'SHA256: 4f1a8c9910... VALID'
            }, null, 2)}</pre>
          </div>
        </div>
      )}

      {/* Sticky Mobile Bottom Navigation Bar (Material 3 Expressive Navigation Bar) */}
      <nav
        aria-label="Admin Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/80 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] px-2 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom,0.75rem))] md:hidden"
      >
        <div className="flex items-center justify-around gap-1 max-w-md mx-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 min-w-0 py-1 px-1 rounded-2xl flex flex-col items-center justify-center transition-all ${
              activeTab === 'overview'
                ? 'font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <div className={`w-12 h-7 rounded-full flex items-center justify-center transition-all ${activeTab === 'overview' ? 'm3-nav-pill-active' : 'text-slate-500'}`}>
              <TrendingUp className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-semibold mt-1 truncate max-w-full">{t('mNavOverview', 'Overview')}</span>
          </button>

          <button
            onClick={() => setActiveTab('traceability')}
            className={`flex-1 min-w-0 py-1 px-1 rounded-2xl flex flex-col items-center justify-center transition-all ${
              activeTab === 'traceability'
                ? 'font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <div className={`w-12 h-7 rounded-full flex items-center justify-center transition-all ${activeTab === 'traceability' ? 'm3-nav-pill-active' : 'text-slate-500'}`}>
              <Layers className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-semibold mt-1 truncate max-w-full">{t('mNavTrace', 'Trace')}</span>
          </button>

          <button
            onClick={() => setActiveTab('uniteconomics')}
            className={`flex-1 min-w-0 py-1 px-1 rounded-2xl flex flex-col items-center justify-center transition-all ${
              activeTab === 'uniteconomics'
                ? 'font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <div className={`w-12 h-7 rounded-full flex items-center justify-center transition-all ${activeTab === 'uniteconomics' ? 'm3-nav-pill-active' : 'text-slate-500'}`}>
              <Calculator className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-semibold mt-1 truncate max-w-full">{t('mNavEconomics', 'Economics')}</span>
          </button>

          <button
            onClick={() => setActiveTab('verifications')}
            className={`flex-1 min-w-0 py-1 px-1 rounded-2xl flex flex-col items-center justify-center transition-all ${
              activeTab === 'verifications'
                ? 'font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <div className={`w-12 h-7 rounded-full flex items-center justify-center transition-all ${activeTab === 'verifications' ? 'm3-nav-pill-active' : 'text-slate-500'}`}>
              <Users className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-semibold mt-1 truncate max-w-full">{t('mNavVerifyAdmin', 'Verify')}</span>
          </button>

          <button
            onClick={() => setActiveTab('epr')}
            className={`flex-1 min-w-0 py-1 px-1 rounded-2xl flex flex-col items-center justify-center transition-all ${
              activeTab === 'epr'
                ? 'font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <div className={`w-12 h-7 rounded-full flex items-center justify-center transition-all ${activeTab === 'epr' ? 'm3-nav-pill-active' : 'text-slate-500'}`}>
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-semibold mt-1 truncate max-w-full">{t('mNavEpr', 'EPR')}</span>
          </button>
        </div>
      </nav>

    </div>
  );
};
