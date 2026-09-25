// Atmospheric Web Audio synthesizer for vintage wartime radio static and subtle Morse code

class RadioAtmosphere {
  private ctx: AudioContext | null = null;
  private noiseNode: AudioNode | null = null;
  private gainNode: GainNode | null = null;
  private isPlaying = false;
  private morseInterval: any = null;

  public init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setVolume(vol: number) {
    if (this.gainNode) {
      this.gainNode.gain.setValueAtTime(Math.max(0, Math.min(1, vol)), this.ctx?.currentTime || 0);
    }
  }

  public start(volume = 0.12) {
    this.init();
    if (this.isPlaying || !this.ctx) return;

    try {
      // Create white noise buffer filtered to vintage AM radio bandwidth
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      // Bandpass filter for authentic 1940s shortwave radio sound (500Hz - 3500Hz)
      const bandpass = this.ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.value = 1800;
      bandpass.Q.value = 1.2;

      this.gainNode = this.ctx.createGain();
      this.gainNode.gain.value = volume;

      whiteNoise.connect(bandpass);
      bandpass.connect(this.gainNode);
      this.gainNode.connect(this.ctx.destination);

      whiteNoise.start(0);
      this.noiseNode = whiteNoise;
      this.isPlaying = true;

      // Subtle Morse code beeps occasionally (like distant 1942 radio signals)
      this.startMorsePulses();
    } catch (e) {
      console.warn('Atmosphere audio error:', e);
    }
  }

  private startMorsePulses() {
    if (this.morseInterval) clearInterval(this.morseInterval);

    this.morseInterval = setInterval(() => {
      if (!this.isPlaying || !this.ctx || !this.gainNode) return;
      if (Math.random() > 0.45) return;

      try {
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(650 + Math.random() * 150, this.ctx.currentTime); // ~750Hz standard telegraph tone

        const now = this.ctx.currentTime;
        const beepDuration = 0.06 + Math.random() * 0.08;
        oscGain.gain.setValueAtTime(0, now);
        oscGain.gain.linearRampToValueAtTime(0.04, now + 0.01);
        oscGain.gain.linearRampToValueAtTime(0, now + beepDuration);

        osc.connect(oscGain);
        oscGain.connect(this.gainNode);

        osc.start(now);
        osc.stop(now + beepDuration);
      } catch (e) {
        // ignore
      }
    }, 450);
  }

  public stop() {
    if (this.morseInterval) {
      clearInterval(this.morseInterval);
      this.morseInterval = null;
    }
    if (this.noiseNode) {
      try {
        (this.noiseNode as AudioScheduledSourceNode).stop();
        this.noiseNode.disconnect();
      } catch (e) {}
      this.noiseNode = null;
    }
    if (this.gainNode) {
      try {
        this.gainNode.disconnect();
      } catch (e) {}
      this.gainNode = null;
    }
    this.isPlaying = false;
  }

  public toggle(volume = 0.12): boolean {
    if (this.isPlaying) {
      this.stop();
      return false;
    } else {
      this.start(volume);
      return true;
    }
  }

  public get active(): boolean {
    return this.isPlaying;
  }
}

export const radioAtmosphere = new RadioAtmosphere();
