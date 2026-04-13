/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Manrope', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#effbfb',
          100: '#d8f3f5',
          200: '#b5e7eb',
          300: '#83d3dd',
          400: '#4cb8c8',
          500: '#259aad',
          600: '#1d7b8e',
          700: '#1d6373',
          800: '#1d525f',
          900: '#1d4651',
        },
      },
      boxShadow: {
        soft: '0 15px 35px -18px rgba(14, 38, 56, 0.35)',
      },
    },
  },
  plugins: [],
};
