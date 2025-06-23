"use server";
import { SystemConfigKeys } from "@/constants";
import { getConfigByKey, setConfigByKey } from "@/lib/repository";
import { IDifyChatMode } from "@dify-chat/core";

export const getRunningModeAction = async (): Promise<IDifyChatMode> => {
	const result = await getConfigByKey(SystemConfigKeys.RunningMode);
	if (result) {
		return result.value as IDifyChatMode;
	}
	// 默认多应用模式
	return "multiApp";
};

export const setRunningModeAction = async (value: string) => {
	await setConfigByKey(SystemConfigKeys.RunningMode, value);
};
