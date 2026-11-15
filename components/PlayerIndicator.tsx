"use client";

import { motion, useReducedMotion } from "motion/react";
import type { GameOutcomeStatus, Player } from "@/lib/game/types";

interface PlayerIndicatorProps {
  currentPlayer: Player;
  status: GameOutcomeStatus;
  winner: Player | null;
}

/**
 * Dual-player turn & winner rail with smooth gliding selection frame
 * and subtle Electric Blue / Vibrant Red ambient glow.
 */
export function PlayerIndicator({
  currentPlayer,
  status,
  winner,
}: PlayerIndicatorProps) {
  const shouldReduceMotion = useReducedMotion();
  const isDraw = status === "draw";
  const activePlayer: Player = status === "won" && winner ? winner : currentPlayer;

  const sliderStyle =
    activePlayer === "X"
      ? {
          borderColor: "rgba(22, 93, 252, 0.3)",
          boxShadow: "0 4px 16px -6px rgba(22, 93, 252, 0.25)",
        }
      : {
          borderColor: "rgba(216, 34, 48, 0.3)",
          boxShadow: "0 4px 16px -6px rgba(216, 34, 48, 0.25)",
        };

  return (
    <div
      aria-label="Player turn indicator"
      className="relative grid w-full max-w-[300px] grid-cols-2 rounded-[14px] border border-black/[0.08] bg-surface-subtle p-1"
    >
      {!isDraw && (
        <motion.div
          aria-hidden="true"
          style={sliderStyle}
          animate={{
            transform:
              activePlayer === "X" ? "translateX(0%)" : "translateX(100%)",
          }}
          transition={
            shouldReduceMotion
              ? { duration: 0.12 }
              : { type: "spring", duration: 0.34, bounce: 0.14 }
          }
          className="pointer-events-none absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-[10px] border bg-surface"
        />
      )}

      <div
        className={[
          "relative z-10 flex items-center justify-center gap-2 py-2 text-sm font-medium transition-colors duration-200",
          isDraw
            ? "text-ink-muted"
            : activePlayer === "X"
              ? "text-blue-player"
              : "text-ink-secondary",
        ].join(" ")}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-3.5 w-3.5 text-blue-player"
          fill="none"
        >
          <path
            d="M6 6L18 18M18 6L6 18"
            stroke="currentColor"
            strokeWidth="2.8"
            strokeLinecap="round"
          />
        </svg>
        <span>Blue</span>
      </div>

      <div
        className={[
          "relative z-10 flex items-center justify-center gap-2 py-2 text-sm font-medium transition-colors duration-200",
          isDraw
            ? "text-ink-muted"
            : activePlayer === "O"
              ? "text-red-player"
              : "text-ink-secondary",
        ].join(" ")}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-3.5 w-3.5 text-red-player"
          fill="none"
        >
          <circle
            cx="12"
            cy="12"
            r="6.5"
            stroke="currentColor"
            strokeWidth="2.8"
          />
        </svg>
        <span>Red</span>
      </div>
    </div>
  );
}
