import { getAppItem } from "@/app/api-utils";

import { BaseRequest } from "@dify-chat/helpers";

export interface IDifyAppRequestConfig {
	/**
	 * 请求地址
	 */
	apiBase: string;
	/**
	 * Dify APP API 密钥
	 */
	apiKey: string;
}

/**
 * 根据请求配置生成 Dify 请求函数
 */
export const genDifyRequestByRequestConfig = async (
	requestConfig: IDifyAppRequestConfig,
) => {
	if (!requestConfig.apiKey) {
		throw new Error("apiKey is required");
	}
	const { apiBase, apiKey } = requestConfig;
	const request = new BaseRequest({
		baseURL: apiBase,
		headers: {
			Authorization: `Bearer ${apiKey}`,
		},
	});
	return request;
};

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
