import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, ChatThreadSummary, Role } from '../../types';
import { storage, STORAGE_KEYS } from '../../lib/storage';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { triggerHaptic } from '../../lib/haptics';
import {
  ArrowLeft,
  MessageSquare,
  Search,
  Send,
  Mic,
  MicOff,
  Phone,
  Radio,
  CheckCheck,
  Truck,
  Layers,
  Sparkles,
  User as UserIcon,
  Clock,
  Play,
  Pause,
  Filter
} from 'lucide-react';

interface ChatsPageProps {
  onBack: () => void;
  initialContext?: {
    contextType: 'LOT' | 'PICKUP';
    contextId: string;
    partnerId?: string;
    title?: string;
  } | null;
}

// Synthetic chime audio using Web Audio API
function playChimeSound(type: 'send' | 'receive' = 'send') {
  if (typeof window === 'undefined' || (!window.AudioContext && !(window as any).webkitAudioContext)) return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';

    if (type === 'send') {
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } else {
      osc.frequency.setValueAtTime(440, ctx.currentTime); // A4
      osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.15); // E5
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    }
  } catch {}
}

export const ChatsPage: React.FC<ChatsPageProps> = ({
  onBack,
  initialContext
}) => {
  const { user } = useAuth();
  const { language, t } = useLanguage();

  const [threads, setThreads] = useState<ChatThreadSummary[]>([]);
  const [activeThread, setActiveThread] = useState<ChatThreadSummary | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'PICKUP' | 'LOT' | 'UNREAD'>('ALL');

  // Active chat stream state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const loadThreads = () => {
    if (!user) return;
    const all = storage.getAllChatThreads(user.id, user.role);
    setThreads(all);
    return all;
  };

  useEffect(() => {
    const loaded = loadThreads();
    if (initialContext && loaded) {
      const matched = loaded.find(
        th => th.contextType === initialContext.contextType &&
              th.contextId === initialContext.contextId &&
              (!initialContext.partnerId || th.partnerId === initialContext.partnerId)
      );
      if (matched) {
        setActiveThread(matched);
      } else {
        // Construct fallback active thread
        const newThread: ChatThreadSummary = {
          threadKey: `${initialContext.contextType}:${initialContext.contextId}:${initialContext.partnerId || 'partner'}`,
          contextType: initialContext.contextType,
          contextId: initialContext.contextId,
          contextTitle: initialContext.title || `${initialContext.contextType} #${initialContext.contextId}`,
          partnerId: initialContext.partnerId || 'partner-default',
          partnerName: initialContext.title?.split(' ')[0] || 'Partner',
          partnerRole: user?.role === 'CITIZEN' ? 'KABADIWALA' : 'CITIZEN',
          lastMessage: 'Tap to start conversation',
          lastMessageTime: new Date().toISOString(),
          unreadCount: 0
        };
        setActiveThread(newThread);
      }
    }
  }, [user, initialContext]);

  // Reactive listener for storage changes
  useEffect(() => {
    const handleStorageChange = (e: any) => {
      if (e.detail?.key === STORAGE_KEYS.CHAT_MESSAGES || e.detail?.key === '*') {
        loadThreads();
        if (activeThread) {
          loadActiveMessages(activeThread);
        }
      }
    };
    window.addEventListener('dhatu-storage-change', handleStorageChange);
    return () => window.removeEventListener('dhatu-storage-change', handleStorageChange);
  }, [user, activeThread]);

  const loadActiveMessages = async (thread: ChatThreadSummary) => {
    const msgs = storage.getChatMessages(thread.contextType, thread.contextId, thread.partnerId);
    setMessages(msgs);
    storage.markChatRead(thread.contextType, thread.contextId, user?.id, thread.partnerId);
    try {
      await api.markChatRead(thread.contextType, thread.contextId, user?.id, thread.partnerId);
    } catch {}
    loadThreads();
  };

  useEffect(() => {
    if (activeThread) {
      loadActiveMessages(activeThread);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [activeThread]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSelectThread = (thread: ChatThreadSummary) => {
    triggerHaptic(15);
    setActiveThread(thread);
  };

  const handleSendMessage = async (customText?: string) => {
    const content = customText || inputText.trim();
    if (!content || !activeThread || !user) return;

    triggerHaptic(20);
    playChimeSound('send');

    const newMsg = await api.sendChatMessage({
      senderId: user.id || `user-${user.role}`,
      senderName: user.name,
      senderRole: user.role,
      receiverId: activeThread.partnerId,
      receiverName: activeThread.partnerName,
      receiverRole: String(activeThread.partnerRole),
      contextType: activeThread.contextType,
      contextId: activeThread.contextId,
      contextTitle: activeThread.contextTitle,
      text: content
    });

    setInputText('');
    setMessages(prev => [...prev, newMsg]);
    loadThreads();

    // Contextual automated mock reply after 1.5s
    setTimeout(() => {
      let mockReply = '';
      if (content.toLowerCase().includes('scale') || content.toLowerCase().includes('वजन')) {
        mockReply = language === 'hi'
          ? 'नमस्ते! मेरा डिजिटल तराजू पूरी तरह से सीपीसीबी सत्यापित और रीसेट है।'
          : 'Understood! Digital scale is fully calibrated to 10g precision.';
      } else if (content.toLowerCase().includes('arrive') || content.toLowerCase().includes('पहुंच')) {
        mockReply = language === 'hi'
          ? 'जी, 5-7 मिनट में पहुंच रहा हूँ। कृपया सामग्री तैयार रखें।'
          : 'Yes, arriving in 5-7 minutes. Please keep the sorted scrap handy.';
      } else if (content.toLowerCase().includes('price') || content.toLowerCase().includes('रेट')) {
        mockReply = language === 'hi'
          ? 'आज का आधिकारिक डीएचएटीयू दर मान्य है। पारदर्शी वजन पर तत्काल भुगतान होगा।'
          : 'Official verified Dhatu exchange rates will be applied with zero deduction.';
      } else {
        mockReply = language === 'hi'
          ? 'संदेश प्राप्त हुआ। मैं शीघ्र ही अपडेट करता हूँ।'
          : 'Message acknowledged. Coordinating doorstep transfer now.';
      }

      const replyMsg = storage.sendChatMessage({
        senderId: activeThread.partnerId,
        senderName: activeThread.partnerName,
        senderRole: String(activeThread.partnerRole),
        receiverId: user.id,
        receiverName: user.name,
        receiverRole: user.role,
        contextType: activeThread.contextType,
        contextId: activeThread.contextId,
        contextTitle: activeThread.contextTitle,
        text: mockReply,
        isRead: false
      });

      playChimeSound('receive');
      triggerHaptic(30);
      setMessages(prev => [...prev, replyMsg]);
      loadThreads();
    }, 1500);
  };

  const handleToggleVoiceRecord = () => {
    triggerHaptic(25);
    if (isRecording) {
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
      if (recordingSeconds > 0) {
        const voiceText = `🎙️ Voice Note (${recordingSeconds}s)`;
        handleSendMessage(voiceText);
      }
      setRecordingSeconds(0);
    } else {
      setIsRecording(true);
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordingSeconds(s => {
          if (s >= 15) {
            clearInterval(timerRef.current!);
            setIsRecording(false);
            handleSendMessage('🎙️ Voice Note (15s)');
            return 0;
          }
          return s + 1;
        });
      }, 1000);
    }
  };

  const handlePlayVoice = (msgId: string) => {
    triggerHaptic(15);
    if (playingVoiceId === msgId) {
      setPlayingVoiceId(null);
    } else {
      setPlayingVoiceId(msgId);
      playChimeSound('receive');
      setTimeout(() => setPlayingVoiceId(null), 3000);
    }
  };

  const totalUnread = threads.reduce((acc, t) => acc + t.unreadCount, 0);

  const filteredThreads = threads.filter(th => {
    if (filterType === 'PICKUP' && th.contextType !== 'PICKUP') return false;
    if (filterType === 'LOT' && th.contextType !== 'LOT') return false;
    if (filterType === 'UNREAD' && th.unreadCount === 0) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        th.partnerName.toLowerCase().includes(q) ||
        th.contextTitle.toLowerCase().includes(q) ||
        th.lastMessage.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getRoleBadge = (role: Role | string) => {
    switch (role) {
      case 'CITIZEN':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
            {t('portalCitizen', 'Citizen')}
          </span>
        );
      case 'KABADIWALA':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
            {t('portalCollector', 'Collector')}
          </span>
        );
      case 'RECYCLER':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950/70 text-teal-900 dark:text-teal-300 border border-teal-200 dark:border-teal-800/60">
            {t('portalRecycler', 'Recycler')}
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            Partner
          </span>
        );
    }
  };

  const quickReplies =
    user?.role === 'CITIZEN'
      ? [
          language === 'hi' ? 'सामग्री तैयार है, आ जाइए' : 'Scrap is ready at door',
          language === 'hi' ? 'कृपया सटीक वजन दिखाएं' : 'Show digital scale tare',
          language === 'hi' ? 'यूपीआई भुगतान क्यूआर भेजें' : 'Ready for UPI payment',
          language === 'hi' ? 'सत्यापन ओटीपी भेज रहा हूँ' : 'Sharing verification OTP'
        ]
      : user?.role === 'KABADIWALA'
      ? [
          language === 'hi' ? '5 मिनट में दरवाजे पर' : 'Arriving in 5 minutes',
          language === 'hi' ? 'वजन शून्य कैलिब्रेटेड है' : 'Scale zero calibrated',
          language === 'hi' ? 'तत्काल यूपीआई भुगतान प्रेषित' : 'Sent instant UPI transfer',
          language === 'hi' ? 'कृपया ओटीपी बताएं' : 'Please provide 4-digit OTP'
        ]
      : [
          'Gate pass verified for weighbridge',
          'Moisture deduction zero verified',
          'Escrow payout released',
          'Dispatch truck scheduled'
        ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B1120] text-slate-900 dark:text-slate-100 font-body transition-colors duration-200 flex flex-col">
      {/* VIEW 1: THREAD LIST (When no thread is active) */}
      {!activeThread ? (
        <>
          {/* Top Sticky App Bar with Android Safe-Area Inset */}
          <header
            className="sticky top-0 z-40 bg-white/98 dark:bg-[#131D31]/98 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 shadow-sm w-full"
            style={{
              paddingTop: 'var(--app-top-inset, env(safe-area-inset-top, 0px))'
            }}
          >
            <div className="max-w-3xl mx-auto px-3 sm:px-6 h-16 sm:h-18 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic(15);
                    onBack();
                  }}
                  className="p-2 sm:p-2.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-all active:scale-95 shadow-2xs shrink-0"
                  title={t('backBtn', 'Go Back')}
                  aria-label="Back"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h1 className="font-display font-black text-base sm:text-lg text-slate-900 dark:text-white truncate">
                      {language === 'hi' ? 'बातचीत एवं संदेश' : language === 'mr' ? 'संभाषण व संदेश' : 'Chats & Messages'}
                    </h1>
                    {totalUnread > 0 && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/40 shrink-0">
                        {totalUnread} {t('unread', 'unread')}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {language === 'hi'
                      ? 'पिकअप और लॉट भागीदारों के साथ सीधा संपर्क'
                      : 'Real-time contextual chats on pickups & lots'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Search Input Bar */}
            <div className="px-3 sm:px-6 pb-2.5 max-w-3xl mx-auto w-full">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={
                    language === 'hi'
                      ? 'भागीदार या पिकअप आईडी खोजें...'
                      : 'Search conversations by partner or ID...'
                  }
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-100/80 dark:bg-slate-800/80 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all"
                />
              </div>
            </div>

            {/* Filter Navigation Chips */}
            <div className="border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/40">
              <div className="max-w-3xl mx-auto px-3 sm:px-6 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic(10);
                    setFilterType('ALL');
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
                    filterType === 'ALL'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {t('all', 'All')} ({threads.length})
                </button>

                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic(10);
                    setFilterType('UNREAD');
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                    filterType === 'UNREAD'
                      ? 'bg-rose-600 text-white shadow-2xs'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>{t('unread', 'Unread')}</span>
                  {totalUnread > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        filterType === 'UNREAD'
                          ? 'bg-white/30 text-white'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      }`}
                    >
                      {totalUnread}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic(10);
                    setFilterType('PICKUP');
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
                    filterType === 'PICKUP'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {language === 'hi' ? 'घर-घर पिकअप' : 'Pickups'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic(10);
                    setFilterType('LOT');
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
                    filterType === 'LOT'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {language === 'hi' ? 'थोक लॉट व बोलियां' : 'Lots & Auctions'}
                </button>
              </div>
            </div>
          </header>

          {/* Conversation Threads Stream */}
          <main className="flex-1 max-w-3xl mx-auto w-full px-3 sm:px-6 py-4 pb-[max(2rem,env(safe-area-inset-bottom,2rem))] space-y-2.5">
            {filteredThreads.length === 0 ? (
              <div className="text-center py-20 px-4 space-y-3">
                <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800/80 text-slate-400 mx-auto flex items-center justify-center">
                  <MessageSquare className="w-8 h-8 opacity-40" />
                </div>
                <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300">
                  {searchQuery
                    ? language === 'hi'
                      ? 'कोई बातचीत नहीं मिली'
                      : 'No conversations match your search'
                    : language === 'hi'
                    ? 'कोई सक्रिय बातचीत नहीं है'
                    : 'No conversations yet'}
                </h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  {language === 'hi'
                    ? 'जब आप किसी पिकअप या लॉट पर संदेश भेजेंगे, तो वह यहाँ दिखाई देगा।'
                    : 'Start a chat from any active pickup or lot card to coordinate arrival, weighing, or dispatch.'}
                </p>
              </div>
            ) : (
              filteredThreads.map(th => (
                <div
                  key={th.threadKey}
                  onClick={() => handleSelectThread(th)}
                  className={`p-3.5 sm:p-4 rounded-3xl border transition-all cursor-pointer group shadow-2xs hover:shadow-md ${
                    th.unreadCount > 0
                      ? 'bg-white dark:bg-[#131D31] border-emerald-300/80 dark:border-emerald-800/60 ring-1 ring-emerald-500/10'
                      : 'bg-white/75 dark:bg-[#131D31]/75 border-slate-200/80 dark:border-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    {/* Avatar with Role Initial & Online Dot */}
                    <div className="relative shrink-0">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center font-display font-black text-base shadow-2xs">
                        {th.partnerName.charAt(0)}
                      </div>
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-[#131D31]"></span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                            {th.partnerName}
                          </h4>
                          {getRoleBadge(th.partnerRole)}
                        </div>

                        <span className="text-[10px] font-mono text-slate-400 shrink-0">
                          {new Date(th.lastMessageTime).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {th.contextType === 'PICKUP' ? (
                          <Truck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        ) : (
                          <Layers className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        )}
                        <span className="truncate">{th.contextTitle}</span>
                      </div>

                      <div className="flex items-center justify-between gap-2 mt-1.5">
                        <p className="text-xs text-slate-600 dark:text-slate-300 truncate max-w-[85%]">
                          {th.lastMessage}
                        </p>

                        {th.unreadCount > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-extrabold shadow-2xs shrink-0">
                            {th.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </main>
        </>
      ) : (
        /* VIEW 2: ACTIVE DEDICATED CONVERSATION SCREEN */
        <div className="flex-1 flex flex-col h-screen max-h-screen bg-white dark:bg-[#131D31]">
          {/* Active Conversation Sticky Header with Back Option */}
          <header
            className="sticky top-0 z-40 bg-white/98 dark:bg-[#131D31]/98 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 shadow-sm w-full"
            style={{
              paddingTop: 'var(--app-top-inset, env(safe-area-inset-top, 0px))'
            }}
          >
            <div className="max-w-3xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic(15);
                    setActiveThread(null);
                  }}
                  className="p-2 sm:p-2.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-all active:scale-95 shadow-2xs shrink-0"
                  title="Back to all conversations"
                  aria-label="Back to conversations"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center font-display font-black text-sm shrink-0 shadow-2xs">
                  {activeThread.partnerName.charAt(0)}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h2 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                      {activeThread.partnerName}
                    </h2>
                    {getRoleBadge(activeThread.partnerRole)}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[200px] sm:max-w-md">
                    {activeThread.contextTitle}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {activeThread.partnerPhone && (
                  <a
                    href={`tel:${activeThread.partnerPhone}`}
                    className="p-2.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 border border-emerald-200/80 dark:border-emerald-800/60 transition-colors shadow-2xs"
                    title={`Call ${activeThread.partnerName}`}
                  >
                    <Phone className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          </header>

          {/* Message Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-100/60 dark:bg-[#0c1322]">
            {messages.length === 0 ? (
              <div className="text-center py-16 space-y-2 text-slate-400">
                <MessageSquare className="w-10 h-10 mx-auto opacity-30" />
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {language === 'hi' ? 'बातचीत शुरू करें' : 'Start the conversation'}
                </p>
                <p className="text-[11px] max-w-xs mx-auto">
                  {language === 'hi'
                    ? 'पिकअप समय, वजन सत्यापन या मार्गदर्शक के बारे में संदेश भेजें।'
                    : 'Coordinate doorstep arrival, scrap sorting, digital scales or payments directly.'}
                </p>
              </div>
            ) : (
              messages.map(msg => {
                const isMe = user?.id ? msg.senderId === user.id : msg.senderRole === user?.role;
                const isVoice = msg.text?.includes('🎙️') || !!msg.audioUrl;

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-fade-in`}
                  >
                    <div className="flex items-end gap-1.5 max-w-[85%]">
                      {!isMe && (
                        <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold flex items-center justify-center shrink-0 mb-1">
                          {(msg.senderName || activeThread.partnerName).charAt(0)}
                        </div>
                      )}

                      <div
                        className={`rounded-2xl px-4 py-2.5 text-xs shadow-2xs ${
                          isMe
                            ? 'bg-emerald-600 text-white rounded-br-xs'
                            : 'bg-white dark:bg-[#151f32] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-bl-xs'
                        }`}
                      >
                        {isVoice ? (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handlePlayVoice(msg.id)}
                              className={`p-1.5 rounded-full ${
                                isMe ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-700'
                              }`}
                            >
                              {playingVoiceId === msg.id ? (
                                <Pause className="w-3.5 h-3.5" />
                              ) : (
                                <Play className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <div className="text-[11px] font-medium">
                              <div>{msg.text}</div>
                              {playingVoiceId === msg.id && (
                                <div className="flex items-center gap-1 mt-1">
                                  <span className="h-2 w-1 bg-emerald-400 animate-pulse"></span>
                                  <span className="h-3 w-1 bg-emerald-400 animate-pulse delay-75"></span>
                                  <span className="h-4 w-1 bg-emerald-400 animate-pulse delay-150"></span>
                                  <span className="h-2 w-1 bg-emerald-400 animate-pulse"></span>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                        )}
                      </div>
                    </div>

                    <span className="text-[10px] text-slate-400 mt-1 px-2 flex items-center gap-1">
                      <span>
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      {isMe && <CheckCheck className="w-3.5 h-3.5 text-emerald-500 stroke-[2.5]" />}
                    </span>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestion Chips */}
          <div className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 shrink-0 mr-1">
              <Sparkles className="w-3 h-3" />
              <span>{t('quickReplies', 'Quick')}:</span>
            </div>
            {quickReplies.map((reply, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(reply)}
                className="px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-300 text-[11px] font-medium whitespace-nowrap transition-colors shadow-2xs active:scale-95"
              >
                {reply}
              </button>
            ))}
          </div>

          {/* Message Input Footer with Safe-Area Inset */}
          <div
            className="p-3 bg-white dark:bg-[#131D31] border-t border-slate-200 dark:border-slate-800"
            style={{
              paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0.75rem))'
            }}
          >
            {isRecording && (
              <div className="mb-2 p-2.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 text-xs flex items-center justify-between animate-pulse">
                <span className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-rose-600 animate-spin" />
                  <span>Recording voice memo... Tap mic to send</span>
                </span>
                <span className="font-mono font-bold">0:0{recordingSeconds}</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder={
                  language === 'hi'
                    ? 'संदेश लिखें...'
                    : language === 'mr'
                    ? 'संदेश लिहा...'
                    : 'Type a message...'
                }
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleSendMessage();
                }}
                className="flex-1 px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all"
              />

              <button
                type="button"
                onClick={handleToggleVoiceRecord}
                className={`p-2.5 rounded-2xl border transition-all ${
                  isRecording
                    ? 'bg-rose-600 text-white border-rose-600 animate-pulse'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
                title={isRecording ? 'Stop & Send Voice Note' : 'Record Voice Note'}
              >
                {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={!inputText.trim()}
                className="p-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white shadow-sm transition-all active:scale-95"
                title="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatsPage;
