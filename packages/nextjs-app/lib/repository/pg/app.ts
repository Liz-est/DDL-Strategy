import prisma from "@/lib/prisma";
import { AppModeEnums, IDifyAppItem } from "@/types";

interface IDifyAppItem4DB {
	id: string;
	name: string;
	description: string;
	mode: string;
	tags: string;
	api_base: string;
	api_key: string;
	answer_form_enabled: boolean;
	answer_form_feedback_text: string;
	update_inputs_after_started: boolean;
	opening_statement_mode: string;
}

export const db2Data = (item: IDifyAppItem4DB) => {
	return {
		id: item.id,
		info: {
			name: item.name,
			description: item.description,
			mode: item.mode,
			tags: item.tags?.split(",") || [],
		},
		requestConfig: {
			apiBase: item.api_base,
			apiKey: item.api_key,
		},
		answerForm: {
			enabled: item.answer_form_enabled,
			feedbackText: item.answer_form_feedback_text,
		},
		inputParams: {
			enableUpdateAfterCvstStarts: item.update_inputs_after_started,
		},
		extConfig: {
			conversation: {
				openingStatement: {
					displayMode: item.opening_statement_mode,
				},
			},
		},
	} as IDifyAppItem;
};

const data2db = (item: Omit<IDifyAppItem, "id"> & { id?: string }) => {
	return {
		id: item.id,
		name: item.info.name || "",
		description: item.info.description || "",
		mode: item.info.mode || AppModeEnums.CHATBOT,
		tags: item.info.tags?.join(",") || "",
		api_base: item.requestConfig.apiBase || "",
		api_key: item.requestConfig.apiKey || "",
		answer_form_enabled: item.answerForm?.enabled || false,
		answer_form_feedback_text: item.answerForm?.feedbackText || "",
		update_inputs_after_started:
			item.inputParams?.enableUpdateAfterCvstStarts || false,
		opening_statement_mode:
			item.extConfig?.conversation?.openingStatement?.displayMode || "default",
	} as IDifyAppItem4DB;
};

/**
 * 获取应用列表数据
 */
export const getAppList = async (): Promise<IDifyAppItem[]> => {
	try {
		const data = await prisma.app.findMany();
		return data.map((item) => {
			return db2Data(item) as IDifyAppItem;
		});
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
	const response = await prisma.app.findFirst({
		where: {
			id,
		},
	});
	if (!response) {
		return null;
	}
	return db2Data(response);
};

export const addApp = async (app: Omit<IDifyAppItem, "id">) => {
	const result = await prisma.app.create({
		data: data2db(app),
	});
	return result;
};

export const updateApp = async (app: IDifyAppItem) => {
	const result = await prisma.app.update({
		where: {
			id: app.id,
		},
		data: data2db(app),
	});
	return result;
};

export const deleteApp = async (id: string) => {
	const result = await prisma.app.delete({
		where: {
			id,
		},
	});
	return result;
};
