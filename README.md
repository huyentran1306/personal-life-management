# Life OS — Personal Life Manager

A modern, dark cyberpunk-themed personal life management web app built with Next.js 15.

## Features

| Module | Description |
|--------|-------------|
| 🏠 **Dashboard** | Overview of tasks, habits, mood, expenses + smart insights + weekly charts |
| ✅ **Tasks** | CRUD, priority sorting, due dates, status management |
| 🔥 **Habits** | Daily habit tracking, streaks, 7-day history view |
| 📖 **Journal** | Daily writing with auto-generated summary |
| 😊 **Mood** | Emoji-based mood logging + weekly trend chart |
| 💸 **Expenses** | Add expenses with auto-categorization by keywords |
| 👥 **CRM** | Contact management with notes and follow-up reminders |

## Smart Insights (Rule-based)

- Tasks > 5 pending → "You're overloaded"
- Habit missed 2+ days → streak warning
- Stressed mood 3 days in a row → rest suggestion
- Expense spike vs previous week → spending alert
- All habits done today → celebration!

## Tech Stack

- **Next.js 15** (App Router)
- **React 18** + **TypeScript**
- **Tailwind CSS v4** (CSS-based config)
- **Framer Motion** — animations
- **Recharts** — charts
- **Lucide React** — icons
- `localStorage` — persistent data (no backend needed)

## Setup

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # production build
```

## Folder Structure

```
src/
├── app/
│   ├── page.tsx          # Dashboard
│   ├── tasks/page.tsx    # Task Manager
│   ├── habits/page.tsx   # Habit Tracker
│   ├── journal/page.tsx  # Daily Journal
│   ├── mood/page.tsx     # Mood Tracker
│   ├── expenses/page.tsx # Expense Tracker
│   └── crm/page.tsx      # Personal CRM
├── contexts/
│   └── app-context.tsx   # Global state (localStorage)
├── lib/
│   ├── utils.ts          # Helpers
│   ├── smart-insights.ts # Rule-based logic + expense categorization
│   └── mock-data.ts      # Sample data
└── types/
    └── index.ts          # TypeScript types
```

## Design

- Dark cyberpunk theme with neon glow accents (#00f5ff cyan, #bf00ff purple, #ff0080 pink)
- Glassmorphism cards with backdrop blur
- Grid background pattern
- Smooth Framer Motion animations
- Mobile-first responsive layout
