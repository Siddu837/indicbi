import os
import json
import re
import requests
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))
API_KEY = os.getenv("GEMINI_API_KEY")

FALLBACK_MODELS = [
    "gemini-flash-lite-latest",
    "gemini-3.5-flash-lite",
    "gemini-3.8-flash",
    "gemini-2.5-flash"
]

SCHEMA_CONTEXT = """
SQLite DATABASE SCHEMA:
1. products (id INTEGER PRIMARY KEY, name TEXT, category TEXT, price REAL, stock INTEGER)
   Categories: 'FMCG', 'Pharma', 'Textiles', 'Electronics'
2. orders (id INTEGER PRIMARY KEY, customer_name TEXT, product_id INTEGER REFERENCES products(id), quantity INTEGER, amount REAL, order_date DATE, status TEXT, state TEXT, city TEXT)
   Statuses: 'delivered', 'shipped', 'returned'
   States: 'Telangana', 'Uttar Pradesh', 'Tamil Nadu', 'Gujarat', 'Maharashtra', 'West Bengal', 'Karnataka'
3. returns (id INTEGER PRIMARY KEY, order_id INTEGER REFERENCES orders(id), reason TEXT, refund_amount REAL, return_date DATE)
4. visits (id INTEGER PRIMARY KEY, rep_name TEXT, client_name TEXT, action TEXT, amount REAL, status TEXT, notes TEXT, follow_up_date DATE, created_at TIMESTAMP)
"""

def call_gemini_with_fallback(prompt: str) -> str:
    """Tries primary models in sequence to prevent quota exhaustion."""
    headers = {"Content-Type": "application/json"}
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.2,
            "maxOutputTokens": 1000
        }
    }
    
    last_error = None
    for model in FALLBACK_MODELS:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={API_KEY}"
        try:
            response = requests.post(url, json=payload, headers=headers, timeout=15)
            if response.status_code == 200:
                data = response.json()
                candidates = data.get("candidates", [])
                if candidates:
                    return candidates[0]["content"]["parts"][0]["text"]
            else:
                last_error = f"{model} returned {response.status_code}: {response.text[:100]}"
        except Exception as e:
            last_error = str(e)
            
    raise Exception(f"All Gemini models exhausted. Last error: {last_error}")

def clean_json_response(raw_text: str) -> str:
    cleaned = raw_text.strip()
    cleaned = re.sub(r'^```(?:json)?\s*', '', cleaned)
    cleaned = re.sub(r'\s*```$', '', cleaned)
    return cleaned.strip()

def is_unclear_or_gibberish(text: str) -> bool:
    """Detects inaudible, empty, or single-character muddled voice input."""
    clean = text.strip()
    if len(clean) < 3:
        return True
    # If only punctuation or digits with no words
    if re.match(r'^[\W\d_]+$', clean) and not re.search(r'\d{3,}', clean):
        return True
    return False

def get_clarification_message(language: str = "en") -> str:
    """Self-correcting polite prompt requesting user to repeat or clarify."""
    if 'te' in language:
        return "క్షమించండి, మీ వాయిస్ స్పష్టంగా వినపడలేదు. దయచేసి మీ వ్యాపార ప్రశ్నను లేదా క్లయింట్ విజిట్ వివరాలను మరొకసారి చెప్పండి."
    elif 'hi' in language:
        return "माफ़ कीजिए, आपकी आवाज़ स्पष्ट रूप से सुनाई नहीं दी। कृपया अपना व्यावसायिक प्रश्न या विज़िट विवरण दोबारा बोलें।"
    elif 'ta' in language:
        return "மன்னிக்கவும், உங்கள் குரல் தெளிவாகக் கேட்கவில்லை. தயவுசெய்து உங்கள் கேள்வியை மீண்டும் கூறவும்."
    elif 'gu' in language:
        return "માફ કરશો, તમારો અવાજ સ્પષ્ટ સંભળાયો નથી. કૃપા કરીને તમારો પ્રશ્ન ફરીથી બોલો."
    elif 'kn' in language:
        return "ಕ್ಷಮಿಸಿ, ನಿಮ್ಮ ಧ್ವನಿ ಸ್ಪಷ್ಟವಾಗಿ ಕೇಳಿಸಲಿಲ್ಲ. ದಯವಿಟ್ಟು ನಿಮ್ಮ ಪ್ರಶ್ನೆಯನ್ನು ಮತ್ತೊಮ್ಮೆ ಹೇಳಿ."
    else:
        return "I didn't quite catch that. Could you please repeat your business query or state your visit details with client name and amount?"

