import React from 'react';
import { ChatPartner, Role } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { triggerHaptic } from '../lib/haptics';
import {
  MessageSquare,
  X,
  Truck,
  Building2,
  User,
  ChevronRight,
  Clock,
  CheckCheck,
  ShieldCheck,
  Phone
} from 'lucide-react';

interface ChatPartnerSelectorModalProps {
  isOpen: boolean;
  contextType: 'LOT' | 'PICKUP';
  contextTitle: string;
  partners: ChatPartner[];
  onSelectPartner: (partner: ChatPartner) => void;
  onClose: () => void;
  defaultAssignee?: {
    id: string;
    name: string;
    role: Role | string;
    phone?: string;
    vehicleType?: string;
  } | null;
}

export const ChatPartnerSelectorModal: React.FC<ChatPartnerSelectorModalProps> = ({
  isOpen,
  contextType,
  contextTitle,
  partners,
  onSelectPartner,
  onClose,
  defaultAssignee
}) => {
  const { t, language } = useLanguage();

  if (!isOpen) return null;

  // Combine partners with default assignee if not already in the list
  const displayPartners = [...partners];
  if (defaultAssignee && !displayPartners.some(p => p.id === defaultAssignee.id)) {
    displayPartners.unshift({
      id: defaultAssignee.id,
      name: defaultAssignee.name,
      role: defaultAssignee.role,
      phone: defaultAssignee.phone,
      vehicleType: defaultAssignee.vehicleType,
      unreadCount: 0,
      lastMessage: contextType === 'PICKUP' ? 'Assigned Collector for this pickup' : 'Listed Party'
    });
  }

  const getRoleIcon = (role: Role | string) => {
    const r = String(role).toUpperCase();
    if (r.includes('KABADIWALA') || r.includes('COLLECTOR')) {
      return <Truck className="w-4 h-4 text-amber-700 dark:text-amber-300" />;
    }
    if (r.includes('RECYCLER')) {
      return <Building2 className="w-4 h-4 text-teal-700 dark:text-teal-300" />;
    }
    return <User className="w-4 h-4 text-emerald-700 dark:text-emerald-300" />;
  };

  const getRoleBadge = (role: Role | string) => {
    const r = String(role).toUpperCase();
    if (r.includes('KABADIWALA') || r.includes('COLLECTOR')) {
      return (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60 flex items-center gap-1">
          <Truck className="w-2.5 h-2.5" />
          <span>{t('portalCollector', 'Collector')}</span>
        </span>
      );
    }
    if (r.includes('RECYCLER')) {
      return (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950/70 text-teal-800 dark:text-teal-300 border border-teal-200/80 dark:border-teal-800/60 flex items-center gap-1">
          <Building2 className="w-2.5 h-2.5" />
          <span>{t('portalRecycler', 'Recycler')}</span>
        </span>
      );
    }
    return (
      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60 flex items-center gap-1">
        <User className="w-2.5 h-2.5" />
        <span>{t('portalCitizen', 'Citizen')}</span>
      </span>
    );
  };

  return (
    <div
      className="fixed inset-0 z-[75] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#131D31] w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-slide-up max-h-[85vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {contextType === 'PICKUP'
                  ? language === 'hi' ? 'कलेक्टर संदेश चुनें' : language === 'mr' ? 'संग्राहक संदेश निवडा' : 'Select Collector to Chat'
                  : language === 'hi' ? 'रीसाइक्लर संदेश चुनें' : language === 'mr' ? 'पुनर्चक्रणकर्ता संदेश निवडा' : 'Select Recycler to Chat'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[240px]">
                {contextTitle}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              triggerHaptic(15);
              onClose();
            }}
            className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Instruction subheader */}
        <div className="px-5 py-2.5 bg-emerald-50/50 dark:bg-emerald-950/20 border-b border-emerald-100 dark:border-emerald-900/30 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            {contextType === 'PICKUP'
              ? (language === 'hi' ? 'इस पिकअप पर संपर्क करने वाले कबाड़ीवालों की सूची:' : language === 'mr' ? 'या पिकअपवर संपर्क करणाऱ्या कबाडीवाल्यांची यादी:' : 'Collectors who sent inquiries or messages on this pickup:')
              : (language === 'hi' ? 'इस लॉट पर बोली लगाने वाले रीसाइक्लर्स की सूची:' : language === 'mr' ? 'या लॉटवर बोली लावणारे पुनर्चक्रणकर्ते:' : 'Recyclers inquiring or bidding on this e-waste lot:')}
          </span>
        </div>

        {/* Partner List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {displayPartners.length === 0 ? (
            <div className="text-center py-12 px-4 space-y-2 text-slate-400">
              <MessageSquare className="w-10 h-10 mx-auto opacity-30 text-slate-400" />
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                {language === 'hi' ? 'अभी कोई संदेश नहीं है' : language === 'mr' ? 'अद्याप कोणतेही संदेश नाहीत' : 'No Messages Yet'}
              </p>
              <p className="text-xs max-w-xs mx-auto">
                {contextType === 'PICKUP'
                  ? (language === 'hi' ? 'जब कोई कबाड़ीवाला इस पिकअप पर संदेश भेजेगा, उनका नाम यहाँ दिखाई देगा।' : 'When a collector messages about this pickup request, their conversation will appear here.')
                  : (language === 'hi' ? 'जब कोई रीसाइक्लर इस लॉट पर पूछताछ करेगा, उनकी सूची यहाँ दिखाई देगी।' : 'When recyclers place bids or ask questions about this lot, they will appear here.')}
              </p>
            </div>
          ) : (
            displayPartners.map(partner => (
              <div
                key={partner.id}
                onClick={() => {
                  triggerHaptic(20);
                  onSelectPartner(partner);
                }}
                className="w-full text-left p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#151f32] hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:border-emerald-500/50 transition-all cursor-pointer shadow-xs group flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative shrink-0">
                    <div className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold text-sm border border-slate-200 dark:border-slate-700 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-950/60 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors">
                      {partner.name.charAt(0)}
                    </div>
                    {/* Pulsing unread badge dot */}
                    {partner.unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-600 text-white text-[9px] font-bold items-center justify-center">
                          {partner.unreadCount}
                        </span>
                      </span>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {partner.name}
                      </h4>
                      {getRoleBadge(partner.role)}
                    </div>

                    {partner.lastMessage && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5 max-w-[220px]">
                        {partner.lastMessage}
                      </p>
                    )}

                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1">
                      {partner.vehicleType && (
                        <span>🚗 {partner.vehicleType}</span>
                      )}
                      {partner.lastMessageTime && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          <span>
                            {new Date(partner.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {partner.unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 text-[10px] font-bold">
                      {partner.unreadCount} {t('new', 'new')}
                    </span>
                  )}
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-emerald-600 group-hover:text-white flex items-center justify-center text-slate-400 transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 text-center">
          <p className="text-[11px] text-slate-400">
            {language === 'hi' ? 'चैट खोलने पर अपठित संदेश स्वतः पढ़े हुए चिह्नित हो जाएंगे।' : 'Unread indicators clear automatically upon opening conversation.'}
          </p>
        </div>
      </div>
    </div>
  );
};
