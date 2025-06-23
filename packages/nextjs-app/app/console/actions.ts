"use server";
import { IDifyAppItem } from "@/types";
import {
	addApp,
	updateApp as updateAppItem,
	deleteApp as deleteAppItem,
	getAppList as getAppListFromRepository,
	getConfigByKey,
	setConfigByKey,
} from "@/lib/repository";
import { SystemConfigKeys } from "@/constants";

export async function getAppList() {
	const res = await getAppListFromRepository();
	return res;
}

/**
 * 删除应用
 */
export async function deleteApp(id: string) {
	return deleteAppItem(id);
}

export async function createApp(appItem: Omit<IDifyAppItem, "id">) {
	const res = await addApp(appItem);
	return res;
}

export async function updateApp(appItem: IDifyAppItem) {
	const res = await updateAppItem(appItem);
	return res;
}

/**
 * 获取当前运行的应用ID（用于单应用模式）
 */
export const getRunningAppIdAction = async () => {
	const runningAppId = await getConfigByKey(
		SystemConfigKeys.RunningSingleAppId,
	);
	if (runningAppId) {
		return runningAppId.value;
	}
};

/**
 * 设置当前运行的应用 ID
 */
export const setRunningAppIdAction = async (id: string) => {
	return setConfigByKey(SystemConfigKeys.RunningSingleAppId, id);
};
