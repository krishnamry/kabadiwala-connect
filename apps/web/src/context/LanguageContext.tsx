import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';

export type Language = 'en' | 'hi' | 'mr';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, fallback?: string, params?: Record<string, string | number>) => string;
  speak: (text: string, langOverride?: Language) => void;
  stopSpeaking: () => void;
  isSpeaking: boolean;
  formatCurrency: (amount: number) => string;
  preserveEnglishItemName: (name: string) => string;
  getLocalizedItemName: (name: string) => string;
  translateStatus: (status: string) => string;
}

export interface ScrapItemLocalization {
  en: string;
  hi: string;
  mr: string;
}

// Authentic Vernacular Scrap Material Dictionaries
export const SCRAP_ITEM_TRANSLATIONS: Record<string, ScrapItemLocalization> = {
  // PCBs
  'printed circuit boards (pcbs)': {
    en: 'Printed Circuit Boards (PCBs)',
    hi: 'प्रिंटेड सर्किट बोर्ड (PCBs)',
    mr: 'प्रिंटेड सर्किट बोर्ड (PCBs)'
  },
  'high-grade server pcbs': {
    en: 'High-Grade Server PCBs',
    hi: 'उच्च-श्रेणी सर्वर पीसीबी (मदरबोर्ड)',
    mr: 'उच्च दर्जाचे सर्व्हर पीसीबी (मदरबोर्ड)'
  },
  'high-grade printed circuit boards (pcbs)': {
    en: 'High-grade Printed Circuit Boards (PCBs)',
    hi: 'उच्च-श्रेणी सर्वर पीसीबी (मदरबोर्ड/रैम)',
    mr: 'उच्च दर्जाचे सर्व्हर पीसीबी (मदरबोर्ड/रॅम)'
  },
  'high-grade pcb (motherboard/ram)': {
    en: 'High-grade PCB (Motherboard/RAM)',
    hi: 'उच्च-श्रेणी पीसीबी (मदरबोर्ड/रैम)',
    mr: 'उच्च दर्जाचे पीसीबी (मदरबोर्ड/रॅम)'
  },
  'high-grade pcb (motherboards/servers)': {
    en: 'High-grade PCB (Motherboards/Servers)',
    hi: 'सर्वर पीसीबी (मदरबोर्ड/सर्वर)',
    mr: 'सर्व्हर पीसीबी (मदरबोर्ड/सर्व्हर)'
  },
  'low-grade printed circuit boards (pcbs)': {
    en: 'Low-grade Printed Circuit Boards (PCBs)',
    hi: 'घरेलू इलेक्ट्रॉनिक्स पीसीबी',
    mr: 'घरगुती इलेक्ट्रॉनिक्स पीसीबी'
  },
  'low-grade pcb (consumer electronics)': {
    en: 'Low-grade PCB (Consumer Electronics)',
    hi: 'घरेलू इलेक्ट्रॉनिक्स पीसीबी (टीवी/ऑडियो)',
    mr: 'घरगुती इलेक्ट्रॉनिक्स पीसीबी (टीव्ही/ऑडिओ)'
  },
  'low-grade pcb (power supplies/tv)': {
    en: 'Low-grade PCB (Power Supplies/TV)',
    hi: 'साधारण पीसीबी (पावर सप्लाई/टीवी)',
    mr: 'साधारण पीसीबी (पॉवर सप्लाय/टीव्ही)'
  },
  'pcbs': {
    en: 'Printed Circuit Boards (PCBs)',
    hi: 'प्रिंटेड सर्किट बोर्ड (PCBs)',
    mr: 'प्रिंटेड सर्किट बोर्ड (PCBs)'
  },
  'pcbs & logic boards': {
    en: 'Printed Circuit Boards & Logic Boards',
    hi: 'सर्किट बोर्ड एवं लॉजिक बोर्ड',
    mr: 'सर्किट बोर्ड व लॉजिक बोर्ड'
  },
  // Copper
  'copper cables & insulated wires': {
    en: 'Copper Cables & Insulated Wires',
    hi: 'तांबे के तार एवं इंसुलेटेड केबल',
    mr: 'तांब्याची वायर व इन्सुलेटेड केबल्स'
  },
  'clean peeled copper wire': {
    en: 'Clean Peeled Copper Wire',
    hi: 'छिला हुआ शुद्ध तांबा तार (ब्राइट)',
    mr: 'सोललेली शुद्ध तांब्याची वायर'
  },
  'clean copper wire (bright strip)': {
    en: 'Clean Copper Wire (Bright Strip)',
    hi: 'साफ तांबा तार (ब्राइट स्ट्रिप)',
    mr: 'स्वच्छ तांब्याची तार (सोलेली)'
  },
  'copper wiring (clean bright)': {
    en: 'Copper Wiring (Clean Bright)',
    hi: 'शुद्ध तांबा वायरिंग (ब्राइट)',
    mr: 'शुद्ध तांब्याची वायरिंग (चमकदार)'
  },
  'copper cables & winding': {
    en: 'Copper Cables & Winding',
    hi: 'तांबे के केबल एवं वाइंडिंग तार',
    mr: 'तांब्याचे केबल्स व वाइंडिंग वायर'
  },
  'copper wire': {
    en: 'Copper Wire',
    hi: 'तांबे का तार',
    mr: 'तांब्याची वायर'
  },
  'cables': {
    en: 'Copper Cables & Wires',
    hi: 'तांबे के केबल एवं तार',
    mr: 'तांब्याचे केबल्स व वायर'
  },
  // Batteries
  'lithium-ion batteries': {
    en: 'Lithium-ion Batteries',
    hi: 'लिथियम-आयन बैटरी (लैपटॉप/मोबाइल)',
    mr: 'लिथियम-आयन बॅटरी (लॅपटॉप/मोबाईल)'
  },
  'lithium-ion battery packs': {
    en: 'Lithium-ion Battery Packs',
    hi: 'लिथियम-आयन बैटरी पैक',
    mr: 'लिथियम-आयन बॅटरी पॅक्स'
  },
  'lithium-ion batteries (laptop/ev)': {
    en: 'Lithium-ion Batteries (Laptop/EV)',
    hi: 'लिथियम-आयन बैटरी (लैपटॉप/ईवी)',
    mr: 'लिथियम-आयन बॅटऱ्या (लॅपटॉप/ईव्ही)'
  },
  'li-ion batteries (laptops/ev)': {
    en: 'Li-ion Batteries (Laptops/EV)',
    hi: 'लिथियम-आयन बैटरी (लैपटॉप/ईवी)',
    mr: 'लिथियम-आयन बॅटरी (लॅपटॉप/ईव्ही)'
  },
  'li-ion batteries': {
    en: 'Lithium-ion Batteries',
    hi: 'लिथियम-आयन बैटरी',
    mr: 'लिथियम-आयन बॅटरी'
  },
  'batteries': {
    en: 'Lithium-ion Batteries',
    hi: 'लिथियम-आयन बैटरी',
    mr: 'लिथियम-आयन बॅटरी'
  },
  'lead acid batteries': {
    en: 'Lead Acid Batteries',
    hi: 'लेड एसिड इन्वर्टर बैटरी',
    mr: 'लेड अ‍ॅसिड इन्व्हर्टर बॅटरी'
  },
  // Motors & Compressors
  'electric motors & compressors': {
    en: 'Electric Motors & Compressors',
    hi: 'इलेक्ट्रिक मोटर एवं कंप्रेसर',
    mr: 'इलेक्ट्रिक मोटर्स व कॉम्प्रेसर'
  },
  'electric motors & magnets': {
    en: 'Electric Motors & Magnets',
    hi: 'इलेक्ट्रिक मोटर एवं चुंबक',
    mr: 'इलेक्ट्रिक मोटर्स आणि चुंबक'
  },
  'electric motors & transformer coils': {
    en: 'Electric Motors & Transformer Coils',
    hi: 'इलेक्ट्रिक मोटर एवं ट्रांसफॉर्मर कॉइल',
    mr: 'इलेक्ट्रिक मोटर्स व ट्रान्सफॉर्मर कॉइल'
  },
  // Displays & Glass
  'lcd/led display panels': {
    en: 'LCD/LED Display Panels',
    hi: 'एलसीडी/एलईडी डिस्प्ले स्क्रीन',
    mr: 'एलसीडी/एलईडी डिस्प्ले स्क्रीन'
  },
  'lcd & led display panels': {
    en: 'LCD & LED Display Panels',
    hi: 'एलसीडी और एलईडी डिस्प्ले पैनल',
    mr: 'एलसीडी आणि एलईडी डिस्प्ले पॅनेल्स'
  },
  'crt monitor glass unit': {
    en: 'CRT Monitor Glass Unit',
    hi: 'सीआरटी मॉनिटर ग्लास (शीशा)',
    mr: 'सीआरटी मॉनिटर काच युनिट'
  },
  'crt monitor glass (treated)': {
    en: 'CRT Monitor Glass (Treated)',
    hi: 'सीआरटी कांच (उपचारित शीशा)',
    mr: 'सीआरटी काच (प्रक्रिया केलेले)'
  },
  'crt glass (funnel treated)': {
    en: 'CRT Glass (Funnel Treated)',
    hi: 'सीआरटी कांच (फनल शीशा)',
    mr: 'सीआरटी काच (फनेल प्रक्रिया)'
  },
  'crt monitor glass': {
    en: 'CRT Monitor Glass Unit',
    hi: 'सीआरटी मॉनिटर ग्लास',
    mr: 'सीआरटी मॉनिटर काच'
  },
  'crt screens': {
    en: 'CRT Monitor Screens',
    hi: 'सीआरटी मॉनिटर स्क्रीन',
    mr: 'सीआरटी मॉनिटर स्क्रीन'
  },
  // Plastics
  'engineering e-plastics (abs/hips)': {
    en: 'Engineering E-Plastics (ABS/HIPS)',
    hi: 'इंजीनियरिंग ई-प्लास्टिक (ABS/HIPS कैबिनेट)',
    mr: 'अभियांत्रिकी ई-प्लास्टिक (ABS/HIPS कव्हर्स)'
  },
  'engineering plastics (abs/hips)': {
    en: 'Engineering Plastics (ABS/HIPS)',
    hi: 'इंजीनियरिंग प्लास्टिक (ABS/HIPS)',
    mr: 'अभियांत्रिकी प्लास्टिक (ABS/HIPS)'
  },
  'engineering e-plastics': {
    en: 'Engineering E-Plastics (ABS/HIPS)',
    hi: 'इंजीनियरिंग ई-प्लास्टिक',
    mr: 'अभियांत्रिकी ई-प्लास्टिक'
  },
  // Devices & Sub-assemblies
  'smartphones & tablets': {
    en: 'Smartphones & Tablets',
    hi: 'स्मार्टफोन एवं टैबलेट',
    mr: 'स्मार्टफोन व टॅबलेट'
  },
  'server grade motherboards': {
    en: 'Server Grade Motherboards',
    hi: 'सर्वर ग्रेड मदरबोर्ड',
    mr: 'सर्व्हर ग्रेड मदरबोर्ड'
  },
  'telecom relay units': {
    en: 'Telecom Relay Units',
    hi: 'टेलीकॉम रिले यूनिट्स',
    mr: 'टेलिकॉम रिले युनिट्स'
  },
  'aluminium heat sinks': {
    en: 'Aluminium Heat Sinks',
    hi: 'एल्यूमीनियम हीट सिंक',
    mr: 'अ‍ॅल्युमिनियम हीट सिंक'
  },
  'brass transformers': {
    en: 'Brass Transformers',
    hi: 'पीतल/तांबा ट्रांसफॉर्मर',
    mr: 'पितळ/तांबे ट्रान्सफॉर्मर'
  },
  'power supply units (smps)': {
    en: 'Power Supply Units (SMPS)',
    hi: 'पावर सप्लाई यूनिट (SMPS)',
    mr: 'पॉवर सप्लाय युनिट (SMPS)'
  },
  'smps': {
    en: 'Power Supply Units (SMPS)',
    hi: 'पावर सप्लाई यूनिट (SMPS)',
    mr: 'पॉवर सप्लाय युनिट (SMPS)'
  },
  'custom mixed lot': {
    en: 'Custom Mixed Lot',
    hi: 'मिश्रित ई-कचरा लॉट',
    mr: 'मिश्र ई-कचरा लॉट'
  },
  // Inverters, UPS, Appliances & Consumer Electronics
  'inverters & ups': {
    en: 'Inverters & UPS Units',
    hi: 'इनवर्टर एवं यूपीएस यूनिट',
    mr: 'इन्व्हर्टर आणि यूपीएस युनिट्स'
  },
  'inverter': {
    en: 'Inverters & UPS',
    hi: 'इनवर्टर एवं यूपीएस',
    mr: 'इन्व्हर्टर व यूपीएस'
  },
  'ups': {
    en: 'UPS Units',
    hi: 'यूपीएस यूनिट',
    mr: 'यूपीएस युनिट'
  },
  'voltage stabilizers': {
    en: 'Voltage Stabilizers',
    hi: 'वोल्टेज स्टेबलाइज़र',
    mr: 'व्होल्टेज स्टॅबिलायझर'
  },
  'stabilizers': {
    en: 'Voltage Stabilizers',
    hi: 'वोल्टेज स्टेबलाइज़र',
    mr: 'व्होल्टेज स्टॅबिलायझर'
  },
  'microwaves & ovens': {
    en: 'Microwaves & Ovens',
    hi: 'माइक्रोवेव एवं ओवन',
    mr: 'मायक्रोवेव्ह आणि ओव्हन'
  },
  'old microwave': {
    en: 'Old Microwave Oven',
    hi: 'पुराना माइक्रोवेव ओवन',
    mr: 'जुना मायक्रोवेव्ह ओव्हन'
  },
  'microwave': {
    en: 'Microwave Oven',
    hi: 'माइक्रोवेव ओवन',
    mr: 'मायक्रोवेव्ह ओव्हन'
  },
  'crt televisions': {
    en: 'CRT Televisions',
    hi: 'सीआरटी टेलीविजन (पुराना टीवी)',
    mr: 'सीआरटी टेलिव्हिजन (जुना टीव्ही)'
  },
  'crt tv': {
    en: 'CRT Television',
    hi: 'सीआरटी टीवी',
    mr: 'सीआरटी टीव्ही'
  },
  'washing machines & fridges': {
    en: 'Washing Machines & Fridges',
    hi: 'वाशिंग मशीन एवं फ्रिज',
    mr: 'वॉशिंग मशीन आणि फ्रीज'
  },
  'washing machine': {
    en: 'Washing Machine Scrap',
    hi: 'वाशिंग मशीन स्क्रैप',
    mr: 'वॉशिंग मशीन स्क्रॅप'
  },
  'refrigerator': {
    en: 'Refrigerator Compressor & Scrap',
    hi: 'फ्रिज कंप्रेसर एवं स्क्रैप',
    mr: 'फ्रीज कॉम्प्रेसर आणि स्क्रॅप'
  },
  'air conditioners & ac units': {
    en: 'Air Conditioners & AC Units',
    hi: 'एयर कंडीशनर (AC) एवं तांबा कॉइल',
    mr: 'एअर कंडिशनर (AC) व तांबे कॉइल'
  },
  'air conditioner': {
    en: 'Air Conditioner Unit',
    hi: 'एयर कंडीशनर यूनिट',
    mr: 'एअर कंडिशनर युनिट'
  },
  'printers & scanners': {
    en: 'Printers & Scanners',
    hi: 'प्रिंटर एवं स्कैनर',
    mr: 'प्रिंटर आणि स्कॅनर'
  },
  'printer': {
    en: 'Printers & Cartridges',
    hi: 'प्रिंटर एवं कार्ट्रिज',
    mr: 'प्रिंटर आणि कार्ट्रिज'
  },
  'desktop cpu towers': {
    en: 'Desktop CPU Towers',
    hi: 'कंप्यूटर सीपीयू कैबिनेट (डेस्कटॉप)',
    mr: 'संगणक सीपीयू कॅबिनेट (डेस्कटॉप)'
  },
  'cpu': {
    en: 'Desktop CPU Towers',
    hi: 'कंप्यूटर सीपीयू',
    mr: 'संगणक सीपीयू'
  },
  'laptops & notebooks': {
    en: 'Laptops & Notebooks',
    hi: 'लैपटॉप एवं नोटबुक',
    mr: 'लॅपटॉप आणि नोटबुक'
  },
  'laptop': {
    en: 'Laptop Scrap',
    hi: 'पुराना लैपटॉप',
    mr: 'जुना लॅपटॉप'
  },
  'mobile phones': {
    en: 'Mobile Phones & Smartphones',
    hi: 'मोबाइल फोन एवं स्मार्टफोन',
    mr: 'मोबाईल फोन आणि स्मार्टफोन'
  },
  'medical equipment & pcbs': {
    en: 'Medical Equipment & PCBs',
    hi: 'चिकित्सा उपकरण एवं पीसीबी',
    mr: 'वैद्यकीय उपकरणे व पीसीबी'
  },
  'sound systems & speakers': {
    en: 'Sound Systems & Speakers',
    hi: 'साउंड सिस्टम एवं स्पीकर',
    mr: 'साउंड सिस्टम आणि स्पीकर्स'
  },
  'mixed electrical wires': {
    en: 'Mixed Electrical Wires',
    hi: 'मिश्रित बिजली के तार',
    mr: 'मिश्र विजेच्या तारा'
  },
  'other / custom product': {
    en: 'Other / Custom Product',
    hi: 'अन्य / कस्टम उत्पाद',
    mr: 'इतर / सानुकूल उत्पादन'
  },
  'custom e-waste': {
    en: 'Custom E-Waste Item',
    hi: 'कस्टम ई-कचरा उत्पाद',
    mr: 'सानुकूल ई-कचरा वस्तू'
  }
};

