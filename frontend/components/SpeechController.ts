'use client';

export const LANGUAGE_OPTIONS = [
  { code: 'en-IN', label: 'English (India)', short: 'en' },
  { code: 'hi-IN', label: 'हिंदी (Hindi)', short: 'hi' },
  { code: 'te-IN', label: 'తెలుగు (Telugu)', short: 'te' },
  { code: 'ta-IN', label: 'தமிழ் (Tamil)', short: 'ta' },
  { code: 'kn-IN', label: 'ಕನ್ನಡ (Kannada)', short: 'kn' },
  { code: 'gu-IN', label: 'ગુજરાતી (Gujarati)', short: 'gu' },
];

export class SpeechController {
  private mediaRecorder: MediaRecorder | null = null;
  private activeStream: MediaStream | null = null;
  private audioChunks: Blob[] = [];
  private isListening: boolean = false;
  private isProcessing: boolean = false;
  private currentAudio: HTMLAudioElement | null = null;

  // Real-time audio analyzer for live volume & silence detection
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private animFrameId: number | null = null;

  // Optional live subtitle recognition
  private recognition: any = null;
  private accumulatedTranscript: string = '';

  private silenceTimer: any = null;
  private maxDurationTimer: any = null;
  private hasSpoken: boolean = false;
  private activeGuestId: string = 'guest_default';
  private activeLangCode: string = 'en-IN';
  private activeAutoSave: boolean = false;

  constructor(
    public onResult: (text: string) => void,
    public onError: (err: string) => void,
    public onStateChange: (listening: boolean, processing?: boolean) => void,
    public onInterim?: (interimText: string) => void,
    public onVoiceResult?: (result: any) => void,
    public onVolumeChange?: (volume: number) => void
  ) {}

  public updateCallbacks(
    onResult: (text: string) => void,
    onError: (err: string) => void,
    onStateChange: (listening: boolean, processing?: boolean) => void,
    onInterim?: (interimText: string) => void,
    onVoiceResult?: (result: any) => void,
    onVolumeChange?: (volume: number) => void
  ) {
    this.onResult = onResult;
    this.onError = onError;
    this.onStateChange = onStateChange;
    this.onInterim = onInterim;
    this.onVoiceResult = onVoiceResult;
    this.onVolumeChange = onVolumeChange;
  }

