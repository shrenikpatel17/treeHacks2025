import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        'grad-light': '#F1F6F0',
        'grad-dark' : '#C1D1BE',
        'text-green': '#044723',
        'hover-dark-green':'#003318',
        'dark-green': '#547A51',
        'light-color': '#FEFFFC',
        'hover-light':'#f2f9f0',
      },
    },
  },
  plugins: [],
};
export default config;
