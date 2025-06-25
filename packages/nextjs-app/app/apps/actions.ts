"use server";
import { IDifyAppItem } from "@/types";
import {
	addApp,
	updateApp as updateAppItem,
	deleteApp as deleteAppItem,
	getAppList as getAppListFromRepository,
} from "@/lib/repository";

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