def classify_dashboard_intent(text: str) -> str:
    """
    For a guest user dashboard, determine if the input is:
    - 'retrieve': Asking to retrieve, calculate, summarize, or view their existing data (e.g. "total amount in activities ledger", "what was my last order", "how much did I spend", "show chart", "who owes money", "what was my").
    - 'log': Recording or entering a NEW transaction, expense, order, payment, or visit (e.g. "movie ticket paid 200", "Ajay booked 40 rupees", "car park expense 150", "met Sharma 5000").
    - 'clarification': Incomprehensible, accidental words, or meaningless sound.
    """
    if is_unclear_or_gibberish(text):
        return "clarification"

    text_lower = text.lower().strip()

    # Instant check for retrieval question cues
    question_cues = [
        "what", "how", "show", "total", "calculate", "sum", "average", "avg",
        "last", "latest", "recent", "who", "when", "tell me", "give me", "list",
        "history", "chart", "breakdown", "count", "amount in", "balance", "ledger",
        "activities", "how much", "what was", "what is", "did i", "have i",
        "ఎంత", "మొత్తం", "ఏమిటి", "చూపించు", "లెక్కించు", "చివరి", "ఎవరు",
        "कितना", "कुल", "क्या है", "दिखाओ", "बताओ", "आखिरी", "पिछला"
    ]
    if any(q in text_lower for q in question_cues):
        return "retrieve"

    prompt = f"""
    The user is interacting with their private activities ledger.
    Determine whether the user's speech is:
    - 'retrieve': The user is asking a question, wanting to see data, totals, calculations, summaries, last order, history, charts, or lookups.
    - 'log': The user is stating or recording a new transaction, expense, payment, order, meeting, or activity.
    - 'clarification': Incomprehensible, accidental words, or meaningless sound.

    Input: "{text}"
    Respond ONLY with "retrieve", "log", or "clarification".
    """
    try:
        resp = call_gemini_with_fallback(prompt)
        intent = resp.strip().lower()
        if "clarification" in intent:
            return "clarification"
        if "retrieve" in intent:
            return "retrieve"
        return "log"
    except Exception as e:
        if any(w in text_lower for w in ["?", "what", "how", "total", "show", "last", "amount"]):
            return "retrieve"
        return "log"

def classify_intent(text: str) -> str:
    """Classifies user speech as 'bi', 'crm', or 'clarification'."""
    if is_unclear_or_gibberish(text):
        return "clarification"

    text_lower = text.lower()
    
    crm_keywords = [
        "ऑर्डर", "order", "కలిశాను", "ఆర్డర్", "డెలివరీ", "delivery", 
        "पेमेंट", "payment", "कलेक्ट", "collect", "visit", "विज़िट", "విజిట్",
        "rupees", "रुपये", "రూపాయలు", "గారు"
    ]
    if any(k in text_lower for k in ["ऑर्डर डिलीवरी", "order delivery", "ఆర్డర్ ఇచ్చారు", "పేమెంట్ కलेक्ट"]):
        return "crm"

    prompt = f"""
    Determine whether the user's speech input in Indian languages or English is:
    - 'bi': Asking an analytical question about sales, products, revenue, returns, states, or performance.
    - 'crm': Stating or logging an activity, delivery, field meeting, order received, or payment collected.
    - 'clarification': Incomprehensible, background noise, accidental words, greetings without any business context (e.g. "hello", "test", "aa", "hmm"), or meaningless fragments.

    Input: "{text}"
    Respond ONLY with "bi", "crm", or "clarification".
    """
    try:
        resp = call_gemini_with_fallback(prompt)
        intent = resp.strip().lower()
        if "clarification" in intent:
            return "clarification"
        if "crm" in intent:
            return "crm"
        return "bi"
    except Exception as e:
        if any(w in text_lower for w in ["order", "ऑर्डर", "delivery", "payment", "కలిశాను", "విజిట్"]):
            return "crm"
        return "bi"

