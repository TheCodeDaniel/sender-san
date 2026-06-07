/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#F4F4F5',
        surface: '#FFFFFF',
        border: '#E4E4E7',
        primary: '#18181B',
        secondary: '#71717A',
        'text-primary': '#18181B',
        'text-muted': '#71717A',
      },
      fontFamily: {
        sans: ['Geist', 'Inter', 'system-ui', 'sans-serif'],
        jp: ['"Noto Serif JP"', 'serif'],
      },
      borderRadius: {
        card: '8px',
      },
    },
  },
  plugins: [],
}
