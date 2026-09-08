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
  preserveEnglishItemName: (name: string) => string;
}

// Known scrap item names being sold — MUST ONLY EVER BE SHOWN IN ENGLISH as requested
const KNOWN_ENGLISH_SCRAP_ITEMS: Record<string, string> = {
  'Printed Circuit Boards (PCBs)': 'Printed Circuit Boards (PCBs)',
  'High-Grade Server PCBs': 'High-Grade Server PCBs',
  'High-grade PCB (Motherboards/Servers)': 'High-grade PCB (Motherboards/Servers)',
  'High-grade PCB (Motherboard/RAM)': 'High-grade PCB (Motherboard/RAM)',
  'High-grade Printed Circuit Boards (PCBs)': 'High-grade Printed Circuit Boards (PCBs)',
  'Low-grade PCB (Consumer Electronics)': 'Low-grade PCB (Consumer Electronics)',
  'Low-grade PCB (Power Supplies/TV)': 'Low-grade PCB (Power Supplies/TV)',
  'Copper Cables & Insulated Wires': 'Copper Cables & Insulated Wires',
  'Clean Peeled Copper Wire': 'Clean Peeled Copper Wire',
  'Clean Copper Wire (Bright Strip)': 'Clean Copper Wire (Bright Strip)',
  'Copper Wiring (Clean Bright)': 'Copper Wiring (Clean Bright)',
  'Lithium-ion Batteries': 'Lithium-ion Batteries',
  'Lithium-ion Battery Packs': 'Lithium-ion Battery Packs',
  'Lithium-ion Batteries (Laptop/EV)': 'Lithium-ion Batteries (Laptop/EV)',
  'Li-ion Batteries (Laptops/EV)': 'Li-ion Batteries (Laptops/EV)',
  'Electric Motors & Magnets': 'Electric Motors & Magnets',
  'Electric Motors & Transformer Coils': 'Electric Motors & Transformer Coils',
  'CRT Monitor Glass Unit': 'CRT Monitor Glass Unit',
  'CRT Monitor Glass (Treated)': 'CRT Monitor Glass (Treated)',
  'CRT Glass (Funnel Treated)': 'CRT Glass (Funnel Treated)',
  'LCD/LED Display Panels': 'LCD/LED Display Panels',
  'LCD & LED Display Panels': 'LCD & LED Display Panels',
  'Engineering E-Plastics (ABS/HIPS)': 'Engineering E-Plastics (ABS/HIPS)',
  'Engineering Plastics (ABS/HIPS)': 'Engineering Plastics (ABS/HIPS)',
  'Smartphones & Tablets': 'Smartphones & Tablets',
  'Server Grade Motherboards': 'Server Grade Motherboards',
  'Telecom Relay Units': 'Telecom Relay Units',
  'Lead Acid Batteries': 'Lead Acid Batteries',
  'Aluminium Heat Sinks': 'Aluminium Heat Sinks',
  'Brass Transformers': 'Brass Transformers',
  'Power Supply Units (SMPS)': 'Power Supply Units (SMPS)',

  // Reverse mapping for Hindi & Marathi names to guarantee strict English display
  'हाई-ग्रेड सर्किट बोर्ड (मदरबोर्ड/रैम)': 'High-grade PCB (Motherboard/RAM)',
  'हाय-ग्रेड सर्किट बोर्ड (मदरबोर्ड/रॅम)': 'High-grade PCB (Motherboard/RAM)',
  'साफ तांबा तार (ब्राइट छिला हुआ)': 'Clean Copper Wire (Bright Strip)',
  'स्वच्छ तांब्याची तार (सोलेली)': 'Clean Copper Wire (Bright Strip)',
  'लो-ग्रेड सर्किट बोर्ड (पावर सप्लाई/टीवी)': 'Low-grade PCB (Power Supplies/TV)',
  'लो-ग्रेड सर्किट बोर्ड (टीव्ही/पॉवर सप्लाय)': 'Low-grade PCB (Power Supplies/TV)',
  'लिथियम-आयन बैटरियां (लैपटॉप/ईवी)': 'Lithium-ion Batteries (Laptop/EV)',
  'लिथियम-आयन बॅटऱ्या (लॅपटॉप/ईव्ही)': 'Lithium-ion Batteries (Laptop/EV)',
  'इलेक्ट्रिक मोटर और चुंबक': 'Electric Motors & Magnets',
  'इलेक्ट्रिक मोटर आणि चुंबक': 'Electric Motors & Magnets',
  'एलसीडी और एलईडी डिस्प्ले पैनल': 'LCD/LED Display Panels',
  'एलसीडी आणि एलईडी डिस्प्ले पॅनेल्स': 'LCD/LED Display Panels',
  'मिश्रित ई-प्लास्टिक (ABS/HIPS)': 'Engineering E-Plastics (ABS/HIPS)',
  'सीआरटी कांच (लीड उपचारित)': 'CRT Monitor Glass Unit',
  'सीआरटी काच (लेड प्रक्रिया)': 'CRT Monitor Glass Unit',
  'PCBs': 'Printed Circuit Boards (PCBs)',
  'Batteries': 'Lithium-ion Batteries',
  'Cables': 'Copper Cables & Insulated Wires',
  'CRT Screens': 'CRT Monitor Glass Unit',
  'PCBs & Logic Boards': 'Printed Circuit Boards & Logic Boards',
  'Copper Cables & Winding': 'Copper Cables & Winding',
  'Li-ion Batteries': 'Lithium-ion Batteries',
  'CRT Monitor Glass': 'CRT Monitor Glass Unit',
  'Engineering E-Plastics': 'Engineering E-Plastics (ABS/HIPS)'
};