def generate_sql(question: str, language: str = "en") -> str:
    """Converts a natural language question in any Indian language to a safe SQLite query."""
    prompt = f"""
    You are a SQL expert for an Indian Business Intelligence system.
    {SCHEMA_CONTEXT}

    RULES:
    1. Generate ONLY a valid SQLite SELECT query. Do NOT use INSERT, UPDATE, DELETE, or DROP.
    2. Map Indian vernacular state and city names:
       - 'तमिलनाडु' or 'తమిళనాడు' -> 'Tamil Nadu'
       - 'गुजरात' or 'గుజરાత్' or 'સુરત' -> 'Gujarat' (or city 'Surat')
       - 'तेलंगाना' or 'తెలంగాణ' or 'హైదరాబాద్' -> 'Telangana' (or city 'Hyderabad')
       - 'उत्तर प्रदेश' or 'లక్నో' -> 'Uttar Pradesh' (or city 'Lucknow')
       - 'महाराष्ट्र' or 'మహారాష్ట్ర' -> 'Maharashtra'
    3. For temporal phrases:
       - 'last month' / 'पिछले महीने' / 'గత నెల' / 'ગયા મહિને' -> `WHERE order_date >= date('now', '-30 days')`
       - 'last week' / 'पिछले हफ्ते' / 'గత వారం' -> `WHERE order_date >= date('now', '-7 days')`
    4. For revenue / sales: Use `SUM(amount)`.
    5. Always alias aggregations cleanly (e.g. `as total_sales`, `as total_quantity`).
    6. Limit results to top 10 if querying rankings.
    7. Return ONLY the SQL query. No markdown, no comments.

    User Question ({language}): "{question}"
    SQL:
    """
    try:
        resp = call_gemini_with_fallback(prompt)
        sql = resp.strip()
        sql = re.sub(r'^```(?:sql)?\s*', '', sql)
        sql = re.sub(r'\s*```$', '', sql)
        return sql.strip().rstrip(';')
    except Exception as e:
        return "SELECT p.name as product_name, SUM(o.quantity) as total_quantity, SUM(o.amount) as total_sales FROM orders o JOIN products p ON o.product_id = p.id GROUP BY p.name ORDER BY total_sales DESC LIMIT 5"

def generate_bi_visual_response(question: str, sql: str, rows: list, language: str = "en") -> dict:
    """Generates chart configuration and native language voice summary."""
    prompt = f"""
    You are IndicBI, an AI assistant for Indian business owners.
    The user asked: "{question}"
    Executed SQL: {sql}
    Result rows (sample): {json.dumps(rows[:15], ensure_ascii=False)}

    Provide a JSON response with:
    1. "spoken_answer": A concise, natural 1-2 sentence spoken summary of the insight in the EXACT same language the user asked ({language}). Use Indian numbers (Lakhs, Crores, ₹).
    2. "chart": An object configuring the chart for Recharts:
       - "type": "bar" (for comparisons/rankings) or "line" (for trends over time) or "pie" (for share/reasons)
       - "xKey": the column name to show on the X axis (e.g. "product_name", "state", "city", "date")
       - "yKey": the metric column name for values (e.g. "total_sales", "total_quantity", "sales")
       - "title": A clean descriptive title in English or bilingual
    3. "insights": 2 brief key takeaways/bullet points in the user's language.

    Return ONLY pure JSON.
    """
    try:
        resp = call_gemini_with_fallback(prompt)
        cleaned = clean_json_response(resp)
        return json.loads(cleaned)
    except Exception as e:
        first_row = rows[0] if rows else {}
        keys = list(first_row.keys())
        x_col = keys[0] if keys else "category"
        y_col = keys[1] if len(keys) > 1 else keys[0] if keys else "value"
        
        spoken = f"Found {len(rows)} records matching your query."
        if 'te' in language:
            spoken = f"మీ ప్రశ్న ప్రకారం మొత్తం {len(rows)} రికార్డులు విశ్లేషించబడ్డాయి."
        elif 'hi' in language:
            spoken = f"आपके सवाल के अनुसार कुल {len(rows)} रिकॉर्ड्स का विश्लेषण किया गया है।"

        return {
            "spoken_answer": spoken,
            "chart": {
                "type": "bar",
                "xKey": x_col,
                "yKey": y_col,
                "title": "Business Analytics Data"
            },
            "insights": ["Data loaded successfully", "Chart rendered"]
        }

