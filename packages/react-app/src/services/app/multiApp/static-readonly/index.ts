import { DifyAppStoreReadonly, IDifyAppItem } from '@dify-chat/core'

import { staticAppList } from './data'

/**
 * 应用列表的静态配置实现
 */
class DifyAppService extends DifyAppStoreReadonly {
	public readonly = true as const

	getApps = async (): Promise<IDifyAppItem[]> => {
		return Promise.resolve(staticAppList)
	}

	getApp = async (id: string): Promise<IDifyAppItem | undefined> => {
		return Promise.resolve(staticAppList.find(config => config.id === id))
	}
}

export default DifyAppService
