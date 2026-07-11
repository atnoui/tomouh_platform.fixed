import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Indigo — primary brand color (from the Tomouh wordmark + sidebar tokens)
        primary: {
          50: '#F1EEFF',
          100: '#E9E5FF',
          200: '#CFC5FF',
          300: '#AE9DF2',
          400: '#7A63C9',
          500: '#3F2F97',
          600: '#14027D',
          700: '#1B1464',
          800: '#120B47',
          900: '#0A0630',
        },
        // Orange — secondary / accent color (from the flame mark + CTA buttons)
        secondary: {
          50: '#FFF4EA',
          100: '#FFE3C7',
          200: '#FFC68A',
          300: '#FFA94D',
          400: '#F89B3D',
          500: '#F38933',
          600: '#F06C00',
          700: '#C95800',
          800: '#9C4500',
        },
        ink: {
          900: '#121C2A',
          700: '#262627',
          600: '#464555',
          400: '#6B7280',
          300: '#959BA5',
        },
        surface: {
          0: '#FFFFFF',
          50: '#F6F6F6',
          100: '#E6E6E6',
        },
        border: {
          DEFAULT: '#C7C4D8',
          soft: '#D9E3F6',
          blue: '#D0DBED',
        },
        status: {
          pending: '#D97706',
          'pending-bg': '#FEF3C7',
          review: '#2563EB',
          'review-bg': '#DBEAFE',
          verified: '#0891B2',
          'verified-bg': '#CFFAFE',
          approved: '#059669',
          'approved-bg': '#D1FAE5',
          rejected: '#DC2626',
          'rejected-bg': '#FEE2E2',
          shipped: '#7C3AED',
          'shipped-bg': '#EDE9FE',
          disbursed: '#15803D',
          'disbursed-bg': '#DCFCE7',
        },
      },
      fontFamily: {
        heading: ['var(--font-poppins)', 'var(--font-noto-kufi)', 'sans-serif'],
        body: ['var(--font-inter)', 'var(--font-ibm-arabic)', 'sans-serif'],
        arabic: ['var(--font-noto-kufi)', 'sans-serif'],
        'arabic-body': ['var(--font-ibm-arabic)', 'sans-serif'],
      },
      borderRadius: {
        pill: '9999px',
        card: '20px',
      },
      boxShadow: {
        soft: '0 2px 2px rgba(79, 70, 229, 0.08)',
        card: '0 3px 12.5px rgba(0, 0, 0, 0.15)',
        glow: '0 0 40px rgba(240, 108, 0, 0.55)',
      },
      keyframes: {
        'fade-scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.82)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'glow-pulse': {
          '0%, 100%': { opacity: '0.35', filter: 'drop-shadow(0 0 6px rgba(240,108,0,0.4))' },
          '50%': { opacity: '1', filter: 'drop-shadow(0 0 26px rgba(240,108,0,0.85))' },
        },
        'slide-up-out': {
          '0%': { transform: 'translateY(0%)' },
          '100%': { transform: 'translateY(-100%)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'fade-scale-in': 'fade-scale-in 0.9s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'glow-pulse': 'glow-pulse 1.8s ease-in-out infinite',
        shimmer: 'shimmer 2s linear infinite',
      },
    },
  },
  plugins: [],
};

export default config;
