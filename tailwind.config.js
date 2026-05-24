/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        saffron: '#d97706',
        leaf: '#16803c',
        ink: '#18181b',
        berry: '#be123c',
      },
      boxShadow: {
        soft: '0 16px 45px rgba(15, 23, 42, 0.10)',
      },
    },
  },
  plugins: [],
};
