
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        blue: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#8c9da4', // lighter variant
          600: '#7b8c93', // requested color
          700: '#63737a', // darker variant
          800: '#1e293b',
          900: '#0f172a',
        },
        primary: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#8c9da4',
          600: '#7b8c93', // Main Brand Color
          700: '#63737a',
          800: '#1e293b',
          900: '#0f172a',
          DEFAULT: '#7b8c93',
        },
        secondary: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          DEFAULT: '#64748b',
        },
        surface: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          white: '#ffffff',
          ground: '#f8fafc', // Page background
          card: '#ffffff',   // Card background
        }
      },
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
