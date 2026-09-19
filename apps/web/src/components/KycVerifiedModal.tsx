import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { triggerHaptic, hapticSuccess } from '../lib/haptics';
import { ShieldCheck, Sparkles, CheckCircle2, ArrowRight, Award } from 'lucide-react';

export const KycVerifiedModal: React.FC = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!user || user.kycStatus !== 'VERIFIED') {
      setIsOpen(false);
      return;
    }

    const storageKey = `dhatu_kyc_celebrated_${user.id}`;
    const alreadyCelebrated = localStorage.getItem(storageKey) === 'true';

    // Show only once upon initial verification
    if (!alreadyCelebrated) {
      setIsOpen(true);
      hapticSuccess();
    }
  }, [user?.id, user?.kycStatus]);

  const handleAcknowledge = () => {
    if (!user) return;
    triggerHaptic(25);
    localStorage.setItem(`dhatu_kyc_celebrated_${user.id}`, 'true');
    setIsOpen(false);
  };

  if (!isOpen || !user || user.kycStatus !== 'VERIFIED') return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-fade-in">
      <div 
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border-2 border-emerald-500/30 text-center space-y-5 relative animate-scale-up"
        role="dialog"
        aria-modal="true"
      >
        {/* Celebratory Icon */}
        <div className="relative inline-flex items-center justify-center">
          <div className="w-20 h-20 rounded-3xl bg-emerald-500/15 dark:bg-emerald-500/25 border-2 border-emerald-500 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <ShieldCheck className="w-10 h-10 animate-bounce" />
          </div>
          <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow-sm">
            <Sparkles className="w-4 h-4" />
          </div>
        </div>

        <div>
          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 mb-2">
            <Award className="w-3.5 h-3.5" />
            <span>CPCB Verified Partner</span>
          </div>

          <h2 className="text-2xl font-display font-black text-slate-900 dark:text-white tracking-tight">
            {language === 'hi'
              ? `बधाई हो, ${user.name}!`
              : language === 'mr'
              ? `अभिनंदन, ${user.name}!`
              : `Congratulations, ${user.name}!`}
          </h2>

          <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
            {language === 'hi'
              ? 'आपकी नियामक केवाईसी सफलतापूर्वक सत्यापित हो गई है!'
              : language === 'mr'
              ? 'तुमची नियामक केवायसी यशस्वीरीत्या पडताळली गेली आहे!'
              : 'Your Regulatory KYC is Officially Approved!'}
          </p>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-3 leading-relaxed">
            {language === 'hi'
              ? 'सीपीसीबी और स्थानीय निकाय द्वारा आपके पहचान दस्तावेज़ों को स्वीकृति मिल गई है। अब आप डिजिटल लॉट बना सकते हैं, रीसायकलर्स से सीधी बोलियां स्वीकार कर सकते हैं और पूरी सुविधाओं का लाभ उठा सकते हैं।'
              : language === 'mr'
              ? 'सीपीसीबी व स्थानिक प्रशासनाने तुमची कागदपत्रे मंजूर केली आहेत. आता तुम्ही थेट डिजिटल लॉट तयार करू शकता व खुल्या बाजारात व्यवहार करू शकता.'
              : 'The CPCB Regulatory Authority has verified your submitted documents. Full platform capabilities—including creating digital scrap lots, accepting recycler tenders, and transparent payouts—are now unlocked!'}
          </p>
        </div>

        {/* Feature unlocked chips */}
        <div className="grid grid-cols-2 gap-2 text-left text-xs font-semibold">
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span className="text-slate-800 dark:text-slate-200">
              {user.role === 'RECYCLER' ? 'Direct Lot Bidding' : 'Digital Lot Creation'}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span className="text-slate-800 dark:text-slate-200">EPR Traceability</span>
          </div>
        </div>

        <button
          onClick={handleAcknowledge}
          className="w-full py-3.5 px-5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-display font-black shadow-lg shadow-emerald-600/30 flex items-center justify-center space-x-2 transition-all active:scale-98"
        >
          <span>{language === 'hi' ? 'शुरू करें' : language === 'mr' ? 'सुरू करा' : 'Start Trading Now'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
