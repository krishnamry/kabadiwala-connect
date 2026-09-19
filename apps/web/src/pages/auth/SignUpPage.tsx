import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { triggerHaptic } from '../../lib/haptics';
import { storage } from '../../lib/storage';
import { Role, KycDocumentData } from '../../types';
import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import {
  User,
  Truck,
  Factory,
  ShieldCheck,
  Lock,
  Phone,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Camera as CameraIcon,
  Upload,
  CreditCard,
  FileCheck,
  MapPin,
  Mail,
  HelpCircle
} from 'lucide-react';
import { VoiceAssistButton } from '../../components/VoiceAssistButton';

interface SignUpPageProps {
  onBack: () => void;
  onSuccess: (role: Role) => void;
  onGoToLogin: () => void;
}

export const SignUpPage: React.FC<SignUpPageProps> = ({ onBack, onSuccess, onGoToLogin }) => {
  const { register } = useAuth();
  const { language, t, speak } = useLanguage();
  const { currentThemeConfig } = useTheme();

  // Wizard Steps: 1: Role, 2: Details, 3: Password, 4: KYC
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Form Fields
  const [role, setRole] = useState<Role>('CITIZEN');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [pincode, setPincode] = useState('');
  const [vehicleType, setVehicleType] = useState('Solar Cargo Trike');
  const [facilityName, setFacilityName] = useState('');
  const [cpcbRegNumber, setCpcbRegNumber] = useState('');

  // Password Fields (Typed two times)
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // KYC Fields
  const [idType, setIdType] = useState<'AADHAAR' | 'PAN'>('AADHAAR');
  const [idNumber, setIdNumber] = useState('');
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);

  // Status & Validation
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Handle Photo Capture (Capacitor Camera or File Input)
  const handleCapturePhoto = async (target: 'front' | 'back') => {
    triggerHaptic(20);
    setError(null);

    if (Capacitor.isNativePlatform()) {
      try {
        const image = await Camera.getPhoto({
          quality: 80,
          allowEditing: false,
          resultType: CameraResultType.DataUrl,
          source: CameraSource.Prompt // Asks camera or photos
        });
        if (image && image.dataUrl) {
          if (target === 'front') setFrontImage(image.dataUrl);
          else setBackImage(image.dataUrl);
          return;
        }
      } catch (err: any) {
        console.warn('Native camera capture cancelled or failed:', err);
      }
    }

    // Web Fallback: programmatically trigger file input
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            if (target === 'front') setFrontImage(reader.result);
            else setBackImage(reader.result);
          }
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  // Format Aadhaar number with spaces (1234 5678 9012)
  const handleAadhaarChange = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 12);
    const formatted = raw.replace(/(\d{4})(?=\d)/g, '$1 ');
    setIdNumber(formatted);
  };

  // Format PAN number (ABCDE1234F)
  const handlePanChange = (val: string) => {
    const clean = val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
    setIdNumber(clean);
  };

  // Validation before advancing to next step
  const handleNextStep = () => {
    setError(null);
    triggerHaptic(15);

    if (currentStep === 1) {
      setCurrentStep(2);
      return;
    }

    if (currentStep === 2) {
      if (!name.trim()) {
        setError(language === 'hi' ? 'कृपया अपना पूरा नाम दर्ज करें' : language === 'mr' ? 'कृपया आपले पूर्ण नाव प्रविष्ट करा' : 'Please enter your full name');
        return;
      }
      const cleanPhone = phone.replace(/\D/g, '');
      if (cleanPhone.length !== 10) {
        setError(language === 'hi' ? 'कृपया मान्य 10-अंकों का मोबाइल नंबर दर्ज करें' : language === 'mr' ? 'कृपया वैध १०-अंकी मोबाइल नंबर प्रविष्ट करा' : 'Please enter a valid 10-digit mobile number');
        return;
      }
      if (role === 'RECYCLER' && !facilityName.trim()) {
        setError(language === 'hi' ? 'पुनर्चक्रण सुविधा का नाम आवश्यक है' : 'Recycling facility name is required');
        return;
      }
      setCurrentStep(3);
      return;
    }

    if (currentStep === 3) {
      if (password.length < 6) {
        setError(language === 'hi' ? 'पासवर्ड कम से कम 6 अक्षरों का होना चाहिए' : language === 'mr' ? 'पासवर्ड किमान ६ वर्णांचा असावा' : 'Password must be at least 6 characters');
        return;
      }
      if (password !== confirmPassword) {
        setError(language === 'hi' ? 'दोनों पासवर्ड मेल नहीं खाते हैं' : language === 'mr' ? 'दोन्ही पासवर्ड जुळत नाहीत' : 'Passwords do not match. Please re-type identical password.');
        return;
      }
      setCurrentStep(4);
      return;
    }
  };

  // Final Registration & KYC Submission
  const handleSubmitRegistration = async () => {
    setError(null);
    triggerHaptic(30);

    // Validate KYC fields
    const rawId = idNumber.replace(/\s/g, '');
    if (idType === 'AADHAAR') {
      if (rawId.length !== 12) {
        setError(language === 'hi' ? 'कृपया 12 अंकों का वैध आधार नंबर दर्ज करें' : language === 'mr' ? 'कृपया १२ अंकांचा वैध आधार क्रमांक प्रविष्ट करा' : 'Please enter a valid 12-digit Aadhaar number');
        return;
      }
    } else {
      if (rawId.length !== 10) {
        setError(language === 'hi' ? 'कृपया 10 अक्षरों का वैध पैन नंबर दर्ज करें (उदा. ABCDE1234F)' : 'Please enter a valid 10-character PAN number');
        return;
      }
    }

    setLoading(true);
    try {
      const cleanPhone = phone.replace(/\D/g, '');
      
      const kycData: KycDocumentData = {
        idType,
        idNumber: idNumber.trim(),
        frontImage: frontImage || undefined,
        backImage: backImage || undefined,
        submittedAt: new Date().toISOString()
      };

      const payload = {
        name: name.trim(),
        phone: cleanPhone,
        password,
        role,
        email: email.trim() || undefined,
        address: address.trim() || 'New Delhi, India',
        pincode: pincode.trim() || '110001',
        vehicleType: role === 'KABADIWALA' ? vehicleType : undefined,
        facilityName: role === 'RECYCLER' ? facilityName : undefined,
        cpcbRegNumber: role === 'RECYCLER' ? cpcbRegNumber : undefined,
        kycStatus: 'UNDER_REVIEW',
        kycDocuments: kycData
      };

      // Register user via AuthContext
      await register(payload);

      // Save password and KYC in local storage persistence
      storage.setUserPassword(cleanPhone, password);
      const currentUser = storage.getCurrentUser();
      if (currentUser) {
        storage.updateUserKyc(currentUser.id, kycData);
      }

      // Add initial submitted in-app notification
      if (currentUser) {
        storage.addNotification({
          id: `notif-reg-${Date.now()}`,
          userId: currentUser.id,
          title: 'KYC Submitted for Regulatory Review',
          message: 'Your Aadhaar/PAN documents have been submitted. Our compliance team will review and verify your profile.',
          type: 'KYC',
          timestamp: new Date().toISOString(),
          read: false
        });
      }

      // Proceed directly to dashboard
      onSuccess(role);
    } catch (err: any) {
      console.error('Registration failed:', err);
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col justify-between bg-slate-50 dark:bg-[#0B1120] text-slate-900 dark:text-slate-100 transition-colors duration-200"
      style={{
        paddingTop: 'max(1rem, var(--app-top-inset, env(safe-area-inset-top, 0px)))',
        paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom, 0px))'
      }}
    >
      {/* Top Header & Progress */}
      <header className="w-full max-w-lg mx-auto px-4 pt-2">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => {
              triggerHaptic(15);
              if (currentStep > 1) {
                setCurrentStep((currentStep - 1) as any);
              } else {
                onBack();
              }
            }}
            className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm text-slate-700 dark:text-slate-200 active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold font-mono text-emerald-700 dark:text-emerald-400">
              {language === 'hi' ? `चरण ${currentStep}/4` : language === 'mr' ? `टप्पा ${currentStep}/४` : `Step ${currentStep} of 4`}
            </span>
          </div>

          <VoiceAssistButton
            text={
              currentStep === 1
                ? 'कृपया अपनी भूमिका चुनें: नागरिक, कबाड़ीवाला, अथवा पुनर्चक्रणकर्ता।'
                : currentStep === 2
                ? 'कृपया अपना पूरा नाम, 10 अंकों का मोबाइल नंबर और पता दर्ज करें।'
                : currentStep === 3
                ? 'कृपया अपना पासवर्ड बनाएं और उसकी पुष्टि हेतु दो बार टाइप करें।'
                : 'कृपया आधार अथवा पैन कार्ड संख्या दर्ज करें एवं फोटो अपलोड करें।'
            }
          />
        </div>

        {/* 4-Step Progress Bar */}
        <div className="grid grid-cols-4 gap-2 mb-2">
          {[1, 2, 3, 4].map(s => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                s <= currentStep ? 'bg-emerald-600 dark:bg-emerald-400' : 'bg-slate-200 dark:bg-slate-800'
              }`}
            />
          ))}
        </div>
      </header>

      {/* Wizard Step Body */}
      <main className="w-full max-w-lg mx-auto px-4 py-2 flex-1">
        {/* Error Banner */}
        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs flex items-start gap-2.5 animate-shake">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* STEP 1: USER ROLE SELECTION */}
        {currentStep === 1 && (
          <div className="space-y-4 animate-fade-in">
            <div className="text-center sm:text-left mb-2">
              <h2 className="text-2xl font-display font-black text-slate-900 dark:text-white">
                {language === 'hi' ? 'अपनी भूमिका चुनें' : language === 'mr' ? 'आपली भूमिका निवडा' : 'Select Your Account Type'}
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                {language === 'hi'
                  ? 'आप मंच का उपयोग किस रूप में करेंगे? आपके अनुसार डैशबोर्ड तैयार होगा।'
                  : language === 'mr'
                  ? 'तुम्ही प्लॅटफॉर्मचा वापर कसा कराल? त्यानुसार तुमचा डॅशबोर्ड उपलब्ध होईल.'
                  : 'How will you use Kabadiwala Connect? The dashboard will tailor to your role.'}
              </p>
            </div>

            {/* Role 1: Citizen */}
            <div
              onClick={() => {
                triggerHaptic(20);
                setRole('CITIZEN');
              }}
              className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3.5 ${
                role === 'CITIZEN'
                  ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-600 dark:border-emerald-400 shadow-md'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                role === 'CITIZEN' ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
              }`}>
                <User className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-black text-base text-slate-900 dark:text-white">
                    {language === 'hi' ? 'नागरिक एवं उपभोक्ता (Citizen)' : language === 'mr' ? 'नागरिक व ग्राहक (Citizen)' : 'Citizen & Household'}
                  </h3>
                  {role === 'CITIZEN' && <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 stroke-[3]" />}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                  {language === 'hi'
                    ? 'घर बैठे पुराने इलेक्ट्रॉनिक्स का पिकअप बुक करें, लाइव रेट देखें और पौधे लगाने के क्रेडिट पाएं।'
                    : language === 'mr'
                    ? 'घरावरून जुन्या इलेक्ट्रॉनिक्स संकलन विनंती करा, दर पहा आणि क्रेडिट मिळवा.'
                    : 'Schedule doorstep pickup for old electronics, view market prices, and earn green tree credits.'}
                </p>
              </div>
            </div>

            {/* Role 2: Kabadiwala / Collector */}
            <div
              onClick={() => {
                triggerHaptic(20);
                setRole('KABADIWALA');
              }}
              className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3.5 ${
                role === 'KABADIWALA'
                  ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-600 dark:border-emerald-400 shadow-md'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                role === 'KABADIWALA' ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
              }`}>
                <Truck className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-black text-base text-slate-900 dark:text-white">
                    {language === 'hi' ? 'कबाड़ीवाला / संग्राहक (Collector)' : language === 'mr' ? 'कबाडीवाला / संग्राहक (Collector)' : 'Door-to-Door Scrap Collector'}
                  </h3>
                  {role === 'KABADIWALA' && <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 stroke-[3]" />}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                  {language === 'hi'
                    ? 'बोलने वाला मूल्य बोर्ड, आसान वजन गणक, ई-कचरा लॉट निर्माण और डिजिटल वॉलेट भुगतान।'
                    : language === 'mr'
                    ? 'ध्वनी मूल्य फलक, सोपे वजन कॅल्क्युलेटर आणि थेट डिजिटल वॉलेट पेमेंट.'
                    : 'Spoken vernacular price board, low-literacy weight steppers, lot creation, and direct digital wallet.'}
                </p>
              </div>
            </div>

            {/* Role 3: Recycler */}
            <div
              onClick={() => {
                triggerHaptic(20);
                setRole('RECYCLER');
              }}
              className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3.5 ${
                role === 'RECYCLER'
                  ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-600 dark:border-emerald-400 shadow-md'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                role === 'RECYCLER' ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
              }`}>
                <Factory className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-black text-base text-slate-900 dark:text-white">
                    {language === 'hi' ? 'अधिकृत पुनर्चक्रणकर्ता (Recycler)' : language === 'mr' ? 'अधिकृत पुनर्वापरकर्ता (Recycler)' : 'CPCB Registered Recycler'}
                  </h3>
                  {role === 'RECYCLER' && <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 stroke-[3]" />}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                  {language === 'hi'
                    ? 'औद्योगिक ई-कचरा लॉट पर लाइव बोली लगाएं, सीपीसीबी ईपीआर फॉर्म-2 ऑडिट और आपूर्ति श्रृंखला।'
                    : language === 'mr'
                    ? 'ई-कचऱ्याच्या लॉटवर थेट बोली लावा आणि सीपीसीबी ईपीआर ऑडिट अहवाल मिळवा.'
                    : 'Bid on verified bulk lots, source directly from informal collectors, and generate CPCB EPR credits.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: PERSONAL & CONTACT DETAILS */}
        {currentStep === 2 && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <h2 className="text-2xl font-display font-black text-slate-900 dark:text-white">
                {language === 'hi' ? 'व्यक्तिगत विवरण' : language === 'mr' ? 'वैयक्तिक माहिती' : 'Personal & Contact Details'}
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                {language === 'hi' ? 'कृपया अपनी प्रामाणिक जानकारी भरें।' : 'Enter your authentic contact information for pickup routing.'}
              </p>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {language === 'hi' ? 'पूरा नाम (Full Name) *' : language === 'mr' ? 'पूर्ण नाव *' : 'Full Name *'}
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder={language === 'hi' ? 'उदा. रमेश शर्मा' : 'e.g. Ramesh Sharma'}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {language === 'hi' ? 'मोबाइल नंबर (10 अंक) *' : language === 'mr' ? 'मोबाइल नंबर (१० अंक) *' : 'Mobile Phone (10 digits) *'}
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-3.5 text-xs font-bold text-slate-400 font-mono">+91</span>
                <input
                  type="tel"
                  maxLength={10}
                  value={phone}
                  onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="9811100001"
                  className="w-full pl-14 pr-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>

            {/* Email (Optional for collector, required for recycler) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {role === 'RECYCLER' ? 'Official Facility Email *' : language === 'hi' ? 'ईमेल पता (वैकल्पिक)' : 'Email Address (Optional)'}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="contact@example.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>

            {/* Address & City */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'hi' ? 'क्षेत्र / पता' : 'Operating Area / Street'}
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="e.g. Lajpat Nagar-IV, New Delhi"
                    className="w-full pl-10 pr-3 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Pincode
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={pincode}
                  onChange={e => setPincode(e.target.value.replace(/\D/g, ''))}
                  placeholder="110024"
                  className="w-full px-3 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>

            {/* Role Specific: Vehicle Type for Kabadiwala */}
            {role === 'KABADIWALA' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'hi' ? 'वाहन का प्रकार (Vehicle Type)' : 'Vehicle / Transport Method'}
                </label>
                <select
                  value={vehicleType}
                  onChange={e => setVehicleType(e.target.value)}
                  className="w-full px-3.5 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="Solar Cargo Trike">Solar / Battery Cargo Trike</option>
                  <option value="Manual Handcart">Traditional Handcart (ठेला)</option>
                  <option value="Cargo E-Rickshaw">Electric E-Rickshaw Loader</option>
                  <option value="Mini Pickup Truck">Mini Pickup Truck (Tata Ace)</option>
                </select>
              </div>
            )}

            {/* Role Specific: Recycler Facility & CPCB Reg */}
            {role === 'RECYCLER' && (
              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Facility / Company Name *
                  </label>
                  <input
                    type="text"
                    value={facilityName}
                    onChange={e => setFacilityName(e.target.value)}
                    placeholder="e.g. Apex Green Recyclers Pvt Ltd"
                    className="w-full px-3.5 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    CPCB Registration Number
                  </label>
                  <input
                    type="text"
                    value={cpcbRegNumber}
                    onChange={e => setCpcbRegNumber(e.target.value.toUpperCase())}
                    placeholder="CPCB-EW-2024-DL-0992"
                    className="w-full px-3.5 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 3: CREATE PASSWORD (TYPED TWO TIMES) */}
        {currentStep === 3 && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <h2 className="text-2xl font-display font-black text-slate-900 dark:text-white">
                {language === 'hi' ? 'सुरक्षित पासवर्ड बनाएं' : language === 'mr' ? 'सुरक्षित पासवर्ड तयार करा' : 'Create & Confirm Password'}
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                {language === 'hi'
                  ? 'सटीकता सुनिश्चित करने के लिए पासवर्ड को दो बार टाइप करें।'
                  : 'Type your password twice to guarantee accuracy.'}
              </p>
            </div>

            {/* Password 1: Create Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {language === 'hi' ? 'पासवर्ड बनाएं (Create Password) *' : 'Create Password *'}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  className="w-full pl-10 pr-11 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Password 2: Confirm Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {language === 'hi' ? 'पासवर्ड पुनः दर्ज करें (Confirm Password) *' : 'Confirm Password (Re-enter) *'}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Type password again"
                  className={`w-full pl-10 pr-11 py-3 rounded-xl bg-white dark:bg-slate-900 border text-sm font-mono focus:ring-2 outline-none ${
                    confirmPassword && password !== confirmPassword
                      ? 'border-rose-400 focus:ring-rose-500'
                      : confirmPassword && password === confirmPassword
                      ? 'border-emerald-500 focus:ring-emerald-500'
                      : 'border-slate-300 dark:border-slate-700 focus:ring-emerald-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password Match Status Pill */}
              {confirmPassword.length > 0 && (
                <div className="mt-2 flex items-center gap-1.5 text-xs">
                  {password === confirmPassword ? (
                    <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />
                      {language === 'hi' ? 'पासवर्ड मेल खाता है' : language === 'mr' ? 'पासवर्ड जुळतो' : 'Passwords match perfectly'}
                    </span>
                  ) : (
                    <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {language === 'hi' ? 'पासवर्ड मेल नहीं खा रहे हैं' : 'Passwords do not match yet'}
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 text-xs space-y-1">
              <div className="font-bold text-slate-800 dark:text-slate-200">Security Recommendation:</div>
              <div>• Use at least 6 characters including numbers.</div>
              <div>• This password protects your digital wallet balance and KYC identity.</div>
            </div>
          </div>
        )}

        {/* STEP 4: KYC VERIFICATION (AADHAAR & PAN) */}
        {currentStep === 4 && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 mb-1.5">
                <ShieldCheck className="w-3 h-3" />
                <span>CPCB Regulatory Compliance</span>
              </div>
              <h2 className="text-2xl font-display font-black text-slate-900 dark:text-white">
                {language === 'hi' ? 'केवाईसी सत्यापन (KYC Details)' : language === 'mr' ? 'केवायसी तपशील (KYC)' : 'KYC Verification Details'}
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                {language === 'hi'
                  ? 'पहचान प्रमाण के लिए आधार अथवा पैन कार्ड का विवरण एवं फोटो प्रदान करें।'
                  : 'Provide Aadhaar Card or PAN Card to verify identity with regulatory body.'}
              </p>
            </div>

            {/* Document Type Selector Tabs */}
            <div className="grid grid-cols-2 p-1 bg-slate-200/80 dark:bg-slate-800 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(15);
                  setIdType('AADHAAR');
                  setIdNumber('');
                }}
                className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  idType === 'AADHAAR'
                    ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>आधार कार्ड (Aadhaar)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic(15);
                  setIdType('PAN');
                  setIdNumber('');
                }}
                className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  idType === 'PAN'
                    ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <FileCheck className="w-3.5 h-3.5" />
                <span>पैन कार्ड (PAN Card)</span>
              </button>
            </div>

            {/* ID Number Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {idType === 'AADHAAR' ? '12-Digit Aadhaar Number (12 अंक आधार नंबर) *' : '10-Character PAN Number (पैन नंबर) *'}
              </label>
              <div className="relative">
                <CreditCard className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                {idType === 'AADHAAR' ? (
                  <input
                    type="text"
                    maxLength={14} // with spaces
                    value={idNumber}
                    onChange={e => handleAadhaarChange(e.target.value)}
                    placeholder="XXXX XXXX XXXX"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm font-mono tracking-wider focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                ) : (
                  <input
                    type="text"
                    maxLength={10}
                    value={idNumber}
                    onChange={e => handlePanChange(e.target.value)}
                    placeholder="ABCDE1234F"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm font-mono tracking-wider uppercase focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                )}
              </div>
            </div>

            {/* Document Photo Upload / Camera Capture */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                {idType === 'AADHAAR' ? 'Aadhaar Document Photos (Front & Back)' : 'PAN Card Photo'}
              </label>

              <div className="grid grid-cols-2 gap-3">
                {/* Front Photo */}
                <div>
                  <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                    {idType === 'AADHAAR' ? 'Front Side (आगे का भाग)' : 'Card Photo'}
                  </div>
                  {frontImage ? (
                    <div className="relative rounded-xl overflow-hidden border-2 border-emerald-500 aspect-video bg-slate-900">
                      <img src={frontImage} alt="Front Document" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleCapturePhoto('front')}
                        className="absolute bottom-1 right-1 px-2 py-1 rounded bg-black/70 text-[10px] text-white font-bold"
                      >
                        Retake
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleCapturePhoto('front')}
                      className="w-full aspect-video rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 bg-white dark:bg-slate-900/60 flex flex-col items-center justify-center p-2 text-center active:scale-95 transition-all"
                    >
                      <CameraIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mb-1" />
                      <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Take Photo / Upload</span>
                      <span className="text-[9px] text-slate-400">Camera or Gallery</span>
                    </button>
                  )}
                </div>

                {/* Back Photo (Only for Aadhaar) */}
                {idType === 'AADHAAR' ? (
                  <div>
                    <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                      Back Side (पीछे का भाग)
                    </div>
                    {backImage ? (
                      <div className="relative rounded-xl overflow-hidden border-2 border-emerald-500 aspect-video bg-slate-900">
                        <img src={backImage} alt="Back Document" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleCapturePhoto('back')}
                          className="absolute bottom-1 right-1 px-2 py-1 rounded bg-black/70 text-[10px] text-white font-bold"
                        >
                          Retake
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleCapturePhoto('back')}
                        className="w-full aspect-video rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 bg-white dark:bg-slate-900/60 flex flex-col items-center justify-center p-2 text-center active:scale-95 transition-all"
                      >
                        <Upload className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mb-1" />
                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Take Photo / Upload</span>
                        <span className="text-[9px] text-slate-400">Back Address</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-[11px] flex flex-col justify-center">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 mb-1" />
                    <span>PAN verified via NSDL/ITD regulatory tax authority format.</span>
                  </div>
                )}
              </div>
            </div>

            {/* Compliance Disclaimer Notice */}
            <div className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 text-emerald-900 dark:text-emerald-200 text-xs flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <div className="font-bold">
                  {language === 'hi' ? 'नियामक समीक्षा प्रक्रिया' : 'Regulatory Review Policy'}
                </div>
                <div className="text-[11px] text-emerald-800 dark:text-emerald-300 leading-relaxed">
                  {language === 'hi'
                    ? 'पंजीकरण के बाद आप तुरंत डैशबोर्ड देख सकेंगे। नियामक प्राधिकरण द्वारा सत्यापन पूर्ण होने तक लॉट एवं बोली निर्माण की सुविधाएं आरक्षित रहेंगी।'
                    : 'You will enter your dashboard immediately upon registration. Lot creation and bidding will activate once approved by the Regulatory Body.'}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Sticky Action Footer */}
      <footer className="w-full max-w-lg mx-auto px-4 pt-2">
        {currentStep < 4 ? (
          <button
            type="button"
            onClick={handleNextStep}
            className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-display font-black text-sm shadow-lg shadow-emerald-600/25 active:scale-[0.99] flex items-center justify-center gap-2 transition-all"
          >
            <span>{language === 'hi' ? 'आगे बढ़ें (Next)' : language === 'mr' ? 'पुढे चला (Next)' : 'Continue to Next Step'}</span>
            <ArrowRight className="w-4 h-4 stroke-[3]" />
          </button>
        ) : (
          <button
            type="button"
            disabled={loading}
            onClick={handleSubmitRegistration}
            className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-display font-black text-sm shadow-lg shadow-emerald-600/30 active:scale-[0.99] flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {loading ? (
              <span>Submitting KYC & Creating Account...</span>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
                <span>
                  {language === 'hi'
                    ? 'पंजीकरण एवं केवाईसी सबमिट करें'
                    : language === 'mr'
                    ? 'नोंदणी व केवायसी सबमिट करा'
                    : 'Submit KYC & Complete Registration'}
                </span>
              </>
            )}
          </button>
        )}

        {/* Existing Account Link */}
        <div className="text-center mt-3 text-xs text-slate-500 dark:text-slate-400">
          <span>{language === 'hi' ? 'पहले से खाता है? ' : 'Already registered? '}</span>
          <button
            type="button"
            onClick={() => {
              triggerHaptic(15);
              onGoToLogin();
            }}
            className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            {language === 'hi' ? 'लॉग इन करें' : 'Sign in here'}
          </button>
        </div>
      </footer>
    </div>
  );
};
