"use client";

import type { KeyboardEvent } from "react";
import { AnimatePresence } from "motion/react";
import { getCellAriaLabel } from "@/lib/game/engine";
import type { CellValue, Player } from "@/lib/game/types";
import { GameMark } from "./GameMark";

interface GameCellProps {
  index: number;
  roundNumber: number;
  value: CellValue;
  currentTurn: Player;
  isGameOver: boolean;
  isWinningCell: boolean;
  isDraw: boolean;
  isLastMove: boolean;
  onSelect: (index: number) => void;
  onKeyNavigate: (index: number, event: KeyboardEvent<HTMLButtonElement>) => void;
  buttonRef: (el: HTMLButtonElement | null) => void;
}

/**
 * Accessible, tactile 3x3 board cell with gated hover preview,
 * winning highlight treatment, and distinct draw state styling.
 */
export function GameCell({
  index,
  roundNumber,
  value,
  currentTurn,
  isGameOver,
  isWinningCell,
  isDraw,
  isLastMove,
  onSelect,
  onKeyNavigate,
  buttonRef,
}: GameCellProps) {
  const isPlayable = value === null && !isGameOver;
  const isDimmedForWin = isGameOver && !isDraw && !isWinningCell;

  const cellAccentStyle =
    isDraw || isDimmedForWin || value === null
      ? undefined
      : value === "X"
        ? isWinningCell
          ? {
              borderColor: "rgba(22, 93, 252, 0.45)",
              boxShadow:
                "0 0 0 1px rgba(22, 93, 252, 0.22), 0 12px 26px -10px rgba(22, 93, 252, 0.34)",
            }
          : {
              borderColor: "rgba(22, 93, 252, 0.22)",
              boxShadow: "0 0 14px -4px rgba(22, 93, 252, 0.2)",
            }
        : isWinningCell
          ? {
              borderColor: "rgba(216, 34, 48, 0.45)",
              boxShadow:
                "0 0 0 1px rgba(216, 34, 48, 0.22), 0 12px 26px -10px rgba(216, 34, 48, 0.34)",
            }
          : {
              borderColor: "rgba(216, 34, 48, 0.22)",
              boxShadow: "0 0 14px -4px rgba(216, 34, 48, 0.2)",
            };

  return (
    <button
      ref={buttonRef}
      type="button"
      data-testid={`cell-${index}`}
      data-playable={isPlayable ? "true" : "false"}
      data-turn={currentTurn}
      data-winning={isWinningCell ? "true" : "false"}
      data-last-move={isLastMove ? "true" : "false"}
      aria-label={getCellAriaLabel(index, value, isGameOver, isWinningCell)}
      aria-disabled={!isPlayable}
      onClick={() => {
        if (isPlayable) {
          onSelect(index);
        }
      }}
      onKeyDown={(event) => onKeyNavigate(index, event)}
      style={cellAccentStyle}
      className={[
        "interactive-cell group relative flex aspect-square w-full items-center justify-center rounded-[15px] border select-none transition-[border-color,box-shadow,background-color,opacity] duration-200",
        isPlayable ? "cursor-pointer" : "cursor-default",
        isDraw
          ? "border-black/[0.06] bg-surface-draw opacity-80"
          : isWinningCell
            ? "z-10 bg-surface"
            : isDimmedForWin
              ? "border-black/[0.06] bg-surface opacity-45"
              : "border-black/[0.08] bg-surface",
      ].join(" ")}
    >
      <AnimatePresence mode="popLayout">
        {value !== null && (
          <GameMark
            key={`round-${roundNumber}-cell-${index}-${value}`}
            player={value}
            isWinning={isWinningCell}
          />
        )}
      </AnimatePresence>

      {isPlayable && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-150 [@media(hover:hover)_and_(pointer:fine)]:group-hover:opacity-[0.18]"
        >
          <GameMark player={currentTurn} variant="ghost" />
        </span>
      )}
    </button>
  );
}
