import { getAppItem } from "@/app/api-utils";
import {
	genDifyRequestByRequestConfig,
	IDifyAppRequestConfig,
} from "@dify-chat/core";

/**
 * 生成 Dify 请求函数
 */
export const genDifyRequest = async (appId: string) => {
	const appItem = await getAppItem(appId);
	const request = genDifyRequestByRequestConfig(
		appItem?.requestConfig as IDifyAppRequestConfig,
	);
	return request;
};
