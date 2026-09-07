import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Recycle, Truck, ShieldCheck, ArrowRight, Sparkles, Scale, Smartphone, BarChart3, CheckCircle2, Award, Users, DollarSign } from 'lucide-react';

interface LandingPageProps {
  onNavigatePortal: (portal: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigatePortal }) => {
  const { quickDemoLogin } = useAuth();

  return (
    <div className="space-y-16 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 lg:pt-20 lg:pb-24 bg-gradient-to-b from-emerald-50/60 via-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-emerald-100/80 text-emerald-800 text-xs font-semibold mb-6 border border-emerald-300/60 animate-fade-in">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Smart India Hackathon 2026 — Informal Waste & EPR Ecosystem</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight max-w-4xl mx-auto leading-tight sm:leading-none">
            Transforming India's Informal Waste Sector with <span className="text-emerald-600 bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Digital Connect</span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            One unified web platform connecting households, door-to-door scrap collectors (कबाड़ीवाले), and Municipal Urban Local Bodies (ULBs) for verified EPR compliance.
          </p>

          {/* Interactive Portal Launch Cards */}
          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl mx-auto text-left">
            {/* Card 1: Citizen */}
            <div
              onClick={() => { quickDemoLogin('CITIZEN'); onNavigatePortal('citizen'); }}
              className="group cursor-pointer bg-white rounded-2xl p-6 border-2 border-emerald-100 hover:border-emerald-500 shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Recycle className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Portal 1</span>
              <h3 className="text-xl font-bold text-slate-900 mt-1">Citizen Portal</h3>
              <p className="text-sm text-slate-500 mt-2">
                Sell scrap from home, upload photo for AI category scan, view live market rates & track pickup.
              </p>
              <div className="mt-4 flex items-center text-emerald-600 font-semibold text-sm group-hover:translate-x-1 transition-transform">
                <span>Enter as Ramesh</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </div>
            </div>

            {/* Card 2: Kabadiwala */}
            <div
              onClick={() => { quickDemoLogin('KABADIWALA'); onNavigatePortal('kabadiwala'); }}
              className="group cursor-pointer bg-white rounded-2xl p-6 border-2 border-amber-100 hover:border-amber-500 shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden"
            >
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Truck className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600">Portal 2</span>
              <h3 className="text-xl font-bold text-slate-900 mt-1">Kabadiwala Portal</h3>
              <p className="text-sm text-slate-500 mt-2">
                Low-literacy UI with voice narration, large +/- weight steppers, map-based nearby jobs & instant digital wallet.
              </p>
              <div className="mt-4 flex items-center text-amber-600 font-semibold text-sm group-hover:translate-x-1 transition-transform">
                <span>Enter as Suresh</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </div>
            </div>

            {/* Card 3: Admin */}
            <div
              onClick={() => { quickDemoLogin('ADMIN'); onNavigatePortal('admin'); }}
              className="group cursor-pointer bg-white rounded-2xl p-6 border-2 border-purple-100 hover:border-purple-500 shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden"
            >
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-purple-600">Portal 3</span>
              <h3 className="text-xl font-bold text-slate-900 mt-1">Admin / ULB Dashboard</h3>
              <p className="text-sm text-slate-500 mt-2">
                Citywide scrap volume analytics, Kabadiwala KYC verification, CPCB-standard EPR audit trails & reports.
              </p>
              <div className="mt-4 flex items-center text-purple-600 font-semibold text-sm group-hover:translate-x-1 transition-transform">
                <span>Enter as NDMC</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Impact Stats */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center relative z-10">
            <div>
              <div className="text-3xl sm:text-5xl font-extrabold text-emerald-400">12,480+</div>
              <div className="text-sm text-slate-400 mt-2 font-medium">Kg Scrap Diverted</div>
            </div>
            <div>
              <div className="text-3xl sm:text-5xl font-extrabold text-emerald-400">₹1,84,200</div>
              <div className="text-sm text-slate-400 mt-2 font-medium">Fair Value Paid to Citizens</div>
            </div>
            <div>
              <div className="text-3xl sm:text-5xl font-extrabold text-emerald-400">450+</div>
              <div className="text-sm text-slate-400 mt-2 font-medium">Formalized Kabadiwalas</div>
            </div>
            <div>
              <div className="text-3xl sm:text-5xl font-extrabold text-emerald-400">100%</div>
              <div className="text-sm text-slate-400 mt-2 font-medium">Traceable EPR Chain</div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem vs Solution Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-slate-900">Why Informal Waste Integration Matters</h2>
          <p className="text-slate-600 mt-2 max-w-xl mx-auto">
            Traditional waste collection leaves collectors exploited, citizens short-changed, and brands without verifiable EPR recycling proof.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-rose-50/50 rounded-2xl p-8 border border-rose-200">
            <h3 className="text-xl font-bold text-rose-900 mb-4 flex items-center">
              <span className="w-8 h-8 rounded-full bg-rose-200 text-rose-800 flex items-center justify-center mr-3 text-sm">✕</span>
              The Informal Trap (Status Quo)
            </h3>
            <ul className="space-y-3 text-slate-700 text-sm">
              <li className="flex items-start">
                <span className="text-rose-500 mr-2 font-bold">•</span>
                Kabadiwalas face irregular work, volatile middleman commissions, and lack of credit access.
              </li>
              <li className="flex items-start">
                <span className="text-rose-500 mr-2 font-bold">•</span>
                Households throw recyclable dry waste into municipal landfills due to lack of scheduled doorstep pickup.
              </li>
              <li className="flex items-start">
                <span className="text-rose-500 mr-2 font-bold">•</span>
                Recyclers and FMCG brands struggle to produce verifiable audit chains required by CPCB Extended Producer Responsibility norms.
              </li>
            </ul>
          </div>

          <div className="bg-emerald-50/50 rounded-2xl p-8 border border-emerald-200">
            <h3 className="text-xl font-bold text-emerald-900 mb-4 flex items-center">
              <span className="w-8 h-8 rounded-full bg-emerald-200 text-emerald-800 flex items-center justify-center mr-3 text-sm">✓</span>
              The Kabadiwala Connect Solution
            </h3>
            <ul className="space-y-3 text-slate-700 text-sm">
              <li className="flex items-start">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 mr-2 flex-shrink-0" />
                <span><strong>Voice-Assisted Collector Portal:</strong> Accessible to low-literacy workers with Hindi speech and simple steppers.</span>
              </li>
              <li className="flex items-start">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 mr-2 flex-shrink-0" />
                <span><strong>AI Scrap Classifier:</strong> Instant category identification and transparent weight-based price quotes.</span>
              </li>
              <li className="flex items-start">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 mr-2 flex-shrink-0" />
                <span><strong>End-to-End EPR Traceability:</strong> Immutable pickup records, municipal KYC verification, and digital receipt generation.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 3-Step Demo Storyline Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-3xl p-8 sm:p-12 shadow-xl">
          <div className="max-w-3xl">
            <span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              Complete SIH Demo Storyline
            </span>
            <h2 className="text-3xl font-extrabold mt-3">Watch the Entire Scrap Lifecycle in 3 Minutes</h2>
            <p className="text-emerald-100 mt-2 text-sm sm:text-base">
              Follow Ramesh (Citizen) requesting a pickup in Lajpat Nagar, Suresh (Kabadiwala) accepting via voice-assisted app, and NDMC (Admin) viewing aggregated EPR reports.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => { quickDemoLogin('CITIZEN'); onNavigatePortal('citizen'); }}
              className="bg-white/10 hover:bg-white/20 border border-white/30 rounded-xl p-4 text-left transition-all"
            >
              <div className="text-xs font-mono text-emerald-200">STEP 1</div>
              <div className="font-bold text-lg text-white mt-1">1. Citizen Schedules</div>
              <p className="text-xs text-emerald-100 mt-1">Upload photo, get AI price quote, set pickup time.</p>
            </button>

            <button
              onClick={() => { quickDemoLogin('KABADIWALA'); onNavigatePortal('kabadiwala'); }}
              className="bg-white/10 hover:bg-white/20 border border-white/30 rounded-xl p-4 text-left transition-all"
            >
              <div className="text-xs font-mono text-emerald-200">STEP 2</div>
              <div className="font-bold text-lg text-white mt-1">2. Kabadiwala Collects</div>
              <p className="text-xs text-emerald-100 mt-1">Accept job, verify weights via steppers, wallet payout.</p>
            </button>

            <button
              onClick={() => { quickDemoLogin('ADMIN'); onNavigatePortal('admin'); }}
              className="bg-white/10 hover:bg-white/20 border border-white/30 rounded-xl p-4 text-left transition-all"
            >
              <div className="text-xs font-mono text-emerald-200">STEP 3</div>
              <div className="font-bold text-lg text-white mt-1">3. ULB / EPR Audits</div>
              <p className="text-xs text-emerald-100 mt-1">Verify collectors, track tonnage, download EPR report.</p>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
