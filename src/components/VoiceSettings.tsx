import React from 'react';
import { Sliders, Volume2, Mic, Radio, Sparkles } from 'lucide-react';

export interface VoiceConfig {
  voice: 'Fenrir' | 'Charon' | 'Kore' | 'Puck' | 'Zephyr';
  model: 'gemini-3.8-flash-lite-tts' | 'gemini-3.8-flash-tts';
  style: string;
  playbackSpeed: number;
  ambienceEnabled: boolean;
  ambienceVolume: number;
  useBrowserTts: boolean;
}

interface VoiceSettingsProps {
  config: VoiceConfig;
  onChange: (newConfig: VoiceConfig) => void;
  disabled?: boolean;
}

const VOICE_OPTIONS: Array<{
  id: VoiceConfig['voice'];
  name: string;
  gender: string;
  desc: string;
  tag: string;
}> = [
  {
    id: 'Fenrir',
    name: 'Fenrir',
    gender: 'Nam',
    desc: 'Trầm ấm, uy quyền, đậm màu sắc điện ảnh và hồi hộp chiến tranh',
    tag: 'Đề xuất số 1',
  },
  {
    id: 'Charon',
    name: 'Charon',
    gender: 'Nam',
    desc: 'Lạnh lùng, kiềm chế, sắc lạnh như trinh sát mật vụ',
    tag: 'Bí ẩn',
  },
  {
    id: 'Kore',
    name: 'Kore',
    gender: 'Nữ',
    desc: 'Truyền cảm sâu lắng, nghẹn ngào và ám ảnh tâm lý',
    tag: 'Truyền cảm',
  },
  {
    id: 'Puck',
    name: 'Puck',
    gender: 'Nam',
    desc: 'Gọn gàng, sắc sảo, nhịp điệu báo động khẩn cấp',
    tag: 'Sắc bén',
  },
  {
    id: 'Zephyr',
    name: 'Zephyr',
    gender: 'Nữ',
    desc: 'Trầm tĩnh, thì thầm bảo mật qua sóng ngắn',
    tag: 'Trầm tĩnh',
  },
];

