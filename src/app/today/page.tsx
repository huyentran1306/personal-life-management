"use client";

import { useState } from "react";
import { useApp } from "@/contexts/app-context";
import { motion } from "framer-motion";
import { CheckCircle, Circle, Flame, Sun, Star, ChevronRight, Cake, Brain } from "lucide-react";
import { todayStr } from "@/lib/utils";
import { useGamification } from "@/hooks/useGamification";
import Link from "next/link";

const QUOTES = [
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
  { text: "Small steps every day lead to big results.", author: "Unknown" },
  { text: "Done is better than perfect.", author: "Sheryl Sandberg" },
  { text: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
  { text: "Your future is created by what you do today, not tomorrow.", author: "Robert Kiyosaki" },
  { text: "Discipline is choosing between what you want now and what you want most.", author: "Abraham Lincoln" },
  { text: "Motivation is what gets you started. Habit is what keeps you going.", author: "Jim Ryun" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
];

function getTodayQuote() {
  const day = new Date().getDay();
  return QUOTES[day % QUOTES.length];
}

function getDaysUntilBirthday(birthday: string): number {
  const today = new Date();
  const bday = new Date(birthday);
  const next = new Date(today.getFullYear(), bday.getMonth(), bday.getDate());
  if (next < today) next.setFullYear(today.getFullYear() + 1);
  return Math.ceil((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export default function TodayPage() {
  const { tasks, habits, pomodoroSessions, moodEntries, contacts } = useApp();
  const { state, addXP } = useGamification();
  const today = todayStr();
  const quote = getTodayQuote();

  // Today's tasks
  const todayTasks = tasks.filter((t) => t.dueDate === today && t.status !== "done");
  const doneTodayTasks = tasks.filter((t) => t.dueDate === today && t.status === "done");

  // Today's habits
  const doneHabits = habits.filter((h) => h.completedDates.includes(today));
  const pendingHabits = habits.filter((h) => !h.completedDates.includes(today));

  // Pomodoro today
  const pomosToday = pomodoroSessions.filter((s) => s.date === today && s.mode === "focus" && s.completed).length;
  const focusMinutes = pomodoroSessions.filter((s) => s.date === today && s.mode === "focus" && s.completed).reduce((sum, s) => sum + s.duration, 0);

  // Today's mood
  const todayMood = moodEntries.find((m) => m.date === today);

  // Upcoming birthdays (next 14 days)
  const upcomingBirthdays = contacts
    .filter((c) => c.birthday)
    .map((c) => ({ ...c, daysUntil: getDaysUntilBirthday(c.birthday!) }))
    .filter((c) => c.daysUntil <= 14)
    .sort((a, b) => a.daysUntil - b.daysUntil);

  // Overdue follow-ups
  const overdueFollowups = contacts
    .filter((c) => c.nextFollowup && c.nextFollowup <= today)
    .sort((a, b) => (a.nextFollowup ?? "").localeCompare(b.nextFollowup ?? ""));

  const completionPct = habits.length > 0 ? Math.round((doneHabits.length / habits.length) * 100) : 0;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-1">
          <Sun size={28} style={{ color: "#ffff00", filter: "drop-shadow(0 0 8px #ffff0099)" }} />
          <h1 className="text-2xl font-bold" style={{ color: "#fff" }}>Today</h1>
          <span className="text-sm ml-2" style={{ color: "#6b8096" }}>
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </span>
        </div>
        <p className="text-sm" style={{ color: "#6b8096" }}>Your morning check-in ☀️</p>
      </motion.div>

      {/* Quote card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="p-5 rounded-2xl"
        style={{ background: "linear-gradient(135deg, rgba(0,245,255,0.08), rgba(191,0,255,0.08))", border: "1px solid rgba(0,245,255,0.15)" }}>
        <div className="flex items-start gap-3">
          <Star size={18} style={{ color: "#ffff00", marginTop: 2, flexShrink: 0 }} />
          <div>
            <p className="text-base italic" style={{ color: "#e2e8f0" }}>&ldquo;{quote.text}&rdquo;</p>
            <p className="text-xs mt-1" style={{ color: "#6b8096" }}>— {quote.author}</p>
          </div>
        </div>
      </motion.div>

      {/* Stats bar */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="grid grid-cols-4 gap-3">
        {[
          { label: "Tasks left", value: todayTasks.length, icon: "📋", color: "#ff0080" },
          { label: "Habits done", value: `${doneHabits.length}/${habits.length}`, icon: "✅", color: "#39ff14" },
          { label: "Focus sessions", value: pomosToday, icon: "🍅", color: "#f472b6" },
          { label: "Focus minutes", value: focusMinutes, icon: "⏱️", color: "#00f5ff" },
        ].map((stat) => (
          <div key={stat.label} className="glass-card p-3 rounded-xl text-center">
            <div className="text-2xl mb-1">{stat.icon}</div>
            <div className="text-xl font-bold" style={{ color: stat.color }}>{stat.value}</div>
            <div className="text-xs" style={{ color: "#6b8096" }}>{stat.label}</div>
          </div>
        ))}
      </motion.div>

      {/* Today's tasks */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="glass-card p-5 rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-base" style={{ color: "#fff" }}>📋 Tasks for Today</h2>
          <Link href="/tasks" className="flex items-center gap-1 text-xs" style={{ color: "#00f5ff" }}>
            All tasks <ChevronRight size={12} />
          </Link>
        </div>
        {todayTasks.length === 0 && doneTodayTasks.length === 0 ? (
          <p className="text-sm text-center py-4" style={{ color: "#6b8096" }}>No tasks scheduled for today 🎉</p>
        ) : (
          <div className="space-y-2">
            {todayTasks.map((task) => (
              <div key={task.id} className="flex items-center gap-3 p-2 rounded-xl" style={{ background: "rgba(255,255,255,0.03)" }}>
                <Circle size={18} style={{ color: "#6b8096", flexShrink: 0 }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: "#e2e8f0" }}>{task.title}</p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{
                  background: task.priority === "high" ? "#ff008020" : task.priority === "medium" ? "#ffff0020" : "#39ff1420",
                  color: task.priority === "high" ? "#ff0080" : task.priority === "medium" ? "#ffff00" : "#39ff14",
                }}>{task.priority}</span>
              </div>
            ))}
            {doneTodayTasks.map((task) => (
              <div key={task.id} className="flex items-center gap-3 p-2 rounded-xl opacity-50">
                <CheckCircle size={18} style={{ color: "#39ff14", flexShrink: 0 }} />
                <p className="text-sm line-through truncate" style={{ color: "#6b8096" }}>{task.title}</p>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Habits progress */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="glass-card p-5 rounded-2xl">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-base" style={{ color: "#fff" }}>🔄 Habits</h2>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold" style={{ color: completionPct === 100 ? "#39ff14" : "#00f5ff" }}>{completionPct}%</span>
            <Link href="/habits" className="flex items-center gap-1 text-xs" style={{ color: "#00f5ff" }}>
              All <ChevronRight size={12} />
            </Link>
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-2 rounded-full mb-4 overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
          <motion.div className="h-full rounded-full" initial={{ width: 0 }} animate={{ width: `${completionPct}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            style={{ background: completionPct === 100 ? "#39ff14" : "linear-gradient(90deg, #00f5ff, #bf00ff)" }} />
        </div>
        <div className="space-y-2">
          {pendingHabits.slice(0, 5).map((habit) => (
            <div key={habit.id} className="flex items-center gap-3 p-2 rounded-xl" style={{ background: "rgba(255,255,255,0.03)" }}>
              <span className="text-lg">{habit.icon}</span>
              <span className="flex-1 text-sm" style={{ color: "#e2e8f0" }}>{habit.name}</span>
              <div className="flex items-center gap-1 text-xs" style={{ color: "#ff6600" }}>
                <Flame size={12} /> {habit.streak}
              </div>
            </div>
          ))}
          {doneHabits.slice(0, 3).map((habit) => (
            <div key={habit.id} className="flex items-center gap-3 p-2 rounded-xl opacity-50">
              <span className="text-lg">{habit.icon}</span>
              <span className="flex-1 text-sm line-through" style={{ color: "#6b8096" }}>{habit.name}</span>
              <CheckCircle size={14} style={{ color: "#39ff14" }} />
            </div>
          ))}
        </div>
      </motion.div>

      {/* Upcoming birthdays */}
      {upcomingBirthdays.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="glass-card p-5 rounded-2xl"
          style={{ border: "1px solid rgba(255,0,128,0.2)" }}>
          <h2 className="font-bold text-base mb-3" style={{ color: "#fff" }}>🎂 Upcoming Birthdays</h2>
          <div className="space-y-2">
            {upcomingBirthdays.map((c) => (
              <div key={c.id} className="flex items-center gap-3">
                <span className="text-2xl">{c.avatar}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium" style={{ color: "#e2e8f0" }}>{c.name}</p>
                  <p className="text-xs" style={{ color: "#6b8096" }}>{c.birthday}</p>
                </div>
                <span className="text-xs px-2 py-1 rounded-full font-bold"
                  style={{ background: c.daysUntil === 0 ? "#ff008020" : "#ffff0015", color: c.daysUntil === 0 ? "#ff0080" : "#ffff00" }}>
                  {c.daysUntil === 0 ? "TODAY! 🎉" : `${c.daysUntil}d`}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Overdue follow-ups */}
      {overdueFollowups.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="glass-card p-5 rounded-2xl"
          style={{ border: "1px solid rgba(255,102,0,0.2)" }}>
          <h2 className="font-bold text-base mb-3" style={{ color: "#fff" }}>📞 Follow-up Reminders</h2>
          <div className="space-y-2">
            {overdueFollowups.map((c) => (
              <div key={c.id} className="flex items-center gap-3">
                <span className="text-2xl">{c.avatar}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium" style={{ color: "#e2e8f0" }}>{c.name}</p>
                  <p className="text-xs" style={{ color: "#ff6600" }}>Follow up by {c.nextFollowup}</p>
                </div>
                <Link href="/crm" className="text-xs px-2 py-1 rounded-full"
                  style={{ background: "rgba(255,102,0,0.15)", color: "#ff6600" }}>
                  Contact
                </Link>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* XP today reminder */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
        className="p-4 rounded-2xl flex items-center justify-between"
        style={{ background: "linear-gradient(135deg, rgba(255,255,0,0.06), rgba(0,245,255,0.06))", border: "1px solid rgba(255,255,0,0.15)" }}>
        <div className="flex items-center gap-3">
          <Brain size={20} style={{ color: "#ffff00" }} />
          <div>
            <p className="text-sm font-medium" style={{ color: "#fff" }}>Level {state.level} · {state.xp} XP total</p>
            <p className="text-xs" style={{ color: "#6b8096" }}>Complete tasks, habits & pomodoros to earn XP</p>
          </div>
        </div>
        <Link href="/achievements" className="text-xs px-3 py-1 rounded-full"
          style={{ background: "rgba(255,255,0,0.12)", color: "#ffff00" }}>
          View
        </Link>
      </motion.div>
    </div>
  );
}
