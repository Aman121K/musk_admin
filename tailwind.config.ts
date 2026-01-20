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
        primary: {
          50: "#f5eef3",
          100: "#eadce7",
          200: "#d5b9cf",
          300: "#c096b7",
          400: "#ab739f",
          500: "#965087",
          600: "#5e2751",
          700: "#4a1f40",
          800: "#36172f",
          900: "#230f1e",
        },
      },
    },
  },
  plugins: [],
};
export default config;