export const VoiceSettings: React.FC<VoiceSettingsProps> = ({
  config,
  onChange,
  disabled = false,
}) => {
  return (
    <div className="space-y-4 rounded-xl border border-slate-800 bg-[#0d131f]/90 p-4 text-xs shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2 text-amber-400 font-semibold tracking-wide font-cinzel text-sm">
          <Sliders className="h-4 w-4" />
          <span>TÙY CHỈNH GIỌNG ĐỌC & TÍN HIỆU RADIO</span>
        </div>
        <div className="flex items-center gap-1.5 bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded border border-amber-500/20 font-mono-code text-[11px]">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Gemini TTS Studio</span>
        </div>
      </div>

      {/* Voice Selection Cards */}
      <div>
        <label className="mb-2 block font-medium text-slate-300 font-mono-code uppercase text-[11px]">
          1. Chọn Nhân Vật Giọng Đọc (Voice Actor)
        </label>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {VOICE_OPTIONS.map((v) => {
            const isSelected = config.voice === v.id;
            return (
              <button
                key={v.id}
                type="button"
                disabled={disabled}
                onClick={() => onChange({ ...config, voice: v.id })}
                className={`relative flex flex-col text-left p-2.5 rounded-lg border transition-all ${
                  isSelected
                    ? 'border-amber-500/80 bg-amber-500/10 shadow-[0_0_15px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/40'
                    : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900/90 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className={`font-semibold text-xs ${isSelected ? 'text-amber-300' : 'text-slate-200'}`}>
                    {v.name} ({v.gender})
                  </span>
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded font-mono-code ${
                      isSelected
                        ? 'bg-amber-500 text-black font-bold'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {v.tag}
                  </span>
                </div>
                <p className="mt-1 text-[11px] leading-tight text-slate-400 line-clamp-2">
                  {v.desc}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Speed & Tension Pace slider */}
      <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t border-slate-800/80">
        <div>
          <div className="flex items-center justify-between mb-1.5 font-mono-code text-[11px]">
            <span className="text-slate-300">Tốc độ phát:</span>
            <span className="text-amber-400 font-bold">{config.playbackSpeed}x ({config.playbackSpeed <= 0.9 ? 'Chậm rãi, kịch tính' : 'Tiêu chuẩn'})</span>
          </div>
          <div className="flex items-center gap-2">
            {[0.75, 0.85, 0.95, 1.0, 1.15].map((speed) => (
              <button
                key={speed}
                type="button"
                onClick={() => onChange({ ...config, playbackSpeed: speed })}
                className={`flex-1 py-1 rounded border text-[11px] font-mono-code transition-colors ${
                  config.playbackSpeed === speed
                    ? 'border-amber-500 bg-amber-500 text-black font-bold'
                    : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>

        {/* Vintage Radio Static Ambience */}
        <div>
          <div className="flex items-center justify-between mb-1.5 font-mono-code text-[11px]">
            <span className="flex items-center gap-1.5 text-slate-300">
              <Radio className="h-3.5 w-3.5 text-amber-500" />
              <span>Tiếng đài vô tuyến & Morse ngầm:</span>
            </span>
            <span className={`font-bold ${config.ambienceEnabled ? 'text-amber-400' : 'text-slate-500'}`}>
              {config.ambienceEnabled ? `${Math.round(config.ambienceVolume * 100)}%` : 'Tắt'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onChange({ ...config, ambienceEnabled: !config.ambienceEnabled })}
              className={`px-3 py-1 rounded border font-mono-code text-[11px] transition-colors shrink-0 ${
                config.ambienceEnabled
                  ? 'border-amber-500/80 bg-amber-500/20 text-amber-300 font-semibold'
                  : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
              }`}
            >
              {config.ambienceEnabled ? 'Bật sóng' : 'Tắt sóng'}
            </button>
            <input
              type="range"
              min={0}
              max={0.3}
              step={0.02}
              value={config.ambienceVolume}
              disabled={!config.ambienceEnabled}
              onChange={(e) =>
                onChange({ ...config, ambienceVolume: parseFloat(e.target.value) })
              }
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer disabled:opacity-40"
            />
          </div>
        </div>
      </div>

      {/* Style instruction for TTS */}
      <div className="pt-2 border-t border-slate-800/80">
        <label className="mb-1 block font-mono-code text-[11px] text-slate-400">
          Chỉ dẫn phong cách diễn cảm AI (Speech Style Prompt):
        </label>
        <input
          type="text"
          value={config.style}
          disabled={disabled}
          onChange={(e) => onChange({ ...config, style: e.target.value })}
          className="w-full rounded border border-slate-800 bg-black/60 px-3 py-1.5 text-slate-300 focus:border-amber-500 focus:outline-none font-mono-code text-[11px]"
          placeholder="Chỉ dẫn diễn cảm giọng nói..."
        />
        <div className="mt-1 flex flex-wrap gap-1.5 text-[10px] text-slate-500 font-mono-code">
          <span>Gợi ý phong cách:</span>
          <button
            type="button"
            onClick={() =>
              onChange({
                ...config,
                style:
                  'Deep, tense, emotional and dramatic WWII espionage mystery narrative in Vietnamese, measured moderate pace, intense suspense and historical gravity',
              })
            }
            className="text-amber-400/80 hover:underline"
          >
            [Kịch tính Thế chiến II]
          </button>
          <button
            type="button"
            onClick={() =>
              onChange({
                ...config,
                style:
                  'Chilled, sinister, psychological suspense thriller narrative in Vietnamese, ominous pauses, cold calculation',
              })
            }
            className="text-amber-400/80 hover:underline"
          >
            [Rùng rợn tâm lý]
          </button>
          <button
            type="button"
            onClick={() =>
              onChange({
                ...config,
                style:
                  'Solemn, mournful, heavy historical documentary narration in Vietnamese, emotional pauses, respectful remembrance',
              })
            }
            className="text-amber-400/80 hover:underline"
          >
            [Tài liệu bi tráng]
          </button>
        </div>
      </div>
    </div>
  );
};
