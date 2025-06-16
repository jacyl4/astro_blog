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
        mono: ['"Geist Mono"', 'monospace'],
      },
      typography: ({ theme }) => ({
        DEFAULT: {
          css: {
            '--tw-prose-body': theme('colors.text-primary'),
            '--tw-prose-headings': theme('colors.text-primary'),
            '--tw-prose-lead': theme('colors.text-primary'),
            '--tw-prose-links': theme('colors.link'),
            '--tw-prose-bold': theme('colors.text-primary'),
            '--tw-prose-counters': theme('colors.text-primary'),
            '--tw-prose-bullets': theme('colors.text-primary'),
            '--tw-prose-hr': theme('colors.text-primary'),
            '--tw-prose-quotes': theme('colors.text-primary'),
            '--tw-prose-quote-borders': theme('colors.text-primary'),
            '--tw-prose-captions': theme('colors.text-primary'),
            '--tw-prose-code': theme('colors.text-primary'),
            '--tw-prose-pre-code': theme('colors.text-primary'),
            '--tw-prose-pre-bg': theme('colors.card'),
            '--tw-prose-th-borders': theme('colors.text-primary'),
            '--tw-prose-td-borders': theme('colors.text-primary'),
            '--tw-prose-invert-body': theme('colors.text-primary'),
            '--tw-prose-invert-headings': theme('colors.text-primary'),
            '--tw-prose-invert-lead': theme('colors.text-primary'),
            '--tw-prose-invert-links': theme('colors.link'),
            '--tw-prose-invert-bold': theme('colors.text-primary'),
            '--tw-prose-invert-counters': theme('colors.text-primary'),
            '--tw-prose-invert-bullets': theme('colors.text-primary'),
            '--tw-prose-invert-hr': theme('colors.text-primary'),
            '--tw-prose-invert-quotes': theme('colors.text-primary'),
            '--tw-prose-invert-quote-borders': theme('colors.text-primary'),
            '--tw-prose-invert-captions': theme('colors.text-primary'),
            '--tw-prose-invert-code': theme('colors.text-primary'),
            '--tw-prose-invert-pre-code': theme('colors.text-primary'),
            '--tw-prose-invert-pre-bg': 'rgb(0 0 0 / 50%)',
            '--tw-prose-invert-th-borders': theme('colors.text-primary'),
            '--tw-prose-invert-td-borders': theme('colors.text-primary'),
            // 增加正文行高
            p: {
              lineHeight: '1.8',
            },
            // 也可以为整个 .prose 设置基础行高
            lineHeight: '1.8',
          },
        },
      }),
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
