import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Download,
  Volume2,
  VolumeX,
  Radio,
  Sparkles,
  Copy,
  Check,
  AlertCircle,
  FileText,
  Sliders,
  Share2,
} from 'lucide-react';
import { RadioWaveVisualizer } from './components/RadioWaveVisualizer.tsx';
import { VoiceSettings, VoiceConfig } from './components/VoiceSettings.tsx';
import { HistoricalContext } from './components/HistoricalContext.tsx';
import { radioAtmosphere } from './utils/audioAmbience.ts';
import { textToMorse } from './utils/morse.ts';

const DEFAULT_PASSAGE = `Điện đài vẫn hoạt động. Tin nhắn vẫn đến. Mạng lưới thì đã rơi vào tay đối phương.
Tại London, những bức điện tiếp tục được tiếp nhận.
Ở Hà Lan bị chiếm đóng, phía Đức đang dùng chính đường liên lạc ấy để đón thêm người và vật tư.
Đến thời điểm nào, thông tin nhận được đã đủ để ngừng chiến dịch?`;

const SENTENCES = [
  { id: 1, text: 'Điện đài vẫn hoạt động.' },
  { id: 2, text: 'Tin nhắn vẫn đến.' },
  { id: 3, text: 'Mạng lưới thì đã rơi vào tay đối phương.' },
  { id: 4, text: 'Tại London, những bức điện tiếp tục được tiếp nhận.' },
  { id: 5, text: 'Ở Hà Lan bị chiếm đóng, phía Đức đang dùng chính đường liên lạc ấy để đón thêm người và vật tư.' },
  { id: 6, text: 'Đến thời điểm nào, thông tin nhận được đã đủ để ngừng chiến dịch?' },
];

