/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#a2d2ff',
        secondary: '#bde0fe',
        'bg-light': '#f5f7f8',
        'bg-dark': '#0f1923',
        'neutral-800': '#1a2430',
        'neutral-600': '#4a5a6a',
        'neutral-200': '#dce4ec',
        'neutral-100': '#edf2f7',
        'status-green': '#22c55e',
        'status-yellow': '#eab308',
        'status-purple': '#a855f7',
      },
      fontFamily: {
        display: ["'Noto Sans KR'", 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.5rem',
        md: '0.5rem',
        lg: '0.5rem',
        xl: '0.75rem',
        full: '9999px',
      },
      animation: {
        'spin-slow': 'spin 4s linear infinite',
        'bounce-slow': 'bounce 3s ease-in-out infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
