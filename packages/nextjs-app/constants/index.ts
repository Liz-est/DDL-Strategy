/**
 * 系统配置的 Keys
 */
export const SystemConfigKeys = {
	/**
	 * 运行模式
	 */
	RunningMode: "running_mode",
	/**
	 * 单应用模式下正在运行的应用 ID
	 */
	RunningSingleAppId: "running_single_app_id",
};

/**
 * 运行模式
 */
export const RunningModes = {
	/**
	 * 单应用
	 */
	SingleApp: "singleApp",
	/**
	 * 多应用
	 */
	MultiApp: "multiApp",
} as const;