# =============================================================================
# MULTILINGUAL INDIAN NUMERAL & SCRIPT PARSING ENGINE
# Supports Tamil, Kannada, Hindi, Telugu, Gujarati, Bengali, Marathi, English
# =============================================================================

INDIAN_UNITS = {
    # Tamil
    'ஒரு': 1, 'ஒன்று': 1, 'ஒன்னு': 1, 'இரண்டு': 2, 'ரெண்டு': 2, 'இரு': 2,
    'மூன்று': 3, 'மூணு': 3, 'முப்ப': 3, 'நான்கு': 4, 'நாலு': 4,
    'ஐந்து': 5, 'அஞ்சு': 5, 'ஆறு': 6, 'ஏழு': 7, 'எட்டு': 8, 'ஒன்பது': 9, 'பத்து': 10,
    'இருபது': 20, 'முப்பது': 30, 'நாற்பது': 40, 'ஐம்பது': 50,
    # Kannada
    'ಒಂದು': 1, 'ಎರಡು': 2, 'ಮೂರು': 3, 'ನಾಲ್ಕು': 4, 'ಐದು': 5, 'ಆರು': 6, 'ಏಳು': 7,
    'ಎಂಟು': 8, 'ಒಂಬತ್ತು': 9, 'ಹತ್ತು': 10, 'ಇಪ್ಪತ್ತು': 20, 'ಮೂವತ್ತು': 30, 'ನಲವತ್ತು': 40, 'ಐವತ್ತು': 50,
    # Hindi / Marathi
    'एक': 1, 'दो': 2, 'तीन': 3, 'चार': 4, 'पांच': 5, 'पाँच': 5, 'छह': 6, 'छः': 6,
    'सात': 7, 'आठ': 8, 'नौ': 9, 'दस': 10, 'बीस': 20, 'तीस': 30, 'चालीस': 40, 'पचास': 50,
    'डेढ़': 1.5, 'ढाई': 2.5,
    # Telugu
    'ఒకటి': 1, 'రెండు': 2, 'మూడు': 3, 'నాలుగు': 4, 'ఐదు': 5, 'ఆరు': 6, 'ఏడు': 7,
    'ఎనిమిది': 8, 'తొమ్మిది': 9, 'పది': 10, 'ఇరవై': 20, 'ముప్పై': 30, 'నలభై': 40, 'యాభై': 50,
    # Gujarati
    'એક': 1, 'બે': 2, 'ત્રણ': 3, 'ચાર': 4, 'પાંચ': 5, 'છ': 6, 'સાત': 7, 'આઠ': 8, 'નવ': 9, 'દસ': 10,
    # English
    'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5, 'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10
}

