import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, Role } from '../types';
import { api } from '../lib/api';
import { storage, STORAGE_KEYS } from '../lib/storage';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { triggerHaptic } from '../lib/haptics';
import {
  MessageSquare,
  Send,
  Mic,
  MicOff,
  X,
  Radio,
  Clock,
  Volume2,
  CheckCheck,
  Building2,
  Truck,
  User,
  ArrowLeft,
  Sparkles,
  Phone,
  ShieldCheck,
  Play,
  Pause
} from 'lucide-react';

interface ChatDrawerProps {
  contextType: 'LOT' | 'PICKUP';
  contextId: string;
  title: string;
  partnerId?: string;
  partnerName: string;
  partnerRole?: Role | string;
  partnerPhone?: string;
  onClose: () => void;
  onBackToPartners?: () => void;
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

export const ChatDrawer: React.FC<ChatDrawerProps> = ({
  contextType,
  contextId,
  title,
  partnerId,
  partnerName,
  partnerRole,
  partnerPhone,
  onClose,
  onBackToPartners
}) => {
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [loading, setLoading] = useState(true);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Mark messages read on mount and whenever context/partner changes
  const markRead = async () => {
    try {
      await api.markChatRead(contextType, contextId, user?.id, partnerId);
    } catch {}
  };

  const loadMessages = async () => {
    try {
      const msgs = await api.getChatMessages(contextType, contextId, partnerId);
      setMessages(msgs || []);
    } catch (err) {
      console.warn('Load messages error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
    markRead();

    // Listen for storage events for reactive real-time updates
    const handleStorageChange = (e: any) => {
      if (e.detail?.key === STORAGE_KEYS.CHAT_MESSAGES || e.detail?.key === '*') {
        loadMessages();
      }
    };
    window.addEventListener('dhatu-storage-change', handleStorageChange);

    const poller = setInterval(loadMessages, 3500);
    return () => {
      clearInterval(poller);
      window.removeEventListener('dhatu-storage-change', handleStorageChange);
    };
  }, [contextType, contextId, partnerId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Voice recording timer
  useEffect(() => {
    if (isRecording) {
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordingSeconds(s => s + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  const handleSendMessage = async (textToSend?: string) => {
    const body = (textToSend || inputText).trim();
    if (!body) return;

    triggerHaptic(15);
    setInputText('');

    try {
      const newMsg = await api.sendChatMessage({
        contextType,
        contextId,
        contextTitle: title,
        senderId: user?.id,
        senderName: user?.name,
        senderRole: user?.role,
        receiverId: partnerId,
        receiverName: partnerName,
        receiverRole: partnerRole as string,
        text: body
      });
      setMessages(prev => [...prev, newMsg]);
      playChimeSound('send');
    } catch (err) {
      console.warn('Send message error:', err);
    }
  };

  const handleToggleVoiceRecord = () => {
    if (!isRecording) {
      setIsRecording(true);
      triggerHaptic(20);
    } else {
      setIsRecording(false);
      triggerHaptic(15);
      const voiceText = language === 'hi'
        ? '🎙️ [वॉइस संदेश: 0:04] "नमस्ते, मैं 10 मिनट में डिजिटल तराजू के साथ पहुँच रहा हूँ।"'
        : '🎙️ [Voice Note: 0:04s] "Namaste! Reaching your gate in approx 10 minutes with digital scale."';
      handleSendMessage(voiceText);
    }
  };

  // Contextual Smart Quick Replies based on user's role and context
  const getQuickReplies = () => {
    const role = (user?.role || '').toUpperCase();

    if (contextType === 'PICKUP') {
      if (role === 'CITIZEN') {
        return [
          language === 'hi' ? 'हाँ, कबाड़ नीचे तैयार है' : 'Yes, scrap is ready',
          language === 'hi' ? 'कृपया आने से पहले कॉल करें' : 'Please call before coming up',
          language === 'hi' ? 'क्या तराजू कैलिब्रेटेड है?' : 'Is your scale calibrated?',
          language === 'hi' ? 'लिफ्ट चालू है, 4th फ्लोर' : 'Lift working, 4th floor'
        ];
      } else {
        return [
          language === 'hi' ? 'रास्ते में हूँ, 10 मिनट में आगमन' : 'On my way, arriving in 10 mins',
          language === 'hi' ? 'डिजिटल तराजू साथ में है' : 'Carrying certified digital scale',
          language === 'hi' ? 'गेट पर पहुँच गया हूँ' : 'Reached building gate',
          language === 'hi' ? 'कृपया कबाड़ अलग रखें' : 'Please keep scrap accessible'
        ];
      }
    } else {
      // LOT context
      if (role === 'KABADIWALA' || role === 'COLLECTOR') {
        return [
          language === 'hi' ? '100% सॉर्टेड और सूखा माल है' : '100% sorted & dry material',
          language === 'hi' ? 'आज शाम 5 बजे तक डिस्पैच संभव' : 'Can dispatch today before 5 PM',
          language === 'hi' ? 'न्यूनतम स्वीकार्य दर ₹540/kg है' : 'Min acceptable rate is ₹540/kg',
          language === 'hi' ? 'वेब्रिज स्लॉट बुक करें' : 'Weighbridge slot booked'
        ];
      } else {
        return [
          language === 'hi' ? 'क्या पीसीबी सर्वर ग्रेड हैं?' : 'Are PCBs server grade?',
          language === 'hi' ? 'वेब्रिज स्लॉट यूनिट-II पर तैयार' : 'Weighbridge slot ready at Unit-II',
          language === 'hi' ? 'एस्क्रो द्वारा तुरंत भुगतान' : 'Instant Escrow payout confirmed',
          language === 'hi' ? 'आस्किंग रेट पर स्वीकार है' : 'Accepting at asking rate'
        ];
      }
    }
  };

  const quickReplies = getQuickReplies();

  const getRoleBadge = () => {
    const r = String(partnerRole || '').toUpperCase();
    if (r.includes('KABADIWALA') || r.includes('COLLECTOR')) {
      return (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 flex items-center gap-1">
          <Truck className="w-2.5 h-2.5" />
          <span>{t('portalCollector', 'Collector')}</span>
        </span>
      );
    }
    if (r.includes('RECYCLER')) {
      return (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950/70 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800/60 flex items-center gap-1">
          <Building2 className="w-2.5 h-2.5" />
          <span>{t('portalRecycler', 'Recycler')}</span>
        </span>
      );
    }
    return (
      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-1">
        <User className="w-2.5 h-2.5" />
        <span>{t('portalCitizen', 'Citizen')}</span>
      </span>
    );
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#131D31] w-full sm:max-w-lg h-full sm:h-[680px] rounded-none sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Header with Android Safe-Area Inset and Back Option */}
        <div
          className="px-4 py-3.5 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2"
          style={{
            paddingTop: 'var(--app-top-inset, env(safe-area-inset-top, 0.75rem))'
          }}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => {
                triggerHaptic(15);
                if (onBackToPartners) {
                  onBackToPartners();
                } else {
                  onClose();
                }
              }}
              className="p-1.5 sm:p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors shrink-0"
              title="Go Back"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold shrink-0 shadow-2xs">
              {partnerName.charAt(0)}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {partnerName}
                </h3>
                {getRoleBadge()}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[220px]">
                {title}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {partnerPhone && (
              <a
                href={`tel:${partnerPhone}`}
                className="p-2 rounded-full hover:bg-emerald-100 dark:hover:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 transition-colors"
                title={`Call ${partnerName}`}
              >
                <Phone className="w-4 h-4" />
              </a>
            )}

            <button
              onClick={() => {
                triggerHaptic(15);
                onClose();
              }}
              className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 transition-colors"
              title="Close chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-100/60 dark:bg-[#0c1322]">
          {loading ? (
            <div className="text-center py-12 text-xs text-slate-400">Loading conversation...</div>
          ) : messages.length === 0 ? (
            <div className="text-center py-16 space-y-2 text-slate-400">
              <MessageSquare className="w-10 h-10 mx-auto opacity-30" />
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                {language === 'hi' ? 'बातचीत शुरू करें' : 'Start the conversation'}
              </p>
              <p className="text-[11px] max-w-xs mx-auto">
                {language === 'hi'
                  ? 'पिकअप समय, वेब्रिज स्लॉट या वजन सत्यापन के बारे में संदेश भेजें।'
                  : 'Send a message or voice note to coordinate doorstep arrival, scrap sorting, or weighbridge intake.'}
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
                        {(msg.senderName || partnerName).charAt(0)}
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
                            onClick={() => {
                              triggerHaptic(10);
                              setPlayingVoiceId(playingVoiceId === msg.id ? null : msg.id);
                              playChimeSound('receive');
                            }}
                            className={`p-2 rounded-full ${
                              isMe ? 'bg-emerald-700 text-white' : 'bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            {playingVoiceId === msg.id ? (
                              <Pause className="w-3.5 h-3.5" />
                            ) : (
                              <Play className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <div className="min-w-0">
                            <p className="font-semibold">{msg.text}</p>
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
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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

        {/* Input Footer */}
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
                <span>Recording voice memo... Click Mic again to send.</span>
              </span>
              <span className="font-mono font-bold">0:0{recordingSeconds}</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder={language === 'hi' ? 'संदेश लिखें...' : language === 'mr' ? 'संदेश लिहा...' : 'Type a message...'}
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
    </div>
  );
};
