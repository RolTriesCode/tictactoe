import { beforeEach, describe, expect, it, vi } from "vitest";
import { SoundEngine } from "@/lib/audio/sound-engine";
import { SpeechEngine, selectPreferredVoice } from "@/lib/audio/speech-engine";

function createMockAudioContext() {
  const gainNode = {
    gain: {
      value: 1,
      setValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
      cancelScheduledValues: vi.fn(),
    },
    connect: vi.fn(),
    disconnect: vi.fn(),
  };

  const oscNode = {
    type: "sine",
    frequency: {
      value: 440,
      setValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    },
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    onended: null as null | (() => void),
  };

  const biquadFilter = {
    type: "highpass",
    frequency: { setValueAtTime: vi.fn() },
    connect: vi.fn(),
  };

  const bufferSource = {
    buffer: null as unknown,
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  };

  const context = {
    state: "suspended" as AudioContextState,
    currentTime: 0,
    sampleRate: 44100,
    destination: {},
    resume: vi.fn(async () => {
      context.state = "running";
    }),
    createGain: vi.fn(() => ({ ...gainNode, gain: { ...gainNode.gain } })),
    createOscillator: vi.fn(() => ({
      ...oscNode,
      frequency: { ...oscNode.frequency },
    })),
    createBiquadFilter: vi.fn(() => ({
      ...biquadFilter,
      frequency: { ...biquadFilter.frequency },
    })),
    createBuffer: vi.fn((_c: number, len: number) => ({
      getChannelData: () => new Float32Array(len),
    })),
    createBufferSource: vi.fn(() => ({ ...bufferSource })),
  };

  return context;
}

describe("SoundEngine", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("does not construct an AudioContext on instantiation (lazy autoplay compliance)", () => {
    const createCtx = vi.fn(() => createMockAudioContext() as unknown as AudioContext);
    const engine = new SoundEngine(createCtx);

    expect(createCtx).not.toHaveBeenCalled();
    engine.setEnabled(false);
    engine.playCellSelect();
    expect(createCtx).not.toHaveBeenCalled();
  });

  it("initializes and resumes AudioContext on first user-triggered sound when enabled", () => {
    const mockCtx = createMockAudioContext();
    const createCtx = vi.fn(() => mockCtx as unknown as AudioContext);
    const engine = new SoundEngine(createCtx);

    engine.playMarkPlace("X");
    expect(createCtx).toHaveBeenCalledTimes(1);
    expect(mockCtx.resume).toHaveBeenCalledTimes(1);
    expect(mockCtx.createOscillator).toHaveBeenCalled();
  });

  it("immediately silences master gain and suppresses playback when disabled", () => {
    const mockCtx = createMockAudioContext();
    const masterGain = {
      gain: {
        value: 0.9,
        setValueAtTime: vi.fn(),
        cancelScheduledValues: vi.fn(),
      },
      connect: vi.fn(),
    };
    mockCtx.createGain.mockReturnValueOnce(masterGain as unknown as typeof mockCtx.createGain extends () => infer R ? R : never);

    const engine = new SoundEngine(() => mockCtx as unknown as AudioContext);
    engine.playButtonClick();

    const oscCountBeforeDisable = mockCtx.createOscillator.mock.calls.length;
    engine.setEnabled(false);

    expect(masterGain.gain.setValueAtTime).toHaveBeenCalledWith(0, mockCtx.currentTime);
    engine.playVictory("O");
    expect(mockCtx.createOscillator).toHaveBeenCalledTimes(oscCountBeforeDisable);
  });
});

describe("SpeechEngine", () => {
  it("selects natural English voices over robotic novelty voices", () => {
    const voices = [
      { name: "Zarvox", lang: "en-US", localService: true, default: false, voiceURI: "Zarvox" },
      { name: "Albert", lang: "en-US", localService: true, default: false, voiceURI: "Albert" },
      { name: "Samantha", lang: "en-US", localService: true, default: true, voiceURI: "Samantha" },
      { name: "Google US English", lang: "en-US", localService: false, default: false, voiceURI: "Google US English" },
    ] as SpeechSynthesisVoice[];

    const chosen = selectPreferredVoice(voices);
    expect(chosen?.name).toMatch(/Google US English|Samantha/);
  });

  it("cancels queued speech before speaking a new announcement and cancels immediately when disabled", () => {
    const spoken: Array<{ text: string; rate: number; pitch: number; volume: number }> = [];
    const cancel = vi.fn();
    const speak = vi.fn((u: { text: string; rate: number; pitch: number; volume: number }) => {
      spoken.push({ text: u.text, rate: u.rate, pitch: u.pitch, volume: u.volume });
    });

    const mockSynth = {
      cancel,
      speak,
      getVoices: () =>
        [{ name: "Samantha", lang: "en-US", localService: true, default: true, voiceURI: "Samantha" }] as SpeechSynthesisVoice[],
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as SpeechSynthesis;

    const UtteranceMock = vi.fn(function (this: Record<string, unknown>, text: string) {
      this.text = text;
      this.rate = 1;
      this.pitch = 1;
      this.volume = 1;
      this.lang = "en-US";
      this.voice = null;
    }) as unknown as typeof SpeechSynthesisUtterance;

    const engine = new SpeechEngine({
      getSynth: () => mockSynth,
      UtteranceCtor: UtteranceMock,
    });

    engine.announce("Red's turn!", "round-1-turn-1");
    expect(cancel).toHaveBeenCalledTimes(1);
    expect(speak).toHaveBeenCalledTimes(1);
    expect(spoken[0]?.text).toBe("Red's turn!");

    // Same deduplication key must not duplicate announcement
    engine.announce("Red's turn!", "round-1-turn-1");
    expect(speak).toHaveBeenCalledTimes(1);

    // Different key cancels prior speech first
    engine.announce("Blue wins!", "round-1-won");
    expect(cancel).toHaveBeenCalledTimes(2);
    expect(speak).toHaveBeenCalledTimes(2);

    // Disabling immediately cancels speech and suppresses future announcements
    engine.setEnabled(false);
    expect(cancel).toHaveBeenCalledTimes(3);
    engine.announce("It's a draw!", "round-1-draw");
    expect(speak).toHaveBeenCalledTimes(2);
  });
});
