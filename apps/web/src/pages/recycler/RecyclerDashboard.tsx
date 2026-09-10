import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { EWasteLot, EWasteLotItem, TransactionAnomaly } from '../../types';
import { storage, STORAGE_KEYS } from '../../lib/storage';
import {
  Factory,
  CheckCircle2,
  XCircle,
  QrCode,
  FileSpreadsheet,
  Download,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  MapPin,
  Calendar,
  DollarSign,
  ShieldCheck,
  Scale,
  RefreshCw,
  Search,
  ChevronRight,
  Sparkles,
  Sliders,
  Check,
  Gavel,
  X,
  Tag,
  Layers,
  ExternalLink
} from 'lucide-react';
import { VoiceAssistButton } from '../../components/VoiceAssistButton';
import { triggerHaptic, hapticSuccess } from '../../lib/haptics';
import { getDirectionsUrl } from '../../lib/location';

export const RecyclerDashboard: React.FC = () => {
  const { user } = useAuth();
  const { language, t, formatCurrency, speak, preserveEnglishItemName } = useLanguage();
  const [activeTab, setActiveTab] = useState<'incoming' | 'handover' | 'rates' | 'anomalies' | 'reports' | 'profile'>('incoming');

  // Recycler buying rates state (dynamically sourced from shared storage)
  const [rates, setRates] = useState<{ [category: string]: number }>(() => {
    const currentRates = storage.getRates();
    const map: { [category: string]: number } = {};
    currentRates.forEach(r => {
      map[r.category] = r.ratePerKg;
    });
    return map;
  });

  const [rateUpdateSuccess, setRateUpdateSuccess] = useState(false);

  // Incoming Lots from collectors (backed by local storage)
  const [incomingLots, setIncomingLots] = useState<EWasteLot[]>(() => storage.getLots());

  // Handover confirmation state
  const [handoverCode, setHandoverCode] = useState('');
  const [actualWeight, setActualWeight] = useState(18.5);
  const [operatorPin, setOperatorPin] = useState('OP-OKHLA-981');
  const [scaleCalibrationId, setScaleCalibrationId] = useState('WB-OKHLA-SCALE-04');
  const [handoverSuccess, setHandoverSuccess] = useState<string | null>(null);

  // Anomalies state (backed by local storage)
  const [anomalies, setAnomalies] = useState<TransactionAnomaly[]>(() => storage.getAnomalies());

  // Recycler Bidding state
  const [biddingLot, setBiddingLot] = useState<EWasteLot | null>(null);
  const [bidMode, setBidMode] = useState<'total' | 'rate'>('total');
  const [bidAmountInput, setBidAmountInput] = useState<number>(0);
  const [bidRateInput, setBidRateInput] = useState<number>(0);
  const [bidError, setBidError] = useState<string | null>(null);
  const [bidSuccess, setBidSuccess] = useState<string | null>(null);
  const [marketFilter, setMarketFilter] = useState<'ALL' | 'OPEN' | 'MY_BIDS' | 'HANDOVER_PENDING' | 'CONFIRMED'>('ALL');

  const openBidModal = (lot: EWasteLot) => {
    setBiddingLot(lot);
    setBidMode('total');
    const ask = Number(lot.askingPrice || lot.estimatedValue || 0);
    const minBid = Number(lot.minBidAmount) || Math.floor(ask * 0.5);
    const defaultBid = lot.highestBid ? Math.max(Number(lot.highestBid) + 500, minBid) : Math.round(ask * 0.85);
    const weight = Number(lot.approxWeightKg) || 1;
    const defaultRate = Math.round(defaultBid / weight);

    setBidAmountInput(defaultBid);
    setBidRateInput(defaultRate);
    setBidError(null);
    triggerHaptic(20);
  };

  const handleTotalInputChange = (val: number, lot: EWasteLot) => {
    setBidAmountInput(val);
    const weight = Number(lot.approxWeightKg) || 1;
    const computedRate = Math.round(val / weight);
    setBidRateInput(computedRate);

    const ask = Number(lot.askingPrice || lot.estimatedValue || 0);
    const minBid = Number(lot.minBidAmount) || Math.floor(ask * 0.5);

    if (val > 0 && val < minBid) {
      setBidError(`Bid must be at least ₹${minBid.toLocaleString('en-IN')} (50% of asking price ₹${ask.toLocaleString('en-IN')})`);
    } else {
      setBidError(null);
    }
  };

  const handleRateInputChange = (rateVal: number, lot: EWasteLot) => {
    setBidRateInput(rateVal);
    const weight = Number(lot.approxWeightKg) || 1;
    const computedTotal = Math.round(rateVal * weight);
    setBidAmountInput(computedTotal);

    const ask = Number(lot.askingPrice || lot.estimatedValue || 0);
    const minBid = Number(lot.minBidAmount) || Math.floor(ask * 0.5);
    const baseRate = Number(lot.recyclerOfferedRate) || Math.round(ask / weight);
    const minRate = Math.floor(baseRate * 0.5);

    if (rateVal > 0 && rateVal < minRate) {
      setBidError(`Rate must be at least ₹${minRate}/kg (50% of base rate ₹${baseRate}/kg)`);
    } else if (computedTotal > 0 && computedTotal < minBid) {
      setBidError(`Total bid ₹${computedTotal.toLocaleString('en-IN')} is below 50% minimum ₹${minBid.toLocaleString('en-IN')}`);
    } else {
      setBidError(null);
    }
  };

  const handleSubmitBid = (e: React.FormEvent) => {
    e.preventDefault();
    if (!biddingLot) return;
    const ask = Number(biddingLot.askingPrice || biddingLot.estimatedValue || 0);
    const minBid = Number(biddingLot.minBidAmount) || Math.floor(ask * 0.5);
    let finalBid = Number(bidAmountInput);

    if ((!finalBid || finalBid === 0) && bidRateInput > 0) {
      finalBid = Math.round(Number(bidRateInput) * (Number(biddingLot.approxWeightKg) || 1));
    }

    if (isNaN(finalBid) || finalBid < minBid) {
      setBidError(`Invalid bid: Must be at least ₹${minBid.toLocaleString('en-IN')} (50% of asking price ₹${ask.toLocaleString('en-IN')})`);
      return;
    }

    try {
      const { lot: updatedLot } = storage.addBidToLot(biddingLot.id, {
        recyclerId: user?.id || 'mock-recycler-1',
        recyclerName: user?.recycler?.facilityName || user?.name || 'M/s EcoRecycle Aggregators Ltd',
        bidAmount: finalBid
      });
      setIncomingLots(storage.getLots());
      hapticSuccess();
      setBidSuccess(`Bid of ₹${finalBid.toLocaleString('en-IN')} (₹${Math.round(finalBid / (Number(biddingLot.approxWeightKg) || 1))}/kg) successfully placed on Lot #${updatedLot.lotCode}! Waiting for collector to review.`);
      setBiddingLot(null);
    } catch (err: any) {
      setBidError(err.message || 'Failed to place bid');
    }
  };

  useEffect(() => {
    const handleStorageChange = (e: any) => {
      const key = e.detail?.key;
      if (key === STORAGE_KEYS.LOTS || key === '*') {
        setIncomingLots(storage.getLots());
      }
      if (key === STORAGE_KEYS.ANOMALIES || key === '*') {
        setAnomalies(storage.getAnomalies());
      }
      if (key === STORAGE_KEYS.RATES || key === '*') {
        const currentRates = storage.getRates();
        const map: { [category: string]: number } = {};
        currentRates.forEach(r => {
          map[r.category] = r.ratePerKg;
        });
        setRates(map);
      }
    };

    window.addEventListener('dhatu-storage-change', handleStorageChange);
    return () => window.removeEventListener('dhatu-storage-change', handleStorageChange);
  }, []);

  // Handle lot accept / reject
  const handleLotDecision = (lotId: string, decision: 'ACCEPT' | 'REJECT') => {
    const nextStatus = decision === 'ACCEPT' ? 'HANDOVER_PENDING' : 'REJECTED';
    storage.updateLotStatus(lotId, nextStatus);
    setIncomingLots(storage.getLots());
  };

  // Handle Handover confirmation (closes traceability loop & settles payment in Passbook)
  const handleConfirmHandover = (e: React.FormEvent) => {
    e.preventDefault();
    if (!handoverCode.trim()) return;

    const allLots = storage.getLots();
    const matchedLot = allLots.find(
      l => l.lotCode.toLowerCase() === handoverCode.trim().toLowerCase() || l.qrCode.toLowerCase() === handoverCode.trim().toLowerCase()
    );

    if (!matchedLot) {
      alert(`Lot code or QR reference "${handoverCode}" was not found in registered lots. Please select an active lot from the Incoming Lots tab.`);
      return;
    }

    const finalCode = matchedLot.lotCode;
    const diffPercent = Math.abs(actualWeight - (matchedLot.approxWeightKg || actualWeight)) / (matchedLot.approxWeightKg || 1) * 100;
    const auditHash = `0x${Math.random().toString(16).substr(2, 16)}`;
    
    // Update lot status to CONFIRMED with Layer 3 weighbridge verification details
    storage.updateLotStatus(finalCode, 'CONFIRMED', {
      approxWeightKg: actualWeight,
      confirmedAt: new Date().toISOString(),
      traceabilityHash: auditHash,
      weighbridgeOperatorId: operatorPin,
      verifiedAtWeighbridge: true
    });

    // Record credit settlement in the collector's passbook
    const offeredRate = matchedLot ? matchedLot.recyclerOfferedRate : 640;
    const payoutAmount = Math.round(actualWeight * offeredRate);
    storage.addPassbookTransaction({
      date: new Date().toISOString().slice(0, 16).replace('T', ' '),
      ref: finalCode,
      desc: `Handover Lot: ${matchedLot?.category || 'E-Waste Lot'} (${actualWeight} kg)`,
      party: 'EcoRecycle Aggregators (Unit-II)',
      type: 'CREDIT',
      amount: payoutAmount,
      paymentMode: 'CASH / Direct Settlement',
      status: 'VERIFIED'
    });

    setIncomingLots(storage.getLots());
    setHandoverSuccess(
      `Layer 3 Weighbridge Handover Verified! Lot #${finalCode} confirmed at ${actualWeight} kg by Operator ${operatorPin}. Scale variance: ±${diffPercent.toFixed(1)}%. Payout of ₹${payoutAmount} credited to collector passbook. CPCB EPR Form-2 Audit Hash: ${auditHash}. Complete chain of custody cryptographically verified!`
    );
    setHandoverCode('');
  };

  // Save updated buying rates to storage
  const handleSaveRates = (e: React.FormEvent) => {
    e.preventDefault();
    Object.entries(rates).forEach(([cat, val]) => {
      storage.updateRate(cat, val);
    });
    setRateUpdateSuccess(true);
    setTimeout(() => setRateUpdateSuccess(false), 3000);
  };

  // Handle anomaly review
  const handleResolveAnomaly = (id: string, action: 'REVIEWED' | 'DISMISSED') => {
    storage.updateAnomalyStatus(id, action);
    setAnomalies(storage.getAnomalies());
  };

  // Export CPCB EPR Report
  const handleExportEPR = (format: 'json' | 'csv') => {
    const reportData = {
      facilityName: 'EcoRecycle Aggregators Ltd (Unit-II)',
      cpcbRegNumber: 'CPCB-EW-2023-DL-0881',
      spcbRegistration: 'DPCC/E-WASTE/REG/2023/1049',
      reportingPeriod: 'April 2026 - September 2026',
      totalLotsProcessed: 342,
      totalWeightKg: 14850.5,
      traceabilityCoverage: '100% CPCB Form-2 Compliant',
      materialBreakdown: [
        { category: 'Printed Circuit Boards', receivedKg: 4210.0, recoveredMetalsKg: { copper: 680, gold_g: 410, silver_g: 1200 } },
        { category: 'Copper Cables', receivedKg: 3850.0, recoveredCopperKg: 2890.0 },
        { category: 'Li-ion Batteries', receivedKg: 2940.5, sentToSmelterKg: 2940.5 },
        { category: 'CRT Glass (Treated)', receivedKg: 2150.0, leadSeparatedKg: 430.0 },
        { category: 'Engineering Plastics', receivedKg: 1700.0, granulatedKg: 1620.0 }
      ],
      authorizedSignatory: 'Er. Arvind Mehta, Chief Compliance Officer'
    };

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CPCB_EPR_Form2_Compliance_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
    } else {
      const csvHeader = 'Category,Received_Kg,Status,CPCB_Credit_Units\n';
      const csvRows = reportData.materialBreakdown
        .map(m => `"${m.category}",${m.receivedKg},"VERIFIED_RECYCLED",${m.receivedKg * 1.2}`)
        .join('\n');
      const blob = new Blob([csvHeader + csvRows], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CPCB_EPR_Report_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-5 sm:space-y-8 pb-24 md:pb-8">
      
      {/* Top Header - Material 3 Expressive Container */}
      <div className="bg-gradient-to-br from-teal-900 via-slate-900 to-slate-950 text-white rounded-3xl p-6 sm:p-8 shadow-m3-2 border border-teal-800/30 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 z-10">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="rounded-full px-3.5 py-1 text-xs font-bold bg-teal-500/25 text-teal-200 border border-teal-400/30">
              CPCB / SPCB AUTHORIZED
            </span>
            <span className="rounded-full px-3 py-1 font-mono text-xs font-bold bg-white/10 text-slate-200 border border-white/15">
              REG: CPCB-EW-2023-DL-0881
            </span>
            <VoiceAssistButton
              text="EcoRecycle Aggregators Facility Dashboard. Authorized CPCB formal recycler interface."
              hindiText="इको रीसायकल एग्रीगेटर्स सुविधा डैशबोर्ड। अधिकृत सीपीसीबी रीसायकलर मंच।"
              marathiText="इको रीसायकल अ‍ॅग्रीगेटर्स सुविधा डॅशबोर्ड. अधिकृत सीपीसीबी रीसायकलर व्यासपीठ."
              size="sm"
            />
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-black tracking-tight text-white">
            EcoRecycle Aggregators <span className="text-teal-300 font-sans text-xl font-normal">(Okhla Terminal)</span>
          </h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl font-normal">
            CPCB E-Waste Rules 2022 Central Registry • Weighbridge & EPR Credit Generation
          </p>
        </div>

        {/* Real-Time Processing Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 z-10 font-sans text-center sm:text-right">
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15">
            <div className="text-xs text-slate-300 uppercase font-medium tracking-wider">{t('totalProcessed', 'Total Processed')}</div>
            <div className="text-2xl font-display font-black text-emerald-300 mt-0.5">
              14,850 kg
            </div>
            <div className="text-xs text-slate-400">{t('q2-2026 batch', 'Q2-2026 Batch')}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15">
            <div className="text-xs text-slate-300 uppercase font-medium tracking-wider">{t('pendingLots', 'Pending Lots')}</div>
            <div className="text-2xl font-display font-black text-amber-300 mt-0.5">
              {incomingLots.filter(l => l.status === 'REQUESTED' || l.status === 'BIDDING').length} Lots
            </div>
            <div className="text-xs text-slate-400">{t('from active collectors', 'Active Collectors')}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 col-span-2 sm:col-span-1">
            <div className="text-xs text-slate-300 uppercase font-medium tracking-wider">{t('anomalies', 'Anomalies')}</div>
            <div className="text-2xl font-display font-black text-rose-400 mt-0.5">
              {anomalies.filter(a => a.status === 'FLAGGED').length} Alert
            </div>
            <div className="text-xs text-slate-400">{t('review required', 'Review Required')}</div>
          </div>
        </div>
      </div>

      {/* Navigation Tab Bar - Material 3 Expressive Pill Tabs */}
      <div className="flex overflow-x-auto no-scrollbar gap-2.5 pb-2 -mx-3 px-3 sm:mx-0 sm:px-0 flex-nowrap">
        <button
          onClick={() => setActiveTab('incoming')}
          className={`flex-shrink-0 whitespace-nowrap px-5 py-2.5 rounded-full font-bold text-sm flex items-center space-x-2 transition-all ${
            activeTab === 'incoming'
              ? 'm3-tab-pill-active'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/80 shadow-sm'
          }`}
        >
          <Scale className="w-4 h-4" />
          <span>1. {t('tabIncoming', 'Incoming Collector Lots')} ({incomingLots.filter(l => l.status === 'REQUESTED' || l.status === 'BIDDING').length})</span>
        </button>

        <button
          onClick={() => setActiveTab('handover')}
          className={`flex-shrink-0 whitespace-nowrap px-5 py-2.5 rounded-full font-bold text-sm flex items-center space-x-2 transition-all ${
            activeTab === 'handover'
              ? 'm3-tab-pill-active'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/80 shadow-sm'
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>2. {t('tabVerifyQr', 'Confirm Handover (QR Scan)')}</span>
        </button>

        <button
          onClick={() => setActiveTab('rates')}
          className={`flex-shrink-0 whitespace-nowrap px-5 py-2.5 rounded-full font-bold text-sm flex items-center space-x-2 transition-all ${
            activeTab === 'rates'
              ? 'm3-tab-pill-active'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/80 shadow-sm'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>3. {t('tabRateConsole', 'Rate-Setting Console')}</span>
        </button>

        <button
          onClick={() => setActiveTab('anomalies')}
          className={`flex-shrink-0 whitespace-nowrap px-5 py-2.5 rounded-full font-bold text-sm flex items-center space-x-2 transition-all ${
            activeTab === 'anomalies'
              ? 'bg-rose-700 text-white shadow-m3-1'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/80 shadow-sm'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>4. {t('tabAnomalies', 'AI Anomaly Flags')} ({anomalies.filter(a => a.status === 'FLAGGED').length})</span>
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`flex-shrink-0 whitespace-nowrap px-5 py-2.5 rounded-full font-bold text-sm flex items-center space-x-2 transition-all ${
            activeTab === 'reports'
              ? 'm3-tab-pill-active'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/80 shadow-sm'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>5. {t('tabReports', 'CPCB EPR Compliance Reports')}</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`flex-shrink-0 whitespace-nowrap px-5 py-2.5 rounded-full font-bold text-sm flex items-center space-x-2 transition-all ${
            activeTab === 'profile'
              ? 'm3-tab-pill-active'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/80 shadow-sm'
          }`}
        >
          <Factory className="w-4 h-4" />
          <span>{t('tabFacility', 'Facility Profile')}</span>
        </button>
      </div>

      {/* TAB 1: INCOMING LOT REQUESTS & BIDDING */}
      {activeTab === 'incoming' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-xl font-display font-black text-steel-900">
                {t('incomingLotsTitle', 'Incoming Collector Lots & Bidding Market')}
              </h2>
              <p className="text-xs text-steel-600 font-medium">
                {t('incomingLotsDesc', 'Bid for digital lots submitted by verified door-to-door collectors across India. Valid bids must be ≥ 50% of asking price.')}
              </p>
            </div>
            <span className="text-xs font-mono text-copper-700 bg-copper-50 px-3 py-1.5 rounded-lg border border-copper-300 font-bold self-start sm:self-auto">
              {language === 'hi' ? 'लाइव फीड: ' : language === 'mr' ? 'थेट फीड: ' : 'Live Feed: '} {incomingLots.filter(l => l.status === 'AVAILABLE' || l.status === 'REQUESTED' || l.status === 'BIDDING').length} {language === 'hi' ? 'खुले लॉट' : language === 'mr' ? 'खुले लॉट' : 'Open Lots'}
            </span>
          </div>

          {/* Quick Filter Tabs for Recycler Market */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'ALL', label: t('allLots', 'All Lots'), count: incomingLots.length },
              { id: 'OPEN', label: t('openForBids', 'Open for Bids'), count: incomingLots.filter(l => l.status === 'AVAILABLE' || l.status === 'REQUESTED' || l.status === 'BIDDING').length },
              { id: 'MY_BIDS', label: t('myBids', 'My Bids'), count: incomingLots.filter(l => l.bids?.some(b => b.recyclerId === (user?.id || 'mock-recycler-1') || b.recyclerName?.includes(user?.recycler?.facilityName || user?.name || 'EcoRecycle'))).length },
              { id: 'HANDOVER_PENDING', label: t('handoverPending', 'Handover Pending'), count: incomingLots.filter(l => l.status === 'HANDOVER_PENDING').length },
              { id: 'CONFIRMED', label: t('confirmed', 'Confirmed'), count: incomingLots.filter(l => l.status === 'CONFIRMED').length },
            ].map(f => (
              <button
                key={f.id}
                type="button"
                onClick={() => setMarketFilter(f.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  marketFilter === f.id
                    ? 'bg-copper-600 text-white shadow-tactile border border-copper-700'
                    : 'bg-paper-200 text-steel-700 hover:bg-paper-300 border border-steel-300'
                }`}
              >
                {f.label} ({f.count})
              </button>
            ))}
          </div>

          {bidSuccess && (
            <div className="p-4 bg-forest-500/10 border-2 border-forest-500 rounded-xl text-forest-800 text-xs font-medium flex items-center justify-between shadow-sm animate-fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-forest-600 shrink-0" />
                <span>{bidSuccess}</span>
              </div>
              <button
                onClick={() => setBidSuccess(null)}
                className="p-1 text-forest-700 hover:text-forest-900 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {incomingLots
            .filter(lot => {
              if (marketFilter === 'OPEN') {
                return lot.status === 'AVAILABLE' || lot.status === 'REQUESTED' || lot.status === 'BIDDING';
              }
              if (marketFilter === 'MY_BIDS') {
                return lot.bids?.some(b => b.recyclerId === (user?.id || 'mock-recycler-1') || b.recyclerName?.includes(user?.recycler?.facilityName || user?.name || 'EcoRecycle'));
              }
              if (marketFilter === 'HANDOVER_PENDING') {
                return lot.status === 'HANDOVER_PENDING';
              }
              if (marketFilter === 'CONFIRMED') {
                return lot.status === 'CONFIRMED';
              }
              return true;
            })
            .length === 0 ? (
            <div className="text-center py-12 bg-paper-100 rounded-xl border-2 border-dashed border-steel-300 space-y-3">
              <Gavel className="w-10 h-10 text-steel-400 mx-auto" />
              <p className="text-xs text-steel-600 font-bold">{t('no digital lots found matching this filter.', 'No digital lots found matching this filter.')}</p>
              <button
                type="button"
                onClick={() => setMarketFilter('ALL')}
                className="btn-dhatu-primary px-4 py-2 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 shadow-sm"
              >
                <span>{t('show all lots', 'Show All Lots')} ({incomingLots.length})</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {incomingLots
                .filter(lot => {
                  if (marketFilter === 'OPEN') {
                    return lot.status === 'AVAILABLE' || lot.status === 'REQUESTED' || lot.status === 'BIDDING';
                  }
                  if (marketFilter === 'MY_BIDS') {
                    return lot.bids?.some(b => b.recyclerId === (user?.id || 'mock-recycler-1') || b.recyclerName?.includes(user?.recycler?.facilityName || user?.name || 'EcoRecycle'));
                  }
                  if (marketFilter === 'HANDOVER_PENDING') {
                    return lot.status === 'HANDOVER_PENDING';
                  }
                  if (marketFilter === 'CONFIRMED') {
                    return lot.status === 'CONFIRMED';
                  }
                  return true;
                })
                .map(lot => {
                  const ask = lot.askingPrice || lot.estimatedValue;
                  const minBid = lot.minBidAmount || Math.round(ask * 0.5);
                  const myBid = lot.bids?.find(
                    b => b.recyclerId === (user?.id || 'mock-recycler-1') || b.recyclerName?.includes(user?.recycler?.facilityName || user?.name || 'EcoRecycle')
                  );
                  // Biddable when AVAILABLE, REQUESTED, or already in BIDDING
                  const isBiddable = lot.status === 'AVAILABLE' || lot.status === 'REQUESTED' || lot.status === 'BIDDING';

                  return (
                    <div
                      key={lot.id}
                      className="receipt-stub rounded-xl p-5 border-2 border-steel-300 shadow-sm flex flex-col justify-between space-y-4 hover:border-copper-500 transition-colors bg-paper-50"
                    >
                      <div>
                        <div className="flex items-center justify-between border-b border-steel-200 pb-2 mb-3">
                          <span className="font-mono text-xs font-bold text-copper-700">#{lot.lotCode}</span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              lot.status === 'HANDOVER_PENDING'
                                ? 'bg-forest-500/10 text-forest-600 border border-forest-500/30'
                                : lot.status === 'CONFIRMED'
                                ? 'bg-steel-200 text-steel-700 border border-steel-400'
                                : lot.status === 'REJECTED'
                                ? 'bg-signal-500/10 text-signal-500 border border-signal-500/30'
                                : lot.status === 'BIDDING'
                                ? 'bg-brass-100 text-brass-800 border border-brass-400 animate-pulse'
                                : 'bg-copper-100 text-copper-800 border border-copper-300'
                            }`}
                          >
                            {lot.status === 'BIDDING' ? t('BIDDING OPEN') : lot.status === 'AVAILABLE' ? t('OPEN FOR BIDS') : lot.status === 'REQUESTED' ? t('COLLECTOR TENDER') : t(lot.status)}
                          </span>
                        </div>

                        <h3 className="font-display font-bold text-steel-900 text-base leading-snug">
                          {preserveEnglishItemName(lot.category)}
                        </h3>

                        {/* Custom Mixed Lot Material Composition */}
                        {lot.isCustomLot && lot.items && lot.items.length > 0 && (
                          <div className="mt-2.5 p-2 bg-paper-200/80 rounded border border-steel-300 font-mono text-xs space-y-1.5">
                            <div className="flex items-center justify-between text-[10px] uppercase font-bold text-copper-800 pb-1 border-b border-steel-200">
                              <span className="flex items-center gap-1">
                                <Layers className="w-3 h-3 text-copper-600" />
                                <span>{t('customMixedLot', 'Custom Mixed Lot')} ({lot.items.length} {t('items', 'materials')})</span>
                              </span>
                              <span>{t('blendedRate', 'Blended')}: ₹{lot.recyclerOfferedRate}/kg</span>
                            </div>
                            <div className="space-y-1">
                              {lot.items.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between text-[11px] bg-white px-2 py-0.5 rounded border border-steel-200">
                                  <span className="text-steel-800 font-medium truncate pr-2">• {preserveEnglishItemName(item.category)}</span>
                                  <span className="text-copper-700 font-bold shrink-0">{item.weightKg} kg (₹{item.ratePerKg}/kg)</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs bg-paper-100 p-2.5 rounded border border-paper-300 font-mono">
                          <div>
                            <span className="text-steel-500 text-[10px] block">{t('collectorName', 'COLLECTOR')}</span>
                            <span className="font-bold text-steel-800 truncate block">{lot.collectorName}</span>
                          </div>
                          <div>
                            <span className="text-steel-500 text-[10px] block">{t('weight', 'EST. WEIGHT')}</span>
                            <span className="font-bold text-steel-900">{lot.approxWeightKg} kg</span>
                          </div>
                          <div>
                            <span className="text-steel-500 text-[10px] block">{t('askingPrice', 'ASKING PRICE')}</span>
                            <span className="font-bold text-steel-900">₹{ask.toLocaleString('en-IN')}</span>
                          </div>
                          <div>
                            <span className="text-steel-500 text-[10px] block">{t('minBid', 'MIN BID (50%)')}</span>
                            <span className="font-bold text-copper-700">₹{minBid.toLocaleString('en-IN')}</span>
                          </div>
                        </div>

                        {/* Live bidding stats bar */}
                        <div className="mt-2.5 p-2 bg-paper-200 rounded border border-steel-300 text-xs font-mono flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-steel-500 block">{t('current top bid', 'CURRENT TOP BID')}</span>
                            <span className="font-bold text-forest-700">
                              {lot.highestBid ? formatCurrency(lot.highestBid) : t('No bids yet', 'No bids yet')}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-steel-500 block">{t('bids received', 'BIDS RECEIVED')}</span>
                            <span className="font-bold text-steel-700">{lot.bids?.length || 0}</span>
                          </div>
                        </div>

                        {myBid && (
                          <div className="mt-2 text-[11px] p-2 rounded bg-copper-50 border border-copper-200 text-copper-800 flex items-center justify-between">
                            <span>{t('your bid:', 'Your Bid:')} <strong>{formatCurrency(myBid.bidAmount)}</strong></span>
                            <span className="font-bold text-[10px] uppercase px-1.5 py-0.5 rounded bg-copper-200">{t(myBid.status)}</span>
                          </div>
                        )}

                        {/* Handover Location & GPS */}
                        <div className="mt-2 text-[11px] text-steel-700 bg-paper-100 p-2 rounded border border-steel-300 space-y-1">
                          <div className="flex items-center justify-between gap-1">
                            <div className="flex items-center gap-1 min-w-0 truncate font-mono">
                              <MapPin className="w-3.5 h-3.5 text-copper-600 shrink-0" />
                              <span className="truncate font-bold text-copper-800" title={lot.locationAddress || lot.locationZone || `${lot.gpsLat}, ${lot.gpsLng}`}>
                                {lot.locationZone || lot.locationAddress || `GPS: ${lot.gpsLat?.toFixed(2)}°, ${lot.gpsLng?.toFixed(2)}°`}
                              </span>
                            </div>
                            <a
                              href={getDirectionsUrl(lot.gpsLat, lot.gpsLng)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-copper-700 hover:text-copper-900 font-bold shrink-0 flex items-center gap-0.5 underline text-[10px]"
                            >
                              <span>Map</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                          {lot.locationAddress && (
                            <p className="text-[10px] text-steel-600 truncate font-sans" title={lot.locationAddress}>
                              {lot.locationAddress}
                            </p>
                          )}
                        </div>

                        <div className="mt-1.5 text-[10px] text-steel-500 flex items-center justify-between font-mono">
                          <span>GPS: {lot.gpsLat?.toFixed(4)}°, {lot.gpsLng?.toFixed(4)}°</span>
                          <span>{lot.createdAt}</span>
                        </div>
                      </div>

                      {isBiddable ? (
                        <div className="space-y-2 pt-2 border-t border-steel-200">
                          <button
                            onClick={() => openBidModal(lot)}
                            className="w-full min-h-[44px] btn-dhatu-primary py-2.5 text-xs font-bold rounded-lg flex items-center justify-center space-x-1.5 shadow-sm active:scale-98 transition-transform"
                          >
                            <Gavel className="w-3.5 h-3.5" />
                            <span>
                              {myBid
                                ? `${t('Update Bid', 'Update Bid')} (${t('Current', 'Current')}: ${formatCurrency(myBid.bidAmount)})`
                                : `${t('Place Bid', 'Place Bid')} (Min ${formatCurrency(minBid)})`}
                            </span>
                          </button>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => handleLotDecision(lot.id, 'ACCEPT')}
                              className="bg-paper-200 hover:bg-forest-500/10 text-forest-700 border border-steel-300 py-2 text-[11px] font-bold rounded flex items-center justify-center space-x-1 transition-colors"
                              title="Accept immediately at full asking price"
                            >
                              <CheckCircle2 className="w-3 h-3 text-forest-600" />
                              <span>{t('acceptAsk', 'Accept Ask')}</span>
                            </button>
                            <button
                              onClick={() => handleLotDecision(lot.id, 'REJECT')}
                              className="bg-paper-200 hover:bg-signal-500/10 text-signal-500 border border-steel-300 py-2 text-[11px] font-bold rounded flex items-center justify-center space-x-1 transition-colors"
                            >
                              <XCircle className="w-3 h-3" />
                              <span>{t('decline', 'Decline')}</span>
                            </button>
                          </div>
                        </div>
                      ) : lot.status === 'HANDOVER_PENDING' ? (
                        <div className="pt-2 border-t border-steel-200 space-y-2">
                          <div className="p-2 bg-forest-50 border border-forest-300 rounded text-xs font-bold text-forest-700 flex items-center gap-1.5">
                            <Check className="w-4 h-4 text-forest-600 shrink-0" />
                            <span>{t('bidAcceptedMsg', 'Bid Accepted! Ready for physical QR scan.')}</span>
                          </div>
                          <button
                            onClick={() => {
                              setHandoverCode(lot.lotCode);
                              setActualWeight(lot.approxWeightKg);
                              setActiveTab('handover');
                            }}
                            className="w-full py-1.5 bg-paper-200 hover:bg-copper-100 text-copper-800 border border-copper-300 text-xs font-bold rounded transition-colors"
                          >
                            {t('Go to QR Handover Verification →', 'Go to QR Handover Verification →')}
                          </button>
                        </div>
                      ) : (
                        <div className="pt-2 border-t border-steel-200 text-xs text-steel-500 flex items-center justify-between">
                          <span>{t('status', 'Status')}: {t(lot.status)}</span>
                          {lot.confirmedAt && <span>{t('confirmed', 'Confirmed')}</span>}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: HANDOVER CONFIRMATION (QR SCAN / ENTRY) */}
      {activeTab === 'handover' && (() => {
        const previewLot: EWasteLot | undefined = incomingLots.find(
          (l: EWasteLot) => l.lotCode.toLowerCase() === handoverCode.trim().toLowerCase() || l.qrCode.toLowerCase() === handoverCode.trim().toLowerCase()
        );

        return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-paper-50 rounded-xl p-6 border-2 border-steel-300 shadow-sm space-y-6">
            <div>
              <span className="stamp-seal stamp-verified text-xs">TRACEABILITY CLOSURE</span>
              <h2 className="text-xl font-display font-black text-steel-900 mt-2">
                Digital Handover Confirmation
              </h2>
              <p className="text-xs text-steel-600">
                Scan the collector's digital QR ticket or type the lot reference code. This closes the formal chain of custody from household scrap to authorized smelter.
              </p>
            </div>

            {handoverSuccess && (
              <div className="p-4 bg-forest-500/10 border-2 border-forest-500 rounded-lg text-forest-700 text-xs font-medium space-y-2">
                <div className="font-bold flex items-center gap-1 text-forest-800">
                  <CheckCircle2 className="w-4 h-4" /> Handover Successfully Closed
                </div>
                <p>{handoverSuccess}</p>
              </div>
            )}

            <form onSubmit={handleConfirmHandover} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-steel-700 mb-1">
                  Lot Reference Code or QR String
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={handoverCode}
                    onChange={e => setHandoverCode(e.target.value)}
                    placeholder="e.g. KC-LOT-9821 or KBD-EWASTE-9821-IN"
                    className="flex-1 px-3 py-2 text-sm font-mono uppercase bg-white border-2 border-steel-300 rounded focus:border-copper-600 focus:outline-none"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setHandoverCode('KC-LOT-9821')}
                    className="px-3 py-2 bg-paper-200 hover:bg-paper-300 text-steel-700 text-xs font-bold rounded border border-steel-400"
                  >
                    Load Sample
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-steel-700 mb-1">
                  Physical Scale Weighbridge Reading (kg)
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setActualWeight(w => Math.max(0.5, Math.round((w - 0.5) * 10) / 10))}
                    className="w-12 h-12 rounded bg-paper-200 hover:bg-paper-300 border-2 border-steel-400 flex items-center justify-center font-bold text-steel-800"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    step="0.1"
                    value={actualWeight}
                    onChange={e => setActualWeight(parseFloat(e.target.value) || 0)}
                    className="flex-1 px-3 py-2.5 text-center text-lg font-mono font-bold bg-white border-2 border-steel-300 rounded focus:border-copper-600 focus:outline-none"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setActualWeight(w => Math.round((w + 0.5) * 10) / 10)}
                    className="w-12 h-12 rounded bg-paper-200 hover:bg-paper-300 border-2 border-steel-400 flex items-center justify-center font-bold text-steel-800"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Layer 3 Weighbridge & Scale Calibration Verification Card */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[10px] uppercase font-mono text-steel-600 font-bold mb-1">
                    CPCB Scale Calibration ID
                  </label>
                  <input
                    type="text"
                    value={scaleCalibrationId}
                    onChange={e => setScaleCalibrationId(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono uppercase bg-white border-2 border-steel-300 rounded focus:border-copper-600 focus:outline-none font-bold"
                    placeholder="WB-OKHLA-SCALE-04"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-mono text-steel-600 font-bold mb-1">
                    Tare / Container Weight
                  </label>
                  <div className="w-full px-3 py-2 text-xs font-mono bg-paper-200 border-2 border-steel-300 rounded text-steel-700 flex justify-between items-center">
                    <span>0.0 kg (Calibrated Zero)</span>
                    <span className="text-[10px] text-forest-700 font-bold">±0.5% Tol</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-steel-700 mb-1">
                    Authorized Operator PIN
                  </label>
                  <input
                    type="text"
                    value={operatorPin}
                    onChange={e => setOperatorPin(e.target.value)}
                    placeholder="OP-OKHLA-981"
                    className="w-full px-3 py-2 text-xs font-mono font-bold uppercase bg-white border-2 border-steel-300 rounded focus:border-copper-600 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="p-3 bg-brass-100 rounded border border-brass-400 text-xs text-steel-800 space-y-1">
                <div className="font-bold flex items-center justify-between text-brass-900">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4 text-brass-700" /> Layer 3: Industrial Traceability Closure
                  </span>
                  <span className="font-mono text-[10px] bg-forest-100 text-forest-800 px-2 py-0.5 rounded border border-forest-300 font-bold">
                    CPCB Calibrated
                  </span>
                </div>
                <p>
                  Weighbridge Operator <span className="font-mono font-bold">{operatorPin}</span> certifies physical intake of {actualWeight} kg from Collector Suresh Kumar (Aadhaar verified: XXXX-XXXX-8921). Handover confirmation generates CPCB Form-2 tamper-evident compliance audit hash.
                </p>
              </div>

              <button
                type="submit"
                className="w-full btn-dhatu-primary py-3 rounded-lg text-sm font-bold flex items-center justify-center space-x-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Verify & Confirm Handover Receipt</span>
              </button>
            </form>
          </div>

          {/* QR Verification Visualizer */}
          <div className="receipt-stub rounded-xl p-6 border-2 border-steel-400 space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start border-b border-steel-300 pb-3">
                <div>
                  <span className="font-display font-black text-lg text-steel-900">
                    CPCB Electronic Handover Stamp
                  </span>
                  <p className="text-xs text-steel-600">
                    {previewLot ? `Active lot record: #${previewLot.lotCode}` : 'Sample active handover ticket in transit'}
                  </p>
                </div>
                <div className={`stamp-seal text-xs ${previewLot?.status === 'CONFIRMED' ? 'stamp-verified' : 'stamp-pending'}`}>
                  {previewLot ? previewLot.status : 'IN TRANSIT'}
                </div>
              </div>

              <div className="my-6 p-4 bg-white rounded border border-steel-300 flex flex-col items-center justify-center space-y-3">
                <div className="w-36 h-36 bg-paper-200 border-2 border-steel-800 p-2 flex items-center justify-center rounded">
                  <QrCode className="w-28 h-28 text-steel-900" />
                </div>
                <div className="text-center font-mono text-xs text-steel-700">
                  <div className="font-bold">{previewLot ? previewLot.lotCode : 'KC-LOT-9821'}</div>
                  <div className="text-[10px] text-steel-500">
                    {previewLot ? `QR: ${previewLot.qrCode}` : 'SHA256: e3b0c44298fc1c149afbf4c8...'}
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-xs font-mono text-steel-800 bg-paper-100 p-3 rounded border border-paper-300">
                <div className="flex justify-between">
                  <span className="text-steel-500">Item:</span>
                  <span className="font-bold">
                    {previewLot ? preserveEnglishItemName(previewLot.category) : 'High-grade Server PCBs'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-steel-500">Estimated Weight:</span>
                  <span className="font-bold">
                    {previewLot ? `${previewLot.approxWeightKg} kg` : '18.5 kg'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-steel-500">
                    {previewLot?.isCustomLot ? 'Blended Rate:' : 'Agreed Rate:'}
                  </span>
                  <span className="font-bold text-copper-600">
                    ₹{previewLot ? previewLot.recyclerOfferedRate : 640} / kg
                  </span>
                </div>

                {/* Custom Mixed Lot Material Manifest in QR Ticket */}
                {previewLot?.isCustomLot && previewLot.items && previewLot.items.length > 0 && (
                  <div className="pt-2 border-t border-paper-300 space-y-1">
                    <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-copper-800">
                      <Layers className="w-3 h-3 text-copper-600" />
                      <span>Composite Manifest ({previewLot.items.length} items):</span>
                    </div>
                    <div className="space-y-1">
                      {previewLot.items.map((item: EWasteLotItem, idx: number) => (
                        <div key={idx} className="flex justify-between items-center text-[11px] bg-white px-2 py-0.5 rounded border border-steel-200">
                          <span className="truncate pr-1">• {preserveEnglishItemName(item.category)}</span>
                          <span className="font-bold text-copper-700 shrink-0">{item.weightKg} kg (₹{item.ratePerKg}/kg)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-steel-500">Handover Location:</span>
                  <span>Okhla Ph-II Gate 3</span>
                </div>
              </div>
            </div>

            <div className="text-[11px] text-steel-500 italic text-center">
              "No formal e-waste moves without a verified digital lot record." — SIH26229 Problem Guideline
            </div>
          </div>
        </div>
        );
      })()}

      {/* TAB 3: RATE-SETTING CONSOLE */}
      {activeTab === 'rates' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-xl font-display font-black text-steel-900">
                Aggregator Rate-Setting Console
              </h2>
              <p className="text-xs text-steel-600 font-medium">
                Pushed rates instantly update the live Price Boards of all collectors operating within your 25km zone.
              </p>
            </div>
            {rateUpdateSuccess && (
              <span className="stamp-seal stamp-verified text-xs bg-forest-500/20 text-forest-600">
                RATES BROADCASTED LIVE
              </span>
            )}
          </div>

          <form onSubmit={handleSaveRates} className="bg-paper-50 rounded-xl p-6 border-2 border-steel-300 shadow-sm space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(rates).map(([category, rate]) => (
                <div key={category} className="p-3 bg-white rounded-lg border border-steel-200 flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <span className="text-xs font-bold text-steel-900 block">{preserveEnglishItemName(category)}</span>
                    <span className="text-[10px] text-steel-500 font-mono">Commodity Benchmark: ₹{rate - 10} - ₹{rate + 25}/kg</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="font-mono text-sm font-bold text-steel-700">₹</span>
                    <input
                      type="number"
                      value={rate}
                      onChange={e => {
                        const val = parseFloat(e.target.value) || 0;
                        setRates(prev => ({ ...prev, [category]: val }));
                      }}
                      className="w-24 px-2 py-1.5 text-right font-mono font-bold text-copper-600 bg-paper-100 border border-steel-400 rounded focus:border-copper-600 focus:outline-none"
                    />
                    <span className="text-xs text-steel-500 font-mono">/kg</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-4 border-t border-steel-200">
              <button
                type="submit"
                className="btn-dhatu-primary px-6 py-2.5 rounded-lg text-sm font-bold flex items-center space-x-2"
              >
                <TrendingUp className="w-4 h-4" />
                <span>Broadcast Updated Rates to Collector Price Boards</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 4: AI ANOMALY FLAGS */}
      {activeTab === 'anomalies' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="stamp-seal stamp-hazard text-xs">AI/ML DETECTION ENGINE</span>
              <h2 className="text-xl font-display font-black text-steel-900 mt-2">
                Transaction Value & Weight Anomaly Flags
              </h2>
              <p className="text-xs text-steel-600">
                Surfaced by the statistical Z-score & payload outlier detector to prevent money laundering, fake lot dumping, and data entry errors.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {anomalies.map(anom => (
              <div
                key={anom.id}
                className={`receipt-stub rounded-lg p-5 border-2 ${
                  anom.severity === 'HIGH' ? 'border-signal-500' : 'border-brass-500'
                } shadow-sm space-y-3`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-steel-200 pb-2">
                  <div className="flex items-center space-x-2">
                    <span className={`stamp-seal ${anom.severity === 'HIGH' ? 'stamp-hazard' : 'stamp-pending'} text-[10px]`}>
                      {anom.severity} RISK
                    </span>
                    <span className="font-mono text-xs font-bold text-steel-900">Lot: {anom.lotCode}</span>
                    <span className="text-xs text-steel-600">Collector: <strong>{anom.collectorName}</strong></span>
                  </div>
                  <div className="text-[11px] font-mono text-steel-500">
                    Flagged: {anom.flaggedAt}
                  </div>
                </div>

                <p className="text-xs text-steel-800 font-medium">
                  {anom.reason}
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-paper-100 p-2.5 rounded text-xs font-mono border border-paper-300">
                  <div>
                    <span className="text-[10px] text-steel-500 block">CATEGORY</span>
                    <span className="font-bold">{preserveEnglishItemName(anom.category)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-steel-500 block">WEIGHT</span>
                    <span className="font-bold">{anom.weightKg} kg</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-steel-500 block">DECLARED</span>
                    <span className="font-bold text-signal-500">{formatCurrency(anom.declaredValue)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-steel-500 block">BENCHMARK</span>
                    <span className="font-bold text-forest-600">{formatCurrency(anom.benchmarkValue)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-steel-200">
                  <span className="text-[11px] text-steel-500">
                    Status: <strong className={anom.status === 'FLAGGED' ? 'text-signal-600' : 'text-forest-600'}>{anom.status}</strong>
                  </span>
                  {anom.status === 'FLAGGED' && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleResolveAnomaly(anom.id, 'REVIEWED')}
                        className="px-3 py-1 bg-paper-200 hover:bg-forest-500/20 text-forest-700 text-xs font-bold rounded border border-steel-300"
                      >
                        Mark Verified & Audited
                      </button>
                      <button
                        onClick={() => handleResolveAnomaly(anom.id, 'DISMISSED')}
                        className="px-3 py-1 bg-paper-200 hover:bg-steel-300 text-steel-700 text-xs font-bold rounded border border-steel-300"
                      >
                        Dismiss Flag
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: CPCB EPR COMPLIANCE REPORTS */}
      {activeTab === 'reports' && (
        <div className="bg-paper-50 rounded-xl p-6 sm:p-8 border-2 border-steel-300 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-steel-200 pb-4">
            <div>
              <span className="stamp-seal stamp-verified text-xs">EPR COMPLIANCE AUDIT</span>
              <h2 className="text-xl font-display font-black text-steel-900 mt-2">
                CPCB Form-2 & Form-6 Regulatory Filing Packages
              </h2>
              <p className="text-xs text-steel-600">
                Generate and download audit-ready compliance packages conforming to the E-Waste (Management) Rules 2022.
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleExportEPR('json')}
                className="btn-dhatu-primary px-3.5 py-2 rounded text-xs font-bold flex items-center space-x-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Form-2 (JSON)</span>
              </button>
              <button
                onClick={() => handleExportEPR('csv')}
                className="bg-paper-200 hover:bg-paper-300 text-steel-800 border-2 border-steel-400 px-3.5 py-2 rounded text-xs font-bold flex items-center space-x-1.5"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-forest-600" />
                <span>Export Ledger (CSV)</span>
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
              <div className="bg-white p-4 rounded border border-steel-300">
                <span className="text-steel-500 block text-[10px]">TOTAL RECORDED INTAKE</span>
                <span className="text-2xl font-bold text-copper-600">14,850.5 kg</span>
                <span className="text-[10px] text-forest-600 block mt-1">100% Traceable to source</span>
              </div>
              <div className="bg-white p-4 rounded border border-steel-300">
                <span className="text-steel-500 block text-[10px]">EPR CREDITS GENERATED</span>
                <span className="text-2xl font-bold text-forest-600">17,820 Units</span>
                <span className="text-[10px] text-steel-500 block mt-1">Ready for CPCB portal sync</span>
              </div>
              <div className="bg-white p-4 rounded border border-steel-300">
                <span className="text-steel-500 block text-[10px]">SMELTER RECOVERY YIELD</span>
                <span className="text-2xl font-bold text-steel-900">92.4%</span>
                <span className="text-[10px] text-brass-700 block mt-1">Closed-loop recovery</span>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-steel-300 overflow-hidden">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-paper-200 text-steel-700 border-b border-steel-300 uppercase text-[10px]">
                  <tr>
                    <th className="p-3">E-Waste Category</th>
                    <th className="p-3">Weight (kg)</th>
                    <th className="p-3">Recovery Stream</th>
                    <th className="p-3">EPR Certificate Ref</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-steel-200">
                  <tr>
                    <td className="p-3 font-bold">Printed Circuit Boards (Grade A/B)</td>
                    <td className="p-3">4,210.0 kg</td>
                    <td className="p-3 text-copper-700 font-bold">Copper + Precious Metals</td>
                    <td className="p-3 text-forest-700">CPCB-EPR-2026-PCB-8812</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold">Clean Copper Wiring & Cables</td>
                    <td className="p-3">3,850.0 kg</td>
                    <td className="p-3 text-copper-700 font-bold">Refined Copper Wire Rods</td>
                    <td className="p-3 text-forest-700">CPCB-EPR-2026-CU-4419</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold">Lithium-ion Batteries</td>
                    <td className="p-3">2,940.5 kg</td>
                    <td className="p-3 text-copper-700 font-bold">Cobalt/Lithium Black Mass</td>
                    <td className="p-3 text-forest-700">CPCB-EPR-2026-BAT-1029</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold">CRT Funnel Glass (Treated)</td>
                    <td className="p-3">2,150.0 kg</td>
                    <td className="p-3 text-copper-700 font-bold">Lead Separation / Slag Fix</td>
                    <td className="p-3 text-forest-700">CPCB-EPR-2026-CRT-9920</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: FACILITY PROFILE */}
      {activeTab === 'profile' && (
        <div className="receipt-stub rounded-xl p-6 sm:p-8 border-2 border-steel-300 space-y-6">
          <div className="flex items-center justify-between border-b border-steel-200 pb-4">
            <div>
              <span className="stamp-seal stamp-verified text-xs">AUTHORIZED AGGREGATOR</span>
              <h2 className="text-xl font-display font-black text-steel-900 mt-2">
                CPCB Registered Processing Facility Profile
              </h2>
            </div>
            <span className="font-mono text-xs text-steel-500">Facility ID: FAC-DL-OKHLA-02</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="space-y-3">
              <div>
                <span className="text-steel-500 font-mono block">FACILITY LEGAL ENTITY</span>
                <span className="text-sm font-bold text-steel-900">EcoRecycle Aggregators Private Limited</span>
              </div>
              <div>
                <span className="text-steel-500 font-mono block">CENTRAL POLLUTION CONTROL BOARD REG</span>
                <span className="font-mono font-bold text-copper-600">CPCB-EW-2023-DL-0881 (Valid till 2028)</span>
              </div>
              <div>
                <span className="text-steel-500 font-mono block">STATE PCB CONSENT TO OPERATE (CTO)</span>
                <span className="font-mono text-steel-800">DPCC/E-WASTE/CTO/2023/1049</span>
              </div>
              <div>
                <span className="text-steel-500 font-mono block">PHYSICAL ADDRESS</span>
                <span className="text-steel-800">Plot 42, Okhla Phase-II Industrial Area, New Delhi - 110020</span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-steel-500 font-mono block">SERVICE RADIUS</span>
                <span className="font-bold text-steel-800">25 km (Regional Industrial & Urban Hub Network)</span>
              </div>
              <div>
                <span className="text-steel-500 font-mono block">AUTHORIZED E-WASTE STREAMS</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {['CRTs', 'LCDs', 'PCBs', 'Copper Cables', 'Batteries', 'Magnets', 'ABS Plastics'].map(m => (
                    <span key={m} className="px-2 py-0.5 bg-paper-200 text-steel-800 rounded font-mono text-[10px] border border-steel-300">
                      {m}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-steel-500 font-mono block">PICKUP FLEET</span>
                <span className="text-steel-800">4 Electric Mini-Trucks (2-tonne payload each) with GPS Telematics</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MOBILE BOTTOM NAVIGATION BAR (Material 3 Expressive Navigation Bar) */}
      <nav
        aria-label="Recycler Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/80 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] px-2 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom,0.75rem))]"
      >
        <div className="flex items-center justify-around gap-1 max-w-md mx-auto">
          <button
            onClick={() => setActiveTab('incoming')}
            className={`flex-1 min-w-0 py-1 px-1 rounded-2xl flex flex-col items-center justify-center transition-all ${
              activeTab === 'incoming'
                ? 'font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <div className={`w-12 h-7 rounded-full flex items-center justify-center transition-all ${activeTab === 'incoming' ? 'm3-nav-pill-active' : 'text-slate-500'}`}>
              <Scale className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-semibold mt-1 truncate max-w-full">{t('mNavIncoming', 'Lots')}</span>
          </button>

          <button
            onClick={() => setActiveTab('handover')}
            className={`flex-1 min-w-0 py-1 px-1 rounded-2xl flex flex-col items-center justify-center transition-all ${
              activeTab === 'handover'
                ? 'font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <div className={`w-12 h-7 rounded-full flex items-center justify-center transition-all ${activeTab === 'handover' ? 'm3-nav-pill-active' : 'text-slate-500'}`}>
              <QrCode className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-semibold mt-1 truncate max-w-full">{t('mNavVerify', 'Scan QR')}</span>
          </button>

          <button
            onClick={() => setActiveTab('rates')}
            className={`flex-1 min-w-0 py-1 px-1 rounded-2xl flex flex-col items-center justify-center transition-all ${
              activeTab === 'rates'
                ? 'font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <div className={`w-12 h-7 rounded-full flex items-center justify-center transition-all ${activeTab === 'rates' ? 'm3-nav-pill-active' : 'text-slate-500'}`}>
              <Sliders className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-semibold mt-1 truncate max-w-full">{t('mNavRates', 'Rates')}</span>
          </button>

          <button
            onClick={() => setActiveTab('anomalies')}
            className={`flex-1 min-w-0 py-1 px-1 rounded-2xl flex flex-col items-center justify-center transition-all ${
              activeTab === 'anomalies'
                ? 'text-rose-950 font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <div className={`w-12 h-7 rounded-full flex items-center justify-center transition-all ${activeTab === 'anomalies' ? 'bg-rose-100 text-rose-800' : 'text-slate-500'}`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-semibold mt-1 truncate max-w-full">{t('mNavAnomalies', 'Alerts')}</span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`flex-1 min-w-0 py-1 px-1 rounded-2xl flex flex-col items-center justify-center transition-all ${
              activeTab === 'reports'
                ? 'font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <div className={`w-12 h-7 rounded-full flex items-center justify-center transition-all ${activeTab === 'reports' ? 'm3-nav-pill-active' : 'text-slate-500'}`}>
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-semibold mt-1 truncate max-w-full">{t('mNavReports', 'Reports')}</span>
          </button>
        </div>
      </nav>

      {/* RECYCLER BIDDING MODAL (Rule: valid bid must be >= 50% of asking price) */}
      {biddingLot && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-steel-950/80 backdrop-blur-sm animate-fade-in"
          onClick={() => setBiddingLot(null)}
        >
          <div
            className="bg-paper-50 rounded-2xl border-2 border-copper-600 max-w-md w-full p-6 shadow-tactile-lg space-y-5 text-steel-900 overflow-y-auto max-h-[90vh] relative"
            onClick={e => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setBiddingLot(null)}
              className="absolute top-4 right-4 p-2 rounded-full text-steel-500 hover:text-steel-900 hover:bg-paper-200 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="space-y-1">
              <span className="stamp-seal stamp-verified text-[10px]">RECYCLER BIDDING</span>
              <h3 className="text-lg font-display font-black text-steel-950 mt-1">
                Submit Bid for Lot #{biddingLot.lotCode}
              </h3>
              <p className="text-xs text-steel-600 font-medium">
                {preserveEnglishItemName(biddingLot.category)} • {biddingLot.approxWeightKg} kg
              </p>
            </div>

            {/* Custom Mixed Lot Manifest in Bidding Modal */}
            {biddingLot.isCustomLot && biddingLot.items && biddingLot.items.length > 0 && (
              <div className="p-2.5 bg-paper-100 rounded-lg border border-steel-300 font-mono text-xs space-y-1">
                <div className="flex items-center justify-between text-[10px] uppercase font-bold text-copper-800 pb-1 border-b border-steel-200">
                  <span className="flex items-center gap-1">
                    <Layers className="w-3 h-3 text-copper-600" />
                    <span>Material Manifest ({biddingLot.items.length} materials)</span>
                  </span>
                  <span>Blended: ₹{biddingLot.recyclerOfferedRate}/kg</span>
                </div>
                <div className="space-y-1 pt-1">
                  {biddingLot.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-[11px] text-steel-800">
                      <span className="truncate pr-1">• {preserveEnglishItemName(item.category)}</span>
                      <span className="font-bold text-copper-700 shrink-0">{item.weightKg} kg (₹{item.ratePerKg}/kg)</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Asking Price & Min 50% Threshold Summary */}
            {(() => {
              const ask = Number(biddingLot.askingPrice || biddingLot.estimatedValue || 0);
              const minBid = Number(biddingLot.minBidAmount) || Math.floor(ask * 0.5);
              const weight = Number(biddingLot.approxWeightKg) || 1;
              const baseRate = Number(biddingLot.recyclerOfferedRate) || Math.round(ask / weight);
              const minRate = Math.floor(baseRate * 0.5);
              const effectiveTotal = Number(bidAmountInput) || 0;
              const effectiveRate = Number(bidRateInput) || Math.round(effectiveTotal / weight);
              const isBelowMin = effectiveTotal < minBid;

              // If entered in total mode, check if entered number might be intended as rate per kg
              const looksLikeRate = bidMode === 'total' && effectiveTotal > 0 && effectiveTotal < minBid && effectiveTotal >= minRate && effectiveTotal <= baseRate * 1.5;
              const suggestedTotalFromRate = Math.round(effectiveTotal * weight);

              return (
                <form onSubmit={handleSubmitBid} noValidate className="space-y-4">
                  {/* Asking & Minimum summary card */}
                  <div className="grid grid-cols-2 gap-2 bg-paper-100 p-3 rounded-xl border border-steel-300 font-mono text-xs">
                    <div className="bg-paper-50 p-2.5 rounded border border-steel-200">
                      <span className="text-[10px] text-steel-500 block">COLLECTOR ASK</span>
                      <span className="font-bold text-steel-900 text-sm">₹{ask.toLocaleString('en-IN')}</span>
                      <span className="text-[10px] text-steel-500 block">₹{baseRate}/kg</span>
                    </div>
                    <div className="bg-forest-50 p-2.5 rounded border border-forest-300">
                      <span className="text-[10px] text-forest-700 block font-bold">MIN VALID BID (50%)</span>
                      <span className="font-bold text-forest-800 text-sm">₹{minBid.toLocaleString('en-IN')}</span>
                      <span className="text-[10px] text-forest-700 font-semibold block">₹{minRate}/kg</span>
                    </div>
                  </div>

                  {biddingLot.highestBid ? (
                    <div className="p-2.5 bg-paper-200 rounded-lg border border-steel-300 text-xs font-mono flex items-center justify-between">
                      <span className="text-steel-600">Current Highest Bid:</span>
                      <span className="font-bold text-forest-700">₹{Number(biddingLot.highestBid).toLocaleString('en-IN')} (₹{Math.round(Number(biddingLot.highestBid) / weight)}/kg)</span>
                    </div>
                  ) : null}

                  {/* Mode switch: Total vs Rate per Kg */}
                  <div className="flex bg-paper-200 p-1 rounded-lg border border-steel-300 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => {
                        setBidMode('total');
                        setBidError(null);
                      }}
                      className={`flex-1 py-1.5 px-2 rounded text-center transition-all ${
                        bidMode === 'total'
                          ? 'bg-copper-700 text-paper-50 shadow-tactile'
                          : 'text-steel-700 hover:text-steel-900'
                      }`}
                    >
                      Bid by Total (₹)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setBidMode('rate');
                        setBidError(null);
                      }}
                      className={`flex-1 py-1.5 px-2 rounded text-center transition-all ${
                        bidMode === 'rate'
                          ? 'bg-copper-700 text-paper-50 shadow-tactile'
                          : 'text-steel-700 hover:text-steel-900'
                      }`}
                    >
                      Bid by Rate (₹/kg)
                    </button>
                  </div>

                  {/* Quick percentage shortcuts */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-steel-700 mb-1.5">
                      Quick Bid Presets
                    </label>
                    <div className="grid grid-cols-4 gap-1.5 text-xs font-mono">
                      {[
                        { label: '50% MIN', val: minBid },
                        { label: '70%', val: Math.round(ask * 0.7) },
                        { label: '85%', val: Math.round(ask * 0.85) },
                        { label: '100% ASK', val: ask }
                      ].map(preset => {
                        const presetRate = Math.round(preset.val / weight);
                        const isSelected = effectiveTotal === preset.val;
                        return (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => {
                              setBidAmountInput(preset.val);
                              setBidRateInput(presetRate);
                              setBidError(null);
                              triggerHaptic(15);
                            }}
                            className={`p-2 rounded border text-center transition-all ${
                              isSelected
                                ? 'bg-copper-700 text-paper-50 border-copper-700 font-bold shadow-tactile'
                                : 'bg-paper-200 hover:bg-paper-300 text-steel-800 border-steel-300'
                            }`}
                          >
                            <span className="block text-[10px] opacity-80">{preset.label}</span>
                            ₹{preset.val.toLocaleString('en-IN')}
                            <span className="block text-[9px] opacity-75">₹{presetRate}/kg</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Custom Bid Input depending on Mode */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-steel-700">
                        {bidMode === 'total' ? 'Your Total Bid (₹)' : `Your Offer Rate (₹/kg for ${weight} kg)`}
                      </label>
                      <span className="text-[11px] font-mono text-copper-700 font-bold">
                        {bidMode === 'total' ? `₹${effectiveRate}/kg` : `Total: ₹${effectiveTotal.toLocaleString('en-IN')}`}
                      </span>
                    </div>

                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base font-bold text-steel-600">
                        ₹
                      </span>
                      {bidMode === 'total' ? (
                        <input
                          type="number"
                          step="any"
                          min="1"
                          value={bidAmountInput || ''}
                          onChange={e => handleTotalInputChange(Number(e.target.value), biddingLot)}
                          className={`w-full pl-8 pr-4 py-3 bg-paper-50 border-2 rounded-lg font-mono text-lg font-bold focus:outline-none ${
                            isBelowMin && effectiveTotal > 0 ? 'border-signal-500 text-signal-600' : 'border-steel-400 focus:border-copper-600 text-steel-900'
                          }`}
                          placeholder={`Min ₹${minBid}`}
                          required
                        />
                      ) : (
                        <input
                          type="number"
                          step="any"
                          min="1"
                          value={bidRateInput || ''}
                          onChange={e => handleRateInputChange(Number(e.target.value), biddingLot)}
                          className={`w-full pl-8 pr-4 py-3 bg-paper-50 border-2 rounded-lg font-mono text-lg font-bold focus:outline-none ${
                            effectiveRate < minRate && effectiveRate > 0 ? 'border-signal-500 text-signal-600' : 'border-steel-400 focus:border-copper-600 text-steel-900'
                          }`}
                          placeholder={`Min ₹${minRate}/kg`}
                          required
                        />
                      )}
                    </div>

                    {/* Rate helper / conversion pill if user entered per-kg rate while in total mode */}
                    {looksLikeRate && (
                      <div className="mt-2 p-2 bg-brass-50 border border-brass-300 rounded text-[11px] text-brass-800 flex items-center justify-between animate-fade-in">
                        <span>💡 Did you mean <strong>₹{effectiveTotal}/kg</strong> (Total: ₹{suggestedTotalFromRate.toLocaleString('en-IN')})?</span>
                        <button
                          type="button"
                          onClick={() => {
                            handleRateInputChange(effectiveTotal, biddingLot);
                            setBidMode('rate');
                            triggerHaptic(15);
                          }}
                          className="px-2 py-0.5 bg-brass-700 text-paper-50 rounded font-bold hover:bg-brass-800 transition-colors ml-2 shrink-0"
                        >
                          Apply as ₹/kg
                        </button>
                      </div>
                    )}

                    <div className="mt-1 flex items-center justify-between text-[11px] text-steel-600 font-mono">
                      <span>Effective Rate: <strong>₹{effectiveRate}/kg</strong></span>
                      <span>Min required: <strong>₹{minBid.toLocaleString('en-IN')} (₹{minRate}/kg)</strong></span>
                    </div>
                  </div>

                  {/* Error display */}
                  {bidError && (
                    <div className="p-3 bg-signal-500/10 border border-signal-500 rounded-lg text-signal-600 text-xs font-semibold flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{bidError}</span>
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="pt-2 space-y-2">
                    <button
                      type="submit"
                      disabled={isBelowMin || !effectiveTotal}
                      className="w-full min-h-[48px] py-3 bg-copper-700 hover:bg-copper-800 disabled:opacity-50 disabled:cursor-not-allowed text-paper-50 font-bold rounded-lg shadow-tactile text-sm flex items-center justify-center gap-2 active:translate-y-0.5 transition-all"
                    >
                      <Gavel className="w-4 h-4" />
                      <span>Submit Bid of ₹{effectiveTotal.toLocaleString('en-IN')} (₹{effectiveRate}/kg)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setBiddingLot(null)}
                      className="w-full min-h-[44px] py-2 bg-paper-200 hover:bg-paper-300 text-steel-700 font-semibold rounded-lg border border-steel-300 text-xs transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              );
            })()}
          </div>
        </div>
      )}

    </div>
  );
};
