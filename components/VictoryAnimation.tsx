"use client";

import { useLayoutEffect, useState, type RefObject } from "react";
import { motion, useReducedMotion } from "motion/react";
import type { Player, WinningLine } from "@/lib/game/types";

interface VictoryAnimationProps {
  gridRef: RefObject<HTMLDivElement | null>;
  cellRefs: RefObject<(HTMLButtonElement | null)[]>;
  winningLine: WinningLine;
  winner: Player;
}

interface LineCoordinates {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  width: number;
  height: number;
}

function computeFallbackCoordinates(
  line: WinningLine,
  width: number,
  height: number
): LineCoordinates {
  const centers = [0.158, 0.5, 0.842];
  const start = line[0];
  const end = line[2];
  const x1 = centers[start % 3] * width;
  const y1 = centers[Math.floor(start / 3)] * height;
  const x2 = centers[end % 3] * width;
  const y2 = centers[Math.floor(end / 3)] * height;

  return extendEndpoints(x1, y1, x2, y2, width, height);
}

function extendEndpoints(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  width: number,
  height: number
): LineCoordinates {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const overhang = Math.min(width, height) * 0.085;
  const ux = (dx / len) * overhang;
  const uy = (dy / len) * overhang;

  return {
    x1: x1 - ux,
    y1: y1 - uy,
    x2: x2 + ux,
    y2: y2 + uy,
    width,
    height,
  };
}

/**
 * Draws an animated SVG strike line directly through the measured centers
 * of the three winning cells for pixel-accurate alignment at any viewport.
 */
export function VictoryAnimation({
  gridRef,
  cellRefs,
  winningLine,
  winner,
}: VictoryAnimationProps) {
  const shouldReduceMotion = useReducedMotion();
  const [coords, setCoords] = useState<LineCoordinates>(() =>
    computeFallbackCoordinates(winningLine, 360, 360)
  );

  useLayoutEffect(() => {
    const gridEl = gridRef.current;
    if (!gridEl) {
      return;
    }

    const measure = () => {
      const gridRect = gridEl.getBoundingClientRect();
      if (gridRect.width <= 0 || gridRect.height <= 0) {
        return;
      }

      const startEl = cellRefs.current[winningLine[0]];
      const endEl = cellRefs.current[winningLine[2]];

      if (startEl && endEl) {
        const startRect = startEl.getBoundingClientRect();
        const endRect = endEl.getBoundingClientRect();

        if (startRect.width > 0 && endRect.width > 0) {
          const x1 = startRect.left - gridRect.left + startRect.width / 2;
          const y1 = startRect.top - gridRect.top + startRect.height / 2;
          const x2 = endRect.left - gridRect.left + endRect.width / 2;
          const y2 = endRect.top - gridRect.top + endRect.height / 2;
          setCoords(
            extendEndpoints(x1, y1, x2, y2, gridRect.width, gridRect.height)
          );
          return;
        }
      }

      setCoords(
        computeFallbackCoordinates(winningLine, gridRect.width, gridRect.height)
      );
    };

    measure();

    if (typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver(measure);
    observer.observe(gridEl);
    return () => observer.disconnect();
  }, [cellRefs, gridRef, winningLine]);

  const strokeColor = winner === "X" ? "var(--blue-player)" : "var(--red-player)";

  return (
    <motion.svg
      aria-hidden="true"
      data-testid="winning-line"
      viewBox={`0 0 ${coords.width} ${coords.height}`}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.12, ease: "easeOut" } }}
      className="pointer-events-none absolute inset-0 z-20 h-full w-full overflow-visible"
    >
      {/* Subtle ambient halo stroke behind the crisp core line */}
      <motion.line
        x1={coords.x1}
        y1={coords.y1}
        x2={coords.x2}
        y2={coords.y2}
        stroke={strokeColor}
        strokeOpacity={0.22}
        strokeWidth={14}
        strokeLinecap="round"
        initial={shouldReduceMotion ? false : { pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{
          duration: shouldReduceMotion ? 0 : 0.36,
          ease: [0.23, 1, 0.32, 1],
        }}
      />
      <motion.line
        x1={coords.x1}
        y1={coords.y1}
        x2={coords.x2}
        y2={coords.y2}
        stroke={strokeColor}
        strokeWidth={6}
        strokeLinecap="round"
        initial={shouldReduceMotion ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{
          duration: shouldReduceMotion ? 0 : 0.34,
          ease: [0.23, 1, 0.32, 1],
        }}
      />
    </motion.svg>
  );
}
