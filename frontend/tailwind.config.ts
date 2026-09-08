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
        background: "#0B0F17",
        foreground: "#f8fafc",
        command: {
          bg: "#0B0F17",
          surface: "rgba(255, 255, 255, 0.04)",
          surfaceHover: "rgba(255, 255, 255, 0.07)",
          card: "#101623",
          border: "rgba(255, 255, 255, 0.08)",
          borderHover: "rgba(255, 255, 255, 0.16)",
          cyan: "#00F0FF",
          amber: "#F59E0B",
          green: "#10B981",
          crimson: "#EF4444",
          muted: "#94A3B8",
        },
        tactical: {
          bg: "#0a0f1d",
          border: "#00f0ff",
          risk: "#ff0055",
          amber: "#ffaa00",
          green: "#00ffaa",
          panel: "#0E1422",
          card: "#121A2B",
          cyan: "#00f0ff",
          crimson: "#ff0055",
          purple: "#A855F7",
          muted: "#94A3B8",
        },
      },
      fontFamily: {
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "Liberation Mono", "Courier New", "monospace"],
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "Helvetica Neue", "sans-serif"],
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
