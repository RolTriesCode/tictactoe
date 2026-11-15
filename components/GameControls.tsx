"use client";

import { RotateCcw } from "lucide-react";
import type { GameOutcomeStatus, Player } from "@/lib/game/types";

interface GameControlsProps {
  status: GameOutcomeStatus;
  winner: Player | null;
  hasScores: boolean;
  onNewGame: () => void;
  onResetScores: () => void;
}

/**
 * Primary New Game action paired with a visually distinct, separated Reset Scoreboard control.
 */
export function GameControls({
  status,
  winner,
  hasScores,
  onNewGame,
  onResetScores,
}: GameControlsProps) {
  const isFinished = status !== "playing";

  const newGameAccentStyle =
    status === "won" && winner === "X"
      ? { boxShadow: "0 10px 24px -10px rgba(22, 93, 252, 0.45)" }
      : status === "won" && winner === "O"
        ? { boxShadow: "0 10px 24px -10px rgba(216, 34, 48, 0.45)" }
        : undefined;

  return (
    <div className="flex w-full max-w-[396px] sm:max-w-[440px] flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
      <button
        type="button"
        data-testid="new-game-btn"
        style={newGameAccentStyle}
        onClick={onNewGame}
        className={[
          "tactile-button group inline-flex min-h-[46px] flex-1 items-center justify-center gap-2 rounded-[14px] px-5 py-2.5 text-base font-medium text-white cursor-pointer",
          isFinished
            ? "bg-ink hover:bg-ink/90"
            : "bg-ink/92 hover:bg-ink",
        ].join(" ")}
      >
        <RotateCcw
          aria-hidden="true"
          className="h-4 w-4 transition-transform duration-200 ease-out group-hover:-rotate-45 group-active:-rotate-90"
        />
        <span>New Game</span>
      </button>

      <button
        type="button"
        data-testid="reset-scores-btn"
        aria-label="Reset scoreboard"
        onClick={onResetScores}
        className={[
          "tactile-button inline-flex min-h-[46px] items-center justify-center rounded-[14px] border border-black/[0.1] bg-surface px-4 py-2.5 text-sm font-medium cursor-pointer transition-colors",
          hasScores
            ? "text-ink-secondary hover:border-black/[0.2] hover:text-ink"
            : "text-ink-muted hover:border-black/[0.16] hover:text-ink-secondary",
        ].join(" ")}
      >
        Reset Scoreboard
      </button>
    </div>
  );
}
