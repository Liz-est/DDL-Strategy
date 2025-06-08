import { NextRequest, NextResponse } from "next/server";
import { getAppItem, getAppList, updateApps } from "@/app/api-utils";
import { IDifyAppItem } from "@dify-chat/core";

/**
 * 获取应用详情
 */
export async function GET(
	_request: NextRequest,
	{ params }: { params: Promise<{ appId: string }> },
) {
	const { appId } = await params;
	const app = await getAppItem(appId);
	if (!app) {
		return NextResponse.json({
			error: `找不到应用: ${appId}`,
		});
	}
	return NextResponse.json(app);
}

/**
 * 更新应用
 */
export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ appId: string }> },
) {
	const { appId } = await params;
	const newAppItem = (await request.json()) as Omit<IDifyAppItem, "id">;

	const apps = await getAppList();
	const index = apps.findIndex((item) => item.id === appId);
	if (index < -1) {
		return NextResponse.json({
			code: 1,
			data: null,
			message: "应用不存在",
		});
	}
	apps[index] = {
		id: appId,
		...newAppItem,
	};
	await updateApps(apps);
	return NextResponse.json({
		code: 0,
		data: null,
		message: "success",
	});
}

/**
 * 删除应用
 */
export async function DELETE(
	_request: NextRequest,
	{ params }: { params: Promise<{ appId: string }> },
) {
	const { appId } = await params;
	const apps = await getAppList();
	const newApps = apps.filter((item) => item.id !== appId);
	await updateApps(newApps);
	return NextResponse.json({
		code: 0,
		data: null,
		message: "success",
	});
}
