"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, Check, X } from "lucide-react";
import { useApp } from "@/contexts/app-context";
import { useLanguage } from "@/contexts/language-context";
import type { PomodoroMode } from "@/types";
import { todayStr } from "@/lib/utils";

const MODE_CONFIG: Record<PomodoroMode, { minutes: number; color: string; glow: string }> = {
  focus: { minutes: 25, color: "#ff0080", glow: "rgba(255,0,128,0.4)" },
  "short-break": { minutes: 5, color: "#39ff14", glow: "rgba(57,255,20,0.4)" },
  "long-break": { minutes: 15, color: "#00f5ff", glow: "rgba(0,245,255,0.4)" },
};

function beep() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.8);
  } catch {/* noop */}
}

export default function PomodoroPage() {
  const { tasks, pomodoroSessions, addPomodoroSession } = useApp();
  const { t } = useLanguage();

  const [mode, setMode] = useState<PomodoroMode>("focus");
  const [secondsLeft, setSecondsLeft] = useState(MODE_CONFIG.focus.minutes * 60);
  const [running, setRunning] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cfg = MODE_CONFIG[mode];
  const totalSeconds = cfg.minutes * 60;
  const progress = secondsLeft / totalSeconds;

  const todaySessions = pomodoroSessions.filter((s) => s.date === todayStr());
  const focusDoneToday = todaySessions.filter((s) => s.mode === "focus" && s.completed).length;
  const focusMinutesToday = todaySessions
    .filter((s) => s.mode === "focus" && s.completed)
    .reduce((sum, s) => sum + s.duration, 0);

  const switchMode = useCallback((m: PomodoroMode) => {
    setMode(m);
    setSecondsLeft(MODE_CONFIG[m].minutes * 60);
    setRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  const handleReset = useCallback(() => {
    setSecondsLeft(totalSeconds);
    setRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, [totalSeconds]);

  const handleComplete = useCallback((completed: boolean) => {
    beep();
    addPomodoroSession(mode, cfg.minutes, completed, selectedTaskId || undefined);
    setSecondsLeft(totalSeconds);
    setRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, [mode, cfg.minutes, selectedTaskId, addPomodoroSession, totalSeconds]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            handleComplete(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, handleComplete]);

  // Reset timer when mode changes
  useEffect(() => {
    setSecondsLeft(MODE_CONFIG[mode].minutes * 60);
  }, [mode]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timeDisplay = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  // SVG circle
  const R = 90;
  const circumference = 2 * Math.PI * R;
  const strokeDashoffset = circumference * (1 - progress);

  const pendingTasks = tasks.filter((t) => t.status !== "done");
  const showBreakSuggestion = focusDoneToday > 0 && focusDoneToday % 4 === 0 && mode === "focus";

  const modeLabel = (m: PomodoroMode) =>
    m === "focus" ? t("pomodoro_focus") : m === "short-break" ? t("pomodoro_short_break") : t("pomodoro_long_break");

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Mode tabs */}
      <div className="flex gap-2">
        {(["focus", "short-break", "long-break"] as PomodoroMode[]).map((m) => (
          <button key={m} onClick={() => switchMode(m)}
            className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
            style={{
              background: mode === m ? `rgba(${m === "focus" ? "255,0,128" : m === "short-break" ? "57,255,20" : "0,245,255"},0.15)` : "rgba(255,255,255,0.04)",
              border: `1px solid ${mode === m ? cfg.color : "rgba(255,255,255,0.08)"}`,
              color: mode === m ? cfg.color : "#6b8096",
            }}>
            {modeLabel(m)}
          </button>
        ))}
      </div>

      {/* Suggestion banner */}
      <AnimatePresence>
        {showBreakSuggestion && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="px-4 py-2.5 rounded-lg text-sm"
            style={{ background: "rgba(0,245,255,0.08)", border: "1px solid rgba(0,245,255,0.2)", color: "#00f5ff" }}>
            💡 {t("pomodoro_suggest_break")}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Timer ring */}
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-8 flex flex-col items-center gap-6">
        <div className="relative">
          <svg width={220} height={220} className="-rotate-90">
            {/* Track */}
            <circle cx={110} cy={110} r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={8} />
            {/* Progress */}
            <circle cx={110} cy={110} r={R} fill="none"
              stroke={cfg.color} strokeWidth={8}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              style={{ transition: "stroke-dashoffset 1s linear", filter: `drop-shadow(0 0 6px ${cfg.glow})` }}
            />
          </svg>
          {/* Time display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-5xl font-bold font-mono tracking-wider"
              style={{ color: cfg.color, textShadow: `0 0 20px ${cfg.glow}` }}>
              {timeDisplay}
            </span>
            <span className="text-xs text-gray-500 mt-1 uppercase tracking-widest">{modeLabel(mode)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <button onClick={handleReset}
            className="p-3 rounded-full text-gray-500 hover:text-gray-300 transition-colors"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <RotateCcw size={18} />
          </button>

          <button onClick={() => setRunning((r) => !r)}
            className="px-8 py-3 rounded-full font-bold text-lg transition-all active:scale-95"
            style={{
              background: `linear-gradient(135deg, ${cfg.color}22, ${cfg.color}44)`,
              border: `2px solid ${cfg.color}`,
              color: cfg.color,
              boxShadow: running ? `0 0 20px ${cfg.glow}` : "none",
            }}>
            {running ? <Pause size={24} /> : <Play size={24} />}
          </button>

          {running && (
            <button onClick={() => handleComplete(false)}
              className="p-3 rounded-full text-gray-500 hover:text-red-400 transition-colors"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <X size={18} />
            </button>
          )}

          {!running && secondsLeft < totalSeconds && (
            <button onClick={() => handleComplete(true)}
              className="p-3 rounded-full text-green-400 transition-colors"
              style={{ background: "rgba(57,255,20,0.08)", border: "1px solid rgba(57,255,20,0.2)" }}>
              <Check size={18} />
            </button>
          )}
        </div>

        {/* Task selector */}
        <div className="w-full max-w-xs">
          <select value={selectedTaskId} onChange={(e) => setSelectedTaskId(e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm bg-transparent border"
            style={{ borderColor: "rgba(255,255,255,0.1)", color: selectedTaskId ? "#e2e8f0" : "#6b8096" }}>
            <option value="">{t("pomodoro_select_task")}</option>
            {pendingTasks.map((task) => (
              <option key={task.id} value={task.id}>{task.title}</option>
            ))}
          </select>
        </div>
      </motion.div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{t("pomodoro_sessions_today")}</p>
          <p className="text-2xl font-bold" style={{ color: "#ff0080" }}>{focusDoneToday}</p>
          <p className="text-xs text-gray-600 mt-0.5">🍅 Pomodoros</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{t("pomodoro_focus_time")}</p>
          <p className="text-2xl font-bold" style={{ color: "#bf00ff" }}>{focusMinutesToday}<span className="text-sm ml-1">min</span></p>
          <p className="text-xs text-gray-600 mt-0.5">⏱ Total focus</p>
        </motion.div>
      </div>

      {/* Session history */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-4">
        <h3 className="text-sm font-semibold text-gray-200 mb-3">{t("pomodoro_history")}</h3>
        {todaySessions.length === 0 ? (
          <p className="text-sm text-gray-500">{t("pomodoro_no_history")}</p>
        ) : (
          <div className="space-y-1.5">
            {[...todaySessions].reverse().map((session) => {
              const scfg = MODE_CONFIG[session.mode];
              const linkedTask = tasks.find((t) => t.id === session.taskId);
              return (
                <div key={session.id} className="flex items-center gap-3 py-2 border-b border-white/4 last:border-0">
                  <span className="text-base">{session.mode === "focus" ? "🍅" : session.mode === "short-break" ? "☕" : "🛋️"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm" style={{ color: scfg.color }}>{modeLabel(session.mode)}</p>
                    {linkedTask && <p className="text-xs text-gray-500 truncate">→ {linkedTask.title}</p>}
                  </div>
                  <span className="text-xs text-gray-500">{session.duration} min</span>
                  <span className="text-xs px-2 py-0.5 rounded-full"
                    style={{
                      background: session.completed ? "rgba(57,255,20,0.1)" : "rgba(255,0,0,0.08)",
                      color: session.completed ? "#39ff14" : "#ff4444",
                      border: `1px solid ${session.completed ? "rgba(57,255,20,0.2)" : "rgba(255,0,0,0.15)"}`,
                    }}>
                    {session.completed ? t("pomodoro_completed_label") : t("pomodoro_skipped_label")}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}
