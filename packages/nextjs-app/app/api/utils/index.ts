import { getAppItem } from "@/lib/repository";

import { BaseRequest } from "@dify-chat/helpers";
import { NextRequest } from "next/server";

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

/**
 * 生成 FormData 代理
 * @param request NextRequest
 * @returns FormData
 */
export const genFormDataProxy = async (request: NextRequest) => {
	// 构建新的 formData 以便转发到第三方
	const proxyFormData = new FormData();
	const formData = await request.formData();
	for (const [key, value] of formData.entries()) {
		// node 环境没有 File 构造函数，判断 value 是否为文件对象
		if (
			typeof value === "object" &&
			value !== null &&
			typeof value.arrayBuffer === "function" &&
			"name" in value // 一般文件对象有 name 属性
		) {
			proxyFormData.append(key, value, value.name);
		} else {
			proxyFormData.append(key, value as string);
		}
	}
	return proxyFormData;
};

/**
 * 生成原始响应的代理
 * @param response fetch 的原始 response
 */
export const genDifyResponseProxy = (response: Response) => {
	return new Response(response.body, {
		status: response.status,
		headers: {
			// 允许流式响应
			"Content-Type":
				response.headers.get("Content-Type") || "application/json",
			// 允许 CORS 或其他你需要的 header
			"X-Version": response.headers.get("X-Version") || "",
			// 允许获取 Dify 版本
			"Access-Control-Allow-Headers": "X-Version, Authorization, Content-Type",
		},
	});
};
