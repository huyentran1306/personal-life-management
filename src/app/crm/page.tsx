"use client";

import { useState } from "react";
import { useApp } from "@/contexts/app-context";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, MessageSquare, Clock, AlertCircle, ChevronDown, Cake } from "lucide-react";
import { formatDate, todayStr, daysBetween } from "@/lib/utils";
import type { Contact } from "@/types";
import { useLanguage } from "@/contexts/language-context";

const TAG_COLORS: Record<string, string> = {
  client: "#00f5ff", investor: "#bf00ff", designer: "#ff0080",
  tech: "#39ff14", freelance: "#ffff00", important: "#ff6600", friend: "#00f5ff",
};

function ContactCard({ contact, onDelete, onAddNote, onUpdate }: {
  contact: Contact;
  onDelete: () => void;
  onAddNote: (content: string) => void;
  onUpdate: (updates: Partial<Contact>) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [noteText, setNoteText] = useState("");
  const { t } = useLanguage();
  const today = todayStr();
  const daysSince = daysBetween(contact.lastContactDate, today);
  const overdueReminder = daysSince >= contact.reminderDays;

  // Birthday logic
  let birthdayInfo: { daysUntil: number; isToday: boolean } | null = null;
  if (contact.birthday) {
    const [, bMonth, bDay] = contact.birthday.split("-").map(Number);
    const thisYear = today.slice(0, 4);
    const thisYearBday = `${thisYear}-${String(bMonth).padStart(2, "0")}-${String(bDay).padStart(2, "0")}`;
    const nextYearBday = `${Number(thisYear) + 1}-${String(bMonth).padStart(2, "0")}-${String(bDay).padStart(2, "0")}`;
    const bdate = thisYearBday >= today ? thisYearBday : nextYearBday;
    const daysUntil = Math.round((new Date(bdate).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24));
    birthdayInfo = { daysUntil, isToday: daysUntil === 0 };
  }

  return (
    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="glass-card p-4"
      style={{ borderColor: overdueReminder ? "rgba(255,0,128,0.3)" : "rgba(255,255,255,0.06)" }}>
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
          style={{ background: "rgba(0,245,255,0.08)", border: "1px solid rgba(0,245,255,0.15)" }}>
          {contact.avatar}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-gray-200">{contact.name}</p>
              <p className="text-xs text-gray-500">{contact.company}</p>
            </div>
            <div className="flex items-center gap-1.5">
              {overdueReminder && (
                <span title="Follow up needed!" className="flex items-center gap-1 text-xs px-1.5 py-0.5 rounded"
                  style={{ background: "rgba(255,0,128,0.12)", color: "#ff0080" }}>
                  <AlertCircle size={10} /> {t("follow_up")}
                </span>
              )}
              <button onClick={() => setExpanded(!expanded)} className="p-0.5 text-gray-600 hover:text-gray-400">
                <ChevronDown size={14} className={`transition-transform ${expanded ? "rotate-180" : ""}`} />
              </button>
              <button onClick={onDelete} className="p-0.5 text-gray-600 hover:text-red-400 transition-colors">
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-2">
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <Clock size={10} /> {daysSince === 0 ? t("today_label") : t("days_ago", { n: daysSince })}
            </span>
            {contact.tags.map((tag) => (
              <span key={tag} className="text-xs px-1.5 py-0.5 rounded"
                style={{ background: (TAG_COLORS[tag] || "#6b8096") + "15", color: TAG_COLORS[tag] || "#6b8096" }}>
                {tag}
              </span>
            ))}
          </div>

          {/* Birthday badge */}
          {birthdayInfo && (
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="flex items-center gap-1 text-xs px-1.5 py-0.5 rounded"
                style={{
                  background: birthdayInfo.isToday ? "rgba(255,149,0,0.2)" : birthdayInfo.daysUntil <= 7 ? "rgba(255,149,0,0.12)" : "rgba(100,116,139,0.1)",
                  color: birthdayInfo.isToday ? "#ff9500" : birthdayInfo.daysUntil <= 7 ? "#ffa040" : "#94a3b8",
                  border: `1px solid ${birthdayInfo.isToday ? "rgba(255,149,0,0.4)" : "rgba(255,149,0,0.2)"}`,
                }}>
                <Cake size={10} />
                {birthdayInfo.isToday
                  ? t("birthday_today", { name: "" }).replace(contact.name, "").trim() || "🎉 Happy Birthday!"
                  : t("birthday_in_days", { name: "", days: birthdayInfo.daysUntil }).replace("'s", "").trim() || `in ${birthdayInfo.daysUntil}d`}
              </span>
            </div>
          )}

          {/* Follow-up badge */}
          {contact.nextFollowup && (
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="flex items-center gap-1 text-xs px-1.5 py-0.5 rounded"
                style={{
                  background: contact.nextFollowup <= today ? "rgba(255,0,128,0.15)" : "rgba(255,102,0,0.1)",
                  color: contact.nextFollowup <= today ? "#ff0080" : "#ff6600",
                  border: `1px solid ${contact.nextFollowup <= today ? "rgba(255,0,128,0.3)" : "rgba(255,102,0,0.2)"}`,
                }}>
                📞 Follow-up: {contact.nextFollowup <= today ? "Overdue!" : contact.nextFollowup}
              </span>
            </div>
          )}

          <AnimatePresence>
            {expanded && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden">
                <div className="mt-3 pt-3 border-t border-white/5 space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {contact.email && <a href={"mailto:" + contact.email} className="text-gray-400 hover:text-cyan-400 truncate">{contact.email}</a>}
                    {contact.phone && <span className="text-gray-400">{contact.phone}</span>}
                  </div>

                  {contact.notes.length > 0 && (
                    <div className="space-y-1.5">
                      {contact.notes.slice(-3).map((note) => (
                        <div key={note.id} className="text-xs text-gray-400 p-2 rounded"
                          style={{ background: "rgba(255,255,255,0.04)" }}>
                          <p>{note.content}</p>
                          <p className="text-gray-600 mt-1">{formatDate(note.createdAt)}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <input value={noteText} onChange={(e) => setNoteText(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && noteText.trim()) { onAddNote(noteText); setNoteText(""); } }}
                      placeholder={t("add_note_placeholder")}
                      className="flex-1 px-2 py-1.5 rounded text-xs bg-black/30 border border-white/8 text-gray-200 focus:outline-none" />
                    <button onClick={() => { if (noteText.trim()) { onAddNote(noteText); setNoteText(""); } }}
                      className="px-2 py-1.5 rounded text-xs" style={{ background: "rgba(0,245,255,0.1)", color: "#00f5ff" }}>
                      <MessageSquare size={12} />
                    </button>
                  </div>

                  <button onClick={() => onUpdate({ lastContactDate: today })}
                    className="text-xs px-2 py-1 rounded transition-all"
                    style={{ background: "rgba(57,255,20,0.08)", color: "#39ff14", border: "1px solid rgba(57,255,20,0.2)" }}>
                    {t("mark_contacted")}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

export default function CRMPage() {
  const { contacts, addContact, updateContact, deleteContact, addContactNote } = useApp();
  const { t } = useLanguage();
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    name: "", email: "", phone: "", company: "", avatar: "👤",
    birthday: "", nextFollowup: "", lastContactDate: todayStr(), reminderDays: 14, tags: [] as string[],
  });
  const [tagInput, setTagInput] = useState("");

  const AVATAR_OPTIONS = ["👤", "👨‍💼", "👩‍💼", "🧑‍💻", "👩‍🎨", "👨‍🔬", "��‍🚀", "🧑‍🎓"];

  const handleAdd = () => {
    if (!form.name.trim()) return;
    addContact(form);
    setForm({ name: "", email: "", phone: "", company: "", avatar: "👤", birthday: "", nextFollowup: "", lastContactDate: todayStr(), reminderDays: 14, tags: [] });
    setShowForm(false);
  };

  const filtered = contacts.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.company.toLowerCase().includes(search.toLowerCase()) ||
    c.tags.some((tg) => tg.toLowerCase().includes(search.toLowerCase()))
  );

  const needFollowUp = contacts.filter((c) => daysBetween(c.lastContactDate, todayStr()) >= c.reminderDays);

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="grid grid-cols-2 gap-3">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-3">
          <p className="text-xs text-gray-500">{t("total_contacts")}</p>
          <p className="text-xl font-bold mt-0.5" style={{ color: "#00f5ff" }}>{contacts.length}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }} className="glass-card p-3">
          <p className="text-xs text-gray-500">{t("need_followup")}</p>
          <p className="text-xl font-bold mt-0.5" style={{ color: needFollowUp.length > 0 ? "#ff0080" : "#39ff14" }}>{needFollowUp.length}</p>
        </motion.div>
      </div>

      <div className="flex gap-3">
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder={t("search_contacts")}
          className="flex-1 px-3 py-2 rounded-lg text-sm bg-black/40 border border-white/8 text-gray-200 focus:outline-none" />
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium shrink-0"
          style={{ background: "rgba(0,245,255,0.1)", border: "1px solid rgba(0,245,255,0.3)", color: "#00f5ff" }}>
          <Plus size={16} /> {t("add_contact")}
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="glass-card p-4 space-y-3">
            <h3 className="text-sm font-semibold" style={{ color: "#00f5ff" }}>{t("new_contact")}</h3>
            <div className="flex gap-2 flex-wrap mb-1">
              {AVATAR_OPTIONS.map((a) => (
                <button key={a} onClick={() => setForm({ ...form, avatar: a })}
                  className="text-xl p-1.5 rounded-lg"
                  style={{ background: form.avatar === a ? "rgba(0,245,255,0.15)" : "rgba(255,255,255,0.05)" }}>
                  {a}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder={t("full_name")} className="px-3 py-2 rounded-lg text-sm" />
              <input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })}
                placeholder={t("company")} className="px-3 py-2 rounded-lg text-sm" />
              <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder={t("email")} className="px-3 py-2 rounded-lg text-sm" />
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder={t("phone")} className="px-3 py-2 rounded-lg text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">{t("last_contact")}</label>
                <input type="date" value={form.lastContactDate} onChange={(e) => setForm({ ...form, lastContactDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">{t("reminder_days")}</label>
                <input type="number" value={form.reminderDays} onChange={(e) => setForm({ ...form, reminderDays: parseInt(e.target.value) || 14 })}
                  className="w-full px-3 py-2 rounded-lg text-sm" min="1" max="365" />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Cake size={11} /> {t("birthday")}</label>
              <input type="date" value={form.birthday} onChange={(e) => setForm({ ...form, birthday: e.target.value })}
                className="w-full px-3 py-2 rounded-lg text-sm" placeholder={t("birthday_placeholder")} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 flex items-center gap-1">📞 Next Follow-up Date</label>
              <input type="date" value={form.nextFollowup} onChange={(e) => setForm({ ...form, nextFollowup: e.target.value })}
                className="w-full px-3 py-2 rounded-lg text-sm" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">{t("tags")}</label>
              <div className="flex gap-2">
                <input value={tagInput} onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && tagInput.trim()) { setForm({ ...form, tags: [...form.tags, tagInput.trim()] }); setTagInput(""); } }}
                  placeholder={t("add_tag_hint")} className="flex-1 px-3 py-2 rounded-lg text-sm" />
              </div>
              <div className="flex gap-1.5 mt-2 flex-wrap">
                {form.tags.map((tg) => (
                  <span key={tg} className="text-xs px-2 py-0.5 rounded flex items-center gap-1"
                    style={{ background: "rgba(0,245,255,0.1)", color: "#00f5ff" }}>
                    {tg}
                    <button onClick={() => setForm({ ...form, tags: form.tags.filter((x) => x !== tg) })} className="text-gray-500 hover:text-red-400">×</button>
                  </span>
                ))}
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowForm(false)} className="px-3 py-1.5 text-sm text-gray-400">{t("cancel")}</button>
              <button onClick={handleAdd} className="px-4 py-1.5 text-sm rounded-lg font-medium"
                style={{ background: "rgba(0,245,255,0.15)", border: "1px solid rgba(0,245,255,0.4)", color: "#00f5ff" }}>
                {t("add_contact_btn")}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-3">
        <AnimatePresence>
          {filtered.length === 0 ? (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-gray-500 text-center py-10">
              {search ? t("no_contacts_search") : t("no_contacts")}
            </motion.p>
          ) : (
            filtered.map((contact) => (
              <ContactCard
                key={contact.id}
                contact={contact}
                onDelete={() => deleteContact(contact.id)}
                onAddNote={(content) => addContactNote(contact.id, content)}
                onUpdate={(updates) => updateContact(contact.id, updates)}
              />
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
