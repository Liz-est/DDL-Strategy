import type { Config } from 'tailwindcss'

import { colors } from './src/theme/config'

const minWidth = {
	/**
	 * 聊天卡片最小宽度
	 */
	'chat-card': '28rem',
}

const content = ['./src/**/*.{html,js,ts,jsx,tsx}']

// 如果是开发环境，则添加 packages/components 目录
if (process.env.NODE_ENV === 'development') {
	content.push('./packages/components/src/**/*.{html,js,ts,jsx,tsx}')
}

const config: Config = {
	content,
	theme: {
		extend: {
			colors,
			minWidth,
		},
	},
	plugins: [],
}

export default config
