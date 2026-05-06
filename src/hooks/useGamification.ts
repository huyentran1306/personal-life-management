"use client";

import { useState, useEffect, useCallback } from "react";

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  unlockedAt?: string;
}

export interface GamificationState {
  xp: number;
  level: number;
  badges: Badge[];
  totalTasksDone: number;
  totalHabitsDone: number;
  totalPomodoros: number;
}

const XP_PER_LEVEL = 100;
const STORAGE_KEY = "plm-gamification";

const ALL_BADGES: Omit<Badge, "unlockedAt">[] = [
  { id: "first_task", name: "First Step", description: "Complete your first task", icon: "✅", color: "#39ff14" },
  { id: "task_10", name: "Task Crusher", description: "Complete 10 tasks", icon: "🔥", color: "#ff6600" },
  { id: "task_50", name: "Productivity Master", description: "Complete 50 tasks", icon: "🏆", color: "#ffff00" },
  { id: "first_habit", name: "Habit Starter", description: "Complete a habit for the first time", icon: "🌱", color: "#39ff14" },
  { id: "habit_7", name: "Week Warrior", description: "7-day habit streak", icon: "⚡", color: "#00f5ff" },
  { id: "habit_30", name: "Habit Master", description: "30-day habit streak", icon: "💎", color: "#bf00ff" },
  { id: "first_pomodoro", name: "Focus Beginner", description: "Complete your first focus session", icon: "🍅", color: "#ff0080" },
  { id: "pomodoro_10", name: "Deep Worker", description: "Complete 10 focus sessions", icon: "🎯", color: "#ff0080" },
  { id: "pomodoro_50", name: "Flow State", description: "Complete 50 focus sessions", icon: "🚀", color: "#bf00ff" },
  { id: "level_5", name: "Rising Star", description: "Reach Level 5", icon: "⭐", color: "#ffff00" },
  { id: "level_10", name: "Life Optimizer", description: "Reach Level 10", icon: "🌟", color: "#00f5ff" },
];

function loadState(): GamificationState {
  if (typeof window === "undefined") return getDefaultState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : getDefaultState();
  } catch { return getDefaultState(); }
}

function getDefaultState(): GamificationState {
  return { xp: 0, level: 1, badges: [], totalTasksDone: 0, totalHabitsDone: 0, totalPomodoros: 0 };
}

function calcLevel(xp: number): number {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}

export function useGamification() {
  const [state, setState] = useState<GamificationState>(getDefaultState);
  const [newBadge, setNewBadge] = useState<Badge | null>(null);

  useEffect(() => { setState(loadState()); }, []);

  function persist(s: GamificationState) {
    setState(s);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  }

  function checkBadges(s: GamificationState): GamificationState {
    const existingIds = new Set(s.badges.map((b) => b.id));
    const newBadges: Badge[] = [];

    const conditions: Record<string, boolean> = {
      first_task: s.totalTasksDone >= 1,
      task_10: s.totalTasksDone >= 10,
      task_50: s.totalTasksDone >= 50,
      first_habit: s.totalHabitsDone >= 1,
      habit_7: s.totalHabitsDone >= 7,
      habit_30: s.totalHabitsDone >= 30,
      first_pomodoro: s.totalPomodoros >= 1,
      pomodoro_10: s.totalPomodoros >= 10,
      pomodoro_50: s.totalPomodoros >= 50,
      level_5: s.level >= 5,
      level_10: s.level >= 10,
    };

    ALL_BADGES.forEach((badge) => {
      if (!existingIds.has(badge.id) && conditions[badge.id]) {
        const unlocked: Badge = { ...badge, unlockedAt: new Date().toISOString() };
        newBadges.push(unlocked);
        setNewBadge(unlocked); // show the most recent one
      }
    });

    return { ...s, badges: [...s.badges, ...newBadges] };
  }

  const addXP = useCallback((amount: number, type?: "task" | "habit" | "pomodoro") => {
    setState((prev) => {
      const newXP = prev.xp + amount;
      const newLevel = calcLevel(newXP);
      let updated: GamificationState = {
        ...prev,
        xp: newXP,
        level: newLevel,
        totalTasksDone: type === "task" ? prev.totalTasksDone + 1 : prev.totalTasksDone,
        totalHabitsDone: type === "habit" ? prev.totalHabitsDone + 1 : prev.totalHabitsDone,
        totalPomodoros: type === "pomodoro" ? prev.totalPomodoros + 1 : prev.totalPomodoros,
      };
      updated = checkBadges(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const xpForCurrentLevel = state.xp - (state.level - 1) * XP_PER_LEVEL;
  const xpProgress = (xpForCurrentLevel / XP_PER_LEVEL) * 100;

  return { state, addXP, xpProgress, xpForCurrentLevel, XP_PER_LEVEL, ALL_BADGES, newBadge, setNewBadge };
}
