/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: '#f7f6f2',
          card: '#ffffff',
          dark: '#e9e8df',
          light: '#faf9f6',
        },
        ink: {
          DEFAULT: '#252824',
          light: '#41453f',
          muted: '#62665e',
        },
        muted: '#777a72',
        line: '#e5e3dc',
        green: {
          DEFAULT: '#344638',
          50: '#f4f6f4',
          100: '#e5eae4',
          200: '#cbdbcb',
          500: '#485f4d',
          600: '#344638',
          700: '#28362b',
        },
        clay: {
          DEFAULT: '#cf785b',
          hover: '#c06b4f',
          dark: '#a85338',
          light: '#fdf5f2',
        },
        // Keep primary & dark as aliases so existing components don't break
        primary: {
          50: '#fdf5f2',
          100: '#fae9e3',
          200: '#f5d3c7',
          300: '#ecb3a0',
          400: '#df8f74',
          500: '#cf785b',
          600: '#c06b4f',
          700: '#a85338',
          800: '#88432d',
          900: '#713a29',
        },
        dark: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#252824',
          900: '#1b1d1a',
          950: '#111210',
        },
      },
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        display: ['Manrope', 'sans-serif'],
        serif: ['Georgia', '"Times New Roman"', 'serif'],
      },
      letterSpacing: {
        tightest: '-0.05em',
        tighter: '-0.035em',
        tight: '-0.02em',
        widest: '0.18em',
      },
      boxShadow: {
        panel: '0 15px 40px rgba(37,40,36,.09)',
        card: '0 4px 16px rgba(37,40,36,.06)',
      },
    },
  },
  plugins: [],
};
