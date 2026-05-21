import React, { createContext, useContext, useState, useMemo, useCallback } from "react";

export type Language = "en" | "es";

const translations = {
  en: {
    // Mode Selector
    "choose.mode": "Choose Mode",
    "choose.mode.sub": "Select how you want to play",
    "mode.random": "Random Bot",
    "mode.random.sub": "Opponent plays random legal moves",
    "mode.stockfish": "Stockfish",
    "mode.stockfish.sub": "Play against a real chess engine",
    "mode.1v1": "1v1 Local",
    "mode.1v1.sub": "Two players on the same device",
    // Badges
    "badge.random": "Random",
    "badge.stockfish": "Stockfish",
    "badge.1v1": "1v1",
    // Engine Status
    "engine.loading": "Loading engine…",
    "engine.thinking": "Thinking…",
    "engine.error": "Engine error",
    "engine.ready": "Engine ready",
    // Game Status
    "status.checkmate": "Checkmate!",
    "status.wins": "{winner} wins",
    "status.stalemate": "Stalemate",
    "status.draw": "It's a draw",
    "status.draw.title": "Draw",
    "status.draw.sub": "50-move / threefold / insufficient",
    "status.check": "{side} in check ⚠️",
    "status.check.sub": "Defend or escape",
    "status.turn.1v1": "{side}'s turn",
    "status.turn.1v1.sub": "Pass the device",
    "status.thinking.engine": "Engine thinking… ⚙️",
    "status.thinking.engine.sub": "Stockfish (level {level})",
    "status.your.move.engine": "Your move",
    "status.thinking.bot": "Bot thinking…",
    "status.thinking.bot.sub": "Random-move opponent",
    "status.your.move.bot": "Your move",
    // UI
    "skill.level": "Skill Level: {level}",
    "btn.modes": "← Modes",
    "btn.newgame": "New Game",
    "color.white": "White",
    "color.black": "Black",
    // Nav
    "nav.play": "Play",
    "nav.smoke": "Smoke",
    // Smoke
    "smoke.title": "Smoke list",
    "smoke.desc1": "This screen is the manual test pass for @og-nav/expo-chessboard. Each card is a self-contained example of one feature or one fixed bug. Scroll through, do the listed action, and the post-action board state IS the visual confirmation it works.",
    "smoke.desc2": "Why it exists: Jest can verify pure logic but it can't verify gestures, animation timing, sound playback, or Reanimated UI-thread state machines. Those need a real device.",
    "smoke.desc3": "What's covered: every public prop, every imperative ref method, both controlled and uncontrolled modes, every theme, premoves, history scrubbing, all special chess moves (castle / en passant / promotion), sounds, highlights, arrows, custom piece rendering, and a regression block."
  },
  es: {
    // Mode Selector
    "choose.mode": "Elige un modo",
    "choose.mode.sub": "Selecciona cómo quieres jugar",
    "mode.random": "Bot Aleatorio",
    "mode.random.sub": "Juega movimientos legales al azar",
    "mode.stockfish": "Stockfish",
    "mode.stockfish.sub": "Juega contra un motor de ajedrez real",
    "mode.1v1": "1v1 Local",
    "mode.1v1.sub": "Dos jugadores en el mismo dispositivo",
    // Badges
    "badge.random": "Aleatorio",
    "badge.stockfish": "Stockfish",
    "badge.1v1": "1v1",
    // Engine Status
    "engine.loading": "Cargando motor…",
    "engine.thinking": "Pensando…",
    "engine.error": "Error del motor",
    "engine.ready": "Motor listo",
    // Game Status
    "status.checkmate": "¡Jaque mate!",
    "status.wins": "Ganan las {winner}",
    "status.stalemate": "Ahogado",
    "status.draw": "Es un empate",
    "status.draw.title": "Empate",
    "status.draw.sub": "50-movimientos / repetición / material",
    "status.check": "{side} en jaque",
    "status.check.sub": "Defiéndete o escapa",
    "status.turn.1v1": "Turno de {side}",
    "status.turn.1v1.sub": "Pasa el dispositivo",
    "status.thinking.engine": "El motor piensa…",
    "status.thinking.engine.sub": "Stockfish (nivel {level})",
    "status.your.move.engine": "Tu turno",
    "status.thinking.bot": "Bot pensando…",
    "status.thinking.bot.sub": "Oponente aleatorio",
    "status.your.move.bot": "Tu turno",
    // UI
    "skill.level": "Nivel de habilidad: {level}",
    "btn.modes": "← Modos",
    "btn.newgame": "Nuevo Juego",
    "color.white": "blancas",
    "color.black": "negras",
    // Nav
    "nav.play": "Jugar",
    "nav.smoke": "Pruebas",
    // Smoke
    "smoke.title": "Lista de pruebas (Smoke)",
    "smoke.desc1": "Esta pantalla es la prueba manual de @og-nav/expo-chessboard. Cada tarjeta es un ejemplo de una característica o un bug solucionado. Desplázate, haz la acción y el estado final del tablero ES la confirmación visual de que funciona.",
    "smoke.desc2": "Por qué existe: Jest verifica la lógica pura pero no puede verificar gestos, animaciones, sonidos o máquinas de estado en la UI. Eso necesita un dispositivo real.",
    "smoke.desc3": "Qué cubre: cada prop pública, cada método imperativo ref, ambos modos controlados y no controlados, temas, pre-movimientos, rebobinado de historia, movimientos especiales, sonidos, resaltados, flechas y un bloque de regresión."
  }
} as const;

type TranslationKey = keyof typeof translations.en;

interface I18nContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Language>("es"); // Defaulting to Spanish since user requested

  const t = useCallback((key: TranslationKey, params?: Record<string, string | number>): string => {
    let str: string = translations[lang][key] || translations.en[key] || key;
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        str = str.replace(`{${k}}`, String(v));
      }
    }
    return str;
  }, [lang]);

  const value = useMemo(() => ({ lang, setLang, t }), [lang, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
