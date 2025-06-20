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
        'background': 'var(--background-color)',
        'card': 'var(--card-bg)',
        'main-content': 'var(--main-content-bg)',
        'footer': 'var(--footer-bg)',
        'text-primary': 'var(--text-color)',
        'link': 'var(--link-color)',
        'accent': 'var(--accent-color)',
        'border-primary': 'var(--border-color)',
        // Re-add gray colors needed by the typography plugin
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
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
            '--tw-prose-hr': theme('colors.border-primary'),
            '--tw-prose-quotes': theme('colors.text-primary'),
            '--tw-prose-quote-borders': theme('colors.border-primary'),
            '--tw-prose-captions': theme('colors.text-primary'),
            '--tw-prose-code': theme('colors.text-primary'),
            '--tw-prose-pre-code': theme('colors.text-primary'),
            '--tw-prose-th-borders': theme('colors.border-primary'),
            '--tw-prose-td-borders': theme('colors.border-primary'),
            '--tw-prose-invert-body': theme('colors.text-primary'),
            '--tw-prose-invert-headings': theme('colors.text-primary'),
            '--tw-prose-invert-lead': theme('colors.text-primary'),
            '--tw-prose-invert-links': theme('colors.link'),
            '--tw-prose-invert-bold': theme('colors.text-primary'),
            '--tw-prose-invert-counters': theme('colors.text-primary'),
            '--tw-prose-invert-bullets': theme('colors.text-primary'),
            '--tw-prose-invert-hr': theme('colors.border-primary'),
            '--tw-prose-invert-quotes': theme('colors.text-primary'),
            '--tw-prose-invert-quote-borders': theme('colors.border-primary'),
            '--tw-prose-invert-captions': theme('colors.text-primary'),
            '--tw-prose-invert-code': theme('colors.text-primary'),
            '--tw-prose-invert-pre-code': theme('colors.text-primary'),
            '--tw-prose-invert-th-borders': theme('colors.border-primary'),
            '--tw-prose-invert-td-borders': theme('colors.border-primary'),
            // 设置更秀气的字体大小和行高
            fontSize: '15px',
            fontWeight: '400',
            lineHeight: '1.8',
            p: {
              textAlign: 'justify',
              marginTop: '1.25em',
              marginBottom: '1.25em',
            },
            'h1, h2, h3, h4, h5, h6': {
              textAlign: 'left',
              fontFamily: 'serif', // 标题使用衬线字体
            },
            h1: {
              fontSize: '1.8rem',
              lineHeight: '1.2',
            },
            h2: {
              fontSize: '1.5rem',
              lineHeight: '1.25',
            },
            h3: {
              fontSize: '1.25rem',
              lineHeight: '1.3',
            },
            h4: {
              fontSize: '1.1rem',
              lineHeight: '1.35',
            },
            // Table Styles
            table: {
              minWidth: '100%',
              borderCollapse: 'collapse',
              marginTop: '1.6em',
              marginBottom: '1.6em',
              borderWidth: '1px',
              borderColor: theme('colors.gray.200'),
            },
            'th, td': {
              borderWidth: '1px',
              borderColor: theme('colors.gray.200'),
            },
            thead: {
              color: theme('colors.gray.500'),
              fontWeight: '600',
              backgroundColor: theme('colors.gray.50'),
              borderBottomWidth: '1px',
              borderColor: theme('colors.gray.200'),
            },
            'thead th': {
              padding: '12px 24px',
              textAlign: 'left',
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              borderWidth: '1px',
              borderColor: theme('colors.gray.200'),
            },
            'tbody tr:nth-child(even)': {
              backgroundColor: theme('colors.gray.50'),
            },
            'tbody tr': {
              borderBottomWidth: '1px',
              borderColor: theme('colors.gray.200'),
            },
            'tbody td': {
              padding: '16px 24px',
              verticalAlign: 'top',
              whiteSpace: 'nowrap',
              borderWidth: '1px',
              borderColor: theme('colors.gray.200'),
            },
          },
        },
        dark: {
          css: {
            thead: {
              color: theme('colors.gray.300'),
              backgroundColor: theme('colors.gray.800'),
              borderColor: theme('colors.gray.700'),
            },
            'tbody tr:nth-child(even)': {
              backgroundColor: theme('colors.gray.800'),
            },
            'tbody tr': {
              borderColor: theme('colors.gray.700'),
            },
          },
        },
      }),
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
