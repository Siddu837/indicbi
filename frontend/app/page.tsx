'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  Mic, MicOff, Volume2, VolumeX, Search, X, CheckCircle2, TrendingUp, 
  ShoppingBag, Users, Database, Globe, ChevronDown, ChevronUp,
  Layers, ArrowRight, ShieldCheck, Sparkles, DollarSign,
  AlertCircle, HelpCircle, FileText, Lock, RefreshCw, Terminal, Check,
  Store, Building2, Briefcase, BarChart3, CheckCircle, Clock, ArrowUpRight
} from 'lucide-react';
import DynamicChart from '../components/DynamicChart';
import { SpeechController, LANGUAGE_OPTIONS } from '../components/SpeechController';
import { TRANSLATIONS } from '../components/translations';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import FeaturesCard from '@/components/ui/features-card';

const API_BASE_URL = typeof window !== 'undefined' 
  ? (process.env.NEXT_PUBLIC_API_URL || '')
  : 'http://localhost:8001';

export default function IndicBIPage() {
  const [selectedLang, setSelectedLang] = useState(LANGUAGE_OPTIONS[0]); // Default: English (India)
  const t = TRANSLATIONS[selectedLang.code] || TRANSLATIONS['en-IN'];

  // Voice & Input State
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [liveVolume, setLiveVolume] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [clarificationNotice, setClarificationNotice] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [activeTab, setActiveTab] = useState<'analytics' | 'crm'>('analytics');
  
  // Response & Visualization
  const [queryResult, setQueryResult] = useState<any | null>(null);
  const [showSql, setShowSql] = useState(false);
  
  // Dashboard & Public Feed State
  const [stats, setStats] = useState<any>({
    total_sales: 3840000,
    total_orders: 550,
    total_visits: 5,
    top_products: []
  });
  const [recentVisits, setRecentVisits] = useState<any[]>([]);

  // Accordion state
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const speechControllerRef = useRef<SpeechController | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const selectedLangRef = useRef(selectedLang);

  useEffect(() => {
    selectedLangRef.current = selectedLang;
  }, [selectedLang]);

  const handleProcessVoiceResult = (result: any) => {
    setIsLoading(false);
    setIsProcessingVoice(false);
    if (result.transcribed_text) {
      setInputText(result.transcribed_text);
    }

    if (result.needs_clarification) {
      setClarificationNotice(result.spoken_answer || result.message || t.self_correction_prompt);
      if (result.audio_data) {
        setIsPlayingAudio(true);
        speechControllerRef.current?.playBase64Audio(result.audio_data);
      }
      return;
    }

    setQueryResult(result);

    if (result.mode === 'crm') {
      setActiveTab('crm');
      fetchVisits();
    } else {
      setActiveTab('analytics');
    }

    if (result.audio_data) {
      setIsPlayingAudio(true);
      speechControllerRef.current?.playBase64Audio(result.audio_data);
    } else if (result.spoken_answer) {
      setIsPlayingAudio(true);
      speechControllerRef.current?.speak(result.spoken_answer, selectedLangRef.current.code);
    }
  };

  useEffect(() => {
    if (speechControllerRef.current) {
      speechControllerRef.current.updateCallbacks(
        (transcript) => {
          setInputText(transcript);
          handleSendQuery(transcript);
        },
        (error) => {
          setErrorMessage(error);
          setIsListening(false);
          setIsProcessingVoice(false);
          setIsLoading(false);
        },
        (listening, processing) => {
          setIsListening(listening);
          setIsProcessingVoice(!!processing);
          if (processing) {
            setIsLoading(true);
          }
        },
        (interimText) => {
          if (interimText) {
            setInputText(interimText);
          }
        },
        (voiceUploadResult) => {
          handleProcessVoiceResult(voiceUploadResult);
        },
        (volume) => {
          setLiveVolume(volume);
        }
      );
    }
  }, [selectedLang]);

  useEffect(() => {
    speechControllerRef.current = new SpeechController(
      (transcript) => {
        setInputText(transcript);
        handleSendQuery(transcript);
      },
      (error) => {
        setErrorMessage(error);
        setIsListening(false);
        setIsProcessingVoice(false);
        setIsLoading(false);
      },
      (listening, processing) => {
        setIsListening(listening);
        setIsProcessingVoice(!!processing);
        if (processing) {
          setIsLoading(true);
        }
      },
      (interimText) => {
        if (interimText) {
          setInputText(interimText);
        }
      },
      (voiceUploadResult) => {
        handleProcessVoiceResult(voiceUploadResult);
      },
      (volume) => {
        setLiveVolume(volume);
      }
    );

    fetchDashboard();
    fetchVisits();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/dashboard`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.warn('Dashboard fetch offline');
    }
  };

  const fetchVisits = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/visits`);
      if (res.ok) {
        const data = await res.json();
        setRecentVisits(data);
      }
    } catch (e) {
      console.warn('Visits fetch offline');
    }
  };

  const handleStopAudio = () => {
    speechControllerRef.current?.stopAudio();
    setIsPlayingAudio(false);
  };

  const toggleListening = async () => {
    speechControllerRef.current?.stopAudio();
    setIsPlayingAudio(false);

    if (isListening || isProcessingVoice) {
      speechControllerRef.current?.stopListening(true);
      setIsListening(false);
      return;
    }

    setErrorMessage(null);
    setClarificationNotice(null);
    setInputText('');

    let currentGuestId = 'landing_demo';
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('indicbi_guest_id');
      if (stored) currentGuestId = stored;
    }

    speechControllerRef.current?.startListening(selectedLangRef.current.code, currentGuestId, true);
  };

  const handleClearInput = () => {
    speechControllerRef.current?.stopAudio();
    setIsPlayingAudio(false);
    setInputText('');
    setErrorMessage(null);
    setClarificationNotice(null);
    if (inputRef.current) inputRef.current.focus();
  };

  const handleSendQuery = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    speechControllerRef.current?.stopAudio();
    setIsPlayingAudio(false);
    setIsLoading(true);
    setErrorMessage(null);
    setClarificationNotice(null);

    try {
      let currentGuestId = 'landing_demo';
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('indicbi_guest_id');
        if (stored) currentGuestId = stored;
      }

      const response = await fetch(`${API_BASE_URL}/api/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text,
          language: selectedLang.code,
          guest_id: currentGuestId,
          auto_save: true // Landing demo can log smoothly
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Query execution failed.');
      }

      const result = await response.json();
      
      if (result.mode === 'clarification' || result.needs_clarification) {
        setClarificationNotice(result.spoken_answer || result.message || t.self_correction_prompt);
        if (result.audio_data) {
          setIsPlayingAudio(true);
          speechControllerRef.current?.playBase64Audio(result.audio_data);
        }
        setIsLoading(false);
        return;
      }

      setQueryResult(result);
      
      if (result.mode === 'crm') {
        setActiveTab('crm');
        fetchVisits();
      } else {
        setActiveTab('analytics');
      }

      if (result.audio_data) {
        setIsPlayingAudio(true);
        speechControllerRef.current?.playBase64Audio(result.audio_data);
      } else if (result.spoken_answer) {
        setIsPlayingAudio(true);
        speechControllerRef.current?.speak(result.spoken_answer, selectedLang.code);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error processing query.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAudioFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    speechControllerRef.current?.stopAudio();
    setIsPlayingAudio(false);
    setIsLoading(true);
    setErrorMessage(null);
    setClarificationNotice(null);

    try {
      let currentGuestId = 'landing_demo';
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('indicbi_guest_id');
        if (stored) currentGuestId = stored;
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('language', selectedLang.code);
      formData.append('guest_id', currentGuestId);
      formData.append('auto_save', 'true');

      const res = await fetch(`${API_BASE_URL}/api/voice-upload`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to process voice audio.');
      }

      const result = await res.json();
      if (result.transcribed_text) {
        setInputText(result.transcribed_text);
      }

      setQueryResult(result);

      if (result.mode === 'crm') {
        setActiveTab('crm');
        fetchVisits();
      } else {
        setActiveTab('analytics');
      }

      if (result.audio_data) {
        setIsPlayingAudio(true);
        speechControllerRef.current?.playBase64Audio(result.audio_data);
      } else if (result.spoken_answer) {
        setIsPlayingAudio(true);
        speechControllerRef.current?.speak(result.spoken_answer, selectedLang.code);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error processing audio file.');
    } finally {
      setIsLoading(false);
      if (e.target) e.target.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans antialiased selection:bg-blue-600 selection:text-white">
      
      {/* 1. MAIN HEADER NAVIGATION */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
          
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs shrink-0">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg text-slate-900 tracking-tight">IndicBI</span>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 uppercase tracking-wide">
                CRM
              </span>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-6 text-xs font-semibold text-slate-600">
            <a href="#for-shops" className="hover:text-blue-600 transition-colors">Daily Shops</a>
            <a href="#demo-studio" className="hover:text-blue-600 transition-colors">Voice Studio</a>
            <a href="#features-bento" className="hover:text-blue-600 transition-colors">Architecture</a>
            <a href="#ledger-preview" className="hover:text-blue-600 transition-colors">Ledger Table</a>
            <a href="#faq" className="hover:text-blue-600 transition-colors">FAQ</a>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Language Selector */}
            <div className="flex items-center gap-1 bg-slate-100 rounded-xl px-2 py-1.5 border border-slate-200 shadow-2xs">
              <Globe className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <select
                value={selectedLang.code}
                onChange={(e) => {
                  const lang = LANGUAGE_OPTIONS.find(l => l.code === e.target.value);
                  if (lang) setSelectedLang(lang);
                }}
                className="bg-transparent text-xs font-semibold text-slate-700 outline-none cursor-pointer max-w-[90px] sm:max-w-none"
              >
                {LANGUAGE_OPTIONS.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.label.split(' ')[0]}
                  </option>
                ))}
              </select>
            </div>

            {/* Dashboard Button */}
            <Link href="/dashboard">
              <Button variant="default" size="sm" className="h-9 px-3 sm:px-4 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs">
                <span>Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1 hidden sm:inline" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION (Simple & Minimal) */}
      <section className="pt-8 sm:pt-14 pb-6 sm:pb-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto text-center">
        <aside className="mb-4 inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-200 bg-blue-50 text-blue-700 text-xs font-semibold shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>Voice CRM for Bharat</span>
        </aside>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.18] sm:leading-[1.15] mb-4 sm:mb-6">
          The Voice CRM for <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-800 bg-clip-text text-transparent">
            Daily Shops & Retail
          </span>
        </h1>

        <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed mb-6 sm:mb-8">
          Speak orders, payments, and client visits in <strong>Tamil, Kannada, Hindi, Telugu, or Gujarati</strong>. Automatic numeral conversion, verification, and ledger sync.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-8 sm:mb-10 w-full max-w-xs sm:max-w-none mx-auto">
          <Link href="/dashboard" className="w-full sm:w-auto">
            <Button variant="default" size="lg" className="h-11 px-7 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl w-full sm:w-auto shadow-md">
              <span>Open Dashboard</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </Link>

          <a href="#demo-studio" className="w-full sm:w-auto">
            <Button variant="outline" size="lg" className="h-11 px-6 text-sm font-semibold rounded-xl w-full sm:w-auto">
              <Mic className="w-4 h-4 text-blue-600 mr-1.5" />
              <span>Try Voice Studio</span>
            </Button>
          </a>
        </div>

        {/* Minimal Business Category Badges */}
        <div className="pt-3 border-t border-slate-200/60 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500 font-medium">
          <Badge variant="outline" className="gap-1 py-0.5 px-2.5">
            <Store className="w-3 h-3 text-blue-600" /> Kirana & Groceries
          </Badge>
          <Badge variant="outline" className="gap-1 py-0.5 px-2.5">
            <Building2 className="w-3 h-3 text-indigo-600" /> Wholesalers & Retail
          </Badge>
          <Badge variant="outline" className="gap-1 py-0.5 px-2.5">
            <Briefcase className="w-3 h-3 text-emerald-600" /> Field Sales
          </Badge>
        </div>
      </section>

      {/* 3. MAIN INTERACTIVE VOICE STUDIO (Simple & Minimal) */}
      <section id="demo-studio" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Card className="shadow-lg shadow-slate-200/50 border-slate-200 rounded-3xl overflow-hidden">
          <CardHeader className="bg-slate-50/70 border-b border-slate-100 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="text-[10px] uppercase font-bold tracking-wider">
                    Voice Studio
                  </Badge>
                  <span className="text-xs text-slate-500 font-medium">Indian Speech AI</span>
                </div>
                <CardTitle className="text-lg sm:text-xl font-bold text-slate-900 mt-1.5">
                  Speak an Order in {selectedLang.label.split(' ')[0]}
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 mt-0.5">
                  Speak customer name & amount. Instant rupee recognition.
                </CardDescription>
              </div>

              {isPlayingAudio && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleStopAudio}
                  className="bg-amber-50 text-amber-900 border-amber-300 gap-1.5 self-start sm:self-auto"
                >
                  <VolumeX className="w-3.5 h-3.5 text-amber-700" />
                  <span>Stop Voice</span>
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-4 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              {/* Real-time Web Speech & Audio Capture Button */}
              <button
                onClick={toggleListening}
                disabled={isProcessingVoice}
                className={`flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-semibold text-sm transition-all shadow-md active:scale-95 w-full sm:w-auto shrink-0 ${
                  isListening
                    ? 'bg-rose-600 hover:bg-rose-700 text-white ring-4 ring-rose-200 animate-pulse'
                    : isProcessingVoice
                    ? 'bg-indigo-600 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/25'
                }`}
              >
                {isListening ? (
                  <>
                    <div className="flex items-center gap-1 h-5 px-0.5">
                      <span className="w-1 bg-white rounded-full transition-all duration-75" style={{ height: `${Math.max(6, Math.min(20, liveVolume * 0.45))}px` }} />
                      <span className="w-1.5 bg-white rounded-full transition-all duration-75" style={{ height: `${Math.max(10, Math.min(24, liveVolume * 0.65))}px` }} />
                      <span className="w-1 bg-white rounded-full transition-all duration-75" style={{ height: `${Math.max(6, Math.min(18, liveVolume * 0.4))}px` }} />
                    </div>
                    <span>Listening... Tap to Stop</span>
                  </>
                ) : isProcessingVoice ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Transcribing with AI...</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4" />
                    <span>Click to Speak</span>
                  </>
                )}
              </button>


              {/* Natural Language Input Bar */}
              <div className="relative flex-1">
                <Input
                  ref={inputRef}
                  type="text"
                  value={inputText}
                  onChange={(e) => {
                    speechControllerRef.current?.stopAudio();
                    setIsPlayingAudio(false);
                    setInputText(e.target.value);
                  }}
                  onFocus={() => {
                    speechControllerRef.current?.stopAudio();
                    setIsPlayingAudio(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSendQuery();
                    if (e.key === 'Escape') handleClearInput();
                  }}
                  placeholder={
                    isListening
                      ? `🎙️ Listening in ${selectedLang.label.split(' ')[0]}... Speak now`
                      : isProcessingVoice
                      ? '⏳ Transcribing audio with Gemini AI...'
                      : `Speak or type order in ${selectedLang.label.split(' ')[0]} (e.g. Ramesh 5000)...`
                  }
                  className="h-12 pl-3.5 pr-20 rounded-2xl bg-slate-50 border-slate-200 text-sm focus:bg-white"
                />

                {inputText && (
                  <button
                    onClick={handleClearInput}
                    className="absolute right-12 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}

                <button
                  onClick={() => handleSendQuery()}
                  disabled={isLoading || !inputText.trim()}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl text-xs font-semibold flex items-center justify-center transition-all"
                >
                  {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Self-Correction Warning */}
            {clarificationNotice && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-amber-900">Clarification Needed</h4>
                  <p className="text-xs text-amber-700 mt-0.5">{clarificationNotice}</p>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={toggleListening}
                    className="mt-2 bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    Speak Again
                  </Button>
                </div>
              </div>
            )}

            {/* Error Banner */}
            {errorMessage && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-rose-700">{errorMessage}</p>
                </div>
                <button onClick={() => setErrorMessage(null)} className="text-rose-500 hover:text-rose-700">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Query Result Card (Dynamic Charts & AI Insights) */}
            {queryResult && (
              <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="default">
                      {queryResult.mode === 'crm' ? 'Field CRM Activity' : 'Analytics Insight'}
                    </Badge>
                    <span className="text-xs text-slate-500">Query: "{queryResult.user_query}"</span>
                  </div>

                  {queryResult.audio_data && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => speechControllerRef.current?.playBase64Audio(queryResult.audio_data)}
                      className="bg-white gap-1.5"
                    >
                      <Volume2 className="w-3.5 h-3.5 text-blue-600" />
                      <span>Replay Voice</span>
                    </Button>
                  )}
                </div>

                {/* Spoken Answer Bubble */}
                {queryResult.spoken_answer && (
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 flex items-start gap-3 shadow-xs">
                    <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                      <Volume2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider">Voice Analysis</h4>
                      <p className="text-sm font-semibold text-slate-900 mt-1">{queryResult.spoken_answer}</p>
                    </div>
                  </div>
                )}

                {/* Dynamic Chart if Analytics */}
                {queryResult.chart && queryResult.data && queryResult.data.length > 0 && (
                  <div className="bg-white p-4 rounded-2xl border border-slate-200">
                    <DynamicChart data={queryResult.data} config={queryResult.chart} />
                  </div>
                )}

                {/* CRM Activity preview if CRM */}
                {queryResult.mode === 'crm' && queryResult.entries && queryResult.entries.length > 0 && (
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Extracted CRM Record</h4>
                      <Badge variant="paid">Captured in {queryResult.detected_language}</Badge>
                    </div>
                    {queryResult.entries.map((entry: any, i: number) => (
                      <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <div>
                          <span className="font-bold text-sm text-slate-900">{entry.client_name}</span>
                          <p className="text-xs text-slate-500 mt-0.5">{entry.notes}</p>
                        </div>
                        <div className="text-base font-bold text-emerald-600 font-mono">
                          ₹{Number(entry.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* 5. USER'S REFERENCE TABLE DESIGN (Matching media_1790949969609.png) */}
      <section id="ledger-preview" className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <Badge variant="secondary" className="mb-2 uppercase text-[10px] font-bold">
            Executive Ledger View
          </Badge>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Clean, Verified Accounting for Every Shop
          </h2>
          <p className="text-sm text-slate-500 mt-2">
            Every transaction is organized with clear status dot indicators, customer accounts, and real-time total revenue summaries.
          </p>
        </div>

        {/* Reference Image Layout Recreated with Native Shadcn Table */}
        <div className="shadow-lg shadow-slate-200/60 rounded-3xl overflow-hidden border border-slate-200/90 bg-white">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/80">
                <TableHead className="w-[30%] font-semibold text-slate-500 text-xs">Customer Account / Project</TableHead>
                <TableHead className="w-[18%] font-semibold text-slate-500 text-xs text-center">Status</TableHead>
                <TableHead className="w-[28%] font-semibold text-slate-500 text-xs">Assigned Team / Store</TableHead>
                <TableHead className="w-[24%] font-semibold text-slate-500 text-xs text-right">Budget / Amount</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              <TableRow className="hover:bg-slate-50/80 transition-colors">
                <TableCell className="font-semibold text-slate-900">Website Redesign (Kirana E-Store)</TableCell>
                <TableCell className="text-center"><Badge variant="paid">Paid</Badge></TableCell>
                <TableCell className="text-slate-600">Frontend Team</TableCell>
                <TableCell className="font-bold text-slate-900 text-right font-mono">₹12,500.00</TableCell>
              </TableRow>

              <TableRow className="hover:bg-slate-50/80 transition-colors">
                <TableCell className="font-semibold text-slate-900">Mobile Ordering App</TableCell>
                <TableCell className="text-center"><Badge variant="unpaid">Unpaid</Badge></TableCell>
                <TableCell className="text-slate-600">Mobile Team</TableCell>
                <TableCell className="font-bold text-slate-900 text-right font-mono">₹8,750.00</TableCell>
              </TableRow>

              <TableRow className="hover:bg-slate-50/80 transition-colors">
                <TableCell className="font-semibold text-slate-900">API Integration (UPI / QR)</TableCell>
                <TableCell className="text-center"><Badge variant="pending">Pending</Badge></TableCell>
                <TableCell className="text-slate-600">Backend Team</TableCell>
                <TableCell className="font-bold text-slate-900 text-right font-mono">₹5,200.00</TableCell>
              </TableRow>

              <TableRow className="hover:bg-slate-50/80 transition-colors">
                <TableCell className="font-semibold text-slate-900">Database Migration (Supabase Cloud)</TableCell>
                <TableCell className="text-center"><Badge variant="paid">Paid</Badge></TableCell>
                <TableCell className="text-slate-600">DevOps Team</TableCell>
                <TableCell className="font-bold text-slate-900 text-right font-mono">₹3,800.00</TableCell>
              </TableRow>

              <TableRow className="hover:bg-slate-50/80 transition-colors">
                <TableCell className="font-semibold text-slate-900">User Dashboard Analytics</TableCell>
                <TableCell className="text-center"><Badge variant="paid">Paid</Badge></TableCell>
                <TableCell className="text-slate-600">UX Team</TableCell>
                <TableCell className="font-bold text-slate-900 text-right font-mono">₹7,200.00</TableCell>
              </TableRow>

              <TableRow className="hover:bg-slate-50/80 transition-colors">
                <TableCell className="font-semibold text-slate-900">Security Audit (RLS Policies)</TableCell>
                <TableCell className="text-center"><Badge variant="failed">Failed</Badge></TableCell>
                <TableCell className="text-slate-600">Security Team</TableCell>
                <TableCell className="font-bold text-slate-900 text-right font-mono">₹2,100.00</TableCell>
              </TableRow>
            </TableBody>

            <TableFooter>
              <TableRow className="bg-slate-50/90 font-bold border-t border-slate-200">
                <TableCell colSpan={3} className="text-slate-900 font-bold text-sm py-4">
                  Total Budget / Verified Revenue (6 entries)
                </TableCell>
                <TableCell className="text-right text-slate-950 font-bold font-mono text-base py-4">
                  ₹39,550.00
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>

        <div className="mt-4 flex items-center justify-between text-xs text-slate-500 px-2">
          <span>*Live preview matching your CRM data structure. View your real activities in the dashboard.</span>
          <Link href="/dashboard" className="font-bold text-blue-600 hover:underline flex items-center gap-1">
            Access Your Private Ledger <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>

      {/* 6. USER'S REQUESTED FEATURES-CARD BENTO GRID */}
      <section id="features-bento" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <FeaturesCard />
      </section>

      {/* 7. TAILORED FOR EVERY BUSINESS SIZE */}
      <section id="for-shops" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <Badge variant="secondary" className="mb-2 uppercase text-[10px] font-bold">
            Tailored For Bharat
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Designed for Daily Kirana to Enterprise Wholesalers
          </h2>
          <p className="text-sm sm:text-base text-slate-500 mt-2">
            No accounting degree or laptop typing needed. Simply speak naturally during your busy work day.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="rounded-3xl border-slate-200 shadow-md hover:shadow-xl transition-all">
            <CardHeader>
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-2 border border-blue-100">
                <Store className="w-6 h-6" />
              </div>
              <CardTitle className="text-lg font-bold">Daily Small Shops & Kirana</CardTitle>
              <CardDescription>Groceries, Bakeries, Chai shops, Medicals</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5 text-xs text-slate-600">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Speak customer orders while packing goods with both hands</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Daily Khata / Hisab balance queries in mother tongue</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Zero hardware costs — works directly on Android smartphone</span>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-slate-200 shadow-md hover:shadow-xl transition-all">
            <CardHeader>
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2 border border-indigo-100">
                <Building2 className="w-6 h-6" />
              </div>
              <CardTitle className="text-lg font-bold">Medium Retailers & Wholesalers</CardTitle>
              <CardDescription>Electronics, Hardware, Garment Showrooms</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5 text-xs text-slate-600">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Multi-ticket customer orders with rupee value verification</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Supplier payment collections and credit balance tracking</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Instant 1-click A4 PDF print statements with signature lines</span>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-slate-200 shadow-md hover:shadow-xl transition-all">
            <CardHeader>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2 border border-emerald-100">
                <Briefcase className="w-6 h-6" />
              </div>
              <CardTitle className="text-lg font-bold">Field Sales & Distribution</CardTitle>
              <CardDescription>FMCG, Pharma Agents, Distributors</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5 text-xs text-slate-600">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Field reps dictate shop visit notes outside the client store</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Automatic English translation for centralized management</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Supabase cloud replication with offline-first local SQLite resilience</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 8. FAQ ACCORDION SECTION */}
      <section id="faq" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-10">
          <Badge variant="secondary" className="mb-2 uppercase text-[10px] font-bold">
            Frequently Asked Questions
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Common Inquiries From Shop Owners
          </h2>
        </div>

        <div className="space-y-3">
          {[
            {
              q: "Does IndicBI work with Tamil, Kannada, Hindi, and Telugu number words?",
              a: "Yes! IndicBI contains a specialized Indian numeral parsing engine. Phrases spoken as words like 'ஐயாயிரம்' (5000 in Tamil), 'ಮೂರು ಸಾವಿರ' (3000 in Kannada), or 'दो हज़ार पाँच सौ' (2500 in Hindi) are automatically converted into exact numeric rupee values."
            },
            {
              q: "Can I verify an order before it gets saved into the database?",
              a: "Absolutely. IndicBI features an interactive Step 2 User Verification card. Before any spoken order is committed to your Supabase ledger, you see the native speech transcript, English translation, and editable rupee amount."
            },
            {
              q: "What happens if my shop loses internet connection?",
              a: "IndicBI features dual-tier storage. All records are instantly saved to a local offline SQLite database on your device, and automatically synced with your Supabase cloud database as soon as connectivity resumes."
            },
            {
              q: "Can I print a daily sales report for accounting or tax purposes?",
              a: "Yes. From your CRM Dashboard, click 'Orders PDF Report' to generate an official A4 statement with your business headers, total KPI revenue, itemized ledger entries, and signature lines."
            },
            {
              q: "Does it work on mobile phones?",
              a: "Yes. The UI is 100% responsive and touch-friendly. Chrome on Android supports Web Speech recognition natively with Google's Indian voice models."
            }
          ].map((item, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="bg-white border border-slate-200 rounded-2xl overflow-hidden transition-all shadow-xs"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-semibold text-sm text-slate-900 hover:text-blue-600 transition-colors"
                >
                  <span>{item.q}</span>
                  {isOpen ? <ChevronUp className="w-4 h-4 shrink-0 text-blue-600" /> : <ChevronDown className="w-4 h-4 shrink-0 text-slate-400" />}
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-100">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 9. CALL TO ACTION BANNER */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 rounded-3xl p-8 sm:p-12 text-white text-center shadow-xl shadow-blue-500/20 relative overflow-hidden">
          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Ready to Upgrade Your Daily Shop with Voice Commerce?
            </h3>
            <p className="text-xs sm:text-sm text-blue-100 leading-relaxed">
              Launch your private business workspace with zero configuration. Record sales, track debtors, and query ledger calculations in your own language.
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
              <Link href="/dashboard">
                <Button variant="default" size="lg" className="bg-white text-blue-900 hover:bg-blue-50 font-bold h-12 px-8">
                  Get Started Free
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 10. MODERN BUSINESS FOOTER (Minimal & Clean) */}
      <footer className="border-t border-slate-200 bg-white py-8 px-4 sm:px-6 lg:px-8 text-xs text-slate-500">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
              IB
            </div>
            <span className="font-bold text-slate-900 text-sm">IndicBI</span>
            <span className="text-slate-400">· Voice CRM for Bharat</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-medium">
            <Link href="/dashboard" className="hover:text-blue-600 transition-colors">Dashboard</Link>
            <a href="#for-shops" className="hover:text-blue-600 transition-colors">Solutions</a>
            <a href="#demo-studio" className="hover:text-blue-600 transition-colors">Voice Studio</a>
            <a href="#faq" className="hover:text-blue-600 transition-colors">FAQ</a>
          </div>

          <div className="text-[11px] text-slate-400">
            © {new Date().getFullYear()} IndicBI
          </div>
        </div>
      </footer>

    </div>
  );
}
