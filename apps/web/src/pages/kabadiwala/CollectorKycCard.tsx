import React, { useState, useEffect } from 'react';
import { KycInfo } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { VoiceAssistButton } from '../../components/VoiceAssistButton';
import { triggerHaptic, hapticSuccess } from '../../lib/haptics';
import {
  ShieldCheck,
  Award,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Clock,
  FileText,
  BadgeCheck,
  Lock,
  ArrowRight,
  UserCheck,
  RefreshCw
} from 'lucide-react';

interface CollectorKycCardProps {
  kycInfo: KycInfo | null;
  onSubmitKyc: (payload: { documentType: string; documentNumber: string; remarks?: string }) => Promise<void>;
  onRefresh: () => void;
}

export const CollectorKycCard: React.FC<CollectorKycCardProps> = ({
  kycInfo,
  onSubmitKyc,
  onRefresh
}) => {
  const { language, t, formatCurrency } = useLanguage();
  const [docType, setDocType] = useState('Aadhaar Card');
  const [docNumber, setDocNumber] = useState(kycInfo?.kycDocuments?.documentNumber || '');
  const [remarks, setRemarks] = useState(kycInfo?.kycDocuments?.remarks || '');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (kycInfo?.kycDocuments?.documentNumber && !docNumber) {
      setDocNumber(kycInfo.kycDocuments.documentNumber);
    }
  }, [kycInfo?.kycDocuments?.documentNumber]);

  const status = kycInfo?.kycStatus || 'UNVERIFIED';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docNumber.trim()) return;
    setSubmitting(true);
    triggerHaptic(20);
    try {
      await onSubmitKyc({
        documentType: docType,
        documentNumber: docNumber,
        remarks
      });
      hapticSuccess();
      setSuccessMsg(
        status === 'REJECTED'
          ? (language === 'hi' ? 'संशोधित दस्तावेज़ पुनः जमा हो गए हैं! सीपीसीबी सेल द्वारा समीक्षा जारी है।' : 'Corrected documents re-submitted for Regulatory review!')
          : (language === 'hi' ? 'दस्तावेज़ जमा हो गए हैं! नियामक द्वारा जांच जारी है।' : 'Documents submitted for Regulatory approval!')
      );
      onRefresh();
    } catch (err: any) {
      console.warn('KYC submit error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const voiceScripts = {
    en: "Collector KYC and formal identity verification. By verifying your Aadhaar or Municipal Waste Trade ID, you unlock Tier-2 benefits including a 500-kilogram daily limit, live auctions with CPCB recyclers, and direct escrow bank payouts. Upload your identity number below for instant review by the municipal cell.",
    hi: "कबाड़ीवाला पहचान और आधार सत्यापन पोर्टल। अपना आधार नंबर या नगर पालिका ट्रेड कार्ड दर्ज करने पर आपका टियर-2 सत्यापन खुल जाएगा। इससे आप 500 किलो तक दैनिक ई-कचरा बेच सकेंगे, सीधी नीलामी में भाग ले सकेंगे और बैंक खाते में भुगतान पा सकेंगे। नीचे अपना विवरण भरें।",
    mr: "संग्राहक केवायसी आणि अधिकृत ओळख पडताळणी. आधार क्रमांक किंवा महानगरपालिका नोंदणी सादर करून टियर-२ फायदे मिळवा. यामुळे ५०० किलोपर्यंत विक्री, थेट लिलाव आणि बँक खात्यात सुरक्षित पेमेंट मिळेल. खाली आपली माहिती भरा."
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KYC Overview Header */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-5 sm:p-7 shadow-m3-2 border border-blue-500/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-400/30">
              <BadgeCheck className="w-3.5 h-3.5" />
              <span>CPCB & NDMC FORMALIZATION CELL</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-display font-black tracking-tight">
              {t('kycTitle', 'Collector KYC & Formal Trade Badges')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
              {t('kycSubtitle', 'Upgrade from informal waste picker to authorized green urban collector under CPCB 2022 Guidelines.')}
            </p>
          </div>

          <VoiceAssistButton
            audioKey="kyc_walkthrough"
            label={language === 'hi' ? 'केवाईसी निर्देश सुनें' : language === 'mr' ? 'केवायसी मार्गदर्शक ऐका' : 'Listen KYC Guide'}
            text={voiceScripts.en}
            hindiText={voiceScripts.hi}
            marathiText={voiceScripts.mr}
          />
        </div>

        {/* Current Status Badge */}
        <div className="mt-5 pt-5 border-t border-blue-500/20 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold ${
              status === 'VERIFIED'
                ? 'bg-emerald-500 text-white'
                : status === 'UNDER_REVIEW'
                ? 'bg-amber-500 text-white'
                : status === 'REJECTED'
                ? 'bg-rose-500 text-white'
                : 'bg-slate-700 text-slate-300'
            }`}>
              {status === 'VERIFIED' ? (
                <ShieldCheck className="w-6 h-6" />
              ) : status === 'REJECTED' ? (
                <AlertTriangle className="w-6 h-6" />
              ) : (
                <Clock className="w-6 h-6" />
              )}
            </div>
            <div>
              <span className="text-[11px] text-blue-300 font-medium block uppercase tracking-wider">Verification Status</span>
              <span className="text-base font-bold">
                {status === 'VERIFIED'
                  ? '✓ CPCB Tier-2 Verified Collector'
                  : status === 'UNDER_REVIEW'
                  ? '⏳ Under Review by Municipal NDMC'
                  : status === 'REJECTED'
                  ? '❌ KYC Rejected — Re-Application Required'
                  : '⚠ Tier-1 Unverified (Limited Limits)'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs px-3 py-1 rounded-full font-bold bg-white/10 text-blue-200 border border-white/10">
              Daily Limit: {kycInfo?.dailyWeightLimitKg || 500} kg
            </span>
            <span className="text-xs px-3 py-1 rounded-full font-bold bg-white/10 text-blue-200 border border-white/10">
              Max Lot: {formatCurrency(kycInfo?.maxLotValueInr || 100000)}
            </span>
          </div>
        </div>
      </div>

      {/* Rejection Alert Box */}
      {status === 'REJECTED' && (
        <div className="p-4 rounded-3xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 space-y-2 animate-fade-in shadow-sm">
          <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 font-bold text-xs uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              {language === 'hi' ? 'सीपीसीबी नियामक अस्वीकृति का कारण:' : language === 'mr' ? 'नियामक नाकारण्याचे कारण:' : 'CPCB Regulatory Rejection Reason:'}
            </span>
          </div>
          <p className="font-semibold text-rose-950 dark:text-rose-100 text-xs sm:text-sm pl-6 leading-relaxed">
            "{kycInfo?.kycDocuments?.rejectionReason || 'Document details were unclear or unverified.'}"
          </p>
          <p className="text-[11px] text-rose-700/90 dark:text-rose-300/80 pl-6">
            {language === 'hi'
              ? 'कृपया नीचे दिए गए फॉर्म में पहचान संख्या या दस्तावेज़ सुधारें और पुनः अनुमोदन के लिए जमा करें।'
              : language === 'mr'
              ? 'कृपया खालील फॉर्ममध्ये ओळख क्रमांक किंवा कागदपत्रे दुरुस्त करा आणि पुन्हा मंजुरीसाठी सादर करा.'
              : 'Please review the reason above, update your document number or yard details in the form below, and re-apply for CPCB approval.'}
          </p>
        </div>
      )}

      {/* Tier Comparison Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Tier 1 Box */}
        <div className={`rounded-3xl p-5 border transition-all ${
          status === 'UNVERIFIED' || status === 'REJECTED'
            ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800/80 shadow-sm'
            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 opacity-80'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tier 1: Starter</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold">Basic</span>
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Informal / New Picker</h3>
          <ul className="mt-3 space-y-2 text-xs text-slate-600 dark:text-slate-300">
            <li className="flex items-center gap-2"><span>• Max 50 kg single lot limit</span></li>
            <li className="flex items-center gap-2"><span>• ₹10,000 maximum payout cap</span></li>
            <li className="flex items-center gap-2"><span>• Cash-only on-spot handover</span></li>
            <li className="flex items-center gap-2 text-slate-400"><span>✕ No live auction room access</span></li>
          </ul>
        </div>

        {/* Tier 2 Box */}
        <div className={`rounded-3xl p-5 border transition-all ${
          status === 'VERIFIED'
            ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-400 dark:border-emerald-700 shadow-md ring-2 ring-emerald-500/20'
            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Tier 2: Authorized</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-600 text-white font-bold flex items-center gap-1">
              <Award className="w-3 h-3" /> CPCB Green Badge
            </span>
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">CPCB Verified Green Collector</h3>
          <ul className="mt-3 space-y-2 text-xs text-slate-600 dark:text-slate-300">
            <li className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>500 kg daily weight capacity</span>
            </li>
            <li className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Up to ₹1,00,000 digital escrow payouts</span>
            </li>
            <li className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Full Live Bidding Room with multi-recycler auction</span>
            </li>
            <li className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>CPCB Safe Disposal Certificate & EPR credits</span>
            </li>
          </ul>
        </div>
      </div>

      {/* KYC Document Submission Form */}
      {status !== 'VERIFIED' && (
        <div className="bg-white dark:bg-[#151f32] rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              status === 'REJECTED'
                ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                : 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
            }`}>
              {status === 'REJECTED' ? <RefreshCw className="w-5 h-5" /> : <Upload className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {status === 'REJECTED'
                  ? (language === 'hi' ? 'केवाईसी पुनः आवेदन / दस्तावेज़ सुधार' : 'Re-Apply for KYC / Correct Details')
                  : t('submitKycHeader', 'Submit Verification Documents')}
              </h3>
              <p className="text-xs text-slate-500">
                {status === 'REJECTED'
                  ? (language === 'hi' ? 'संशोधित पहचान संख्या दर्ज करें और सीपीसीबी को पुनः भेजें' : 'Enter corrected identity number and resubmit for CPCB approval')
                  : t('submitKycSub', 'Aadhaar / Driving License / Municipal Waste License')}
              </p>
            </div>
          </div>

          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Document Type
                </label>
                <select
                  value={docType}
                  onChange={e => setDocType(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm font-medium"
                >
                  <option value="Aadhaar Card">Aadhaar Card (UIDAI Masked)</option>
                  <option value="Driving License">Commercial Driving License</option>
                  <option value="Voter ID">Voter Identity Card</option>
                  <option value="ULB Municipal Card">Municipal ULB Waste Trade Pass</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Document ID / Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. 9128-XXXX-8901"
                  value={docNumber}
                  onChange={e => setDocNumber(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                Operating Yard / Remarks
              </label>
              <input
                type="text"
                placeholder={
                  status === 'REJECTED'
                    ? 'e.g. Re-submitting with corrected Aadhaar number and updated yard details'
                    : 'e.g. Operating primarily in Mayapuri and Lajpat Nagar clusters'
                }
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !docNumber.trim()}
              className={`w-full sm:w-auto px-6 py-3 rounded-2xl text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 ${
                status === 'REJECTED'
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {status === 'REJECTED' ? <RefreshCw className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
              <span>
                {submitting
                  ? (language === 'hi' ? 'जमा हो रहा है...' : 'Submitting to NDMC...')
                  : status === 'REJECTED'
                  ? (language === 'hi' ? 'सुधार पुनः जमा करें (Re-Submit)' : 'Re-Submit for CPCB Approval')
                  : 'Submit for CPCB Approval'}
              </span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
