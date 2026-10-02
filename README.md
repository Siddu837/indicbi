# 🗣️📊 IndicBI (बोल BI) — Voice-First Business Intelligence & Field CRM for Bharat

> **Submission for Build Fast with AI: AI Build Challenge 2026**  
> **Track:** Track 06 · AI for Bharat in Indian Languages (Problem Statement: PS-06)  
> **Team:** Team Vision · **Lead:** Gopi Keerthi  
> **🌐 Live Production Website:** [https://indicbi.vercel.app](https://indicbi.vercel.app)  
> **📊 Direct CRM & BI Ledger:** [https://indicbi.vercel.app/dashboard](https://indicbi.vercel.app/dashboard)  
> **🎬 Demo Videos:** [Quick Preview (MP4)](assets/indic_bi_preview.mp4) · [Full Walkthrough (MP4)](assets/indicbi_full_demo.mp4)  

---

## 💡 Project Overview

**IndicBI (बोल BI)** is an AI-driven, voice-first business intelligence and field CRM platform engineered specifically for India's **63 Million+ MSME merchants, shopkeepers, wholesale distributors**, and **5 Million+ field sales executives**.

In India's tier-2, tier-3 cities and rural hubs, business happens on foot, in local languages, and often without time or literacy to navigate complex software. IndicBI eliminates traditional typing, English menus, and cumbersome forms by allowing users to manage their entire business operations simply by **speaking in their native language**.

### 🌟 What IndicBI Does:
1. **Interactive Business Intelligence (BI Mode):**
   - Merchants speak naturally in **Hindi, Telugu, Tamil, Kannada, Gujarati, or English** (e.g., *"तमिलनाडु में पिछले 3 महीने की बिक्री कितनी हुई?"*).
   - IndicBI translates spoken intent into safe SQL queries, executes them against the business dataset, and renders **interactive visualizations (Bar, Line, Pie charts)** paired with a **spoken native audio explanation**.

2. **Hands-Free Field Sales CRM (CRM Mode):**
   - Field agents dictate client visit notes while traveling (e.g., *"డాక్టర్ రెడ్డి గారు 200 స్ట్రిప్స్ ఆర్డర్ ఇచ్చారు ₹15,000 కి"*).
   - Gemini multimodal entity extraction parses the client name, product quantity, rupee amount, and follow-up date.
   - **Step 2 Verification Card:** Shows the native transcript, English translation, and extracted rupee amount for instant verification or manual adjustment before committing to the business ledger.

3. **Dual-Tier Resilient Storage:**
   - **Offline-First:** All entries are stored locally in an embedded SQLite database (`indicbi.db`) to ensure zero data loss in low-connectivity areas.
   - **Cloud Sync:** Seamlessly replicates with Supabase PostgreSQL cloud storage in real time when connected.

4. **Pure Mobile & Desktop Browser Experience:**
   - Works directly inside Chrome, Safari, and Brave on Android, iOS, and Desktop.
   - Zero app store downloads or third-party recorder redirects required.
   - Built-in real-time audio volume visualizer with live speech wave animations.

---

## 🎬 Product Demo & Video Walkthrough

Watch IndicBI in action running real-time multilingual voice dictation, intent classification, and automated ledger logging:

https://github.com/Siddu837/indicbi/raw/main/assets/indic_bi_preview.mp4

| Demo Recording | Size | Key Highlights | Link |
|---|---|---|---|
| **Quick Feature Preview** | ~2.4 MB | Real-time Indian language speech dictation, live audio wave, & 2-step verification card | [▶️ Watch Preview (MP4)](assets/indic_bi_preview.mp4) |
| **Full Walkthrough Demo** | ~64 MB | Complete BI analytics queries, dynamic Recharts, CRM field visit ledger & cloud replication | [▶️ Watch Full Walkthrough (MP4)](assets/indicbi_full_demo.mp4) |

---

## 🛠️ Technologies Used

| Layer | Technologies | Purpose |
|---|---|---|
| **Frontend** | **Next.js 16 (App Router)**, **React 19**, **TypeScript** | Responsive modern web client with high-performance SSR and Turbopack |
| **Styling & UI** | **Tailwind CSS v4**, **Lucide React**, **Radix UI** | Polished, accessible light-theme interface optimized for both mobile & desktop |
| **Data Visualization** | **Recharts** | Dynamic Bar, Line, and Pie charts tailored with Indian Rupee ($\text{₹}$) formatting |
| **Voice & Audio** | **HTML5 MediaRecorder API**, **Web Audio API AnalyserNode** | Cross-platform in-browser voice capture, RMS silence detection & live volume meters |
| **AI & Multimodal Core** | **Google Gemini 2.5 Flash** (`gemini-2.5-flash`) | Multilingual speech-to-text, intent classification, schema-grounded NL-to-SQL, & entity extraction |
| **Speech Synthesis (TTS)** | **Edge-TTS / In-Browser SpeechSynthesis** | Spoken native audio responses in Hindi, Telugu, Tamil, Kannada, Gujarati, and Indian English |
| **Backend API** | **FastAPI (Python 3.10+)**, **Uvicorn**, **Pydantic V2** | Asynchronous, low-latency REST endpoints for queries, audio upload, and ledger mutations |
| **Database & Safety** | **SQLite 3**, **Supabase PostgreSQL**, **SQL AST Guardrail** | Dual-tier offline-to-cloud ledger with strict AST validation (read-only `SELECT` queries for BI) |
| **Deployment** | **Vercel** (Frontend), **Render / Railway / Docker** (Backend) | Cloud-native hosting with zero-configuration Next.js reverse proxies |

---

## 📁 Repository Organization

```text
indicbi/
├── backend/                        # FastAPI Python 3.10+ Backend
│   ├── main.py                     # Primary REST API routes & middleware
│   ├── gemini_service.py           # Gemini 2.5 Flash integration & multimodal audio handler
│   ├── guest_analytics.py          # Dynamic computation & user-ledger query analysis
│   ├── db.py                       # SQLite database manager & AST SQL safety guardrail
│   ├── supabase_service.py         # Dual-tier cloud replication service
│   ├── seed_data.py                # Pre-seeded Indian commerce dataset (550+ transactions)
│   ├── tts_service.py              # Edge-TTS audio generator for Indic languages
│   ├── indicbi.db                  # Local SQLite database file
│   ├── requirements.txt            # Pinned Python package dependencies
│   ├── Procfile                    # Deployment entrypoint for cloud PaaS (Render/Railway)
│   ├── .env.example                # Template for backend environment variables
│   └── .env                        # Local backend environment configuration
│
├── frontend/                       # Next.js 16 App Router Client
│   ├── app/
│   │   ├── page.tsx                # High-conversion product showcase & interactive demo
│   │   ├── layout.tsx              # Root HTML layout, viewport, and metadata
│   │   └── dashboard/
│   │       └── page.tsx            # Full CRM & BI workspace (voice input, ledger, charts)
│   ├── components/
│   │   ├── SpeechController.ts     # Resilient MediaRecorder + Gemini multimodal audio pipeline
│   │   ├── DynamicChart.tsx        # Responsive Recharts renderer (Bar, Line, Pie)
│   │   ├── translations.ts         # Bilingual localized strings (6 Indic languages)
│   │   └── ui/                     # Modular accessible UI components
│   ├── next.config.mjs             # Next.js configuration & `/api/*` reverse proxy
│   ├── vercel.json                 # Vercel deployment specification
│   ├── package.json                # Frontend dependencies & build scripts
│   ├── tailwind.config.ts          # Tailwind styling rules & design tokens
│   └── .env.example                # Template for frontend environment variables
│
├── tests/                          # Automated backend & API test suite
│   ├── test_client.py              # Local API endpoint verification
│   ├── test_cf_client.py           # Tunnel & remote connectivity checks
│   └── test_prod_chunks.py         # Production bundle & chunk integrity tests
│
├── run_indicbi.bat                 # 1-Click Windows launch script
└── README.md                       # Comprehensive project documentation
```

---

## ⚙️ Setup & Installation Steps

### 1. Prerequisites
Ensure you have the following installed on your machine:
- **Node.js**: `v18.17.0` or higher ([Download Node.js](https://nodejs.org))
- **Python**: `3.10` to `3.12` ([Download Python](https://www.python.org))
- **Git**: ([Download Git](https://git-scm.com))
- **Google Gemini API Key**: Free tier available from [Google AI Studio](https://aistudio.google.com)

---

### 2. Clone the Repository
```bash
git clone https://github.com/keerthi-242004/indicbi.git
cd indicbi
```

---

### 3. Backend Setup
1. Navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment (recommended):
   ```bash
   # Windows (PowerShell / CMD)
   python -m venv .venv
   .venv\Scripts\activate

   # macOS / Linux
   python3 -m venv .venv
   source .venv/bin/activate
   ```
3. Install required Python packages:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure environment variables:
   - Copy `.env.example` to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Open `.env` and paste your Gemini API key:
     ```env
     GEMINI_API_KEY=your_gemini_api_key_here
     
     # Optional: Supabase cloud sync (SQLite runs locally by default)
     SUPABASE_URL=https://your-project.supabase.co
     SUPABASE_KEY=your_supabase_anon_key
     ```
5. *(Optional)* Seed the database with 550+ realistic Indian retail transactions:
   ```bash
   python seed_data.py
   ```

---

### 4. Frontend Setup
1. Open a new terminal and navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env.local` (optional for local development, as requests proxy to port 8001 automatically):
   ```bash
   cp .env.example .env.local
   ```

---

## 🚀 How to Run the Project

### Option A: 1-Click Launch (Windows)
Simply double-click the included `run_indicbi.bat` file in the root directory, or run from terminal:
```cmd
run_indicbi.bat
```
*This automatically starts both the FastAPI backend and Next.js frontend in separate terminal windows and opens `http://localhost:3000` in your default browser.*

---

### Option B: Manual Step-by-Step Launch

#### 1. Start the Backend Server:
```bash
cd backend
python -m uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```
- **Backend API:** `http://localhost:8001`
- **Interactive Swagger Docs:** `http://localhost:8001/docs`

#### 2. Start the Frontend Server:
```bash
cd frontend
npm run dev
```
- **Web Application:** `http://localhost:3000`
- **Direct CRM & BI Dashboard:** `http://localhost:3000/dashboard`

---

## ☁️ Deploy to Vercel Guide

IndicBI is designed to deploy to **Vercel** with zero friction.

### Step 1: Deploy Backend (Render, Railway, or Fly.io)
Because FastAPI is a persistent Python ASGI server, deploy `backend/` to any cloud container host:
- **Render.com**: Create a new **Web Service**, link your repository, set Root Directory to `backend`, Build Command to `pip install -r requirements.txt`, and Start Command to `uvicorn main:app --host 0.0.0.0 --port $PORT`. Add `GEMINI_API_KEY` in Environment Variables.
- Copy your deployed backend URL (e.g., `https://indicbi-backend.onrender.com`).

### Step 2: Deploy Frontend to Vercel
1. Go to [Vercel Dashboard](https://vercel.com/dashboard) and click **"Add New Project"**.
2. Select your `indicbi` repository.
3. In the project configuration:
   - **Framework Preset:** `Next.js`
   - **Root Directory:** Click `Edit` and select `frontend`
   - **Build Command:** `next build` (Default)
   - **Output Directory:** `.next` (Default)
4. In **Environment Variables**, add:
   - `BACKEND_URL`: `https://indicbi-backend.onrender.com` (Your deployed backend URL from Step 1)
5. Click **"Deploy"**. Vercel will build and assign you a global, secure HTTPS URL (e.g., `https://indicbi.vercel.app`)!

> **How it works:** Next.js uses the `async rewrites()` defined in `frontend/next.config.mjs` to seamlessly route all `/api/*` network requests to your backend without CORS restrictions or exposing backend keys to client browsers.

---

## 🧪 Sample Prompts for Judges to Test

Test these sample spoken or typed queries directly on the `/dashboard`:

| Mode | Language | Sample Query Input | What IndicBI Computes & Displays |
|---|---|---|---|
| **BI Analytics** | **Hindi** | *"पिछले महीने सबसे ज्यादा बिकने वाले टॉप 5 प्रोडक्ट्स दिखाओ"* | Top 5 products bar chart + Hindi voice answer with revenue totals |
| **BI Analytics** | **Telugu** | *"తెలంగాణ మరియు ఆంధ్రప్రదేశ్‌లో మొత్తం అమ్మకాలు ఎంత?"* | Comparative state-wise sales chart + Telugu spoken summary |
| **BI Analytics** | **Tamil** | *"இந்த மாதத்தில் அதிக வருவாய் ஈட்டிய வாடிக்கையாளர்கள் யார்?"* | Customer revenue breakdown table + Tamil audio playback |
| **BI Analytics** | **Kannada** | *"ಬೆಂಗಳೂರು ಶಾಖೆಯ ಈ ವಾರದ ಒಟ್ಟು ಆರ್ಡರ್‌ಗಳು ಎಷ್ಟು?"* | Weekly order volume line graph + Kannada explanation |
| **BI Analytics** | **Gujarati** | *"ગયા મહિને સુરત અને અમદાવાદનું વેચાણ બતાવો"* | Comparative sales chart for Surat vs Ahmedabad |
| **BI Analytics** | **English** | *"Show me total revenue and orders broken down by category"* | Category distribution pie chart with Indian Rupee ($\text{₹}$) formatting |
| **Field CRM** | **Hindi** | *"आज गुप्ता जी किराना स्टोर से ₹8,500 का पेमेंट कलेक्ट किया"* | Step 2 Verification Card: Client "Gupta Ji Kirana", Amount "₹8,500", Action "Payment" |
| **Field CRM** | **Telugu** | *"డాక్టర్ వర్మ క్లినిక్ విజిట్ చేశాను 50 బాక్సులు ఆర్డర్ ఇచ్చారు ₹12,000"* | Step 2 Verification Card: Client "Dr. Varma Clinic", Amount "₹12,000", Action "Order" |

---

## 🛡️ Security, Privacy & Safety Guardrails

1. **AST-Based SQL Mutation Blocking:**
   - Any query generated by the AI undergoes Abstract Syntax Tree (AST) validation in `backend/db.py`.
   - Strictly permits `SELECT` statements; commands containing `DROP`, `DELETE`, `UPDATE`, `INSERT`, `ALTER`, or chained semicolons are immediately blocked.
2. **Step 2 Human-in-the-Loop Verification:**
   - CRM voice entries are **never** committed blindly. The user is presented with an editable card showing extracted client name, rupee amount, and action before final commitment.
3. **Session Partitioning:**
   - Every visitor receives a distinct, anonymized Guest Session ID (`guest_xxxxxxxx`). Your activities and queries remain isolated to your session.
4. **Zero Client Secret Exposure:**
   - All Gemini and Supabase API keys remain strictly confined to the backend server environment. The frontend exposes zero credentials.

---

## 👥 Team & Acknowledgments

- **Lead Developer & Architect:** Gopi Keerthi (Team Vision)
- **Built For:** Build Fast with AI — AI Build Challenge 2026
- **Special Thanks:** Open-source contributors of Google Gemini API, FastAPI, Next.js, and Recharts.
