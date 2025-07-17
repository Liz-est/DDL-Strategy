import { IDifyAppItem } from '@dify-chat/core'
import { uniqueId } from 'lodash-es'

// 支持多种存储方式
interface IAppStorageAdapter {
	getApps(): Promise<IDifyAppItem[]>
	getApp(id: string): Promise<IDifyAppItem>
}

// 固定的应用列表
const appList = [
	{
		id: uniqueId(),
		info: {
			name: 'Chatflow Test App',
			description: 'Chatflow 功能测试应用',
			tags: ['测试', 'Chatflow'],
		},
		requestConfig: {
			apiBase: 'https://api.dify.ai/v1',
			apiKey: 'app-xxx',
		},
	} as IDifyAppItem,
]

class StaticDataAdapter implements IAppStorageAdapter {
	async getApps(): Promise<IDifyAppItem[]> {
		return Promise.resolve(appList)
	}

	async getApp(id: string): Promise<IDifyAppItem> {
		const appList = await this.getApps()
		return Promise.resolve(appList.find(item => item.id === id) as IDifyAppItem)
	}
}

const appService = new StaticDataAdapter()

export default appService
