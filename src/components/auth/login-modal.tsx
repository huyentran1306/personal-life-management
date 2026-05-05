"use client";

import { useState } from "react";

interface LoginModalProps {
  onLogin: (username: string, password: string) => Promise<void>;
  onRegister: (username: string, password: string, displayName?: string) => Promise<void>;
}

export function LoginModal({ onLogin, onRegister }: LoginModalProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (mode === "register" && password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      if (mode === "login") {
        await onLogin(username.trim(), password);
      } else {
        await onRegister(username.trim(), password, displayName.trim() || username.trim());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const GOOGLE_OAUTH_URL = "https://d1-template.trann46698.workers.dev/api/auth/google";

  const handleGoogleLogin = () => {
    window.location.href = GOOGLE_OAUTH_URL;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      {/* Cyberpunk grid background */}
      <div className="absolute inset-0 opacity-10 pointer-events-none"
        style={{ backgroundImage: "linear-gradient(rgba(0,245,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(0,245,255,0.15) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />

      <div className="relative w-full max-w-sm mx-4">
        {/* Glow border */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-lg opacity-75 blur-sm" />
        <div className="relative bg-[#080b14] rounded-lg p-8 border border-cyan-500/30">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="text-4xl mb-2">⚡</div>
            <h1 className="text-2xl font-bold text-cyan-400 font-mono tracking-wider">LIFE OS</h1>
            <p className="text-sm text-cyan-300/60 mt-1">
              {mode === "login" ? "Access your data from anywhere" : "Create your account"}
            </p>
          </div>

          {/* Tab Switch */}
          <div className="flex mb-6 rounded-md overflow-hidden border border-cyan-500/30">
            <button
              type="button"
              onClick={() => { setMode("login"); setError(""); }}
              className={`flex-1 py-2 text-sm font-mono transition-all ${mode === "login" ? "bg-cyan-500/20 text-cyan-400" : "text-cyan-500/50 hover:text-cyan-400 hover:bg-cyan-500/10"}`}
            >
              LOGIN
            </button>
            <button
              type="button"
              onClick={() => { setMode("register"); setError(""); }}
              className={`flex-1 py-2 text-sm font-mono transition-all ${mode === "register" ? "bg-purple-500/20 text-purple-400" : "text-purple-500/50 hover:text-purple-400 hover:bg-purple-500/10"}`}
            >
              REGISTER
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div>
                <label className="block text-xs text-cyan-400/70 font-mono mb-1 uppercase tracking-wider">Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  className="w-full bg-[#111827] border border-cyan-500/30 rounded px-3 py-2 text-cyan-100 text-sm placeholder-cyan-500/30 focus:outline-none focus:border-cyan-400 transition-colors"
                />
              </div>
            )}

            <div>
              <label className="block text-xs text-cyan-400/70 font-mono mb-1 uppercase tracking-wider">Username</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="username"
                required
                autoComplete="username"
                className="w-full bg-[#111827] border border-cyan-500/30 rounded px-3 py-2 text-cyan-100 text-sm placeholder-cyan-500/30 focus:outline-none focus:border-cyan-400 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs text-cyan-400/70 font-mono mb-1 uppercase tracking-wider">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••"
                required
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                className="w-full bg-[#111827] border border-cyan-500/30 rounded px-3 py-2 text-cyan-100 text-sm placeholder-cyan-500/30 focus:outline-none focus:border-cyan-400 transition-colors"
              />
            </div>

            {mode === "register" && (
              <div>
                <label className="block text-xs text-cyan-400/70 font-mono mb-1 uppercase tracking-wider">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••"
                  required
                  autoComplete="new-password"
                  className="w-full bg-[#111827] border border-cyan-500/30 rounded px-3 py-2 text-cyan-100 text-sm placeholder-cyan-500/30 focus:outline-none focus:border-cyan-400 transition-colors"
                />
              </div>
            )}

            {error && (
              <p className="text-red-400 text-xs font-mono bg-red-500/10 border border-red-500/30 rounded px-3 py-2">
                ⚠ {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-black font-bold text-sm rounded font-mono tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "..." : mode === "login" ? "LOGIN →" : "CREATE ACCOUNT →"}
            </button>
          </form>

          <p className="text-center text-xs text-cyan-500/40 mt-4 font-mono">
            Your data syncs across all devices
          </p>

          {/* Divider */}
          <div className="flex items-center gap-3 mt-4">
            <div className="flex-1 h-px bg-cyan-500/20" />
            <span className="text-xs text-cyan-500/40 font-mono">OR</span>
            <div className="flex-1 h-px bg-cyan-500/20" />
          </div>

          {/* Google Login */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full mt-3 py-2.5 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-gray-200 text-sm rounded font-mono transition-all"
          >
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>
        </div>
      </div>
    </div>
  );
}
