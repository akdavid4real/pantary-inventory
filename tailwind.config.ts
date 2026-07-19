import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        evergreen: "#12372A",
        sage: "#A2C9A8",
        cream: "#FBF7EF",
        charcoal: "#1F2421",
        coral: "#FF6B57",
        turmeric: "#F2B441",
      },
      fontFamily: {
        serif: ['"Playfair Display"', "Georgia", "serif"],
        sans: ['"Inter"', "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 28px 80px rgba(18, 55, 42, 0.14)",
        insetLine: "inset 0 0 0 1px rgba(18, 55, 42, 0.12)",
      },
    },
  },
  plugins: [],
} satisfies Config;
