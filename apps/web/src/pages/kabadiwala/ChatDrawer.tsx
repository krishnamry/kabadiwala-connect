import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '../../types';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { triggerHaptic } from '../../lib/haptics';
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
  UserCheck
} from 'lucide-react';

interface ChatDrawerProps {
  contextType: 'LOT' | 'PICKUP';
  contextId: string;
  title: string;
  partnerName: string;
  partnerRole?: string;
  onClose: () => void;
}

// Synthetic chime audio using Web Audio API to prevent external asset dependency
function playChimeSound() {
  if (typeof window === 'undefined' || !window.AudioContext && !(window as any).webkitAudioContext) return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch {}
}

export const ChatDrawer: React.FC<ChatDrawerProps> = ({
  contextType,
  contextId,
  title,
  partnerName,
  partnerRole,
  onClose
}) => {
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    try {
      const msgs = await api.getChatMessages(contextType, contextId);
      setMessages(msgs || []);
    } catch (err) {
      console.warn('Load messages error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
    const poller = setInterval(loadMessages, 3500);
    return () => clearInterval(poller);
  }, [contextType, contextId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (textToSend?: string) => {
    const body = (textToSend || inputText).trim();
    if (!body) return;

    triggerHaptic();
    setInputText('');

    try {
      const newMsg = await api.sendChatMessage({
        contextType,
        contextId,
        text: body
      });
      setMessages(prev => [...prev, newMsg]);
      playChimeSound();
    } catch (err) {
      console.warn('Send message error:', err);
    }
  };

  const handleToggleVoiceRecord = () => {
    if (!isRecording) {
      setIsRecording(true);
      triggerHaptic();
      setTimeout(() => {
        setIsRecording(false);
        handleSendMessage('🎙️ [Voice Note: 0:04s] "Haanji bhaiya, I will reach with load in 20 mins."');
      }, 2500);
    } else {
      setIsRecording(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div
        className="bg-white dark:bg-[#151f32] w-full sm:max-w-lg h-[85vh] sm:h-[650px] rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {partnerName}
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  {partnerRole || 'Participant'}
                </span>
              </div>
              <p className="text-xs text-slate-500 truncate max-w-xs">{title}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-100/50 dark:bg-[#0f172a]/50">
          {loading ? (
            <div className="text-center py-10 text-xs text-slate-400">Loading conversation...</div>
          ) : messages.length === 0 ? (
            <div className="text-center py-16 space-y-2 text-slate-400">
              <MessageSquare className="w-8 h-8 mx-auto opacity-40" />
              <p className="text-xs">No messages yet. Send a message or voice note to coordinate pickup/weighbridge arrival.</p>
            </div>
          ) : (
            messages.map(msg => {
              const isMe = msg.senderId === user?.id || msg.senderRole === 'COLLECTOR';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs shadow-2xs ${
                      isMe
                        ? 'bg-emerald-600 text-white rounded-br-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-bl-xs'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5 px-1 flex items-center gap-1">
                    <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {isMe && <CheckCheck className="w-3 h-3 text-emerald-500" />}
                  </span>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Footer */}
        <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
          {isRecording && (
            <div className="mb-2 p-2 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs flex items-center justify-between animate-pulse">
              <span className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-rose-600 animate-spin" />
                <span>Recording voice note... Release to send.</span>
              </span>
              <span className="font-mono font-bold">0:03</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder={language === 'hi' ? 'संदेश लिखें...' : 'Type a message...'}
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleSendMessage();
              }}
              className="flex-1 px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/40"
            />

            <button
              type="button"
              onClick={handleToggleVoiceRecord}
              className={`p-2.5 rounded-2xl border transition-all ${
                isRecording
                  ? 'bg-rose-600 text-white border-rose-600 animate-pulse'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
              }`}
              title="Record Voice Note"
            >
              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={() => handleSendMessage()}
              disabled={!inputText.trim()}
              className="p-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white shadow-sm transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
