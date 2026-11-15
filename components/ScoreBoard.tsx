"use client";

import { motion, useReducedMotion } from "motion/react";
import type { GameOutcomeStatus, Player, ScoreBoardData } from "@/lib/game/types";

interface ScoreBoardProps {
  scores: ScoreBoardData;
  currentPlayer: Player;
  status: GameOutcomeStatus;
  winner: Player | null;
}

interface ScoreColumnProps {
  label: string;
  sublabel: string;
  value: number;
  testId: string;
  accentBarClass: string;
  isHighlighted: boolean;
  highlightColor?: "blue" | "red" | "neutral";
}

function ScoreColumn({
  label,
  sublabel,
  value,
  testId,
  accentBarClass,
  isHighlighted,
  highlightColor = "neutral",
}: ScoreColumnProps) {
  const shouldReduceMotion = useReducedMotion();

  const highlightStyle =
    isHighlighted && highlightColor === "blue"
      ? {
          borderColor: "rgba(22, 93, 252, 0.32)",
          boxShadow: "0 8px 20px -12px rgba(22, 93, 252, 0.28)",
        }
      : isHighlighted && highlightColor === "red"
        ? {
            borderColor: "rgba(216, 34, 48, 0.32)",
            boxShadow: "0 8px 20px -12px rgba(216, 34, 48, 0.28)",
          }
        : isHighlighted
          ? {
              borderColor: "rgba(20, 20, 22, 0.2)",
            }
          : undefined;

  return (
    <div
      style={highlightStyle}
      className="relative overflow-hidden rounded-[14px] border border-black/[0.08] bg-surface px-3 py-3 sm:px-4 sm:py-3.5 transition-[border-color,box-shadow] duration-200"
    >
      <div
        aria-hidden="true"
        className={`absolute top-0 right-0 left-0 h-[2.5px] ${accentBarClass}`}
      />
      <div className="flex items-baseline justify-between gap-1">
        <span className="text-xs sm:text-sm font-medium text-ink-secondary">
          {label}
        </span>
        <span className="text-xs font-normal text-ink-muted">{sublabel}</span>
      </div>

      <div className="mt-1.5 h-8 overflow-hidden">
        <motion.span
          key={value}
          data-testid={testId}
          initial={
            shouldReduceMotion
              ? false
              : { opacity: 0.35, transform: "translateY(8px)" }
          }
          animate={{ opacity: 1, transform: "translateY(0px)" }}
          transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
          className="tabular-clean inline-block text-2xl sm:text-[28px] leading-8 font-semibold tracking-tight text-ink"
        >
          {value}
        </motion.span>
      </div>
    </div>
  );
}

/**
 * Clean 3-column architectural scoreboard with animated score increments
 * and unslashed tabular numerals.
 */
export function ScoreBoard({
  scores,
  currentPlayer,
  status,
  winner,
}: ScoreBoardProps) {
  const blueActive =
    (status === "playing" && currentPlayer === "X") ||
    (status === "won" && winner === "X");
  const redActive =
    (status === "playing" && currentPlayer === "O") ||
    (status === "won" && winner === "O");
  const drawActive = status === "draw";

  return (
    <section
      aria-label="Scoreboard"
      className="grid w-full max-w-[396px] sm:max-w-[440px] grid-cols-3 gap-2.5 sm:gap-3"
    >
      <ScoreColumn
        label="Blue"
        sublabel="X"
        value={scores.xWins}
        testId="score-x"
        accentBarClass="bg-blue-player"
        isHighlighted={blueActive}
        highlightColor="blue"
      />
      <ScoreColumn
        label="Draws"
        sublabel="Tie"
        value={scores.draws}
        testId="score-draws"
        accentBarClass="bg-black/[0.2]"
        isHighlighted={drawActive}
        highlightColor="neutral"
      />
      <ScoreColumn
        label="Red"
        sublabel="O"
        value={scores.oWins}
        testId="score-o"
        accentBarClass="bg-red-player"
        isHighlighted={redActive}
        highlightColor="red"
      />
    </section>
  );
}
