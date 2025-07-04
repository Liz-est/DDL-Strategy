import { IDifyAppParameters, IDifyAppSiteSetting } from '@dify-chat/core'

import { IDifyAppItem4View } from '@/types'

/**
 * 当前应用数据
 */
export interface ICurrentApp {
	/**
	 * 应用配置
	 */
	config: IDifyAppItem4View
	/**
	 * 应用参数
	 */
	parameters: IDifyAppParameters
	/**
	 * 应用 WebApp 设置, 需要 Dify >= 1.4.0
	 */
	site?: IDifyAppSiteSetting
}
