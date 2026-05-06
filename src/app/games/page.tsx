"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gamepad2, RotateCcw, Trophy, Wind, Brain } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";

// ─── TYPES ───────────────────────────────────────────────────────────────────
type GameId = "memory" | "breathing" | "math";

// ─── MEMORY CARD GAME ────────────────────────────────────────────────────────
const EMOJIS = ["🌟", "🔥", "💎", "⚡", "🚀", "🎯", "🌈", "🦋"];

interface Card {
  id: number;
  emoji: string;
  flipped: boolean;
  matched: boolean;
}

function shuffleCards(): Card[] {
  const pairs = [...EMOJIS, ...EMOJIS].map((e, i) => ({
    id: i,
    emoji: e,
    flipped: false,
    matched: false,
  }));
  return pairs.sort(() => Math.random() - 0.5);
}

function MemoryGame() {
  const [cards, setCards] = useState<Card[]>(shuffleCards);
  const [selected, setSelected] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);
  const lockRef = useRef(false);

  const reset = () => {
    setCards(shuffleCards());
    setSelected([]);
    setMoves(0);
    setWon(false);
    lockRef.current = false;
  };

  const flip = (id: number) => {
    if (lockRef.current) return;
    const card = cards.find((c) => c.id === id);
    if (!card || card.flipped || card.matched) return;

    const newSel = [...selected, id];
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, flipped: true } : c)));
    setSelected(newSel);

    if (newSel.length === 2) {
      lockRef.current = true;
      setMoves((m) => m + 1);
      const [a, b] = newSel;
      const ca = cards.find((c) => c.id === a)!;
      const cb = cards.find((c) => c.id === b)!;
      if (ca.emoji === cb.emoji) {
        setCards((prev) =>
          prev.map((c) => (c.id === a || c.id === b ? { ...c, matched: true } : c))
        );
        setSelected([]);
        lockRef.current = false;
        setCards((prev) => {
          const allMatched = prev.every((c) => c.matched || c.id === a || c.id === b);
          if (allMatched) setTimeout(() => setWon(true), 300);
          return prev;
        });
      } else {
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) => (c.id === a || c.id === b ? { ...c, flipped: false } : c))
          );
          setSelected([]);
          lockRef.current = false;
        }, 900);
      }
    }
  };

  // fix won detection
  useEffect(() => {
    if (cards.length > 0 && cards.every((c) => c.matched)) setWon(true);
  }, [cards]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-6 text-sm">
        <span style={{ color: "#aaa" }}>Moves: <strong style={{ color: "#00f5ff" }}>{moves}</strong></span>
        <button onClick={reset} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#aaa" }}>
          <RotateCcw size={12} /> Reset
        </button>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {cards.map((card) => (
          <motion.button key={card.id} onClick={() => flip(card.id)}
            whileTap={{ scale: 0.92 }}
            className="w-16 h-16 rounded-xl text-2xl flex items-center justify-center relative"
            style={{
              background: card.flipped || card.matched
                ? card.matched ? "rgba(57,255,20,0.15)" : "rgba(0,245,255,0.15)"
                : "rgba(255,255,255,0.05)",
              border: card.matched ? "1px solid #39ff1460" : card.flipped ? "1px solid #00f5ff60" : "1px solid rgba(255,255,255,0.08)",
              boxShadow: card.matched ? "0 0 12px #39ff1430" : card.flipped ? "0 0 12px #00f5ff30" : "none",
              cursor: card.matched ? "default" : "pointer",
            }}>
            <AnimatePresence>
              {(card.flipped || card.matched) && (
                <motion.span key="emoji" initial={{ rotateY: 90, opacity: 0 }} animate={{ rotateY: 0, opacity: 1 }} exit={{ rotateY: 90, opacity: 0 }}>
                  {card.emoji}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {won && (
          <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center gap-2 py-4">
            <div className="text-4xl">🏆</div>
            <div className="text-lg font-bold" style={{ color: "#ffff00" }}>You Won!</div>
            <div className="text-sm" style={{ color: "#aaa" }}>Completed in {moves} moves</div>
            <button onClick={reset} className="mt-2 px-4 py-2 rounded-lg text-sm font-medium"
              style={{ background: "linear-gradient(135deg, #00f5ff, #bf00ff)", color: "#000" }}>
              Play Again
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── BREATHING GAME ──────────────────────────────────────────────────────────
const PHASES = [
  { label: "Inhale", duration: 4, color: "#00f5ff", scale: 1.6 },
  { label: "Hold", duration: 4, color: "#bf00ff", scale: 1.6 },
  { label: "Exhale", duration: 6, color: "#39ff14", scale: 0.8 },
  { label: "Hold", duration: 2, color: "#ffff00", scale: 0.8 },
];

function BreathingGame() {
  const [running, setRunning] = useState(false);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [count, setCount] = useState(0);
  const [cycles, setCycles] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const stop = useCallback(() => {
    setRunning(false);
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    if (!running) return;
    const phase = PHASES[phaseIdx];
    let elapsed = 0;
    timerRef.current = setInterval(() => {
      elapsed++;
      setCount(elapsed);
      if (elapsed >= phase.duration) {
        clearInterval(timerRef.current!);
        const next = (phaseIdx + 1) % PHASES.length;
        if (next === 0) setCycles((c) => c + 1);
        setPhaseIdx(next);
        setCount(0);
      }
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [running, phaseIdx]);

  const phase = PHASES[phaseIdx];
  const progress = running ? count / phase.duration : 0;

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-sm" style={{ color: "#aaa" }}>Cycles completed: <strong style={{ color: "#00f5ff" }}>{cycles}</strong></div>

      <div className="relative flex items-center justify-center" style={{ width: 200, height: 200 }}>
        {/* Outer ring */}
        <svg className="absolute inset-0" width={200} height={200}>
          <circle cx={100} cy={100} r={88} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={4} />
          {running && (
            <circle cx={100} cy={100} r={88} fill="none" stroke={phase.color} strokeWidth={4}
              strokeDasharray={`${2 * Math.PI * 88}`}
              strokeDashoffset={`${2 * Math.PI * 88 * (1 - progress)}`}
              strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 1s linear", filter: `drop-shadow(0 0 6px ${phase.color})` }}
              transform="rotate(-90 100 100)" />
          )}
        </svg>

        <motion.div
          animate={{ scale: running ? phase.scale : 1, boxShadow: running ? `0 0 40px ${phase.color}60` : "0 0 20px rgba(0,245,255,0.2)" }}
          transition={{ duration: phase.duration, ease: running ? "easeInOut" : "easeOut" }}
          className="w-24 h-24 rounded-full flex flex-col items-center justify-center"
          style={{ background: running ? `radial-gradient(circle, ${phase.color}30, ${phase.color}10)` : "rgba(255,255,255,0.05)", border: `2px solid ${running ? phase.color : "rgba(255,255,255,0.1)"}` }}>
          {running ? (
            <>
              <div className="text-xs font-semibold" style={{ color: phase.color }}>{phase.label}</div>
              <div className="text-2xl font-bold" style={{ color: phase.color }}>{phase.duration - count}</div>
            </>
          ) : (
            <Wind size={28} style={{ color: "#00f5ff" }} />
          )}
        </motion.div>
      </div>

      <div className="text-sm text-center px-4" style={{ color: "#666" }}>
        4-4-6-2 Box Breathing — reduces stress and improves focus
      </div>

      <button onClick={() => { if (running) { stop(); setPhaseIdx(0); setCount(0); } else setRunning(true); }}
        className="px-6 py-2.5 rounded-xl font-medium text-sm transition-all"
        style={{
          background: running ? "rgba(255,0,128,0.15)" : "linear-gradient(135deg, #00f5ff, #bf00ff)",
          border: running ? "1px solid #ff0080" : "none",
          color: running ? "#ff0080" : "#000",
          boxShadow: running ? "none" : "0 0 20px rgba(0,245,255,0.3)",
        }}>
        {running ? "Stop" : "Start Breathing"}
      </button>
    </div>
  );
}

// ─── CARO / GOMOKU ────────────────────────────────────────────────────────────
const BOARD_SIZE = 15;
const WIN_COUNT = 5;

type Cell = "X" | "O" | null;
type CaroMode = "pvp" | "pvc";

function createBoard(): Cell[][] {
  return Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(null));
}

function checkWinner(board: Cell[][], row: number, col: number, player: Cell): boolean {
  const dirs = [[1, 0], [0, 1], [1, 1], [1, -1]];
  for (const [dr, dc] of dirs) {
    let count = 1;
    for (let i = 1; i < WIN_COUNT; i++) {
      const r = row + dr * i, c = col + dc * i;
      if (r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE || board[r][c] !== player) break;
      count++;
    }
    for (let i = 1; i < WIN_COUNT; i++) {
      const r = row - dr * i, c = col - dc * i;
      if (r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE || board[r][c] !== player) break;
      count++;
    }
    if (count >= WIN_COUNT) return true;
  }
  return false;
}

// Simple AI: score each empty cell and pick best
function scoreCell(board: Cell[][], row: number, col: number, player: Cell): number {
  const opp = player === "O" ? "X" : "O";
  const dirs = [[1, 0], [0, 1], [1, 1], [1, -1]];
  let score = 0;

  for (const [dr, dc] of dirs) {
    for (const p of [player, opp]) {
      let count = 0, space = 0;
      for (let d = -4; d <= 4; d++) {
        if (d === 0) continue;
        const r = row + dr * d, c = col + dc * d;
        if (r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE) continue;
        if (board[r][c] === p) { count++; space++; }
        else if (board[r][c] === null) space++;
        else space = 0;
      }
      const w = p === player ? 1 : 1.5;
      if (count >= 4) score += 100000 * w;
      else if (count >= 3) score += 1000 * w;
      else if (count >= 2) score += 100 * w;
      else if (count >= 1) score += 10 * w;
    }
  }
  return score;
}

function aiMove(board: Cell[][]): [number, number] {
  let best = -1, br = 7, bc = 7;
  // Prefer center area
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] !== null) continue;
      const s = scoreCell(board, r, c, "O") + Math.random() * 0.1;
      if (s > best) { best = s; br = r; bc = c; }
    }
  }
  return [br, bc];
}

function CaroGame() {
  const [board, setBoard] = useState<Cell[][]>(createBoard);
  const [current, setCurrent] = useState<"X" | "O">("X");
  const [winner, setWinner] = useState<Cell | "draw" | null>(null);
  const [mode, setMode] = useState<CaroMode>("pvc");
  const [winCells, setWinCells] = useState<Set<string>>(new Set());
  const [thinking, setThinking] = useState(false);
  const lastMoveRef = useRef<[number, number] | null>(null);

  const reset = () => {
    setBoard(createBoard()); setCurrent("X"); setWinner(null);
    setWinCells(new Set()); lastMoveRef.current = null; setThinking(false);
  };

  useEffect(() => { reset(); }, [mode]);

  const findWinCells = (b: Cell[][], row: number, col: number, player: Cell): Set<string> => {
    const dirs = [[1, 0], [0, 1], [1, 1], [1, -1]];
    for (const [dr, dc] of dirs) {
      const cells: [number, number][] = [[row, col]];
      for (let i = 1; i < WIN_COUNT; i++) {
        const r = row + dr * i, c = col + dc * i;
        if (r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE || b[r][c] !== player) break;
        cells.push([r, c]);
      }
      for (let i = 1; i < WIN_COUNT; i++) {
        const r = row - dr * i, c = col - dc * i;
        if (r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE || b[r][c] !== player) break;
        cells.push([r, c]);
      }
      if (cells.length >= WIN_COUNT) return new Set(cells.map(([r, c]) => `${r},${c}`));
    }
    return new Set();
  };

  const placeMove = useCallback((b: Cell[][], row: number, col: number, player: "X" | "O") => {
    const newBoard = b.map((r) => [...r]);
    newBoard[row][col] = player;
    lastMoveRef.current = [row, col];
    if (checkWinner(newBoard, row, col, player)) {
      setWinCells(findWinCells(newBoard, row, col, player));
      setWinner(player);
    } else if (newBoard.every((r) => r.every((c) => c !== null))) {
      setWinner("draw");
    }
    return newBoard;
  }, []);

  const handleClick = useCallback((row: number, col: number) => {
    if (winner || board[row][col] || thinking) return;
    if (mode === "pvc" && current === "O") return;

    const newBoard = placeMove(board, row, col, current);
    setBoard(newBoard);
    if (!checkWinner(newBoard, row, col, current) && !newBoard.every((r) => r.every((c) => c !== null))) {
      const next = current === "X" ? "O" : "X";
      setCurrent(next);

      if (mode === "pvc" && next === "O") {
        setThinking(true);
        setTimeout(() => {
          const [ar, ac] = aiMove(newBoard);
          const finalBoard = placeMove(newBoard, ar, ac, "O");
          setBoard(finalBoard);
          setCurrent("X");
          setThinking(false);
        }, 300);
      }
    }
  }, [board, current, winner, mode, thinking, placeMove]);

  const CELL_SIZE = 28;
  const GRID = BOARD_SIZE * CELL_SIZE;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Mode selector */}
      <div className="flex gap-2">
        {([["pvc", "🤖 vs AI"], ["pvp", "👥 2 Players"]] as [CaroMode, string][]).map(([m, label]) => (
          <button key={m} onClick={() => setMode(m)}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={{
              background: mode === m ? "rgba(0,245,255,0.15)" : "rgba(255,255,255,0.04)",
              border: mode === m ? "1px solid #00f5ff50" : "1px solid rgba(255,255,255,0.08)",
              color: mode === m ? "#00f5ff" : "#888",
            }}>
            {label}
          </button>
        ))}
        <button onClick={reset} className="px-3 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#666" }}>
          <RotateCcw size={11} /> New
        </button>
      </div>

      {/* Status */}
      <div className="text-sm font-semibold" style={{ color: winner === "X" ? "#00f5ff" : winner === "O" ? "#ff0080" : winner === "draw" ? "#ffff00" : current === "X" ? "#00f5ff" : "#ff0080" }}>
        {winner === "X" ? (mode === "pvc" ? "🎉 You Won!" : "🎉 Player X Won!") :
         winner === "O" ? (mode === "pvc" ? "🤖 AI Won!" : "🎉 Player O Won!") :
         winner === "draw" ? "🤝 Draw!" :
         thinking ? "🤖 AI thinking..." :
         mode === "pvc" ? (current === "X" ? "Your turn (●)" : "") :
         `Player ${current}'s turn`}
      </div>

      {/* Board */}
      <div className="overflow-auto max-w-full">
        <div style={{ position: "relative", width: GRID + CELL_SIZE, height: GRID + CELL_SIZE }}>
          {/* Grid lines */}
          <svg style={{ position: "absolute", inset: 0 }} width={GRID + CELL_SIZE} height={GRID + CELL_SIZE}>
            {Array.from({ length: BOARD_SIZE }).map((_, i) => (
              <g key={i}>
                <line x1={CELL_SIZE / 2} y1={i * CELL_SIZE + CELL_SIZE / 2} x2={GRID + CELL_SIZE / 2} y2={i * CELL_SIZE + CELL_SIZE / 2}
                  stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
                <line x1={i * CELL_SIZE + CELL_SIZE / 2} y1={CELL_SIZE / 2} x2={i * CELL_SIZE + CELL_SIZE / 2} y2={GRID + CELL_SIZE / 2}
                  stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
              </g>
            ))}
            {/* Center dot */}
            <circle cx={(BOARD_SIZE >> 1) * CELL_SIZE + CELL_SIZE / 2} cy={(BOARD_SIZE >> 1) * CELL_SIZE + CELL_SIZE / 2} r={3} fill="rgba(255,255,255,0.2)" />
          </svg>

          {/* Cells */}
          {board.map((row, r) =>
            row.map((cell, c) => {
              const isLast = lastMoveRef.current?.[0] === r && lastMoveRef.current?.[1] === c;
              const isWin = winCells.has(`${r},${c}`);
              const cx = c * CELL_SIZE + CELL_SIZE / 2;
              const cy = r * CELL_SIZE + CELL_SIZE / 2;
              return (
                <div key={`${r}-${c}`}
                  onClick={() => handleClick(r, c)}
                  style={{
                    position: "absolute",
                    left: c * CELL_SIZE, top: r * CELL_SIZE,
                    width: CELL_SIZE, height: CELL_SIZE,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: cell || winner || thinking ? "default" : "pointer",
                  }}>
                  {cell && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 400, damping: 20 }}
                      style={{
                        width: CELL_SIZE - 8, height: CELL_SIZE - 8, borderRadius: "50%",
                        background: cell === "X" ? (isWin ? "#00f5ff" : "rgba(0,245,255,0.8)") : (isWin ? "#ff0080" : "rgba(255,0,128,0.8)"),
                        boxShadow: isWin
                          ? `0 0 15px ${cell === "X" ? "#00f5ff" : "#ff0080"}, 0 0 30px ${cell === "X" ? "#00f5ff" : "#ff0080"}`
                          : isLast ? `0 0 8px ${cell === "X" ? "#00f5ff" : "#ff0080"}` : "none",
                        border: `2px solid ${cell === "X" ? (isWin ? "#00f5ff" : "#00f5ff80") : (isWin ? "#ff0080" : "#ff008080")}`,
                      }} />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="text-xs" style={{ color: "#444" }}>● = X (cyan) &nbsp;•&nbsp; ● = O (pink) &nbsp;•&nbsp; First to 5 in a row wins</div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
const GAMES = [
  { id: "memory" as GameId, name: "Memory Cards", desc: "Match pairs to win", icon: Brain, color: "#00f5ff" },
  { id: "breathing" as GameId, name: "Breathing", desc: "4-4-6-2 box breathing", icon: Wind, color: "#39ff14" },
  { id: "math" as GameId, name: "Caro (Gomoku)", desc: "First to 5 in a row wins", icon: Trophy, color: "#ffff00" },
];

export default function GamesPage() {
  const [active, setActive] = useState<GameId>("memory");

  return (
    <div className="min-h-screen p-6" style={{ background: "var(--bg-primary)" }}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <Gamepad2 size={28} style={{ color: "#39ff14", filter: "drop-shadow(0 0 8px #39ff14)" }} />
            <h1 className="text-2xl font-bold" style={{ color: "#fff" }}>Mini Games</h1>
          </div>
          <p className="text-sm" style={{ color: "#666" }}>Relax, have fun, and train your mind</p>
        </motion.div>

        {/* Game selector */}
        <div className="flex gap-3 mb-8">
          {GAMES.map((g) => {
            const Icon = g.icon;
            const isActive = active === g.id;
            return (
              <motion.button key={g.id} onClick={() => setActive(g.id)} whileTap={{ scale: 0.96 }}
                className="flex-1 p-3 rounded-xl text-left transition-all"
                style={{
                  background: isActive ? `${g.color}15` : "rgba(255,255,255,0.03)",
                  border: isActive ? `1px solid ${g.color}50` : "1px solid rgba(255,255,255,0.07)",
                  boxShadow: isActive ? `0 0 20px ${g.color}20` : "none",
                }}>
                <Icon size={18} style={{ color: isActive ? g.color : "#666", marginBottom: 4 }} />
                <div className="text-xs font-semibold" style={{ color: isActive ? "#fff" : "#888" }}>{g.name}</div>
                <div className="text-xs" style={{ color: "#555" }}>{g.desc}</div>
              </motion.button>
            );
          })}
        </div>

        {/* Game area */}
        <motion.div key={active} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
          className="p-6 rounded-2xl"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
          {active === "memory" && <MemoryGame />}
          {active === "breathing" && <BreathingGame />}
          {active === "math" && <CaroGame />}
        </motion.div>
      </div>
    </div>
  );
}
