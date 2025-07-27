import { DifyAppStoreReadonly, type IDifyAppItem } from '@dify-chat/core'

import { APP_LIST_KEY } from '@/constants'

/**
 * 多应用模式-Client应用服务
 */
class DifyAppService extends DifyAppStoreReadonly {
	public readonly = true as const

	getApps = async (): Promise<IDifyAppItem[]> => {
		const appJson = localStorage.getItem(APP_LIST_KEY)
		return appJson ? JSON.parse(appJson) : []
	}

	getApp = async (id: string): Promise<IDifyAppItem | undefined> => {
		const apps = await this.getApps()
		return apps.find(config => config.id === id)
	}
}

export const appService = new DifyAppService()