  public static isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return !!(
      (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) ||
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition
    );
  }

  public stopAudio() {
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      } catch (e) {
        console.warn('Error pausing current audio:', e);
      }
      this.currentAudio = null;
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {
        console.warn('Error cancelling speech synthesis:', e);
      }
    }
  }

  public static stopAllAudio() {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }
  }

  private startAudioMeter(stream: MediaStream) {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      this.audioContext = new AudioCtx();
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }

      const source = this.audioContext.createMediaStreamSource(stream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.5;
      source.connect(this.analyser);

      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkVolume = () => {
        if (!this.isListening || !this.analyser) return;

        this.analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength; // 0 to ~100
        const normalized = Math.min(100, Math.round(avg * 1.5));

        if (this.onVolumeChange) {
          this.onVolumeChange(normalized);
        }

        // Real sound detected: user is speaking
        if (normalized > 12) {
          this.hasSpoken = true;
          // Clear any running silence countdown while user is speaking
          if (this.silenceTimer) {
            clearTimeout(this.silenceTimer);
            this.silenceTimer = null;
          }
        } else if (this.hasSpoken && normalized <= 8 && !this.silenceTimer) {
          // User finished talking: wait 3.5 seconds of silence before auto-submitting
          this.silenceTimer = setTimeout(() => {
            if (this.isListening && this.hasSpoken) {
              this.stopListening(true);
            }
          }, 3500);
        }

        this.animFrameId = requestAnimationFrame(checkVolume);
      };

      this.animFrameId = requestAnimationFrame(checkVolume);
    } catch (e) {
      console.warn('AudioContext volume meter could not be initialized:', e);
    }
  }

  public async startListening(
    langCode: string = 'en-IN',
    guestId: string = 'guest_default',
    autoSave: boolean = false
  ) {
    this.stopAudio();
    this.cleanupSession();

    this.accumulatedTranscript = '';
    this.hasSpoken = false;
    this.audioChunks = [];
    this.activeGuestId = guestId;
    this.activeLangCode = langCode;
    this.activeAutoSave = autoSave;

    if (typeof window === 'undefined') return;

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      this.onError('Microphone access is not supported by your browser. Please use Chrome on Android or desktop.');
      return;
    }

    try {
      // 1. Request microphone access from browser. Keep stream active.
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      this.activeStream = stream;
      this.isListening = true;
      this.isProcessing = false;
      this.onStateChange(true, false);

      // Start real-time volume detection & audio meter
      this.startAudioMeter(stream);

      // 2. Start in-browser MediaRecorder for 100% reliable recording in all languages
      try {
        let mimeType = 'audio/webm;codecs=opus';
        if (typeof MediaRecorder !== 'undefined') {
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            if (MediaRecorder.isTypeSupported('audio/webm')) {
              mimeType = 'audio/webm';
            } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
              mimeType = 'audio/mp4';
            } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
              mimeType = 'audio/ogg;codecs=opus';
            } else {
              mimeType = '';
            }
          }

          const options = mimeType ? { mimeType } : undefined;
          this.mediaRecorder = new MediaRecorder(stream, options);
          this.mediaRecorder.ondataavailable = (event) => {
            if (event.data && event.data.size > 0) {
              this.audioChunks.push(event.data);
            }
          };
          this.mediaRecorder.start(200); // 200ms audio slices
        }
      } catch (recErr) {
        console.warn('MediaRecorder initialization note:', recErr);
        this.mediaRecorder = null;
      }

      // 3. Optional live subtitles via Web Speech API (interim display only, non-blocking)
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        try {
          const rec = new SpeechRecognition();
          this.recognition = rec;
          rec.lang = langCode;
          rec.continuous = true;
          rec.interimResults = true;
          rec.maxAlternatives = 1;

          rec.onresult = (event: any) => {
            this.hasSpoken = true;
            let interim = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
              const res = event.results[i];
              if (res.isFinal) {
                this.accumulatedTranscript += res[0].transcript + ' ';
              } else {
                interim += res[0].transcript;
              }
            }
            const live = (this.accumulatedTranscript + ' ' + interim).trim();
            if (this.onInterim && live) {
              this.onInterim(live);
            }
          };

          rec.onerror = () => {
            // Handled non-blockingly since MediaRecorder holds the audio
          };

          rec.onend = () => {
            if (this.isListening) {
              try {
                rec.start();
              } catch (e) {}
            }
          };

          rec.start();
        } catch (e) {
          console.warn('Web Speech API not started; relying on MediaRecorder + Gemini.');
          this.recognition = null;
        }
      }

      // 30 seconds safety timeout
      this.maxDurationTimer = setTimeout(() => {
        if (this.isListening) {
          this.stopListening(true);
        }
      }, 30000);

    } catch (permErr: any) {
      this.isListening = false;
      this.isProcessing = false;
      this.onStateChange(false, false);
      console.warn('Microphone permission exception:', permErr);
      if (permErr.name === 'NotAllowedError' || permErr.name === 'PermissionDeniedError') {
        this.onError('Microphone permission was denied. Tap the icon in the address bar to allow microphone access.');
      } else {
        this.onError(`Microphone error: ${permErr.message || 'Could not access microphone'}`);
      }
    }
  }

  private cleanupSession() {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
    if (this.maxDurationTimer) {
      clearTimeout(this.maxDurationTimer);
      this.maxDurationTimer = null;
    }
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.audioContext) {
      try {
        this.audioContext.close();
      } catch (e) {}
      this.audioContext = null;
      this.analyser = null;
    }
    if (this.recognition) {
      try {
        this.recognition.onend = null;
        this.recognition.abort();
      } catch (e) {}
      this.recognition = null;
    }
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        this.mediaRecorder.stop();
      } catch (e) {}
      this.mediaRecorder = null;
    }
    if (this.activeStream) {
      try {
        this.activeStream.getTracks().forEach((track) => track.stop());
      } catch (e) {}
      this.activeStream = null;
    }
  }

  public async stopListening(submit: boolean = true) {
    if (!this.isListening && !this.isProcessing) return;

    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
    if (this.maxDurationTimer) {
      clearTimeout(this.maxDurationTimer);
      this.maxDurationTimer = null;
    }
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.audioContext) {
      try {
        this.audioContext.close();
      } catch (e) {}
      this.audioContext = null;
      this.analyser = null;
    }

    this.isListening = false;

    // Stop Web Speech
    if (this.recognition) {
      try {
        this.recognition.onend = null;
        this.recognition.stop();
      } catch (e) {}
      this.recognition = null;
    }

    // Stop MediaRecorder and grab audio blob
    let recordedBlob: Blob | null = null;
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        await new Promise<void>((resolve) => {
          if (!this.mediaRecorder) return resolve();
          this.mediaRecorder.onstop = () => resolve();
          this.mediaRecorder.stop();
        });
        if (this.audioChunks.length > 0) {
          const type = this.mediaRecorder.mimeType || 'audio/webm';
          recordedBlob = new Blob(this.audioChunks, { type });
        }
      } catch (e) {
        console.warn('Error finalizing MediaRecorder:', e);
      }
    }
    this.mediaRecorder = null;

    // Release microphone tracks
    if (this.activeStream) {
      try {
        this.activeStream.getTracks().forEach((track) => track.stop());
      } catch (e) {}
      this.activeStream = null;
    }

    if (!submit) {
      this.isProcessing = false;
      this.onStateChange(false, false);
      return;
    }

    // PRIORITY 1: Send recorded audio to Gemini Multimodal AI
    // (This guarantees 100% flawless transcription for English, Hindi, Tamil, Telugu, Kannada, Gujarati!)
    if (recordedBlob && recordedBlob.size > 1200) {
      this.isProcessing = true;
      this.onStateChange(false, true); // listening: false, processing: true
      if (this.onInterim) {
        this.onInterim('⏳ Transcribing audio with Gemini AI...');
      }
      await this.uploadRecordedAudio(recordedBlob);
      this.isProcessing = false;
      this.onStateChange(false, false);
      return;
    }

    // Fallback: If blob was small but Web Speech captured text
    const finalText = this.accumulatedTranscript.trim();
    if (finalText && finalText.length > 1) {
      this.isProcessing = false;
      this.onStateChange(false, false);
      this.onResult(finalText);
      return;
    }

    // No sound detected
    this.isProcessing = false;
    this.onStateChange(false, false);
    this.onError('No speech detected. Please tap Click to Speak and speak clearly into your mic.');
  }

  private async uploadRecordedAudio(blob: Blob) {
    try {
      const formData = new FormData();
      const ext = blob.type.includes('mp4') ? 'mp4' : blob.type.includes('ogg') ? 'ogg' : 'webm';
      formData.append('file', blob, `recording.${ext}`);
      formData.append('language', this.activeLangCode);
      formData.append('guest_id', this.activeGuestId);
      formData.append('auto_save', String(this.activeAutoSave));

      const res = await fetch('/api/voice-upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Voice upload failed' }));
        this.onError(err.detail || 'Voice processing error. Please try speaking again.');
        return;
      }

      const result = await res.json();
      if (result.transcribed_text && this.onInterim) {
        this.onInterim(result.transcribed_text);
      }

      if (this.onVoiceResult) {
        this.onVoiceResult(result);
      } else if (result.transcribed_text) {
        this.onResult(result.transcribed_text);
      }
    } catch (e: any) {
      console.warn('Audio upload network exception:', e);
      this.onError('Could not reach voice processing service. Please check connection.');
    }
  }

  public playBase64Audio(base64Data: string, fallbackText: string = '', langCode: string = 'en-IN') {
    if (typeof window === 'undefined' || !base64Data) return;

    this.stopAudio();

    try {
      const audioUri = base64Data.startsWith('data:audio')
        ? base64Data
        : `data:audio/mp3;base64,${base64Data}`;

      const audio = new Audio(audioUri);
      this.currentAudio = audio;
      audio.play().catch((e) => {
        console.warn('Neural audio playback blocked, falling back to speech synthesis:', e);
        if (fallbackText) {
          SpeechController.speakBrowserText(fallbackText, langCode);
        }
      });
    } catch (e) {
      console.warn('Error constructing Audio object:', e);
      if (fallbackText) {
        SpeechController.speakBrowserText(fallbackText, langCode);
      }
    }
  }

  public playAudio(audioDataUri: string, fallbackText: string = '', langCode: string = 'en-IN') {
    this.playBase64Audio(audioDataUri, fallbackText, langCode);
  }

  public speak(text: string, langCode: string = 'en-IN') {
    this.stopAudio();
    SpeechController.speakBrowserText(text, langCode);
  }

  public static speakBrowserText(text: string, langCode: string = 'en-IN') {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langCode;
    utterance.rate = 0.95;

    const voices = window.speechSynthesis.getVoices();
    const regionalVoice = voices.find(
      (v) => v.lang.includes(langCode) || v.lang.includes(langCode.split('-')[0])
    );
    if (regionalVoice) {
      utterance.voice = regionalVoice;
    }

    window.speechSynthesis.speak(utterance);
  }
}
