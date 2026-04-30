"use client";

import { useState } from "react";
import { useApp } from "@/contexts/app-context";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Flame, CheckCircle2, XCircle } from "lucide-react";
import { todayStr, getLast7Days, getDayLabel, daysAgo } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";

const ICON_OPTIONS = ["💪", "📚", "🧘", "💧", "🏃", "🎯", "🎸", "🖊️", "🌿", "😴", "🥗", "🧠"];
const COLOR_OPTIONS = ["#00f5ff", "#bf00ff", "#ff0080", "#39ff14", "#ffff00", "#ff6600"];

export default function HabitsPage() {
  const { habits, addHabit, toggleHabitToday, deleteHabit } = useApp();
  const { t } = useLanguage();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", icon: "💪", color: "#00f5ff" });
  const today = todayStr();
  const last7 = getLast7Days();

  const handleAdd = () => {
    if (!form.name.trim()) return;
    addHabit(form);
    setForm({ name: "", icon: "💪", color: "#00f5ff" });
    setShowForm(false);
  };

  const totalHabits = habits.length;
  const doneToday = habits.filter((h) => h.completedDates.includes(today)).length;
  const pct = totalHabits > 0 ? Math.round((doneToday / totalHabits) * 100) : 0;

  return (
    <div className="space-y-5 max-w-3xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-200">{t("todays_completion")}</span>
          <span className="text-lg font-bold" style={{ color: pct === 100 ? "#39ff14" : "#00f5ff" }}>{pct}%</span>
        </div>
        <div className="h-2 rounded-full bg-white/5 overflow-hidden">
          <motion.div className="h-full rounded-full"
            style={{ background: pct === 100 ? "linear-gradient(90deg, #39ff14, #00f5ff)" : "linear-gradient(90deg, #00f5ff, #bf00ff)" }}
            initial={{ width: 0 }} animate={{ width: pct + "%" }} transition={{ duration: 0.8, ease: "easeOut" }} />
        </div>
        <p className="text-xs text-gray-500 mt-1.5">{t("habits_completed", { done: doneToday, total: totalHabits })}</p>
      </motion.div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{t("active_habits", { count: habits.length })}</p>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all"
          style={{ background: "rgba(57,255,20,0.1)", border: "1px solid rgba(57,255,20,0.3)", color: "#39ff14" }}>
          <Plus size={16} /> {t("new_habit")}
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="glass-card p-4 space-y-3">
            <h3 className="text-sm font-semibold" style={{ color: "#39ff14" }}>{t("new_habit")}</h3>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              placeholder={t("habit_name_placeholder")}
              className="w-full px-3 py-2 rounded-lg text-sm bg-black/40 border border-white/10 text-gray-200 focus:outline-none"
            />
            <div>
              <label className="text-xs text-gray-500 mb-2 block">{t("choose_icon")}</label>
              <div className="flex flex-wrap gap-2">
                {ICON_OPTIONS.map((icon) => (
                  <button key={icon} onClick={() => setForm({ ...form, icon })}
                    className="text-xl p-1.5 rounded-lg transition-all"
                    style={{ background: form.icon === icon ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.04)", border: "1px solid " + (form.icon === icon ? "rgba(255,255,255,0.2)" : "transparent") }}>
                    {icon}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-2 block">{t("color")}</label>
              <div className="flex gap-2">
                {COLOR_OPTIONS.map((color) => (
                  <button key={color} onClick={() => setForm({ ...form, color })}
                    className="w-7 h-7 rounded-full transition-all"
                    style={{ background: color, boxShadow: form.color === color ? "0 0 10px " + color : "none", transform: form.color === color ? "scale(1.2)" : "scale(1)" }} />
                ))}
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowForm(false)} className="px-3 py-1.5 text-sm text-gray-400 hover:text-gray-200">{t("cancel")}</button>
              <button onClick={handleAdd} className="px-4 py-1.5 text-sm rounded-lg font-medium"
                style={{ background: "rgba(57,255,20,0.15)", border: "1px solid rgba(57,255,20,0.4)", color: "#39ff14" }}>
                {t("new_habit")}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-3">
        <AnimatePresence>
          {habits.length === 0 ? (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-gray-500 text-center py-10">
              {t("no_habits")}
            </motion.p>
          ) : (
            habits.map((habit) => {
              const done = habit.completedDates.includes(today);
              const missedConsecutive = !habit.completedDates.includes(daysAgo(1)) && !habit.completedDates.includes(daysAgo(2));
              return (
                <motion.div key={habit.id} layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                  className="glass-card p-4"
                  style={{ borderColor: done ? habit.color + "30" : missedConsecutive ? "#ff008030" : "rgba(255,255,255,0.06)" }}>
                  <div className="flex items-start gap-3">
                    <button onClick={() => toggleHabitToday(habit.id)}
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-xl transition-all shrink-0"
                      style={{
                        background: done ? habit.color + "20" : "rgba(255,255,255,0.04)",
                        border: "2px solid " + (done ? habit.color + "60" : "rgba(255,255,255,0.08)"),
                        boxShadow: done ? "0 0 15px " + habit.color + "30" : "none",
                      }}>
                      {habit.icon}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-200">{habit.name}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="flex items-center gap-1 text-xs" style={{ color: habit.color }}>
                              <Flame size={10} /> {t("day_streak", { n: habit.streak })}
                            </span>
                            {done
                              ? <span className="flex items-center gap-1 text-xs" style={{ color: "#39ff14" }}><CheckCircle2 size={10} /> Done!</span>
                              : <span className="flex items-center gap-1 text-xs text-gray-500"><XCircle size={10} /> {t("pending")}</span>
                            }
                            {missedConsecutive && !done && (
                              <span className="text-xs" style={{ color: "#ff6600" }}>{t("missed_2d")}</span>
                            )}
                          </div>
                        </div>
                        <button onClick={() => deleteHabit(habit.id)} className="p-1 text-gray-600 hover:text-red-400 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <div className="flex gap-1.5 mt-3">
                        {last7.map((day) => {
                          const completed = habit.completedDates.includes(day);
                          return (
                            <div key={day} title={getDayLabel(day)} className="flex-1 text-center">
                              <div className="h-6 rounded-sm mx-auto w-full"
                                style={{ background: completed ? habit.color + "60" : "rgba(255,255,255,0.05)", boxShadow: completed ? "0 0 6px " + habit.color + "40" : "none" }} />
                              <p className="text-xs mt-0.5" style={{ color: "#6b8096", fontSize: "9px" }}>{getDayLabel(day).slice(0, 1)}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
