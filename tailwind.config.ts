import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#1B4332',
        clay: '#D9480F',
        background: '#F7F9FF',
        surface: '#FFFFFF',
        'text-main': '#181C20',
        border: '#E9ECEF',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config
