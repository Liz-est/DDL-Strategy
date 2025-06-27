import { NextRequest, NextResponse } from "next/server";
import { deleteApp, getAppItem, updateApp } from "@/services/app";
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
	try {
		await updateApp({
			...newAppItem,
			id: appId,
		});
		return NextResponse.json({
			code: 0,
			data: null,
			message: "success",
		});
	} catch (error) {
		return NextResponse.json({
			code: 1,
			data: null,
			message: `更新应用出错：${error}`,
		});
	}
}

/**
 * 删除应用
 */
export async function DELETE(
	_request: NextRequest,
	{ params }: { params: Promise<{ appId: string }> },
) {
	const { appId } = await params;
	await deleteApp(appId);
	return NextResponse.json({
		code: 0,
		data: null,
		message: "success",
	});
}
