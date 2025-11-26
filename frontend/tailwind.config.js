
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      screens: {
        '1440': '1440px',
        '1600': '1600px',
        '1920': '1920px',
      },
    },
  },
  plugins: [],
}
