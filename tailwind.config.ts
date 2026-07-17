import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        pl: {
          gold: "#d6b06a",
          "gold-hover": "#e4be78",
          "gold-soft": "#f4dfb4",
          "gold-ink": "#8b6914",
          "gold-deep": "#a67c32",
          navy: "#08111f",
          "navy-deep": "#06101d",
          shell: "#f5f3ee",
          "shell-elevated": "#faf7f3",
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', "Segoe UI", "system-ui", "sans-serif"],
        display: ['"Cormorant Garamond"', "Georgia", "serif"],
      },
      borderRadius: {
        card: "30px",
        panel: "22px",
        sheet: "28px",
      },
      boxShadow: {
        glass: "0 24px 80px rgba(0,0,0,0.34)",
        "glass-light": "0 20px 70px rgba(12,18,28,0.13)",
        cta: "0 18px 44px rgba(214,176,106,0.35)",
      },
    },
  },
  plugins: [],
} satisfies Config;
