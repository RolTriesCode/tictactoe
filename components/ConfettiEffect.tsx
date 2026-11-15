"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";
import type { Player } from "@/lib/game/types";

interface ConfettiEffectProps {
  active: boolean;
  winner: Player | null;
  triggerKey: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  rotation: number;
  vRot: number;
  color: string;
  alpha: number;
  shape: "rect" | "circle";
}

const BLUE_PALETTE = ["#165dfc", "#3b82f6", "#93c5fd", "#141416", "#e4e4e7"];
const RED_PALETTE = ["#d82230", "#ef4444", "#fda4af", "#141416", "#e4e4e7"];

/**
 * Tasteful, lightweight canvas confetti burst aligned with the winning player's palette.
 * Automatically disabled when prefers-reduced-motion is active and cleared on reset.
 */
export function ConfettiEffect({
  active,
  winner,
  triggerKey,
}: ConfettiEffectProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    if (!active || !winner || shouldReduceMotion) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const palette = winner === "X" ? BLUE_PALETTE : RED_PALETTE;
    const originX = width * 0.5;
    const originY = Math.min(height * 0.28, 220);

    const particles: Particle[] = Array.from({ length: 48 }, (_, idx) => {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.9;
      const speed = 4.5 + Math.random() * 6.5;
      return {
        x: originX + (Math.random() - 0.5) * 44,
        y: originY + (Math.random() - 0.5) * 16,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.2,
        width: 5 + Math.random() * 5,
        height: 4 + Math.random() * 4,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.22,
        color: palette[idx % palette.length],
        alpha: 1,
        shape: idx % 4 === 0 ? "circle" : "rect",
      };
    });

    let rafId = 0;
    const startTime = performance.now();
    const maxDurationMs = 1900;

    const frame = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / maxDurationMs);

      ctx.clearRect(0, 0, width, height);

      let alive = false;
      for (const p of particles) {
        p.vy += 0.26;
        p.vx *= 0.985;
        p.vy *= 0.99;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.vRot;
        p.alpha = progress > 0.55 ? Math.max(0, 1 - (progress - 0.55) / 0.45) : 1;

        if (p.alpha > 0.01 && p.y < height + 24) {
          alive = true;
          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.fillStyle = p.color;

          if (p.shape === "circle") {
            ctx.beginPath();
            ctx.arc(0, 0, p.width * 0.45, 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);
          }

          ctx.restore();
        }
      }

      if (alive && elapsed < maxDurationMs) {
        rafId = window.requestAnimationFrame(frame);
      } else {
        ctx.clearRect(0, 0, width, height);
      }
    };

    rafId = window.requestAnimationFrame(frame);

    return () => {
      window.cancelAnimationFrame(rafId);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [active, winner, triggerKey, shouldReduceMotion]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      data-testid="confetti-canvas"
      className="pointer-events-none fixed inset-0 z-50 h-full w-full"
    />
  );
}
