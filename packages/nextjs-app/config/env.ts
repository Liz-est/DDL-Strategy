/**
 * 所有的配置项
 */
export interface IConfig {
	/**
	 * Session 密钥
	 */
	secretKey: string;
}

export const getConfigs = (): IConfig => {
	const secretKey = process.env.SESSION_SECRET || "";
	const config: IConfig = {
		secretKey,
	};
	Object.keys(config).forEach((key) => {
		// 判断每个值都不能为空，否则报错并提示缺失的 key
		if (!config[key as keyof IConfig]) {
			throw new Error(`环境变量 ${key} 不能为空`);
		}
	});
	return config as IConfig;
};
