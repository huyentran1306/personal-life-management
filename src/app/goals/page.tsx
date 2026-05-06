"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Target, TrendingUp, Edit3, Check } from "lucide-react";
import { generateId, todayStr } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";

interface Goal {
  id: string;
  title: string;
  description: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  deadline: string;
  category: string;
  color: string;
  createdAt: string;
}

const CATEGORIES = [
  { key: "health", label: "🏃 Health", color: "#39ff14" },
  { key: "finance", label: "💰 Finance", color: "#ff6600" },
  { key: "learning", label: "📚 Learning", color: "#00f5ff" },
  { key: "career", label: "🚀 Career", color: "#bf00ff" },
  { key: "personal", label: "🌟 Personal", color: "#ff0080" },
  { key: "other", label: "✨ Other", color: "#6b8096" },
];

const COLORS = ["#ff0080", "#00f5ff", "#39ff14", "#bf00ff", "#ff6600", "#ffff00"];

const STORAGE_KEY = "plm-goals";

function loadGoals(): Goal[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
}

function saveGoals(goals: Goal[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
}

export default function GoalsPage() {
  const { t } = useLanguage();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "", description: "", targetValue: "", currentValue: "0",
    unit: "", deadline: "", category: "personal", color: "#bf00ff",
  });

  useEffect(() => { setGoals(loadGoals()); }, []);

  function persistGoals(updated: Goal[]) {
    setGoals(updated);
    saveGoals(updated);
  }

  function handleSave() {
    if (!form.title.trim() || !form.targetValue) return;
    const goal: Goal = {
      id: editingId || generateId(),
      title: form.title,
      description: form.description,
      targetValue: parseFloat(form.targetValue),
      currentValue: parseFloat(form.currentValue) || 0,
      unit: form.unit,
      deadline: form.deadline,
      category: form.category,
      color: form.color,
      createdAt: editingId ? (goals.find((g) => g.id === editingId)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
    };
    if (editingId) {
      persistGoals(goals.map((g) => (g.id === editingId ? goal : g)));
      setEditingId(null);
    } else {
      persistGoals([...goals, goal]);
    }
    setForm({ title: "", description: "", targetValue: "", currentValue: "0", unit: "", deadline: "", category: "personal", color: "#bf00ff" });
    setShowForm(false);
  }

  function handleEdit(goal: Goal) {
    setForm({
      title: goal.title, description: goal.description,
      targetValue: String(goal.targetValue), currentValue: String(goal.currentValue),
      unit: goal.unit, deadline: goal.deadline, category: goal.category, color: goal.color,
    });
    setEditingId(goal.id);
    setShowForm(true);
  }

  function handleUpdateProgress(id: string, delta: number) {
    persistGoals(goals.map((g) => g.id === id ? { ...g, currentValue: Math.min(Math.max(0, g.currentValue + delta), g.targetValue) } : g));
  }

  function handleDelete(id: string) {
    persistGoals(goals.filter((g) => g.id !== id));
  }

  const completed = goals.filter((g) => g.currentValue >= g.targetValue).length;
  const inProgress = goals.filter((g) => g.currentValue > 0 && g.currentValue < g.targetValue).length;

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Goals", value: goals.length, color: "#00f5ff" },
          { label: "In Progress", value: inProgress, color: "#ff9500" },
          { label: "Completed", value: completed, color: "#39ff14" },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="glass-card p-4 text-center">
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="flex justify-end">
        <button onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({ title: "", description: "", targetValue: "", currentValue: "0", unit: "", deadline: "", category: "personal", color: "#bf00ff" }); }}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium"
          style={{ background: "rgba(191,0,255,0.1)", border: "1px solid rgba(191,0,255,0.3)", color: "#bf00ff" }}>
          <Plus size={16} /> Add Goal
        </button>
      </div>

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="glass-card p-5 space-y-4">
            <h3 className="text-sm font-semibold" style={{ color: "#bf00ff" }}>{editingId ? "Edit Goal" : "New Goal"}</h3>

            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Goal title..." className="w-full px-3 py-2.5 rounded-xl text-sm" />
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Description (optional)..." rows={2}
              className="w-full px-3 py-2.5 rounded-xl text-sm resize-none" />

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Target Value</label>
                <input type="number" value={form.targetValue} onChange={(e) => setForm({ ...form, targetValue: e.target.value })}
                  placeholder="100" className="w-full px-3 py-2 rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Current Value</label>
                <input type="number" value={form.currentValue} onChange={(e) => setForm({ ...form, currentValue: e.target.value })}
                  placeholder="0" className="w-full px-3 py-2 rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Unit</label>
                <input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  placeholder="km, books, $..." className="w-full px-3 py-2 rounded-lg text-sm" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Deadline</label>
                <input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Category</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-sm">
                  {CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
                </select>
              </div>
            </div>

            {/* Color picker */}
            <div className="flex gap-2 items-center">
              <span className="text-xs text-gray-500">Color:</span>
              {COLORS.map((c) => (
                <button key={c} onClick={() => setForm({ ...form, color: c })}
                  className="w-6 h-6 rounded-full transition-all"
                  style={{ background: c, boxShadow: form.color === c ? `0 0 10px ${c}` : "none", transform: form.color === c ? "scale(1.3)" : "scale(1)" }} />
              ))}
            </div>

            <div className="flex gap-2 justify-end">
              <button onClick={() => { setShowForm(false); setEditingId(null); }} className="px-3 py-1.5 text-sm text-gray-400">Cancel</button>
              <button onClick={handleSave} className="px-4 py-1.5 text-sm rounded-lg font-medium"
                style={{ background: "rgba(191,0,255,0.15)", border: "1px solid rgba(191,0,255,0.4)", color: "#bf00ff" }}>
                {editingId ? "Update" : "Create Goal"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Goals list */}
      <div className="space-y-3">
        <AnimatePresence>
          {goals.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
              <Target size={40} className="mx-auto text-gray-700 mb-3" />
              <p className="text-gray-500">No goals yet. Set your first goal! 🎯</p>
            </motion.div>
          ) : (
            goals.map((goal, idx) => {
              const pct = Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100));
              const done = pct >= 100;
              const catMeta = CATEGORIES.find((c) => c.key === goal.category);
              const daysLeft = goal.deadline ? Math.ceil((new Date(goal.deadline).getTime() - new Date(todayStr()).getTime()) / (1000 * 60 * 60 * 24)) : null;

              return (
                <motion.div key={goal.id} layout
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: idx * 0.04 }}
                  className="glass-card p-4"
                  style={{ borderColor: done ? `${goal.color}40` : "rgba(255,255,255,0.06)" }}>

                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {done && <Check size={14} style={{ color: goal.color }} />}
                        <h3 className="text-sm font-semibold text-gray-200 truncate">{goal.title}</h3>
                      </div>
                      {goal.description && <p className="text-xs text-gray-500 mt-0.5 truncate">{goal.description}</p>}
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs px-1.5 py-0.5 rounded"
                          style={{ background: `${goal.color}15`, color: goal.color }}>{catMeta?.label}</span>
                        {daysLeft !== null && (
                          <span className="text-xs text-gray-600">
                            {daysLeft > 0 ? `${daysLeft}d left` : daysLeft === 0 ? "Due today!" : `${Math.abs(daysLeft)}d overdue`}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <button onClick={() => handleEdit(goal)} className="p-1.5 rounded-lg text-gray-600 hover:text-gray-300"
                        style={{ background: "rgba(255,255,255,0.04)" }}><Edit3 size={13} /></button>
                      <button onClick={() => handleDelete(goal.id)} className="p-1.5 rounded-lg text-gray-600 hover:text-red-400"
                        style={{ background: "rgba(255,255,255,0.04)" }}><Trash2 size={13} /></button>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">
                        {goal.currentValue.toLocaleString()} / {goal.targetValue.toLocaleString()} {goal.unit}
                      </span>
                      <span className="text-sm font-bold font-mono" style={{ color: goal.color }}>{pct}%</span>
                    </div>
                    <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                      <motion.div className="h-full rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        style={{ background: `linear-gradient(90deg, ${goal.color}88, ${goal.color})`, boxShadow: `0 0 8px ${goal.color}66` }}
                      />
                    </div>

                    {/* Quick progress buttons */}
                    {!done && (
                      <div className="flex gap-2 mt-2">
                        {[1, 5, 10].map((delta) => (
                          <button key={delta} onClick={() => handleUpdateProgress(goal.id, delta)}
                            className="text-xs px-2 py-1 rounded-lg transition-all hover:scale-105"
                            style={{ background: `${goal.color}12`, color: goal.color, border: `1px solid ${goal.color}25` }}>
                            +{delta} {goal.unit}
                          </button>
                        ))}
                        <button onClick={() => handleUpdateProgress(goal.id, -1)}
                          className="text-xs px-2 py-1 rounded-lg ml-auto transition-all"
                          style={{ background: "rgba(255,255,255,0.04)", color: "#6b8096" }}>
                          -1
                        </button>
                      </div>
                    )}
                    {done && (
                      <div className="flex items-center gap-2 mt-1">
                        <TrendingUp size={12} style={{ color: goal.color }} />
                        <span className="text-xs font-semibold" style={{ color: goal.color }}>Goal achieved! 🎉</span>
                      </div>
                    )}
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