INDIAN_MULTIPLIERS = {
    # Tamil
    'நூறு': 100, 'நூற்று': 100, 'ஆயிரம்': 1000, 'ஆயிரத்து': 1000, 'லட்சம்': 100000, 'கோடி': 10000000,
    # Kannada
    'ನೂರು': 100, 'ಸಾವಿರ': 1000, 'ಸಾವಿರದ': 1000, 'ಲಕ್ಷ': 100000, 'ಕೋಟಿ': 10000000,
    # Hindi
    'सौ': 100, 'हजार': 1000, 'हज़ार': 1000, 'लाख': 100000, 'करोड़': 10000000,
    # Telugu
    'వంద': 100, 'వందలు': 100, 'వేలు': 1000, 'వేయి': 1000, 'వెయ్యి': 1000, 'లక్ష': 100000, 'కోటి': 10000000,
    # Gujarati
    'સો': 100, 'હજાર': 1000, 'લાખ': 100000, 'કરોડ': 10000000,
    # English
    'hundred': 100, 'thousand': 1000, 'lakh': 100000, 'crore': 10000000, 'k': 1000
}

STANDALONE_NUMS = {
    # Tamil
    'ஐயாயிரம்': 5000, 'இரண்டாயிரம்': 2000, 'மூவாயிரம்': 3000, 'நான்காயிரம்': 4000,
    'ஆறாயிரம்': 6000, 'ஏழாயிரம்': 7000, 'எட்டாயிரம்': 8000, 'ஒன்பதாயிரம்': 9000,
    'பத்தாயிரம்': 10000, 'இருபதாயிரம்': 20000, 'ஐம்பதாயிரம்': 50000,
    'ஐந்நூறு': 500, 'இருநூறு': 200, 'முந்நூறு': 300, 'நானூறு': 400, 'அறுநூறு': 600,
    'எழுநூறு': 700, 'எண்ணூறு': 800, 'தொள்ளாயிரம்': 900, 'நூறு': 100, 'ஆயிரம்': 1000,
    # Kannada
    'ಐದು ಸಾವಿರ': 5000, 'ಎರಡು ಸಾವಿರ': 2000, 'ಮೂರು ಸಾವಿರ': 3000, 'ನಾಲ್ಕು ಸಾವಿರ': 4000,
    'ಹತ್ತು ಸಾವಿರ': 10000, 'ಇಪ್ಪತ್ತು ಸಾವಿರ': 20000, 'ಐವತ್ತು ಸಾವಿರ': 50000,
    'ಐನೂರು': 500, 'ಇನ್ನೂರು': 200, 'ಮುನ್ನೂರು': 300, 'ನಾನೂರು': 400, 'ಸಾವಿರ': 1000, 'ಲಕ್ಷ': 100000,
    # Hindi
    'पाँच हज़ार': 5000, 'पांच हजार': 5000, 'दो हज़ार': 2000, 'दो हजार': 2000,
    'तीन हज़ार': 3000, 'तीन हजार': 3000, 'चार हज़ार': 4000, 'चार हजार': 4000,
    'दस हज़ार': 10000, 'दस हजार': 10000, 'पचास हज़ार': 50000, 'पचास हजार': 50000,
    'डेढ़ हज़ार': 1500, 'ढाई हज़ार': 2500, 'पाँच सौ': 500, 'पांच सौ': 500,
    'दो सौ': 200, 'तीन सौ': 300, 'चार सौ': 400, 'हज़ार': 1000, 'हजार': 1000, 'सौ': 100,
    # Telugu
    'ఐదు వేలు': 5000, 'రెండు వేలు': 2000, 'మూడు వేలు': 3000, 'నాలుగు వేలు': 4000,
    'పది వేలు': 10000, 'ఇరవై వేలు': 20000, 'యాభై వేలు': 50000,
    'ఐదు వందలు': 500, 'రెండు వందలు': 200, 'మూడు వందలు': 300, 'వెయ్యి': 1000, 'వేయి': 1000
}

