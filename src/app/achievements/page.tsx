"use client";

import { motion } from "framer-motion";
import { Zap, Trophy, Star, Shield } from "lucide-react";
import { useGamification } from "@/hooks/useGamification";

export default function GamificationWidget() {
  const { state, xpProgress, xpForCurrentLevel, XP_PER_LEVEL, ALL_BADGES } = useGamification();

  const LEVEL_NAMES = ["", "Rookie", "Explorer", "Pro", "Expert", "Master", "Legend", "Elite", "Champion", "Grandmaster", "Overlord"];
  const levelName = LEVEL_NAMES[Math.min(state.level, LEVEL_NAMES.length - 1)] || `Lv ${state.level}`;

  return (
    <div className="min-h-screen p-6" style={{ background: "var(--bg-primary)" }}>
      <div className="max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <Trophy size={28} style={{ color: "#ffff00", filter: "drop-shadow(0 0 8px #ffff00)" }} />
            <h1 className="text-2xl font-bold" style={{ color: "#fff" }}>Achievements</h1>
          </div>
          <p className="text-sm" style={{ color: "#666" }}>Your XP, level, and earned badges</p>
        </motion.div>

        {/* Level card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-2xl mb-6"
          style={{ background: "linear-gradient(135deg, rgba(0,245,255,0.08), rgba(191,0,255,0.08))", border: "1px solid rgba(0,245,255,0.2)" }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold"
                style={{ background: "linear-gradient(135deg, #00f5ff, #bf00ff)", color: "#000" }}>
                {state.level}
              </div>
              <div>
                <div className="font-bold text-lg" style={{ color: "#fff" }}>Level {state.level}</div>
                <div className="text-sm" style={{ color: "#00f5ff" }}>{levelName}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold" style={{ color: "#ffff00" }}>{state.xp}</div>
              <div className="text-xs" style={{ color: "#666" }}>Total XP</div>
            </div>
          </div>

          <div className="mb-1 flex justify-between text-xs" style={{ color: "#666" }}>
            <span>{xpForCurrentLevel} / {XP_PER_LEVEL} XP</span>
            <span>{Math.round(xpProgress)}%</span>
          </div>
          <div className="h-3 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
            <motion.div className="h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${xpProgress}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              style={{ background: "linear-gradient(90deg, #00f5ff, #bf00ff)", boxShadow: "0 0 10px rgba(0,245,255,0.5)" }} />
          </div>
        </motion.div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "Tasks Done", value: state.totalTasksDone, icon: "✅", color: "#39ff14" },
            { label: "Habits Done", value: state.totalHabitsDone, icon: "🔄", color: "#00f5ff" },
            { label: "Focus Sessions", value: state.totalPomodoros, icon: "🍅", color: "#ff0080" },
          ].map((s) => (
            <div key={s.label} className="p-4 rounded-xl text-center"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="text-xl mb-1">{s.icon}</div>
              <div className="text-xl font-bold" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs" style={{ color: "#666" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Badges */}
        <div className="p-4 rounded-2xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex items-center gap-2 mb-4">
            <Shield size={16} style={{ color: "#ffff00" }} />
            <span className="font-semibold text-sm" style={{ color: "#fff" }}>Badges ({state.badges.length}/{ALL_BADGES.length})</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {ALL_BADGES.map((badge) => {
              const earned = state.badges.find((b) => b.id === badge.id);
              return (
                <motion.div key={badge.id} whileHover={{ scale: 1.03 }}
                  className="p-3 rounded-xl text-center"
                  style={{
                    background: earned ? `${badge.color}12` : "rgba(255,255,255,0.02)",
                    border: earned ? `1px solid ${badge.color}40` : "1px solid rgba(255,255,255,0.05)",
                    opacity: earned ? 1 : 0.4,
                    filter: earned ? "none" : "grayscale(1)",
                  }}>
                  <div className="text-2xl mb-1">{badge.icon}</div>
                  <div className="text-xs font-semibold" style={{ color: earned ? "#fff" : "#555" }}>{badge.name}</div>
                  <div className="text-xs mt-0.5" style={{ color: earned ? badge.color : "#444" }}>{badge.description}</div>
                  {earned && (
                    <div className="text-xs mt-1" style={{ color: "#555" }}>
                      {new Date(earned.unlockedAt!).toLocaleDateString()}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
