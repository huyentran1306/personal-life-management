"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, Check, X, Flame, Target, Clock4, Zap, Maximize2, Minimize2 } from "lucide-react";
import { useApp } from "@/contexts/app-context";
import { useLanguage } from "@/contexts/language-context";
import { useGamification } from "@/hooks/useGamification";
import type { PomodoroMode } from "@/types";
import { todayStr } from "@/lib/utils";

type ModeKey = PomodoroMode;

const MODE_CONFIG: Record<ModeKey, { minutes: number; label: string; color: string; glow: string; bg: string; trackColor: string; name: string }> = {
  focus:         { minutes: 25, label: "FOCUS",       name: "Focus",       color: "#f472b6", glow: "rgba(244,114,182,0.5)",  bg: "rgba(244,114,182,0.05)",  trackColor: "rgba(244,114,182,0.12)" },
  "short-break": { minutes: 5,  label: "SHORT BREAK", name: "Short Break", color: "#4ade80", glow: "rgba(74,222,128,0.5)",   bg: "rgba(74,222,128,0.05)",   trackColor: "rgba(74,222,128,0.12)" },
  "long-break":  { minutes: 15, label: "LONG BREAK",  name: "Long Break",  color: "#38bdf8", glow: "rgba(56,189,248,0.5)",   bg: "rgba(56,189,248,0.05)",   trackColor: "rgba(56,189,248,0.12)" },
};

const SESSIONS_BEFORE_LONG_BREAK = 4;

function beep(type: "start" | "complete" = "complete") {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    if (type === "complete") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(523, ctx.currentTime);
      osc.frequency.setValueAtTime(659, ctx.currentTime + 0.15);
      osc.frequency.setValueAtTime(784, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
    } else {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    }
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.9);
  } catch {/* noop */}
}

// Generate stable star data
const STARS = Array.from({ length: 60 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 2.5 + 0.5,
  delay: Math.random() * 8,
  duration: Math.random() * 8 + 6,
  driftX: (Math.random() - 0.5) * 40,
  driftY: (Math.random() - 0.5) * 30,
  opacity: Math.random() * 0.5 + 0.2,
}));

const NEBULAS = Array.from({ length: 4 }, (_, i) => ({
  id: i,
  x: [20, 70, 30, 80][i],
  y: [25, 15, 75, 65][i],
  size: [200, 160, 180, 140][i],
  duration: [12, 15, 10, 14][i],
  delay: [0, 3, 6, 9][i],
}));

