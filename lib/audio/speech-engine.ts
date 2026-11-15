const NOVELTY_VOICE_BLOCKLIST = [
  "albert",
  "bad news",
  "bahh",
  "bells",
  "boing",
  "bubbles",
  "cellos",
  "deranged",
  "espeak",
  "fred",
  "good news",
  "hysterical",
  "jester",
  "junior",
  "kathy",
  "organ",
  "princess",
  "ralph",
  "superstar",
  "trinoids",
  "whisper",
  "wobble",
  "zarvox",
];

const PREFERRED_VOICE_PATTERNS = [
  "natural",
  "neural",
  "enhanced",
  "premium",
  "google us english",
  "google uk english",
  "samantha",
  "ava",
  "allison",
  "susan",
  "daniel",
  "karen",
  "serena",
  "aria",
  "jenny",
  "guy",
  "aaron",
  "nicky",
];

function scoreVoice(voice: SpeechSynthesisVoice): number {
  const nameLower = voice.name.toLowerCase();
  const langLower = voice.lang.toLowerCase();

  if (NOVELTY_VOICE_BLOCKLIST.some((blocked) => nameLower.includes(blocked))) {
    return -1000;
  }

  let score = 0;

  if (langLower === "en-us") {
    score += 40;
  } else if (langLower === "en-gb") {
    score += 32;
  } else if (langLower.startsWith("en")) {
    score += 20;
  } else {
    return -500;
  }

  const preferredIndex = PREFERRED_VOICE_PATTERNS.findIndex((pattern) =>
    nameLower.includes(pattern)
  );
  if (preferredIndex !== -1) {
    score += 80 - preferredIndex * 2;
  }

  if (voice.default) {
    score += 10;
  }

  if (!voice.localService) {
    score += 8;
  }

  return score;
}

/**
 * Selects the clearest, most natural English voice available in the host browser.
 */
export function selectPreferredVoice(
  voices: readonly SpeechSynthesisVoice[]
): SpeechSynthesisVoice | null {
  if (voices.length === 0) {
    return null;
  }

  let bestVoice: SpeechSynthesisVoice | null = null;
  let bestScore = -Infinity;

  for (const voice of voices) {
    const score = scoreVoice(voice);
    if (score > bestScore) {
      bestScore = score;
      bestVoice = voice;
    }
  }

  return bestScore > -100 ? bestVoice : voices[0] ?? null;
}

interface SpeechEngineDependencies {
  getSynth?: () => SpeechSynthesis | null;
  UtteranceCtor?: typeof SpeechSynthesisUtterance;
}

function defaultGetSynth(): SpeechSynthesis | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return null;
  }
  return window.speechSynthesis;
}

/**
 * Web Speech API announcement engine with natural voice ranking,
 * overlap cancellation, and duplicate-utterance protection.
 */
export class SpeechEngine {
  private enabled = true;
  private cachedVoice: SpeechSynthesisVoice | null = null;
  private lastKey: string | null = null;
  private pendingTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly getSynth: () => SpeechSynthesis | null;
  private readonly UtteranceCtor?: typeof SpeechSynthesisUtterance;
  private voicesBound = false;

  constructor(deps: SpeechEngineDependencies = {}) {
    this.getSynth = deps.getSynth ?? defaultGetSynth;
    this.UtteranceCtor =
      deps.UtteranceCtor ??
      (typeof SpeechSynthesisUtterance !== "undefined"
        ? SpeechSynthesisUtterance
        : undefined);
  }

  private bindVoicesListener(): void {
    if (this.voicesBound) {
      return;
    }
    const synth = this.getSynth();
    if (!synth || typeof synth.addEventListener !== "function") {
      return;
    }
    this.voicesBound = true;
    synth.addEventListener("voiceschanged", this.handleVoicesChanged);
  }

  private readonly handleVoicesChanged = (): void => {
    const synth = this.getSynth();
    if (!synth) {
      return;
    }
    this.cachedVoice = selectPreferredVoice(synth.getVoices());
  };

  public isEnabled(): boolean {
    return this.enabled;
  }

  public setEnabled(next: boolean): void {
    this.enabled = next;
    if (!next) {
      this.stop();
    }
  }

  /**
   * Immediately stops any scheduled or active spoken announcement.
   */
  public stop(): void {
    if (this.pendingTimer !== null) {
      clearTimeout(this.pendingTimer);
      this.pendingTimer = null;
    }
    const synth = this.getSynth();
    if (!synth) {
      return;
    }
    try {
      synth.cancel();
    } catch {
      // Ignore host browser speechSynthesis errors.
    }
  }

  /**
   * Schedules a short delay before announcing so mark placement audio can breathe,
   * automatically cancelling earlier pending or active speech.
   */
  public announce(
    text: string,
    dedupeKey: string,
    delayMs = 0
  ): void {
    if (!this.enabled) {
      return;
    }
    if (this.lastKey === dedupeKey) {
      return;
    }

    this.lastKey = dedupeKey;

    if (this.pendingTimer !== null) {
      clearTimeout(this.pendingTimer);
      this.pendingTimer = null;
    }

    if (delayMs <= 0) {
      this.speakNow(text);
      return;
    }

    this.pendingTimer = setTimeout(() => {
      this.pendingTimer = null;
      if (this.enabled) {
        this.speakNow(text);
      }
    }, delayMs);
  }

  public resetDedupe(): void {
    this.lastKey = null;
  }

  private speakNow(text: string): void {
    const synth = this.getSynth();
    const Ctor = this.UtteranceCtor;
    if (!synth || !Ctor) {
      return;
    }

    this.bindVoicesListener();

    try {
      if (synth.paused) {
        synth.resume();
      }
      synth.cancel();

      const utterance = new Ctor(text);
      const voices = synth.getVoices();
      const voice = this.cachedVoice ?? selectPreferredVoice(voices);
      if (voice) {
        this.cachedVoice = voice;
        utterance.voice = voice;
        utterance.lang = voice.lang;
      } else {
        utterance.lang = "en-US";
      }

      utterance.rate = 0.98;
      utterance.pitch = 1.02;
      utterance.volume = 0.9;

      synth.speak(utterance);
    } catch {
      // Gracefully degrade when speech synthesis is unavailable or blocked.
    }
  }

  public dispose(): void {
    this.stop();
    const synth = this.getSynth();
    if (synth && this.voicesBound && typeof synth.removeEventListener === "function") {
      synth.removeEventListener("voiceschanged", this.handleVoicesChanged);
      this.voicesBound = false;
    }
  }
}
