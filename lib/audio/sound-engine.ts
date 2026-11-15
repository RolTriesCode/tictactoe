import type { Player } from "@/lib/game/types";

type AudioContextFactory = () => AudioContext | null;

function defaultAudioContextFactory(): AudioContext | null {
  if (typeof window === "undefined") {
    return null;
  }
  const win = window as Window & {
    webkitAudioContext?: typeof AudioContext;
  };
  const Ctor = window.AudioContext ?? win.webkitAudioContext;
  if (!Ctor) {
    return null;
  }
  try {
    return new Ctor();
  } catch {
    return null;
  }
}

const MASTER_VOLUME = 0.85;

/**
 * Synthesized Web Audio API sound effects engine.
 * Lazily initializes and unlocks AudioContext strictly upon user interaction.
 */
export class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private enabled = true;
  private readonly createContext: AudioContextFactory;

  constructor(createContext: AudioContextFactory = defaultAudioContextFactory) {
    this.createContext = createContext;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public setEnabled(next: boolean): void {
    this.enabled = next;
    if (!this.ctx || !this.masterGain) {
      return;
    }

    const now = this.ctx.currentTime;
    try {
      this.masterGain.gain.cancelScheduledValues?.(now);
      this.masterGain.gain.setValueAtTime(next ? MASTER_VOLUME : 0, now);
    } catch {
      // Ignore Web Audio state errors on torn-down contexts.
    }
  }

  /**
   * Unlocks/initializes AudioContext inside a user gesture without necessarily playing a tone.
   */
  public unlock(): AudioContext | null {
    if (!this.enabled) {
      return null;
    }
    return this.ensureReady();
  }

  private ensureReady(): AudioContext | null {
    if (!this.enabled) {
      return null;
    }
    if (!this.ctx) {
      this.ctx = this.createContext();
      if (!this.ctx) {
        return null;
      }
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(MASTER_VOLUME, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }

    if (this.ctx.state === "suspended") {
      void this.ctx.resume().catch(() => {
        // Autoplay restriction — safely ignored until next user gesture.
      });
    }

    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(MASTER_VOLUME, this.ctx.currentTime);
    }

    return this.ctx;
  }

  private scheduleTone(options: {
    freq: number;
    endFreq?: number;
    type?: OscillatorType;
    delay?: number;
    duration: number;
    peakGain: number;
  }): void {
    const ctx = this.ensureReady();
    if (!ctx || !this.masterGain) {
      return;
    }

    const start = ctx.currentTime + (options.delay ?? 0);
    const stop = start + options.duration;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = options.type ?? "sine";
    osc.frequency.setValueAtTime(options.freq, start);
    if (options.endFreq !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(
        Math.max(20, options.endFreq),
        stop
      );
    }

    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(options.peakGain, start + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, stop);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(start);
    osc.stop(stop + 0.01);
  }

  /**
   * 1. Subtle mechanical cell tap upon selection.
   */
  public playCellSelect(): void {
    const ctx = this.ensureReady();
    if (!ctx || !this.masterGain) {
      return;
    }

    const now = ctx.currentTime;
    const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * 0.016));
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.setValueAtTime(1400, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.016);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    source.start(now);
  }

  /**
   * 2. Tactile mark placement sound differentiated subtly for Electric Blue (X) and Vibrant Red (O).
   */
  public playMarkPlace(player: Player): void {
    if (player === "X") {
      // Crisp rising cobalt interval (D5 -> A5)
      this.scheduleTone({
        freq: 587.33,
        endFreq: 610,
        type: "triangle",
        duration: 0.09,
        peakGain: 0.12,
      });
      this.scheduleTone({
        freq: 880,
        type: "sine",
        delay: 0.035,
        duration: 0.14,
        peakGain: 0.09,
      });
    } else {
      // Warm crimson interval (E5 -> B4 -> E5 harmonic)
      this.scheduleTone({
        freq: 493.88,
        endFreq: 523.25,
        type: "sine",
        duration: 0.11,
        peakGain: 0.14,
      });
      this.scheduleTone({
        freq: 739.99,
        type: "triangle",
        delay: 0.035,
        duration: 0.14,
        peakGain: 0.075,
      });
    }
  }

  /**
   * 3. Distinct shimmer synchronized with the winning line drawing across the board.
   */
  public playWinningLine(): void {
    const notes = [523.25, 659.25, 783.99];
    notes.forEach((freq, idx) => {
      this.scheduleTone({
        freq,
        type: "sine",
        delay: idx * 0.045,
        duration: 0.24,
        peakGain: 0.08,
      });
    });
  }

  /**
   * 4. Celebratory victory arpeggio tailored to the winning player.
   */
  public playVictory(player: Player): void {
    const chord =
      player === "X"
        ? [523.25, 659.25, 783.99, 1046.5, 1174.66] // Bright Cmaj9
        : [440, 554.37, 659.25, 880, 987.77]; // Warm Amaj9

    chord.forEach((freq, idx) => {
      this.scheduleTone({
        freq,
        type: idx % 2 === 0 ? "sine" : "triangle",
        delay: 0.08 + idx * 0.065,
        duration: 0.42,
        peakGain: idx === chord.length - 1 ? 0.11 : 0.085,
      });
    });
  }

  /**
   * 5. Calm, balanced two-note cadence for a draw (distinctly non-celebratory).
   */
  public playDraw(): void {
    this.scheduleTone({
      freq: 440,
      type: "sine",
      delay: 0.04,
      duration: 0.22,
      peakGain: 0.09,
    });
    this.scheduleTone({
      freq: 392,
      type: "sine",
      delay: 0.18,
      duration: 0.34,
      peakGain: 0.085,
    });
  }

  /**
   * 6. Subtle refreshing reset sweep for New Game.
   */
  public playNewGame(): void {
    this.scheduleTone({
      freq: 392,
      endFreq: 523.25,
      type: "sine",
      duration: 0.11,
      peakGain: 0.08,
    });
    this.scheduleTone({
      freq: 659.25,
      type: "triangle",
      delay: 0.06,
      duration: 0.14,
      peakGain: 0.065,
    });
  }

  /**
   * 7. Lightweight micro UI feedback for buttons and toggle switches.
   */
  public playButtonClick(): void {
    this.scheduleTone({
      freq: 680,
      endFreq: 420,
      type: "sine",
      duration: 0.032,
      peakGain: 0.065,
    });
  }
}
