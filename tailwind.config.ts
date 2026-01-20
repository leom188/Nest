import type { Config } from 'tailwindcss'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@daveyplate/better-auth-ui/dist/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'otter-blue': '#6C5CE7',
        'otter-fresh': '#74B9FF',
        'otter-coral': '#FAB1A0',
        'otter-lavender': '#A29BFE',
        'otter-pink': '#FF7675',
        'otter-gold': '#FDCB6E',
        'otter-mint': '#55EFC4',
        'otter-white': '#F7F9FC',
      },
      boxShadow: {
        'soft': '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
      },
      borderRadius: {
        'otter': '20px',
      },
      fontFamily: {
        quicksand: ['Quicksand', 'sans-serif'],
        nunito: ['Nunito', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config
