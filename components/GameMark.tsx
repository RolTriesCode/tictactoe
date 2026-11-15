"use client";

import { motion, useReducedMotion } from "motion/react";
import type { Player } from "@/lib/game/types";

interface GameMarkProps {
  player: Player;
  variant?: "placed" | "ghost";
  isWinning?: boolean;
}

const STROKE_EASE = [0.23, 1, 0.32, 1] as const;

/**
 * Precision SVG mark for Electric Blue (X) and Vibrant Red (O)
 * with stroke-drawing animation and spring-scale entrance.
 */
export function GameMark({
  player,
  variant = "placed",
  isWinning = false,
}: GameMarkProps) {
  const shouldReduceMotion = useReducedMotion();
  const colorClass = player === "X" ? "text-blue-player" : "text-red-player";
  const glowStyle =
    variant === "ghost"
      ? undefined
      : {
          filter:
            player === "X"
              ? isWinning
                ? "drop-shadow(0 0 10px rgba(22, 93, 252, 0.36))"
                : "drop-shadow(0 0 6px rgba(22, 93, 252, 0.22))"
              : isWinning
                ? "drop-shadow(0 0 10px rgba(216, 34, 48, 0.36))"
                : "drop-shadow(0 0 6px rgba(216, 34, 48, 0.22))",
        };

  if (variant === "ghost") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 100 100"
        className={`h-[56%] w-[56%] ${colorClass} pointer-events-none select-none`}
        fill="none"
      >
        {player === "X" ? (
          <>
            <line
              x1="24"
              y1="24"
              x2="76"
              y2="76"
              stroke="currentColor"
              strokeWidth="10"
              strokeLinecap="round"
            />
            <line
              x1="76"
              y1="24"
              x2="24"
              y2="76"
              stroke="currentColor"
              strokeWidth="10"
              strokeLinecap="round"
            />
          </>
        ) : (
          <circle
            cx="50"
            cy="50"
            r="27"
            stroke="currentColor"
            strokeWidth="10"
            strokeLinecap="round"
          />
        )}
      </svg>
    );
  }

  return (
    <motion.div
      className={`flex h-full w-full items-center justify-center transition-colors duration-200 ${colorClass}`}
      style={glowStyle}
      initial={
        shouldReduceMotion
          ? { opacity: 0 }
          : { opacity: 0.35, transform: "scale(0.86)" }
      }
      animate={
        shouldReduceMotion
          ? { opacity: 1 }
          : {
              opacity: 1,
              transform: isWinning ? "scale(1.04)" : "scale(1)",
            }
      }
      exit={
        shouldReduceMotion
          ? { opacity: 0 }
          : { opacity: 0, transform: "scale(0.9)" }
      }
      transition={
        shouldReduceMotion
          ? { duration: 0.14 }
          : {
              type: "spring",
              duration: 0.36,
              bounce: 0.24,
              opacity: { duration: 0.15, ease: "easeOut" },
            }
      }
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 100 100"
        className="h-[58%] w-[58%] overflow-visible"
        fill="none"
      >
        {player === "X" ? (
          <>
            <motion.line
              x1="24"
              y1="24"
              x2="76"
              y2="76"
              stroke="currentColor"
              strokeWidth="10"
              strokeLinecap="round"
              initial={shouldReduceMotion ? false : { pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{
                duration: shouldReduceMotion ? 0 : 0.17,
                ease: STROKE_EASE,
              }}
            />
            <motion.line
              x1="76"
              y1="24"
              x2="24"
              y2="76"
              stroke="currentColor"
              strokeWidth="10"
              strokeLinecap="round"
              initial={shouldReduceMotion ? false : { pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{
                delay: shouldReduceMotion ? 0 : 0.06,
                duration: shouldReduceMotion ? 0 : 0.17,
                ease: STROKE_EASE,
              }}
            />
          </>
        ) : (
          <motion.circle
            cx="50"
            cy="50"
            r="27"
            transform="rotate(-90 50 50)"
            stroke="currentColor"
            strokeWidth="10"
            strokeLinecap="round"
            initial={shouldReduceMotion ? false : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{
              duration: shouldReduceMotion ? 0 : 0.25,
              ease: STROKE_EASE,
            }}
          />
        )}
      </svg>
    </motion.div>
  );
}
