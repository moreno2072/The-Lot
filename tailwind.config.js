/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // "Lot" — auction-house-inspired palette: ink, chalk, and a single
        // hammer-fall red used only for live/urgent states.
        ink: '#141216',
        chalk: '#F4F1EC',
        smoke: '#8A8690',
        hairline: '#2A262C',
        hammer: '#D6432E',
        gavel: '#C9A24B',
      },
      fontFamily: {
        display: ['"Fraunces"', 'ui-serif', 'Georgia', 'serif'],
        body: ['"Inter"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '6px',
      },
      keyframes: {
        pulseLive: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.55 },
        },
        bidFlash: {
          '0%': { backgroundColor: 'rgba(214,67,46,0.25)' },
          '100%': { backgroundColor: 'transparent' },
        },
      },
      animation: {
        pulseLive: 'pulseLive 1.4s ease-in-out infinite',
        bidFlash: 'bidFlash 0.6s ease-out',
      },
    },
  },
  plugins: [],
};
