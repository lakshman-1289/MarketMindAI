/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: "#020617", // Deep Slate Blue
          slate: "#0f172a",
          teal: "#14b8a6", // Emerald/Teal
          "teal-hover": "#0d9488",
          accent: "#38bdf8", // Sky Blue
        }
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}