// Comprehensive, authentic multi-language dictionaries
const translations: Record<Language, Record<string, string>> = {
  en: {
    // Brand & Ecosystem
    appName: 'Kabadiwala Connect',
    tagline: 'e-Waste Traceability & EPR Exchange',
    dhatuTag: 'Dhatu — e-Waste Traceability & Formalization',
    dhatuSub: 'Smart Informal Scrap & Formal Recycler Ecosystem',
    sihBadge: 'SIH26229',
    sihSub: 'Ministry of Mines — Informal e-Waste Integration',
    activeTerminal: 'Active Terminal',
    switchRole: 'Switch Role Portal',
    signIn: 'Sign In',
    signInBtn: 'Sign In to Dedicated Portal',
    signOut: 'Sign Out',
    langSelect: 'Change Language',
    selectLanguage: 'Select Language',
    listen: 'Listen aloud',
    stop: 'Stop audio',
    initializing: 'Initializing Dhatu Ecosystem...',
    personalDetails: 'Personal Details',
    personalDetailsDesc: 'Name, contact & pickup address',
    securityAccess: 'Security & Access',
    securityAccessDesc: 'PIN, biometrics & 2FA protection',
    helpSupport: 'Help & Support',
    helpSupportDesc: '24/7 Helpline, WhatsApp & nodal officer',
    supportTitle: 'Help & Customer Support',
    inDevelopment: 'Feature In Active Development',
    supportDesc: 'An integrated real-time ticketing console and AI dispute mediator are actively being built for upcoming releases. Direct helpline channels, email desks, and emergency WhatsApp support are operational below.',
    settingsDesc: 'Themes, display, voice & data',

    // Portals & Roles
    portalCitizen: 'Citizen Portal',
    portalCollector: 'Collector Portal',
    portalRecycler: 'Authorized Recycler',
    portalAdmin: 'Admin & CPCB Audit',
    roleCitizen: 'Citizen & Household',
    roleCollector: 'Doorstep Scrap Collector',
    roleRecycler: 'Authorized Recycler',
    roleAdmin: 'Admin & Regulatory Audit',
    personaCitizen: 'Ramesh Sharma',
    personaCollector: 'Suresh Kumar',
    personaRecycler: 'EcoRecycle Aggregators Ltd',
    personaAdmin: 'NDMC Waste & Mines Cell',

    // Landing Page
    heroTitle: "Dhatu — Digital Traceability & EPR Exchange for India's e-Waste Economy",
    heroSubtitle: "Bridging informal door-to-door scrap collectors with formal CPCB smelters. Built on a low-literacy, offline-tolerant passbook architecture with verifiable digital handovers.",
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

    // Auth Gateway
    authGateway: 'Role-Based Authentication Gateway',
    selectRole: 'Select Your Role',
    loginSubtitle: "Kabadiwala Connect provides a dedicated, purpose-built interface for each stakeholder in India's formal e-waste chain.",
    instantLogin: '1-Click Instant Login as',
    orCredentials: 'Or Enter Credentials',
    mobileNumber: 'Mobile Number',
    cpcbRegNumber: 'CPCB Facility Reg Number / Mobile',
    password: 'Password or PIN',
    submitLogin: 'Submit & Open Dashboard',
    dedicatedFeatures: 'Dedicated Features for this Portal',
    activeTabBadge: 'ACTIVE',

    // Common Verbs & Labels
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
    itemMaterial: 'Item / Material',
    refreshBtn: 'Refresh',
    callBtn: 'Call',
    openQr: 'Open QR',

    // Citizen Portal
    tabMyPickups: 'My Pickups & Live ETA',
    tabSchedulePickup: 'Book e-Waste Pickup',
    tabImpact: 'Impact & CSR Donation',
    tabDropoff: 'Drop-off Centers',
    pickupAddress: 'Pickup Address',
    scheduledTime: 'Scheduled Date & Time',
    notesCarton: 'Notes & Description',
    itemsToRecycle: 'E-Waste Items to Recycle',
    addMoreItems: 'Add Item',
    totalItems: 'Total Items',
    totalUnits: 'Total Units',
    qty: 'Qty',
    quantity: 'Quantity (Pieces / Units)',
    pieces: 'pieces',
    units: 'units',
    optionalPieceCount: 'Count of individual pieces/units',
    commodityBenchmark: 'COMMODITY BENCHMARK',
    ministryOfMinesTag: 'Ministry of Mines — Informal e-Waste Integration',
    highGradePCBs: 'High-Grade PCBs',
    cleanCopperWire: 'Clean Copper Wire',
    lithiumBatteries: 'Li-ion Batteries',
    electricMotors: 'Electric Motors',
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
    yourPickupRequests: 'Your Pickup Requests',
    verifiedHandover: 'Verified Handover',
    callCollector: 'Call Collector',
    bookPickupHeader: 'Book Doorstep E-Waste Pickup',
    householdPickupBadge: 'Doorstep Pickup',
    aiPhotoScanner: 'AI Photo Scanner (Upload Photo for Auto-Classification)',
    priceRangeTitle: 'Indicative Market Price Range',
    donateToCsrLabel: 'Donate Scrap Value to Environmental NGO (Plant Trees)',
    confirmPickupBtn: 'Confirm & Request Doorstep Pickup',
    traceabilityGuarantee: 'Dhatu Traceability & Chain of Custody Guarantee',
    traceabilityBadge: 'Verified Chain',
    environmentalImpactHeader: 'Environmental Impact & Diversion Ledger',
    personalImpactTitle: 'Your Environmental & Landfill Diversion Impact',
    downloadCertBtn: 'Download Disposal Certificate',
    ewasteDiverted: 'E-Waste Diverted from Landfills',
    carbonSaved: 'Carbon Emissions Avoided',
    metalsRecycled: 'Precious Metals & Copper Recycled',
    csrCreditsEarned: 'CSR Green Credits Earned',
    selfDropoffTitle: 'Authorized E-Waste Drop-Off Centers',
    selfDropoffBadge: 'Self Drop-Off Option',
    verifiedReceiptModalTitle: 'Verified Digital Handover Receipt',

    // Collector Portal
    tabLots: 'Create Lot & AI Value',
    tabPriceBoard: 'Spoken Price Board',
    tabFindRecyclers: 'Nearby Recyclers',
    tabHandover: 'Generate QR',
    tabPassbook: 'Cash Passbook',
    tabSafety: 'Safety Guidance',
    // Mobile Bottom Navigation (Short 1-word thumb labels)
    mNavLots: 'Lots',
    mNavPrices: 'Prices',
    mNavPickups: 'Pickups',
    mNavRecyclers: 'Recyclers',
    mNavPassbook: 'Passbook',
    mNavSafety: 'Safety',
    mNavMyPickups: 'Pickups',
    mNavBook: 'Book',
    mNavImpact: 'Impact',
    mNavDropoff: 'Centers',
    mNavIncoming: 'Lots',
    mNavVerify: 'Scan QR',
    mNavRates: 'Rates',
    mNavAnomalies: 'Alerts',
    mNavReports: 'Reports',
    mNavOverview: 'Overview',
    mNavTrace: 'Trace',
    mNavEconomics: 'Economics',
    mNavVerifyAdmin: 'Verify',
    pickups: 'Citizen Pickups',
    createLot: 'Create New Lot',
    createDigitalLot: 'Create Digital Lot',
    myCreatedLots: 'My Created Lots',
    lotCreationBadge: 'Lot Creation',
    digitalLotCreatorTitle: 'Digital E-Waste Lot Creator',
    lotCreatedSuccessTitle: 'Lot Registered Successfully!',
    lotTypeSelection: '1. Select Lot Configuration',
    singleMaterialLot: 'Single Material Lot',
    customMixedLot: 'Custom Mixed Lot',
    uploadPhotoLabel: '2. Upload or Capture Photograph',
    tapToSnapPhoto: 'Open Camera or Snap Photo',
    photoCapturedMsg: 'Photo Captured & Verified (1080p)',
    selectScrapCategory: '3. Select Item Category',
    approxWeightLabel: '4. Enter Approx Weight (Kilograms)',
    minWeightNote: 'Minimum 0.5 kg',
    lotLocationLabel: '5. Set Handover / Scrap Yard Location',
    lotLocationDesc: 'Specify where the recycler will inspect and pick up this lot.',
    detectLiveGps: 'Detect Live GPS',
    detectingLocation: 'Detecting Location...',
    presetScrapHub: 'Select Scrap Cluster Preset',
    customAddressPlaceholder: 'Enter yard address, shop number, or landmark...',
    handoverLocation: 'Handover Location',
    selectLocationMethod: 'Location Mode',
    liveGpsDetected: 'GPS Coordinates Verified',
    customAddress: 'Custom Address / Yard',
    quickPresets: 'Quick Scrap Hubs',
    instantAiValue: 'Instant AI Value Estimate',
    saveLot: 'Save Lot to Ledger',
    listenPriceAloud: 'Listen to Price Aloud',
    todayMandiRate: "Today's Mandi Benchmark Rate",
    passbookBalance: 'Passbook Balance',
    cashCollected: 'Total Cash Collected',
    totalSoldLots: 'Total Lots Dispatched',
    runningLedger: 'Cash & Lot Transaction Ledger',
    credit: 'Credit (+)',
    debit: 'Debit (-)',
    balance: 'Balance',
    offlineTolerant: 'Offline Mode Active (Zero Internet Needed)',
    syncPending: 'Lots Pending Sync',
    syncNow: 'Sync Now',
    syncPendingLots: 'Sync Pending Lots',
    offlineMode: 'Offline Mode',
    onlineMode: 'Online',
    offlineModeActive: 'Offline Mode Active:',
    offlineModeDesc: 'Lots are cached locally in your phone storage and queued for auto-sync.',
    operatingZone: 'Operating Zone: Pan-India Active Network',
    cashFirst: 'Cash-First Support',
    myCreatedLotsTitle: 'My Registered Digital Lots & Live Bids',
    myCreatedLotsDesc: 'All lots created by you, open recycler tenders, and price negotiation bids.',
    biddingRule: 'Recycler Bidding Rule: Min 50% of Ask Value',
    sellLotHere: 'Sell Lot to this Facility',
    nearbyRecyclersTitle: 'Authorized Recyclers & Smelters',
    handoverVoucherTitle: 'Digital Handover QR Voucher',
    handoverVoucherBadge: 'Digital Handover',
    handoverStepsTitle: '3 Easy Steps for Handover',
    step1Weight: 'Weight Check at Recycler Gate',
    step1Desc: 'Weigh items on calibrated electronic scale.',
    step2Scan: 'Scan Handover QR Code',
    step2Desc: 'Recycler operator scans voucher with their phone.',
    step3Pay: 'Receive Cash or Wallet Payout',
    step3Desc: 'Receive immediate cash or wallet escrow payment. Recorded in passbook.',
    formalizationBenefitTitle: 'Ministry of Mines Formalization Incentive:',
    formalizationBenefitDesc: 'Earn ₹500 formalization loyalty bonus for every verified digital lot handover.',
    passbookTitle: 'Collector Running Passbook Ledger',
    passbookBadge: 'Cash Passbook',
    thDate: 'Date',
    thDesc: 'Description',
    thParty: 'Party / Account',
    thMode: 'Mode',
    thAmount: 'Amount',
    thBalance: 'Balance',
    thStamp: 'Stamp',
    cashPaymentRule: 'Cash Payment Rule: All cash handovers are automatically stamped and logged into the running passbook.',
    downloadPassbookPdf: 'Download Passbook PDF',
    safetyCardsTitle: 'Safety Rules & Hazardous Practice Prevention',
    safetyBadge: 'Safety Guidance',
    cpcbSafetyGuidelines: 'CPCB Mandatory E-Waste Safety Guidelines',
    dosTitle: "DO'S:",
    dontsTitle: "DON'TS:",
    safetyQuote: 'Proper segregation protects worker health and yields up to 35% higher buyback value from formal smelters.',
    valuePreservationTitle: '4 Rules of Value-Preservation Disassembly for Maximum Earnings',
    valueBadge: 'Value Maximization Guide',
    step1Plastic: 'Step 1: Unscrew External Plastic',
    step1PlasticDesc: 'Remove clean ABS plastic housing without smashing screws (sells separately at ₹38/kg).',
    step2Pcb: 'Step 2: Keep Circuit Boards Whole',
    step2PcbDesc: 'High-grade motherboards sell at ₹640/kg when components and gold pins remain intact.',
    step3Copper: 'Step 3: Strip Copper Cold',
    step3CopperDesc: 'Extract copper windings using hand wire-strippers without open-flame burning (₹480/kg).',
    step4Battery: 'Step 4: Bag Batteries Separately',
    step4BatteryDesc: 'Keep lithium cells insulated in a dry bag to prevent punctures, sparks, or thermal runaways.',
    citizenPickupRequestsTitle: 'Nearby Citizen Pickup Requests',
    citizenPickupsBadge: 'Citizen Pickups',
    jobCompletedTitle: 'Job Completed!',
    activeJobBadge: 'IN PROGRESS',
    verifyWeightTitle: 'Verify & Adjust Final Weight:',
    completePickupBtn: 'Complete Pickup & Issue Digital Receipt',
    livePickupsMapTitle: 'Live e-Waste Pickups Map',
    mandiPriceBoardTitle: 'Live Material Benchmark Price Board',
    mandiPriceBoardSub: 'Live rates backed by international secondary metals exchange (London Metal Exchange + CPCB India).',
    mandiPriceBoardZone: 'National CPCB Zone Benchmark',
    thisWeek: 'this week',
    ledgerFirstTitle: 'Ledger-First Mental Model',
    ledgerFirstDesc: 'Collectors already trust physical passbooks. We digitize that exact metaphor with stamped receipts, running totals, and cash-first records rather than confusing SaaS abstractions.',
    voiceFirstTitle: 'Vernacular & Voice-First',
    voiceFirstDesc: 'Every critical price, weight, and safety hazard is narrated aloud in Hindi and Marathi via the Web Speech API. Large 48px touch targets for outdoor, gloved use.',
    offlineFirstTitle: 'Offline-Tolerant Engine',
    offlineFirstDesc: 'Create lots, check cached price boards, and generate handovers with zero cellular reception. Queued lots synchronize automatically upon reconnecting to cell towers.',

    // Recycler Portal
    tabIncoming: 'Incoming Collector Lots',
    tabVerifyQr: 'Confirm Handover (QR Scan)',
    tabRateConsole: 'Rate-Setting Console',
    tabAnomalies: 'AI Anomaly Flags',
    tabReports: 'CPCB EPR Compliance Reports',
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
    incomingLotsTitle: 'Incoming Collector Lots & Bidding Market',
    incomingLotsDesc: 'Bid for digital lots submitted by verified door-to-door collectors across India. Valid bids must be ≥ 50% of asking price.',
    allLots: 'All Lots',
    openForBids: 'Open for Bids',
    myBids: 'My Bids',
    handoverPending: 'Handover Pending',
    confirmed: 'Confirmed',
    acceptAsk: 'Accept Ask',
    decline: 'Decline',
    bidAcceptedMsg: 'Bid Accepted! Ready for physical QR scan.',

    // Admin Portal
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
    itemsDeclared: 'Declared Scrap Items',
    simulationControls: 'Simulation Controls',
    unitEconomicsBadge: 'Unit-Economics Calculator',
    platformSustainability: 'Platform Sustainability Model:',
    informalMarketLabel: 'Informal Scrap Market (Status Quo)',
    formalPlatformLabel: 'Kabadiwala Connect Platform (Formalized)',
    collectorKycTitle: 'Collector KYC Verification & Identity Cards',
    collectorKycBadge: 'KYC Verification',
    kycVerified: 'VERIFIED',
    kycPending: 'VERIFICATION PENDING',
    verifiedCollector: 'VERIFIED COLLECTOR',
    verifiedCitizen: 'VERIFIED CITIZEN',
    verifiedRecycler: 'AUTHORIZED RECYCLER',
    verifiedAdmin: 'REGULATORY AUTHORITY',

    // Custom Product & Multi-item Keys
    otherCustomProduct: 'Other / Custom Product (Type name)',
    enterProductName: 'Type Product Name (e.g. Old Microwave, Inverter)',
    productNamePlaceholder: 'e.g. Inverter, Microwave, Stabilizer, TV...',
    customRatePerKg: 'Expected Rate (₹/kg)',
    addCustomItem: 'Add Custom Item',
    pickupAddressPlaceholder: 'House/flat no., street name, locality, landmark, pincode...',
    fetchingLocation: 'Fetching...',
    fetchLocation: 'Fetch Location',
    locatingGps: 'Locating...',
    gpsBtn: 'GPS',
    locateBtn: 'Locate',
    pinConfirmsDoorstep: '✓ Pin confirms pickup doorstep. Tap anywhere or drag pin to fine-tune.',
    doorstepMapConfirm: 'Doorstep Location Map Confirmation',
    schedulePickupSlot: 'Schedule Pickup Slot',
    slotToday: 'Today',
    slotWithin2Hrs: 'Within 2 hrs',
    slotTomorrow: 'Tomorrow',
    slotWeekend: 'Weekend',
    slotSat11AM: 'Saturday 11 AM',
    addMaterialLineItems: 'Add Material Line Items',
    materialsInLot: 'Materials in Lot',
    materialType: 'Material Type',
    weightKg: 'Weight (kg)',
    customLotName: 'Custom Lot / Item Name',
    liveBenchmarkSub: 'Official CPCB market benchmark rates. Tap the speaker icon beside any item to hear the price aloud.',
    lastUpdatedToday: 'Last updated: Today 09:00 AM',
    currentPriceNotice: 'Live rates pulled from CPCB registered aggregators across India',
    treeDonationNotice: 'Funds 5 native tree saplings in national reforestation green corridors.',
    aiDetected: 'AI Detected:',
    confidenceMatch: 'confidence',
    priceStable: 'Price stable',
    priceIncreasedBy: 'Price increased by',
    rupeesPerKg: 'Rupees per kg',
    expectedRateNote: 'Expected or benchmark rate per kilogram',
    addItemToLot: 'Add Item to Lot',

    // Feedback & System Messages
    pleaseAddOneItem: 'Please add at least one e-waste item.',
    failedToCancelPickup: 'Failed to cancel pickup:',
    receiptPdfDownloaded: 'Receipt PDF downloaded! (CPCB EPR Compliant)',
    pleaseAddOneMaterial: 'Please add at least one material to the custom lot.',
    speechNotSupported: 'Speech synthesis is not supported in this browser.',

    // Additional Navigation & Settings
    settingsBtn: 'Settings (Themes, Display, Voice, Data)',
    settingsTitle: 'App Settings',
    settingsSubtitle: 'Personalize themes, display modes, voice & regional preferences',
    myProfile: 'My Profile & Security',
    mNavEpr: 'EPR',
    welcomeApp: 'Kabadiwala Connect',
    loginSubtitleApp: 'Smart Informal Waste & EPR Traceability Platform. Select your portal to continue.',
    portalCapabilities: 'Portal Features & Information',

    // Citizen Dashboard Pickups & Doorstep
    tabRequestPickup: 'Request Doorstep Pickup',
    tabGreenImpact: 'Green Impact & Carbon',
    'indicative payout:': 'Indicative Payout:',
    'HANDOVER COMPLETED': 'HANDOVER COMPLETED',
    'COLLECTOR DISPATCHED': 'COLLECTOR DISPATCHED',
    'LIVE ETA ESTIMATE': 'LIVE ETA ESTIMATE',
    'layer 1 verification: citizen handover otp': 'LAYER 1 VERIFICATION • DOORSTEP SCRAP HANDOVER',
    'SECURE OTP': 'SECURE OTP',
    'layer 1 verified: physical doorstep handover confirmed': 'Layer 1 Verified: Physical Doorstep Handover Confirmed',
    manualOrGps: 'Type address, paste link, or use map',
    gmapsLinkOpt: 'Google Maps Link',
    optional: 'optional',
    pasteLinkOrCoords: 'paste maps.app.goo.gl or coordinates',

    // Kabadiwala & Bidding
    bidsReceived: 'Bids',
    minAskRule: 'Min 50% of Ask Value',
    BIDDING: 'BIDDING OPEN',
    'layer 2: ai verified': 'Layer 2: AI Verified',
    items: 'types',
    blendedRate: 'Blended',
    askingPrice: 'Asking Price',
    'highestOffer:': 'Highest Offer:',
    acceptBid: 'Accept Bid',
    awaitingBids: 'Awaiting bids from nearby authorized aggregators.',

    // Profile & Security
    profileSaved: 'Personal details successfully updated!',
    pinLengthError: 'New PIN must be exactly 4 numeric digits.',
    pinMismatchError: 'New PIN and confirm PIN do not match.',
    pinSuccess: '4-digit security PIN updated successfully!',
    otherSessionsLoggedOut: 'All other active sessions on Web and Android have been invalidated.',
    eprTraceabilityTitle: 'EPR Traceability & Environmental Impact',
    eprTraceabilityDesc: 'Cryptographic SHA-256 material audit records and CPCB disposal certificate.',
    wasteDiverted: 'Waste Diverted',
    safeProcessing: 'Safe formal channel processing',
    co2ePrevented: 'CO2e Prevented',
    zeroBurning: 'Zero open burning emissions',
    csrEquivalent: 'CSR Equivalent',
    carbonOffset: 'Lifetime carbon offset matched',
    downloadJsonCert: 'Download JSON Certificate',
    tollFreeHelpline: 'TOLL-FREE HELPLINE (24/7)',
    tollFreeDesc: 'Free call from any Indian mobile/landline',
    emailAssistance: 'DIRECT EMAIL ASSISTANCE',
    emailDesc: 'Response SLA: < 2 business hours',
    whatsappSupport: 'WHATSAPP BOT & CHAT',
    whatsappDesc: 'Instant ticket raise & photo upload',
    nodalOfficer: 'NODAL ESCALATION OFFICER',
    nodalOfficerDesc: 'Ministry of Mines / CPCB Grievances',
    faqsTitle: 'FREQUENTLY ASKED QUESTIONS',
    personalInfoTitle: 'Personal Information & Location',
    personalInfoDesc: 'Verified mobile, official name, email, and confirmed pickup doorstep address.',
    fullName: 'Full Legal Name',
    registeredMobile: 'Registered Mobile',
    otpVerified: 'OTP Verified',
    emailAddress: 'Email Address',
    pickupWorkshopAddress: 'Pickup / Workshop Street Address',
    typeAddressHint: 'Type address, add link, or tap map',
    addressPlaceholder: 'House/unit no., street, locality, landmark, pincode...',
    locating: 'Locating...',
    savePersonalDetails: 'Save Personal Details',
    accountSecurity: 'Account Security & Credentials',
    accountSecurityDesc: 'Change your 4-digit rapid security PIN and manage biometric credentials.',
    currentPin: 'Current PIN',
    newPin: 'New 4-Digit PIN',
    confirmPin: 'Confirm New PIN',
    updatePinBtn: 'Update Security PIN',
    biometricUnlock: 'Biometric Unlock',
    biometricDesc: 'Use device fingerprint or face recognition for fast terminal access',
    twoFactorAuth: 'Two-Factor Authentication (2FA)',
    twoFactorDesc: 'Require SMS OTP verification for sensitive batch transfers and rate edits',
    logoutOtherDevices: 'Log Out All Other Devices',
    signOutActiveTerminal: 'Sign Out from Active Terminal',
    regulatoryStandards: 'Regulatory Standards:',

    // Recycler Dashboard
    totalProcessed: 'Total Processed',
    'q2-2026 batch': 'Q2-2026 Batch',
    pendingLots: 'Pending Lots',
    'from active collectors': 'Active Collectors',
    anomalies: 'Anomalies',
    'review required': 'Review Required',
    'no digital lots found matching this filter.': 'No digital lots found matching this filter.',
    'show all lots': 'Show All Lots',
    'BIDDING OPEN': 'BIDDING OPEN',
    'OPEN FOR BIDS': 'OPEN FOR BIDS',
    'COLLECTOR TENDER': 'COLLECTOR TENDER',
    minBid: 'MIN BID (50%)',
    'current top bid': 'CURRENT TOP BID',
    'No bids yet': 'No bids yet',
    'bids received': 'BIDS RECEIVED',
    'your bid:': 'Your Bid:',
    'Update Bid': 'Update Bid',
    Current: 'Current',
    'Place Bid': 'Place Bid',
    'Go to QR Handover Verification →': 'Go to QR Handover Verification →',

    // Settings
    cacheCleared: 'Local cache refreshed and datasets reset successfully.',
    displayAndThemes: 'Display Mode & Themes',
    displayThemesDesc: 'Choose light, dark, or automatic device theme, and select your Material 3 color palette.',
    chooseAppearance: '1. Choose Appearance Mode',
    accentPalette: '2. Material 3 Accent Color Palette',
    languageAndAccessibility: 'Language & Accessibility',
    languageAccessDesc: 'Set interface language, spoken audio assistance rate, and vibration feedback.',
    applicationLanguage: 'Application Language',
    hapticFeedback: 'Haptic Touch Feedback',
    hapticFeedbackDesc: 'Tactile pulses on buttons & actions',
    testVoice: 'Test Voice Assistance',
    testVoiceDesc: 'Spoken Hindi/Marathi audio preview',
    playAudio: 'Play Audio',
    dataStorageCompliance: 'Data, Storage & Compliance',
    dataStorageDesc: 'Offline local storage cache management and regulatory CPCB audit specs.',
    resetOfflineData: 'Reset Local Offline Datasets',
    resetOfflineDesc: 'Clears demo modifications and resets all offline lots, bookings, and ledger state to official CPCB benchmark seeds.',
    resetDataBtn: 'Reset Local Data',
    deviceSystemMode: 'Device System',
    deviceSystemDesc: 'Matches device preference (defaults to light mode)',
    lightModeLabel: 'Light',
    lightModeDesc: 'High clarity, bright daylight surface',
    darkModeLabel: 'Dark',
    darkModeDesc: 'High contrast deep slate for night use'
  },

  hi: {
    // Brand & Ecosystem
    appName: 'कबाड़ीवाला कनेक्ट',
    tagline: 'ई-कचरा ट्रेसेबिलिटी एवं ईपीआर एक्सचेंज',
    dhatuTag: 'धातु — ई-कचरा ट्रेसेबिलिटी एवं औपचारिकीकरण मंच',
    dhatuSub: 'धातु — अनौपचारिक स्क्रैप एवं अधिकृत रीसायकलर परिसंस्था',
    sihBadge: 'SIH26229',
    sihSub: 'खान मंत्रालय — अनौपचारिक ई-कचरा एकीकरण पहल',
    activeTerminal: 'सक्रिय टर्मिनल',
    switchRole: 'भूमिका पोर्टल बदलें',
    signIn: 'पोर्टल में प्रवेश',
    signInBtn: 'पोर्टल में लॉगिन करें',
    signOut: 'लॉगआउट करें',
    langSelect: 'भाषा बदलें',
    selectLanguage: 'भाषा चुनें',
    listen: 'आवाज़ सुनें',
    stop: 'ऑडियो रोकें',
    initializing: 'धातु सिस्टम प्रारंभ हो रहा है...',
    personalDetails: 'व्यक्तिगत विवरण',
    personalDetailsDesc: 'नाम, संपर्क एवं पिकअप पता',
    securityAccess: 'सुरक्षा एवं नियंत्रण',
    securityAccessDesc: 'पिन, बायोमेट्रिक्स एवं 2FA सुरक्षा',
    helpSupport: 'सहायता एवं संपर्क',
    helpSupportDesc: '24/7 हेल्पलाइन, व्हाट्सऐप एवं नोडल अधिकारी',
    supportTitle: 'सहायता एवं ग्राहक सेवा',
    inDevelopment: 'सुविधा सक्रिय विकास में है',
    supportDesc: 'आगामी रिलीज़ के लिए एक एकीकृत रियल-टाइम टिकटिंग कंसोल और एआई विवाद मध्यस्थ सक्रिय रूप से बनाए जा रहे हैं। सीधे हेल्पलाइन चैनल, ईमेल डेस्क और आपातकालीन व्हाट्सऐप सहायता नीचे चालू हैं।',
    settingsDesc: 'थीम, डिस्प्ले, आवाज़ एवं डेटा',

    // Portals & Roles
    portalCitizen: 'नागरिक पोर्टल',
    portalCollector: 'कबाड़ीवाला पोर्टल',
    portalRecycler: 'अधिकृत रीसायकलर',
    portalAdmin: 'प्रशासन एवं सीपीसीबी ऑडिट',
    roleCitizen: 'नागरिक एवं घरेलू उपभोक्ता',
    roleCollector: 'कबाड़ीवाला (द्वार-संग्राहक)',
    roleRecycler: 'अधिकृत रीसायकलर / एग्रीगेटर',
    roleAdmin: 'प्रशासन एवं विनियामक ऑडिट',
    personaCitizen: 'रमेश शर्मा',
    personaCollector: 'सुरेश कुमार',
    personaRecycler: 'इको-रीसायकल एग्रीगेटर्स लिमिटेड',
    personaAdmin: 'एनडीएमसी अपशिष्ट एवं खान प्रकोष्ठ',

    // Landing Page
    heroTitle: "धातु — भारत की ई-कचरा अर्थव्यवस्था हेतु डिजिटल ट्रेसेबिलिटी एवं ईपीआर मंच",
    heroSubtitle: "घर-घर जाने वाले कबाड़ीवालों को अधिकृत सीपीसीबी रीसायकलर्स से जोड़ना। कम साक्षरता, बिना इंटरनेट सुविधा और बहुभाषी नकद पासबुक पर आधारित डिजिटल प्रणाली।",
    roleBasedLogin: 'रोल अनुसार पोर्टल लॉगिन',
    sourcingLayer: 'सोर्सिंग स्तर (रमेश)',
    coreAsk: 'मुख्य उद्देश्य (SIH26229)',
    formalSide: 'औपचारिक रीसाइक्लिंग स्तर',
    regulatoryLayer: 'विनियामक डेटा स्तर',
    citizenCardDesc: 'घर बैठे ई-कचरा पिकअप बुक करें, तुरंत अनुमानित मूल्य देखें, कबाड़ीवाले की लाइव लोकेशन ट्रैक करें और ग्रीन ट्री क्रेडिट पाएं।',
    collectorCardDesc: 'बोलता दाम पत्रक, सरल लॉट निर्माण, क्यूआर कोड रसीद, नकद खाता बही (पासबुक) और सुरक्षा कार्ड।',
    recyclerCardDesc: 'आने वाले लॉट की जांच व बोली (स्वीकार/अस्वीकार), क्यूआर स्कैन, लाइव दाम प्रसारण और सीपीसीबी फॉर्म-2 एवं फॉर्म-6 रिपोर्ट।',
    adminCardDesc: 'शहर भर के आंकड़े, एसएचए-256 हैश सहित 4-चरणीय ट्रेसेबिलिटी और कबाड़ीवाला आधार केवाईसी सत्यापन।',
    enterAsCitizen: 'नागरिक के रूप में प्रवेश करें',
    enterAsCollector: 'कबाड़ीवाले के रूप में प्रवेश करें',
    enterAsRecycler: 'रीसायकलर के रूप में प्रवेश करें',
    enterAsAdmin: 'प्रशासन के रूप में प्रवेश करें',

    // Auth Gateway
    authGateway: 'भूमिका आधारित प्रमाणीकरण गेटवे',
    selectRole: 'अपनी भूमिका का चयन करें',
    loginSubtitle: 'कबाड़ीवाला कनेक्ट भारत की औपचारिक ई-कचरा रीसाइक्लिंग प्रणाली के प्रत्येक हितधारक हेतु समर्पित पोर्टल प्रदान करता है।',
    instantLogin: 'एक क्लिक में त्वरित लॉगिन -',
    orCredentials: 'या अपना विवरण दर्ज करें',
    mobileNumber: 'पंजीकृत मोबाइल नंबर',
    cpcbRegNumber: 'सीपीसीबी संयंत्र पंजीकरण संख्या / मोबाइल',
    password: 'सुरक्षा पासवर्ड या 4-अंकों का पिन',
    submitLogin: 'जमा करें एवं डैशबोर्ड खोलें',
    dedicatedFeatures: 'इस पोर्टल की प्रमुख समर्पित सुविधाएं',
    activeTabBadge: 'सक्रिय',

    // Common Verbs & Labels
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
    assigned: 'कबाड़ीवाला नियुक्त',
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
    ratePerKg: 'दर प्रति किग्रा',
    perKg: 'प्रति किग्रा',
    estValue: 'अनुमानित मूल्य',
    mandiRate: 'मंडी बेंचमार्क भाव',
    itemMaterial: 'वस्तु / सामग्री',
    refreshBtn: 'रिफ्रेश करें',
    callBtn: 'कॉल करें',
    openQr: 'क्यूआर खोलें',

    // Citizen Portal
    tabMyPickups: 'मेरे पिकअप एवं लाइव ट्रैकिंग',
    tabSchedulePickup: 'पिकअप बुक करें',
    tabImpact: 'पर्यावरण प्रभाव एवं वृक्ष',
    tabDropoff: 'निकटतम ड्रॉप-ऑफ केंद्र',
    pickupAddress: 'पिकअप का पता',
    scheduledTime: 'निर्धारित दिनांक एवं समय',
    notesCarton: 'सामग्री विवरण / नोट',
    itemsToRecycle: 'ई-कचरा सामग्री',
    addMoreItems: 'आइटम जोड़ें',
    totalItems: 'कुल वस्तुएं',
    totalUnits: 'कुल इकाइयां',
    qty: 'संख्या',
    quantity: 'संख्या (पीस / नग)',
    pieces: 'पीस',
    units: 'इकाइयां',
    optionalPieceCount: 'वस्तुओं/नगों की कुल संख्या',
    commodityBenchmark: 'धातु मानक दर',
    ministryOfMinesTag: 'खान मंत्रालय — अनौपचारिक ई-कचरा एकीकरण',
    highGradePCBs: 'उच्च-श्रेणी पीसीबी',
    cleanCopperWire: 'साफ तांबा तार',
    lithiumBatteries: 'लिथियम बैटरी',
    electricMotors: 'इलेक्ट्रिक मोटर',
    scanAiPhoto: 'एआई कैमरे से स्क्रैप स्कैन करें',
    indicativePriceRange: 'अनुमानित मूल्य दायरा',
    confirmPickup: 'पुष्टि करें एवं पिकअप मंगाएं',
    collectorTracking: 'कबाड़ीवाला आ रहा है',
    collectorEta: 'अनुमानित आगमन: 12 मिनट',
    viewReceipt: 'सत्यापित डिजिटल रसीद देखें',
    downloadCert: 'सुरक्षित निपटान प्रमाणपत्र डाउनलोड करें',
    csrDonationNote: 'वृक्षारोपण हेतु यह राशि पर्यावरण एनजीओ को दान करें',
    treesPlanted: 'लगाए गए वृक्ष',
    landfillDivertedKg: 'किग्रा कचरा लैंडफिल से बचाया',
    dropoffTitle: 'अधिकृत ई-कचरा ड्रॉप-ऑफ केंद्र',
    yourPickupRequests: 'आपके पिकअप अनुरोध',
    verifiedHandover: 'सत्यापित हस्तांतरण',
    callCollector: 'कबाड़ीवाले को कॉल करें',
    bookPickupHeader: 'घरेलू ई-कचरा पिकअप बुक करें',
    householdPickupBadge: 'घरेलू पिकअप',
    aiPhotoScanner: 'एआई फोटो स्कैनर (स्वचालित श्रेणी पहचान)',
    priceRangeTitle: 'अनुमानित बाजार मूल्य दायरा',
    donateToCsrLabel: 'पर्यावरण एनजीओ को राशि दान करें (पौधे लगाएं)',
    confirmPickupBtn: 'पुष्टि करें एवं घर पर पिकअप मंगाएं',
    traceabilityGuarantee: 'धातु ट्रेसेबिलिटी एवं शुद्धता गारंटी',
    traceabilityBadge: 'सत्यापित श्रृंखला',
    environmentalImpactHeader: 'पर्यावरण प्रभाव एवं लैंडफिल डायवर्जन बही',
    personalImpactTitle: 'आपका व्यक्तिगत लैंडफिल डायवर्जन प्रभाव',
    downloadCertBtn: 'निपटान प्रमाणपत्र डाउनलोड करें',
    ewasteDiverted: 'ई-कचरा लैंडफिल से बचाया',
    carbonSaved: 'कार्बन डाइऑक्साइड उत्सर्जन बचत',
    metalsRecycled: 'मूल्यवान धातु एवं तांबा पुनर्चक्रण',
    csrCreditsEarned: 'सीएसआर ग्रीन क्रेडिट अर्जित',
    selfDropoffTitle: 'अधिकृत ई-कचरा ड्रॉप-ऑफ केंद्र',
    selfDropoffBadge: 'स्वयं ड्रॉप-ऑफ विकल्प',
    verifiedReceiptModalTitle: 'सत्यापित डिजिटल हस्तांतरण रसीद',

    // Collector Portal
    tabLots: 'लॉट बनाएं एवं एआई मूल्यांकन',
    tabPriceBoard: 'बोलता दाम पत्रक',
    tabFindRecyclers: 'निकटतम रीसायकलर',
    tabHandover: 'क्यूआर बनाएं',
    tabPassbook: 'नकद पासबुक',
    tabSafety: 'सुरक्षा नियम',
    // Mobile Bottom Navigation (Short 1-word thumb labels)
    mNavLots: 'लॉट',
    mNavPrices: 'भाव',
    mNavPickups: 'पिकअप',
    mNavRecyclers: 'रीसायकलर',
    mNavPassbook: 'पासबुक',
    mNavSafety: 'सुरक्षा',
    mNavMyPickups: 'पिकअप',
    mNavBook: 'बुक करें',
    mNavImpact: 'प्रभाव',
    mNavDropoff: 'केंद्र',
    mNavIncoming: 'लॉट',
    mNavVerify: 'QR जांच',
    mNavRates: 'भाव दर',
    mNavAnomalies: 'अलर्ट',
    mNavReports: 'रिपोर्ट',
    mNavOverview: 'सारांश',
    mNavTrace: 'ट्रेस',
    mNavEconomics: 'मुनाफा',
    mNavVerifyAdmin: 'सत्यापन',
    pickups: 'नागरिक पिकअप',
    createLot: 'नया लॉट बनाएं',
    createDigitalLot: 'डिजिटल लॉट बनाएं',
    myCreatedLots: 'मेरे बनाए गए लॉट',
    lotCreationBadge: 'लॉट निर्माण',
    digitalLotCreatorTitle: 'ई-कचरा डिजिटल लॉट बनाएं',
    lotCreatedSuccessTitle: 'लॉट सफलतापूर्वक दर्ज!',
    lotTypeSelection: '1. लॉट प्रकार चुनें',
    singleMaterialLot: 'एकल सामग्री लॉट',
    customMixedLot: 'कस्टम मिक्स्ड लॉट (मिश्रित कबाड़)',
    uploadPhotoLabel: '2. कबाड़ की फोटो लें या अपलोड करें',
    tapToSnapPhoto: 'कैमरा खोलें या फोटो खींचें',
    photoCapturedMsg: 'फोटो कैप्चर एवं सत्यापित (1080p)',
    selectScrapCategory: '3. ई-कचरा श्रेणी चुनें',
    approxWeightLabel: '4. अनुमानित वजन दर्ज करें (किग्रा)',
    minWeightNote: 'न्यूनतम 0.5 किग्रा',
    lotLocationLabel: '5. लॉट हस्तांतरण / कबाड़ गोदाम का स्थान',
    lotLocationDesc: 'स्थान निर्धारित करें जहां अधिकृत रीसायकलर इस लॉट का निरीक्षण और उठाव करेगा।',
    detectLiveGps: 'लाइव जीपीएस पता लगाएं',
    detectingLocation: 'जीपीएस पता लगाया जा रहा है...',
    presetScrapHub: 'कबाड़ मंडी / औद्योगिक क्षेत्र चुनें',
    customAddressPlaceholder: 'गोदाम का पता, दुकान नंबर या लैंडमार्क दर्ज करें...',
    handoverLocation: 'हस्तांतरण स्थान',
    selectLocationMethod: 'स्थान मोड',
    liveGpsDetected: 'जीपीएस स्थान सत्यापित',
    customAddress: 'कस्टम पता / गोदाम',
    quickPresets: 'प्रमुख कबाड़ केंद्र',
    instantAiValue: 'त्वरित एआई मूल्यांकन अनुमान',
    saveLot: 'खाते में लॉट दर्ज करें',
    listenPriceAloud: 'दाम बोलकर सुनें',
    todayMandiRate: 'आज का मंडी बेंचमार्क भाव',
    passbookBalance: 'खातावही शेष',
    cashCollected: 'कुल प्राप्त नकद',
    totalSoldLots: 'कुल बेचे गए लॉट',
    runningLedger: 'नकद एवं लॉट लेनदेन खाता बही',
    credit: 'जमा (+)',
    debit: 'निकासी (-)',
    balance: 'शेष',
    offlineTolerant: 'ऑफलाइन मोड सक्रिय (इंटरनेट की आवश्यकता नहीं)',
    syncPending: 'लंबित लॉट',
    syncNow: 'अभी सिंक करें',
    syncPendingLots: 'लंबित लॉट सिंक करें',
    offlineMode: 'ऑफलाइन मोड',
    onlineMode: 'ऑनलाइन',
    offlineModeActive: 'ऑफलाइन मोड सक्रिय:',
    offlineModeDesc: 'लॉट आपके फोन स्टोरेज में सुरक्षित हैं और नेटवर्क आने पर अपने आप सिंक हो जाएंगे।',
    operatingZone: 'कार्य क्षेत्र: अखिल भारतीय सक्रिय नेटवर्क',
    cashFirst: 'नकद समर्थित',
    myCreatedLotsTitle: 'मेरे पंजीकृत डिजिटल लॉट एवं लाइव बोलियां',
    myCreatedLotsDesc: 'आपके द्वारा बनाए गए सभी लॉट, खुली रीसायकलर निविदाएं और मोलभाव बोलियां।',
    biddingRule: 'रीसायकलर बोली नियम: मांग मूल्य का न्यूनतम 50%',
    sellLotHere: 'इस संयंत्र को लॉट बेचें',
    nearbyRecyclersTitle: 'पास के अधिकृत रीसायकलर एवं स्मेल्टर',
    handoverVoucherTitle: 'डिजिटल हस्तांतरण क्यूआर वाउचर',
    handoverVoucherBadge: 'डिजिटल हस्तांतरण',
    handoverStepsTitle: 'हस्तांतरण प्रक्रिया के 3 आसान कदम',
    step1Weight: 'रीसायकलर गेट पर वजन कराएं',
    step1Desc: 'धर्मकांटे या प्रमाणित इलेक्ट्रॉनिक कांटे पर वजन दर्ज कराएं।',
    step2Scan: 'हस्तांतरण क्यूआर स्कैन कराएं',
    step2Desc: 'रीसायकलर ऑपरेटर अपने फोन से यह वाउचर स्कैन करेगा।',
    step3Pay: 'नकद या वॉलेट भुगतान प्राप्त करें',
    step3Desc: 'तुरंत नकद लें या डिजिटल वॉलेट में भुगतान पाएं। पासबुक में दर्ज।',
    formalizationBenefitTitle: 'खान मंत्रालय औपचारिकीकरण प्रोत्साहन:',
    formalizationBenefitDesc: 'प्रत्येक सत्यापित डिजिटल लॉट हस्तांतरण पर ₹500 विशेष औपचारिकीकरण बोनस।',
    passbookTitle: 'कबाड़ीवाला नकद खाता बही (पासबुक)',
    passbookBadge: 'नकद पासबुक',
    thDate: 'दिनांक',
    thDesc: 'विवरण',
    thParty: 'संबंधित पक्ष / व्यापारी',
    thMode: 'माध्यम',
    thAmount: 'राशि',
    thBalance: 'शेष',
    thStamp: 'मुहर',
    cashPaymentRule: 'नकद भुगतान नियम: सभी नकद लेनदेन डिजिटल रूप से मुहरबंद होकर पासबुक में दर्ज होते हैं।',
    downloadPassbookPdf: 'पासबुक पीडीएफ डाउनलोड करें',
    safetyCardsTitle: 'सुरक्षा नियम एवं खतरनाक प्रथाओं से बचाव',
    safetyBadge: 'सुरक्षा मार्गदर्शन',
    cpcbSafetyGuidelines: 'सीपीसीबी अनिवार्य ई-कचरा सुरक्षा दिशा-निर्देश',
    dosTitle: "क्या करें (DO'S):",
    dontsTitle: "कभी न करें (DON'TS):",
    safetyQuote: 'उचित पृथक्करण से स्वास्थ्य की रक्षा होती है और रीसायकलर 35% अधिक मूल्य देता है।',
    valuePreservationTitle: 'सर्वाधिक कमाई के लिए सुरक्षित डिसमेंटलिंग के 4 नियम',
    valueBadge: 'मूल्य संवर्धन मार्गदर्शिका',
    step1Plastic: 'कदम 1: बाहरी प्लास्टिक खोलें',
    step1PlasticDesc: 'बिना तोड़े स्क्रू खोलकर एबीएस प्लास्टिक केसिंग अलग करें (₹38/किग्रा अलग बिकेगी)।',
    step2Pcb: 'कदम 2: मदरबोर्ड साबुत रखें',
    step2PcbDesc: 'हाई-ग्रेड मदरबोर्ड के पुर्जे और सोने की पिने सुरक्षित रखने पर ₹640/किग्रा मिलता है।',
    step3Copper: 'कदम 3: बिना जलाए (कोल्ड स्ट्रिपिंग) तांबे की तार छीलें',
    step3CopperDesc: 'मोटर का तांबा बिना आग लगाए वायर कटर से निकालें (₹480/किग्रा)।',
    step4Battery: 'कदम 4: बैटरियों को अलग थैले में रखें',
    step4BatteryDesc: 'शॉर्ट सर्किट और आग से बचाव के लिए लिथियम सेलों को अलग सूखे बैग में रखें।',
    citizenPickupRequestsTitle: 'पास के घरों से पिकअप अनुरोध',
    citizenPickupsBadge: 'नागरिक पिकअप',
    jobCompletedTitle: 'कार्य सफलतापूर्वक पूर्ण!',
    activeJobBadge: 'सक्रिय कार्य',
    verifyWeightTitle: 'अंतिम वजन सत्यापन एवं समायोजन:',
    completePickupBtn: 'पिकअप पूरा करें एवं रसीद जारी करें',
    livePickupsMapTitle: 'लाइव कबाड़ पिकअप मैप',
    mandiPriceBoardTitle: 'लाइव ई-कचरा मंडी बेंचमार्क भाव',
    mandiPriceBoardSub: 'अंतर्राष्ट्रीय द्वितीयक धातु विनिमय (LME + CPCB भारत) द्वारा समर्थित लाइव दरें।',
    mandiPriceBoardZone: 'राष्ट्रीय सीपीसीबी ज़ोन बेंचमार्क',
    thisWeek: 'इस सप्ताह',
    ledgerFirstTitle: 'खाता-बही (पासबुक) आधारित मॉडल',
    ledgerFirstDesc: 'कबाड़ीवाले पहले से ही भौतिक पासबुक पर भरोसा करते हैं। जटिल सॉफ़्टवेयर के बजाय हमने मुहरबंद रसीदों और नकद रिकॉर्ड के साथ उसी अनुभव को डिजिटल बनाया है।',
    voiceFirstTitle: 'स्थानीय भाषा और आवाज़-प्रथम (वॉइस)',
    voiceFirstDesc: 'हर महत्वपूर्ण दर, वजन और सुरक्षा चेतावनी हिंदी और मराठी में बोलकर सुनाई जाती है। फील्ड में दस्ताने पहनकर उपयोग के लिए बड़े टच बटन।',
    offlineFirstTitle: 'बिना इंटरनेट (ऑफ़लाइन) चलने योग्य',
    offlineFirstDesc: 'बिना मोबाइल नेटवर्क के लॉट बनाएं, सहेजे गए दाम देखें और हैंडओवर तैयार करें। नेटवर्क मिलने पर कतारबद्ध लॉट अपने-आप सिंक हो जाते हैं।',

    // Recycler Portal
    tabIncoming: 'आने वाले लॉट एवं बोली बाजार',
    tabVerifyQr: 'हस्तांतरण क्यूआर जांचें',
    tabRateConsole: 'खरीद दर नियंत्रण',
    tabAnomalies: 'एआई विसंगति जांच',
    tabReports: 'सीपीसीबी ईपीआर रिपोर्ट',
    tabFacility: 'संयंत्र विवरण',
    lotCode: 'लॉट कोड',
    collectorName: 'कबाड़ीवाला',
    approxWeight: 'अनुमानित वजन (किग्रा)',
    offeredRate: 'प्रस्तावित दर (₹/किग्रा)',
    totalAmount: 'कुल देय राशि',
    acceptLot: 'लॉट स्वीकार करें',
    rejectLot: 'अस्वीकार करें',
    counterOffer: 'वैकल्पिक दर दें',
    broadcastRates: 'सभी कबाड़ीवालों को नई दरें भेजें',
    downloadForm2: 'सीपीसीबी फॉर्म-2 (JSON) डाउनलोड करें',
    downloadForm6: 'सीपीसीबी फॉर्म-6 (CSV) डाउनलोड करें',
    facilityRegStatus: 'सीपीसीबी ईपीआर पंजीकरण सक्रिय',
    incomingLotsTitle: 'आने वाले कबाड़ीवाला लॉट एवं बोली बाजार',
    incomingLotsDesc: 'सत्यापित कबाड़ीवालों द्वारा जमा किए गए डिजिटल लॉट पर बोली लगाएं। वैध बोली मांग मूल्य का न्यूनतम 50% होनी चाहिए।',
    allLots: 'सभी लॉट',
    openForBids: 'बोली हेतु उपलब्ध',
    myBids: 'मेरी बोलियां',
    handoverPending: 'हस्तांतरण लंबित',
    confirmed: 'सत्यापित / पुष्ट',
    acceptAsk: 'मांग स्वीकार करें',
    decline: 'अस्वीकार करें',
    bidAcceptedMsg: 'बोली स्वीकृत! प्रत्यक्ष क्यूआर स्कैन हेतु तैयार।',

    // Admin Portal
    tabOverview: 'शहर स्तरीय अवलोकन',
    tabTraceability: 'सामग्री ट्रेसेबिलिटी श्रृंखला',
    tabUnitEconomics: 'इकाई-अर्थशास्त्र कैलकुलेटर',
    tabVerifications: 'कबाड़ीवाला केवाईसी सत्यापन',
    tabEpr: 'सीपीसीबी 2022 डेटा निर्यात',
    citywideTonnage: 'कुल एकत्र ई-कचरा',
    activeCollectors: 'पंजीकृत औपचारिक कबाड़ीवाले',
    authorizedSmelters: 'सीपीसीबी अधिकृत रीसाइक्लिंग संयंत्र',
    monthlyVolume: 'मासिक संग्रह (किग्रा)',
    middlemanCut: 'समाप्त की गई बिचौलियों की दलाली',
    incomeBoost: 'कबाड़ीवाले की शुद्ध आय में वृद्धि',
    approveKyc: 'स्वीकृत करें एवं सीपीसीबी बैज जारी करें',
    rejectKyc: 'अस्वीकार करें',
    traceabilityTitle: 'एसएचए-256 सहित 4-चरणीय सामग्री ट्रेसेबिलिटी',
    acceptPickup: 'पिकअप स्वीकार करें',
    citizenName: 'नागरिक',
    estimatedPayout: 'अनुमानित भुगतान',
    itemsDeclared: 'घोषित कबाड़ सामग्री',
    simulationControls: 'सिमुलेशन नियंत्रण',
    unitEconomicsBadge: 'इकाई अर्थशास्त्र कैलकुलेटर',
    platformSustainability: 'मंच आत्मनिर्भरता मॉडल:',
    informalMarketLabel: 'वर्तमान अनौपचारिक बाजार (यथास्थिति)',
    formalPlatformLabel: 'कबाड़ीवाला कनेक्ट मंच (औपचारिक)',
    collectorKycTitle: 'कबाड़ीवाला सत्यापन एवं पहचान पत्र',
    collectorKycBadge: 'केवाईसी सत्यापन',
    kycVerified: 'सत्यापित',
    kycPending: 'सत्यापन लंबित',
    verifiedCollector: 'सत्यापित कबाड़ीवाला',
    verifiedCitizen: 'सत्यापित नागरिक',
    verifiedRecycler: 'अधिकृत रीसायकलर',
    verifiedAdmin: 'नियामक प्राधिकरण',

    // Custom Product & Multi-item Keys
    otherCustomProduct: 'अन्य / खुद का उत्पाद नाम लिखें (कस्टम आइटम)',
    enterProductName: 'उत्पाद का नाम लिखें (जैसे: पुराना माइक्रोवेव, इनवर्टर)',
    productNamePlaceholder: 'जैसे: इनवर्टर, माइक्रोवेव, स्टेबलाइज़र, टीवी...',
    customRatePerKg: 'अपेक्षित दर (₹/kg)',
    addCustomItem: 'कस्टम उत्पाद जोड़ें',
    pickupAddressPlaceholder: 'मकान/फ्लैट नं., सड़क का नाम, इलाका, लैंडमार्क, पिनकोड...',
    fetchingLocation: 'स्थान खोज रहे हैं...',
    fetchLocation: 'पता से स्थान लाएं',
    locatingGps: 'GPS खोज रहे हैं...',
    gpsBtn: 'GPS',
    locateBtn: 'स्थान दिखाएं',
    pinConfirmsDoorstep: '✓ मानचित्र पर पिन देखकर पुष्टि करें। टैप या ड्रैग करके गेट सटीक करें।',
    doorstepMapConfirm: 'मानचित्र पर सटीक गेट चुनें (पिन पुष्टी)',
    schedulePickupSlot: 'पिकअप का समय चुनें',
    slotToday: 'आज',
    slotWithin2Hrs: '2 घंटे के भीतर',
    slotTomorrow: 'कल',
    slotWeekend: 'शनिवार / सप्ताहांत',
    slotSat11AM: 'शनिवार सुबह 11 बजे',
    addMaterialLineItems: 'सामग्री सूची में आइटम जोड़ें',
    materialsInLot: 'लॉट में सामग्रियां',
    materialType: 'सामग्री का प्रकार',
    weightKg: 'वजन (किग्रा)',
    customLotName: 'कस्टम लॉट / उत्पाद का नाम',
    liveBenchmarkSub: 'आधिकारिक सीपीसीबी बाजार मानक दरें। किसी भी वस्तु के पास स्पीकर आइकन दबाकर मूल्य सुनें।',
    lastUpdatedToday: 'अंतिम अपडेट: आज सुबह 09:00 AM',
    currentPriceNotice: 'अखिल भारतीय सीपीसीबी अधिकृत एग्रीगेटर्स से प्राप्त लाइव दरें',
    treeDonationNotice: 'राष्ट्रीय हरित गलियारों में 5 देशी पौधों के रोपण में योगदान।',
    aiDetected: 'AI द्वारा पहचाना गया:',
    confidenceMatch: 'सटीकता',
    priceStable: 'दाम स्थिर',
    priceIncreasedBy: 'दाम में वृद्धि',
    rupeesPerKg: 'रुपये प्रति किलो',
    expectedRateNote: 'प्रति किलो अपेक्षित या अनुमानित दर',
    addItemToLot: 'लॉट में आइटम जोड़ें',

    // Feedback & System Messages
    pleaseAddOneItem: 'कृपया कम से कम एक ई-कचरा सामग्री जोड़ें।',
    failedToCancelPickup: 'पिकअप रद्द करने में विफल:',
    receiptPdfDownloaded: 'रसीद पीडीएफ डाउनलोड हुई! (सीपीसीबी ईपीआर अनुपालन)',
    pleaseAddOneMaterial: 'कृपया कस्टम लॉट में कम से कम एक सामग्री जोड़ें।',
    speechNotSupported: 'इस ब्राउज़र में वाक् संश्लेषण (Speech synthesis) समर्थित नहीं है।',

    // Additional Navigation & Settings
    settingsBtn: 'सेटिंग्स (थीम, डिस्प्ले, आवाज़, डेटा)',
    settingsTitle: 'ऐप सेटिंग्स',
    settingsSubtitle: 'थीम, डिस्प्ले मोड, आवाज़ और क्षेत्रीय प्राथमिकताएं अनुकूलित करें',
    myProfile: 'मेरी प्रोफाइल एवं सुरक्षा',
    mNavEpr: 'ईपीआर',
    welcomeApp: 'कबाड़ीवाला कनेक्ट',
    loginSubtitleApp: 'स्मार्ट अनौपचारिक ई-कचरा व ईपीआर ट्रेसेबिलिटी प्लेटफॉर्म। जारी रखने के लिए अपना पोर्टल चुनें।',
    portalCapabilities: 'पोर्टल सुविधाएं एवं जानकारी',

    // Citizen Dashboard Pickups & Doorstep
    tabRequestPickup: 'घर बैठे पिकअप का अनुरोध करें',
    tabGreenImpact: 'पर्यावरण प्रभाव एवं कार्बन बचत',
    'indicative payout:': 'अनुमानित भुगतान:',
    'HANDOVER COMPLETED': 'हस्तांतरण संपन्न',
    'COLLECTOR DISPATCHED': 'कबाड़ीवाला रवाना हुआ',
    'LIVE ETA ESTIMATE': 'लाइव आगमन समय (ETA)',
    'layer 1 verification: citizen handover otp': 'स्तर 1 सत्यापन • घर बैठे कबाड़ हस्तांतरण',
    'SECURE OTP': 'सुरक्षित ओटीपी',
    'layer 1 verified: physical doorstep handover confirmed': 'स्तर 1 सत्यापित: भौतिक हस्तांतरण की पुष्टि हुई',
    manualOrGps: 'पता लिखें, लिंक पेस्ट करें, या मैप का उपयोग करें',
    gmapsLinkOpt: 'गूगल मैप्स लिंक',
    optional: 'वैकल्पिक',
    pasteLinkOrCoords: 'maps.app.goo.gl या निर्देशांक पेस्ट करें',

    // Kabadiwala & Bidding
    bidsReceived: 'बोलियां',
    minAskRule: 'मांग मूल्य का न्यूनतम 50%',
    BIDDING: 'बोली चालू',
    'layer 2: ai verified': 'स्तर 2: एआई सत्यापित',
    items: 'प्रकार',
    blendedRate: 'मिश्रित दर',
    askingPrice: 'मांग मूल्य',
    'highestOffer:': 'उच्चतम बोली दर:',
    acceptBid: 'बोली स्वीकार करें',
    awaitingBids: 'निकटवर्ती अधिकृत एग्रीगेटर्स से बोलियों की प्रतीक्षा है।',

    // Profile & Security
    profileSaved: 'व्यक्तिगत विवरण सफलतापूर्वक अपडेट हो गया!',
    pinLengthError: 'नया पिन ठीक 4 अंकों का होना चाहिए।',
    pinMismatchError: 'नया पिन और पुष्टि पिन मेल नहीं खाते।',
    pinSuccess: '4-अंकीय सुरक्षा पिन सफलतापूर्वक अपडेट हुआ!',
    otherSessionsLoggedOut: 'वेब और एंड्रॉयड पर अन्य सभी सक्रिय सत्र समाप्त कर दिए गए हैं।',
    eprTraceabilityTitle: 'ईपीआर ट्रेसेबिलिटी एवं पर्यावरणीय प्रभाव',
    eprTraceabilityDesc: 'क्रिप्टोग्राफिक SHA-256 ऑडिट रिकॉर्ड और सीपीसीबी निस्तारण प्रमाणपत्र।',
    wasteDiverted: 'डायवर्ट किया गया कचरा',
    safeProcessing: 'सुरक्षित औपचारिक चैनल प्रसंस्करण',
    co2ePrevented: 'रोकी गई CO2e',
    zeroBurning: 'शून्य खुले में जलाने का उत्सर्जन',
    csrEquivalent: 'सीएसआर समकक्ष',
    carbonOffset: 'आजीवन कार्बन ऑफसेट संतुलित',
    downloadJsonCert: 'JSON प्रमाणपत्र डाउनलोड करें',
    tollFreeHelpline: 'टोल-फ्री हेल्पलाइन (24/7)',
    tollFreeDesc: 'किसी भी भारतीय मोबाइल/लैंडलाइन से निःशुल्क कॉल',
    emailAssistance: 'सीधी ईमेल सहायता',
    emailDesc: 'प्रतिक्रिया समय: 2 व्यावसायिक घंटे से कम',
    whatsappSupport: 'व्हाट्सऐप बॉट एवं चैट',
    whatsappDesc: 'तुरंत शिकायत दर्ज करें एवं फोटो भेजें',
    nodalOfficer: 'नोडल शिकायत निवारण अधिकारी',
    nodalOfficerDesc: 'खान मंत्रालय / सीपीसीबी शिकायतें',
    faqsTitle: 'अक्सर पूछे जाने वाले प्रश्न (FAQ)',
    personalInfoTitle: 'व्यक्तिगत जानकारी एवं पता',
    personalInfoDesc: 'सत्यापित मोबाइल, आधिकारिक नाम, ईमेल एवं पिकअप का निश्चित पता।',
    fullName: 'पूरा आधिकारिक नाम',
    registeredMobile: 'पंजीकृत मोबाइल',
    otpVerified: 'ओटीपी सत्यापित',
    emailAddress: 'ईमेल पता',
    pickupWorkshopAddress: 'पिकअप / वर्कशॉप का पता',
    typeAddressHint: 'पता लिखें, लिंक जोड़ें या मैप चुनें',
    addressPlaceholder: 'मकान/दुकान नं., सड़क, इलाका, लैंडमार्क, पिनकोड...',
    locating: 'खोज रहे हैं...',
    savePersonalDetails: 'व्यक्तिगत विवरण सहेजें',
    accountSecurity: 'खाता सुरक्षा एवं क्रेडेंशियल्स',
    accountSecurityDesc: 'अपना 4-अंकीय त्वरित सुरक्षा पिन बदलें और बायोमेट्रिक प्रबंधित करें।',
    currentPin: 'वर्तमान पिन',
    newPin: 'नया 4-अंकीय पिन',
    confirmPin: 'नए पिन की पुष्टि करें',
    updatePinBtn: 'सुरक्षा पिन अपडेट करें',
    biometricUnlock: 'बायोमेट्रिक अनलॉक',
    biometricDesc: 'त्वरित टर्मिनल उपयोग के लिए फिंगरप्रिंट या फेस अनलॉक का उपयोग करें',
    twoFactorAuth: 'टू-फैक्टर प्रमाणीकरण (2FA)',
    twoFactorDesc: 'संवेदनशील लॉट ट्रांसफर एवं दरों के संपादन हेतु एसएमएस ओटीपी सत्यापन अनिवार्य करें',
    logoutOtherDevices: 'अन्य सभी डिवाइस से लॉगआउट करें',
    signOutActiveTerminal: 'सक्रिय टर्मिनल से लॉगआउट करें',
    regulatoryStandards: 'नियामक मानक:',

    // Recycler Dashboard
    totalProcessed: 'कुल प्रसंस्कृत',
    'q2-2026 batch': 'तिमाही 2-2026 बैच',
    pendingLots: 'लंबित लॉट',
    'from active collectors': 'सक्रिय कबाड़ीवाले',
    anomalies: 'विसंगतियाँ',
    'review required': 'समीक्षा आवश्यक',
    'no digital lots found matching this filter.': 'इस फिल्टर से मेल खाने वाला कोई डिजिटल लॉट नहीं मिला।',
    'show all lots': 'सभी लॉट देखें',
    'BIDDING OPEN': 'बोली प्रक्रिया चालू',
    'OPEN FOR BIDS': 'बोली हेतु उपलब्ध',
    'COLLECTOR TENDER': 'कबाड़ीवाला निविदा',
    minBid: 'न्यूनतम बोली (50%)',
    'current top bid': 'वर्तमान उच्चतम बोली',
    'No bids yet': 'अभी तक कोई बोली नहीं',
    'bids received': 'प्राप्त बोलियां',
    'your bid:': 'आपकी बोली:',
    'Update Bid': 'बोली अपडेट करें',
    Current: 'वर्तमान',
    'Place Bid': 'बोली लगाएं',
    'Go to QR Handover Verification →': 'क्यूआर हस्तांतरण सत्यापन पर जाएं →',

    // Settings
    cacheCleared: 'लोकल कैश रीफ्रेश हो गया और डेटासेट सफलतापूर्वक रीसेट हुआ।',
    displayAndThemes: 'डिस्प्ले मोड एवं थीम',
    displayThemesDesc: 'लाइट, डार्क या ऑटोमैटिक थीम चुनें और मटेरियल 3 रंग पैलेट चुनें।',
    chooseAppearance: '1. रूप-रंग (थीम) चुनें',
    accentPalette: '2. मटेरियल 3 रंग पैलेट',
    languageAndAccessibility: 'भाषा एवं सुगमता',
    languageAccessDesc: 'इंटरफ़ेस भाषा, आवाज़ सहायता और कंपन फीडबैक सेट करें।',
    applicationLanguage: 'एप्लिकेशन भाषा',
    hapticFeedback: 'हैप्टिक टच फीडबैक',
    hapticFeedbackDesc: 'बटन दबाने पर स्पर्शनीय कंपन',
    testVoice: 'आवाज़ सहायता जांचें',
    testVoiceDesc: 'हिन्दी/मराठी में बोलकर ऑडियो सुनें',
    playAudio: 'आवाज़ सुनें',
    dataStorageCompliance: 'डेटा, स्टोरेज एवं अनुपालन',
    dataStorageDesc: 'ऑफलाइन स्थानीय स्टोरेज प्रबंधन एवं सीपीसीबी ऑडिट विनिर्देश।',
    resetOfflineData: 'स्थानीय ऑफलाइन डेटा रीसेट करें',
    resetOfflineDesc: 'डेमो परिवर्तनों को साफ़ करता है और सभी ऑफलाइन लॉट, बुकिंग और लेजर स्थिति को आधिकारिक सीपीसीबी बेंचमार्क पर रीसेट करता है।',
    resetDataBtn: 'स्थानीय डेटा रीसेट करें',
    deviceSystemMode: 'डिवाइस सिस्टम',
    deviceSystemDesc: 'डिवाइस की प्राथमिकता के अनुसार (लाइट मोड)',
    lightModeLabel: 'लाइट मोड',
    lightModeDesc: 'दिन के उपयोग के लिए स्पष्ट और चमकदार सतह',
    darkModeLabel: 'डार्क मोड',
    darkModeDesc: 'रात के समय आंखों की सुरक्षा के लिए उच्च कंट्रास्ट डार्क मोड'
  },

  mr: {
    // Brand & Ecosystem
    appName: 'कबाडीवाला कनेक्ट',
    tagline: 'ई-कचरा मागोवा आणि ईपीआर एक्सचेंज',
    dhatuTag: 'धातु — ई-कचरा मागोवा आणि औपचारिकीकरण व्यासपीठ',
    dhatuSub: 'धातु — अनौपचारिक स्क्रॅप आणि अधिकृत रीसायकलिंग परिसंस्था',
    sihBadge: 'SIH26229',
    sihSub: 'खाण मंत्रालय — अनौपचारिक ई-कचरा एकत्रीकरण उपक्रम',
    activeTerminal: 'सक्रिय टर्मिनल',
    switchRole: 'भूमिका डॅशबोर्ड बदला',
    signIn: 'प्रवेश करा',
    signInBtn: 'डॅशबोर्डमध्ये लॉगिन करा',
    signOut: 'लॉगआउट करा',
    langSelect: 'भाषा बदला',
    selectLanguage: 'भाषा निवडा',
    listen: 'ऐका',
    stop: 'आवाज थांबवा',
    initializing: 'धातु परिसंस्था सुरू होत आहे...',
    personalDetails: 'वैयक्तिक तपशील',
    personalDetailsDesc: 'नाव, संपर्क व संकलन पत्ता',
    securityAccess: 'सुरक्षा व नियंत्रण',
    securityAccessDesc: 'पिन, बायोमेट्रिक्स व 2FA सुरक्षा',
    helpSupport: 'मदत व संपर्क',
    helpSupportDesc: '24/7 हेल्पलाइन, व्हॉट्सअॅप व नोडल अधिकारी',
    supportTitle: 'मदत व ग्राहक सेवा',
    inDevelopment: 'वैशिष्ट्य सक्रिय विकासात आहे',
    supportDesc: 'पुढील आवृत्तीसाठी एकात्मिक रिअल-टाइम तिकीट प्रणाली व एआय वाद निवारक सक्रियपणे विकसित केले जात आहे. थेट हेल्पलाइन, ईमेल डेस्क आणि व्हॉट्सअॅप सहाय्य खाली सुरू आहे.',
    settingsDesc: 'थीम, डिस्प्ले, आवाज व डेटा',

    // Portals & Roles
    portalCitizen: 'नागरिक पोर्टल',
    portalCollector: 'भंगार संग्राहक पोर्टल',
    portalRecycler: 'अधिकृत रीसायकलर',
    portalAdmin: 'प्रशासन व सीपीसीबी तपासणी',
    roleCitizen: 'नागरिक व घरगुती ग्राहक',
    roleCollector: 'घरोघरी भंगार संग्राहक',
    roleRecycler: 'अधिकृत रीसायकलर / एग्रीगेटर',
    roleAdmin: 'प्रशासन व नियामक तपासणी',
    personaCitizen: 'रमेश शर्मा',
    personaCollector: 'सुरेश कुमार',
    personaRecycler: 'इको-रीसायकल अ‍ॅग्रीगेटर्स लि.',
    personaAdmin: 'एनडीएमसी कचरा आणि खाण विभाग',

    // Landing Page
    heroTitle: "धातु — भारताच्या ई-कचरा अर्थव्यवस्थेसाठी डिजिटल मागोवा व ईपीआर व्यासपीठ",
    heroSubtitle: "घरोघरी भंगार गोळा करणाऱ्यांना थेट अधिकृत सीपीसीबी रीसायकलरशी जोडणे. कमी साक्षरता, विनाइंटरनेट सुविधा आणि बहुभाषिक रोख पासबुकवर आधारित डिजिटल प्रणाली.",
    roleBasedLogin: 'भूमिका आधारित लॉगिन',
    sourcingLayer: 'संकलन स्तर (रमेश)',
    coreAsk: 'प्रमुख उद्दिष्ट (SIH26229)',
    formalSide: 'औपचारिक रीसायकलिंग स्तर',
    regulatoryLayer: 'नियामक डेटा स्तर',
    citizenCardDesc: 'घरी बसून जुन्या इलेक्ट्रॉनिक्ससाठी पिकअप बुक करा, अंदाजे बाजार भाव पहा, संग्राहकाचे थेट लोकेशन तपासा आणि ग्रीन ट्री क्रेडिट मिळवा.',
    collectorCardDesc: 'बोलणारा भाव फलक, सोपी लॉट नोंदणी, क्यूआर पावती, रोख पासबुक आणि सुरक्षा नियम.',
    recyclerCardDesc: 'येणाऱ्या लॉटची तपासणी व लिलाव (स्वीकार/नकार), क्यूआर स्कॅन, थेट दर प्रसारण आणि सीपीसीबी फॉर्म-2 व फॉर्म-6 अहवाल.',
    adminCardDesc: 'शहरपातळीवरील आकडेवारी, एसएचए-256 सह 4-टप्प्यातील सामग्री मागोवा आणि केवायसी पडताळणी.',
    enterAsCitizen: 'नागरिक म्हणून प्रवेश करा',
    enterAsCollector: 'संग्राहक म्हणून प्रवेश करा',
    enterAsRecycler: 'रीसायकलर म्हणून प्रवेश करा',
    enterAsAdmin: 'प्रशासन म्हणून प्रवेश करा',

    // Auth Gateway
    authGateway: 'भूमिका आधारित प्रमाणीकरण गेटवे',
    selectRole: 'आपली भूमिका निवडा',
    loginSubtitle: 'कबाडीवाला कनेक्ट भारताच्या ई-कचरा पुनर्प्रक्रिया साखळीतील प्रत्येक घटकासाठी स्वतंत्र डॅशबोर्ड उपलब्ध करून देते.',
    instantLogin: 'एका क्लिकवर त्वरित लॉगिन -',
    orCredentials: 'किंवा आपली माहिती प्रविष्ट करा',
    mobileNumber: 'नोंदणीकृत मोबाइल क्रमांक',
    cpcbRegNumber: 'सीपीसीबी प्रकल्प नोंदणी क्रमांक / मोबाइल',
    password: 'सुरक्षा पासवर्ड किंवा 4-अंकी पिन',
    submitLogin: 'सबमिट करा आणि डॅशबोर्ड उघडा',
    dedicatedFeatures: 'या पोर्टलची प्रमुख वैशिष्ट्ये',
    activeTabBadge: 'सक्रिय',

    // Common Verbs & Labels
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
    total: 'एकूण',
    ratePerKg: 'दर प्रति किलो',
    perKg: 'प्रति किलो',
    estValue: 'अंदाजे किंमत',
    mandiRate: 'बाजार भाव दर',
    itemMaterial: 'वस्तू / सामग्री',
    refreshBtn: 'रिफ्रेश करा',
    callBtn: 'कॉल करा',
    openQr: 'क्यूआर उघडा',

    // Citizen Portal
    tabMyPickups: 'माझ्या संकलन विनंत्या व थेट वेळ',
    tabSchedulePickup: 'संकलन बुक करा',
    tabImpact: 'पर्यावरण प्रभाव व वृक्ष',
    tabDropoff: 'जवळची संकलन केंद्रे',
    pickupAddress: 'संकलनाचा पत्ता',
    scheduledTime: 'नियोजित दिनांक व वेळ',
    notesCarton: 'वस्तूंचे वर्णन / टीप',
    itemsToRecycle: 'ई-कचरा वस्तू',
    addMoreItems: 'आणखी वस्तू जोडा',
    totalItems: 'एकूण वस्तू',
    totalUnits: 'एकूण युनिट्स',
    qty: 'नग',
    quantity: 'संख्या (नग / युनिट्स)',
    pieces: 'नग',
    units: 'युनिट्स',
    optionalPieceCount: 'वस्तूंची/नगांची एकूण संख्या',
    commodityBenchmark: 'धातू मानक दर',
    ministryOfMinesTag: 'खाण मंत्रालय — अनौपचारिक ई-कचरा एकत्रीकरण',
    highGradePCBs: 'उच्च दर्जाचे पीसीबी',
    cleanCopperWire: 'स्वच्छ तांब्याची तार',
    lithiumBatteries: 'लिथियम बॅटरी',
    electricMotors: 'इलेक्ट्रिक मोटर',
    scanAiPhoto: 'एआय कॅमेऱ्याने स्कॅन करा',
    indicativePriceRange: 'अंदाजे किंमत श्रेणी',
    confirmPickup: 'खात्री करा व विनंती पाठवा',
    collectorTracking: 'संग्राहक येत आहे',
    collectorEta: 'अंदाजे आगमन: 12 मिनिटांत',
    viewReceipt: 'प्रमाणित डिजिटल पावती पहा',
    downloadCert: 'सुरक्षित विल्हेवाट प्रमाणपत्र डाउनलोड करा',
    csrDonationNote: 'वृक्षारोपणासाठी ही रक्कम ग्रीन अर्थ संस्थेला दान करा',
    treesPlanted: 'लावलेली झाडे',
    landfillDivertedKg: 'कि.ग्रा. ई-कचरा डेपोत जाण्यापासून वाचवला',
    dropoffTitle: 'सीपीसीबी अधिकृत ई-कचरा संकलन केंद्रे',
    yourPickupRequests: 'आपल्या संकलन विनंत्या',
    verifiedHandover: 'प्रमाणित हस्तांतरण',
    callCollector: 'संग्राहकाला कॉल करा',
    bookPickupHeader: 'घरगुती ई-कचरा संकलन बुक करा',
    householdPickupBadge: 'घरगुती संकलन',
    aiPhotoScanner: 'एआय फोटो स्कॅनर (स्वयंचलित वर्गीकरण)',
    priceRangeTitle: 'अंदाजे बाजार भाव श्रेणी',
    donateToCsrLabel: 'पर्यावरण संस्थेला रक्कम दान करा (झाडे लावा)',
    confirmPickupBtn: 'खात्री करा व संकलन मागवा',
    traceabilityGuarantee: 'धातु मागोवा व सुरक्षितता हमी',
    traceabilityBadge: 'प्रमाणित साखळी',
    environmentalImpactHeader: 'पर्यावरण प्रभाव व कचरा मुक्ती नोंद',
    personalImpactTitle: 'आपला वैयक्तिक पर्यावरण प्रभाव',
    downloadCertBtn: 'विल्हेवाट प्रमाणपत्र डाउनलोड करा',
    ewasteDiverted: 'ई-कचरा लँडफिलमध्ये जाण्यापासून वाचवला',
    carbonSaved: 'कार्बन उत्सर्जनात बचत',
    metalsRecycled: 'मौल्यवान धातू आणि तांबे पुनर्प्रक्रिया',
    csrCreditsEarned: 'सीएसआर ग्रीन क्रेडिट्स मिळवले',
    selfDropoffTitle: 'अधिकृत ई-कचरा संकलन केंद्रे',
    selfDropoffBadge: 'स्वतः जमा करण्याचा पर्याय',
    verifiedReceiptModalTitle: 'प्रमाणित डिजिटल हस्तांतरण पावती',

    // Collector Portal
    tabLots: 'लॉट नोंदणी व एआय मूल्य',
    tabPriceBoard: 'बोलणारा भाव फलक',
    tabFindRecyclers: 'जवळचे रीसायकलर',
    tabHandover: 'क्यूआर तयार करा',
    tabPassbook: 'रोख पासबुक',
    tabSafety: 'सुरक्षा नियम',
    // Mobile Bottom Navigation (Short 1-word thumb labels)
    mNavLots: 'लॉट',
    mNavPrices: 'भाव',
    mNavPickups: 'पिकअप',
    mNavRecyclers: 'रीसायकलर',
    mNavPassbook: 'पासबुक',
    mNavSafety: 'सुरक्षा',
    mNavMyPickups: 'पिकअप',
    mNavBook: 'बुक करा',
    mNavImpact: 'प्रभाव',
    mNavDropoff: 'केंद्र',
    mNavIncoming: 'लॉट',
    mNavVerify: 'QR तपास',
    mNavRates: 'भाव दर',
    mNavAnomalies: 'अलर्ट',
    mNavReports: 'अहवाल',
    mNavOverview: 'सारांश',
    mNavTrace: 'ट्रेस',
    mNavEconomics: 'नफा',
    mNavVerifyAdmin: 'पडताळणी',
    pickups: 'नागरिक संकलन',
    createLot: 'नवीन लॉट तयार करा',
    createDigitalLot: 'डिजिटल लॉट तयार करा',
    myCreatedLots: 'माझे तयार केलेले लॉट',
    lotCreationBadge: 'लॉट नोंदणी',
    digitalLotCreatorTitle: 'ई-कचरा डिजिटल लॉट तयार करा',
    lotCreatedSuccessTitle: 'लॉट यशस्वीरित्या नोंदवला!',
    lotTypeSelection: '1. लॉट प्रकार निवडा',
    singleMaterialLot: 'एकच प्रकारचा लॉट',
    customMixedLot: 'कस्टम मिक्स्ड लॉट (मिश्रित भंगार)',
    uploadPhotoLabel: '2. भंगाराचा फोटो घ्या किंवा अपलोड करा',
    tapToSnapPhoto: 'कॅमेरा उघडा किंवा फोटो काढा',
    photoCapturedMsg: 'फोटो कॅप्चर व प्रमाणित (1080p)',
    selectScrapCategory: '3. वस्तू प्रकार निवडा',
    approxWeightLabel: '4. अंदाजे वजन टाका (कि.ग्रा.)',
    minWeightNote: 'किमान 0.5 कि.ग्रा.',
    lotLocationLabel: '5. लॉट हस्तांतरण / भंगार गोदामाचे ठिकाण',
    lotLocationDesc: 'अधिकृत रीसायकलर या लॉटची तपासणी व संकलन करेल ते ठिकाण निश्चित करा.',
    detectLiveGps: 'थेट जीपीएस शोधा',
    detectingLocation: 'जीपीएस स्थान शोधत आहे...',
    presetScrapHub: 'प्रमुख भंगार बाजार / एमआयडीसी निवडा',
    customAddressPlaceholder: 'गोदामाचा पत्ता, दुकान क्रमांक किंवा लँडमार्क प्रविष्ट करा...',
    handoverLocation: 'हस्तांतरण ठिकाण',
    selectLocationMethod: 'स्थान पर्याय',
    liveGpsDetected: 'जीपीएस स्थान पडताळले',
    customAddress: 'स्वतःचा पत्ता / गोदाम',
    quickPresets: 'प्रमुख भंगार केंद्रे',
    instantAiValue: 'त्वरित एआय मूल्यांकन अंदाज',
    saveLot: 'खात्यात लॉट नोंदवा',
    listenPriceAloud: 'भाव ऐका',
    todayMandiRate: 'आजचा बाजार भाव दर',
    passbookBalance: 'पासबुक शिल्लक',
    cashCollected: 'एकूण मिळालेली रोख',
    totalSoldLots: 'एकूण विकलेले लॉट',
    runningLedger: 'रोख व लॉट व्यवहार नोंदवही',
    credit: 'जमा (+)',
    debit: 'खर्च / नावे (-)',
    balance: 'शिल्लक',
    offlineTolerant: 'ऑफलाइन मोड सक्रिय (इंटरनेट नसतानाही लॉट जतन करा)',
    syncPending: 'सिंक बाकी असलेले लॉट',
    syncNow: 'आता सिंक करा',
    syncPendingLots: 'प्रलंबित लॉट सिंक करा',
    offlineMode: 'ऑफलाइन मोड',
    onlineMode: 'ऑनलाइन',
    offlineModeActive: 'ऑफलाइन मोड सक्रिय:',
    offlineModeDesc: 'लॉट तुमच्या फोन स्टोरेजमध्ये सुरक्षित आहेत आणि नेटवर्क आल्यावर आपोआप सिंक होतील.',
    operatingZone: 'कार्यक्षेत्र: पॅन-इंडिया सक्रिय नेटवर्क',
    cashFirst: 'रोख प्राधान्य समर्थन',
    myCreatedLotsTitle: 'माझे नोंदणीकृत डिजिटल लॉट आणि थेट बोल्या',
    myCreatedLotsDesc: 'तुमच्याद्वारे तयार केलेले सर्व लॉट, खुल्या निविदा आणि दर बोल्या.',
    biddingRule: 'रीसायकलर बोली नियम: मागणी मूल्याच्या किमान 50%',
    sellLotHere: 'या प्रकल्पाला लॉट विका',
    nearbyRecyclersTitle: 'जवळचे अधिकृत रीसायकलर व स्मेल्टर',
    handoverVoucherTitle: 'डिजिटल हस्तांतरण क्यूआर व्हाउचर',
    handoverVoucherBadge: 'डिजिटल हस्तांतरण',
    handoverStepsTitle: 'हस्तांतरणाचे 3 सोपे टप्पे',
    step1Weight: 'रीसायकलर गेटवर वजन करा',
    step1Desc: 'प्रमाणित वजनकाट्यावर एकूण वजन नोंदवा.',
    step2Scan: 'हस्तांतरण क्यूआर स्कॅन करा',
    step2Desc: 'रीसायकलर ऑपरेटर आपल्या फोनवरून हा कोड स्कॅन करेल.',
    step3Pay: 'रोख किंवा डिजिटल वॉलेट पेमेंट मिळवा',
    step3Desc: 'तातडीने रोख घ्या किंवा डिजिटल वॉलेटमध्ये रक्कम मिळवा. पासबुकमध्ये नोंद.',
    formalizationBenefitTitle: 'खाण मंत्रालय औपचारिक प्रोत्साहन:',
    formalizationBenefitDesc: 'प्रत्येक प्रमाणित डिजिटल लॉट हस्तांतरणावर ₹500 विशेष औपचारिक बोनस.',
    passbookTitle: 'भंगार संग्राहक रोख पासबुक',
    passbookBadge: 'रोख पासबुक',
    thDate: 'दिनांक',
    thDesc: 'तपशील',
    thParty: 'खातेदार / व्यापारी',
    thMode: 'माध्यम',
    thAmount: 'रक्कम',
    thBalance: 'शिल्लक',
    thStamp: 'शिक्का',
    cashPaymentRule: 'रोख पेमेंट नियम: सर्व रोख व्यवहार डिजिटल स्वाक्षरीसह पासबुकमध्ये नोंदवले जातात.',
    downloadPassbookPdf: 'पासबुक पीडीएफ डाउनलोड करा',
    safetyCardsTitle: 'सुरक्षा नियम आणि घातक पद्धतींपासून संरक्षण',
    safetyBadge: 'सुरक्षा मार्गदर्शन',
    cpcbSafetyGuidelines: 'सीपीसीबी अनिवार्य ई-कचरा सुरक्षा मार्गदर्शक तत्त्वे',
    dosTitle: "काय करावे (DO'S):",
    dontsTitle: "कधीही करू नका (DON'TS):",
    safetyQuote: 'योग्य वर्गीकरणामुळे आरोग्याचे रक्षण होते आणि रीसायकलर 35% जास्त मोबदला देतो.',
    valuePreservationTitle: 'जास्तीत जास्त कमाईसाठी सुरक्षित सुटे करण्याचे 4 नियम',
    valueBadge: 'मूल्यवर्धन मार्गदर्शिका',
    step1Plastic: 'टप्पा 1: बाहेरील प्लास्टिक उघडा',
    step1PlasticDesc: 'स्क्रू न तोडता एबीएस प्लास्टिक कव्हर वेगळे करा (₹38/कि.ग्रा. स्वतंत्र विक्री).',
    step2Pcb: 'टप्पा 2: मदरबोर्ड अखंड ठेवा',
    step2PcbDesc: 'हाय-ग्रेड मदरबोर्डचे घटक सुरक्षित ठेवल्यास ₹640/कि.ग्रा. मिळतो.',
    step3Copper: 'टप्पा 3: विना जाळता (थंड पद्धतीने) तांब्याची तार काढा',
    step3CopperDesc: 'मोटरमधील तांबे न जाळता वायर कटरने वेगळे करा (₹480/कि.ग्रा.).',
    step4Battery: 'टप्पा 4: बॅटऱ्या वेगळ्या पिशवीत ठेवा',
    step4BatteryDesc: 'शॉर्ट सर्किट किंवा आग टाळण्यासाठी लिथियम बॅटऱ्या कोरड्या पिशवीत ठेवा.',
    citizenPickupRequestsTitle: 'जवळच्या घरांकडून संकलन विनंत्या',
    citizenPickupsBadge: 'नागरिक संकलन',
    jobCompletedTitle: 'काम यशस्वीरित्या पूर्ण!',
    activeJobBadge: 'सुरू असलेले काम',
    verifyWeightTitle: 'अंतिम वजन तपासणी व नोंद:',
    completePickupBtn: 'संकलन पूर्ण करा व पावती द्या',
    livePickupsMapTitle: 'थेट ई-कचरा संकलन नकाशा',
    mandiPriceBoardTitle: 'थेट ई-कचरा बाजार भाव फलक',
    mandiPriceBoardSub: 'आंतरराष्ट्रीय दुय्यम धातू बाजार (LME + CPCB भारत) आधारित थेट बाजार दर.',
    mandiPriceBoardZone: 'राष्ट्रीय सीपीसीबी क्षेत्र निर्देशांक',
    thisWeek: 'या आठवड्यात',
    ledgerFirstTitle: 'पासबुक-आधारित प्रत्यक्ष कार्यपद्धती',
    ledgerFirstDesc: 'कबाडीवाले आधीपासूनच प्रत्यक्ष पासबुकवर विश्वास ठेवतात. क्लिष्ट ॲप्सऐवजी शिक्के मारलेल्या पावत्या, चालू शिल्लक आणि रोख नोंदींसह आम्ही तीच पद्धत डिजिटल केली आहे.',
    voiceFirstTitle: 'स्थानिक भाषा व बोलणारा संवाद (व्हॉइस-फर्स्ट)',
    voiceFirstDesc: 'प्रत्येक महत्त्वाचा दर, वजन आणि सुरक्षेची सूचना मराठी व हिंदीमध्ये स्पष्ट आवाजात ऐकवली जाते. बाहेरील वापरासाठी मोठे टच बटन्स.',
    offlineFirstTitle: 'ऑफलाइन-सक्षम कार्यप्रणाली',
    offlineFirstDesc: 'मोबाईल नेटवर्क नसतानाही लॉट तयार करा, सेव्ह केलेले भाव तपासा आणि हस्तांतरण पूर्ण करा. रेंज येताच सर्व नोंदी आपोआप सिंक होतात.',

    // Recycler Portal
    tabIncoming: 'येणारे लॉट व लिलाव',
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
    downloadForm2: 'सीपीसीबी फॉर्म-2 (JSON) डाउनलोड करा',
    downloadForm6: 'सीपीसीबी फॉर्म-6 (CSV) डाउनलोड करा',
    facilityRegStatus: 'सीपीसीबी ईपीआर नोंदणी सक्रिय',
    incomingLotsTitle: 'येणारे कबाडीवाला लॉट आणि बोली बाजारपेठ',
    incomingLotsDesc: 'प्रमाणित कबाडीवाल्यांनी सादर केलेल्या डिजिटल लॉटवर बोली लावा. वैध बोली मागणी मूल्याच्या किमान 50% असावी.',
    allLots: 'सर्व लॉट',
    openForBids: 'बोलीसाठी उपलब्ध',
    myBids: 'माझ्या बोल्या',
    handoverPending: 'हस्तांतरण प्रलंबित',
    confirmed: 'प्रमाणित / पूर्ण',
    acceptAsk: 'मागणी मान्य करा',
    decline: 'नाकारा',
    bidAcceptedMsg: 'बोली यशस्वीरित्या स्वीकारली! प्रत्यक्ष क्यूआर स्कॅनसाठी तयार.',

    // Admin Portal
    tabOverview: 'शहरस्तरीय आढावा',
    tabTraceability: 'सामग्री मागोवा साखळी',
    tabUnitEconomics: 'आर्थिक नफा कॅल्क्युलेटर',
    tabVerifications: 'कबाडीवाला केवायसी पडताळणी',
    tabEpr: 'सीपीसीबी 2022 डेटा निर्यात',
    citywideTonnage: 'एकूण गोळा केलेला ई-कचरा',
    activeCollectors: 'नोंदणीकृत भंगार संग्राहक',
    authorizedSmelters: 'सीपीसीबी अधिकृत रीसायकलिंग प्रकल्प',
    monthlyVolume: 'मासिक संकलन (कि.ग्रा.)',
    middlemanCut: 'कमी केलेले मध्यस्थांचे कमिशन',
    incomeBoost: 'संग्राहकाच्या उत्पन्नातील निव्वळ वाढ',
    approveKyc: 'मंजूर करा व सीपीसीबी बॅज द्या',
    rejectKyc: 'नाकारा',
    traceabilityTitle: 'एसएचए-256 सह 4-टप्प्यातील सामग्री मागोवा',
    acceptPickup: 'पिकअप स्वीकारा',
    citizenName: 'नागरिक',
    estimatedPayout: 'अंदाजे रक्कम',
    itemsDeclared: 'नोंदणी केलेले साहित्य',
    simulationControls: 'सिम्युलेशन नियंत्रणे',
    unitEconomicsBadge: 'आर्थिक नफा कॅल्क्युलेटर',
    platformSustainability: 'व्यासपीठ स्वावलंबन मॉडेल:',
    informalMarketLabel: 'सध्याची अनौपचारिक बाजारपेठ (यथास्थिती)',
    formalPlatformLabel: 'कबाडीवाला कनेक्ट व्यासपीठ (औपचारिक)',
    collectorKycTitle: 'संग्राहक केवायसी पडताळणी व ओळखपत्र',
    collectorKycBadge: 'केवायसी पडताळणी',
    kycVerified: 'प्रमाणित',
    kycPending: 'पडताळणी बाकी',
    verifiedCollector: 'प्रमाणित संग्राहक',
    verifiedCitizen: 'प्रमाणित नागरिक',
    verifiedRecycler: 'अधिकृत रीसायकलर',
    verifiedAdmin: 'नियामक प्राधिकरण',

    // Custom Product & Multi-item Keys
    otherCustomProduct: 'इतर / स्वतःचे उत्पादन नाव टाईप करा (कस्टम आयटम)',
    enterProductName: 'उत्पादनाचे नाव टाईप करा (उदा: जुना मायक्रोवेव्ह, इन्व्हर्टर)',
    productNamePlaceholder: 'उदा: इन्व्हर्टर, मायक्रोवेव्ह, स्टॅबिलायझर, टीव्ही...',
    customRatePerKg: 'अपेक्षित दर (₹/kg)',
    addCustomItem: 'सानुकूल उत्पादन जोडा',
    pickupAddressPlaceholder: 'घर/फ्लॅट क्र., रस्त्याचे नाव, परिसर, लँडमार्क, पिनकोड...',
    fetchingLocation: 'स्थान शोधत आहे...',
    fetchLocation: 'पत्यावरून स्थान शोधा',
    locatingGps: 'GPS शोधत आहे...',
    gpsBtn: 'GPS',
    locateBtn: 'स्थान दाखवा',
    pinConfirmsDoorstep: '✓ नकाशावर पिन तपासा. अचूक जागेसाठी ड्रॅग करा.',
    doorstepMapConfirm: 'नकाशावर अचूक जागा निवडा (पिन पुष्टी)',
    schedulePickupSlot: 'पिकअप वेळ निवडा',
    slotToday: 'आज',
    slotWithin2Hrs: '2 तासांच्या आत',
    slotTomorrow: 'उद्या',
    slotWeekend: 'शनिवार / वीकेंड',
    slotSat11AM: 'शनिवारी सकाळी 11 वाजता',
    addMaterialLineItems: 'साहित्याची यादी जोडा',
    materialsInLot: 'लॉटमधील साहित्य',
    materialType: 'साहित्याचा प्रकार',
    weightKg: 'वजन (कि.ग्रा.)',
    customLotName: 'सानुकूल लॉट / उत्पादनाचे नाव',
    liveBenchmarkSub: 'अधिकृत सीपीसीबी बाजार भाव दर. वस्तूच्या बाजूला असलेले स्पीकर चिन्ह दाबून भाव ऐका.',
    lastUpdatedToday: 'शेवटचे अपडेट: आज सकाळी 09:00',
    currentPriceNotice: 'देशभरातील सीपीसीबी नोंदणीकृत केंद्रांकडून प्राप्त थेट दर',
    treeDonationNotice: 'राष्ट्रीय वनीकरण मोहिमेत 5 देशी वृक्षांची लागवड करण्यासाठी मदत.',
    aiDetected: 'AI द्वारे ओळखले गेले:',
    confidenceMatch: 'अचूकता',
    priceStable: 'भाव स्थिर',
    priceIncreasedBy: 'भावात वाढ',
    rupeesPerKg: 'रुपये प्रति किलो',
    expectedRateNote: 'प्रति किलो अपेक्षित किंवा अंदाजे दर',
    addItemToLot: 'लॉटमध्ये साहित्य जोडा',

    // Feedback & System Messages
    pleaseAddOneItem: 'कृपया किमान एक ई-कचरा वस्तू जोडा.',
    failedToCancelPickup: 'संकलन रद्द करणे अयशस्वी:',
    receiptPdfDownloaded: 'पावती पीडीएफ डाउनलोड झाली! (सीपीसीबी ईपीआर प्रमाणित)',
    pleaseAddOneMaterial: 'कृपया कस्टम लॉटमध्ये किमान एक सामग्री जोडा.',
    speechNotSupported: 'या ब्राउझरमध्ये आवाज संश्लेषण (Speech synthesis) उपलब्ध नाही.',

    // Additional Navigation & Settings
    settingsBtn: 'सेटिंग्ज (थीम, डिस्प्ले, आवाज, डेटा)',
    settingsTitle: 'अ‍ॅप सेटिंग्ज',
    settingsSubtitle: 'थीम, डिस्प्ले मोड, आवाज आणि प्रादेशिक प्राधान्ये सानुकूलित करा',
    myProfile: 'माझी प्रोफाइल आणि सुरक्षा',
    mNavEpr: 'ईपीआर',
    welcomeApp: 'कबाडीवाला कनेक्ट',
    loginSubtitleApp: 'स्मार्ट अनौपचारिक कचरा व ईपीआर ट्रेसिबिलिटी प्लॅटफॉर्म. पुढे जाण्यासाठी आपले पोर्टल निवडा.',
    portalCapabilities: 'पोर्टल वैशिष्ट्ये आणि माहिती',

    // Citizen Dashboard Pickups & Doorstep
    tabRequestPickup: 'घरावरून संकलन विनंती करा',
    tabGreenImpact: 'पर्यावरणीय प्रभाव आणि कार्बन बचत',
    'indicative payout:': 'अंदाजे रक्कम:',
    'HANDOVER COMPLETED': 'हस्तांतरण पूर्ण झाले',
    'COLLECTOR DISPATCHED': 'संग्राहक रवाना झाला',
    'LIVE ETA ESTIMATE': 'थेट आगमन वेळ (ETA)',
    'layer 1 verification: citizen handover otp': 'स्तर 1 पडताळणी • घरावरील भंगार हस्तांतरण',
    'SECURE OTP': 'सुरक्षित ओटीपी',
    'layer 1 verified: physical doorstep handover confirmed': 'स्तर 1 प्रमाणित: प्रत्यक्ष हस्तांतरणाची पुष्टी झाली',
    manualOrGps: 'पत्ता लिहा, लिंक पेस्ट करा, किंवा नकाशा वापरा',
    gmapsLinkOpt: 'गुगल मॅप्स लिंक',
    optional: 'पर्यायी',
    pasteLinkOrCoords: 'maps.app.goo.gl किंवा अक्षांश-रेखांश पेस्ट करा',

    // Kabadiwala & Bidding
    bidsReceived: 'बोली',
    minAskRule: 'मागणी मूल्याच्या किमान 50%',
    BIDDING: 'बोली सुरू',
    'layer 2: ai verified': 'स्तर 2: एआय प्रमाणित',
    items: 'प्रकार',
    blendedRate: 'एकत्रित दर',
    askingPrice: 'मागणी किंमत',
    'highestOffer:': 'सर्वोच्च बोली दर:',
    acceptBid: 'बोली स्वीकारा',
    awaitingBids: 'जवळच्या अधिकृत रीसायकलर्सकडून बोलीची प्रतीक्षा आहे.',

    // Profile & Security
    profileSaved: 'वैयक्तिक माहिती यशस्वीरित्या अद्यतनित झाली!',
    pinLengthError: 'नवीन पिन नेमका 4 अंकांचा असावा.',
    pinMismatchError: 'नवीन पिन आणि पुष्टी पिन जुळत नाहीत.',
    pinSuccess: '4-अंकी सुरक्षा पिन यशस्वीरित्या अद्यतनित झाला!',
    otherSessionsLoggedOut: 'वेब आणि अँड्रॉइडवरील इतर सर्व सक्रिय सत्रे समाप्त केली गेली आहेत.',
    eprTraceabilityTitle: 'ईपीआर ट्रेसिबिलिटी आणि पर्यावरणीय प्रभाव',
    eprTraceabilityDesc: 'क्रिप्टोग्राफिक SHA-256 ऑडिट नोंदी आणि सीपीसीबी विल्हेवाट प्रमाणपत्र.',
    wasteDiverted: 'कचरा प्रक्रिया',
    safeProcessing: 'सुरक्षित अधिकृत प्रक्रिया',
    co2ePrevented: 'रोखलेले CO2e',
    zeroBurning: 'शून्य उघड्यावर जाळणे',
    csrEquivalent: 'सीएसआर समतुल्य',
    carbonOffset: 'कार्बन समतोल साधला',
    downloadJsonCert: 'JSON प्रमाणपत्र डाउनलोड करा',
    tollFreeHelpline: 'टोल-फ्री हेल्पलाइन (24/7)',
    tollFreeDesc: 'कोणत्याही भारतीय मोबाइल/लँडलाइनवरून मोफत कॉल',
    emailAssistance: 'थेट ईमेल मदत',
    emailDesc: 'प्रतिसाद वेळ: २ व्यवसाय तासांच्या आत',
    whatsappSupport: 'व्हॉट्सअ‍ॅप बॉट आणि चॅट',
    whatsappDesc: 'त्वरित तक्रार नोंदणी व फोटो पाठवा',
    nodalOfficer: 'नोडल तक्रार निवारण अधिकारी',
    nodalOfficerDesc: 'खाण मंत्रालय / सीपीसीबी तक्रारी',
    faqsTitle: 'नेहमी विचारले जाणारे प्रश्न (FAQ)',
    personalInfoTitle: 'वैयक्तिक माहिती आणि पत्ता',
    personalInfoDesc: 'पडताळणी झालेला मोबाईल, अधिकृत नाव, ईमेल आणि खात्रीशीर संकलन पत्ता.',
    fullName: 'पूर्ण अधिकृत नाव',
    registeredMobile: 'नोंदणीकृत मोबाइल',
    otpVerified: 'ओटीपी पडताळणी पूर्ण',
    emailAddress: 'ईमेल पत्ता',
    pickupWorkshopAddress: 'संकलन / वर्कशॉप पत्ता',
    typeAddressHint: 'पत्ता लिहा, लिंक टाका किंवा नकाशा वापरा',
    addressPlaceholder: 'घर/दुकान क्र., रस्ता, परिसर, लँडमार्क, पिनकोड...',
    locating: 'शोधत आहे...',
    savePersonalDetails: 'वैयक्तिक माहिती जतन करा',
    accountSecurity: 'खाते सुरक्षा आणि क्रेडेंशियल्स',
    accountSecurityDesc: 'तुमचा 4-अंकी सुरक्षा पिन बदला आणि बायोमेट्रिक व्यवस्थापित करा.',
    currentPin: 'सध्याचा पिन',
    newPin: 'नवीन 4-अंकी पिन',
    confirmPin: 'नवीन पिनची पुष्टी करा',
    updatePinBtn: 'सुरक्षा पिन अद्यतन करा',
    biometricUnlock: 'बायोमेट्रिक अनलॉक',
    biometricDesc: 'जलद प्रवेशासाठी फिंगरप्रिंट किंवा फेस अनलॉक वापरा',
    twoFactorAuth: 'टू-फॅक्टर प्रमाणीकरण (2FA)',
    twoFactorDesc: 'संवेदनशील लॉट हस्तांतरण व दर बदलांसाठी एसएमएस ओटीपी पडताळणी आवश्यक करा',
    logoutOtherDevices: 'इतर सर्व डिव्हाइसेसमधून लॉगआउट करा',
    signOutActiveTerminal: 'सक्रिय टर्मिनलवरून बाहेर पडा',
    regulatoryStandards: 'नियामक मानके:',

    // Recycler Dashboard
    totalProcessed: 'एकूण प्रक्रिया केलेले',
    'q2-2026 batch': 'त्रैमासिक 2-2026 बॅच',
    pendingLots: 'प्रलंबित लॉट',
    'from active collectors': 'सक्रिय संग्राहक',
    anomalies: 'विसंगती',
    'review required': 'पुनरावलोकन आवश्यक',
    'no digital lots found matching this filter.': 'या फिल्टरशी जुळणारा कोणताही डिजिटल लॉट आढळला नाही.',
    'show all lots': 'सर्व लॉट पहा',
    'BIDDING OPEN': 'लिलाव / बोली सुरू',
    'OPEN FOR BIDS': 'बोलीसाठी उपलब्ध',
    'COLLECTOR TENDER': 'संग्राहक निविदा',
    minBid: 'किमान बोली (50%)',
    'current top bid': 'सध्याची सर्वोच्च बोली',
    'No bids yet': 'अद्याप कोणतीही बोली नाही',
    'bids received': 'प्राप्त बोली',
    'your bid:': 'तुमची बोली:',
    'Update Bid': 'बोली अद्यतन करा',
    Current: 'सध्याची',
    'Place Bid': 'बोली लावा',
    'Go to QR Handover Verification →': 'क्यूआर हस्तांतरण पडताळणीकडे जा →',

    // Settings
    cacheCleared: 'लोकल कॅश रीफ्रेश झाले आणि डेटासेट यशस्वीरित्या रीसेट झाले.',
    displayAndThemes: 'डिस्प्ले मोड आणि थीम',
    displayThemesDesc: 'लाइट, डार्क किंवा ऑटोमॅटिक थीम निवडा आणि मटेरियल 3 रंग पॅलेट निवडा.',
    chooseAppearance: '1. देखावा (थीम) निवडा',
    accentPalette: '2. मटेरियल 3 रंग पॅलेट',
    languageAndAccessibility: 'भाषा आणि सुलभता',
    languageAccessDesc: 'इंटरफेस भाषा, आवाज मदत आणि कंपन फीडबॅक सेट करा.',
    applicationLanguage: 'अनुप्रयोग भाषा',
    hapticFeedback: 'हॅप्टिक टच फीडबॅक',
    hapticFeedbackDesc: 'बटण दाबल्यावर होणारे हलके कंपन',
    testVoice: 'आवाज मदत तपासा',
    testVoiceDesc: 'मराठी/हिंदीमध्ये बोलून ऑडिओ ऐका',
    playAudio: 'आवाज ऐका',
    dataStorageCompliance: 'डेटा, स्टोरेज आणि नियम पालन',
    dataStorageDesc: 'ऑफलाइन स्थानिक स्टोरेज व्यवस्थापन आणि सीपीसीबी ऑडिट तपशील.',
    resetOfflineData: 'स्थानिक ऑफलाइन डेटा रीसेट करा',
    resetOfflineDesc: 'डेमो बदल साफ करतो आणि सर्व ऑफलाइन लॉट, बुकिंग आणि लेजर अधिकृत सीपीसीबी बेंचमार्कवर रीसेट करतो.',
    resetDataBtn: 'स्थानिक डेटा रीसेट करा',
    deviceSystemMode: 'डिव्हाइस प्रणाली',
    deviceSystemDesc: 'डिव्हाइसच्या प्राधान्यानुसार (लाइट मोड)',
    lightModeLabel: 'लाइट मोड',
    lightModeDesc: 'दिवसा वापरण्यासाठी स्पष्ट आणि चमकदार पृष्ठभाग',
    darkModeLabel: 'डार्क मोड',
    darkModeDesc: 'रात्री डोळ्यांच्या आरामासाठी हाय-कॉन्ट्रास्ट डार्क मोड'
  }
};

