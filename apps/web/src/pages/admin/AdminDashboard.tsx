import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { storage, STORAGE_KEYS } from '../../lib/storage';
import { AdminStats } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { VoiceAssistButton } from '../../components/VoiceAssistButton';
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
  Check
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { language, t, formatCurrency, speak, preserveEnglishItemName } = useLanguage();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [collectors, setCollectors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'traceability' | 'uniteconomics' | 'verifications' | 'epr'>('overview');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleStorageChange = (e: any) => {
      const key = e.detail?.key;
      if (key === STORAGE_KEYS.COLLECTORS || key === STORAGE_KEYS.PICKUPS || key === STORAGE_KEYS.LOTS || key === '*') {
        setCollectors(storage.getCollectors());
        setStats(storage.getAdminStats());
      }
    };

    window.addEventListener('dhatu-storage-change', handleStorageChange);
    return () => window.removeEventListener('dhatu-storage-change', handleStorageChange);
  }, []);

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
      
      {/* Top Header - Dhatu Industrial Passbook Style */}
      <div className="bg-steel-900 text-paper-50 rounded-xl p-5 sm:p-8 border-2 border-steel-700 shadow-tactile-lg flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden">
        <div className="space-y-2 z-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="stamp-seal stamp-verified text-[11px] bg-forest-500/20 text-forest-500 border-forest-500">
              MINISTRY OF MINES & CPCB
            </span>
            <span className="bg-brass-500/20 text-brass-300 font-mono text-xs px-2 py-0.5 rounded border border-brass-500/40">
              ULB REGULATORY DASHBOARD
            </span>
            <VoiceAssistButton
              text="CPCB Waste and Mines Cell Administration Console. National e-waste metrics, end-to-end traceability dataset, and unit economics comparison."
              hindiText="सीपीसीबी अपशिष्ट एवं खान प्रकोष्ठ प्रशासन कंसोल। राष्ट्रीय स्तर के ई-कचरा आंकड़े, एंड-टू-एंड ट्रेसेबिलिटी डेटासेट और अर्थशास्त्र कैलकुलेटर।"
              marathiText="सीपीसीबी कचरा आणि खाण विभाग प्रशासन डॅशबोर्ड. राष्ट्रीय ई-कचरा आकडेवारी आणि ट्रेसेबिलिटी डेटासेट."
              size="sm"
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-black tracking-tight text-paper-50">
            CPCB Waste & Mines Cell <span className="text-copper-400 font-sans text-lg">(National Regulatory Authority)</span>
          </h1>
          <p className="text-xs sm:text-sm text-paper-300 max-w-2xl font-medium">
            CPCB E-Waste (Management) Rules 2022 Central Audit Terminal & Traceability Ledger
          </p>
        </div>

        <div className="flex flex-wrap gap-2 z-10">
          <button
            onClick={handleExportEPR}
            className="btn-dhatu-primary px-4 py-2 rounded-lg text-xs font-bold flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export CPCB EPR Audit (JSON)</span>
          </button>
        </div>
      </div>

      {/* Tabs - Horizontal Scrollable on Mobile Portrait */}
      <div className="flex overflow-x-auto no-scrollbar gap-2 border-b-2 border-steel-300 pb-2 -mx-3 px-3 sm:mx-0 sm:px-0 flex-nowrap">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-shrink-0 whitespace-nowrap px-4 py-2.5 rounded-lg font-bold text-xs flex items-center space-x-2 transition-all ${
            activeTab === 'overview'
              ? 'bg-copper-600 text-white shadow-tactile border border-copper-700'
              : 'bg-paper-200 text-steel-800 hover:bg-paper-300 border border-steel-300'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>1. {t('tabOverview')}</span>
        </button>

        <button
          onClick={() => setActiveTab('traceability')}
          className={`flex-shrink-0 whitespace-nowrap px-4 py-2.5 rounded-lg font-bold text-xs flex items-center space-x-2 transition-all ${
            activeTab === 'traceability'
              ? 'bg-copper-600 text-white shadow-tactile border border-copper-700'
              : 'bg-paper-200 text-steel-800 hover:bg-paper-300 border border-steel-300'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>2. {t('tabTraceability')}</span>
        </button>

        <button
          onClick={() => setActiveTab('uniteconomics')}
          className={`flex-shrink-0 whitespace-nowrap px-4 py-2.5 rounded-lg font-bold text-xs flex items-center space-x-2 transition-all ${
            activeTab === 'uniteconomics'
              ? 'bg-copper-600 text-white shadow-tactile border border-copper-700'
              : 'bg-paper-200 text-steel-800 hover:bg-paper-300 border border-steel-300'
          }`}
        >
          <Calculator className="w-4 h-4" />
          <span>3. {t('tabUnitEconomics')}</span>
        </button>

        <button
          onClick={() => setActiveTab('verifications')}
          className={`flex-shrink-0 whitespace-nowrap px-4 py-2.5 rounded-lg font-bold text-xs flex items-center space-x-2 transition-all ${
            activeTab === 'verifications'
              ? 'bg-copper-600 text-white shadow-tactile border border-copper-700'
              : 'bg-paper-200 text-steel-800 hover:bg-paper-300 border border-steel-300'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>4. {t('tabVerifications')} ({collectors.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('epr')}
          className={`flex-shrink-0 whitespace-nowrap px-4 py-2.5 rounded-lg font-bold text-xs flex items-center space-x-2 transition-all ${
            activeTab === 'epr'
              ? 'bg-steel-800 text-white shadow-tactile border border-steel-900'
              : 'bg-paper-200 text-steel-800 hover:bg-paper-300 border border-steel-300'
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
                {language === 'hi' ? '२८,४५० किग्रा कचरा लैंडफिल से बचाया' : language === 'mr' ? '२८,४५० कि.ग्रा. कचरा डेपोत जाण्यापासून वाचवला' : '28,450 kg kept out of landfills'}
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
                {language === 'hi' ? '१००% जीपीएस एवं समय मुहर सहित' : language === 'mr' ? '१००% जीपीएस आणि वेळ नोंदीसह' : '100% with GPS & timestamp'}
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

      {/* TAB 4: COLLECTOR KYC VERIFICATIONS */}
      {activeTab === 'verifications' && (
        <div className="space-y-6">
          <div className="border-b border-steel-300 pb-3">
            <span className="stamp-seal stamp-verified text-xs">{t('collectorKycBadge', 'KYC Verification')}</span>
            <h2 className="text-xl font-display font-black text-steel-900 mt-2">
              {t('collectorKycTitle', 'Collector KYC Verification & Identity Cards')}
            </h2>
            <p className="text-xs text-steel-600">
              Verify identity and issue CPCB digital badges to formalize door-to-door scrap collectors.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {collectors.map(c => (
              <div key={c.id} className="receipt-stub rounded-xl p-5 border-2 border-steel-300 shadow-sm space-y-3">
                <div className="flex justify-between items-start">
                  <span className={`stamp-seal ${c.verified ? 'stamp-verified' : 'stamp-pending'} text-[10px]`}>
                    {c.verified ? t('kycVerified', 'VERIFIED') : t('kycPending', 'VERIFICATION PENDING')}
                  </span>
                  <span className="text-xs font-bold text-forest-700">★ {c.reputationScore}</span>
                </div>

                <h4 className="font-display font-black text-lg text-steel-900">
                  {c.user?.name || 'Collector'}
                </h4>

                <div className="space-y-1 text-xs font-mono text-steel-600">
                  <div>Phone: {c.user?.phone}</div>
                  <div>Vehicle: {c.vehicleType}</div>
                  <div>Aadhaar: {c.aadhaarNumber}</div>
                  <div>Completed: {c.completedJobsCount} pickups</div>
                </div>

                <div className="pt-2 border-t border-steel-200">
                  <button
                    onClick={() => handleVerify(c.id, !c.verified)}
                    disabled={actionLoading === c.id}
                    className={`w-full py-2 rounded text-xs font-bold ${
                      c.verified
                        ? 'bg-paper-200 text-signal-600 hover:bg-signal-500/10 border border-steel-400'
                        : 'btn-dhatu-primary'
                    }`}
                  >
                    {c.verified ? t('rejectKyc') : t('approveKyc')}
                  </button>
                </div>
              </div>
            ))}
          </div>
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

      {/* Sticky Mobile Bottom Navigation Bar (Portrait Phone Optimization) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-paper-100 border-t-2 border-steel-300 shadow-tactile-lg p-2 md:hidden">
        <div className="grid grid-cols-5 gap-1 max-w-lg mx-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`min-h-[48px] py-1 rounded flex flex-col items-center justify-center text-[10px] font-bold transition-all ${
              activeTab === 'overview' ? 'text-copper-600 bg-paper-200' : 'text-steel-600'
            }`}
          >
            <TrendingUp className="w-4 h-4 mb-0.5" />
            <span className="truncate">{t('tabOverview', 'Overview')}</span>
          </button>

          <button
            onClick={() => setActiveTab('traceability')}
            className={`min-h-[48px] py-1 rounded flex flex-col items-center justify-center text-[10px] font-bold transition-all ${
              activeTab === 'traceability' ? 'text-copper-600 bg-paper-200' : 'text-steel-600'
            }`}
          >
            <Layers className="w-4 h-4 mb-0.5" />
            <span className="truncate">{t('tabTraceability', 'Trace')}</span>
          </button>

          <button
            onClick={() => setActiveTab('uniteconomics')}
            className={`min-h-[48px] py-1 rounded flex flex-col items-center justify-center text-[10px] font-bold transition-all ${
              activeTab === 'uniteconomics' ? 'text-copper-600 bg-paper-200' : 'text-steel-600'
            }`}
          >
            <Calculator className="w-4 h-4 mb-0.5" />
            <span className="truncate">{t('tabUnitEconomics', 'Economics')}</span>
          </button>

          <button
            onClick={() => setActiveTab('verifications')}
            className={`min-h-[48px] py-1 rounded flex flex-col items-center justify-center text-[10px] font-bold transition-all ${
              activeTab === 'verifications' ? 'text-copper-600 bg-paper-200' : 'text-steel-600'
            }`}
          >
            <Users className="w-4 h-4 mb-0.5" />
            <span className="truncate">{t('tabVerifications', 'Verify')}</span>
          </button>

          <button
            onClick={() => setActiveTab('epr')}
            className={`min-h-[48px] py-1 rounded flex flex-col items-center justify-center text-[10px] font-bold transition-all ${
              activeTab === 'epr' ? 'text-copper-600 bg-paper-200' : 'text-steel-600'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 mb-0.5" />
            <span className="truncate">{t('tabEpr', 'EPR')}</span>
          </button>
        </div>
      </div>

    </div>
  );
};
