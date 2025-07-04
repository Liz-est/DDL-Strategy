/**
 * 系统配置的 Keys
 */
export const SystemConfigKeys = {
	/**
	 * 运行模式
	 */
	RunningMode: 'RUNNING_MODE',
	/**
	 * 单应用模式下正在运行的应用 ID
	 */
	RunningSingleAppId: 'RUNNING_SINGLE_APP_ID',
} as const

/**
 * 运行模式
 */
export const RunningModes = {
	/**
	 * 单应用
	 */
	SingleApp: 'singleApp',
	/**
	 * 多应用
	 */
	MultiApp: 'multiApp',
} as const
