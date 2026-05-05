// ============================================================
// API Client — personal-life-management (web + mobile)
// ============================================================

export const API_BASE = 'https://d1-template.trann46698.workers.dev/api';

async function apiFetch<T = unknown>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const json = await res.json() as { success: boolean; data: T; error?: string };
  if (!json.success) throw new Error(json.error || 'API error');
  return json.data;
}

export const apiGet = <T = unknown>(path: string) => apiFetch<T>(path);
export const apiPost = <T = unknown>(path: string, body: unknown) =>
  apiFetch<T>(path, { method: 'POST', body: JSON.stringify(body) });
export const apiPut = <T = unknown>(path: string, body: unknown) =>
  apiFetch<T>(path, { method: 'PUT', body: JSON.stringify(body) });
export const apiDelete = <T = unknown>(path: string) =>
  apiFetch<T>(path, { method: 'DELETE' });

// ─── Auth ─────────────────────────────────────────────────
export interface AuthUser {
  id: string;
  username: string;
  display_name: string;
  email: string | null;
  xp: number;
  level: number;
  streak: number;
  coins: number;
  language: string;
  app_mode: string;
}

export async function authRegister(username: string, password: string, displayName?: string): Promise<AuthUser> {
  return apiFetch<AuthUser>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, password, display_name: displayName || username }),
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function authLogin(username: string, password: string): Promise<AuthUser> {
  return apiFetch<AuthUser>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
    headers: { 'Content-Type': 'application/json' },
  });
}

// ─── User ID management ───────────────────────────────────
const UID_KEY = 'plm-uid';

export function getStoredUserId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(UID_KEY);
}

export function setStoredUserId(id: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(UID_KEY, id);
}

// Auto-create a user if none exists (PLM has no explicit onboarding)
let _initPromise: Promise<string> | null = null;
export async function ensureUserId(): Promise<string> {
  const existing = getStoredUserId();
  if (existing) return existing;
  if (_initPromise) return _initPromise;
  _initPromise = apiFetch<{ id: string }>('/users', {
    method: 'POST',
    body: JSON.stringify({ username: `user_${Date.now()}`, language: 'en', app_mode: 'adult' }),
    headers: { 'Content-Type': 'application/json' },
  }).then((user) => {
    setStoredUserId(user.id);
    return user.id;
  });
  return _initPromise;
}

// ─── Tasks ────────────────────────────────────────────────
export const getTasks = (userId: string) => apiGet(`/tasks?userId=${userId}`);
export const createTask = (data: object) => apiPost('/tasks', data);
export const updateTask = (id: string, data: object) => apiPut(`/tasks/${id}`, data);
export const deleteTask = (id: string) => apiDelete(`/tasks/${id}`);

// ─── Habits ───────────────────────────────────────────────
export const getHabits = (userId: string) => apiGet(`/habits?userId=${userId}`);
export const createHabit = (data: object) => apiPost('/habits', data);
export const updateHabit = (id: string, data: object) => apiPut(`/habits/${id}`, data);
export const deleteHabit = (id: string) => apiDelete(`/habits/${id}`);
export const completeHabit = (id: string, userId: string, date?: string) =>
  apiPost(`/habits/${id}/complete`, { user_id: userId, date });
export const uncompleteHabit = (id: string, date: string) =>
  apiDelete(`/habits/${id}/complete?date=${date}`);

// ─── Mood ─────────────────────────────────────────────────
export const getMood = (userId: string, limit = 30) => apiGet(`/mood?userId=${userId}&limit=${limit}`);
export const logMood = (data: object) => apiPost('/mood', data);
export const deleteMood = (id: string) => apiDelete(`/mood/${id}`);

// ─── Journal ──────────────────────────────────────────────
export const getJournal = (userId: string, limit = 20) => apiGet(`/journal?userId=${userId}&limit=${limit}`);
export const saveJournal = (data: object) => apiPost('/journal', data);
export const deleteJournal = (id: string) => apiDelete(`/journal/${id}`);

// ─── Expenses ─────────────────────────────────────────────
export const getExpenses = (userId: string, month?: string) => {
  const q = month ? `&month=${month}` : '';
  return apiGet(`/expenses?userId=${userId}${q}`);
};
export const createExpense = (data: object) => apiPost('/expenses', data);
export const updateExpense = (id: string, data: object) => apiPut(`/expenses/${id}`, data);
export const deleteExpense = (id: string) => apiDelete(`/expenses/${id}`);

// ─── Contacts ─────────────────────────────────────────────
export const getContacts = (userId: string, search?: string) => {
  const q = search ? `&search=${encodeURIComponent(search)}` : '';
  return apiGet(`/contacts?userId=${userId}${q}`);
};
export const getContact = (id: string) => apiGet(`/contacts/${id}`);
export const createContact = (data: object) => apiPost('/contacts', data);
export const updateContact = (id: string, data: object) => apiPut(`/contacts/${id}`, data);
export const deleteContact = (id: string) => apiDelete(`/contacts/${id}`);
export const addContactNote = (contactId: string, data: object) => apiPost(`/contacts/${contactId}/notes`, data);
export const deleteContactNote = (contactId: string, noteId: string) => apiDelete(`/contacts/${contactId}/notes/${noteId}`);

// ─── Pomodoro ─────────────────────────────────────────────
export const getPomodoro = (userId: string, date?: string) => {
  const q = date ? `&date=${date}` : '';
  return apiGet(`/pomodoro?userId=${userId}${q}`);
};
export const createPomodoro = (data: object) => apiPost('/pomodoro', data);

// ─── Stats ────────────────────────────────────────────────
export const getStats = (userId: string) => apiGet(`/stats/${userId}`);

// ─── Activity ─────────────────────────────────────────────
export const getActivity = (userId: string, limit = 20) => apiGet(`/activity/${userId}?limit=${limit}`);
