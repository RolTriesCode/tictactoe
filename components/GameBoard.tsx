"use client";

import { useRef, type KeyboardEvent } from "react";
import { AnimatePresence } from "motion/react";
import type { GameState } from "@/lib/game/types";
import { GameCell } from "./GameCell";
import { VictoryAnimation } from "./VictoryAnimation";

interface GameBoardProps {
  gameState: GameState;
  onSelectCell: (index: number) => void;
}

/**
 * Architectural 3x3 board housing 9 interactive cells, 2D keyboard arrow navigation,
 * winning line SVG overlay, and distinct draw state visual settling.
 */
export function GameBoard({ gameState, onSelectCell }: GameBoardProps) {
  const gridRef = useRef<HTMLDivElement | null>(null);
  const cellRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const isGameOver = gameState.status !== "playing";
  const isDraw = gameState.status === "draw";
  const winningSet = new Set<number>(gameState.winningLine ?? []);

  const handleKeyNavigate = (
    index: number,
    event: KeyboardEvent<HTMLButtonElement>
  ) => {
    const row = Math.floor(index / 3);
    const col = index % 3;
    let nextIndex: number | null = null;

    switch (event.key) {
      case "ArrowRight":
        nextIndex = row * 3 + ((col + 1) % 3);
        break;
      case "ArrowLeft":
        nextIndex = row * 3 + ((col + 2) % 3);
        break;
      case "ArrowDown":
        nextIndex = ((row + 1) % 3) * 3 + col;
        break;
      case "ArrowUp":
        nextIndex = ((row + 2) % 3) * 3 + col;
        break;
      case "Home":
        nextIndex = 0;
        break;
      case "End":
        nextIndex = 8;
        break;
      default:
        return;
    }

    event.preventDefault();
    cellRefs.current[nextIndex]?.focus();
  };

  const frameShadowStyle =
    gameState.status === "won"
      ? gameState.winner === "X"
        ? {
            boxShadow:
              "0 18px 44px -18px rgba(22, 93, 252, 0.24), 0 1px 3px rgba(20, 20, 22, 0.05)",
            borderColor: "rgba(22, 93, 252, 0.22)",
          }
        : {
            boxShadow:
              "0 18px 44px -18px rgba(216, 34, 48, 0.24), 0 1px 3px rgba(20, 20, 22, 0.05)",
            borderColor: "rgba(216, 34, 48, 0.22)",
          }
      : gameState.status === "draw"
        ? {
            boxShadow: "0 8px 24px -16px rgba(20, 20, 22, 0.12)",
            borderColor: "rgba(20, 20, 22, 0.12)",
          }
        : gameState.currentPlayer === "X"
          ? {
              boxShadow:
                "0 14px 36px -20px rgba(22, 93, 252, 0.18), 0 2px 6px rgba(20, 20, 22, 0.04)",
            }
          : {
              boxShadow:
                "0 14px 36px -20px rgba(216, 34, 48, 0.18), 0 2px 6px rgba(20, 20, 22, 0.04)",
            };

  return (
    <div
      style={frameShadowStyle}
      className="board-frame relative w-full max-w-[396px] sm:max-w-[440px] rounded-[26px] border border-black/[0.08] bg-surface p-3 sm:p-3.5 transition-[box-shadow,border-color] duration-300"
    >
      <div
        ref={gridRef}
        role="group"
        aria-label="Tic-Tac-Toe 3 by 3 board"
        className="relative grid grid-cols-3 grid-rows-3 gap-2.5 sm:gap-3"
      >
        {gameState.board.map((value, index) => (
          <GameCell
            key={index}
            index={index}
            roundNumber={gameState.roundNumber}
            value={value}
            currentTurn={gameState.currentPlayer}
            isGameOver={isGameOver}
            isWinningCell={winningSet.has(index)}
            isDraw={isDraw}
            isLastMove={gameState.lastMoveIndex === index}
            onSelect={onSelectCell}
            onKeyNavigate={handleKeyNavigate}
            buttonRef={(el) => {
              cellRefs.current[index] = el;
            }}
          />
        ))}

        <AnimatePresence>
          {gameState.status === "won" &&
            gameState.winningLine !== null &&
            gameState.winner !== null && (
              <VictoryAnimation
                key={`win-line-${gameState.roundNumber}`}
                gridRef={gridRef}
                cellRefs={cellRefs}
                winningLine={gameState.winningLine}
                winner={gameState.winner}
              />
            )}
        </AnimatePresence>
      </div>
    </div>
  );
}
