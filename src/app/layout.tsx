import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppProvider } from "@/contexts/app-context";
import { LanguageProvider } from "@/contexts/language-context";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export const metadata: Metadata = {
  title: "Life OS — Personal Life Manager",
  description: "A dark cyberpunk personal life management app. Manage tasks, habits, mood, expenses, and more.",
  manifest: "/manifest.json",
  icons: { icon: "/icon.png" },
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Life OS" },
};

export const viewport: Viewport = {
  themeColor: "#00f5ff",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppProvider>
          <LanguageProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0">
              <Header />
              <main className="flex-1 p-4 md:p-6">
                {children}
              </main>
            </div>
          </div>
          </LanguageProvider>
        </AppProvider>
      </body>
    </html>
  );
}
