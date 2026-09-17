import React, { useState } from 'react';
import { Star, ShieldCheck, X, CheckCircle2, Lock, Award, HeartHandshake } from 'lucide-react';
import { triggerHaptic, hapticSuccess } from '../../lib/haptics';
import { useLanguage } from '../../context/LanguageContext';

interface RatingModalProps {
  saleTokenId?: string;
  partnerId: string;
  partnerName: string;
  role: 'RECYCLER' | 'CITIZEN' | string;
  lotCode?: string;
  onClose: () => void;
  onSubmit: (data: {
    targetUserId: string;
    saleTokenId?: string;
    ratingOverall: number;
    ratingScaleAcc: number;
    ratingPayoutSpd: number;
    ratingPurity: number;
    reviewText: string;
  }) => Promise<void>;
}

export const RatingModal: React.FC<RatingModalProps> = ({
  saleTokenId,
  partnerId,
  partnerName,
  role,
  lotCode,
  onClose,
  onSubmit
}) => {
  const { language, t } = useLanguage();
  const [overall, setOverall] = useState(5);
  const [scaleAcc, setScaleAcc] = useState(5);
  const [payoutSpd, setPayoutSpd] = useState(5);
  const [purity, setPurity] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  const handleStarClick = (setter: (v: number) => void, val: number) => {
    setter(val);
    triggerHaptic();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    triggerHaptic();
    try {
      await onSubmit({
        targetUserId: partnerId,
        saleTokenId,
        ratingOverall: overall,
        ratingScaleAcc: scaleAcc,
        ratingPayoutSpd: payoutSpd,
        ratingPurity: purity,
        reviewText: comment
      });
      hapticSuccess();
      setSubmittedSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.warn('Review submit error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (currentVal: number, setter: (v: number) => void, label: string) => (
    <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{label}</span>
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            onClick={() => handleStarClick(setter, star)}
            className="p-1 text-amber-400 hover:scale-125 transition-transform"
          >
            <Star
              className={`w-5 h-5 ${star <= currentVal ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600'}`}
            />
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div
        className="bg-white dark:bg-[#151f32] rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 animate-scale-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {t('rateTrade', 'Rate Handover & Experience')}
              </h3>
              <p className="text-xs text-slate-500">
                {partnerName} {lotCode ? `• Lot ${lotCode}` : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Double-blind security note */}
        <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-800/60 flex items-start gap-2.5 text-xs text-blue-800 dark:text-blue-300">
          <Lock className="w-4 h-4 shrink-0 mt-0.5 text-blue-600" />
          <span>
            {t('doubleBlindNotice', 'Double-Blind Protected: Your rating remains strictly private until both parties submit, preventing retaliation.')}
          </span>
        </div>

        {submittedSuccess ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white">
              {language === 'hi' ? 'समीक्षा दर्ज हो गई!' : 'Rating Submitted Successfully!'}
            </h4>
            <p className="text-xs text-slate-500">
              {language === 'hi' ? 'दोनों समीक्षाएँ मिलने पर स्कोर अपडेट हो जाएगा।' : 'Bayesian reputation scores will update upon mutual reveal.'}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Star categories */}
            <div className="space-y-1">
              {renderStars(overall, setOverall, 'Overall Trade Satisfaction')}
              {renderStars(scaleAcc, setScaleAcc, 'Weighbridge Scale Accuracy')}
              {renderStars(payoutSpd, setPayoutSpd, 'Payout Speed & Transparency')}
              {renderStars(purity, setPurity, 'Material Fair Assessment')}
            </div>

            {/* Comment */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                Feedback Comment (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Fair digital scale, prompt UPI payout, clean facility"
                value={comment}
                onChange={e => setComment(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
              >
                <Award className="w-4 h-4" />
                <span>{submitting ? 'Submitting...' : 'Submit Blind Review'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
