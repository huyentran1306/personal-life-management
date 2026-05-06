"use client";

import { useState, useMemo } from "react";
import { useApp } from "@/contexts/app-context";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, TrendingUp, PieChart, ChevronDown } from "lucide-react";
import { todayStr, getLast7Days, getDayLabel, currencyFormat } from "@/lib/utils";
import type { ExpenseCategory } from "@/types";
import { PieChart as RPieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from "recharts";
import { useLanguage } from "@/contexts/language-context";
import type { TranslationKey } from "@/lib/i18n";

const CATEGORY_META: Record<ExpenseCategory, { labelKey: TranslationKey; color: string; icon: string }> = {
  food: { labelKey: "cat_food", color: "#ff6600", icon: "🍔" },
  transport: { labelKey: "cat_transport", color: "#00f5ff", icon: "🚗" },
  shopping: { labelKey: "cat_shopping", color: "#bf00ff", icon: "🛍️" },
  entertainment: { labelKey: "cat_entertainment", color: "#ff0080", icon: "🎮" },
  health: { labelKey: "cat_health", color: "#39ff14", icon: "💊" },
  bills: { labelKey: "cat_bills", color: "#ffff00", icon: "📄" },
  other: { labelKey: "cat_other", color: "#6b8096", icon: "💰" },
};

export default function ExpensesPage() {
  const { expenses, addExpense, deleteExpense } = useApp();
  const { t } = useLanguage();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ amount: "", note: "", date: todayStr() });
  const [selectedMonth, setSelectedMonth] = useState<string>("all"); // "all" | "YYYY-MM"

  // ─── Thousand separator helpers ───────────────────────────────────────────
  function formatAmountDisplay(val: string): string {
    const digits = val.replace(/[^\d]/g, "");
    if (!digits) return "";
    return Number(digits).toLocaleString("en-US");
  }

  function handleAmountChange(raw: string) {
    const digits = raw.replace(/[^\d]/g, "");
    setForm((f) => ({ ...f, amount: digits }));
  }

  const handleAdd = () => {
    const amt = parseFloat(form.amount.replace(/,/g, ""));
    if (!form.note.trim() || isNaN(amt) || amt <= 0) return;
    addExpense(amt, form.note, form.date);
    setForm({ amount: "", note: "", date: todayStr() });
    setShowForm(false);
  };

  // Generate available months from expense data
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    expenses.forEach((e) => {
      const m = e.date.substring(0, 7); // "YYYY-MM"
      months.add(m);
    });
    return Array.from(months).sort().reverse();
  }, [expenses]);

  // Filter expenses by selected month
  const filteredExpenses = useMemo(() => {
    if (selectedMonth === "all") return expenses;
    return expenses.filter((e) => e.date.startsWith(selectedMonth));
  }, [expenses, selectedMonth]);

  const total = filteredExpenses.reduce((s, e) => s + e.amount, 0);
  const thisWeek = expenses.filter((e) => getLast7Days().includes(e.date));
  const weekTotal = thisWeek.reduce((s, e) => s + e.amount, 0);

  const byCategory = Object.entries(CATEGORY_META).map(([cat, cfg]) => {
    const catExpenses = filteredExpenses.filter((e) => e.category === cat);
    const catTotal = catExpenses.reduce((s, e) => s + e.amount, 0);
    return { category: cat as ExpenseCategory, ...cfg, total: catTotal, count: catExpenses.length, label: t(cfg.labelKey) };
  }).filter((c) => c.total > 0).sort((a, b) => b.total - a.total);

  // Daily chart: last 7 days for "all", or days in selected month
  const dailyChart = useMemo(() => {
    if (selectedMonth === "all") {
      const last7 = getLast7Days();
      return last7.map((day) => ({
        day: getDayLabel(day),
        amount: filteredExpenses.filter((e) => e.date === day).reduce((s, e) => s + e.amount, 0),
      }));
    }
    // Build all days of the selected month
    const [year, month] = selectedMonth.split("-").map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => {
      const d = String(i + 1).padStart(2, "0");
      const dateStr = `${selectedMonth}-${d}`;
      return {
        day: String(i + 1),
        amount: filteredExpenses.filter((e) => e.date === dateStr).reduce((s, e) => s + e.amount, 0),
      };
    });
  }, [filteredExpenses, selectedMonth]);

  const recent = [...filteredExpenses].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 20);

  const monthLabel = (m: string) => {
    const [y, mo] = m.split("-");
    return new Date(Number(y), Number(mo) - 1, 1).toLocaleString("default", { month: "long", year: "numeric" });
  };

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Period filter */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs text-gray-500 uppercase tracking-wider">{t("expense_filter_label")}:</span>
        <button onClick={() => setSelectedMonth("all")}
          className="px-3 py-1 rounded-lg text-sm font-medium transition-all"
          style={{
            background: selectedMonth === "all" ? "rgba(255,102,0,0.15)" : "rgba(255,255,255,0.04)",
            border: `1px solid ${selectedMonth === "all" ? "rgba(255,102,0,0.4)" : "rgba(255,255,255,0.08)"}`,
            color: selectedMonth === "all" ? "#ff6600" : "#6b8096",
          }}>
          {t("expense_all_time")}
        </button>
        {availableMonths.map((m) => (
          <button key={m} onClick={() => setSelectedMonth(m)}
            className="px-3 py-1 rounded-lg text-sm font-medium transition-all"
            style={{
              background: selectedMonth === m ? "rgba(255,102,0,0.15)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${selectedMonth === m ? "rgba(255,102,0,0.4)" : "rgba(255,255,255,0.08)"}`,
              color: selectedMonth === m ? "#ff6600" : "#6b8096",
            }}>
            {monthLabel(m)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider">{t("total_expenses")}</p>
          <p className="text-2xl font-bold mt-1" style={{ color: "#ff6600" }}>{currencyFormat(total)}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider">{t("this_week")}</p>
          <p className="text-2xl font-bold mt-1" style={{ color: "#ffff00" }}>{currencyFormat(weekTotal)}</p>
        </motion.div>
      </div>

      <div className="flex justify-end">
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium"
          style={{ background: "rgba(255,102,0,0.1)", border: "1px solid rgba(255,102,0,0.3)", color: "#ff6600" }}>
          <Plus size={16} /> {t("add_expense")}
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="glass-card p-4 space-y-3">
            <h3 className="text-sm font-semibold" style={{ color: "#ff6600" }}>{t("new_expense")}</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">{t("amount")}</label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formatAmountDisplay(form.amount)}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-lg text-sm pr-8"
                  />
                  {form.amount && (
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500 pointer-events-none">₫</span>
                  )}
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">{t("date")}</label>
                <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-sm" />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">{t("note_autocategorize")}</label>
              <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                placeholder={t("expense_placeholder")}
                className="w-full px-3 py-2 rounded-lg text-sm" />
              <p className="text-xs text-gray-600 mt-1">{t("expense_hint")}</p>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowForm(false)} className="px-3 py-1.5 text-sm text-gray-400">{t("cancel")}</button>
              <button onClick={handleAdd} className="px-4 py-1.5 text-sm rounded-lg font-medium"
                style={{ background: "rgba(255,102,0,0.15)", border: "1px solid rgba(255,102,0,0.4)", color: "#ff6600" }}>
                {t("add_expense")}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid md:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="glass-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={14} style={{ color: "#ff6600" }} />
            <h3 className="text-sm font-semibold text-gray-200">
              {selectedMonth === "all" ? t("daily_spending_7d") : monthLabel(selectedMonth)}
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={dailyChart} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#6b8096" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#6b8096" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "#080b14", border: "1px solid rgba(255,102,0,0.3)", borderRadius: 8, fontSize: 11 }} formatter={(v) => ["$" + v, "Spent"]} />
              <Bar dataKey="amount" fill="#ff6600" radius={[3, 3, 0, 0]} opacity={0.8} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="glass-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <PieChart size={14} style={{ color: "#bf00ff" }} />
            <h3 className="text-sm font-semibold text-gray-200">{t("by_category")}</h3>
          </div>
          {byCategory.length === 0 ? (
            <p className="text-sm text-gray-500">{t("no_expenses")}</p>
          ) : (
            <div className="flex gap-3">
              <ResponsiveContainer width={100} height={100}>
                <RPieChart>
                  <Pie data={byCategory} cx="50%" cy="50%" innerRadius={25} outerRadius={45} dataKey="total" stroke="none">
                    {byCategory.map((entry, i) => <Cell key={i} fill={entry.color} opacity={0.85} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#080b14", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 10 }}
                    formatter={(v) => [currencyFormat(v as number), ""]} />
                </RPieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-1 overflow-y-auto max-h-24">
                {byCategory.map((cat) => (
                  <div key={cat.category} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1">
                      <span>{cat.icon}</span>
                      <span style={{ color: cat.color }}>{cat.label}</span>
                    </span>
                    <span className="text-gray-400">{currencyFormat(cat.total)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-4">
        <h3 className="text-sm font-semibold text-gray-200 mb-3">{t("recent_transactions")}</h3>
        {recent.length === 0 ? (
          <p className="text-sm text-gray-500">{t("no_expenses")}</p>
        ) : (
          <div className="space-y-1">
            <AnimatePresence>
              {recent.map((exp) => {
                const cfg = CATEGORY_META[exp.category];
                const label = t(cfg.labelKey);
                return (
                  <motion.div key={exp.id} layout initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                    className="flex items-center gap-3 py-2.5 border-b border-white/4 last:border-0">
                    <span className="text-lg w-7 text-center">{cfg.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-200 truncate">{exp.note}</p>
                      <p className="text-xs" style={{ color: cfg.color }}>{label} · {exp.date}</p>
                    </div>
                    <span className="font-bold text-sm text-gray-200">${exp.amount.toFixed(2)}</span>
                    <button onClick={() => deleteExpense(exp.id)} className="p-1 text-gray-600 hover:text-red-400 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    </div>
  );
}

