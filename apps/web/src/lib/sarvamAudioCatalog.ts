/**
 * Pre-generated Offline Sarvam AI Audio Catalog for Dhatu
 * Synthesized using Sarvam AI bulbul:v3 API (Speaker: aditya)
 * Provides 100% offline static audio file references with zero runtime API calls.
 */

export type SarvamAudioKey = 
  | "auth_language_select"
  | "auth_otp_verify"
  | "auth_phone_login"
  | "bid_accepted"
  | "bids_walkthrough"
  | "brand_intro"
  | "briefing_daily_overview"
  | "chats_walkthrough"
  | "citizen_ai_scanner"
  | "citizen_doorstep_handover"
  | "citizen_eco_rewards"
  | "citizen_schedule_pickup"
  | "citizen_welcome_briefing"
  | "handover_walkthrough"
  | "kyc_rejected_reapply"
  | "kyc_upload_guidance"
  | "kyc_verified_celebration"
  | "kyc_walkthrough"
  | "lot_created_success"
  | "lot_creation_walkthrough"
  | "lot_step_camera"
  | "lot_step_hub"
  | "lot_step_weight"
  | "mandi_aluminium"
  | "mandi_battery"
  | "mandi_copper"
  | "mandi_crt"
  | "mandi_iron"
  | "mandi_laptop"
  | "mandi_listen_all"
  | "mandi_mobile"
  | "mandi_pcb"
  | "mylots_walkthrough"
  | "notifications_walkthrough"
  | "passbook_walkthrough"
  | "pickup_accepted"
  | "pickup_completed"
  | "pickup_otp_guidance"
  | "pickups_walkthrough"
  | "recycler_bidding_room"
  | "recycler_escrow_release"
  | "recycler_weighbridge_scan"
  | "recycler_welcome_briefing"
  | "recyclers_walkthrough"
  | "safety_walkthrough";

export interface SarvamClipMetadata {
  url: string;
  text: string;
  available: boolean;
}

