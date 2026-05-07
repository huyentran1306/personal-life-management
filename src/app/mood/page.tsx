"use client";

import { useApp } from "@/contexts/app-context";
import { motion } from "framer-motion";
import { MOOD_CONFIG, MOOD_VALUES } from "@/lib/smart-insights";
import { todayStr, getLast7Days, getDayLabel } from "@/lib/utils";
import type { MoodType } from "@/types";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useState } from "react";
import { useLanguage } from "@/contexts/language-context";
import Link from "next/link";

const MOODS: MoodType[] = ["amazing", "good", "neutral", "bad", "stressed"];

export default function MoodPage() {
  const { moodEntries, addMoodEntry } = useApp();
  const { t } = useLanguage();
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);
  const [showJournalPrompt, setShowJournalPrompt] = useState(false);
  const today = todayStr();
  const todayEntry = moodEntries.find((m) => m.date === today);
  const [selected, setSelected] = useState<MoodType | null>(todayEntry?.mood || null);

  const moodLabel = (mood: MoodType) =>
    mood === "amazing" ? t("mood_amazing") : mood === "good" ? t("mood_good") : mood === "neutral" ? t("mood_neutral") : mood === "bad" ? t("mood_bad") : t("mood_stressed");

  const handleSelect = (mood: MoodType) => {
    setSelected(mood);
    setSaved(false);
  };

  const handleSave = () => {
    if (!selected) return;
    addMoodEntry(selected, note);
    setSaved(true);
    if (selected === "bad" || selected === "stressed") setShowJournalPrompt(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const last7 = getLast7Days();
  const chartData = last7.map((day) => {
    const entry = moodEntries.find((m) => m.date === day);
    return {
      day: getDayLabel(day),
      mood: entry ? MOOD_VALUES[entry.mood] : null,
      emoji: entry ? MOOD_CONFIG[entry.mood].emoji : null,
    };
  });

  const recentMoods = [...moodEntries].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 7);

  return (
    <div className="space-y-5 max-w-3xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
        <h3 className="text-sm font-semibold text-gray-200 mb-4 text-center">{t("how_feeling")}</h3>
        <div className="flex justify-center gap-3 flex-wrap">
          {MOODS.map((mood) => {
            const config = MOOD_CONFIG[mood];
            const isSelected = selected === mood;
            return (
              <motion.button
                key={mood}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSelect(mood)}
                className="flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl transition-all"
                style={{
                  background: isSelected ? config.color + "20" : "rgba(255,255,255,0.04)",
                  border: "2px solid " + (isSelected ? config.color + "60" : "rgba(255,255,255,0.06)"),
                  boxShadow: isSelected ? "0 0 20px " + config.color + "30" : "none",
                }}
              >
                <span className="text-3xl">{config.emoji}</span>
                <span className="text-xs" style={{ color: isSelected ? config.color : "#6b8096" }}>{moodLabel(mood)}</span>
              </motion.button>
            );
          })}
        </div>

        {selected && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-4 space-y-3">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t("mood_note_placeholder")}
              rows={2}
              className="w-full px-3 py-2 rounded-lg text-sm resize-none focus:outline-none"
              style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.07)", color: "#e0f7ff" }}
            />
            <button onClick={handleSave}
              className="w-full py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: saved ? "rgba(57,255,20,0.15)" : "rgba(191,0,255,0.15)",
                border: "1px solid " + (saved ? "rgba(57,255,20,0.4)" : "rgba(191,0,255,0.4)"),
                color: saved ? "#39ff14" : "#bf00ff",
              }}>
              {saved ? t("mood_saved") : t("save_mood")}
            </button>
            {showJournalPrompt && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-xl flex items-center justify-between"
                style={{ background: "rgba(191,0,255,0.08)", border: "1px solid rgba(191,0,255,0.2)" }}>
                <div>
                  <p className="text-xs font-medium" style={{ color: "#bf00ff" }}>✍️ Want to write about it?</p>
                  <p className="text-xs mt-0.5" style={{ color: "#6b8096" }}>Journaling can help process difficult feelings.</p>
                </div>
                <div className="flex gap-2 ml-3">
                  <Link href="/journal" className="text-xs px-3 py-1.5 rounded-lg font-medium"
                    style={{ background: "rgba(191,0,255,0.15)", color: "#bf00ff" }}>Open Journal</Link>
                  <button onClick={() => setShowJournalPrompt(false)} className="text-xs px-2 py-1.5 rounded-lg"
                    style={{ color: "#6b8096" }}>✕</button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-4">
        <h3 className="text-sm font-semibold text-gray-200 mb-3">{t("weekly_mood_trend")}</h3>
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={chartData} margin={{ top: 10, right: 5, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="moodGradFull" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#bf00ff" stopOpacity={0.5} />
                <stop offset="95%" stopColor="#bf00ff" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#6b8096" }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 5]} tick={{ fontSize: 10, fill: "#6b8096" }} axisLine={false} tickLine={false}
              tickFormatter={(v) => ["", "😫", "😞", "😐", "😊", "🤩"][v]} />
            <Tooltip
              contentStyle={{ background: "#080b14", border: "1px solid rgba(191,0,255,0.3)", borderRadius: 8, fontSize: 11 }}
              formatter={(v) => { const m = MOODS.find(md => MOOD_VALUES[md] === Number(v)); return [m ? MOOD_CONFIG[m].emoji + " " + moodLabel(m) : String(v), "Mood"] as [string, string]; }}
            />
            <Area type="monotone" dataKey="mood" stroke="#bf00ff" fill="url(#moodGradFull)" strokeWidth={2.5}
              dot={{ fill: "#bf00ff", r: 4, strokeWidth: 0 }} connectNulls />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-4">
        <h3 className="text-sm font-semibold text-gray-200 mb-3">{t("recent_mood_log")}</h3>
        {recentMoods.length === 0 ? (
          <p className="text-sm text-gray-500">{t("no_mood")}</p>
        ) : (
          <div className="space-y-2">
            {recentMoods.map((entry) => {
              const config = MOOD_CONFIG[entry.mood];
              return (
                <div key={entry.id} className="flex items-center gap-3 py-2 border-b border-white/4 last:border-0">
                  <span className="text-xl w-8 text-center shrink-0">{config.emoji}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium" style={{ color: config.color }}>{moodLabel(entry.mood)}</span>
                      <span className="text-xs text-gray-600">{entry.date === today ? t("today_label") : entry.date}</span>
                    </div>
                    {entry.note && <p className="text-xs text-gray-500 mt-0.5">{entry.note}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}
