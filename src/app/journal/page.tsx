"use client";

import { useState } from "react";
import { useApp } from "@/contexts/app-context";
import { motion } from "framer-motion";
import { BookOpen, ChevronLeft, ChevronRight, Save, Search, X } from "lucide-react";
import { formatDate, todayStr } from "@/lib/utils";
import { generateDailySummary } from "@/lib/smart-insights";
import { useLanguage } from "@/contexts/language-context";

export default function JournalPage() {
  const { journalEntries, saveJournalEntry, tasks, habits } = useApp();
  const { t } = useLanguage();
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [content, setContent] = useState(() => {
    const entry = journalEntries.find((j) => j.date === todayStr());
    return entry?.content || "";
  });
  const [searchQuery, setSearchQuery] = useState("");

  const currentEntry = journalEntries.find((j) => j.date === selectedDate);

  const navigateDate = (direction: -1 | 1) => {
    const d = new Date(selectedDate + "T00:00:00");
    d.setDate(d.getDate() + direction);
    const newDate = d.toISOString().split("T")[0];
    if (newDate > todayStr()) return;
    setSelectedDate(newDate);
    const entry = journalEntries.find((j) => j.date === newDate);
    setContent(entry?.content || "");
  };

  const handleSave = () => {
    const summary = generateDailySummary(tasks, habits, selectedDate);
    saveJournalEntry(selectedDate, content, summary);
  };

  const isToday = selectedDate === todayStr();
  const autoSummary = currentEntry?.autoSummary || generateDailySummary(tasks, habits, selectedDate);

  const recentEntries = journalEntries
    .filter((j) => j.date !== selectedDate)
    .filter((j) => !searchQuery || j.content.toLowerCase().includes(searchQuery.toLowerCase()) || j.autoSummary.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, searchQuery ? 20 : 5);

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center justify-between glass-card px-4 py-3">
        <button onClick={() => navigateDate(-1)} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors text-gray-400">
          <ChevronLeft size={16} />
        </button>
        <div className="text-center">
          <p className="text-sm font-semibold" style={{ color: "#bf00ff" }}>{formatDate(selectedDate)}</p>
          <p className="text-xs text-gray-500">{isToday ? t("today") : ""}</p>
        </div>
        <button onClick={() => navigateDate(1)} disabled={isToday}
          className="p-1.5 rounded-lg hover:bg-white/5 transition-colors text-gray-400 disabled:opacity-30">
          <ChevronRight size={16} />
        </button>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="glass-card p-4" style={{ borderColor: "rgba(191,0,255,0.2)" }}>
        <div className="flex items-center gap-2 mb-2">
          <BookOpen size={14} style={{ color: "#bf00ff" }} />
          <span className="text-xs text-gray-500 uppercase tracking-wider">{t("auto_summary")}</span>
        </div>
        <p className="text-sm text-gray-300 italic">&quot;{autoSummary}&quot;</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-200">{t("your_thoughts")}</span>
          <button onClick={handleSave}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{ background: "rgba(191,0,255,0.12)", border: "1px solid rgba(191,0,255,0.35)", color: "#bf00ff" }}>
            <Save size={12} /> {t("save")}
          </button>
        </div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={t("journal_placeholder")}
          rows={10}
          className="w-full px-3 py-3 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-purple-500/40 resize-none leading-relaxed"
          style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.06)" }}
        />
        {currentEntry && (
          <p className="text-xs text-gray-600 mt-2">
            {t("last_saved")} {new Date(currentEntry.updatedAt).toLocaleTimeString()}
          </p>
        )}
      </motion.div>

      {recentEntries.length > 0 || searchQuery ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-2">
          {/* Search bar */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#6b8096" }} />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search journal entries..."
              className="w-full pl-8 pr-8 py-2 rounded-lg text-sm bg-black/40 border border-white/10 text-gray-200 focus:outline-none focus:border-purple-500/50"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "#6b8096" }}>
                <X size={12} />
              </button>
            )}
          </div>
          {!searchQuery && <h3 className="text-xs text-gray-500 uppercase tracking-wider px-1">{t("recent_entries")}</h3>}
          {searchQuery && <h3 className="text-xs text-gray-500 px-1">{recentEntries.length} result{recentEntries.length !== 1 ? 's' : ''} for &ldquo;{searchQuery}&rdquo;</h3>}
          {recentEntries.map((entry) => (
            <button key={entry.id} onClick={() => { setSelectedDate(entry.date); setContent(entry.content); }}
              className="w-full text-left glass-card p-3 hover:border-purple-500/20 transition-all"
              style={{ borderColor: selectedDate === entry.date ? "rgba(191,0,255,0.3)" : "rgba(255,255,255,0.06)" }}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-300">{formatDate(entry.date)}</span>
                <span className="text-xs text-gray-600">{entry.content.length} chars</span>
              </div>
              <p className="text-xs text-gray-500 truncate">{entry.content || entry.autoSummary}</p>
            </button>
          ))}
        </motion.div>
      ) : null}
    </div>
  );
}
