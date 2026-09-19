/**
 * Audio Alerts using Web Audio API
 * Generates pure, gentle, soothing chimes and water drop sounds with zero external dependencies.
 */

class SoundEffects {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    try {
      if (!this.ctx) {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioContextClass) {
          this.ctx = new AudioContextClass();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  /**
   * 1. 柔和護眼提醒音 (Soft Eye Rest Chime - 528Hz Solfeggio Relax Tone)
   * 溫暖清澈的雙音和弦，提醒抬頭遠眺，不刺耳。
   */
  playEyeRestChime(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      
      // Tone 1: 528 Hz (Primary Solfeggio soothing tone)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(528, now);
      
      gain1.gain.setValueAtTime(0, now);
      gain1.gain.linearRampToValueAtTime(0.12, now + 0.08);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + 1.8);

      // Tone 2: 792 Hz (Perfect Fifth harmonic, soft shimmer)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(792, now + 0.12);

      gain2.gain.setValueAtTime(0, now + 0.12);
      gain2.gain.linearRampToValueAtTime(0.08, now + 0.2);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 2.0);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);

      osc2.start(now + 0.12);
      osc2.stop(now + 2.0);
    } catch (e) {
      console.warn('Audio playback not allowed or failed:', e);
    }
  }

  /**
   * 2. 護眼完成提示音 (Eye Rest Complete - Pleasant double chime)
   */
  playEyeRestCompleteChime(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const notes = [659.25, 880]; // E5 -> A5 ascending resolution

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const startTime = now + idx * 0.15;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.1, startTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 1.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 1.2);
      });
    } catch (e) {
      console.warn('Audio playback failed:', e);
    }
  }

  /**
   * 3. 2 小時見字飲水深層休息音 (2-Hour Water / Break Alert)
   */
  playTwoHourWaterChime(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      // Gentle 3-note relaxing triad (C5 -> E5 -> G5)
      const chord = [523.25, 659.25, 783.99];

      chord.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const startTime = now + idx * 0.18;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.12, startTime + 0.06);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 2.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 2.2);
      });
    } catch (e) {
      console.warn('Audio playback failed:', e);
    }
  }

  /**
   * 4. 舒緩水滴音 (Gentle Water Drop Effect)
   */
  playWaterDrop(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(900, now);
      osc.frequency.exponentialRampToValueAtTime(1600, now + 0.08);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch (e) {
      console.warn('Water drop audio failed:', e);
    }
  }
}

export const soundEffects = new SoundEffects();
