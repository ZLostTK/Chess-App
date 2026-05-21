import { useCallback, useEffect, useRef, useState } from "react";
import type { StockfishWebViewRef } from "./stockfish-webview";

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------
export type EngineStatus = "loading" | "ready" | "thinking" | "error";

interface UseStockfishOptions {
  /** Skill level 0–20 (UCI_LimitStrength + Skill Level). Default: 10 */
  skillLevel?: number;
  /** Search depth. Default: 15 */
  depth?: number;
  /** Think time in ms. Default: 1500 */
  moveTimeMs?: number;
}

interface UseStockfishReturn {
  status: EngineStatus;
  /** Call this with the current FEN to request the engine's best move. */
  requestMove: (fen: string) => void;
  /** Called by the hook consumer when the engine returns a move. */
  bestMove: string | null;
  /** Called whenever the Stockfish WebView sends a line. Wire to onMessage. */
  handleEngineMessage: (line: string) => void;
  /** Set skill level at runtime */
  setSkillLevel: (level: number) => void;
}

// ------------------------------------------------------------------
// Hook
// ------------------------------------------------------------------
export function useStockfish(
  sfRef: React.RefObject<StockfishWebViewRef | null>,
  options: UseStockfishOptions = {}
): UseStockfishReturn {
  const { depth = 15, moveTimeMs = 1500 } = options;
  const skillLevelRef = useRef<number>(options.skillLevel ?? 10);

  const [status, setStatus] = useState<EngineStatus>("loading");
  const [bestMove, setBestMove] = useState<string | null>(null);
  const uciOkRef = useRef(false);
  const pendingFenRef = useRef<string | null>(null);

  // ------------------------------------------------------------------
  // Send a raw UCI command (safe to call before ready — queued)
  // ------------------------------------------------------------------
  const send = useCallback(
    (cmd: string) => {
      sfRef.current?.sendCommand(cmd);
    },
    [sfRef]
  );

  // ------------------------------------------------------------------
  // Apply skill level commands
  // ------------------------------------------------------------------
  const applySkillLevel = useCallback(
    (level: number) => {
      const limited = level < 20;
      send(`setoption name UCI_LimitStrength value ${limited}`);
      send(`setoption name Skill Level value ${level}`);
    },
    [send]
  );

  // ------------------------------------------------------------------
  // Request a move given a FEN position
  // ------------------------------------------------------------------
  const requestMove = useCallback(
    (fen: string) => {
      if (!uciOkRef.current) {
        pendingFenRef.current = fen;
        return;
      }
      setStatus("thinking");
      setBestMove(null);
      send(`position fen ${fen}`);
      send(`go depth ${depth} movetime ${moveTimeMs}`);
    },
    [send, depth, moveTimeMs]
  );

  // ------------------------------------------------------------------
  // Parse engine output
  // ------------------------------------------------------------------
  const handleEngineMessage = useCallback(
    (line: string) => {
      if (line.startsWith("uciok")) {
        uciOkRef.current = true;
        send("isready");
        applySkillLevel(skillLevelRef.current);
      } else if (line.startsWith("readyok")) {
        setStatus("ready");
        // Process any move that was requested before the engine was ready
        if (pendingFenRef.current) {
          const fen = pendingFenRef.current;
          pendingFenRef.current = null;
          requestMove(fen);
        }
      } else if (line.startsWith("bestmove")) {
        // "bestmove e2e4 ponder d7d5"  or  "bestmove (none)"
        const parts = line.split(" ");
        const move = parts[1];
        if (move && move !== "(none)") {
          setBestMove(move);
        }
        setStatus("ready");
      } else if (line.startsWith("ERROR:")) {
        console.warn("[Stockfish]", line);
        setStatus("error");
      }
    },
    [send, applySkillLevel, requestMove]
  );

  // ------------------------------------------------------------------
  // Set skill level at runtime
  // ------------------------------------------------------------------
  const setSkillLevel = useCallback(
    (level: number) => {
      skillLevelRef.current = level;
      if (uciOkRef.current) {
        applySkillLevel(level);
      }
    },
    [applySkillLevel]
  );

  // Init UCI on mount — send the first command once the WebView is up.
  // The WebView already sends 'uci' itself on load, but we need to send
  // it after the ref is populated. The WebView component does it via:
  //   sf.postMessage('uci') in the inline HTML.
  // So we just wait for the 'uciok' message handled above.
  useEffect(() => {
    // Give the WebView a moment to mount, then re-init if needed
    const t = setTimeout(() => {
      if (!uciOkRef.current) {
        send("uci");
      }
    }, 2000);
    return () => clearTimeout(t);
  }, [send]);

  return { status, bestMove, requestMove, handleEngineMessage, setSkillLevel };
}
