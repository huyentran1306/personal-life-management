"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { Task, Habit, MoodEntry, JournalEntry, Expense, Contact, MoodType, TaskStatus, ExpenseCategory, PomodoroSession, PomodoroMode } from "@/types";
import { generateId, todayStr } from "@/lib/utils";
import { categorizeExpense } from "@/lib/smart-insights";
import { MOCK_TASKS, MOCK_HABITS, MOCK_MOOD, MOCK_JOURNAL, MOCK_EXPENSES, MOCK_CONTACTS } from "@/lib/mock-data";

interface AppContextType {
  // Tasks
  tasks: Task[];
  addTask: (t: Omit<Task, "id" | "createdAt">) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTaskStatus: (id: string) => void;

  // Habits
  habits: Habit[];
  addHabit: (h: Omit<Habit, "id" | "createdAt" | "streak" | "completedDates">) => void;
  toggleHabitToday: (id: string) => void;
  deleteHabit: (id: string) => void;

  // Mood
  moodEntries: MoodEntry[];
  addMoodEntry: (mood: MoodType, note: string) => void;
  updateMoodEntry: (id: string, mood: MoodType, note: string) => void;

  // Journal
  journalEntries: JournalEntry[];
  saveJournalEntry: (date: string, content: string, autoSummary: string) => void;

  // Expenses
  expenses: Expense[];
  addExpense: (amount: number, note: string, date?: string) => void;
  deleteExpense: (id: string) => void;

  // Contacts
  contacts: Contact[];
  addContact: (c: Omit<Contact, "id" | "createdAt" | "notes">) => void;
  updateContact: (id: string, updates: Partial<Contact>) => void;
  deleteContact: (id: string) => void;
  addContactNote: (contactId: string, content: string) => void;

  // Pomodoro
  pomodoroSessions: PomodoroSession[];
  addPomodoroSession: (mode: PomodoroMode, duration: number, completed: boolean, taskId?: string) => void;
}

const AppContext = createContext<AppContextType | null>(null);

