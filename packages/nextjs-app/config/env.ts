import { IRunningMode } from '@/types'

/**
 * 所有的配置项
 */
export interface IConfig {
	/**
	 * Session 密钥
	 */
	SESSION_SECRET: string
	/**
	 * 应用模式
	 */
	RUNNING_MODE: IRunningMode
	/**
	 * 单应用模式下正在运行的应用 ID
	 */
	RUNNING_SINGLE_APP_ID: string
}

export const getConfigs = (): IConfig => {
	const SESSION_SECRET = process.env.SESSION_SECRET || ''
	const config: IConfig = {
		SESSION_SECRET,
		RUNNING_MODE: (process.env.RUNNING_MODE as IRunningMode) || 'multiApp',
		RUNNING_SINGLE_APP_ID: process.env.RUNNING_SINGLE_APP_ID || '',
	}
	const requiredKeys = ['SESSION_SECRET', 'RUNNING_MODE']
	requiredKeys.forEach(key => {
		// 判断每个值都不能为空，否则报错并提示缺失的 key
		if (!config[key as keyof IConfig]) {
			throw new Error(`环境变量 ${key} 不能为空`)
		}
	})
	return config as IConfig
}

/**
 * 获取配置项
 * @param key 配置项 key
 * @returns 配置项值
 */
export const getConfigByKey = <T extends keyof IConfig>(key: T): IConfig[T] => {
	const config = getConfigs()
	return config[key]
}
