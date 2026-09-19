import React, { useState, useEffect } from 'react';
import { InAppNotification, NotificationType } from '../../types';
import { storage, STORAGE_KEYS } from '../../lib/storage';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { triggerHaptic } from '../../lib/haptics';
import {
  ArrowLeft,
  Bell,
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
  Trash2,
  RefreshCw,
  Check
} from 'lucide-react';

interface NotificationsPageProps {
  onBack: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const NotificationsPage: React.FC<NotificationsPageProps> = ({
  onBack,
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
    loadNotifications();
    const handleStorageChange = (e: any) => {
      if (e.detail?.key === STORAGE_KEYS.NOTIFICATIONS || e.detail?.key === '*') {
        loadNotifications();
      }
    };
    window.addEventListener('dhatu-storage-change', handleStorageChange);
    return () => window.removeEventListener('dhatu-storage-change', handleStorageChange);
  }, [user]);

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
    storage.markNotificationRead(notif.id);
    loadNotifications();

    if (notif.actionTab && onNavigateTab) {
      onNavigateTab(notif.actionTab);
    }
  };

  const handleMarkAllRead = () => {
    triggerHaptic(25);
    storage.markAllNotificationsRead(user?.id || user?.role);
    loadNotifications();
  };

  const handleMarkSingleRead = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    triggerHaptic(15);
    storage.markNotificationRead(id);
    loadNotifications();
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'PICKUP':
        return (
          <div className="w-11 h-11 rounded-2xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-200 dark:border-emerald-800/60 shadow-2xs">
            <Truck className="w-5 h-5" />
          </div>
        );
      case 'LOT':
        return (
          <div className="w-11 h-11 rounded-2xl bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0 border border-amber-200 dark:border-amber-800/60 shadow-2xs">
            <Layers className="w-5 h-5" />
          </div>
        );
      case 'BID':
        return (
          <div className="w-11 h-11 rounded-2xl bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 flex items-center justify-center shrink-0 border border-indigo-200 dark:border-indigo-800/60 shadow-2xs">
            <Gavel className="w-5 h-5" />
          </div>
        );
      case 'PAYMENT':
        return (
          <div className="w-11 h-11 rounded-2xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-200 flex items-center justify-center shrink-0 border border-emerald-300 dark:border-emerald-800 shadow-2xs">
            <CreditCard className="w-5 h-5" />
          </div>
        );
      case 'RATE':
        return (
          <div className="w-11 h-11 rounded-2xl bg-cyan-100 dark:bg-cyan-950/70 text-cyan-700 dark:text-cyan-300 flex items-center justify-center shrink-0 border border-cyan-200 dark:border-cyan-800/60 shadow-2xs">
            <TrendingUp className="w-5 h-5" />
          </div>
        );
      case 'KYC':
        return (
          <div className="w-11 h-11 rounded-2xl bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 flex items-center justify-center shrink-0 border border-purple-200 dark:border-purple-800/60 shadow-2xs">
            <ShieldCheck className="w-5 h-5" />
          </div>
        );
      case 'CERTIFICATE':
        return (
          <div className="w-11 h-11 rounded-2xl bg-teal-100 dark:bg-teal-950/70 text-teal-700 dark:text-teal-300 flex items-center justify-center shrink-0 border border-teal-200 dark:border-teal-800/60 shadow-2xs">
            <FileCheck2 className="w-5 h-5" />
          </div>
        );
      default:
        return (
          <div className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700 shadow-2xs">
            <Info className="w-5 h-5" />
          </div>
        );
    }
  };

  const formatRelativeTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const diffMs = Date.now() - date.getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMinutes / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMinutes < 1) return language === 'hi' ? 'अभी-अभी' : language === 'mr' ? 'आत्ताच' : 'Just now';
      if (diffMinutes < 60) return `${diffMinutes}m ${language === 'hi' ? 'पहले' : language === 'mr' ? 'पूर्वी' : 'ago'}`;
      if (diffHours < 24) return `${diffHours}h ${language === 'hi' ? 'पहले' : language === 'mr' ? 'पूर्वी' : 'ago'}`;
      if (diffDays === 1) return language === 'hi' ? 'कल' : language === 'mr' ? 'काल' : 'Yesterday';
      return `${diffDays}d ${language === 'hi' ? 'पहले' : language === 'mr' ? 'पूर्वी' : 'ago'}`;
    } catch {
      return '';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B1120] text-slate-900 dark:text-slate-100 font-body transition-colors duration-200 flex flex-col">
      {/* Top App Bar with Android Safe-Area Inset */}
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
                  {language === 'hi' ? 'सूचनाएं एवं अलर्ट' : language === 'mr' ? 'सूचना व सतर्कता' : 'Notifications'}
                </h1>
                {unreadCount > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/40 shrink-0">
                    {unreadCount} {t('unread', 'unread')}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {language === 'hi'
                  ? 'पिकअप, लॉट, बोलियां एवं प्रमाणन अपडेट्स'
                  : language === 'mr'
                  ? 'पिकअप, लॉट, लिलाव व केवायसी अपडेट्स'
                  : 'Live updates on pickups, lots, bids & KYC'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200/80 dark:border-emerald-800/60 px-2.5 sm:px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all active:scale-95 shadow-2xs"
                title="Mark all notifications as read"
              >
                <CheckCheck className="w-4 h-4" />
                <span className="hidden sm:inline">{t('markAllRead', 'Mark all read')}</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Navigation Chips */}
        <div className="border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/40">
          <div className="max-w-3xl mx-auto px-3 sm:px-6 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => {
                triggerHaptic(10);
                setActiveFilter('ALL');
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
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
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                activeFilter === 'UNREAD'
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
              }`}
            >
              <span>{t('unread', 'Unread')}</span>
              {unreadCount > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    activeFilter === 'UNREAD'
                      ? 'bg-white/30 text-white'
                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                  }`}
                >
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
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
                activeFilter === 'OPERATIONS'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
              }`}
            >
              {language === 'hi' ? 'दैनिक कार्य' : language === 'mr' ? 'दैनंदिन कामे' : 'Operations'}
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic(10);
                setActiveFilter('SYSTEM');
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
                activeFilter === 'SYSTEM'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
              }`}
            >
              {language === 'hi' ? 'केवाईसी व प्रमाणन' : language === 'mr' ? 'केवायसी व सिस्टीम' : 'KYC & System'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Notification Stream */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-3 sm:px-6 py-4 pb-[max(2rem,env(safe-area-inset-bottom,2rem))] space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-20 px-4 space-y-3">
            <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800/80 text-slate-400 mx-auto flex items-center justify-center">
              <Bell className="w-8 h-8 opacity-40" />
            </div>
            <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300">
              {activeFilter === 'UNREAD'
                ? language === 'hi'
                  ? 'कोई नई अपठित सूचना नहीं है'
                  : language === 'mr'
                  ? 'कोणतीही न वाचलेली सूचना नाही'
                  : 'No unread notifications'
                : language === 'hi'
                ? 'कोई सूचना मौजूद नहीं है'
                : language === 'mr'
                ? 'कोणतीही सूचना उपलब्ध नाही'
                : 'No notifications found'}
            </h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              {language === 'hi'
                ? 'जब भी आपके लॉट, पिकअप, भुगतान या सत्यापन में कोई प्रगति होगी, आपको तुरंत सूचना मिलेगी।'
                : language === 'mr'
                ? 'तुमच्या लॉट, पिकअप, पेमेंट किंवा पडताळणीमध्ये प्रगती होताच तुम्हाला त्वरित सूचना मिळेल.'
                : 'When new pickups are scheduled, bids arrive, or KYC verifications occur, you will receive real-time updates here.'}
            </p>
          </div>
        ) : (
          filteredNotifications.map(notif => (
            <div
              key={notif.id}
              onClick={() => handleNotificationClick(notif)}
              className={`p-4 rounded-3xl border transition-all cursor-pointer group shadow-2xs hover:shadow-md ${
                !notif.read
                  ? 'bg-white dark:bg-[#131D31] border-emerald-300/80 dark:border-emerald-800/60 ring-1 ring-emerald-500/10'
                  : 'bg-white/75 dark:bg-[#131D31]/75 border-slate-200/80 dark:border-slate-800/80 opacity-90'
              }`}
            >
              <div className="flex items-start gap-3.5">
                {getNotificationIcon(notif.type)}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <h4
                        className={`text-sm truncate ${
                          !notif.read
                            ? 'font-black text-slate-900 dark:text-white'
                            : 'font-semibold text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        {notif.title}
                      </h4>
                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                      )}
                    </div>

                    <span className="text-[11px] font-mono text-slate-400 shrink-0">
                      {formatRelativeTime(notif.timestamp)}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    {notif.message}
                  </p>

                  <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/60">
                    <span className="text-[10px] font-bold font-mono tracking-wider uppercase px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                      {notif.type}
                    </span>

                    <div className="flex items-center gap-2">
                      {!notif.read && (
                        <button
                          type="button"
                          onClick={(e) => handleMarkSingleRead(e, notif.id)}
                          className="text-[11px] font-bold text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1 p-1 rounded transition-colors"
                          title={language === 'hi' ? 'पढ़ा हुआ चिन्हित करें' : language === 'mr' ? 'वाचले म्हणून खूण करा' : 'Mark as read'}
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">
                            {language === 'hi' ? 'पढ़ा हुआ' : language === 'mr' ? 'वाचले' : 'Mark read'}
                          </span>
                        </button>
                      )}

                      {notif.actionTab && (
                        <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                          <span>{t('viewAction', 'View')}</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  );
};

export default NotificationsPage;
