"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useApp } from "@/contexts/app-context";
import { useLanguage } from "@/contexts/language-context";
import { todayStr } from "@/lib/utils";

type CalendarEvent = {
  id: string;
  date: string;
  label: string;
  color: string;
  type: "task" | "habit" | "birthday" | "pomodoro" | "mood";
};

const TYPE_COLORS = {
  task: "#bf00ff",
  habit: "#39ff14",
  birthday: "#ff9500",
  pomodoro: "#ff0080",
  mood: "#00f5ff",
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default function CalendarPage() {
  const { tasks, habits, contacts, moodEntries, pomodoroSessions } = useApp();
  const { t } = useLanguage();
  const today = todayStr();

  const [viewDate, setViewDate] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const [selectedDay, setSelectedDay] = useState<string | null>(today);

  // Compute all events
  const events = useMemo<CalendarEvent[]>(() => {
    const evts: CalendarEvent[] = [];

    // Tasks with due dates
    tasks.forEach((task) => {
      if (task.dueDate) {
        evts.push({ id: `task-${task.id}`, date: task.dueDate.slice(0, 10), label: task.title, color: TYPE_COLORS.task, type: "task" });
      }
    });

    // Habits completed dates
    habits.forEach((habit) => {
      habit.completedDates.forEach((d) => {
        evts.push({ id: `habit-${habit.id}-${d}`, date: d, label: `${habit.icon} ${habit.name}`, color: TYPE_COLORS.habit, type: "habit" });
      });
    });

    // Birthdays (this year)
    contacts.forEach((c) => {
      if (c.birthday) {
        const bday = `${viewDate.year}-${c.birthday.slice(5)}`;
        evts.push({ id: `bday-${c.id}`, date: bday, label: `🎂 ${c.name}'s birthday`, color: TYPE_COLORS.birthday, type: "birthday" });
      }
    });

    // Mood entries
    moodEntries.forEach((m) => {
      const MOOD_EMOJI: Record<string, string> = { amazing: "😄", good: "😊", neutral: "😐", bad: "😔", stressed: "😤" };
      evts.push({ id: `mood-${m.id}`, date: m.date, label: `${MOOD_EMOJI[m.mood] || "😐"} Mood: ${m.mood}`, color: TYPE_COLORS.mood, type: "mood" });
    });

    // Pomodoro sessions (count per day)
    const pomoDays = new Map<string, number>();
    pomodoroSessions.filter((s) => s.mode === "focus" && s.completed).forEach((s) => {
      pomoDays.set(s.date, (pomoDays.get(s.date) || 0) + 1);
    });
    pomoDays.forEach((count, date) => {
      evts.push({ id: `pomo-${date}`, date, label: `🍅 ${count} focus session${count > 1 ? "s" : ""}`, color: TYPE_COLORS.pomodoro, type: "pomodoro" });
    });

    return evts;
  }, [tasks, habits, contacts, moodEntries, pomodoroSessions, viewDate.year]);

  // Build calendar grid
  const { year, month } = viewDate;
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  function dateStr(day: number) {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  function eventsForDay(day: number) {
    const ds = dateStr(day);
    return events.filter((e) => e.date === ds);
  }

  const selectedEvents = selectedDay ? events.filter((e) => e.date === selectedDay) : [];

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold" style={{ color: "#00f5ff" }}>
          {MONTHS[month]} {year}
        </h2>
        <div className="flex gap-2">
          <button onClick={() => setViewDate((v) => {
            const d = new Date(v.year, v.month - 1, 1);
            return { year: d.getFullYear(), month: d.getMonth() };
          })} className="p-2 rounded-lg transition-all hover:bg-white/5"
            style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
            <ChevronLeft size={16} className="text-gray-400" />
          </button>
          <button onClick={() => {
            const d = new Date();
            setViewDate({ year: d.getFullYear(), month: d.getMonth() });
            setSelectedDay(today);
          }} className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{ background: "rgba(0,245,255,0.08)", border: "1px solid rgba(0,245,255,0.2)", color: "#00f5ff" }}>
            Today
          </button>
          <button onClick={() => setViewDate((v) => {
            const d = new Date(v.year, v.month + 1, 1);
            return { year: d.getFullYear(), month: d.getMonth() };
          })} className="p-2 rounded-lg transition-all hover:bg-white/5"
            style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
            <ChevronRight size={16} className="text-gray-400" />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-3 flex-wrap">
        {Object.entries(TYPE_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
            <span className="text-xs text-gray-500 capitalize">{type}</span>
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card overflow-hidden">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-white/5">
          {WEEKDAYS.map((wd) => (
            <div key={wd} className="py-2 text-center text-xs font-semibold uppercase tracking-wider text-gray-600">{wd}</div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7">
          {cells.map((day, i) => {
            if (!day) return <div key={`empty-${i}`} className="h-20 border-b border-r border-white/4 last:border-r-0" />;
            const ds = dateStr(day);
            const dayEvts = eventsForDay(day);
            const isToday = ds === today;
            const isSelected = ds === selectedDay;

            return (
              <motion.div key={ds} whileTap={{ scale: 0.97 }}
                onClick={() => setSelectedDay(isSelected ? null : ds)}
                className="h-20 border-b border-r border-white/4 last:border-r-0 p-1.5 cursor-pointer transition-all relative overflow-hidden"
                style={{
                  background: isSelected ? "rgba(0,245,255,0.06)" : isToday ? "rgba(0,245,255,0.03)" : "transparent",
                  borderColor: isSelected ? "rgba(0,245,255,0.2)" : undefined,
                }}>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-mono font-semibold ${isToday ? "text-white" : "text-gray-500"}`}
                    style={isToday ? {
                      background: "#00f5ff", color: "#080b14", borderRadius: "50%",
                      width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center",
                    } : {}}>
                    {day}
                  </span>
                  {dayEvts.length > 0 && (
                    <span className="text-[9px] font-mono text-gray-600">{dayEvts.length}</span>
                  )}
                </div>
                {/* Event dots */}
                <div className="flex flex-col gap-0.5">
                  {dayEvts.slice(0, 3).map((evt, j) => (
                    <div key={evt.id} className="w-full h-1.5 rounded-full" style={{ background: evt.color + "99" }} />
                  ))}
                  {dayEvts.length > 3 && (
                    <div className="text-[8px] text-gray-600">+{dayEvts.length - 3}</div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Selected day events */}
      {selectedDay && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-4">
          <h3 className="text-sm font-semibold text-gray-200 mb-3">
            {new Date(selectedDay + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </h3>
          {selectedEvents.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No events on this day</p>
          ) : (
            <div className="space-y-2">
              {selectedEvents.map((evt) => (
                <div key={evt.id} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: evt.color, boxShadow: `0 0 6px ${evt.color}` }} />
                  <span className="text-xs text-gray-300 flex-1">{evt.label}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded capitalize"
                    style={{ background: `${evt.color}15`, color: evt.color }}>{evt.type}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
