"use server";

import { getConfigs } from "@/config";

/**
 * 获取运行模式
 */
export const getRunningModeAction = async () => {
	return getConfigs().runningMode;
};
