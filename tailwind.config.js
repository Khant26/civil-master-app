/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    // the admin dashboard has its own config (tailwind.admin.config.js)
    "!./src/admin/**",
  ],
  theme: {
    screens: {
      xs: "360px",
      sm: "390px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
      "3xl": "1920px",
    },
    container: {
      center: true,
      padding: { DEFAULT: "1rem", lg: "2rem" },
      screens: { "2xl": "1370px" }, // cap content width (pick your design width)
    },
    extend: {
      colors: {
        cyan: {
          400: "#22d3ee",
          300: "#67e8f9",
        },
        gray: {
          800: "#1f2937",
          900: "#111827",
        },
      },
      fontFamily: {
        sans: [
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        oswald: ["Oswald", "sans-serif"],
        poppins: ["Poppins", "sans-serif"],
      },
    },
  },
  plugins: [],
};
