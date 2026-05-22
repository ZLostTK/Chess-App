import { Chessboard, type PieceType, type ChessboardRef } from "@og-nav/expo-chessboard";
import { Chess } from "chess.ts";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  useWindowDimensions,
  View,
} from "react-native";

import { BodyScrollView } from "@/components/body-scroll-view";
import { RobotIcon, PawnIcon, HandshakeIcon } from "@/components/ui/mode-icons";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useI18n } from "@/lib/i18n";
import { pickRandomMove } from "@/lib/random-bot";
import { useStockfish } from "@/lib/stockfish-engine";
import { StockfishWebView } from "@/lib/stockfish-webview";
import type { StockfishWebViewRef } from "@/lib/stockfish-webview";
import { useSettings } from "@/lib/settings";

const UNICODE_PIECES: Record<PieceType, string> = {
  wk: "♔", wq: "♕", wr: "♖", wb: "♗", wn: "♘", wp: "♙",
  bk: "♚", bq: "♛", br: "♜", bb: "♝", bn: "♞", bp: "♟",
};

function renderUnicodePiece(piece: PieceType, size: number) {
  return (
    <Text style={{ fontSize: size * 0.78, lineHeight: size, textAlign: "center", width: size }}>
      {UNICODE_PIECES[piece]}
    </Text>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
type GameMode = "select" | "random" | "stockfish" | "1v1";

// ─────────────────────────────────────────────────────────────────────────────
// Root screen — mode selector + game session
// ─────────────────────────────────────────────────────────────────────────────
export default function PlayScreen() {
  const [mode, setMode] = useState<GameMode>("select");
  const [gameId, setGameId] = useState(0);

  const handleNewGame = useCallback(() => {
    setGameId((n) => n + 1);
    setMode("select");
  }, []);

  if (mode === "select") {
    return <ModeSelector onSelect={setMode} />;
  }

  return (
    <PlaySession
      key={`${mode}-${gameId}`}
      mode={mode as "random" | "stockfish" | "1v1"}
      onNewGame={handleNewGame}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Mode selector
// ─────────────────────────────────────────────────────────────────────────────
function ModeSelector({ onSelect }: { onSelect: (m: GameMode) => void }) {
  const scheme = useColorScheme();
  const dark = scheme === "dark";
  const { t } = useI18n();

  const modes: {
    id: "random" | "stockfish" | "1v1";
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    accent: string;
  }[] = [
    {
      id: "random",
      icon: <PawnIcon color="#4CAF82" size={32} />,
      title: t("mode.random"),
      subtitle: t("mode.random.sub"),
      accent: "#4CAF82",
    },
    {
      id: "stockfish",
      icon: <RobotIcon color="#0a7ea4" size={32} />,
      title: t("mode.stockfish"),
      subtitle: t("mode.stockfish.sub"),
      accent: "#0a7ea4",
    },
    {
      id: "1v1",
      icon: <HandshakeIcon color="#9b59b6" size={32} />,
      title: t("mode.1v1"),
      subtitle: t("mode.1v1.sub"),
      accent: "#9b59b6",
    },
  ];

  return (
    <BodyScrollView
      contentContainerStyle={[
        selStyles.container,
        { backgroundColor: dark ? "#0d0d0d" : "#f4f6fa" },
      ]}
    >
      <View style={selStyles.headerRow}>
        <View style={selStyles.headerText}>
          <Text style={[selStyles.heading, { color: dark ? "#fff" : "#111" }]}>
            {t("choose.mode")}
          </Text>
          <Text style={[selStyles.sub, { color: dark ? "#888" : "#555" }]}>
            {t("choose.mode.sub")}
          </Text>
        </View>
      </View>

      <View style={selStyles.cards}>
        {modes.map((m) => (
          <Pressable
            key={m.id}
            onPress={() => onSelect(m.id)}
            style={({ pressed }) => [
              selStyles.card,
              {
                backgroundColor: dark ? "#1a1a1a" : "#ffffff",
                borderColor: m.accent,
                transform: [{ scale: pressed ? 0.97 : 1 }],
                opacity: pressed ? 0.9 : 1,
              },
            ]}
          >
            <View style={selStyles.iconWrap}>{m.icon}</View>
            <View style={selStyles.cardText}>
              <Text
                style={[selStyles.cardTitle, { color: dark ? "#fff" : "#111" }]}
              >
                {m.title}
              </Text>
              <Text
                style={[selStyles.cardSub, { color: dark ? "#888" : "#666" }]}
              >
                {m.subtitle}
              </Text>
            </View>
            <Text style={[selStyles.arrow, { color: m.accent }]}>›</Text>
          </Pressable>
        ))}
      </View>
    </BodyScrollView>
  );
}

const selStyles = StyleSheet.create({
  container: {
    padding: 24,
    paddingBottom: 80,
    minHeight: "100%",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 32,
    marginTop: 8,
  },
  headerText: { flex: 1 },
  langBtn: {
    padding: 8,
    borderRadius: 20,
    marginTop: 4,
  },
  heading: {
    fontSize: 32,
    fontWeight: "700",
    marginBottom: 6,
  },
  sub: {
    fontSize: 15,
  },
  cards: { gap: 16 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1.5,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    paddingRight: 20,
    paddingVertical: 18,
    gap: 14,
  },
  iconWrap: {
    marginLeft: 14,
    marginRight: 4,
  },
  cardText: { flex: 1, gap: 3 },
  cardTitle: { fontSize: 18, fontWeight: "700" },
  cardSub: { fontSize: 13 },
  arrow: { fontSize: 28, fontWeight: "300" },
});

// ─────────────────────────────────────────────────────────────────────────────
// Game session — handles all three modes
// ─────────────────────────────────────────────────────────────────────────────
function PlaySession({
  mode,
  onNewGame,
}: {
  mode: "random" | "stockfish" | "1v1";
  onNewGame: () => void;
}) {
  const { width } = useWindowDimensions();
  const boardSize = Math.min(width - 32, 480);
  const scheme = useColorScheme();
  const dark = scheme === "dark";
  const { t } = useI18n();
  const settings = useSettings();

  const textColor = useThemeColor({}, "text");
  const subText = useThemeColor({}, "icon");

  const [chess] = useState(() => new Chess());
  const [, forceUpdate] = useState(0);
  const bump = useCallback(() => forceUpdate((n) => n + 1), []);

  const ref = useRef<ChessboardRef>(null);
  const botTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── 1v1 rotation state ───────────────────────────────────────────
  // After each move the board flips so the next player looks at their pieces.
  const [flipped, setFlipped] = useState(false);

  // ── Stockfish ────────────────────────────────────────────────────
  const sfWebViewRef = useRef<StockfishWebViewRef>(null);

  const { status, bestMove, handleEngineMessage, requestMove: requestMoveHook } =
    useStockfish(sfWebViewRef, {
      skillLevel: settings.skillLevel,
      depth: 15,
      moveTimeMs: 1500,
    });

  // Keep a stable ref so handleMove doesn't capture a stale version
  const requestMoveRef = useRef(requestMoveHook);
  requestMoveRef.current = requestMoveHook;

  // When engine returns a best move, play it on the board
  useEffect(() => {
    if (mode !== "stockfish" || !bestMove) return;
    // UCI move format: "e2e4" or "e7e8q" (promotion)
    const from = bestMove.slice(0, 2) as `${string}`;
    const to = bestMove.slice(2, 4) as `${string}`;
    const promotion = bestMove.length === 5 ? bestMove[4] : undefined;
    ref.current?.animateMove(from, to, promotion);
  }, [bestMove, mode]);

  // ── Cleanup ──────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (botTimer.current) clearTimeout(botTimer.current);
    };
  }, []);

  const handleMove = useCallback(() => {
    bump();
    if (chess.gameOver()) return;

    if (mode === "random" && chess.turn() === "b") {
      botTimer.current = setTimeout(() => {
        const move = pickRandomMove(chess);
        if (move) {
          ref.current?.animateMove(move.from, move.to, move.promotion);
        }
      }, 400);
    } else if (mode === "stockfish" && chess.turn() === "b") {
      // Request engine move after a short delay for UX feel
      botTimer.current = setTimeout(() => {
        requestMoveRef.current?.(chess.fen());
      }, 300);
    } else if (mode === "1v1") {
      // Flip the board after a short pause so the next player looks at their pieces
      setTimeout(() => {
        if (settings.autoflip) {
          setFlipped((f) => !f);
        }
        bump();
      }, 350);
    }
  }, [chess, bump, mode, settings.autoflip]);

  const status2 = describeGameState(chess, mode, t, settings.skillLevel);

  // ── Skill level slider (Stockfish only) ─────────────────────────
  const accentForMode = {
    random: "#4CAF82",
    stockfish: "#0a7ea4",
    "1v1": "#9b59b6",
  }[mode];

  return (
    <>
      {/* Invisible Stockfish WebView — only mounted in stockfish mode */}
      {mode === "stockfish" && (
        <StockfishWebView ref={sfWebViewRef} onMessage={handleEngineMessage} />
      )}

      <BodyScrollView
        contentContainerStyle={[
          gameStyles.container,
          { backgroundColor: dark ? "#0d0d0d" : "#f4f6fa" },
        ]}
      >
        {/* Header */}
        <View style={gameStyles.statusRow}>
          <View
            style={[gameStyles.modeBadge, { backgroundColor: accentForMode, flexDirection: 'row', alignItems: 'center', gap: 6 }]}
          >
            {mode === "random" && <PawnIcon color="#fff" size={16} />}
            {mode === "stockfish" && <RobotIcon color="#fff" size={16} />}
            {mode === "1v1" && <HandshakeIcon color="#fff" size={16} />}
            <Text style={gameStyles.modeBadgeText}>
              {mode === "random"
                ? t("badge.random")
                : mode === "stockfish"
                  ? t("badge.stockfish")
                  : t("badge.1v1")}
            </Text>
          </View>

          {mode === "stockfish" && (
            <Text
              style={[gameStyles.engineStatus, { color: subText }]}
            >
              {status === "loading"
                ? t("engine.loading")
                : status === "thinking"
                  ? t("engine.thinking")
                  : status === "error"
                    ? t("engine.error")
                    : t("engine.ready")}
            </Text>
          )}

          <Text style={[gameStyles.statusTitle, { color: textColor }]}>
            {status2.title}
          </Text>
          <Text style={[gameStyles.subtitle, { color: subText }]}>
            {status2.subtitle}
          </Text>
        </View>

        {/* Board */}
        <View style={gameStyles.boardWrap}>
          <Chessboard
            ref={ref}
            chess={chess}
            boardSize={boardSize}
            playerSide={
              mode === "1v1"
                ? flipped
                  ? "black"
                  : "white"
                : "white"
            }
            onMove={handleMove}
            colors={settings.themeColors}
            showCoordinates={settings.showCoordinates}
            soundEnabled={settings.sounds}
            premovesEnabled={mode !== "1v1" ? settings.premoves : false}
            renderPiece={settings.piecesFormat === "UNICODE" ? renderUnicodePiece : undefined}
          />
        </View>

        {/* Stockfish skill level control (Removed: Now in Settings Tab) */}

        {/* Actions */}
        <View style={gameStyles.actions}>
          <Pressable
            onPress={onNewGame}
            style={({ pressed }) => [
              gameStyles.button,
              gameStyles.buttonOutline,
              {
                borderColor: dark ? "#444" : "#ccc",
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Text style={[gameStyles.buttonTextOutline, { color: textColor }]}>
              {t("btn.modes")}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              chess.reset();
              setFlipped(false);
              if (botTimer.current) clearTimeout(botTimer.current);
              bump();
              ref.current?.reset?.();
            }}
            style={({ pressed }) => [
              gameStyles.button,
              { backgroundColor: accentForMode, opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Text style={gameStyles.buttonText}>{t("btn.newgame")}</Text>
          </Pressable>
        </View>
      </BodyScrollView>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// State description
// ─────────────────────────────────────────────────────────────────────────────
function describeGameState(
  chess: Chess,
  mode: "random" | "stockfish" | "1v1",
  t: (k: any, p?: any) => string,
  skillLevel?: number
): { title: string; subtitle: string } {
  if (chess.inCheckmate()) {
    const winner = chess.turn() === "w" ? t("color.black") : t("color.white");
    return { title: t("status.checkmate"), subtitle: t("status.wins", { winner }) };
  }
  if (chess.inStalemate()) {
    return { title: t("status.stalemate"), subtitle: t("status.draw") };
  }
  if (chess.inDraw()) {
    return { title: t("status.draw.title"), subtitle: t("status.draw.sub") };
  }
  if (chess.inCheck()) {
    const side = chess.turn() === "w" ? t("color.white") : t("color.black");
    return { title: t("status.check", { side }), subtitle: t("status.check.sub") };
  }

  const side = chess.turn() === "w" ? t("color.white") : t("color.black");

  if (mode === "1v1") {
    return { title: t("status.turn.1v1", { side }), subtitle: t("status.turn.1v1.sub") };
  }
  if (mode === "stockfish") {
    if (chess.turn() === "b") {
      return {
        title: t("status.thinking.engine"),
        subtitle: t("status.thinking.engine.sub", { level: skillLevel ?? 10 }),
      };
    }
    return { title: t("status.your.move.engine"), subtitle: t("status.thinking.engine.sub", { level: skillLevel ?? 10 }) };
  }
  // random
  if (chess.turn() === "b") {
    return { title: t("status.thinking.bot"), subtitle: t("status.thinking.bot.sub") };
  }
  return { title: t("status.your.move.bot"), subtitle: t("status.thinking.bot.sub") };
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const gameStyles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 96,
    gap: 16,
    alignItems: "center",
  },
  statusRow: {
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  modeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 4,
  },
  modeBadgeText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  engineStatus: {
    fontSize: 12,
  },
  statusTitle: {
    fontSize: 22,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 14,
  },
  boardWrap: {
    alignItems: "center",
  },
  skillRow: {
    width: "100%",
    gap: 8,
  },
  skillLabel: {
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  skillPips: {
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 8,
  },
  pip: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  pipText: {
    fontSize: 11,
    fontWeight: "700",
  },
  actions: {
    flexDirection: "row",
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  buttonOutline: {
    borderWidth: 1.5,
    backgroundColor: "transparent",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  buttonTextOutline: {
    fontSize: 16,
    fontWeight: "600",
  },
});
