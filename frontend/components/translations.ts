export interface Translation {
  header_title: string;
  header_subtitle: string;
  track_badge: string;
  hero_badge: string;
  hero_title: string;
  hero_subtitle: string;
  mic_click: string;
  mic_listening: string;
  search_placeholder: string;
  submit_btn: string;
  processing_btn: string;
  clear_btn: string;
  kbd_enter: string;
  kbd_esc: string;
  empty_state_title: string;
  empty_state_desc: string;
  self_correction_title: string;
  self_correction_prompt: string;
  sample_label: string;
  kpi_sales: string;
  kpi_sales_unit: string;
  kpi_sales_sub: string;
  kpi_orders: string;
  kpi_orders_sub: string;
  kpi_visits: string;
  kpi_visits_sub: string;
  kpi_security: string;
  kpi_security_sub: string;
  tab_analytics: string;
  tab_crm: string;
  bi_mode: string;
  crm_mode: string;
  listen_btn: string;
  crm_success: string;
  next_followup: string;
  sample_prompts: Array<{ text: string; label: string; lang: string }>;
}

export const TRANSLATIONS: Record<string, Translation> = {
  'en-IN': {
    header_title: 'IndicBI',
    header_subtitle: 'Voice-First Business Intelligence & Field CRM for Bharat',
    track_badge: 'Track 06 · AI for Bharat',
    hero_badge: 'Intelligent Voice Dual-Engine (BI + Field CRM)',
    hero_title: 'Speak Naturally to Explore Sales or Log Customer Visits',
    hero_subtitle: 'Empowering Indian MSMEs and field sales executives with real-time analytics and hands-free order entry across 10+ languages.',
    mic_click: 'Click to Speak (or Hold)',
    mic_listening: '● Listening... Speak in English',
    search_placeholder: 'Speak or type: e.g. "Food order delivery is 15000" or "Top products in Gujarat"',
    submit_btn: 'Execute Query',
    processing_btn: 'Processing AI Query...',
    clear_btn: 'Clear',
    kbd_enter: 'Press Enter ↵ to Query',
    kbd_esc: 'Esc to Clear',
    empty_state_title: 'Awaiting Your Spoken or Typed Command',
    empty_state_desc: 'Click the microphone above or pick a sample prompt below to generate real-time charts or log field visits.',
    self_correction_title: 'Voice Not Clearly Recognized',
    self_correction_prompt: 'We could not detect clear business intent. Please speak closer to the mic or try one of the recommended phrases.',
    sample_label: 'Recommended Sample Queries (Click to Test):',
    kpi_sales: 'Total Revenue',
    kpi_sales_unit: 'Lakhs',
    kpi_sales_sub: 'Across 5 Indian States',
    kpi_orders: 'Total Orders',
    kpi_orders_sub: 'FMCG, Pharma & Textiles',
    kpi_visits: 'Field CRM Visits',
    kpi_visits_sub: 'Logged Purely via Voice',
    kpi_security: 'AST Guardrail',
    kpi_security_sub: '100% Read-Only Safety',
    tab_analytics: 'Top Products & Sales Distribution',
    tab_crm: 'Live Field Visits Feed (CRM Ledger)',
    bi_mode: '📊 BI Analytics Mode',
    crm_mode: '📋 Field Sales CRM Mode',
    listen_btn: 'Listen Audio Response (Neural TTS)',
    crm_success: 'Committed CRM Field Activity',
    next_followup: 'Next Scheduled Follow-up',
    sample_prompts: [
      { text: 'Food order delivery is 15000', label: 'English · Food Delivery 15k', lang: 'en-IN' },
      { text: 'Show total sales by Indian states', label: 'English · State Revenue', lang: 'en-IN' },
      { text: 'What was the top selling product last week?', label: 'English · Best Seller', lang: 'en-IN' },
      { text: 'Met Dr. Reddy, ordered 200 strips for 12000', label: 'English · Pharma Order', lang: 'en-IN' },
    ]
  },
  'hi-IN': {
    header_title: 'बोल BI (IndicBI)',
    header_subtitle: 'भारतीय भाषाओं में वॉइस-फर्स्ट बिजनेस इंटेलिजेंस और फील्ड CRM',
    track_badge: 'ट्रैक 06 · AI फॉर भारत',
    hero_badge: 'स्मार्ट वॉइस असिस्टेंट (Smart Dual-Mode Engine)',
    hero_title: '"बोलिए — तुरंत रिपोर्ट देखिए या विज़िट दर्ज करें"',
    hero_subtitle: 'अपनी भाषा में बोलें — तुरंत चार्ट्स देखें या बिना टाइप किए फील्ड ऑर्डर और विज़िट दर्ज करें।',
    mic_click: 'माइक दबाकर बोलें (CLICK TO SPEAK)',
    mic_listening: '● सुन रहे हैं... (हिंदी में बोलें)',
    search_placeholder: 'यहाँ बोलें या टाइप करें (जैसे: फूड ऑर्डर डिलीवरी 15000)...',
    submit_btn: 'पूछें',
    processing_btn: 'प्रोसेसिंग...',
    clear_btn: 'हटाएं (Clear)',
    kbd_enter: 'Enter दबाएं ↵',
    kbd_esc: 'Esc से साफ़ करें',
    empty_state_title: 'आपकी आवाज़ या प्रश्न की प्रतीक्षा है',
    empty_state_desc: 'ऊपर माइक पर क्लिक करें या नीचे दिए गए नमूना प्रश्नों में से किसी एक को चुनें।',
    self_correction_title: 'आवाज़ स्पष्ट नहीं सुनाई दी',
    self_correction_prompt: 'कृपया माइक के पास आकर दोबारा बोलें या नीचे दिए गए प्रश्नों में से चुनें।',
    sample_label: 'नमूना प्रश्न (Try these):',
    kpi_sales: 'कुल बिक्री (Total Sales)',
    kpi_sales_unit: 'लाख',
    kpi_sales_sub: '5 प्रमुख राज्यों में',
    kpi_orders: 'कुल ऑर्डर्स (Orders)',
    kpi_orders_sub: 'FMCG, फार्मा और वस्त्र',
    kpi_visits: 'फील्ड विज़िट्स (CRM)',
    kpi_visits_sub: 'वॉइस द्वारा दर्ज',
    kpi_security: 'डेटा सुरक्षा (Safety)',
    kpi_security_sub: '100% रीड-ओनली सुरक्षित',
    tab_analytics: 'शीर्ष उत्पाद और बिक्री (Analytics)',
    tab_crm: 'लाइव फील्ड विज़िट्स (CRM Feed)',
    bi_mode: '📊 BI एनालिटिक्स मोड',
    crm_mode: '📋 फील्ड सेल्स CRM मोड',
    listen_btn: 'उत्तर सुनें (Listen Voice)',
    crm_success: 'दर्ज की गई CRM प्रविष्टियाँ',
    next_followup: 'अगला फॉलो-अप',
    sample_prompts: [
      { text: 'फूड ऑर्डर डिलीवरी इस 15000', label: 'हिंदी · फूड डिलीवरी 15k', lang: 'hi-IN' },
      { text: 'पिछले हफ्ते कौन सा प्रोडक्ट सबसे ज्यादा बिका?', label: 'हिंदी · बेस्ट सेलर', lang: 'hi-IN' },
      { text: 'आज शर्मा जी से ₹4,500 का पेमेंट कलेक्ट किया', label: 'हिंदी · पेमेंट कलेक्शन', lang: 'hi-IN' },
      { text: 'तमिलनाडु में पिछले 3 महीने की बिक्री कितनी है?', label: 'हिंदी · राज्य बिक्री', lang: 'hi-IN' },
    ]
  },
  'te-IN': {
    header_title: 'ఇండిక్ BI (IndicBI)',
    header_subtitle: 'భారతీయ భాషల్లో వాయిస్-ఆధారిత బిజినెస్ ఇంటెలిజెన్స్ & ఫీల్డ్ CRM',
    track_badge: 'ట్రాక్ 06 · AI ఫర్ భారత్',
    hero_badge: 'వాయిస్ అసిస్టెంట్ (స్మార్ట్ డ్యూయల్-మోడ్ ఇంజిన్)',
    hero_title: '"మాట్లాడండి — రిపోర్ట్ చూడండి లేదా విజిట్ నమోదు చేయండి"',
    hero_subtitle: 'మీరు తెలుగులో మాట్లాడండి — తక్షణ చార్టులు పొందండి లేదా కీబోర్డ్ లేకుండా ఫీల్డ్ ఆర్డర్ నమోదు చేయండి.',
    mic_click: 'మాట్లాడటానికి క్లిక్ చేయండి (CLICK TO SPEAK)',
    mic_listening: '● వింటున్నాము... (తెలుగులో మాట్లాడండి)',
    search_placeholder: 'ఇక్కడ తెలుగులో మాట్లాడండి లేదా టైప్ చేయండి...',
    submit_btn: 'అడగండి',
    processing_btn: 'ప్రాసెసింగ్...',
    clear_btn: 'క్లియర్ చేయండి',
    kbd_enter: 'Enter నొక్కండి ↵',
    kbd_esc: 'Esc నొక్కండి',
    empty_state_title: 'మీ వాయిస్ లేదా ప్రశ్న కోసం వేచి చూస్తున్నాము',
    empty_state_desc: 'మైక్రోఫోన్ క్లిక్ చేసి మాట్లాడండి లేదా క్రింద ఉన్న నమూనా ప్రశ్నలను ప్రయత్నించండి.',
    self_correction_title: 'వాయిస్ స్పష్టంగా గుర్తించబడలేదు',
    self_correction_prompt: 'దయచేసి మైక్రోఫోన్‌కు దగ్గరగా మాట్లాడండి లేదా సరైన వివరాలు చెప్పండి.',
    sample_label: 'నమూనా ప్రశ్నలు (ప్రయత్నించండి):',
    kpi_sales: 'మొత్తం అమ్మకాలు',
    kpi_sales_unit: 'లక్షలు',
    kpi_sales_sub: '5 భారతీయ రాష్ట్రాల్లో',
    kpi_orders: 'మొత్తం ఆర్డర్లు',
    kpi_orders_sub: 'FMCG, ఫార్మా & వస్త్రాలు',
    kpi_visits: 'ఫీల్డ్ విజిట్స్',
    kpi_visits_sub: 'వాయిస్ ద్వారా నమోదు',
    kpi_security: 'డేటా భద్రత',
    kpi_security_sub: '100% రీడ్-ఓన్లీ రక్షణ',
    tab_analytics: 'అత్యధిక అమ్మకాలు & ఉత్పత్తులు',
    tab_crm: 'లైవ్ ఫీల్డ్ విజిట్స్ ఫీడ్ (CRM)',
    bi_mode: '📊 బిజినెస్ అనలిటిక్స్ మోడ్',
    crm_mode: '📋 ఫీల్డ్ సేల్స్ CRM మోడ్',
    listen_btn: 'వాయిస్ వినండి (Listen Voice)',
    crm_success: 'నమోదు చేయబడిన CRM రికార్డులు',
    next_followup: 'తదుపరి ఫాలో-అప్',
    sample_prompts: [
      { text: 'డాక్టర్ రెడ్డి గారు 200 స్ట్రిప్స్ ఆర్డర్ ఇచ్చారు', label: 'తెలుగు · ఫార్మా సేల్స్ ఆర్డర్', lang: 'te-IN' },
      { text: 'గత నెల మొత్తం అమ్మకాలు ఎంత?', label: 'తెలుగు · గత నెల సేల్స్', lang: 'te-IN' },
      { text: 'టాప్ 5 ఉత్పత్తులు ఏవి?', label: 'తెలుగు · టాప్ ప్రొడక్ట్స్', lang: 'te-IN' },
      { text: 'ఫుడ్ ఆర్డర్ డెలివరీ రూ. 15,000 పూర్తయింది', label: 'తెలుగు · ఫుడ్ ఆర్డర్ 15k', lang: 'te-IN' },
    ]
  },
  'ta-IN': {
    header_title: 'இண்டிக் BI (IndicBI)',
    header_subtitle: 'இந்திய மொழிகளில் குரல்வழி வணிக நுண்ணறிவு & ஃபீல்ட் CRM',
    track_badge: 'ட்ராக் 06 · AI ஃபார் பாரத்',
    hero_badge: 'குரல் உதவியாளர் (Voice Assistant)',
    hero_title: '"பேசுங்கள் — அறிக்கையைக் காணுங்கள் அல்லது பதிவிடுங்கள்"',
    hero_subtitle: 'தமிழில் பேசுங்கள் — உடனடி வரைபடங்களைப் பெறுங்கள் அல்லது தட்டச்சு செய்யாமல் பதிவிடுங்கள்.',
    mic_click: 'பேச கிளிக் செய்யவும் (CLICK TO SPEAK)',
    mic_listening: '● கேட்கிறது... (தமிழில் பேசவும்)',
    search_placeholder: 'இங்கே பேசவும் அல்லது தட்டச்சு செய்யவும்...',
    submit_btn: 'கேட்க',
    processing_btn: 'செயலாக்குகிறது...',
    clear_btn: 'அழி (Clear)',
    kbd_enter: 'Enter அழுத்தவும் ↵',
    kbd_esc: 'Esc அழுத்தவும்',
    empty_state_title: 'உங்கள் குரல் அல்லது வினவலுக்காக காத்திருக்கிறது',
    empty_state_desc: 'மேலே உள்ள மைக்கை கிளிக் செய்து பேசவும் அல்லது மாதிரி கேள்விகளைத் தேர்ந்தெடுக்கவும்.',
    self_correction_title: 'குரல் தெளிவாகக் கேட்கவில்லை',
    self_correction_prompt: 'மன்னிக்கவும், மைக்கிற்கு அருகில் பேசவும் அல்லது மீண்டும் ஒருமுறை கூறவும்.',
    sample_label: 'மாதிரி கேள்விகள்:',
    kpi_sales: 'மொத்த விற்பனை',
    kpi_sales_unit: 'லட்சம்',
    kpi_sales_sub: '5 இந்திய மாநிலங்களில்',
    kpi_orders: 'மொத்த ஆர்டர்கள்',
    kpi_orders_sub: 'FMCG, பார்மா மற்றும் ஜவுளி',
    kpi_visits: 'ஃபீல்ட் பதிவுகள்',
    kpi_visits_sub: 'குரல் மூலம் பதிவு',
    kpi_security: 'தரவு பாதுகாப்பு',
    kpi_security_sub: '100% பாதுகாப்பானது',
    tab_analytics: 'முக்கிய தயாரிப்புகள் & விற்பனை',
    tab_crm: 'நேரலை ஃபீல்ட் பதிவுகள் (CRM)',
    bi_mode: '📊 BI அனலிட்டிக்ஸ் பயன்முறை',
    crm_mode: '📋 ஃபீல்ட் சேல்ஸ் CRM பயன்முறை',
    listen_btn: 'குரலைக் கேளுங்கள் (Listen Voice)',
    crm_success: 'பதிவுசெய்யப்பட்ட CRM விவரங்கள்',
    next_followup: 'அடுத்த பின்தொடர்தல்',
    sample_prompts: [
      { text: 'சென்னையில் கடந்த மாத விற்பனை எவ்வளவு?', label: 'தமிழ் · சென்னை விற்பனை', lang: 'ta-IN' },
      { text: 'டாக்டர் ரெட்டி 200 மாத்திரைகள் ஆர்டர் கொடுத்தார்', label: 'தமிழ் · பார்மா ஆர்டர்', lang: 'ta-IN' },
      { text: 'டாப் 5 விற்பனையான பொருட்கள் எவை?', label: 'தமிழ் · டாப் பொருட்கள்', lang: 'ta-IN' },
    ]
  },
  'gu-IN': {
    header_title: 'ઇન્ડિક BI (IndicBI)',
    header_subtitle: 'ભારતીય ભાષાઓમાં વોઇસ-આધારિત બિઝનેસ ઇન્ટેલિજન્સ અને CRM',
    track_badge: 'ટ્રેક 06 · AI ફોર ભારત',
    hero_badge: 'સ્માર્ટ વોઇસ આસિસ્ટન્ટ (Voice Assistant)',
    hero_title: '"બોલો — રિપોર્ટ જુઓ અથવા વિઝિટ નોંધો"',
    hero_subtitle: 'ગુજરાતીમાં બોલો — તાત્કાલિક ચાર્ટ્સ જુઓ અથવા ટાઇપિંગ વગર ઓર્ડર નોંધો.',
    mic_click: 'બોલવા માટે ક્લિક કરો (CLICK TO SPEAK)',
    mic_listening: '● સાંભળી રહ્યા છીએ... (ગુજરાતીમાં બોલો)',
    search_placeholder: 'અહીં બોલો અથવા લખો...',
    submit_btn: 'પૂછો',
    processing_btn: 'પ્રોસેસિંગ...',
    clear_btn: 'સાફ કરો (Clear)',
    kbd_enter: 'Enter દબાવો ↵',
    kbd_esc: 'Esc દબાવો',
    empty_state_title: 'તમારા પ્રશ્નની રાહ જોઈ રહ્યા છીએ',
    empty_state_desc: 'માઇક પર ક્લિક કરો અથવા નીચે આપેલા નમૂના પ્રશ્નો અજમાવો.',
    self_correction_title: 'અવાજ સ્પષ્ટ ન ઓળખાયો',
    self_correction_prompt: 'કૃપા કરીને માઇકની નજીક બોલો અથવા ફરીથી પ્રયાસ કરો.',
    sample_label: 'નમૂના પ્રશ્નો:',
    kpi_sales: 'કુલ વેચાણ (Sales)',
    kpi_sales_unit: 'લાખ',
    kpi_sales_sub: '૫ ભારતીય રાજ્યોમાં',
    kpi_orders: 'કુલ ઓર્ડર્સ',
    kpi_orders_sub: 'FMCG અને કાપડ',
    kpi_visits: 'ફીલ્ડ વિઝિટ્સ',
    kpi_visits_sub: 'અવાજ દ્વારા નોંધણી',
    kpi_security: 'ડેટા સુરક્ષા',
    kpi_security_sub: '૧૦૦% સલામત',
    tab_analytics: 'શ્રેષ્ઠ ઉત્પાદનો અને વેચાણ',
    tab_crm: 'લાઇવ ફીલ્ડ વિઝિટ્સ (CRM)',
    bi_mode: '📊 BI એનાલિટિક્સ મોડ',
    crm_mode: '📋 ફીલ્ડ સેલ્સ CRM મોડ',
    listen_btn: 'અવાજ સાંભળો (Listen Voice)',
    crm_success: 'નોંધાયેલ CRM વિગતો',
    next_followup: 'આગામી ફોલો-અપ',
    sample_prompts: [
      { text: 'ગયા મહિને સુરત અને અમદાવાદનું વેચાણ બતાવો', label: 'ગુજરાતી · શહેર સરખામણી', lang: 'gu-IN' },
      { text: 'પટેલ ટેક્સટાઇલ તરફથી ₹25,000 નો ઓર્ડર મળ્યો', label: 'ગુજરાતી · ઓર્ડર 25k', lang: 'gu-IN' },
    ]
  },
  'kn-IN': {
    header_title: 'ಇಂಡಿಕ್ BI (IndicBI)',
    header_subtitle: 'ಭಾರತೀಯ ಭಾಷೆಗಳಲ್ಲಿ ಧ್ವನಿ ಆಧಾರಿತ ವ್ಯಾಪಾರ ಬುದ್ಧಿಮತ್ತೆ & CRM',
    track_badge: 'ಟ್ರ್ಯಾಕ್ 06 · AI ಫಾರ್ ಭಾರತ್',
    hero_badge: 'ಧ್ವನಿ ಸಹಾಯಕ (Voice Assistant)',
    hero_title: '"ಮಾತನಾಡಿ — ವರದಿ ನೋಡಿ ಅಥವಾ ಭೇಟಿ ದಾಖಲಿಸಿ"',
    hero_subtitle: 'ಕನ್ನಡದಲ್ಲಿ ಮಾತನಾಡಿ — ತಕ್ಷಣ ಚಾರ್ಟ್ಸ್ ಪಡೆಯಿರಿ ಅಥವಾ ಟೈಪ್ ಮಾಡದೆ ಆರ್ಡರ್ ದಾಖಲಿಸಿ.',
    mic_click: 'ಮಾತನಾಡಲು ಕ್ಲಿಕ್ ಮಾಡಿ (CLICK TO SPEAK)',
    mic_listening: '● ಆಲಿಸಲಾಗುತ್ತಿದೆ... (ಕನ್ನಡದಲ್ಲಿ ಮಾತನಾಡಿ)',
    search_placeholder: 'ಇಲ್ಲಿ ಮಾತನಾಡಿ ಅಥವಾ ಟೈಪ್ ಮಾಡಿ...',
    submit_btn: 'ಕೇಳಿ',
    processing_btn: 'ಸಂಸ್ಕರಿಸಲಾಗುತ್ತಿದೆ...',
    clear_btn: 'ತೆರವುಗೊಳಿಸಿ (Clear)',
    kbd_enter: 'Enter ಒತ್ತಿ ↵',
    kbd_esc: 'Esc ಒತ್ತಿ',
    empty_state_title: 'ನಿಮ್ಮ ಧ್ವನಿ ಅಥವಾ ಪ್ರಶ್ನೆಗಾಗಿ ಕಾಯುತ್ತಿದ್ದೇವೆ',
    empty_state_desc: 'ಮೈಕ್ ಕ್ಲಿಕ್ ಮಾಡಿ ಅಥವಾ ಕೆಳಗಿನ ಮಾದರಿ ಪ್ರಶ್ನೆಗಳನ್ನು ಪ್ರಯತ್ನಿಸಿ.',
    self_correction_title: 'ಧ್ವನಿ ಸ್ಪಷ್ಟವಾಗಿ ಕೇಳಿಸಲಿಲ್ಲ',
    self_correction_prompt: 'ದಯವಿಟ್ಟು ಮೈಕ್ರೋಫೋನ್ ಹತ್ತಿರ ಮಾತನಾಡಿ ಅಥವಾ ಮತ್ತೊಮ್ಮೆ ಹೇಳಿ.',
    sample_label: 'ಮಾದರಿ ಪ್ರಶ್ನೆಗಳು:',
    kpi_sales: 'ಒಟ್ಟು ಮಾರಾಟ',
    kpi_sales_unit: 'ಲಕ್ಷ',
    kpi_sales_sub: '5 ಭಾರತೀಯ ರಾಜ್ಯಗಳಲ್ಲಿ',
    kpi_orders: 'ಒಟ್ಟು ಆರ್ಡರ್‌ಗಳು',
    kpi_orders_sub: 'FMCG ಮತ್ತು ಫಾರ್ಮಾ',
    kpi_visits: 'ಕ್ಷೇತ್ರ ಭೇಟಿಗಳು',
    kpi_visits_sub: 'ಧ್ವನಿಯ ಮೂಲಕ ದಾಖಲು',
    kpi_security: 'ಡೇಟಾ ಸುರಕ್ಷತೆ',
    kpi_security_sub: '100% ಸುರಕ್ಷಿತ',
    tab_analytics: 'ಉನ್ನತ ಉತ್ಪನ್ನಗಳು ಮತ್ತು ಮಾರಾಟ',
    tab_crm: 'ಲೈವ್ ಫೀಲ್ಡ್ ಭೇಟಿಗಳು (CRM)',
    bi_mode: '📊 BI ಅನಾಲಿಟಿಕ್ಸ್ ಮೋಡ್',
    crm_mode: '📋 ಫೀಲ್ಡ್ ಸೇಲ್ಸ್ CRM ಮೋಡ್',
    listen_btn: 'ಧ್ವನಿ ಆಲಿಸಿ (Listen Voice)',
    crm_success: 'ದಾಖಲಾದ CRM ವಿವರಗಳು',
    next_followup: 'ಮುಂದಿನ ಫಾಲೋ-ಅಪ್',
    sample_prompts: [
      { text: 'ಕಳೆದ ತಿಂಗಳ ಒಟ್ಟು ಮಾರಾಟ ಎಷ್ಟು?', label: 'ಕನ್ನಡ · ಮಾರಾಟ ಮಾಹಿತಿ', lang: 'kn-IN' },
      { text: 'ಡಾక్టర్ ರೆಡ್ಡಿ 200 ಸ್ಟ್ರಿಪ್ಸ್ ಆರ್ಡರ್ ನೀಡಿದ್ದಾರೆ', label: 'ಕನ್ನಡ · ಫಾರ್ಮಾ ಆರ್ಡರ್', lang: 'kn-IN' },
    ]
  }
};
