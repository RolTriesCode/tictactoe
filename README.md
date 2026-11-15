# Tic-Tac-Toe

A minimal, editorial-grade two-player Tic-Tac-Toe web application built with **Next.js 16 (App Router)**, **React 19**, **TypeScript**, **Tailwind CSS v4**, and **Motion**.

## Features

- **Core Gameplay**: Complete 3×3 two-player game detecting all eight winning combinations and draws, blocking occupied/post-game cells, supporting consecutive rounds, and separating **New Game** from **Reset Scoreboard**.
- **Consistent Player Identities**: **Player X** is rendered in Electric Blue (`#165dfc`) and **Player O** in Vibrant Red (`#d82230`) across placed marks, subtle cell glows, turn indicators, status banners, winning strike lines, confetti, and scoreboard accents.
- **Motion & Tactile Polish**: Staggered entrance reveal, SVG stroke-drawing marks with spring scale, measured-center SVG winning line, restrained canvas confetti, distinct subdued draw treatment, and full `prefers-reduced-motion` support.
- **Web Audio & Web Speech**: Synthesized Web Audio API sound effects (cell selection, mark placement, winning line, victory, draw, reset, UI feedback) and natural-voice `speechSynthesis` announcements (`"Blue's turn!"`, `"Red's turn!"`, `"Blue wins!"`, `"Red wins!"`, `"It's a draw!"`) with `localStorage` persistence, instant cancellation on disable, and autoplay compliance.
- **Accessibility & Responsiveness**: 2D arrow-key board navigation, `aria-label` cell states, single polite `aria-live` status region, WCAG AA contrast, and responsive layouts across desktop, tablet, and mobile.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Verification

```bash
npm test              # Vitest unit & UI integration tests (34 tests)
npx tsc --noEmit      # Strict TypeScript check
npm run lint          # ESLint
npm run build         # Production Next.js build
npx playwright test   # End-to-end tests in headless Chrome (requires server on :3100)
```

## Deployment

This project builds cleanly as a static Next.js App Router bundle (`npm run build`) and is ready to deploy to Vercel or any Node/static-compatible hosting platform.
# tictactoe
