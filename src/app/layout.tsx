import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppProvider } from "@/contexts/app-context";
import { LanguageProvider } from "@/contexts/language-context";
import { ThemeProvider } from "@/contexts/theme-context";
import { AuthGate } from "@/components/auth/auth-gate";

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
            <ThemeProvider>
              <AuthGate>
                {children}
              </AuthGate>
            </ThemeProvider>
          </LanguageProvider>
        </AppProvider>
      </body>
    </html>
  );
}
