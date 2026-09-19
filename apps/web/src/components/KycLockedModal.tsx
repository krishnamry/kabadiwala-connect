import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { triggerHaptic } from '../lib/haptics';
import { Lock, ShieldAlert, Clock, ArrowRight, X, AlertTriangle, RefreshCw } from 'lucide-react';
import { KycReapplyModal } from './KycReapplyModal';

interface KycLockedModalProps {
  isOpen: boolean;
  onClose: () => void;
  actionTitle?: string;
  onReapply?: () => void;
}

export const KycLockedModal: React.FC<KycLockedModalProps> = ({
  isOpen,
  onClose,
  actionTitle = 'This Action',
  onReapply
}) => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [showReapplyModal, setShowReapplyModal] = useState<boolean>(false);

  if (!isOpen) return null;

  const isUnderReview = user?.kycStatus === 'UNDER_REVIEW';
  const isRejected = user?.kycStatus === 'REJECTED';

  const handleOpenReapply = () => {
    triggerHaptic(20);
    if (onReapply) {
      onReapply();
    } else {
      setShowReapplyModal(true);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in">
        <div 
          className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 text-center relative animate-scale-up"
          role="dialog"
          aria-modal="true"
        >
          {/* Close Button */}
          <button
            onClick={() => {
              triggerHaptic(15);
              onClose();
            }}
            className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Lock Emblem */}
          <div className={`w-16 h-16 rounded-2xl border-2 flex items-center justify-center mx-auto shadow-sm ${
            isRejected
              ? 'bg-rose-500/10 dark:bg-rose-500/20 border-rose-500/30 text-rose-600 dark:text-rose-400'
              : 'bg-amber-500/10 dark:bg-amber-500/20 border-amber-500/30 text-amber-600 dark:text-amber-400'
          }`}>
            {isRejected ? <AlertTriangle className="w-8 h-8" /> : <Lock className="w-8 h-8" />}
          </div>

          <div>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-2 border ${
              isRejected
                ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
            }`}>
              {isRejected ? <AlertTriangle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
              {isRejected
                ? (language === 'hi' ? 'केवाईसी अस्वीकृत — पुनः आवेदन करें' : language === 'mr' ? 'केवायसी नाकारली — पुन्हा अर्ज करा' : 'KYC Rejected — Re-Apply Required')
                : isUnderReview
                ? (language === 'hi' ? 'सत्यापन प्रक्रियाधीन' : language === 'mr' ? 'पडताळणी सुरू' : 'Verification Under Progress')
                : (language === 'hi' ? 'केवाईसी आवश्यक' : language === 'mr' ? 'केवायसी आवश्यक' : 'KYC Required')}
            </span>

            <h3 className="text-xl font-display font-black text-slate-900 dark:text-white">
              {language === 'hi'
                ? `${actionTitle} अभी लॉक है`
                : language === 'mr'
                ? `${actionTitle} सध्या लॉक आहे`
                : `${actionTitle} is Locked`}
            </h3>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
              {isRejected
                ? (language === 'hi'
                    ? 'आपके केवाईसी दस्तावेज़ सीपीसीबी द्वारा अस्वीकृत किए गए थे। इस सुविधा को सक्रिय करने के लिए कृपया सुधार करके पुनः आवेदन करें।'
                    : language === 'mr'
                    ? 'तुमची केवायसी कागदपत्रे सीपीसीबीने नाकारली आहेत. हा पर्याय सुरू करण्यासाठी कृपया दुरुस्ती करून पुन्हा अर्ज करा.'
                    : 'Your previous KYC submission was rejected by the regulatory authority. You must correct the flagged issues and re-apply to unlock this feature.')
                : (language === 'hi'
                    ? 'सीपीसीबी विनियामक दिशानिर्देशों के तहत ई-कचरे के लॉट निर्माण एवं बोलियां केवल अधिकृत व सत्यापित उपयोगकर्ताओं के लिए उपलब्ध हैं।'
                    : language === 'mr'
                    ? 'सीपीसीबी नियामक मार्गदर्शक तत्त्वांनुसार ई-कचरा लॉट निर्मिती व बोली फक्त सत्यापित वापरकर्त्यांसाठी उपलब्ध आहे.'
                    : 'Under CPCB E-Waste Formalization Regulations, creating digital scrap lots and placing commercial bids require verified regulatory KYC.')}
            </p>
          </div>

          {/* Status Box */}
          <div className={`p-4 rounded-2xl text-left text-xs space-y-2 border ${
            isRejected
              ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/60'
              : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700'
          }`}>
            <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
              <span>Current Status:</span>
              <span className={`font-bold uppercase ${isRejected ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'}`}>
                {user?.kycStatus || 'UNDER_REVIEW'}
              </span>
            </div>

            {isRejected && (
              <div className="pt-1.5 border-t border-rose-200 dark:border-rose-800/60 space-y-0.5">
                <span className="text-[11px] font-bold text-rose-800 dark:text-rose-300 block">
                  {language === 'hi' ? 'अस्वीकृति का कारण:' : language === 'mr' ? 'नाकारण्याचे कारण:' : 'Rejection Reason:'}
                </span>
                <p className="text-xs font-semibold text-rose-950 dark:text-rose-200 leading-snug">
                  "{user?.kycDocuments?.rejectionReason || 'Document details were unclear or unverified.'}"
                </p>
              </div>
            )}

            <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 pt-1">
              <span>Reviewed By:</span>
              <span className="font-bold text-slate-700 dark:text-slate-300">
                CPCB / ULB Regulatory Authority
              </span>
            </div>
            {user?.kycDocuments && (
              <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                <span>Submitted ID:</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">
                  {user.kycDocuments.idType} •••• {user.kycDocuments.idNumber.slice(-4)}
                </span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-1">
            {isRejected && (
              <button
                onClick={handleOpenReapply}
                className="w-full py-3 px-4 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold shadow-md transition-all active:scale-98 flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>
                  {language === 'hi'
                    ? 'केवाईसी पुनः आवेदन करें'
                    : language === 'mr'
                    ? 'केवायसी पुन्हा अर्ज करा'
                    : 'Re-Apply for KYC / Fix Documents'}
                </span>
              </button>
            )}

            <button
              onClick={() => {
                triggerHaptic(20);
                onClose();
              }}
              className={`w-full py-3 px-4 rounded-full text-sm font-bold shadow-sm transition-all active:scale-98 ${
                isRejected
                  ? 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  : 'bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white shadow-md'
              }`}
            >
              {language === 'hi' ? 'ठीक है, डैशबोर्ड देखें' : language === 'mr' ? 'समजले, डॅशबोर्ड पहा' : 'Got It, Return to Dashboard'}
            </button>
          </div>
        </div>
      </div>

      {/* Embedded Re-Apply Modal */}
      <KycReapplyModal
        isOpen={showReapplyModal}
        onClose={() => {
          setShowReapplyModal(false);
          onClose(); // Close locked modal too once user finishes re-apply flow
        }}
      />
    </>
  );
};
