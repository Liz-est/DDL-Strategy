"use server";

import { appConfig } from "@/services/app/singleApp";
import { IDifyAppItem } from "@/types";
import { maskApiKey4AppConfig } from "@/app/actions/utils";

export async function getAppConfig({
	isMask = false,
}: { isMask?: boolean } = {}) {
	const result = await appConfig.getConfig();
	if (isMask && result) {
		return await maskApiKey4AppConfig(result);
	}
	return result;
}

export async function setAppConfig(app: IDifyAppItem) {
	const result = await appConfig.setConfig(app);
	return result;
}
