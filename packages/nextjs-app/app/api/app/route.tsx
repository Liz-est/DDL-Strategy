import { updateApps } from "@/app/api-utils";
import { getAppList } from "@/repository/app";
import { NextRequest, NextResponse } from "next/server";

/**
 * 创建应用
 */
export async function POST(request: NextRequest) {
	// 获取 body
	const body = await request.json();
	const apps = await getAppList();
	const newApps = [
		...apps,
		{
			...body,
			id: Date.now().toString(),
		},
	];
	updateApps(newApps);
	return NextResponse.json(newApps);
}
