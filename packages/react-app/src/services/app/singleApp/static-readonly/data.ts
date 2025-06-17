import { AppModeEnums } from '@dify-chat/core'

/**
 * 静态的应用配置，用于演示
 * 注意：**尽量不要在公开的生产环境中使用静态数据**，推荐使用后端服务
 */
export const staticAppConfig = {
	id: '0.270357011315995',
	info: {
		name: 'My Chatflow APP',
		description: '我的 Chatflow 应用',
		tags: [],
		mode: AppModeEnums.CHATFLOW,
	},
	requestConfig: {
		apiBase: 'https://api.dify.ai/v1',
		apiKey: 'app-xxxxxxx',
	},
}
