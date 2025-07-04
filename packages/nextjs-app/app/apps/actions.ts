'use server'

import { maskApiKey4AppConfig } from '@/app/actions/utils'
import {
	addApp,
	deleteApp as deleteAppItem,
	getAppItem as getAppItemFromRepository,
	getAppList as getAppListFromRepository,
	updateApp as updateAppItem,
} from '@/services/app/multiApp'
import { IDifyAppItem } from '@/types'

export async function getAppList({ isMask = false }: { isMask?: boolean } = {}) {
	const res = await getAppListFromRepository()
	if (isMask) {
		const result = await Promise.all(
			res.map(item => {
				return maskApiKey4AppConfig(item)
			}),
		)
		return result
	}
	return res
}

export async function getAppItem(id: string, { isMask = false }: { isMask?: boolean } = {}) {
	const res = await getAppItemFromRepository(id)
	if (isMask && res) {
		return await maskApiKey4AppConfig(res)
	}
	return res
}

/**
 * 删除应用
 */
export async function deleteApp(id: string) {
	return deleteAppItem(id)
}

export async function createApp(appItem: Omit<IDifyAppItem, 'id'>) {
	const res = await addApp({
		...appItem,
		id: Date.now().toString(),
	})
	return res
}

export async function updateApp(appItem: IDifyAppItem) {
	try {
		const res = await updateAppItem(appItem)
		return res
	} catch (error) {
		console.error(error)
		return {
			success: false,
			message: '更新应用配置失败',
		}
	}
}