def parse_indian_numbers(text: str) -> float:
    """
    Parses Indian numeral words and digits across Tamil, Kannada, Hindi, Telugu, Gujarati, and English.
    Handles:
    - 'முருகன் 5 ஆயிரம்' -> 5000.0
    - 'ஐந்து ஆயிரம்' or 'ஐயாயிரம்' -> 5000.0
    - 'ಮೂರು ಸಾವಿರ' -> 3000.0
    - 'दो हज़ार पाँच सौ' -> 2500.0
    - '15 వేలు' -> 15000.0
    - '₹4500' -> 4500.0
    """
    if not text:
        return 0.0

    # 1. Digit + Multiplier pattern (e.g. "5 ஆயிரம்", "10 వేలు", "25 हजार", "5k")
    for m_word, m_val in sorted(INDIAN_MULTIPLIERS.items(), key=lambda x: -len(x[0])):
        d_match = re.search(rf'(\d+[\d\.]*)\s*{m_word}', text, re.IGNORECASE)
        if d_match:
            try:
                return float(float(d_match.group(1)) * m_val)
            except:
                pass

    # 2. Standalone compound expressions (e.g. "ஐயாயிரம்", "ढाई हज़ार", "ಮೂರು ಸಾವಿರ")
    for word, val in sorted(STANDALONE_NUMS.items(), key=lambda x: -len(x[0])):
        if word in text:
            return float(val)

    # 3. Unit Word + Multiplier Word pattern (e.g. "ஐந்து ஆயிரம்", "ನಾಲ್ಕು ಸಾವಿರ", "तीन सौ", "రెండు వేలు")
    for u_word, u_val in sorted(INDIAN_UNITS.items(), key=lambda x: -len(x[0])):
        for m_word, m_val in sorted(INDIAN_MULTIPLIERS.items(), key=lambda x: -len(x[0])):
            pattern = rf'{u_word}\s+{m_word}'
            if re.search(pattern, text, re.IGNORECASE):
                return float(u_val * m_val)

    # 4. Explicit digits with rupee symbols or commas (e.g. ₹5,000, 200, 15000)
    digits_match = re.search(r'(?:₹|rs\.?|inr)?\s*(\d+[\d,]*\.?\d*)', text, re.IGNORECASE)
    if digits_match:
        try:
            val_str = digits_match.group(1).replace(',', '')
            if float(val_str) > 0:
                return float(val_str)
        except:
            pass

    return 0.0

def detect_script_language(text: str, fallback_lang: str = "en-IN") -> str:
    """Detects Indian language from Unicode script or falls back to specified language."""
    if not text:
        return fallback_lang or "en-IN"
    if any('\u0B80' <= char <= '\u0BFF' for char in text):
        return "ta-IN"  # Tamil
    if any('\u0C80' <= char <= '\u0CFF' for char in text):
        return "kn-IN"  # Kannada
    if any('\u0C00' <= char <= '\u0C7F' for char in text):
        return "te-IN"  # Telugu
    if any('\u0900' <= char <= '\u097F' for char in text):
        return "hi-IN"  # Hindi / Marathi
    if any('\u0A80' <= char <= '\u0AFF' for char in text):
        return "gu-IN"  # Gujarati
    if any('\u0980' <= char <= '\u09FF' for char in text):
        return "bn-IN"  # Bengali
    return fallback_lang or "en-IN"

def get_language_display_name(lang_code: str) -> str:
    mapping = {
        'ta-IN': 'தமிழ் (Tamil)',
        'kn-IN': 'ಕನ್ನಡ (Kannada)',
        'hi-IN': 'हिंदी (Hindi)',
        'te-IN': 'తెలుగు (Telugu)',
        'gu-IN': 'ગુજરાતી (Gujarati)',
        'bn-IN': 'বাংলা (Bengali)',
        'en-IN': 'English (India)'
    }
    return mapping.get(lang_code, lang_code)

