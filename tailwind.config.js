/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}',
  ],
  safelist: [
    'hover:border-accent',
    'hover:shadow-soft-lg',
    'hover:-translate-y-1',
    'group-hover:text-accent',
  ],
  theme: {
    extend: {
      colors: {
        'accent': 'var(--accent-color)',
      },
    },
    fontFamily: {
      sans: ['sans-serif'],
      mono: ['monospace'],
    },
    boxShadow: {
      'soft': '0 1px 3px 0 rgb(0 0 0 / 0.07), 0 1px 2px -1px rgb(0 0 0 / 0.07)',
      'soft-md': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      'soft-lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
      'soft-xl': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
      'soft-2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
      'soft-inner': 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
    },
  },
}
