import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'en' | 'hi' | 'mr';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, fallback?: string) => string;
  speak: (text: string, langOverride?: Language) => void;
  stopSpeaking: () => void;
  isSpeaking: boolean;
  formatCurrency: (amount: number) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    appName: 'Kabadiwala Connect',
    tagline: 'e-Waste Traceability & EPR Exchange',
    dhatuSub: 'Smart Informal Scrap & Formal Recycler Ecosystem',
    portalCitizen: 'Citizen Portal',
    portalCollector: 'Collector / कबाड़ीवाला',
    portalRecycler: 'Recycler / Aggregator',
    portalAdmin: 'Admin / CPCB Audit',
    createLot: 'Create Lot',
    priceBoard: 'Price Board',
    recyclers: 'Find Recyclers',
    passbook: 'Passbook Ledger',
    safety: 'Safety Rules',
    pickups: 'Citizen Pickups',
    offlineMode: 'Offline Mode',
    onlineMode: 'Online',
    pendingSync: 'Pending Sync',
    syncNow: 'Sync Now',
    verified: 'VERIFIED',
    cashFirst: 'Cash First Supported',
    enterAs: 'Enter as',
    listen: 'Listen',
    stop: 'Stop',
    hazardWarning: 'Hazard Alert',
    indicativePrice: 'Estimated Indicative Value',
    donateCsr: 'Donate value to Green Earth NGO',
    digitalReceipt: 'Verifiable Receipt',
    landfillDiverted: 'kept out of landfill',
    traceabilityHash: 'Traceability Hash',
  },
  hi: {
    appName: 'कबाड़ीवाला कनेक्ट',
    tagline: 'ई-कचरा ट्रेसेबिलिटी एवं ईपीआर एक्सचेंज',
    dhatuSub: 'धातु — अनौपचारिक स्क्रैप एवं अधिकृत रीसायकलर मंच',
    portalCitizen: 'नागरिक पोर्टल',
    portalCollector: 'कबाड़ीवाला / संग्राहक',
    portalRecycler: 'पुनर्चक्रणकर्ता (रीसायकलर)',
    portalAdmin: 'प्रशासन / सीपीसीबी ऑडिट',
    createLot: 'लॉट बनाएं',
    priceBoard: 'दाम पत्रक',
    recyclers: 'रीसायकलर खोजें',
    passbook: 'खातावही / पासबुक',
    safety: 'सुरक्षा मार्गदर्शन',
    pickups: 'नागरिक पिकअप',
    offlineMode: 'ऑफलाइन मोड',
    onlineMode: 'ऑनलाइन',
    pendingSync: 'लंबित सिंक',
    syncNow: 'अभी सिंक करें',
    verified: 'सत्यापित',
    cashFirst: 'नकद भुगतान समर्थित',
    enterAs: 'प्रवेश करें',
    listen: 'बोलकर सुनें',
    stop: 'रोकें',
    hazardWarning: 'खतरा चेतावनी',
    indicativePrice: 'अनुमानित मूल्य दायरा',
    donateCsr: 'पर्यावरण NGO को राशि दान करें',
    digitalReceipt: 'डिजिटल रसीद',
    landfillDiverted: 'लैंडफिल में जाने से बचाया',
    traceabilityHash: 'ट्रेसेबिलिटी हैश',
  },
  mr: {
    appName: 'कबाडीवाला कनेक्ट',
    tagline: 'ई-कचरा मागोवा आणि ईपीआर मंच',
    dhatuSub: 'धातु — भंगार गोळा करणारे व अधिकृत रीसायकलर व्यासपीठ',
    portalCitizen: 'नागरिक पोर्टल',
    portalCollector: 'भंगार संग्राहक',
    portalRecycler: 'पुनर्चक्रणकर्ता / रीसायकलर',
    portalAdmin: 'प्रशासन / सीपीसीबी तपासणी',
    createLot: 'नवीन लॉट तयार करा',
    priceBoard: 'भाव फलक',
    recyclers: 'रीसायकलर शोधा',
    passbook: 'जमा-खर्च नोंदवही',
    safety: 'सुरक्षा नियम',
    pickups: 'नागरिक संकलन',
    offlineMode: 'ऑफलाइन मोड',
    onlineMode: 'ऑनलाइन',
    pendingSync: 'प्रलंबित सिंक',
    syncNow: 'आता सिंक करा',
    verified: 'प्रमाणित',
    cashFirst: 'रोख व्यवहार समर्थित',
    enterAs: 'प्रवेश करा',
    listen: 'ऐका',
    stop: 'थांबवा',
    hazardWarning: 'धोका इशारा',
    indicativePrice: 'अंदाजे किंमत श्रेणी',
    donateCsr: 'वृक्षारोपण NGO ला रक्कम दान करा',
    digitalReceipt: 'प्रमाणित पावती',
    landfillDiverted: 'कचरा डेपोत जाण्यापासून वाचवले',
    traceabilityHash: 'ट्रेसेबिलिटी हॅश',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('dhatu_language');
    if (saved === 'hi' || saved === 'mr' || saved === 'en') return saved as Language;
    return 'en';
  });
  const [isSpeaking, setIsSpeaking] = useState(false);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('dhatu_language', lang);
  };

  const t = (key: string, fallback?: string): string => {
    return translations[language]?.[key] || translations.en[key] || fallback || key;
  };

  const speak = (text: string, langOverride?: Language) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const targetLang = langOverride || language;
    const utterance = new SpeechSynthesisUtterance(text);
    if (targetLang === 'hi') utterance.lang = 'hi-IN';
    else if (targetLang === 'mr') utterance.lang = 'mr-IN';
    else utterance.lang = 'en-IN';

    utterance.rate = 0.92;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  // Indian Number Format formatter (e.g. ₹1,20,000)
  const formatCurrency = (amount: number): string => {
    const rounded = Math.round(amount);
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(rounded);
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        speak,
        stopSpeaking,
        isSpeaking,
        formatCurrency
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
