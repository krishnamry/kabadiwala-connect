import React, { useState, useEffect } from 'react';
import { EWasteLot, LotBid } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { VoiceAssistButton } from '../../components/VoiceAssistButton';
import { triggerHaptic, hapticSuccess } from '../../lib/haptics';
import {
  Gavel,
  Clock,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  MessageSquare,
  AlertCircle,
  Radio,
  Building2,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Award
} from 'lucide-react';

interface LiveBiddingRoomProps {
  lots: EWasteLot[];
  onAcceptBid: (lotId: string, bidId: string) => Promise<void>;
  onOpenChat: (lot: EWasteLot) => void;
  onRefresh: () => void;
}

export const LiveBiddingRoom: React.FC<LiveBiddingRoomProps> = ({
  lots,
  onAcceptBid,
  onOpenChat,
  onRefresh
}) => {
  const { language, t, formatCurrency } = useLanguage();
  const [acceptingBidId, setAcceptingBidId] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  // Update timer tick every second for real-time countdowns
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const biddingLots = lots.filter(l => l.status === 'BIDDING' || (l.bids && l.bids.length > 0) || l.status === 'AVAILABLE');

  const getTimeRemaining = (expiresAt?: string, durationMins: number = 60, createdAt?: string) => {
    const target = expiresAt
      ? new Date(expiresAt).getTime()
      : (createdAt ? new Date(createdAt).getTime() + durationMins * 60 * 1000 : now + 45 * 60 * 1000);
    const diff = Math.max(0, target - now);
    const mins = Math.floor(diff / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    return {
      isExpired: diff <= 0,
      isSnipingZone: diff > 0 && diff <= 60000,
      formatted: `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
    };
  };

  const handleAccept = async (lotId: string, bidId: string) => {
    setAcceptingBidId(bidId);
    triggerHaptic();
    try {
      await onAcceptBid(lotId, bidId);
      hapticSuccess();
    } finally {
      setAcceptingBidId(null);
    }
  };

  const voiceScripts = {
    en: "Welcome to the Live Bidding Room. Authorized CPCB recyclers are placing real-time bids on your electronic scrap lots. You can monitor the highest price per kilogram and countdown timers. If a bid arrives in the final 60 seconds, the soft anti-sniping rule automatically extends the timer by 2 minutes so you always get maximum value. Tap 'Accept Bid' to lock the deal and generate your digital weighbridge pass, or chat directly with the buyer.",
    hi: "लाइव बोली कक्ष में आपका स्वागत है। अधिकृत सीपीसीबी रीसायकलर आपके ई-कचरे के लॉट पर सीधे बोलियाँ लगा रहे हैं। आप स्क्रीन पर उच्चतम बोली और समय सीमा देख सकते हैं। यदि अंतिम 60 सेकंड में नई बोली आती है, तो एंटी-स्निपिंग नियम के तहत 2 मिनट का समय खुद-ब-खुद बढ़ जाता है ताकि आपको बेहतरीन भाव मिले। सर्वोत्तम बोली स्वीकार करने के लिए 'स्वीकार करें' दबाएं या रीसायकलर से सीधे चैट करें।",
    mr: "थेट लिलाव कक्षात आपले स्वागत आहे. अधिकृत सीपीसीबी रीसायकलर्स आपल्या ई-कचरा लॉटवर थेट बोली लावत आहेत. आपण सर्वाधिक दर आणि उलट गणती वेळ पाहू शकता. शेवटच्या ६० सेकंदात नवीन बोली आल्यास लिलाव आपोआप २ मिनिटे वाढतो. उत्तम बोली स्वीकारण्यासाठी 'स्वीकारा' दाबा किंवा खरेदीदाराशी थेट चॅट करा."
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Top Banner with Radar Indicator & Voice Assist */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-3xl p-5 sm:p-7 shadow-m3-2 border border-emerald-500/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-400/30">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
              </span>
              <Radio className="w-3.5 h-3.5" />
              <span>LIVE RECYCLER RADAR ACTIVE</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-display font-black tracking-tight">
              {t('liveBiddingTitle', 'Live Bidding Room & Auction Floor')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
              {t('liveBiddingSubtitle', 'Verified CPCB recyclers competing for your e-waste lots in real time. Anti-sniping +2m extension protects your fair payout.')}
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-center">
            <VoiceAssistButton
              text={voiceScripts.en}
              hindiText={voiceScripts.hi}
              marathiText={voiceScripts.mr}
            />
            <button
              onClick={onRefresh}
              className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-white border border-white/20"
              title="Refresh Bids"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Dynamic Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-emerald-500/20">
          <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
            <span className="text-xs text-emerald-300 font-medium block">Active Auctions</span>
            <span className="text-xl font-bold font-mono text-white">{biddingLots.length} Lots</span>
          </div>
          <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
            <span className="text-xs text-emerald-300 font-medium block">Active Recyclers</span>
            <span className="text-xl font-bold font-mono text-white">4 Facilities</span>
          </div>
          <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
            <span className="text-xs text-emerald-300 font-medium block">Avg Price Boost</span>
            <span className="text-xl font-bold font-mono text-emerald-400">+34% vs Informal</span>
          </div>
          <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
            <span className="text-xs text-emerald-300 font-medium block">Anti-Sniping Rule</span>
            <span className="text-xl font-bold font-mono text-amber-300">+2m Active</span>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {biddingLots.length === 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-10 text-center border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
            <Gavel className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {t('noActiveAuctions', 'No active bidding lots currently')}
            </h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              {t('createLotToStartBids', 'Create a new digital lot in Tab 1. Recyclers in your area will automatically receive push alerts and place live bids.')}
            </p>
          </div>
        </div>
      )}

      {/* Lot Bidding Cards */}
      <div className="space-y-4">
        {biddingLots.map(lot => {
          const timer = getTimeRemaining(lot.auctionExpiresAt, lot.auctionDurationMins, lot.createdAt);
          const bids = lot.bids || [];
          const sortedBids = [...bids].sort((a, b) => b.bidAmount - a.bidAmount);
          const highest = sortedBids[0];

          return (
            <div
              key={lot.id}
              className="bg-white dark:bg-[#151f32] rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all space-y-5"
            >
              {/* Header: Lot Code, Category, Timer */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-black text-lg">
                    <Gavel className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                        {lot.lotCode}
                      </span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300">
                        {lot.status}
                      </span>
                      {timer.isSnipingZone && (
                        <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-rose-100 text-rose-700 animate-pulse flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> +2m Extended
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                      {lot.category} ({lot.approxWeightKg} kg)
                    </h3>
                  </div>
                </div>

                {/* Live Countdown Clock */}
                <div className="flex items-center gap-3 self-start sm:self-center">
                  <div className="text-right">
                    <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
                      Auction Time Remaining
                    </span>
                    <span className={`text-xl font-mono font-black ${timer.isSnipingZone ? 'text-rose-600 animate-pulse' : 'text-slate-900 dark:text-white'}`}>
                      <Clock className="w-4 h-4 inline mr-1 text-slate-400" />
                      {timer.formatted}
                    </span>
                  </div>

                  <button
                    onClick={() => onOpenChat(lot)}
                    className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-300 hover:text-emerald-600 border border-slate-200 dark:border-slate-700 transition-all active:scale-95 flex items-center gap-1.5 text-xs font-bold"
                  >
                    <MessageSquare className="w-4 h-4 text-emerald-600" />
                    <span>Chat</span>
                  </button>
                </div>
              </div>

              {/* Pricing Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80">
                <div>
                  <span className="text-xs text-slate-500 font-medium block">Your Asking Price</span>
                  <span className="text-base font-bold text-slate-800 dark:text-slate-200">
                    {formatCurrency(lot.askingPrice || lot.estimatedValue)}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 font-medium block">Min Allowed Bid</span>
                  <span className="text-base font-bold text-slate-700 dark:text-slate-300">
                    {formatCurrency(lot.minBidAmount || Math.round((lot.askingPrice || lot.estimatedValue) * 0.5))}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium block">Highest Live Bid</span>
                  <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                    {highest ? formatCurrency(highest.bidAmount) : 'No bids yet'}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 font-medium block">Effective Rate</span>
                  <span className="text-base font-bold text-slate-800 dark:text-slate-200">
                    {highest ? `₹${highest.bidPerKg}/kg` : `₹${Math.round((lot.askingPrice || 0) / (lot.approxWeightKg || 1))}/kg`}
                  </span>
                </div>
              </div>

              {/* Bids List */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  Bids Placed ({sortedBids.length})
                </span>

                {sortedBids.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/60 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
                    <Radio className="w-4 h-4 text-amber-600 animate-spin" />
                    <span>Broadcasting lot to nearby CPCB units. Live bids appear automatically.</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {sortedBids.map((bid, bidx) => {
                      const isTopBid = bidx === 0;
                      return (
                        <div
                          key={bid.id}
                          className={`p-3.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                            isTopBid
                              ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-2 border-emerald-500/50'
                              : 'bg-slate-50 dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                              isTopBid ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                            }`}>
                              #{bidx + 1}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-slate-900 dark:text-white">
                                  {bid.recyclerName}
                                </span>
                                {isTopBid && (
                                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-600 text-white flex items-center gap-1">
                                    <Award className="w-3 h-3" /> BEST BID
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-slate-500 block">
                                ₹{bid.bidPerKg}/kg • {bid.createdAt}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 self-end sm:self-center">
                            <div className="text-right">
                              <span className="text-base font-black text-slate-900 dark:text-white">
                                {formatCurrency(bid.bidAmount)}
                              </span>
                            </div>

                            {lot.status !== 'CONFIRMED' && lot.status !== 'HANDOVER_PENDING' && (
                              <button
                                onClick={() => handleAccept(lot.id, bid.id)}
                                disabled={acceptingBidId === bid.id}
                                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                <span>{acceptingBidId === bid.id ? 'Accepting...' : 'Accept Bid'}</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
