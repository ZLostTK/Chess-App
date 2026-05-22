import React, { createContext, useContext, useState, useMemo } from "react";
import { THEME_BLUE, THEME_GREEN, THEME_WOOD } from "@og-nav/expo-chessboard";

export type BoardTheme = "BLUE" | "GREEN" | "WOOD";
export type PiecesFormat = "PNG" | "UNICODE";

export interface SettingsContextType {
  skillLevel: number;
  setSkillLevel: (level: number) => void;
  autoflip: boolean;
  setAutoflip: (val: boolean) => void;
  showCoordinates: boolean;
  setShowCoordinates: (val: boolean) => void;
  theme: BoardTheme;
  setTheme: (theme: BoardTheme) => void;
  piecesFormat: PiecesFormat;
  setPiecesFormat: (format: PiecesFormat) => void;
  sounds: boolean;
  setSounds: (val: boolean) => void;
  premoves: boolean;
  setPremoves: (val: boolean) => void;
  
  // Helper to map theme selection to color palettes
  themeColors: typeof THEME_BLUE;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [skillLevel, setSkillLevel] = useState(10);
  const [autoflip, setAutoflip] = useState(true);
  const [showCoordinates, setShowCoordinates] = useState(true);
  const [theme, setTheme] = useState<BoardTheme>("BLUE");
  const [piecesFormat, setPiecesFormat] = useState<PiecesFormat>("PNG");
  const [sounds, setSounds] = useState(true);
  const [premoves, setPremoves] = useState(true);

  const themeColors = useMemo(() => {
    switch (theme) {
      case "GREEN": return THEME_GREEN;
      case "WOOD": return THEME_WOOD;
      case "BLUE":
      default:
        return THEME_BLUE;
    }
  }, [theme]);

  const value = useMemo(
    () => ({
      skillLevel, setSkillLevel,
      autoflip, setAutoflip,
      showCoordinates, setShowCoordinates,
      theme, setTheme,
      piecesFormat, setPiecesFormat,
      sounds, setSounds,
      premoves, setPremoves,
      themeColors,
    }),
    [skillLevel, autoflip, showCoordinates, theme, piecesFormat, sounds, premoves, themeColors]
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