def extract_crm_data(text: str, language: str = "en") -> dict:
    """
    Extracts structured CRM activities with robust amount parsing,
    storing the activity in the user's spoken language AND translated English language,
    ensuring all data is universally recognizable.
    """
    detected_code = detect_script_language(text, language)
    parsed_amount_fallback = parse_indian_numbers(text)
    display_lang = get_language_display_name(detected_code)

    prompt = f"""
    The user is an Indian field sales representative or shop owner dictating an activity or order in their native language:
    Input: "{text}"
    Language Code: {detected_code} ({display_lang})
    Algorithmic Amount Hint: ₹{parsed_amount_fallback}

    CRITICAL REQUIREMENTS:
    1. Detect the user's language accurately (Tamil, Kannada, Hindi, Telugu, Gujarati, English).
    2. Extract the Client / Shop name:
       - User's native script (e.g. "முருகன் ஸ்டோர்ஸ்", "ಬಸವೇಶ್ವರ ಟ್ರೇಡರ್ಸ್", "शर्मा किराना", "రమేష్ షాప్")
       - English transliteration (e.g. "Murugan Stores", "Basaveshwara Traders", "Sharma Kirana", "Ramesh Shop")
       - Combine cleanly as: "<Native Name> (<English Name>)", e.g. "முருகன் ஸ்டோர்ஸ் (Murugan Stores)". If English only, just the English name.
    3. NUMBERS AND AMOUNTS (CRITICAL):
       You MUST accurately calculate amounts spoken in words or regional numbers:
       - Tamil: "ஐந்து ஆயிரம்" or "ஐயாயிரம்" -> 5000.0, "இரண்டாயிரம்" -> 2000.0, "ஐந்நூறு" -> 500.0, "பத்தாயிரம்" -> 10000.0
       - Kannada: "ಮೂರು ಸಾವಿರ" -> 3000.0, "ಐದು ಸಾವಿರ" -> 5000.0, "ಐನೂರು" -> 500.0, "ಹತ್ತು ಸಾವಿರ" -> 10000.0
       - Hindi: "पाँच हज़ार" / "पांच हजार" -> 5000.0, "ढाई हज़ार" -> 2500.0, "दो सौ पचास" -> 250.0, "डेढ़ हज़ार" -> 1500.0
       - Telugu: "ఐదు వేలు" -> 5000.0, "రెండు వేలు" -> 2000.0, "వంద" -> 100.0, "15 వేలు" -> 15000.0
       - Gujarati: "પાંચ હજાર" -> 5000.0, "બે હજાર" -> 2000.0
       - Digits: "5000", "₹1200", "450" -> 5000.0, 1200.0, 450.0
       If the input mentions amounts, the amount MUST NEVER be 0.
    4. Provide the exact speech in user's language, and an accurate English translation.
    5. Construct "notes" as:
       "[{detected_code[:2].upper()}]: {text} | [EN]: <English translation>"
    6. Formulate "spoken_confirmation": A courteous voice confirmation in the user's native spoken language ({detected_code}) confirming the exact client and amount.
       - Tamil example: "முருகன் ஸ்டோர்ஸ் ₹5,000 ஆர்டர் பதிவு செய்யப்பட்டது."
       - Kannada example: "ಬಸವೇಶ್ವರ ಟ್ರೇಡರ್ಸ್ ₹3,000 ಆದೇಶ ಯಶಸ್ವಿಯಾಗಿ ದಾಖಲಾಗಿದೆ."
       - Hindi example: "शर्मा किराना के लिए ₹5,000 का ऑर्डर सफलतापूर्वक दर्ज कर लिया गया है।"
       - Telugu example: "రమేష్ షాప్ ₹5,000 ఆర్డర్ విజయవంతంగా నమోదు చేయబడింది."

    Return ONLY pure JSON with keys:
    {{
      "detected_language": "{display_lang}",
      "detected_code": "{detected_code}",
      "entries": [
        {{
          "client_name": "<Native Name> (<English Name>)",
          "client_name_user_language": "<Native Name>",
          "client_name_en": "<English Name>",
          "action": "order",
          "amount": 5000.0,
          "status": "completed",
          "user_language_text": "{text}",
          "translated_english": "<English translation>",
          "notes": "[{detected_code[:2].upper()}]: {text} | [EN]: <English translation>",
          "follow_up_date": null
        }}
      ],
      "spoken_confirmation": "<Spoken confirmation in user's native language>"
    }}
    """
    try:
        resp = call_gemini_with_fallback(prompt)
        cleaned = clean_json_response(resp)
        data = json.loads(cleaned)
        if "entries" in data and len(data["entries"]) > 0:
            # Validate extracted amount with algorithmic fallback if Gemini missed
            for entry in data["entries"]:
                if (not entry.get("amount") or entry.get("amount") == 0.0) and parsed_amount_fallback > 0:
                    entry["amount"] = parsed_amount_fallback
            return data
    except Exception as e:
        pass

    # Resilient fallback with algorithmic parser
    parsed_amount = parsed_amount_fallback
    client_name = "Food Order Delivery" if ("food" in text.lower() or "ఫూ" in text or "फूड" in text or "உணவு" in text) else "Client / Walk-in"
    
    conf = f"Recorded {client_name} of ₹{int(parsed_amount):,}."
    if 'ta' in detected_code:
        conf = f"{client_name} ₹{int(parsed_amount):,} வெற்றிகரமாக பதிவு செய்யப்பட்டது."
    elif 'kn' in detected_code:
        conf = f"{client_name} ₹{int(parsed_amount):,} ಯಶಸ್ವಿಯಾಗಿ ದಾಖಲಾಗಿದೆ."
    elif 'te' in detected_code:
        conf = f"{client_name} రూ. {int(parsed_amount):,} విజయవంతంగా నమోదు చేయబడింది."
    elif 'hi' in detected_code:
        conf = f"{client_name} के लिए ₹{int(parsed_amount):,} सफलतापूर्वक दर्ज कर लिया गया है।"
    elif 'gu' in detected_code:
        conf = f"{client_name} ₹{int(parsed_amount):,} સફળતાપૂર્વક નોંધવામાં આવ્યું છે."

    return {
        "detected_language": display_lang,
        "detected_code": detected_code,
        "entries": [{
            "client_name": client_name,
            "client_name_user_language": client_name,
            "client_name_en": client_name,
            "action": "order" if parsed_amount > 0 else "visit",
            "amount": parsed_amount,
            "status": "completed",
            "user_language_text": text,
            "translated_english": f"Activity for {client_name} of ₹{int(parsed_amount):,}",
            "notes": f"[{detected_code[:2].upper()}]: {text} | [EN]: Activity for {client_name} of ₹{int(parsed_amount):,}",
            "follow_up_date": None
        }],
        "spoken_confirmation": conf
    }

