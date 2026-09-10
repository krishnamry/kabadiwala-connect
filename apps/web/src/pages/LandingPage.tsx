import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  User,
  Truck,
  Factory,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Scale,
  Award,
  TrendingUp,
  Volume2,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  Layers,
  Flame,
  Droplet,
  Lock
} from 'lucide-react';
import { VoiceAssistButton } from '../components/VoiceAssistButton';

interface LandingPageProps {
  onNavigatePortal: (portal: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigatePortal }) => {
  const { quickDemoLogin } = useAuth();
  const { language, t, formatCurrency, speak } = useLanguage();

  return (
    <div className="space-y-16 pb-24 font-body">
      
      {/* Hero Section — Android 17 / Material 3 Expressive Hero */}
      <section
        style={{ background: 'var(--gradient-hero-subtle)' }}
        className="relative overflow-hidden pt-12 pb-16 lg:pt-24 lg:pb-28 border-b border-slate-200/80 transition-all duration-300"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          
          {/* SIH Badge Pill */}
          <div className="inline-flex items-center space-x-2.5 px-4 py-2 rounded-full bg-white text-slate-800 text-xs sm:text-sm font-semibold mb-8 border border-slate-200/90 shadow-m3-1 animate-fade-in">
            <span className="rounded-full px-2.5 py-0.5 chip-primary-m3 text-xs font-bold">SIH26229</span>
            <span>Ministry of Mines — Informal e-Waste Integration</span>
            <VoiceAssistButton
              text="Kabadiwala Connect. Digital formalization platform for informal scrap collectors and CPCB authorized e-waste recyclers."
              hindiText="कबाड़ीवाला कनेक्ट। अनौपचारिक कबाड़ीवालों और अधिकृत ई-कचरा रीसायकलर्स के लिए डिजिटल मंच।"
              marathiText="कबाडीवाला कनेक्ट. भंगार गोळा करणारे आणि अधिकृत रीसायकलर यांना जोडणारे डिजिटल व्यासपीठ."
              size="sm"
            />
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-black text-slate-900 tracking-tight max-w-4xl mx-auto leading-[1.15]">
            {t('heroTitle', "Dhatu — Digital Traceability & EPR Exchange for India's e-Waste Economy")}
          </h1>

          <p className="mt-6 text-base sm:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed font-normal">
            {t('heroSubtitle', "Bridging informal door-to-door waste collectors with formal CPCB smelters. Built on a low-literacy, offline-tolerant passbook architecture with verifiable digital handovers.")}
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => onNavigatePortal('login')}
              className="px-8 py-4 rounded-full btn-primary-m3 font-display font-bold text-base shadow-m3-2 hover:shadow-m3-3 flex items-center space-x-2.5 transition-all hover:scale-105 active:scale-95"
            >
              <Lock className="w-5 h-5" />
              <span>{t('roleBasedLogin', 'Role-Based Sign In')}</span>
              <ArrowRight className="w-5 h-5 ml-1" />
            </button>
          </div>

          {/* 4 Interactive Material 3 Portal Launch Cards */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto text-left">
            
            {/* Card 1: Citizen Portal */}
            <div
              onClick={() => { quickDemoLogin('CITIZEN'); onNavigatePortal('citizen'); }}
              className="m3-card rounded-3xl p-7 border border-slate-200/80 hover:border-emerald-500 shadow-m3-1 hover:shadow-m3-3 transition-all duration-300 cursor-pointer flex flex-col justify-between group hover:-translate-y-1 bg-white"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-700 group-hover:scale-110 transition-transform shadow-sm">
                    <User className="w-6 h-6" />
                  </div>
                  <span className="rounded-full px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold">{t('sourcingLayer', 'PORTAL 1')}</span>
                </div>
                <h3 className="font-display font-black text-slate-900 text-xl">{t('portalCitizen', 'Citizen Portal')}</h3>
                <span className="text-sm font-semibold text-amber-700 block mt-1">{t('personaCitizen', 'Ramesh Sharma')}</span>
                <p className="text-sm text-slate-600 mt-3 leading-relaxed">
                  {t('citizenCardDesc', 'Request doorstep e-waste pickup, instant indicative price estimates, live collector tracking & CSR tree donation.')}
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-sm font-bold text-amber-800">
                <span>{t('enterAsCitizen', 'Enter as Citizen')}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
              </div>
            </div>

            {/* Card 2: Collector Portal */}
            <div
              onClick={() => { quickDemoLogin('KABADIWALA'); onNavigatePortal('kabadiwala'); }}
              className="m3-card rounded-3xl p-7 border border-emerald-200/90 hover:border-emerald-600 shadow-m3-1 hover:shadow-m3-3 transition-all duration-300 cursor-pointer flex flex-col justify-between group hover:-translate-y-1 bg-gradient-to-br from-emerald-50/40 via-white to-white"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 border border-emerald-300/60 flex items-center justify-center text-emerald-800 group-hover:scale-110 transition-transform shadow-sm">
                    <Truck className="w-6 h-6" />
                  </div>
                  <span className="rounded-full px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold">{t('coreAsk', 'CORE ASK')}</span>
                </div>
                <h3 className="font-display font-black text-slate-900 text-xl">{t('portalCollector', 'Collector Portal')}</h3>
                <span className="text-sm font-semibold text-emerald-700 block mt-1">{t('personaCollector', 'Suresh Kumar')}</span>
                <p className="text-sm text-slate-600 mt-3 leading-relaxed">
                  {t('collectorCardDesc', 'Low-literacy lot creation, spoken price board, QR handover generation, passbook running ledger & safety cards.')}
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-sm font-bold text-emerald-800">
                <span>{t('enterAsCollector', 'Enter as Collector')}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
              </div>
            </div>

            {/* Card 3: Recycler Portal */}
            <div
              onClick={() => { quickDemoLogin('RECYCLER'); onNavigatePortal('recycler'); }}
              className="m3-card rounded-3xl p-7 border border-slate-200/80 hover:border-teal-500 shadow-m3-1 hover:shadow-m3-3 transition-all duration-300 cursor-pointer flex flex-col justify-between group hover:-translate-y-1 bg-white"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200/60 flex items-center justify-center text-teal-700 group-hover:scale-110 transition-transform shadow-sm">
                    <Factory className="w-6 h-6" />
                  </div>
                  <span className="rounded-full px-3 py-1 bg-teal-100 text-teal-800 text-xs font-bold">{t('formalSide', 'FORMAL SIDE')}</span>
                </div>
                <h3 className="font-display font-black text-slate-900 text-xl">{t('portalRecycler', 'Recycler Portal')}</h3>
                <span className="text-sm font-semibold text-teal-700 block mt-1">{t('personaRecycler', 'EcoRecycle')}</span>
                <p className="text-sm text-slate-600 mt-3 leading-relaxed">
                  {t('recyclerCardDesc', 'Incoming collector lots review, QR handover confirmation, live rate-setting console & CPCB EPR compliance reports.')}
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-sm font-bold text-teal-800">
                <span>{t('enterAsRecycler', 'Enter as Recycler')}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
              </div>
            </div>

            {/* Card 4: Admin / ULB & Data Layer */}
            <div
              onClick={() => { quickDemoLogin('ADMIN'); onNavigatePortal('admin'); }}
              className="m3-card rounded-3xl p-7 border border-slate-200/80 hover:border-slate-800 shadow-m3-1 hover:shadow-m3-3 transition-all duration-300 cursor-pointer flex flex-col justify-between group hover:-translate-y-1 bg-white"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-800 group-hover:scale-110 transition-transform shadow-sm">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <span className="rounded-full px-3 py-1 bg-slate-100 text-slate-800 text-xs font-bold">{t('regulatoryLayer', 'AUDIT HUB')}</span>
                </div>
                <h3 className="font-display font-black text-slate-900 text-xl">{t('portalAdmin', 'Admin / CPCB')}</h3>
                <span className="text-sm font-semibold text-slate-700 block mt-1">{t('personaAdmin', 'NDMC')}</span>
                <p className="text-sm text-slate-600 mt-3 leading-relaxed">
                  {t('adminCardDesc', 'Full traceability dataset engine, interactive unit-economics calculator (+34%), anomaly detection & Form-2 export.')}
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-sm font-bold text-slate-900">
                <span>{t('enterAsAdmin', 'Enter as Admin')}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* Real Material Economy — E-Waste Price Board Snapshot */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="m3-card rounded-3xl p-7 sm:p-10 border border-slate-200/80 shadow-m3-2 space-y-7 bg-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <span className="rounded-full px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold">
                COMMODITY BENCHMARK
              </span>
              <h2 className="text-2xl sm:text-3xl font-display font-black text-slate-900 mt-2">
                {t('mandiPriceBoardTitle', 'Live Material Benchmark Price Board')}
              </h2>
              <p className="text-sm text-slate-600 font-normal mt-1">
                {t('mandiPriceBoardSub', 'Live rates backed by international secondary metals exchange (London Metal Exchange + CPCB India).')}
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3.5 py-1.5 rounded-full border border-slate-200 self-start sm:self-auto">
              {t('mandiPriceBoardZone', 'National CPCB Zone Benchmark')}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-100">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">High-Grade PCBs</span>
              <span className="text-2xl sm:text-3xl font-display font-black text-slate-900 block mt-1">₹640 <span className="text-sm font-normal text-slate-500">/kg</span></span>
              <span className="inline-flex items-center text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full mt-2">▲ +₹25 {t('thisWeek', 'this week')}</span>
            </div>

            <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-100">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Clean Copper Wire</span>
              <span className="text-2xl sm:text-3xl font-display font-black text-slate-900 block mt-1">₹480 <span className="text-sm font-normal text-slate-500">/kg</span></span>
              <span className="inline-flex items-center text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full mt-2">▲ +₹15 {t('thisWeek', 'this week')}</span>
            </div>

            <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-100">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Li-ion Batteries</span>
              <span className="text-2xl sm:text-3xl font-display font-black text-slate-900 block mt-1">₹145 <span className="text-sm font-normal text-slate-500">/kg</span></span>
              <span className="inline-flex items-center text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full mt-2">▲ +₹10 {t('thisWeek', 'this week')}</span>
            </div>

            <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-100">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Electric Motors</span>
              <span className="text-2xl sm:text-3xl font-display font-black text-slate-900 block mt-1">₹95 <span className="text-sm font-normal text-slate-500">/kg</span></span>
              <span className="inline-flex items-center text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full mt-2">▲ +₹5 {t('thisWeek', 'this week')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Core Philosophy Highlights — Modern Material Expressive Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="m3-card rounded-3xl p-7 border border-slate-200/80 shadow-m3-1 space-y-4 bg-white">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center text-2xl shadow-sm">
              📖
            </div>
            <h4 className="font-display font-black text-slate-900 text-xl">
              {t('ledgerFirstTitle', 'Ledger-First Mental Model')}
            </h4>
            <p className="text-sm text-slate-600 leading-relaxed font-normal">
              {t('ledgerFirstDesc', 'Collectors already trust physical passbooks. We digitize that exact metaphor with stamped receipts, running totals, and cash-first records rather than confusing SaaS abstractions.')}
            </p>
          </div>

          <div className="m3-card rounded-3xl p-7 border border-slate-200/80 shadow-m3-1 space-y-4 bg-white">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-2xl shadow-sm">
              🗣️
            </div>
            <h4 className="font-display font-black text-slate-900 text-xl">
              {t('voiceFirstTitle', 'Vernacular & Voice-First')}
            </h4>
            <p className="text-sm text-slate-600 leading-relaxed font-normal">
              {t('voiceFirstDesc', 'Every critical price, weight, and safety hazard is narrated aloud in Hindi and Marathi via the Web Speech API. Large 48px touch targets for outdoor, gloved use.')}
            </p>
          </div>

          <div className="m3-card rounded-3xl p-7 border border-slate-200/80 shadow-m3-1 space-y-4 bg-white">
            <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center text-2xl shadow-sm">
              📵
            </div>
            <h4 className="font-display font-black text-slate-900 text-xl">
              {t('offlineFirstTitle', 'Offline-Tolerant Engine')}
            </h4>
            <p className="text-sm text-slate-600 leading-relaxed font-normal">
              {t('offlineFirstDesc', 'Create lots, check cached price boards, and generate handovers with zero cellular reception. Queued lots synchronize automatically upon reconnecting to cell towers.')}
            </p>
          </div>

        </div>
      </section>

    </div>
  );
};
