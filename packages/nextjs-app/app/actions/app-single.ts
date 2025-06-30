"use server";

import { appConfig } from "@/services/app/singleApp";
import { IDifyAppItem } from "@/types";

export async function getAppConfig() {
	const result = await appConfig.getConfig();
	return result;
}

export async function setAppConfig(app: IDifyAppItem) {
	const result = await appConfig.setConfig(app);
	return result;
}
