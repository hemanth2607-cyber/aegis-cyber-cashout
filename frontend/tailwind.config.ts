import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0a0f1d",
        foreground: "#f8fafc",
        tactical: {
          bg: "#0a0f1d",
          panel: "#0e1526",
          card: "#121b33",
          border: "#1e2c4f",
          cyan: "#00f0ff",
          crimson: "#ff0055",
          amber: "#ffaa00",
          green: "#00ffaa",
          purple: "#9d4edd",
          muted: "#64748b",
        },
      },
      fontFamily: {
        mono: ["Consolas", "Monaco", "Courier New", "monospace"],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "radar-ping": "radarPing 2s cubic-bezier(0, 0, 0.2, 1) infinite",
        "glow-pulse": "glowPulse 2s ease-in-out infinite alternate",
        "scanline": "scanline 8s linear infinite",
      },
      keyframes: {
        radarPing: {
          "0%": { transform: "scale(0.8)", opacity: "1" },
          "70%": { transform: "scale(2.5)", opacity: "0" },
          "100%": { transform: "scale(2.8)", opacity: "0" },
        },
        glowPulse: {
          "0%": { boxShadow: "0 0 5px rgba(0, 240, 255, 0.2)" },
          "100%": { boxShadow: "0 0 20px rgba(0, 240, 255, 0.7), 0 0 30px rgba(0, 240, 255, 0.4)" },
        },
        scanline: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(1000%)" },
        }
      },
      boxShadow: {
        "tactical-cyan": "0 0 15px rgba(0, 240, 255, 0.35)",
        "tactical-crimson": "0 0 15px rgba(255, 0, 85, 0.45)",
        "tactical-amber": "0 0 15px rgba(255, 170, 0, 0.35)",
        "tactical-green": "0 0 15px rgba(0, 255, 170, 0.35)",
      },
    },
  },
  plugins: [],
};
export default config;
