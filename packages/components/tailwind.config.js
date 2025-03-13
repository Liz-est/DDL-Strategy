/** @type {import('tailwindcss').Config.theme.extend.colors} */
const colors = {
  default: '#333',
	desc: '#9CA3B3',
  eb: '#ebebeb',
  warning: '#FF5A07',
	primary: '#4C84FF'
}

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{html,js,ts,jsx,tsx}',
    './stories/*.{html,js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors
    },
  },
  plugins: [],
};