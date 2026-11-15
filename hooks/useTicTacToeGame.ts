"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { SoundEngine } from "@/lib/audio/sound-engine";
import { SpeechEngine } from "@/lib/audio/speech-engine";
import {
  createInitialGameState,
  createNextRoundState,
  getSpeechText,
  makeMove,
} from "@/lib/game/engine";
import {
  getAudioPreferencesSnapshot,
  getScoresSnapshot,
  getServerAudioPreferencesSnapshot,
  getServerScoresSnapshot,
  recordOutcomeScore,
  resetStoredScores,
  saveAudioPreferences,
  subscribeAudioPreferences,
  subscribeScores,
} from "@/lib/game/storage";
import type { AudioPreferences, GameState, ScoreBoardData } from "@/lib/game/types";

export interface UseTicTacToeGameResult {
  gameState: GameState;
  scores: ScoreBoardData;
  audioPreferences: AudioPreferences;
  selectCell: (index: number) => void;
  startNewGame: () => void;
  resetScores: () => void;
  toggleSound: () => void;
  toggleVoice: () => void;
}

/**
 * Coordinates game state transitions, localStorage persistence, and synchronized
 * sound effects / speech announcements without duplicate effect-driven re-triggers.
 */
export function useTicTacToeGame(): UseTicTacToeGameResult {
  const [gameState, setGameState] = useState<GameState>(() =>
    createInitialGameState()
  );

  const scores = useSyncExternalStore(
    subscribeScores,
    getScoresSnapshot,
    getServerScoresSnapshot
  );

  const audioPreferences = useSyncExternalStore(
    subscribeAudioPreferences,
    getAudioPreferencesSnapshot,
    getServerAudioPreferencesSnapshot
  );

  const soundEngineRef = useRef<SoundEngine | null>(null);
  const speechEngineRef = useRef<SpeechEngine | null>(null);

  const getSoundEngine = useCallback((): SoundEngine => {
    if (!soundEngineRef.current) {
      soundEngineRef.current = new SoundEngine();
    }
    return soundEngineRef.current;
  }, []);

  const getSpeechEngine = useCallback((): SpeechEngine => {
    if (!speechEngineRef.current) {
      speechEngineRef.current = new SpeechEngine();
    }
    return speechEngineRef.current;
  }, []);

  useEffect(() => {
    const sound = getSoundEngine();
    const speech = getSpeechEngine();
    sound.setEnabled(audioPreferences.soundEnabled);
    speech.setEnabled(audioPreferences.voiceEnabled);
  }, [audioPreferences.soundEnabled, audioPreferences.voiceEnabled, getSoundEngine, getSpeechEngine]);

  useEffect(() => {
    return () => {
      speechEngineRef.current?.dispose();
    };
  }, []);

  const selectCell = useCallback(
    (index: number) => {
      const result = makeMove(gameState, index);
      if (!result.applied || !result.placedPlayer) {
        return;
      }

      const nextState = result.state;
      setGameState(nextState);

      const sound = getSoundEngine();
      const speech = getSpeechEngine();
      sound.setEnabled(audioPreferences.soundEnabled);
      speech.setEnabled(audioPreferences.voiceEnabled);

      if (audioPreferences.soundEnabled) {
        sound.playCellSelect();
        sound.playMarkPlace(result.placedPlayer);
      }

      if (nextState.status === "won" && nextState.winner) {
        recordOutcomeScore(scores, nextState.winner);
        if (audioPreferences.soundEnabled) {
          sound.playWinningLine();
          sound.playVictory(nextState.winner);
        }
        if (audioPreferences.voiceEnabled) {
          speech.announce(
            getSpeechText(nextState),
            `round-${nextState.roundNumber}-won-${nextState.winner}`,
            90
          );
        }
        return;
      }

      if (nextState.status === "draw") {
        recordOutcomeScore(scores, null);
        if (audioPreferences.soundEnabled) {
          sound.playDraw();
        }
        if (audioPreferences.voiceEnabled) {
          speech.announce(
            getSpeechText(nextState),
            `round-${nextState.roundNumber}-draw`,
            90
          );
        }
        return;
      }

      if (audioPreferences.voiceEnabled) {
        speech.announce(
          getSpeechText(nextState),
          `round-${nextState.roundNumber}-move-${nextState.moveCount}`,
          110
        );
      }
    },
    [
      audioPreferences.soundEnabled,
      audioPreferences.voiceEnabled,
      gameState,
      getSoundEngine,
      getSpeechEngine,
      scores,
    ]
  );

  const startNewGame = useCallback(() => {
    const nextState = createNextRoundState(gameState);
    setGameState(nextState);

    const sound = getSoundEngine();
    const speech = getSpeechEngine();
    sound.setEnabled(audioPreferences.soundEnabled);
    speech.setEnabled(audioPreferences.voiceEnabled);

    speech.stop();
    speech.resetDedupe();

    if (audioPreferences.soundEnabled) {
      sound.playNewGame();
    }
    if (audioPreferences.voiceEnabled) {
      speech.announce(
        getSpeechText(nextState),
        `round-${nextState.roundNumber}-start`,
        110
      );
    }
  }, [
    audioPreferences.soundEnabled,
    audioPreferences.voiceEnabled,
    gameState,
    getSoundEngine,
    getSpeechEngine,
  ]);

  const resetScores = useCallback(() => {
    resetStoredScores();
    const sound = getSoundEngine();
    sound.setEnabled(audioPreferences.soundEnabled);
    if (audioPreferences.soundEnabled) {
      sound.playButtonClick();
    }
  }, [audioPreferences.soundEnabled, getSoundEngine]);

  const toggleSound = useCallback(() => {
    const nextSound = !audioPreferences.soundEnabled;
    const nextPrefs: AudioPreferences = {
      ...audioPreferences,
      soundEnabled: nextSound,
    };
    saveAudioPreferences(nextPrefs);

    const sound = getSoundEngine();
    sound.setEnabled(nextSound);
    if (nextSound) {
      sound.unlock();
      sound.playButtonClick();
    }
  }, [audioPreferences, getSoundEngine]);

  const toggleVoice = useCallback(() => {
    const nextVoice = !audioPreferences.voiceEnabled;
    const nextPrefs: AudioPreferences = {
      ...audioPreferences,
      voiceEnabled: nextVoice,
    };
    saveAudioPreferences(nextPrefs);

    const sound = getSoundEngine();
    const speech = getSpeechEngine();
    sound.setEnabled(audioPreferences.soundEnabled);
    if (audioPreferences.soundEnabled) {
      sound.playButtonClick();
    }

    speech.setEnabled(nextVoice);
    if (nextVoice) {
      speech.resetDedupe();
      speech.announce(
        getSpeechText(gameState),
        `voice-enabled-${gameState.roundNumber}-${gameState.moveCount}`,
        40
      );
    }
  }, [audioPreferences, gameState, getSoundEngine, getSpeechEngine]);

  return {
    gameState,
    scores,
    audioPreferences,
    selectCell,
    startNewGame,
    resetScores,
    toggleSound,
    toggleVoice,
  };
}
