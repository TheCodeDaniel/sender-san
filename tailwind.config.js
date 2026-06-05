/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0D0D0D',
        surface: '#161616',
        border: '#2A2A2A',
        primary: '#C0392B',
        secondary: '#C9A84C',
        'text-primary': '#F0F0F0',
        'text-muted': '#888888',
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
