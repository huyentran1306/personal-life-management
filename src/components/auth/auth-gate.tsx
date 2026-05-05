"use client";

import { useApp } from "@/contexts/app-context";
import { LoginModal } from "@/components/auth/login-modal";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, login, register } = useApp();

  if (!isAuthenticated) {
    return (
      <LoginModal
        onLogin={login}
        onRegister={register}
      />
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
