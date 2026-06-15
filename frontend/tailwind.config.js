/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        kodi: {
          navy: 'rgb(var(--kodi-navy-rgb) / <alpha-value>)',
          dark: 'rgb(var(--kodi-dark-rgb) / <alpha-value>)',
          card: 'rgb(var(--kodi-card-rgb) / <alpha-value>)',
          border: 'rgb(var(--kodi-border-rgb) / <alpha-value>)',
          accent: 'rgb(var(--kodi-accent-rgb) / <alpha-value>)',
          'accent-light': 'rgb(var(--kodi-accent-light-rgb) / <alpha-value>)',
          cyan: 'rgb(var(--kodi-cyan-rgb) / <alpha-value>)',
          emerald: 'rgb(var(--kodi-emerald-rgb) / <alpha-value>)',
          amber: 'rgb(var(--kodi-amber-rgb) / <alpha-value>)',
          rose: 'rgb(var(--kodi-rose-rgb) / <alpha-value>)',
          purple: 'rgb(var(--kodi-purple-rgb) / <alpha-value>)',
          slate: 'rgb(var(--kodi-slate-rgb) / <alpha-value>)',
          'text-primary': 'rgb(var(--kodi-text-primary-rgb) / <alpha-value>)',
          'text-secondary': 'rgb(var(--kodi-text-secondary-rgb) / <alpha-value>)',
          'text-muted': 'rgb(var(--kodi-text-muted-rgb) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', '-apple-system', 'sans-serif'],
        display: ['Space Grotesk', 'Plus Jakarta Sans', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        shimmer: 'shimmer 2s linear infinite',
        float: 'float 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(5, 150, 105, 0.3)' },
          '50%': { boxShadow: '0 0 20px rgba(5, 150, 105, 0.6)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-gradient': 'linear-gradient(135deg, #14213D 0%, #1D4ED8 58%, #10B981 100%)',
      },
    },
  },
  plugins: [],
};
