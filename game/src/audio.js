// Synthesised sound effects for Turkey Run, WebAudio only — no audio files,
// no network. The context is created on the first user gesture, so the game
// stays silent (and error-free) in a headless screenshot run.
export class SoundBank {
  constructor() {
    this.context = null;
    this.muted = false;
  }

  unlock() {
    if (this.context) {
      if (this.context.state === 'suspended') void this.context.resume();
      return;
    }
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      this.context = new AudioContext();
    } catch {
      this.context = null;
    }
  }

  setMuted(muted) {
    this.muted = muted;
  }

  tone(frequency, duration, type = 'sine', volume = 0.12, when = 0, slideTo = null) {
    if (!this.context || this.muted) return;
    const start = this.context.currentTime + when;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    if (slideTo !== null) oscillator.frequency.exponentialRampToValueAtTime(slideTo, start + duration);
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain).connect(this.context.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
  }

  noise(duration, volume = 0.15, when = 0) {
    if (!this.context || this.muted) return;
    const start = this.context.currentTime + when;
    const length = Math.max(1, Math.floor(this.context.sampleRate * duration));
    const buffer = this.context.createBuffer(1, length, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    const source = this.context.createBufferSource();
    const gain = this.context.createGain();
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    source.buffer = buffer;
    source.connect(gain).connect(this.context.destination);
    source.start(start);
  }

  jump() {
    this.tone(280, 0.16, 'square', 0.07, 0, 620);
  }

  land() {
    this.noise(0.08, 0.08);
  }

  pickup(combo) {
    const base = 620 + Math.min(combo, 5) * 70;
    this.tone(base, 0.1, 'sine', 0.12);
    this.tone(base * 1.5, 0.14, 'sine', 0.1, 0.06);
  }

  golden() {
    this.tone(880, 0.12, 'triangle', 0.14);
    this.tone(1174, 0.12, 'triangle', 0.12, 0.08);
    this.tone(1568, 0.2, 'triangle', 0.12, 0.16);
  }

  hit() {
    this.noise(0.25, 0.22);
    this.tone(140, 0.3, 'sawtooth', 0.14, 0, 55);
  }

  gobble() {
    // A turkey's gobble: four quick descending clucks.
    const notes = [420, 360, 320, 260];
    notes.forEach((frequency, index) => {
      this.tone(frequency, 0.09, 'square', 0.09, index * 0.09, frequency * 0.8);
    });
  }

  fanfare() {
    const notes = [523, 659, 784, 1046];
    notes.forEach((frequency, index) => {
      this.tone(frequency, 0.22, 'triangle', 0.13, index * 0.11);
    });
  }

  click() {
    this.tone(900, 0.05, 'sine', 0.08);
  }
}
