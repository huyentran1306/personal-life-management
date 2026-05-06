"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  CheckSquare,
  Repeat,
  BookOpen,
  Smile,
  DollarSign,
  Users,
  Timer,
  Zap,
  Menu,
  X,
  Target,
  CalendarDays,
  Gamepad2,
  Medal,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";
import type { TranslationKey } from "@/lib/i18n";

const NAV_ITEMS: { href: string; labelKey: TranslationKey; icon: React.ComponentType<{ size?: number; style?: React.CSSProperties; className?: string }>; color: string }[] = [
  { href: "/", labelKey: "nav_dashboard", icon: LayoutDashboard, color: "#00f5ff" },
  { href: "/tasks", labelKey: "nav_tasks", icon: CheckSquare, color: "#bf00ff" },
  { href: "/habits", labelKey: "nav_habits", icon: Repeat, color: "#39ff14" },
  { href: "/journal", labelKey: "nav_journal", icon: BookOpen, color: "#ff0080" },
  { href: "/mood", labelKey: "nav_mood", icon: Smile, color: "#ffff00" },
  { href: "/expenses", labelKey: "nav_expenses", icon: DollarSign, color: "#ff6600" },
  { href: "/crm", labelKey: "nav_crm", icon: Users, color: "#00f5ff" },
  { href: "/pomodoro", labelKey: "nav_pomodoro", icon: Timer, color: "#ff0080" },
  { href: "/goals", labelKey: "nav_goals", icon: Target, color: "#bf00ff" },
  { href: "/calendar", labelKey: "nav_calendar", icon: CalendarDays, color: "#00f5ff" },
  { href: "/games", labelKey: "nav_games", icon: Gamepad2, color: "#39ff14" },
  { href: "/achievements", labelKey: "nav_achievements", icon: Medal, color: "#ffff00" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t } = useLanguage();

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #00f5ff, #bf00ff)", boxShadow: "0 0 15px rgba(0,245,255,0.5)" }}>
            <Zap size={16} className="text-black" />
          </div>
          <div>
            <div className="font-bold text-sm tracking-wider" style={{ color: "#00f5ff", textShadow: "0 0 10px #00f5ff" }}>
              LIFE OS
            </div>
            <div className="text-xs text-gray-500">{t("nav_tagline")}</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 group relative",
                active
                  ? "text-white"
                  : "text-gray-400 hover:text-gray-200"
              )}
              style={active ? {
                background: `linear-gradient(135deg, ${item.color}18, ${item.color}08)`,
                borderColor: `${item.color}40`,
                border: `1px solid ${item.color}30`,
                boxShadow: `0 0 15px ${item.color}20`,
              } : {}}
            >
              {active && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-lg"
                  style={{ background: `linear-gradient(135deg, ${item.color}15, ${item.color}05)` }}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                />
              )}
              <item.icon
                size={17}
                style={{ color: active ? item.color : undefined, filter: active ? `drop-shadow(0 0 6px ${item.color})` : undefined }}
                className={cn("shrink-0 relative z-10", !active && "group-hover:text-gray-200")}
              />
              <span className="relative z-10 font-medium">{t(item.labelKey)}</span>
              {active && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full relative z-10"
                  style={{ background: item.color, boxShadow: `0 0 6px ${item.color}` }} />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-white/5">
        <div className="text-xs text-gray-600 text-center">
          {t("nav_data_local")}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 h-screen sticky top-0 border-r border-white/5"
        style={{ background: "rgba(5, 8, 18, 0.9)", backdropFilter: "blur(20px)" }}>
        <SidebarContent />
      </aside>

      {/* Mobile: toggle button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg"
        style={{ background: "rgba(0,245,255,0.1)", border: "1px solid rgba(0,245,255,0.2)" }}
      >
        <Menu size={18} style={{ color: "#00f5ff" }} />
      </button>

      {/* Mobile: drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="md:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: -256 }}
              animate={{ x: 0 }}
              exit={{ x: -256 }}
              transition={{ type: "spring", bounce: 0, duration: 0.3 }}
              className="md:hidden fixed inset-y-0 left-0 z-50 w-56 border-r border-white/5"
              style={{ background: "rgba(5, 8, 18, 0.98)", backdropFilter: "blur(20px)" }}
            >
              <button onClick={() => setMobileOpen(false)}
                className="absolute top-4 right-4 p-1 rounded text-gray-400 hover:text-white">
                <X size={16} />
              </button>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
