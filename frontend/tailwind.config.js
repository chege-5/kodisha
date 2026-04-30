/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          700: '#1d4ed8',
          900: '#1e3a5f',
        },
        kodi: {
          navy: '#1a365d',
          blue: '#2b6cb0',
          green: '#276749',
          amber: '#c05621',
          red: '#9b2c2c',
        },
      },
    },
  },
  plugins: [],
};
