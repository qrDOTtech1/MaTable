/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: "#d0451b", dark: "#a8370f", light: "#fff2eb" },
      },
    },
  },
  plugins: [],
};
