import { Chessboard, type PieceType, type ChessboardRef } from "@og-nav/expo-chessboard";
import { Chess } from "chess.ts";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Modal,
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
type PlayerColor = "white" | "black" | "random";

// ─────────────────────────────────────────────────────────────────────────────
// Root screen — mode selector + game session
// ─────────────────────────────────────────────────────────────────────────────
export default function PlayScreen() {
  const [mode, setMode] = useState<GameMode>("select");
  const [gameId, setGameId] = useState(0);
  const [playerColor, setPlayerColor] = useState<"white" | "black">("white");
  const [showColorPicker, setShowColorPicker] = useState(false);

  const handleNewGame = useCallback(() => {
    setGameId((n) => n + 1);
    setMode("select");
  }, []);

  const handleSelect = useCallback((m: GameMode, color: "white" | "black") => {
    setPlayerColor(color);
    setMode(m);
  }, []);

  const handleRequestColorPick = useCallback(() => {
    setShowColorPicker(true);
  }, []);

  const handleColorPickResult = useCallback((color: "white" | "black") => {
    setPlayerColor(color);
    setGameId((n) => n + 1);
    setShowColorPicker(false);
  }, []);

  const handleCancelColorPick = useCallback(() => {
    setShowColorPicker(false);
  }, []);

  if (mode === "select") {
    return <ModeSelector onSelect={handleSelect} />;
  }

  return (
    <>
      <PlaySession
        key={`${mode}-${gameId}`}
        mode={mode as "random" | "stockfish" | "1v1"}
        playerColor={playerColor}
        onNewGame={handleNewGame}
        onRequestColorPick={handleRequestColorPick}
      />
      <ColorPickerModal
        visible={showColorPicker}
        mode={mode as "random" | "stockfish"}
        onSelectColor={handleColorPickResult}
        onCancel={handleCancelColorPick}
      />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Mode selector
// ─────────────────────────────────────────────────────────────────────────────
function ModeSelector({ onSelect }: { onSelect: (m: GameMode, color: "white" | "black") => void }) {
  const scheme = useColorScheme();
  const dark = scheme === "dark";
  const { t } = useI18n();
  const [pendingMode, setPendingMode] = useState<"random" | "stockfish" | "1v1" | null>(null);
  const [pendingColor, setPendingColor] = useState<PlayerColor>("white");

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

  const handleModePress = (id: "random" | "stockfish" | "1v1") => {
    if (id === "1v1") {
      // 1v1 doesn't need color selection — just start
      onSelect(id, "white");
    } else {
      setPendingMode(id);
      setPendingColor("white");
    }
  };

  const handleStart = () => {
    if (!pendingMode) return;
    const resolved: "white" | "black" =
      pendingColor === "random"
        ? Math.random() < 0.5 ? "white" : "black"
        : pendingColor;
    onSelect(pendingMode, resolved);
  };

  const accentForPending = pendingMode === "random" ? "#4CAF82" : "#0a7ea4";

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
            onPress={() => handleModePress(m.id)}
            style={({ pressed }) => [
              selStyles.card,
              {
                backgroundColor: dark ? "#1a1a1a" : "#ffffff",
                borderColor: pendingMode === m.id ? m.accent : (dark ? "#333" : "#e0e0e0"),
                borderWidth: pendingMode === m.id ? 2 : 1.5,
                transform: [{ scale: pressed ? 0.97 : 1 }],
                opacity: pressed ? 0.9 : 1,
              },
            ]}
          >
            <View style={selStyles.iconWrap}>{m.icon}</View>
            <View style={selStyles.cardText}>
              <Text style={[selStyles.cardTitle, { color: dark ? "#fff" : "#111" }]}>
                {m.title}
              </Text>
              <Text style={[selStyles.cardSub, { color: dark ? "#888" : "#666" }]}>
                {m.subtitle}
              </Text>
            </View>
            <Text style={[selStyles.arrow, { color: m.accent }]}>›</Text>
          </Pressable>
        ))}
      </View>

      {/* Color selection — only shown for bot modes */}
      {pendingMode !== null && pendingMode !== "1v1" && (
        <View style={[selStyles.colorCard, { backgroundColor: dark ? "#1a1a1a" : "#fff" }]}>
          <Text style={[selStyles.colorTitle, { color: dark ? "#ccc" : "#444" }]}>
            {t("play.choose.color")}
          </Text>
          <View style={selStyles.colorRow}>
            {(["white", "random", "black"] as PlayerColor[]).map((c) => {
              const labels: Record<PlayerColor, string> = {
                white: t("play.color.white"),
                black: t("play.color.black"),
                random: t("play.color.random"),
              };
              const active = pendingColor === c;
              return (
                <Pressable
                  key={c}
                  onPress={() => setPendingColor(c)}
                  style={[
                    selStyles.colorBtn,
                    {
                      backgroundColor: active ? accentForPending : (dark ? "#2a2a2a" : "#f0f0f0"),
                      borderColor: active ? accentForPending : "transparent",
                    },
                  ]}
                >
                  <Text style={[selStyles.colorBtnText, { color: active ? "#fff" : (dark ? "#aaa" : "#555") }]}>
                    {labels[c]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Pressable
            onPress={handleStart}
            style={({ pressed }) => [
              selStyles.startBtn,
              { backgroundColor: accentForPending, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Text style={selStyles.startBtnText}>▶ Start</Text>
          </Pressable>
        </View>
      )}
    </BodyScrollView>
  );
}

const selStyles = StyleSheet.create({
  container: {
    padding: 24,
    paddingBottom: 80,
    minHeight: "100%",
    gap: 16,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
    marginTop: 8,
  },
  headerText: { flex: 1 },
  heading: {
    fontSize: 32,
    fontWeight: "700",
    marginBottom: 6,
  },
  sub: {
    fontSize: 15,
  },
  cards: { gap: 12 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
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
  colorCard: {
    borderRadius: 18,
    padding: 16,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  colorTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  colorRow: {
    flexDirection: "row",
    gap: 8,
  },
  colorBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 2,
  },
  colorBtnText: {
    fontSize: 14,
    fontWeight: "600",
  },
  startBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 4,
  },
  startBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Game session — handles all three modes
// ─────────────────────────────────────────────────────────────────────────────
function PlaySession({
  mode,
  playerColor,
  onNewGame,
  onRequestColorPick,
}: {
  mode: "random" | "stockfish" | "1v1";
  playerColor: "white" | "black";
  onNewGame: () => void;
  onRequestColorPick: () => void;
}) {
  const { width } = useWindowDimensions();
  const settings = useSettings();

  // Compute board size: settings.boardSize or responsive
  const boardSize =
    settings.boardSize === "auto"
      ? Math.min(width - 32, 480)
      : settings.boardSize;

  const scheme = useColorScheme();
  const dark = scheme === "dark";
  const { t } = useI18n();

  const textColor = useThemeColor({}, "text");
  const subText = useThemeColor({}, "icon");

  const [chess] = useState(() => new Chess());
  const [, forceUpdate] = useState(0);
  const bump = useCallback(() => forceUpdate((n) => n + 1), []);

  const ref = useRef<ChessboardRef>(null);
  const botTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── 1v1 rotation state ───────────────────────────────────────────
  const [flipped, setFlipped] = useState(false);

  // ── Bot side (the side NOT controlled by the human player) ───────
  // In bot modes, the bot plays the opposite color to the player.
  const botSide = mode !== "1v1" ? (playerColor === "white" ? "b" : "w") : null;

  // ── Stockfish ────────────────────────────────────────────────────
  const sfWebViewRef = useRef<StockfishWebViewRef>(null);

  const { status, bestMove, handleEngineMessage, requestMove: requestMoveHook } =
    useStockfish(sfWebViewRef, {
      skillLevel: settings.skillLevel,
      depth: 15,
      moveTimeMs: 1500,
    });

  const requestMoveRef = useRef(requestMoveHook);
  requestMoveRef.current = requestMoveHook;

  // When engine returns a best move, play it on the board
  useEffect(() => {
    if (mode !== "stockfish" || !bestMove) return;
    const from = bestMove.slice(0, 2) as `${string}`;
    const to = bestMove.slice(2, 4) as `${string}`;
    const promotion = bestMove.length === 5 ? bestMove[4] : undefined;
    ref.current?.animateMove(from, to, promotion);
  }, [bestMove, mode]);

  // ── Trigger bot move if bot plays first (i.e. player chose black) ─
  useEffect(() => {
    if (mode === "1v1" || chess.history().length > 0) return;
    if (chess.turn() === botSide) {
      if (mode === "random") {
        botTimer.current = setTimeout(() => {
          const move = pickRandomMove(chess);
          if (move) ref.current?.animateMove(move.from, move.to, move.promotion);
        }, 600);
      } else if (mode === "stockfish") {
        botTimer.current = setTimeout(() => {
          requestMoveRef.current?.(chess.fen());
        }, 600);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Cleanup ──────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (botTimer.current) clearTimeout(botTimer.current);
    };
  }, []);

  const handleMove = useCallback(() => {
    bump();
    if (chess.gameOver()) return;

    if (mode === "random" && chess.turn() === botSide) {
      botTimer.current = setTimeout(() => {
        const move = pickRandomMove(chess);
        if (move) {
          ref.current?.animateMove(move.from, move.to, move.promotion);
        }
      }, 400);
    } else if (mode === "stockfish" && chess.turn() === botSide) {
      botTimer.current = setTimeout(() => {
        requestMoveRef.current?.(chess.fen());
      }, 300);
    } else if (mode === "1v1") {
      setTimeout(() => {
        setFlipped(chess.turn() === "b");
        bump();
      }, 350);
    }
  }, [chess, bump, mode, botSide]);

  const status2 = describeGameState(chess, mode, t, settings.skillLevel, botSide);

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
            boardOrientation={
              mode === "1v1"
                ? (settings.autoflip && flipped ? "black" : "white")
                : playerColor
            }
            playerSide={mode === "1v1" ? "both" : playerColor}
            onMove={handleMove}
            colors={settings.themeColors}
            showCoordinates={settings.showCoordinates}
            soundEnabled={settings.sounds}
            premovesEnabled={mode !== "1v1" ? settings.premoves : false}
            renderPiece={settings.piecesFormat === "UNICODE" ? renderUnicodePiece : undefined}
            animationDuration={settings.animationDelay}
          />
        </View>

        {/* Actions */}
        <View style={gameStyles.actions}>
          {/* Undo button */}
          <Pressable
            onPress={() => {
              ref.current?.undo();
              bump();
            }}
            style={({ pressed }) => [
              gameStyles.iconBtn,
              {
                borderColor: dark ? "#444" : "#ccc",
                opacity: pressed ? 0.6 : 1,
              },
            ]}
          >
            <Text style={[gameStyles.iconBtnText, { color: textColor }]}>{t("btn.undo")}</Text>
          </Pressable>

          {/* Redo button */}
          <Pressable
            onPress={() => {
              ref.current?.redo();
              bump();
            }}
            style={({ pressed }) => [
              gameStyles.iconBtn,
              {
                borderColor: dark ? "#444" : "#ccc",
                opacity: pressed ? 0.6 : 1,
              },
            ]}
          >
            <Text style={[gameStyles.iconBtnText, { color: textColor }]}>{t("btn.redo")}</Text>
          </Pressable>

          {/* Modes button */}
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

          {/* New Game button */}
          <Pressable
            onPress={() => {
              if (mode === "1v1") {
                chess.reset();
                setFlipped(false);
                if (botTimer.current) clearTimeout(botTimer.current);
                bump();
                ref.current?.reset?.();
              } else {
                if (botTimer.current) clearTimeout(botTimer.current);
                onRequestColorPick();
              }
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
  skillLevel?: number,
  botSide?: string | null
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

  // Determine if the current turn belongs to the bot
  const isBotTurn = chess.turn() === botSide;

  if (mode === "stockfish") {
    if (isBotTurn) {
      return {
        title: t("status.thinking.engine"),
        subtitle: t("status.thinking.engine.sub", { level: skillLevel ?? 10 }),
      };
    }
    return { title: t("status.your.move.engine"), subtitle: t("status.thinking.engine.sub", { level: skillLevel ?? 10 }) };
  }
  // random
  if (isBotTurn) {
    return { title: t("status.thinking.bot"), subtitle: t("status.thinking.bot.sub") };
  }
  return { title: t("status.your.move.bot"), subtitle: t("status.thinking.bot.sub") };
}

// ─────────────────────────────────────────────────────────────────────────────
// Color picker modal — shown when "New Game" is pressed in bot modes
// ─────────────────────────────────────────────────────────────────────────────
type ModalPlayerColor = "white" | "black" | "random";

function ColorPickerModal({
  visible,
  mode,
  onSelectColor,
  onCancel,
}: {
  visible: boolean;
  mode: "random" | "stockfish";
  onSelectColor: (color: "white" | "black") => void;
  onCancel: () => void;
}) {
  const { t } = useI18n();
  const scheme = useColorScheme();
  const dark = scheme === "dark";
  const [pendingColor, setPendingColor] = useState<ModalPlayerColor>("white");

  const accentColor = mode === "random" ? "#4CAF82" : "#0a7ea4";

  const labels: Record<ModalPlayerColor, string> = {
    white: t("play.color.white"),
    black: t("play.color.black"),
    random: t("play.color.random"),
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={modalStyles.overlay}>
        <View style={[modalStyles.card, { backgroundColor: dark ? "#1a1a1a" : "#ffffff" }]}>
          <Text style={[modalStyles.title, { color: dark ? "#eee" : "#222" }]}>
            {t("play.choose.color")}
          </Text>

          <View style={modalStyles.colorRow}>
            {(["white", "random", "black"] as ModalPlayerColor[]).map((c) => {
              const active = pendingColor === c;
              return (
                <Pressable
                  key={c}
                  onPress={() => setPendingColor(c)}
                  style={[
                    modalStyles.colorBtn,
                    {
                      backgroundColor: active ? accentColor : (dark ? "#2a2a2a" : "#f0f0f0"),
                      borderColor: active ? accentColor : "transparent",
                    },
                  ]}
                >
                  <Text
                    style={[
                      modalStyles.colorBtnText,
                      { color: active ? "#fff" : (dark ? "#aaa" : "#555") },
                    ]}
                  >
                    {labels[c]}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={modalStyles.actionRow}>
            <Pressable
              onPress={onCancel}
              style={({ pressed }) => [
                modalStyles.actionBtn,
                modalStyles.cancelBtn,
                {
                  borderColor: dark ? "#444" : "#ccc",
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <Text style={[modalStyles.cancelText, { color: dark ? "#aaa" : "#555" }]}>
                Cancel
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                const resolved: "white" | "black" =
                  pendingColor === "random"
                    ? Math.random() < 0.5 ? "white" : "black"
                    : pendingColor;
                onSelectColor(resolved);
              }}
              style={({ pressed }) => [
                modalStyles.actionBtn,
                { backgroundColor: accentColor, opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <Text style={modalStyles.startText}>▶ Start</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
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
  actions: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
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
    fontSize: 15,
    fontWeight: "700",
  },
  buttonTextOutline: {
    fontSize: 14,
    fontWeight: "600",
  },
  iconBtn: {
    width: 46,
    height: 46,
    borderRadius: 12,
    borderWidth: 1.5,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  iconBtnText: {
    fontSize: 22,
  },
});

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  card: {
    width: "100%",
    maxWidth: 380,
    borderRadius: 20,
    padding: 24,
    gap: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  colorRow: {
    flexDirection: "row",
    gap: 8,
  },
  colorBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 2,
  },
  colorBtnText: {
    fontSize: 14,
    fontWeight: "600",
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  cancelBtn: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: "600",
  },
  startText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
});
