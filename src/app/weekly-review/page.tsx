"use client";

import { useMemo } from "react";
import { useApp } from "@/contexts/app-context";
import { motion } from "framer-motion";
import { Calendar, CheckCircle, Flame, Zap, TrendingUp, Download } from "lucide-react";
import { useGamification } from "@/hooks/useGamification";
import { MOOD_CONFIG, MOOD_VALUES } from "@/lib/smart-insights";
import { currencyFormat } from "@/lib/utils";

function getWeekRange() {
  const today = new Date();
  const day = today.getDay(); // 0=Sun
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(d.toISOString().split("T")[0]);
  }
  return dates;
}

function getLastWeekRange() {
  const thisWeek = getWeekRange();
  const d = new Date(thisWeek[0]);
  d.setDate(d.getDate() - 7);
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const x = new Date(d);
    x.setDate(d.getDate() + i);
    dates.push(x.toISOString().split("T")[0]);
  }
  return dates;
}

const MOOD_EMOJI: Record<string, string> = {
  amazing: "🤩", good: "😊", neutral: "😐", bad: "😔", stressed: "😰",
};

export default function WeeklyReviewPage() {
  const { tasks, habits, pomodoroSessions, moodEntries, expenses } = useApp();
  const { state } = useGamification();

  const thisWeek = useMemo(() => getWeekRange(), []);
  const lastWeek = useMemo(() => getLastWeekRange(), []);

  // ─── Tasks ───────────────────────────────────────────────
  const tasksDoneThisWeek = tasks.filter((t) => t.completedAt && thisWeek.includes(t.completedAt.split("T")[0])).length;
  const tasksDoneLastWeek = tasks.filter((t) => t.completedAt && lastWeek.includes(t.completedAt.split("T")[0])).length;
  const tasksCreatedThisWeek = tasks.filter((t) => thisWeek.includes(t.createdAt?.split("T")[0] ?? "")).length;

  // ─── Habits ──────────────────────────────────────────────
  const habitsCompletions = habits.reduce((sum, h) => sum + thisWeek.filter((d) => h.completedDates.includes(d)).length, 0);
  const habitsTotal = habits.length * 7;
  const habitsRate = habitsTotal > 0 ? Math.round((habitsCompletions / habitsTotal) * 100) : 0;
  const habitsRateLast = (() => {
    const c = habits.reduce((sum, h) => sum + lastWeek.filter((d) => h.completedDates.includes(d)).length, 0);
    return habitsTotal > 0 ? Math.round((c / habitsTotal) * 100) : 0;
  })();

  // ─── Pomodoro ────────────────────────────────────────────
  const pomosThisWeek = pomodoroSessions.filter((s) => thisWeek.includes(s.date) && s.mode === "focus" && s.completed);
  const pomosCount = pomosThisWeek.length;
  const pomosMinutes = pomosThisWeek.reduce((sum, s) => sum + s.duration, 0);
  const pomosCountLast = pomodoroSessions.filter((s) => lastWeek.includes(s.date) && s.mode === "focus" && s.completed).length;

  // ─── Mood ────────────────────────────────────────────────
  const moodsThisWeek = moodEntries.filter((m) => thisWeek.includes(m.date));
  const avgMoodValue = moodsThisWeek.length > 0
    ? moodsThisWeek.reduce((sum, m) => sum + (MOOD_VALUES[m.mood] || 3), 0) / moodsThisWeek.length
    : null;
  const avgMoodEmoji = avgMoodValue === null ? "—" : avgMoodValue >= 4.5 ? "🤩" : avgMoodValue >= 3.5 ? "😊" : avgMoodValue >= 2.5 ? "😐" : avgMoodValue >= 1.5 ? "😔" : "😰";
  const dominantMood = moodsThisWeek.reduce<Record<string, number>>((acc, m) => {
    acc[m.mood] = (acc[m.mood] || 0) + 1; return acc;
  }, {});
  const topMood = Object.entries(dominantMood).sort((a, b) => b[1] - a[1])[0]?.[0];

  // ─── Expenses ────────────────────────────────────────────
  const expThisWeek = expenses.filter((e) => thisWeek.includes(e.date));
  const expTotal = expThisWeek.reduce((sum, e) => sum + e.amount, 0);
  const expLastWeek = expenses.filter((e) => lastWeek.includes(e.date)).reduce((sum, e) => sum + e.amount, 0);

  const weekLabel = `${thisWeek[0]} – ${thisWeek[6]}`;

  const handleExport = () => {
    const lines = [
      `Weekly Review: ${weekLabel}`,
      ``,
      `TASKS`,
      `  Done this week: ${tasksDoneThisWeek}`,
      `  Created this week: ${tasksCreatedThisWeek}`,
      ``,
      `HABITS`,
      `  Completions: ${habitsCompletions} / ${habitsTotal} (${habitsRate}%)`,
      ``,
      `POMODORO`,
      `  Sessions: ${pomosCount}`,
      `  Minutes focused: ${pomosMinutes}`,
      ``,
      `MOOD`,
      `  Avg: ${avgMoodEmoji} (${avgMoodValue ? avgMoodValue.toFixed(1) : "N/A"}/5)`,
      `  Dominant: ${topMood ? MOOD_EMOJI[topMood] + " " + topMood : "—"}`,
      ``,
      `EXPENSES`,
      `  Total: ${currencyFormat(expTotal)}`,
      ``,
      `GAMIFICATION`,
      `  Level: ${state.level}`,
      `  Total XP: ${state.xp}`,
    ].join("\n");

    const blob = new Blob([lines], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `weekly-review-${thisWeek[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const delta = (a: number, b: number) => {
    if (b === 0) return null;
    const d = a - b;
    return { val: Math.abs(d), up: d >= 0 };
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Calendar size={26} style={{ color: "#00f5ff", filter: "drop-shadow(0 0 8px #00f5ff88)" }} />
            <h1 className="text-2xl font-bold" style={{ color: "#fff" }}>Weekly Review</h1>
          </div>
          <p className="text-sm" style={{ color: "#6b8096" }}>{weekLabel}</p>
        </div>
        <button onClick={handleExport}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm"
          style={{ background: "rgba(0,245,255,0.08)", border: "1px solid rgba(0,245,255,0.2)", color: "#00f5ff" }}>
          <Download size={14} /> Export
        </button>
      </motion.div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: <CheckCircle size={18} />, label: "Tasks Done", value: tasksDoneThisWeek, prev: tasksDoneLastWeek, color: "#39ff14" },
          { icon: <Flame size={18} />, label: "Habit Rate", value: `${habitsRate}%`, prev: habitsRateLast, color: "#ff6600", prevSuffix: "%" },
          { icon: <Zap size={18} />, label: "Focus Sessions", value: pomosCount, prev: pomosCountLast, color: "#f472b6" },
          { icon: <TrendingUp size={18} />, label: "Expenses", value: currencyFormat(expTotal), prev: null, color: "#ffff00" },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="glass-card p-4">
            <div style={{ color: stat.color, marginBottom: 4 }}>{stat.icon}</div>
            <p className="text-xl font-bold" style={{ color: "#fff" }}>{stat.value}</p>
            <p className="text-xs mt-0.5" style={{ color: "#6b8096" }}>{stat.label}</p>
            {stat.prev !== null && typeof stat.prev === "number" && (() => {
              const d = delta(typeof stat.value === "number" ? stat.value : parseInt(String(stat.value)), stat.prev);
              if (!d) return null;
              return <p className="text-xs mt-1" style={{ color: d.up ? "#39ff14" : "#ff6600" }}>{d.up ? "▲" : "▼"} {d.val}{stat.prevSuffix || ""} vs last week</p>;
            })()}
          </motion.div>
        ))}
      </div>

      {/* Focus minutes bar */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="glass-card p-5 rounded-2xl">
        <h2 className="font-bold text-sm mb-4" style={{ color: "#fff" }}>⏱️ Daily Focus</h2>
        <div className="flex gap-2 items-end">
          {thisWeek.map((day) => {
            const mins = pomodoroSessions
              .filter((s) => s.date === day && s.mode === "focus" && s.completed)
              .reduce((sum, s) => sum + s.duration, 0);
            const maxMins = 120;
            const pct = Math.min((mins / maxMins) * 100, 100);
            const label = new Date(day + "T00:00:00").toLocaleDateString("en-US", { weekday: "short" }).slice(0, 1);
            return (
              <div key={day} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs" style={{ color: "#f472b6", visibility: mins > 0 ? "visible" : "hidden" }}>{mins}m</span>
                <div className="w-full rounded-t-sm" style={{ height: 80, background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "flex-end" }}>
                  <div className="w-full rounded-t-sm transition-all"
                    style={{ height: `${Math.max(pct, mins > 0 ? 4 : 0)}%`, background: "linear-gradient(to top, #f472b6, #bf00ff)" }} />
                </div>
                <span className="text-xs" style={{ color: "#6b8096" }}>{label}</span>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Mood grid */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
        className="glass-card p-5 rounded-2xl">
        <h2 className="font-bold text-sm mb-4" style={{ color: "#fff" }}>
          Mood This Week {avgMoodEmoji !== "—" && <span className="text-2xl ml-2">{avgMoodEmoji}</span>}
        </h2>
        <div className="flex gap-2">
          {thisWeek.map((day) => {
            const entry = moodEntries.find((m) => m.date === day);
            const label = new Date(day + "T00:00:00").toLocaleDateString("en-US", { weekday: "short" }).slice(0, 3);
            const cfg = entry ? MOOD_CONFIG[entry.mood] : null;
            return (
              <div key={day} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                  style={{ background: cfg ? cfg.color + "20" : "rgba(255,255,255,0.04)", border: `1px solid ${cfg ? cfg.color + "40" : "rgba(255,255,255,0.06)"}` }}>
                  {entry ? MOOD_EMOJI[entry.mood] : "—"}
                </div>
                <span className="text-xs" style={{ color: "#6b8096" }}>{label}</span>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Habit completions */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="glass-card p-5 rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-sm" style={{ color: "#fff" }}>🔄 Habit Consistency</h2>
          <span className="text-sm font-bold" style={{ color: habitsRate >= 80 ? "#39ff14" : habitsRate >= 50 ? "#ffff00" : "#ff6600" }}>{habitsRate}%</span>
        </div>
        <div className="space-y-2">
          {habits.map((habit) => {
            const done = thisWeek.filter((d) => habit.completedDates.includes(d)).length;
            const pct = Math.round((done / 7) * 100);
            return (
              <div key={habit.id}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span style={{ color: "#e2e8f0" }}>{habit.icon} {habit.name}</span>
                  <span style={{ color: habit.color }}>{done}/7</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: habit.color, boxShadow: `0 0 6px ${habit.color}60` }} />
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* XP earned */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
        className="p-4 rounded-2xl flex items-center gap-4"
        style={{ background: "linear-gradient(135deg, rgba(255,255,0,0.06), rgba(0,245,255,0.06))", border: "1px solid rgba(255,255,0,0.15)" }}>
        <div className="text-4xl">⭐</div>
        <div>
          <p className="text-lg font-bold" style={{ color: "#ffff00" }}>Level {state.level}</p>
          <p className="text-sm" style={{ color: "#6b8096" }}>{state.xp} total XP · {state.totalTasksDone} tasks · {state.totalPomodoros} pomodoros</p>
        </div>
      </motion.div>
    </div>
  );
}
