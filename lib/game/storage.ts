import type { AudioPreferences, Player, ScoreBoardData } from "./types";

export const SCOREBOARD_STORAGE_KEY = "ttt-studio:scoreboard:v1";
export const AUDIO_PREFS_STORAGE_KEY = "ttt-studio:audio-prefs:v1";

export const DEFAULT_SCORES: ScoreBoardData = Object.freeze({
  xWins: 0,
  oWins: 0,
  draws: 0,
});

export const DEFAULT_AUDIO_PREFERENCES: AudioPreferences = Object.freeze({
  soundEnabled: true,
  voiceEnabled: true,
});

function sanitizeNonNegativeInt(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return 0;
  }
  return Math.floor(value);
}

function getSafeStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function parseScores(raw: string | null): ScoreBoardData {
  if (!raw) {
    return DEFAULT_SCORES;
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) {
      return DEFAULT_SCORES;
    }
    const candidate = parsed as Record<string, unknown>;
    return {
      xWins: sanitizeNonNegativeInt(candidate.xWins),
      oWins: sanitizeNonNegativeInt(candidate.oWins),
      draws: sanitizeNonNegativeInt(candidate.draws),
    };
  } catch {
    return DEFAULT_SCORES;
  }
}

function parseAudioPreferences(raw: string | null): AudioPreferences {
  if (!raw) {
    return DEFAULT_AUDIO_PREFERENCES;
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) {
      return DEFAULT_AUDIO_PREFERENCES;
    }
    const candidate = parsed as Record<string, unknown>;
    return {
      soundEnabled:
        typeof candidate.soundEnabled === "boolean"
          ? candidate.soundEnabled
          : DEFAULT_AUDIO_PREFERENCES.soundEnabled,
      voiceEnabled:
        typeof candidate.voiceEnabled === "boolean"
          ? candidate.voiceEnabled
          : DEFAULT_AUDIO_PREFERENCES.voiceEnabled,
    };
  } catch {
    return DEFAULT_AUDIO_PREFERENCES;
  }
}

interface LocalStorageStore<T> {
  load: () => T;
  save: (value: T) => void;
  getSnapshot: () => T;
  getServerSnapshot: () => T;
  subscribe: (listener: () => void) => () => void;
}

function createLocalStorageStore<T>(
  storageKey: string,
  fallback: T,
  parse: (raw: string | null) => T
): LocalStorageStore<T> {
  const listeners = new Set<() => void>();
  let cachedRaw: string | null | undefined = undefined;
  let cachedValue: T = fallback;

  const emitChange = () => {
    cachedRaw = undefined;
    for (const listener of listeners) {
      listener();
    }
  };

  const load = (): T => {
    const storage = getSafeStorage();
    if (!storage) {
      return { ...fallback };
    }
    try {
      return { ...parse(storage.getItem(storageKey)) };
    } catch {
      return { ...fallback };
    }
  };

  const save = (value: T): void => {
    const storage = getSafeStorage();
    if (!storage) {
      return;
    }
    try {
      storage.setItem(storageKey, JSON.stringify(value));
      emitChange();
    } catch {
      // Ignore quota / private-browsing storage exceptions gracefully.
    }
  };

  const getSnapshot = (): T => {
    const storage = getSafeStorage();
    if (!storage) {
      return fallback;
    }
    let raw: string | null = null;
    try {
      raw = storage.getItem(storageKey);
    } catch {
      return fallback;
    }
    if (raw === cachedRaw) {
      return cachedValue;
    }
    cachedRaw = raw;
    cachedValue = parse(raw);
    return cachedValue;
  };

  const getServerSnapshot = (): T => fallback;

  const subscribe = (listener: () => void): (() => void) => {
    listeners.add(listener);
    const onStorage = (event: StorageEvent) => {
      if (event.key === null || event.key === storageKey) {
        emitChange();
      }
    };
    if (typeof window !== "undefined") {
      window.addEventListener("storage", onStorage);
    }
    return () => {
      listeners.delete(listener);
      if (typeof window !== "undefined") {
        window.removeEventListener("storage", onStorage);
      }
    };
  };

  return { load, save, getSnapshot, getServerSnapshot, subscribe };
}

const scoresStore = createLocalStorageStore<ScoreBoardData>(
  SCOREBOARD_STORAGE_KEY,
  DEFAULT_SCORES,
  parseScores
);

const audioPrefsStore = createLocalStorageStore<AudioPreferences>(
  AUDIO_PREFS_STORAGE_KEY,
  DEFAULT_AUDIO_PREFERENCES,
  parseAudioPreferences
);

export const loadScores = scoresStore.load;
export const saveScores = scoresStore.save;
export const getScoresSnapshot = scoresStore.getSnapshot;
export const getServerScoresSnapshot = scoresStore.getServerSnapshot;
export const subscribeScores = scoresStore.subscribe;

export const loadAudioPreferences = audioPrefsStore.load;
export const saveAudioPreferences = audioPrefsStore.save;
export const getAudioPreferencesSnapshot = audioPrefsStore.getSnapshot;
export const getServerAudioPreferencesSnapshot =
  audioPrefsStore.getServerSnapshot;
export const subscribeAudioPreferences = audioPrefsStore.subscribe;

/**
 * Increments and persists the scoreboard for a completed win or draw.
 */
export function recordOutcomeScore(
  current: ScoreBoardData,
  winner: Player | null
): ScoreBoardData {
  const next: ScoreBoardData =
    winner === "X"
      ? { ...current, xWins: current.xWins + 1 }
      : winner === "O"
        ? { ...current, oWins: current.oWins + 1 }
        : { ...current, draws: current.draws + 1 };
  saveScores(next);
  return next;
}

/**
 * Resets stored scoreboard counts to zero without touching audio preferences.
 */
export function resetStoredScores(): ScoreBoardData {
  const fresh: ScoreBoardData = { ...DEFAULT_SCORES };
  saveScores(fresh);
  return fresh;
}
