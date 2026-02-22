/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Open Sans', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      colors: {
        brand: {
          50: '#eafbeb',
          100: '#d1f6d3',
          200: '#a3eda8',
          300: '#66cb6a',
          400: '#49bb50',
          500: '#40be46',
          600: '#36a13b',
          700: '#2d8832',
          800: '#246e28',
          900: '#1b5420',
          950: '#0d3210',
        },
        surface: {
          950: '#070e1a',
          900: '#0c1b32',
          800: '#122342',
          700: '#1c2a4a',
          600: '#303a4a',
        },
      },
      animation: {
        'gradient-shift': 'gradient-shift 8s ease infinite',
        'float': 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 3s ease-in-out infinite',
      },
      keyframes: {
        'gradient-shift': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.8' },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
