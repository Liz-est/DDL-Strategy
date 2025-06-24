import { app as appTable } from "@/drizzle/schema";
import { db } from "@/lib/drizzle";
import { AppModeEnums, IDifyAppItem } from "@/types";
import { eq } from "drizzle-orm";

interface IDifyAppItem4DB {
	id: string;
	name: string;
	description: string;
	mode: string;
	tags: string;
	apiBase: string;
	apiKey: string;
	answerFormEnabled: boolean;
	answerFormFeedbackText: string;
	updateInputsAfterStarted: boolean;
	openingStatementMode: string;
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
			apiBase: item.apiBase,
			apiKey: item.apiKey,
		},
		answerForm: {
			enabled: item.answerFormEnabled,
			feedbackText: item.answerFormFeedbackText,
		},
		inputParams: {
			enableUpdateAfterCvstStarts: item.updateInputsAfterStarted,
		},
		extConfig: {
			conversation: {
				openingStatement: {
					displayMode: item.openingStatementMode,
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
		apiBase: item.requestConfig.apiBase || "",
		apiKey: item.requestConfig.apiKey || "",
		answerFormEnabled: item.answerForm?.enabled || false,
		answerFormFeedbackText: item.answerForm?.feedbackText || "",
		updateInputsAfterStarted:
			item.inputParams?.enableUpdateAfterCvstStarts || false,
		openingStatementMode:
			item.extConfig?.conversation?.openingStatement?.displayMode || "default",
	} as IDifyAppItem4DB;
};

/**
 * 获取应用列表数据
 */
export const getAppList = async (): Promise<IDifyAppItem[]> => {
	try {
		const data = await db.select().from(appTable);
		return data.map((item) => {
			return db2Data(item);
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
	const response = await db.select().from(appTable).where(eq(appTable.id, id));
	if (!response?.length) {
		return null;
	}
	return db2Data(response[0]);
};

export const addApp = async (app: Omit<IDifyAppItem, "id">) => {
	// const result = await prisma.app.create({
	// 	data: data2db(app),
	// });
	await db.insert(appTable).values(data2db(app));
	return {};
};

export const updateApp = async (app: IDifyAppItem) => {
	// const result = await prisma.app.update({
	// 	where: {
	// 		id: app.id,
	// 	},
	// 	data: data2db(app),
	// });
	await db.update(appTable).set(data2db(app)).where(eq(appTable.id, app.id));
	return {};
};

export const deleteApp = async (id: string) => {
	// const result = await prisma.app.delete({
	// 	where: {
	// 		id,
	// 	},
	// });
	await db.delete(appTable).where(eq(appTable.id, id));
	return {};
};
