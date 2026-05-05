"use client";

import { usePathname } from "next/navigation";
import { Bell, Globe, LogOut } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/contexts/app-context";
import { generateInsights } from "@/lib/smart-insights";
import { formatDate, todayStr } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";
import type { TranslationKey } from "@/lib/i18n";

const PAGE_TITLE_KEYS: Record<string, { title: string; subtitle: TranslationKey }> = {
  "/": { title: "Dashboard", subtitle: "sub_dashboard" },
  "/tasks": { title: "Task Manager", subtitle: "sub_tasks" },
  "/habits": { title: "Habit Tracker", subtitle: "sub_habits" },
  "/journal": { title: "Daily Journal", subtitle: "sub_journal" },
  "/mood": { title: "Mood Tracker", subtitle: "sub_mood" },
  "/expenses": { title: "Expense Tracker", subtitle: "sub_expenses" },
  "/crm": { title: "Personal CRM", subtitle: "sub_crm" },
  "/pomodoro": { title: "Focus Timer", subtitle: "sub_pomodoro" },
};

export function Header() {
  const pathname = usePathname();
  const { tasks, habits, moodEntries, expenses, currentUser, logout } = useApp();
  const { locale, setLocale, t } = useLanguage();
  const [showNotifications, setShowNotifications] = useState(false);

  const meta = PAGE_TITLE_KEYS[pathname] || { title: "Life OS", subtitle: "sub_dashboard" as TranslationKey };
  const insights = generateInsights(tasks, habits, moodEntries, expenses);
  const criticalCount = insights.filter(
    (i) => i.severity === "critical" || i.severity === "warning"
  ).length;

  return (
    <header
      className="sticky top-0 z-30 flex items-center gap-4 px-4 md:px-6 h-14"
      style={{
        background: "rgba(5, 8, 18, 0.85)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(0,245,255,0.08)",
      }}
    >
      <div className="flex-1 ml-10 md:ml-0">
        <h1
          className="text-base font-bold leading-none"
          style={{ color: "#00f5ff", textShadow: "0 0 10px rgba(0,245,255,0.5)" }}
        >
          {meta.title}
        </h1>
        <p className="text-xs text-gray-500 mt-0.5">{t(meta.subtitle)}</p>
      </div>

      <div className="flex items-center gap-3">
        <span className="hidden sm:block text-xs text-gray-500 font-mono">
          {formatDate(todayStr())}
        </span>

        {/* User info + Logout */}
        {currentUser && (
          <div className="flex items-center gap-2">
            <span className="hidden sm:block text-xs font-mono" style={{ color: "#00f5ff" }}>
              {currentUser.display_name || currentUser.username}
            </span>
            <button
              onClick={logout}
              className="p-1.5 rounded-lg transition-colors hover:bg-white/5"
              title="Logout"
            >
              <LogOut size={14} className="text-gray-400 hover:text-red-400" />
            </button>
          </div>
        )}

        {/* Language toggle */}
        <button
          onClick={() => setLocale(locale === "en" ? "vi" : "en")}
          className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold transition-all hover:bg-white/5"
          style={{ color: "#00f5ff", border: "1px solid rgba(0,245,255,0.2)" }}
          title="Switch language / Đổi ngôn ngữ"
        >
          <Globe size={12} />
          {locale === "en" ? "VI" : "EN"}
        </button>

        <div className="relative">
          <button
            onClick={() => setShowNotifications((v) => !v)}
            className="relative p-2 rounded-lg transition-colors hover:bg-white/5"
          >
            <Bell size={16} className="text-gray-400" />
            {criticalCount > 0 && (
              <span
                className="absolute top-1 right-1 w-2 h-2 rounded-full animate-pulse"
                style={{ background: "#ff0080", boxShadow: "0 0 6px #ff0080" }}
              />
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowNotifications(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-80 z-50 rounded-xl overflow-hidden"
                  style={{
                    background: "rgba(8,12,24,0.98)",
                    border: "1px solid rgba(0,245,255,0.15)",
                    boxShadow: "0 20px 60px rgba(0,0,0,0.8)",
                  }}
                >
                  <div className="p-3 border-b border-white/5">
                    <h3 className="text-sm font-semibold text-gray-200">{t("smart_insights")}</h3>
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {insights.length === 0 ? (
                      <p className="text-sm text-gray-500 p-4 text-center">
                        {t("no_alerts")}
                      </p>
                    ) : (
                      insights.map((i) => (
                        <div
                          key={i.id}
                          className="flex gap-3 p-3 border-b border-white/5 last:border-0"
                        >
                          <span className="text-lg shrink-0">{i.icon}</span>
                          <p className="text-xs text-gray-300 leading-relaxed">{i.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
