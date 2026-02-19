/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        surface: {
          DEFAULT: '#FAFAF8',
          warm: '#F5F3EF',
          card: '#FFFFFF',
        },
        charcoal: {
          DEFAULT: '#2D2D2D',
          light: '#4A4A4A',
        },
        bronze: {
          DEFAULT: '#C4956A',
          light: '#D4AD8A',
          dark: '#A67B52',
        },
        forest: {
          DEFAULT: '#3B7A57',
          light: '#4A9A6E',
        },
      },
      boxShadow: {
        'warm-sm': '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)',
        'warm': '0 2px 8px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)',
        'warm-lg': '0 4px 16px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04)',
        'cart': '0 -4px 20px rgba(0,0,0,0.1)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        fillLine: {
          '0%': { height: '0%' },
          '100%': { height: '100%' },
        },
      },
      animation: {
        slideUp: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        fadeIn: 'fadeIn 0.2s ease-out',
        scaleIn: 'scaleIn 0.2s ease-out',
        fillLine: 'fillLine 0.5s ease-out forwards',
      },
    },
  },
  plugins: [],
}
