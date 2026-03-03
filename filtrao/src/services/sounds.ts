/**
 * Minimalist sound effects using Web Audio API
 */

class SoundService {
  private ctx: AudioContext | null = null;

  private async init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      try {
        await this.ctx.resume();
      } catch (e) {
        console.error("Failed to resume AudioContext:", e);
      }
    }
  }

  private async playTone(freq: number, type: OscillatorType = 'sine', duration: number = 0.1, volume: number = 0.1) {
    await this.init();
    if (!this.ctx || this.ctx.state !== 'running') return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  async tick() {
    await this.init();
    if (!this.ctx || this.ctx.state !== 'running') return;

    const duration = 0.01;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + duration);

    gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  // Muted sound for other interactions
  async muted() {
    await this.init();
    if (!this.ctx || this.ctx.state !== 'running') return;

    const duration = 0.05;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(80, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + duration);

    gain.gain.setValueAtTime(0.03, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  confirm() {
    this.muted();
  }

  phaseChange() {
    this.playTone(440, 'sine', 0.1, 0.05);
  }

  vibrate(pattern: number | number[] = 10) {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }
}

export const sounds = new SoundService();
