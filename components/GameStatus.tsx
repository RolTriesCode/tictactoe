"use client";

import { motion, useReducedMotion } from "motion/react";
import { getSpeechText, getStatusLabel } from "@/lib/game/engine";
import type { GameState } from "@/lib/game/types";

interface GameStatusProps {
  gameState: GameState;
}

/**
 * Dynamic, animated game status console with distinct treatments for active turns,
 * player wins, and draws, paired with a single polite screen-reader live region.
 */
export function GameStatus({ gameState }: GameStatusProps) {
  const shouldReduceMotion = useReducedMotion();
  const label = getStatusLabel(gameState);
  const speechAnnouncement = getSpeechText(gameState);

  const isWon = gameState.status === "won";
  const isDraw = gameState.status === "draw";
  const activeColor = isDraw
    ? "bg-ink-secondary"
    : (isWon ? gameState.winner : gameState.currentPlayer) === "X"
      ? "bg-blue-player"
      : "bg-red-player";

  const textColor = isDraw
    ? "text-ink-secondary"
    : (isWon ? gameState.winner : gameState.currentPlayer) === "X"
      ? "text-blue-player"
      : "text-red-player";

  const statusKey = `${gameState.roundNumber}-${gameState.status}-${gameState.currentPlayer}-${gameState.winner ?? "none"}`;

  return (
    <div className="flex min-h-[36px] flex-col items-center justify-center">
      <motion.div
        key={statusKey}
        data-testid="game-status"
        initial={
          shouldReduceMotion
            ? { opacity: 0.6 }
            : {
                opacity: 0.35,
                transform: isWon
                  ? "scale(0.95) translateY(5px)"
                  : "translateY(4px)",
              }
        }
        animate={
          shouldReduceMotion
            ? { opacity: 1 }
            : {
                opacity: 1,
                transform: "scale(1) translateY(0px)",
              }
        }
        transition={{
          duration: shouldReduceMotion ? 0.1 : 0.18,
          ease: [0.23, 1, 0.32, 1],
        }}
        className="flex items-center gap-2.5"
      >
        <span
          aria-hidden="true"
          className={[
            "inline-block h-2 w-2 rounded-full transition-colors duration-200",
            activeColor,
          ].join(" ")}
        />
        <p
          className={[
            "text-base sm:text-lg font-semibold tracking-[0.06em]",
            textColor,
          ].join(" ")}
        >
          {label}
        </p>
      </motion.div>

      {/* Single centralized polite live region so screen readers receive accurate turn/end updates */}
      <p
        aria-live="polite"
        aria-atomic="true"
        data-testid="sr-game-status"
        className="sr-only"
      >
        {speechAnnouncement}
      </p>
    </div>
  );
}
