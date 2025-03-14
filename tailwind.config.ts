import type { Config } from 'tailwindcss'

const colors = {
  default: '#333',
	desc: '#9CA3B3',
  eb: '#ebebeb',
  warning: '#FF5A07',
	primary: '#4C84FF'
}

const minWidth = {
  /**
   * 聊天卡片最小宽度
   */
  'chat-card': '28rem',
}

const config: Config = {
  content: ['./src/**/*.{html,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors,
      minWidth,
    },
  },
  plugins: [],
}

export default config
