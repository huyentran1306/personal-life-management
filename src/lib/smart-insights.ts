import {
  Task,
  Habit,
  MoodEntry,
  Expense,
  SmartInsight,
  MoodType,
} from "@/types";
import { todayStr, daysAgo, getLast7Days, generateId } from "./utils";

// ─── Expense auto-categorize ──────────────────────────────────────────────────
const CATEGORY_RULES: Record<string, string[]> = {
  food: ["coffee", "tea", "lunch", "dinner", "breakfast", "restaurant", "food", "eat", "drink", "pizza", "burger", "cafe", "snack", "grocery", "market"],
  transport: ["grab", "taxi", "uber", "lyft", "bus", "train", "metro", "parking", "gas", "fuel", "flight", "airline", "toll"],
  shopping: ["amazon", "shop", "clothes", "shirt", "shoes", "bag", "mall", "store", "buy", "purchase"],
  entertainment: ["netflix", "spotify", "movie", "cinema", "game", "steam", "play", "concert", "ticket", "stream"],
  health: ["gym", "pharmacy", "medicine", "doctor", "hospital", "clinic", "vitamin", "supplement", "fitness"],
  bills: ["electric", "water", "internet", "phone", "rent", "insurance", "subscription", "utility"],
};

export function categorizeExpense(note: string): string {
  const lower = note.toLowerCase();
  for (const [cat, keywords] of Object.entries(CATEGORY_RULES)) {
    if (keywords.some((k) => lower.includes(k))) return cat;
  }
  return "other";
}

// ─── Rule-based smart insights ────────────────────────────────────────────────
export function generateInsights(
  tasks: Task[],
  habits: Habit[],
  moodEntries: MoodEntry[],
  expenses: Expense[]
): SmartInsight[] {
  const insights: SmartInsight[] = [];
  const today = todayStr();

  // --- Task overload ---
  const pendingTasks = tasks.filter((t) => t.status !== "done");
  if (pendingTasks.length > 5) {
    insights.push({
      id: generateId(),
      message: `You have ${pendingTasks.length} pending tasks. You might be overloaded — consider delegating or deferring some.`,
      severity: "warning",
      icon: "⚡",
      action: "Review Tasks",
    });
  }

  // --- Overdue tasks ---
  const overdue = tasks.filter(
    (t) => t.status !== "done" && t.dueDate < today
  );
  if (overdue.length > 0) {
    insights.push({
      id: generateId(),
      message: `${overdue.length} task${overdue.length > 1 ? "s are" : " is"} overdue. Time to catch up!`,
      severity: "critical",
      icon: "🚨",
      action: "View Overdue",
    });
  }

  // --- Habit missed 2+ days ---
  habits.forEach((habit) => {
    const yesterday = daysAgo(1);
    const twoDaysAgo = daysAgo(2);
    const missedRecently =
      !habit.completedDates.some((d) => d === yesterday) &&
      !habit.completedDates.some((d) => d === twoDaysAgo);
    if (missedRecently && habit.completedDates.length > 0) {
      insights.push({
        id: generateId(),
        message: `You've missed "${habit.name}" for 2+ days. Don't break your streak!`,
        severity: "warning",
        icon: "🔥",
        action: "Track Habits",
      });
    }
  });

  // --- Mood: stressed 3+ days ---
  const last3Days = [daysAgo(0), daysAgo(1), daysAgo(2)];
  const stressedDays = last3Days.filter((day) =>
    moodEntries.some((m) => m.date === day && m.mood === "stressed")
  );
  if (stressedDays.length >= 3) {
    insights.push({
      id: generateId(),
      message: "You've been stressed for 3 days in a row. Consider taking a break and practicing self-care. 🌿",
      severity: "critical",
      icon: "😮‍💨",
      action: "Log Mood",
    });
  }

  // --- Expense spike ---
  const last7Days = getLast7Days();
  const weekExpenses = expenses.filter((e) => last7Days.includes(e.date));
  const weekTotal = weekExpenses.reduce((s, e) => s + e.amount, 0);
  const prevWeek = Array.from({ length: 7 }, (_, i) => daysAgo(7 + (6 - i)));
  const prevExpenses = expenses.filter((e) => prevWeek.includes(e.date));
  const prevTotal = prevExpenses.reduce((s, e) => s + e.amount, 0);
  if (prevTotal > 0 && weekTotal > prevTotal * 1.3) {
    insights.push({
      id: generateId(),
      message: `Your spending this week ($${weekTotal.toFixed(0)}) is 30%+ higher than last week ($${prevTotal.toFixed(0)}). Heads up!`,
      severity: "warning",
      icon: "💸",
      action: "View Expenses",
    });
  }

  // --- Positive: All habits done today ---
  const todayHabits = habits.filter((h) => h.completedDates.includes(today));
  if (habits.length > 0 && todayHabits.length === habits.length) {
    insights.push({
      id: generateId(),
      message: "Incredible! You've completed ALL your habits today. You're crushing it! 🎉",
      severity: "success",
      icon: "🏆",
    });
  }

  // --- Positive: Good mood streak ---
  const goodMoodDays = last3Days.filter((day) =>
    moodEntries.some((m) => m.date === day && (m.mood === "good" || m.mood === "amazing"))
  );
  if (goodMoodDays.length === 3) {
    insights.push({
      id: generateId(),
      message: "You've been in a great mood for 3 days! Keep it up! 🌟",
      severity: "success",
      icon: "✨",
    });
  }

  return insights.slice(0, 4); // max 4 insights
}

// ─── Daily summary ────────────────────────────────────────────────────────────
export function generateDailySummary(
  tasks: Task[],
  habits: Habit[],
  date: string
): string {
  const completedTasks = tasks.filter(
    (t) => t.status === "done" && t.completedAt?.startsWith(date)
  ).length;

  const totalHabits = habits.length;
  const completedHabits = habits.filter((h) =>
    h.completedDates.includes(date)
  ).length;
  const habitPct = totalHabits > 0 ? Math.round((completedHabits / totalHabits) * 100) : 0;

  const missedHabits = habits
    .filter((h) => !h.completedDates.includes(date))
    .map((h) => h.name);

  let summary = `You completed ${completedTasks} task${completedTasks !== 1 ? "s" : ""} and ${habitPct}% of your habits today.`;

  if (missedHabits.length > 0) {
    summary += ` Missing habits: ${missedHabits.join(", ")}.`;
  }

  return summary;
}

// ─── Mood colors ──────────────────────────────────────────────────────────────
export const MOOD_CONFIG: Record<MoodType, { emoji: string; label: string; color: string }> = {
  amazing: { emoji: "🤩", label: "Amazing", color: "#39ff14" },
  good: { emoji: "😊", label: "Good", color: "#00f5ff" },
  neutral: { emoji: "😐", label: "Neutral", color: "#ffff00" },
  bad: { emoji: "😞", label: "Bad", color: "#ff6600" },
  stressed: { emoji: "😫", label: "Stressed", color: "#ff0080" },
};

export const MOOD_VALUES: Record<MoodType, number> = {
  amazing: 5,
  good: 4,
  neutral: 3,
  bad: 2,
  stressed: 1,
};
