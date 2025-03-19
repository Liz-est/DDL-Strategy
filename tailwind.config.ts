import type { Config } from 'tailwindcss'
import { colors } from './src/theme/config'

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
