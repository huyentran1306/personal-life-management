import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function isToday(dateStr: string): boolean {
  const today = new Date().toISOString().split("T")[0];
  return dateStr.startsWith(today);
}

export function isSameDay(a: string, b: string): boolean {
  return a.split("T")[0] === b.split("T")[0];
}

export function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

export function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

export function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function getLast7Days(): string[] {
  return Array.from({ length: 7 }, (_, i) => daysAgo(6 - i));
}

export function getDayLabel(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", { weekday: "short" });
}

export function currencyFormat(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(amount);
}

export function daysBetween(a: string, b: string): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.floor((new Date(b).getTime() - new Date(a).getTime()) / msPerDay);
}
