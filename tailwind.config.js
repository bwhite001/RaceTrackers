/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f6ff',
          100: '#e0eaff',
          200: '#c7d7fe',
          300: '#a4bcfd',
          400: '#8198fb',
          500: '#6371f7',
          600: '#4f4cec',
          700: '#3d3dd1',
          800: '#3234a8',
          900: '#2d3284',
          950: '#1c1e4b',
        },
        navy: {
          50: '#f4f6fb',
          100: '#e8ecf6',
          200: '#cbd7eb',
          300: '#9fb5da',
          400: '#6c8ec5',
          500: '#4a6faf',
          600: '#385793',
          700: '#2e4677',
          800: '#293c64',
          900: '#263454',
          950: '#1a2236',
        },
        'accent-red': {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
          950: '#450a0a',
        },
        'accent-gold': {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          950: '#451a03',
        }
      },
      animation: {
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
        'progress': 'progress 0.4s ease-in-out',
      },
      keyframes: {
        ping: {
          '75%, 100%': {
            transform: 'scale(2)',
            opacity: '0',
          },
        },
        progress: {
          '0%': {
            width: '0%',
          },
          '100%': {
            width: '100%',
          },
        },
      },
    },
  },
  plugins: [],
}
