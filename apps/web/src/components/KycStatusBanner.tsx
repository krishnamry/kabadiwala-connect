import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Clock, AlertTriangle, ShieldCheck, ChevronRight, FileText, Info, RefreshCw } from 'lucide-react';
import { triggerHaptic } from '../lib/haptics';
import { KycReapplyModal } from './KycReapplyModal';

interface KycStatusBannerProps {
  onOpenKycModal?: () => void;
}

export const KycStatusBanner: React.FC<KycStatusBannerProps> = ({ onOpenKycModal }) => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [showReapplyModal, setShowReapplyModal] = useState<boolean>(false);

  if (!user) return null;

  // Once verified, DO NOT show permanent verified banner per user request
  if (user.kycStatus === 'VERIFIED') {
    return null;
  }

  if (user.kycStatus === 'UNDER_REVIEW') {
    return (
      <div className="w-full bg-amber-500/10 dark:bg-amber-950/40 border-y sm:border sm:rounded-2xl border-amber-300/70 dark:border-amber-700/60 p-3 sm:p-4 mb-4 sm:mb-6 shadow-sm animate-fade-in">
        <div className="flex items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xs sm:text-sm font-display font-black text-amber-900 dark:text-amber-200">
                  {language === 'hi'
                    ? 'केवाईसी सत्यापन प्रक्रियाधीन है'
                    : language === 'mr'
                    ? 'केवायसी पडताळणी प्रगतीपथावर आहे'
                    : 'KYC Verification Under Progress'}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-200/70 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                  {language === 'hi' ? 'समीक्षा जारी' : language === 'mr' ? 'तपासणी सुरू' : 'Under Review'}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-amber-800/90 dark:text-amber-300/80 mt-1 leading-relaxed">
                {language === 'hi'
                  ? 'आपके आधार / पैन दस्तावेज़ सीपीसीबी नियामक प्राधिकारी को भेज दिए गए हैं। आप डैशबोर्ड देख सकते हैं, सत्यापन पूर्ण होने पर लॉट निर्माण और बोलियां स्वतः सक्रिय हो जाएंगी।'
                  : language === 'mr'
                  ? 'तुमची आधार / पॅन कागदपत्रे सीपीसीबी नियामक प्राधिकरणाकडे तपासणीसाठी पाठवली आहेत. पडताळणी पूर्ण झाल्यावर लॉट निर्मिती व बोली पर्याय सुरू होतील.'
                  : 'Your Aadhaar/PAN documents have been submitted to the CPCB Regulatory Authority for verification. You can explore the portal; lot creation and live bidding will unlock once approved.'}
              </p>
              {user.kycDocuments && (
                <div className="flex items-center gap-3 mt-2 text-[10px] font-mono text-amber-700 dark:text-amber-400">
                  <span>
                    ID: {user.kycDocuments.idType} •••• {user.kycDocuments.idNumber.slice(-4)}
                  </span>
                  <span>•</span>
                  <span>
                    Submitted: {new Date(user.kycDocuments.submittedAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (user.kycStatus === 'REJECTED') {
    return (
      <>
        <div className="w-full bg-rose-500/10 dark:bg-rose-950/40 border-y sm:border sm:rounded-2xl border-rose-300/70 dark:border-rose-700/60 p-3 sm:p-4 mb-4 sm:mb-6 shadow-sm animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-xs sm:text-sm font-display font-black text-rose-900 dark:text-rose-200">
                    {language === 'hi'
                      ? 'केवाईसी सत्यापन अस्वीकृत — सुधार आवश्यक'
                      : language === 'mr'
                      ? 'केवायसी पडताळणी नाकारली — दुरुस्ती आवश्यक'
                      : 'KYC Verification Needs Correction'}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-rose-200/70 dark:bg-rose-900/60 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-700">
                    {language === 'hi' ? 'पुनः आवेदन आवश्यक' : language === 'mr' ? 'पुन्हा अर्ज आवश्यक' : 'Re-Apply Required'}
                  </span>
                </div>
                <div className="mt-1.5 p-2 rounded-xl bg-rose-100/60 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800/60">
                  <span className="text-[11px] font-bold text-rose-900 dark:text-rose-200 block">
                    {language === 'hi' ? 'अस्वीकृति का कारण: ' : language === 'mr' ? 'नाकारण्याचे कारण: ' : 'Rejection Reason: '}
                    <span className="font-normal">
                      {user.kycDocuments?.rejectionReason || (language === 'hi' ? 'दस्तावेज़ की प्रति स्पष्ट नहीं थी।' : 'Document photo was unclear or unreadable.')}
                    </span>
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-rose-800/90 dark:text-rose-300/80 mt-1 leading-relaxed">
                  {language === 'hi'
                    ? 'कृपया अस्वीकृति के कारण को सुधारें और पुनः अनुमोदन के लिए नया पहचान पत्र अपलोड करें।'
                    : language === 'mr'
                    ? 'कृपया नाकारण्याचे कारण तपासून पुन्हा मंजुरीसाठी नवीन ओळखपत्र अपलोड करा.'
                    : 'Please review the official reason above, update your document details or photos, and re-apply for CPCB approval.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                triggerHaptic(20);
                if (onOpenKycModal) {
                  onOpenKycModal();
                } else {
                  setShowReapplyModal(true);
                }
              }}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-bold shrink-0 transition-all shadow-md flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>
                {language === 'hi'
                  ? 'केवाईसी पुनः आवेदन करें'
                  : language === 'mr'
                  ? 'केवायसी पुन्हा अर्ज करा'
                  : 'Re-Apply for KYC'}
              </span>
            </button>
          </div>
        </div>

        {/* Self-contained re-apply modal */}
        <KycReapplyModal
          isOpen={showReapplyModal}
          onClose={() => setShowReapplyModal(false)}
        />
      </>
    );
  }

  return null;
};