export const SARVAM_AUDIO_CATALOG: Record<SarvamAudioKey, Record<'hi' | 'mr' | 'en', SarvamClipMetadata>> = {
  "auth_language_select": {
    "hi": {
      "url": "/audio/sarvam/hi/auth_language_select.wav",
      "text": "अपनी पसंदीदा भाषा चुनें: हिंदी, मराठी या अंग्रेजी। आप इसे बाद में कभी भी बदल सकते हैं।",
      "available": false
    },
    "mr": {
      "url": "/audio/sarvam/mr/auth_language_select.wav",
      "text": "आपली आवडती भाषा निवडा: मराठी, हिंदी किंवा इंग्रजी. आपण हे नंतर कधीही बदलू शकता.",
      "available": false
    },
    "en": {
      "url": "/audio/sarvam/en/auth_language_select.wav",
      "text": "Select your preferred language: English, Hindi, or Marathi. You can change this anytime from settings.",
      "available": false
    }
  },
  "auth_otp_verify": {
    "hi": {
      "url": "/audio/sarvam/hi/auth_otp_verify.wav",
      "text": "आपके मोबाइल पर 4 अंकों का गुप्त कोड भेजा गया है। कोड दर्ज करके 'सत्यापित करें' दबाएं।",
      "available": false
    },
    "mr": {
      "url": "/audio/sarvam/mr/auth_otp_verify.wav",
      "text": "आपल्या मोबाईलवर 4-अंकी गुप्त कोड पाठवला आहे. कोड प्रविष्ट करून 'पडताळणी करा' दाबा.",
      "available": false
    },
    "en": {
      "url": "/audio/sarvam/en/auth_otp_verify.wav",
      "text": "A 4-digit verification code has been sent to your phone. Enter the code and tap 'Verify'.",
      "available": false
    }
  },
  "auth_phone_login": {
    "hi": {
      "url": "/audio/sarvam/hi/auth_phone_login.wav",
      "text": "अपना 10 अंकों का मोबाइल नंबर दर्ज करें और नीचे दिए गए हरे बटन 'ओटीपी प्राप्त करें' पर टैप करें।",
      "available": false
    },
    "mr": {
      "url": "/audio/sarvam/mr/auth_phone_login.wav",
      "text": "आपला 10-अंकी मोबाईल नंबर प्रविष्ट करा आणि खालील हिरव्या बटनावर 'ओटीपी मिळवा' टॅप करा.",
      "available": false
    },
    "en": {
      "url": "/audio/sarvam/en/auth_phone_login.wav",
      "text": "Enter your 10-digit mobile number and tap the green 'Get OTP' button below to continue.",
      "available": false
    }
  },
  "bid_accepted": {
    "hi": {
      "url": "/audio/sarvam/hi/bid_accepted.wav",
      "text": "बोली स्वीकार कर ली गई है। अब गेट पास क्यूआर कोड लेकर फैक्ट्री के धर्मकांटे पर पहुंचें।",
      "available": true
    },
    "mr": {
      "url": "/audio/sarvam/mr/bid_accepted.wav",
      "text": "बोली स्वीकारली आहे. आता गेट पास क्यूआर कोड घेऊन कारखान्याच्या वजनकाट्यावर पोहोचा.",
      "available": true
    },
    "en": {
      "url": "/audio/sarvam/en/bid_accepted.wav",
      "text": "Bid accepted. Please proceed to the factory weighbridge with your Gate Pass QR code.",
      "available": true
    }
  },
  "bids_walkthrough": {
    "hi": {
      "url": "/audio/sarvam/hi/bids_walkthrough.wav",
      "text": "यहाँ रिसाइकलर्स द्वारा लगाई गई बोलियां दिख रही हैं। जो फैक्ट्री सबसे ज्यादा दाम दे रही है, उसका नाम सबसे ऊपर है। माल बेचने के लिए उसके सामने वाले हरे बटन 'बोली स्वीकार करें' पर दबाएं।",
      "available": true
    },
    "mr": {
      "url": "/audio/sarvam/mr/bids_walkthrough.wav",
      "text": "येथे कारखान्यांनी लावलेल्या बोली दिसत आहेत. सर्वाधिक भाव देणारा कारखाना सर्वात वर आहे. माल विकण्यासाठी समोरील हिरव्या 'बोली स्वीकारा' बटनावर टॅप करा.",
      "available": true
    },
    "en": {
      "url": "/audio/sarvam/en/bids_walkthrough.wav",
      "text": "Here are active recycler bids. The highest paying recycler is at the top. Tap the green 'Accept Bid' button beside their offer to confirm the sale.",
      "available": true
    }
  },
  "brand_intro": {
    "hi": {
      "url": "/audio/sarvam/hi/brand_intro.wav",
      "text": "कबाड़ीवाला कनेक्ट, धातु ई-कचरा मंच। पारदर्शी वजन, त्वरित भुगतान और सरकारी प्रमाणन।",
      "available": false
    },
    "mr": {
      "url": "/audio/sarvam/mr/brand_intro.wav",
      "text": "कबाडीवाला कनेक्ट, धातु ई-कचरा व्यासपीठ. पारदर्शक वजन, त्वरित पेमेंट आणि अधिकृत प्रमाणपत्र.",
      "available": false
    },
    "en": {
      "url": "/audio/sarvam/en/brand_intro.wav",
      "text": "Kabadiwala Connect, Dhatu e-waste formalization platform. Transparent weights, instant payouts, and certified recycling.",
      "available": false
    }
  },
  "briefing_daily_overview": {
    "hi": {
      "url": "/audio/sarvam/hi/briefing_daily_overview.wav",
      "text": "नमस्ते सुरेश जी! धातु ऐप में आपका स्वागत है। आज तांबे का भाव 480 रुपये और उच्च श्रेणी पीसीबी 3,200 रुपये प्रति किलो है। आपके इलाके में 2 नए पिकअप अनुरोध आए हैं। नीचे दिए गए तीसरे बटन 'पिकअप' पर जाकर ग्राहक का पता देखें और कबाड़ उठाएं।",
      "available": true
    },
    "mr": {
      "url": "/audio/sarvam/mr/briefing_daily_overview.wav",
      "text": "नमस्कार सुरेश जी! धातु अ‍ॅपमध्ये आपले स्वागत आहे. आज तांब्याचा भाव 480 रुपये आणि उच्च दर्जाचे पीसीबी 3,200 रुपये प्रति किलो आहे. आपल्या भागात 2 नवीन संकलन विनंत्या आल्या आहेत. खालील तिसऱ्या 'पिकअप' बटनावर जाऊन पत्ता पहा आणि भंगार गोळा करा.",
      "available": true
    },
    "en": {
      "url": "/audio/sarvam/en/briefing_daily_overview.wav",
      "text": "Welcome Suresh ji to Dhatu. Today copper is 480 Rupees and PCB is 3,200 Rupees per kg. You have 2 new pickup requests. Tap the 3rd button 'Pickups' at the bottom to view customer details.",
      "available": true
    }
  },
  "chats_walkthrough": {
    "hi": {
      "url": "/audio/sarvam/hi/chats_walkthrough.wav",
      "text": "यहाँ आप अपने पिकअप ग्राहक या रिसाइक्लिंग फैक्ट्री से सीधे बातचीत कर सकते हैं। जल्दी बोलने के लिए माइक बटन दबाकर वॉयस नोट भेजें।",
      "available": false
    },
    "mr": {
      "url": "/audio/sarvam/mr/chats_walkthrough.wav",
      "text": "येथे आपण संकलन ग्राहक किंवा कारखान्याशी थेट संवाद साधू शकता. जलद बोलण्यासाठी माइक बटण दाबून व्हॉइस नोट पाठवा.",
      "available": false
    },
    "en": {
      "url": "/audio/sarvam/en/chats_walkthrough.wav",
      "text": "Here you can coordinate directly with pickup customers or recycling partners. Tap the microphone button to send an instant spoken voice memo.",
      "available": false
    }
  },
  "citizen_ai_scanner": {
    "hi": {
      "url": "/audio/sarvam/hi/citizen_ai_scanner.wav",
      "text": "अपने पुराने मोबाइल, लैपटॉप या सर्किट बोर्ड का फोटो लें। हमारी एआई तकनीक धातु की शुद्धता और श्रेणी पहचानकर आपको तुरंत सही दाम बताएगी।",
      "available": false
    },
    "mr": {
      "url": "/audio/sarvam/mr/citizen_ai_scanner.wav",
      "text": "आपल्या जुन्या मोबाईल किंवा सर्किट बोर्डचा फोटो काढा. आमची एआय प्रणाली धातूची शुद्धता तपासून अचूक बाजारभाव लगेच दर्शवेल.",
      "available": false
    },
    "en": {
      "url": "/audio/sarvam/en/citizen_ai_scanner.wav",
      "text": "Capture a clear photo of your old device or circuit board. Our AI scanner automatically detects the material grade and estimated market value.",
      "available": false
    }
  },
  "citizen_doorstep_handover": {
    "hi": {
      "url": "/audio/sarvam/hi/citizen_doorstep_handover.wav",
      "text": "कबाड़ीवाले के आने पर उनका सरकारी हरा बैज देखें। डिजिटल तराजू पर वजन देखकर ही अपने फोन पर आया 4 अंकों का ओटीपी साझा करें।",
      "available": false
    },
    "mr": {
      "url": "/audio/sarvam/mr/citizen_doorstep_handover.wav",
      "text": "कबाडीवाला आल्यावर त्यांचा अधिकृत हिरवा बॅज तपासा. डिजिटल काट्यावर वजन पाहूनच आपल्या मोबाईलवरील 4-अंकी ओटीपी सामायिक करा.",
      "available": false
    },
    "en": {
      "url": "/audio/sarvam/en/citizen_doorstep_handover.wav",
      "text": "When the collector arrives, verify their Green Badge. Check the digital scale reading before sharing your 4-digit verification OTP.",
      "available": false
    }
  },
  "citizen_eco_rewards": {
    "hi": {
      "url": "/audio/sarvam/hi/citizen_eco_rewards.wav",
      "text": "प्रत्येक पिकअप पूरा होने पर आपको पर्यावरण हरित अंक और सरकारी सीपीसीबी रिसाइक्लिंग प्रमाण पत्र मिलता है। इसे अपनी प्रोफाइल में देख सकते हैं।",
      "available": false
    },
    "mr": {
      "url": "/audio/sarvam/mr/citizen_eco_rewards.wav",
      "text": "प्रत्येक संकलन पूर्ण झाल्यावर आपल्याला हरित क्रेडिट्स आणि अधिकृत सीपीसीबी प्रमाणपत्र मिळते. आपण ते प्रोफाइलमध्ये पाहू शकता.",
      "available": false
    },
    "en": {
      "url": "/audio/sarvam/en/citizen_eco_rewards.wav",
      "text": "For every completed pickup, you receive eco credits and an official CPCB recycling certificate visible in your environmental profile.",
      "available": false
    }
  },
  "citizen_schedule_pickup": {
    "hi": {
      "url": "/audio/sarvam/hi/citizen_schedule_pickup.wav",
      "text": "पिकअप बुक करने के लिए: सबसे पहले अपने पुराने उपकरणों की सूची चुनें, अपना पता और सुविधाजनक समय चुनें, फिर सबसे नीचे दिए गए हरे बटन 'पिकअप बुक करें' पर दबाएं।",
      "available": false
    },
    "mr": {
      "url": "/audio/sarvam/mr/citizen_schedule_pickup.wav",
      "text": "संकलन बुक करण्यासाठी: प्रथम जुन्या वस्तूंची यादी निवडा, पत्ता आणि सोयीची वेळ ठरवा, नंतर सर्वात खालील हिरव्या बटनावर 'पिकअप बुक करा' दाबा.",
      "available": false
    },
    "en": {
      "url": "/audio/sarvam/en/citizen_schedule_pickup.wav",
      "text": "To book a pickup: select your discarded electronic items, confirm your address and preferred time slot, then tap the green 'Book Pickup' button below.",
      "available": false
    }
  },
  "citizen_welcome_briefing": {
    "hi": {
      "url": "/audio/sarvam/hi/citizen_welcome_briefing.wav",
      "text": "धातु मंच पर आपका स्वागत है। यहाँ आप अपने घर या दफ्तर का पुराना ई-कचरा, लैपटॉप, मोबाइल और तार सीधे अधिकृत कबाड़ीवाले को बेच सकते हैं। पिकअप बुक करने के लिए हरे बटन 'पिकअप शेड्यूल करें' पर दबाएं।",
      "available": false
    },
    "mr": {
      "url": "/audio/sarvam/mr/citizen_welcome_briefing.wav",
      "text": "धातु व्यासपीठावर आपले स्वागत आहे. येथे आपण घरातील किंवा कार्यालयातील जुने ई-कचरा, लॅपटॉप, मोबाईल अधिकृत कबाडीवाल्याला विकू शकता. संकलन बुक करण्यासाठी हिरव्या बटनावर टॅप करा.",
      "available": false
    },
    "en": {
      "url": "/audio/sarvam/en/citizen_welcome_briefing.wav",
      "text": "Welcome to Dhatu. Here you can responsibly sell old electronics, computers, and copper to certified doorstep collectors. Tap the green 'Schedule Pickup' button to start.",
      "available": false
    }
  },
  "handover_walkthrough": {
    "hi": {
      "url": "/audio/sarvam/hi/handover_walkthrough.wav",
      "text": "यह आपका अधिकृत धर्मकांटा गेट पास है। जब आप माल लेकर फैक्ट्री यार्ड पहुंचे, तो गेट पर ऑपरेटर को यह बड़ा क्यूआर कोड दिखाएं। वे इसे स्कैन करके वजन दर्ज करेंगे। आपको कोई कागज दिखाने की जरूरत नहीं है।",
      "available": true
    },
    "mr": {
      "url": "/audio/sarvam/mr/handover_walkthrough.wav",
      "text": "हा आपला अधिकृत वजनकाटा गेट पास आहे. यार्डमध्ये पोहोचल्यावर गेटवरील ऑपरेटरला हा मोठा क्यूआर कोड दाखवा. ते हा कोड स्कॅन करून वजन नोंदवतील. कोणत्याही कागदाची गरज नाही.",
      "available": true
    },
    "en": {
      "url": "/audio/sarvam/en/handover_walkthrough.wav",
      "text": "This is your official weighbridge gate pass. When you reach the factory yard, show this large QR code to the weighbridge operator. They will scan it to record weights. No paperwork is needed.",
      "available": true
    }
  },
  "kyc_rejected_reapply": {
    "hi": {
      "url": "/audio/sarvam/hi/kyc_rejected_reapply.wav",
      "text": "आपके दस्तावेज की फोटो धुंधली होने के कारण सत्यापन अस्वीकृत हुआ है। कृपया अच्छी रोशनी में आधार की नई साफ फोटो खींचकर पुनः जमा करें।",
      "available": false
    },
    "mr": {
      "url": "/audio/sarvam/mr/kyc_rejected_reapply.wav",
      "text": "दस्तावेजाचा फोटो अस्पष्ट असल्याने पडताळणी नाकारली गेली आहे. कृपया चांगल्या प्रकाशात आधारचा नवीन स्पष्ट फोटो काढून पुन्हा सबमिट करा.",
      "available": false
    },
    "en": {
      "url": "/audio/sarvam/en/kyc_rejected_reapply.wav",
      "text": "Your KYC was rejected due to an unclear image. Please capture a clear photo of your Aadhaar in bright light and re-submit.",
      "available": false
    }
  },
  "kyc_upload_guidance": {
    "hi": {
      "url": "/audio/sarvam/hi/kyc_upload_guidance.wav",
      "text": "अपने आधार कार्ड को समतल जगह पर रखें। नीले कैमरा बटन पर दबाकर साफ फोटो लें ताकि नाम और 12 अंक साफ दिखाई दें।",
      "available": false
    },
    "mr": {
      "url": "/audio/sarvam/mr/kyc_upload_guidance.wav",
      "text": "आपले आधार कार्ड सपाट जागी ठेवा. निळ्या कॅमेरा बटनावर दाबून स्पष्ट फोटो घ्या जेणेकरून नाव आणि 12 अंक स्पष्ट दिसतील.",
      "available": false
    },
    "en": {
      "url": "/audio/sarvam/en/kyc_upload_guidance.wav",
      "text": "Place your Aadhaar card on a flat surface. Tap the blue camera button to take a clear photo ensuring your name and 12-digit number are legible.",
      "available": false
    }
  },
  "kyc_verified_celebration": {
    "hi": {
      "url": "/audio/sarvam/hi/kyc_verified_celebration.wav",
      "text": "बधाई हो! आपका आधार सत्यापन पूरा हो गया है। आपको सरकारी सीपीसीबी का हरा बैज मिला है और आपकी दैनिक सीमा 50,000 रुपये हो गई है।",
      "available": false
    },
    "mr": {
      "url": "/audio/sarvam/mr/kyc_verified_celebration.wav",
      "text": "अभिनंदन! आपली आधार पडताळणी पूर्ण झाली आहे. आपल्याला अधिकृत सीपीसीबीचा हिरवा बॅज मिळाला असून आपली दैनिक मर्यादा 50,000 झाली आहे.",
      "available": false
    },
    "en": {
      "url": "/audio/sarvam/en/kyc_verified_celebration.wav",
      "text": "Congratulations! Your Aadhaar KYC is verified. You have earned the certified CPCB Green Badge and your daily transaction limit is raised to 50,000 Rupees.",
      "available": false
    }
  },
  "kyc_walkthrough": {
    "hi": {
      "url": "/audio/sarvam/hi/kyc_walkthrough.wav",
      "text": "बिना आधार सत्यापन के आप दिन में केवल 5,000 रुपये का कबाड़ बेच सकते हैं। अपनी सीमा 50,000 रुपये करने के लिए अपने आधार कार्ड का फोटो खींचकर अपलोड करें। सरकार द्वारा प्रमाणित होने पर आपको सरकारी सीपीसीबी का हरा बैज मिलेगा।",
      "available": true
    },
    "mr": {
      "url": "/audio/sarvam/mr/kyc_walkthrough.wav",
      "text": "आधार पडताळणीशिवाय आपण दिवसाला फक्त 5,000 रुपयांचे भंगार विकू शकता. मर्यादा 50,000 करण्यासाठी आधार कार्डाचा फोटो अपलोड करा. आपल्याला अधिकृत सीपीसीबीचा हिरवा बॅज मिळेल.",
      "available": true
    },
    "en": {
      "url": "/audio/sarvam/en/kyc_walkthrough.wav",
      "text": "Without Aadhaar verification, your daily transaction limit is 5,000 Rupees. Upload your Aadhaar photo to raise your daily limit to 50,000 Rupees and receive a certified CPCB Green Badge.",
      "available": true
    }
  },
  "lot_created_success": {
    "hi": {
      "url": "/audio/sarvam/hi/lot_created_success.wav",
      "text": "बधाई हो! आपका लॉट सफलतापूर्वक दर्ज हो गया है। अब रिसाइक्लर इस पर अपनी बोली लगाएंगे। बोलियां देखने के लिए दूसरे टैब 'लाइव बोलियां' पर जाएं।",
      "available": true
    },
    "mr": {
      "url": "/audio/sarvam/mr/lot_created_success.wav",
      "text": "अभिनंदन! आपला लॉट यशस्वीरित्या नोंदवला गेला आहे. आता कारखाने यावर बोली लावतील. बोली पाहण्यासाठी दुसऱ्या 'थेट लिलाव' टॅबवर जा.",
      "available": true
    },
    "en": {
      "url": "/audio/sarvam/en/lot_created_success.wav",
      "text": "Congratulations! Your lot has been registered. Recyclers will now bid on it. Go to the second tab 'Live Bids' to view offers.",
      "available": true
    }
  },
  "lot_creation_walkthrough": {
    "hi": {
      "url": "/audio/sarvam/hi/lot_creation_walkthrough.wav",
      "text": "नया लॉट बनाने के तीन आसान कदम हैं: पहला, नीचे नीले कैमरा बटन को दबाकर कबाड़ की साफ फोटो लें। दूसरा, कांटे पर वजन तौलकर प्लस और माइनस बटन से वजन सेट करें। तीसरा, अपनी नजदीकी मंडी चुनकर सबसे नीचे हरा बटन 'लॉट जमा करें' दबाएं।",
      "available": true
    },
    "mr": {
      "url": "/audio/sarvam/mr/lot_creation_walkthrough.wav",
      "text": "नवीन लॉट तयार करण्याचे तीन सोपे टप्पे आहेत: पहिला, खालील निळ्या कॅमेरा बटनावर दाबून भंगाराचा स्पष्ट फोटो घ्या. दुसरा, काट्यावरील वजन पाहून प्लस आणि मायनस बटनाने वजन सेट करा. तिसरा, जवळची बाजारपेठ निवडून सर्वात खालील हिरवे बटन 'लॉट जमा करा' दाबा.",
      "available": true
    },
    "en": {
      "url": "/audio/sarvam/en/lot_creation_walkthrough.wav",
      "text": "Creating a lot takes 3 simple steps: First, tap the blue camera button to photograph scrap. Second, set the scale weight using the plus and minus buttons. Third, pick your nearby scrap hub and tap the green 'Submit Lot' button at the bottom.",
      "available": true
    }
  },
  "lot_step_camera": {
    "hi": {
      "url": "/audio/sarvam/hi/lot_step_camera.wav",
      "text": "कैमरा खोलने के लिए नीले कैमरे वाले डिब्बे पर टैप करें। स्क्रैप को अच्छी रोशनी में रखें ताकि धातु की किस्म और तांबे की चमक साफ दिखे। हमारी एआई अपने आप पहचान लेगी।",
      "available": true
    },
    "mr": {
      "url": "/audio/sarvam/mr/lot_step_camera.wav",
      "text": "कॅमेरा उघडण्यासाठी निळ्या कॅमेरा बॉक्सवर टॅप करा. भंगार चांगल्या प्रकाशात ठेवा जेणेकरून धातूचा प्रकार स्पष्ट दिसेल. आमची एआय आपोआप प्रकार ओळखेल.",
      "available": true
    },
    "en": {
      "url": "/audio/sarvam/en/lot_step_camera.wav",
      "text": "Tap the blue camera box to capture photo. Keep scrap in good light so AI can accurately classify the grade.",
      "available": true
    }
  },
  "lot_step_hub": {
    "hi": {
      "url": "/audio/sarvam/hi/lot_step_hub.wav",
      "text": "माल किस स्क्रैप यार्ड या फैक्ट्री में पहुंचाना चाहते हैं, उस यार्ड पर टैप करें। फिर सबसे नीचे बड़े हरे बटन 'लॉट जमा करें' को दबाएं।",
      "available": true
    },
    "mr": {
      "url": "/audio/sarvam/mr/lot_step_hub.wav",
      "text": "माल कोणत्या भंगार बाजारात किंवा कारखान्यात पोहोचवायचा आहे, तो यार्ड निवडा. नंतर सर्वात खालील मोठ्या हिरव्या बटनावर 'लॉट जमा करा' दाबा.",
      "available": true
    },
    "en": {
      "url": "/audio/sarvam/en/lot_step_hub.wav",
      "text": "Select the scrap hub or recycling factory where you want to deliver. Then tap the large green 'Submit Lot' button at the bottom.",
      "available": true
    }
  },
  "lot_step_weight": {
    "hi": {
      "url": "/audio/sarvam/hi/lot_step_weight.wav",
      "text": "कांटे पर जितना वजन आया है, उसे प्लस (+) दबाकर बढ़ाएं या माइनस (-) दबाकर घटाएं। वजन डालते ही नीचे सरकारी मंडी के हिसाब से आपकी कुल कमाई अपने आप दिखने लगेगी।",
      "available": true
    },
    "mr": {
      "url": "/audio/sarvam/mr/lot_step_weight.wav",
      "text": "काट्यावरील वजन प्लस (+) दाबून वाढवा किंवा मायनस (-) दाबून कमी करा. वजन टाकताच खाली बाजारभावानुसार आपली एकूण कमाई आपोआप दिसेल.",
      "available": true
    },
    "en": {
      "url": "/audio/sarvam/en/lot_step_weight.wav",
      "text": "Use the plus (+) and minus (-) buttons to set the scale weight. Your total payout based on official Mandi rates will calculate automatically below.",
      "available": true
    }
  },
  "mandi_aluminium": {
    "hi": {
      "url": "/audio/sarvam/hi/mandi_aluminium.wav",
      "text": "एल्युमिनियम स्क्रैप: 165 रुपये प्रति किलो। साफ तारों और हीटसिंक के लिए आज भाव स्थिर है। 10 किलो के 1,650 रुपये बनते हैं।",
      "available": true
    },
    "mr": {
      "url": "/audio/sarvam/mr/mandi_aluminium.wav",
      "text": "अ‍ॅल्युमिनियम भंगार: 165 रुपये प्रति किलो. स्वच्छ तारा आणि हीटसिंकसाठी आज भाव स्थिर आहे. 10 किलोचे 1,650 रुपये होतात.",
      "available": true
    },
    "en": {
      "url": "/audio/sarvam/en/mandi_aluminium.wav",
      "text": "Aluminium scrap: 165 Rupees per kg. Clean wire and heatsink rate is steady today. 10 kg equals 1,650 Rupees.",
      "available": true
    }
  },
  "mandi_battery": {
    "hi": {
      "url": "/audio/sarvam/hi/mandi_battery.wav",
      "text": "लिथियम-आयन बैटरियां: 120 रुपये प्रति किलो। सावधानी: पानी और आग से दूर रखें। 10 किलो के 1,200 रुपये बनते हैं।",
      "available": true
    },
    "mr": {
      "url": "/audio/sarvam/mr/mandi_battery.wav",
      "text": "लिथियम-आयन बॅटऱ्या: 120 रुपये प्रति किलो. खबरदारी: पाणी आणि आगीपासून दूर ठेवा. 10 किलोचे 1,200 रुपये होतात.",
      "available": true
    },
    "en": {
      "url": "/audio/sarvam/en/mandi_battery.wav",
      "text": "Lithium-ion batteries: 120 Rupees per kg. Caution: Keep away from water and fire. 10 kg equals 1,200 Rupees.",
      "available": true
    }
  },
  "mandi_copper": {
    "hi": {
      "url": "/audio/sarvam/hi/mandi_copper.wav",
      "text": "तांबा स्क्रैप: भाव 480 रुपये प्रति किलो है। कल से भाव 20 रुपये बढ़ा है। 5 किलो के 2,400 रुपये और 10 किलो के 4,800 रुपये बनते हैं।",
      "available": true
    },
    "mr": {
      "url": "/audio/sarvam/mr/mandi_copper.wav",
      "text": "तांबे भंगार: भाव 480 रुपये प्रति किलो आहे. कालपेक्षा भाव 20 रुपयांनी वाढला आहे. 5 किलोचे 2,400 रुपये आणि 10 किलोचे 4,800 रुपये होतात.",
      "available": true
    },
    "en": {
      "url": "/audio/sarvam/en/mandi_copper.wav",
      "text": "Copper scrap: Rate is 480 Rupees per kg, up 20 Rupees from yesterday. 5 kg equals 2,400 Rupees, and 10 kg equals 4,800 Rupees.",
      "available": true
    }
  },
  "mandi_crt": {
    "hi": {
      "url": "/audio/sarvam/hi/mandi_crt.wav",
      "text": "सीआरटी मॉनिटर और ग्लास: 45 रुपये प्रति किलो। शीशा सुरक्षित रखें, टूटने न दें। 10 किलो के 450 रुपये बनते हैं।",
      "available": true
    },
    "mr": {
      "url": "/audio/sarvam/mr/mandi_crt.wav",
      "text": "सीआरटी मॉनिटर आणि काच: 45 रुपये प्रति किलो. काच सुरक्षित ठेवा, फुटू देऊ नका. 10 किलोचे 450 रुपये होतात.",
      "available": true
    },
    "en": {
      "url": "/audio/sarvam/en/mandi_crt.wav",
      "text": "CRT monitor and glass: 45 Rupees per kg. Keep glass intact. 10 kg equals 450 Rupees.",
      "available": true
    }
  },
  "mandi_iron": {
    "hi": {
      "url": "/audio/sarvam/hi/mandi_iron.wav",
      "text": "लोहा और भारी स्टील: 38 रुपये प्रति किलो। भारी कैबिनेट और स्क्रैप के लिए मंडी दर। 50 किलो के 1,900 रुपये बनते हैं।",
      "available": true
    },
    "mr": {
      "url": "/audio/sarvam/mr/mandi_iron.wav",
      "text": "लोखंड आणि जड स्टील: 38 रुपये प्रति किलो. जड कॅबिनेट आणि भंगारासाठी बाजार भाव. 50 किलोचे 1,900 रुपये होतात.",
      "available": true
    },
    "en": {
      "url": "/audio/sarvam/en/mandi_iron.wav",
      "text": "Iron and heavy steel: 38 Rupees per kg. Standard rate for heavy scrap and chassis. 50 kg equals 1,900 Rupees.",
      "available": true
    }
  },
  "mandi_laptop": {
    "hi": {
      "url": "/audio/sarvam/hi/mandi_laptop.wav",
      "text": "लैपटॉप और कंप्यूटर स्क्रैप: 450 रुपये प्रति नग या 280 रुपये प्रति किलो। रैम और मदरबोर्ड अलग निकालने पर ज्यादा दाम मिलता है।",
      "available": true
    },
    "mr": {
      "url": "/audio/sarvam/mr/mandi_laptop.wav",
      "text": "लॅपटॉप आणि संगणक भंगार: 450 रुपये प्रति नग किंवा 280 रुपये प्रति किलो. रॅम आणि मदरबोर्ड वेगळे काढल्यास अधिक भाव मिळतो.",
      "available": true
    },
    "en": {
      "url": "/audio/sarvam/en/mandi_laptop.wav",
      "text": "Laptops and computer scrap: 450 Rupees per unit or 280 Rupees per kg. Separate RAM and motherboard for higher value.",
      "available": true
    }
  },
  "mandi_listen_all": {
    "hi": {
      "url": "/audio/sarvam/hi/mandi_listen_all.wav",
      "text": "आज की आधिकारिक मंडी दरें: तांबा 480 रुपये प्रति किलो, पीसीबी 3,200 रुपये प्रति किलो, एल्युमिनियम 165 रुपये प्रति किलो, लोहा 38 रुपये प्रति किलो, और बैटरियां 120 रुपये प्रति किलो हैं। किसी भी स्क्रैप का 10 किलो का हिसाब सुनने के लिए उसके पीले बटन को दबाएं।",
      "available": true
    },
    "mr": {
      "url": "/audio/sarvam/mr/mandi_listen_all.wav",
      "text": "आजचे अधिकृत बाजार भाव: तांबे 480 रुपये प्रति किलो, पीसीबी 3,200 रुपये प्रति किलो, अ‍ॅल्युमिनियम 165 रुपये प्रति किलो, लोखंड 38 रुपये प्रति किलो, आणि बॅटऱ्या 120 रुपये प्रति किलो आहेत. 10 किलोचा हिशोब ऐकण्यासाठी पिवळे बटन दाबा.",
      "available": true
    },
    "en": {
      "url": "/audio/sarvam/en/mandi_listen_all.wav",
      "text": "Today's official Mandi rates: Copper 480 Rupees/kg, PCB 3,200 Rupees/kg, Aluminium 165 Rupees/kg, Iron 38 Rupees/kg, and Batteries 120 Rupees/kg. Tap the yellow speaker on any card to hear 10kg batch calculations.",
      "available": true
    }
  },
  "mandi_mobile": {
    "hi": {
      "url": "/audio/sarvam/hi/mandi_mobile.wav",
      "text": "स्मार्टफोन और टैबलेट: 85 रुपये प्रति नग या 450 रुपये प्रति किलो। बिना टूटे फोन का अतिरिक्त बोनस मिलता है।",
      "available": true
    },
    "mr": {
      "url": "/audio/sarvam/mr/mandi_mobile.wav",
      "text": "स्मार्टफोन आणि टॅब्लेट: 85 रुपये प्रति नग किंवा 450 रुपये प्रति किलो. अखंड फोनवर अतिरिक्त बोनस मिळतो.",
      "available": true
    },
    "en": {
      "url": "/audio/sarvam/en/mandi_mobile.wav",
      "text": "Smartphones and tablets: 85 Rupees per piece or 450 Rupees per kg. Intact devices receive an extra bonus.",
      "available": true
    }
  },
  "mandi_pcb": {
    "hi": {
      "url": "/audio/sarvam/hi/mandi_pcb.wav",
      "text": "उच्च श्रेणी पीसीबी: 3,200 रुपये प्रति किलो। मदरबोर्ड और सर्वर बोर्ड के लिए सबसे ऊंची मांग है। 5 किलो के 16,000 रुपये बनते हैं।",
      "available": true
    },
    "mr": {
      "url": "/audio/sarvam/mr/mandi_pcb.wav",
      "text": "उच्च दर्जाचे पीसीबी: 3,200 रुपये प्रति किलो. मदरबोर्ड आणि सर्व्हर बोर्डसाठी सर्वाधिक मागणी आहे. 5 किलोचे 16,000 रुपये होतात.",
      "available": true
    },
    "en": {
      "url": "/audio/sarvam/en/mandi_pcb.wav",
      "text": "High-grade PCBs: 3,200 Rupees per kg. Premium demand for server and computer boards. 5 kg equals 16,000 Rupees.",
      "available": true
    }
  },
  "mylots_walkthrough": {
    "hi": {
      "url": "/audio/sarvam/hi/mylots_walkthrough.wav",
      "text": "यहाँ आपके बनाए गए सभी कबाड़ लॉट दिख रहे हैं। जिस लॉट पर रिसाइकलर ने बोली लगाई है, उस पर पीला निशान दिखेगा। बोली देखने के लिए उस लॉट पर टैप करें।",
      "available": true
    },
    "mr": {
      "url": "/audio/sarvam/mr/mylots_walkthrough.wav",
      "text": "येथे आपले तयार केलेले सर्व भंगार लॉट दिसत आहेत. ज्या लॉटवर कारखान्याने बोली लावली आहे, त्यावर पिवळा निशाण दिसेल. बोली पाहण्यासाठी त्या लॉटवर टॅप करा.",
      "available": true
    },
    "en": {
      "url": "/audio/sarvam/en/mylots_walkthrough.wav",
      "text": "Here are all your created scrap lots. Lots that have received recycler bids show a highlighted indicator. Tap on any lot to view offers.",
      "available": true
    }
  },
  "notifications_walkthrough": {
    "hi": {
      "url": "/audio/sarvam/hi/notifications_walkthrough.wav",
      "text": "यहाँ आपके पिकअप, लॉट और सत्यापन से जुड़े सभी नए अलर्ट हैं। बिना पढ़े संदेश देखने के लिए लाल 'अपठित' बटन दबाएं। वापस जाने के लिए ऊपर बाएँ तीर पर दबाएं।",
      "available": false
    },
    "mr": {
      "url": "/audio/sarvam/mr/notifications_walkthrough.wav",
      "text": "येथे संकलन, लॉट आणि पडताळणी संबंधित सर्व सतर्कता आहेत. न वाचलेले संदेश पाहण्यासाठी लाल 'न वाचलेले' बटन दाबा. मागे जाण्यासाठी डाव्या बाणावर टॅप करा.",
      "available": false
    },
    "en": {
      "url": "/audio/sarvam/en/notifications_walkthrough.wav",
      "text": "Here are all real-time alerts for your pickups, lots, and KYC. Tap the red 'Unread' pill to filter unread updates. Tap the top-left arrow to return.",
      "available": false
    }
  },
  "passbook_walkthrough": {
    "hi": {
      "url": "/audio/sarvam/hi/passbook_walkthrough.wav",
      "text": "कैश पासबुक: आपके वॉलेट में 18,400 रुपये उपलब्ध हैं। पिछले पिकअप के 4,800 रुपये आपके बैंक खाते में सफलतापूर्वक भेजे जा चुके हैं। नया भुगतान निकालने के लिए नीचे हरे बटन 'पैसे निकालें' पर दबाएं।",
      "available": true
    },
    "mr": {
      "url": "/audio/sarvam/mr/passbook_walkthrough.wav",
      "text": "कॅश पासबुक: आपल्या वॉलेटमध्ये 18,400 रुपये शिल्लक आहेत. मागील संकलनाचे 4,800 रुपये आपल्या बँकेत जमा झाले आहेत. पैसे काढण्यासाठी खालील हिरव्या बतानावर दाबा.",
      "available": true
    },
    "en": {
      "url": "/audio/sarvam/en/passbook_walkthrough.wav",
      "text": "Cash passbook: You have 18,400 Rupees available. Previous payout of 4,800 Rupees was sent to your bank. Tap 'Withdraw Funds' to transfer earnings.",
      "available": true
    }
  },
  "pickup_accepted": {
    "hi": {
      "url": "/audio/sarvam/hi/pickup_accepted.wav",
      "text": "पिकअप स्वीकार कर लिया गया है। ग्राहक के पते पर पहुंचने के लिए नेविगेशन शुरू करें।",
      "available": true
    },
    "mr": {
      "url": "/audio/sarvam/mr/pickup_accepted.wav",
      "text": "संकलन स्वीकारले आहे. ग्राहकाच्या पत्त्यावर जाण्यासाठी नेव्हिगेशन सुरू करा.",
      "available": true
    },
    "en": {
      "url": "/audio/sarvam/en/pickup_accepted.wav",
      "text": "Pickup accepted. Starting navigation to the customer location.",
      "available": true
    }
  },
  "pickup_completed": {
    "hi": {
      "url": "/audio/sarvam/hi/pickup_completed.wav",
      "text": "ओटीपी सत्यापित हो गया है! पिकअप सफलतापूर्वक पूरा हुआ और भुगतान आपके वॉलेट में जोड़ दिया गया है।",
      "available": true
    },
    "mr": {
      "url": "/audio/sarvam/mr/pickup_completed.wav",
      "text": "ओटीपी यशस्वीरित्या तपासला! संकलन पूर्ण झाले आणि रक्कम आपल्या खात्यात जमा झाली आहे.",
      "available": true
    },
    "en": {
      "url": "/audio/sarvam/en/pickup_completed.wav",
      "text": "OTP verified! Pickup completed successfully and payout has been credited to your wallet.",
      "available": true
    }
  },
  "pickup_otp_guidance": {
    "hi": {
      "url": "/audio/sarvam/hi/pickup_otp_guidance.wav",
      "text": "ग्राहक के मोबाइल पर 4 अंकों का एक सीक्रेट कोड आया होगा। ग्राहक से वह 4 अंक पूछें और इन 4 डिब्बों में भरें, फिर नीचे हरा बटन 'ओटीपी सत्यापित करें' दबाएं। इससे पैसा तुरंत आपके खाते में जमा हो जाएगा।",
      "available": true
    },
    "mr": {
      "url": "/audio/sarvam/mr/pickup_otp_guidance.wav",
      "text": "ग्राहकाच्या मोबाईलवर 4-अंकी कोड आला असेल. ग्राहकाकडून ते 4 अंक विचारा आणि या 4 डब्यांत भरा, नंतर खालील हिरवे बटन 'ओटीपी तपासा' दाबा. रक्कम लगेच आपल्या खात्यात जमा होईल.",
      "available": true
    },
    "en": {
      "url": "/audio/sarvam/en/pickup_otp_guidance.wav",
      "text": "Ask the customer for the 4-digit OTP sent to their mobile. Enter the 4 digits into these boxes and tap the green 'Verify OTP' button to instantly credit your wallet.",
      "available": true
    }
  },
  "pickups_walkthrough": {
    "hi": {
      "url": "/audio/sarvam/hi/pickups_walkthrough.wav",
      "text": "यहाँ आपके आसपास के घरों से पिकअप रिक्वेस्ट हैं। ग्राहक के पास जाने के लिए नीले बटन 'नक्शा देखें' पर दबाएं। फोन करने के लिए हरे फोन बटन पर दबाएं। कबाड़ तोलने के बाद ग्राहक से 4 अंकों का ओटीपी जरूर पूछें।",
      "available": true
    },
    "mr": {
      "url": "/audio/sarvam/mr/pickups_walkthrough.wav",
      "text": "येथे परिसरातील घरांच्या संकलन विनंत्या आहेत. पत्त्यावर जाण्यासाठी निळ्या 'नकाशा' बटनावर दाबा. फोन करण्यासाठी हिरव्या फोन बटनावर दाबा. वजन केल्यावर ग्राहकाकडून 4-अंकी ओटीपी अवश्य घ्या.",
      "available": true
    },
    "en": {
      "url": "/audio/sarvam/en/pickups_walkthrough.wav",
      "text": "Here are doorstep pickup requests. Tap the blue 'Map' button for directions. Tap the green phone button to call the customer. After weighing scrap, collect the 4-digit OTP from the customer.",
      "available": true
    }
  },
  "recycler_bidding_room": {
    "hi": {
      "url": "/audio/sarvam/hi/recycler_bidding_room.wav",
      "text": "लाइव नीलामी कक्ष: नीलामी समाप्त होने से पहले अपनी सर्वोत्तम दर दर्ज करें। बोली स्वीकृत होने पर एस्क्रो धनराशि सुरक्षित हो जाएगी और गेट पास जारी होगा।",
      "available": false
    },
    "mr": {
      "url": "/audio/sarvam/mr/recycler_bidding_room.wav",
      "text": "थेट लिलाव कक्ष: लिलाव संपण्यापूर्वी आपला सर्वोत्तम दर नोंदवा. बोली मंजूर झाल्यावर एस्क्रो रक्कम सुरक्षित होईल आणि गेट पास तयार होईल.",
      "available": false
    },
    "en": {
      "url": "/audio/sarvam/en/recycler_bidding_room.wav",
      "text": "Live Bidding Room: Enter your highest purchase bid before the timer expires. Winning bids lock funds securely in escrow and issue a weighbridge gate pass.",
      "available": false
    }
  },
  "recycler_escrow_release": {
    "hi": {
      "url": "/audio/sarvam/hi/recycler_escrow_release.wav",
      "text": "सामग्री की शुद्धता और नमी जांचने के बाद नीचे दिए गए नीले बटन 'भुगतान जारी करें' पर दबाएं। एस्क्रो से तत्काल भुगतान कलेक्टर के खाते में चला जाएगा।",
      "available": false
    },
    "mr": {
      "url": "/audio/sarvam/mr/recycler_escrow_release.wav",
      "text": "मालाची शुद्धता तपासल्यानंतर खालील निळ्या बटनावर 'रक्कम द्या' दाबा. एस्क्रोमधून त्वरित रक्कम संकलकाच्या खात्यात हस्तांतरित होईल.",
      "available": false
    },
    "en": {
      "url": "/audio/sarvam/en/recycler_escrow_release.wav",
      "text": "After verifying material purity and moisture inspection, tap 'Release Escrow Payout'. Funds will be instantly transferred to the collector's bank account.",
      "available": false
    }
  },
  "recycler_weighbridge_scan": {
    "hi": {
      "url": "/audio/sarvam/hi/recycler_weighbridge_scan.wav",
      "text": "कलेक्टर के ट्रक आगमन पर उनके डिजिटल गेट पास का क्यूआर कोड स्कैन करें। धर्मकांटे का सकल और खाली वजन स्वतः सत्यापित होकर दर्ज हो जाएगा।",
      "available": false
    },
    "mr": {
      "url": "/audio/sarvam/mr/recycler_weighbridge_scan.wav",
      "text": "संकलकाचे वाहन आल्यावर त्यांच्या डिजिटल गेट पासचा क्यूआर कोड स्कॅन करा. वजनकाट्यावरील वजन आपोआप तपासले जाईल.",
      "available": false
    },
    "en": {
      "url": "/audio/sarvam/en/recycler_weighbridge_scan.wav",
      "text": "Scan the collector's digital gate pass QR code upon yard arrival. Gross and tare weights from the calibrated weighbridge are recorded automatically.",
      "available": false
    }
  },
  "recycler_welcome_briefing": {
    "hi": {
      "url": "/audio/sarvam/hi/recycler_welcome_briefing.wav",
      "text": "रिसाइक्लर प्रोक्योरमेंट पोर्टल में आपका स्वागत है। यहाँ प्रमाणित कबाड़ीवालों द्वारा पोस्ट किए गए तांबा, पीसीबी और भारी स्क्रैप के लॉट उपलब्ध हैं। बोली लगाने के लिए किसी भी लॉट पर टैप करें।",
      "available": false
    },
    "mr": {
      "url": "/audio/sarvam/mr/recycler_welcome_briefing.wav",
      "text": "रिसायकलर खरेदी पोर्टलवर आपले स्वागत आहे. येथे अधिकृत संकलकांनी नोंदवलेले तांबे, पीसीबी व जड भंगाराचे लॉट उपलब्ध आहेत. बोली लावण्यासाठी कोणत्याही लॉटवर टॅप करा.",
      "available": false
    },
    "en": {
      "url": "/audio/sarvam/en/recycler_welcome_briefing.wav",
      "text": "Welcome to the Recycler Procurement Portal. Browse verified bulk lots of copper, circuit boards, and battery scrap posted by certified collectors.",
      "available": false
    }
  },
  "recyclers_walkthrough": {
    "hi": {
      "url": "/audio/sarvam/hi/recyclers_walkthrough.wav",
      "text": "यहाँ आपके नजदीकी सभी अधिकृत रिसाइक्लिंग प्लांट और धर्मकांटे दिख रहे हैं। उनकी दूरी और फोन नंबर देखने के लिए कार्ड पर टैप करें। सीधे बात करने के लिए हरे फोन बटन को दबाएं।",
      "available": true
    },
    "mr": {
      "url": "/audio/sarvam/mr/recyclers_walkthrough.wav",
      "text": "येथे आपल्या जवळचे सर्व अधिकृत रिसायकलिंग कारखाने आणि वजनकाटे दिसत आहेत. अंतर आणि फोन नंबर पाहण्यासाठी कार्डवर टॅप करा. थेट बोलण्यासाठी हिरवे फोन बटन दाबा.",
      "available": true
    },
    "en": {
      "url": "/audio/sarvam/en/recyclers_walkthrough.wav",
      "text": "Here are all authorized recycling plants and weighbridges near you. Tap any card to view distance and contact details. Tap the green phone button to call directly.",
      "available": true
    }
  },
  "safety_walkthrough": {
    "hi": {
      "url": "/audio/sarvam/hi/safety_walkthrough.wav",
      "text": "खतरनाक कबाड़ से बचने के नियम: मोबाइल और लैपटॉप की लिथियम बैटरी को कभी न तोड़े और न ही आग या पानी में डालें—इससे विस्फोट हो सकता है। सीआरटी टीवी और शीशा उठाते समय भारी दस्ताने जरूर पहनें।",
      "available": true
    },
    "mr": {
      "url": "/audio/sarvam/mr/safety_walkthrough.wav",
      "text": "धोकादायक कचरा हाताळण्याचे नियम: मोबाईल व लॅपटॉपची लिथियम बॅटरी कधीही फोडू नका किंवा आगीजवळ ठेवू नका. सीआरटी टीव्ही हाताळताना हातमोजे अवश्य वापरा.",
      "available": true
    },
    "en": {
      "url": "/audio/sarvam/en/safety_walkthrough.wav",
      "text": "Hazardous scrap safety: Never puncture lithium batteries or expose them to water or fire. Always wear heavy-duty work gloves when handling CRT glass.",
      "available": true
    }
  }
};

/**
 * Quick lookup helper: returns the static audio URL for a given audio key and language
 */
export function getSarvamStaticAudioUrl(key: string, lang: string): string | null {
  const item = (SARVAM_AUDIO_CATALOG as any)[key];
  if (item && item[lang]?.available) {
    return item[lang].url;
  }
  if (item && item['hi']?.available) {
    return item['hi'].url;
  }
  return null;
}
