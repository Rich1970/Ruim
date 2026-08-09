/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Warme, kalme daglichtwereld
        sand: {
          50: '#faf7f2',
          100: '#f3ede2',
          200: '#e7dccb',
          300: '#d8c7ad',
          400: '#c4ac89',
          500: '#b0916b',
          600: '#8f745380',
        },
        clay: {
          400: '#c98a6a',
          500: '#b97250',
          600: '#9f5d3d',
        },
        moss: {
          400: '#8ba474',
          500: '#6f8a57',
          600: '#586f45',
        },
        ink: {
          DEFAULT: '#2c2a26',
          soft: '#5a5650',
          faint: '#8a847a',
        },
        // Nachtwereld — warm en laag
        night: {
          bg: '#0a0a0a',
          glow: '#3a2f26',
          text: '#8a7a68',
          soft: '#5f5346',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'system-ui', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        serif: ['Georgia', 'Cambria', 'Times New Roman', 'serif'],
      },
      keyframes: {
        'fade-in': { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        'fade-up': { '0%': { opacity: '0', transform: 'translateY(10px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        'breathe': {
          '0%,100%': { transform: 'scale(0.82)', opacity: '0.45' },
          '50%': { transform: 'scale(1.12)', opacity: '0.9' },
        },
        'pulse-soft': {
          '0%,100%': { transform: 'scale(0.94)', opacity: '0.6' },
          '50%': { transform: 'scale(1.06)', opacity: '0.95' },
        },
        'drift': {
          '0%,100%': { opacity: '0.5' },
          '50%': { opacity: '1' },
        },
      },
      animation: {
        'fade-in': 'fade-in 1.2s ease-out both',
        'fade-up': 'fade-up 0.7s cubic-bezier(0.16,1,0.3,1) both',
        'breathe': 'breathe var(--breathe-dur, 8s) ease-in-out infinite',
        'pulse-soft': 'pulse-soft 5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
