import { APPS_JSON_PATH } from "@/config/app";
import { IDifyAppItem } from "@dify-chat/core";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { NextResponse } from "next/server";

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
 * 获取应用列表
 */
export async function GET() {
	const result = await getAppList();
	return NextResponse.json(result);
}
