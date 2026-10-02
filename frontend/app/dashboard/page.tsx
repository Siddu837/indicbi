'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  Mic, MicOff, Volume2, VolumeX, Search, X, CheckCircle2, TrendingUp, 
  ShoppingBag, Users, Database, Globe, ChevronDown, ChevronUp,
  ArrowRight, ShieldCheck, Sparkles, DollarSign, AlertCircle,
  RefreshCw, Plus, Trash2, Copy, Check,
  ArrowLeft, BarChart3, PieChart as PieIcon, LineChart as LineIcon,
  Printer, FileText, Download, Edit3
} from 'lucide-react';
import DynamicChart from '../../components/DynamicChart';
import { SpeechController, LANGUAGE_OPTIONS } from '../../components/SpeechController';
import { TRANSLATIONS } from '../../components/translations';
import { BusinessLedgerTable } from '@/components/ui/business-ledger-table';

const API_BASE_URL = typeof window !== 'undefined' 
  ? (process.env.NEXT_PUBLIC_API_URL || '')
  : 'http://localhost:8001';

export default function GuestDashboardPage() {
  const [guestId, setGuestId] = useState<string>('');
  const [selectedLang, setSelectedLang] = useState(LANGUAGE_OPTIONS[0]); // English (India)
  const t = TRANSLATIONS[selectedLang.code] || TRANSLATIONS['en-IN'];

  // Input & Voice State
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [liveVolume, setLiveVolume] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [clarificationNotice, setClarificationNotice] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Pending Voice Activity Verification State
  const [pendingVerificationEntry, setPendingVerificationEntry] = useState<{
    client_name: string;
    action: string;
    amount: number | string;
    notes: string;
    user_language_text: string;
    translated_english: string;
    detected_language: string;
    detected_code: string;
  } | null>(null);
  const [isConfirmingVerification, setIsConfirmingVerification] = useState(false);
  const [verificationFeedback, setVerificationFeedback] = useState<string | null>(null);

  // Guest Activities & Metrics State
  const [activities, setActivities] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>({
    total_revenue: 0,
    total_transactions: 0,
    average_deal: 0,
    highest_sale: 0,
    clients_count: 0,
    client_breakdown: [],
    action_breakdown: [],
    recent_trend: []
  });
  // Active query result / manipulated computation view
  const [computedResult, setComputedResult] = useState<any | null>(null);
  const [tableFilter, setTableFilter] = useState<'all' | 'order' | 'payment' | 'visit'>('all');

  // Modals & Panels
  const [showAddModal, setShowAddModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [newEntry, setNewEntry] = useState({ client_name: '', action: 'order', amount: '', notes: '' });

  const speechControllerRef = useRef<SpeechController | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Keep fresh references for async closures (prevents stale language/guestId state)
  const selectedLangRef = useRef(selectedLang);
  const guestIdRef = useRef(guestId);

  useEffect(() => {
    selectedLangRef.current = selectedLang;
  }, [selectedLang]);

  useEffect(() => {
    guestIdRef.current = guestId;
  }, [guestId]);

  // Keep SpeechController callbacks synchronized with active language & guest ID
  useEffect(() => {
    if (speechControllerRef.current) {
      speechControllerRef.current.updateCallbacks(
        (transcript) => {
          setInputText(transcript);
          handleSendQuery(transcript, guestIdRef.current);
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
  }, [selectedLang, guestId]);

  // Initialize Guest ID and fetch data
  useEffect(() => {
    let id = '';
    try {
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const paramId = urlParams.get('guest_id');
        if (paramId) {
          id = paramId;
        } else {
          try {
            id = localStorage.getItem('indicbi_guest_id') || '';
          } catch (e) {}
        }
      }
    } catch (e) {}

    if (!id) {
      id = 'guest_' + Math.random().toString(36).substring(2, 10);
    }

    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('indicbi_guest_id', id);
      }
    } catch (e) {}

    setGuestId(id);
    guestIdRef.current = id;

    speechControllerRef.current = new SpeechController(
      (transcript) => {
        setInputText(transcript);
        handleSendQuery(transcript, id);
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

    fetchGuestActivities(id);
  }, []);

  const fetchGuestActivities = async (idToFetch?: string) => {
    const targetId = idToFetch || guestId;
    if (!targetId) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/guest/activities?guest_id=${targetId}`);
      if (res.ok) {
        const data = await res.json();
        setActivities(data.activities || []);
        if (data.metrics) {
          setMetrics(data.metrics);
        }
      }
    } catch (e) {
      console.warn('Failed to fetch guest activities');
    }
  };

  const handleNewGuestSession = () => {
    const newId = 'guest_' + Math.random().toString(36).substring(2, 10);
    try {
      localStorage.setItem('indicbi_guest_id', newId);
    } catch (e) {}
    setGuestId(newId);
    setActivities([]);
    setComputedResult(null);
    fetchGuestActivities(newId);
  };

  const handleCopyGuestId = () => {
    navigator.clipboard.writeText(guestId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStopAudio = () => {
    speechControllerRef.current?.stopAudio();
    setIsPlayingAudio(false);
  };

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

    if (result.mode === 'crm' && result.entries && result.entries.length > 0) {
      const topEntry = result.entries[0];
      setPendingVerificationEntry({
        client_name: topEntry.client_name || '',
        action: topEntry.action || 'order',
        amount: topEntry.amount || 0,
        notes: topEntry.notes || '',
        user_language_text: topEntry.user_language_text || result.user_query || result.transcribed_text,
        translated_english: topEntry.translated_english || '',
        detected_language: result.detected_language || selectedLangRef.current.label,
        detected_code: result.detected_code || selectedLangRef.current.code
      });
      setComputedResult(result);
      if (result.audio_data) {
        setIsPlayingAudio(true);
        speechControllerRef.current?.playBase64Audio(result.audio_data);
      } else if (result.spoken_answer) {
        setIsPlayingAudio(true);
        speechControllerRef.current?.speak(result.spoken_answer, selectedLangRef.current.code);
      }
      return;
    }

    setComputedResult(result);
    fetchGuestActivities(guestIdRef.current);

    if (result.audio_data) {
      setIsPlayingAudio(true);
      speechControllerRef.current?.playBase64Audio(result.audio_data);
    } else if (result.spoken_answer) {
      setIsPlayingAudio(true);
      speechControllerRef.current?.speak(result.spoken_answer, selectedLangRef.current.code);
    }
  };

  const toggleListening = async () => {
    // ALWAYS cancel any ongoing audio output immediately when user clicks mic
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

    speechControllerRef.current?.startListening(selectedLangRef.current.code, guestIdRef.current, false);
  };

  const handleClearInput = () => {
    speechControllerRef.current?.stopAudio();
    setIsPlayingAudio(false);
    setInputText('');
    setErrorMessage(null);
    setClarificationNotice(null);
    if (inputRef.current) inputRef.current.focus();
  };

  const handleConfirmVerification = async () => {
    if (!pendingVerificationEntry) return;
    setIsConfirmingVerification(true);
    speechControllerRef.current?.stopAudio();
    setIsPlayingAudio(false);

    try {
      const res = await fetch(`${API_BASE_URL}/api/guest/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guest_id: guestId,
          client_name: pendingVerificationEntry.client_name,
          action: pendingVerificationEntry.action,
          amount: parseFloat(String(pendingVerificationEntry.amount)) || 0,
          notes: pendingVerificationEntry.notes || `[${(pendingVerificationEntry.detected_code || 'LANG').slice(0, 2).toUpperCase()}]: ${pendingVerificationEntry.user_language_text} | [EN]: ${pendingVerificationEntry.translated_english}`
        })
      });

      if (res.ok) {
        setVerificationFeedback('✓ Activity verified and saved to ledger!');
        setTimeout(() => setVerificationFeedback(null), 5000);
        setPendingVerificationEntry(null);
        setInputText('');
        fetchGuestActivities();
      } else {
        const err = await res.json();
        setErrorMessage(err.detail || 'Failed to save verified activity to database.');
      }
    } catch (e: any) {
      setErrorMessage(e.message || 'Network error saving verified activity.');
    } finally {
      setIsConfirmingVerification(false);
    }
  };

  const handleDiscardVerification = () => {
    speechControllerRef.current?.stopAudio();
    setIsPlayingAudio(false);
    setPendingVerificationEntry(null);
    setInputText('');
  };

  const handleSendQuery = async (textToSend?: string, overrideGuestId?: string) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    speechControllerRef.current?.stopAudio();
    setIsPlayingAudio(false);

    const currentGuest = overrideGuestId || guestIdRef.current;
    const currentLang = selectedLangRef.current;
    setIsLoading(true);
    setErrorMessage(null);
    setClarificationNotice(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text,
          language: currentLang.code,
          guest_id: currentGuest
        })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Query execution failed.');
      }

      const result = await response.json();

      // Handle Self-Correction / Clarification
      if (result.mode === 'clarification' || result.needs_clarification) {
        setClarificationNotice(result.spoken_answer || t.self_correction_prompt);
        if (result.audio_data) {
          setIsPlayingAudio(true);
          speechControllerRef.current?.playBase64Audio(result.audio_data);
        }
        setIsLoading(false);
        return;
      }

      // Handle Field Sales CRM Activity with Human-in-the-loop Verification
      if (result.mode === 'crm' && result.entries && result.entries.length > 0) {
        const topEntry = result.entries[0];
        setPendingVerificationEntry({
          client_name: topEntry.client_name || '',
          action: topEntry.action || 'order',
          amount: topEntry.amount || 0,
          notes: topEntry.notes || '',
          user_language_text: topEntry.user_language_text || result.user_query || text,
          translated_english: topEntry.translated_english || '',
          detected_language: result.detected_language || selectedLang.label,
          detected_code: result.detected_code || selectedLang.code
        });
        setComputedResult(result);
        if (result.audio_data) {
          setIsPlayingAudio(true);
          speechControllerRef.current?.playBase64Audio(result.audio_data);
        } else if (result.spoken_answer) {
          setIsPlayingAudio(true);
          speechControllerRef.current?.speak(result.spoken_answer, selectedLang.code);
        }
        setIsLoading(false);
        return;
      }

      setComputedResult(result);
      fetchGuestActivities(currentGuest);

      // Play neural voice for analytical retrievals
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
      const formData = new FormData();
      formData.append('file', file);
      formData.append('language', selectedLang.code);
      formData.append('guest_id', guestId);
      formData.append('auto_save', 'false');

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

      if (result.needs_clarification) {
        setClarificationNotice(result.message || 'Could not understand audio.');
      } else if (result.mode === 'crm' && result.requires_verification && result.entries && result.entries.length > 0) {
        const firstEntry = result.entries[0];
        setPendingVerificationEntry({
          client_name: firstEntry.client_name || 'Walk-in Client',
          action: firstEntry.action || 'order',
          amount: firstEntry.amount || '',
          notes: firstEntry.notes || '',
          user_language_text: firstEntry.user_language_text || result.transcribed_text,
          translated_english: firstEntry.translated_english || '',
          detected_language: result.detected_language || 'Regional',
          detected_code: result.detected_code || selectedLang.code,
        });
      } else {
        setComputedResult(result);
        fetchGuestActivities();
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

  const handleDeleteActivity = async (activityId: number) => {
    try {
      await fetch(`${API_BASE_URL}/api/guest/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guest_id: guestId, activity_id: activityId })
      });
      fetchGuestActivities();
    } catch (e) {
      console.warn('Delete failed', e);
    }
  };

  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEntry.client_name.trim()) return;

    try {
      await fetch(`${API_BASE_URL}/api/guest/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guest_id: guestId,
          client_name: newEntry.client_name,
          action: newEntry.action,
          amount: parseFloat(newEntry.amount) || 0,
          notes: newEntry.notes
        })
      });
      setShowAddModal(false);
      setNewEntry({ client_name: '', action: 'order', amount: '', notes: '' });
      fetchGuestActivities();
    } catch (e) {
      alert('Failed to log entry');
    }
  };

  const handlePrintReport = () => {
    const currentDate = new Date().toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const currentTime = new Date().toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const totalOrders = activities.filter(a => (a.action || '').toLowerCase().includes('order')).length;
    const totalPayments = activities.filter(a => (a.action || '').toLowerCase().includes('payment')).length;
    const totalRevenue = activities.reduce((sum, a) => sum + (Number(a.amount) || 0), 0);
    const avgTicket = activities.length > 0 ? (totalRevenue / activities.length) : 0;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.print();
      return;
    }

    const rowsHtml = activities.map((act, idx) => `
      <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px;">
        <td style="padding: 8px 10px; font-weight: bold; color: #475569; text-align: center;">${idx + 1}</td>
        <td style="padding: 8px 10px; color: #64748b;">${act.created_at ? act.created_at.slice(0, 16).replace('T', ' ') : 'Today'}</td>
        <td style="padding: 8px 10px; font-weight: 600; color: #0f172a;">${act.client_name || 'Walk-in Client'}</td>
        <td style="padding: 8px 10px; text-transform: capitalize;">
          <span style="display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 10px; font-weight: 600; background: ${
            act.action === 'payment' ? '#dcfce7; color: #166534;' : act.action === 'order' ? '#dbeafe; color: #1e40af;' : '#f3e8ff; color: #6b21a8;'
          }">
            ${act.action || 'order'}
          </span>
        </td>
        <td style="padding: 8px 10px; font-weight: bold; color: #0f172a; text-align: right;">
          ₹${Number(act.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </td>
        <td style="padding: 8px 10px; text-align: center;">
          <span style="color: #059669; font-weight: 500;">${act.status || 'Completed'}</span>
        </td>
        <td style="padding: 8px 10px; color: #475569; max-width: 280px; word-break: break-word;">${act.notes || '—'}</td>
      </tr>
    `).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>IndicBI Sales & Orders Report - ${guestId}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 12mm 15mm;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans", "Noto Sans Tamil", "Noto Sans Kannada", "Noto Sans Devanagari", "Noto Sans Telugu", Helvetica, Arial, sans-serif;
              color: #0f172a;
              background: #fff;
              margin: 0;
              padding: 0;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .header-table {
              width: 100%;
              border-bottom: 2px solid #2563eb;
              padding-bottom: 12px;
              margin-bottom: 16px;
            }
            .title {
              font-size: 22px;
              font-weight: 800;
              color: #1e293b;
              margin: 0;
            }
            .subtitle {
              font-size: 11px;
              color: #64748b;
              margin-top: 3px;
            }
            .meta-box {
              text-align: right;
              font-size: 11px;
              color: #475569;
            }
            .badge {
              display: inline-block;
              padding: 2px 8px;
              border-radius: 4px;
              font-size: 10px;
              font-weight: bold;
              background: #eff6ff;
              color: #1d4ed8;
              border: 1px solid #bfdbfe;
            }
            .kpi-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 10px;
              margin-bottom: 18px;
            }
            .kpi-card {
              border: 1px solid #cbd5e1;
              border-radius: 8px;
              padding: 10px 12px;
              background: #f8fafc;
            }
            .kpi-label {
              font-size: 10px;
              color: #64748b;
              font-weight: 600;
              text-transform: uppercase;
            }
            .kpi-value {
              font-size: 16px;
              font-weight: 800;
              color: #0f172a;
              margin-top: 2px;
            }
            .report-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            .report-table th {
              background: #f1f5f9;
              color: #334155;
              font-size: 10px;
              text-transform: uppercase;
              font-weight: 700;
              padding: 8px 10px;
              border-top: 1px solid #cbd5e1;
              border-bottom: 2px solid #94a3b8;
              text-align: left;
            }
            .total-row {
              background: #f8fafc;
              border-top: 2px solid #0f172a;
              border-bottom: 2px solid #0f172a;
              font-weight: bold;
              font-size: 12px;
            }
            .signature-section {
              margin-top: 40px;
              display: flex;
              justify-content: space-between;
              padding-top: 20px;
              page-break-inside: avoid;
            }
            .sign-line {
              width: 200px;
              border-top: 1px solid #64748b;
              text-align: center;
              font-size: 11px;
              color: #475569;
              padding-top: 6px;
              margin-top: 35px;
            }
            .footer-note {
              margin-top: 30px;
              border-top: 1px dashed #cbd5e1;
              padding-top: 8px;
              text-align: center;
              font-size: 9px;
              color: #94a3b8;
            }
          </style>
        </head>
        <body>
          <table class="header-table">
            <tr>
              <td>
                <h1 class="title">IndicBI · Daily Sales & Orders Report</h1>
                <p class="subtitle">AI Voice-First Business Intelligence & Field Sales CRM for Bharat</p>
              </td>
              <td class="meta-box">
                <div class="badge">Session ID: ${guestId}</div>
                <div style="margin-top: 4px;"><strong>Generated:</strong> ${currentDate}, ${currentTime}</div>
                <div><strong>Records Logged:</strong> ${activities.length} Entries</div>
              </td>
            </tr>
          </table>

          <div class="kpi-grid">
            <div class="kpi-card">
              <div class="kpi-label">Total Revenue / Sales</div>
              <div class="kpi-value" style="color: #1e40af;">₹${totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">Orders Logged</div>
              <div class="kpi-value">${totalOrders}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">Payments Received</div>
              <div class="kpi-value" style="color: #15803d;">${totalPayments}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">Average Ticket Size</div>
              <div class="kpi-value">₹${avgTicket.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
            </div>
          </div>

          <table class="report-table">
            <thead>
              <tr>
                <th style="text-align: center; width: 35px;">#</th>
                <th style="width: 110px;">Date & Time</th>
                <th style="width: 170px;">Client / Shop (Bilingual)</th>
                <th style="width: 75px;">Type</th>
                <th style="text-align: right; width: 90px;">Amount</th>
                <th style="text-align: center; width: 70px;">Status</th>
                <th>Bilingual Spoken Notes & Transcript</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml || '<tr><td colspan="7" style="padding: 20px; text-align: center; color: #94a3b8;">No records logged yet under this session.</td></tr>'}
              ${activities.length > 0 ? `
                <tr class="total-row">
                  <td colspan="4" style="padding: 10px; text-align: right;">GRAND TOTAL:</td>
                  <td style="padding: 10px; text-align: right; color: #1e40af;">₹${totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td colspan="2" style="padding: 10px; font-size: 10px; color: #64748b;">${activities.length} Total Verified Entries</td>
                </tr>
              ` : ''}
            </tbody>
          </table>

          <div class="signature-section">
            <div class="sign-line">
              Sales Representative Signature
            </div>
            <div class="sign-line">
              Store Owner / Manager Approval
            </div>
          </div>

          <div class="footer-note">
            Generated via IndicBI platform · Guaranteed 100% user-scoped ledger data · Zero mock records · Printable Official Statement
          </div>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const filteredActivities = activities.filter((act) => {
    if (tableFilter === 'all') return true;
    return (act.action || '').toLowerCase().includes(tableFilter);
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans antialiased">
      
      {/* 1. TOP APP BAR */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
          
          <div className="flex items-center gap-2 sm:gap-3">
            <Link 
              href="/" 
              className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors p-1.5 rounded-lg hover:bg-slate-100"
              title="Return to Landing Page"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Landing Page</span>
            </Link>

            <div className="h-5 w-px bg-slate-200 hidden sm:block"></div>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
                <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base sm:text-lg text-slate-900 tracking-tight">IndicBI</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 uppercase">
                  CRM
                </span>
              </div>
            </div>
          </div>

          {/* Desktop Guest ID & Language Controls */}
          <div className="hidden sm:flex items-center gap-2 sm:gap-3">
            {/* Guest ID Pill */}
            <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs">
              <span className="text-slate-500 font-medium">Guest:</span>
              <code className="font-mono font-bold text-blue-700">{guestId ? guestId.slice(0, 10) : '...'}</code>
              <button
                onClick={handleCopyGuestId}
                title="Copy Guest ID"
                className="text-slate-400 hover:text-slate-700 ml-1 p-0.5 rounded"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Language Selector */}
            <div className="flex items-center gap-1 bg-slate-100 rounded-lg px-2 py-1.5 border border-slate-200">
              <Globe className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={selectedLang.code}
                onChange={(e) => {
                  const lang = LANGUAGE_OPTIONS.find(l => l.code === e.target.value);
                  if (lang) {
                    setSelectedLang(lang);
                    selectedLangRef.current = lang;
                    handleStopAudio();
                  }
                }}
                className="bg-transparent text-xs font-semibold text-slate-700 outline-none cursor-pointer"
              >
                {LANGUAGE_OPTIONS.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Mobile Right Bar (Language Dropdown Only on Top Row) */}
          <div className="sm:hidden flex items-center gap-1.5">
            <div className="flex items-center gap-1 bg-slate-100 rounded-lg px-2 py-1 border border-slate-200">
              <Globe className="w-3 h-3 text-slate-500" />
              <select
                value={selectedLang.code}
                onChange={(e) => {
                  const lang = LANGUAGE_OPTIONS.find(l => l.code === e.target.value);
                  if (lang) {
                    setSelectedLang(lang);
                    selectedLangRef.current = lang;
                    handleStopAudio();
                  }
                }}
                className="bg-transparent text-[11px] font-semibold text-slate-700 outline-none cursor-pointer"
              >
                {LANGUAGE_OPTIONS.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.label.split(' ')[0]}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Mobile Dedicated Status Bar (Row 2 on screens < 640px) */}
        <div className="sm:hidden px-3 py-2 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px]">
            <span className="text-slate-400 font-medium">ID:</span>
            <code className="font-mono font-bold text-blue-700">{guestId ? guestId.slice(0, 8) : '...'}</code>
            <button
              onClick={handleCopyGuestId}
              title="Copy Guest ID"
              className="text-slate-400 hover:text-slate-700 ml-0.5"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">CRM Ledger</span>
        </div>
      </header>

      {/* 2. DASHBOARD BODY */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-6 sm:space-y-8">
        
        {/* TOP WELCOME & STATS OVERVIEW */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Sales & CRM Workspace
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Session: <code className="font-mono text-blue-600 bg-blue-50 px-1 py-0.5 rounded break-all">{guestId}</code>
            </p>
          </div>

          {/* Action Buttons: Stacked on mobile, row on tablet/desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 w-full lg:w-auto">
            <button
              onClick={() => setShowReportModal(true)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-semibold shadow-2xs transition-all w-full"
              title="Generate printable PDF report of your orders"
            >
              <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>Orders PDF Report</span>
            </button>

            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all w-full"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>Log Manual Entry</span>
            </button>

            <button
              onClick={handleNewGuestSession}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-medium transition-all w-full"
              title="Start a new blank guest session"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Reset / New ID</span>
            </button>
          </div>
        </div>

        {/* 3. LIVE COMPUTED KPI CARDS (From User's Past Data) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
            <span className="text-[11px] sm:text-xs font-medium text-slate-500">Your Total Sales</span>
            <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
              ₹{Number(metrics.total_revenue || 0).toLocaleString('en-IN')}
            </p>
            <span className="text-[10px] sm:text-[11px] text-emerald-600 font-semibold">
              Computed across {metrics.total_transactions} records
            </span>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
            <span className="text-[11px] sm:text-xs font-medium text-slate-500">Your Average Deal</span>
            <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
              ₹{Number(metrics.average_deal || 0).toLocaleString('en-IN')}
            </p>
            <span className="text-[10px] sm:text-[11px] text-slate-500">
              Avg ticket per transaction
            </span>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
            <span className="text-[11px] sm:text-xs font-medium text-slate-500">Highest Single Order</span>
            <p className="text-xl sm:text-2xl font-bold text-blue-600 mt-1">
              ₹{Number(metrics.highest_sale || 0).toLocaleString('en-IN')}
            </p>
            <span className="text-[10px] sm:text-[11px] text-slate-500">
              Top recorded value
            </span>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
            <span className="text-[11px] sm:text-xs font-medium text-slate-500">Active Clients</span>
            <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
              {metrics.clients_count || 0}
            </p>
            <span className="text-[10px] sm:text-[11px] text-indigo-600 font-semibold">
              Unique customer accounts
            </span>
          </div>
        </div>

        {/* 4. MAIN VOICE & CALCULATION STUDIO (The User Perspective Engine) */}
        <div className="bg-white border border-slate-200 shadow-md shadow-slate-100 rounded-3xl p-4 sm:p-8 space-y-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider border border-blue-100">
                Voice Studio
              </span>
              <span className="text-xs text-slate-500">
                Speak orders or ask calculations in {selectedLang.label.split(' ')[0]}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {/* Real-time Web Speech & Audio Capture Button */}
            <button
              onClick={toggleListening}
              disabled={isProcessingVoice}
              className={`flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl font-semibold text-sm transition-all shadow-md active:scale-95 w-full sm:w-auto shrink-0 ${
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


            {/* Instant Audio Stop Button (if voice is playing) */}
            {isPlayingAudio && (
              <button
                onClick={handleStopAudio}
                className="flex items-center justify-center gap-1.5 px-4 py-4 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-semibold text-xs transition-all shadow-sm active:scale-95"
                title="Silence playing AI voice immediately"
              >
                <VolumeX className="w-4 h-4 text-amber-700" />
                <span>Stop Voice</span>
              </button>
            )}

            {/* Input Bar */}
            <div className="relative flex-1">
              <input
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
                className="w-full pl-4 pr-24 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />

              {inputText && (
                <button
                  onClick={handleClearInput}
                  className="absolute right-16 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={() => handleSendQuery()}
                disabled={isLoading || !inputText.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition-all"
              >
                {isLoading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <ArrowRight className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* Active Voice Recognition & Real-time Language Status */}
          <div className="mt-2.5 flex items-center justify-between text-xs px-1 text-slate-500 gap-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Voice: <strong>{selectedLang.label.split(' ')[0]}</strong></span>
            </div>
            <span className="text-[11px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100 font-medium">
              Bilingual (Native + EN)
            </span>
          </div>

          {/* Self-Correction Warning */}
          {clarificationNotice && (
            <div className="mt-4 p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-amber-900">Clarification Needed</h4>
                <p className="text-xs text-amber-700 mt-0.5">{clarificationNotice}</p>
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={toggleListening}
                    className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-medium"
                  >
                    Speak Again
                  </button>
                  <button
                    onClick={handleStopAudio}
                    className="px-2.5 py-1 bg-white hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg text-xs font-medium flex items-center gap-1"
                  >
                    <VolumeX className="w-3.5 h-3.5" />
                    <span>Mute</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="mt-4 p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-rose-700">{errorMessage}</p>
              </div>
              <button onClick={() => setErrorMessage(null)} className="text-rose-500 hover:text-rose-700">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Voice & Text Usage Guide */}
          <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500">
            <span>Speak orders naturally or ask computations in {selectedLang.label.split(' ')[0]}.</span>
            <span className="text-[11px] text-emerald-700 font-medium">✓ Real Ledger · Zero Mock Data</span>
          </div>
        </div>

        {/* VERIFICATION FEEDBACK BANNER */}
        {verificationFeedback && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-emerald-900 shadow-sm">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="text-sm font-semibold">{verificationFeedback}</span>
            </div>
            <button onClick={() => setVerificationFeedback(null)} className="text-emerald-500 hover:text-emerald-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* EXPLICIT USER VERIFICATION STEP (VOICE ACTIVITY REVIEW CARD) */}
        {pendingVerificationEntry && (
          <div className="bg-white border-2 border-emerald-500 shadow-lg shadow-emerald-500/10 rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                    <span>Voice Activity Recognized — Please Verify</span>
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      Step 2: User Verification
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Verify client name, rupee amount, and translation below before saving to your business ledger.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 border border-blue-200">
                  {pendingVerificationEntry.detected_language}
                </span>
                <button
                  onClick={handleStopAudio}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium flex items-center gap-1 transition-colors"
                  title="Silence speech audio"
                >
                  <VolumeX className="w-3.5 h-3.5 text-slate-500" />
                  <span>Mute Audio</span>
                </button>
              </div>
            </div>

            {/* BILINGUAL CAPTURE PREVIEW */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  <span>1. Original Spoken Transcript</span>
                  <span className="text-emerald-700 font-mono">{pendingVerificationEntry.detected_code}</span>
                </div>
                <p className="text-sm font-semibold text-slate-900 bg-white p-3 rounded-xl border border-slate-200">
                  "{pendingVerificationEntry.user_language_text}"
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  <span>2. English Translation</span>
                  <span className="text-blue-700 font-mono">EN</span>
                </div>
                <p className="text-sm font-semibold text-slate-800 bg-white p-3 rounded-xl border border-slate-200">
                  "{pendingVerificationEntry.translated_english || 'Translating activity...'}"
                </p>
              </div>
            </div>

            {/* EDITABLE FIELDS BEFORE CONFIRMATION */}
            <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-5 space-y-4">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                <span>Verify Or Adjust Extracted Details (Editable)</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Client / Shop Name (Bilingual)
                  </label>
                  <input
                    type="text"
                    value={pendingVerificationEntry.client_name}
                    onChange={(e) => setPendingVerificationEntry({
                      ...pendingVerificationEntry,
                      client_name: e.target.value
                    })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Rupee Amount (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                    <input
                      type="number"
                      step="any"
                      value={pendingVerificationEntry.amount}
                      onChange={(e) => setPendingVerificationEntry({
                        ...pendingVerificationEntry,
                        amount: e.target.value
                      })}
                      className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-bold text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Action Type
                  </label>
                  <select
                    value={pendingVerificationEntry.action}
                    onChange={(e) => setPendingVerificationEntry({
                      ...pendingVerificationEntry,
                      action: e.target.value
                    })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="order">Order (Customer Booking)</option>
                    <option value="payment">Payment (Collection)</option>
                    <option value="visit">Field Visit / Meeting</option>
                  </select>
                </div>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <button
                onClick={handleDiscardVerification}
                className="w-full sm:w-auto px-4 py-3 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <X className="w-4 h-4 text-slate-500" />
                <span>Discard & Speak Again</span>
              </button>

              <button
                onClick={handleConfirmVerification}
                disabled={isConfirmingVerification}
                className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-emerald-600/25 transition-all"
              >
                {isConfirmingVerification ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Saving to Ledger...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm & Save to Ledger</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* 5. MANIPULATED DATA & COMPUTED INSIGHTS (When Query is Run) */}
        {computedResult && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {computedResult.mode === 'guest_computation' ? 'Computed From Your Past Data' : computedResult.mode.toUpperCase()}
                </span>
                <span className="text-xs text-slate-500">Query: "{computedResult.user_query}"</span>
              </div>

              {computedResult.audio_data && (
                <button
                  onClick={() => speechControllerRef.current?.playBase64Audio(computedResult.audio_data)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-semibold transition-all shadow-sm"
                >
                  <Volume2 className="w-4 h-4 text-blue-600" />
                  <span>Listen Voice</span>
                </button>
              )}
            </div>

            {/* Words / First-Person Voice Bubble */}
            {computedResult.spoken_answer && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Volume2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider">Analysis (Your Perspective)</h4>
                  <p className="text-sm font-semibold text-slate-800 mt-1">{computedResult.spoken_answer}</p>
                </div>
              </div>
            )}

            {/* Computed Numbers Stat Widgets */}
            {computedResult.numbers && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {computedResult.numbers.primary_metric && (
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[11px] text-slate-500 font-medium">{computedResult.numbers.primary_label || 'Primary Stat'}</span>
                    <p className="text-lg font-bold text-slate-900 mt-0.5">{computedResult.numbers.primary_metric}</p>
                  </div>
                )}
                {computedResult.numbers.secondary_metric && (
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[11px] text-slate-500 font-medium">{computedResult.numbers.secondary_label || 'Secondary Stat'}</span>
                    <p className="text-lg font-bold text-blue-600 mt-0.5">{computedResult.numbers.secondary_metric}</p>
                  </div>
                )}
              </div>
            )}

            {/* Dynamic Manipulated Chart */}
            {computedResult.chart && computedResult.chart_data && computedResult.chart_data.length > 0 && (
              <div>
                <DynamicChart data={computedResult.chart_data} config={computedResult.chart} />
              </div>
            )}

            {/* Bullet Points */}
            {computedResult.words_summary && computedResult.words_summary.length > 0 && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Key Takeaways</h4>
                <ul className="list-disc list-inside space-y-1 text-xs text-slate-600">
                  {computedResult.words_summary.map((point: string, i: number) => (
                    <li key={i}>{point}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* If CRM Activity was Logged (Bilingual Recognition) */}
            {computedResult.mode === 'crm' && computedResult.entries && computedResult.entries.length > 0 && (
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Activity Recognized & Saved</span>
                    </span>
                    {computedResult.detected_language && (
                      <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                        Language: {computedResult.detected_language}
                      </span>
                    )}
                  </div>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-700 uppercase font-semibold">
                      <tr>
                        <th className="p-3">Client (User Language & English)</th>
                        <th className="p-3">Action</th>
                        <th className="p-3">Amount</th>
                        <th className="p-3">Bilingual Transcript & Translation</th>
                        <th className="p-3">Storage</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {computedResult.entries.map((entry: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-3 font-semibold text-slate-900">{entry.client_name}</td>
                          <td className="p-3 capitalize">
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-100 text-blue-800">
                              {entry.action}
                            </span>
                          </td>
                          <td className="p-3 font-bold text-emerald-600 text-sm">
                            ₹{Number(entry.amount || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="p-3 text-slate-600 max-w-sm">
                            {entry.notes || entry.user_language_text || '—'}
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-medium">
                              {entry.synced_to_supabase ? 'Synced' : 'Saved'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 6. INTERACTIVE CRM LEDGER / DATA TABLE */}
        <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-8 shadow-sm">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">Your Recorded Activities Ledger</h3>
              <p className="text-xs text-slate-500">
                Stored in database for guest ID <code className="font-mono text-blue-600 break-all">{guestId}</code>
              </p>
            </div>

            {/* Action Bar & Filter Tabs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto">
              <button
                onClick={() => setShowReportModal(true)}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 transition-all shadow-2xs"
                title="Print table or save as PDF"
              >
                <Printer className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>Export / Print PDF</span>
              </button>

              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 overflow-x-auto max-w-full">
                {(['all', 'order', 'payment', 'visit'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setTableFilter(filter)}
                    className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all whitespace-nowrap text-center ${
                      tableFilter === filter
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4">
            <BusinessLedgerTable
              activities={filteredActivities}
              onDelete={handleDeleteActivity}
              onPrintReport={handlePrintReport}
            />
          </div>
        </div>
      </main>

      {/* MODAL: MANUAL LOG ENTRY */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-bold text-slate-900 text-base">Log New Activity</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleManualAdd} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Client / Business Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apollo Pharmacy, Dr. Reddy, Shree Traders"
                  value={newEntry.client_name}
                  onChange={(e) => setNewEntry({ ...newEntry, client_name: e.target.value })}
                  className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Action Type</label>
                  <select
                    value={newEntry.action}
                    onChange={(e) => setNewEntry({ ...newEntry, action: e.target.value })}
                    className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="order">Order Placed</option>
                    <option value="payment">Payment Collected</option>
                    <option value="visit">Client Meeting</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="15000"
                    value={newEntry.amount}
                    onChange={(e) => setNewEntry({ ...newEntry, amount: e.target.value })}
                    className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Notes / Description (Optional)</label>
                <textarea
                  placeholder="e.g. 200 units delivered, cheque payment promised next week"
                  rows={2}
                  value={newEntry.notes}
                  onChange={(e) => setNewEntry({ ...newEntry, notes: e.target.value })}
                  className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-sm"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ORDERS & ACTIVITIES LEDGER REPORT (PRINT / PDF) */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 my-auto">
            {/* Modal Top Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 mb-4 sm:mb-6 gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-sm shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base sm:text-lg">Orders & Sales Report Preview</h3>
                  <p className="text-xs text-slate-500">Official printable summary statement of all verified field activities</p>
                </div>
              </div>
              <div className="flex items-center gap-2 justify-end w-full sm:w-auto">
                <button
                  onClick={handlePrintReport}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print / Save as PDF</span>
                </button>
                <button
                  onClick={() => setShowReportModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* A4 Printable Sheet Container */}
            <div className="bg-slate-50/50 border border-slate-200 rounded-2xl p-5 sm:p-8 max-h-[65vh] overflow-y-auto space-y-6">
              {/* Document Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-2 border-blue-600 pb-4 gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-black text-slate-900 tracking-tight">IndicBI</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 uppercase">
                      Field Statement
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">Voice-First Intelligence Platform for Bharat</p>
                </div>
                <div className="text-left sm:text-right text-xs text-slate-600">
                  <div className="inline-block px-2.5 py-1 rounded bg-blue-50 text-blue-800 font-mono font-bold text-[11px] border border-blue-200">
                    Session: {guestId}
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Date: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>

              {/* KPI Snapshot Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
                  <span className="text-[11px] font-medium text-slate-500 uppercase">Total Revenue</span>
                  <p className="text-lg font-bold text-blue-700 mt-0.5">
                    ₹{Number(metrics.total_revenue || 0).toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
                  <span className="text-[11px] font-medium text-slate-500 uppercase">Total Entries</span>
                  <p className="text-lg font-bold text-slate-900 mt-0.5">{activities.length}</p>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
                  <span className="text-[11px] font-medium text-slate-500 uppercase">Average Order</span>
                  <p className="text-lg font-bold text-slate-900 mt-0.5">
                    ₹{Number(metrics.average_deal || 0).toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
                  <span className="text-[11px] font-medium text-slate-500 uppercase">Active Accounts</span>
                  <p className="text-lg font-bold text-emerald-600 mt-0.5">{metrics.clients_count || 0}</p>
                </div>
              </div>

              {/* Printable Table */}
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 uppercase font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3 text-center w-10">#</th>
                      <th className="p-3">Date</th>
                      <th className="p-3">Client / Shop (Bilingual)</th>
                      <th className="p-3">Type</th>
                      <th className="p-3 text-right">Amount</th>
                      <th className="p-3 text-center">Status</th>
                      <th className="p-3">Bilingual Notes & Spoken Context</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {activities.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-400 text-xs">
                          No activities logged under this session yet.
                        </td>
                      </tr>
                    ) : (
                      activities.map((act, idx) => (
                        <tr key={act.id || idx} className="hover:bg-slate-50/80">
                          <td className="p-3 text-center font-bold text-slate-400">{idx + 1}</td>
                          <td className="p-3 text-slate-500 whitespace-nowrap">
                            {act.created_at ? act.created_at.slice(0, 10) : 'Today'}
                          </td>
                          <td className="p-3 font-semibold text-slate-900">{act.client_name}</td>
                          <td className="p-3 capitalize">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                              {act.action}
                            </span>
                          </td>
                          <td className="p-3 font-bold text-slate-900 text-right">
                            ₹{Number(act.amount || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="p-3 text-center">
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-semibold">
                              {act.status || 'Completed'}
                            </span>
                          </td>
                          <td className="p-3 text-slate-600 max-w-xs">{act.notes || '—'}</td>
                        </tr>
                      ))
                    )}
                    {activities.length > 0 && (
                      <tr className="bg-slate-50 font-bold border-t-2 border-slate-300">
                        <td colSpan={4} className="p-3 text-right text-slate-700">GRAND TOTAL:</td>
                        <td className="p-3 text-right text-blue-700 text-sm">
                          ₹{Number(metrics.total_revenue || 0).toLocaleString('en-IN')}
                        </td>
                        <td colSpan={2} className="p-3 text-slate-500 text-[11px]">
                          {activities.length} Total Verified Entries
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Signatures for Print Approval */}
              <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row justify-between gap-6">
                <div>
                  <div className="w-48 border-t border-slate-400 pt-1 text-center text-xs text-slate-500">
                    Sales Representative Signature
                  </div>
                </div>
                <div>
                  <div className="w-48 border-t border-slate-400 pt-1 text-center text-xs text-slate-500">
                    Store Owner / Manager Approval
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Bottom Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between pt-4 mt-4 border-t border-slate-100 gap-3">
              <span className="text-xs text-slate-400 text-center sm:text-left">
                Tip: In the print dialog, select <strong>"Save as PDF"</strong> to download a digital copy.
              </span>
              <div className="flex items-center gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="flex-1 sm:flex-none px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors text-center"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handlePrintReport}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print / Save as PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
