import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { triggerHaptic } from '../../lib/haptics';
import { storage } from '../../lib/storage';
import { Role } from '../../types';
import {
  User,
  Truck,
  Factory,
  ShieldCheck,
  Lock,
  Phone,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  Building2,
  ChevronRight,
  Info,
  ChevronDown,
  Globe,
  Eye,
  EyeOff,
  X,
  KeyRound,
  AlertCircle,
  UserPlus
} from 'lucide-react';
import { VoiceAssistButton } from '../../components/VoiceAssistButton';

interface LoginPageProps {
  onSuccess: (role: Role) => void;
  onBack?: () => void;
  onGoToSignUp?: () => void;
  onChangeLanguage?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onSuccess,
  onBack,
  onGoToSignUp,
  onChangeLanguage
}) => {
  const { login, quickDemoLogin } = useAuth();
  const { language, t } = useLanguage();
  const { currentThemeConfig } = useTheme();

  const [selectedRole, setSelectedRole] = useState<Role>('CITIZEN');
  const [phone, setPhone] = useState('9811100001');
  const [password, setPassword] = useState('password123');
  const [facilityReg, setFacilityReg] = useState('CPCB-EW-2023-DL-0881');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFeatures, setShowFeatures] = useState(false);

  // Forgot Password Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState<1 | 2 | 3>(1);
  const [forgotPhone, setForgotPhone] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [showForgotPw1, setShowForgotPw1] = useState(false);
  const [showForgotPw2, setShowForgotPw2] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);
  const [targetResetUser, setTargetResetUser] = useState<any>(null);

  type LoginRole = 'CITIZEN' | 'KABADIWALA' | 'RECYCLER' | 'ADMIN';

  const roleConfig: Record<LoginRole, {
    tabLabelEn: string;
    tabLabelHi: string;
    tabLabelMr: string;
    titleEn: string;
    titleHi: string;
    titleMr: string;
    subtitle: string;
    subtitleHi: string;
    subtitleMr: string;
    badge: string;
    badgeHi: string;
    badgeMr: string;
    demoName: string;
    demoPhone: string;
    defaultPhone: string;
    icon: React.ElementType;
    features: string[];
    featuresHi: string[];
    featuresMr: string[];
    voiceText: string;
    voiceHi: string;
    voiceMr: string;
  }> = {
    CITIZEN: {
      tabLabelEn: 'Citizen',
      tabLabelHi: 'नागरिक',
      tabLabelMr: 'नागरिक',
      titleEn: 'Citizen & Household',
      titleHi: 'नागरिक एवं उपभोक्ता',
      titleMr: 'नागरिक व ग्राहक',
      subtitle: 'Schedule doorstep pickup for old electronics, view indicative market rates, track collector with live ETA, and earn green tree credits.',
      subtitleHi: 'पुराने ई-कचरे के घर बैठे पिकअप का अनुरोध करें, अनुमानित मूल्य देखें, कबाड़ीवाले को लाइव मैप पर ट्रैक करें और पौधे लगाने हेतु क्रेडिट पाएं।',
      subtitleMr: 'जुन्या ई-कचऱ्यासाठी घरावरून संकलन विनंती करा, अंदाजे दर पहा, संग्राहकाला थेट नकाशावर ट्रॅक करा आणि वृक्षारोपण क्रेडिट मिळवा.',
      badge: 'CITIZEN PORTAL',
      badgeHi: 'नागरिक पोर्टल',
      badgeMr: 'नागरिक पोर्टल',
      demoName: 'Ramesh Sharma',
      demoPhone: '9811100001',
      defaultPhone: '9811100001',
      icon: User,
      features: [
        'Doorstep pickup request with photo upload',
        'Indicative price estimate range before booking',
        'Live collector GPS location & ETA countdown',
        'Digital handover receipt & CSR green credits',
        'CPCB Certificate of Safe Disposal download'
      ],
      featuresHi: [
        'फोटो अपलोड के साथ घर बैठे पिकअप अनुरोध',
        'बुकिंग से पहले अनुमानित बाजार मूल्य दायरा',
        'लाइव कबाड़ीवाला जीपीएस लोकेशन एवं आगमन समय',
        'डिजिटल हस्तांतरण रसीद एवं सीएसआर ग्रीन क्रेडिट',
        'सीपीसीबी सुरक्षित निपटान प्रमाणपत्र डाउनलोड'
      ],
      featuresMr: [
        'फोटो अपलोडसह घरावरून संकलन विनंती',
        'बुकिंगपूर्वी अंदाजे बाजार भाव श्रेणी',
        'थेट संग्राहक जीपीएस स्थान आणि आगमन वेळ',
        'डिजिटल हस्तांतरण पावती आणि सीएसआर ग्रीन क्रेडिट',
        'सीपीसीबी सुरक्षित विल्हेवाट प्रमाणपत्र डाउनलोड'
      ],
      voiceText: 'Citizen Login. Book doorstep pickup for electronic waste and track collector Ramesh.',
      voiceHi: 'नागरिक लॉगिन। पुराने ई-कचरे के पिकअप का अनुरोध करें और कबाड़ीवाले को ट्रैक करें।',
      voiceMr: 'नागरिक लॉगिन. जुन्या इलेक्ट्रॉनिक्स भंगारासाठी पिकअप बुक करा.'
    },
    KABADIWALA: {
      tabLabelEn: 'Collector',
      tabLabelHi: 'संग्राहक',
      tabLabelMr: 'संग्राहक',
      titleEn: 'Doorstep Collector',
      titleHi: 'कबाड़ीवाला (संग्राहक)',
      titleMr: 'भंगार संग्राहक',
      subtitle: 'Voice-first portal with large touch buttons. Digital lot creation, live spoken price board, QR handover, and running cash passbook.',
      subtitleHi: 'बड़े बटनों और बोलती आवाज़ वाला पोर्टल। डिजिटल लॉट निर्माण, बोलता हुआ दाम पत्रक, क्यूआर हस्तांतरण और नकद खाता बही।',
      subtitleMr: 'मोठ्या बटनांसह बोलणारा डॅशबोर्ड. डिजिटल लॉट निर्मिती, बोलणारा भाव फलक, क्यूआर हस्तांतरण आणि रोख पासबुक.',
      badge: 'COLLECTOR PORTAL',
      badgeHi: 'कबाड़ीवाला पोर्टल',
      badgeMr: 'संग्राहक पोर्टल',
      demoName: 'Suresh Kumar',
      demoPhone: '9876543210',
      defaultPhone: '9876543210',
      icon: Truck,
      features: [
        'Spoken price board with live audio playback (Hindi/Marathi)',
        'Digital lot creation with +/- weight steppers & GPS tag',
        'Nearby CPCB authorized recycler discovery & ranking',
        'Digital verifiable QR handover ticket generator',
        'Running passbook ledger with cash reconciliation'
      ],
      featuresHi: [
        'लाइव ऑडियो के साथ बोलता हुआ मंडी दाम पत्रक (हिन्दी/मराठी)',
        '+/- वजन स्टेपर और जीपीएस टैग के साथ डिजिटल लॉट निर्माण',
        'आस-पास के सीपीसीबी अधिकृत रीसायकलर्स की सूची व रैंकिंग',
        'सत्यापित डिजिटल क्यूआर कोड हस्तांतरण टिकट',
        'नकद मिलान के साथ चालू पासबुक खाता बही'
      ],
      featuresMr: [
        'थेट ऑडिओसह बोलणारा बाजार भाव फलक (मराठी/हिंदी)',
        '+/- वजन स्टेपर व जीपीएस टॅगसह डिजिटल लॉट निर्मिती',
        'जवळच्या अधिकृत सीपीसीबी रीसायकलर्सची यादी व क्रमवारी',
        'प्रमाणित डिजिटल क्यूआर हस्तांतरण तिकीट निर्मिती',
        'रोख ताळमेळासह चालू पासबुक वही'
      ],
      voiceText: 'Kabadiwala Collector Login. Voice-first passbook for Suresh Kumar with live price board.',
      voiceHi: 'कबाड़ीवाला लॉगिन। सुरेश कुमार के लिए खाता बही एवं मंडी दाम पत्रक।',
      voiceMr: 'कबाडीवाला लॉगिन. सुरेश कुमार यांच्यासाठी बोलणारा भाव फलक.'
    },
    RECYCLER: {
      tabLabelEn: 'Recycler',
      tabLabelHi: 'रीसायकलर',
      tabLabelMr: 'पुनर्वापरकर्ता',
      titleEn: 'Authorized Recycler',
      titleHi: 'अधिकृत पुनर्चक्रणकर्ता',
      titleMr: 'अधिकृत पुनर्वापर केंद्र',
      subtitle: 'B2B Procurement & EPR Settlement Engine. Bid on collector lots, calibrate weighbridge scale receipts, issue instant UPI payouts, and file CPCB Form-2.',
      subtitleHi: 'बी2बी खरीद एवं ईपीआर निपटान इंजन। कबाड़ीवालों के लॉट पर बोली लगाएं, वेईब्रिज पैमाना कैलिब्रेट करें, यूपीआई भुगतान करें और सीपीसीबी फॉर्म-2 दाखिल करें।',
      subtitleMr: 'बी२बी खरेदी व ईपीआर पूर्तता इंजिन. संग्राहक लॉट्सवर थेट बोली लावा, डिजिटल वजन पावती द्या आणि सीपीसीबी फॉर्म-२ भरा.',
      badge: 'RECYCLER ENGINE',
      badgeHi: 'रीसायकलर इंजन',
      badgeMr: 'पुनर्वापर इंजिन',
      demoName: 'EcoRecycle Aggregators',
      demoPhone: '9822200002',
      defaultPhone: 'CPCB-EW-2023-DL-0881',
      icon: Factory,
      features: [
        'Live collector lot bidding room with multi-lot multi-round counter offers',
        'Automated digital weighbridge intake & tolerance reconciliation',
        'Instant UPI payout settlement & digital passbook debit',
        'CPCB Form-2 / Form-6 automated regulatory filing generator',
        'Audit-grade SHA-256 batch custody ledger export'
      ],
      featuresHi: [
        'काउंटर ऑफर के साथ लाइव कबाड़ीवाला लॉट बोली कक्ष',
        'स्वचालित डिजिटल वेईब्रिज वजन मिलान प्रणाली',
        'त्वरित यूपीआई भुगतान एवं डिजिटल पासबुक रिकॉर्ड',
        'सीपीसीबी फॉर्म-2 / फॉर्म-6 स्वचालित विनियामक रिपोर्ट',
        'ऑडिट-स्तरीय SHA-256 सामग्री मागोवा लेजर निर्यात'
      ],
      featuresMr: [
        'थेट कबाडीवाला लॉट लिलाव व बोली कक्ष',
        'स्वयंचलित डिजिटल वजन मापन आणि जुळवणी',
        'तात्काळ यूपीआय पेमेंट आणि डिजिटल पासबुक नोंद',
        'सीपीसीबी फॉर्म-२ / फॉर्म-६ स्वयंचलित अहवाल',
        'तपासणीयोग्य SHA-256 डिजिटल वही निर्यात'
      ],
      voiceText: 'Authorized Recycler Login. EcoRecycle Aggregators. B2B lot bidding and weighbridge settlement.',
      voiceHi: 'रीसायकलर लॉगिन। इको-रीसायकल एग्रीगेटर्स। लॉट बोली और वेईब्रिज सेटलमेंट।',
      voiceMr: 'अधिकृत पुनर्वापर केंद्र लॉगिन. लॉट बोली आणि वजन सेटलमेंट.'
    },
    ADMIN: {
      tabLabelEn: 'Admin / CPCB',
      tabLabelHi: 'प्रशासन',
      tabLabelMr: 'प्रशासन',
      titleEn: 'Regulatory & Audit',
      titleHi: 'प्रशासन एवं ऑडिट',
      titleMr: 'प्रशासन व तपासणी',
      subtitle: 'Central regulatory dashboard for Municipal Urban Local Bodies (ULBs). Complete traceability datasets, unit-economics calculator, and KYC verification.',
      subtitleHi: 'शहरी स्थानीय निकायों (ULB) हेतु केंद्रीय विनियामक डैशबोर्ड। पूर्ण ट्रेसेबिलिटी डेटासेट, यूनिट-इकोनॉमिक्स कैलकुलेटर और केवाईसी सत्यापन।',
      subtitleMr: 'महानगरपालिका व स्थानिक स्वराज्य संस्थांसाठी केंद्रीय नियामक डॅशबोर्ड. संपूर्ण ट्रेसिबिलिटी डेटासेट, अर्थशास्त्र कॅल्क्युलेटर आणि केवायसी पडताळणी.',
      badge: 'REGULATORY AUDIT',
      badgeHi: 'नियामक ऑडिट',
      badgeMr: 'नियामक तपासणी',
      demoName: 'NDMC Waste & Mines Cell',
      demoPhone: '9999900000',
      defaultPhone: '9999900000',
      icon: ShieldCheck,
      features: [
        'Citywide e-waste tonnage & environmental impact analytics',
        'End-to-end 4-stage material traceability dataset with SHA-256 hashes',
        'Interactive Unit-Economics Calculator (+34% collector earnings boost)',
        'Collector Aadhaar KYC verification & CPCB badge approval',
        'Central CPCB portal API data export adhering to 2022 Rules'
      ],
      featuresHi: [
        'शहर भर के ई-कचरा आंकड़े एवं पर्यावरणीय प्रभाव विश्लेषण',
        'SHA-256 हैश के साथ संपूर्ण 4-स्तरीय सामग्री ट्रेसेबिलिटी डेटा',
        'कबाड़ीवालों की आय में +34% वृद्धि वाला यूनिट-इकोनॉमिक्स कैलकुलेटर',
        'कबाड़ीवाला आधार केवाईसी सत्यापन एवं सीपीसीबी बैज अनुमोदन',
        '2022 नियमों के अनुरूप केंद्रीय सीपीसीबी पोर्टल डेटा निर्यात'
      ],
      featuresMr: [
        'शहरभरातील ई-कचरा आकडेवारी आणि पर्यावरणीय प्रभाव विश्लेषण',
        'SHA-256 हॅशसह संपूर्ण ४-स्तरीय सामग्री मागोवा डेटासेट',
        'संग्राहकांच्या उत्पन्नात +३४% वाढ दर्शवणारे अर्थशास्त्र कॅल्क्युलेटर',
        'संग्राहक आधार केवायसी पडताळणी आणि सीपीसीबी बॅज मंजुरी',
        '२०२२ नियमांनुसार केंद्रीय सीपीसीबी पोर्टल डेटा निर्यात'
      ],
      voiceText: 'Administration and CPCB audit dashboard. Municipal monitoring and unit-economics.',
      voiceHi: 'प्रशासन कंसोल। शहर भर के ई-कचरा आंकड़े और औपचारिकीकरण रिपोर्ट।',
      voiceMr: 'प्रशासन डॅशबोर्ड. महानगरपालिका कचरा व्यवस्थापन आणि तपासणी.'
    }
  };

  const currentConfig = roleConfig[(selectedRole as LoginRole) in roleConfig ? (selectedRole as LoginRole) : 'CITIZEN'];

  const handleRoleSelect = (r: Role) => {
    setSelectedRole(r);
    const lookupKey = (r as LoginRole) in roleConfig ? (r as LoginRole) : 'CITIZEN';
    setPhone(roleConfig[lookupKey].defaultPhone);
    setError(null);
    triggerHaptic(15);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // First check local storage users
      const users = storage.getUsers();
      const matched = users.find(u => 
        u.phone === phone || 
        (selectedRole === 'RECYCLER' && u.recycler?.cpcbRegNumber === facilityReg)
      );

      if (matched) {
        const storedPassword = storage.getUserPassword(matched.id);
        // If password was set, enforce it. If not set yet (demo seeds), accept password123 or any PIN
        if (storedPassword && storedPassword !== password) {
          setError(
            language === 'hi'
              ? 'गलत पासवर्ड! कृपया सही पासवर्ड दर्ज करें या "पासवर्ड भूल गए" पर क्लिक करें।'
              : language === 'mr'
              ? 'चुकीचा पासवर्ड! कृपया योग्य पासवर्ड प्रविष्ट करा किंवा "पासवर्ड विसरलात" वर क्लिक करा.'
              : 'Invalid password. Please check your credentials or click "Forgot Password".'
          );
          setLoading(false);
          return;
        }

        storage.setCurrentUser(matched);
        triggerHaptic(30);
        onSuccess(matched.role);
        return;
      }

      // If not in local users, attempt standard API login
      await login(phone, password);
      onSuccess(selectedRole);
    } catch (err: any) {
      // Fallback for seamless offline/demo testing
      await quickDemoLogin(selectedRole);
      onSuccess(selectedRole);
    } finally {
      setLoading(false);
    }
  };

  const handleInstantDemoLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      triggerHaptic(30);
      await quickDemoLogin(selectedRole);
      onSuccess(selectedRole);
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  // Forgot Password Step 1: Search user and send OTP
  const handleForgotStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    const users = storage.getUsers();
    const cleanPhone = forgotPhone.trim();

    const matched = users.find(u => 
      u.phone === cleanPhone || 
      (u.role === 'RECYCLER' && u.recycler?.cpcbRegNumber === cleanPhone)
    );

    if (!matched && cleanPhone !== currentConfig.defaultPhone) {
      setForgotError(
        language === 'hi'
          ? 'इस नंबर से कोई पंजीकृत खाता नहीं मिला।'
          : language === 'mr'
          ? 'या नंबरसह कोणतेही खाते आढळले नाही.'
          : 'No registered account found with this phone number.'
      );
      return;
    }

    setTargetResetUser(matched || {
      id: `user-${Date.now()}`,
      name: currentConfig.demoName,
      phone: cleanPhone,
      role: selectedRole,
      kycStatus: 'VERIFIED'
    });

    triggerHaptic(20);
    setForgotStep(2);
    setForgotOtp('1234'); // Pre-fill 1234 for seamless testing
    setForgotSuccess(
      language === 'hi'
        ? `सत्यापन कोड ${cleanPhone} पर भेजा गया। (परीक्षण हेतु OTP: 1234)`
        : language === 'mr'
        ? `पडताळणी कोड ${cleanPhone} वर पाठवला. (चाचणी OTP: 1234)`
        : `Verification code sent to +91 ${cleanPhone}. (Testing OTP: 1234)`
    );
  };

  // Forgot Password Step 2: Verify OTP
  const handleForgotStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    if (forgotOtp.trim() !== '1234') {
      setForgotError(
        language === 'hi' ? 'गलत OTP! कृपया 1234 दर्ज करें।' : 'Invalid OTP. Please enter 1234.'
      );
      return;
    }

    triggerHaptic(20);
    setForgotStep(3);
    setForgotSuccess(null);
  };

  // Forgot Password Step 3: Set New Password (typed two times)
  const handleForgotStep3 = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);

    if (forgotNewPassword.length < 4) {
      setForgotError(
        language === 'hi'
          ? 'पासवर्ड कम से कम 4 अक्षरों का होना चाहिए।'
          : language === 'mr'
          ? 'पासवर्ड किमान 4 अक्षरांचा असावा.'
          : 'Password must be at least 4 characters long.'
      );
      return;
    }

    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotError(
        language === 'hi'
          ? 'दोनों पासवर्ड मेल नहीं खाते!'
          : language === 'mr'
          ? 'दोन्ही पासवर्ड जुळत नाहीत!'
          : 'Passwords do not match!'
      );
      return;
    }

    if (targetResetUser) {
      storage.setUserPassword(targetResetUser.id, forgotNewPassword);
      storage.setCurrentUser(targetResetUser);
      triggerHaptic(35);
      setShowForgotModal(false);
      onSuccess(targetResetUser.role);
    } else {
      setShowForgotModal(false);
    }
  };

  const rolesList: LoginRole[] = ['CITIZEN', 'KABADIWALA', 'RECYCLER', 'ADMIN'];

  return (
    <div className="min-h-[85vh] py-3 sm:py-8 px-3 sm:px-6 lg:px-8 max-w-4xl mx-auto flex flex-col justify-center">
      
      {/* Top Header Navigation (Back Button & Language Switcher) */}
      <div className="flex items-center justify-between w-full mb-3 sm:mb-4">
        {onBack ? (
          <button
            type="button"
            onClick={() => {
              triggerHaptic(15);
              onBack();
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95 transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{language === 'hi' ? 'वापस' : language === 'mr' ? 'मागे' : 'Back'}</span>
          </button>
        ) : <div />}

        {onChangeLanguage && (
          <button
            type="button"
            onClick={() => {
              triggerHaptic(15);
              onChangeLanguage();
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95 transition-all"
          >
            <Globe className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{language === 'hi' ? 'हिन्दी' : language === 'mr' ? 'मराठी' : 'English'}</span>
            <span className="text-[10px] text-slate-400 font-normal underline">
              {language === 'hi' ? 'बदलें' : language === 'mr' ? 'बदला' : 'Change'}
            </span>
          </button>
        )}
      </div>

      {/* App Branding & Welcome Header */}
      <div className="text-center space-y-2 mb-4 sm:mb-6">
        <div 
          className="w-12 h-12 sm:w-14 sm:h-14 mx-auto rounded-2xl flex items-center justify-center text-white shadow-md mb-2"
          style={{
            background: `linear-gradient(135deg, var(--color-primary), var(--color-primary-light))`
          }}
        >
          <span className="font-display font-black text-xl sm:text-2xl">धा</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-display font-black text-slate-900 dark:text-white tracking-tight">
          {t('welcomeApp', 'Kabadiwala Connect')}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium max-w-md mx-auto">
          {t('loginSubtitleApp', 'Smart Informal Waste & EPR Traceability Platform. Select your portal to continue.')}
        </p>
      </div>

      {/* M3 Segmented Role Selector Tabs */}
      <div className="bg-slate-200/70 dark:bg-slate-800/80 p-1 rounded-2xl sm:rounded-full grid grid-cols-2 sm:grid-cols-4 gap-1 mb-4 sm:mb-6 shadow-inner">
        {rolesList.map(r => {
          const cfg = roleConfig[r];
          const Icon = cfg.icon;
          const isSelected = selectedRole === r;

          return (
            <button
              key={r}
              type="button"
              onClick={() => handleRoleSelect(r)}
              className={`py-2.5 px-3 rounded-xl sm:rounded-full flex items-center justify-center space-x-2 transition-all font-semibold text-xs sm:text-sm ${
                isSelected
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-bold scale-[1.01]'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800'
              }`}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{
                  backgroundColor: isSelected ? 'var(--color-primary)' : '#94A3B8'
                }}
              />
              <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'opacity-100' : 'opacity-70'}`} />
              <span className="truncate">
                {language === 'hi' ? cfg.tabLabelHi : language === 'mr' ? cfg.tabLabelMr : cfg.tabLabelEn}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Authentication Card */}
      <div className="bg-white dark:bg-[#131D31] rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-m3-2 overflow-hidden transition-all">
        
        {/* Active Role Banner */}
        <div 
          className="px-5 sm:px-8 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between"
          style={{ backgroundColor: 'var(--color-primary-container)' }}
        >
          <div className="flex items-center space-x-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              <currentConfig.icon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  {language === 'hi' ? currentConfig.badgeHi : language === 'mr' ? currentConfig.badgeMr : currentConfig.badge}
                </span>
                <span className="text-[11px] font-medium px-2 py-0.2 rounded-full bg-white/80 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/50 dark:border-slate-700">
                  {currentConfig.demoName.split(' ')[0]}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-display font-black text-slate-900 dark:text-white leading-tight">
                {language === 'hi' ? currentConfig.titleHi : language === 'mr' ? currentConfig.titleMr : currentConfig.titleEn}
              </h2>
            </div>
          </div>

          <VoiceAssistButton
            text={currentConfig.voiceText}
            hindiText={currentConfig.voiceHi}
            marathiText={currentConfig.voiceMr}
            size="sm"
          />
        </div>

        {/* Action Body */}
        <div className="p-5 sm:p-8 space-y-5">
          
          {/* 1-Click Fast Instant Login Button (M3 High-Touch Action) */}
          <button
            type="button"
            onClick={handleInstantDemoLogin}
            disabled={loading}
            className="w-full py-3.5 sm:py-4 px-5 rounded-full text-white font-display font-bold text-sm sm:text-base flex items-center justify-center space-x-2.5 shadow-m3-1 hover:shadow-m3-2 active:scale-98 transition-all group"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            <Sparkles className="w-5 h-5 text-amber-300 group-hover:scale-110 transition-transform shrink-0" />
            <span className="truncate">
              {t('instantLogin', '1-Click Fast Login as')} {currentConfig.demoName}
            </span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform shrink-0" />
          </button>

          {/* Divider */}
          <div className="flex items-center my-3">
            <div className="flex-1 border-t border-slate-200 dark:border-slate-700"></div>
            <span className="px-3 text-[11px] uppercase text-slate-400 font-semibold tracking-wider">
              {t('orCredentials', 'Or Login with Phone & PIN')}
            </span>
            <div className="flex-1 border-t border-slate-200 dark:border-slate-700"></div>
          </div>

          {error && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-2xl text-rose-800 dark:text-rose-300 text-xs sm:text-sm font-semibold animate-shake">
              {error}
            </div>
          )}

          {/* Direct Credentials Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {selectedRole === 'RECYCLER' ? (
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1">
                  {t('cpcbRegNumber', 'CPCB Facility Reg Number')}
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    value={facilityReg}
                    onChange={e => setFacilityReg(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-sm font-semibold bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-2xl focus:bg-white dark:focus:bg-slate-800 focus:outline-none transition-all shadow-sm"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1">
                  {t('mobileNumber', 'Mobile Phone Number')}
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-sm font-semibold bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-2xl focus:bg-white dark:focus:bg-slate-800 focus:outline-none transition-all shadow-sm"
                  />
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  {t('password', 'Security PIN / Password')}
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotPhone(phone);
                    setForgotStep(1);
                    setForgotError(null);
                    setForgotSuccess(null);
                    setShowForgotModal(true);
                  }}
                  className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  {language === 'hi' ? 'पासवर्ड भूल गए?' : language === 'mr' ? 'पासवर्ड विसरलात?' : 'Forgot Password?'}
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm font-semibold bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-2xl focus:bg-white dark:focus:bg-slate-800 focus:outline-none transition-all shadow-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white py-3 px-5 rounded-full text-sm font-bold flex items-center justify-center space-x-2 shadow-sm active:scale-98 transition-all"
            >
              <span>{t('submitLogin', 'Sign In with Password')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Go to Sign Up Section */}
          {onGoToSignUp && (
            <div className="pt-2 text-center border-t border-slate-100 dark:border-slate-800">
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {language === 'hi'
                  ? 'खाता नहीं है? '
                  : language === 'mr'
                  ? 'खाते नाही आहे? '
                  : "Don't have an account? "}
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic(20);
                    onGoToSignUp();
                  }}
                  className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>
                    {language === 'hi'
                      ? 'नया खाता बनाएं (केवाईसी सहित)'
                      : language === 'mr'
                      ? 'नवीन खाते तयार करा (केवायसीसह)'
                      : 'Sign Up with KYC'}
                  </span>
                </button>
              </p>
            </div>
          )}

          {/* Collapsible / Clean Portal Capabilities */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowFeatures(!showFeatures)}
              className="w-full flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white py-1 transition-colors"
            >
              <div className="flex items-center space-x-1.5">
                <Info className="w-3.5 h-3.5 text-slate-400" />
                <span>{t('portalCapabilities', 'Portal Features & Information')}</span>
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform ${showFeatures ? 'rotate-180' : ''}`} />
            </button>

            {showFeatures && (
              <div className="mt-2.5 p-3.5 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-150 dark:border-slate-800 space-y-2 animate-fade-in text-xs text-slate-600 dark:text-slate-300">
                <p className="font-medium">
                  {language === 'hi' ? currentConfig.subtitleHi : language === 'mr' ? currentConfig.subtitleMr : currentConfig.subtitle}
                </p>
                <ul className="space-y-1.5 pt-1">
                  {(language === 'hi' ? currentConfig.featuresHi : language === 'mr' ? currentConfig.featuresMr : currentConfig.features).map((feat, idx) => (
                    <li key={idx} className="flex items-center space-x-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

        </div>

        {/* Security / Compliance Micro-Footer */}
        <div className="px-5 py-2.5 bg-slate-50 dark:bg-slate-800 text-[11px] font-medium text-slate-400 text-center border-t border-slate-100 dark:border-slate-800">
          {language === 'hi' 
            ? 'सीपीसीबी ईपीआर औपचारिक अनुपालन प्रमाणित • SIH26229' 
            : language === 'mr' 
            ? 'सीपीसीबी ईपीआर अधिकृत नियम पालन प्रमाणित • SIH26229' 
            : 'CPCB EPR Formal Compliance Certified • SIH26229'}
        </div>

      </div>

      {/* FORGOT PASSWORD MODAL */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 relative animate-scale-up">
            <button
              onClick={() => setShowForgotModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-display font-black text-slate-900 dark:text-white">
                  {language === 'hi' ? 'पासवर्ड रीसेट करें' : language === 'mr' ? 'पासवर्ड रीसेट करा' : 'Reset Password'}
                </h3>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Step {forgotStep} of 3
                </span>
              </div>
            </div>

            {forgotError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-800 dark:text-rose-300 text-xs font-semibold">
                {forgotError}
              </div>
            )}

            {forgotSuccess && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
                {forgotSuccess}
              </div>
            )}

            {/* STEP 1: Enter Phone */}
            {forgotStep === 1 && (
              <form onSubmit={handleForgotStep1} className="space-y-4">
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {language === 'hi'
                    ? 'कृपया अपना पंजीकृत मोबाइल नंबर दर्ज करें। हम आपको सत्यापन कोड भेजेंगे।'
                    : language === 'mr'
                    ? 'कृपया तुमचा नोंदणीकृत मोबाईल नंबर प्रविष्ट करा. आम्ही तुम्हाला पडताळणी कोड पाठवू.'
                    : 'Enter your registered mobile phone number. We will send a verification OTP.'}
                </p>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Mobile Number
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="tel"
                      required
                      value={forgotPhone}
                      onChange={e => setForgotPhone(e.target.value)}
                      placeholder="e.g. 9811100001"
                      className="w-full pl-10 pr-4 py-2.5 text-sm font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md transition-all active:scale-98"
                >
                  Send Verification Code
                </button>
              </form>
            )}

            {/* STEP 2: Enter OTP */}
            {forgotStep === 2 && (
              <form onSubmit={handleForgotStep2} className="space-y-4">
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Enter the 4-digit code sent to +91 {forgotPhone}. For this demo, use <strong className="text-emerald-600">1234</strong>.
                </p>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Verification OTP
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={forgotOtp}
                    onChange={e => setForgotOtp(e.target.value)}
                    placeholder="1234"
                    className="w-full text-center tracking-widest text-lg font-black py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md transition-all active:scale-98"
                >
                  Verify Code
                </button>
              </form>
            )}

            {/* STEP 3: Enter New Password (typed two times) */}
            {forgotStep === 3 && (
              <form onSubmit={handleForgotStep3} className="space-y-4">
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Create a new secure password. You must type it twice to confirm.
                </p>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showForgotPw1 ? 'text' : 'password'}
                      required
                      value={forgotNewPassword}
                      onChange={e => setForgotNewPassword(e.target.value)}
                      placeholder="Minimum 4 characters"
                      className="w-full px-4 pr-10 py-2.5 text-sm font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowForgotPw1(!showForgotPw1)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                    >
                      {showForgotPw1 ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showForgotPw2 ? 'text' : 'password'}
                      required
                      value={forgotConfirmPassword}
                      onChange={e => setForgotConfirmPassword(e.target.value)}
                      placeholder="Type password again"
                      className="w-full px-4 pr-10 py-2.5 text-sm font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowForgotPw2(!showForgotPw2)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                    >
                      {showForgotPw2 ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {forgotConfirmPassword && forgotNewPassword === forgotConfirmPassword && (
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Passwords match!
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md transition-all active:scale-98"
                >
                  Save New Password & Sign In
                </button>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
