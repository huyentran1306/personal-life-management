import { Task, Habit, MoodEntry, JournalEntry, Expense, Contact } from "@/types";
import { todayStr, daysAgo, generateId } from "./utils";

export const MOCK_TASKS: Task[] = [
  {
    id: generateId(),
    title: "Design Q2 roadmap",
    description: "Create a comprehensive product roadmap for Q2 2026",
    priority: "high",
    status: "in-progress",
    dueDate: todayStr(),
    createdAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    title: "Review pull requests",
    description: "Review and merge outstanding PRs on the main repo",
    priority: "medium",
    status: "todo",
    dueDate: todayStr(),
    createdAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    title: "Team sync meeting",
    description: "Weekly sync with the engineering team",
    priority: "high",
    status: "done",
    dueDate: todayStr(),
    createdAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    title: "Update documentation",
    description: "Refresh the API docs with the latest changes",
    priority: "low",
    status: "todo",
    dueDate: daysAgo(-2),
    createdAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    title: "Fix auth bug",
    description: "Investigate and fix the JWT refresh token issue",
    priority: "high",
    status: "todo",
    dueDate: daysAgo(-1),
    createdAt: new Date().toISOString(),
  },
];

export const MOCK_HABITS: Habit[] = [
  {
    id: generateId(),
    name: "Morning workout",
    icon: "💪",
    color: "#00f5ff",
    streak: 7,
    completedDates: [todayStr(), daysAgo(1), daysAgo(2), daysAgo(3), daysAgo(4), daysAgo(5), daysAgo(6)],
    createdAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    name: "Read 30 mins",
    icon: "📚",
    color: "#bf00ff",
    streak: 3,
    completedDates: [todayStr(), daysAgo(1), daysAgo(2)],
    createdAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    name: "Meditate",
    icon: "🧘",
    color: "#39ff14",
    streak: 0,
    completedDates: [daysAgo(3), daysAgo(4)],
    createdAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    name: "Drink 8 glasses of water",
    icon: "💧",
    color: "#00f5ff",
    streak: 5,
    completedDates: [todayStr(), daysAgo(1), daysAgo(2), daysAgo(3), daysAgo(4)],
    createdAt: new Date().toISOString(),
  },
];

export const MOCK_MOOD: MoodEntry[] = [
  { id: generateId(), mood: "good", note: "Productive day!", date: todayStr(), createdAt: new Date().toISOString() },
  { id: generateId(), mood: "amazing", note: "Finished a big project!", date: daysAgo(1), createdAt: new Date().toISOString() },
  { id: generateId(), mood: "neutral", note: "Average day", date: daysAgo(2), createdAt: new Date().toISOString() },
  { id: generateId(), mood: "stressed", note: "Too many meetings", date: daysAgo(3), createdAt: new Date().toISOString() },
  { id: generateId(), mood: "good", note: "Nice workout session", date: daysAgo(4), createdAt: new Date().toISOString() },
  { id: generateId(), mood: "bad", note: "Didn't sleep well", date: daysAgo(5), createdAt: new Date().toISOString() },
  { id: generateId(), mood: "amazing", note: "Weekend vibes!", date: daysAgo(6), createdAt: new Date().toISOString() },
];

export const MOCK_JOURNAL: JournalEntry[] = [
  {
    id: generateId(),
    date: daysAgo(1),
    content: "Had a great day today. Finished the main feature and merged it. Team was happy with the progress.",
    autoSummary: "You completed 3 tasks and 75% of your habits today.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const MOCK_EXPENSES: Expense[] = [
  { id: generateId(), amount: 5, note: "Morning coffee", category: "food", date: todayStr(), createdAt: new Date().toISOString() },
  { id: generateId(), amount: 12, note: "Grab to office", category: "transport", date: todayStr(), createdAt: new Date().toISOString() },
  { id: generateId(), amount: 25, note: "Lunch at restaurant", category: "food", date: todayStr(), createdAt: new Date().toISOString() },
  { id: generateId(), amount: 15, note: "Netflix subscription", category: "entertainment", date: daysAgo(1), createdAt: new Date().toISOString() },
  { id: generateId(), amount: 50, note: "Gym membership", category: "health", date: daysAgo(2), createdAt: new Date().toISOString() },
  { id: generateId(), amount: 8, note: "Tea and snacks", category: "food", date: daysAgo(2), createdAt: new Date().toISOString() },
  { id: generateId(), amount: 100, note: "Electricity bill", category: "bills", date: daysAgo(3), createdAt: new Date().toISOString() },
  { id: generateId(), amount: 35, note: "Amazon purchase", category: "shopping", date: daysAgo(4), createdAt: new Date().toISOString() },
];

export const MOCK_CONTACTS: Contact[] = [
  {
    id: generateId(),
    name: "Alex Chen",
    email: "alex@example.com",
    phone: "+1 555-0101",
    company: "TechCorp",
    avatar: "🧑‍💻",
    notes: [{ id: generateId(), content: "Met at the SaaS conference. Interested in collaboration.", createdAt: new Date().toISOString() }],
    lastContactDate: daysAgo(5),
    reminderDays: 14,
    tags: ["client", "tech"],
    createdAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    name: "Sarah Kim",
    email: "sarah@example.com",
    phone: "+1 555-0102",
    company: "Design Studio",
    avatar: "👩‍🎨",
    notes: [{ id: generateId(), content: "Freelance designer. Great portfolio.", createdAt: new Date().toISOString() }],
    lastContactDate: daysAgo(20),
    reminderDays: 14,
    tags: ["designer", "freelance"],
    createdAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    name: "Marcus Johnson",
    email: "marcus@example.com",
    phone: "+1 555-0103",
    company: "Venture Capital Co",
    avatar: "👨‍💼",
    notes: [],
    lastContactDate: daysAgo(30),
    reminderDays: 30,
    tags: ["investor", "important"],
    createdAt: new Date().toISOString(),
  },
];
