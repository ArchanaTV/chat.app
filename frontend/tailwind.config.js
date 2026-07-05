/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#FFF4E6",
          100: "#FFE8CC",
          400: "#FFB347",
          500: "#FF9933",
          600: "#E6821A",
          700: "#CC6600",
        },
      },
      keyframes: {
        "fade-in": { "0%": { opacity: 0, transform: "translateY(4px)" }, "100%": { opacity: 1, transform: "translateY(0)" } },
        "pop-in": { "0%": { opacity: 0, transform: "scale(0.9)" }, "100%": { opacity: 1, transform: "scale(1)" } },
        "float-up": {
          "0%": { transform: "translateY(0) scale(0.6)", opacity: 0 },
          "15%": { opacity: 1, transform: "translateY(-10px) scale(1.1)" },
          "100%": { transform: "translateY(-160px) scale(1.4)", opacity: 0 },
        },
        "tortoise-walk": {
          "0%, 100%": { transform: "translateX(0)" },
          "50%": { transform: "translateX(10px)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.2s ease-out",
        "pop-in": "pop-in 0.15s ease-out",
        "float-up": "float-up 1.6s ease-out forwards",
        "tortoise-walk": "tortoise-walk 0.6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
