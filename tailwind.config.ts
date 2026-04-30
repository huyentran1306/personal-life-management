import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        cyber: ["'Share Tech Mono'", "monospace"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Cyberpunk neon palette
        neon: {
          cyan: "#00f5ff",
          purple: "#bf00ff",
          pink: "#ff0080",
          green: "#39ff14",
          yellow: "#ffff00",
          orange: "#ff6600",
        },
      },
      boxShadow: {
        "neon-cyan": "0 0 10px #00f5ff, 0 0 20px #00f5ff, 0 0 40px #00f5ff55",
        "neon-purple": "0 0 10px #bf00ff, 0 0 20px #bf00ff, 0 0 40px #bf00ff55",
        "neon-pink": "0 0 10px #ff0080, 0 0 20px #ff0080, 0 0 40px #ff008055",
        "neon-green": "0 0 10px #39ff14, 0 0 20px #39ff14, 0 0 40px #39ff1455",
        "glass": "0 8px 32px 0 rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)",
      },
      backgroundImage: {
        "gradient-cyber": "linear-gradient(135deg, #0d0d1a 0%, #1a0533 50%, #0d1a33 100%)",
        "gradient-neon-cyan": "linear-gradient(135deg, #00f5ff22, #bf00ff22)",
        "gradient-neon-purple": "linear-gradient(135deg, #bf00ff22, #ff008022)",
        "gradient-neon-pink": "linear-gradient(135deg, #ff008022, #ff660022)",
        "grid-pattern": "linear-gradient(rgba(0,245,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,245,255,0.05) 1px, transparent 1px)",
      },
      backgroundSize: {
        "grid": "30px 30px",
      },
      keyframes: {
        "pulse-neon": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        "slide-in": {
          from: { opacity: "0", transform: "translateX(-20px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 5px #00f5ff, 0 0 10px #00f5ff" },
          "50%": { boxShadow: "0 0 20px #00f5ff, 0 0 40px #00f5ff, 0 0 80px #00f5ff" },
        },
        "scan-line": {
          "0%": { top: "0%" },
          "100%": { top: "100%" },
        },
      },
      animation: {
        "pulse-neon": "pulse-neon 2s ease-in-out infinite",
        "slide-in": "slide-in 0.3s ease-out",
        "fade-up": "fade-up 0.4s ease-out",
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
        "scan-line": "scan-line 3s linear infinite",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
};

export default config;
