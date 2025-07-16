import { type IDifyAppItem } from '@dify-chat/core'

/**
 * 单应用模式-Client应用服务
 */
class DifyAppConfig {
	async getConfig(): Promise<IDifyAppItem | undefined> {
		const configInLocalStorage = localStorage.getItem('__DC_APP_CONFIG')
		if (!configInLocalStorage) {
			return undefined
		}
		return JSON.parse(configInLocalStorage!)
	}
}

export const appConfig = new DifyAppConfig()
