import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      animation: {
        blob: "blob 7s infinite",
        "fade-in-up": "fadeInUp 0.3s ease-out forwards",
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "var(--primary)",
          hover: "var(--primary-hover)",
          light: "var(--primary-light)",
          muted: "var(--primary-muted)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          hover: "var(--accent-hover)",
          light: "var(--accent-light)",
          muted: "var(--accent-muted)",
        },
        surface: {
          DEFAULT: "var(--surface)",
          raised: "var(--surface-raised)",
        },
      },
      borderRadius: {
        xl: "var(--radius-xl)",
        "2xl": "var(--radius-2xl)",
      },
      keyframes: {
        blob: {
          "0%": { transform: "translate(0px, 0px) scale(1)" },
          "33%": { transform: "translate(30px, -50px) scale(1.1)" },
          "66%": { transform: "translate(-20px, 20px) scale(0.9)" },
          "100%": { transform: "translate(0px, 0px) scale(1)" },
        },
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
