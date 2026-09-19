import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { storage } from '../lib/storage';
import { api } from '../lib/api';
import { triggerHaptic, hapticSuccess } from '../lib/haptics';
import {
  X,
  AlertTriangle,
  Upload,
  Camera,
  CheckCircle2,
  FileText,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  Image as ImageIcon,
  Sparkles,
  Lock
} from 'lucide-react';
import { KycDocumentData } from '../types';

interface KycReapplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const KycReapplyModal: React.FC<KycReapplyModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { user, refreshUser } = useAuth();
  const { language } = useLanguage();

  const previousDocs = user?.kycDocuments;
  const rejectionReason = previousDocs?.rejectionReason || (
    language === 'hi'
      ? 'दस्तावेज़ की जानकारी अस्पष्ट थी या सरकारी रिकॉर्ड से मेल नहीं खा सकी।'
      : language === 'mr'
      ? 'कागदपत्रांची माहिती अस्पष्ट होती किंवा सरकारी नोंदींशी जुळली नाही.'
      : 'Document photograph was blurry or identity number could not be matched with official registry.'
  );

  const [idType, setIdType] = useState<string>(previousDocs?.idType || 'AADHAAR');
  const [idNumber, setIdNumber] = useState<string>(previousDocs?.idNumber || '');
  const [frontImage, setFrontImage] = useState<string | null>(previousDocs?.frontImage || null);
  const [backImage, setBackImage] = useState<string | null>(previousDocs?.backImage || null);
  const [remarks, setRemarks] = useState<string>('');
  const [agreed, setAgreed] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  if (!isOpen || !user) return null;

  const validateId = (): boolean => {
    const clean = idNumber.replace(/\s+/g, '').trim();
    if (!clean) {
      setErrorMsg(language === 'hi' ? 'कृपया पहचान पत्र संख्या दर्ज करें' : 'Please enter document identity number');
      return false;
    }
    if (idType === 'AADHAAR') {
      const digitsOnly = clean.replace(/\D/g, '');
      if (digitsOnly.length !== 12) {
        setErrorMsg(language === 'hi' ? 'आधार कार्ड में 12 अंक होने चाहिए' : 'Aadhaar requires exactly 12 digits');
        return false;
      }
    } else if (idType === 'PAN') {
      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i;
      if (!panRegex.test(clean)) {
        setErrorMsg(language === 'hi' ? 'मान्य 10 अक्षरीय पैन नंबर दर्ज करें (उदा. ABCDE1234F)' : 'Enter valid 10-char PAN (e.g. ABCDE1234F)');
        return false;
      }
    }
    setErrorMsg(null);
    return true;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'front' | 'back') => {
    const file = e.target.files?.[0];
    if (!file) return;
    triggerHaptic(10);
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const result = uploadEvent.target?.result as string;
      if (target === 'front') {
        setFrontImage(result);
      } else {
        setBackImage(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleApplySampleDoc = (target: 'front' | 'back') => {
    triggerHaptic(15);
    // Verified placeholder SVG for desktop demo without camera
    const sample = target === 'front'
      ? `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="250" viewBox="0 0 400 250"><rect width="400" height="250" rx="16" fill="%230F172A"/><rect x="20" y="20" width="360" height="210" rx="12" fill="%231E293B" stroke="%2310B981" stroke-width="2"/><text x="40" y="60" fill="%2310B981" font-family="sans-serif" font-weight="bold" font-size="16">GOVERNMENT OF INDIA - KYC VERIFIED</text><text x="40" y="100" fill="%23FFFFFF" font-family="sans-serif" font-weight="bold" font-size="20">${user.name.toUpperCase()}</text><text x="40" y="140" fill="%2394A3B8" font-family="monospace" font-size="16">ID: ${idType} ${idNumber || 'XXXX-XXXX-8921'}</text><circle cx="330" cy="160" r="30" fill="%2310B981" opacity="0.3"/><path d="M320 160 l8 8 l16 -16" stroke="%2310B981" stroke-width="3" fill="none"/></svg>`
      : `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="250" viewBox="0 0 400 250"><rect width="400" height="250" rx="16" fill="%230F172A"/><rect x="20" y="20" width="360" height="210" rx="12" fill="%231E293B" stroke="%233B82F6" stroke-width="2"/><text x="40" y="60" fill="%233B82F6" font-family="sans-serif" font-weight="bold" font-size="14">UIDAI RESIDENTIAL ADDRESS BACK</text><text x="40" y="100" fill="%23E2E8F0" font-family="sans-serif" font-size="13">${user.address || 'Mayapuri Industrial Area, New Delhi - 110064'}</text><text x="40" y="180" fill="%2364748B" font-family="monospace" font-size="12">OFFICIAL QR CODE / BARCODE SEALED</text></svg>`;

    if (target === 'front') {
      setFrontImage(sample);
    } else {
      setBackImage(sample);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateId()) {
      triggerHaptic(25);
      return;
    }
    if (!agreed) {
      setErrorMsg(language === 'hi' ? 'कृपया सत्यापन घोषणा स्वीकार करें' : 'Please check the verification declaration');
      return;
    }

    setSubmitting(true);
    triggerHaptic(20);

    try {
      const nowIso = new Date().toISOString();
      const updatedKycData: KycDocumentData = {
        idType: idType as any,
        idNumber: idNumber.trim(),
        frontImage: frontImage || previousDocs?.frontImage || undefined,
        backImage: backImage || previousDocs?.backImage || undefined,
        submittedAt: nowIso,
        remarks: remarks.trim() || undefined,
        rejectionReason: undefined // Clear previous rejection reason
      };

      // 1. Update in local storage state
      storage.updateUserKyc(user.id, updatedKycData);

      // 2. Dispatch in-app notification to user
      storage.addNotification({
        id: `notif-kyc-resubmit-${Date.now()}`,
        userId: user.id,
        title: language === 'hi' ? 'केवाईसी पुनः जमा किया गया' : language === 'mr' ? 'केवायसी पुन्हा सादर केले' : 'KYC Re-Application Submitted',
        message: language === 'hi'
          ? 'आपके संशोधित दस्तावेज़ सीपीसीबी / एनडीएमसी नियामक सेल को सत्यापन के लिए भेज दिए गए हैं।'
          : language === 'mr'
          ? 'तुमची दुरुस्त कागदपत्रे सीपीसीबी नियामक विभागाकडे तपासणीसाठी पाठवली आहेत.'
          : 'Your corrected identification documents have been resubmitted to the CPCB Compliance Cell for priority review.',
        type: 'KYC',
        timestamp: nowIso,
        read: false
      });

      // 3. Optional backend synchronization
      try {
        await api.submitKycDocuments({
          documentType: idType,
          documentNumber: idNumber.trim(),
          remarks: remarks.trim() || 'Corrected documents uploaded upon rejection'
        });
      } catch (apiErr) {
        console.warn('Backend API submission deferred to local state:', apiErr);
      }

      await refreshUser();
      hapticSuccess();
      setIsSuccess(true);

      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1400);

    } catch (err: any) {
      console.error('Error resubmitting KYC:', err);
      setErrorMsg(err.message || 'Failed to resubmit documents. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 relative max-h-[92vh] overflow-y-auto animate-scale-up"
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <button
          onClick={() => {
            triggerHaptic(15);
            onClose();
          }}
          disabled={submitting}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with CPCB Regulatory Badge */}
        <div className="space-y-1.5 pr-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
            <RefreshCw className="w-3.5 h-3.5" />
            <span>
              {language === 'hi' ? 'पुनः आवेदन पोर्टल' : language === 'mr' ? 'पुन्हा अर्ज पोर्टल' : 'KYC Correction & Re-Application'}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-display font-black text-slate-900 dark:text-white">
            {language === 'hi'
              ? 'पहचान दस्तावेज़ पुनः जमा करें'
              : language === 'mr'
              ? 'ओळखपत्र पुन्हा सादर करा'
              : 'Re-Apply for Regulatory KYC'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            {language === 'hi'
              ? 'अस्वीकृति के कारणों को सुधारें और सीपीसीबी व एनडीएमसी अनुमोदन के लिए स्पष्ट दस्तावेज़ जमा करें।'
              : language === 'mr'
              ? 'नाकारण्याचे कारण तपासून दुरुस्त कागदपत्रे पुन्हा सीपीसीबी तपासणीसाठी सादर करा.'
              : 'Correct rejected details and upload high-clarity government identity cards for formal authorization.'}
          </p>
        </div>

        {/* Rejection Reason Alert Box */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs space-y-1.5">
          <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 font-bold uppercase tracking-wider text-[11px]">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              {language === 'hi' ? 'नियामक द्वारा दिया गया कारण:' : language === 'mr' ? 'नियामकाने दिलेले कारण:' : 'Official Regulatory Rejection Reason:'}
            </span>
          </div>
          <p className="font-semibold text-rose-900 dark:text-rose-200 text-xs sm:text-sm pl-6 leading-relaxed">
            "{rejectionReason}"
          </p>
          <p className="text-[11px] text-rose-700/80 dark:text-rose-300/70 pl-6">
            {language === 'hi'
              ? 'कृपया सुनिश्चित करें कि नया दस्तावेज़ साफ, पढ़ने योग्य और आपके पंजीकृत नाम से मेल खाता हो।'
              : language === 'mr'
              ? 'कृपया नवीन कागदपत्र स्पष्ट, वाचण्याजोगे आणि नोंदणीकृत नावाशी जुळणारे असल्याची खात्री करा.'
              : 'Please ensure your resubmitted ID is unblurred, valid, and clearly shows your name and address.'}
          </p>
        </div>

        {/* Success Splash */}
        {isSuccess ? (
          <div className="py-8 text-center space-y-3 animate-scale-up">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-300 dark:border-emerald-700">
              <CheckCircle2 className="w-9 h-9 animate-bounce" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {language === 'hi' ? 'दस्तावेज़ सफलतापूर्वक पुनः जमा हो गए!' : 'KYC Re-Application Submitted!'}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
              {language === 'hi'
                ? 'आपकी स्थिति अब "समीक्षा जारी" में बदल गई है। सीपीसीबी सेल द्वारा त्वरित समीक्षा की जाएगी।'
                : 'Your profile has returned to "Under Review". Regulatory cell officers will prioritize this resubmission.'}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300 text-xs font-semibold flex items-center gap-2 border border-red-300 dark:border-red-800">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Document Type & Number */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {language === 'hi' ? 'दस्तावेज़ का प्रकार' : 'Document Type'}
                </label>
                <select
                  value={idType}
                  onChange={(e) => {
                    setIdType(e.target.value);
                    setErrorMsg(null);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="AADHAAR">Aadhaar Card (12 Digits)</option>
                  <option value="PAN">PAN Card (Income Tax)</option>
                  <option value="DRIVING_LICENSE">Commercial Driving License</option>
                  <option value="VOTER_ID">Voter Identity Card</option>
                  <option value="TRADE_PASS">Municipal ULB Waste Trade Pass</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {language === 'hi' ? 'पहचान संख्या' : 'Document ID Number'}
                </label>
                <input
                  type="text"
                  value={idNumber}
                  onChange={(e) => {
                    setIdNumber(e.target.value);
                    setErrorMsg(null);
                  }}
                  placeholder={idType === 'AADHAAR' ? '1234 5678 9012' : idType === 'PAN' ? 'ABCDE1234F' : 'e.g. DL-14-2023-XXXX'}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Front Photo Upload */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{language === 'hi' ? 'दस्तावेज़ का सामने का फोटो (Front)' : 'Front Photo / Scanned Card'}</span>
                </label>
                <button
                  type="button"
                  onClick={() => handleApplySampleDoc('front')}
                  className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>{language === 'hi' ? 'साफ सैंपल कार्ड लगाएं' : 'Attach Clean Sample'}</span>
                </button>
              </div>

              {frontImage ? (
                <div className="relative rounded-2xl border border-slate-300 dark:border-slate-700 overflow-hidden bg-slate-100 dark:bg-slate-800 p-2 flex items-center justify-between gap-3">
                  <img
                    src={frontImage}
                    alt="Front Document"
                    className="h-16 w-24 object-cover rounded-xl border border-slate-300 dark:border-slate-700"
                  />
                  <div className="flex-1 text-xs">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 block">
                      ✓ {language === 'hi' ? 'फोटो अपलोड हो गई है' : 'Front Image Attached'}
                    </span>
                    <span className="text-[10px] text-slate-500">Ready for regulatory inspection</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFrontImage(null)}
                    className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-2xl cursor-pointer bg-slate-50 dark:bg-slate-800/60 transition-colors">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                    <Camera className="w-4 h-4 text-emerald-600" />
                    <span>{language === 'hi' ? 'कैमरा या फाइल से नया फोटो चुनें' : 'Upload Clear Front Photo'}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5">JPG, PNG or PDF (Max 5MB)</span>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => handleFileUpload(e, 'front')}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Back Photo Upload (Optional / Aadhaar) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                  <span>{language === 'hi' ? 'पीछे का फोटो (Back - वैकल्पिक/पते हेतु)' : 'Back Photo (Address side - optional)'}</span>
                </label>
                <button
                  type="button"
                  onClick={() => handleApplySampleDoc('back')}
                  className="text-[10px] font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Attach Sample</span>
                </button>
              </div>

              {backImage ? (
                <div className="relative rounded-2xl border border-slate-300 dark:border-slate-700 overflow-hidden bg-slate-100 dark:bg-slate-800 p-2 flex items-center justify-between gap-3">
                  <img
                    src={backImage}
                    alt="Back Document"
                    className="h-14 w-20 object-cover rounded-xl border border-slate-300 dark:border-slate-700"
                  />
                  <div className="flex-1 text-xs">
                    <span className="font-bold text-blue-600 dark:text-blue-400 block">✓ Back Image Attached</span>
                    <span className="text-[10px] text-slate-500">Address verification clear</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setBackImage(null)}
                    className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center p-3 border border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 rounded-2xl cursor-pointer bg-slate-50 dark:bg-slate-800/40 transition-colors">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
                    <Upload className="w-3.5 h-3.5 text-blue-500" />
                    <span>{language === 'hi' ? 'पीछे का पृष्ठ अपलोड करें' : 'Attach Back Side (Optional)'}</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => handleFileUpload(e, 'back')}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Officer Remarks / Correction Clarification */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                {language === 'hi' ? 'नियामक अधिकारी के लिए स्पष्टीकरण' : 'Clarification / Note to CPCB Reviewer'}
              </label>
              <textarea
                rows={2}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder={
                  language === 'hi'
                    ? 'उदा. मैंने आधार कार्ड की स्पष्ट स्कैन कॉपी अपलोड की है जिसमें पूरा नाम और जन्मतिथि साफ दिखाई दे रही है।'
                    : 'e.g. Re-uploaded high-clarity front scan with matching name and clear QR code.'
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            {/* Declaration Checkbox */}
            <label className="flex items-start gap-2.5 cursor-pointer text-[11px] text-slate-600 dark:text-slate-400 pt-1">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span>
                {language === 'hi'
                  ? 'मैं प्रमाणित करता हूँ कि प्रस्तुत किए गए नए दस्तावेज़ वैध हैं और मेरे नाम पर पंजीकृत हैं।'
                  : language === 'mr'
                  ? 'मी प्रमाणित करतो की सादर केलेले नवीन कागदपत्रे वैध आहेत आणि माझ्या नावावर नोंदणीकृत आहेत.'
                  : 'I declare that the resubmitted identity documents are authentic and officially match my profile.'}
              </span>
            </label>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(15);
                  onClose();
                }}
                disabled={submitting}
                className="flex-1 py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                {language === 'hi' ? 'रद्द करें' : 'Cancel'}
              </button>

              <button
                type="submit"
                disabled={submitting || !idNumber.trim()}
                className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-98"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>{language === 'hi' ? 'जमा हो रहा है...' : 'Submitting to CPCB...'}</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>{language === 'hi' ? 'सुधार जमा करें' : 'Submit Re-Application'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