const translations: Record<Language, Record<string, string>> = {
  en: {
    appName: 'Kabadiwala Connect',
    tagline: 'e-Waste Traceability & EPR Exchange',
    dhatuTag: 'धातु — e-Waste Traceability & Formalization',
    dhatuSub: 'Smart Informal Scrap & Formal Recycler Ecosystem',
    sihBadge: 'SIH26229',
    sihSub: 'Ministry of Mines — Informal e-Waste Integration',
    activeTerminal: 'Active Terminal',
    switchRole: 'Switch Role Portal',
    signIn: 'Sign In',
    signInBtn: 'Sign In to Dedicated Portal',
    signOut: 'Sign Out',
    langSelect: 'Change Language',
    listen: 'Listen aloud',
    stop: 'Stop audio',

    portalCitizen: 'Citizen Portal',
    portalCollector: 'Collector / कबाड़ीवाला',
    portalRecycler: 'Authorized Recycler',
    portalAdmin: 'Admin / CPCB Audit',
    roleCitizen: 'Citizen / Household',
    roleCollector: 'Collector / कबाड़ीवाला',
    roleRecycler: 'Authorized Recycler',
    roleAdmin: 'Admin / CPCB Audit',
    personaCitizen: 'Ramesh Sharma',
    personaCollector: 'Suresh Kumar',
    personaRecycler: 'EcoRecycle Aggregators Ltd',
    personaAdmin: 'NDMC Waste & Mines Cell',

    heroTitle: "धातु — Digital Traceability & EPR Exchange for India's e-Waste Economy",
    heroSubtitle: "Bridging the informal door-to-door collector (कबाड़ीवाला) with formal CPCB smelters. Built on a low-literacy, offline-tolerant, vernacular passbook architecture with verifiable digital handovers.",
    roleBasedLogin: 'Role-Based Sign In',
    sourcingLayer: 'Sourcing Layer (Ramesh)',
    coreAsk: 'CORE SIH26229 ASK',
    formalSide: 'FORMAL INTERFACE',
    regulatoryLayer: 'REGULATORY DATA LAYER',
    citizenCardDesc: 'Request doorstep e-waste pickup, instant indicative price estimates, live collector tracking & CSR tree donation.',
    collectorCardDesc: 'Low-literacy lot creation, spoken price board, QR handover generation, passbook running ledger & safety cards.',
    recyclerCardDesc: 'Incoming collector lot review, QR scan verification, live price broadcasting, and CPCB Form-2/6 filings.',
    adminCardDesc: 'Citywide tonnage analytics, 4-stage material traceability dataset with SHA-256 hashes & KYC approvals.',
    enterAsCitizen: 'Enter as Citizen',
    enterAsCollector: 'Enter as Collector',
    enterAsRecycler: 'Enter as Recycler',
    enterAsAdmin: 'Enter as Admin',

    authGateway: 'Role-Based Authentication Gateway',
    selectRole: 'Select Your Role',
    loginSubtitle: 'Kabadiwala Connect provides a dedicated, purpose-built interface for each stakeholder in India\'s formal e-waste chain.',
    instantLogin: '1-Click Instant Login as',
    orCredentials: 'Or Enter Credentials',
    mobileNumber: 'Mobile Number',
    cpcbRegNumber: 'CPCB Facility Reg Number / Mobile',
    password: 'Password or PIN',
    submitLogin: 'Submit & Open Dashboard',
    dedicatedFeatures: 'Dedicated Features for this Portal',
    activeTabBadge: 'ACTIVE',

    status: 'Status',
    actions: 'Actions',
    submit: 'Submit',
    cancel: 'Cancel',
    save: 'Save',
    back: 'Back',
    delete: 'Delete',
    loading: 'Loading...',
    verified: 'VERIFIED',
    pending: 'PENDING',
    completed: 'COMPLETED',
    assigned: 'ASSIGNED',
    inProgress: 'IN PROGRESS',
    requested: 'REQUESTED',
    accepted: 'ACCEPTED',
    rejected: 'REJECTED',
    viewDetails: 'View Details',
    close: 'Close',
    date: 'Date',
    weight: 'Weight',
    amount: 'Amount',
    total: 'Total',
    ratePerKg: 'Rate per kg',
    perKg: 'per kg',
    estValue: 'Estimated Value',
    mandiRate: 'Mandi Benchmark Rate',
    itemMaterial: 'Item / Material (English Trade Name)',

    tabMyPickups: 'My Pickups',
    tabSchedulePickup: 'Schedule Pickup',
    tabImpact: 'Landfill Impact & Trees',
    tabDropoff: 'Drop-Off Centers',
    pickupAddress: 'Pickup Address',
    scheduledTime: 'Scheduled Date & Time',
    notesCarton: 'Notes / Description',
    itemsToRecycle: 'E-Waste Items to Recycle (English Trade Terms)',
    addMoreItems: 'Add Item',
    scanAiPhoto: 'Scan Scrap with AI Camera',
    indicativePriceRange: 'Indicative Price Range',
    confirmPickup: 'Confirm & Request Pickup',
    collectorTracking: 'Collector On The Way',
    collectorEta: 'Estimated Arrival: 12 mins',
    viewReceipt: 'View Verifiable Receipt',
    downloadCert: 'Download Safe Disposal Certificate',
    csrDonationNote: 'Donate value to Green Earth NGO to plant trees',
    treesPlanted: 'Trees Planted via Diversion',
    landfillDivertedKg: 'kg Diverted from Landfills',
    dropoffTitle: 'Authorized E-Waste Drop-Off Centers',

    tabLots: 'My Lots',
    tabPriceBoard: 'Spoken Price Board',
    tabFindRecyclers: 'Nearby Recyclers',
    tabHandover: 'Generate QR',
    tabPassbook: 'Cash Passbook',
    tabSafety: 'Safety Guidance',
    createLot: 'Create New Lot',
    selectScrapCategory: 'Select Item Category',
    lotWeightKg: 'Lot Weight (kg)',
    takePhotoProof: 'Take Photo Proof',
    saveLot: 'Save Lot to Ledger',
    listenPriceAloud: 'Listen to Price Aloud',
    todayMandiRate: "Today's Mandi Rate",
    passbookBalance: 'Current Running Balance',
    cashCollected: 'Total Cash Collected',
    totalSoldLots: 'Total Lots Dispatched',
    runningLedger: 'Cash & Lot Transaction Ledger',
    credit: 'Credit (+)',
    debit: 'Debit (-)',
    balance: 'Balance',
    offlineTolerant: 'Offline Mode Active (Zero Internet Needed)',
    syncPending: 'Lots Pending Sync',
    syncNow: 'Sync Now',
    safetyRulesTitle: 'Pictorial & Spoken Safety Cards',

    tabIncoming: 'Incoming Lots',
    tabVerifyQr: 'Verify Handover QR',
    tabRateConsole: 'Buying Rate Console',
    tabAnomalies: 'AI Anomaly Audit',
    tabReports: 'CPCB EPR Reports',
    tabFacility: 'Facility Profile',
    lotCode: 'Lot Code',
    collectorName: 'Collector',
    approxWeight: 'Approx Weight (kg)',
    offeredRate: 'Offered Rate (₹/kg)',
    totalAmount: 'Total Amount',
    acceptLot: 'Accept Lot',
    rejectLot: 'Reject Lot',
    counterOffer: 'Counter Rate',
    broadcastRates: 'Broadcast Rates to All Collectors',
    downloadForm2: 'Download CPCB Form-2 (JSON)',
    downloadForm6: 'Download CPCB Form-6 (CSV)',
    facilityRegStatus: 'CPCB EPR Registration Active',

    tabOverview: 'Citywide Overview',
    tabTraceability: 'Material Traceability Chain',
    tabUnitEconomics: 'Unit-Economics Calculator',
    tabVerifications: 'Collector KYC Verifications',
    tabEpr: 'CPCB 2022 Schema Export',
    citywideTonnage: 'Total E-Waste Diverted',
    activeCollectors: 'Registered Formalized Collectors',
    authorizedSmelters: 'CPCB Authorized Facilities',
    monthlyVolume: 'Monthly Collector Volume (kg)',
    middlemanCut: 'Informal Middleman Cut Eliminated',
    incomeBoost: 'Net Income Boost for Collector',
    approveKyc: 'Approve & Issue Badge',
    rejectKyc: 'Reject',
    traceabilityTitle: 'End-to-End 4-Stage Material Traceability with SHA-256',
    acceptPickup: 'Accept Pickup',
    citizenName: 'Citizen',
    estimatedPayout: 'Estimated Payout',
    itemsDeclared: 'Declared Scrap Items'
  },
  hi: {
    appName: 'कबाड़ीवाला कनेक्ट',
    tagline: 'ई-कचरा ट्रेसेबिलिटी एवं ईपीआर एक्सचेंज',
    dhatuTag: 'धातु — ई-कचरा ट्रेसेबिलिटी एवं औपचारिकीकरण मंच',
    dhatuSub: 'धातु — अनौपचारिक स्क्रैप एवं अधिकृत रीसायकलर मंच',
    sihBadge: 'SIH26229',
    sihSub: 'खान मंत्रालय — अनौपचारिक ई-कचरा एकीकरण पहल',
    activeTerminal: 'सक्रिय टर्मिनल',
    switchRole: 'भूमिका पोर्टल बदलें',
    signIn: 'पोर्टल में प्रवेश',
    signInBtn: 'पोर्टल में लॉगिन करें',
    signOut: 'लॉगआउट करें',
    langSelect: 'भाषा बदलें',
    listen: 'बोलकर सुनें',
    stop: 'आवाज़ रोकें',

    portalCitizen: 'नागरिक पोर्टल',
    portalCollector: 'कबाड़ीवाला / संग्राहक',
    portalRecycler: 'पुनर्चक्रणकर्ता (रीसायकलर)',
    portalAdmin: 'प्रशासन / सीपीसीबी ऑडिट',
    roleCitizen: 'नागरिक / घरेलू उपभोक्ता',
    roleCollector: 'कबाड़ीवाला / संग्राहक',
    roleRecycler: 'अधिकृत रीसायकलर / एग्रीगेटर',
    roleAdmin: 'प्रशासन / सीपीसीबी ऑडिट',
    personaCitizen: 'रमेश शर्मा',
    personaCollector: 'सुरेश कुमार',
    personaRecycler: 'इको-रीसायकल एग्रीगेटर्स लिमिटेड',
    personaAdmin: 'एनडीएमसी अपशिष्ट एवं खान प्रकोष्ठ',

    heroTitle: "धातु — भारत की ई-कचरा अर्थव्यवस्था हेतु डिजिटल ट्रेसेबिलिटी एवं ईपीआर मंच",
    heroSubtitle: "घर-घर जाने वाले कबाड़ीवालों को अधिकृत सीपीसीबी रीसायकलर्स से जोड़ना। कम साक्षरता, बिना इंटरनेट सुविधा और बहुभाषी नकद पासबुक पर आधारित डिजिटल प्रणाली।",
    roleBasedLogin: 'रोल अनुसार पोर्टल लॉगिन',
    sourcingLayer: 'सोर्सिंग स्तर (रमेश)',
    coreAsk: 'मुख्य उद्देश्य (SIH26229)',
    formalSide: 'औपचारिक रिसाइकलिंग स्तर',
    regulatoryLayer: 'विनियामक डेटा स्तर',
    citizenCardDesc: 'घर बैठे ई-कचरा पिकअप बुक करें, तुरंत अनुमानित मूल्य देखें, कबाड़ीवाले की लाइव लोकेशन ट्रैक करें और ग्रीन ट्री क्रेडिट पाएं।',
    collectorCardDesc: 'बोलता दाम पत्रक, सरल लॉट निर्माण, क्यूआर कोड रसीद, नकद खाता बही (पासबुक) और सुरक्षा कार्ड।',
    recyclerCardDesc: 'आने वाले लॉट की जांच (स्वीकार/अस्वीकार), क्यूआर स्कैन, लाइव दाम प्रसारण और सीपीसीबी फॉर्म-२ एवं फॉर्म-६ रिपोर्ट।',
    adminCardDesc: 'शहर भर के आंकड़े, एसएचए-२५६ हैश सहित ४-चरणीय ट्रेसेबिलिटी और कबाड़ीवाला आधार केवाईसी सत्यापन।',
    enterAsCitizen: 'नागरिक के रूप में प्रवेश करें',
    enterAsCollector: 'कबाड़ीवाले के रूप में प्रवेश करें',
    enterAsRecycler: 'रीसायकलर के रूप में प्रवेश करें',
    enterAsAdmin: 'प्रशासन के रूप में प्रवेश करें',

    authGateway: 'भूमिका आधारित प्रमाणीकरण गेटवे',
    selectRole: 'अपनी भूमिका का चयन करें',
    loginSubtitle: 'कबाड़ीवाला कनेक्ट भारत की औपचारिक ई-कचरा रीसाइक्लिंग प्रणाली के प्रत्येक हितधारक हेतु समर्पित पोर्टल प्रदान करता है।',
    instantLogin: 'एक क्लिक में त्वरित लॉगिन -',
    orCredentials: 'या अपना विवरण दर्ज करें',
    mobileNumber: 'पंजीकृत मोबाइल नंबर',
    cpcbRegNumber: 'सीपीसीबी संयंत्र पंजीकरण संख्या / मोबाइल',
    password: 'सुरक्षा पासवर्ड या ४-अंकों का पिन',
    submitLogin: 'जमा करें एवं डैशबोर्ड खोलें',
    dedicatedFeatures: 'इस पोर्टल की प्रमुख समर्पित सुविधाएं',
    activeTabBadge: 'सक्रिय',

    status: 'स्थिति',
    actions: 'कार्यवाही',
    submit: 'जमा करें',
    cancel: 'रद्द करें',
    save: 'सहेजें',
    back: 'वापस जाएं',
    delete: 'हटाएं',
    loading: 'लोड हो रहा है...',
    verified: 'सत्यापित',
    pending: 'लंबित',
    completed: 'संपन्न हुआ',
    assigned: 'कबाड़ीवाला आवंटित',
    inProgress: 'प्रगति पर है',
    requested: 'अनुरोध प्राप्त',
    accepted: 'स्वीकृत',
    rejected: 'अस्वीकृत',
    viewDetails: 'विवरण देखें',
    close: 'बंद करें',
    date: 'दिनांक',
    weight: 'वजन',
    amount: 'राशि',
    total: 'कुल योग',
    ratePerKg: 'दर प्रति किलो',
    perKg: 'प्रति किलो',
    estValue: 'अनुमानित मूल्य',
    mandiRate: 'मंडी बेंचमार्क दर',
    itemMaterial: 'सामग्री (English Trade Term)',

    tabMyPickups: 'मेरी पिकअप्स',
    tabSchedulePickup: 'पिकअप बुक करें',
    tabImpact: 'पर्यावरण प्रभाव एवं वृक्ष',
    tabDropoff: 'नजदीकी ड्रॉप-ऑफ केंद्र',
    pickupAddress: 'पिकअप का पता',
    scheduledTime: 'निर्धारित दिनांक एवं समय',
    notesCarton: 'सामग्री का विवरण / टिप्पणी',
    itemsToRecycle: 'ई-कचरा सामग्री (English Trade Terms)',
    addMoreItems: 'अन्य सामग्री जोड़ें',
    scanAiPhoto: 'एआई कैमरा से स्क्रैप स्कैन करें',
    indicativePriceRange: 'अनुमानित मूल्य दायरा',
    confirmPickup: 'पुष्टि करें एवं पिकअप अनुरोध भेजें',
    collectorTracking: 'कबाड़ीवाला रास्ते में है',
    collectorEta: 'अनुमानित आगमन: १२ मिनट में',
    viewReceipt: 'सत्यापित डिजिटल रसीद देखें',
    downloadCert: 'सुरक्षित निपटान प्रमाणपत्र डाउनलोड करें',
    csrDonationNote: 'वृक्षारोपण हेतु यह राशि ग्रीन अर्थ एनजीओ को दान करें',
    treesPlanted: 'डायवर्जन से लगाए गए वृक्ष',
    landfillDivertedKg: 'कि.ग्रा. ई-कचरा लैंडफिल जाने से बचाया',
    dropoffTitle: 'सीपीसीबी अधिकृत ई-कचरा ड्रॉप-ऑफ केंद्र',

    tabLots: 'मेरे लॉट',
    tabPriceBoard: 'बोलता दाम पत्रक',
    tabFindRecyclers: 'रीसायकलर खोजें',
    tabHandover: 'क्यूआर रसीद बनाएं',
    tabPassbook: 'नकद खाता बही',
    tabSafety: 'सुरक्षा मार्गदर्शन',
    createLot: 'नया लॉट बनाएं',
    selectScrapCategory: 'सामग्री श्रेणी चुनें',
    lotWeightKg: 'लॉट का वजन (कि.ग्रा.)',
    takePhotoProof: 'फोटो प्रमाण लें',
    saveLot: 'खाते में लॉट दर्ज करें',
    listenPriceAloud: 'दाम बोलकर सुनें',
    todayMandiRate: 'आज का मंडी भाव',
    passbookBalance: 'वर्तमान कुल शेष राशि',
    cashCollected: 'कुल नकद प्राप्त',
    totalSoldLots: 'कुल भेजे गए लॉट',
    runningLedger: 'नकद एवं लॉट लेन-देन खाता बही',
    credit: 'जमा (+)',
    debit: 'निकासी (-)',
    balance: 'शेष',
    offlineTolerant: 'ऑफलाइन मोड सक्रिय (बिना इंटरनेट के लॉट सहेजें)',
    syncPending: 'सिंक होना बाकी है',
    syncNow: 'अभी सिंक करें',
    safetyRulesTitle: 'सचित्र एवं बोलती सुरक्षा मार्गदर्शिका',

    tabIncoming: 'आने वाले लॉट',
    tabVerifyQr: 'हैंडओवर क्यूआर जांचें',
    tabRateConsole: 'खरीद दर नियंत्रण',
    tabAnomalies: 'एआई विसंगति जांच',
    tabReports: 'सीपीसीबी ईपीआर रिपोर्ट',
    tabFacility: 'संयंत्र प्रोफ़ाइल',
    lotCode: 'लॉट कोड',
    collectorName: 'संग्राहक / कबाड़ीवाला',
    approxWeight: 'अनुमानित वजन (कि.ग्रा.)',
    offeredRate: 'प्रस्तावित दर (₹/कि.ग्रा.)',
    totalAmount: 'कुल देय राशि',
    acceptLot: 'लॉट स्वीकार करें',
    rejectLot: 'अस्वीकार करें',
    counterOffer: 'काउंटर दर दें',
    broadcastRates: 'सभी कबाड़ीवालों को नए दर प्रसारित करें',
    downloadForm2: 'सीपीसीबी फॉर्म-२ (JSON) डाउनलोड करें',
    downloadForm6: 'सीपीसीबी फॉर्म-६ (CSV) डाउनलोड करें',
    facilityRegStatus: 'सीपीसीबी ईपीआर पंजीकरण सक्रिय',

    tabOverview: 'शहर का समग्र अवलोकन',
    tabTraceability: 'सामग्री ट्रेसेबिलिटी श्रृंखला',
    tabUnitEconomics: 'इकाई-अर्थशास्त्र कैलकुलेटर',
    tabVerifications: 'कबाड़ीवाला केवाईसी सत्यापन',
    tabEpr: 'सीपीसीबी २०२२ स्कीमा निर्यात',
    citywideTonnage: 'कुल डायवर्ट किया गया ई-कचरा',
    activeCollectors: 'पंजीकृत औपचारिक कबाड़ीवाले',
    authorizedSmelters: 'सीपीसीबी अधिकृत रीसाइक्लिंग संयंत्र',
    monthlyVolume: 'मासिक कबाड़ीवाला संकलन (कि.ग्रा.)',
    middlemanCut: 'हटाया गया बिचौलियों का मार्जिन',
    incomeBoost: 'कबाड़ीवाले की आय में शुद्ध वृद्धि',
    approveKyc: 'स्वीकृत करें एवं सीपीसीबी बैज जारी करें',
    rejectKyc: 'अस्वीकार करें',
    traceabilityTitle: 'एसएचए-२५६ क्रिप्टोग्राफिक हैश सहित ४-चरणीय ट्रेसेबिलिटी',
    acceptPickup: 'पिकअप स्वीकार करें',
    citizenName: 'नागरिक',
    estimatedPayout: 'अनुमानित भुगतान',
    itemsDeclared: 'दर्ज कबाड़ सामान'
  },
  mr: {
    appName: 'कबाडीवाला कनेक्ट',
    tagline: 'ई-कचरा मागोवा आणि ईपीआर मंच',
    dhatuTag: 'धातु — ई-कचरा मागोवा आणि औपचारिकीकरण व्यासपीठ',
    dhatuSub: 'धातु — भंगार गोळा करणारे व अधिकृत रीसायकलर व्यासपीठ',
    sihBadge: 'SIH26229',
    sihSub: 'खाण मंत्रालय — अनौपचारिक ई-कचरा एकत्रीकरण उपक्रम',
    activeTerminal: 'सक्रिय टर्मिनल',
    switchRole: 'भूमिका पोर्टल बदला',
    signIn: 'पोर्टलमध्ये प्रवेश',
    signInBtn: 'पोर्टलमध्ये लॉगिन करा',
    signOut: 'लॉगआउट करा',
    langSelect: 'भाषा बदला',
    listen: 'ऐका',
    stop: 'आवाज थांबवा',

    portalCitizen: 'नागरिक पोर्टल',
    portalCollector: 'भंगार संग्राहक',
    portalRecycler: 'पुनर्चक्रणकर्ता / रीसायकलर',
    portalAdmin: 'प्रशासन / सीपीसीबी तपासणी',
    roleCitizen: 'नागरिक / घरगुती ग्राहक',
    roleCollector: 'भंगार संग्राहक / कबाडीवाला',
    roleRecycler: 'अधिकृत रीसायकलर / प्रकल्प',
    roleAdmin: 'प्रशासन / सीपीसीबी तपासणी',
    personaCitizen: 'रमेश शर्मा',
    personaCollector: 'सुरेश कुमार',
    personaRecycler: 'इको-रीसायकल ॲग्रिगेटर्स लिमिटेड',
    personaAdmin: 'एनडीएमसी कचरा व खाण कक्ष',

    heroTitle: "धातु — भारताच्या ई-कचरा अर्थव्यवस्थेसाठी डिजिटल मागोवा व ईपीआर मंच",
    heroSubtitle: "घरोघरी भंगार गोळा करणाऱ्यांना अधिकृत सीपीसीबी रीसायकलर्सशी जोडणारे. कमी साक्षरता, इंटरनेट नसतानाही चालणारी प्रणाली आणि बहुभाषिक नोंदवहीवर आधारित.",
    roleBasedLogin: 'भूमिका निहाय लॉगिन करा',
    sourcingLayer: 'सोर्सिंग स्तर (रमेश)',
    coreAsk: 'मुख्य उद्दिष्ट (SIH26229)',
    formalSide: 'औपचारिक रीसायकलिंग स्तर',
    regulatoryLayer: 'नियामक डेटा स्तर',
    citizenCardDesc: 'घरोघरी ई-कचरा संकलन विनंती करा, त्वरित अंदाजे भाव पहा, थेट ट्रॅकिंग आणि वृक्षारोपण देणगी नोंदवा.',
    collectorCardDesc: 'बोलणारा भाव फलक, सोपे लॉट तयार करणे, क्यूआर पावती, रोख नोंदवही (पासबुक) आणि सुरक्षा नियम.',
    recyclerCardDesc: 'येणाऱ्या लॉटची तपासणी (स्वीकारा/नाकारा), क्यूआर स्कॅन, थेट भाव प्रसारण आणि सीपीसीबी फॉर्म-२ व फॉर्म-६ अहवाल.',
    adminCardDesc: 'शहरस्तरीय आकडेवारी, एसएचए-२५६ सह ४-टप्प्यातील मागोवा आणि कबाडीवाला केवायसी पडताळणी.',
    enterAsCitizen: 'नागरिक म्हणून प्रवेश करा',
    enterAsCollector: 'संग्राहक म्हणून प्रवेश करा',
    enterAsRecycler: 'रीसायकलर म्हणून प्रवेश करा',
    enterAsAdmin: 'प्रशासन म्हणून प्रवेश करा',

    authGateway: 'भूमिका आधारित प्रमाणीकरण गेटवे',
    selectRole: 'आपली भूमिका निवडा',
    loginSubtitle: 'कबाडीवाला कनेक्ट भारताच्या ई-कचरा पुनर्प्रक्रिया साखळीतील प्रत्येक घटकासाठी स्वतंत्र डॅशबोर्ड उपलब्ध करून देतो.',
    instantLogin: 'एका क्लिकवर त्वरित लॉगिन -',
    orCredentials: 'किंवा आपली माहिती प्रविष्ट करा',
    mobileNumber: 'नोंदणीकृत मोबाइल क्रमांक',
    cpcbRegNumber: 'सीपीसीबी प्रकल्प नोंदणी क्रमांक / मोबाइल',
    password: 'सुरक्षा पासवर्ड किंवा ४-अंकी पिन',
    submitLogin: 'सबमिट करा आणि डॅशबोर्ड उघडा',
    dedicatedFeatures: 'या पोर्टलची प्रमुख वैशिष्ट्ये',
    activeTabBadge: 'सक्रिय',

    status: 'स्थिती',
    actions: 'कृती',
    submit: 'सबमिट करा',
    cancel: 'रद्द करा',
    save: 'जतन करा',
    back: 'मागे जा',
    delete: 'हटवा',
    loading: 'लोड होत आहे...',
    verified: 'प्रमाणित',
    pending: 'प्रलंबित',
    completed: 'पूर्ण झाले',
    assigned: 'संग्राहक नेमला',
    inProgress: 'सुरू आहे',
    requested: 'विनंती प्राप्त',
    accepted: 'स्वीकारले',
    rejected: 'नाकारले',
    viewDetails: 'तपशील पहा',
    close: 'बंद करा',
    date: 'दिनांक',
    weight: 'वजन',
    amount: 'रक्कम',
    total: 'एकूण बेरीज',
    ratePerKg: 'दर प्रति किलो',
    perKg: 'प्रति किलो',
    estValue: 'अंदाजे किंमत',
    mandiRate: 'बाजार भाव दर',
    itemMaterial: 'वस्तू / सामग्री (English Trade Term)',

    tabMyPickups: 'माझ्या संकलन विनंत्या',
    tabSchedulePickup: 'संकलन बुक करा',
    tabImpact: 'पर्यावरण प्रभाव व वृक्ष',
    tabDropoff: 'जवळची केंद्रे',
    pickupAddress: 'संकलनाचा पत्ता',
    scheduledTime: 'नियोजित दिनांक व वेळ',
    notesCarton: 'वस्तूंचे वर्णन / टीप',
    itemsToRecycle: 'ई-कचरा वस्तू (English Trade Terms)',
    addMoreItems: 'आणखी वस्तू जोडा',
    scanAiPhoto: 'एआय कॅमेऱ्याने स्कॅन करा',
    indicativePriceRange: 'अंदाजे किंमत श्रेणी',
    confirmPickup: 'खात्री करा व विनंती पाठवा',
    collectorTracking: 'संग्राहक येत आहे',
    collectorEta: 'अंदाजे आगमन: १२ मिनिटांत',
    viewReceipt: 'प्रमाणित डिजिटल पावती पहा',
    downloadCert: 'सुरक्षित विल्हेवाट प्रमाणपत्र डाउनलोड करा',
    csrDonationNote: 'वृक्षारोपणासाठी ही रक्कम ग्रीन अर्थ एनजीओला दान करा',
    treesPlanted: 'लावलेली झाडे',
    landfillDivertedKg: 'कि.ग्रा. ई-कचरा डेपोत जाण्यापासून वाचवला',
    dropoffTitle: 'सीपीसीबी अधिकृत ई-कचरा संकलन केंद्रे',

    tabLots: 'माझे लॉट',
    tabPriceBoard: 'बोलणारा भाव फलक',
    tabFindRecyclers: 'रीसायकलर शोधा',
    tabHandover: 'क्यूआर पावती बनवा',
    tabPassbook: 'जमा-खर्च नोंदवही',
    tabSafety: 'सुरक्षा नियम',
    createLot: 'नवीन लॉट तयार करा',
    selectScrapCategory: 'वस्तू प्रकार निवडा',
    lotWeightKg: 'लॉटचे वजन (कि.ग्रा.)',
    takePhotoProof: 'फोटो पुरावा घ्या',
    saveLot: 'खात्यात लॉट नोंदवा',
    listenPriceAloud: 'भाव ऐका',
    todayMandiRate: 'आजचा बाजार भाव',
    passbookBalance: 'चालू शिल्लक रक्कम',
    cashCollected: 'एकूण जमा रक्कम',
    totalSoldLots: 'एकूण पाठवलेले लॉट',
    runningLedger: 'रोख व लॉट व्यवहार नोंदवही',
    credit: 'जमा (+)',
    debit: 'नावे (-)',
    balance: 'शिल्लक',
    offlineTolerant: 'ऑफलाइन मोड सक्रिय (इंटरनेट नसतानाही लॉट जतन करा)',
    syncPending: 'सिंक बाकी असलेले लॉट',
    syncNow: 'आता सिंक करा',
    safetyRulesTitle: 'चित्रांसह बोलणारे सुरक्षा नियम',

    tabIncoming: 'येणारे लॉट',
    tabVerifyQr: 'हस्तांतरण क्यूआर तपासा',
    tabRateConsole: 'खरेदी दर नियंत्रण',
    tabAnomalies: 'एआय त्रुटी तपासणी',
    tabReports: 'सीपीसीबी ईपीआर अहवाल',
    tabFacility: 'प्रकल्प माहिती',
    lotCode: 'लॉट कोड',
    collectorName: 'भंगार संग्राहक',
    approxWeight: 'अंदाजे वजन (कि.ग्रा.)',
    offeredRate: 'दिलेला दर (₹/कि.ग्रा.)',
    totalAmount: 'एकूण देय रक्कम',
    acceptLot: 'लॉट स्वीकारा',
    rejectLot: 'नाकारा',
    counterOffer: 'पर्यायी दर द्या',
    broadcastRates: 'सर्व कबाडीवाल्यांना नवे दर पाठवा',
    downloadForm2: 'सीपीसीबी फॉर्म-२ (JSON) डाउनलोड करा',
    downloadForm6: 'सीपीसीबी फॉर्म-६ (CSV) डाउनलोड करा',
    facilityRegStatus: 'सीपीसीबी ईपीआर नोंदणी सक्रिय',

    tabOverview: 'शहरस्तरीय आढावा',
    tabTraceability: 'साहित्य मागोवा साखळी',
    tabUnitEconomics: 'आर्थिक नफा कॅल्क्युलेटर',
    tabVerifications: 'कबाडीवाला केवायसी पडताळणी',
    tabEpr: 'सीपीसीबी २०२२ डेटा निर्यात',
    citywideTonnage: 'एकूण गोळा केलेला ई-कचरा',
    activeCollectors: 'नोंदणीकृत भंगार संग्राहक',
    authorizedSmelters: 'सीपीसीबी अधिकृत रीसायकलिंग प्रकल्प',
    monthlyVolume: 'मासिक संकलन (कि.ग्रा.)',
    middlemanCut: 'कमी केलेले मध्यस्थांचे कमिशन',
    incomeBoost: 'संग्राहकाच्या उत्पन्नातील निव्वळ वाढ',
    approveKyc: 'मंजूर करा व सीपीसीबी बॅज द्या',
    rejectKyc: 'नाकारा',
    traceabilityTitle: 'एसएचए-२५६ सह ४-टप्प्यातील सामग्री मागोवा',
    acceptPickup: 'पिकअप स्वीकारा',
    citizenName: 'नागरिक',
    estimatedPayout: 'अंदाजे रक्कम',
    itemsDeclared: 'नोंदणी केलेले साहित्य'
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

  /**
   * Preserves scrap items being traded/sold STRICTLY IN ENGLISH.
   * As requested: "when i click on any language i want everything to be in that language except stuff being sold which must only be shown in english"
   */
  const preserveEnglishItemName = (name: string): string => {
    if (!name) return '';
    return KNOWN_ENGLISH_SCRAP_ITEMS[name] || name;
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
        formatCurrency,
        preserveEnglishItemName
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
