"use client";

import { useApp } from "@/contexts/app-context";
import { generateInsights, MOOD_CONFIG } from "@/lib/smart-insights";
import { todayStr, getLast7Days, getDayLabel, formatDateShort } from "@/lib/utils";
import { motion } from "framer-motion";
import { CheckSquare, Repeat, Smile, DollarSign, TrendingUp, Star } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import Link from "next/link";
import { useLanguage } from "@/contexts/language-context";

function StatCard({ label, value, sub, icon: Icon, color, href }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; color: string; href: string;
}) {
  return (
    <Link href={href}>
      <motion.div whileHover={{ scale: 1.02, y: -2 }} className="glass-card p-4 cursor-pointer" style={{ borderColor: color + "25" }}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{label}</p>
            <p className="text-2xl font-bold mt-1" style={{ color }}>{value}</p>
            {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
          </div>
          <div className="p-2 rounded-lg" style={{ background: color + "15" }}>
            <Icon size={18} style={{ color }} />
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

const SEVERITY_COLORS: Record<string, string> = {
  info: "#00f5ff", warning: "#ffff00", critical: "#ff0080", success: "#39ff14"
};

export default function DashboardPage() {
  const { tasks, habits, moodEntries, expenses } = useApp();
  const { t } = useLanguage();
  const today = todayStr();

  const todayTasks = tasks.filter((tk) => tk.dueDate === today);
  const completedToday = todayTasks.filter((tk) => tk.status === "done").length;
  const totalHabits = habits.length;
  const doneHabits = habits.filter((h) => h.completedDates.includes(today)).length;
  const habitPct = totalHabits > 0 ? Math.round((doneHabits / totalHabits) * 100) : 0;
  const todayMood = moodEntries.find((m) => m.date === today);
  const weekExpenses = expenses.filter((e) => getLast7Days().includes(e.date));
  const weekTotal = weekExpenses.reduce((s, e) => s + e.amount, 0);
  const insights = generateInsights(tasks, habits, moodEntries, expenses);
  const last7 = getLast7Days();

  const moodChartData = last7.map((day) => {
    const entry = moodEntries.find((m) => m.date === day);
    const moodValue = entry ? { amazing: 5, good: 4, neutral: 3, bad: 2, stressed: 1 }[entry.mood] : null;
    return { day: getDayLabel(day), mood: moodValue };
  });

  const taskChartData = last7.map((day) => ({
    day: getDayLabel(day),
    tasks: tasks.filter((tk) => tk.completedAt?.startsWith(day)).length,
  }));

  return (
    <div className="space-y-6 max-w-5xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-xl font-bold text-gray-100">{t("welcome")}</h2>
        <p className="text-sm text-gray-500 mt-0.5">{formatDateShort(today)} — {t("daily_overview")}</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label={t("stat_tasks_today")} value={completedToday + "/" + todayTasks.length} sub={tasks.filter(tk => tk.status !== "done").length + " " + t("stat_pending")} icon={CheckSquare} color="#00f5ff" href="/tasks" />
        <StatCard label={t("stat_habits_done")} value={habitPct + "%"} sub={doneHabits + "/" + totalHabits + " " + t("stat_habits")} icon={Repeat} color="#39ff14" href="/habits" />
        <StatCard label={t("stat_today_mood")} value={todayMood ? MOOD_CONFIG[todayMood.mood].emoji : "—"} sub={todayMood ? MOOD_CONFIG[todayMood.mood].label : t("stat_not_logged")} icon={Smile} color="#bf00ff" href="/mood" />
        <StatCard label={t("stat_week_spend")} value={"$" + weekTotal.toFixed(0)} sub={weekExpenses.length + " " + t("stat_transactions")} icon={DollarSign} color="#ff6600" href="/expenses" />
      </motion.div>

      <div className="grid md:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="glass-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Star size={14} style={{ color: "#ffff00" }} />
            <h3 className="text-sm font-semibold text-gray-200">{t("smart_insights_card")}</h3>
          </div>
          {insights.length === 0 ? (
            <p className="text-sm text-gray-500">{t("all_great")}</p>
          ) : (
            <div className="space-y-2">
              {insights.map((insight) => (
                <div key={insight.id} className="flex gap-3 p-3 rounded-lg"
                  style={{ background: SEVERITY_COLORS[insight.severity] + "08", border: "1px solid " + SEVERITY_COLORS[insight.severity] + "25" }}>
                  <span className="text-base shrink-0">{insight.icon}</span>
                  <p className="text-xs text-gray-300 leading-relaxed">{insight.message}</p>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="glass-card p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CheckSquare size={14} style={{ color: "#00f5ff" }} />
              <h3 className="text-sm font-semibold text-gray-200">{t("todays_tasks")}</h3>
            </div>
            <Link href="/tasks" className="text-xs" style={{ color: "#00f5ff" }}>{t("view_all")}</Link>
          </div>
          {todayTasks.length === 0 ? (
            <p className="text-sm text-gray-500">{t("no_tasks_today")}</p>
          ) : (
            <div className="space-y-2">
              {todayTasks.slice(0, 5).map((task) => (
                <div key={task.id} className="flex items-center gap-3 py-1.5">
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{
                    background: task.priority === "high" ? "#ff0080" : task.priority === "medium" ? "#ffff00" : "#39ff14"
                  }} />
                  <p className={"text-xs flex-1 " + (task.status === "done" ? "line-through text-gray-600" : "text-gray-300")}>{task.title}</p>
                  <span className="text-xs px-1.5 py-0.5 rounded font-mono" style={{
                    background: task.status === "done" ? "#39ff1415" : "#00f5ff15",
                    color: task.status === "done" ? "#39ff14" : "#00f5ff"
                  }}>{task.status}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Smile size={14} style={{ color: "#bf00ff" }} />
            <h3 className="text-sm font-semibold text-gray-200">{t("weekly_mood")}</h3>
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <AreaChart data={moodChartData} margin={{ top: 5, right: 5, bottom: 0, left: -30 }}>
              <defs>
                <linearGradient id="moodGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#bf00ff" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#bf00ff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#6b8096" }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 5]} tick={{ fontSize: 10, fill: "#6b8096" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "#080b14", border: "1px solid rgba(191,0,255,0.3)", borderRadius: 8, fontSize: 11 }} />
              <Area type="monotone" dataKey="mood" stroke="#bf00ff" fill="url(#moodGrad)" strokeWidth={2} dot={{ fill: "#bf00ff", r: 3 }} connectNulls />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="glass-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={14} style={{ color: "#00f5ff" }} />
            <h3 className="text-sm font-semibold text-gray-200">{t("tasks_completed_7d")}</h3>
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={taskChartData} margin={{ top: 5, right: 5, bottom: 0, left: -30 }}>
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#6b8096" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#6b8096" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "#080b14", border: "1px solid rgba(0,245,255,0.3)", borderRadius: 8, fontSize: 11 }} />
              <Bar dataKey="tasks" fill="#00f5ff" radius={[3, 3, 0, 0]} opacity={0.8} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Repeat size={14} style={{ color: "#39ff14" }} />
            <h3 className="text-sm font-semibold text-gray-200">{t("todays_habits")}</h3>
          </div>
          <Link href="/habits" className="text-xs" style={{ color: "#39ff14" }}>{t("manage")}</Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {habits.map((habit) => {
            const done = habit.completedDates.includes(today);
            return (
              <div key={habit.id} className="flex flex-col items-center gap-1.5 p-3 rounded-lg"
                style={{ background: done ? habit.color + "12" : "rgba(255,255,255,0.03)", border: "1px solid " + (done ? habit.color + "30" : "rgba(255,255,255,0.06)") }}>
                <span className="text-2xl">{habit.icon}</span>
                <p className="text-xs text-center text-gray-400">{habit.name}</p>
                <span className="text-xs font-mono px-1.5 py-0.5 rounded"
                  style={{ background: done ? habit.color + "20" : "rgba(255,255,255,0.05)", color: done ? habit.color : "#6b8096" }}>
                  {done ? "🔥 " + habit.streak + "d" : t("pending")}
                </span>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
