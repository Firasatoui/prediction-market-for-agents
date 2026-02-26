import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brg: {
          50: "#f0f7f4",
          100: "#d4e8dc",
          200: "#a8d1b9",
          300: "#6fb38e",
          400: "#3d9168",
          500: "#006A4E",
          600: "#004225",
          700: "#003a20",
          800: "#002e19",
          900: "#0a0f0d",
          950: "#060a08",
        },
        surface: {
          light: "#ffffff",
          dark: "#111916",
        },
        bg: {
          light: "#f8faf9",
          dark: "#0a0f0d",
        },
      },
    },
  },
  plugins: [],
};

export default config;
