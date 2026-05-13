/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: 'rgb(59 130 246 / <alpha-value>)',
          dim: 'rgb(37 99 235 / <alpha-value>)',
        },
      },
    },
  },
  plugins: [require('@tailwindcss/typography')]
};