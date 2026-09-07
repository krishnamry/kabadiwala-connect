import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { Pickup, ScrapRate, MLClassificationResult } from '../../types';
import { LeafletMap } from '../../components/LeafletMap';
import { Plus, Trash2, Calendar, MapPin, Camera, Sparkles, CheckCircle2, Clock, AlertCircle, Phone, ArrowRight, RefreshCw, DollarSign, Info } from 'lucide-react';

export const CitizenDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'pickups' | 'new' | 'rates'>('pickups');
  const [pickups, setPickups] = useState<Pickup[]>([]);
  const [rates, setRates] = useState<ScrapRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPickup, setSelectedPickup] = useState<Pickup | null>(null);

  // New Pickup Form state
  const [address, setAddress] = useState('Block D, Flat 402, Lajpat Nagar II, New Delhi');
  const [latitude, setLatitude] = useState(28.5700);
  const [longitude, setLongitude] = useState(77.2400);
  const [scheduledAt, setScheduledAt] = useState(() => {
    const d = new Date();
    d.setHours(d.getHours() + 3);
    return d.toISOString().slice(0, 16);
  });
  const [notes, setNotes] = useState('Ring bell #402. Scrap is neatly bagged in balcony.');
  const [items, setItems] = useState<Array<{ category: string; estWeightKg: number; ratePerKg: number; imageUrl?: string }>>([
    { category: 'Plastic', estWeightKg: 8.0, ratePerKg: 18.0 },
    { category: 'Paper', estWeightKg: 12.0, ratePerKg: 14.0 }
  ]);

  // ML Image scan state
  const [classifying, setClassifying] = useState(false);
  const [mlResult, setMlResult] = useState<MLClassificationResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [pickupsData, ratesData] = await Promise.all([
        api.getMyPickups().catch(() => []),
        api.getRates().catch(() => [])
      ]);
      setPickups(pickupsData);
      setRates(ratesData);
      if (pickupsData.length > 0 && !selectedPickup) {
        setSelectedPickup(pickupsData[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddItem = () => {
    const defaultRate = rates.find(r => r.category === 'Plastic')?.ratePerKg || 18;
    setItems([...items, { category: 'Plastic', estWeightKg: 5, ratePerKg: defaultRate }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleCategoryChange = (index: number, newCategory: string) => {
    const rate = rates.find(r => r.category === newCategory)?.ratePerKg || 15;
    const updated = [...items];
    updated[index] = { ...updated[index], category: newCategory, ratePerKg: rate };
    setItems(updated);
  };

  const handleWeightChange = (index: number, weight: number) => {
    const updated = [...items];
    updated[index] = { ...updated[index], estWeightKg: Math.max(0.5, weight) };
    setItems(updated);
  };

  // Image ML Classification
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setClassifying(true);
    setMlResult(null);
    try {
      const result = await api.classifyScrapImage(file);
      setMlResult(result);

      // Add to items list if not already present, or replace
      const matchingRate = rates.find(r => r.category.toLowerCase() === result.category.toLowerCase());
      const rateVal = matchingRate ? matchingRate.ratePerKg : result.estRate;

      setItems(prev => [
        ...prev,
        {
          category: result.category,
          estWeightKg: 5.0,
          ratePerKg: rateVal
        }
      ]);
    } catch (err: any) {
      alert('AI Classification failed: ' + (err.message || 'Unknown error'));
    } finally {
      setClassifying(false);
    }
  };

  const calculateEstTotal = () => {
    return items.reduce((acc, item) => acc + (item.estWeightKg * item.ratePerKg), 0);
  };

  const handleSubmitPickup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      alert('Please add at least one scrap item.');
      return;
    }

    setSubmitting(true);
    try {
      const newPickup = await api.createPickup({
        address,
        latitude,
        longitude,
        scheduledAt,
        notes,
        items
      });
      setSuccessMessage('Pickup scheduled successfully! A verified collector will accept shortly.');
      await loadData();
      setSelectedPickup(newPickup);
      setTimeout(() => {
        setSuccessMessage('');
        setActiveTab('pickups');
      }, 1500);
    } catch (err: any) {
      alert('Failed to schedule pickup: ' + (err.message || 'Server error'));
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'REQUESTED':
        return <span className="bg-amber-50 text-amber-700 border border-amber-200 text-xs px-2.5 py-1 rounded-full font-semibold flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Requested</span>;
      case 'ACCEPTED':
        return <span className="bg-blue-50 text-blue-700 border border-blue-200 text-xs px-2.5 py-1 rounded-full font-semibold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Collector Assigned</span>;
      case 'IN_PROGRESS':
        return <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs px-2.5 py-1 rounded-full font-semibold flex items-center gap-1"><RefreshCw className="w-3.5 h-3.5 animate-spin" /> In Progress</span>;
      case 'COMPLETED':
        return <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs px-2.5 py-1 rounded-full font-semibold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Completed & Paid</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 text-xs px-2.5 py-1 rounded-full font-semibold">{status}</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Citizen Welcome Header */}
      <div className="bg-gradient-to-r from-emerald-700 to-teal-700 rounded-3xl p-6 sm:p-8 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
            Citizen Scrap Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-2">Welcome, {user?.name || 'Ramesh'}</h1>
          <p className="text-emerald-100 text-sm mt-1">
            Turn your dry household recyclables into cash. Transparent rates, verified collectors & zero landfill footprint.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setActiveTab('new')}
            className="bg-white text-emerald-800 hover:bg-emerald-50 font-bold text-sm px-5 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule New Pickup</span>
          </button>
          <button
            onClick={() => { setActiveTab('pickups'); loadData(); }}
            className="bg-emerald-600/60 hover:bg-emerald-600 text-white font-semibold text-sm px-4 py-2.5 rounded-xl border border-white/20 transition-all flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('pickups')}
          className={`py-3 px-5 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'pickups'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <span>My Pickups</span>
          <span className="bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded-full font-bold">
            {pickups.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('new')}
          className={`py-3 px-5 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'new'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>New Request</span>
        </button>

        <button
          onClick={() => setActiveTab('rates')}
          className={`py-3 px-5 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'rates'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Live Rate Card</span>
        </button>
      </div>

      {/* TAB 1: MY PICKUPS */}
      {activeTab === 'pickups' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pickup List */}
          <div className="lg:col-span-2 space-y-4">
            {loading ? (
              <div className="bg-white rounded-2xl p-12 text-center text-slate-400">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-600 mb-3" />
                <p>Loading your pickup requests...</p>
              </div>
            ) : pickups.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
                <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-slate-800 text-lg">No Pickups Yet</h3>
                <p className="text-slate-500 text-sm mt-1 mb-6">Schedule your first doorstep scrap pickup and earn fair value.</p>
                <button
                  onClick={() => setActiveTab('new')}
                  className="bg-emerald-600 text-white text-sm font-bold px-6 py-2.5 rounded-xl shadow-md"
                >
                  Schedule Pickup
                </button>
              </div>
            ) : (
              pickups.map(p => {
                const isSelected = selectedPickup?.id === p.id;
                const totalWeight = p.items.reduce((a, b) => a + (b.actualWeightKg || b.estWeightKg), 0);
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPickup(p)}
                    className={`cursor-pointer bg-white rounded-2xl p-5 border-2 transition-all ${
                      isSelected ? 'border-emerald-500 shadow-md ring-2 ring-emerald-500/10' : 'border-slate-100 hover:border-slate-300 shadow-sm'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900 text-base">{p.address}</h4>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{new Date(p.scheduledAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                        </div>
                      </div>
                      <div>{getStatusBadge(p.status)}</div>
                    </div>

                    {/* Items chips */}
                    <div className="mt-4 flex flex-wrap gap-2">
                      {p.items.map((item, idx) => (
                        <span key={idx} className="bg-slate-100 text-slate-700 text-xs px-2.5 py-1 rounded-lg font-medium">
                          {item.category}: {item.actualWeightKg ? `${item.actualWeightKg}kg (verified)` : `~${item.estWeightKg}kg`} @ ₹{item.ratePerKg}/kg
                        </span>
                      ))}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span>Total: ~{totalWeight} kg</span>
                      <span className="font-bold text-slate-800 text-sm">
                        {p.totalAmount ? `Paid: ₹${p.totalAmount}` : `Est: ₹${Math.round(p.items.reduce((a, b) => a + b.estWeightKg * b.ratePerKg, 0))}`}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Details & Map Drawer */}
          <div className="space-y-6">
            {selectedPickup ? (
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase">Pickup Details</span>
                    {getStatusBadge(selectedPickup.status)}
                  </div>
                  <h3 className="font-bold text-slate-900 text-lg mt-1">{selectedPickup.address}</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Scheduled for: {new Date(selectedPickup.scheduledAt).toLocaleString()}
                  </p>
                </div>

                {/* Assigned Collector Info */}
                {selectedPickup.kabadiwala ? (
                  <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold">
                        {selectedPickup.kabadiwala.name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-bold text-emerald-950 flex items-center gap-1">
                          {selectedPickup.kabadiwala.name}
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div className="text-xs text-emerald-700">
                          Verified Collector • ★ {selectedPickup.kabadiwala.kabadiwala?.reputationScore || 4.8}
                        </div>
                      </div>
                      <a
                        href={`tel:${selectedPickup.kabadiwala.phone}`}
                        className="bg-emerald-600 text-white p-2 rounded-xl hover:bg-emerald-700 shadow-sm"
                        title="Call Collector"
                      >
                        <Phone className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
                    <Clock className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong>Awaiting Collector:</strong> Your request has been broadcasted to verified kabadiwalas in your sector.
                    </div>
                  </div>
                )}

                {/* Location Map View */}
                <div>
                  <div className="text-xs font-bold text-slate-600 mb-2">Location Map</div>
                  <LeafletMap
                    center={[selectedPickup.latitude, selectedPickup.longitude]}
                    zoom={14}
                    pickups={[selectedPickup]}
                    height="200px"
                  />
                </div>

                {/* Scrap Items breakdown */}
                <div>
                  <div className="text-xs font-bold text-slate-600 mb-2">Scrap Items & Rates</div>
                  <div className="space-y-2">
                    {selectedPickup.items.map((item, i) => (
                      <div key={i} className="flex justify-between items-center text-sm p-2.5 rounded-lg bg-slate-50">
                        <div>
                          <span className="font-semibold text-slate-800">{item.category}</span>
                          <span className="text-xs text-slate-500 block">₹{item.ratePerKg} / kg</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-slate-900">
                            {item.actualWeightKg ? `${item.actualWeightKg} kg` : `~${item.estWeightKg} kg`}
                          </span>
                          <span className="text-xs text-emerald-600 block font-semibold">
                            ₹{Math.round((item.actualWeightKg || item.estWeightKg) * item.ratePerKg)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total Payout */}
                <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                  <div>
                    <span className="text-xs text-slate-500 block">
                      {selectedPickup.status === 'COMPLETED' ? 'Total Payout Received' : 'Estimated Payout'}
                    </span>
                    <span className="text-2xl font-black text-slate-900">
                      ₹{selectedPickup.totalAmount || Math.round(selectedPickup.items.reduce((a, b) => a + b.estWeightKg * b.ratePerKg, 0))}
                    </span>
                  </div>
                  {selectedPickup.status === 'COMPLETED' && (
                    <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1.5 rounded-xl border border-emerald-300">
                      Paid via Digital Wallet
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-8 text-center text-slate-400 border border-slate-200">
                Select a pickup from the list to view its details and location.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: SCHEDULE NEW PICKUP */}
      {activeTab === 'new' && (
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm max-w-4xl mx-auto">
          {successMessage && (
            <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-4 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span className="font-semibold text-sm">{successMessage}</span>
            </div>
          )}

          <div className="mb-8">
            <h2 className="text-2xl font-black text-slate-900">Schedule Doorstep Scrap Pickup</h2>
            <p className="text-slate-500 text-sm mt-1">
              Add scrap items manually or use the AI scrap scanner to identify categories from a photo.
            </p>
          </div>

          <form onSubmit={handleSubmitPickup} className="space-y-8">
            {/* AI Image Scan feature (Agent 5 Brief) */}
            <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 rounded-2xl p-5 border border-emerald-200">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-emerald-600" />
                    <h4 className="font-bold text-emerald-950 text-base">AI Scrap Scanner</h4>
                    <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">FastAPI ML</span>
                  </div>
                  <p className="text-xs text-emerald-800 mt-1 max-w-lg">
                    Not sure what scrap type you have? Take or upload a photo of your scrap pile for instant auto-classification and market rate quotes.
                  </p>
                </div>

                <label className="cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm transition-all flex items-center gap-2 flex-shrink-0">
                  <Camera className="w-4 h-4" />
                  <span>{classifying ? 'Scanning Photo...' : 'Scan Scrap Photo'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={classifying}
                    className="hidden"
                  />
                </label>
              </div>

              {/* ML Result display */}
              {mlResult && (
                <div className="mt-4 bg-white rounded-xl p-4 border border-emerald-300 shadow-sm flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold flex-shrink-0">
                    AI
                  </div>
                  <div className="flex-1 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-sm">
                        Detected: <span className="text-emerald-700">{mlResult.category}</span>
                      </span>
                      <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[11px]">
                        {Math.round(mlResult.confidence * 100)}% Confidence
                      </span>
                    </div>
                    <p className="text-slate-600">Rate: ₹{mlResult.estRate}/kg • {mlResult.advice}</p>
                    <p className="text-emerald-600 font-semibold">✓ Automatically added to your scrap item list below!</p>
                  </div>
                </div>
              )}
            </div>

            {/* Scrap Items Table */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-bold text-slate-800">Scrap Items & Estimated Quantities</label>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Another Item</span>
                </button>
              </div>

              <div className="space-y-3">
                {items.map((item, idx) => (
                  <div key={idx} className="flex flex-wrap sm:flex-nowrap items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="w-full sm:w-1/3">
                      <label className="text-[11px] font-semibold text-slate-500 block mb-1">Category</label>
                      <select
                        value={item.category}
                        onChange={(e) => handleCategoryChange(idx, e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500"
                      >
                        {rates.length > 0 ? (
                          rates.map(r => (
                            <option key={r.id} value={r.category}>
                              {r.category} (₹{r.ratePerKg}/kg)
                            </option>
                          ))
                        ) : (
                          <>
                            <option value="Plastic">Plastic (₹18/kg)</option>
                            <option value="Paper">Paper / Cardboard (₹14/kg)</option>
                            <option value="Metal">Metal (₹36/kg)</option>
                            <option value="E-waste">E-waste (₹55/kg)</option>
                            <option value="Glass">Glass (₹5/kg)</option>
                            <option value="Organic">Organic (₹3/kg)</option>
                          </>
                        )}
                      </select>
                    </div>

                    <div className="w-1/2 sm:w-1/4">
                      <label className="text-[11px] font-semibold text-slate-500 block mb-1">Est. Weight (kg)</label>
                      <input
                        type="number"
                        min="0.5"
                        step="0.5"
                        value={item.estWeightKg}
                        onChange={(e) => handleWeightChange(idx, parseFloat(e.target.value) || 1)}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="w-1/3 sm:w-1/4">
                      <label className="text-[11px] font-semibold text-slate-500 block mb-1">Est. Value</label>
                      <div className="p-2 text-xs font-bold text-emerald-700 bg-emerald-50 rounded-lg border border-emerald-200">
                        ₹{Math.round(item.estWeightKg * item.ratePerKg)}
                      </div>
                    </div>

                    <div className="sm:pt-5">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        disabled={items.length <= 1}
                        className="text-slate-400 hover:text-rose-600 disabled:opacity-30 p-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total Estimated Value Box */}
              <div className="mt-4 p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between">
                <div>
                  <span className="text-xs text-emerald-800 font-semibold">Total Estimated Scrap Earnings</span>
                  <p className="text-2xl font-black text-emerald-950">₹{Math.round(calculateEstTotal())}</p>
                </div>
                <div className="text-right text-xs text-emerald-700">
                  <span>Actual payout will be calculated on digital scale weighing during pickup.</span>
                </div>
              </div>
            </div>

            {/* Address & Leaflet Map Pin */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span>Pickup Address & Map Location</span>
              </label>

              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter complete street address, flat number, society name"
                className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500"
              />

              <p className="text-xs text-slate-500">
                Drag the map marker or click anywhere on the map to pin your exact pickup gate for the collector:
              </p>

              <LeafletMap
                center={[latitude, longitude]}
                zoom={14}
                selectableLocation={true}
                pinLocation={[latitude, longitude]}
                onLocationSelect={(lat, lng) => {
                  setLatitude(lat);
                  setLongitude(lng);
                }}
                height="240px"
              />
            </div>

            {/* Scheduling & Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Preferred Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Notes for Collector (Optional)</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Call before coming, gate passcode"
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-base py-3.5 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <Calendar className="w-5 h-5" />
              <span>{submitting ? 'Broadcasting Request...' : 'Confirm & Schedule Pickup'}</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: LIVE RATE CARD */}
      {activeTab === 'rates' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-900">Delhi-NCR Live Scrap Market Index</h2>
              <p className="text-xs text-slate-500 mt-1">
                Updated daily based on real recycling factory gate rates and CPCB EPR credits.
              </p>
            </div>
            <div className="text-xs bg-emerald-50 text-emerald-800 font-bold px-3 py-1.5 rounded-full border border-emerald-200">
              Verified Transparent Pricing
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {rates.map((rate) => (
              <div key={rate.id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                {rate.badge && (
                  <span className="absolute top-4 right-4 bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {rate.badge}
                  </span>
                )}
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-lg mb-4">
                  ♻️
                </div>
                <h3 className="text-lg font-bold text-slate-900">{rate.category}</h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl font-black text-emerald-600">₹{rate.ratePerKg}</span>
                  <span className="text-xs font-semibold text-slate-400">/ {rate.unit}</span>
                </div>
                <p className="text-xs text-slate-500 mt-3 leading-relaxed">
                  {rate.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
