import { DifyAppStore, type IDifyAppItem } from '@dify-chat/core'

import { BaseRequest } from '@/services/base-request'

const API_BASE_URL = 'http://localhost:3000'

const request = new BaseRequest({ baseURL: API_BASE_URL })

/**
 * 应用列表 CRUD 的 RESTful 实现
 */
class DifyAppService extends DifyAppStore {
	public readonly = false as const

	getApps = async (): Promise<IDifyAppItem[]> => {
		const response = await request.get(`/apps`)
		return response
	}

	getApp = async (id: string): Promise<IDifyAppItem | undefined> => {
		try {
			const response = await request.get(`/apps/${id}`)
			return response
		} catch (error) {
			console.error('Failed to fetch app:', error)
			return undefined
		}
	}

	addApp = async (config: IDifyAppItem): Promise<void> => {
		return request.post(`/apps`, config as unknown as Record<string, unknown>)
	}

	updateApp = async (config: IDifyAppItem): Promise<void> => {
		return request.put(`/apps/${config.id}`, config as unknown as Record<string, unknown>)
	}

	deleteApp = async (id: string): Promise<void> => {
		await request.delete(`/apps/${id}`)
	}
}

export default DifyAppService
