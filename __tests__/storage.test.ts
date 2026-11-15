import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_AUDIO_PREFERENCES,
  DEFAULT_SCORES,
  SCOREBOARD_STORAGE_KEY,
  AUDIO_PREFS_STORAGE_KEY,
  loadAudioPreferences,
  loadScores,
  resetStoredScores,
  saveAudioPreferences,
  saveScores,
} from "@/lib/game/storage";

describe("localStorage persistence helpers", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("returns zeroed scores when storage is empty", () => {
    expect(loadScores()).toEqual(DEFAULT_SCORES);
  });

  it("persists and reloads valid scoreboard counts", () => {
    const scores = { xWins: 4, oWins: 2, draws: 3 };
    saveScores(scores);
    expect(loadScores()).toEqual(scores);
  });

  it("resets stored scores to zeroes without affecting audio preferences", () => {
    saveScores({ xWins: 5, oWins: 1, draws: 2 });
    saveAudioPreferences({ soundEnabled: false, voiceEnabled: true });

    const reset = resetStoredScores();
    expect(reset).toEqual(DEFAULT_SCORES);
    expect(loadScores()).toEqual(DEFAULT_SCORES);
    expect(loadAudioPreferences()).toEqual({
      soundEnabled: false,
      voiceEnabled: true,
    });
  });

  it("recovers safely from corrupted JSON or invalid field values in storage", () => {
    window.localStorage.setItem(SCOREBOARD_STORAGE_KEY, "{not-valid-json");
    expect(loadScores()).toEqual(DEFAULT_SCORES);

    window.localStorage.setItem(
      SCOREBOARD_STORAGE_KEY,
      JSON.stringify({ xWins: -3, oWins: "bad", draws: 2.9 })
    );
    expect(loadScores()).toEqual({ xWins: 0, oWins: 0, draws: 2 });
  });

  it("loads default enabled audio preferences and persists updates", () => {
    expect(loadAudioPreferences()).toEqual(DEFAULT_AUDIO_PREFERENCES);

    saveAudioPreferences({ soundEnabled: false, voiceEnabled: false });
    expect(loadAudioPreferences()).toEqual({
      soundEnabled: false,
      voiceEnabled: false,
    });

    window.localStorage.setItem(AUDIO_PREFS_STORAGE_KEY, "invalid");
    expect(loadAudioPreferences()).toEqual(DEFAULT_AUDIO_PREFERENCES);
  });

  it("handles localStorage access errors gracefully", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("SecurityError");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("QuotaExceededError");
    });

    expect(loadScores()).toEqual(DEFAULT_SCORES);
    expect(() => saveScores({ xWins: 1, oWins: 0, draws: 0 })).not.toThrow();
  });
});
