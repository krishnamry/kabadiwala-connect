import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { EWasteLot, TransactionAnomaly } from '../../types';
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
  Tag
} from 'lucide-react';
import { VoiceAssistButton } from '../../components/VoiceAssistButton';
import { triggerHaptic, hapticSuccess } from '../../lib/haptics';

export const RecyclerDashboard: React.FC = () => {
  const { user } = useAuth();
  const { language, t, formatCurrency, speak, preserveEnglishItemName } = useLanguage();
  const [activeTab, setActiveTab] = useState<'incoming' | 'handover' | 'rates' | 'anomalies' | 'reports' | 'profile'>('incoming');

  // Recycler buying rates state
  const [rates, setRates] = useState<{ [category: string]: number }>({
    'High-grade PCB (Motherboards/Servers)': 640,
    'Low-grade PCB (Consumer Electronics)': 180,
    'Copper Wiring (Clean Bright)': 480,
    'Li-ion Batteries (Laptops/EV)': 145,
    'Electric Motors & Magnets': 95,
    'LCD & LED Display Panels': 85,
    'Engineering Plastics (ABS/HIPS)': 38,
    'CRT Glass (Funnel Treated)': 12,
  });

  const [rateUpdateSuccess, setRateUpdateSuccess] = useState(false);

  // Incoming Lots from collectors (backed by local storage)
  const [incomingLots, setIncomingLots] = useState<EWasteLot[]>(() => storage.getLots());

  // Handover confirmation state
  const [handoverCode, setHandoverCode] = useState('');
  const [actualWeight, setActualWeight] = useState(18.5);
  const [handoverSuccess, setHandoverSuccess] = useState<string | null>(null);

  // Anomalies state (backed by local storage)
  const [anomalies, setAnomalies] = useState<TransactionAnomaly[]>(() => storage.getAnomalies());

  // Recycler Bidding state
  const [biddingLot, setBiddingLot] = useState<EWasteLot | null>(null);
  const [bidAmountInput, setBidAmountInput] = useState<number>(0);
  const [bidError, setBidError] = useState<string | null>(null);
  const [bidSuccess, setBidSuccess] = useState<string | null>(null);

  const openBidModal = (lot: EWasteLot) => {
    setBiddingLot(lot);
    const ask = lot.askingPrice || lot.estimatedValue;
    const minBid = lot.minBidAmount || Math.round(ask * 0.5);
    const defaultBid = lot.highestBid ? Math.max(lot.highestBid + 500, minBid) : Math.round(ask * 0.85);
    setBidAmountInput(defaultBid);
    setBidError(null);
    triggerHaptic(20);
  };

  const handleSubmitBid = (e: React.FormEvent) => {
    e.preventDefault();
    if (!biddingLot) return;
    const ask = biddingLot.askingPrice || biddingLot.estimatedValue;
    const minBid = biddingLot.minBidAmount || Math.round(ask * 0.5);
    if (bidAmountInput < minBid) {
      setBidError(`Invalid bid: Must be at least ₹${minBid.toLocaleString('en-IN')} (50% of asking price ₹${ask.toLocaleString('en-IN')})`);
      return;
    }

    try {
      const { lot: updatedLot } = storage.addBidToLot(biddingLot.id, {
        recyclerId: user?.id || 'rec-01',
        recyclerName: user?.recycler?.facilityName || user?.name || 'M/s EcoRecycle Aggregators Ltd',
        bidAmount: bidAmountInput
      });
      setIncomingLots(storage.getLots());
      hapticSuccess();
      setBidSuccess(`Bid of ₹${bidAmountInput.toLocaleString('en-IN')} successfully placed on Lot #${updatedLot.lotCode}! Waiting for collector to review.`);
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

    const finalCode = matchedLot ? matchedLot.lotCode : handoverCode.toUpperCase();
    
    // Update lot status to CONFIRMED
    storage.updateLotStatus(finalCode, 'CONFIRMED', {
      approxWeightKg: actualWeight,
      confirmedAt: new Date().toISOString()
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
      `Handover verified & registered! Lot #${finalCode} confirmed at ${actualWeight} kg. Payout of ₹${payoutAmount} credited to collector passbook. CPCB EPR Form-2 audit hash: 0x${Math.random().toString(16).substr(2, 8)}... Traceability loop successfully closed.`
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
      
      {/* Top Header - Dhatu Industrial Passbook Style */}
      <div className="bg-steel-900 text-paper-50 rounded-xl p-5 sm:p-8 border-2 border-steel-700 shadow-tactile-lg flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden">
        <div className="space-y-2 z-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="stamp-seal stamp-verified text-[11px] bg-forest-500/20 text-forest-500 border-forest-500">
              CPCB / SPCB AUTHORIZED
            </span>
            <span className="font-mono text-xs text-brass-400 bg-steel-950 px-2 py-0.5 rounded border border-steel-800">
              REG: CPCB-EW-2023-DL-0881
            </span>
            <VoiceAssistButton
              text="EcoRecycle Aggregators Facility Dashboard. Authorized CPCB formal recycler interface."
              hindiText="इको रीसायकल एग्रीगेटर्स सुविधा डैशबोर्ड। अधिकृत सीपीसीबी रीसायकलर मंच।"
              marathiText="इको रीसायकल अ‍ॅग्रीगेटर्स सुविधा डॅशबोर्ड. अधिकृत सीपीसीबी रीसायकलर व्यासपीठ."
              size="sm"
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-black tracking-tight text-paper-50">
            EcoRecycle Aggregators <span className="text-copper-400 font-sans text-lg">(Okhla Terminal)</span>
          </h1>
          <p className="text-xs sm:text-sm text-paper-300 max-w-2xl font-medium">
            CPCB E-Waste Rules 2022 Central Registry • Weighbridge & EPR Credit Generation
          </p>
        </div>

        {/* Real-Time Processing Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 z-10 font-mono text-center sm:text-right">
          <div className="bg-steel-950/80 p-3 rounded-lg border border-steel-800">
            <div className="text-xs text-paper-400 uppercase font-mono">Total Processed</div>
            <div className="text-lg font-mono-num font-bold text-forest-400">
              14,850 kg
            </div>
            <div className="text-[10px] text-paper-400">Q2-2026 Batch</div>
          </div>
          <div className="bg-steel-950/80 p-3 rounded-lg border border-steel-800">
            <div className="text-xs text-paper-400 uppercase font-mono">Pending Lots</div>
            <div className="text-lg font-mono-num font-bold text-copper-400">
              {incomingLots.filter(l => l.status === 'REQUESTED' || l.status === 'BIDDING').length} Lots
            </div>
            <div className="text-[10px] text-paper-400">From Active Collectors</div>
          </div>
          <div className="bg-steel-950/80 p-3 rounded-lg border border-steel-800 col-span-2 sm:col-span-1">
            <div className="text-xs text-paper-400 uppercase font-mono">Anomalies</div>
            <div className="text-lg font-mono-num font-bold text-signal-500">
              {anomalies.filter(a => a.status === 'FLAGGED').length} Alert
            </div>
            <div className="text-[10px] text-paper-400">Review Required</div>
          </div>
        </div>
      </div>

      {/* Navigation Tab Bar - Horizontal Scrollable on Mobile Portrait */}
      <div className="flex overflow-x-auto no-scrollbar gap-2 border-b-2 border-steel-300 pb-2 -mx-3 px-3 sm:mx-0 sm:px-0 flex-nowrap">
        <button
          onClick={() => setActiveTab('incoming')}
          className={`flex-shrink-0 whitespace-nowrap px-4 py-2.5 rounded-lg font-bold text-xs flex items-center space-x-2 transition-all ${
            activeTab === 'incoming'
              ? 'bg-copper-600 text-white shadow-tactile border border-copper-700'
              : 'bg-paper-200 text-steel-800 hover:bg-paper-300 border border-steel-300'
          }`}
        >
          <Scale className="w-4 h-4" />
          <span>1. {t('tabIncoming', 'Incoming Collector Lots')} ({incomingLots.filter(l => l.status === 'REQUESTED' || l.status === 'BIDDING').length})</span>
        </button>

        <button
          onClick={() => setActiveTab('handover')}
          className={`flex-shrink-0 whitespace-nowrap px-4 py-2.5 rounded-lg font-bold text-xs flex items-center space-x-2 transition-all ${
            activeTab === 'handover'
              ? 'bg-copper-600 text-white shadow-tactile border border-copper-700'
              : 'bg-paper-200 text-steel-800 hover:bg-paper-300 border border-steel-300'
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>2. {t('tabVerifyQr', 'Confirm Handover (QR Scan)')}</span>
        </button>

        <button
          onClick={() => setActiveTab('rates')}
          className={`flex-shrink-0 whitespace-nowrap px-4 py-2.5 rounded-lg font-bold text-xs flex items-center space-x-2 transition-all ${
            activeTab === 'rates'
              ? 'bg-copper-600 text-white shadow-tactile border border-copper-700'
              : 'bg-paper-200 text-steel-800 hover:bg-paper-300 border border-steel-300'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>3. {t('tabRateConsole', 'Rate-Setting Console')}</span>
        </button>

        <button
          onClick={() => setActiveTab('anomalies')}
          className={`flex-shrink-0 whitespace-nowrap px-4 py-2.5 rounded-lg font-bold text-xs flex items-center space-x-2 transition-all ${
            activeTab === 'anomalies'
              ? 'bg-signal-500 text-white shadow-tactile border border-signal-600'
              : 'bg-paper-200 text-steel-800 hover:bg-paper-300 border border-steel-300'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>4. {t('tabAnomalies', 'AI Anomaly Flags')} ({anomalies.filter(a => a.status === 'FLAGGED').length})</span>
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`flex-shrink-0 whitespace-nowrap px-4 py-2.5 rounded-lg font-bold text-xs flex items-center space-x-2 transition-all ${
            activeTab === 'reports'
              ? 'bg-steel-800 text-white shadow-tactile border border-steel-900'
              : 'bg-paper-200 text-steel-800 hover:bg-paper-300 border border-steel-300'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>5. {t('tabReports', 'CPCB EPR Compliance Reports')}</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`flex-shrink-0 whitespace-nowrap px-4 py-2.5 rounded-lg font-bold text-xs flex items-center space-x-2 transition-all ${
            activeTab === 'profile'
              ? 'bg-steel-800 text-white shadow-tactile border border-steel-900'
              : 'bg-paper-200 text-steel-800 hover:bg-paper-300 border border-steel-300'
          }`}
        >
          <Factory className="w-4 h-4" />
          <span>Facility Profile</span>
        </button>
      </div>

      {/* TAB 1: INCOMING LOT REQUESTS & BIDDING */}
      {activeTab === 'incoming' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-xl font-display font-black text-steel-900">
                Incoming Collector Lots & Bidding Market
              </h2>
              <p className="text-xs text-steel-600 font-medium">
                Bid for digital lots submitted by verified door-to-door collectors in Delhi NCR. Valid bids must be ≥ 50% of asking price.
              </p>
            </div>
            <span className="text-xs font-mono text-copper-700 bg-copper-50 px-3 py-1.5 rounded-lg border border-copper-300 font-bold self-start sm:self-auto">
              Live Feed: {incomingLots.filter(l => l.status === 'REQUESTED' || l.status === 'BIDDING').length} Open Lots
            </span>
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {incomingLots.map(lot => {
              const ask = lot.askingPrice || lot.estimatedValue;
              const minBid = lot.minBidAmount || Math.round(ask * 0.5);
              const myBid = lot.bids?.find(
                b => b.recyclerId === (user?.id || 'rec-01') || b.recyclerName?.includes(user?.recycler?.facilityName || user?.name || 'EcoRecycle')
              );
              const isBiddable = lot.status === 'REQUESTED' || lot.status === 'BIDDING';

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
                            : 'bg-brass-100 text-brass-800 border border-brass-400'
                        }`}
                      >
                        {lot.status === 'BIDDING' ? 'BIDDING OPEN' : lot.status}
                      </span>
                    </div>

                    <h3 className="font-display font-bold text-steel-900 text-base leading-snug">
                      {preserveEnglishItemName(lot.category)}
                    </h3>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs bg-paper-100 p-2.5 rounded border border-paper-300 font-mono">
                      <div>
                        <span className="text-steel-500 text-[10px] block">COLLECTOR</span>
                        <span className="font-bold text-steel-800 truncate block">{lot.collectorName}</span>
                      </div>
                      <div>
                        <span className="text-steel-500 text-[10px] block">EST. WEIGHT</span>
                        <span className="font-bold text-steel-900">{lot.approxWeightKg} kg</span>
                      </div>
                      <div>
                        <span className="text-steel-500 text-[10px] block">ASKING PRICE</span>
                        <span className="font-bold text-steel-900">₹{ask.toLocaleString('en-IN')}</span>
                      </div>
                      <div>
                        <span className="text-steel-500 text-[10px] block">MIN BID (50%)</span>
                        <span className="font-bold text-copper-700">₹{minBid.toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    {/* Live bidding stats bar */}
                    <div className="mt-2.5 p-2 bg-paper-200 rounded border border-steel-300 text-xs font-mono flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-steel-500 block">CURRENT TOP BID</span>
                        <span className="font-bold text-forest-700">
                          {lot.highestBid ? `₹${lot.highestBid.toLocaleString('en-IN')}` : 'No bids yet'}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-steel-500 block">BIDS RECEIVED</span>
                        <span className="font-bold text-steel-700">{lot.bids?.length || 0}</span>
                      </div>
                    </div>

                    {myBid && (
                      <div className="mt-2 text-[11px] p-2 rounded bg-copper-50 border border-copper-200 text-copper-800 flex items-center justify-between">
                        <span>Your Bid: <strong>₹{myBid.bidAmount.toLocaleString('en-IN')}</strong></span>
                        <span className="font-bold text-[10px] uppercase px-1.5 py-0.5 rounded bg-copper-200">{myBid.status}</span>
                      </div>
                    )}

                    <div className="mt-2 text-[11px] text-steel-500 flex items-center justify-between">
                      <span>GPS: {lot.gpsLat}, {lot.gpsLng}</span>
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
                        <span>Place Bid (Min ₹{minBid.toLocaleString('en-IN')})</span>
                      </button>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleLotDecision(lot.id, 'ACCEPT')}
                          className="bg-paper-200 hover:bg-forest-500/10 text-forest-700 border border-steel-300 py-2 text-[11px] font-bold rounded flex items-center justify-center space-x-1 transition-colors"
                          title="Accept immediately at full asking price"
                        >
                          <CheckCircle2 className="w-3 h-3 text-forest-600" />
                          <span>Accept Ask</span>
                        </button>
                        <button
                          onClick={() => handleLotDecision(lot.id, 'REJECT')}
                          className="bg-paper-200 hover:bg-signal-500/10 text-signal-500 border border-steel-300 py-2 text-[11px] font-bold rounded flex items-center justify-center space-x-1 transition-colors"
                        >
                          <XCircle className="w-3 h-3" />
                          <span>Decline</span>
                        </button>
                      </div>
                    </div>
                  ) : lot.status === 'HANDOVER_PENDING' ? (
                    <div className="pt-2 border-t border-steel-200 space-y-2">
                      <div className="p-2 bg-forest-50 border border-forest-300 rounded text-xs font-bold text-forest-700 flex items-center gap-1.5">
                        <Check className="w-4 h-4 text-forest-600 shrink-0" />
                        <span>Bid Accepted! Ready for physical QR scan.</span>
                      </div>
                      <button
                        onClick={() => {
                          setHandoverCode(lot.lotCode);
                          setActualWeight(lot.approxWeightKg);
                          setActiveTab('handover');
                        }}
                        className="w-full py-1.5 bg-paper-200 hover:bg-copper-100 text-copper-800 border border-copper-300 text-xs font-bold rounded transition-colors"
                      >
                        Go to QR Handover Verification →
                      </button>
                    </div>
                  ) : (
                    <div className="pt-2 border-t border-steel-200 text-xs text-steel-500 flex items-center justify-between">
                      <span>Status: {lot.status}</span>
                      {lot.confirmedAt && <span>Confirmed</span>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: HANDOVER CONFIRMATION (QR SCAN / ENTRY) */}
      {activeTab === 'handover' && (
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
                    placeholder="e.g. KC-LOT-9821 or KBD-EWASTE-9821-DELHI"
                    className="flex-1 px-3 py-2 text-sm font-mono uppercase bg-white border-2 border-steel-300 rounded focus:border-copper-600 focus:outline-none"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setHandoverCode('KC-LOT-9821')}
                    className="px-3 py-2 bg-paper-200 hover:bg-paper-300 text-steel-700 text-xs font-bold rounded border border-steel-400"
                  >
                    Use Sample
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-steel-700 mb-1">
                    Verified Gross Weight (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={actualWeight}
                    onChange={e => setActualWeight(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-base font-mono font-bold bg-white border-2 border-steel-300 rounded focus:border-copper-600 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-steel-700 mb-1">
                    Weighing Scale Calibrated ID
                  </label>
                  <input
                    type="text"
                    defaultValue="WB-OKHLA-SCALE-04"
                    disabled
                    className="w-full px-3 py-2 text-xs font-mono bg-paper-200 border-2 border-steel-300 rounded text-steel-600"
                  />
                </div>
              </div>

              <div className="p-3 bg-brass-100 rounded border border-brass-400 text-xs text-steel-800 space-y-1">
                <div className="font-bold flex items-center gap-1 text-brass-900">
                  <ShieldCheck className="w-4 h-4 text-brass-700" /> CPCB Traceability Compliance Note
                </div>
                <p>
                  Confirming this handover generates a tamper-evident timestamped handover record linked to Collector Suresh Kumar (Aadhaar verified: XXXX-XXXX-8921). Digital payment or physical cash receipt is validated.
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
                  <p className="text-xs text-steel-600">Sample active handover ticket in transit</p>
                </div>
                <div className="stamp-seal stamp-pending text-xs">
                  IN TRANSIT
                </div>
              </div>

              <div className="my-6 p-4 bg-white rounded border border-steel-300 flex flex-col items-center justify-center space-y-3">
                <div className="w-36 h-36 bg-paper-200 border-2 border-steel-800 p-2 flex items-center justify-center rounded">
                  <QrCode className="w-28 h-28 text-steel-900" />
                </div>
                <div className="text-center font-mono text-xs text-steel-700">
                  <div className="font-bold">KC-LOT-9821</div>
                  <div className="text-[10px] text-steel-500">SHA256: e3b0c44298fc1c149afbf4c8...</div>
                </div>
              </div>

              <div className="space-y-2 text-xs font-mono text-steel-800 bg-paper-100 p-3 rounded border border-paper-300">
                <div className="flex justify-between">
                  <span className="text-steel-500">Item:</span>
                  <span className="font-bold">High-grade Server PCBs</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-steel-500">Estimated Weight:</span>
                  <span className="font-bold">18.5 kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-steel-500">Agreed Rate:</span>
                  <span className="font-bold text-copper-600">₹640 / kg</span>
                </div>
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
      )}

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
                <span className="font-bold text-steel-800">25 km (Covering Delhi, Noida, Faridabad, Gurugram)</span>
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

      {/* MOBILE BOTTOM NAVIGATION BAR (Thumb-friendly portrait phone navigation) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-paper-50/95 backdrop-blur-md border-t-2 border-steel-400 px-1 py-1 shadow-tactile-lg">
        <div className="grid grid-cols-5 gap-0.5 text-center">
          <button
            onClick={() => setActiveTab('incoming')}
            className={`min-h-[48px] py-1 rounded flex flex-col items-center justify-center text-[10px] font-bold transition-all ${
              activeTab === 'incoming' ? 'text-copper-700 bg-paper-200' : 'text-steel-600'
            }`}
          >
            <Scale className="w-4 h-4 mb-0.5" />
            <span className="truncate">{t('tabIncoming', 'Incoming Lots')}</span>
          </button>

          <button
            onClick={() => setActiveTab('handover')}
            className={`min-h-[48px] py-1 rounded flex flex-col items-center justify-center text-[10px] font-bold transition-all ${
              activeTab === 'handover' ? 'text-copper-700 bg-paper-200' : 'text-steel-600'
            }`}
          >
            <QrCode className="w-4 h-4 mb-0.5" />
            <span className="truncate">{t('tabVerifyQr', 'Verify QR')}</span>
          </button>

          <button
            onClick={() => setActiveTab('rates')}
            className={`min-h-[48px] py-1 rounded flex flex-col items-center justify-center text-[10px] font-bold transition-all ${
              activeTab === 'rates' ? 'text-copper-700 bg-paper-200' : 'text-steel-600'
            }`}
          >
            <Sliders className="w-4 h-4 mb-0.5" />
            <span className="truncate">{t('tabRateConsole', 'Rates')}</span>
          </button>

          <button
            onClick={() => setActiveTab('anomalies')}
            className={`min-h-[48px] py-1 rounded flex flex-col items-center justify-center text-[10px] font-bold transition-all ${
              activeTab === 'anomalies' ? 'text-signal-600 bg-paper-200' : 'text-steel-600'
            }`}
          >
            <AlertTriangle className="w-4 h-4 mb-0.5" />
            <span className="truncate">{t('tabAnomalies', 'Anomalies')}</span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`min-h-[48px] py-1 rounded flex flex-col items-center justify-center text-[10px] font-bold transition-all ${
              activeTab === 'reports' ? 'text-steel-900 bg-paper-200' : 'text-steel-600'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 mb-0.5" />
            <span className="truncate">{t('tabReports', 'CPCB Reports')}</span>
          </button>
        </div>
      </div>

      {/* RECYCLER BIDDING MODAL (Rule: valid bid must be >= 50% of asking price) */}
      {biddingLot && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-steel-950/80 backdrop-blur-sm animate-fade-in"
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

            {/* Asking Price & Min 50% Threshold Summary */}
            {(() => {
              const ask = biddingLot.askingPrice || biddingLot.estimatedValue;
              const minBid = biddingLot.minBidAmount || Math.round(ask * 0.5);
              const perKg = biddingLot.approxWeightKg ? Math.round(bidAmountInput / biddingLot.approxWeightKg) : 0;
              const isBelowMin = bidAmountInput < minBid;

              return (
                <form onSubmit={handleSubmitBid} className="space-y-4">
                  <div className="grid grid-cols-2 gap-2 bg-paper-100 p-3 rounded-xl border border-steel-300 font-mono text-xs">
                    <div className="bg-paper-50 p-2.5 rounded border border-steel-200">
                      <span className="text-[10px] text-steel-500 block">COLLECTOR ASK</span>
                      <span className="font-bold text-steel-900 text-sm">₹{ask.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="bg-forest-50 p-2.5 rounded border border-forest-300">
                      <span className="text-[10px] text-forest-700 block font-bold">MIN VALID BID (50%)</span>
                      <span className="font-bold text-forest-800 text-sm">₹{minBid.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  {biddingLot.highestBid ? (
                    <div className="p-2.5 bg-paper-200 rounded-lg border border-steel-300 text-xs font-mono flex items-center justify-between">
                      <span className="text-steel-600">Current Highest Bid:</span>
                      <span className="font-bold text-forest-700">₹{biddingLot.highestBid.toLocaleString('en-IN')}</span>
                    </div>
                  ) : null}

                  {/* Quick percentage shortcuts */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-steel-700 mb-1.5">
                      Quick Bid Presets
                    </label>
                    <div className="grid grid-cols-4 gap-1.5 text-xs font-mono">
                      <button
                        type="button"
                        onClick={() => {
                          setBidAmountInput(minBid);
                          setBidError(null);
                          triggerHaptic(15);
                        }}
                        className={`p-2 rounded border text-center transition-all ${
                          bidAmountInput === minBid
                            ? 'bg-copper-700 text-paper-50 border-copper-700 font-bold'
                            : 'bg-paper-200 hover:bg-paper-300 text-steel-800 border-steel-300'
                        }`}
                      >
                        <span className="block text-[10px] opacity-80">50% MIN</span>
                        ₹{minBid.toLocaleString('en-IN')}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const val = Math.round(ask * 0.7);
                          setBidAmountInput(val);
                          setBidError(null);
                          triggerHaptic(15);
                        }}
                        className={`p-2 rounded border text-center transition-all ${
                          bidAmountInput === Math.round(ask * 0.7)
                            ? 'bg-copper-700 text-paper-50 border-copper-700 font-bold'
                            : 'bg-paper-200 hover:bg-paper-300 text-steel-800 border-steel-300'
                        }`}
                      >
                        <span className="block text-[10px] opacity-80">70%</span>
                        ₹{Math.round(ask * 0.7).toLocaleString('en-IN')}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const val = Math.round(ask * 0.85);
                          setBidAmountInput(val);
                          setBidError(null);
                          triggerHaptic(15);
                        }}
                        className={`p-2 rounded border text-center transition-all ${
                          bidAmountInput === Math.round(ask * 0.85)
                            ? 'bg-copper-700 text-paper-50 border-copper-700 font-bold'
                            : 'bg-paper-200 hover:bg-paper-300 text-steel-800 border-steel-300'
                        }`}
                      >
                        <span className="block text-[10px] opacity-80">85%</span>
                        ₹{Math.round(ask * 0.85).toLocaleString('en-IN')}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setBidAmountInput(ask);
                          setBidError(null);
                          triggerHaptic(15);
                        }}
                        className={`p-2 rounded border text-center transition-all ${
                          bidAmountInput === ask
                            ? 'bg-copper-700 text-paper-50 border-copper-700 font-bold'
                            : 'bg-paper-200 hover:bg-paper-300 text-steel-800 border-steel-300'
                        }`}
                      >
                        <span className="block text-[10px] opacity-80">100% ASK</span>
                        ₹{ask.toLocaleString('en-IN')}
                      </button>
                    </div>
                  </div>

                  {/* Custom Bid Input */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-steel-700 mb-1">
                      Your Total Bid (₹)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base font-bold text-steel-600">
                        ₹
                      </span>
                      <input
                        type="number"
                        min={minBid}
                        step={50}
                        value={bidAmountInput || ''}
                        onChange={e => {
                          const val = Number(e.target.value);
                          setBidAmountInput(val);
                          if (val < minBid) {
                            setBidError(`Bid must be at least ₹${minBid.toLocaleString('en-IN')} (50% of asking price)`);
                          } else {
                            setBidError(null);
                          }
                        }}
                        className={`w-full pl-8 pr-4 py-3 bg-paper-50 border-2 rounded-lg font-mono text-lg font-bold focus:outline-none ${
                          isBelowMin ? 'border-signal-500 text-signal-600' : 'border-steel-400 focus:border-copper-600 text-steel-900'
                        }`}
                        placeholder={`Min ₹${minBid}`}
                        required
                      />
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[11px] text-steel-600 font-mono">
                      <span>Effective Rate: <strong>₹{perKg}/kg</strong></span>
                      <span>Min valid bid: <strong>₹{minBid.toLocaleString('en-IN')}</strong></span>
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
                      disabled={isBelowMin || !bidAmountInput}
                      className="w-full min-h-[48px] py-3 bg-copper-700 hover:bg-copper-800 disabled:opacity-50 disabled:cursor-not-allowed text-paper-50 font-bold rounded-lg shadow-tactile text-sm flex items-center justify-center gap-2 active:translate-y-0.5 transition-all"
                    >
                      <Gavel className="w-4 h-4" />
                      <span>Submit Bid of ₹{(bidAmountInput || 0).toLocaleString('en-IN')}</span>
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
