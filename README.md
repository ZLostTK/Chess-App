# Ajedrez — Chess App

Expo (SDK 54) chess application built on top of `@og-nav/expo-chessboard`. Features three game modes, Stockfish engine integration, i18n (en/es), dark mode, and a comprehensive smoke-test suite for manual QA.

## Modes

- **Random Bot** — opponent plays random legal moves
- **Stockfish** — play against a real chess engine (WASM via WebView) with adjustable skill level (0–20)
- **1v1 Local** — two players on the same device; board flips after each move

## Setup

```bash
pnpm install
npx expo run:ios    # or `npx expo run:android`
```

## Structure

- `app/(tabs)/play/` — game screen (mode selector + play session)
- `app/(tabs)/smoke/` — 24+ self-contained test cards exercising every chessboard feature
- `lib/stockfish-engine.ts` / `lib/stockfish-webview.tsx` — Stockfish UCI communication
- `lib/random-bot.ts` — random move picker
- `lib/i18n.tsx` — Spanish/English translation provider
- `components/` — reusable UI components (haptic tab, smoke card, body scroll view)
- `constants/theme.ts` — light/dark color definitions

## Tech Stack

Expo SDK 54, React Native 0.81, expo-router (native tabs), Reanimated 4, Gesture Handler 2, chess.ts, Stockfish WASM, expo-audio, expo-haptics.

---

*README adaptado del template original de `@og-nav/expo-chessboard/example`.*
