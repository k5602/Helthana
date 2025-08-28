/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./*.html",
        "*.{js,ts,jsx,tsx,mdx}"
    ],
  theme: {
    extend: {
      fontFamily: {
        'cairo': ['Cairo', 'sans-serif'],
      }
    },
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: ["light", "dark", "synthwave"],
  }
}
