'use server'

import { existsSync, readFileSync, writeFileSync } from 'fs'
import path from 'path'

import { IDifyAppItem } from '@/types'

const APPS_JSON_PATH = path.resolve(process.cwd(), '.dify-chat', 'apps.json')

/**
 * 更新 App 列表数据（仅内部使用）
 */
const updateStorageFile = (apps: IDifyAppItem[]) => {
	return writeFileSync(APPS_JSON_PATH, JSON.stringify(apps, null, 2))
}

/**
 * 获取应用列表数据
 */
export const getAppList = async (): Promise<IDifyAppItem[]> => {
	// 判断 APPS_JSON_PATH 路径是否存在，如果不存在则创建
	if (!existsSync(APPS_JSON_PATH)) {
		writeFileSync(APPS_JSON_PATH, JSON.stringify([], null, 2))
		return []
	}
	try {
		const data = await readFileSync(APPS_JSON_PATH, 'utf8')
		return JSON.parse(data)
	} catch (error) {
		console.error('Error reading or parsing JSON file:', error)
		// 如果文件不存在或读取失败，返回空数组
		return []
	}
}

/**
 * 根据 ID 获取应用详情
 */
export const getAppItem = async (id: string) => {
	const response = await getAppList()
	return response?.find(item => item.id === id)
}

/**
 * 新增应用配置
 */
export const addApp = async (app: Omit<IDifyAppItem, 'id'>) => {
	const apps = await getAppList()
	const newApps = [
		...apps,
		{
			...app,
			id: Date.now().toString(),
		},
	]
	return updateStorageFile(newApps)
}

/**
 * 更新应用
 */
export const updateApp = async (app: IDifyAppItem) => {
	const apps = await getAppList()
	const newApps = apps.map(item => {
		if (item.id === app.id) {
			return app
		}
		return item
	})
	return updateStorageFile(newApps)
}

/**
 * 删除应用
 */
export const deleteApp = async (id: string) => {
	const apps = await getAppList()
	const newApps = apps.filter(item => item.id !== id)
	const result = await updateStorageFile(newApps)
	return result
}
