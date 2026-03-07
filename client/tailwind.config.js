/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          amber:   '#E8A020',
          'amber-dim': '#B87A10',
          red:     '#C93030',
          black:   '#080808',
          slate:   '#1A1A1A',
          mid:     '#2E2E2E',
          cream:   '#F4F0E8',
          muted:   '#888888',
        },
      },
      fontFamily: {
        display: ['"Bebas Neue"', 'cursive'],
        body:    ['"DM Sans"', 'sans-serif'],
        mono:    ['"Space Mono"', 'monospace'],
      },
      animation: {
        'fade-up':      'fadeUp 0.7s ease forwards',
        'marquee':      'marquee 25s linear infinite',
        'pulse-ring':   'pulseRing 2s ease-in-out infinite',
        'grid-drift':   'gridDrift 20s linear infinite',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(30px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        marquee: {
          '0%':   { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        pulseRing: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(232,160,32,0.4)' },
          '50%':      { boxShadow: '0 0 0 8px rgba(232,160,32,0)' },
        },
        gridDrift: {
          '0%':   { backgroundPosition: '0 0' },
          '100%': { backgroundPosition: '80px 80px' },
        },
      },
    },
  },
  plugins: [],
}