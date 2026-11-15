"use client";

import { motion, MotionConfig, useReducedMotion } from "motion/react";
import { useTicTacToeGame } from "@/hooks/useTicTacToeGame";
import { AudioSettings } from "./AudioSettings";
import { ConfettiEffect } from "./ConfettiEffect";
import { GameBoard } from "./GameBoard";
import { GameControls } from "./GameControls";
import { GameStatus } from "./GameStatus";
import { PlayerIndicator } from "./PlayerIndicator";
import { ScoreBoard } from "./ScoreBoard";

const ENTRANCE_EASE = [0.23, 1, 0.32, 1] as const;

/**
 * Top-level client game studio orchestrating staggered entrance choreography,
 * responsive editorial composition, live game state, scoreboard, and audio settings.
 */
export function Game() {
  const {
    gameState,
    scores,
    audioPreferences,
    selectCell,
    startNewGame,
    resetScores,
    toggleSound,
    toggleVoice,
  } = useTicTacToeGame();

  const shouldReduceMotion = useReducedMotion();
  const hasScores = scores.xWins > 0 || scores.oWins > 0 || scores.draws > 0;

  const enterInitial = (offsetY: number) =>
    shouldReduceMotion
      ? { opacity: 0 }
      : { opacity: 0, transform: `translateY(${offsetY}px) scale(0.985)` };

  const enterTarget = shouldReduceMotion
    ? { opacity: 1 }
    : { opacity: 1, transform: "translateY(0px) scale(1)" };

  const enterTransition = (delay: number) =>
    shouldReduceMotion
      ? { duration: 0.14 }
      : { duration: 0.34, delay, ease: ENTRANCE_EASE };

  return (
    <MotionConfig reducedMotion="user">
      <div className="relative flex min-h-[100dvh] w-full flex-col justify-between px-4 py-5 sm:px-6 sm:py-8">
        <ConfettiEffect
          active={gameState.status === "won"}
          winner={gameState.winner}
          triggerKey={gameState.roundNumber}
        />

        <motion.header
          initial={enterInitial(8)}
          animate={enterTarget}
          transition={enterTransition(0)}
          className="mx-auto flex w-full max-w-[680px] flex-wrap items-center justify-between gap-3"
        >
          <div className="flex items-baseline gap-2.5">
            <h1 className="text-xl sm:text-2xl font-semibold tracking-[-0.02em] text-ink">
              Tic-Tac-Toe
            </h1>
            <span className="tabular-clean text-sm font-normal text-ink-muted">
              Round {String(gameState.roundNumber).padStart(2, "0")}
            </span>
          </div>

          <AudioSettings
            preferences={audioPreferences}
            onToggleSound={toggleSound}
            onToggleVoice={toggleVoice}
          />
        </motion.header>

        <main className="mx-auto flex w-full max-w-[520px] flex-1 flex-col items-center justify-center gap-5 sm:gap-6 py-4 sm:py-6">
          <motion.div
            initial={enterInitial(10)}
            animate={enterTarget}
            transition={enterTransition(0.05)}
            className="flex w-full flex-col items-center gap-3"
          >
            <PlayerIndicator
              currentPlayer={gameState.currentPlayer}
              status={gameState.status}
              winner={gameState.winner}
            />
            <GameStatus gameState={gameState} />
          </motion.div>

          <motion.div
            initial={enterInitial(12)}
            animate={enterTarget}
            transition={enterTransition(0.09)}
            className="flex w-full justify-center"
          >
            <GameBoard gameState={gameState} onSelectCell={selectCell} />
          </motion.div>

          <motion.div
            initial={enterInitial(12)}
            animate={enterTarget}
            transition={enterTransition(0.14)}
            className="flex w-full justify-center"
          >
            <ScoreBoard
              scores={scores}
              currentPlayer={gameState.currentPlayer}
              status={gameState.status}
              winner={gameState.winner}
            />
          </motion.div>

          <motion.div
            initial={enterInitial(10)}
            animate={enterTarget}
            transition={enterTransition(0.18)}
            className="flex w-full justify-center"
          >
            <GameControls
              status={gameState.status}
              winner={gameState.winner}
              hasScores={hasScores}
              onNewGame={startNewGame}
              onResetScores={resetScores}
            />
          </motion.div>
        </main>

        <footer className="mx-auto w-full max-w-[680px] text-center">
          <p className="text-xs font-normal text-ink-muted">
            Two-player local match — arrow keys or click to play
          </p>
        </footer>
      </div>
    </MotionConfig>
  );
}
