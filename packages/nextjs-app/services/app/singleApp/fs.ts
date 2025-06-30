import path from "path";
import { IDifyAppItem } from "@/types";
import { existsSync, readFileSync, writeFileSync } from "fs";

const APPS_JSON_PATH = path.resolve(
	process.cwd(),
	".dify-chat",
	"storage",
	"app.config.json",
);

/**
 * 单应用配置 get/set 的文件存储实现
 */
class DifyAppConfig {
	async getConfig(): Promise<IDifyAppItem | undefined> {
		// 判断 APPS_JSON_PATH 路径是否存在，如果不存在则创建
		if (!existsSync(APPS_JSON_PATH)) {
			writeFileSync(APPS_JSON_PATH, JSON.stringify({}, null, 2));
			return undefined;
		}
		try {
			const data = await readFileSync(APPS_JSON_PATH, "utf8");
			return JSON.parse(data);
		} catch (error) {
			console.error("Error reading or parsing JSON file:", error);
			// 如果文件不存在或读取失败，返回空数组
			return undefined;
		}
	}

	async setConfig(config: IDifyAppItem): Promise<void> {
		writeFileSync(
			APPS_JSON_PATH,
			JSON.stringify(
				{
					...config,
					id: Date.now().toString(),
				},
				null,
				2,
			),
		);
	}
}

export const appConfig = new DifyAppConfig();
