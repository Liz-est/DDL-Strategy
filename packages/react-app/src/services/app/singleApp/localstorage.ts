import { type IDifyAppItem } from '@dify-chat/core'

/**
 * 单应用配置 get/set 的 localStorage 实现
 */
class DifyAppConfig {
	async getConfig(): Promise<IDifyAppItem | undefined> {
		const configInLocalStorage = localStorage.getItem('__DC_APP_CONFIG')
		if (!configInLocalStorage) {
			return undefined
		}
		return JSON.parse(configInLocalStorage!)
	}

	async setConfig(config: IDifyAppItem): Promise<void> {
		localStorage.setItem('__DC_APP_CONFIG', JSON.stringify(config))
	}
}

export const appConfig = new DifyAppConfig()
