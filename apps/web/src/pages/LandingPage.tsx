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
  Droplet
} from 'lucide-react';
import { VoiceAssistButton } from '../components/VoiceAssistButton';

interface LandingPageProps {
  onNavigatePortal: (portal: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigatePortal }) => {
  const { quickDemoLogin } = useAuth();
  const { language, t, formatCurrency, speak } = useLanguage();

  return (
    <div className="space-y-16 pb-20">
      
      {/* Hero Section — Dhatu "Passbook meets Industrial Dashboard" */}
      <section className="relative overflow-hidden pt-12 pb-16 lg:pt-20 lg:pb-24 bg-paper-100 border-b-2 border-steel-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          
          {/* SIH Badge */}
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-paper-200 text-steel-800 text-xs font-mono font-bold mb-6 border-2 border-steel-400 animate-fade-in shadow-sm">
            <span className="stamp-seal stamp-verified text-[10px]">SIH26229</span>
            <span>Ministry of Mines — Informal e-Waste Integration</span>
            <VoiceAssistButton
              text="Kabadiwala Connect. Digital formalization platform for informal scrap collectors and CPCB authorized e-waste recyclers."
              hindiText="कबाड़ीवाला कनेक्ट। अनौपचारिक कबाड़ीवालों और अधिकृत ई-कचरा रीसायकलर्स के लिए डिजिटल मंच।"
              marathiText="कबाडीवाला कनेक्ट. भंगार गोळा करणारे आणि अधिकृत रीसायकलर यांना जोडणारे डिजिटल व्यासपीठ."
              size="sm"
            />
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-black text-steel-950 tracking-tight max-w-4xl mx-auto leading-tight">
            धातु — Digital Traceability & EPR Exchange for India's <span className="text-copper-600 underline decoration-brass-500 decoration-wavy">e-Waste Economy</span>
          </h1>

          <p className="mt-6 text-base sm:text-xl text-steel-700 max-w-3xl mx-auto leading-relaxed font-medium">
            Bridging the informal door-to-door collector (कबाड़ीवाला) with formal CPCB smelters. Built on a low-literacy, offline-tolerant, vernacular passbook architecture with verifiable digital handovers.
          </p>

          {/* 4 Interactive Portal Launch Cards (3-Sided Platform + Admin Layer) */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto text-left">
            
            {/* Card 1: Citizen Portal */}
            <div
              onClick={() => { quickDemoLogin('CITIZEN'); onNavigatePortal('citizen'); }}
              className="receipt-stub rounded-xl p-6 border-2 border-steel-400 hover:border-copper-600 shadow-sm hover:shadow-tactile-lg transition-all duration-200 cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div className="w-10 h-10 rounded-lg bg-paper-200 border border-steel-400 flex items-center justify-center text-copper-700 group-hover:scale-105 transition-transform">
                    <User className="w-5 h-5" />
                  </div>
                  <span className="stamp-seal stamp-verified text-[9px]">PORTAL 1</span>
                </div>
                <h3 className="font-display font-black text-steel-900 text-lg">Citizen Portal</h3>
                <span className="text-xs font-mono text-copper-600 font-bold block mt-0.5">Sourcing Layer (Ramesh)</span>
                <p className="text-xs text-steel-600 mt-2 leading-relaxed">
                  Request doorstep e-waste pickup, instant indicative price estimates, live collector tracking & CSR tree donation.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-steel-200 flex items-center justify-between text-xs font-bold text-copper-700">
                <span>Enter as Citizen</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Card 2: Collector Portal */}
            <div
              onClick={() => { quickDemoLogin('KABADIWALA'); onNavigatePortal('kabadiwala'); }}
              className="receipt-stub rounded-xl p-6 border-2 border-steel-400 hover:border-brass-600 shadow-sm hover:shadow-tactile-lg transition-all duration-200 cursor-pointer flex flex-col justify-between group bg-brass-500/5"
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div className="w-10 h-10 rounded-lg bg-brass-100 border border-brass-400 flex items-center justify-center text-steel-900 group-hover:scale-105 transition-transform">
                    <Truck className="w-5 h-5" />
                  </div>
                  <span className="stamp-seal stamp-pending text-[9px]">CORE ASK</span>
                </div>
                <h3 className="font-display font-black text-steel-900 text-lg">Collector Portal</h3>
                <span className="text-xs font-mono text-brass-700 font-bold block mt-0.5">कबाड़ीवाला (Suresh)</span>
                <p className="text-xs text-steel-600 mt-2 leading-relaxed">
                  Low-literacy lot creation, spoken price board, QR handover generation, passbook running ledger & safety cards.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-steel-200 flex items-center justify-between text-xs font-bold text-brass-800">
                <span>Enter as Collector</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Card 3: Recycler Portal */}
            <div
              onClick={() => { quickDemoLogin('RECYCLER'); onNavigatePortal('recycler'); }}
              className="receipt-stub rounded-xl p-6 border-2 border-steel-400 hover:border-forest-600 shadow-sm hover:shadow-tactile-lg transition-all duration-200 cursor-pointer flex flex-col justify-between group bg-forest-500/5"
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div className="w-10 h-10 rounded-lg bg-forest-500/10 border border-forest-500/30 flex items-center justify-center text-forest-700 group-hover:scale-105 transition-transform">
                    <Factory className="w-5 h-5" />
                  </div>
                  <span className="stamp-seal stamp-verified text-[9px]">FORMAL SIDE</span>
                </div>
                <h3 className="font-display font-black text-steel-900 text-lg">Recycler Portal</h3>
                <span className="text-xs font-mono text-forest-700 font-bold block mt-0.5">Aggregator (EcoRecycle)</span>
                <p className="text-xs text-steel-600 mt-2 leading-relaxed">
                  Incoming collector lots review, QR handover confirmation, live rate-setting console & CPCB EPR compliance reports.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-steel-200 flex items-center justify-between text-xs font-bold text-forest-700">
                <span>Enter as Recycler</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Card 4: Admin / ULB & Data Layer */}
            <div
              onClick={() => { quickDemoLogin('ADMIN'); onNavigatePortal('admin'); }}
              className="receipt-stub rounded-xl p-6 border-2 border-steel-400 hover:border-steel-800 shadow-sm hover:shadow-tactile-lg transition-all duration-200 cursor-pointer flex flex-col justify-between group bg-steel-900/5"
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div className="w-10 h-10 rounded-lg bg-steel-800 border border-steel-900 flex items-center justify-center text-paper-50 group-hover:scale-105 transition-transform">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <span className="stamp-seal stamp-verified text-[9px]">AUDIT HUB</span>
                </div>
                <h3 className="font-display font-black text-steel-900 text-lg">Admin / CPCB</h3>
                <span className="text-xs font-mono text-steel-700 font-bold block mt-0.5">Data Layer (NDMC)</span>
                <p className="text-xs text-steel-600 mt-2 leading-relaxed">
                  Full traceability dataset engine, interactive unit-economics calculator (+34%), anomaly detection & Form-2 export.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-steel-200 flex items-center justify-between text-xs font-bold text-steel-900">
                <span>Enter as Admin</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* Real Material Economy — E-Waste Price Board Snapshot */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="receipt-stub rounded-2xl p-6 sm:p-10 border-2 border-steel-400 shadow-tactile-lg space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-steel-300 pb-4">
            <div>
              <span className="stamp-seal stamp-verified text-xs">COMMODITY BENCHMARK</span>
              <h2 className="text-2xl font-display font-black text-steel-900 mt-1">
                ई-कचरा लाइव दाम सूची (Material Price Board)
              </h2>
              <p className="text-xs text-steel-600 font-medium">
                Live rates backed by international secondary metals exchange (London Metal Exchange + CPCB India).
              </p>
            </div>
            <span className="text-xs font-mono text-steel-600 bg-paper-200 px-3 py-1.5 rounded border border-steel-300 self-start sm:self-auto">
              Delhi NCR Zone Benchmark
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono">
            <div className="bg-white p-3.5 rounded border border-steel-300">
              <span className="text-[10px] text-steel-500 uppercase block">High-Grade PCBs</span>
              <span className="text-2xl font-bold text-copper-600">₹640 /kg</span>
              <span className="text-[10px] text-forest-600 block mt-0.5">▲ +₹25 this week</span>
            </div>

            <div className="bg-white p-3.5 rounded border border-steel-300">
              <span className="text-[10px] text-steel-500 uppercase block">Clean Copper Wire</span>
              <span className="text-2xl font-bold text-copper-600">₹480 /kg</span>
              <span className="text-[10px] text-forest-600 block mt-0.5">▲ +₹15 this week</span>
            </div>

            <div className="bg-white p-3.5 rounded border border-steel-300">
              <span className="text-[10px] text-steel-500 uppercase block">Li-ion Batteries</span>
              <span className="text-2xl font-bold text-copper-600">₹145 /kg</span>
              <span className="text-[10px] text-forest-600 block mt-0.5">▲ +₹10 this week</span>
            </div>

            <div className="bg-white p-3.5 rounded border border-steel-300">
              <span className="text-[10px] text-steel-500 uppercase block">Electric Motors</span>
              <span className="text-2xl font-bold text-copper-600">₹95 /kg</span>
              <span className="text-[10px] text-forest-600 block mt-0.5">▲ +₹5 this week</span>
            </div>
          </div>
        </div>
      </section>

      {/* Core Philosophy Highlights — Why It's Built For Real Collectors */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="receipt-stub rounded-xl p-6 border-2 border-steel-300 space-y-3">
            <div className="w-10 h-10 rounded bg-copper-100 text-copper-700 flex items-center justify-center font-bold">
              📖
            </div>
            <h4 className="font-display font-black text-steel-900 text-lg">
              Ledger-First Mental Model
            </h4>
            <p className="text-xs text-steel-600 leading-relaxed">
              Collectors already trust physical passbooks. We digitize that exact metaphor with stamped receipts, running totals, and cash-first records rather than confusing SaaS abstractions.
            </p>
          </div>

          <div className="receipt-stub rounded-xl p-6 border-2 border-steel-300 space-y-3">
            <div className="w-10 h-10 rounded bg-brass-100 text-brass-800 flex items-center justify-center font-bold">
              🗣️
            </div>
            <h4 className="font-display font-black text-steel-900 text-lg">
              Vernacular & Voice-First
            </h4>
            <p className="text-xs text-steel-600 leading-relaxed">
              Every critical price, weight, and safety hazard is narrated aloud in Hindi and Marathi via the Web Speech API. Large 48px touch targets for outdoor, gloved use.
            </p>
          </div>

          <div className="receipt-stub rounded-xl p-6 border-2 border-steel-300 space-y-3">
            <div className="w-10 h-10 rounded bg-forest-500/10 text-forest-700 flex items-center justify-center font-bold">
              📵
            </div>
            <h4 className="font-display font-black text-steel-900 text-lg">
              Offline-Tolerant Engine
            </h4>
            <p className="text-xs text-steel-600 leading-relaxed">
              Create lots, check cached price boards, and generate handovers with zero cellular reception. Queued lots synchronize automatically upon reconnecting to cell towers.
            </p>
          </div>

        </div>
      </section>

    </div>
  );
};
