import React, { useState, useEffect } from 'react';
import { InAppNotification, NotificationType } from '../types';
import { storage, STORAGE_KEYS } from '../lib/storage';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { triggerHaptic } from '../lib/haptics';
import {
  Bell,
  X,
  CheckCheck,
  Truck,
  Layers,
  Gavel,
  ShieldCheck,
  FileCheck2,
  TrendingUp,
  CreditCard,
  ChevronRight,
  Info,
  Clock,
  Sparkles,
  Filter,
  ArrowLeft,
  Maximize2
} from 'lucide-react';

interface InboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const InboxModal: React.FC<InboxModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab
}) => {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'UNREAD' | 'OPERATIONS' | 'SYSTEM'>('ALL');
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);

  const loadNotifications = () => {
    if (!user) return;
    const notifs = storage.getNotifications(user.id || user.role);
    setNotifications(notifs);
  };

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen, user]);

  // Reactive listener for storage changes
  useEffect(() => {
    const handleStorageChange = (e: any) => {
      if (e.detail?.key === STORAGE_KEYS.NOTIFICATIONS || e.detail?.key === '*') {
        loadNotifications();
      }
    };
    window.addEventListener('dhatu-storage-change', handleStorageChange);
    return () => window.removeEventListener('dhatu-storage-change', handleStorageChange);
  }, [user]);

  if (!isOpen) return null;

  const unreadCount = notifications.filter(n => !n.read).length;

  const filteredNotifications = notifications.filter(n => {
    if (activeFilter === 'UNREAD') return !n.read;
    if (activeFilter === 'OPERATIONS') {
      return ['PICKUP', 'LOT', 'BID', 'PAYMENT', 'RATE'].includes(n.type);
    }
    if (activeFilter === 'SYSTEM') {
      return ['KYC', 'CERTIFICATE', 'SYSTEM', 'ORDER'].includes(n.type);
    }
    return true;
  });

  const handleNotificationClick = (notif: InAppNotification) => {
    triggerHaptic(15);
    // Mark as read immediately to remove unread indicator
    storage.markNotificationRead(notif.id);
    loadNotifications();

    // If an actionTab is linked, navigate directly
    if (notif.actionTab && onNavigateTab) {
      onNavigateTab(notif.actionTab);
      onClose();
    }
  };

  const handleMarkAllRead = () => {
    triggerHaptic(25);
    storage.markAllNotificationsRead(user?.id || user?.role);
    loadNotifications();
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'PICKUP':
        return (
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-200 dark:border-emerald-800/60 shadow-2xs">
            <Truck className="w-5 h-5" />
          </div>
        );
      case 'LOT':
        return (
          <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0 border border-amber-200 dark:border-amber-800/60 shadow-2xs">
            <Layers className="w-5 h-5" />
          </div>
        );
      case 'BID':
        return (
          <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 flex items-center justify-center shrink-0 border border-indigo-200 dark:border-indigo-800/60 shadow-2xs">
            <Gavel className="w-5 h-5" />
          </div>
        );
      case 'PAYMENT':
        return (
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-200 flex items-center justify-center shrink-0 border border-emerald-300 dark:border-emerald-800 shadow-2xs">
            <CreditCard className="w-5 h-5" />
          </div>
        );
      case 'KYC':
        return (
          <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0 border border-blue-200 dark:border-blue-800/60 shadow-2xs">
            <ShieldCheck className="w-5 h-5" />
          </div>
        );
      case 'CERTIFICATE':
        return (
          <div className="w-10 h-10 rounded-2xl bg-teal-100 dark:bg-teal-950/70 text-teal-700 dark:text-teal-300 flex items-center justify-center shrink-0 border border-teal-200 dark:border-teal-800/60 shadow-2xs">
            <FileCheck2 className="w-5 h-5" />
          </div>
        );
      case 'RATE':
        return (
          <div className="w-10 h-10 rounded-2xl bg-violet-100 dark:bg-violet-950/70 text-violet-700 dark:text-violet-300 flex items-center justify-center shrink-0 border border-violet-200 dark:border-violet-800/60 shadow-2xs">
            <TrendingUp className="w-5 h-5" />
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700 shadow-2xs">
            <Info className="w-5 h-5" />
          </div>
        );
    }
  };

  return (
    <div
      className="fixed inset-0 z-[75] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#131D31] w-full sm:max-w-lg h-full sm:h-[680px] rounded-none sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Header with Android Safe-Area Inset and Back Option */}
        <div
          className="px-4 sm:px-5 py-3.5 sm:py-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2"
          style={{
            paddingTop: 'var(--app-top-inset, env(safe-area-inset-top, 0.75rem))'
          }}
        >
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={() => {
                triggerHaptic(15);
                onClose();
              }}
              className="p-1.5 sm:p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors sm:hidden shrink-0"
              title="Go Back"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="relative w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold shadow-2xs shrink-0">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-600"></span>
                </span>
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                  {language === 'hi' ? 'गतिविधि इनबॉक्स' : language === 'mr' ? 'कार्यकलाप इनबॉक्स' : 'Activity Inbox'}
                </h3>
                {unreadCount > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/40 shrink-0">
                    {unreadCount} {t('unread', 'unread')}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {language === 'hi'
                  ? 'पिकअप, लॉट, बोलियां एवं प्रमाणन अलर्ट'
                  : language === 'mr'
                  ? 'पिकअप, लॉट, लिलाव व केवायसी सतर्कता'
                  : 'Lifecycle events, bids, payouts & regulatory updates'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 flex items-center gap-1 px-2.5 py-1.5 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                title="Mark all notifications as read"
              >
                <CheckCheck className="w-4 h-4" />
                <span className="hidden sm:inline">{t('markAllRead', 'Mark all read')}</span>
              </button>
            )}

            {onNavigateTab && (
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(15);
                  onClose();
                  onNavigateTab('notifications');
                }}
                className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors hidden sm:inline-flex"
                title="Open as separate full page"
                aria-label="Open as full page"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={() => {
                triggerHaptic(15);
                onClose();
              }}
              className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 transition-colors"
              title="Close inbox"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Navigation Tabs */}
        <div className="px-5 py-2.5 bg-slate-100/70 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => {
              triggerHaptic(10);
              setActiveFilter('ALL');
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
              activeFilter === 'ALL'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
            }`}
          >
            {t('all', 'All')} ({notifications.length})
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic(10);
              setActiveFilter('UNREAD');
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeFilter === 'UNREAD'
                ? 'bg-rose-600 text-white shadow-2xs'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
            }`}
          >
            <span>{t('unread', 'Unread')}</span>
            {unreadCount > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeFilter === 'UNREAD' ? 'bg-white/30 text-white' : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
              }`}>
                {unreadCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic(10);
              setActiveFilter('OPERATIONS');
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
              activeFilter === 'OPERATIONS'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
            }`}
          >
            {language === 'hi' ? 'पिकअप व लॉट्स' : language === 'mr' ? 'पिकअप व लॉट्स' : 'Pickups & Lots'}
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic(10);
              setActiveFilter('SYSTEM');
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
              activeFilter === 'SYSTEM'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
            }`}
          >
            {language === 'hi' ? 'केवाईसी व प्रमाणन' : language === 'mr' ? 'केवायसी व ऑडिट' : 'KYC & Audit'}
          </button>
        </div>

        {/* Notifications Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 bg-slate-50/50 dark:bg-[#0c1322]/50">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-20 px-4 space-y-2 text-slate-400">
              <Bell className="w-12 h-12 mx-auto opacity-30 text-slate-400" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                {language === 'hi'
                  ? 'कोई नई सूचना नहीं है'
                  : language === 'mr'
                  ? 'या फिल्टरमध्ये कोणतीही सूचना नाही'
                  : 'No notifications in this filter'}
              </p>
              <p className="text-xs max-w-xs mx-auto">
                {language === 'hi'
                  ? 'जब कोई पिकअप स्वीकृत होगा या लॉट पर बोली आएगी, सूचनाएं यहाँ प्राप्त होंगी।'
                  : language === 'mr'
                  ? 'जेव्हा पिकअप मंजूर होईल किंवा लॉटवर बोली येईल, तेव्हा सूचना येथे दिसतील.'
                  : 'Live milestones, bid approvals, weighbridge slips and payout alerts will appear here.'}
              </p>
            </div>
          ) : (
            filteredNotifications.map(notif => (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer shadow-xs group flex items-start gap-3.5 relative ${
                  !notif.read
                    ? 'bg-white dark:bg-[#151f32] border-emerald-400/80 dark:border-emerald-600/50 ring-1 ring-emerald-500/20 shadow-sm'
                    : 'bg-white/80 dark:bg-[#131D31] border-slate-200/80 dark:border-slate-800/80 opacity-90 hover:opacity-100 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                {/* Notification Icon */}
                {getNotificationIcon(notif.type)}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className={`text-sm truncate ${!notif.read ? 'font-extrabold text-slate-900 dark:text-white' : 'font-bold text-slate-800 dark:text-slate-200'}`}>
                      {notif.title}
                    </h4>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        <span>{notif.timestamp}</span>
                      </span>
                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    {notif.message}
                  </p>

                  {/* Context action tag */}
                  <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/60">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {notif.type}
                    </span>

                    {notif.actionTab && (
                      <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 group-hover:underline flex items-center gap-0.5">
                        <span>{t('viewDetails', 'View Details')}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer info banner */}
        <div
          className="px-5 py-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500"
          style={{
            paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0.75rem))'
          }}
        >
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>
              {language === 'hi'
                ? 'सूचनाएं पढ़ने पर अपठित सूचक स्वतः हट जाता है।'
                : language === 'mr'
                ? 'सूचना वाचल्यावर न वाचलेली खूण आपोआप निघून जाते.'
                : 'Reading an item clears its unread indicator automatically.'}
            </span>
          </span>
          <button
            type="button"
            onClick={handleMarkAllRead}
            className="font-bold text-emerald-700 dark:text-emerald-400 hover:underline"
          >
            {t('clearAll', 'Clear All Unread')}
          </button>
        </div>
      </div>
    </div>
  );
};