// Reverse lookup index for smart matching: Normalized English text -> Key
const reverseLookupIndex: Record<string, string> = {};
Object.entries(translations.en).forEach(([key, val]) => {
  reverseLookupIndex[key.toLowerCase()] = key;
  reverseLookupIndex[val.trim().toLowerCase()] = key;
});

// Additional English phrase aliases for ultra-smart auto-translation
const PHRASE_ALIASES: Record<string, { hi: string; mr: string }> = {
  // Bidding & Market
  'recycler bidding rule:': { hi: 'रीसायकलर बोली नियम:', mr: 'रीसायकलर बोली नियम:' },
  'min 50% of ask value': { hi: 'मांग मूल्य का न्यूनतम 50%', mr: 'मागणी मूल्याच्या किमान 50%' },
  'open for bids': { hi: 'बोली हेतु उपलब्ध', mr: 'बोलीसाठी उपलब्ध' },
  'all lots': { hi: 'सभी लॉट', mr: 'सर्व लॉट' },
  'my bids': { hi: 'मेरी बोलियां', mr: 'माझ्या बोल्या' },
  'handover pending': { hi: 'हस्तांतरण लंबित', mr: 'हस्तांतरण प्रलंबित' },
  'confirmed': { hi: 'सत्यापित / पुष्ट', mr: 'प्रमाणित / पूर्ण' },
  'accept ask': { hi: 'मांग स्वीकार करें', mr: 'मागणी मान्य करा' },
  'decline': { hi: 'अस्वीकार करें', mr: 'नाकारा' },
  'highest offer:': { hi: 'उच्चतम बोली दर:', mr: 'सर्वोच्च बोली दर:' },
  'accept bid': { hi: 'बोली स्वीकार करें', mr: 'बोली स्वीकारा' },
  'awaiting bids from nearby authorized aggregators.': {
    hi: 'निकटवर्ती अधिकृत एग्रीगेटर्स से बोलियों की प्रतीक्षा है।',
    mr: 'जवळच्या अधिकृत रीसायकलर्सकडून बोलीची प्रतीक्षा आहे.'
  },
  'no digital lots found matching this filter.': {
    hi: 'इस फिल्टर से मेल खाता कोई डिजिटल लॉट नहीं मिला।',
    mr: 'या फिल्टरशी जुळणारा कोणताही डिजिटल लॉट आढळला नाही.'
  },
  'show all lots': { hi: 'सभी लॉट दिखाएं', mr: 'सर्व लॉट दाखवा' },

  // Lot Creator & Custom Lots
  'create digital lot': { hi: 'डिजिटल लॉट बनाएं', mr: 'डिजिटल लॉट तयार करा' },
  'my created lots': { hi: 'मेरे बनाए गए लॉट', mr: 'माझे तयार केलेले लॉट' },
  'single material lot': { hi: 'एकल सामग्री लॉट', mr: 'एकच प्रकारचा लॉट' },
  'custom mixed lot': { hi: 'कस्टम मिक्स्ड लॉट', mr: 'कस्टम मिक्स्ड लॉट' },
  'total items': { hi: 'कुल वस्तुएं', mr: 'एकूण वस्तू' },
  'total net wt': { hi: 'कुल शुद्ध वजन', mr: 'एकूण निव्वळ वजन' },
  'blended rate': { hi: 'मिश्रित औसत दर', mr: 'मिश्रित सरासरी दर' },
  'collector:': { hi: 'कबाड़ीवाला:', mr: 'संग्राहक:' },
  'material category:': { hi: 'सामग्री श्रेणी:', mr: 'सामग्री प्रकार:' },
  'approx weight:': { hi: 'अनुमानित वजन:', mr: 'अंदाजे वजन:' },
  'estimated value:': { hi: 'अनुमानित मूल्य:', mr: 'अंदाजे किंमत:' },
  'traceability record sealed': { hi: 'ट्रेसेबिलिटी रिकॉर्ड सीलबंद', mr: 'मागोवा नोंदणी प्रमाणित व सुरक्षित' },
  'view my lots': { hi: 'मेरे लॉट देखें', mr: 'माझे लॉट पहा' },
  'open qr': { hi: 'क्यूआर खोलें', mr: 'क्यूआर उघडा' },
  'no digital lots found in this category.': {
    hi: 'इस श्रेणी में कोई डिजिटल लॉट नहीं मिला।',
    mr: 'या प्रकारात कोणतेही डिजिटल लॉट आढळले नाहीत.'
  },
  'create a new lot now': { hi: 'अभी नया लॉट बनाएं', mr: 'आता नवीन लॉट तयार करा' },
  'ai scanning scrap material...': { hi: 'एआई द्वारा कबाड़ की जांच जारी...', mr: 'एआई द्वारे भंगाराची तपासणी सुरू...' },

  // Multi-Layer Verification
  'layer 1 verification: citizen handover otp': {
    hi: 'स्तर 1 सत्यापन: नागरिक हस्तांतरण ओटीपी',
    mr: 'टप्पा 1 पडताळणी: नागरिक हस्तांतरण ओटीपी'
  },
  'layer 1 verified: physical doorstep handover confirmed': {
    hi: 'स्तर 1 सत्यापित: घर पर प्रत्यक्ष कबाड़ हस्तांतरण संपन्न',
    mr: 'टप्पा 1 प्रमाणित: प्रत्यक्ष घरगुती संकलन पूर्ण'
  },
  'layer 2: ai verified': { hi: 'स्तर 2: एआई द्वारा सत्यापित', mr: 'टप्पा 2: एआई द्वारे प्रमाणित' },
  'layer 3: weighbridge handover verified': {
    hi: 'स्तर 3: धर्मकांटा / वेईब्रिज हस्तांतरण सत्यापित',
    mr: 'टप्पा 3: वजनकाटा हस्तांतरण प्रमाणित'
  },

  // Recycler Metrics & Labels
  'total processed': { hi: 'कुल प्रसंस्कृत स्क्रैप', mr: 'एकूण प्रक्रिया केलेला कचरा' },
  'pending lots': { hi: 'लंबित लॉट', mr: 'प्रलंबित लॉट' },
  'anomalies': { hi: 'विसंगति अलर्ट', mr: 'त्रुटी सूचना' },
  'review required': { hi: 'समीक्षा आवश्यक', mr: 'तपासणी आवश्यक' },
  'facility profile': { hi: 'संयंत्र विवरण', mr: 'प्रकल्प माहिती' },
  'asking price': { hi: 'मांग मूल्य', mr: 'मागणी किंमत' },
  'est. weight': { hi: 'अनुमानित वजन', mr: 'अंदाजे वजन' },
  'current top bid': { hi: 'वर्तमान उच्चतम बोली', mr: 'सध्याची सर्वोच्च बोली' },
  'bids received': { hi: 'प्राप्त बोलियां', mr: 'मिळालेल्या बोल्या' },
  'your bid:': { hi: 'आपकी बोली:', mr: 'आपली बोली:' },
  'q2-2026 batch': { hi: 'तिमाही 2 - 2026 बैच', mr: 'तिमाही 2 - 2026 बॅच' },
  'from active collectors': { hi: 'सक्रिय कबाड़ीवालों से', mr: 'सक्रिय संग्राहकांकडून' },
  'broadcast updated rates to collector price boards': {
    hi: 'सभी कबाड़ीवालों के भाव फलक पर नई दरें प्रसारित करें',
    mr: 'सर्व संग्राहकांच्या फलकावर नवे दर प्रसारित करा'
  },

  // Citizen & Impact
  'indicative payout:': { hi: 'अनुमानित भुगतान:', mr: 'अंदाजे उत्पन्न:' },
  'verifiable receipt': { hi: 'प्रमाणित डिजिटल रसीद', mr: 'प्रमाणित डिजिटल पावती' },
  'zero toxic leaching': { hi: 'शून्य विषैला रिसाव', mr: 'शून्य विषारी गळती' },
  'equivalent to 4 trees': { hi: '4 वृक्षों के बराबर', mr: '4 झाडांच्या बरोबर' },
  'smelter pure ingot': { hi: 'स्मेल्टर शुद्ध धातु सिल्लियां', mr: 'शुद्ध धातू निर्मिती' },
  'eligible for tax rebate': { hi: 'कर छूट हेतु पात्र', mr: 'कर सवलतीस पात्र' },
  'cpcb drop-off': { hi: 'सीपीसीबी ड्रॉप-ऑफ', mr: 'सीपीसीबी संकलन केंद्र' },
  'incentive:': { hi: 'प्रोत्साहन लाभ:', mr: 'प्रोत्साहन लाभ:' },
  'total running balance': { hi: 'कुल शेष राशि', mr: 'एकूण शिल्लक रक्कम' },
  'your live base:': { hi: 'आपका सक्रिय केंद्र:', mr: 'आपले सक्रिय केंद्र:' },
  'lots are cached locally in your phone storage and queued for auto-sync.': {
    hi: 'लॉट आपके फोन स्टोरेज में सुरक्षित हैं और नेटवर्क आने पर अपने आप सिंक हो जाएंगे।',
    mr: 'लॉट तुमच्या फोन स्टोरेजमध्ये सुरक्षित आहेत आणि नेटवर्क आल्यावर आपोआप सिंक होतील.'
  }
};

