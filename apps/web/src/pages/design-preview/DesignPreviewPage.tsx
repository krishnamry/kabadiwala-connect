import React, { useState } from 'react';
import {
  Smartphone,
  Monitor,
  Volume2,
  Plus,
  ArrowRight,
  ShieldCheck,
  Scale,
  Sparkles,
  QrCode,
  CheckCircle2,
  TreePine,
  Check,
  TrendingUp,
  Tag,
  Factory,
  BookOpen,
  Settings,
  AlertTriangle,
  RotateCcw,
  BarChart3,
  Calculator,
  LineChart
} from 'lucide-react';
import { Button, Card, Badge, TabularValue, VoicePill, BottomSheet } from '../../components/ui';
import { useLanguage } from '../../context/LanguageContext';
import { triggerHaptic } from '../../lib/haptics';

export const DesignPreviewPage: React.FC<{ onBackToApp?: () => void }> = ({ onBackToApp }) => {
  const { language, setLanguage, t } = useLanguage();

  // Mode: 'mobile' or 'desktop'
  const [viewportMode, setViewportMode] = useState<'mobile' | 'desktop'>('mobile');

  // Active Mobile Mockup Screen: 1 (Collector), 2 (Mandi Prices), 3 (Citizen Wizard)
  const [mobileScreen, setMobileScreen] = useState<'collector' | 'prices' | 'citizen'>('collector');

  // Bottom Sheet Drawer State
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);

  // Segmented Pill in Collector View
  const [collectorTab, setCollectorTab] = useState<'lots' | 'bids'>('lots');

  // Interactive Price Board States (Collector Accessible)
  const [priceCategoryFilter, setPriceCategoryFilter] = useState<'all' | 'copper' | 'pcb' | 'battery' | 'iron'>('all');
  const [collectorCalcFeedback, setCollectorCalcFeedback] = useState<string | null>(null);

  // Desktop Recycler Console Mode: 'weighbridge' or 'analytics'
  const [desktopConsoleMode, setDesktopConsoleMode] = useState<'weighbridge' | 'analytics'>('weighbridge');
  const [analyticsCommodity, setAnalyticsCommodity] = useState<'copper' | 'pcb' | 'battery'>('copper');
  const [analyticsTimeframe, setAnalyticsTimeframe] = useState<'7d' | '30d' | '90d'>('7d');

  // Interactive Citizen Wizard State
  const [wizardItemCount, setWizardItemCount] = useState(2);
  const [wizardWeightKg, setWizardWeightKg] = useState(4.5);
  const [isCsrDonation, setIsCsrDonation] = useState(true);

  // Desktop Weighbridge State
  const [desktopGrossWeight, setDesktopGrossWeight] = useState(21.2);
  const [desktopTareWeight, setDesktopTareWeight] = useState(2.7);
  const [isScaleCertified, setIsScaleCertified] = useState(false);
  const [mintedToken, setMintedToken] = useState<string | null>(null);

  const calculatedNetWeight = Math.max(0, +(desktopGrossWeight - desktopTareWeight).toFixed(1));

  const handleMintToken = () => {
    triggerHaptic(30);
    setIsScaleCertified(true);
    setMintedToken(`KBD-SL-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-DEL-8F4A9B`);
  };

  return (
    <div className="min-h-screen bg-[#F1F3F5] dark:bg-[#070A11] text-slate-900 dark:text-slate-100 font-body py-8 px-4 sm:px-6 lg:px-8">
      {/* Top Banner & Viewport Switcher */}
      <div className="max-w-6xl mx-auto mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-[#111625] p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-600 animate-pulse" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400">
              Dhatu (धातु) v8.0.0 Architecture Preview
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-black text-slate-900 dark:text-white mt-1">
            Billion-Dollar Interactive UI Simulator
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Test the Rule of Three, field-hardened touch ergonomics, and the dual-viewport layout live in your browser.
          </p>
        </div>

        {/* Viewport & Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Viewport Mode Switcher */}
          <div className="bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl flex items-center gap-1 border border-slate-200/60 dark:border-slate-700/60">
            <button
              onClick={() => {
                triggerHaptic(15);
                setViewportMode('mobile');
              }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-display font-bold transition-all ${
                viewportMode === 'mobile'
                  ? 'bg-white dark:bg-[#111625] text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Smartphone (390px)</span>
            </button>
            <button
              onClick={() => {
                triggerHaptic(15);
                setViewportMode('desktop');
              }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-display font-bold transition-all ${
                viewportMode === 'desktop'
                  ? 'bg-white dark:bg-[#111625] text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Desktop Workstation</span>
            </button>
          </div>

          {onBackToApp && (
            <Button variant="secondary" size="sm" onClick={onBackToApp}>
              Exit Preview
            </Button>
          )}
        </div>
      </div>

      {/* VIEWPORT 1: SMARTPHONE INTERACTIVE SIMULATOR */}
      {viewportMode === 'mobile' && (
        <div className="max-w-md mx-auto">
          {/* Mobile Screen Selector Tabs */}
          <div className="flex items-center justify-center gap-2 mb-4 bg-white/70 dark:bg-[#111625]/70 backdrop-blur-xs p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <button
              onClick={() => {
                triggerHaptic(15);
                setMobileScreen('collector');
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-display font-bold transition-all ${
                mobileScreen === 'collector'
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              1. Collector Feed
            </button>
            <button
              onClick={() => {
                triggerHaptic(15);
                setMobileScreen('prices');
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-display font-bold transition-all ${
                mobileScreen === 'prices'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              2. Spoken Mandi
            </button>
            <button
              onClick={() => {
                triggerHaptic(15);
                setMobileScreen('citizen');
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-display font-bold transition-all ${
                mobileScreen === 'citizen'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              3. Citizen Wizard
            </button>
          </div>

          {/* Smartphone Physical Device Frame */}
          <div className="relative w-full max-w-[390px] mx-auto bg-black rounded-[48px] p-3 shadow-2xl border-4 border-slate-800 ring-1 ring-black/20">
            {/* Dynamic Island / Camera Notch */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-full z-30 flex items-center justify-end px-2">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-800" />
            </div>

            {/* Inner Phone Screen Content */}
            <div
              className={`relative w-full min-h-[640px] max-h-[720px] rounded-[38px] overflow-y-auto overflow-x-hidden no-scrollbar flex flex-col justify-between pt-10 pb-6 px-4 ${
                mobileScreen === 'prices'
                  ? 'bg-[#090D16] text-white'
                  : 'bg-[#F8F9FA] dark:bg-[#0B0F19] text-slate-900 dark:text-white'
              }`}
            >
              {/* SCREEN 1: COLLECTOR FEED */}
              {mobileScreen === 'collector' && (
                <div className="space-y-4 pb-20">
                  {/* Collector Top Bar */}
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-display font-black tracking-tight text-slate-900 dark:text-white">
                        धातु Dhatu
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-200/60 dark:bg-slate-800/80 px-2 py-0.5 rounded-md">
                        ● Synced 2m ago
                      </span>
                    </div>
                    <Badge variant="emerald" withDot pulseDot>
                      Online
                    </Badge>
                  </div>

                  {/* Greeting & Rating */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-display font-extrabold text-slate-900 dark:text-white">
                        Namaste Suresh ji
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        Okhla Industrial Sector 4 • ID: KBD-9421
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 font-bold text-xs border border-amber-200/80 dark:border-amber-800/80">
                      ★ 4.9
                    </span>
                  </div>

                  {/* Segmented Control */}
                  <div className="p-1 bg-slate-200/70 dark:bg-slate-800/80 rounded-2xl flex items-center gap-1">
                    <button
                      onClick={() => {
                        triggerHaptic(15);
                        setCollectorTab('lots');
                      }}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-display font-bold transition-all ${
                        collectorTab === 'lots'
                          ? 'bg-orange-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      My Lots (3)
                    </button>
                    <button
                      onClick={() => {
                        triggerHaptic(15);
                        setCollectorTab('bids');
                      }}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-display font-bold transition-all ${
                        collectorTab === 'bids'
                          ? 'bg-orange-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      Live Bids (1)
                    </button>
                  </div>

                  {/* Lot Card 1: PCB Motherboards */}
                  <Card interactive elevation="flat" className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-16 h-16 rounded-xl bg-slate-800 shrink-0 overflow-hidden relative border border-slate-700">
                        {/* Motherboard photo simulation */}
                        <div className="w-full h-full bg-gradient-to-br from-emerald-950 via-slate-900 to-amber-950 flex flex-col items-center justify-center p-1 text-center">
                          <span className="text-[10px] font-mono font-black text-emerald-400">PCB</span>
                          <span className="text-[8px] font-mono text-slate-400">FR-4</span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-display font-bold text-sm text-slate-900 dark:text-white truncate">
                            PCB Motherboards
                          </h4>
                          <span className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded">
                            ⏱ 2h 14m left
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5 flex items-center gap-1.5">
                          <span>18.5 kg</span>
                          <span>•</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Grade-A High Yield</span>
                        </div>
                        <div className="flex items-baseline justify-between mt-2">
                          <span className="text-xs text-slate-400">Current Price:</span>
                          <TabularValue value={8500} prefix="₹" size="lg" trend="up" />
                        </div>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                      <Badge variant="emerald" withDot>
                        Top Bid: EcoRecycle
                      </Badge>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerHaptic(25);
                          alert('Bid ₹8,500 by EcoRecycle Accepted! Generating Pre-weigh Handover Pass.');
                        }}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg shadow-2xs transition-all active:scale-95"
                      >
                        Accept Bid ➔
                      </button>
                    </div>
                  </Card>

                  {/* Lot Card 2: Copper Wires */}
                  <Card interactive elevation="flat" className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-16 h-16 rounded-xl bg-slate-800 shrink-0 overflow-hidden relative border border-slate-700">
                        <div className="w-full h-full bg-gradient-to-br from-amber-950 via-orange-950 to-slate-900 flex flex-col items-center justify-center p-1 text-center">
                          <span className="text-[10px] font-mono font-black text-orange-400">Cu 99%</span>
                          <span className="text-[8px] font-mono text-slate-400">Spool</span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-display font-bold text-sm text-slate-900 dark:text-white truncate">
                          Clean Copper Wires
                        </h4>
                        <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5 flex items-center gap-1.5">
                          <span>12.0 kg</span>
                          <span>•</span>
                          <span className="text-orange-600 dark:text-orange-400 font-semibold">99.2% Bare Bright</span>
                        </div>
                        <div className="flex items-baseline justify-between mt-2">
                          <span className="text-xs text-slate-400">Indicative Rate:</span>
                          <TabularValue value={5760} prefix="₹" size="lg" />
                        </div>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                      <Badge variant="copper">2 Recyclers Bidding</Badge>
                      <span className="text-[11px] font-mono text-slate-400">Reserve Met • Open</span>
                    </div>
                  </Card>
                </div>
              )}

              {/* SCREEN 2: ACCESSIBLE DAILY MANDI PRICE BOARD (COLLECTOR-FIRST) */}
              {mobileScreen === 'prices' && (
                <div className="space-y-3 pb-28">
                  {/* Vernacular Header */}
                  <div className="flex items-start justify-between pt-1">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                        <h2 className="text-lg font-display font-black text-slate-900 dark:text-white">
                          आज का मंडी भाव
                        </h2>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-mono font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/70 border border-amber-300 dark:border-amber-800 px-1.5 py-0.5 rounded">
                          📍 मयूर विहार हब (Mayapuri)
                        </span>
                        <span className="text-[10px] text-slate-500">आज सुबह 10:00 बजे</span>
                      </div>
                    </div>
                    <div>
                      <VoicePill
                        hindiText="नमस्ते सुरेश जी! आज तांबे के तार का भाव 480 रुपये, कंप्यूटर मदरबोर्ड 265 रुपये, और बैटरी 145 रुपये प्रति किलो है।"
                        label="सभी भाव सुनें"
                        size="sm"
                      />
                    </div>
                  </div>

                  {/* Accessible Category Chips */}
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                    {[
                      { id: 'all', label: 'सभी (All)' },
                      { id: 'copper', label: '🥉 तांबा (Copper)' },
                      { id: 'pcb', label: '💻 बोर्ड (PCBs)' },
                      { id: 'battery', label: '🔋 बैटरी (Battery)' },
                      { id: 'iron', label: '🔩 लोहा (Iron)' }
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => {
                          triggerHaptic(10);
                          setPriceCategoryFilter(cat.id as any);
                        }}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all ${
                          priceCategoryFilter === cat.id
                            ? 'bg-amber-500 text-slate-950 shadow-2xs'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>

                  {/* Interactive Quick Calculation Toast / Feedback */}
                  {collectorCalcFeedback && (
                    <div className="p-2.5 bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800/80 rounded-2xl flex items-center justify-between text-xs text-amber-950 dark:text-amber-200 shadow-2xs">
                      <div className="flex items-center gap-2">
                        <Calculator className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                        <span className="font-medium">{collectorCalcFeedback}</span>
                      </div>
                      <button
                        onClick={() => setCollectorCalcFeedback(null)}
                        className="text-xs font-bold text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded hover:bg-amber-200/50"
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  {/* COLLECTOR RATE CARDS: High visual recognition, large numbers, no stock-chart clutter */}
                  <div className="space-y-2.5">
                    {/* Item 1: Copper Wires */}
                    {(priceCategoryFilter === 'all' || priceCategoryFilter === 'copper') && (
                      <Card elevation="flat" className="p-3.5 space-y-2.5 border border-slate-200/90 dark:border-slate-800">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="w-10 h-10 rounded-2xl bg-orange-100 dark:bg-orange-950/60 border border-orange-200 dark:border-orange-800 flex items-center justify-center text-xl shrink-0">
                              🥉
                            </div>
                            <div>
                              <h4 className="font-display font-extrabold text-sm text-slate-900 dark:text-white">
                                तांबा तार (Copper Wires)
                              </h4>
                              <p className="text-[11px] text-slate-500">छिला व इंसुलेटेड लाल तांबा</p>
                            </div>
                          </div>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                            ▲ ₹20 बढ़ा (Up)
                          </span>
                        </div>

                        {/* Rate Readout */}
                        <div className="flex items-baseline justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                          <div>
                            <span className="text-[11px] text-slate-400 block">आज का पक्का भाव:</span>
                            <span className="text-2xl font-mono font-black text-orange-600 dark:text-orange-400">
                              ₹480 <span className="text-xs font-sans font-bold text-slate-500">/ किलो (per kg)</span>
                            </span>
                          </div>
                          <VoicePill
                            hindiText="तांबा तार का आज का भाव 480 रुपये प्रति किलो है।"
                            label="दाम सुनें"
                            size="sm"
                          />
                        </div>

                        {/* Mental-Math Batch Chips */}
                        <div className="bg-slate-50 dark:bg-slate-900/60 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                          <div className="flex items-center justify-between mb-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                            <span>त्वरित हिसाब (Tap to calculate):</span>
                            <span className="text-amber-600 dark:text-amber-400">कैलकुलेटर</span>
                          </div>
                          <div className="grid grid-cols-3 gap-1.5">
                            {[
                              { kg: 5, total: 2400 },
                              { kg: 10, total: 4800 },
                              { kg: 20, total: 9600 }
                            ].map((chip) => (
                              <button
                                key={chip.kg}
                                onClick={() => {
                                  triggerHaptic(15);
                                  setCollectorCalcFeedback(`5 के भाव से: ${chip.kg} kg तांबा = ₹${chip.total.toLocaleString('en-IN')} नकद भुगतान`);
                                }}
                                className="py-1 px-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center hover:border-orange-500 active:scale-95 transition-all"
                              >
                                <span className="text-[10px] text-slate-500 block">{chip.kg} किलो</span>
                                <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">₹{chip.total.toLocaleString('en-IN')}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </Card>
                    )}

                    {/* Item 2: PCBs */}
                    {(priceCategoryFilter === 'all' || priceCategoryFilter === 'pcb') && (
                      <Card elevation="flat" className="p-3.5 space-y-2.5 border border-slate-200/90 dark:border-slate-800">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-xl shrink-0">
                              💻
                            </div>
                            <div>
                              <h4 className="font-display font-extrabold text-sm text-slate-900 dark:text-white">
                                कम्प्यूटर बोर्ड (Green PCBs)
                              </h4>
                              <p className="text-[11px] text-slate-500">मदरबोर्ड व भारी सर्किट प्लेट</p>
                            </div>
                          </div>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                            ▲ ₹15 बढ़ा (Up)
                          </span>
                        </div>

                        <div className="flex items-baseline justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                          <div>
                            <span className="text-[11px] text-slate-400 block">आज का पक्का भाव:</span>
                            <span className="text-2xl font-mono font-black text-emerald-700 dark:text-emerald-400">
                              ₹265 <span className="text-xs font-sans font-bold text-slate-500">/ किलो (per kg)</span>
                            </span>
                          </div>
                          <VoicePill
                            hindiText="कंप्यूटर मदरबोर्ड का आज का भाव 265 रुपये प्रति किलो है।"
                            label="दाम सुनें"
                            size="sm"
                          />
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-900/60 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                          <div className="flex items-center justify-between mb-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                            <span>त्वरित हिसाब (Tap to calculate):</span>
                            <span className="text-amber-600 dark:text-amber-400">कैलकुलेटर</span>
                          </div>
                          <div className="grid grid-cols-3 gap-1.5">
                            {[
                              { kg: 5, total: 1325 },
                              { kg: 10, total: 2650 },
                              { kg: 20, total: 5300 }
                            ].map((chip) => (
                              <button
                                key={chip.kg}
                                onClick={() => {
                                  triggerHaptic(15);
                                  setCollectorCalcFeedback(`${chip.kg} kg कम्प्यूटर बोर्ड = ₹${chip.total.toLocaleString('en-IN')} नकद भुगतान`);
                                }}
                                className="py-1 px-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center hover:border-emerald-500 active:scale-95 transition-all"
                              >
                                <span className="text-[10px] text-slate-500 block">{chip.kg} किलो</span>
                                <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">₹{chip.total.toLocaleString('en-IN')}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </Card>
                    )}

                    {/* Item 3: Batteries */}
                    {(priceCategoryFilter === 'all' || priceCategoryFilter === 'battery') && (
                      <Card elevation="flat" className="p-3.5 space-y-2.5 border border-slate-200/90 dark:border-slate-800">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-xl shrink-0">
                              🔋
                            </div>
                            <div>
                              <h4 className="font-display font-extrabold text-sm text-slate-900 dark:text-white">
                                लिथियम व इन्वर्टर बैटरी
                              </h4>
                              <p className="text-[11px] text-slate-500">लैपटॉप व सोलर पावर पैक</p>
                            </div>
                          </div>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                            ▲ ₹8 बढ़ा (Up)
                          </span>
                        </div>

                        <div className="flex items-baseline justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                          <div>
                            <span className="text-[11px] text-slate-400 block">आज का पक्का भाव:</span>
                            <span className="text-2xl font-mono font-black text-amber-600 dark:text-amber-400">
                              ₹145 <span className="text-xs font-sans font-bold text-slate-500">/ किलो (per kg)</span>
                            </span>
                          </div>
                          <VoicePill
                            hindiText="बैटरी का आज का भाव 145 रुपये प्रति किलो है।"
                            label="दाम सुनें"
                            size="sm"
                          />
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-900/60 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                          <div className="flex items-center justify-between mb-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                            <span>त्वरित हिसाब (Tap to calculate):</span>
                            <span className="text-amber-600 dark:text-amber-400">कैलकुलेटर</span>
                          </div>
                          <div className="grid grid-cols-3 gap-1.5">
                            {[
                              { kg: 10, total: 1450 },
                              { kg: 25, total: 3625 },
                              { kg: 50, total: 7250 }
                            ].map((chip) => (
                              <button
                                key={chip.kg}
                                onClick={() => {
                                  triggerHaptic(15);
                                  setCollectorCalcFeedback(`${chip.kg} kg बैटरी = ₹${chip.total.toLocaleString('en-IN')} नकद भुगतान`);
                                }}
                                className="py-1 px-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center hover:border-amber-500 active:scale-95 transition-all"
                              >
                                <span className="text-[10px] text-slate-500 block">{chip.kg} किलो</span>
                                <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">₹{chip.total.toLocaleString('en-IN')}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </Card>
                    )}

                    {/* Item 4: Iron */}
                    {(priceCategoryFilter === 'all' || priceCategoryFilter === 'iron') && (
                      <Card elevation="flat" className="p-3.5 space-y-2.5 border border-slate-200/90 dark:border-slate-800">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-xl shrink-0">
                              🔩
                            </div>
                            <div>
                              <h4 className="font-display font-extrabold text-sm text-slate-900 dark:text-white">
                                भारी लोहा (Heavy Iron)
                              </h4>
                              <p className="text-[11px] text-slate-500">गाड़ी व मशीनरी का लोहा</p>
                            </div>
                          </div>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                            ● स्थिर (Same)
                          </span>
                        </div>

                        <div className="flex items-baseline justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                          <div>
                            <span className="text-[11px] text-slate-400 block">आज का पक्का भाव:</span>
                            <span className="text-2xl font-mono font-black text-slate-800 dark:text-slate-200">
                              ₹38 <span className="text-xs font-sans font-bold text-slate-500">/ किलो (per kg)</span>
                            </span>
                          </div>
                          <VoicePill
                            hindiText="लोहे का भाव 38 रुपये प्रति किलो है।"
                            label="दाम सुनें"
                            size="sm"
                          />
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-900/60 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                          <div className="flex items-center justify-between mb-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                            <span>त्वरित हिसाब (Tap to calculate):</span>
                            <span className="text-amber-600 dark:text-amber-400">कैलकुलेटर</span>
                          </div>
                          <div className="grid grid-cols-2 gap-1.5">
                            {[
                              { kg: 50, total: 1900 },
                              { kg: 100, total: 3800 }
                            ].map((chip) => (
                              <button
                                key={chip.kg}
                                onClick={() => {
                                  triggerHaptic(15);
                                  setCollectorCalcFeedback(`${chip.kg} kg लोहा = ₹${chip.total.toLocaleString('en-IN')} नकद भुगतान`);
                                }}
                                className="py-1 px-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center hover:border-slate-400 active:scale-95 transition-all"
                              >
                                <span className="text-[10px] text-slate-500 block">{chip.kg} किलो</span>
                                <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">₹{chip.total.toLocaleString('en-IN')}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </Card>
                    )}
                  </div>
                </div>
              )}

              {/* SCREEN 3: CITIZEN BOOKING WIZARD */}
              {mobileScreen === 'citizen' && (
                <div className="space-y-4 pb-20">
                  <div className="pt-2">
                    <h2 className="text-lg font-display font-extrabold text-slate-900 dark:text-white">
                      Book E-Waste Pickup
                    </h2>
                    {/* 3-Step Wizard Pills */}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-700 text-white shadow-2xs">
                        1. Items
                      </span>
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        2. Schedule
                      </span>
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        3. Confirm
                      </span>
                    </div>
                  </div>

                  {/* Photo & ML Tag Card */}
                  <Card elevation="flat" className="space-y-3">
                    <div className="w-full h-32 rounded-xl bg-slate-800 overflow-hidden relative border border-slate-700 flex flex-col items-center justify-center">
                      <span className="inline-block px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold">
                        High-Grade PCB • 94% match
                      </span>
                      <p className="text-[11px] text-slate-300 mt-2 font-medium">
                        Broken Laptop Motherboard • Dell Inspiron
                      </p>
                    </div>

                    {/* Interactive Steppers */}
                    <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700">
                      <button
                        onClick={() => {
                          triggerHaptic(15);
                          setWizardItemCount(Math.max(1, wizardItemCount - 1));
                          setWizardWeightKg(Math.max(1, +(wizardWeightKg - 2.2).toFixed(1)));
                        }}
                        className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white font-bold flex items-center justify-center shadow-2xs active:scale-95"
                      >
                        -
                      </button>
                      <span className="text-xs font-bold font-mono">
                        {wizardItemCount} Items • {wizardWeightKg} kg
                      </span>
                      <button
                        onClick={() => {
                          triggerHaptic(15);
                          setWizardItemCount(wizardItemCount + 1);
                          setWizardWeightKg(+(wizardWeightKg + 2.2).toFixed(1));
                        }}
                        className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white font-bold flex items-center justify-center shadow-2xs active:scale-95"
                      >
                        +
                      </button>
                    </div>

                    {/* Cashify Trust Reassurance: Certified Data Wiping */}
                    <div className="flex items-center gap-2 p-2 bg-slate-100 dark:bg-slate-800/70 rounded-xl text-[11px] text-slate-600 dark:text-slate-300">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        <strong className="text-slate-800 dark:text-slate-100">100% Certified Data Wiping</strong> & Green Certificate included
                      </span>
                    </div>

                    {/* Indicative Value Guarantee */}
                    <div className="flex items-center justify-between p-2.5 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-xl border border-emerald-200/80 dark:border-emerald-800/60">
                      <div>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                          Indicative Value Guarantee
                        </span>
                        <span className="font-mono font-bold text-sm text-emerald-800 dark:text-emerald-300">
                          ₹1,200 – ₹1,550
                        </span>
                      </div>
                      <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-full">
                        Instant UPI / Cash
                      </span>
                    </div>

                    {/* CSR Donation Toggle */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <TreePine className="w-4 h-4 text-emerald-600" />
                        <div>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                            Donate value to Green Tree CSR
                          </span>
                          <span className="text-[10px] text-slate-400">80G ESG Certificate</span>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={isCsrDonation}
                        onChange={(e) => {
                          triggerHaptic(15);
                          setIsCsrDonation(e.target.checked);
                        }}
                        className="w-4 h-4 text-emerald-600 rounded"
                      />
                    </div>
                  </Card>

                  {/* Refined Step Progression CTA */}
                  <Button
                    variant="emerald"
                    fullWidth
                    size="md"
                    onClick={() => {
                      triggerHaptic(20);
                      alert('Moving to Step 2: Choose Slot (Tomorrow Morning 10am-1pm)');
                    }}
                  >
                    Continue to Slot Selection (Step 2/3) ➔
                  </Button>
                  <p className="text-[10px] text-center text-slate-400">
                    Zero Cancellation Fee • Free Doorstep Inspection
                  </p>
                </div>
              )}

              {/* FLOATING AUDIO DOCK & COPPER FAB (Visible on Collector screen) */}
              {mobileScreen === 'collector' && (
                <div className="absolute bottom-16 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
                  <div className="pointer-events-auto">
                    <VoicePill
                      hindiText="नमस्ते सुरेश जी! आपके 3 ई-कचरा लॉट बिक्री के लिए तैयार हैं, जिनकी अनुमानित कीमत 14,850 रुपये है।"
                      label="निर्देश सुनें"
                      size="sm"
                    />
                  </div>
                  <button
                    onClick={() => {
                      triggerHaptic(25);
                      alert('Proactive KYC Check: Verified! Rapid Lot Camera Opened.');
                    }}
                    className="w-12 h-12 rounded-full bg-orange-600 text-white flex items-center justify-center shadow-lg active:scale-95 pointer-events-auto border-2 border-white dark:border-slate-900"
                    title="Quick Add Lot"
                  >
                    <Plus className="w-6 h-6 stroke-[3]" />
                  </button>
                </div>
              )}

              {/* PERSISTENT 4-DESTINATION MOBILE BOTTOM BAR */}
              <div className="absolute bottom-0 left-0 right-0 h-16 bg-white/95 dark:bg-[#111625]/95 backdrop-blur-md border-t border-slate-200/90 dark:border-slate-800 px-3 flex items-center justify-around z-20">
                <button
                  onClick={() => {
                    triggerHaptic(15);
                    setMobileScreen('collector');
                  }}
                  className={`flex flex-col items-center gap-0.5 ${
                    mobileScreen === 'collector'
                      ? 'text-orange-600 dark:text-orange-400 font-bold'
                      : 'text-slate-400'
                  }`}
                >
                  <Tag className="w-4 h-4" />
                  <span className="text-[10px]">Lots</span>
                </button>
                <button
                  onClick={() => {
                    triggerHaptic(15);
                    setMobileScreen('prices');
                  }}
                  className={`flex flex-col items-center gap-0.5 ${
                    mobileScreen === 'prices'
                      ? 'text-amber-500 font-bold'
                      : 'text-slate-400'
                  }`}
                >
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-[10px]">Prices</span>
                </button>
                <button
                  onClick={() => {
                    triggerHaptic(15);
                    setMobileScreen('citizen');
                  }}
                  className={`flex flex-col items-center gap-0.5 ${
                    mobileScreen === 'citizen'
                      ? 'text-emerald-700 dark:text-emerald-400 font-bold'
                      : 'text-slate-400'
                  }`}
                >
                  <Scale className="w-4 h-4" />
                  <span className="text-[10px]">Pickups</span>
                </button>
                <button
                  onClick={() => {
                    triggerHaptic(15);
                    setIsBottomSheetOpen(true);
                  }}
                  className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                >
                  <span className="text-lg leading-none font-black tracking-tighter">•••</span>
                  <span className="text-[10px]">More</span>
                </button>
              </div>
            </div>
          </div>

          {/* REAL WORKING SWIPEABLE BOTTOM SHEET DRAWER */}
          <BottomSheet
            isOpen={isBottomSheetOpen}
            onClose={() => setIsBottomSheetOpen(false)}
            title="Tools & Services (सुविधाएं)"
            subtitle="Secondary operations & CPCB compliance"
          >
            {/* Collector Identity Strip */}
            <div className="flex items-center justify-between p-3 bg-slate-100 dark:bg-slate-800/80 rounded-2xl mb-3 border border-slate-200/80 dark:border-slate-700">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-orange-600/20 text-orange-600 font-bold flex items-center justify-center text-xs">
                  SK
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Suresh Kumar</h4>
                  <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                    ID: KBD-9421 • Tier-2 Verified
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">
                ₹1,00,000 Limit
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 py-1">
              <Card
                interactive
                elevation="flat"
                className="p-3.5 space-y-1.5"
                onClick={() => alert('Opening Dual-Tier KYC (FEAT-10)')}
              >
                <div className="flex items-center justify-between">
                  <ShieldCheck className="w-5 h-5 text-orange-600" />
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                </div>
                <h4 className="font-bold text-xs">KYC & Trust Badge</h4>
                <p className="text-[10px] text-slate-400">Aadhaar Tier-2 Active</p>
              </Card>

              <Card
                interactive
                elevation="flat"
                className="p-3.5 space-y-1.5"
                onClick={() => alert('Opening Recyclers Directory (FEAT-08)')}
              >
                <div className="flex items-center justify-between">
                  <Factory className="w-5 h-5 text-emerald-600" />
                  <span className="text-[10px] text-amber-500 font-bold">★ 4.9</span>
                </div>
                <h4 className="font-bold text-xs">Recyclers</h4>
                <p className="text-[10px] text-slate-400">3 Authorized Smelters</p>
              </Card>

              <Card
                interactive
                elevation="flat"
                className="p-3.5 space-y-1.5"
                onClick={() => alert('Displaying Handover QR Pass')}
              >
                <QrCode className="w-5 h-5 text-slate-700 dark:text-slate-200" />
                <h4 className="font-bold text-xs">Handover QR Pass</h4>
                <p className="text-[10px] text-slate-400">Weighbridge check-in</p>
              </Card>

              <Card
                interactive
                elevation="flat"
                className="p-3.5 space-y-1.5"
                onClick={() => alert('Opening Cash Passbook')}
              >
                <BookOpen className="w-5 h-5 text-emerald-700" />
                <h4 className="font-bold text-xs">Cash Passbook</h4>
                <p className="text-[10px] font-mono text-emerald-600 font-bold">₹18,400 bal</p>
              </Card>

              <Card
                interactive
                elevation="flat"
                className="p-3.5 space-y-1.5"
                onClick={() => alert('Opening Safety & Hazard Guides')}
              >
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <h4 className="font-bold text-xs">Safety Guides</h4>
                <p className="text-[10px] text-slate-400">Battery & CRT rules</p>
              </Card>

              <Card
                interactive
                elevation="flat"
                className="p-3.5 space-y-1.5"
                onClick={() => alert('Opening App Settings')}
              >
                <Settings className="w-5 h-5 text-slate-600" />
                <h4 className="font-bold text-xs">App Settings</h4>
                <p className="text-[10px] text-slate-400">Language & Cache</p>
              </Card>
            </div>

            {/* Offline Cache Buffer Footer */}
            <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>3 Lots Stored Offline</span>
              </div>
              <span className="font-mono text-[10px]">IndexedDB Active</span>
            </div>
          </BottomSheet>
        </div>
      )}

      {/* VIEWPORT 2: DESKTOP WORKSTATION MASTER-DETAIL TERMINAL */}
      {viewportMode === 'desktop' && (
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Global Desk Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card elevation="flat" className="p-4">
              <span className="text-xs text-slate-400 uppercase font-mono tracking-wider block">
                Total Formalized
              </span>
              <TabularValue value={142.8} suffix=" MT" size="xl" trend="up" />
            </Card>
            <Card elevation="flat" className="p-4">
              <span className="text-xs text-slate-400 uppercase font-mono tracking-wider block">
                Active Collectors
              </span>
              <TabularValue value={24} suffix=" Registered" size="xl" />
            </Card>
            <Card elevation="flat" className="p-4">
              <span className="text-xs text-slate-400 uppercase font-mono tracking-wider block">
                UPI / Cash Disbursed
              </span>
              <TabularValue value={1284500} prefix="₹" size="xl" trend="up" />
            </Card>
            <Card elevation="flat" className="p-4">
              <span className="text-xs text-slate-400 uppercase font-mono tracking-wider block">
                CPCB Compliance
              </span>
              <TabularValue value={99.4} suffix="%" size="xl" trend="up" />
            </Card>
          </div>

          {/* Master-Detail Split Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 40%: Master Lot Intake Feed */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-display font-bold text-slate-900 dark:text-white">
                  Incoming Collector Lots
                </h3>
                <Badge variant="emerald" withDot pulseDot>
                  Live Feed: 3 Lots
                </Badge>
              </div>

              {/* Lot Item 1 */}
              <Card interactive elevation="raised" className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-base text-slate-900 dark:text-white">
                      KC-LOT-9821 • High-Grade PCBs
                    </h4>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                      Collector: Suresh Kumar (Aadhaar Verified) • Lajpat Nagar
                    </p>
                  </div>
                  <Badge variant="copper">Bidding Active</Badge>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-xs text-slate-400 block">Declared Weight:</span>
                    <TabularValue value={18.5} suffix=" kg" size="md" />
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">Current Top Bid:</span>
                    <TabularValue value={8500} prefix="₹" size="lg" trend="up" />
                  </div>
                </div>
              </Card>

              {/* Lot Item 2 */}
              <Card interactive elevation="flat" className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-base text-slate-900 dark:text-white">
                      KC-LOT-9824 • Insulated Copper Wires
                    </h4>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                      Collector: Rajesh Verma • Okhla Phase-II
                    </p>
                  </div>
                  <Badge variant="amber">Pending Weigh</Badge>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-xs text-slate-400 block">Declared Weight:</span>
                    <TabularValue value={12.0} suffix=" kg" size="md" />
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">Asking Rate:</span>
                    <TabularValue value={480} prefix="₹" suffix="/kg" size="md" />
                  </div>
                </div>
              </Card>
            </div>

            {/* Right 60%: Dedicated Action Terminal (Weighbridge & Market Intelligence) */}
            <div className="lg:col-span-7 space-y-4">
              {/* Recycler Operating Mode Switcher */}
              <div className="flex items-center justify-between bg-white dark:bg-[#111625] p-1.5 rounded-2xl border border-slate-200/90 dark:border-slate-800">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      triggerHaptic(15);
                      setDesktopConsoleMode('weighbridge');
                    }}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-display font-bold transition-all ${
                      desktopConsoleMode === 'weighbridge'
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <Scale className="w-3.5 h-3.5" />
                    <span>Mode B: Weighbridge Terminal</span>
                  </button>
                  <button
                    onClick={() => {
                      triggerHaptic(15);
                      setDesktopConsoleMode('analytics');
                    }}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-display font-bold transition-all ${
                      desktopConsoleMode === 'analytics'
                        ? 'bg-orange-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <LineChart className="w-3.5 h-3.5" />
                    <span>Mode E: Price Trends & Mandi Analytics</span>
                  </button>
                </div>
                <Badge variant="emerald" withDot>
                  {desktopConsoleMode === 'weighbridge' ? 'Scale Active' : 'Public Engine: Recharts'}
                </Badge>
              </div>

              {/* MODE B: WEIGHBRIDGE TERMINAL */}
              {desktopConsoleMode === 'weighbridge' && (
                <Card elevation="floating" className="space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                    <div>
                      <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                        Weighbridge Terminal Desk
                      </span>
                      <h3 className="text-xl font-display font-black text-slate-900 dark:text-white">
                        EcoRecycle Plant Gate 3 • Scale WB-OKHLA-04
                      </h3>
                    </div>
                    <Badge variant="emerald">CPCB Certified Scale</Badge>
                  </div>

                  {/* Digital Scale Readout Simulation */}
                  <div className="grid grid-cols-3 gap-3 p-4 bg-slate-900 text-white rounded-2xl font-mono">
                    <div className="text-center p-2 bg-slate-800/80 rounded-xl">
                      <span className="text-[10px] text-slate-400 block">GROSS SCALE</span>
                      <span className="text-xl font-black text-amber-400">{desktopGrossWeight} kg</span>
                    </div>
                    <div className="text-center p-2 bg-slate-800/80 rounded-xl">
                      <span className="text-[10px] text-slate-400 block">TARE BIN</span>
                      <span className="text-xl font-black text-slate-300">{desktopTareWeight} kg</span>
                    </div>
                    <div className="text-center p-2 bg-slate-800/80 rounded-xl border border-emerald-500/30">
                      <span className="text-[10px] text-emerald-400 block">CERTIFIED NET</span>
                      <span className="text-xl font-black text-emerald-400">{calculatedNetWeight} kg</span>
                    </div>
                  </div>

                  {/* Tolerance Check */}
                  <div className="flex items-center justify-between p-3 bg-emerald-50/60 dark:bg-emerald-950/40 rounded-xl border border-emerald-200/80 dark:border-emerald-800/60 text-xs">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>
                        Declared: <strong>18.5 kg</strong> vs Actual: <strong>{calculatedNetWeight} kg</strong> (Delta: -0.5% • Within 5% tolerance)
                      </span>
                    </div>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">PASSED</span>
                  </div>

                  {/* Minting & Confirmation Action */}
                  {!mintedToken ? (
                    <Button variant="emerald" fullWidth size="lg" onClick={handleMintToken}>
                      Certify Weight & Mint Universal Sale Token
                    </Button>
                  ) : (
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 rounded-2xl border border-emerald-200 dark:border-emerald-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                          UNIVERSAL SALE TOKEN MINTED
                        </span>
                        <Check className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div className="font-mono text-sm font-black text-slate-900 dark:text-white select-all">
                        {mintedToken}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        SHA-256 seal generated. ₹8,464 instant UPI disbursed to Suresh Kumar. Both parties notified for bilateral blind review (PENDING_MUTUAL).
                      </p>
                    </div>
                  )}
                </Card>
              )}

              {/* MODE E: RECYCLER COMMODITY PRICE TRENDS & MANDI ANALYTICS */}
              {desktopConsoleMode === 'analytics' && (
                <Card elevation="floating" className="space-y-5">
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider">
                          Commodity Intelligence & Forecasting Desk
                        </span>
                        <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full text-slate-600 dark:text-slate-300">
                          Recharts Engine
                        </span>
                      </div>
                      <h3 className="text-xl font-display font-black text-slate-900 dark:text-white mt-0.5">
                        Mandi Price Trends & Moving Average Analysis
                      </h3>
                    </div>

                    {/* Timeframe selector */}
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-mono font-bold">
                      {(['7d', '30d', '90d'] as const).map((tf) => (
                        <button
                          key={tf}
                          onClick={() => {
                            triggerHaptic(10);
                            setAnalyticsTimeframe(tf);
                          }}
                          className={`px-2.5 py-1 rounded-lg uppercase transition-all ${
                            analyticsTimeframe === tf
                              ? 'bg-white dark:bg-[#111625] text-slate-900 dark:text-white shadow-2xs'
                              : 'text-slate-500 hover:text-slate-900'
                          }`}
                        >
                          {tf}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Commodity Switcher Chips */}
                  <div className="flex items-center gap-2">
                    {[
                      { id: 'copper', label: 'Insulated Copper (₹480/kg)', delta: '+5.2%' },
                      { id: 'pcb', label: 'High-Grade PCBs (₹265/kg)', delta: '+5.6%' },
                      { id: 'battery', label: 'Lithium Batteries (₹145/kg)', delta: '+5.5%' }
                    ].map((com) => (
                      <button
                        key={com.id}
                        onClick={() => {
                          triggerHaptic(15);
                          setAnalyticsCommodity(com.id as any);
                        }}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                          analyticsCommodity === com.id
                            ? 'bg-orange-50 dark:bg-orange-950/40 border-orange-500 text-orange-900 dark:text-orange-200'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <span>{com.label}</span>
                        <span className="text-[10px] font-mono font-black text-emerald-600 dark:text-emerald-400">
                          {com.delta}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Key Trend Statistics Ribbon */}
                  <div className="grid grid-cols-4 gap-3 p-3 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
                    <div>
                      <span className="text-[10px] font-mono text-slate-400 block uppercase">Spot Benchmark</span>
                      <span className="text-base font-mono font-bold text-slate-900 dark:text-white">
                        {analyticsCommodity === 'copper' ? '₹480/kg' : analyticsCommodity === 'pcb' ? '₹265/kg' : '₹145/kg'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-slate-400 block uppercase">7-Day SMA (Trend)</span>
                      <span className="text-base font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {analyticsCommodity === 'copper' ? '₹468.5/kg' : analyticsCommodity === 'pcb' ? '₹258.0/kg' : '₹141.2/kg'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-slate-400 block uppercase">APMC Spread</span>
                      <span className="text-base font-mono font-bold text-slate-900 dark:text-white">
                        {analyticsCommodity === 'copper' ? '₹455–₹490' : analyticsCommodity === 'pcb' ? '₹250–₹275' : '₹138–₹150'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-slate-400 block uppercase">Weekly Intake</span>
                      <span className="text-base font-mono font-bold text-amber-600 dark:text-amber-400">
                        {analyticsCommodity === 'copper' ? '14.2 MT' : analyticsCommodity === 'pcb' ? '8.6 MT' : '5.1 MT'}
                      </span>
                    </div>
                  </div>

                  {/* HIGH-PRECISION TREND CHART (Faithfully previewing Recharts Responsive Area & Line Chart) */}
                  <div className="relative bg-white dark:bg-[#0d121f] p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800">
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-mono">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1.5">
                          <span className="w-3 h-0.5 bg-orange-600 rounded" />
                          <span className="text-slate-700 dark:text-slate-300 font-bold">Spot Price (₹/kg)</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="w-3 h-0.5 bg-emerald-500 border-b border-dashed" />
                          <span>7D SMA (Moving Avg)</span>
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400">Hub: Mayapuri & Okhla Aggregation</span>
                    </div>

                    {/* Clean SVG Time-Series Chart */}
                    <div className="h-56 w-full relative">
                      <svg className="w-full h-full" viewBox="0 0 500 180" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#EA580C" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="#EA580C" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>

                        {/* Grid lines */}
                        <line x1="40" y1="20" x2="480" y2="20" stroke="currentColor" className="text-slate-100 dark:text-slate-800" strokeDasharray="3 3" />
                        <line x1="40" y1="60" x2="480" y2="60" stroke="currentColor" className="text-slate-100 dark:text-slate-800" strokeDasharray="3 3" />
                        <line x1="40" y1="100" x2="480" y2="100" stroke="currentColor" className="text-slate-100 dark:text-slate-800" strokeDasharray="3 3" />
                        <line x1="40" y1="140" x2="480" y2="140" stroke="currentColor" className="text-slate-100 dark:text-slate-800" strokeDasharray="3 3" />

                        {/* Y-Axis Labels */}
                        <text x="5" y="24" className="text-[9px] fill-slate-400 font-mono">
                          {analyticsCommodity === 'copper' ? '₹500' : analyticsCommodity === 'pcb' ? '₹280' : '₹160'}
                        </text>
                        <text x="5" y="64" className="text-[9px] fill-slate-400 font-mono">
                          {analyticsCommodity === 'copper' ? '₹480' : analyticsCommodity === 'pcb' ? '₹265' : '₹145'}
                        </text>
                        <text x="5" y="104" className="text-[9px] fill-slate-400 font-mono">
                          {analyticsCommodity === 'copper' ? '₹460' : analyticsCommodity === 'pcb' ? '₹250' : '₹130'}
                        </text>
                        <text x="5" y="144" className="text-[9px] fill-slate-400 font-mono">
                          {analyticsCommodity === 'copper' ? '₹440' : analyticsCommodity === 'pcb' ? '₹235' : '₹115'}
                        </text>

                        {/* Area gradient under spot curve */}
                        <path
                          d="M 50 120 Q 120 110 190 95 T 330 65 T 470 45 L 470 150 L 50 150 Z"
                          fill="url(#chartGradient)"
                        />

                        {/* Spot price line */}
                        <path
                          d="M 50 120 Q 120 110 190 95 T 330 65 T 470 45"
                          fill="none"
                          stroke="#EA580C"
                          strokeWidth="3"
                          strokeLinecap="round"
                        />

                        {/* 7-Day SMA Moving Average line (dashed emerald) */}
                        <path
                          d="M 50 130 Q 120 122 190 110 T 330 82 T 470 60"
                          fill="none"
                          stroke="#10B981"
                          strokeWidth="2"
                          strokeDasharray="4 4"
                          strokeLinecap="round"
                        />

                        {/* Interactive Key Data Points */}
                        <circle cx="50" cy="120" r="3.5" fill="#EA580C" className="stroke-white dark:stroke-slate-900 stroke-2" />
                        <circle cx="190" cy="95" r="3.5" fill="#EA580C" className="stroke-white dark:stroke-slate-900 stroke-2" />
                        <circle cx="330" cy="65" r="3.5" fill="#EA580C" className="stroke-white dark:stroke-slate-900 stroke-2" />
                        <circle cx="470" cy="45" r="5" fill="#EA580C" className="stroke-white dark:stroke-slate-900 stroke-2 animate-pulse" />

                        {/* X-Axis Dates */}
                        <text x="45" y="168" className="text-[9px] fill-slate-400 font-mono">12 Sep</text>
                        <text x="115" y="168" className="text-[9px] fill-slate-400 font-mono">13 Sep</text>
                        <text x="185" y="168" className="text-[9px] fill-slate-400 font-mono">14 Sep</text>
                        <text x="255" y="168" className="text-[9px] fill-slate-400 font-mono">15 Sep</text>
                        <text x="325" y="168" className="text-[9px] fill-slate-400 font-mono">16 Sep</text>
                        <text x="395" y="168" className="text-[9px] fill-slate-400 font-mono">17 Sep</text>
                        <text x="455" y="168" className="text-[9px] fill-slate-400 font-mono font-bold">18 Sep (Today)</text>
                      </svg>

                      {/* Tooltip callout */}
                      <div className="absolute top-4 right-8 bg-slate-900/90 backdrop-blur-md text-white px-3 py-1.5 rounded-xl border border-slate-700 shadow-lg text-[11px] font-mono">
                        <span className="text-orange-400 font-bold block">18 Sep (Live Spot): ₹480.00 / kg</span>
                        <span className="text-slate-300 block">7D Moving Avg (SMA): ₹468.50 / kg</span>
                        <span className="text-emerald-400 block">Intake Volume: 3.2 MT</span>
                      </div>
                    </div>

                    {/* Standard Architecture Badge */}
                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <BarChart3 className="w-4 h-4 text-orange-600" />
                        <span>
                          <strong>Charting Stack:</strong> Production Recharts & TradingView Lightweight Charts (No custom algorithms)
                        </span>
                      </div>
                      <span className="font-mono text-[10px] text-slate-400">
                        Math: npm:simple-statistics (SMA/EMA)
                      </span>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
