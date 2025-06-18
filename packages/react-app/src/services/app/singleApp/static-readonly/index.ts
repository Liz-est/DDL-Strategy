import { IDifyAppItem } from '@dify-chat/core'

import { staticAppConfig } from './data'

export const getAppConfig = async (): Promise<IDifyAppItem> => {
	return Promise.resolve(staticAppConfig)
}

/**
 * 单应用配置 get/set 的 静态数据实现
 */
class DifyAppConfig {
	async getConfig(): Promise<IDifyAppItem | undefined> {
		return Promise.resolve(staticAppConfig)
	}

	async setConfig(): Promise<void> {
		return Promise.reject('当前模式为静态配置，不支持更新数据！')
	}
}

export const appConfig = new DifyAppConfig()
