/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'background': 'var(--background-color)',
        'card': 'var(--card-bg)',
        'main-content': 'var(--main-content-bg)',
        'footer': 'var(--footer-bg)',
        'text-primary': 'var(--text-color)',
        'link': 'var(--link-color)',
      },
      fontFamily: {
        sans: ['"Geist Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
