"use client";

import { useState } from "react";
import { useApp } from "@/contexts/app-context";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, CheckCircle, Circle, Clock, AlertTriangle, ChevronDown } from "lucide-react";
import { formatDate, todayStr } from "@/lib/utils";
import type { Task, Priority, TaskStatus } from "@/types";
import { useLanguage } from "@/contexts/language-context";

const PRIORITY_COLORS = {
  high: { color: "#ff0080", bg: "#ff008015" },
  medium: { color: "#ffff00", bg: "#ffff0015" },
  low: { color: "#39ff14", bg: "#39ff1415" },
};

const STATUS_COLORS = {
  todo: "#6b8096",
  "in-progress": "#00f5ff",
  done: "#39ff14",
};

function TaskCard({ task, onToggle, onDelete, onUpdate }: {
  task: Task;
  onToggle: () => void;
  onDelete: () => void;
  onUpdate: (updates: Partial<Task>) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const { t } = useLanguage();
  const isOverdue = task.status !== "done" && task.dueDate < todayStr();
  const p = PRIORITY_COLORS[task.priority];

  const statusLabel = (s: TaskStatus) =>
    s === "todo" ? t("status_todo") : s === "in-progress" ? t("status_in_progress") : t("status_done");

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="glass-card p-4"
      style={{ borderColor: task.status === "done" ? "#39ff1420" : isOverdue ? "#ff008030" : p.color + "20" }}
    >
      <div className="flex items-start gap-3">
        <button onClick={onToggle} className="mt-0.5 shrink-0">
          {task.status === "done"
            ? <CheckCircle size={18} style={{ color: "#39ff14" }} />
            : <Circle size={18} className="text-gray-600 hover:text-gray-400 transition-colors" />
          }
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={`text-sm font-medium ${task.status === "done" ? "line-through text-gray-500" : "text-gray-200"}`}>
              {task.title}
            </p>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: p.bg, color: p.color }}>
                {task.priority === "high" ? t("priority_high") : task.priority === "medium" ? t("priority_medium") : t("priority_low")}
              </span>
              <button onClick={() => setExpanded(!expanded)} className="p-0.5 text-gray-600 hover:text-gray-400">
                <ChevronDown size={14} className={`transition-transform ${expanded ? "rotate-180" : ""}`} />
              </button>
              <button onClick={onDelete} className="p-0.5 text-gray-600 hover:text-red-400 transition-colors">
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-xs" style={{ color: STATUS_COLORS[task.status] }}>● {statusLabel(task.status)}</span>
            <span className={`flex items-center gap-1 text-xs ${isOverdue ? "text-red-400" : "text-gray-500"}`}>
              {isOverdue && <AlertTriangle size={10} />}
              <Clock size={10} />
              {formatDate(task.dueDate)}
            </span>
          </div>

          <AnimatePresence>
            {expanded && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden">
                <div className="mt-3 pt-3 border-t border-white/5 space-y-3">
                  {task.description && <p className="text-xs text-gray-400">{task.description}</p>}
                  <div className="flex flex-wrap gap-2">
                    {(["todo", "in-progress", "done"] as TaskStatus[]).map((st) => (
                      <button key={st} onClick={() => onUpdate({ status: st, completedAt: st === "done" ? new Date().toISOString() : undefined })}
                        className="text-xs px-2 py-1 rounded transition-all"
                        style={{
                          background: task.status === st ? STATUS_COLORS[st] + "25" : "rgba(255,255,255,0.05)",
                          color: task.status === st ? STATUS_COLORS[st] : "#6b8096",
                          border: "1px solid " + (task.status === st ? STATUS_COLORS[st] + "40" : "transparent"),
                        }}>
                        {statusLabel(st)}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

export default function TasksPage() {
  const { tasks, addTask, updateTask, deleteTask, toggleTaskStatus } = useApp();
  const { t } = useLanguage();
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<"all" | TaskStatus>("all");
  const [form, setForm] = useState({ title: "", description: "", priority: "medium" as Priority, dueDate: todayStr(), status: "todo" as TaskStatus });

  const sorted = [...tasks]
    .filter((tk) => filter === "all" || tk.status === filter)
    .sort((a, b) => {
      const pOrder = { high: 0, medium: 1, low: 2 };
      if (pOrder[a.priority] !== pOrder[b.priority]) return pOrder[a.priority] - pOrder[b.priority];
      return a.dueDate.localeCompare(b.dueDate);
    });

  const handleAdd = () => {
    if (!form.title.trim()) return;
    addTask(form);
    setForm({ title: "", description: "", priority: "medium", dueDate: todayStr(), status: "todo" });
    setShowForm(false);
  };

  const counts = {
    all: tasks.length,
    todo: tasks.filter(tk => tk.status === "todo").length,
    "in-progress": tasks.filter(tk => tk.status === "in-progress").length,
    done: tasks.filter(tk => tk.status === "done").length,
  };

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{t("tasks_pending_done", { pending: counts.todo, done: counts.done })}</p>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all"
          style={{ background: "rgba(0,245,255,0.1)", border: "1px solid rgba(0,245,255,0.3)", color: "#00f5ff" }}>
          <Plus size={16} /> {t("add_task")}
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="glass-card p-4 space-y-3">
            <h3 className="text-sm font-semibold" style={{ color: "#00f5ff" }}>{t("new_task")}</h3>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              placeholder={t("task_title_placeholder")}
              className="w-full px-3 py-2 rounded-lg text-sm bg-black/40 border border-white/10 text-gray-200 focus:outline-none focus:border-cyan-500/50"
            />
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder={t("task_desc_placeholder")}
              rows={2}
              className="w-full px-3 py-2 rounded-lg text-sm bg-black/40 border border-white/10 text-gray-200 focus:outline-none focus:border-cyan-500/50 resize-none"
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">{t("priority")}</label>
                <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })}
                  className="w-full px-3 py-2 rounded-lg text-sm">
                  <option value="high">{t("priority_high")}</option>
                  <option value="medium">{t("priority_medium")}</option>
                  <option value="low">{t("priority_low")}</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">{t("due_date")}</label>
                <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-sm" />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowForm(false)} className="px-3 py-1.5 text-sm text-gray-400 hover:text-gray-200 transition-colors">{t("cancel")}</button>
              <button onClick={handleAdd} className="px-4 py-1.5 text-sm rounded-lg font-medium transition-all"
                style={{ background: "rgba(0,245,255,0.15)", border: "1px solid rgba(0,245,255,0.4)", color: "#00f5ff" }}>
                {t("add_task")}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-2 flex-wrap">
        {(["all", "todo", "in-progress", "done"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className="text-xs px-3 py-1.5 rounded-lg transition-all"
            style={{
              background: filter === f ? "rgba(0,245,255,0.12)" : "rgba(255,255,255,0.04)",
              border: "1px solid " + (filter === f ? "rgba(0,245,255,0.35)" : "rgba(255,255,255,0.08)"),
              color: filter === f ? "#00f5ff" : "#6b8096",
            }}>
            {f === "all" ? t("filter_all") : f === "todo" ? t("status_todo") : f === "in-progress" ? t("status_in_progress") : t("status_done")} ({counts[f]})
          </button>
        ))}
      </div>

      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {sorted.length === 0 ? (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-gray-500 text-center py-10">
              {t("no_tasks_found")}
            </motion.p>
          ) : (
            sorted.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onToggle={() => toggleTaskStatus(task.id)}
                onDelete={() => deleteTask(task.id)}
                onUpdate={(u) => updateTask(task.id, u)}
              />
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
