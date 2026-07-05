/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef7f4',
          100: '#d6ece4',
          200: '#aedac9',
          300: '#7cc0a9',
          400: '#4aa285',
          500: '#2b866a',
          600: '#1f6b54',
          700: '#1b5544',
          800: '#184538',
          900: '#153a30',
        },
        ink: {
          DEFAULT: '#0f1a17',
          soft: '#3d4b46',
          faint: '#6b7a74',
        },
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,26,23,0.04), 0 8px 24px -12px rgba(16,26,23,0.18)',
        lift: '0 12px 40px -16px rgba(16,26,23,0.35)',
      },
      keyframes: {
        'fade-in': { '0%': { opacity: '0', transform: 'translateY(6px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        'slide-up': { '0%': { opacity: '0', transform: 'translateY(16px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
      },
      animation: {
        'fade-in': 'fade-in 0.35s ease-out both',
        'slide-up': 'slide-up 0.4s cubic-bezier(0.16,1,0.3,1) both',
      },
    },
  },
  plugins: [],
}