// Canonical status translator
const STATUS_MAP: Record<string, { en: string; hi: string; mr: string }> = {
  REQUESTED: { en: 'REQUESTED', hi: 'अनुरोध प्राप्त', mr: 'विनंती प्राप्त' },
  ASSIGNED: { en: 'ASSIGNED', hi: 'कबाड़ीवाला नियुक्त', mr: 'संग्राहक नेमला' },
  IN_PROGRESS: { en: 'IN PROGRESS', hi: 'प्रगति पर है', mr: 'सुरू आहे' },
  COMPLETED: { en: 'COMPLETED', hi: 'संपन्न हुआ', mr: 'पूर्ण झाले' },
  AVAILABLE: { en: 'OPEN FOR BIDS', hi: 'बोली हेतु उपलब्ध', mr: 'बोलीसाठी उपलब्ध' },
  BIDDING: { en: 'BIDDING OPEN', hi: 'बोली प्रक्रिया चालू', mr: 'लिलाव / बोली सुरू' },
  HANDOVER_PENDING: { en: 'HANDOVER PENDING', hi: 'हस्तांतरण लंबित', mr: 'हस्तांतरण प्रलंबित' },
  CONFIRMED: { en: 'CONFIRMED', hi: 'सत्यापित / पुष्ट', mr: 'प्रमाणित / पूर्ण' },
  REJECTED: { en: 'REJECTED', hi: 'अस्वीकृत', mr: 'नाकारले' },
  FLAGGED: { en: 'FLAGGED', hi: 'विसंगति चिन्हित', mr: 'त्रुटी नोंदवली' },
  RESOLVED: { en: 'RESOLVED', hi: 'समाधान हुआ', mr: 'निवारण झाले' },
  DISMISSED: { en: 'DISMISSED', hi: 'खारिज', mr: 'रद्द केले' },
  VERIFIED: { en: 'VERIFIED', hi: 'सत्यापित', mr: 'प्रमाणित' },
  PENDING: { en: 'PENDING', hi: 'लंबित', mr: 'प्रलंबित' }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('dhatu_language');
    if (saved === 'hi' || saved === 'mr' || saved === 'en') return saved as Language;
    return 'en';
  });
  const [isSpeaking, setIsSpeaking] = useState(false);
  const synthRef = useRef<SpeechSynthesis | null>(typeof window !== 'undefined' ? window.speechSynthesis : null);

  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('dhatu_language', lang);
  };

  // Voice synthesis pre-warm & voice caching for instant audio on Android/iOS/Web
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const warmup = () => {
        window.speechSynthesis.getVoices();
      };
      warmup();
      window.speechSynthesis.onvoiceschanged = warmup;
      return () => {
        if (window.speechSynthesis) {
          window.speechSynthesis.onvoiceschanged = null;
        }
      };
    }
  }, []);

  /**
   * Smart Translation Engine (t)
   * 1. Exact key match in translations[language]
   * 2. Alias / reverse matching: if key or fallback is English, finds the localized string
   * 3. Status code translation
   * 4. Parameter interpolation: {count}, {weight}, {amount}, etc.
   * 5. Safe fallback
   */
  const t = (key: string, fallback?: string, params?: Record<string, string | number>): string => {
    if (!key && !fallback) return '';

    let result = '';

    // Direct dictionary lookup
    if (translations[language]?.[key]) {
      result = translations[language][key];
    } else if (language === 'en') {
      result = translations.en[key] || fallback || key;
    } else {
      // Smart resolution for vernacular (hi / mr)
      const cleanKey = (key || '').trim().toLowerCase();
      const cleanFallback = (fallback || '').trim().toLowerCase();

      // Check status map
      const upperKey = (key || '').trim().toUpperCase();
      if (STATUS_MAP[upperKey]) {
        result = STATUS_MAP[upperKey][language];
      } else if (PHRASE_ALIASES[cleanKey]?.[language]) {
        result = PHRASE_ALIASES[cleanKey][language];
      } else if (cleanFallback && PHRASE_ALIASES[cleanFallback]?.[language]) {
        result = PHRASE_ALIASES[cleanFallback][language];
      } else {
        // Reverse dictionary lookup
        const mappedKey = reverseLookupIndex[cleanKey] || (cleanFallback ? reverseLookupIndex[cleanFallback] : null);
        if (mappedKey && translations[language]?.[mappedKey]) {
          result = translations[language][mappedKey];
        } else {
          // Dynamic pattern matching
          // e.g. '12.5 kg' -> '12.5 किग्रा' (hi) / '12.5 कि.ग्रा.' (mr)
          const kgMatch = (key || fallback || '').match(/^([0-9.]+)\s*kg$/i);
          if (kgMatch) {
            result = language === 'hi' ? `${kgMatch[1]} किग्रा` : `${kgMatch[1]} कि.ग्रा.`;
          } else {
            // e.g. '3 lots pending sync'
            const pendingSyncMatch = (key || fallback || '').match(/^([0-9]+)\s*lots pending sync$/i);
            if (pendingSyncMatch) {
              result = language === 'hi' ? `${pendingSyncMatch[1]} लॉट सिंक बाकी` : `${pendingSyncMatch[1]} प्रलंबित लॉट सिंक करा`;
            } else {
              result = translations.en[key] || fallback || key;
            }
          }
        }
      }
    }

    // Parameter interpolation if provided
    if (params && typeof params === 'object') {
      Object.entries(params).forEach(([pKey, pVal]) => {
        result = result.replace(new RegExp(`\\{\\s*${pKey}\\s*\\}`, 'g'), String(pVal));
      });
    }

    return result;
  };

  /**
   * Translates status codes into idiomatic local terminology
   */
  const translateStatus = (statusCode: string): string => {
    if (!statusCode) return '';
    const clean = statusCode.trim().toUpperCase();
    return STATUS_MAP[clean]?.[language] || STATUS_MAP[clean]?.en || statusCode;
  };

  /**
   * Smart Speech Synthesis:
   * Selects best voice, smoothly handles fallback for languages without native browser TTS voices (e.g. Marathi),
   * pre-processes currency and units into spoken words, and ensures reliable playback on Android WebView and browsers.
   */
  const speak = (text: string, langOverride?: Language) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    
    try {
      window.speechSynthesis.cancel();
    } catch (e) {
      console.warn('SpeechSynthesis cancel error:', e);
    }

    const targetLang = langOverride || language;
    let spokenText = text;

    // Auto-translate English if speaking in hi or mr and not already Devanagari script
    const hasDevanagari = /[\u0900-\u097F]/.test(spokenText);
    if (targetLang !== 'en' && !hasDevanagari) {
      spokenText = t(text, text);
    }

    // Preprocess text for natural speech cadence and correct Indian pronunciation
    if (targetLang === 'hi') {
      spokenText = spokenText
        .replace(/₹\s*/g, ' रुपये ')
        .replace(/\/\s*kg\b/gi, ' प्रति किलो ')
        .replace(/\bkg\b/gi, ' किलो ')
        .replace(/(\d+)\s*%/g, '$1 प्रतिशत')
        .replace(/(\d+)\s*[-—]\s*(\d+)/g, '$1 से $2')
        .replace(/\bpcbs\b/gi, ' पीसीबी ')
        .replace(/\bpcb\b/gi, ' पीसीबी ')
        .replace(/\bcrt\b/gi, ' सीआरटी ')
        .replace(/\blcd\b/gi, ' एलसीडी ')
        .replace(/\bled\b/gi, ' एलईडी ')
        .replace(/\bram\b/gi, ' रैम ')
        .replace(/\bcpu\b/gi, ' सीपीयू ')
        .replace(/•|\*|#|~|\[|\]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    } else if (targetLang === 'mr') {
      spokenText = spokenText
        .replace(/₹\s*/g, ' रुपये ')
        .replace(/\/\s*kg\b/gi, ' प्रति किलो ')
        .replace(/\bkg\b/gi, ' किलो ')
        .replace(/(\d+)\s*%/g, '$1 टक्के')
        .replace(/(\d+)\s*[-—]\s*(\d+)/g, '$1 ते $2')
        .replace(/\bpcbs\b/gi, ' पीसीबी ')
        .replace(/\bpcb\b/gi, ' पीसीबी ')
        .replace(/\bcrt\b/gi, ' सीआरटी ')
        .replace(/\blcd\b/gi, ' एलसीडी ')
        .replace(/\bled\b/gi, ' एलईडी ')
        .replace(/\bram\b/gi, ' रॅम ')
        .replace(/\bcpu\b/gi, ' सीपीयू ')
        .replace(/•|\*|#|~|\[|\]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    } else {
      spokenText = spokenText
        .replace(/₹\s*/g, ' Rupees ')
        .replace(/\/\s*kg\b/gi, ' per kilogram ')
        .replace(/\bkg\b/gi, ' kilograms ')
        .replace(/•|\*|#|~|\[|\]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }

    const utterance = new SpeechSynthesisUtterance(spokenText);
    activeUtteranceRef.current = utterance;
    const voices = window.speechSynthesis.getVoices();

    const findVoice = (prefix: string, namePart: string) => {
      return voices.find(v => {
        const l = (v.lang || '').toLowerCase().replace('_', '-');
        const n = (v.name || '').toLowerCase();
        return l.startsWith(prefix.toLowerCase()) || n.includes(namePart.toLowerCase());
      });
    };

    if (targetLang === 'hi') {
      utterance.lang = 'hi-IN';
      const hiVoice = findVoice('hi', 'hindi');
      if (hiVoice) utterance.voice = hiVoice;
      utterance.rate = 0.90;
      utterance.pitch = 1.0;
    } else if (targetLang === 'mr') {
      const mrVoice = findVoice('mr', 'marathi');
      if (mrVoice) {
        utterance.voice = mrVoice;
        utterance.lang = 'mr-IN';
      } else {
        // High-fidelity Devanagari fallback: Android WebView typically lacks dedicated mr-IN voice.
        // Falling back to the Indian Devanagari voice with hi-IN language tag allows it to fluently
        // read Marathi Devanagari phonetically without triggering Android TTS language-unsupported error!
        const hiFallbackVoice = findVoice('hi', 'hindi');
        if (hiFallbackVoice) utterance.voice = hiFallbackVoice;
        utterance.lang = 'hi-IN';
      }
      utterance.rate = 0.88;
      utterance.pitch = 1.0;
    } else {
      utterance.lang = 'en-IN';
      const enVoice = findVoice('en-in', 'india') || findVoice('en', 'english');
      if (enVoice) utterance.voice = enVoice;
      utterance.rate = 0.95;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      activeUtteranceRef.current = null;
      setIsSpeaking(false);
    };
    utterance.onerror = (e) => {
      console.warn('TTS playback notification:', e);
      activeUtteranceRef.current = null;
      setIsSpeaking(false);
    };

    setTimeout(() => {
      try {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn('SpeechSynthesis speak error:', err);
      }
    }, 25);
  };

  const stopSpeaking = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {
        console.warn('Stop speech error', e);
      }
      activeUtteranceRef.current = null;
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
   * Translates scrap material names into authentic Hindi, Marathi, or English.
   * Named preserveEnglishItemName for backwards compatibility across all dashboards,
   * with getLocalizedItemName as modern alias.
   * Custom user-typed products (e.g. "Old Microwave", "Inverter") are preserved cleanly.
   */
  const getLocalizedItemName = (name: string): string => {
    if (!name) return '';
    const trimmed = name.trim();
    const lower = trimmed.toLowerCase();

    // 1. Direct match in SCRAP_ITEM_TRANSLATIONS
    if (SCRAP_ITEM_TRANSLATIONS[lower]) {
      return SCRAP_ITEM_TRANSLATIONS[lower][language] || SCRAP_ITEM_TRANSLATIONS[lower].en || trimmed;
    }

    // 2. Substring or partial normalized match
    for (const [key, item] of Object.entries(SCRAP_ITEM_TRANSLATIONS)) {
      if (lower.includes(key) || key.includes(lower)) {
        return item[language] || item.en || trimmed;
      }
    }

    // 3. Fallback to general translation dictionary if key exists
    const directTranslation = translations[language]?.[trimmed] || translations[language]?.[lower];
    if (directTranslation) {
      return directTranslation;
    }

    // 4. Return custom user-typed product name as-is (e.g. "Old Microwave", "Inverter")
    return trimmed;
  };

  const preserveEnglishItemName = getLocalizedItemName;

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
        preserveEnglishItemName,
        getLocalizedItemName,
        translateStatus
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
