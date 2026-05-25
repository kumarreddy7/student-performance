/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          main: '#3b82f6', // modern blue
          light: '#60a5fa',
          dark: '#2563eb',
        },
        secondary: {
          main: '#8b5cf6', // modern purple
          light: '#a78bfa',
          dark: '#7c3aed',
        },
        background: {
          default: '#f8fafc',
          paper: '#ffffff',
        }
      }
    },
  },
  plugins: [],
}
