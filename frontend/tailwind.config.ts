import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        olive: {
          50: "#f4f6f0",
          100: "#e4ead9",
          200: "#c9d5b5",
          300: "#a8bc8a",
          400: "#8aa366",
          500: "#6b8449",
          600: "#536938",
          700: "#41522e",
          800: "#364328",
          900: "#2e3923",
          950: "#171e11",
        },
        cream: {
          50: "#fdfbf7",
          100: "#f9f4eb",
          200: "#f2e8d5",
          300: "#e8d5b5",
          400: "#d9bc8c",
          500: "#c9a56e",
          600: "#b88a52",
          700: "#996f43",
          800: "#7c5a3b",
          900: "#664a33",
          950: "#372618",
        },
        brown: {
          50: "#f8f5f2",
          100: "#ede6df",
          200: "#dbccc0",
          300: "#c4ab99",
          400: "#ab8972",
          500: "#9a735c",
          600: "#8c6150",
          700: "#754f44",
          800: "#61423c",
          900: "#503833",
          950: "#2c1d1a",
        },
      },
      animation: {
        "fade-up": "fadeUp 0.6s ease-out forwards",
        "fade-in": "fadeIn 0.5s ease-out forwards",
        "scale-in": "scaleIn 0.4s ease-out forwards",
        "slide-right": "slideRight 0.5s ease-out forwards",
        float: "float 6s ease-in-out infinite",
        "pulse-soft": "pulseSoft 3s ease-in-out infinite",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        slideRight: {
          "0%": { opacity: "0", transform: "translateX(-16px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-12px)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