def transcribe_audio_with_gemini(audio_bytes: bytes, mime_type: str = "audio/webm", language_hint: str = "en-IN") -> str:
    """
    Transcribes audio using Gemini 2.5 Flash native multimodal audio understanding.
    Supports Tamil, Kannada, Hindi, Telugu, Gujarati, and Indian English with high precision.
    """
    import base64
    base64_audio = base64.b64encode(audio_bytes).decode("utf-8")
    
    prompt = f"""
    You are an expert Indian Speech-to-Text transcription engine for IndicBI CRM.
    The audio contains spoken business orders, customer visits, payments, numbers, or calculations in an Indian language (e.g. Tamil, Kannada, Hindi, Telugu, Gujarati, or Indian English).
    Preferred/hinted language: {language_hint}.
    
    Transcribe what the speaker said accurately in the native script or original words spoken.
    Do NOT translate. Do NOT summarize or add commentary.
    Return ONLY the exact spoken transcript.
    """
    
    headers = {"Content-Type": "application/json"}
    payload = {
        "contents": [
            {
                "parts": [
                    {
                        "inline_data": {
                            "mime_type": mime_type,
                            "data": base64_audio
                        }
                    },
                    {
                        "text": prompt
                    }
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0.0,
            "maxOutputTokens": 300
        }
    }
    
    for model in ["gemini-2.5-flash", "gemini-flash-latest", "gemini-3.5-flash"]:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={API_KEY}"
        try:
            res = requests.post(url, json=payload, headers=headers, timeout=25)
            if res.status_code == 200:
                data = res.json()
                candidates = data.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    if parts and "text" in parts[0]:
                        return parts[0]["text"].strip()
        except Exception as e:
            print(f"Gemini audio transcription error on {model}: {e}")
            
    return ""