export default function PomodoroPage() {
  const { tasks, pomodoroSessions, addPomodoroSession } = useApp();
  const { t } = useLanguage();
  const { addXP } = useGamification();
  const [mode, setMode] = useState<ModeKey>("focus");
  const [secondsLeft, setSecondsLeft] = useState(MODE_CONFIG.focus.minutes * 60);
  const [running, setRunning] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  const [justCompleted, setJustCompleted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pageRef = useRef<HTMLDivElement>(null);

  const cfg = MODE_CONFIG[mode];
  const totalSeconds = cfg.minutes * 60;
  const progress = secondsLeft / totalSeconds;
  const percent = Math.round((1 - progress) * 100);

  const todaySessions = pomodoroSessions.filter((s) => s.date === todayStr());
  const focusDoneToday = todaySessions.filter((s) => s.mode === "focus" && s.completed).length;
  const focusMinutesToday = todaySessions.filter((s) => s.mode === "focus" && s.completed).reduce((sum, s) => sum + s.duration, 0);
  const cycleProgress = focusDoneToday % SESSIONS_BEFORE_LONG_BREAK;

  const switchMode = useCallback((m: ModeKey) => {
    setMode(m); setSecondsLeft(MODE_CONFIG[m].minutes * 60); setRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  const handleReset = useCallback(() => {
    setSecondsLeft(totalSeconds); setRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, [totalSeconds]);

  const handleComplete = useCallback((completed: boolean) => {
    if (completed) { beep("complete"); setJustCompleted(true); setTimeout(() => setJustCompleted(false), 2500); if (mode === "focus") addXP(25, "pomodoro"); }
    addPomodoroSession(mode, cfg.minutes, completed, selectedTaskId || undefined);
    setSecondsLeft(totalSeconds); setRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, [mode, cfg.minutes, selectedTaskId, addPomodoroSession, totalSeconds]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) { clearInterval(intervalRef.current!); handleComplete(true); return 0; }
          return prev - 1;
        });
      }, 1000);
    } else if (intervalRef.current) clearInterval(intervalRef.current);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, handleComplete]);

  useEffect(() => { setSecondsLeft(MODE_CONFIG[mode].minutes * 60); }, [mode]);

  // Fullscreen
  const toggleFullscreen = useCallback(async () => {
    const el = pageRef.current;
    if (!el) return;
    try {
      if (!document.fullscreenElement) {
        await el.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (e) { console.warn("Fullscreen error:", e); }
  }, []);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timeDisplay = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  const pendingTasks = tasks.filter((t) => t.status !== "done");
  const modeLabel = (m: ModeKey) =>
    m === "focus" ? t("pomodoro_focus") : m === "short-break" ? t("pomodoro_short_break") : t("pomodoro_long_break");

  // Shared timer ring JSX (used in both layouts)
  const timerRingBlock = (
    <div className="flex flex-col items-center gap-5">
      {/* Cycle indicator */}
      <div className="flex items-center gap-3">
        <span className="text-[10px] text-gray-600 uppercase tracking-[0.2em] font-mono">Cycle</span>
        <div className="flex gap-2">
          {Array.from({ length: SESSIONS_BEFORE_LONG_BREAK }).map((_, i) => (
            <motion.div key={i}
              animate={{ scale: i === cycleProgress && running ? [1, 1.4, 1] : 1 }}
              transition={{ duration: 1.5, repeat: running && i === cycleProgress ? Infinity : 0 }}
              className="w-2.5 h-2.5 rounded-full transition-all duration-300"
              style={{
                background: i < cycleProgress ? cfg.color : i === cycleProgress && running ? cfg.color : "rgba(255,255,255,0.08)",
                boxShadow: i <= cycleProgress ? `0 0 8px ${cfg.glow}` : "none",
              }} />
          ))}
        </div>
        <span className="text-[10px] font-mono" style={{ color: cfg.color }}>
          {cycleProgress}/{SESSIONS_BEFORE_LONG_BREAK}
        </span>
      </div>

      {/* Timer ring */}
      <div className="relative flex items-center justify-center">
        {running && <>
          <motion.div className="absolute rounded-full pointer-events-none"
            style={{ width: isFullscreen ? 400 : 336, height: isFullscreen ? 400 : 336, border: `1px solid ${cfg.color}`, opacity: 0 }}
            animate={{ scale: [1, 1.08], opacity: [0.5, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeOut" }} />
          <motion.div className="absolute rounded-full pointer-events-none"
            style={{ width: isFullscreen ? 400 : 336, height: isFullscreen ? 400 : 336, border: `1px solid ${cfg.color}`, opacity: 0 }}
            animate={{ scale: [1, 1.16], opacity: [0.3, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeOut", delay: 1.2 }} />
        </>}

        {(() => {
          const svgSize = isFullscreen ? 380 : 310;
          const cx = svgSize / 2;
          const r = isFullscreen ? 168 : 130;
          const circ = 2 * Math.PI * r;
          const dashOff = circ * progress;
          const dotA = ((1 - progress) * 360 - 90) * (Math.PI / 180);
          const dx = cx + r * Math.cos(dotA);
          const dy = cx + r * Math.sin(dotA);
          return (
            <svg width={svgSize} height={svgSize} className="-rotate-90" style={{ overflow: "visible" }}>
              {Array.from({ length: 60 }).map((_, i) => {
                const a = (i * 360) / 60;
                const rad = (a * Math.PI) / 180;
                const isMajor = i % 5 === 0;
                const outer = cx - 13, inner = outer - (isMajor ? 10 : 5);
                const isActive = i / 60 <= (1 - progress);
                return (
                  <line key={i}
                    x1={cx + outer * Math.cos(rad)} y1={cx + outer * Math.sin(rad)}
                    x2={cx + inner * Math.cos(rad)} y2={cx + inner * Math.sin(rad)}
                    stroke={isActive ? cfg.color : "rgba(255,255,255,0.07)"}
                    strokeWidth={isMajor ? 2.5 : 1.2} strokeLinecap="round"
                  />
                );
              })}
              <circle cx={cx} cy={cx} r={r} fill="none" stroke={cfg.trackColor} strokeWidth={isFullscreen ? 14 : 12} />
              <circle cx={cx} cy={cx} r={r} fill="none"
                stroke={cfg.color} strokeWidth={isFullscreen ? 14 : 12} strokeLinecap="round"
                strokeDasharray={circ} strokeDashoffset={dashOff}
                style={{
                  transition: running ? "stroke-dashoffset 1s linear" : "stroke-dashoffset 0.4s ease",
                  filter: running
                    ? `drop-shadow(0 0 10px ${cfg.color}) drop-shadow(0 0 22px ${cfg.glow})`
                    : `drop-shadow(0 0 5px ${cfg.color})`,
                }}
              />
              {progress < 0.99 && progress > 0.01 && (
                <circle cx={dx} cy={dy} r={isFullscreen ? 10 : 8} fill={cfg.color}
                  style={{ filter: `drop-shadow(0 0 12px ${cfg.glow})` }} />
              )}
            </svg>
          );
        })()}

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center select-none">
          <AnimatePresence mode="wait">
            <motion.span key={Math.floor(secondsLeft / 60)}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="font-mono font-black tracking-widest leading-none"
              style={{
                fontSize: isFullscreen ? "5.5rem" : "4.4rem",
                color: cfg.color,
                textShadow: `0 0 30px ${cfg.glow}, 0 0 60px ${cfg.glow}`,
              }}>
              {timeDisplay}
            </motion.span>
          </AnimatePresence>
          <span className="text-[10px] font-bold tracking-[0.3em] uppercase mt-2.5" style={{ color: `${cfg.color}88` }}>
            {cfg.label}
          </span>
          <motion.span key={percent}
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="text-xs font-mono mt-2 px-3 py-0.5 rounded-full font-semibold"
            style={{ background: `${cfg.color}15`, color: `${cfg.color}cc`, border: `1px solid ${cfg.color}30` }}>
            {percent}%
          </motion.span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-6">
        <motion.button onClick={handleReset} whileTap={{ scale: 0.9 }}
          className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <RotateCcw size={18} className="text-gray-500" />
        </motion.button>

        <motion.button
          onClick={() => { setRunning((r) => { if (!r) beep("start"); return !r; }); }}
          whileTap={{ scale: 0.94 }}
          className="w-24 h-24 rounded-full flex items-center justify-center"
          style={{
            background: `linear-gradient(135deg, ${cfg.color}25, ${cfg.color}45)`,
            border: `2px solid ${cfg.color}`,
            color: cfg.color,
            boxShadow: running ? `0 0 50px ${cfg.glow}, 0 0 100px ${cfg.glow}` : `0 0 16px ${cfg.glow}`,
          }}
          animate={running ? { boxShadow: [`0 0 25px ${cfg.glow}`, `0 0 60px ${cfg.glow}`, `0 0 25px ${cfg.glow}`] } : {}}
          transition={{ duration: 2, repeat: Infinity }}>
          {running ? <Pause size={36} /> : <Play size={36} className="ml-1" />}
        </motion.button>

        {running ? (
          <motion.button onClick={() => handleComplete(false)} whileTap={{ scale: 0.9 }}
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,100,100,0.08)", border: "1px solid rgba(255,100,100,0.25)" }}>
            <X size={18} className="text-red-400" />
          </motion.button>
        ) : secondsLeft < totalSeconds ? (
          <motion.button onClick={() => handleComplete(true)} whileTap={{ scale: 0.9 }}
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.3)" }}>
            <Check size={20} className="text-green-400" />
          </motion.button>
        ) : <div className="w-12 h-12" />}
      </div>

      {/* Ambient hint */}
      <motion.p
        animate={{ opacity: running ? [0.5, 1, 0.5] : [0.2, 0.4, 0.2] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="text-xs tracking-[0.25em] uppercase font-mono pb-1"
        style={{ color: running ? `${cfg.color}80` : "rgba(255,255,255,0.12)" }}>
        {running ? `✦ ${cfg.name} — stay in the zone ✦` : "✦ press play to begin your session ✦"}
      </motion.p>
    </div>
  );

  // Shared star background JSX (for timer card)
  const starBgBlock = (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {STARS.map((star) => (
        <motion.div key={star.id}
          className="absolute rounded-full"
          style={{
            left: `${star.x}%`, top: `${star.y}%`,
            width: running ? star.size + 1 : star.size,
            height: running ? star.size + 1 : star.size,
            background: running ? cfg.color : "#ffffff",
            boxShadow: running
              ? `0 0 ${(star.size + 1) * 4}px ${cfg.color}70`
              : `0 0 ${star.size * 2}px rgba(255,255,255,0.25)`,
          }}
          animate={{
            x: [0, star.driftX * 0.5, 0],
            y: [0, star.driftY * 0.5, 0],
            opacity: running
              ? [star.opacity * 0.6, star.opacity * 1.2, star.opacity * 0.6]
              : [star.opacity * 0.25, star.opacity * 0.6, star.opacity * 0.25],
            scale: [0.8, 1.5, 0.8],
          }}
          transition={{ duration: star.duration, delay: star.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
      {running && [0, 1].map((i) => (
        <motion.div key={`shoot-${i}`}
          className="absolute h-px rounded-full"
          style={{
            background: `linear-gradient(90deg, transparent, ${cfg.color}cc, transparent)`,
            top: `${[28, 62][i]}%`,
            width: 80,
          }}
          animate={{ left: ["-15%", "115%"], opacity: [0, 1, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, repeatDelay: [5, 8][i] + i * 3, ease: "easeInOut", delay: i * 4 }}
        />
      ))}
      {NEBULAS.slice(0, 2).map((n) => (
        <motion.div key={n.id} className="absolute rounded-full pointer-events-none"
          style={{
            left: `${n.x}%`, top: `${n.y}%`,
            width: n.size * 0.7, height: n.size * 0.7,
            background: `radial-gradient(circle, ${cfg.color}0a 0%, transparent 70%)`,
            transform: "translate(-50%, -50%)",
          }}
          animate={{ scale: [1, 1.5, 1], opacity: [0.4, 0.9, 0.4] }}
          transition={{ duration: n.duration, delay: n.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  );

  // Right panel for fullscreen
  const rightPanelBlock = (
    <div className="flex flex-col gap-6 w-72">
      <div>
        <p className="text-xs uppercase tracking-widest mb-3 font-mono" style={{ color: "rgba(255,255,255,0.2)" }}>Today&apos;s progress</p>
        <div className="space-y-3">
          {[
            { label: "Sessions", value: focusDoneToday, unit: "🍅", color: cfg.color },
            { label: "Focus Time", value: focusMinutesToday, unit: " min", color: cfg.color },
            { label: "Cycle", value: `${cycleProgress}/${SESSIONS_BEFORE_LONG_BREAK}`, unit: "", color: cfg.color },
          ].map((s) => (
            <div key={s.label} className="flex items-center justify-between p-3 rounded-xl"
              style={{ background: `${cfg.color}08`, border: `1px solid ${cfg.color}20` }}>
              <span className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>{s.label}</span>
              <span className="font-bold font-mono text-lg" style={{ color: s.color }}>{s.value}{s.unit}</span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs uppercase tracking-widest mb-2 font-mono" style={{ color: "rgba(255,255,255,0.2)" }}>Linked task</p>
        <select value={selectedTaskId} onChange={(e) => setSelectedTaskId(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl text-sm"
          style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.1)", color: selectedTaskId ? "#e2e8f0" : "#6b8096" }}>
          <option value="">{t("pomodoro_select_task")}</option>
          {pendingTasks.map((task) => (
            <option key={task.id} value={task.id}>{task.title}</option>
          ))}
        </select>
      </div>
      <div className="p-4 rounded-xl" style={{ background: `${cfg.color}08`, border: `1px solid ${cfg.color}15` }}>
        <p className="text-sm italic" style={{ color: `${cfg.color}aa`, lineHeight: 1.6 }}>
          &ldquo;The secret of getting ahead is getting started.&rdquo;
        </p>
        <p className="text-xs mt-2" style={{ color: "rgba(255,255,255,0.2)" }}>— Mark Twain</p>
      </div>
    </div>
  );

  // Mode tabs row (shared)
  const modeTabsBlock = (
    <div className="flex gap-2">
      <div className="flex-1 flex gap-1.5 p-1 rounded-2xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
        {(["focus", "short-break", "long-break"] as ModeKey[]).map((m) => (
          <button key={m} onClick={() => switchMode(m)}
            className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all duration-200"
            style={{
              background: mode === m ? `linear-gradient(135deg, ${MODE_CONFIG[m].color}30, ${MODE_CONFIG[m].color}18)` : "transparent",
              border: mode === m ? `1px solid ${MODE_CONFIG[m].color}55` : "1px solid transparent",
              color: mode === m ? MODE_CONFIG[m].color : "#6b8096",
              boxShadow: mode === m ? `0 0 16px ${MODE_CONFIG[m].glow}` : "none",
            }}>
            {modeLabel(m)}
          </button>
        ))}
      </div>
      <motion.button
        onClick={toggleFullscreen}
        whileTap={{ scale: 0.9 }}
        title="Fullscreen"
        className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all"
        style={{
          background: isFullscreen ? `${cfg.color}20` : "rgba(255,255,255,0.04)",
          border: isFullscreen ? `1px solid ${cfg.color}50` : "1px solid rgba(255,255,255,0.1)",
          color: isFullscreen ? cfg.color : "#6b8096",
        }}>
        {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
      </motion.button>
    </div>
  );

  if (isFullscreen) {
    return (
      <div ref={pageRef} className="min-h-screen flex flex-col" style={{ background: "#080f1c" }}>
        {/* Ambient bg nebulas */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
          {NEBULAS.map((n) => (
            <motion.div key={n.id} className="absolute rounded-full"
              style={{
                left: `${n.x}%`, top: `${n.y}%`,
                width: n.size, height: n.size,
                background: `radial-gradient(circle, ${cfg.color}12 0%, transparent 70%)`,
                transform: "translate(-50%, -50%)",
              }}
              animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: n.duration, delay: n.delay, repeat: Infinity, ease: "easeInOut" }} />
          ))}
        </div>

        {/* Top bar */}
        <div className="relative z-10 flex justify-between items-center px-10 pt-7 pb-4">
          {modeTabsBlock}
        </div>

        {/* Completion flash */}
        <AnimatePresence>
          {justCompleted && (
            <motion.div initial={{ opacity: 0, scale: 0.8, y: -10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.8 }}
              className="relative z-10 mx-auto text-center py-4 px-8 rounded-2xl font-bold text-base"
              style={{ background: `linear-gradient(135deg, ${cfg.color}22, ${cfg.color}11)`, color: cfg.color, border: `1px solid ${cfg.color}44` }}>
              🎉 Session Complete! +20 XP
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main 2-column content */}
        <div className="relative z-10 flex-1 flex items-center justify-center gap-20 px-12 py-6">
          {/* Timer card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative rounded-3xl overflow-hidden flex-shrink-0"
            style={{
              padding: "3rem 2.5rem",
              background: running
                ? `linear-gradient(160deg, ${cfg.bg}, rgba(8,15,28,0.97))`
                : "rgba(8,15,28,0.88)",
              border: `1px solid ${running ? cfg.color + "30" : "rgba(255,255,255,0.07)"}`,
              boxShadow: running ? `0 0 60px ${cfg.color}15, inset 0 0 60px rgba(0,0,0,0.3)` : "none",
            }}
          >
            {running && (
              <motion.div className="absolute inset-0 pointer-events-none"
                animate={{ opacity: [0.15, 0.4, 0.15] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                style={{ background: `radial-gradient(ellipse at 50% 35%, ${cfg.glow} 0%, transparent 60%)` }} />
            )}
            {starBgBlock}
            <div className="relative z-10">{timerRingBlock}</div>
          </motion.div>

          {/* Right panel */}
          {rightPanelBlock}
        </div>
      </div>
    );
  }

  return (
    <div ref={pageRef} className="flex flex-col">
      <div className="relative z-10 space-y-4 max-w-2xl mx-auto w-full">

        {/* Completion flash */}
        <AnimatePresence>
          {justCompleted && (
            <motion.div initial={{ opacity: 0, scale: 0.8, y: -10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.8 }}
              className="text-center py-4 rounded-2xl font-bold text-base"
              style={{ background: `linear-gradient(135deg, ${cfg.color}22, ${cfg.color}11)`, color: cfg.color, border: `1px solid ${cfg.color}44` }}>
              🎉 Session Complete! +20 XP
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mode tabs + fullscreen */}
        <div className="flex gap-2">
          <div className="flex-1 flex gap-1.5 p-1 rounded-2xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            {(["focus", "short-break", "long-break"] as ModeKey[]).map((m) => (
              <button key={m} onClick={() => switchMode(m)}
                className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all duration-200"
                style={{
                  background: mode === m ? `linear-gradient(135deg, ${MODE_CONFIG[m].color}30, ${MODE_CONFIG[m].color}18)` : "transparent",
                  border: mode === m ? `1px solid ${MODE_CONFIG[m].color}55` : "1px solid transparent",
                  color: mode === m ? MODE_CONFIG[m].color : "#6b8096",
                  boxShadow: mode === m ? `0 0 16px ${MODE_CONFIG[m].glow}` : "none",
                }}>
                {modeLabel(m)}
              </button>
            ))}
          </div>
          <motion.button
            onClick={toggleFullscreen}
            whileTap={{ scale: 0.9 }}
            title="Fullscreen"
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all"
            style={{
              background: isFullscreen ? `${cfg.color}20` : "rgba(255,255,255,0.04)",
              border: isFullscreen ? `1px solid ${cfg.color}50` : "1px solid rgba(255,255,255,0.1)",
              color: isFullscreen ? cfg.color : "#6b8096",
            }}>
            {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </motion.button>
        </div>

        {/* Main card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative rounded-3xl overflow-hidden"
          style={{
            padding: isFullscreen ? "3rem 2.5rem" : "2.5rem 2rem",
            background: running
              ? `linear-gradient(160deg, ${cfg.bg}, rgba(8,15,28,0.97))`
              : "rgba(8,15,28,0.88)",
            border: `1px solid ${running ? cfg.color + "30" : "rgba(255,255,255,0.07)"}`,
            boxShadow: running ? `0 0 60px ${cfg.color}15, inset 0 0 60px rgba(0,0,0,0.3)` : "none",
          }}
        >
          {/* Ambient glow */}
          {running && (
            <motion.div className="absolute inset-0 pointer-events-none"
              animate={{ opacity: [0.15, 0.4, 0.15] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              style={{ background: `radial-gradient(ellipse at 50% 35%, ${cfg.glow} 0%, transparent 60%)` }} />
          )}

          {/* Star field */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {STARS.map((star) => (
              <motion.div key={star.id}
                className="absolute rounded-full"
                style={{
                  left: `${star.x}%`, top: `${star.y}%`,
                  width: running ? star.size + 1 : star.size,
                  height: running ? star.size + 1 : star.size,
                  background: running ? cfg.color : "#ffffff",
                  boxShadow: running
                    ? `0 0 ${(star.size + 1) * 4}px ${cfg.color}70`
                    : `0 0 ${star.size * 2}px rgba(255,255,255,0.25)`,
                }}
                animate={{
                  x: [0, star.driftX * 0.5, 0],
                  y: [0, star.driftY * 0.5, 0],
                  opacity: running
                    ? [star.opacity * 0.6, star.opacity * 1.2, star.opacity * 0.6]
                    : [star.opacity * 0.25, star.opacity * 0.6, star.opacity * 0.25],
                  scale: [0.8, 1.5, 0.8],
                }}
                transition={{ duration: star.duration, delay: star.delay, repeat: Infinity, ease: "easeInOut" }}
              />
            ))}

            {/* Shooting stars */}
            {running && [0, 1].map((i) => (
              <motion.div key={`shoot-${i}`}
                className="absolute h-px rounded-full"
                style={{
                  background: `linear-gradient(90deg, transparent, ${cfg.color}cc, transparent)`,
                  top: `${[28, 62][i]}%`,
                  width: 80,
                }}
                animate={{ left: ["-15%", "115%"], opacity: [0, 1, 0] }}
                transition={{ duration: 2.2, repeat: Infinity, repeatDelay: [5, 8][i] + i * 3, ease: "easeInOut", delay: i * 4 }}
              />
            ))}

            {/* Nebula blobs */}
            {NEBULAS.slice(0, 2).map((n) => (
              <motion.div key={n.id} className="absolute rounded-full pointer-events-none"
                style={{
                  left: `${n.x}%`, top: `${n.y}%`,
                  width: n.size * 0.7, height: n.size * 0.7,
                  background: `radial-gradient(circle, ${cfg.color}0a 0%, transparent 70%)`,
                  transform: "translate(-50%, -50%)",
                }}
                animate={{ scale: [1, 1.5, 1], opacity: [0.4, 0.9, 0.4] }}
                transition={{ duration: n.duration, delay: n.delay, repeat: Infinity, ease: "easeInOut" }}
              />
            ))}
          </div>

          {/* Content — two columns in fullscreen */}
          <div className={isFullscreen ? "relative z-10 flex gap-12 items-center justify-center" : "relative z-10 flex flex-col items-center gap-5"}>

            {/* Left / Center — Timer ring area */}
            <div className="flex flex-col items-center gap-5">

              {/* Cycle indicator */}
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-gray-600 uppercase tracking-[0.2em] font-mono">Cycle</span>
                <div className="flex gap-2">
                  {Array.from({ length: SESSIONS_BEFORE_LONG_BREAK }).map((_, i) => (
                    <motion.div key={i}
                      animate={{ scale: i === cycleProgress && running ? [1, 1.4, 1] : 1 }}
                      transition={{ duration: 1.5, repeat: running && i === cycleProgress ? Infinity : 0 }}
                      className="w-2.5 h-2.5 rounded-full transition-all duration-300"
                      style={{
                        background: i < cycleProgress ? cfg.color : i === cycleProgress && running ? cfg.color : "rgba(255,255,255,0.08)",
                        boxShadow: i <= cycleProgress ? `0 0 8px ${cfg.glow}` : "none",
                      }} />
                  ))}
                </div>
                <span className="text-[10px] font-mono" style={{ color: cfg.color }}>
                  {cycleProgress}/{SESSIONS_BEFORE_LONG_BREAK}
                </span>
              </div>

              {/* Timer ring */}
              <div className="relative flex items-center justify-center">
                {running && <>
                  <motion.div className="absolute rounded-full pointer-events-none"
                    style={{ width: isFullscreen ? 400 : 336, height: isFullscreen ? 400 : 336, border: `1px solid ${cfg.color}`, opacity: 0 }}
                    animate={{ scale: [1, 1.08], opacity: [0.5, 0] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeOut" }} />
                  <motion.div className="absolute rounded-full pointer-events-none"
                    style={{ width: isFullscreen ? 400 : 336, height: isFullscreen ? 400 : 336, border: `1px solid ${cfg.color}`, opacity: 0 }}
                    animate={{ scale: [1, 1.16], opacity: [0.3, 0] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeOut", delay: 1.2 }} />
                </>}

                {(() => {
                  const svgSize = isFullscreen ? 380 : 310;
                  const cx = svgSize / 2;
                  const r = isFullscreen ? 168 : 130;
                  const r1 = r + 12, r2tick = r + 12;
                  const circ = 2 * Math.PI * r;
                  const dashOff = circ * progress;
                  const dotA = ((1 - progress) * 360 - 90) * (Math.PI / 180);
                  const dx = cx + r * Math.cos(dotA);
                  const dy = cx + r * Math.sin(dotA);
                  return (
                    <svg width={svgSize} height={svgSize} className="-rotate-90" style={{ overflow: "visible" }}>
                      {Array.from({ length: 60 }).map((_, i) => {
                        const a = (i * 360) / 60;
                        const rad = (a * Math.PI) / 180;
                        const isMajor = i % 5 === 0;
                        const outer = cx - 13, inner = outer - (isMajor ? 10 : 5);
                        const isActive = i / 60 <= (1 - progress);
                        return (
                          <line key={i}
                            x1={cx + outer * Math.cos(rad)} y1={cx + outer * Math.sin(rad)}
                            x2={cx + inner * Math.cos(rad)} y2={cx + inner * Math.sin(rad)}
                            stroke={isActive ? cfg.color : "rgba(255,255,255,0.07)"}
                            strokeWidth={isMajor ? 2.5 : 1.2} strokeLinecap="round"
                          />
                        );
                      })}
                      <circle cx={cx} cy={cx} r={r} fill="none" stroke={cfg.trackColor} strokeWidth={isFullscreen ? 14 : 12} />
                      <circle cx={cx} cy={cx} r={r} fill="none"
                        stroke={cfg.color} strokeWidth={isFullscreen ? 14 : 12} strokeLinecap="round"
                        strokeDasharray={circ} strokeDashoffset={dashOff}
                        style={{
                          transition: running ? "stroke-dashoffset 1s linear" : "stroke-dashoffset 0.4s ease",
                          filter: running
                            ? `drop-shadow(0 0 10px ${cfg.color}) drop-shadow(0 0 22px ${cfg.glow})`
                            : `drop-shadow(0 0 5px ${cfg.color})`,
                        }}
                      />
                      {progress < 0.99 && progress > 0.01 && (
                        <circle cx={dx} cy={dy} r={isFullscreen ? 10 : 8} fill={cfg.color}
                          style={{ filter: `drop-shadow(0 0 12px ${cfg.glow})` }} />
                      )}
                    </svg>
                  );
                })()}

                {/* Center content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center select-none">
                  <AnimatePresence mode="wait">
                    <motion.span key={Math.floor(secondsLeft / 60)}
                      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.18 }}
                      className="font-mono font-black tracking-widest leading-none"
                      style={{
                        fontSize: isFullscreen ? "5.5rem" : "4.4rem",
                        color: cfg.color,
                        textShadow: `0 0 30px ${cfg.glow}, 0 0 60px ${cfg.glow}`,
                      }}>
                      {timeDisplay}
                    </motion.span>
                  </AnimatePresence>
                  <span className="text-[10px] font-bold tracking-[0.3em] uppercase mt-2.5" style={{ color: `${cfg.color}88` }}>
                    {cfg.label}
                  </span>
                  <motion.span key={percent}
                    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                    className="text-xs font-mono mt-2 px-3 py-0.5 rounded-full font-semibold"
                    style={{ background: `${cfg.color}15`, color: `${cfg.color}cc`, border: `1px solid ${cfg.color}30` }}>
                    {percent}%
                  </motion.span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-6">
                <motion.button onClick={handleReset} whileTap={{ scale: 0.9 }}
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  <RotateCcw size={18} className="text-gray-500" />
                </motion.button>

                <motion.button
                  onClick={() => { setRunning((r) => { if (!r) beep("start"); return !r; }); }}
                  whileTap={{ scale: 0.94 }}
                  className="w-24 h-24 rounded-full flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${cfg.color}25, ${cfg.color}45)`,
                    border: `2px solid ${cfg.color}`,
                    color: cfg.color,
                    boxShadow: running ? `0 0 50px ${cfg.glow}, 0 0 100px ${cfg.glow}` : `0 0 16px ${cfg.glow}`,
                  }}
                  animate={running ? { boxShadow: [`0 0 25px ${cfg.glow}`, `0 0 60px ${cfg.glow}`, `0 0 25px ${cfg.glow}`] } : {}}
                  transition={{ duration: 2, repeat: Infinity }}>
                  {running ? <Pause size={36} /> : <Play size={36} className="ml-1" />}
                </motion.button>

                {running ? (
                  <motion.button onClick={() => handleComplete(false)} whileTap={{ scale: 0.9 }}
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(255,100,100,0.08)", border: "1px solid rgba(255,100,100,0.25)" }}>
                    <X size={18} className="text-red-400" />
                  </motion.button>
                ) : secondsLeft < totalSeconds ? (
                  <motion.button onClick={() => handleComplete(true)} whileTap={{ scale: 0.9 }}
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.3)" }}>
                    <Check size={20} className="text-green-400" />
                  </motion.button>
                ) : <div className="w-12 h-12" />}
              </div>

              {/* Ambient hint */}
              <motion.p
                animate={{ opacity: running ? [0.5, 1, 0.5] : [0.2, 0.4, 0.2] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="text-xs tracking-[0.25em] uppercase font-mono pb-1"
                style={{ color: running ? `${cfg.color}80` : "rgba(255,255,255,0.12)" }}>
                {running ? `✦ ${cfg.name} — stay in the zone ✦` : "✦ press play to begin your session ✦"}
              </motion.p>
            </div>

            {/* Right panel — only in fullscreen */}
            {isFullscreen && (
              <div className="flex flex-col gap-6 min-w-[280px]">
                {/* Big stats */}
                <div>
                  <p className="text-xs uppercase tracking-widest mb-3 font-mono" style={{ color: "rgba(255,255,255,0.2)" }}>Today&apos;s progress</p>
                  <div className="space-y-3">
                    {[
                      { label: "Sessions", value: focusDoneToday, unit: "🍅", color: cfg.color },
                      { label: "Focus Time", value: focusMinutesToday, unit: " min", color: cfg.color },
                      { label: "Cycle", value: `${cycleProgress}/${SESSIONS_BEFORE_LONG_BREAK}`, unit: "", color: cfg.color },
                    ].map((s) => (
                      <div key={s.label} className="flex items-center justify-between p-3 rounded-xl"
                        style={{ background: `${cfg.color}08`, border: `1px solid ${cfg.color}20` }}>
                        <span className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>{s.label}</span>
                        <span className="font-bold font-mono text-lg" style={{ color: s.color }}>{s.value}{s.unit}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Task selector */}
                <div>
                  <p className="text-xs uppercase tracking-widest mb-2 font-mono" style={{ color: "rgba(255,255,255,0.2)" }}>Linked task</p>
                  <select value={selectedTaskId} onChange={(e) => setSelectedTaskId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl text-sm"
                    style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.1)", color: selectedTaskId ? "#e2e8f0" : "#6b8096" }}>
                    <option value="">{t("pomodoro_select_task")}</option>
                    {pendingTasks.map((task) => (
                      <option key={task.id} value={task.id}>{task.title}</option>
                    ))}
                  </select>
                </div>

                {/* Motivational quote */}
                <div className="p-4 rounded-xl" style={{ background: `${cfg.color}08`, border: `1px solid ${cfg.color}15` }}>
                  <p className="text-sm italic" style={{ color: `${cfg.color}aa`, lineHeight: 1.6 }}>
                    &ldquo;The secret of getting ahead is getting started.&rdquo;
                  </p>
                  <p className="text-xs mt-2" style={{ color: "rgba(255,255,255,0.2)" }}>— Mark Twain</p>
                </div>
              </div>
            )}

            {/* Normal mode: task selector below controls */}
            {!isFullscreen && (
              <select value={selectedTaskId} onChange={(e) => setSelectedTaskId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl text-sm"
                style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.1)", color: selectedTaskId ? "#e2e8f0" : "#6b8096" }}>
                <option value="">{t("pomodoro_select_task")}</option>
                {pendingTasks.map((task) => (
                  <option key={task.id} value={task.id}>{task.title}</option>
                ))}
              </select>
            )}
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: t("pomodoro_sessions_today"), value: focusDoneToday, unit: "🍅", color: "#ff0080", icon: <Target size={13} /> },
            { label: t("pomodoro_focus_time"), value: focusMinutesToday, unit: "m", color: "#bf00ff", icon: <Clock4 size={13} /> },
            { label: "Streak", value: cycleProgress === 0 && focusDoneToday > 0 ? 4 : cycleProgress, unit: `/${SESSIONS_BEFORE_LONG_BREAK}`, color: "#ff9500", icon: <Flame size={13} /> },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="glass-card p-3 flex flex-col items-center text-center">
              <div className="mb-1" style={{ color: s.color }}>{s.icon}</div>
              <p className="text-xl font-bold font-mono" style={{ color: s.color }}>
                {s.value}<span className="text-xs ml-0.5">{s.unit}</span>
              </p>
              <p className="text-[9px] text-gray-600 uppercase tracking-wider mt-0.5 leading-tight">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Session history */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card p-4">
          <h3 className="text-sm font-semibold text-gray-200 mb-3 flex items-center gap-2">
            <Zap size={14} style={{ color: "#ff0080" }} /> {t("pomodoro_history")}
          </h3>
          {todaySessions.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">{t("pomodoro_no_history")}</p>
          ) : (
            <div className="space-y-1.5">
              {[...todaySessions].reverse().slice(0, 10).map((session, idx) => {
                const scfg = MODE_CONFIG[session.mode];
                const linkedTask = tasks.find((t) => t.id === session.taskId);
                return (
                  <motion.div key={session.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.03 }}
                    className="flex items-center gap-3 py-1.5 border-b border-white/[0.04] last:border-0">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0"
                      style={{ background: `${scfg.color}12`, border: `1px solid ${scfg.color}22` }}>
                      {session.mode === "focus" ? "🍅" : session.mode === "short-break" ? "☕" : "🛋️"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold" style={{ color: scfg.color }}>{modeLabel(session.mode)}</p>
                      {linkedTask && <p className="text-xs text-gray-600 truncate">→ {linkedTask.title}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-600 font-mono">{session.duration}m</span>
                      <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs"
                        style={{ background: session.completed ? "rgba(57,255,20,0.12)" : "rgba(255,0,0,0.08)", color: session.completed ? "#39ff14" : "#ff6666" }}>
                        {session.completed ? "✓" : "✕"}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>

      </div>
    </div>
  );
}
