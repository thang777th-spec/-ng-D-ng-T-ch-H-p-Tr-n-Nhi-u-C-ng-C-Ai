import React, { useEffect, useRef } from 'react';

interface RadioWaveVisualizerProps {
  isPlaying: boolean;
  audioRef?: React.RefObject<HTMLAudioElement | null>;
  frequencyLabel?: string;
}

export const RadioWaveVisualizer: React.FC<RadioWaveVisualizerProps> = ({
  isPlaying,
  audioRef,
  frequencyLabel = '7.125 MHz (AM CW)',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animIdRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let phase = 0;
    const barCount = 48;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      // Draw faint oscilloscope background grid
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.08)';
      ctx.lineWidth = 1;
      const gridSize = 20;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Center line
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.2)';
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();

      if (isPlaying) {
        phase += 0.08;
      }

      // Draw spectrum bars
      const barWidth = (width / barCount) - 2;
      for (let i = 0; i < barCount; i++) {
        let amplitude = 0;
        if (isPlaying) {
          // Dynamic simulated frequency energy with harmonic tension
          const harmonic1 = Math.sin(phase * 1.5 + (i * 0.28));
          const harmonic2 = Math.cos(phase * 0.9 - (i * 0.18));
          const harmonic3 = Math.sin(phase * 2.3 + (i * 0.45));
          amplitude = Math.abs(harmonic1 * 0.5 + harmonic2 * 0.3 + harmonic3 * 0.2);
          // Bell curve weighting in center
          const distFromCenter = Math.abs(i - barCount / 2) / (barCount / 2);
          amplitude = amplitude * (1 - distFromCenter * 0.45);
        } else {
          // Resting baseline pulse
          amplitude = 0.05 + Math.sin(phase * 0.3 + i * 0.2) * 0.03;
        }

        const barHeight = Math.max(4, amplitude * (height * 0.85));
        const x = i * (barWidth + 2);
        const y = (height - barHeight) / 2;

        const grad = ctx.createLinearGradient(0, y, 0, y + barHeight);
        if (isPlaying) {
          grad.addColorStop(0, 'rgba(245, 158, 11, 0.9)'); // amber-500
          grad.addColorStop(0.5, 'rgba(239, 68, 68, 0.8)'); // red-500
          grad.addColorStop(1, 'rgba(245, 158, 11, 0.9)');
        } else {
          grad.addColorStop(0, 'rgba(100, 116, 139, 0.4)');
          grad.addColorStop(1, 'rgba(71, 85, 105, 0.2)');
        }

        ctx.fillStyle = grad;
        ctx.fillRect(x, y, barWidth, barHeight);
      }

      // Continuous wave line over the top
      ctx.beginPath();
      ctx.strokeStyle = isPlaying ? 'rgba(251, 191, 36, 0.7)' : 'rgba(148, 163, 184, 0.25)';
      ctx.lineWidth = 1.5;
      for (let x = 0; x < width; x += 4) {
        let waveY = height / 2;
        if (isPlaying) {
          waveY += Math.sin((x * 0.035) + phase * 2) * 16 * Math.cos(phase * 0.8 + x * 0.015);
        } else {
          waveY += Math.sin(x * 0.02 + phase * 0.5) * 2;
        }
        if (x === 0) ctx.moveTo(x, waveY);
        else ctx.lineTo(x, waveY);
      }
      ctx.stroke();

      animIdRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animIdRef.current) cancelAnimationFrame(animIdRef.current);
    };
  }, [isPlaying]);

  return (
    <div className="relative rounded-xl border border-amber-950/60 bg-black/60 p-3 shadow-inner backdrop-blur-md overflow-hidden">
      {/* Top telemetry bar */}
      <div className="flex items-center justify-between pb-2 text-[11px] font-mono-code text-amber-400/80 border-b border-amber-950/40">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isPlaying ? 'bg-amber-400' : 'bg-slate-500'
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                isPlaying ? 'bg-amber-500' : 'bg-slate-600'
              }`}
            />
          </span>
          <span className="tracking-widest uppercase">
            {isPlaying ? 'TÍN HIỆU ĐANG PHÁT // ON AIR' : 'TRẠM CHỜ // STANDBY'}
          </span>
        </div>
        <div className="text-amber-500/70 font-semibold">{frequencyLabel}</div>
      </div>

      {/* Oscilloscope Canvas */}
      <div className="relative mt-2">
        <canvas
          ref={canvasRef}
          width={640}
          height={110}
          className="w-full h-[110px] rounded block"
        />
        {/* CRT Scanline overlay effect */}
        <div className="pointer-events-none absolute inset-0 radio-scanlines rounded opacity-30" />
      </div>

      {/* Bottom status readout */}
      <div className="flex items-center justify-between pt-2 text-[10px] font-mono-code text-slate-500">
        <div>MODULATION: AM-CW 24kHz</div>
        <div className="text-amber-500/80">TỐC ĐỘ: VỪA PHẢI // TRUYỀN CẢM KỊCH TÍNH</div>
        <div>SOE-NET: 1943 NORDPOL</div>
      </div>
    </div>
  );
};
