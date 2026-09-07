import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { Pickup, ScrapRate } from '../../types';
import { LeafletMap } from '../../components/LeafletMap';
import { VoiceAssistButton } from '../../components/VoiceAssistButton';
import {
  Truck,
  MapPin,
  Phone,
  CheckCircle2,
  Navigation,
  Wallet,
  ArrowRight,
  RefreshCw,
  Clock,
  Plus,
  Minus,
  Sparkles,
  ShieldCheck,
  Award
} from 'lucide-react';

export const KabadiwalaDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'nearby' | 'active' | 'wallet'>('nearby');
  const [nearbyPickups, setNearbyPickups] = useState<Pickup[]>([]);
  const [myPickups, setMyPickups] = useState<Pickup[]>([]);
  const [walletData, setWalletData] = useState<{ walletBalance: number; totalEarned: number; transactions: any[] }>({
    walletBalance: 1420,
    totalEarned: 3560,
    transactions: []
  });
  const [loading, setLoading] = useState(true);
  const [activeJob, setActiveJob] = useState<Pickup | null>(null);

  // Weight steppers for active job completion
  const [itemWeights, setItemWeights] = useState<{ [category: string]: number }>({});
  const [completingJob, setCompletingJob] = useState(false);
  const [completedSuccess, setCompletedSuccess] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [nearby, my, wallet] = await Promise.all([
        api.getNearbyPickups(28.5685, 77.2412, 15).catch(() => []),
        api.getMyPickups().catch(() => []),
        api.getKabadiwalaWallet().catch(() => ({ walletBalance: 1420, totalEarned: 3560, transactions: [] }))
      ]);

      setNearbyPickups(nearby);
      setMyPickups(my);
      setWalletData(wallet);

      // Find in-progress or accepted job
      const currentJob = my.find(p => p.status === 'IN_PROGRESS' || p.status === 'ACCEPTED');
      if (currentJob) {
        setActiveJob(currentJob);
        // Initialize weight steppers
        const initialWeights: { [category: string]: number } = {};
        currentJob.items.forEach(i => {
          initialWeights[i.category] = i.actualWeightKg || i.estWeightKg || 5;
        });
        setItemWeights(initialWeights);
      }
    } catch (err) {
      console.error('Failed to load kabadiwala data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAcceptPickup = async (pickup: Pickup) => {
    try {
      const accepted = await api.acceptPickup(pickup.id);
      alert(`Pickup accepted! Location: ${accepted.address}`);
      await loadData();
      setActiveJob(accepted);
      setActiveTab('active');
    } catch (err: any) {
      alert('Could not accept pickup: ' + (err.message || 'Error'));
    }
  };

  const adjustWeight = (category: string, delta: number) => {
    setItemWeights(prev => {
      const current = prev[category] || 1;
      const nextVal = Math.max(0.5, Math.round((current + delta) * 10) / 10);
      return { ...prev, [category]: nextVal };
    });
  };

  const handleCompletePickup = async () => {
    if (!activeJob) return;

    setCompletingJob(true);
    try {
      const itemsPayload = Object.keys(itemWeights).map(category => ({
        category,
        actualWeightKg: itemWeights[category]
      }));

      const res = await api.completePickup(activeJob.id, itemsPayload);
      setCompletedSuccess(`Pickup Completed! ₹${res.totalAmount} has been credited to your wallet.`);
      await loadData();
      setTimeout(() => {
        setCompletedSuccess(null);
        setActiveTab('wallet');
      }, 2500);
    } catch (err: any) {
      alert('Failed to complete pickup: ' + (err.message || 'Server error'));
    } finally {
      setCompletingJob(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Banner (High Contrast, Low-Literacy Friendly) */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl border-4 border-amber-500 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-500 text-slate-900 flex items-center justify-center font-black text-2xl shadow-lg flex-shrink-0">
            🚛
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black text-amber-400">सुरेश कुमार / Suresh</span>
              <span className="bg-emerald-500 text-slate-950 font-black text-[11px] px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> सत्यापित कबाड़ीवाला (KYC Verified)
              </span>
            </div>
            <p className="text-slate-300 text-sm font-medium mt-1">
              ई-रिक्शा सं. DL-4S-8910 • रेटिंग: ★ 4.9
            </p>
          </div>
        </div>

        {/* Big Wallet Capsule */}
        <div className="bg-slate-800 border-2 border-emerald-500/80 rounded-2xl p-4 flex items-center gap-5 w-full md:w-auto justify-between">
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase block">कुल बटुआ / Wallet Balance</span>
            <div className="text-3xl font-black text-emerald-400">₹{walletData.walletBalance}</div>
          </div>
          <VoiceAssistButton
            text={`Your wallet balance is rupees ${walletData.walletBalance}`}
            hindiText={`आपका बटुआ बैलेंस ${walletData.walletBalance} रुपये है।`}
            size="lg"
          />
        </div>
      </div>

      {/* 3 Main Action Big Tabs */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <button
          onClick={() => setActiveTab('nearby')}
          className={`p-4 sm:p-5 rounded-2xl font-black text-sm sm:text-lg flex flex-col sm:flex-row items-center justify-center gap-2 transition-all border-2 ${
            activeTab === 'nearby'
              ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-lg scale-[1.02]'
              : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-2xl">📍</span>
          <span>आस-पास कबाड़ ({nearbyPickups.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('active')}
          className={`p-4 sm:p-5 rounded-2xl font-black text-sm sm:text-lg flex flex-col sm:flex-row items-center justify-center gap-2 transition-all border-2 relative ${
            activeTab === 'active'
              ? 'bg-emerald-600 text-white border-emerald-700 shadow-lg scale-[1.02]'
              : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-2xl">⚖️</span>
          <span>चालू काम {activeJob && '●'}</span>
          {activeJob && (
            <span className="absolute top-2 right-2 w-3 h-3 bg-rose-500 rounded-full animate-ping" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('wallet')}
          className={`p-4 sm:p-5 rounded-2xl font-black text-sm sm:text-lg flex flex-col sm:flex-row items-center justify-center gap-2 transition-all border-2 ${
            activeTab === 'wallet'
              ? 'bg-purple-600 text-white border-purple-700 shadow-lg scale-[1.02]'
              : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-2xl">💰</span>
          <span>बटुआ (Wallet)</span>
        </button>
      </div>

      {/* TAB 1: NEARBY REQUESTS */}
      {activeTab === 'nearby' && (
        <div className="space-y-6">
          <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">📢</span>
              <p className="font-bold text-amber-950 text-sm sm:text-base">
                नये कबाड़ के अनुरोध: स्वीकार करने के लिए हरा बटन दबाएं।
              </p>
            </div>
            <VoiceAssistButton
              text="Nearby scrap requests available. Tap green accept button to lock job."
              hindiText="आपके आस-पास नए कबाड़ अनुरोध उपलब्ध हैं। काम लेने के लिए हरा बटन दबाएं।"
            />
          </div>

          {/* Map of Open Pickups */}
          <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-sm">
            <div className="font-bold text-slate-800 text-sm mb-3 flex items-center justify-between">
              <span>लाइव मैप / Live Map (Delhi South & Central)</span>
              <span className="text-xs text-slate-500">दायरा: 15 km</span>
            </div>
            <LeafletMap
              center={[28.5685, 77.2412]}
              zoom={13}
              pickups={nearbyPickups}
              height="280px"
            />
          </div>

          {/* Cards List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {nearbyPickups.length === 0 ? (
              <div className="col-span-2 bg-white rounded-2xl p-12 text-center text-slate-400">
                अभी कोई खुला कबाड़ अनुरोध नहीं है। थोड़ी देर में रिफ्रेश करें।
              </div>
            ) : (
              nearbyPickups.map((p) => {
                const totalEstWeight = p.items.reduce((a, b) => a + b.estWeightKg, 0);
                const estEarnings = Math.round(p.items.reduce((a, b) => a + b.estWeightKg * b.ratePerKg, 0));
                const itemsSummary = p.items.map(i => `${i.estWeightKg}kg ${i.category}`).join(', ');

                return (
                  <div
                    key={p.id}
                    className="bg-white rounded-2xl p-5 border-3 border-slate-200 hover:border-amber-400 shadow-md transition-all flex flex-col justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="bg-emerald-100 text-emerald-900 font-extrabold text-xs px-2.5 py-1 rounded-md">
                            {p.distanceKm || '2.4'} km दूर
                          </span>
                          <h3 className="font-black text-slate-900 text-lg mt-2 leading-snug">
                            {p.address}
                          </h3>
                        </div>
                        <VoiceAssistButton
                          text={`Scrap request at ${p.address}. Estimated items: ${itemsSummary}. Value: ${estEarnings} rupees.`}
                          hindiText={`${p.address} से कबाड़ अनुरोध। माल: ${itemsSummary}। अनुमानित कमाई: ${estEarnings} रुपये।`}
                        />
                      </div>

                      {/* Items Chips */}
                      <div className="mt-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <div className="text-xs font-bold text-slate-500 uppercase">कबाड़ सामग्री (Items)</div>
                        <div className="text-sm font-extrabold text-slate-800 mt-1">
                          {itemsSummary}
                        </div>
                        {p.notes && (
                          <div className="text-xs text-amber-700 mt-1 italic">
                            नोट: {p.notes}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-xs text-slate-400 block font-bold">अनुमानित कमाई</span>
                        <span className="text-2xl font-black text-emerald-600">₹{estEarnings}</span>
                      </div>

                      <button
                        onClick={() => handleAcceptPickup(p)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-base px-6 py-3 rounded-xl shadow-md transition-all flex items-center gap-2"
                      >
                        <span>स्वीकार करें (Accept)</span>
                        <ArrowRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 2: ACTIVE JOB (WEIGHING & COMPLETION) */}
      {activeTab === 'active' && (
        <div className="space-y-6">
          {completedSuccess && (
            <div className="bg-emerald-50 border-3 border-emerald-400 text-emerald-950 rounded-2xl p-6 text-center font-black text-lg shadow-lg flex items-center justify-center gap-3">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 animate-bounce" />
              <span>{completedSuccess}</span>
            </div>
          )}

          {activeJob ? (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border-3 border-emerald-500 shadow-xl space-y-6">
              {/* Job Header */}
              <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <span className="bg-emerald-600 text-white font-black text-xs px-3 py-1 rounded-full uppercase">
                    चालू पिकअप / Active Job In Progress
                  </span>
                  <h2 className="text-2xl font-black text-slate-900 mt-2">{activeJob.address}</h2>
                  <p className="text-sm text-slate-600 font-semibold mt-0.5">
                    नागरिक (Citizen): {activeJob.citizen?.name || 'Ramesh Sharma'} • {activeJob.citizen?.phone}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${activeJob.citizen?.phone || '9811100001'}`}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-3 rounded-xl shadow-md flex items-center gap-2 text-sm"
                  >
                    <Phone className="w-4 h-4" />
                    <span>कॉल करें / Call</span>
                  </a>
                  <VoiceAssistButton
                    text={`Active job at ${activeJob.address}. Enter actual weights using plus and minus buttons and click complete pickup.`}
                    hindiText={`${activeJob.address} पर काम चालू है। तराजू का वज़न देखकर प्लस और माइनस बटन से किलो सेट करें और काम पूरा करें।`}
                    size="lg"
                  />
                </div>
              </div>

              {/* Weight Steppers (Low Literacy Big +/- Buttons) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-black text-slate-900">कबाड़ का वज़न दर्ज करें (Actual Weights)</h3>
                    <p className="text-xs text-slate-500 font-bold">डिजिटल तराजू के अनुसार वज़न सेट करें:</p>
                  </div>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
                    पारदर्शी डिजिटल कांटा
                  </span>
                </div>

                <div className="space-y-3">
                  {activeJob.items.map((item, idx) => {
                    const currentWeight = itemWeights[item.category] || item.estWeightKg || 5;
                    const itemAmount = Math.round(currentWeight * item.ratePerKg);

                    return (
                      <div
                        key={idx}
                        className="bg-slate-50 rounded-2xl p-5 border-2 border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4"
                      >
                        <div className="w-full sm:w-1/3 text-center sm:text-left">
                          <span className="text-xs font-bold text-slate-400 uppercase">सामग्री (Category)</span>
                          <h4 className="text-xl font-black text-slate-900">{item.category}</h4>
                          <span className="text-xs font-bold text-emerald-600">दर: ₹{item.ratePerKg} / किलो</span>
                        </div>

                        {/* Large Stepper Controls */}
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => adjustWeight(item.category, -1)}
                            className="w-14 h-14 rounded-2xl bg-rose-100 hover:bg-rose-200 text-rose-800 font-black text-2xl flex items-center justify-center border-2 border-rose-300 shadow-sm active:scale-95"
                          >
                            <Minus className="w-6 h-6" />
                          </button>

                          <div className="bg-white border-3 border-slate-300 rounded-2xl px-6 py-2 text-center min-w-[120px]">
                            <div className="text-3xl font-black text-slate-900">{currentWeight}</div>
                            <div className="text-xs font-bold text-slate-500 uppercase">किलोग्राम (kg)</div>
                          </div>

                          <button
                            type="button"
                            onClick={() => adjustWeight(item.category, 1)}
                            className="w-14 h-14 rounded-2xl bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-black text-2xl flex items-center justify-center border-2 border-emerald-300 shadow-sm active:scale-95"
                          >
                            <Plus className="w-6 h-6" />
                          </button>
                        </div>

                        <div className="text-center sm:text-right w-full sm:w-auto">
                          <span className="text-xs font-bold text-slate-400 uppercase block">रकम (Amount)</span>
                          <span className="text-2xl font-black text-slate-900">₹{itemAmount}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Total Calculation & Complete Button */}
              <div className="bg-slate-900 text-white rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div>
                  <span className="text-xs text-slate-400 font-bold uppercase block">कुल भुगतान राशि (Total Payout)</span>
                  <div className="text-4xl font-black text-emerald-400">
                    ₹{Object.keys(itemWeights).reduce((acc, cat) => {
                      const item = activeJob.items.find(i => i.category === cat) || activeJob.items[0];
                      return acc + Math.round((itemWeights[cat] || 0) * (item?.ratePerKg || 15));
                    }, 0)}
                  </div>
                </div>

                <button
                  type="button"
                  disabled={completingJob}
                  onClick={handleCompletePickup}
                  className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-black text-lg px-8 py-4 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3"
                >
                  <CheckCircle2 className="w-6 h-6" />
                  <span>{completingJob ? 'भुगतान हो रहा है...' : 'काम पूरा करें व भुगतान प्राप्त करें'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm">
              <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-4 text-3xl">
                🚛
              </div>
              <h3 className="text-xl font-black text-slate-800">वर्तमान में कोई चालू काम नहीं है</h3>
              <p className="text-slate-500 text-sm mt-1 mb-6">
                'आस-पास कबाड़' टैब से नया कबाड़ स्वीकार करें।
              </p>
              <button
                onClick={() => setActiveTab('nearby')}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-sm px-6 py-3 rounded-xl shadow-md"
              >
                नये कबाड़ अनुरोध देखें
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: WALLET & TRANSACTIONS */}
      {activeTab === 'wallet' && (
        <div className="space-y-6">
          {/* Giant Balance Card */}
          <div className="bg-gradient-to-tr from-purple-900 to-indigo-900 text-white rounded-3xl p-8 shadow-xl border-4 border-purple-400 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div>
                <span className="bg-purple-800/80 text-purple-200 text-xs font-bold px-3 py-1 rounded-full uppercase">
                  कबाड़ीवाला डिजिटल बटुआ (Instant Bank Payout)
                </span>
                <div className="mt-3">
                  <span className="text-xs text-purple-200 font-bold uppercase block">उपलब्ध शेष राशि (Balance)</span>
                  <div className="text-5xl font-black text-white mt-1">₹{walletData.walletBalance}</div>
                </div>
                <p className="text-xs text-purple-200 mt-2">
                  दैनिक संकलित कमाई: ₹{walletData.totalEarned} • बैंक खाता: SBI A/c ***4829
                </p>
              </div>

              <div className="flex flex-col gap-2 w-full sm:w-auto">
                <button
                  onClick={() => alert('₹1,420 transferred instantly via UPI to linked SBI Account!')}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-base px-6 py-3.5 rounded-2xl shadow-lg transition-all"
                >
                  बैंक में निकालें (Withdraw to Bank)
                </button>
                <VoiceAssistButton
                  text={`Your current wallet balance is ${walletData.walletBalance} rupees. Tap withdraw button to transfer funds to your bank account.`}
                  hindiText={`आपका कुल बटुआ बैलेंस ${walletData.walletBalance} रुपये है। बैंक में पैसे भेजने के लिए हरा बटन दबाएं।`}
                />
              </div>
            </div>
          </div>

          {/* Recent Completed Ledger */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-black text-slate-900 text-lg">लेन-देन का विवरण (Transaction History)</h3>
            <div className="space-y-3">
              {walletData.transactions.length > 0 ? (
                walletData.transactions.map((tx: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                        ✓
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900">
                          कबाड़ खरीद: {tx.pickup?.citizen?.name || 'नागरिक'}
                        </div>
                        <div className="text-xs text-slate-500">
                          {new Date(tx.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-emerald-600 text-lg">+₹{tx.amount}</span>
                      <span className="text-[10px] text-slate-400 block font-bold">वॉलेट जमा</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-400 text-sm">
                  हाल ही में कोई लेन-देन नहीं हुआ।
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