function useLocalStorage<T>(key: string, initial: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(initial);

  // Load from localStorage after mount (avoids SSR hydration mismatch)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored) setValue(JSON.parse(stored));
    } catch {/* noop */}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // Persist to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {/* noop */}
  }, [key, value]);

  return [value, setValue];
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useLocalStorage<Task[]>("plm-tasks", MOCK_TASKS);
  const [habits, setHabits] = useLocalStorage<Habit[]>("plm-habits", MOCK_HABITS);
  const [moodEntries, setMoodEntries] = useLocalStorage<MoodEntry[]>("plm-mood", MOCK_MOOD);
  const [journalEntries, setJournal] = useLocalStorage<JournalEntry[]>("plm-journal", MOCK_JOURNAL);
  const [expenses, setExpenses] = useLocalStorage<Expense[]>("plm-expenses", MOCK_EXPENSES);
  const [contacts, setContacts] = useLocalStorage<Contact[]>("plm-contacts", MOCK_CONTACTS);
  const [pomodoroSessions, setPomodoroSessions] = useLocalStorage<PomodoroSession[]>("plm-pomodoro", []);

  // ─── Tasks ────────────────────────────────────────────────────────────────
  const addTask = useCallback((t: Omit<Task, "id" | "createdAt">) => {
    setTasks((prev) => [...prev, { ...t, id: generateId(), createdAt: new Date().toISOString() }]);
  }, [setTasks]);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  }, [setTasks]);

  const deleteTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, [setTasks]);

  const toggleTaskStatus = useCallback((id: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const newStatus: TaskStatus = t.status === "done" ? "todo" : "done";
        return {
          ...t,
          status: newStatus,
          completedAt: newStatus === "done" ? new Date().toISOString() : undefined,
        };
      })
    );
  }, [setTasks]);

  // ─── Habits ───────────────────────────────────────────────────────────────
  const addHabit = useCallback((h: Omit<Habit, "id" | "createdAt" | "streak" | "completedDates">) => {
    setHabits((prev) => [
      ...prev,
      { ...h, id: generateId(), streak: 0, completedDates: [], createdAt: new Date().toISOString() },
    ]);
  }, [setHabits]);

  const toggleHabitToday = useCallback((id: string) => {
    const today = todayStr();
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== id) return h;
        const done = h.completedDates.includes(today);
        const newDates = done
          ? h.completedDates.filter((d) => d !== today)
          : [...h.completedDates, today];

        // Recalculate streak
        let streak = 0;
        const d = new Date();
        for (let i = 0; i < 365; i++) {
          const s = d.toISOString().split("T")[0];
          if (newDates.includes(s)) {
            streak++;
            d.setDate(d.getDate() - 1);
          } else break;
        }

        return { ...h, completedDates: newDates, streak };
      })
    );
  }, [setHabits]);

  const deleteHabit = useCallback((id: string) => {
    setHabits((prev) => prev.filter((h) => h.id !== id));
  }, [setHabits]);

  // ─── Mood ─────────────────────────────────────────────────────────────────
  const addMoodEntry = useCallback((mood: MoodType, note: string) => {
    const today = todayStr();
    setMoodEntries((prev) => {
      const existing = prev.find((m) => m.date === today);
      if (existing) {
        return prev.map((m) =>
          m.date === today ? { ...m, mood, note, createdAt: new Date().toISOString() } : m
        );
      }
      return [...prev, { id: generateId(), mood, note, date: today, createdAt: new Date().toISOString() }];
    });
  }, [setMoodEntries]);

  const updateMoodEntry = useCallback((id: string, mood: MoodType, note: string) => {
    setMoodEntries((prev) => prev.map((m) => (m.id === id ? { ...m, mood, note } : m)));
  }, [setMoodEntries]);

  // ─── Journal ──────────────────────────────────────────────────────────────
  const saveJournalEntry = useCallback((date: string, content: string, autoSummary: string) => {
    setJournal((prev) => {
      const existing = prev.find((j) => j.date === date);
      if (existing) {
        return prev.map((j) =>
          j.date === date ? { ...j, content, autoSummary, updatedAt: new Date().toISOString() } : j
        );
      }
      return [
        ...prev,
        { id: generateId(), date, content, autoSummary, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      ];
    });
  }, [setJournal]);

  // ─── Expenses ─────────────────────────────────────────────────────────────
  const addExpense = useCallback((amount: number, note: string, date?: string) => {
    const category = categorizeExpense(note) as ExpenseCategory;
    setExpenses((prev) => [
      ...prev,
      { id: generateId(), amount, note, category, date: date || todayStr(), createdAt: new Date().toISOString() },
    ]);
  }, [setExpenses]);

  const deleteExpense = useCallback((id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }, [setExpenses]);

  // ─── Contacts ─────────────────────────────────────────────────────────────
  const addContact = useCallback((c: Omit<Contact, "id" | "createdAt" | "notes">) => {
    setContacts((prev) => [
      ...prev,
      { ...c, id: generateId(), notes: [], createdAt: new Date().toISOString() },
    ]);
  }, [setContacts]);

  const updateContact = useCallback((id: string, updates: Partial<Contact>) => {
    setContacts((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  }, [setContacts]);

  const deleteContact = useCallback((id: string) => {
    setContacts((prev) => prev.filter((c) => c.id !== id));
  }, [setContacts]);

  const addContactNote = useCallback((contactId: string, content: string) => {
    setContacts((prev) =>
      prev.map((c) =>
        c.id === contactId
          ? { ...c, notes: [...c.notes, { id: generateId(), content, createdAt: new Date().toISOString() }] }
          : c
      )
    );
  }, [setContacts]);

  // ─── Pomodoro ─────────────────────────────────────────────────────────────
  const addPomodoroSession = useCallback((mode: PomodoroMode, duration: number, completed: boolean, taskId?: string) => {
    setPomodoroSessions((prev) => [
      ...prev,
      { id: generateId(), date: todayStr(), mode, duration, completed, taskId, createdAt: new Date().toISOString() },
    ]);
  }, [setPomodoroSessions]);

  return (
    <AppContext.Provider value={{
      tasks, addTask, updateTask, deleteTask, toggleTaskStatus,
      habits, addHabit, toggleHabitToday, deleteHabit,
      moodEntries, addMoodEntry, updateMoodEntry,
      journalEntries, saveJournalEntry,
      expenses, addExpense, deleteExpense,
      contacts, addContact, updateContact, deleteContact, addContactNote,
      pomodoroSessions, addPomodoroSession,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
