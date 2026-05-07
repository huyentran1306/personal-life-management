"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { Task, Habit, MoodEntry, JournalEntry, Expense, Contact, MoodType, TaskStatus, ExpenseCategory, PomodoroSession, PomodoroMode } from "@/types";
import { generateId, todayStr } from "@/lib/utils";
import { categorizeExpense } from "@/lib/smart-insights";
import {
  ensureUserId, getStoredUserId, setStoredUserId,
  getTasks, createTask, updateTask as apiUpdateTask, deleteTask as apiDeleteTask,
  getHabits, createHabit, updateHabit as apiUpdateHabit, deleteHabit as apiDeleteHabit,
  completeHabit, uncompleteHabit,
  getMood, logMood as apiLogMood, deleteMood,
  getJournal, saveJournal,
  getExpenses, createExpense, deleteExpense as apiDeleteExpense,
  getContacts, createContact, updateContact as apiUpdateContact, deleteContact as apiDeleteContact,
  addContactNote as apiAddContactNote,
  getPomodoro, createPomodoro,
  authLogin, authRegister, AuthUser,
} from "@/lib/api";

interface AppContextType {
  // Auth
  currentUser: AuthUser | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, displayName?: string) => Promise<void>;
  logout: () => void;

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
  addExpense: (amount: number, note: string, date?: string, shared?: boolean, splitCount?: number) => void;
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

const AUTH_USER_KEY = 'plm-auth-user';

function loadStoredAuthUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [journalEntries, setJournal] = useState<JournalEntry[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [pomodoroSessions, setPomodoroSessions] = useState<PomodoroSession[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  const loadUserData = useCallback(async (uid: string) => {
    const [t, h, m, j, e, c] = await Promise.all([
      getTasks(uid) as Promise<Task[]>,
      getHabits(uid) as Promise<(Habit & { completed_dates: string[] })[]>,
      getMood(uid) as Promise<MoodEntry[]>,
      getJournal(uid) as Promise<JournalEntry[]>,
      getExpenses(uid) as Promise<Expense[]>,
      getContacts(uid) as Promise<Contact[]>,
    ]);
    setTasks(t || []);
    setHabits((h || []).map((habit) => ({ ...habit, completedDates: habit.completed_dates || [] })));
    setMoodEntries((m || []).map((entry: MoodEntry & { note?: string }) => ({ ...entry, note: entry.note || '' })));
    setJournal((j || []).map((entry: JournalEntry & { summary?: string }) => ({ ...entry, autoSummary: entry.summary || '' })));
    setExpenses(e || []);
    setContacts((c || []).map((contact: Contact & { notes?: { id: string; content: string; createdAt: string }[] }) => ({
      ...contact,
      notes: (contact.notes || []).map((n) => ({ id: n.id, content: n.content, createdAt: n.createdAt })),
    })));
    try { const p = await getPomodoro(uid) as PomodoroSession[]; setPomodoroSessions(p || []); } catch {/* not critical */}
  }, []);

  const persistUser = (user: AuthUser) => {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    setStoredUserId(user.id);
    setCurrentUser(user);
    setUserId(user.id);
  };

  const login = useCallback(async (username: string, password: string) => {
    const user = await authLogin(username, password);
    persistUser(user);
    await loadUserData(user.id);
  }, [loadUserData]);

  const register = useCallback(async (username: string, password: string, displayName?: string) => {
    const user = await authRegister(username, password, displayName);
    persistUser(user);
    await loadUserData(user.id);
  }, [loadUserData]);

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_USER_KEY);
    localStorage.removeItem('plm-uid');
    setCurrentUser(null);
    setUserId(null);
    setTasks([]); setHabits([]); setMoodEntries([]); setJournal([]); setExpenses([]); setContacts([]); setPomodoroSessions([]);
  }, []);

  // ─── Bootstrap: restore session if exists ─────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const storedUser = loadStoredAuthUser();
        if (storedUser) {
          setCurrentUser(storedUser);
          setUserId(storedUser.id);
          await loadUserData(storedUser.id);
          return;
        }
        // Fallback: anonymous user (legacy)
        const uid = await ensureUserId();
        setUserId(uid);
        await loadUserData(uid);
      } catch {
        // API unavailable — app still works with empty state
      }
    })();
  }, [loadUserData]);

  const getUid = useCallback(() => userId || getStoredUserId() || '', [userId]);

  // ─── Tasks ────────────────────────────────────────────────────────────────
  const addTask = useCallback(async (t: Omit<Task, "id" | "createdAt">) => {
    const uid = getUid();
    const optimistic: Task = { ...t, id: generateId(), createdAt: new Date().toISOString() };
    setTasks((prev) => [...prev, optimistic]);
    try {
      const created = await createTask({ ...t, user_id: uid }) as Task;
      setTasks((prev) => prev.map((x) => (x.id === optimistic.id ? created : x)));
    } catch {/* keep optimistic */}
  }, [getUid]);

  const updateTask = useCallback(async (id: string, updates: Partial<Task>) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
    try { await apiUpdateTask(id, updates); } catch {/* keep optimistic */}
  }, []);

  const deleteTask = useCallback(async (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    try { await apiDeleteTask(id); } catch {/* keep optimistic */}
  }, []);

  const toggleTaskStatus = useCallback(async (id: string) => {
    let newStatus: TaskStatus = 'todo';
    let recurringTask: Task | null = null;
    setTasks((prev) => {
      const next = prev.map((t) => {
        if (t.id !== id) return t;
        newStatus = t.status === 'done' ? 'todo' : 'done';
        const updated = { ...t, status: newStatus, completedAt: newStatus === 'done' ? new Date().toISOString() : undefined };
        // Create next recurring task
        if (newStatus === 'done' && t.repeat && t.repeat !== 'none') {
          const d = new Date(t.dueDate + 'T00:00:00');
          if (t.repeat === 'daily') d.setDate(d.getDate() + 1);
          else if (t.repeat === 'weekly') d.setDate(d.getDate() + 7);
          else if (t.repeat === 'monthly') d.setMonth(d.getMonth() + 1);
          recurringTask = { ...t, id: generateId(), status: 'todo', dueDate: d.toISOString().split('T')[0], completedAt: undefined, createdAt: new Date().toISOString() };
        }
        return updated;
      });
      return recurringTask ? [...next, recurringTask] : next;
    });
    try { await apiUpdateTask(id, { status: newStatus }); } catch {/* keep optimistic */}
  }, []);

  // ─── Habits ───────────────────────────────────────────────────────────────
  const addHabit = useCallback(async (h: Omit<Habit, "id" | "createdAt" | "streak" | "completedDates">) => {
    const uid = getUid();
    const optimistic: Habit = { ...h, id: generateId(), streak: 0, completedDates: [], createdAt: new Date().toISOString() };
    setHabits((prev) => [...prev, optimistic]);
    try {
      const created = await createHabit({ ...h, user_id: uid }) as Habit & { completed_dates: string[] };
      setHabits((prev) => prev.map((x) => (x.id === optimistic.id ? { ...created, completedDates: created.completed_dates || [] } : x)));
    } catch {/* keep optimistic */}
  }, [getUid]);

  const toggleHabitToday = useCallback(async (id: string) => {
    const uid = getUid();
    const todayDate = todayStr();
    let wasDone = false;
    setHabits((prev) => prev.map((h) => {
      if (h.id !== id) return h;
      wasDone = h.completedDates.includes(todayDate);
      const newDates = wasDone
        ? h.completedDates.filter((d) => d !== todayDate)
        : [...h.completedDates, todayDate];
      let streak = 0;
      const d = new Date();
      for (let i = 0; i < 365; i++) {
        const s = d.toISOString().split('T')[0];
        if (newDates.includes(s)) { streak++; d.setDate(d.getDate() - 1); } else break;
      }
      return { ...h, completedDates: newDates, streak };
    }));
    try {
      if (wasDone) { await uncompleteHabit(id, todayDate); }
      else { await completeHabit(id, uid, todayDate); }
    } catch {/* keep optimistic */}
  }, [getUid]);

  const deleteHabit = useCallback(async (id: string) => {
    setHabits((prev) => prev.filter((h) => h.id !== id));
    try { await apiDeleteHabit(id); } catch {/* keep optimistic */}
  }, []);

  // ─── Mood ─────────────────────────────────────────────────────────────────
  const addMoodEntry = useCallback(async (mood: MoodType, note: string) => {
    const uid = getUid();
    const today = todayStr();
    const optimistic: MoodEntry = { id: generateId(), mood, note, date: today, createdAt: new Date().toISOString() };
    setMoodEntries((prev) => {
      const existing = prev.find((m) => m.date === today);
      if (existing) return prev.map((m) => m.date === today ? { ...m, mood, note } : m);
      return [...prev, optimistic];
    });
    try { await apiLogMood({ user_id: uid, mood, note, date: today }); } catch {/* keep optimistic */}
  }, [getUid]);

  const updateMoodEntry = useCallback(async (id: string, mood: MoodType, note: string) => {
    setMoodEntries((prev) => prev.map((m) => (m.id === id ? { ...m, mood, note } : m)));
    try { await apiLogMood({ mood, note }); } catch {/* keep optimistic */}
  }, []);

  // ─── Journal ──────────────────────────────────────────────────────────────
  const saveJournalEntry = useCallback(async (date: string, content: string, autoSummary: string) => {
    const uid = getUid();
    setJournal((prev) => {
      const existing = prev.find((j) => j.date === date);
      if (existing) return prev.map((j) => j.date === date ? { ...j, content, autoSummary, updatedAt: new Date().toISOString() } : j);
      return [...prev, { id: generateId(), date, content, autoSummary, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }];
    });
    try { await saveJournal({ user_id: uid, date, content, summary: autoSummary }); } catch {/* keep optimistic */}
  }, [getUid]);

  // ─── Expenses ─────────────────────────────────────────────────────────────
  const addExpense = useCallback(async (amount: number, note: string, date?: string, shared?: boolean, splitCount?: number) => {
    const uid = getUid();
    const category = categorizeExpense(note) as ExpenseCategory;
    const expDate = date || todayStr();
    const optimistic: Expense = { id: generateId(), amount, note, category, date: expDate, createdAt: new Date().toISOString(), shared, splitCount };
    setExpenses((prev) => [...prev, optimistic]);
    try {
      const created = await createExpense({ user_id: uid, amount, note, category, date: expDate }) as Expense;
      setExpenses((prev) => prev.map((x) => (x.id === optimistic.id ? { ...created, shared, splitCount } : x)));
    } catch {/* keep optimistic */}
  }, [getUid]);

  const deleteExpense = useCallback(async (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    try { await apiDeleteExpense(id); } catch {/* keep optimistic */}
  }, []);

  // ─── Contacts ─────────────────────────────────────────────────────────────
  const addContact = useCallback(async (c: Omit<Contact, "id" | "createdAt" | "notes">) => {
    const uid = getUid();
    const optimistic: Contact = { ...c, id: generateId(), notes: [], createdAt: new Date().toISOString() };
    setContacts((prev) => [...prev, optimistic]);
    try {
      const created = await createContact({ ...c, user_id: uid }) as Contact;
      setContacts((prev) => prev.map((x) => (x.id === optimistic.id ? { ...created, notes: [] } : x)));
    } catch {/* keep optimistic */}
  }, [getUid]);

  const updateContact = useCallback(async (id: string, updates: Partial<Contact>) => {
    setContacts((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
    try { await apiUpdateContact(id, updates); } catch {/* keep optimistic */}
  }, []);

  const deleteContact = useCallback(async (id: string) => {
    setContacts((prev) => prev.filter((c) => c.id !== id));
    try { await apiDeleteContact(id); } catch {/* keep optimistic */}
  }, []);

  const addContactNote = useCallback(async (contactId: string, content: string) => {
    const uid = getUid();
    const note = { id: generateId(), content, createdAt: new Date().toISOString() };
    setContacts((prev) => prev.map((c) => c.id === contactId ? { ...c, notes: [...c.notes, note] } : c));
    try { await apiAddContactNote(contactId, { user_id: uid, content }); } catch {/* keep optimistic */}
  }, [getUid]);

  // ─── Pomodoro ─────────────────────────────────────────────────────────────
  const addPomodoroSession = useCallback(async (mode: PomodoroMode, duration: number, completed: boolean, taskId?: string) => {
    const uid = getUid();
    const session: PomodoroSession = { id: generateId(), date: todayStr(), mode, duration, completed, taskId, createdAt: new Date().toISOString() };
    setPomodoroSessions((prev) => [...prev, session]);
    try { await createPomodoro({ user_id: uid, mode, duration, completed, task_id: taskId, date: todayStr() }); } catch {/* keep optimistic */}
  }, [getUid]);

  return (
    <AppContext.Provider value={{
      currentUser, isAuthenticated: !!currentUser, login, register, logout,
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

