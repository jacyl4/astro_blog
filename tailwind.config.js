/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Geist Sans"', 'sans-serif'],
        mono: ['"GeistMono Nerd Font"', 'monospace'],
      },
    },
  },
  plugins: [],
}
