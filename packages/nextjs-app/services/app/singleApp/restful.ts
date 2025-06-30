import { type IDifyAppItem } from "@dify-chat/core";

import { BaseRequest } from "@dify-chat/helpers";

const API_BASE_URL = "http://localhost:3000";

const request = new BaseRequest({ baseURL: API_BASE_URL });

/**
 * 单应用配置 get/set 的 restful 实现
 */
class DifyAppConfig {
	async getConfig(): Promise<IDifyAppItem | undefined> {
		const appConfig = await request.get("/api/app");
		return appConfig;
	}

	async setConfig(config: IDifyAppItem): Promise<void> {
		const result = await request.post(
			"/api/app",
			config as unknown as Record<string, unknown>,
		);
		return result;
	}
}

export const appConfig = new DifyAppConfig();
