import { DifyAppStore, type IDifyAppItem } from '@dify-chat/core'

import { APP_LIST_KEY } from '@/constants'

/**
 * 多应用模式-Admin应用服务
 */
class DifyAppService extends DifyAppStore {
	public readonly = false as const

	getApps = async (): Promise<IDifyAppItem[]> => {
		const appJson = localStorage.getItem(APP_LIST_KEY)
		return appJson ? JSON.parse(appJson) : []
	}

	getApp = async (id: string): Promise<IDifyAppItem | undefined> => {
		const apps = await this.getApps()
		return apps.find(config => config.id === id)
	}

	addApp = async (config: IDifyAppItem): Promise<void> => {
		const apps = await this.getApps()
		apps.push(config)
		localStorage.setItem(APP_LIST_KEY, JSON.stringify(apps))
	}

	updateApp = async (config: IDifyAppItem): Promise<void> => {
		const apps = await this.getApps()
		const index = apps.findIndex(c => c.id === config.id)
		if (index !== -1) {
			apps[index] = config
			localStorage.setItem(APP_LIST_KEY, JSON.stringify(apps))
		}
	}

	deleteApp = async (id: string): Promise<void> => {
		const apps = await this.getApps()
		const newApps = apps.filter(config => config.id !== id)
		localStorage.setItem(APP_LIST_KEY, JSON.stringify(newApps))
	}
}

export const appService = new DifyAppService()
