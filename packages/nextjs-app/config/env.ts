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
	return {
		runningMode: process.env.RUNNING_MODE,
		secretKey: process.env.SESSION_SECRET,
	} as IConfig;
};
