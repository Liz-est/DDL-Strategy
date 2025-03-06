/** @type {import('tailwindcss').Config.theme.extend.colors} */
const colors = {
  default: '#333',
	desc: '#9CA3B3',
  eb: '#ebebeb',
  warning: '#FF5A07',
	primary: '#4C84FF'
}

/** @type {import('tailwindcss').Config.theme.extend.minWidth} */
const minWidth = {
  /**
   * 聊天卡片最小宽度
   */
  'chat-card': '28rem',
}

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors,
      minWidth,
    },
  },
  plugins: [],
};
