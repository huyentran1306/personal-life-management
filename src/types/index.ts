// ─── Task ─────────────────────────────────────────────────────────────────────
export type Priority = "low" | "medium" | "high";
export type TaskStatus = "todo" | "in-progress" | "done";

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  status: TaskStatus;
  dueDate: string; // ISO date string
  createdAt: string;
  completedAt?: string;
}

// ─── Habit ────────────────────────────────────────────────────────────────────
export interface Habit {
  id: string;
  name: string;
  icon: string;
  color: string;
  streak: number;
  completedDates: string[]; // ISO date strings
  createdAt: string;
}

// ─── Mood ─────────────────────────────────────────────────────────────────────
export type MoodType = "amazing" | "good" | "neutral" | "bad" | "stressed";

export interface MoodEntry {
  id: string;
  mood: MoodType;
  note: string;
  date: string; // ISO date string
  createdAt: string;
}

// ─── Journal ──────────────────────────────────────────────────────────────────
export interface JournalEntry {
  id: string;
  date: string; // ISO date string
  content: string;
  autoSummary: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Expense ──────────────────────────────────────────────────────────────────
export type ExpenseCategory =
  | "food"
  | "transport"
  | "shopping"
  | "entertainment"
  | "health"
  | "bills"
  | "other";

export interface Expense {
  id: string;
  amount: number;
  note: string;
  category: ExpenseCategory;
  date: string; // ISO date string
  createdAt: string;
}

// ─── Contact (CRM) ────────────────────────────────────────────────────────────
export interface ContactNote {
  id: string;
  content: string;
  createdAt: string;
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  avatar: string; // emoji or initials
  birthday?: string; // ISO date string (YYYY-MM-DD)
  notes: ContactNote[];
  lastContactDate: string; // ISO date string
  reminderDays: number;
  tags: string[];
  createdAt: string;
}

// ─── Smart Insight ────────────────────────────────────────────────────────────
export type InsightSeverity = "info" | "warning" | "critical" | "success";

export interface SmartInsight {
  id: string;
  message: string;
  severity: InsightSeverity;
  icon: string;
  action?: string;
}

// ─── App State ────────────────────────────────────────────────────────────────
export interface AppState {
  tasks: Task[];
  habits: Habit[];
  moodEntries: MoodEntry[];
  journalEntries: JournalEntry[];
  expenses: Expense[];
  contacts: Contact[];
}

// ─── Pomodoro ─────────────────────────────────────────────────────────────────
export type PomodoroMode = "focus" | "short-break" | "long-break";

export interface PomodoroSession {
  id: string;
  date: string; // ISO date string (YYYY-MM-DD)
  mode: PomodoroMode;
  taskId?: string;
  completed: boolean;
  duration: number; // minutes
  createdAt: string;
}
