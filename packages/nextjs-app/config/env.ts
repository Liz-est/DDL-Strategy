import { IRunningMode } from "@/types";

/**
 * 所有的配置项
 */
export interface IConfig {
	/**
	 * 运行模式
	 */
	runningMode: IRunningMode;
	/**
	 * Session 密钥
	 */
	secretKey: string;
}

export const getConfigs = (): IConfig => {
	const runningMode = process.env.RUNNING_MODE || "";
	const secretKey = process.env.SESSION_SECRET || "";
	const config: IConfig = {
		runningMode: runningMode as NonNullable<IRunningMode>,
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
