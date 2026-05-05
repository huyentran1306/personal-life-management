"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const AUTH_USER_KEY = "plm-auth-user";
const UID_KEY = "plm-uid";
const API_BASE = "https://d1-template.trann46698.workers.dev/api";

function AuthCallbackInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const uid = searchParams.get("uid");
    const error = searchParams.get("error");

    if (error) {
      setErrorMsg(decodeURIComponent(error));
      setStatus("error");
      return;
    }
    if (!uid) {
      setErrorMsg("No user ID received");
      setStatus("error");
      return;
    }

    fetch(`${API_BASE}/users/${uid}`)
      .then((r) => r.json())
      .then((res: { success: boolean; data: Record<string, unknown> }) => {
        if (!res.success) throw new Error("Failed to fetch user");
        const user = res.data;
        const authUser = {
          id: user.id, username: user.username,
          display_name: (user.display_name || user.username) as string,
          email: (user.email as string) || null,
          xp: (user.xp as number) || 0, level: (user.level as number) || 1,
          streak: (user.streak as number) || 0, coins: (user.coins as number) || 0,
          language: (user.language as string) || "vi",
          app_mode: (user.app_mode as string) || "adult",
        };
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(authUser));
        localStorage.setItem(UID_KEY, uid);
        router.replace("/");
      })
      .catch((e: Error) => {
        setErrorMsg(e.message || "Failed to authenticate");
        setStatus("error");
      });
  }, [searchParams, router]);

  if (status === "error") {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#080b14]">
        <div className="text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <p className="text-red-400 font-mono mb-4">Login failed: {errorMsg}</p>
          <button onClick={() => router.replace("/")} className="px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded font-mono border border-cyan-500/30 hover:bg-cyan-500/30">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#080b14]">
      <div className="text-center">
        <div className="text-4xl mb-4">⚡</div>
        <p className="text-cyan-400 font-mono animate-pulse">Authenticating with Google...</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="fixed inset-0 flex items-center justify-center bg-[#080b14]">
        <p className="text-cyan-400 font-mono animate-pulse">Loading...</p>
      </div>
    }>
      <AuthCallbackInner />
    </Suspense>
  );
}
