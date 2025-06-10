import { APPS_JSON_PATH } from "@/config";
import { existsSync, readFileSync, writeFileSync } from "fs";

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
 * 应用类型
 */
export enum AppModeEnums {
	/**
	 * 文本生成
	 */
	TEXT_GENERATOR = "completion",
	/**
	 * 聊天助手
	 */
	CHATBOT = "chat",
	/**
	 * 工作流
	 */
	WORKFLOW = "workflow",
	/**
	 * 支持工作流编排的聊天助手
	 */
	CHATFLOW = "advanced-chat",
	/**
	 * 具备推理和自主调用能力的聊天助手
	 */
	AGENT = "agent-chat",
}

/**
 * 应用配置 Item
 */
export interface IDifyAppItem {
	/**
	 * 唯一标识
	 */
	id: string;
	/**
	 * Dify 应用基本信息
	 */
	info: {
		/**
		 * 应用名称
		 */
		name: string;
		/**
		 * 应用类型
		 */
		mode?: AppModeEnums;
		/**
		 * 应用描述
		 */
		description: string;
		/**
		 * 应用标签
		 */
		tags: string[];
	};
	/**
	 * 请求配置
	 */
	requestConfig: IDifyAppRequestConfig;
	/**
	 * 回复表单配置
	 */
	answerForm?: {
		/**
		 * 是否启用
		 */
		enabled: boolean;
		/**
		 * 反馈的占位文字
		 */
		feedbackText?: string;
	};
	/**
	 * 输入参数配置
	 */
	inputParams?: {
		/**
		 * 开始对话后，是否支持更新对话参数
		 */
		enableUpdateAfterCvstStarts: boolean;
	};
	/**
	 * 其他扩展配置
	 */
	extConfig?: {
		/**
		 * 对话相关配置
		 */
		conversation?: {
			/**
			 * 开场白配置
			 */
			openingStatement?: {
				/**
				 * 展示模式 default-默认（对话开始后不展示） always-固定展示
				 */
				displayMode?: "default" | "always";
			};
		};
	};
}

/**
 * 更新 App 列表数据
 */
export const updateApps = (apps: IDifyAppItem[]) => {
	return writeFileSync(APPS_JSON_PATH, JSON.stringify(apps, null, 2));
};

/**
 * 获取应用列表数据
 */
export const getAppList = async (): Promise<IDifyAppItem[]> => {
	// 判断 APPS_JSON_PATH 路径是否存在，如果不存在则创建
	if (!existsSync(APPS_JSON_PATH)) {
		writeFileSync(APPS_JSON_PATH, JSON.stringify([], null, 2));
		return [];
	}
	try {
		const data = await readFileSync(APPS_JSON_PATH, "utf8");
		return JSON.parse(data);
	} catch (error) {
		console.error("Error reading or parsing JSON file:", error);
		// 如果文件不存在或读取失败，返回空数组
		return [];
	}
};

/**
 * 根据 ID 获取应用详情
 */
export const getAppItem = async (id: string) => {
	const response = await getAppList();
	return response?.find((item) => item.id === id);
};