export default function App() {
  const [text, setText] = useState<string>(DEFAULT_PASSAGE);
  const [activeSentenceIndex, setActiveSentenceIndex] = useState<number>(-1);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<string>('');

  const [voiceConfig, setVoiceConfig] = useState<VoiceConfig>({
    voice: 'Fenrir',
    model: 'gemini-3.8-flash-lite-tts',
    style:
      'Deep, tense, emotional and dramatic WWII espionage mystery narrative in Vietnamese, measured moderate pace, intense suspense and historical gravity',
    playbackSpeed: 0.85,
    ambienceEnabled: true,
    ambienceVolume: 0.12,
    useBrowserTts: false,
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const sentenceTimersRef = useRef<number[]>([]);

  // Split text into meaningful clauses/sentences for display
  const currentSentences = useMemo(() => {
    return text
      .split(/(?<=[.?!])\s+|\n+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }, [text]);

  const morseCode = useMemo(() => {
    return textToMorse(text.slice(0, 140));
  }, [text]);

  // Handle radio ambience sound
  useEffect(() => {
    if (voiceConfig.ambienceEnabled) {
      if (isPlaying) {
        radioAtmosphere.start(voiceConfig.ambienceVolume);
      } else {
        radioAtmosphere.stop();
      }
    } else {
      radioAtmosphere.stop();
    }

    return () => {
      radioAtmosphere.stop();
    };
  }, [isPlaying, voiceConfig.ambienceEnabled, voiceConfig.ambienceVolume]);

  // Sync playback speed to audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = voiceConfig.playbackSpeed;
    }
  }, [voiceConfig.playbackSpeed]);

  // Highlight sentence based on current audio time
  useEffect(() => {
    if (!isPlaying || duration === 0 || currentSentences.length === 0) {
      return;
    }
    const progress = currentTime / duration;
    const index = Math.min(
      currentSentences.length - 1,
      Math.floor(progress * currentSentences.length)
    );
    setActiveSentenceIndex(index);
  }, [currentTime, duration, isPlaying, currentSentences.length]);

  // Generate Speech using Gemini API
  const handleGenerateAndPlay = async () => {
    try {
      setErrorMessage(null);
      setIsGenerating(true);
      setLoadingStep('Đang kết nối hệ thống viễn thông Gemini AI Studio...');

      // Stop any current playback
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setIsPlaying(false);
      window.speechSynthesis?.cancel();

      setLoadingStep('Đang khởi tạo chất giọng kịch tính (Fenrir / 24kHz)...');

      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          voice: voiceConfig.voice,
          model: voiceConfig.model,
          style: voiceConfig.style,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Lỗi máy chủ (${response.status})`);
      }

      setLoadingStep('Đang giải mã luồng sóng âm thanh...');
      const data = await response.json();

      if (!data.audioDataUrl) {
        throw new Error('Không nhận được dữ liệu âm thanh từ máy chủ.');
      }

      setAudioUrl(data.audioDataUrl);
      setIsGenerating(false);

      // Play newly generated audio
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.playbackRate = voiceConfig.playbackSpeed;
          audioRef.current.play().catch((e) => {
            console.warn('Auto-play prevented:', e);
          });
          setIsPlaying(true);
        }
      }, 100);
    } catch (err: any) {
      console.error('TTS error:', err);
      setErrorMessage(
        err.message || 'Không thể tạo giọng đọc qua Gemini API. Bạn có thể thử lại hoặc dùng giọng đọc dự phòng.'
      );
      setIsGenerating(false);
    }
  };

  // Browser speech synthesis fallback
  const handleBrowserSpeech = () => {
    if (!window.speechSynthesis) {
      setErrorMessage('Trình duyệt của bạn không hỗ trợ tính năng Web Speech API.');
      return;
    }
    setErrorMessage(null);
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'vi-VN';
    utterance.rate = voiceConfig.playbackSpeed * 0.95; // Slightly slower for dramatic tension
    utterance.pitch = 0.92; // Slightly deeper

    utterance.onstart = () => {
      setIsPlaying(true);
      setActiveSentenceIndex(0);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setActiveSentenceIndex(-1);
    };

    utterance.onerror = (e) => {
      console.warn('SpeechSynthesis error:', e);
      setIsPlaying(false);
    };

    // Track boundary for sentence highlighting
    utterance.onboundary = (event) => {
      if (event.name === 'sentence' || event.charIndex !== undefined) {
        const charIdx = event.charIndex;
        let cumulative = 0;
        for (let i = 0; i < currentSentences.length; i++) {
          cumulative += currentSentences[i].length + 1;
          if (charIdx <= cumulative) {
            setActiveSentenceIndex(i);
            break;
          }
        }
      }
    };

    window.speechSynthesis.speak(utterance);
  };

  const handleTogglePlay = () => {
    if (audioRef.current && audioUrl) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play().catch(console.warn);
        setIsPlaying(true);
      }
    } else {
      handleGenerateAndPlay();
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 selection:bg-amber-500/30 selection:text-amber-200">
      {/* Background Ambience Gradients */}
      <div className="fixed inset-0 pointer-events-none subtle-grid opacity-40 z-0" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-amber-950/20 via-transparent to-transparent pointer-events-none z-0" />

      {/* Hidden audio element */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={() => {
            if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
          }}
          onLoadedMetadata={() => {
            if (audioRef.current) setDuration(audioRef.current.duration);
          }}
          onEnded={() => {
            setIsPlaying(false);
            setActiveSentenceIndex(-1);
          }}
          onError={() => {
            setIsPlaying(false);
            setErrorMessage('Lỗi khi phát tệp âm thanh.');
          }}
        />
      )}

      {/* Top Classified Header */}
      <header className="relative z-10 border-b border-amber-950/60 bg-[#090e17]/90 backdrop-blur-md sticky top-0">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.2)]">
              <Radio className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-cinzel font-bold text-sm tracking-widest text-amber-400 uppercase">
                  SOE TRANSMISSION // NET-1943
                </span>
                <span className="text-[10px] font-mono-code px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-400 border border-amber-800/40">
                  TOP SECRET
                </span>
              </div>
              <p className="text-[11px] font-mono-code text-slate-400">
                Chuyển Văn Bản Thành Giọng Đọc Kịch Tính • AI Gemini Studio TTS
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-mono-code text-xs transition-colors ${
                showSettings
                  ? 'border-amber-500 bg-amber-500/20 text-amber-300'
                  : 'border-slate-800 bg-slate-900/80 text-slate-300 hover:border-slate-700'
              }`}
            >
              <Sliders className="h-3.5 w-3.5 text-amber-400" />
              <span>Cài đặt giọng</span>
            </button>

            <button
              onClick={handleCopyText}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/80 hover:border-slate-700 font-mono-code text-xs text-slate-300 transition-colors"
              title="Sao chép đoạn văn"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? 'Đã chép' : 'Chép'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Error notification banner */}
        {errorMessage && (
          <div className="rounded-xl border border-red-500/40 bg-red-950/40 p-4 text-red-200 text-xs backdrop-blur-md flex items-start justify-between gap-3 animate-fadeIn">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold text-red-300 mb-0.5">Thông báo hệ thống:</strong>
                <span>{errorMessage}</span>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={handleBrowserSpeech}
                    className="underline text-amber-300 hover:text-amber-200 font-mono-code"
                  >
                    ▶ Dùng giọng đọc nội bộ trình duyệt (Web Speech API)
                  </button>
                </div>
              </div>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-red-400 hover:text-red-200 font-mono-code text-base"
            >
              ×
            </button>
          </div>
        )}

        {/* Collapsible Settings Panel */}
        {showSettings && (
          <VoiceSettings
            config={voiceConfig}
            onChange={setVoiceConfig}
            disabled={isGenerating}
          />
        )}

        {/* Oscilloscope Frequency Visualizer */}
        <RadioWaveVisualizer isPlaying={isPlaying} />

        {/* Target Text Card (Classified Espionage Telegram Aesthetic) */}
        <section className="relative rounded-2xl border border-amber-950/70 bg-gradient-to-b from-[#0e1422] to-[#070b13] p-6 shadow-2xl overflow-hidden">
          {/* Watermark badge */}
          <div className="absolute top-4 right-4 pointer-events-none select-none opacity-10 font-cinzel text-5xl font-black text-amber-500 tracking-tighter">
            ENGLANDSPIEL
          </div>

          <div className="flex items-center justify-between border-b border-amber-950/60 pb-3 mb-5">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse" />
              <span className="font-mono-code text-xs uppercase tracking-widest text-amber-400 font-semibold">
                BẢN ĐIỆN VĂN GIẢI MÃ // TRANSMISSION TRANSCRIPT
              </span>
            </div>
            <button
              onClick={() => setText(DEFAULT_PASSAGE)}
              className="text-[11px] font-mono-code text-slate-400 hover:text-amber-400 flex items-center gap-1 transition-colors"
              title="Khôi phục nguyên văn bản gốc"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Văn bản gốc</span>
            </button>
          </div>

          {/* Dramatic Sentence-by-Sentence Breakdown Card */}
          <div className="space-y-3.5 my-2">
            {currentSentences.map((sentence, index) => {
              const isActive = activeSentenceIndex === index && isPlaying;
              const isClimax = index === currentSentences.length - 1; // Last question is the emotional climax

              return (
                <div
                  key={index}
                  className={`relative p-3.5 rounded-xl border transition-all duration-300 ${
                    isActive
                      ? 'border-amber-400 bg-amber-950/40 shadow-[0_0_25px_rgba(245,158,11,0.25)] scale-[1.01]'
                      : 'border-slate-800/80 bg-slate-950/40 hover:border-slate-700/80'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`font-mono-code text-[11px] font-bold px-1.5 py-0.5 rounded shrink-0 transition-colors ${
                        isActive
                          ? 'bg-amber-500 text-black'
                          : 'bg-slate-900 text-slate-500 border border-slate-800'
                      }`}
                    >
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <p
                      className={`text-base md:text-lg leading-relaxed font-serif transition-colors ${
                        isActive
                          ? 'text-amber-200 font-medium'
                          : isClimax
                          ? 'text-amber-400/90 italic font-medium'
                          : 'text-slate-200'
                      }`}
                    >
                      {sentence}
                    </p>
                  </div>

                  {isActive && (
                    <div className="absolute right-3 top-3 flex items-center gap-1.5 text-[11px] font-mono-code text-amber-400">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                      </span>
                      <span>ĐANG ĐỌC</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Quick Edit Accordion */}
          <details className="mt-4 pt-3 border-t border-slate-900 text-xs">
            <summary className="cursor-pointer font-mono-code text-slate-400 hover:text-amber-400 transition-colors">
              ✏️ Chỉnh sửa nội dung văn bản (Nhấp để mở)
            </summary>
            <div className="mt-3">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-slate-800 bg-black/60 p-3 text-slate-200 focus:border-amber-500 focus:outline-none font-mono-code text-xs leading-relaxed"
                placeholder="Nhập đoạn văn cần chuyển đổi giọng nói..."
              />
            </div>
          </details>

          {/* Morse Code Ticker Ribbon */}
          <div className="mt-4 pt-3 border-t border-amber-950/40 flex items-center gap-3 overflow-hidden text-[10px] font-mono-code text-amber-500/60 select-none">
            <span className="shrink-0 text-amber-400 font-bold">CW MORSE:</span>
            <div className="truncate tracking-widest">{morseCode}</div>
          </div>
        </section>

        {/* Audio Player Controls Bar */}
        <section className="rounded-2xl border border-amber-900/40 bg-gradient-to-r from-[#0c121e] via-[#101726] to-[#0c121e] p-5 shadow-xl backdrop-blur-md">
          {/* Main Action Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Big Primary Play/Generate Button */}
            <button
              onClick={handleGenerateAndPlay}
              disabled={isGenerating}
              className={`w-full sm:w-auto px-6 py-3.5 rounded-xl font-cinzel font-bold text-sm tracking-wider flex items-center justify-center gap-2.5 transition-all shadow-lg ${
                isGenerating
                  ? 'bg-amber-700/50 text-amber-200 cursor-not-allowed border border-amber-600/30'
                  : 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-black shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_30px_rgba(245,158,11,0.5)] active:scale-95'
              }`}
            >
              {isGenerating ? (
                <>
                  <div className="h-4 w-4 rounded-full border-2 border-amber-900 border-t-amber-100 animate-spin" />
                  <span>{loadingStep || 'ĐANG TẠO GIỌNG ĐỌC AI...'}</span>
                </>
              ) : isPlaying ? (
                <>
                  <Pause className="h-4 w-4 fill-current" />
                  <span>TẠM DỪNG TIẾNG NÓI</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 fill-current" />
                  <span>PHÁT GIỌNG ĐỌC TRUYỀN CẢM</span>
                </>
              )}
            </button>

            {/* Resume / Pause toggler for loaded audio */}
            {audioUrl && !isGenerating && (
              <button
                onClick={handleTogglePlay}
                className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-200 font-mono-code text-xs flex items-center gap-2 transition-colors"
              >
                {isPlaying ? <Pause className="h-3.5 w-3.5 text-amber-400" /> : <Play className="h-3.5 w-3.5 text-amber-400" />}
                <span>{isPlaying ? 'Tạm dừng' : 'Tiếp tục phát'}</span>
              </button>
            )}

            {/* Quick Web Speech Alternative */}
            <button
              onClick={handleBrowserSpeech}
              disabled={isGenerating}
              className="px-3.5 py-2.5 rounded-xl border border-slate-800 bg-black/40 hover:border-slate-700 text-slate-300 hover:text-amber-300 font-mono-code text-xs flex items-center gap-2 transition-colors"
              title="Phát ngay bằng giọng đọc thiết bị (Web Speech API)"
            >
              <Volume2 className="h-3.5 w-3.5 text-slate-400" />
              <span>Giọng đọc tức thời (Trình duyệt)</span>
            </button>

            {/* Download audio file */}
            {audioUrl && (
              <a
                href={audioUrl}
                download="giong-doc-tinh-bao-englandspiel.wav"
                className="px-4 py-2.5 rounded-xl border border-amber-900/50 bg-amber-950/30 hover:bg-amber-900/40 text-amber-300 font-mono-code text-xs flex items-center gap-2 transition-colors"
                title="Tải tệp âm thanh WAV về máy"
              >
                <Download className="h-3.5 w-3.5 text-amber-400" />
                <span>Tải tệp WAV</span>
              </a>
            )}
          </div>

          {/* Timeline Scrubber */}
          {audioUrl && (
            <div className="mt-5 space-y-1.5 pt-4 border-t border-slate-800/80">
              <div className="flex items-center justify-between text-[11px] font-mono-code text-slate-400">
                <span className="text-amber-400">{formatTime(currentTime)}</span>
                <span className="text-slate-500 font-sans">
                  Nhân vật: <strong className="text-amber-300">{voiceConfig.voice}</strong> ({voiceConfig.playbackSpeed}x)
                </span>
                <span>{formatTime(duration)}</span>
              </div>
              <input
                type="range"
                min={0}
                max={duration || 100}
                step={0.1}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          )}
        </section>

        {/* Historical Context Card */}
        <HistoricalContext />
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-900 mt-12 py-6 text-center text-xs font-mono-code text-slate-500">
        <p>BẢN QUYỀN TRUYỀN PHÁT TÌNH BÁO • GOOGLE AI STUDIO GEMINI TTS</p>
        <p className="mt-1 text-[11px] text-slate-600">
          Tái hiện âm thanh kịch tính lịch sử Chiến dịch Bắc Cực (Englandspiel 1942–1944)
        </p>
      </footer>
    </div>
  );
}
